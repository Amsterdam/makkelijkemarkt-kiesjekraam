import { Request, Response } from 'express';
import { GrantedRequest } from 'keycloak-connect';

import { internalServerErrorPage } from '../express-util';
import { Roles } from '../authentication';

import { getKeycloakUser } from '../keycloak-api';
import {
    getIndelingslijst,
} from '../pakjekraam-api';

import { ConceptQueue, ALLOCATION_MODE_CONCEPT } from '../concept-queue';
import { getCalculationInput } from '../pakjekraam-api';

const conceptQueue = new ConceptQueue();
let allocationQueue = conceptQueue.getQueueForDispatcher();
const client = conceptQueue.getClient();

export const conceptIndelingPage = (req: GrantedRequest, res: Response) => {
    const { marktDate, marktId } = req.params;
    getCalculationInput(marktId, marktDate).then(data => {
            data = JSON.parse(JSON.stringify(data));
            data["mode"] = ALLOCATION_MODE_CONCEPT;
            const job = allocationQueue.createJob(data);
            console.log("GET CALC INPUT");
            job.save().then(
                (job: any) => {
                    console.log("allocation job: ", job.id);
                    return res.redirect(`/job/`+job.id+`/`);
                }
            ).catch(error => {
                console.log("job error: ", error);
                if(!client.connected){
                    res.render("RedisErrorPage.jsx");
                    return;
                }
                allocationQueue = conceptQueue.getQueueForDispatcher();
                return res.redirect(req.originalUrl);
            });
        });
};

export const indelingPage = (req: GrantedRequest, res: Response, type: string = 'indeling') => {
    const { marktDate, marktId } = req.params;

    getIndelingslijst(marktId, marktDate)
    .then(indeling => {
        res.render('IndelingslijstPage.tsx', {
            ...indeling,
            type,
            datum : marktDate,
            role  : Roles.MARKTMEESTER,
            user  : getKeycloakUser(req)
        });
    }, internalServerErrorPage(res));
};

export const indelingLogsPage = async (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;
    try{
        const reply:any = await client.get("LOGS_"+jobId);
        if(reply){
            const type = "concept-indeling-logs";
            const data = JSON.parse(reply);
            res.render('IndelingsLogsPage.tsx', {
                data,
                type,
                datum : data["marktDate"],
                role  : Roles.MARKTMEESTER,
                user  : getKeycloakUser(req)
            });
        }
    }catch(error){
        console.log(error);
    }
}

export const indelingInputJobPage = async (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;
    try{
        const reply:any  = await client.get("JOB_"+jobId);
        if(reply){
            const data = JSON.parse(reply);
            const jsonPretty = JSON.stringify(data,null,2);
            res.render('IndelingsInputJobPage.tsx', {
                data: jsonPretty
            });
        }
    }catch(error){
        console.log(error);
    }
}

export const indelingErrorStacktracePage = async (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;
    try{
        const reply:any = await client.get("ERROR_"+jobId);
        if(reply){
            res.render('IndelingsInputJobPage.tsx', {
                data: reply
            });
        }
    }catch(error){
        console.log(error);
    }
}

function allocationHasFailed(resultData: any){
    return resultData["error"] !== undefined;
}

export const indelingWaitingPage = async (req: GrantedRequest, res: Response) => {
    try{
        const { jobId } = req.params;
        const reply:any = await client.get("RESULT_"+jobId);
        if (!reply) {
            return res.render('WaitingPage.jsx');
        }

        const type = "concept-indelingslijst";
        const data = JSON.parse(reply);

        if (allocationHasFailed(data)) {
            return res.render('IndelingsErrorPage.tsx', {
                ...data,
                role  : Roles.MARKTMEESTER,
                user  : getKeycloakUser(req)
            });
        }

        return res.render('IndelingslijstPage.tsx', {
            ...data,
            type,
            datum : data["marktDate"],
            role  : Roles.MARKTMEESTER,
            user  : getKeycloakUser(req),
            job   : jobId
        });
    }catch(error){
        console.log(error);
    }
};
