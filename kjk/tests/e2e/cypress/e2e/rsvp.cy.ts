import {
  addRsvp,
  addRsvpPattern,
  assertDayState,
  assertOndernemerInfo,
  checkAttendancePattern,
  interceptAttendance,
  waitAttendance,
} from '../support/rsvp'
import { keycloakLogin } from '../support/login'
import { addDays, assertAllLinksOnPage, getMonday, setDate } from '../support/utils'
import { ONDERNEMER01, ONDERNEMER02 } from '../fixtures/ondernemer'
import { RSVP01, RSVP02 } from '../fixtures/rsvp'
import { RSVP_PATTERN01, RSVP_PATTERN02, RSVP_PATTERN03 } from '../fixtures/rsvpPattern'
import { ROUTES } from '../support/routes'
import { AANWEZIGHEID } from '../support/selectors'

describe('Sollicitant', () => {
  beforeEach(() => {
    interceptAttendance()
    keycloakLogin(Cypress.env('marktondernemer_soll'), Cypress.env('password'))
  })

  it('Should show ondernemer info and no pattern, all checkboxes are unchecked by default', () => {
    //reset testdata
    addRsvpPattern(RSVP_PATTERN01)
    addRsvp(RSVP01)
    // Visit markt details and open availability link
    cy.visit(Cypress.env('markt_detail_url'))
    assertAllLinksOnPage()
    cy.get(AANWEZIGHEID.link_aanwezigheid).click()
    waitAttendance()

    assertOndernemerInfo(ONDERNEMER01)
    assertDayState([], 'Aanwezigheidspatroon', 'checked')
    assertDayState([], 'Volgende week', 'checked')
  })

  it('Should show possible days on a tuesday BEFORE 15:00', () => {
    // Set date on tuesday 00:00
    setDate(addDays(getMonday(new Date(), 0), 1))
    cy.visit(Cypress.env('rsvp_marktondernemer_soll_url'))
    waitAttendance()

    // Availability pattern, sunday is disabled other days are enabled
    assertDayState([7], 'Aanwezigheidspatroon', 'disabled')

    // This week, monday, tuesday and sunday are disabled other days are enabled
    assertDayState([1, 2, 7], 'Deze week', 'disabled')

    // Next week, sunday is disabled other days are enabled
    assertDayState([7], 'Volgende week', 'disabled')
  })

  it('Should show possible days on a tuesday AFTER 15:00', () => {
    // Set date on tuesday 16:00
    setDate(addDays(getMonday(new Date(), 0), 16))
    cy.visit(Cypress.env('rsvp_marktondernemer_soll_url'))
    waitAttendance()

    // Availability pattern, sunday is disabled other days are enabled
    assertDayState([7], 'Aanwezigheidspatroon', 'disabled')

    // This week, monday, tuesday, wednesday and sunday are disabled other days are enabled
    assertDayState([1, 2, 3, 7], 'Deze week', 'disabled')

    // Next week, sunday is disabled other days are enabled
    assertDayState([7], 'Volgende week', 'disabled')
  })

  it('Should apply part of the pattern this week and the whole pattern next week, save data', () => {
    cy.intercept('POST', ROUTES.rsvp).as('postRsvp')
    cy.intercept('POST', ROUTES.rsvpPattern).as('postRsvpPattern')

    //reset testdata
    addRsvpPattern(RSVP_PATTERN01)
    addRsvp(RSVP01)

    // Set date on monday 00:00
    setDate(getMonday(new Date(), 0))
    cy.visit(Cypress.env('rsvp_marktondernemer_soll_url'))
    waitAttendance()

    // Check monday, tuesday and friday
    checkAttendancePattern([1, 2, 5])

    // Pattern applied after monday for this week
    assertDayState([2, 5], 'Deze week', 'checked')

    // Full pattern is applied for next week
    assertDayState([1, 2, 5], 'Volgende week', 'checked')

    cy.contains('Opslaan').click()
    cy.wait('@postRsvp')
    cy.wait('@postRsvpPattern')
    cy.visit(Cypress.env('rsvp_marktondernemer_soll_url'))
    waitAttendance()

    // Can't manipulate clock server side, so it is not possible to save a pattern for days in te past of the current week.
    // Pattern applied after monday for this week
    // assertDayState([2, 5], 'Deze week', 'checked')

    // Full pattern is applied for next week
    assertDayState([1, 2, 5], 'Volgende week', 'checked')
  })

  it('Should update and save availability pattern', () => {
    cy.intercept('POST', ROUTES.rsvp).as('postRsvp')
    cy.intercept('POST', ROUTES.rsvpPattern).as('postRsvpPattern')

    // Set date on monday 00:00
    setDate(getMonday(new Date(), 0))

    //reset testdata
    addRsvpPattern(RSVP_PATTERN02)
    addRsvp(RSVP01)

    cy.visit(Cypress.env('rsvp_marktondernemer_soll_url'))
    waitAttendance()

    // Pattern should be tuesday, thursday and saturday
    assertDayState([2, 4, 6], 'Aanwezigheidspatroon', 'checked')

    // Check monday, wednesday, thursday and friday
    checkAttendancePattern([1, 3, 4, 5])

    cy.contains('Opslaan').click()
    cy.wait('@postRsvp')
    cy.wait('@postRsvpPattern')
    cy.visit(Cypress.env('rsvp_marktondernemer_soll_url'))
    waitAttendance()

    // Pattern should be monday, wednesday, thursday and friday
    assertDayState([1, 3, 4, 5], 'Aanwezigheidspatroon', 'checked')
  })
})

