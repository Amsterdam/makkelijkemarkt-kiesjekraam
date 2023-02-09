import { MARKTDETAILS } from './selectors'

const { alertMessage, alertTitle, linkAuditLog } = MARKTDETAILS

/**
 * Function to assert alert titele and text.
 * @example assertMarktAlerts('Geblokkeerde plaatsen', 'Plaatsen: 131,158,251')
 * @param {string} title - alert title.
 * @param {string} message - message text.
 */
export const assertMarktAlerts = (title: string, message: string): void => {
  cy.get(alertTitle)
    .should('have.text', title)
    .and('be.visible')
  cy.get(alertMessage)
    .should('have.text', message)
    .and('be.visible')
}

/**
 * Function to download a logfile and assert if it contains headers.
 * @example downloadLogs()
 */
export const downloadLogs = (): void => {
  cy.get(linkAuditLog).click()
  cy.readFile('cypress/downloads/audit_logs.csv').should('contain', 'id	actor	action	entityType	result	datetime')
}
