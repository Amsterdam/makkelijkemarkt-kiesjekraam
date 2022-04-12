import { createClient } from 'redis';
import Keycloak from 'keycloak-connect';
import session from 'express-session';
import { RedisClient } from 'redis-client';
let RedisStore = require("connect-redis")(session)

const redisHost: string = process.env.REDIS_HOST;
const redisPort: string = process.env.REDIS_PORT;
const redisPassword: string = process.env.REDIS_PASSWORD;

let connected = false;

const redisClient = new RedisClient().getClient();

const sessionStore = new RedisStore({ client: redisClient });

export const Roles = {
    MARKTBUREAU: 'marktbureau',
    MARKTMEESTER: 'marktmeester',
    MARKTONDERNEMER: 'marktondernemer',
    MARKTBEWERKER: 'marktbewerker',
};

export const keycloak = new Keycloak(
    {
        store: sessionStore,
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
        store: sessionStore,
        secret: process.env.APP_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
        },
    });