describe('Vaste plaatshouder', () => {
  beforeEach(() => {
    interceptAttendance()
    cy.intercept('POST', ROUTES.rsvp).as('postRsvp')
    cy.intercept('POST', ROUTES.rsvpPattern).as('postRsvpPattern')
    keycloakLogin(Cypress.env('marktondernemer_vpl'), Cypress.env('password'))
    addRsvpPattern(RSVP_PATTERN03)
  })

  it('Should show ondernemer info and a pattern and can edit data', () => {
    cy.visit(Cypress.env('markt_detail_url'))
    cy.get(AANWEZIGHEID.link_aanwezigheid).click()
    waitAttendance()

    assertOndernemerInfo(ONDERNEMER02)
    // Pattern should be monday till saturday
    assertDayState([1, 2, 3, 4, 5, 6], 'Aanwezigheidspatroon', 'checked')
    // TODO edit and save data

    // Check wednesday, thursday and saturday
    checkAttendancePattern([3, 4, 6])

    cy.contains('Opslaan').click()
    cy.wait('@postRsvp')
    cy.wait('@postRsvpPattern')
    cy.visit(Cypress.env('rsvp_marktondernemer_vpl_url'))
    waitAttendance()

    assertDayState([3, 4, 6], 'Volgende week', 'checked')
    assertDayState([3, 4, 6], 'Aanwezigheidspatroon', 'checked')
  })
})

describe('Marktmeester', () => {
  beforeEach(() => {
    interceptAttendance()
    keycloakLogin(Cypress.env('marktmeester'), Cypress.env('password'))
    addRsvpPattern(RSVP_PATTERN02)
    addRsvp(RSVP02)
    setDate(getMonday(new Date(), 0))
  })

  it('Should show ondernemer info and a pattern, marktmeester cannot edit data', () => {
    cy.visit(Cypress.env('profile_soll_url'))
    cy.contains('aanwezigheid').click()
    waitAttendance()

    assertOndernemerInfo(ONDERNEMER01)

    // Checkboxes are disabled
    assertDayState([1, 2, 3, 4, 5, 6, 7], 'Aanwezigheidspatroon', 'disabled')
    assertDayState([1, 2, 3, 4, 5, 6, 7], 'Deze week', 'disabled')
    assertDayState([1, 2, 3, 4, 5, 6, 7], 'Volgende week', 'disabled')

    // Pattern and next week are visible
    assertDayState([2, 4, 6], 'Aanwezigheidspatroon', 'checked')
    assertDayState([2, 4, 6], 'Volgende week', 'checked')
  })
})

describe('Marktbewerker', () => {
  beforeEach(() => {
    interceptAttendance()
    cy.intercept('POST', ROUTES.rsvp).as('postRsvp')
    cy.intercept('POST', ROUTES.rsvpPattern).as('postRsvpPattern')
    keycloakLogin(Cypress.env('marktbewerker'), Cypress.env('password'))
    addRsvpPattern(RSVP_PATTERN02)
    addRsvp(RSVP02)
    setDate(getMonday(new Date(), 0))
  })

  it('Should show ondernemer info and a pattern, marktbewerker can edit data', () => {
    cy.visit(Cypress.env('profile_soll_url'))
    cy.contains('aanwezigheid').click()
    waitAttendance()

    assertOndernemerInfo(ONDERNEMER01)

    // Pattern and next week are visible
    assertDayState([2, 4, 6], 'Aanwezigheidspatroon', 'checked')
    assertDayState([2, 4, 6], 'Volgende week', 'checked')

    // Check monday, wednesday, thursday and friday
    checkAttendancePattern([1, 3, 4, 5])

    cy.contains('Opslaan').click()
    cy.wait('@postRsvp')
    cy.wait('@postRsvpPattern')
    cy.visit(Cypress.env('rsvp_marktbewerker_url'))

    // Pattern and next week are visible
    assertDayState([1, 3, 4, 5], 'Aanwezigheidspatroon', 'checked')
    assertDayState([1, 3, 4, 5], 'Volgende week', 'checked')
  })
})
