import 'cypress-keycloak'
import { IOndernemer } from '../../../../src/models'
import { ROUTES } from './routes'
import { AANWEZIGHEID } from './selectors'

const { antTag, rsvpList } = AANWEZIGHEID

export const addRsvp = (rsvp): void => {
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

export const interceptAttendance = () => {
  cy.intercept('GET', ROUTES.koopmanErkenningsnummer).as('getKoopman')
  cy.intercept('GET', ROUTES.rsvpKoopman).as('getRsvpKoopman')
  cy.intercept('GET', ROUTES.rsvpPatternKoopman).as('getRsvpPattern')
  cy.intercept('GET', ROUTES.marktVoorkeurKoopman).as('getMarktVoorkeurKoopman')
  cy.intercept('GET', ROUTES.ondernemerMarkt).as('getOndernemerMarkt')
}

export const waitAttendance = () => {
  cy.wait('@getKoopman')
  cy.wait('@getRsvpKoopman')
  cy.wait('@getRsvpPattern')
  cy.wait('@getMarktVoorkeurKoopman')
  cy.wait('@getOndernemerMarkt')
}
