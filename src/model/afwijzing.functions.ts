import {
    IAfwijzingReason,
} from 'model/markt.model';

const UNKNOWN: IAfwijzingReason = {
    code: 0,
    db_id: 'UNKNOWN',
    message: 'Onbekende reden',
};
const BRANCHE_FULL: IAfwijzingReason = {
    code: 1,
    db_id: 'BRANCHE_FULL',
    message: 'Alle marktplaatsen voor deze branche zijn reeds ingedeeld.',
};
const ADJACENT_UNAVAILABLE: IAfwijzingReason = {
    code: 2,
    db_id: 'ADJACENT_UNAVAILABLE',
    message: 'Geen geschikte locatie gevonden met huidige voorkeuren.',
};
const MINIMUM_UNAVAILABLE: IAfwijzingReason = {
    code: 3,
    db_id: 'MINIMUM_UNAVAILABLE',
    message: 'Minimum aantal plaatsen niet beschikbaar.',
};
const MARKET_FULL: IAfwijzingReason = {
    code: 4,
    db_id: 'MARKET_FULL',
    message: 'Alle marktplaatsen zijn reeds ingedeeld.',
};
const VPL_POSITION_NOT_AVAILABLE: IAfwijzingReason = {
    code: 5,
    db_id: 'VPL_POSITION_NOT_AVAILABLE',
    message: 'De vaste plaatsen voor de vpl zijn niet beschikbaar.',
};
const PREF_NOT_AVAILABLE: IAfwijzingReason = {
    code: 6,
    db_id: 'PREF_NOT_AVAILABLE',
    message: 'Geen geschikte locatie gevonden met huidige voorkeuren.',
};

export const getAfwijzingReason = (reasonCode: string) => {
    const reasons = [UNKNOWN, BRANCHE_FULL, ADJACENT_UNAVAILABLE, MINIMUM_UNAVAILABLE, MARKET_FULL, VPL_POSITION_NOT_AVAILABLE, PREF_NOT_AVAILABLE];
    return reasons.find(reason => reason.db_id === reasonCode);
};

export const printAfwijzingReason = (reasonCode: string) => {
    return getAfwijzingReason(reasonCode).message;
};
