import {
    Request,
    Response,
} from 'express';
import {
    getKeycloakAdmin,
} from '../keycloak-api';
import {
    getTimezoneTime,
} from '../util';
import {
    internalServerErrorPage,
} from '../express-util';

export const serverHealth = (req: Request, res: Response) => {
    res.end('OK!');
};

export const serverTime = (req: Request, res: Response) => {
    res.end(String(getTimezoneTime()));
};

export const keycloakHealth = (req: Request, res: Response) => {
    getKeycloakAdmin()
        .then(kcAdminClient =>
            kcAdminClient.realms.findOne({
                realm: process.env.IAM_REALM,
            }),
        )
        .then(() => {
            res.end('Keycloak OK!');
        })
        .catch((err: Error) => {
            internalServerErrorPage(res)('Unable to connect to the Keycloak');
        });
};
