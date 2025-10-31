import express, { NextFunction, Request, Response } from 'express';
import { keycloak, Roles } from '../authentication';
import { GrantedRequest } from 'keycloak-connect';
import { getKeycloakUser } from '../keycloak-api';
import { getMarkt, getOndernemer, getRsvps, getRsvpPatterns, saveRsvps, saveRsvpPatterns, getVoorkeurByMarktEnOndernemer } from '../daalder-api';

interface ISubRoute {
  route: string
  getHandler?: (req: GrantedRequest) => Promise<any>
  postHandler?: (req: GrantedRequest, user: string) => Promise<any>
}

const router = express.Router();

const subroutes: ISubRoute[] = [
    {route: '/koopman/erkenningsnummer/:erkenningsNummer', getHandler: (req: GrantedRequest) => getOndernemer(req.params.erkenningsNummer)},
    {route: '/ondernemer/markt/:marktId', getHandler: (req: GrantedRequest) => getMarkt(req.params.marktId)},
    {route: '/voorkeur/markt/:marktId/koopman/:erkenningsNummer', getHandler: (req: GrantedRequest) => getVoorkeurByMarktEnOndernemer(req.params.marktId, req.params.erkenningsNummer)},
    {route: '/rsvp/koopman/:erkenningsNummer', getHandler: (req: GrantedRequest) => getRsvps(req.params.erkenningsNummer)},
    {route: '/rsvp_pattern/koopman/:erkenningsNummer', getHandler: (req: GrantedRequest) => getRsvpPatterns(req.params.erkenningsNummer)},
    {route: '/rsvp', postHandler: (req: GrantedRequest, user: string) => saveRsvps(req.body, user)},
    {route: '/rsvp_pattern', postHandler: (req: GrantedRequest, user: string) => saveRsvpPatterns(req.body, user)},
];

const isProtectionDisabled = true // Boolean(process.env.DISABLE_DAALDER_API_DISPATCH_PROTECTION);
const applyProtectionIfNeeded = (protectFunction: any) => {
    if (isProtectionDisabled) {
        return (req: Request, res: Response, next: NextFunction) => {
            next();
        };
    }
    return protectFunction;
};

subroutes.forEach((subroute) => {
    const protectFunction = keycloak.protect((token: any, req: GrantedRequest) => {
        const isOwnErkenningsNummer = req.params.erkenningsNummer === token.content.preferred_username;
        if (req.params.erkenningsNummer && !isOwnErkenningsNummer) {
            return false;
        }
        return token.hasRole(Roles.MARKTONDERNEMER);
    });

    const {route, getHandler, postHandler}: ISubRoute = subroute;

    if (getHandler) {
        router.get(route, applyProtectionIfNeeded(protectFunction), async (req: GrantedRequest, res: Response) => {
            try {
                const result = await getHandler(req)
                return res.send(result);
            } catch (error) {
                res.status(error.response?.status || 500);
                return res.send({ statusText: error.response?.statusText, message: error.response?.data });
            }
        });
    }

    if (postHandler) {
        router.post(route, applyProtectionIfNeeded(protectFunction), async (req: GrantedRequest, res: Response) => {
            try {
                const user = isProtectionDisabled ? 'security_disabled' : getKeycloakUser(req)?.email || 'unknown_user';
                const result = await postHandler(req, user)
                // const result = await callApiGeneric(req.url, req.method.toLowerCase() as HttpMethod, req.body, headers);
                return res.send(result);
            } catch (error) {
                res.status(error.response?.status || 500);
                return res.send({ statusText: error.response?.statusText, message: error.response?.data });
            }
        });
    }
});

export default router;
