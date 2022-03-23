import { rest, RestContext, RestRequest, ResponseComposition } from 'msw'
import { MM_API_BASE_URL } from '../../constants'
import { genericBranches } from '../../fixtures'

const DELAY = 500
const getDelay = (ctx: RestContext) => ctx.delay(process.env.REACT_APP_MOCK_SERVICE_WORKER ? DELAY : 0)

const unsafeMethodDefaultHandler = (req: RestRequest, res: ResponseComposition, ctx: RestContext) => {
  console.error('No mock handler implemented for this modification request')
  return res(ctx.status(501), ctx.json(req.body))
}

const unsafeMethodDefaultCatchers = [
  rest.post('*', unsafeMethodDefaultHandler),
  rest.put('*', unsafeMethodDefaultHandler),
  rest.delete('*', unsafeMethodDefaultHandler),
  rest.patch('*', unsafeMethodDefaultHandler),
]

const brancheHandlers = [
  rest.get(`${MM_API_BASE_URL}/branche/all`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(genericBranches))
  }),
  rest.post(`${MM_API_BASE_URL}/branche`, (req, res, ctx) => {
    const id = Math.max(...genericBranches.map((branche) => branche.id)) + Math.random() * 1000
    return res(getDelay(ctx), ctx.json({ ...(req.body as {}), id }))
  }),
  rest.put(`${MM_API_BASE_URL}/branche/:id`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(req.body))
  }),
  rest.delete(`${MM_API_BASE_URL}/branche/:id`, (req, res, ctx) => {
    return res(getDelay(ctx))
  }),
]

export const handlers = [
  rest.get(`${MM_API_BASE_URL}/obstakel/all`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json([]))
  }),
  rest.get(`${MM_API_BASE_URL}/plaatseigenschap/all`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json([]))
  }),
  ...brancheHandlers,
  ...unsafeMethodDefaultCatchers,
]

export const errorHandlers = {
  putBranche500: rest.put(`${MM_API_BASE_URL}/branche/:id`, (req, res, ctx) => {
    return res(ctx.status(500))
  }),
}
