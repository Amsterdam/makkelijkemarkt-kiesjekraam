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
import { getKeycloakUser } from '../keycloak-api';

const router = express.Router();
const koopmanRoutes = [
    '/koopman/erkenningsnummer/:erkenningsNummer',
    '/rsvp/koopman/:erkenningsNummer',
    '/rsvp_pattern/koopman/:erkenningsNummer',
    '/marktvoorkeur/koopman/:erkenningsNummer',
    '/rsvp',
    '/rsvp_pattern',
];
const subroutes = [
    '/branche',
    '/branche/:brancheId',
    '/branche/all',
    '/obstakel/all',
    '/plaatseigenschap/all',
    '/markt/:marktId',
    '/markt/:marktId/marktconfiguratie/latest',
    '/markt/:marktId/marktconfiguratie',
    ...koopmanRoutes,
];

const brancheRoutesWithCacheInvalidation = ['/branche', '/branche/:brancheId'];
const MarktconfiguratieRoutesWithCacheInvalidation = ['/markt/:marktId/marktconfiguratie'];

const isProtectionDisabled = Boolean(process.env.DISABLE_MM_API_DISPATCH_PROTECTION);
const applyProtectionIfNeeded = (protectFunction: any) => {
    if (isProtectionDisabled) {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }
    return protectFunction;
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
    const protectFunction = keycloak.protect((token: any, req: GrantedRequest) => {

        // Marktbewerkers are allowed to edit preferences of koopmannen,
        // marktmeesters have read access in almost all cases
        if (token.hasRole(Roles.MARKTBEWERKER) ||
            (token.hasRole(Roles.MARKTMEESTER) && !['POST','PUT'].includes(req.method))) {
            return true
        }

        if (koopmanRoutes.includes(subroute)) {
            const isOwnErkenningsNummer = req.params.erkenningsNummer === token.content.preferred_username;
            if (req.params.erkenningsNummer && !isOwnErkenningsNummer) {
                return false;
            }
            return token.hasRole(Roles.MARKTONDERNEMER);
        }
        return false;
    });
    router.all(subroute, applyProtectionIfNeeded(protectFunction), async (req: GrantedRequest, res: Response) => {
        try {
            const headers = { user: getKeycloakUser(req)?.email }
            const result = await callApiGeneric(req.url, req.method.toLowerCase() as HttpMethod, req.body, headers);
            _invalidateCache(subroute, req);
            return res.send(result);
        } catch (error) {
            res.status(error.response?.status || 500);
            return res.send({ statusText: error.response?.statusText, message: error.response?.data });
        }
    });
});

router.get(
    '/ondernemer/markt/:marktId',
    applyProtectionIfNeeded(keycloak.protect()),
    async (req: GrantedRequest, res: Response) => {
        const url = `/markt/${req.params.marktId}`;
        try {
            const result: any = await callApiGeneric(url, 'get');
            const { kiesJeKraamMededelingTekst, kiesJeKraamMededelingTitel, marktDagen } = result;
            res.send({ kiesJeKraamMededelingTekst, kiesJeKraamMededelingTitel, marktDagen });
        } catch (error) {
            res.status(error.response.status);
            res.send({ statusText: error.response.statusText, message: error.response.data });
        }
    },
);

export default router;
