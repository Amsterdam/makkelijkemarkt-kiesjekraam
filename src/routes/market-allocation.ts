import { Request, Response } from 'express';
import { GrantedRequest } from 'keycloak-connect';

import { internalServerErrorPage } from '../express-util';
import { Roles } from '../authentication';

import { getKeycloakUser } from '../keycloak-api';
import {
    getIndelingslijst,
} from '../pakjekraam-api';

import { ConceptQueue } from '../concept-queue';

const conceptQueue = new ConceptQueue();
let allocationQueue = conceptQueue.getQueueForDispatcher();
const client = conceptQueue.getClient();

export const conceptIndelingPage = (req: GrantedRequest, res: Response) => {
    const { marktDate, marktId } = req.params;
    const job = allocationQueue.createJob({marktId:marktId, marktDate:marktDate});
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


export const indelingWaitingPage = (req: GrantedRequest, res: Response) => {
    const { jobId } = req.params;

    allocationQueue.getJob(jobId, function (err, job) {
        if(!job){
            res.render("ErrorPage.jsx");
            return;
        }
        
        client.get("RESULT_"+jobId, function(err, reply){
            console.log("Concept indeling job:", jobId, "| status: ",job.status, "| data: ",job.data, "|");
            if(reply){
                const type = "concept-indelingslijst";
                const data = JSON.parse(reply);
                res.render('IndelingslijstPage.tsx', {
                    ...data,
                    type,
                    datum : job.data.marktDate,
                    role  : Roles.MARKTMEESTER,
                    user  : getKeycloakUser(req)
                });
            }else{
                res.render('WaitingPage.jsx');
            }
        });

    });

    
};
