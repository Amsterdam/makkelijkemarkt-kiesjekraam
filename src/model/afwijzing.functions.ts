import {
    IAfwijzingReason,
} from 'model/markt.model';

const BRANCHE_FULL: IAfwijzingReason = {
    code: 1,
    message: 'Alle marktplaatsen voor deze branche zijn reeds ingedeeld.',
};
const ADJACENT_UNAVAILABLE: IAfwijzingReason = {
    code: 2,
    message: 'Geen geschikte locatie gevonden met huidige voorkeuren.',
};
const MINIMUM_UNAVAILABLE: IAfwijzingReason = {
    code: 3,
    message: 'Minimum aantal plaatsen niet beschikbaar.',
};
const MARKET_FULL: IAfwijzingReason = {
    code: 4,
    message: 'Alle marktplaatsen zijn reeds ingedeeld.',
};
const VPL_POSITION_NOT_AVAILABLE: IAfwijzingReason = {
    code: 5,
    message: 'De vaste plaatsen voor de vpl zijn niet beschikbaar.',
};
const PREF_NOT_AVAILABLE: IAfwijzingReason = {
    code: 6,
    message: 'Geen geschikte locatie gevonden met huidige voorkeuren.',
};

export const getAfwijzingReason = (reasonCode: number) => {
    const reasons = [BRANCHE_FULL, ADJACENT_UNAVAILABLE, MINIMUM_UNAVAILABLE, MARKET_FULL, VPL_POSITION_NOT_AVAILABLE, PREF_NOT_AVAILABLE];
    return reasons.find(reason => reason.code === reasonCode);
};

export const printAfwijzingReason = (reasonCode: number) => {
    return getAfwijzingReason(reasonCode).message;
};
