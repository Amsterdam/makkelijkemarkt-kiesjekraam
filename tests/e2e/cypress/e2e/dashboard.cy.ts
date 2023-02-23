import { ONDERNEMER01, ONDERNEMER02 } from '../fixtures/ondernemer'
import { keycloakLogin } from '../support/login'
import { assertAllLinksOnPage } from '../support/utils'

describe('Sollicitant', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
  })
  it('It should show the market dashboard when logged in as a sollicitant', () => {
    const { achternaam, erkenningsnummer, voorletters } = ONDERNEMER01

    cy.visit(Cypress.env('dashboard_url'))

    cy.contains(achternaam + ' ' + voorletters).should('be.visible')
    cy.contains(`registratienummer: ${erkenningsnummer}`).should('be.visible')
    assertAllLinksOnPage()
  })
})

describe('Vaste plaatshouder', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
  })
  it('It should show the market dashboard when logged in as a vpl', () => {
    const { achternaam, erkenningsnummer, voorletters } = ONDERNEMER02

    cy.visit(Cypress.env('dashboard_url'))

    cy.contains(achternaam + ' ' + voorletters).should('be.visible')
    cy.contains(`registratienummer: ${erkenningsnummer}`).should('be.visible')
    assertAllLinksOnPage()
  })
})
