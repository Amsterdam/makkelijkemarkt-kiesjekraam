import util from 'util';
import redisConfig from '../redis-config';
const redis = require('redis');

export class RedisClient {
    client: any;
    print: string;

    constructor() {
        console.log('constructed Redis client')

        this.print = redis.print;
        let connected = false;

        this.client = redis.createClient(redisConfig);

        this.client.connect().catch(console.error);

        this.client.on('connect', function () {
            console.log('Connected to Redis');
            connected = true;
        });
        this.client.on('error', function (err) {
            console.log('Redis error: ' + err);
        });
        this.client.on('reconnecting', function (err) {
            console.log('Redis try reconnecting.. ' + err);
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
