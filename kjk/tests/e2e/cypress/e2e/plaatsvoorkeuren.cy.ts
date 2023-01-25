import { eq } from 'cypress/types/lodash'
import { keycloakLogin } from '../support/login'
import {
  checkExtraAmountOfPlaces,
  resetPlaatsvoorkeur,
  checkAmountOfPlaces,
  selectPlacePreference,
  checkAnywhere,
  assertPriorityPlaces,
  dragItemTo,
} from '../support/plaatsvoorkeur'
import { ROUTES } from '../support/routes'
import { PLAATSVOORKEUR } from '../support/selectors'

const { checkboxAnywhere, radiobuttonAmount2, radiobuttonExtra1, selectMarktplaats } = PLAATSVOORKEUR

describe('Sollicitant', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
    resetPlaatsvoorkeur('soll')
  })
  it('Should fill plaatsvoorkeur form and shuffle prio', () => {
    cy.intercept('GET', ROUTES.voorkeuren).as('getVoorkeuren')
    cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')

    cy.visit(Cypress.env('plaatsvoorkeur_url'))
    cy.wait('@getVoorkeuren')

    checkAmountOfPlaces('2')
    checkExtraAmountOfPlaces('1')
    selectPlacePreference(['10', '12', '19'])
    checkAnywhere()

    assertPriorityPlaces(['19', '12', '10'])

    cy.visit(Cypress.env('plaatsvoorkeur_url'))
    cy.wait('@getVoorkeuren')

    dragItemTo(1, 3)

    cy.get(radiobuttonAmount2).should('be.checked')
    cy.get(radiobuttonExtra1).should('be.checked')
    cy.get(checkboxAnywhere).should('be.checked')

    assertPriorityPlaces(['12', '10', '19'])
  })
  it('Should not be possible to add more than 6 places', () => {
    cy.intercept('GET', ROUTES.voorkeuren).as('getVoorkeuren')
    cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')

    cy.visit(Cypress.env('plaatsvoorkeur_url'))
    cy.wait('@getVoorkeuren')

    cy.get(selectMarktplaats)
      .should('be.enabled')
      .and('be.visible')

    selectPlacePreference(['3', '5', '7', '10', '12', '19'])

    cy.get(selectMarktplaats)
      .should('be.disabled')
      .and('be.visible')
  })
})

describe('Vaste plaats houder', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
    resetPlaatsvoorkeur('vpl')
  })
  it('', () => {
    cy.intercept('GET', ROUTES.voorkeuren).as('getVoorkeuren')
    cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')

    cy.visit(Cypress.env('plaatsvoorkeur_url'))
    cy.wait('@getVoorkeuren')
    cy.contains('plaatsnummer: 85').should('be.visible')
  })
})
describe('Marktmeester', () => {})
describe('Marktbewerker', () => {})
