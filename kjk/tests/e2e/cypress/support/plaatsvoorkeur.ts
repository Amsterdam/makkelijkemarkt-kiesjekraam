import { PLAATSVOORKEUR } from './selectors'
import { ROUTES } from './routes'

const {
  buttonDelete,
  checkboxAnywhere,
  draggableListItem,
  draggableListItemHandle,
  dropdownMarktplaats,
  radiobuttonAmount1,
  radiobuttonAmount2,
  radiobuttonAmount3,
  radiobuttonExtra0,
  radiobuttonExtra1,
  radiobuttonExtra2,
  spinner,
} = PLAATSVOORKEUR

/**
 * Function to assert default amount of places for a vpl or soll and if checkboxes are disabled.
 * @example assertDefaultAmountOfPlaces('disabled', 'soll')
 * @param {'enabled' | 'disabled'} checkboxState - 'enabled' or 'diabled' state of checkboxes.
 * @param {'vpl' | 'soll'} marktondernemerType - ondernemer is 'vpl' or 'soll'.
 */
export const assertDefaultAmountOfPlaces = (
  checkboxState: 'enabled' | 'disabled',
  marktondernemerType: 'vpl' | 'soll'
): void => {
  cy.get(radiobuttonAmount1)
    .should('be.checked')
    .and(`be.${checkboxState}`)

  if (marktondernemerType === 'soll') {
    cy.get(radiobuttonAmount2)
      .should('not.be.checked')
      .and(`be.${checkboxState}`)
    cy.get(radiobuttonAmount3)
      .should('not.be.checked')
      .and(`be.${checkboxState}`)
    // all labels are visible
    for (let i = 1; i < 4; i++) {
      cy.get(`#default-count-${i}`)
        .siblings('label')
        .should('be.visible')
    }
  } else {
    cy.get('[id*="default-count"]')
      .siblings('label')
      .should('have.length', 1)
      .and('be.visible')
    cy.get(radiobuttonAmount1)
      .siblings('label')
      .should('be.visible')
  }
}

/**
 * Function to assert default check status of extra places and if checkboxes are disabled.
 * @example assertDefaultExtraPlaces('disabled')
 * @param {'enabled' | 'disabled'} checkboxState - 'enabled' or 'disabled' state of checkboxes.
 */
export const assertDefaultExtraPlaces = (checkboxState: 'enabled' | 'disabled'): void => {
  cy.get(radiobuttonExtra0)
    .should('be.checked')
    .and(`be.${checkboxState}`)
  cy.get(radiobuttonExtra1)
    .should('not.be.checked')
    .and(`be.${checkboxState}`)
  cy.get(radiobuttonExtra2)
    .should('not.be.checked')
    .and(`be.${checkboxState}`)

  for (let i = 0; i < 3; i++) {
    cy.get(`#extra-count-${i}`)
      .siblings('label')
      .should('be.visible')
  }
}

/**
 * Function to assert order of place preferences.
 * @example assertPriorityPlaces(['19', '12', '10'])
 * @param {string[]} places - an array of ordered placenumbers.
 */
export const assertPriorityPlaces = (places: string[]): void => {
  for (let i = 0; i < places.length; i++) {
    cy.get(draggableListItem)
      .eq(i)
      .should('have.text', places[i])
  }
}

/**
 * Function to assert state of marktplaats dropdown.
 * @example assertStateDropdownMarktplaats('enabled')
 * @param {'enabled' | 'disabled'} dropdownState - 'enabled' or 'disabled' state of checkbox.
 */
export const assertStateDropdownMarktplaats = (dropdownState: 'enabled' | 'disabled'): void => {
  cy.get(dropdownMarktplaats)
    .should(`be.${dropdownState}`)
    .and('be.visible')
}

/**
 * Function to drag one preferred place to another place to determine priority
 * @example dragItemTo(1, 3)
 * @param {number} dragItem - dragitem from place number.
 * @param {number} dropItem - drop item on place number.
 */
