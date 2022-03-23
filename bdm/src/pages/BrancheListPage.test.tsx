import React from 'react'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryCache, QueryClient, QueryClientProvider } from 'react-query'
import * as reducers from '../reducers'

import BrancheListPage from './BrancheListPage'
import MarktGenericDataProvider from '../components/providers/MarktGenericDataProvider'
import { server } from '../mocks/mmApiServiceWorker/nodeEnvironment'
import { errorHandlers } from '../mocks/mmApiServiceWorker/handlers'

const REACT_QUERY_RETRY_TIMEOUT = { timeout: 1200 }
const queryClient = new QueryClient()
const queryCache = new QueryCache()

beforeAll(() => {
  server.listen()
})

beforeEach(() => {
  jest.spyOn(console, 'error')
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockImplementation(() => null)
  render(
    <QueryClientProvider client={queryClient}>
      <MarktGenericDataProvider>
        <BrancheListPage />
      </MarktGenericDataProvider>
    </QueryClientProvider>
  )
})

afterEach(() => {
  server.resetHandlers()
  queryCache.clear()
  // @ts-ignore jest.spyOn adds this functionallity
  console.error.mockRestore()
})

afterAll(() => {
  server.close()
})

describe('Fetching branches', () => {
  it('Immediately shows column headers', async () => {
    expect(screen.getByText('Afkorting')).toBeInTheDocument()
    expect(screen.getByText('Omschrijving')).toBeInTheDocument()
  })

  it('Shows skeleton loading during api fetch', async () => {
    const skeletonLoadingButtons = await screen.findAllByTestId('skeleton-button')
    expect(skeletonLoadingButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('Replaces skeleton loading elements with actual branches after fetching', async () => {
    const brancheAfkortingInput = await screen.findByDisplayValue('101-agf')
    expect(brancheAfkortingInput).toBeInTheDocument()

    const skeletonLoadingButtons = screen.queryAllByTestId('skeleton-button')
    expect(skeletonLoadingButtons).toHaveLength(0)
  })
})

describe('Afkorting input and save button', () => {
  const getSaveButtonAfterTypingInAfkortingInput = async () => {
    const brancheAfkortingInput = await screen.findByDisplayValue('101-agf')
    userEvent.type(brancheAfkortingInput, '_more-text')
    return screen.getByText('Opslaan')
  }

  const getSpinnerAfterClickingSaveButton = async (saveButton: HTMLElement) => {
    userEvent.click(saveButton)
    return await screen.findByLabelText('loading')
  }

  it('Shows a save button when I type in the Afkorting input', async () => {
    const saveButton = await getSaveButtonAfterTypingInAfkortingInput()
    expect(saveButton).toBeInTheDocument()
  })

  it('Briefly shows a spinner and then hides the save button when I clickt it', async () => {
    const reducer = jest.spyOn(reducers, 'itemReducer')
    const saveButton = await getSaveButtonAfterTypingInAfkortingInput()
    const spinner = await getSpinnerAfterClickingSaveButton(saveButton)
    await waitForElementToBeRemoved(spinner, REACT_QUERY_RETRY_TIMEOUT)

    expect(spinner).not.toBeInTheDocument()
    expect(saveButton).not.toBeInTheDocument()

    expect(reducer).lastCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'REPLACE_ITEM',
        payload: expect.objectContaining({
          newItem: expect.objectContaining({
            afkorting: '101-agf_more-text',
          }),
        }),
      })
    )
    reducer.mockRestore()
  })

  it('Shows a warning when the save hits a network error', async () => {
    server.use(errorHandlers.putBranche500)
    const saveButton = await getSaveButtonAfterTypingInAfkortingInput()
    const spinner = await getSpinnerAfterClickingSaveButton(saveButton)
    await waitForElementToBeRemoved(spinner, REACT_QUERY_RETRY_TIMEOUT)

    const notification = await screen.findByText(new RegExp(`Netwerk fout 500`)) // or findByLabel('alert')
    expect(notification).toBeInTheDocument()
  })
})
