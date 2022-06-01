import React from 'react'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Route, Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'

import * as reducers from '../reducers'
import MarktDataProvider from '../components/providers/MarktDataProvider'
import MarktGenericDataProvider from '../components/providers/MarktGenericDataProvider'
import MarktPageWrapper from '../components/MarktPageWrapper'
import { server } from '../mocks/mmApiServiceWorker/nodeEnvironment'
import { errorHandlers } from '../mocks/mmApiServiceWorker/handlers'

const REACT_QUERY_RETRY_TIMEOUT = { timeout: 1200 }
const queryClient = new QueryClient()
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
  queryClient.clear() // clear cache
  server.resetHandlers()
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockRestore()
})

afterAll(() => {
  server.close()
})

describe('Loading markt configuratie', () => {
  it('Shows a spinner while loading', async () => {
    const spinner = await screen.findByTestId('circular-progress')
    expect(spinner).toBeInTheDocument()
  })

  it('Shows the markt title after loading', async () => {
    const spinner = await screen.findByTestId('circular-progress')
    await waitForElementToBeRemoved(spinner, REACT_QUERY_RETRY_TIMEOUT)
    expect(screen.getByText('Albert Cuyp-2022')).toBeInTheDocument()
  })

  it('Shows the markt title after loading', async () => {
    const spinner = await screen.findByTestId('circular-progress')
    await waitForElementToBeRemoved(spinner, REACT_QUERY_RETRY_TIMEOUT)
    expect(screen.getByText('Albert Cuyp-2022')).toBeInTheDocument()
  })
})
