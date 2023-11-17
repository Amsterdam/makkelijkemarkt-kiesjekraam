import Queue from 'bee-queue';
import { RedisClient } from 'redis-client';

export const ALLOCATION_MODE_CONCEPT = 'concept';
export const ALLOCATION_MODE_SCHEDULED = 'scheduled';

export class ConceptQueue {
    dispatcher_config: any;
    prefix = 'kjk-alloc';
    name = 'allocation';

    constructor() {

        this.dispatcher_config = {
            prefix: this.prefix,
            redis: new RedisClient().getAsyncClient(),
            isWorker: false,
        };
    }

    getQueueForDispatcher(): any {
        return new Queue(this.name, this.dispatcher_config);
    }
}
