import { Progress } from 'antd'
import React from 'react'

import { MarktContext } from './providers/MarktDataProvider'
import CreateMarktConfig from './CreateMarktConfig'
import ErrorPage from '../pages/ErrorPage'
import CenterStageStyled from './CenterStage.styled'
import { MarktGenericContext } from './providers/MarktGenericDataProvider'
import MarketPage from '../pages/MarketPage'
import { IMarktContext, IMarktGenericContext, IQueryContext } from '../models'

const MarktPageWrapper: React.FC = () => {
  const marktContext = React.useContext(MarktContext) as IMarktContext & IQueryContext
  const marktGenericContext = React.useContext(MarktGenericContext) as IMarktGenericContext & IQueryContext
  const { marktId, marktConfigNotFound, markt, marktNotFound, isLoading, isSuccess, queryProgress = 0 } = marktContext

  if (isLoading || marktGenericContext.isLoading) {
    return (
      <CenterStageStyled>
        <div data-testid="circular-progress">
          <Progress type="circle" percent={Math.floor(queryProgress * 100)} />
        </div>
      </CenterStageStyled>
    )
  }

  if (isSuccess && marktGenericContext.isSuccess) {
    return <MarketPage marktGenericContext={marktGenericContext} />
  }

  if (marktConfigNotFound && markt) {
    return <CreateMarktConfig />
  }

  if (marktNotFound) {
    return <p>Markt met id {marktId} kon niet gevonden worden</p>
  }
  return <ErrorPage />
}

export default MarktPageWrapper
