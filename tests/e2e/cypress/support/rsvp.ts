import 'cypress-keycloak'
import { IOndernemer } from '../../../../src/models'
import { IRsvpList } from '../fixtures/rsvp'
import { ROUTES } from './routes'
import { AANWEZIGHEID } from './selectors'

const { antTag, rsvpList } = AANWEZIGHEID

/**
 * Function to add rsvp via the api.
 * @example addRsvp(RSVP01)
 * @param {IRsvpList} rsvp - a fixture with rsvp preferences.
 */
export const addRsvp = (rsvp: IRsvpList): void => {
  cy.request({
    method: 'POST',
    url: ROUTES.rsvp,
    headers: {
      Connection: 'keep-alive',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: Cypress.config().baseUrl,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    body: rsvp,
  }).then(response => {
    expect(response.status).to.eql(200)
    cy.log('RSVP added')
  })
}

/**
 * Function to add a rsvp pattern via the api.
 * @example addRsvp(RSVP01)
 * @param {IRsvpList} rsvp - a fixture with rsvp preferences.
 */
export const addRsvpPattern = (rsvpPattern): void => {
  cy.request({
    method: 'POST',
    url: ROUTES.rsvpPattern,
    headers: {
      Connection: 'keep-alive',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: Cypress.config().baseUrl,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    body: rsvpPattern,
  }).then(response => {
    expect(response.status).to.eql(200)
    cy.log('RSVP Pattern added')
  })
}

/**
 * Function to assert if checkboxes of a week or pattern are checked are disabled.
 * @example addRsvp(RSVP01)
 * @param {number[]} days - an array with days of the week to assert.
 * @param {'Aanwezigheidspatroon' | 'Deze week' | 'Volgende week'} dayListName - name of list of days to assert. 'Aanwezigheidspatroon', 'Deze week' or 'Volgende week'.
 * @param {'checked' | 'disabled'} assertType - assert on 'checked' or 'disabled' status.
 */
export const assertDayState = (
  days: number[],
  dayListName: 'Aanwezigheidspatroon' | 'Deze week' | 'Volgende week',
  assertType: 'checked' | 'disabled'
) => {
  let status

  for (let day = 1; day < 8; day++) {
    if (days.includes(day) && assertType === 'disabled') {
      status = 'be.disabled'
    } else if (!days.includes(day) && assertType === 'disabled') {
      status = 'be.enabled'
    } else if (days.includes(day) && assertType === 'checked') {
      status = 'be.checked'
    } else if (!days.includes(day) && assertType === 'checked') {
      status = 'not.be.checked'
    }

    cy.get('h2')
      .contains(dayListName)
      .siblings(rsvpList)
      .find('input')
      .eq(day - 1)
      .should(status)
  }
}

/**
 * Function to assert if ondernemer info is visible.
 * @example assertOndernemerInfo(ONDERNEMER01)
 * @param {IOndernemer} ondernemer - a fixture with ondernemer info.
 */
export const assertOndernemerInfo = ({ achternaam, erkenningsnummer, sollicitaties, voorletters }: IOndernemer) => {
  cy.contains(achternaam + ' ' + voorletters).should('be.visible')
  cy.contains(`registratienummer ${erkenningsnummer}`).should('be.visible')
  cy.get(antTag)
    .eq(0)
    .contains(sollicitaties[0].status)
    .should('be.visible')
  cy.get(antTag)
    .eq(1)
    .contains(sollicitaties[0].sollicitatieNummer)
    .should('be.visible')
}

/**
 * Function to check days in attendance pattern.
 * @example checkAttendancePattern([1, 3, 4, 5])
 * @param {number[]} days - an array of days to check.
 */
export const checkAttendancePattern = (days: number[]) => {
  for (let day = 1; day < 8; day++) {
    if (days.includes(day)) {
      cy.get('h2')
        .contains('Aanwezigheidspatroon')
        .siblings(rsvpList)
        .find('input')
        .eq(day - 1)
        .check()
    } else {
      cy.get('h2')
        .contains('Aanwezigheidspatroon')
        .siblings(rsvpList)
        .find('input')
        .eq(day - 1)
        .uncheck()
    }
  }
}

/**
 * Intercepts used to wait for rsvp page to load.
 * @example interceptAttendance()
 */
export const interceptAttendance = () => {
  cy.intercept('GET', ROUTES.koopmanErkenningsnummer).as('getKoopman')
  cy.intercept('GET', ROUTES.rsvpKoopman).as('getRsvpKoopman')
  cy.intercept('GET', ROUTES.rsvpPatternKoopman).as('getRsvpPattern')
  cy.intercept('GET', ROUTES.marktVoorkeurKoopman).as('getMarktVoorkeurKoopman')
  cy.intercept('GET', ROUTES.ondernemerMarkt).as('getOndernemerMarkt')
}

/**
 * Waits used for rsvp page to load.
 * @example waitAttendance()
 */
export const waitAttendance = () => {
  cy.wait('@getKoopman')
  cy.wait('@getRsvpKoopman')
  cy.wait('@getRsvpPattern')
  cy.wait('@getMarktVoorkeurKoopman')
  cy.wait('@getOndernemerMarkt')
}
