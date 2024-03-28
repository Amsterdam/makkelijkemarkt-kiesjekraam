

// Move to constants file or env?
const APP_NAME = 'KiesJeKraam';

export function setupAppInsights() {
    if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
        const appInsights = require('applicationinsights');
        appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(true)
            .setUseDiskRetryCaching(true)
            .start();
        appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = process.env.APP_NAME || APP_NAME;
        appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRoleInstance] = process.env.HOSTNAME;
        console.log('Application Insights enabled');
    }
}

