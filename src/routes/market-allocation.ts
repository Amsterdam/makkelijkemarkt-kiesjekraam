import {
    ALLOCATION_MODE_CONCEPT,
} from '../concept-queue';
import {
    getCalculationInput,
    getIndelingslijst,
} from '../pakjekraam-api';
import { createAllocationsV2 } from '../makkelijkemarkt-api'
import { getAllocation } from '../daalder-api';
import {
    getKeycloakUser,
} from '../keycloak-api';
import {
    GrantedRequest,
} from 'keycloak-connect';
import {
    internalServerErrorPage,
} from '../express-util';
import {
    RedisClient,
} from '../redis-client';
import {
    Response,
} from 'express';
import {
    Roles,
} from '../authentication';
import {
    isMarktBewerker
} from '../roles';
import {
    ALLOCATION_TYPE,
    ALLOCATION_STATUS,
} from '../domain-knowledge';

const client = new RedisClient().getAsyncClient();

export const conceptIndelingPage = (req: GrantedRequest, res: Response) => {
    const { marktDate, marktId } = req.params;
    const { version = '1', direct = 'false' } = req.query;
    const bDirect = (direct as string).toLowerCase() === 'true';
    console.log("Conect Indeling Page", version, bDirect, direct)
    getCalculationInput(marktId, marktDate).then(data => {
        data = JSON.parse(JSON.stringify(data));
        data['mode'] = ALLOCATION_MODE_CONCEPT;
        data['version'] = version;
        if (bDirect) {
            getAllocation(data).then(alloc => {
                console.log("Received Direct allocation:", alloc)
            })
        }
        const job = allocationQueue.createJob(data);
        console.log('GET CALC INPUT');
        job.save()
            .then((job: any) => {
                console.log('allocation job: ', job.id);
                return res.redirect(`/job/` + job.id + `/`);
            })
            .catch(error => {
                console.log('job error: ', error);
                if (!client.connected) {
                    res.render('RedisErrorPage.jsx');
                    return;
                }
                allocationQueue = conceptQueue.getQueueForDispatcher();
                return res.redirect(req.originalUrl);
            });
    });
};

export const indelingPage = (req: GrantedRequest, res: Response, indelingstype = 'indeling') => {
    const { marktDate, marktId } = req.params;

    getIndelingslijst(marktId, marktDate).then(indeling => {
        res.render('IndelingslijstPage.tsx', {
            ...indeling,
            indelingstype,
            datum: marktDate,
            role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            user: getKeycloakUser(req),
        });
    }, internalServerErrorPage(res));
};

export const directConceptIndelingPage = (req: GrantedRequest, res: Response) => {
    const { marktDate, marktId } = req.params;
    const indelingstype = 'concept-indelingslijst'
    console.log("Conect Indeling Page")
    getCalculationInput(marktId, marktDate).then(data => {
        data = JSON.parse(JSON.stringify(data));
        data['mode'] = ALLOCATION_MODE_CONCEPT;
        data['version'] = "2";
        getAllocation(data).then(async (indeling: any) => {
            const email = getKeycloakUser(req).email
            const payload = {
                allocationStatus: allocationHasFailed(data) ? ALLOCATION_STATUS.ERROR : ALLOCATION_STATUS.SUCCESS,
                allocationType: ALLOCATION_TYPE.CONCEPT,
                allocationVersion: data['version'],
                email,
                allocation: indeling,
                input: data,
            }
            console.log("PAYLOAD:", payload)
            const alloc_v2_response = await createAllocationsV2(marktId, marktDate, payload)
            const allocation = alloc_v2_response.data;
            console.log("Received Direct allocation:", allocation)
            console.log("Received Direct allocation:", indeling)
            res.render('IndelingslijstPage.tsx', {
                ...allocation,
                ...allocation.input,
                ...indeling.allocation,
                indelingstype,
                datum: marktDate,
                role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
                user: getKeycloakUser(req),
            });
        })
    }, internalServerErrorPage(res))

    getIndelingslijst(marktId, marktDate).then(indeling => {
        res.render('IndelingslijstPage.tsx', {
            ...indeling,
            indelingstype,
            datum: marktDate,
            role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            user: getKeycloakUser(req),
        });
    }, internalServerErrorPage(res));
};

