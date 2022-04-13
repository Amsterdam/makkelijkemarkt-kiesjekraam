import { Request, Response, NextFunction } from 'express';
import {
    getMarkt,
    getOndernemersByMarkt,
    getPlaatsvoorkeurenByMarkt,
    getIndelingVoorkeuren,
    getAanmeldingenByMarktAndDate,
    getToewijzingen
} from '../makkelijkemarkt-api';
import {
    getCalculationInput,
    getSollicitantenlijstInput,
    getVoorrangslijstInput,
    getToewijzingslijst,
} from '../pakjekraam-api';
import { internalServerErrorPage } from '../express-util';

import { Roles } from '../authentication';
import { GrantedRequest } from 'keycloak-connect';
import { getKeycloakUser } from '../keycloak-api';
import { IMarktondernemer, IRSVP } from 'markt.model';


export const vasteplaatshoudersPage = (req: GrantedRequest, res: Response) => {
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getCalculationInput(req.params.marktId, datum).then((data: any) => {
        res.render('VastplaatshoudersPage', {
            data,
            datum,
            type,
            role: Roles.MARKTMEESTER,
            user: getKeycloakUser(req)
        });
    }, internalServerErrorPage(res));
};

export const sollicitantenPage = (req: Request, res: Response) => {
    const datum = req.params.datum;
    const type = 'sollicitanten';
    const role = Roles.MARKTMEESTER;
    getSollicitantenlijstInput(req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, role });
        },
        internalServerErrorPage(res),
    );
};

const isVast = (ondernemer: IMarktondernemer): boolean => {
    return ondernemer.status === 'vpl' ||
           ondernemer.status === 'tvpl' ||
           ondernemer.status === 'tvplz' ||
           ondernemer.status === 'vkk';
}

const hasVastePlaatsen = (ondernemer: IMarktondernemer): boolean => {
    return ondernemer.plaatsen &&
           ondernemer.plaatsen.length > 0;
}

export const isAanwezig = (
    ondernemer: IMarktondernemer,
    aanmeldingen: IRSVP[],
    marktDate: Date
) => {
    const { absentFrom = null, absentUntil = null } = ondernemer.voorkeur || {};
    if (
        absentFrom && absentUntil &&
        marktDate >= new Date(absentFrom) &&
        marktDate <= new Date(absentUntil)
    ) {
        return false;
    }

    const rsvp = aanmeldingen.find(({ erkenningsNummer }) =>
        erkenningsNummer === ondernemer.erkenningsNummer
    );
    return isVast(ondernemer) && hasVastePlaatsen(ondernemer) ?
           !rsvp || !!rsvp.attending || rsvp.attending === null :
           !!rsvp && !!rsvp.attending;
}

export const afmeldingenVasteplaatshoudersPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    getToewijzingslijst(marktId, datum)
        .then( data => {
                const { ondernemers, aanmeldingen } = data;
                const vasteplaatshouders = ondernemers.filter(ondernemer => ondernemer.status === 'vpl');
                const vasteplaatshoudersAfwezig = vasteplaatshouders.filter( ondernemer => {
                    return !isAanwezig(ondernemer, aanmeldingen, new Date(datum));
                });

                const role = Roles.MARKTMEESTER;

                res.render('AfmeldingenVasteplaatshoudersPage', {
                    data,
                    vasteplaatshoudersAfgemeld: vasteplaatshoudersAfwezig,
                    markt: data.markt,
                    datum,
                    role,
                    user: getKeycloakUser(req)
                });
            },
            internalServerErrorPage(res),
        )
        .catch(next);
};


