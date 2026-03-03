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
    Roles,
} from '../authentication';

export const dashboardPage = (req: GrantedRequest, res: Response, next: NextFunction, erkenningsNummer: string) => {
    const messages = getQueryErrors(req.query);

    Promise.all([
        getOndernemer(erkenningsNummer),
        getMarkten(),
        getPlaatsvoorkeurenOndernemer(erkenningsNummer),
        getAanmeldingenByOndernemer(erkenningsNummer),
        getToewijzingenAfwijzingen(erkenningsNummer),
    ])
        .then(([ondernemer, markten, plaatsvoorkeuren, aanmeldingen, toewijzingenAfwijzingen]) => {
            const {toewijzingen, afwijzingen} = toewijzingenAfwijzingen;
            res.render('OndernemerDashboard', {
                ondernemer,
                markten,
                plaatsvoorkeuren,
                aanmeldingen,
                toewijzingenAfwijzingen,
                toewijzingen,
                afwijzingen,
                messages,
                role: Roles.MARKTONDERNEMER,
                user: getKeycloakUser(req),
            });
        })
        .catch(internalServerErrorPage(res));
};
