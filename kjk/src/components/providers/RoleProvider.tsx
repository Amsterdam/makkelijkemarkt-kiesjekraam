import React from 'react'
import { useLocation } from 'react-router-dom'

import { MARKTMEESTER_HOME_LINK, ONDERNEMER_HOME_LINK } from '../../constants'

export const RoleContext = React.createContext({ homeUrl: '', isMarktMeester: false })

export const RoleProvider: React.FC = (props) => {
  const { search } = useLocation()
  const isMarktMeester = new URLSearchParams(search).has('marktmeester')
  const homeUrl = isMarktMeester ? MARKTMEESTER_HOME_LINK : ONDERNEMER_HOME_LINK

  const roleContext = {
    isMarktMeester,
    homeUrl,
  }
  return <RoleContext.Provider value={roleContext}>{props.children}</RoleContext.Provider>
}

export default RoleProvider
