import Queue from 'bee-queue';
import { RedisClient } from './redis-client';

export const ALLOCATION_MODE_CONCEPT = 'concept';
export const ALLOCATION_MODE_SCHEDULED = 'scheduled';

export class ConceptQueue {
    dispatcher_config: any;
    prefix = 'kjk-alloc';
    name = 'allocation';

    constructor() {
        const redisHost: string = process.env.REDIS_HOST;
        const redisPort: string = process.env.REDIS_PORT;
        const redisPassword: string = process.env.REDIS_PASSWORD;
        this.dispatcher_config = {
            prefix: this.prefix,
            redis: {
                legacyMode: true,
                url: `rediss://${redisHost}:${redisPort}`,
                password: redisPassword,
                retry_strategy: function (options) {
                    console.log('Redis retry_strategy')
                    console.log(options.error?.code)
                    if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
                        // Try reconnecting after 5 seconds
                        return 5000;
                    }
                    // reconnect after
                    return 3000;
                },
            },
            isWorker: false,
        };
    }

    getQueueForDispatcher(): any {
        return new Queue(this.name, this.dispatcher_config);
    }
}
