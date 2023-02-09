import { keycloakLogin } from '../support/login'
import { assertMarktAlerts, downloadLogs } from '../support/marktoverzicht'
import { assertAllLinksOnPage } from '../support/utils'

describe('Marktmeester', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.visit(Cypress.env('markt_url'))
  })

  it('Should check all links on markt page', { tags: ['@slow'] }, () => {
    assertMarktAlerts('Geblokkeerde plaatsen', 'Plaatsen: 131,158,251')
    // Assert all links
    assertAllLinksOnPage('marktmeester')
  })
  it('Should download logs and assert headers', () => {
    downloadLogs()
  })
})

describe('Marktbewerker', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    cy.visit(Cypress.env('markt_url'))
  })

  it('Should check all links on markt page', { tags: ['@slow'] }, () => {
    assertMarktAlerts('Geblokkeerde plaatsen', 'Plaatsen: 131,158,251')
    // Assert all links
    assertAllLinksOnPage()
  })
  it('Should download logs and assert headers', () => {
    downloadLogs()
  })
})
