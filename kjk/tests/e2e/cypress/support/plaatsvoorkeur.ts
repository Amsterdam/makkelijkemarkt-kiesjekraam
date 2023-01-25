import { PLAATSVOORKEUR } from './selectors'
import { ROUTES } from './routes'

const {
  buttonDelete,
  checkboxAnywhere,
  draggableListItem,
  draggableListItemHandle,
  radiobuttonAmount1,
  radiobuttonExtra0,
  selectMarktplaats,
  spinner,
} = PLAATSVOORKEUR

export const assertPriorityPlaces = (places: string[]): void => {
  for (let i = 0; i < places.length; i++) {
    cy.get(draggableListItem)
      .eq(i)
      .should('have.text', places[i])
  }
}

export const checkAmountOfPlaces = (amount: string): void => {
  cy.get(`#default-count-${amount}`)
    .check({ force: true })
    .should('be.checked')
  cy.wait('@postVoorkeuren')
  // cy.wait(200)
  cy.wait('@getVoorkeuren')
  cy.get(spinner).should('not.exist')
}

export const checkAnywhere = (): void => {
  cy.get(checkboxAnywhere)
    .check({ force: true })
    .should('be.checked')
  cy.wait('@postVoorkeuren')
  // cy.wait(200)
  cy.wait('@getVoorkeuren')
  cy.get(spinner).should('not.be.exist')
}

export const checkExtraAmountOfPlaces = (amount: string): void => {
  cy.get(`#extra-count-${amount}`)
    .check({ force: true })
    .should('be.checked')
  cy.wait('@postVoorkeuren')
  // cy.wait(200)
  cy.wait('@getVoorkeuren')
  cy.get(spinner).should('not.be.exist')
}

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

export const resetPlaatsvoorkeur = (type: 'soll' | 'vpl'): void => {
  cy.intercept('POST', ROUTES.voorkeuren).as('postVoorkeuren')
  cy.visit(Cypress.env('plaatsvoorkeur_url'))
  cy.get(radiobuttonAmount1).check({ force: true })
  cy.get(spinner).should('not.exist')
  cy.get(radiobuttonExtra0).check({ force: true })
  cy.get(spinner).should('not.exist')
  if (type === 'soll') {
    cy.get(checkboxAnywhere).uncheck({ force: true })
  }
  cy.get(spinner).should('not.exist')
  // If there are delete buttons, click them all
  cy.get('body').then($body => {
    if ($body.find(buttonDelete).length > 0) {
      cy.get(buttonDelete).then($elems => {
        Cypress._.times($elems.length, () => {
          cy.get('.Draggable-list-item__delete:first')
            .click()
            .should('not.exist')
        })
      })
    } else {
      cy.log('No buttons to delete')
    }
  })
}

export const selectPlacePreference = (placeNumbers: string[]): void => {
  for (let i = 0; i < placeNumbers.length; i++) {
    cy.get(selectMarktplaats).select(placeNumbers[i])
    cy.wait('@postVoorkeuren')
    // cy.wait(200)
    cy.wait('@getVoorkeuren')
    cy.get(spinner).should('not.be.exist')
  }
}

// DOES NOT WORK, TODO
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
