import { keycloakLogin } from '../support/login'
import { assertMarketsOverview } from '../support/marktenoverzicht'

describe('Marktmeester', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.visit(Cypress.env('markten_url'))
  })

  it('Should show the markets overview page', () => {
    cy.contains('Markten').should('be.visible')
    assertMarketsOverview()
  })
})

describe('Marktbewerker', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    cy.visit(Cypress.env('markten_url'))
  })

  it('Should show the markets overview page', () => {
    cy.contains('Markten').should('be.visible')
    assertMarketsOverview()
  })
})
