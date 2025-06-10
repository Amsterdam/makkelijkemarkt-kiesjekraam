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

import { createGenericBranche, getGenericBranches } from 'daalder-api';
import { Axios, AxiosResponse } from 'axios';

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
    '/branche',                 // POST
    '/branche/:brancheId',      // PUT, DELETE
    '/branche/all',             // GET
    '/obstakel/all',            // GET
    '/plaatseigenschap/all',    // GET
    '/markt/:marktId',
    '/markt/:marktId/marktconfiguratie/latest',
    '/markt/:marktId/marktconfiguratie',
    '/allocation/markt/:marktId/date/:date',
    '/sollicitaties/markt/:marktId',
    '/plaatsvoorkeur/markt/:marktId',
    '/allocation_v2/markt/:marktId/date/:date',
    '/allocation_v2/:id',
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
            const headers = { user: isProtectionDisabled ? 'security_disabled' : getKeycloakUser(req)?.email }
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


// ================ Daalder API routes ================
interface IDaalderRoute {
    route_inbound: string;
    method: HttpMethod;
    api_call: (req: GrantedRequest, res: Response) => Promise<AxiosResponse>;
}

const daalderRoutes: IDaalderRoute[] = [
    {
        route_inbound: 'branche/all',
        method: 'get',
        api_call: (req, res) => getGenericBranches(),
    },
    {
        route_inbound: 'branche/:brancheId',
        method: 'get',
        api_call: (req, res) => getGenericBranch(req.params.brancheId),
    }
]


const createDaalderRoute = (route: IDaalderRoute) => {
    router[route.method](route.route_inbound, async (req: GrantedRequest, res: Response) => {
        try {
            const daalder_api_response = await route.api_call(req, res)
            res.status(daalder_api_response.status).json(daalder_api_response.data);
        } catch (error) {
            res.status(error.response?.status || 500).json({
                messgage: error.message,
                error: error.response?.data || 'An error occurred while processing the request.',
            });
        }
    })
}

daalderRoutes.forEach(createDaalderRoute);





export default router;
