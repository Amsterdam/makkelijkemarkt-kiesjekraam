const { defineConfig } = require('cypress')

module.exports = defineConfig({
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  videoUploadOnPasses: false,
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      const { removeDirectory } = require('cypress-delete-downloads-folder')
      on('task', { removeDirectory })
      require('@cypress/grep/src/plugin')(config)
      return config
    },
    baseUrl: 'http://localhost:8093',
    env: {
      // users
      marktbewerker: 'kjk_marktbewerker',
      marktmeester: 'kjk_marktmeester',
      marktondernemer_soll: '12345678',
      marktondernemer_vpl: '87654321',
      password: 'insecure',
      // url's
      dashboard_url: '/dashboard/',
      keycloak_url: 'http://keycloak:8080/auth',
      langdurigAfgemeld_url: 'markt/39/langdurig-afgemeld/',
      markt_url: '/markt/39/',
      markt_detail_url: '/markt-detail/39',
      markten_url: '/markt/',
      marktvoorkeur_url: '/algemene-voorkeuren/39/',
      marktvoorkeur_url_soll: '/ondernemer/2096805017/algemene-voorkeuren/39/',
      marktvoorkeur_url_vpl: '/ondernemer/2099983483/algemene-voorkeuren/39/',
      plaatsvoorkeur_url: '/voorkeuren/39/',
      plaatsvoorkeur_url_soll: '/ondernemer/12345678/voorkeuren/39/',
      plaatsvoorkeur_url_vpl: '/ondernemer/87654321/voorkeuren/39/',
      profile_soll_url: '/profile/12345678',
      profile_vpl_url: '/profile/87654321',
      rsvp_marktbewerker_url: '/kjk/ondernemer/12345678/aanwezigheid/markt/39?marktbewerker',
      rsvp_marktondernemer_soll_url: '/kjk/ondernemer/12345678/aanwezigheid/markt/39',
      rsvp_marktondernemer_vpl_url: '/kjk/ondernemer/87654321/aanwezigheid/markt/39',
    },
  },
})
