import { IToewijzing, IMarkt } from 'markt.model';
import {
    getPlaatsvoorkeurenByMarktEnOndernemer,
    getVoorkeurByMarktEnOndernemer,
} from '../makkelijkemarkt-api';

export const convertToewijzingForDB = (toewijzing: IToewijzing[], markt: IMarkt, marktDate: string) => {
    return {
        ...toewijzing,
        marktId: markt.marktId,
        marktDate,
    };
};

export const getToewijzingEnriched = (toewijzing: IToewijzing): Promise<IToewijzing> => {
    return Promise.all([
        getVoorkeurByMarktEnOndernemer(toewijzing.marktId, toewijzing.erkenningsNummer),
        getPlaatsvoorkeurenByMarktEnOndernemer(toewijzing.marktId, toewijzing.erkenningsNummer)
    ]).then(result => {
        const [ voorkeuren, plaatsvoorkeuren ] = result;

        toewijzing.plaatsvoorkeuren = plaatsvoorkeuren.length > 0 ? plaatsvoorkeuren.map(plaats => plaats.plaatsId): null;
        toewijzing.anywhere = voorkeuren ? voorkeuren.anywhere : null;
        toewijzing.minimum = voorkeuren ? voorkeuren.minimum : null;
        toewijzing.maximum = voorkeuren ? voorkeuren.maximum : null;
        toewijzing.bak = voorkeuren ? !!(voorkeuren.parentBrancheId === 'bak') : null;
        toewijzing.eigenMaterieel = voorkeuren ? !!(voorkeuren.inrichting === 'eigen-materieel') : null;
        toewijzing.brancheId = voorkeuren ? voorkeuren.brancheId : null;

        return toewijzing;
    });
};
