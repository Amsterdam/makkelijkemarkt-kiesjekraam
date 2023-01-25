/**
 * Function to login with keycloak.
 * @example keycloakLogin(Cypress.env('username'), Cypress.env('password'));
 */
export const keycloakLogin = (username: string, password: string): void => {
  cy.login({
    root: Cypress.env('keycloak_url'),
    realm: 'kiesjekraam',
    username: username,
    password: password,
    client_id: 'kiesjekraam',
    redirect_uri: Cypress.config().baseUrl,
    path_prefix: '',
  })
  cy.visit('/')
}

/**
 * Function to log in via the GUI.
 * @example keycloakLoginViaGui(username, password);
 */
export const keycloakLoginViaGui = (username: string, password: string): void => {
  cy.visit('/login')
  cy.get('#username')
    .should('be.visible')
    .type(username)
  cy.get('#password').type(password)
  cy.get('#kc-login').click()
}
