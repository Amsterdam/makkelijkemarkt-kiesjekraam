import { GlobalStyle, Header, ThemeProvider } from '@amsterdam/asc-ui'
import React, { Component } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Layout } from 'antd'

import ErrorPage from './pages/ErrorPage'
import AanwezigheidsPage from './pages/AanwezigheidsPage'
import RoleProvider, { RoleContext } from './components/providers/RoleProvider'

if (process.env.REACT_APP_MOCK_SERVICE_WORKER) {
  const { worker } = require('./mocks/mmApiServiceWorker/browser')
  worker.start({
    serviceWorker: {
      url: '/kjk/mockServiceWorker.js',
    },
  })
}

const { Footer } = Layout
const queryClient = new QueryClient()

const CustomHeader = () => {
  const { homeUrl } = React.useContext(RoleContext)
  return <Header tall={false} title="Kies Je Kraam" fullWidth={false} homeLink={homeUrl} css={{ zIndex: '99' }} />
}

export default class App extends Component {
  render() {
    return (
      <ThemeProvider>
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
