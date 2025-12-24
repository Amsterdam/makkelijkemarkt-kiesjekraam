import {
    getAanmeldingenByMarktAndDate,
    getIndelingVoorkeuren,
    // getMarkt,
    getOndernemersByMarkt,
    getPlaatsvoorkeurenByMarkt,
    getToewijzingen,
} from '../makkelijkemarkt-api';
import {
    getMarkt,
    getMarktAanwezigheid,
} from '../daalder-api';
import {
    getCalculationInput,
    getSollicitantenlijstInput,
    getToewijzingslijst,
    getVoorrangslijstInput,
} from '../pakjekraam-api';
import {
    IMarktondernemer,
    IRSVP,
} from 'model/markt.model';
import {
    NextFunction,
    Request,
    Response,
} from 'express';
import {
    getKeycloakUser,
} from '../keycloak-api';
import {
    GrantedRequest,
} from 'keycloak-connect';
import {
    internalServerErrorPage,
} from '../express-util';
import {
    isVast,
} from '../domain-knowledge';
import {
    Roles,
} from '../authentication';
import { isMarktBewerker } from '../roles'

export const vasteplaatshoudersPage = (req: GrantedRequest, res: Response) => {
    const datum = req.params.datum;
    const type = 'vasteplaatshouders';
    getCalculationInput(req.params.marktId, datum).then((data: any) => {
        res.render('VastplaatshoudersPage', {
            data,
            datum,
            type,
            role: Roles.MARKTMEESTER,
            user: getKeycloakUser(req),
        });
    }, internalServerErrorPage(res));
};

export const sollicitantenPage = (req: GrantedRequest, res: Response) => {
    const datum = req.params.datum;
    const type = 'sollicitanten';
    const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER
    getSollicitantenlijstInput(req.params.marktId, req.params.datum).then(
        ({ ondernemers, aanmeldingen, voorkeuren, markt }) => {
            res.render('SollicitantenPage', { ondernemers, aanmeldingen, voorkeuren, markt, datum, type, role });
        },
        internalServerErrorPage(res),
    );
};

const hasVastePlaatsen = (ondernemer: IMarktondernemer): boolean => {
    return ondernemer.plaatsen && ondernemer.plaatsen.length > 0;
};

export const isAanwezig = (ondernemer: IMarktondernemer, aanmeldingen: IRSVP[], marktDate: Date) => {
    const { absentFrom = null, absentUntil = null } = ondernemer.voorkeur || {};
    if (absentFrom && absentUntil && marktDate >= new Date(absentFrom) && marktDate <= new Date(absentUntil)) {
        return false;
    }

    const rsvp = aanmeldingen.find(({ erkenningsNummer }) => erkenningsNummer === ondernemer.erkenningsNummer);
    return isVast(ondernemer.status) && hasVastePlaatsen(ondernemer)
        ? !rsvp || !!rsvp.attending || rsvp.attending === null
        : !!rsvp && !!rsvp.attending;
};

export const afmeldingenVasteplaatshoudersPage = (req: GrantedRequest, res: Response, next: NextFunction) => {
    const datum = req.params.datum;
    const marktId = req.params.marktId;

    getToewijzingslijst(marktId, datum)
        .then(data => {
            const { ondernemers, aanmeldingen } = data;
            const vasteplaatshouders = ondernemers.filter(ondernemer => isVast(ondernemer.status));
            const vasteplaatshoudersAfwezig = vasteplaatshouders.filter(ondernemer => {
                return !isAanwezig(ondernemer, aanmeldingen, new Date(datum));
            });

            const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER

            res.render('AfmeldingenVasteplaatshoudersPage', {
                data,
                vasteplaatshoudersAfgemeld: vasteplaatshoudersAfwezig,
                markt: data.markt,
                datum,
                role,
                user: getKeycloakUser(req),
            });
        }, internalServerErrorPage(res))
        .catch(next);
};

export const voorrangslijstPage = (req: GrantedRequest, res: Response, next: NextFunction) => {
    const datum = req.params.datum;

    getVoorrangslijstInput(req.params.marktId, req.params.datum)
        .then(result => {
            const { ondernemers, aanmeldingen, voorkeuren, markt, toewijzingen, aLijst, bLijst, algemenevoorkeuren } = result;

            ondernemers.map(ondernemer => {
                ondernemer.voorkeur = algemenevoorkeuren.find(
                    voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer,
                );
                return ondernemer;
            });

            const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER
            const type = markt.kiesJeKraamFase;

            res.render('VoorrangslijstPage', {
                ondernemers,
                aanmeldingen,
                voorkeuren,
                aLijst,
                bLijst,
                markt,
                datum,
                type,
                toewijzingen: toewijzingen,
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req),
            });
        }, internalServerErrorPage(res))
        .catch(next);
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
    ])
        .then(([ondernemers, aanmeldingen, markt, toewijzingen, algemenevoorkeuren]) => {
            const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER

            res.render('OndernemersNietIngedeeldPage', {
                ondernemers,
                aanmeldingen,
                markt,
                datum,
                toewijzingen,
                algemenevoorkeuren,
                role,
                user: getKeycloakUser(req),
            });
        }, internalServerErrorPage(res))
        .catch(next);
};

// export const alleSollicitantenPage = (req: GrantedRequest, res: Response, next: NextFunction) => {
//     const datum = req.params.datum;
//     const marktId = req.params.marktId;

//     Promise.all([
//         getOndernemersByMarkt(marktId),
//         getAanmeldingenByMarktAndDate(marktId, datum),
//         getPlaatsvoorkeurenByMarkt(marktId),
//         getMarkt(marktId),
//         getToewijzingen(marktId, datum),
//         getIndelingVoorkeuren(marktId),
//     ])
//         .then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {
//             const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER
//             res.render('AanwezigheidLijst', {
//                 ondernemers: ondernemers.filter(ondernemer => !isVast(ondernemer.status)),
//                 aanmeldingen,
//                 plaatsvoorkeuren,
//                 toewijzingen,
//                 markt,
//                 datum,
//                 role,
//                 user: getKeycloakUser(req),
//                 algemenevoorkeuren,
//             });
//         }, internalServerErrorPage(res))
//         .catch(next);
// };

export const sollicitantentAanwezigheidLijst = (req: GrantedRequest, res: Response, next: NextFunction) => {
    const datum = req.params.datum;
    const marktId = req.params.marktId;

    console.log('sollicitantentAanwezigheidLijst', datum, marktId)

    Promise.all([
        getMarktAanwezigheid(marktId, datum),
        getMarkt(marktId),
    ])
        .then(([ondernemers, markt]) => {
            const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER

            res.render('AanwezigheidLijstPage', {
                ondernemers: ondernemers.filter(ondernemer => !isVast(ondernemer.kind.toLowerCase())),
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                title: 'Alle sollicitanten',
            });
        }, internalServerErrorPage(res))
        .catch(next);
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
    ])
        .then(([ondernemers, aanmeldingen, plaatsvoorkeuren, markt, toewijzingen, algemenevoorkeuren]) => {
            const role = isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER
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
                title: 'Alle ondernemers',
            });
        }, internalServerErrorPage(res))
        .catch(next);
};
