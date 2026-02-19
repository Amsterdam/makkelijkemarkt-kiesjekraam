import { keycloakLogin } from '../support/login'
import { assertMarketAlerts, downloadLogs } from '../support/marktdetails'
import { assertAllLinksOnPage } from '../support/utils'

describe('Marktmeester', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.visit(Cypress.env('markt_url'))
  })

  it('Should check all links on markt page', { tags: ['@slow'] }, () => {
    assertMarketAlerts('Geblokkeerde plaatsen', 'Plaatsen: 131,158,251')
    // Assert all links on page
    assertAllLinksOnPage()
  })
  // Test fails when using Electron (bug in Electron?)
  it('Should download logs and assert headers', { browser: ['chrome', 'firefox', 'edge'] }, () => {
    cy.deleteDownloadsFolder()
    downloadLogs()
  })
})

describe('Marktbewerker', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    cy.visit(Cypress.env('markt_url'))
  })

  it('Should check all links on markt page', { tags: ['@slow'] }, () => {
    assertMarketAlerts('Geblokkeerde plaatsen', 'Plaatsen: 131,158,251')
    // Assert all links on page
    assertAllLinksOnPage()
  })
  // Test fails when using Electron (bug in Electron?)
  it('Should download logs and assert headers', { browser: ['chrome', 'firefox', 'edge'] }, () => {
    cy.deleteDownloadsFolder()
    downloadLogs()
  })
})
