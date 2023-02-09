# E2E tests with Cypress

- Run all tests headless: `npm run headless`

- Run tests in open mode: `npm run open`

- Run tests headless and skip tests with tag @slow: `npm run skipSlow`

- Run tests headless with browser type: `BROWSER=<browser> npm run withBrowser`
  Example: `BROWSER=firefox npm run browserChoice`
  Browser should be installed on local system, except electron.
  Browser types:
  - chrome
  - firefox
  - edge
  - electron
