import { MARKTDETAILS } from './selectors'

const { alertMessage, alertTitle, linkAuditLog } = MARKTDETAILS

/**
 * Function to assert alert titele and text.
 * @example assertMarktAlerts('Geblokkeerde plaatsen', 'Plaatsen: 131,158,251')
 * @param {string} title - alert title.
 * @param {string} message - message text.
 */
export const assertMarketAlerts = (title: string, message: string): void => {
  cy.get(alertTitle)
    .should('have.text', title)
    .and('be.visible')
  cy.get(alertMessage)
    .should('have.text', message)
    .and('be.visible')
}

/**
 * Function to assert the possibility to edit a market.
 * @example assertPossibleToEditMarket('marktbewerker')
 * @param {'marktmeester' | 'marktbewerker'} role - role is a marktmeester or marktbewerker.
 */
export const assertPossibleToOpenPage = (role: 'marktmeester' | 'marktbewerker', url: string): void => {
  cy.request({
    method: 'GET',
    url: url,
    failOnStatusCode: false,
  }).then(response => {
    if (role === 'marktmeester') {
      expect(response.status).to.eql(403)
      cy.log('Marktmeester is not authorised')
    } else {
      expect(response.status).to.eql(200)
      cy.log('Marktbewerker is authorised')
    }
  })
}

/**
 * Function to download a logfile and assert if it contains headers.
 * @example downloadLogs()
 */
export const downloadLogs = (): void => {
  cy.get(linkAuditLog).click()
  cy.readFile('cypress/downloads/audit_logs.csv').should('contain', 'id	actor	action	entityType	result	datetime')
}
