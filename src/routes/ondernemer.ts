import { Response } from 'express';
import { GrantedRequest } from 'keycloak-connect';

import { getQueryErrors, internalServerErrorPage } from '../express-util';
import { Roles } from '../authentication';
import { getKeycloakUser } from '../keycloak-api';

import { MMSollicitatie } from '../makkelijkemarkt.model';

import {
    getMarkten,
    getOndernemer,
    getToewijzingenByOndernemer,
    getAfwijzingenByOndernemer
} from '../makkelijkemarkt-api';

export const deleteUserPage = ( req: GrantedRequest, res: Response, result: string, error: string, csrfToken: string, role: string) => {
    return res.render('DeleteUserPage', {
        result,
        error,
        csrfToken,
        role,
        user: getKeycloakUser(req)
    });
};

export const publicProfilePage = async (
    req: GrantedRequest,
    res: Response,
    erkenningsNummer: string,
    role: string
) => {
    const messages = getQueryErrors(req.query);

    try {
        const ondernemer = await getOndernemer(erkenningsNummer);
        const marktenEnabled = await getMarkten(true);
        const marktenEnabledIds = marktenEnabled.map( (markt: any) => markt.id);
        ondernemer.sollicitaties = ondernemer.sollicitaties.filter((sollicitatie: MMSollicitatie) =>
            marktenEnabledIds.includes(sollicitatie.markt.id)
        );

        res.render('PublicProfilePage', { ondernemer, messages, role, user: getKeycloakUser(req) });
    } catch(err) {
        internalServerErrorPage(res);
    }
};

export const toewijzingenAfwijzingenPage = (
    req: GrantedRequest,
    res: Response,
    erkenningsNummer: string,
    role: string
) => {
    const messages = getQueryErrors(req.query);

    Promise.all([
        getToewijzingenByOndernemer(erkenningsNummer),
        getAfwijzingenByOndernemer(erkenningsNummer),
        getOndernemer(erkenningsNummer),
        getMarkten(),
    ])
    .then(([
        toewijzingen,
        afwijzingen,
        ondernemer,
        markten
    ]) => {
        const relevanteMarkten = role === Roles.MARKTONDERNEMER ?
                                 markten.filter(markt => markt.kiesJeKraamFase === 'live') :
                                 markten;
        const marktIds = relevanteMarkten.map(markt => markt.id);

        afwijzingen = afwijzingen.filter(afwijzing => {
            return marktIds.includes(afwijzing.marktId);
        });
        toewijzingen = toewijzingen.filter(toewijzing => {
            return marktIds.includes(toewijzing.marktId);
        });

        res.render('ToewijzingenAfwijzingenPage', {
            toewijzingen,
            afwijzingen,
            ondernemer,
            role,
            markten,
            messages,
            user: getKeycloakUser(req)
        });
    })
    .catch(err => internalServerErrorPage(res)(err));
};
