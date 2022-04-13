import {
    getAanmeldingenByOndernemer,
    getAfwijzingenByOndernemer,
    getMarkten,
    getOndernemer,
    getPlaatsvoorkeurenOndernemer,
    getToewijzingenByOndernemer,
} from '../makkelijkemarkt-api';
import {
    getQueryErrors,
    internalServerErrorPage
} from '../express-util';
import {
    NextFunction,
    Response,
} from 'express';
import {
    getKeycloakUser,
} from '../keycloak-api';
import {
    GrantedRequest,
} from 'keycloak-connect';
import {
    Promise,
} from 'bluebird';
import {
    Roles,
} from '../authentication';

export const dashboardPage = (req: GrantedRequest, res: Response, next: NextFunction, erkenningsNummer: string) => {
    const messages = getQueryErrors(req.query);

    Promise.props({
        ondernemer: getOndernemer(erkenningsNummer),
        markten: getMarkten(),
        plaatsvoorkeuren: getPlaatsvoorkeurenOndernemer(erkenningsNummer),
        aanmeldingen: getAanmeldingenByOndernemer(erkenningsNummer),
        toewijzingen: getToewijzingenByOndernemer(erkenningsNummer),
        afwijzingen: getAfwijzingenByOndernemer(erkenningsNummer),
    })
        .then(result => {
            res.render('OndernemerDashboard', {
                ...result,
                messages,
                role: Roles.MARKTONDERNEMER,
                user: getKeycloakUser(req),
            });
        })
        .catch(internalServerErrorPage(res));
};
