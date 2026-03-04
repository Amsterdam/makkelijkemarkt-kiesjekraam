import { GlobalStyle, Header, ThemeProvider } from '@amsterdam/asc-ui'
import React, { Component } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Layout } from 'antd'

import ErrorPage from './pages/ErrorPage'
import AanwezigheidsPage from './pages/AanwezigheidsPage'
import RoleProvider, { RoleContext } from './components/providers/RoleProvider'

const { Footer } = Layout
const queryClient = new QueryClient()

const CustomHeader = () => {
  const { homeUrl } = React.useContext(RoleContext)
  return <Header tall={false} title="Kies Je Kraam" fullWidth={false} homeLink={homeUrl} css={{ zIndex: '99' }} />
}

export default class App extends Component {
  render() {
    return (
      // deep={false}: avoids deepmerge on the null-prototype ESM namespace object (ascDefaultTheme), which crashes in the Rollup production build
      <ThemeProvider deep={false}>
        <QueryClientProvider client={queryClient}>
          <GlobalStyle />
          <div className="App">
            <BrowserRouter basename="/kjk">
              <RoleProvider>
                <CustomHeader />
                <div className="site-layout-content">
                  <Switch>
                    <Route exact path="/ondernemer/:erkenningsNummer/aanwezigheid/markt/:marktId">
                      <AanwezigheidsPage />
                    </Route>
                    <Route component={ErrorPage} />
                  </Switch>
                </div>
              </RoleProvider>
            </BrowserRouter>
          </div>
          <Footer />
        </QueryClientProvider>
      </ThemeProvider>
    )
  }
}
