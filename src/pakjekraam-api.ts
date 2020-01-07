import {
    getALijst,
    getMarkt,
    getMarkten as getMakkelijkeMarkten,
    getMarktondernemer as getMarktondernemerMM,
    getMarktondernemers as getMarktondernemersMM,
    getMarktondernemersByMarkt as getMarktondernemersByMarktMM,
} from './makkelijkemarkt-api';
import { formatOndernemerName, isVast, parseMarktDag, slugifyMarkt } from './domain-knowledge.js';
import { numberSort, stringSort, getMaDiWoDo, toISODate } from './util';
import Sequelize from 'sequelize';
import { allocation, plaatsvoorkeur, rsvp, voorkeur } from './model/index';
import { calcToewijzingen } from './indeling';
// import { getVoorkeurenByMarkt } from './model/voorkeur.functions';

import {
    IMarkt,
    IBranche,
    IMarktInfo,
    IMarktProperties,
    IMarktondernemer,
    IMarktondernemerVoorkeur,
    IMarktondernemerVoorkeurRow,
    IMarktplaats,
    IObstakelBetween,
    IPlaatsvoorkeur,
    IRSVP,
    IToewijzing,
} from './markt.model';
import { IAllocationPrintout, IAllocationPrintoutPage, IMarketRow } from './model/printout.model';
import { RSVP } from './model/rsvp.model';
import { Allocation } from './model/allocation.model';
import { Plaatsvoorkeur } from './model/plaatsvoorkeur.model';
import { Voorkeur } from './model/voorkeur.model';
import { convertSollicitatieToOndernemer as convertSollicitatie } from './model/ondernemer.functions';

import { MMOndernemerStandalone } from './makkelijkemarkt.model';

import * as fs from 'fs';
import { getMarktEnriched } from './model/markt.functions';

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

const toewijzingenPerDatum = (toewijzingen: IToewijzing[], row: Allocation): IToewijzing[] => {

    const { marktId, marktDate, erkenningsNummer } = row;

    const existing = toewijzingen.find(toewijzing => toewijzing.marktDate === marktDate);

    const voorkeur: IToewijzing = {
        marktId,
        marktDate,
        erkenningsNummer,
        plaatsen: [...(existing ? existing.plaatsen : []), row.plaatsId],
    };

    if (existing) {
        return [...toewijzingen.filter(toewijzing => toewijzing.marktDate !== marktDate), voorkeur];
    } else {
        return [...toewijzingen, voorkeur];
    }

};

