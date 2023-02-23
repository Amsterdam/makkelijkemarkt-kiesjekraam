import { ROUTES } from './routes'
import { MARKTENOVERZICHT } from './selectors'

const { buttonAddBranch, buttonDelete, buttonMenu, buttonSave, editBranches, header, tableRow } = MARKTENOVERZICHT

/**
 * Function to add a branche.
 * @example addBranch('999 - Test', '999 - Branche')
 * @param {string} abbreviation - branche abbreviation.
 * @param {string} description - branch description.
 */
export const addBranch = (abbreviation: string, description: string): void => {
  cy.intercept('POST', ROUTES.branche).as('postBranche')
  cy.intercept('PUT', ROUTES.brancheSpecific).as('putBranche')

  cy.get(buttonAddBranch).click()
  cy.wait('@postBranche')
  cy.get(tableRow)
    .last()
    .find('input')
    .first()
    .type(abbreviation)

  cy.get(tableRow)
    .last()
    .find('input')
    .last()
    .type(description)

  cy.get(buttonSave).click()
  cy.wait('@putBranche')
}

/**
 * Function to assert markets overview.
 * @example assertMarketsOverview()
 */
export const assertMarketsOverview = (): void => {
  cy.get('h1')
    .should('contain', 'Markten')
    .and('be.visible')
  cy.get(editBranches).should('be.visible')
}

/**
 * Function to delete the last branch in the table.
 * @example deleteLastBranche()
 */
export const deleteLastBranche = (): void => {
  cy.intercept('DELETE', ROUTES.brancheSpecific).as('deleteBranche')

  cy.get(buttonDelete)
    .last()
    .click()
  cy.wait('@deleteBranche')
}

/**
 * Function to open and assert the page to edit a branche.
 * @example openEditBranchePage()
 */
export const openEditBranchePage = (): void => {
  cy.intercept('GET', ROUTES.branchesAll).as('getBranches')
  cy.intercept('GET', ROUTES.obstakel).as('getObstakel')
  cy.intercept('GET', ROUTES.plaatseigenschap).as('getPlaatseigenschap')

  cy.get(buttonMenu)
    .invoke('show')
    .click()
  cy.wait('@getBranches')
  cy.wait('@getObstakel')
  cy.wait('@getPlaatseigenschap')
  cy.get(header)
    .contains('Bewerk de markten')
    .should('be.visible')
  cy.get(tableRow)
    .should('be.visible')
    .and('have.length.gt', 10)
}
