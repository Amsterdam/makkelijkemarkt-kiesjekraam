import { MARKTVOORKEUR01, MARKTVOORKEUR02, MARKTVOORKEUR03, MARKTVOORKEUR04 } from '../fixtures/marktvoorkeur'
import { ONDERNEMER03, ONDERNEMER04 } from '../fixtures/ondernemer'
import { keycloakLogin } from '../support/login'
import {
  addAbsence,
  addMarktvoorkeur,
  assertAbsence,
  assertLongAbsence,
  assertMarktvoorkeur,
  saveAndOpenAgain,
  showTooltipText,
} from '../support/marktvoorkeur'
import { ROUTES } from '../support/routes'
import { MARKTVOORKEUR } from '../support/selectors'
import { addDays, assertAllLinksOnPage, convertDate } from '../support/utils'

const { checkboxInrichting, dropdownBakType, dropdownValue } = MARKTVOORKEUR

describe('Sollicitant', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
    cy.intercept('POST', ROUTES.algemeneVoorkeuren).as('postAlgemeneVoorkeuren')
    cy.visit(Cypress.env('marktvoorkeur_url'))
  })

  it('Should add and save marktvoorkeur as a soll', { tags: ['@smoke'] }, () => {
    addMarktvoorkeur(MARKTVOORKEUR01)
    showTooltipText('Bakplaats licht')
    saveAndOpenAgain()
    assertMarktvoorkeur(MARKTVOORKEUR01)
  })
})

describe('Vaste plaatshouder', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
    cy.intercept('POST', ROUTES.algemeneVoorkeuren).as('postAlgemeneVoorkeuren')
    cy.visit(Cypress.env('marktvoorkeur_url'))
  })

  it('Should add and save marktvoorkeur as a vpl', () => {
    addMarktvoorkeur(MARKTVOORKEUR02)
    showTooltipText('Bakplaats licht')
    saveAndOpenAgain()
    assertMarktvoorkeur(MARKTVOORKEUR02)
  })
})

describe('Marktmeester', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    cy.intercept('POST', ROUTES.algemeneVoorkeurenOndernemer).as('postAlgemeneVoorkeuren')
    cy.intercept('GET', ROUTES.langdurigAfgemeld).as('getLangdurigAfgemeld')
    cy.visit(Cypress.env('marktvoorkeur_url_soll'))
  })

  it('Should not be able te change marktvoorkeuren, add long absence', () => {
    // Set absent period
    const absentFrom = convertDate(addDays(new Date(), 20), 'ddmmyyyy').toString()
    const absentUntil = convertDate(addDays(new Date(), 34), 'ddmmyyyy').toString()

    // It is not possible to edit preferences
    cy.get(dropdownValue)
      .should('have.length', 1)
      .and('be.visible')
    cy.get(dropdownBakType)
      .should('be.disabled')
      .and('be.visible')
    cy.get(checkboxInrichting)
      .should('be.disabled')
      .and('not.be.checked')

    addAbsence(absentFrom, absentUntil)
    saveAndOpenAgain()
    assertMarktvoorkeur(MARKTVOORKEUR03)
    assertAbsence(absentFrom, absentUntil)

    // check longterm absent period
    cy.visit(Cypress.env('langdurigAfgemeld_url'))
    cy.wait('@getLangdurigAfgemeld')
    assertLongAbsence(ONDERNEMER04, absentFrom, absentUntil)
    assertAllLinksOnPage()
  })
})

describe('Marktbewerker', () => {
  beforeEach(() => {
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    cy.intercept('POST', ROUTES.algemeneVoorkeurenOndernemer).as('postAlgemeneVoorkeuren')
    cy.intercept('GET', ROUTES.langdurigAfgemeld).as('getLangdurigAfgemeld')
    cy.visit(Cypress.env('marktvoorkeur_url_vpl'))
  })

  it('Should be able te change marktvoorkeuren, add long absence', () => {
    // Set absent period
    const absentFrom = convertDate(addDays(new Date(), 20), 'ddmmyyyy').toString()
    const absentUntil = convertDate(addDays(new Date(), 34), 'ddmmyyyy').toString()

    addMarktvoorkeur(MARKTVOORKEUR04)
    addAbsence(absentFrom, absentUntil)
    saveAndOpenAgain()
    assertMarktvoorkeur(MARKTVOORKEUR04)
    assertAbsence(absentFrom, absentUntil)

    // check longterm absent period
    cy.visit(Cypress.env('langdurigAfgemeld_url'))
    cy.wait('@getLangdurigAfgemeld')
    assertLongAbsence(ONDERNEMER03, absentFrom, absentUntil)
    assertAllLinksOnPage()
  })
})