const groupAllocationRows = (toewijzingen: IToewijzing[], row: Allocation): IToewijzing[] => {

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

export const getAanmeldingen = (marktId: string, marktDate: string): Promise<IRSVP[]> =>
    rsvp
        .findAll<RSVP>({
            where: { marktId, marktDate },
            raw: true,
        })
        .then(aanmeldingen => aanmeldingen);

export const getAanmeldingenByOndernemerEnMarkt = (marktId: string, erkenningsNummer: string): Promise<IRSVP[]> =>
    rsvp
        .findAll<RSVP>({
            where: { marktId, erkenningsNummer },
            raw: true,
        })
        .then(aanmeldingen => aanmeldingen);

export const getAanmeldingenByOndernemer = (erkenningsNummer: string): Promise<IRSVP[]> =>
    rsvp
        .findAll<RSVP>({
            where: { erkenningsNummer },
            raw: true,
        })
        .then(aanmeldingen => aanmeldingen);

export const getToewijzingenByOndernemerEnMarkt = (marktId: string, erkenningsNummer: string): Promise<IToewijzing[]> =>
    allocation
        .findAll<Allocation>({
            where: { marktId, erkenningsNummer },
            raw: true,
        })
        .then(toewijzingen => toewijzingen.reduce(toewijzingenPerDatum, []));

export const getToewijzingen = (marktId: string, marktDate: string): Promise<IToewijzing[]> =>
    allocation
        .findAll<Allocation>({
            where: { marktId, marktDate },
            raw: true,
        })
        .then(toewijzingen => toewijzingen.reduce(groupAllocationRows, []));

export const getPlaatsvoorkeuren = (marktId: string): Promise<IPlaatsvoorkeur[]> =>
    plaatsvoorkeur
        .findAll<Plaatsvoorkeur>({
            where: { marktId },
            raw: true,
        })
        .then(plaatsvoorkeuren => plaatsvoorkeuren);

export const getVoorkeurenMarktOndern = (marktId: string, erkenningsNummer: string): Promise<IPlaatsvoorkeur[]> =>
    plaatsvoorkeur
        .findAll<Plaatsvoorkeur>({
            where: { marktId, erkenningsNummer },
            raw: true,
        })
        .then(plaatsvoorkeuren => plaatsvoorkeuren);

const indelingVoorkeurPrio = (voorkeur: IMarktondernemerVoorkeur): number =>
    (voorkeur.marktId ? 1 : 0) | (voorkeur.marktDate ? 2 : 0);
const indelingVoorkeurSort = (a: IMarktondernemerVoorkeur, b: IMarktondernemerVoorkeur) =>
    numberSort(indelingVoorkeurPrio(a), indelingVoorkeurPrio(b));

const indelingVoorkeurMerge = (
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
    if (b.inactive !== null) {
        merged.inactive = b.inactive;
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

export const getIndelingVoorkeur = (
    erkenningsNummer: string,
    marktId: string = null,
    marktDate: string = null,
): Promise<IMarktondernemerVoorkeur> => {
    const where = {
        erkenningsNummer,
        [Sequelize.Op.and]: [
            { [Sequelize.Op.or]: [{ marktId }, { marktId: null }] },
            { [Sequelize.Op.or]: [{ marktDate }, { marktDate: null }] },
        ],
    };

    return voorkeur
        .findAll<Voorkeur>({
            where,
            raw: true,
        })
        .then(voorkeuren => voorkeuren.sort(indelingVoorkeurSort).reduce(indelingVoorkeurMerge, null));
};

const groupByErkenningsNummer = (
    groups: IMarktondernemerVoorkeur[][],
    voorkeur: IMarktondernemerVoorkeur,
): IMarktondernemerVoorkeur[][] => {
    let group;

    for (let i = groups.length; i--;) {
        if (groups[i][0].erkenningsNummer === voorkeur.erkenningsNummer) {
            group = groups[i];
            break;
        }
    }

    if (group) {
        group.push(voorkeur);
    } else {
        groups.push([voorkeur]);
    }

    return groups;
};

const convertVoorkeur = (obj: IMarktondernemerVoorkeurRow): IMarktondernemerVoorkeur => ({
    ...obj,
    branches: [obj.brancheId, obj.parentBrancheId].filter(Boolean),
    verkoopinrichting: obj.inrichting ? [obj.inrichting] : [],
});

export const getIndelingVoorkeuren = (
    marktId: string,
    marktDate: string = null,
): Promise<IMarktondernemerVoorkeur[]> => {
    const where = {
        [Sequelize.Op.and]: [
            {
                [Sequelize.Op.or]: marktId ? [{ marktId }, { marktId: null }] : [{ marktId: null }],
            },
            {
                [Sequelize.Op.or]: marktDate ? [{ marktDate }, { marktDate: null }] : [{ marktDate: null }],
            },
        ],
    };

    return voorkeur
        .findAll<Voorkeur>({
            where,
            raw: true,
        })
        .then(voorkeuren =>
            voorkeuren
                .sort((a, b) => indelingVoorkeurSort(a, b) || stringSort(a.erkenningsNummer, b.erkenningsNummer))
                .reduce(groupByErkenningsNummer, [])
                .map(arr => arr.reduce(indelingVoorkeurMerge)),
        );
};

export const getPlaatsvoorkeurenOndernemer = (erkenningsNummer: string): Promise<IPlaatsvoorkeur[]> =>
    plaatsvoorkeur.findAll<Plaatsvoorkeur>({
        where: { erkenningsNummer },
    });

export const getMarktProperties = (marktId: string): Promise<IMarktProperties> =>
    loadJSON(`./config/markt/${slugifyMarkt(marktId)}/markt.json`, {});

export const getBranches = (marktId: string): Promise<IBranche[]> =>
    loadJSON(`./config/markt/${slugifyMarkt(marktId)}/branches.json`, []);

export const getAllBranches = (): Promise<IBranche[]> => loadJSON('./config/markt/branches.json', []);

export const getMarktplaatsen = (marktId: string): Promise<IMarktplaats[]> =>
    loadJSON(`./config/markt/${slugifyMarkt(marktId)}/locaties.json`, []);

export const getMarktPaginas = (marktId: string): Promise<IAllocationPrintout> =>
    loadJSON(`./config/markt/${slugifyMarkt(marktId)}/paginas.json`, []);

export const getMarktGeografie = (marktId: string): Promise<{ obstakels: IObstakelBetween[] }> =>
    loadJSON(`./config/markt/${slugifyMarkt(marktId)}/geografie.json`, { obstakels: [] });

export const getMarktInfo = (marktId: string): Promise<IMarktInfo> =>
    loadJSON(`./config/markt/${slugifyMarkt(marktId)}/info.json`);

export const getMededelingen = (): Promise<any> =>
    loadJSON('./config/markt/mededelingen.json', {});

export const getDaysClosed = (): Promise<any> =>
    loadJSON('./config/markt/daysClosed.json', {});


/*
 * Convert an object from Makkelijke Markt to our own type of `IMarktondernemer` object
 */
const convertOndernemer = (data: MMOndernemerStandalone): IMarktondernemer => ({
    description: formatOndernemerName(data),
    erkenningsNummer: data.erkenningsnummer,
    status: '' as any,
    sollicitatieNummer: 0,
});

export const getMarktondernemer = (erkenningsNummer: string) =>
    getMarktondernemerMM(erkenningsNummer).then(ondernemer => convertOndernemer(ondernemer));

export const getMarktondernemers = () =>
    getMarktondernemersMM().then(sollictaties =>
        sollictaties.filter(sollictatie => !sollictatie.doorgehaald).map(convertSollicitatie),
    );

export const enrichOndernemersWithVoorkeuren = (ondernemers: IMarktondernemer[], voorkeuren: IMarktondernemerVoorkeur[]) => {
    return ondernemers.map(ondernemer => {

        let voorkeurVoorOndernemer = voorkeuren.find(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer);

        if (voorkeurVoorOndernemer === undefined) {
            voorkeurVoorOndernemer = <IMarktondernemerVoorkeur>{
                absentFrom: null,
                absentUntil: null,
            };
        }

        return {
            ...ondernemer,
            voorkeur: { ...ondernemer.voorkeur, ...voorkeurVoorOndernemer }
        };
    });
};

export const getMarktondernemersByMarkt = (marktId: string) =>
    getMarktondernemersByMarktMM(marktId)
        .then(sollicitaties => {
            return sollicitaties.filter(sollicitatie => !sollicitatie.doorgehaald).map(convertSollicitatie);
        });

export const getIndelingslijstInput = (marktId: string, marktDate: string) => {

    const voorkeurenPromise = Voorkeur.findAll({ where: { marktId }, raw: true })
        .then( voorkeuren => voorkeuren.map(convertVoorkeur));

    // Populate the `ondernemer.voorkeur` field
    const enrichedOndernemers = Promise.all([getMarktondernemersByMarkt(marktId), voorkeurenPromise]).then( result => {
        return enrichOndernemersWithVoorkeuren(...result);
    });

    const getMarktPlaatsenDisabled = Promise.all([
        getMarkt(marktId),
        getMarktplaatsen(marktId)
    ])
    .then( ([makkelijkemarkt, marktplaatsen]) => {
        if (makkelijkemarkt.kiesJeKraamGeblokkeerdePlaatsen) {
            const geblokkeerdePlaatsen = makkelijkemarkt.kiesJeKraamGeblokkeerdePlaatsen.split(',');
            return marktplaatsen.map( plaats => {
                geblokkeerdePlaatsen.includes(plaats.plaatsId) ? plaats.inactive = true : null;
                return plaats;
            });
        } else {
            return marktplaatsen;
        }
    });

    return Promise.all([
        getMarktProperties(marktId),
        enrichedOndernemers,
        getMarktPlaatsenDisabled,
        getAanmeldingen(marktId, marktDate),
        getPlaatsvoorkeuren(marktId),
        getAllBranches(),
        getMarktPaginas(marktId),
        getMarktGeografie(marktId),
        // getMarktInfo(marktId),
        getMarkt(marktId),
        getALijst(marktId, marktDate),
    ]).then(args => {
        const [
            marktProperties,
            ondernemers,
            marktplaatsen,
            aanmeldingen,
            voorkeuren,
            branches,
            paginas,
            geografie,
            markt,
            aLijst,
        ] = args;
        return {
            naam: '?',
            marktId,
            marktDate,
            ...marktProperties,
            aanmeldingen,
            voorkeuren,
            branches,
            ondernemers,
            paginas,
            obstakels: geografie.obstakels || [],
            markt,
            marktplaatsen,
            aanwezigheid: aanmeldingen,
            aLijst: aLijst.map(({ erkenningsnummer }) =>
                ondernemers.find(({ erkenningsNummer }) => erkenningsnummer === erkenningsNummer),
            ),
            rows: (
                marktProperties.rows ||
                paginas.reduce(
                    (list: string[][], pagina: IAllocationPrintoutPage): string[][] => [
                        ...list,
                        ...pagina.indelingslijstGroup
                            .map(group => (group as IMarketRow).plaatsList)
                            .filter(Array.isArray),
                    ],
                    [],
                )
            ).map(row => row.map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId))),
        };
    });
};

export const getIndelingslijst = (marktId: string, date: string) =>
    getIndelingslijstInput(marktId, date).then(data => {

        const logMessage = `Marktindeling berekenen: ${data.markt.naam}`;
        console.time(logMessage);
        const indeling = calcToewijzingen(data);
        console.timeEnd(logMessage);

        return indeling;
    });

export const getToewijzingslijst = (marktId: string, marktDate: string) =>
    // TODO: Request only necessary data, `getIndelingslijstInput` returns too much
    Promise.all([getIndelingslijstInput(marktId, marktDate), getToewijzingen(marktId, marktDate)]).then(
        ([data, toewijzingen]) => ({
            ...data,
            toewijzingen,
            afwijzingen: [],
        }),
    );

export const getMailContext = (marktId: string, erkenningsNr: string, marktDate: string) =>
    Promise.all([
        getToewijzingslijst(marktId, marktDate),
        getVoorkeurenMarktOndern(marktId, erkenningsNr),
        getAanmeldingenByOndernemerEnMarkt(marktId, erkenningsNr),
        getAllBranches(),
    ]).then(([markt, voorkeuren, aanmeldingen, branches]) => {
        const ondernemer = markt.ondernemers.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const inschrijving = markt.aanwezigheid.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const toewijzing = markt.toewijzingen.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const afwijzing = markt.afwijzingen.find(({ erkenningsNummer }) => erkenningsNummer === erkenningsNr);
        const voorkeurenObjPrio: { [index: string]: IPlaatsvoorkeur[] } = (voorkeuren || []).reduce(
            (hash: { [index: string]: IPlaatsvoorkeur[] }, voorkeur) => {
                if (!hash.hasOwnProperty(voorkeur.priority)) {
                    hash[voorkeur.priority] = [];
                }
                hash[voorkeur.priority].push(voorkeur);

                return hash;
            },
            {},
        );
        const voorkeurenPrio = Object.keys(voorkeurenObjPrio)
            .map(key => voorkeurenObjPrio[key])
            .sort((a, b) => b[0].priority - a[0].priority)
            .map(voorkeurList => voorkeurList.map(voorkeur => voorkeur.plaatsId));

        // fixme: resolve markt naam
        markt.naam = ((markt as any).markt as IMarkt).naam;

        return {
            markt,
            marktDate,
            marktplaatsen: markt.marktplaatsen,
            ondernemer,
            inschrijving,
            toewijzing,
            afwijzing,
            voorkeuren: voorkeurenPrio,
            aanmeldingen,
            branches,
        };
    });

export const getSollicitantenlijstInput = (marktId: string, date: string) =>
    Promise.all([
        getMarktondernemersByMarkt(marktId).then(ondernemers =>
            ondernemers.filter(({ status }) => !isVast(status)),
        ),
        getAanmeldingen(marktId, date),
        getPlaatsvoorkeuren(marktId),
        getMarkt(marktId),
    ]).then(args => {
        const [ondernemers, aanmeldingen, voorkeuren, markt] = args;
        return {
            ondernemers,
            aanmeldingen,
            voorkeuren,
            markt,
        };
    });

export const getAfmeldingenVasteplaatshoudersInput = (marktId: string, marktDate: string) =>
    Promise.all([
        getMarktondernemersByMarkt(marktId),
        getAanmeldingen(marktId, marktDate),
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

export const getVoorrangslijstInput = (marktId: string, marktDate: string) =>
    Promise.all([
        getMarktondernemersByMarkt(marktId),
        getAanmeldingen(marktId, marktDate),
        getPlaatsvoorkeuren(marktId),
        getMarktEnriched(marktId),
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

export const getMarkten = () =>
    getMakkelijkeMarkten();
        // Only show markten for which JSON data with location info exists
        // .then(markten => markten.filter(markt => fs.existsSync(`config/markt/${slugifyMarkt(markt.id)}/markt.json`)));

export const getMarktenByDate = (marktDate: string) => {

    const day = new Date(marktDate);

    return Promise.all([
        getMarkten(),
        getDaysClosed()
    ])
    .then(([markten, daysClosed]) => {
            if (daysClosed.includes(marktDate)) {
                console.log('Alle markten zijn vandaag gesloten');
                return [];
            } else {
                return markten
                    .filter(({ marktDagen }) => marktDagen.includes( getMaDiWoDo(day) ))
                    .filter(({ kiesJeKraamGeblokkeerdePlaatsen }) => {
                        if (!kiesJeKraamGeblokkeerdePlaatsen) {
                            return true;
                        } else {
                            return !kiesJeKraamGeblokkeerdePlaatsen.split(',').includes(marktDate);
                        }
                    });
            }
    });
};

/*
 * Vendors are allowed to attend only one market per day.
 * Check if a vendor wants to apply for a market, while on the same day it has applied for others.
 */
export const isConflictingApplication = (existing: IRSVP[], application: IRSVP): IRSVP[] =>
    // TODO: In addition to `attending`, check the vendors 'default days' and `isVast()`
    application.attending
        ? existing
            .filter(a => String(a.marktId) !== String(application.marktId))
            .filter(a => a.marktDate === application.marktDate)
            .filter(a => a.attending !== null && !!a.attending)
        : [];

export const getConflictingApplications = (application: IRSVP): Promise<IRSVP[]> =>
    getAanmeldingenByOndernemer(application.erkenningsNummer).then(existing =>
        isConflictingApplication(existing, application),
    );
