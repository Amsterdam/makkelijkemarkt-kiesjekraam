import { RoleMappingPayload } from "keycloak-admin/lib/defs/roleRepresentation";
import { getKeycloakAdmin } from "./keycloak-api";
import { getOndernemer } from "./makkelijkemarkt-api";

var ROLES_NAME = 'default-roles-pakjekraam';
if (process.env.APP_ENV === 'acceptance') ROLES_NAME = 'default-roles-pakjekraam-acc';

getKeycloakAdmin().then(kcAdminClient => {
    Promise.all([
        kcAdminClient.roles.findOneByName({name: ROLES_NAME}),
        kcAdminClient.clients.find(),
        kcAdminClient.users.find({ max: -1 }),
    ]).then( ([keycloakDefaultRole, keycloakClients, keycloakUsers]) => {
        const keycloakClient = keycloakClients.filter( (client) => client.clientId === "pakjekraam")[0];
        kcAdminClient.clients.listRoles({id: keycloakClient.id})
            .then(roles => roles.map( (role):RoleMappingPayload => ({
            id: role.id,
            name: role.name,
        })))
        .then( (keycloakClientRoles) => {
            keycloakUsers.forEach(user => {
                getOndernemer(user.username).then(
                    ondernemer => {
                        kcAdminClient.users.update(
                            {id: user.id},
                            {
                                firstName: ondernemer.voorletters,
                                lastName: ondernemer.tussenvoegsels + ' ' + ondernemer.achternaam,   
                            }
                        );
                        kcAdminClient.users.delClientRoleMappings(
                        {
                                id: user.id,
                                clientUniqueId: keycloakClient.id,
                                roles: keycloakClientRoles,
                        });
                        kcAdminClient.users.addRealmRoleMappings(
                        {
                            id: user.id,
                            roles: [
                                {
                                    id: keycloakDefaultRole.id,
                                    name: keycloakDefaultRole.name,
                                }
                            ]
                        });
                }
            ).catch(() => console.log("ondernemer " + user.username + "not found"));
        });
        })
    })
})
