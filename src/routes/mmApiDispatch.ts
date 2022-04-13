import {
    callApiGeneric,
    HttpMethod,
} from '../makkelijkemarkt-api';
import express, {
    NextFunction,
    Request,
    Response,
} from 'express';
import {
    keycloak,
    Roles,
} from '../authentication';
import {
    GrantedRequest
} from 'keycloak-connect';

const router = express.Router();
const subroutes = [
    '/branche',
    '/branche/:brancheId',
    '/branche/all',
    '/obstakel/all',
    '/plaatseigenschap/all',
    '/markt/:marktId',
    '/markt/:marktId/marktconfiguratie/latest',
    '/markt/:marktId/marktconfiguratie',
];

const isProtectionDisabled = Boolean(process.env.DISABLE_MM_API_DISPATCH_PROTECTION);
const applyProtectionIfNeeded = () => {
    if (isProtectionDisabled) {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }
    return keycloak.protect(token => token.hasRole(Roles.MARKTBEWERKER));
};

subroutes.forEach((subroute: string) => {
    router.all(subroute, applyProtectionIfNeeded(), async (req: GrantedRequest, res: Response) => {
        try {
            const result = await callApiGeneric(req.url, req.method.toLowerCase() as HttpMethod, req.body);
            return res.send(result);
        } catch (error) {
            res.status(error.response.status);
            return res.send({ statusText: error.response.statusText, message: error.response.data });
        }
    });
});

export default router;
