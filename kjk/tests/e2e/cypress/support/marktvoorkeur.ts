import { MARKTVOORKEUR } from './selectors'
import { IMarktVoorkeur, IOndernemer } from '../../../../src/models/index'

const {
  checkboxInrichting,
  dropdownBakType,
  dropdownBranche,
  inputAbsentFrom,
  inputAbsentUntil,
  link_marktvoorkeur,
  orangeBorderAbsent,
  tooltipText,
} = MARKTVOORKEUR

/**
 * Function to add a long absence period.
 * @example assertAbsence(absentFrom, absentUntil)
 * @param {string} absentFrom - absence startdate, formatted as dd-mm-yyyy.
 * @param {string} absentUntil - absence enddate, formatted as dd-mm-yyyy.
 */
export const addAbsence = (absentFrom: string, absentUntil: string): void => {
  cy.get(orangeBorderAbsent).should('have.css', 'border-top-color', 'rgb(255, 165, 0)')
  cy.get(inputAbsentFrom)
    .clear()
    .type(absentFrom)
  cy.get(inputAbsentUntil)
    .clear()
    .type(absentUntil)
}

/**
 * Function to add market preferences.
 * @example addMarktvoorkeur(MARKTVOORKEUR04)
 * @param {IMarktVoorkeur} marktVoorkeur - a fixture with market preferences.
 */
export const addMarktvoorkeur = ({ anywhere, bakType, branche }: IMarktVoorkeur): void => {
  cy.get(dropdownBranche).select(branche)
  cy.get(dropdownBakType).select(bakType)
  if (anywhere) {
    cy.get(checkboxInrichting).check({ force: true })
  } else {
    cy.get(checkboxInrichting).uncheck({ force: true })
  }
}

/**
 * Function to assert long absence period on market preferences page.
 * @example assertAbsence(absentFrom, absentUntil)
 * @param {string} absentFrom - absence startdate, formatted as dd-mm-yyyy.
 * @param {string} absentUntil - absence enddate, formatted as dd-mm-yyyy.
 */
export const assertAbsence = (absentFrom: string, absentUntil: string): void => {
  cy.get(inputAbsentFrom)
    .should('have.value', absentFrom)
    .and('be.visible')
  cy.get(inputAbsentUntil)
    .should('have.value', absentUntil)
    .and('be.visible')
}

/**
 * Function to assert long absence period and entrepreneur info on langdurig afgemeld page.
 * @example assertLongAbsence(ONDERNEMER03, absentFrom, absentUntil)
 * @param {IOndernemer} ondernemer - ondernemer fixture.
 * @param {string} absentFrom - absence startdate, formatted as dd-mm-yyyy.
 * @param {string} absentUntil - absence enddate, formatted as dd-mm-yyyy.
 */
export const assertLongAbsence = (
  { achternaam, sollicitaties, voorletters }: IOndernemer,
  absentFrom: string,
  absentUntil: string
): void => {
  cy.get(`.${sollicitaties[0].status} > td`).as('personRow')
  cy.get('@personRow')
    .eq(0)
    .should('have.text', sollicitaties[0].sollicitatieNummer)
    .and('be.visible')
  cy.get('@personRow')
    .eq(1)
    .should('have.text', sollicitaties[0].status)
    .and('be.visible')
  cy.get('@personRow')
    .eq(2)
    .should('have.text', ' ' + achternaam + ' ' + voorletters)
    .and('be.visible')
  cy.get('@personRow')
    .eq(3)
    .should('contain', absentFrom)
    .and('contain', absentUntil)
    .and('be.visible')
}

/**
 * Function to assert market preferences.
 * @example assertMarktvoorkeur(MARKTVOORKEUR04)
 * @param {IMarktVoorkeur} marktVoorkeur - a fixture with market preferences.
 */
export const assertMarktvoorkeur = ({ anywhere, bakType, branche }: IMarktVoorkeur): void => {
  cy.get(dropdownBranche).should('have.value', branche)
  cy.get(dropdownBakType).should('have.value', bakType)
  if (anywhere) {
    cy.get(checkboxInrichting).should('be.checked')
  } else {
    cy.get(checkboxInrichting).should('not.be.checked')
  }
}

/**
 * Function to save market preferences and open the page again.
 * @example saveAndOpenAgain()
 */
export const saveAndOpenAgain = (): void => {
  cy.contains('Opslaan').click()
  cy.wait('@postAlgemeneVoorkeuren')
  cy.get(link_marktvoorkeur)
    .first()
    .click()
}

/**
 * Function to show tooltip text of bakplaats question.
 * @example showTooltipText()
 * @param {string} text - tooltip text.
 */
export const showTooltipText = (text: string): void => {
  cy.get(tooltipText)
    .invoke('show')
    .contains(text)
    .and('be.visible')
}
