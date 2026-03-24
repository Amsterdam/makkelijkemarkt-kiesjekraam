import * as fs from 'fs';
import {
    IMarktondernemerVoorkeur,
    IMarktondernemerVoorkeurRow,
} from './model/markt.model';


const loadJSON = <T>(path: string, defaultValue: T = null): Promise<T> =>
    new Promise((resolve, reject) => {
        console.log(`Load ${path}`);
        fs.readFile(path, (err, data) => {
            if (err) {
                console.log(err);
                resolve(defaultValue);
            } else {
                try {
                    resolve(JSON.parse(String(data)));
                } catch (e) {
                    console.log(e);
                    reject(e);
                }
            }
        });
    });

export const convertVoorkeur = (obj: IMarktondernemerVoorkeurRow): IMarktondernemerVoorkeur => ({
    ...obj,
    branches: [obj.brancheId, obj.parentBrancheId].filter(Boolean),
    verkoopinrichting: obj.inrichting ? [obj.inrichting] : [],
});

export const getMededelingen = (): Promise<any> => loadJSON('./config/markt/mededelingen.json', {});

export const getDaysClosed = (): Promise<any> => loadJSON('./config/markt/daysClosed.json', {});
