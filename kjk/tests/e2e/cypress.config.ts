const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:8093',
    env: {
      marktondernemer_soll: '12345678',
      marktondernemer_vpl: '87654321',
      marktmeester: 'kjk_marktmeester',
      marktbewerker: 'kjk_marktbewerker',
      password: 'insecure',
      keycloak_url: 'http://keycloak:8080/auth',
      url_rsvp_marktondernemer_soll: 'http://localhost:8093/kjk/ondernemer/12345678/aanwezigheid/markt/39',
      url_rsvp_marktondernemer_vpl: 'http://localhost:8093/kjk/ondernemer/87654321/aanwezigheid/markt/39',
      url_rsvp_marktbewerker: 'http://localhost:8093/kjk/ondernemer/12345678/aanwezigheid/markt/39?marktbewerker',
      plaatsvoorkeur_url: 'http://localhost:8093/voorkeuren/39/',
      markt_detail_url: '/markt-detail/39',
      profile_12345678_url: 'http://localhost:8093/profile/12345678',
    },
  },
})
