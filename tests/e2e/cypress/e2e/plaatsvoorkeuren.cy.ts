import { keycloakLogin } from '../support/login'
import {
  assertDefaultAmountOfPlaces,
  assertDefaultExtraPlaces,
  assertPriorityPlaces,
  assertStateDropdownMarktplaats,
  selectAmountOfPlaces,
  selectAnywhere,
  selectExtraAmountOfPlaces,
  dragItemTo,
  resetPlaatsvoorkeur,
  selectPlacePreferences,
} from '../support/plaatsvoorkeur'
import { ROUTES } from '../support/routes'
import { PLAATSVOORKEUR } from '../support/selectors'
import { assertAllLinksOnPage } from '../support/utils'

const {
  checkboxAnywhere,
  linkPlaatsvoorkeur,
  orangeBorderDefaultCount,
  radiobuttonAmount2,
  radiobuttonExtra1,
} = PLAATSVOORKEUR

describe('Sollicitant', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
    resetPlaatsvoorkeur('soll')
  })

  it('Should fill plaatsvoorkeur form and shuffle prio as a soll', () => {
    cy.intercept('GET', ROUTES.voorkeuren).as('getVoorkeuren')
    cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')

    cy.visit(Cypress.env('markt_detail_url'))
    assertAllLinksOnPage()
    cy.get(linkPlaatsvoorkeur).click()
    cy.wait('@getVoorkeuren')

    assertDefaultAmountOfPlaces('enabled', 'soll')
    assertDefaultExtraPlaces('enabled')

    selectAmountOfPlaces('2')
    selectExtraAmountOfPlaces('1')
    selectPlacePreferences(['10', '12', '19'])
    selectAnywhere()

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

    assertStateDropdownMarktplaats('enabled')

    selectPlacePreferences(['3', '5', '7', '10', '12', '19'])

    assertStateDropdownMarktplaats('disabled')
  })
})

describe('Vaste plaatshouder', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
    resetPlaatsvoorkeur('vpl')
  })

  it('Should fill plaatsvoorkeur form as a vpl', () => {
    cy.intercept('GET', ROUTES.voorkeuren).as('getVoorkeuren')
    cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')

    cy.visit(Cypress.env('markt_detail_url'))
    assertAllLinksOnPage()
    cy.get(linkPlaatsvoorkeur).click()
    cy.wait('@getVoorkeuren')

    cy.contains('plaatsnummer: 85').should('be.visible')
    assertDefaultAmountOfPlaces('disabled', 'vpl')
    assertDefaultExtraPlaces('enabled')

    selectExtraAmountOfPlaces('2')

    selectPlacePreferences(['1', '3'])

    cy.get(checkboxAnywhere).should('not.exist')
  })
})

describe('Marktmeester', () => {
  it('Should set-up testdata soll', () => {
    // Set-up testdata in an it, if in a before, it creates a conflict between user sessions
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
    resetPlaatsvoorkeur('soll')
  })

  it('Should show plaatsvoorkeuren of a soll, marktmeester cannot edit data', () => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.visit(Cypress.env('profile_soll_url'))
    assertAllLinksOnPage()
    cy.contains('plaatsvoorkeuren').click()

    assertDefaultAmountOfPlaces('disabled', 'soll')
    assertDefaultExtraPlaces('disabled')

    assertStateDropdownMarktplaats('disabled')

    cy.get(checkboxAnywhere).should('not.be.checked')
  })

  it('Should set-up testdata vpl', () => {
    // Set-up testdata in an it, if in a before, it creates a conflict between user sessions
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
    resetPlaatsvoorkeur('vpl')
  })

  it('Should show plaatsvoorkeuren of a vpl, marktmeester cannot edit data', () => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.visit(Cypress.env('profile_vpl_url'))
    cy.contains('plaatsvoorkeuren').click()

    assertDefaultAmountOfPlaces('disabled', 'vpl')
    assertDefaultExtraPlaces('disabled')

    assertStateDropdownMarktplaats('disabled')

    cy.get(checkboxAnywhere).should('not.exist')
  })
})

describe('Marktbewerker', () => {
  it('Should set-up testdata soll', () => {
    // Set-up testdata should be arranged in a before, but it is not working. It creates a conflict between user sessions
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
    resetPlaatsvoorkeur('soll')
  })

  it('Should show plaatsvoorkeuren of a soll, marktbewerker can edit data', () => {
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    cy.visit(Cypress.env('plaatsvoorkeur_url_soll'))

    assertDefaultAmountOfPlaces('enabled', 'soll')
    assertDefaultExtraPlaces('enabled')

    assertStateDropdownMarktplaats('enabled')

    cy.get(checkboxAnywhere).should('not.be.checked')
  })

  it('Should set-up testdata vpl', () => {
    // Set-up testdata should be arranged in a before, but it is not working. It creates a conflict between user sessions
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
    resetPlaatsvoorkeur('vpl')
  })

  it('Should show plaatsvoorkeuren of a soll, marktbewerker can edit data', () => {
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    cy.viewport(1280, 720)
    cy.visit(Cypress.env('plaatsvoorkeur_url_vpl'))

    assertDefaultAmountOfPlaces('disabled', 'vpl')
    assertDefaultExtraPlaces('enabled')

    assertStateDropdownMarktplaats('enabled')

    cy.get(orangeBorderDefaultCount).should('have.css', 'border-top-color', 'rgb(255, 165, 0)')

    cy.get(checkboxAnywhere).should('not.exist')
  })
})
