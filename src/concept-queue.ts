import redisConfig from '../redis-config';

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
            redis: redisConfig,
            isWorker: false,
        };
    }
}
