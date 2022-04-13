import Queue from 'bee-queue';

export const ALLOCATION_MODE_CONCEPT = 'concept';
export const ALLOCATION_MODE_SCHEDULED = 'scheduled';

export class ConceptQueue {
    dispatcher_config: any;
    prefix = 'kjk-alloc';
    name = 'allocation';

    constructor() {
        this.dispatcher_config = {
            prefix: this.prefix,
            redis: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT,
                password: process.env.REDIS_PASSWORD,
                db: 0,
                options: {},
            },
            isWorker: false,
        };
    }

    getQueueForDispatcher(): any {
        return new Queue(this.name, this.dispatcher_config);
    }
}
