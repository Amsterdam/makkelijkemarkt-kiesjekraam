import {
    calculateIndelingslijst,
    getDaysClosed,
} from './pakjekraam-api';
import {
    createAllocations,
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
    INDELING_DAG_OFFSET,
} from './domain-knowledge';
import {
    MMMarkt,
} from './model/makkelijkemarkt.model';
import {
    RedisClient,
} from './redis-client';

const timezoneTime = getTimezoneTime();
timezoneTime.add(INDELING_DAG_OFFSET, 'days');
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

async function allocate() {
    try {
        const daysClosed = await getDaysClosed();

        if (daysClosed.includes(marktDate)) {
            console.log(`Indeling wordt niet gedraaid, ${marktDate} gevonden in daysClosed.json`);
            process.exit(0);
        }

        let markten = await getMarktenByDate(marktDate);
        markten = markten.filter(
            (markt: MMMarkt) => markt.kiesJeKraamFase === 'live' || markt.kiesJeKraamFase === 'wenperiode',
        );

        if (!markten.length) {
            console.log('Geen indelingen gedraaid.');
            process.exit(0);
        }

        const indelingen_ids = await Promise.all(
            markten.map((markt: MMMarkt) => {
                const indeling = calculateIndelingslijst(String(markt.id), marktDate);
                return indeling;
            }),
        );

        for (var ind in indelingen_ids) {
            let res = null;
            while (res === null) {
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
            }
            if (res !== null){
                const data = JSON.parse(res);
                if (data['error_id'] === undefined) {
                    const marktId: string = data['markt']['id'];
                    await createToewijzingenAfwijzingen(marktId, data['toewijzingen'], data['afwijzingen']);
                    const allocs = await getAllocations(marktId, marktDate);
                    console.log(allocs);
                } else {
                    console.log(data);
                }
            }
        }
        console.log('done');
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
}

allocate();
