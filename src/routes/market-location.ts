import {
    // deletePlaatsvoorkeurenByMarktAndKoopman,
    // getIndelingVoorkeur,
    // getMarktBasics,
    // getOndernemer,
    // getPlaatsvoorkeurenByMarktEnOndernemer,
    // updateMarktVoorkeur,
    // updatePlaatsvoorkeur,
} from '../makkelijkemarkt-api';
import {
    getPlaatsvoorkeurenByMarktEnOndernemer,
    updatePlaatsvoorkeur,
    deletePlaatsvoorkeurenByMarktAndKoopman,
    getIndelingVoorkeur,
    updateMarktVoorkeur,
    getOndernemer,
    getMarktBasics,
} from '../daalder-api';
import { getQueryErrors, HTTP_CREATED_SUCCESS, internalServerErrorPage } from '../express-util';
import { NextFunction, Request, Response } from 'express';
import { getKeycloakUser } from '../keycloak-api';
import { getMededelingen } from '../pakjekraam-api';
import { GrantedRequest } from 'keycloak-connect';
import { IPlaatsvoorkeurRow } from '../model/markt.model';
import { isExp } from '../domain-knowledge';

export const plaatsvoorkeurenPage = (
    req: GrantedRequest,
    res: Response,
    erkenningsNummer: string,
    query: any,
    currentMarktId: string,
    role: string,
    csrfToken: string,
) => {
    const messages = getQueryErrors(req.query);
    const ondernemerPromise = getOndernemer(erkenningsNummer);
    const marktPromise = ondernemerPromise.then((ondernemer) => {
        const sollicitatie = ondernemer.sollicitaties.find(
            (sollicitatie) => String(sollicitatie.markt.id) === currentMarktId,
        );
        if (!sollicitatie) {
            throw Error('Geen sollicitatie voor deze markt gevonden');
        }

        return getMarktBasics(currentMarktId);
    });

    Promise.all([
        ondernemerPromise,
        marktPromise,
        getPlaatsvoorkeurenByMarktEnOndernemer(currentMarktId, erkenningsNummer),
        getIndelingVoorkeur(erkenningsNummer, currentMarktId),
        getMededelingen(),
    ]).then(
        ([ondernemer, marktBasics, plaatsvoorkeuren, indelingVoorkeur, mededelingen]) => {
            const sollicitatie = ondernemer.sollicitaties.find((soll) => soll.markt.id === marktBasics.markt.id);

            // Als iemand de status experimenteel heeft mag degene zijn plaatsvoorkeuren niet wijzigen
            if (role === 'marktondernemer' && isExp(sollicitatie.status)) {
                res.status(403);
                res.send();
            }
            res.render('VoorkeurenPage', {
                ondernemer,
                markt: marktBasics.markt,
                plaatsvoorkeuren,
                marktplaatsen: marktBasics.marktplaatsen,
                indelingVoorkeur,
                query,
                messages,
                role,
                sollicitatie,
                mededeling: mededelingen.plaatsVoorkeuren,
                csrfToken,
                user: getKeycloakUser(req),
            });
        },
        (err) => internalServerErrorPage(res)(err),
    );
};

const voorkeurenFormDataToObject = (formData: any): IPlaatsvoorkeurRow => ({
    marktId: formData.marktId,
    erkenningsNummer: formData.erkenningsNummer,
    plaatsId: formData.plaatsId,
    priority: parseInt(formData.priority, 10),
});

export const updatePlaatsvoorkeuren = (
    req: GrantedRequest,
    res: Response,
    next: NextFunction,
    marktId: string,
    erkenningsNummer: string,
) => {
    const { redirectTo } = req.body;
    const userEmail = getKeycloakUser(req).email;

    const ignoreEmptyVoorkeur = (voorkeur: IPlaatsvoorkeurRow) => !!voorkeur.plaatsId;

    const insertFormData = () => {
        if (req.body.plaatsvoorkeuren) {
            console.log(`${req.body.plaatsvoorkeuren.length} (nieuwe) voorkeuren opslaan...`);
            console.log(req.body.plaatsvoorkeuren);
            const voorkeuren = req.body.plaatsvoorkeuren
                .map(voorkeurenFormDataToObject)
                .map(
                    (plaatsvoorkeur: IPlaatsvoorkeurRow): IPlaatsvoorkeurRow => ({
                        ...plaatsvoorkeur,
                        erkenningsNummer,
                    }),
                )
                .filter(ignoreEmptyVoorkeur);

            return updatePlaatsvoorkeur(voorkeuren, userEmail);
        } else {
            return deletePlaatsvoorkeurenByMarktAndKoopman(marktId, erkenningsNummer, userEmail);
        }
    };

    const insertAlgVoorkeurFormData = () => {
        console.log('algemene voorkeuren opslaan...');

        const vk = {
            erkenningsNummer,
            marktId,
            minimum: req.body.minimum,
            branches: null,
            maximum: req.body.maximum,
            anywhere: !!req.body.anywhere,
        };
        return updateMarktVoorkeur(vk, userEmail);
    };

    if (parseInt(req.body.maximum) > parseInt(req.body.maxNumKramen)) {
        const formError = 'Sorry, het maximale aantal kramen voor deze markt is ' + req.body.maxNumKramen;
        return res.redirect(`./?error=${formError}`);
    }

    insertFormData()
        .then(insertAlgVoorkeurFormData)
        .then(
            () => res.status(HTTP_CREATED_SUCCESS).redirect(redirectTo),
            (error) => internalServerErrorPage(res)(error),
        );
};
