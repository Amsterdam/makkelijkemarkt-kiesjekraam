import {
    // getAfwijzingenByOndernemer,
    // getMarkten,
    // getOndernemer,
    // getToewijzingenByOndernemer,
} from '../makkelijkemarkt-api';
import {
    getAfwijzingenByOndernemer,
    getMarkten,
    getOndernemer,
    getToewijzingenByOndernemer,
} from '../daalder-api';
import {
    getQueryErrors,
    internalServerErrorPage,
} from '../express-util';
import {
    getKeycloakUser,
} from '../keycloak-api';
import {
    GrantedRequest,
} from 'keycloak-connect';
import {
    MMSollicitatie,
} from '../model/makkelijkemarkt.model';
import {
    Response,
} from 'express';
import {
    Roles,
} from '../authentication';

export const publicProfilePage = async (req: GrantedRequest, res: Response, erkenningsNummer: string, role: string) => {
    const messages = getQueryErrors(req.query);

    try {
        const ondernemer = await getOndernemer(erkenningsNummer);
        const marktenEnabled = await getMarkten(true);
        const marktenEnabledIds = marktenEnabled.map((markt: any) => markt.id);
        ondernemer.sollicitaties = ondernemer.sollicitaties.filter((sollicitatie: MMSollicitatie) =>
            marktenEnabledIds.includes(sollicitatie.markt.id),
        );

        res.render('PublicProfilePage', { ondernemer, messages, role, user: getKeycloakUser(req) });
    } catch (err) {
        internalServerErrorPage(res);
    }
};

export const toewijzingenAfwijzingenPage = (
    req: GrantedRequest,
    res: Response,
    erkenningsNummer: string,
    role: string,
) => {
    const messages = getQueryErrors(req.query);

    Promise.all([
        getToewijzingenByOndernemer(erkenningsNummer),
        getAfwijzingenByOndernemer(erkenningsNummer),
        getOndernemer(erkenningsNummer),
        getMarkten(),
    ])
        .then(([toewijzingen, afwijzingen, ondernemer, markten]) => {
            const relevanteMarkten =
                role === Roles.MARKTONDERNEMER ? markten.filter(markt => markt.kiesJeKraamFase === 'live') : markten;
            const marktIds = relevanteMarkten.map(markt => markt.id.toString());

            afwijzingen = afwijzingen.filter(afwijzing => {
                return marktIds.includes(afwijzing.markt);
            });
            toewijzingen = toewijzingen.filter(toewijzing => {
                return marktIds.includes(toewijzing.markt);
            });

            res.render('ToewijzingenAfwijzingenPage', {
                toewijzingen,
                afwijzingen,
                ondernemer,
                role,
                markten,
                messages,
                user: getKeycloakUser(req),
            });
        })
        .catch(err => internalServerErrorPage(res)(err));
};
