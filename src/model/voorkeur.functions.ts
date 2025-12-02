import { IMarktondernemerVoorkeurRow } from './markt.model';
import { isVast } from '../domain-knowledge';
import { MMSollicitatie } from './makkelijkemarkt.model';

export const getDefaultVoorkeur = (sollicitatie: MMSollicitatie) => {
    return {
        minimum: isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1,
        maximum: isVast(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 1,
        anywhere: !isVast(sollicitatie.status),
    };
};

export const voorkeurenFormData = (
    body: any
): IMarktondernemerVoorkeurRow => {
    const { absentFrom, absentUntil, erkenningsNummer, marktId, marktDate, brancheId, parentBrancheId, inrichting, bakType } = body;
    // Next line is a patch for when anywhere is not passed,
    // because when we update voorkeur from Daalder we use different update functions for marktprofiel vs plaatsvoorkeur,
    // whereas the MM implementation uses the same function for both.
    const anywhere = body.anywhere === '' ? null : JSON.parse(body.anywhere);
    const minimum = typeof body.minimum === 'string' ? parseInt(body.minimum, 10) || null : null;
    const maximum = typeof body.maximum === 'string' ? parseInt(body.maximum, 10) || null : null;

    const voorkeur = {
        erkenningsNummer,
        marktId: marktId || null,
        marktDate: marktDate || null,
        bakType: bakType || 'geen',
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