export const voorrangslijstPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;

    getVoorrangslijstInput(req.params.marktId, req.params.datum).then( result => {

            let { ondernemers } = result;
            const { aanmeldingen, voorkeuren, markt, toewijzingen, aLijst, algemenevoorkeuren } = result;

            ondernemers = markt.kiesJeKraamFase === 'wenperiode' ? ondernemers.filter(ondernemer => ondernemer.status !== 'vpl') : ondernemers;
            const toewijzingenOptional = markt.kiesJeKraamFase === 'wenperiode' ? [] : toewijzingen;

            ondernemers.map(ondernemer => {
                ondernemer.voorkeur = algemenevoorkeuren.find(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer);
                return ondernemer;
            });

            ondernemers = ondernemers.filter( ondernemer => {
                if (ondernemer.voorkeur) {
                    return !ondernemer.voorkeur.absentFrom && !ondernemer.voorkeur.absentUntil;
                } else {
                    return true;
                }
            });

            const role = Roles.MARKTMEESTER;
            const type = markt.kiesJeKraamFase;

            res.render('VoorrangslijstPage', {
                ondernemers,
                aanmeldingen,
                voorkeuren,
                aLijst,
                markt,
                datum,
                type,
                toewijzingen: toewijzingenOptional,
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req)
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const ondernemersNietIngedeeldPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getOndernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getMarkt(marktId),
        getToewijzingen(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, markt, toewijzingen, algemenevoorkeuren]) => {

            const role = Roles.MARKTMEESTER;

            res.render('OndernemersNietIngedeeldPage', {
                ondernemers,
                aanmeldingen,
                markt,
                datum,
                toewijzingen,
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req)
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};


export const voorrangslijstVolledigPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;

    getVoorrangslijstInput(req.params.marktId, req.params.datum).then( result => {

            const { ondernemers, aanmeldingen, voorkeuren, markt, aLijst, algemenevoorkeuren } = result;
            const ondernemersFiltered = ondernemers.filter(ondernemer => ondernemer.status !== 'vpl');
            // const toewijzingenOptional = markt.fase === 'wenperiode' ? [] : toewijzingen;

            const type = 'wenperiode';
            const role = Roles.MARKTMEESTER;

            res.render('VoorrangslijstPage', {
                ondernemers: ondernemersFiltered,
                aanmeldingen,
                voorkeuren,
                aLijst,
                markt,
                datum,
                type,
                toewijzingen: [],
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req)
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const alleSollicitantenPage = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getOndernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getPlaatsvoorkeurenByMarkt(marktId),
        getMarkt(marktId),
        getToewijzingen(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {
            const role = Roles.MARKTMEESTER;
            res.render('AanwezigheidLijst', {
                ondernemers: ondernemers.filter(ondernemer => ondernemer.status !== 'vpl' ),
                aanmeldingen,
                plaatsvoorkeuren,
                toewijzingen,
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                algemenevoorkeuren,
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const sollicitantentAanwezigheidLijst = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getOndernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getPlaatsvoorkeurenByMarkt(marktId),
        getMarkt(marktId),
        getToewijzingen(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {

            const role = Roles.MARKTMEESTER;
            res.render('AanwezigheidLijstPage', {
                ondernemers: ondernemers.filter(ondernemer => ondernemer.status !== 'vpl' ),
                aanmeldingen,
                plaatsvoorkeuren,
                toewijzingen,
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                algemenevoorkeuren,
                title: 'Alle sollicitanten'
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

export const alleOndernemersAanwezigheidLijst = (req: GrantedRequest, res: Response, next: NextFunction) => {

    const datum = req.params.datum;
    const marktId = req.params.marktId;

    Promise.all([
        getOndernemersByMarkt(marktId),
        getAanmeldingenByMarktAndDate(marktId, datum),
        getPlaatsvoorkeurenByMarkt(marktId),
        getMarkt(marktId),
        getToewijzingen(marktId, datum),
        getIndelingVoorkeuren(marktId),
    ]).then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {

            const role = Roles.MARKTMEESTER;
            res.render('AanwezigheidLijst', {
                ondernemers,
                aanmeldingen,
                plaatsvoorkeuren,
                toewijzingen,
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                algemenevoorkeuren,
                title: 'Alle ondernemers'
            });
        },
        internalServerErrorPage(res),
    ).catch(next);
};

