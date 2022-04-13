import KeycloakAdminClient from 'keycloak-admin';
import { requireEnv, requireOne } from './util';
import { GrantedRequest } from 'keycloak-connect';
import {Credentials} from "keycloak-admin/lib/utils/auth";

requireEnv('IAM_URL');
requireEnv('IAM_REALM');
requireEnv('IAM_ADMIN_USER');
requireEnv('IAM_ADMIN_PASS');
requireEnv('IAM_CLIENT_ID');
requireEnv('IAM_CLIENT_SECRET');

const clientConfig = {
    baseUrl: process.env.IAM_URL,
    realmName: process.env.IAM_REALM,
};

const authConfig: Credentials = {
    username: process.env.IAM_ADMIN_USER,
    password: process.env.IAM_ADMIN_PASS,
    grantType: 'password',
    clientId: process.env.IAM_CLIENT_ID,
    clientSecret: process.env.IAM_CLIENT_SECRET,
};

export const getKeycloakAdmin = () => {
    const kcAdminClient = new KeycloakAdminClient(clientConfig);

    return kcAdminClient.auth(authConfig).then(() => kcAdminClient);
};

export const getKeycloakUser = (req: GrantedRequest) => {
    return req.kauth.grant.access_token.content;
};

export const userExists = (username: string): Promise<boolean> =>
    getKeycloakAdmin()
        .then(kcAdminClient => kcAdminClient.users.findOne({ username } as any))
        .then(user => {
            return requireOne(user);
        })
        .then(() => true, () => false);

export const getAllUsers = () => getKeycloakAdmin().then(kcAdminClient => kcAdminClient.users.find({ max: -1 }));

module.exports = {
    getAllUsers,
    getKeycloakAdmin,
    getKeycloakUser,
    userExists,
};
