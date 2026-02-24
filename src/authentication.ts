import Keycloak from 'keycloak-connect';
import session from 'express-session';

export const Roles = {
    MARKTMEESTER: 'marktmeester',
    MARKTONDERNEMER: 'marktondernemer',
    MARKTBEWERKER: 'marktbewerker',
    KRAMENZETTER: 'kramenzetter'
};

export const hasEitherRole = (roles: string[], token: Keycloak.Token) =>
    roles.reduce((total, role) => {
        return total || token.hasRole(role);
    }, false);

const memoryStore = new session.MemoryStore();

export const keycloak = new Keycloak(
    {
        store: memoryStore,
    },
    {
        realm: process.env.IAM_REALM,
        'auth-server-url': process.env.IAM_URL,
        'ssl-required': 'external',
        resource: process.env.IAM_CLIENT_ID,
        credentials: {
            secret: process.env.IAM_CLIENT_SECRET,
        },
        'confidential-port': 0,
    },
);

export const sessionMiddleware = () =>
    session({
        store: memoryStore,
        secret: process.env.APP_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
        },
    });
