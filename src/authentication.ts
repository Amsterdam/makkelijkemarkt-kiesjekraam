import Keycloak from 'keycloak-connect';
import session from 'express-session';
import { createClient } from 'redis';
import RedisStore from 'connect-redis';

const createSessionStore = (): session.Store => {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;

    if (!redisUrl && !redisHost) {
        throw new Error('Missing Redis configuration. Set REDIS_URL or REDIS_HOST/REDIS_PORT for the session store.');
    }

    const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
    const sessionPrefix = process.env.REDIS_SESSION_PREFIX || 'mm-kiesjekraam:sess:';

    const redisClient = redisUrl
        ? createClient({ url: redisUrl })
        : createClient({
              socket: {
                  host: redisHost,
                  port: redisPort,
                  tls: process.env.APP_ENV !== 'local',
              },
              password: process.env.REDIS_PASSWORD || undefined,
          });

    redisClient.on('error', (err: unknown) => {
        console.error('[session][redis] client error', err);
    });

    redisClient.connect().catch((err: unknown) => {
        console.error('[session][redis] failed to connect', err);
        throw err;
    });

    const ttl = process.env.SESSION_TTL_SECONDS ? Number(process.env.SESSION_TTL_SECONDS) : undefined;

    return new RedisStore({
        client: redisClient as any,
        prefix: sessionPrefix,
        ttl,
    }) as unknown as session.Store;
};

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

const sessionStore = createSessionStore();

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
        proxy: true,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: true,
            secure: process.env.NODE_ENV === 'production',
        },
    });
