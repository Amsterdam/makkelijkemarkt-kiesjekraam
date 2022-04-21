import { GlobalStyle, Header, ThemeProvider } from '@amsterdam/asc-ui'
import React, { Component } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Layout } from 'antd'

import ErrorPage from './pages/ErrorPage'
import BrancheListPage from './pages/BrancheListPage'
import MarktDataProvider from './components/providers/MarktDataProvider'
import MarktGenericDataProvider from './components/providers/MarktGenericDataProvider'
import MarktPageWrapper from './components/MarktPageWrapper'
import { HOME_LINK } from './constants'

import { DownloadPage, UploadPage } from './pages/DownloadUploadPage'

if (process.env.REACT_APP_MOCK_SERVICE_WORKER) {
  const { worker } = require('./mocks/mmApiServiceWorker/browser')
  worker.start({
    serviceWorker: {
      url: '/bdm/mockServiceWorker.js',
    },
  })
}

const { Footer } = Layout
const queryClient = new QueryClient()

export default class App extends Component {
  render() {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <GlobalStyle />
          <div className="App">
            <BrowserRouter basename="/bdm">
              <Header tall={false} title="Bewerk de markten" fullWidth={false} homeLink={HOME_LINK} />
              <div className="site-layout-content">
                <Switch>
                  <Route exact path="/markt/:marktId">
                    <MarktGenericDataProvider>
                      <MarktDataProvider>
                        <MarktPageWrapper />
                      </MarktDataProvider>
                    </MarktGenericDataProvider>
                  </Route>
                  <Route exact path="/branches">
                    <MarktGenericDataProvider>
                      <BrancheListPage />
                    </MarktGenericDataProvider>
                  </Route>
                  <Route exact path="/download-config">
                    <DownloadPage />
                  </Route>
                  <Route exact path="/upload-config">
                    <UploadPage />
                  </Route>
                  <Route component={ErrorPage} />
                </Switch>
              </div>
            </BrowserRouter>
          </div>
          <Footer />
        </QueryClientProvider>
      </ThemeProvider>
    )
  }
}
