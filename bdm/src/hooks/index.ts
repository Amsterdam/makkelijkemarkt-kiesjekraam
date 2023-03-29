import { useMutation, useQuery, useQueryClient } from 'react-query'
import { sortBy } from 'lodash'

import { MM_API_QUERY_CONFIG } from '../constants'
import {
  Branche,
  IAllocationApiData,
  IApiError,
  ICreateAllocationBody,
  IMarktConfiguratie,
  INaam,
  IPlaatsvoorkeur,
  ISollicitatie,
  MMarkt,
} from '../models'
import * as mmApi from '../services/mmApi'

export const useGenericBranches = () => {
  return useQuery<Branche[], IApiError>(
    'genericBranches',
    () => {
      return mmApi.get(`/branche/all`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useCreateGenericBranche = () => {
  return useMutation<Branche, IApiError, Omit<Branche, 'id'>>((branche) => {
    return mmApi.post(`/branche`, branche)
  }, MM_API_QUERY_CONFIG)
}

export const useUpdateGenericBranche = (brancheId: string | number) => {
  return useMutation<Branche, IApiError, Branche>((branche: Branche) => {
    return mmApi.put(`/branche/${brancheId}`, branche)
  }, MM_API_QUERY_CONFIG)
}

export const useDeleteGenericBranche = (brancheId: string | number) => {
  return useMutation<Branche, IApiError>(() => {
    return mmApi.delete_(`/branche/${brancheId}`)
  }, MM_API_QUERY_CONFIG)
}

export const useMarktConfig = (marktId: string) => {
  return useQuery<IMarktConfiguratie, IApiError>(
    'marktconfig',
    () => {
      return mmApi.get(`/markt/${marktId}/marktconfiguratie/latest`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useSaveMarktConfig = (marktId: string) => {
  const queryClient = useQueryClient()
  return useMutation<IMarktConfiguratie, IApiError, IMarktConfiguratie>(
    (marktConfiguratie) => {
      return mmApi.post(`/markt/${marktId}/marktconfiguratie`, marktConfiguratie)
    },
    {
      ...MM_API_QUERY_CONFIG,
      onSuccess: () => queryClient.invalidateQueries('marktconfig'),
    }
  )
}

export const useObstakel = () => {
  return useQuery<INaam[], IApiError>(
    'obstakel',
    async () => {
      const obstakel = await mmApi.get(`/obstakel/all`)
      return sortBy(obstakel, 'naam')
    },
    MM_API_QUERY_CONFIG
  )
}

export const usePlaatseigenschap = () => {
  return useQuery<INaam[], IApiError>(
    'plaatseigenschap',
    async () => {
      const plaatseigenschap = await mmApi.get(`/plaatseigenschap/all`)
      return sortBy(plaatseigenschap, 'naam')
    },
    MM_API_QUERY_CONFIG
  )
}

export const useMarkt = (marktId: string) => {
  return useQuery<MMarkt, IApiError>(
    'markt',
    () => {
      return mmApi.get(`/markt/${marktId}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useAllocation = (marktId: string, date: string) => {
  return useQuery<IAllocationApiData[], IApiError>(
    'allocation',
    () => {
      return mmApi.get(`/allocation/markt/${marktId}/date/${date}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useSaveAllocation = (marktId: string, date: string) => {
  const queryClient = useQueryClient()
  return useMutation<ICreateAllocationBody, IApiError, ICreateAllocationBody>(
    (allocation) => {
      return mmApi.post(`/allocation/markt/${marktId}/date/${date}`, allocation)
    },
    {
      ...MM_API_QUERY_CONFIG,
      onSuccess: () => queryClient.invalidateQueries('allocation'),
    }
  )
}

export const useSollicitaties = (marktId: string) => {
  return useQuery<ISollicitatie[], IApiError>(
    'sollicitaties',
    () => {
      return mmApi.get(`/sollicitaties/markt/${marktId}?listLength=10000&includeDoorgehaald=0`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const usePlaatsvoorkeur = (marktId: string) => {
  return useQuery<IPlaatsvoorkeur[], IApiError>(
    'plaatsvoorkeur',
    () => {
      return mmApi.get(`/plaatsvoorkeur/markt/${marktId}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useAllocationOverview = (marktId: string, date: string) => {
  return useQuery<any[], IApiError>(
    `allocationOverview/${marktId}/${date}`,
    () => {
      return mmApi.get(`/allocation_v2/markt/${marktId}/date/${date}`)
    },
    MM_API_QUERY_CONFIG
  )
}

export const useAllocationV2 = (id: number) => {
  return useQuery<any[], IApiError>(
    `allocationDetail/${id}`,
    () => {
      return mmApi.get(`/allocation_v2/${id}`)
    },
    {
      ...MM_API_QUERY_CONFIG,
      staleTime: 10 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  )
}
