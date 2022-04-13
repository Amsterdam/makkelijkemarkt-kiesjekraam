import { NextFunction, Request, Response } from 'express';
import { GrantedRequest } from 'keycloak-connect';
import moment from 'moment';

import {
    internalServerErrorPage,
    HTTP_CREATED_SUCCESS,
    getQueryErrors,
} from '../express-util';

import {
    getKeycloakUser
} from '../keycloak-api';

import {
    getMarktBasics,
    getVoorkeurByMarktEnOndernemer,
    getOndernemer,
    updateMarktVoorkeur,
} from '../makkelijkemarkt-api';

import {
    convertVoorkeur,
} from '../pakjekraam-api';

import {
    voorkeurenFormData,
} from '../model/voorkeur.functions';


export const algemeneVoorkeurenFormCheckForError = (body: any, role: string) => {

    let error = null;

    if (role === 'marktmeester') {
        const { absentFrom, absentUntil } = body;
        if (absentUntil) {
            if ( !moment(absentUntil, 'DD-MM-YYYY', true).isValid()) {
                error = 'Datum afwezigheid vanaf heeft niet het juiste format. Gebruik dd-mm-yyyy.';
            }
        }
        if (absentFrom) {
            if ( !moment(absentFrom, 'DD-MM-YYYY',true).isValid()) {
                error = 'Datum afwezigheid tot en met heeft niet het juiste format. Gebruik dd-mm-yyyy.';
            }
        }
    }

    return error;
};

export const updateMarketPreferences = (req: Request, res: Response, next: NextFunction, erkenningsNummer: string, role: string) => {

    const data = voorkeurenFormData(req.body);
    const formError = algemeneVoorkeurenFormCheckForError(req.body, role);

    if (formError !== null) {
        return res.redirect(`./?error=${formError}`);
    }

    updateMarktVoorkeur(convertVoorkeur(data));
    res.status(HTTP_CREATED_SUCCESS).redirect(req.body.next ? req.body.next : '/')
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
            user: getKeycloakUser(req)
        });

    }, internalServerErrorPage(res));
};
