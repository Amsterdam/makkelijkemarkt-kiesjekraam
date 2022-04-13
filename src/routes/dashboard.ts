import { Promise } from 'bluebird';
import { Response, NextFunction } from 'express';

import {
    getMarkten,
    getAanmeldingenByOndernemer,
    getPlaatsvoorkeurenOndernemer,
    getOndernemer,
    getToewijzingenByOndernemer,
    getAfwijzingenByOndernemer
} from '../makkelijkemarkt-api';

import { internalServerErrorPage, getQueryErrors } from '../express-util';

import { Roles } from '../authentication';

import { GrantedRequest } from 'keycloak-connect';
import { getKeycloakUser } from '../keycloak-api';

export const dashboardPage = (
    req: GrantedRequest,
    res: Response,
    next: NextFunction,
    erkenningsNummer: string
) => {
    const messages = getQueryErrors(req.query);

    Promise.props({
        ondernemer       : getOndernemer(erkenningsNummer),
        markten          : getMarkten(),
        plaatsvoorkeuren : getPlaatsvoorkeurenOndernemer(erkenningsNummer),
        aanmeldingen     : getAanmeldingenByOndernemer(erkenningsNummer),
        toewijzingen     : getToewijzingenByOndernemer(erkenningsNummer),
        afwijzingen      : getAfwijzingenByOndernemer(erkenningsNummer)
    })
    .then(result => {
        res.render('OndernemerDashboard', {
            ...result,
            messages,
            role: Roles.MARKTONDERNEMER,
            user: getKeycloakUser(req)
        });
    })
    .catch(internalServerErrorPage(res));
};
