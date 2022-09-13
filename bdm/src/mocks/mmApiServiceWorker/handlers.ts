import { rest, RestContext, RestRequest, ResponseComposition } from 'msw'
import { MM_API_BASE_URL } from '../../constants'
import * as fixtures from '../../fixtures'
import { Branche } from '../../models'

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
    return res(getDelay(ctx), ctx.json(fixtures.genericBranches))
  }),
  rest.post(`${MM_API_BASE_URL}/branche`, (req, res, ctx) => {
    const id = Math.max(...fixtures.genericBranches.map((branche: Branche) => branche.id)) + Math.random() * 1000
    return res(getDelay(ctx), ctx.json({ ...(req.body as {}), id }))
  }),
  rest.put(`${MM_API_BASE_URL}/branche/:id`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(req.body))
  }),
  rest.delete(`${MM_API_BASE_URL}/branche/:id`, (req, res, ctx) => {
    return res(getDelay(ctx))
  }),
]

const marktHandlers = [
  rest.get(`${MM_API_BASE_URL}/markt/:id`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(fixtures.markt))
  }),
  rest.get(`${MM_API_BASE_URL}/markt/:id/marktconfiguratie/latest`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(fixtures.marktConfiguratie))
  }),
  rest.post(`${MM_API_BASE_URL}/markt/99/marktconfiguratie`, (req, res, ctx) => {
    // post to markt 99 to receive a 500
    return res(ctx.delay(2000), ctx.status(500))
  }),
  rest.post(`${MM_API_BASE_URL}/markt/:id/marktconfiguratie`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(req.body))
  }),
]

export const handlers = [
  rest.get(`${MM_API_BASE_URL}/obstakel/all`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(fixtures.obstakels))
  }),
  rest.get(`${MM_API_BASE_URL}/plaatseigenschap/all`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.json(fixtures.plaatseigenschappen))
  }),
  ...brancheHandlers,
  ...marktHandlers,
  ...unsafeMethodDefaultCatchers,
]

export const errorHandlers = {
  putBranche500: rest.put(`${MM_API_BASE_URL}/branche/:id`, (req, res, ctx) => {
    return res(ctx.status(500))
  }),
  postMarktconfiguratie500: rest.post(`${MM_API_BASE_URL}/markt/:id/marktconfiguratie`, (req, res, ctx) => {
    return res(getDelay(ctx), ctx.status(500))
  }),
}
