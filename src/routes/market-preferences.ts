import {
    // getMarktBasics,
    // getOndernemer,
    // getVoorkeurByMarktEnOndernemer,
    // updateMarktVoorkeur,
} from '../makkelijkemarkt-api';
import { getQueryErrors, HTTP_CREATED_SUCCESS, internalServerErrorPage } from '../express-util';
import { NextFunction, Request, Response } from 'express';
import { convertVoorkeur } from '../pakjekraam-api';
import { getKeycloakUser } from '../keycloak-api';
import { GrantedRequest } from 'keycloak-connect';
import moment from 'moment';
import { voorkeurenFormData } from '../model/voorkeur.functions';
import { Roles } from '../authentication'
import {
    getMarktBasics,
    getOndernemer,
    getVoorkeurByMarktEnOndernemer,
    updateVoorkeur,
} from '../daalder-api';

const isMakingChangesToLongTermAbsent = (data: any) => {
    return !!data.absentFrom || !!data.absentUntil
}

const algemeneVoorkeurenFormCheckForError = (body: any, role: string) => {
    let error = null;

    if (role === Roles.MARKTONDERNEMER && isMakingChangesToLongTermAbsent(body)) {
        return `Het is niet toegestaan om de absentie aan te passen.`
    }

    if (role === Roles.MARKTBEWERKER) {
        const { absentFrom, absentUntil } = body;
        if (absentUntil) {
            if (!moment(absentUntil, 'DD-MM-YYYY', true).isValid()) {
                error = 'Datum afwezigheid vanaf heeft niet het juiste format. Gebruik dd-mm-yyyy.';
            }
        }
        if (absentFrom) {
            if (!moment(absentFrom, 'DD-MM-YYYY', true).isValid()) {
                error = 'Datum afwezigheid tot en met heeft niet het juiste format. Gebruik dd-mm-yyyy.';
            }
        }
    }

    return error;
};

export const updateMarketPreferences = (
    req: GrantedRequest,
    res: Response,
    next: NextFunction,
    erkenningsNummer: string,
    role: string,
) => {
    const data = voorkeurenFormData(req.body);
    const formError = algemeneVoorkeurenFormCheckForError(req.body, role);

    if (formError !== null) {
        return res.redirect(`./?error=${formError}`);
    }

    // updateMarktVoorkeur(convertVoorkeur(data), getKeycloakUser(req).email);
    // res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next ? req.body.next : '/');
    updateVoorkeur(convertVoorkeur(data), getKeycloakUser(req).email)
        .then(() => {
            res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next ? req.body.next : '/');
        })
        .catch((err) => {
            next(err);
        });
};

export const marketPreferencesPage = (
    req: GrantedRequest,
    res: Response,
    erkenningsNummer: string,
    marktId: string,
    role: string,
    csrfToken: string,
) => {
    const next = req.query.next;
    const query = req.query;

    Promise.all([
        getMarktBasics(marktId),
        getOndernemer(erkenningsNummer),
        getVoorkeurByMarktEnOndernemer(marktId, erkenningsNummer),
    ]).then(([marktBasics, ondernemer, voorkeur]) => {
        res.render('AlgemeneVoorkeurenPage', {
            marktId,
            markt: marktBasics.markt,
            branches: marktBasics.branches,
            ondernemer,
            voorkeur,

            next,
            query,
            messages: getQueryErrors(req.query),
            role,
            csrfToken,
            user: getKeycloakUser(req),
        });
    }, internalServerErrorPage(res));
};
