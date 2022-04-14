import { isVast } from '../domain-knowledge';

import { IMarktondernemerVoorkeurRow } from './markt.model';

import { MMSollicitatie } from './makkelijkemarkt.model';

export const getDefaultVoorkeur = (sollicitatie: MMSollicitatie) => {
    return {
        minimum: isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1,
        maximum: isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1,
        anywhere: !isVast(sollicitatie.status),
    };
};

export const voorkeurenFormData = (body: any): IMarktondernemerVoorkeurRow => {
    const { absentFrom, absentUntil, erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting } =
        body;
    const anywhere = JSON.parse(body.anywhere);
    const minimum = typeof body.minimum === 'string' ? parseInt(body.minimum, 10) || null : null;
    const maximum = typeof body.maximum === 'string' ? parseInt(body.maximum, 10) || null : null;

    const voorkeur = {
        erkenningsNummer,
        marktId: marktId || null,
        marktDate: marktDate || null,
        anywhere,
        minimum,
        maximum,
        brancheId: brancheId || null,
        parentBrancheId: parentBrancheId || null,
        inrichting: inrichting || null,
        absentFrom: absentFrom || null,
        absentUntil: absentUntil || null,
    };
    return voorkeur;
};
