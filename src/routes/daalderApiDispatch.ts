import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import { keycloak, Roles } from '../authentication';
import { GrantedRequest } from 'keycloak-connect';
import { getKeycloakUser } from '../keycloak-api';
import { getMarkt, getOndernemer, getRsvps, getRsvpPatterns, saveRsvps, saveRsvpPatterns, getVoorkeurByMarktEnOndernemer } from '../daalder-api';


type validateFunctionType = (token: any, req: Request) => boolean;

interface ISubRoute {
  route: string
  getHandler?: (req: GrantedRequest) => Promise<any>
  postHandler?: (req: GrantedRequest, user: string) => Promise<any>
  validateHandler?: validateFunctionType
}


const SIMULATED_ERKENNINGS_NUMMER = '1234567890'
const IS_PROTECTION_DISABLED = Boolean(process.env.DISABLE_DAALDER_API_DISPATCH_PROTECTION);

const validateOwnErkenningsNummerInReqParams: validateFunctionType = (token, req) => {
    const isOwnErkenningsNummer = req.params.erkenningsNummer === token.content.preferred_username;
    if (req.params.erkenningsNummer) {
        return (isOwnErkenningsNummer || token.hasRole(Roles.MARKTBEWERKER) || token.hasRole(Roles.MARKTMEESTER));
    }
    return true;
};

const validateOwnErkenningsNummerInRsvps: validateFunctionType = (token, req) => {
    if (req.body['rsvps']) {
        return req.body['rsvps'].every((item: any) => item['koopman'] == token.content.preferred_username);
    } else {
        return req.body['koopman'] == token.content.preferred_username
    }
};

const validateOwnErkenningsNummerInRsvpPattern: validateFunctionType = (token, req) => {
    return req.body['erkenningsNummer'] == token.content.preferred_username
};

const router = express.Router();

const subroutes: ISubRoute[] = [
    {route: '/koopman/erkenningsnummer/:erkenningsNummer', getHandler: (req: GrantedRequest) => getOndernemer(req.params.erkenningsNummer)},
    {route: '/ondernemer/markt/:marktId', getHandler: (req: GrantedRequest) => getMarkt(req.params.marktId)},
    {route: '/voorkeur/markt/:marktId/koopman/:erkenningsNummer', getHandler: (req: GrantedRequest) => getVoorkeurByMarktEnOndernemer(req.params.marktId, req.params.erkenningsNummer)},
    {route: '/rsvp/koopman/:erkenningsNummer', getHandler: (req: GrantedRequest) => getRsvps(req.params.erkenningsNummer)},
    {route: '/rsvp_pattern/koopman/:erkenningsNummer', getHandler: (req: GrantedRequest) => getRsvpPatterns(req.params.erkenningsNummer)},
    {
        route: '/rsvp',
        postHandler: (req: GrantedRequest, user: string) => saveRsvps(req.body, user),
        validateHandler: validateOwnErkenningsNummerInRsvps
    },
    {
        route: '/rsvp_pattern',
        postHandler: (req: GrantedRequest, user: string) => saveRsvpPatterns(req.body, user),
        validateHandler: validateOwnErkenningsNummerInRsvpPattern
    },
];


const applyProtectionFactory = (validateFunction: validateFunctionType): RequestHandler => {
    if (IS_PROTECTION_DISABLED) {
        // This flow can be used for local testing without Keycloak setup
        const SIMULATED_ERKENNINGS_NUMMER = '1234567890';
        const simulatedToken = {
            hasRole: (role: string) => role === Roles.MARKTONDERNEMER,
            content: {preferred_username: SIMULATED_ERKENNINGS_NUMMER},
        }
        return (req: Request, res: Response, next: NextFunction) => {
            const isValid = validateFunction(simulatedToken, req);
            if (isValid) {
            next();
            } else {
            res.status(403).send({ message: 'Forbidden' });
            }
        }
    } else {
        return keycloak.protect(validateFunction);
    }
};


subroutes.forEach((subroute) => {
    const {route, getHandler, postHandler, validateHandler = validateOwnErkenningsNummerInReqParams}: ISubRoute = subroute;

    if (getHandler) {
        router.get(route, applyProtectionFactory(validateHandler), async (req: GrantedRequest, res: Response) => {
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
        router.post(route, applyProtectionFactory(validateHandler), async (req: GrantedRequest, res: Response) => {
            try {
                const user = IS_PROTECTION_DISABLED ? 'security_disabled' : getKeycloakUser(req)?.email || 'unknown_user';
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