export const dragItemTo = (dragItem: number, dropItem: number): void => {
  cy.get(draggableListItemHandle)
    .eq(dragItem - 1)
    .trigger('pointerdown', { button: 0 })
    .trigger('dragstart')
  cy.get(draggableListItem)
    .eq(dropItem - 1)
    .trigger('dragover')
    .trigger('drop')
}

/**
 * Function to reset place preferences for a vpl or a soll.
 * @example resetPlaatsvoorkeur('soll')
 * @param {'soll' | 'vpl'} type - 'soll' or 'vpl' type of entrepreneur.
 */
export const resetPlaatsvoorkeur = (type: 'soll' | 'vpl'): void => {
  cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')
  cy.visit(Cypress.env('plaatsvoorkeur_url'))
  cy.get(radiobuttonAmount1).check({ force: true })
  cy.get(spinner, { timeout: 10000 }).should('not.exist')
  cy.get(radiobuttonExtra0).check({ force: true })
  cy.get(spinner, { timeout: 10000 }).should('not.exist')
  if (type === 'soll') {
    cy.get(checkboxAnywhere).uncheck({ force: true })
  }
  cy.get(spinner).should('not.exist')
  // If there are delete buttons, click them all
  cy.get('body').then($body => {
    if ($body.find(buttonDelete).length > 0) {
      cy.get(buttonDelete).then($elems => {
        cy.get(spinner, { timeout: 10000 }).should('not.exist')
        Cypress._.times($elems.length, () => {
          cy.get('.Draggable-list-item__delete:first', { timeout: 10000 })
            .click()
            .should('not.exist')
        })
      })
    } else {
      cy.log('No buttons to delete')
    }
  })
}

/**
 * Function to select amount of places.
 * @example selectAmountOfPlaces('2')
 * @param {string} amount - amount of places.
 */
export const selectAmountOfPlaces = (amount: string): void => {
  cy.get(`#default-count-${amount}`)
    .check({ force: true })
    .should('be.checked')
  cy.wait('@postVoorkeuren', { timeout: 10000 })
  cy.wait('@getVoorkeuren', { timeout: 10000 })
  cy.get(spinner).should('not.exist')
}

/**
 * Function to check the option to reserve a place anywhere when no preferred place available.
 * @example selectAnywhere()
 */
export const selectAnywhere = (): void => {
  cy.get(checkboxAnywhere)
    .check({ force: true })
    .should('be.checked')
  cy.wait('@postVoorkeuren', { timeout: 10000 })
  cy.wait('@getVoorkeuren', { timeout: 10000 })
  cy.get(spinner).should('not.be.exist')
}

/**
 * Function to select amount of extra places.
 * @example selectExtraAmountOfPlaces('1')
 * @param {string} amount - amount of extra places.
 */
export const selectExtraAmountOfPlaces = (amount: string): void => {
  cy.get(`#extra-count-${amount}`)
    .check({ force: true })
    .should('be.checked')
  cy.wait('@postVoorkeuren', { timeout: 10000 })
  cy.wait('@getVoorkeuren', { timeout: 10000 })
  cy.get(spinner).should('not.be.exist')
}

/**
 * Function to select place preferences by number(s).
 * @example selectPlacePreferences(['10', '12', '19'])
 * @param {string[]} placeNumbers - array of placenumbers.
 */
export const selectPlacePreferences = (placeNumbers: string[]): void => {
  for (let i = 0; i < placeNumbers.length; i++) {
    cy.get(dropdownMarktplaats).select(placeNumbers[i])
    cy.wait('@postVoorkeuren')
    cy.wait('@getVoorkeuren')
    cy.get(spinner).should('not.be.exist')
  }
}

// DOES NOT WORK, TODO.
export const addPlaatsvoorkeur = (): void => {
  cy.request({
    method: 'POST',
    url: '/voorkeuren/39',
    form: true,
    body: {
      erkenningsNummer: 12345678,
      maxNumKramen: '',
      redirectTo: './?error=plaatsvoorkeuren-saved',
      minimum: 1,
      maximum: 1,
    },
  }).then(response => {
    expect(response.status).to.eql(200)
    cy.log('Plaatsvoorkeur added')
  })
}
