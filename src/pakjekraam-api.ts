import * as fs from 'fs';

import { numberSort } from './util';
import { isVast } from './domain-knowledge.js';

import { allocation, log } from './model/index';

import { IMarktondernemer, IMarktondernemerVoorkeur, IMarktondernemerVoorkeurRow, IToewijzing } from './markt.model';

import { Allocation } from './model/allocation.model';

import { MarktConfig } from './model/marktconfig';

import {
    getALijst,
    getMarkt,
    getAanmeldingenByMarktAndDate,
    getOndernemersByMarkt,
    getPlaatsvoorkeuren,
    getIndelingVoorkeuren,
    getVoorkeurenByMarkt,
    getAllocations,
    getMarktBasics,
} from './makkelijkemarkt-api';

import { ConceptQueue, ALLOCATION_MODE_SCHEDULED } from './concept-queue';
import { RedisClient } from './redis-client';

const conceptQueue = new ConceptQueue();
let allocationQueue = conceptQueue.getQueueForDispatcher();
const client = new RedisClient().getClient();

const loadJSON = <T>(path: string, defaultValue: T = null): Promise<T> =>
    new Promise((resolve, reject) => {
        console.log(`Load ${path}`);
        fs.readFile(path, (err, data) => {
            if (err) {
                console.log(err);
                resolve(defaultValue);
            } else {
                try {
                    resolve(JSON.parse(String(data)));
                } catch (e) {
                    console.log(e);
                    reject(e);
                }
            }
        });
    });

export const groupAllocationRows = (toewijzingen: IToewijzing[], row: Allocation): IToewijzing[] => {
    const { marktId, marktDate, erkenningsNummer } = row;

    const existing = toewijzingen.find(toewijzing => toewijzing.erkenningsNummer === erkenningsNummer);

    const voorkeur: IToewijzing = {
        marktId,
        marktDate,
        erkenningsNummer,
        plaatsen: [...(existing ? existing.plaatsen : []), row.plaatsId],
    };

    if (existing) {
        return [...toewijzingen.filter(toewijzing => toewijzing.erkenningsNummer !== erkenningsNummer), voorkeur];
    } else {
        return [...toewijzingen, voorkeur];
    }
};

export const getToewijzingen = (marktId: string, marktDate: string): Promise<IToewijzing[]> =>
    allocation
        .findAll<Allocation>({
            where: { marktId, marktDate },
            raw: true,
        })
        .then(toewijzingen => toewijzingen.reduce(groupAllocationRows, []));

const indelingVoorkeurPrio = (voorkeur: IMarktondernemerVoorkeur): number =>
    (voorkeur.marktId ? 1 : 0) | (voorkeur.marktDate ? 2 : 0);

export const indelingVoorkeurSort = (a: IMarktondernemerVoorkeur, b: IMarktondernemerVoorkeur) =>
    numberSort(indelingVoorkeurPrio(b), indelingVoorkeurPrio(a));

export const indelingVoorkeurMerge = (
    a: IMarktondernemerVoorkeurRow,
    b: IMarktondernemerVoorkeurRow,
): IMarktondernemerVoorkeurRow => {
    const merged = Object.assign({}, a);

    if (b.minimum !== null) {
        merged.minimum = b.minimum;
    }
    if (b.maximum !== null) {
        merged.maximum = b.maximum;
    }
    if (b.krachtStroom !== null) {
        merged.krachtStroom = b.krachtStroom;
    }
    if (b.kraaminrichting !== null) {
        merged.kraaminrichting = b.kraaminrichting;
    }
    if (b.anywhere !== null) {
        merged.anywhere = b.anywhere;
    }
    if (b.brancheId !== null) {
        merged.brancheId = b.brancheId;
    }
    if (b.parentBrancheId !== null) {
        merged.parentBrancheId = b.parentBrancheId;
    }
    if (b.inrichting !== null) {
        merged.inrichting = b.inrichting;
    }
    return merged;
};

export const convertVoorkeur = (obj: IMarktondernemerVoorkeurRow): IMarktondernemerVoorkeur => ({
    ...obj,
    branches: [obj.brancheId, obj.parentBrancheId].filter(Boolean),
    verkoopinrichting: obj.inrichting ? [obj.inrichting] : [],
});

