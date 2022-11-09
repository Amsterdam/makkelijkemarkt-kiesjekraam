import {
    requireEnv,
    requireOne,
    logs2csv,
    toISODate
} from './util';
import {
    Credentials,
} from 'keycloak-admin/lib/utils/auth';
import {
    GrantedRequest,
} from 'keycloak-connect';
import KeycloakAdminClient from 'keycloak-admin';
import { IKeycloakUserData } from 'model/markt.model';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';

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
        .then(
            () => true,
            () => false,
        );

export const getAllUsers = ():Promise<UserRepresentation[]> => getKeycloakAdmin().then(kcAdminClient => kcAdminClient.users.find({ max: -1 }));

export const getAllUsersForExport = () => getAllUsers().then((keycloakUsers:UserRepresentation[]) => {
    const usersParsed = keycloakUsers.map((userData: UserRepresentation) => {
        return {
            id: userData.id,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            createdAt: toISODate(new Date(userData.createdTimestamp)),
        } as IKeycloakUserData
    })

    const csv = logs2csv(usersParsed, ';');
    return csv
})

module.exports = {
    getAllUsers,
    getKeycloakAdmin,
    getKeycloakUser,
    userExists,
    getAllUsersForExport
};
