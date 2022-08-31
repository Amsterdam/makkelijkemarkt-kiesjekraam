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
const koopmanRoutesWithErkenningsNummer = [
    '/koopman/erkenningsnummer/:erkenningsNummer',
    '/rsvp/koopman/:erkenningsNummer',
    '/rsvp_pattern/koopman/:erkenningsNummer',
    '/marktvoorkeur/koopman/:erkenningsNummer',
];
const koopmanRoutes = [...koopmanRoutesWithErkenningsNummer, '/rsvp', '/rsvp_pattern'];
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
const applyProtectionIfNeeded = (subroute: string) => {
    if (isProtectionDisabled) {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }
    return keycloak.protect((token: any, req: GrantedRequest) => {
        console.log('KEYCLOAK TOKEN', token.content.preferred_username, req.params);
        if (token.hasRole(Roles.MARKTBEWERKER)) {
            return true;
        }

        if (koopmanRoutes.includes(subroute)) {
            const isOwnErkenningsNummer = req.params.erkenningsNummer === token.content.preferred_username;
            if (koopmanRoutesWithErkenningsNummer.includes(subroute) && !isOwnErkenningsNummer) {
                return false;
            }
            return token.hasRole(Roles.MARKTONDERNEMER);
        }
        return false;
    });
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
    router.all(subroute, applyProtectionIfNeeded(subroute), async (req: GrantedRequest, res: Response) => {
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

router.get('/markt/:marktId', keycloak.protect(), async (req: GrantedRequest, res: Response) => {
    const url = `/markt/${req.params.marktId}`;
    try {
        const result: any = await callApiGeneric(url, 'get');
        const { kiesJeKraamMededelingTekst, kiesJeKraamMededelingTitel, marktDagen } = result;
        res.send({ kiesJeKraamMededelingTekst, kiesJeKraamMededelingTitel, marktDagen });
    } catch (error) {
        res.status(error.response.status);
        res.send({ statusText: error.response.statusText, message: error.response.data });
    }
});

export default router;
