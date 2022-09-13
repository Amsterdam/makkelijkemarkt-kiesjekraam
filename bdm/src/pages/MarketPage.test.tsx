import React from 'react'
import { render, screen, waitForElementToBeRemoved, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Route, Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'

import * as mmApi from '../services/mmApi'
import MarktDataProvider from '../components/providers/MarktDataProvider'
import MarktGenericDataProvider from '../components/providers/MarktGenericDataProvider'
import MarktPageWrapper from '../components/MarktPageWrapper'
import { server } from '../mocks/mmApiServiceWorker/nodeEnvironment'

const queryClient = new QueryClient()

const ANTD_NOTIFICATION_TIMEOUT = { timeout: 4500 + 1000 } // Antd default notification duration = 4.5 seconds
const REACT_QUERY_RETRY_TIMEOUT = { timeout: 1200 }
const MARKT_ROUTE = '/markt/204'

beforeAll(() => {
  server.listen()
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })
})

beforeEach(() => {
  jest.spyOn(console, 'error')
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockImplementation(() => null)
  queryClient.clear() // clear cache

  const history = createMemoryHistory()
  history.push(MARKT_ROUTE)

  render(
    <QueryClientProvider client={queryClient}>
      <Router history={history}>
        <Route exact path="/markt/:marktId">
          <MarktGenericDataProvider>
            <MarktDataProvider>
              <MarktPageWrapper />
            </MarktDataProvider>
          </MarktGenericDataProvider>
        </Route>
      </Router>
    </QueryClientProvider>
  )
})

afterEach(() => {
  server.resetHandlers()
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockRestore()
})

afterAll(() => {
  server.close()
})

const getLoadingSpinner = async () => {
  return await screen.findByTestId('circular-progress')
}

const waitForLoadingSpinnerToBeRemoved = async () => {
  await waitForElementToBeRemoved(await getLoadingSpinner(), REACT_QUERY_RETRY_TIMEOUT)
}

const getSaveButton = async () => {
  const saveButtonText = screen.getByText('Marktconfiguratie opslaan')
  const saveButton = saveButtonText.closest('button') as HTMLElement
  // you can debug the element like this: screen.debug(actualButton)
  return saveButton
}

const getSavingSpinner = async () => {
  const saveButton = await getSaveButton()
  const withinSaveButton = within(saveButton)
  return await withinSaveButton.findByLabelText('loading')
}

const waitForSavingSpinnerToBeRemoved = async () => {
  await waitForElementToBeRemoved(await getSavingSpinner(), REACT_QUERY_RETRY_TIMEOUT)
}

const removeNotificationFromDom = (notification: HTMLElement) => {
  const notificationParent = notification.parentElement as HTMLElement
  notificationParent.removeChild(notification)
}

describe('Loading markt configuratie', () => {
  it('Shows a spinner while loading', async () => {
    expect(await getLoadingSpinner()).toBeInTheDocument()
  })

  it('Shows the markt title after loading', async () => {
    await waitForLoadingSpinnerToBeRemoved()
    expect(screen.getByText('Albert Cuyp-2022')).toBeInTheDocument()
  })
})

describe('Saving markt configuratie', () => {
  it('Has a save button on screen', async () => {
    await waitForLoadingSpinnerToBeRemoved()
    const saveButton = await getSaveButton()
    expect(saveButton).toBeInTheDocument()
  })

  it('Shows a temporary spinner in the save button when this button is clicked', async () => {
    await waitForLoadingSpinnerToBeRemoved()
    userEvent.click(await getSaveButton())
    const spinner = await getSavingSpinner()
    expect(spinner).toBeInTheDocument()
    await waitForSavingSpinnerToBeRemoved()
    expect(spinner).not.toBeInTheDocument()
    const notification = await screen.findByText(new RegExp(`Gereed`))
    // need to explicitly remove Antd notification from DOM otherwise it's still there in the next test
    removeNotificationFromDom(notification)
  })

  it('Shows a confirmation after succesful save that auto disappears', async () => {
    await waitForLoadingSpinnerToBeRemoved()
    userEvent.click(await getSaveButton())
    await waitForSavingSpinnerToBeRemoved()
    const notification = await screen.findByText(new RegExp(`Gereed`))
    expect(notification).toBeInTheDocument()
    await waitForElementToBeRemoved(notification, ANTD_NOTIFICATION_TIMEOUT)
    expect(notification).not.toBeInTheDocument()
  })
})

describe.each(['bak', 'bak-licht'])('Setting bak properties for kraam', (bakType) => {
  beforeEach(async () => {
    await waitForLoadingSpinnerToBeRemoved()
  })

  it(`Is possible to set ${bakType} property for kraam 2`, async () => {
    const bakTypeIcon = `icon-${bakType}`
    expect(screen.queryByTestId(bakTypeIcon)).not.toBeInTheDocument()
    const apiSpyOnPost = jest.spyOn(mmApi, 'post')

    const kraam2 = screen.getByText('2')
    userEvent.click(kraam2)

    const bakLichtRadioButton = screen.getByDisplayValue(bakType)
    userEvent.click(bakLichtRadioButton)
    expect(screen.queryByTestId(bakTypeIcon)).toBeInTheDocument()

    const saveButton = screen.getByText('Marktconfiguratie opslaan')
    userEvent.click(saveButton)

    const saveSpinner = await screen.findByLabelText('loading')
    await waitForElementToBeRemoved(saveSpinner, REACT_QUERY_RETRY_TIMEOUT)

    expect(apiSpyOnPost).lastCalledWith(
      `${MARKT_ROUTE}/marktconfiguratie`,
      expect.objectContaining({
        locaties: expect.arrayContaining([
          expect.objectContaining({
            plaatsId: '2',
            bakType,
          }),
        ]),
      })
    )

    expect(screen.queryByTestId(bakTypeIcon)).toBeInTheDocument()
    apiSpyOnPost.mockRestore()
  })
})
