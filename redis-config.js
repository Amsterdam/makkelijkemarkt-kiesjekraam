const redisHost = process.env.REDIS_HOST
const redisPort = process.env.REDIS_PORT
const redisPassword = process.env.REDIS_PASSWORD

const redisUrl = process.env.APP_ENV === 'local'  ?
    `redis://${redisHost}:${redisPort}` :
    `rediss://${redisHost}:${redisPort}`

const config = {
    legacyMode: true,
    url: redisUrl,
    password: redisPassword,
    retry_strategy: function (options) {
        if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
            // Try reconnecting after 5 seconds
            return 5000;
        }
        // reconnect after
        return 3000;
    },
}

module.exports = config