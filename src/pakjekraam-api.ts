import * as fs from 'fs';
import {
    ALLOCATION_MODE_SCHEDULED,
    ConceptQueue,
} from './concept-queue';
import {
    getAanmeldingenByMarktAndDate,
    getALijst,
    getAllocations,
    getBLijst,
    getIndelingVoorkeuren,
    getMarkt,
    getMarktBasics,
    getOndernemersByMarkt,
    getPlaatsvoorkeuren,
    getToewijzingen,
    getAfwijzingen,
    getVoorkeurenByMarkt,
    getOndernemer,
} from './makkelijkemarkt-api';
import {
    IMarktondernemer,
    IMarktondernemerVoorkeur,
    IMarktondernemerVoorkeurRow,
    IAfwijzing,
} from './model/markt.model';
import {
    isVast,
} from './domain-knowledge';
import { RedisClient } from './redis-client';
import { getAfwijzingReason } from './model/afwijzing.functions';
import { getMarktondernemerFromMMOndernemerStandaloneByMarkt } from './model/ondernemer.functions';

const conceptQueue = new ConceptQueue();
let allocationQueue = conceptQueue.getQueueForDispatcher();
const client = new RedisClient().getAsyncClient();


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

const getMarktDetails = (marktId: string, marktDate: string) => {
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
    return Promise.all([
        getMarktDetails(marktId, marktDate),
        getToewijzingen(marktId, marktDate),
        getAfwijzingen(marktId, marktDate),
    ]).then(async ([marktDetails, tws, afw]) => {
        const toewijzingen = tws;
        const afwijzingenPromises = afw.map(async (allocation): Promise<IAfwijzing> => {
            const { markt, date, koopman: erkenningsNummer, koopman, rejectReason: reasonCode } = allocation;
            const reason = getAfwijzingReason(reasonCode);
            const ondernemer = await getOndernemer(erkenningsNummer)
            const marktondernemer = getMarktondernemerFromMMOndernemerStandaloneByMarkt(ondernemer, markt)
            return { markt, date, erkenningsNummer, reason, koopman, ondernemer:marktondernemer };
        })
        return Promise.all(afwijzingenPromises).then((afwijzingen) => {
            return {
                ...marktDetails,
                toewijzingen,
                afwijzingen,
            };
        })
    });
};

export const calculateIndelingslijst = async (marktId: string, date: string) => {
    try {
        let data = await getCalculationInput(marktId, date);
        data = JSON.parse(JSON.stringify(data));
        data['mode'] = ALLOCATION_MODE_SCHEDULED;
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
        getBLijst(marktId, marktDate),
        getToewijzingen(marktId, marktDate),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, voorkeuren, markt, aLijst, bLijst, toewijzingen, algemenevoorkeuren]) => ({
        ondernemers,
        aanmeldingen,
        voorkeuren,
        markt,
        aLijst,
        bLijst,
        toewijzingen,
        algemenevoorkeuren,
    }));
