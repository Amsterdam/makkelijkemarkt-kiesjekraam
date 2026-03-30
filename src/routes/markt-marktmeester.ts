import {
    getMarkt,
    getMarktAanwezigheid,
} from '../daalder-api';
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
    internalServerErrorPage,
} from '../express-util';
import {
    isVast,
} from '../domain-knowledge';
import {
    Roles,
} from '../authentication';
import { isMarktBewerker } from '../roles'

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
                ondernemers: ondernemers.filter((ondernemer: any) => !isVast(ondernemer.kind.toLowerCase())),
                markt,
                datum,
                role,
                user: getKeycloakUser(req),
                title: 'Alle sollicitanten',
            });
        }, internalServerErrorPage(res))
        .catch(next);
};