export const indelingStatsPage = (req: GrantedRequest, res: Response) => {
    const { marktDate, marktId } = req.params;

    getIndelingslijst(marktId, marktDate).then(indeling => {
        const { toewijzingen, afwijzingen, ondernemers, markt } = indeling;
        const ondernemersMap = ondernemers.reduce((total, ondernemer) => {
            total[ondernemer.erkenningsNummer] = ondernemer;
            return total;
        }, {});
        const allocations: any[] = toewijzingen.map(toewijzing => {
            let arePrefsMet = false;
            toewijzing.plaatsen.forEach(plaats => {
                if (toewijzing.plaatsvoorkeuren.includes(plaats)) {
                    arePrefsMet = true;
                }
            });
            const ondernemer = ondernemersMap[toewijzing.koopman];
            return {
                ...toewijzing,
                arePrefsMet,
                sollicitatieNummer: Number(ondernemer.sollicitatieNummer),
                description: ondernemer.description,
                status: ondernemer.status,
            };
        });
        allocations.sort((a, b) => (a.sollicitatieNummer > b.sollicitatieNummer ? 1 : -1));
        res.render('IndelingStatsPage.jsx', {
            user: getKeycloakUser(req),
            markt,
            marktDate,
            allocations,
        });
    }, internalServerErrorPage(res));
};

export const indelingLogsPage = async (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;
    try {
        const reply: any = await client.get('LOGS_' + jobId);
        if (reply) {
            const type = 'concept-indeling-logs';
            const data = JSON.parse(reply);
            res.render('IndelingsLogsPage.tsx', {
                data,
                type,
                datum: data.marktDate,
                role: Roles.MARKTMEESTER,
                user: getKeycloakUser(req),
            });
        }
    } catch (error) {
        console.log(error);
    }
};

export const indelingInputJobPage = async (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;
    try {
        const reply: any = await client.get('JOB_' + jobId);
        if (reply) {
            const data = JSON.parse(reply);
            const jsonPretty = JSON.stringify(data, null, 2);
            res.render('IndelingsInputJobPage.tsx', {
                data: jsonPretty,
            });
        }
    } catch (error) {
        console.log(error);
    }
};

export const indelingErrorStacktracePage = async (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;
    try {
        const reply: any = await client.get('ERROR_' + jobId);
        if (reply) {
            res.render('IndelingsInputJobPage.tsx', {
                data: reply,
            });
        }
    } catch (error) {
        console.log(error);
    }
};

function allocationHasFailed(resultData: any) {
    return resultData.error !== undefined;
}

export const indelingWaitingPage = async (req: GrantedRequest, res: Response) => {
    try {
        const { jobId } = req.params;
        const reply: any = await client.get('RESULT_' + jobId);
        const logs: any = await client.get('LOGS_' + jobId);
        const inputData: any = await client.get('JOB_' + jobId);
        if (!reply || !logs || !inputData) {
            return res.render('WaitingPage.jsx');
        }

        const indelingstype = 'concept-indelingslijst';
        const data = JSON.parse(reply);
        const log = JSON.parse(logs);
        const input = JSON.parse(inputData);
        const { marktId, marktDate, toewijzingen, afwijzingen, version='' } = data;
        const email = getKeycloakUser(req).email
        const payload = {
            allocationStatus: allocationHasFailed(data) ? ALLOCATION_STATUS.ERROR : ALLOCATION_STATUS.SUCCESS,
            allocationType: ALLOCATION_TYPE.CONCEPT,
            allocationVersion: version,
            email,
            allocation: {toewijzingen, afwijzingen},
            log,
            input,
        }
        const request = await createAllocationsV2(marktId, marktDate, payload)

        if (allocationHasFailed(data)) {
            return res.render('IndelingsErrorPage.tsx', {
                ...data,
                role: Roles.MARKTMEESTER,
                user: getKeycloakUser(req),
            });
        }

        return res.render('IndelingslijstPage.tsx', {
            ...data,
            indelingstype,
            datum: data.marktDate,
            role: Roles.MARKTMEESTER,
            user: getKeycloakUser(req),
            job: jobId,
        });
    } catch (error) {
        console.log(error);
    }
};