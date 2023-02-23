import { keycloakLogin } from '../support/login'
import { addBranch, assertMarketsOverview, deleteLastBranche, openEditBranchePage } from '../support/marktenoverzicht'
import { assertPossibleToOpenPage } from '../support/marktdetails'

describe('Marktmeester', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.visit(Cypress.env('markten_url'))
  })

  it('Should show the markets overview page', () => {
    cy.contains('Markten').should('be.visible')
    assertMarketsOverview()
  })
  it('Should not be allowed to visit edit branches page as a marktmeester', () => {
    assertPossibleToOpenPage('marktmeester', '/bdm/branches')
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
  it('Should be allowed to edit branches page as a marktbewerker', () => {
    openEditBranchePage()
    addBranch('999 - Test', '999 - Branche')
    deleteLastBranche()
  })
})