const enrichOndernemersWithVoorkeuren = (ondernemers: IMarktondernemer[], voorkeuren: IMarktondernemerVoorkeur[]) => {
    return ondernemers.map(ondernemer => {
        let voorkeurVoorOndernemer = voorkeuren.find(
            voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer,
        );

        if (voorkeurVoorOndernemer === undefined) {
            voorkeurVoorOndernemer = <IMarktondernemerVoorkeur>{
                absentFrom: null,
                absentUntil: null,
            };
        }

        return {
            ...ondernemer,
            voorkeur: { ...ondernemer.voorkeur, ...voorkeurVoorOndernemer },
        };
    });
};

export const getMededelingen = (): Promise<any> => loadJSON('./config/markt/mededelingen.json', {});

export const getDaysClosed = (): Promise<any> => loadJSON('./config/markt/daysClosed.json', {});

export const getMarktDetails = (marktId: string, marktDate: string) => {
    console.log('get market details: ', marktId, marktDate);
    const marktBasics = getMarktBasics(marktId);

    // Populate the `ondernemer.voorkeur` field
    const ondernemersPromise = Promise.all([getOndernemersByMarkt(marktId), getVoorkeurenByMarkt(marktId)]).then(
        ([ondernemers, voorkeuren]) => {
            return enrichOndernemersWithVoorkeuren(ondernemers, voorkeuren);
        },
    );

    return Promise.all([
        marktBasics,
        ondernemersPromise,
        getAanmeldingenByMarktAndDate(marktId, marktDate),
        getPlaatsvoorkeuren(marktId),
    ]).then(([marktBasics, ondernemers, aanmeldingen, voorkeuren]) => {
        return {
            naam: '?',
            marktId,
            marktDate,
            ...marktBasics,
            aanmeldingen,
            voorkeuren,
            ondernemers,
            aanwezigheid: aanmeldingen,
        };
    });
};

export const getCalculationInput = (marktId: string, marktDate: string) => {
    return Promise.all([getMarktDetails(marktId, marktDate), getALijst(marktId, marktDate)]).then(
        ([marktDetails, aLijst]) => ({
            ...marktDetails,

            aLijst: aLijst.map(({ erkenningsnummer }) =>
                marktDetails.ondernemers.find(({ erkenningsNummer }) => erkenningsnummer === erkenningsNummer),
            ),
        }),
    );
};

export const getIndelingslijst = (marktId: string, marktDate: string) => {
    return Promise.all([getMarktDetails(marktId, marktDate), getAllocations(marktId, marktDate)]).then(
        ([marktDetails, tws]) => {
            let toewijzingen = tws['data'];
            return {
                ...marktDetails,
                toewijzingen,
            };
        },
    );
};

export const calculateIndelingslijst = async (marktId: string, date: string) => {
    try {
        let data = await getCalculationInput(marktId, date);
        data = JSON.parse(JSON.stringify(data));
        data["mode"] = ALLOCATION_MODE_SCHEDULED;
        const job = allocationQueue.createJob(data);
        const result = await job.save();
        return result.id;
    } catch (error) {
        console.log('job error: ', error);
        if (!client.connected) {
            console.log('REDIS: connection error: ', error);
            return;
        }
        allocationQueue = conceptQueue.getQueueForDispatcher();
    }
};

export const getToewijzingslijst = (marktId: string, marktDate: string) =>
    Promise.all([getCalculationInput(marktId, marktDate), getToewijzingen(marktId, marktDate)]).then(
        ([data, toewijzingen]) => ({
            ...data,
            toewijzingen,
            afwijzingen: [],
        }),
    );

export const getSollicitantenlijstInput = (marktId: string, date: string) =>
    Promise.all([
        getOndernemersByMarkt(marktId).then(ondernemers => ondernemers.filter(({ status }) => !isVast(status))),
        getAanmeldingenByMarktAndDate(marktId, date),
        getPlaatsvoorkeuren(marktId),
        getMarkt(marktId),
    ]).then(([ondernemers, aanmeldingen, voorkeuren, markt]) => ({
        ondernemers,
        aanmeldingen,
        voorkeuren,
        markt,
    }));

export const getVoorrangslijstInput = (marktId: string, marktDate: string) =>
    Promise.all([
        getOndernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, marktDate),
        getPlaatsvoorkeuren(marktId),
        getMarkt(marktId),
        getALijst(marktId, marktDate),
        getToewijzingen(marktId, marktDate),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, voorkeuren, markt, aLijst, toewijzingen, algemenevoorkeuren]) => ({
        ondernemers,
        aanmeldingen,
        voorkeuren,
        markt,
        aLijst,
        toewijzingen,
        algemenevoorkeuren,
    }));
