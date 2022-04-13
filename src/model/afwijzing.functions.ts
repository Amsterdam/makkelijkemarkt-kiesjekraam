import { IMarkt, IAfwijzing, IAfwijzingReason } from 'markt.model';

const BRANCHE_FULL: IAfwijzingReason = {
    code: 1,
    message: 'Alle marktplaatsen voor deze branche zijn reeds ingedeeld.'
};
const ADJACENT_UNAVAILABLE: IAfwijzingReason = {
    code: 2,
    message: 'Geen geschikte locatie gevonden met huidige voorkeuren.'
};
const MINIMUM_UNAVAILABLE: IAfwijzingReason = {
    code: 3,
    message: 'Minimum aantal plaatsen niet beschikbaar.'
};
const MARKET_FULL: IAfwijzingReason = {
    code: 4,
    message: 'Alle marktplaatsen zijn reeds ingedeeld.'
};

import {
    getPlaatsvoorkeurenByMarktEnOndernemer,
    getVoorkeurByMarktEnOndernemer,
} from '../makkelijkemarkt-api';

export const convertAfwijzingForDB = (afwijzing: any, markt: IMarkt, marktDate: string) => {
    return {
        ...afwijzing,
        reasonCode: afwijzing.reason.code,
        erkenningsNummer: afwijzing.ondernemer.erkenningsNummer,
        marktId: markt.marktId,
        marktDate,
    };
};

export const getAfwijzingReason = (reasonCode: number) => {
    const reasons = [
        BRANCHE_FULL,
        ADJACENT_UNAVAILABLE,
        MINIMUM_UNAVAILABLE,
        MARKET_FULL
    ];
    return reasons.find(reason => reason.code === reasonCode);
};

export const printAfwijzingReason = (reasonCode: number) => {
    return getAfwijzingReason(reasonCode).message;
};

export const getAfwijzingEnriched = (afwijzing: IAfwijzing): Promise<IAfwijzing> => {
    return Promise.all([
        getVoorkeurByMarktEnOndernemer(afwijzing.marktId, afwijzing.erkenningsNummer),
        getPlaatsvoorkeurenByMarktEnOndernemer(afwijzing.marktId, afwijzing.erkenningsNummer)
    ]).then(result => {

        const [ voorkeuren, plaatsvoorkeuren ] = result;

        afwijzing.plaatsvoorkeuren = plaatsvoorkeuren.length > 0 ? plaatsvoorkeuren.map(plaats => plaats.plaatsId): null;
        afwijzing.anywhere = voorkeuren ? voorkeuren.anywhere : null;
        afwijzing.minimum = voorkeuren ? voorkeuren.minimum : null;
        afwijzing.maximum = voorkeuren ? voorkeuren.maximum : null;
        afwijzing.bak = voorkeuren ? !!(voorkeuren.parentBrancheId === 'bak') : null;
        afwijzing.eigenMaterieel = voorkeuren ? !!(voorkeuren.inrichting === 'eigen-materieel') : null;
        afwijzing.brancheId = voorkeuren ? voorkeuren.brancheId : null;

        return afwijzing;
    });
};
