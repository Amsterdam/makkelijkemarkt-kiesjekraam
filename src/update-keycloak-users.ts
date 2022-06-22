import { RoleMappingPayload } from "keycloak-admin/lib/defs/roleRepresentation";
import { getKeycloakAdmin } from "./keycloak-api";
import { getOndernemer } from "./makkelijkemarkt-api";

var ROLES_NAME = 'default-roles-pakjekraam';
if (process.env.APP_ENV === 'acceptance') ROLES_NAME = 'default-roles-pakjekraam-acc';

const getKeycloakData = async () => {
    const kcAdminClient = await getKeycloakAdmin();
    const keycloakDefaultRole = await kcAdminClient.roles.findOneByName({name: ROLES_NAME});
    const keycloakClients = await kcAdminClient.clients.find({ max: -1 });
    const keycloakUsers = await kcAdminClient.users.find();
    const keycloakClient = keycloakClients.filter( (client) => client.clientId === "pakjekraam")[0];
    const keycloakClientRoles = await kcAdminClient.clients.listRoles({id: keycloakClient.id})
    const keycloakClientRolesPayload = keycloakClientRoles.map(
        (role):RoleMappingPayload =>
        (
            {
                id: role.id,
                name: role.name,
            }
        )
    );

    keycloakUsers.forEach(user => {
        console.log(user.username);
        return getOndernemer(user.username).then(
            async (ondernemer) => {
                await kcAdminClient.users.update(
                    {id: user.id},
                    {
                        firstName: ondernemer.voorletters,
                        lastName: ondernemer.tussenvoegsels + ' ' + ondernemer.achternaam,
                    }
                );
                await kcAdminClient.users.delClientRoleMappings(
                    {
                        id: user.id,
                        clientUniqueId: keycloakClient.id,
                        roles: keycloakClientRolesPayload,

                    }
                );
                await kcAdminClient.users.addRealmRoleMappings(
                    {
                        id: user.id,
                        roles: [
                            {
                                id: keycloakDefaultRole.id,
                                name: keycloakDefaultRole.name,
                            }
                        ]
                    }
                );
            }
        ).catch(() => console.log("ondernemer " + user.username + " not found"));
    });
}

getKeycloakData().then(() => {
    console.log("script DONE");
    process.exit(0);
}).catch(() => {
    console.log("script FAILED")
    process.exit(1);
});