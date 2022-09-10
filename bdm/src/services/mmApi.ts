import { MM_API_BASE_URL } from '../constants'
import { IApiError, IMarktConfiguratie } from '../models'

export const initialMarktConfiguratie: IMarktConfiguratie = {
  branches: [],
  locaties: [],
  marktOpstelling: { rows: [] },
  geografie: { obstakels: [] },
  paginas: [],
}

const handleResponse = async (response: Response) => {
  let responseData
  try {
    responseData = await response.json()
  } catch {
    responseData = {} // in case of empty response body
  }

  if (!response.ok) {
    const customError: IApiError = new Error(responseData.message?.error) // customError.message
    customError.status = response.status
    customError.statusText = response.statusText
    throw customError
  }
  return responseData
}

const apiMethod = (method: string) => async (uri: string) => {
  const response = await fetch(`${MM_API_BASE_URL}${uri}`, { method })
  return handleResponse(response)
}

const apiMethodWithPayload = (method: string) => async (uri: string, data: {}) => {
  const response = await fetch(`${MM_API_BASE_URL}${uri}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return handleResponse(response)
}

export const get = apiMethod('get')
export const delete_ = apiMethod('delete')
export const post = apiMethodWithPayload('post')
export const put = apiMethodWithPayload('put')
