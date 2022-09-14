import React from 'react'
import { useParams } from 'react-router-dom'

import { IMarktContext, IQueryContext } from '../../models'
import { useMarkt, useMarktConfig, useSaveMarktConfig } from '../../hooks'
import { getQueryContext } from './MarktGenericDataProvider'

export const MarktContext = React.createContext<Partial<IMarktContext & IQueryContext>>({})

export const MarktDataProvider: React.FC = (props) => {
  const { marktId } = useParams<{ marktId: string }>()
  const {
    mutate: saveMarktConfig,
    isLoading: saveInProgress,
    isError: saveIsError,
    isSuccess: saveIsSuccess,
    error: saveError,
  } = useSaveMarktConfig(marktId)

  const markt = useMarkt(marktId)
  const marktConfig = useMarktConfig(marktId)
  const queries = [markt, marktConfig]

  const marktContext: IMarktContext & IQueryContext = {
    marktId,
    saveMarktConfig,
    saveInProgress,
    saveIsSuccess,
    saveIsError,
    saveError,
    markt: markt.data,
    marktNotFound: marktConfig.error?.status === 404,
    marktConfig: marktConfig.data,
    marktConfigNotFound: marktConfig.error?.status === 404,
    ...getQueryContext(queries),
  }
  return <MarktContext.Provider value={marktContext}>{props.children}</MarktContext.Provider>
}

export default MarktDataProvider
