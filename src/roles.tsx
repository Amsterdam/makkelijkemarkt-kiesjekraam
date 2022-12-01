import { GrantedRequest } from 'keycloak-connect'
import { Roles } from './authentication'

export const getRolebasedHomeURL = (role: string) => {
    switch (role) {
        case Roles.MARKTMEESTER:
        case Roles.MARKTBEWERKER:
            return '/markt/'
        case Roles.KRAMENZETTER:
            return '/kramenzetter/'
        default:
            // Typical for marktondernemer
           return '/dashboard/'
    }
}

export const getTitleForRole = (role: string) => {
    return role && role.charAt(0).toUpperCase() + role.slice(1) || ''
}

export const isMarktondernemer = (req: GrantedRequest) => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(Roles.MARKTONDERNEMER)
    );
};

export const isMarktmeester = (req: GrantedRequest) => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(Roles.MARKTMEESTER)
    );
};

export const isMarktBewerker = (req: GrantedRequest) => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(Roles.MARKTBEWERKER)
    );
}

export const isKramenzetter = (req: GrantedRequest) => {
    const accessToken = req.kauth.grant.access_token.content;

    return (
        !!accessToken.resource_access[process.env.IAM_CLIENT_ID] &&
        accessToken.resource_access[process.env.IAM_CLIENT_ID].roles.includes(Roles.KRAMENZETTER)
    );
}

export const getAllowedMarketsFromToken = (req: GrantedRequest) => {
    return req.kauth.grant.access_token.content?.markten;
}
