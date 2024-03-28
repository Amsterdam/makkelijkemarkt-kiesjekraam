import {
    calculateIndelingslijst,
    getCalculationInput,
    getDaysClosed,
} from './pakjekraam-api';
import {
    createAllocations,
    createAllocationsV2,
    getAllocations,
} from './makkelijkemarkt-api';
import {
    IAfwijzing,
    IToewijzing,
} from './model/markt.model';
import {
    getMarktenByDate,
} from './model/markt.functions';
import {
    getTimezoneTime,
} from './util';
import {
    ALLOCATION_TYPE,
    ALLOCATION_STATUS,
    INDELING_DAG_OFFSET,
} from './domain-knowledge';
import {
    MMMarkt,
} from './model/makkelijkemarkt.model';
import {
    RedisClient,
} from './redis-client';
import { getAllocation } from 'daalder-api';

const DEFAULT_ALLOCATION_VERSION = '2';
const AGENT_EMAIL = 'system';
const ALLOCATION_MODE_SCHEDULED = 'scheduled'

const timezoneTime = getTimezoneTime();
if(process.env.INDELING_DAG_OFFSET && process.env.INDELING_DAG_OFFSET != 'false'){
    console.log("Get the day offset from parameter!", process.env.INDELING_DAG_OFFSET);
    timezoneTime.add(parseInt(process.env.INDELING_DAG_OFFSET) , 'days');
}else{
    timezoneTime.add(INDELING_DAG_OFFSET, 'days');
}
const marktDate = timezoneTime.format('YYYY-MM-DD');
const redisClient = new RedisClient().getAsyncClient();

async function createToewijzingenAfwijzingen(
    afkorting: string,
    toewijzingen: IToewijzing[],
    afwijzingen: IAfwijzing[],
) {
    const data = {
        toewijzingen,
        afwijzingen,
    };
    try {
        const result = await createAllocations(afkorting, marktDate, data);
        if (result.status) {
            console.log('status: ', result.status);
        } else {
            console.log('status: ', result.response.status);
            console.log('resp: ', result.response.data);
            console.log('post data: ', result.config.data);
        }
    } catch (error) {
        console.log('error: ', error);
    }
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function allocate(version: string = DEFAULT_ALLOCATION_VERSION, onlyMarkt?: string): Promise<number> {
    console.log(`Allocation version: ${version}`)
    if (onlyMarkt) {
        console.log(`Only allocate markt ${onlyMarkt}`)
    }

    const daysClosed = await getDaysClosed();

    if (daysClosed.includes(marktDate)) {
        console.log(`Indeling wordt niet gedraaid, ${marktDate} gevonden in daysClosed.json`);
        process.exit(0);
    }

    let markten = await getMarktenByDate(marktDate);
    markten = markten.filter(
        (markt: MMMarkt) => markt.kiesJeKraamFase === 'live' || markt.kiesJeKraamFase === 'wenperiode',
    );

    if (onlyMarkt) {
        markten = markten.filter(
            (markt: MMMarkt) => String(markt.id) === onlyMarkt,
        );
    }

    if (!markten.length) {
        console.log('Geen indelingen gedraaid.');
    }


    for (const markt of markten) {
        console.log(`Request allocation for ${markt.id}`);
        try {
            getCalculationInput(String(markt.id), marktDate).then(data => {
                data = JSON.parse(JSON.stringify(data));
                data['mode'] = ALLOCATION_MODE_SCHEDULED;
                data['version'] = 2;
                getAllocation(data).then(async (indeling: any) => {

                    console.log(indeling);
                    const { marktId, marktDate, toewijzingen, afwijzingen, version='' } = indeling;

                    
                    
                    const payload = {
                        allocationStatus: indeling.error !== undefined ? ALLOCATION_STATUS.ERROR : ALLOCATION_STATUS.SUCCESS,
                        allocationType: ALLOCATION_TYPE.CONCEPT,
                        allocationVersion: data['version'],
                        email: AGENT_EMAIL,
                        allocation: indeling,
                        input: data,
                    }
    
                    let allocationStatus = ALLOCATION_STATUS.SUCCESS;
                    if (data['error_id'] === undefined) {
                        await createToewijzingenAfwijzingen(markt.id, data['toewijzingen'], data['afwijzingen']);
                        const allocs = await getAllocations(markt.id, marktDate);
                    } else {
                        console.log(data);
                        allocationStatus = ALLOCATION_STATUS.ERROR;
                    }
    
    
                    const alloc_v2_response = await createAllocationsV2(String(markt.id), marktDate, payload)
                    const allocation = alloc_v2_response.data;
                });
    
            })
        } catch (error) {
            console.log
        }
    }

    // const indelingen_ids = await Promise.all(
    //     markten.map((markt: MMMarkt) => {
    //         const indeling = calculateIndelingslijst(String(markt.id), marktDate, version);
    //         return indeling;
    //     }),
    // );

    // let totalStatus = 0;
    // console.log('indelingen_ids', indelingen_ids);
    // for (const jobId of indelingen_ids) {
    //     try {
    //         let res = null;
    //         let logs = null;
    //         let inputData = null;
    //         while (res === null || logs === null || inputData === null) {
    //             console.log('waiting for job id:', jobId);
    //             await timeout(1000);
    //             res = await redisClient.get('RESULT_' + jobId);
    //             logs = await redisClient.get('LOGS_' + jobId);
    //             inputData = await redisClient.get('JOB_' + jobId);
    //         }

    //         const data = JSON.parse(res);
    //         const { marktId, marktDate, toewijzingen, afwijzingen, version='' } = data;

    //         let allocationStatus = ALLOCATION_STATUS.SUCCESS;
    //         if (data['error_id'] === undefined) {
    //             await createToewijzingenAfwijzingen(marktId, data['toewijzingen'], data['afwijzingen']);
    //             const allocs = await getAllocations(marktId, marktDate);
    //         } else {
    //             console.log(data);
    //             allocationStatus = ALLOCATION_STATUS.ERROR;
    //         }

    //         const payload = {
    //             allocationStatus,
    //             allocationType: ALLOCATION_TYPE.FINAL,
    //             allocationVersion: version,
    //             email: 'scheduled',
    //             allocation: {toewijzingen, afwijzingen},
    //             log: JSON.parse(logs),
    //             input: JSON.parse(inputData),
    //         }
    //         const request = await createAllocationsV2(marktId, marktDate, payload)
    //         totalStatus += allocationStatus;
    //     } catch (err) {
    //         console.error(err);
    //         totalStatus += 1;
    //     }
    // }
    return 0;
}

async function allocateCli(version?: string) {
    try {
        const status = await allocate(version);
        if (status) {
            console.log('Finished with errors');
            process.exit(1);
        }
        console.log('Done');
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

if (require.main === module) {
    console.log('Called directly as script');
    const version = process.env.ALLOCATION_VERSION;
    allocateCli(version);
}
