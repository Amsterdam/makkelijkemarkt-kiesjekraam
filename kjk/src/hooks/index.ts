import { useMutation, useQuery, useQueryClient } from 'react-query'

import { MM_API_QUERY_CONFIG } from '../constants'
import { IApiError, IKjkMededelingen, IMarktVoorkeur, IOndernemer, IRsvp, IRsvpPattern } from '../models'
import * as mmApi from '../services/mmApi'

export const useOndernemer = (erkenningsNummer: string) => {
  return useQuery<IOndernemer, IApiError>(
    'ondernemer',
    () => {
      return mmApi.get(`/koopman/erkenningsnummer/${erkenningsNummer}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useRsvp = (erkenningsNummer: string) => {
  return useQuery<IRsvp[], IApiError>(
    'rsvp',
    () => {
      return mmApi.get(`/rsvp/koopman/${erkenningsNummer}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useSaveRsvp = () => {
  const queryClient = useQueryClient()
  return useMutation<IRsvp, IApiError, IRsvp>(
    (rsvp) => {
      return mmApi.post(`/rsvp`, rsvp)
    },
    {
      ...MM_API_QUERY_CONFIG,
      onSuccess: () => queryClient.invalidateQueries('rsvp'),
    }
  )
}

export const useRsvpPattern = (erkenningsNummer: string) => {
  return useQuery<IRsvpPattern[], IApiError>(
    'rsvpPattern',
    () => {
      return mmApi.get(`/rsvp_pattern/koopman/${erkenningsNummer}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useSaveRsvpPattern = () => {
  const queryClient = useQueryClient()
  return useMutation<IRsvpPattern, IApiError, IRsvpPattern>(
    (rsvpPattern) => {
      return mmApi.post(`/rsvp_pattern`, rsvpPattern)
    },
    {
      ...MM_API_QUERY_CONFIG,
      onSuccess: () => queryClient.invalidateQueries('rsvpPattern'),
    }
  )
}

export const useMarktVoorkeur = (erkenningsNummer: string) => {
  return useQuery<IMarktVoorkeur[], IApiError>(
    'marktVoorkeur',
    () => {
      return mmApi.get(`/marktvoorkeur/koopman/${erkenningsNummer}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useKjkMededelingen = (marktId: string) => {
  return useQuery<IKjkMededelingen, IApiError>(
    'kjkMededelingen',
    () => {
      return mmApi.get(`/kjk-mededelingen/${marktId}`)
    },
    MM_API_QUERY_CONFIG
  )
}
