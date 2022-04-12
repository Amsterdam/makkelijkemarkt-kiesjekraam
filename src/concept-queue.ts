const Queue = require('bee-queue');

export const ALLOCATION_MODE_CONCEPT:string = "concept";
export const ALLOCATION_MODE_SCHEDULED:string = "scheduled";
export class ConceptQueue {
    dispatcher_config: any;
    prefix: string = 'kjk-alloc';
    name: string = 'allocation';

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
