import util from 'util';
const redis = require('redis');

export class RedisClient {
    client: any;
    print: string;

    constructor() {
        const redisHost: string = process.env.REDIS_HOST;
        const redisPort: string = process.env.REDIS_PORT;
        const redisPassword: string = process.env.REDIS_PASSWORD;
        this.print = redis.print;
        let connected = false;

        this.client = redis.createClient({
            legacyMode: true,
            url: `redis://:${redisPassword}@${redisHost}:${redisPort}`,
            retry_strategy: function (options) {
                if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
                    // Try reconnecting after 5 seconds
                    return 5000;
                }
                // reconnect after
                return 3000;
            },
        });

        this.client.connect().catch(console.error);

        this.client.on('connect', function () {
            console.log('Connected to Redis');
            connected = true;
        });
        this.client.on('error', function (err) {
            console.log('Redis error: ' + err);
        });
        this.client.on('reconnecting', function () {
            console.log('Redis try reconnecting..');
        });

        this.client.on('end', function () {
            // we had a redis connection
            // but redis is down now
            // exit the server, docker will restart the container
            // when booted again we will enter the retry strategy
            console.log('Redis end');
            if (connected) {
                process.exit(1);
            }
        });
    }

    getClient(): any {
        return this.client;
    }

    getAsyncClient(): any {
        this.client.get = util.promisify(this.client.get);
        return this.client;
    }
}
