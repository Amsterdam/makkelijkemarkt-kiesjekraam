import { useMutation, useQuery, useQueryClient } from 'react-query'

import { DAALDER_API_QUERY_CONFIG } from '../constants'
import { IApiError, IMarkt, IMarktVoorkeur, IOndernemer, IRsvp, IRsvpPattern } from '../models'
import * as api from '../services/daalderApi'

export const useOndernemer = (erkenningsNummer: string) => {
  return useQuery<IOndernemer, IApiError>(
    'ondernemer',
    () => {
      return api.get(`/koopman/erkenningsnummer/${erkenningsNummer}`)
    },
    DAALDER_API_QUERY_CONFIG
  )
}

export const useRsvp = (erkenningsNummer: string) => {
  return useQuery<IRsvp[], IApiError>(
    ['rsvpAndPattern', 'rsvp'],
    () => {
      return api.get(`/rsvp/koopman/${erkenningsNummer}`)
    },
    DAALDER_API_QUERY_CONFIG
  )
}

export const useSaveRsvp = () => {
  const queryClient = useQueryClient()
  return useMutation<IRsvp[], IApiError, IRsvp[]>(
    (rsvp) => {
      return api.post(`/rsvp`, { rsvps: rsvp })
    },
    {
      ...DAALDER_API_QUERY_CONFIG,
      // onSuccess: () => queryClient.invalidateQueries('rsvp'), // do not invalidate to preserve actual state
      onError: () => queryClient.invalidateQueries('rsvpAndPattern'),
    }
  )
}

export const useRsvpPattern = (erkenningsNummer: string) => {
  return useQuery<IRsvpPattern[], IApiError>(
    ['rsvpAndPattern', 'rsvpPattern'],
    () => {
      return api.get(`/rsvp_pattern/koopman/${erkenningsNummer}`)
    },
    DAALDER_API_QUERY_CONFIG
  )
}

export const useSaveRsvpPattern = () => {
  const queryClient = useQueryClient()
  return useMutation<IRsvpPattern, IApiError, IRsvpPattern>(
    (rsvpPattern) => {
      return api.post(`/rsvp_pattern`, rsvpPattern)
    },
    {
      ...DAALDER_API_QUERY_CONFIG,
      // onSuccess: () => queryClient.invalidateQueries('rsvpPattern'), // do not invalidate to preserve actual state
      onError: () => queryClient.invalidateQueries('rsvpAndPattern'),
      }
  )
}

export const useMarktVoorkeur = (marktId: string, erkenningsNummer: string) => {
  return useQuery<IMarktVoorkeur, IApiError>(
    'marktVoorkeur',
    () => {
      return api.get(`/voorkeur/markt/${marktId}/koopman/${erkenningsNummer}`)
    },
    DAALDER_API_QUERY_CONFIG
  )
}

export const useMarkt = (marktId: string) => {
  return useQuery<IMarkt, IApiError>(
    'markt',
    () => {
      return api.get(`/ondernemer/markt/${marktId}`)
    },
    DAALDER_API_QUERY_CONFIG
  )
}
