import {
    getAanmeldingenByOndernemer,
    // getAfwijzingenByOndernemer,
    getMarkten,
    getOndernemer,
    getPlaatsvoorkeurenOndernemer,
    getToewijzingenAfwijzingen,
    // getToewijzingenByOndernemer,
} from '../daalder-api';
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
        plaatsvoorkeuren: getPlaatsvoorkeurenOndernemer(erkenningsNummer),  // not used on dashboard page
        aanmeldingen: getAanmeldingenByOndernemer(erkenningsNummer),
        // toewijzingen: getToewijzingenByOndernemer(erkenningsNummer), // not used on dashboard page
        // afwijzingen: getAfwijzingenByOndernemer(erkenningsNummer), // not used on dashboard page
        toewijzingenAfwijzingen: getToewijzingenAfwijzingen(erkenningsNummer),
    })
        .then(result => {
            const {toewijzingen, afwijzingen} = result.toewijzingenAfwijzingen;
            res.render('OndernemerDashboard', {
                ...result,
                toewijzingen,
                afwijzingen,
                messages,
                role: Roles.MARKTONDERNEMER,
                user: getKeycloakUser(req),
            });
        })
        .catch(internalServerErrorPage(res));
};
