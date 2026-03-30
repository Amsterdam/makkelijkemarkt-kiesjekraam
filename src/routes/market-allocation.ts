import { getAllocation, getIndelingData, getMarktConfig, mergeIndelingData } from '../daalder-api';
import {
    getKeycloakUser,
} from '../keycloak-api';
import {
    GrantedRequest,
} from 'keycloak-connect';
import {
    HTTP_PAGE_NOT_FOUND,
    internalServerErrorPage,
} from '../express-util';
import {
    Response,
} from 'express';
import {
    Roles,
} from '../authentication';
import {
    isMarktBewerker
} from '../roles';


export const indelingPage = (req: GrantedRequest, res: Response, indelingstype = 'indeling') => {
    const { marktDate, marktId } = req.params;

    getIndelingData(marktId, marktDate).then(indeling => {
        if (!indeling) {
            res.status(HTTP_PAGE_NOT_FOUND).send(`De indeling voor markt ${marktId} voor ${marktDate} is niet gevonden!!!`);
            return;
        }
        res.render('IndelingslijstPage.tsx', {
            ...indeling,
            indelingstype,
            datum: marktDate,
            role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            user: getKeycloakUser(req),
        });
    }, internalServerErrorPage(res));
};

export const directConceptIndelingPage = async (req: GrantedRequest, res: Response) => {
    const { marktDate, marktId } = req.params;
    const indelingstype = 'concept-indelingslijst'

    try {
        const payload = {
            mode: 'concept',
            version: '2',
            marktDate,
            marktId,
        }

        const indeling: any = await getAllocation(payload);
        const martkConfig = await getMarktConfig(indeling.input['config_id']);

        res.render('IndelingslijstPage.tsx', {
            marktId,
            datum: marktDate,
            toewijzingen: indeling.allocation.toewijzingen,
            afwijzingen: indeling.allocation.afwijzingen,
            ...mergeIndelingData(martkConfig.specs, indeling.input),
            indelingstype,
            role: isMarktBewerker(req) ? Roles.MARKTBEWERKER : Roles.MARKTMEESTER,
            user: getKeycloakUser(req),
        });
    } catch (err) {
        internalServerErrorPage(res)(err)
    }
}
