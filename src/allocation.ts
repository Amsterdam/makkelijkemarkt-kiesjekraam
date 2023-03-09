import {
    calculateIndelingslijst,
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
    INDELING_DAG_OFFSET,
} from './domain-knowledge';
import {
    MMMarkt,
} from './model/makkelijkemarkt.model';
import {
    RedisClient,
} from './redis-client';

const DEFAULT_ALLOCATION_VERSION = '2';
const AGENT_EMAIL = 'system';

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

export async function allocate(version: string = DEFAULT_ALLOCATION_VERSION, onlyMarkt?: string) {
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

    const indelingen_ids = await Promise.all(
        markten.map((markt: MMMarkt) => {
            const indeling = calculateIndelingslijst(String(markt.id), marktDate, version);
            return indeling;
        }),
    );

    for (var ind in indelingen_ids) {
        try {
            let res = null;
            let logs = null;
            let inputData = null;
            while (res === null || logs === null || inputData === null) {
                const jobId = indelingen_ids[ind];
                if (jobId === undefined){
                    console.error('ERROR:');
                    console.error('ERROR: Undefined job id!');
                    console.error('ERROR:');
                    break;
                }
                console.log('waiting for job id:', jobId);
                await timeout(1000);
                res = await redisClient.get('RESULT_' + jobId);
                logs = await redisClient.get('LOGS_' + jobId);
                inputData = await redisClient.get('JOB_' + jobId);
            }

            const data = JSON.parse(res);
            const { marktId, marktDate, toewijzingen, afwijzingen, version='' } = data;

            let allocationStatus = 0;
            if (data['error_id'] === undefined) {
                await createToewijzingenAfwijzingen(marktId, data['toewijzingen'], data['afwijzingen']);
                const allocs = await getAllocations(marktId, marktDate);
            } else {
                console.log(data);
                allocationStatus = 1;
            }

            const payload = {
                allocationStatus,
                allocationType: ALLOCATION_TYPE.FINAL,
                allocationVersion: version,
                email: 'scheduled',
                allocation: {toewijzingen, afwijzingen},
                log: JSON.parse(logs),
                input:  JSON.parse(inputData),
            }
            const request = await createAllocationsV2(marktId, marktDate, payload)
        } catch {
            console.log('catch')
        }
    }
}

async function allocateCli(version?: string) {
    try {
        await allocate(version);
        console.log('done');
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

if (require.main === module) {
    console.log('CLI');
    const version = process.env.ALLOCATION_VERSION;
    allocateCli(version);
}
