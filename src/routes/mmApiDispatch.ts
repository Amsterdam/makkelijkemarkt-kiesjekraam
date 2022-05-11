import {
    CACHE_KEY_GENERIC_BRANCHES,
    callApiGeneric,
    getCacheKeyForMarktConfiguratie,
    HttpMethod,
    invalidateCache,
} from '../makkelijkemarkt-api';
import express, { NextFunction, Request, Response } from 'express';
import { keycloak, Roles } from '../authentication';
import { GrantedRequest } from 'keycloak-connect';

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

const brancheRoutesWithCacheInvalidation = ['/branche', '/branche/:brancheId'];

const MarktconfiguratieRoutesWithCacheInvalidation = ['/markt/:marktId/marktconfiguratie'];

const isProtectionDisabled = Boolean(process.env.DISABLE_MM_API_DISPATCH_PROTECTION);
const applyProtectionIfNeeded = () => {
    if (isProtectionDisabled) {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }
    return keycloak.protect(token => token.hasRole(Roles.MARKTBEWERKER));
};

const _invalidateCache = (subroute: string, req: GrantedRequest): void => {
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return;
    }
    if (brancheRoutesWithCacheInvalidation.includes(subroute)) {
        invalidateCache(CACHE_KEY_GENERIC_BRANCHES);
    }
    if (MarktconfiguratieRoutesWithCacheInvalidation.includes(subroute)) {
        invalidateCache(getCacheKeyForMarktConfiguratie(req.params.marktId));
    }
};

subroutes.forEach((subroute: string) => {
    router.all(subroute, applyProtectionIfNeeded(), async (req: GrantedRequest, res: Response) => {
        try {
            const result = await callApiGeneric(req.url, req.method.toLowerCase() as HttpMethod, req.body);
            _invalidateCache(subroute, req);
            return res.send(result);
        } catch (error) {
            res.status(error.response.status);
            return res.send({ statusText: error.response.statusText, message: error.response.data });
        }
    });
});

export default router;
