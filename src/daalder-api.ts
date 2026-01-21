import { IAanwezigheid, IMarktondernemerVoorkeur, IMarktondernemerVoorkeurRow, IPlaatsvoorkeur, IRSVP, IRsvpPattern } from 'model/markt.model';
import { requireEnv, safeCastStringValueToInt } from './util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { flatten, last, orderBy } from 'lodash';
import moment from 'moment';

requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');
requireEnv('DAALDER_KJK_API_KEY');

// MM_RAH_MM_RAH_SERVICE_HOST and PORT defined by helm/kubernetes. When service name changes, this var should be changed.
export const daalderConfig = {
    baseUrl: `http://${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`,
    api_key: process.env.DAALDER_KJK_API_KEY as string,
};

// New Daalder API client
const api = axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {
        'Content-Type': 'application/json',
        'kjk-api-key': daalderConfig.api_key,
    },
    timeout: 10000, // 10 seconds timeout
});

api.interceptors.request.use(
    config => {
        console.log(`Daalder API Request: ${config.method} ${config.url}`);
        return config;
    },
    error => {
        console.error('Error in Daalder API request:', error.message);
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response: AxiosResponse) => response.data,
    error => {
        if (error.response) {
            console.error('Daalder API error response:', error.response.data);
        } else {
            console.error('API request error message', error.message);
            console.log('Error:', error);
        }
        return Promise.reject(error);
    },
);

const DAALDER_ALLOCATION_MODE = {
    CONCEPT: 0,
    SCHEDULED: 1,
};

export const getAllocation = async (data: Object): Promise<Object> => await api.post('/kiesjekraam/allocate/', data);

export const updateOndernemerKjkEmail = async (email: string, erkenningsNummer: string): Promise<Object> =>
    await api.post('/kiesjekraam/update-kjk-email/', { email, erkenningsNummer });

const erkenningsNummerToSerial = (erkenningsNummer: string): string => {
    const erkenningsNummerRegex = /^\d{10}$/;  // only 10 digits allowed
    if (erkenningsNummerRegex.test(erkenningsNummer) === false) {
        throw new Error(`Invalid erkenningsNummer: ${erkenningsNummer}`);
    }
    return erkenningsNummer.slice(0, 8) + '.' + erkenningsNummer.slice(8, 10);
}

const getUserHeader = (user: string) => ({
    'KJK-User': user,
});

export const getOndernemer = async (erkenningsNummer: string): Promise<any> => {
    console.log('getOndernemer', erkenningsNummer);
    erkenningsNummerToSerial(erkenningsNummer); // validate
    const ondernemer: any = await api.get(`/kiesjekraam/ondernemer/${erkenningsNummer}/`);
    return ondernemer;
}

export const getMarkten = async (includeInactive: boolean = false): Promise<any> => {
    const markten: any[] = await api.get('/kiesjekraam/markt/');
    return markten;
}

export const getMarkt = async (marktId: string ): Promise<any> => {
    safeCastStringValueToInt(marktId);
    const markt = await api.get(`/kiesjekraam/markt/${marktId}/`);
    return markt;
}

export const getMarktBasics = async (marktId: string): Promise<any> => {
    // also used by getMarktDetails, which is used by allocation related stuff
    safeCastStringValueToInt(marktId);
    const markt = await getMarkt(marktId);
    const branches = await getBranches(marktId);
    const standplaatsen = await getStandplaatsen(marktId);
    return {
        markt, // getMarkt
        marktplaatsen: standplaatsen, // <== algemene voorkeuren page uses standplaatsen
        branches, // <== algemene voorkeuren page uses branches
    };
}

export const getMarktAanwezigheid = async (marktId: string, day: string): Promise<any> => {
    safeCastStringValueToInt(marktId);
    const aanwezigheid = await api.get(`/kiesjekraam/markt/${marktId}/aanwezigheid/day/${day}/`);
    return aanwezigheid;
}

const getOndernemerPrefs = async (erkenningsNummer: string): Promise<any> => {
    const serial = erkenningsNummerToSerial(erkenningsNummer);
    const response: [{specs: {}, id: number}] = await api.get(`/kiesjekraam/pref/?inschrijving__ondernemer__serial=${serial}`);
    return response.map(({id, specs}) => ({id, ...specs}));
}

const getOndernemerMarktPrefs = async (erkenningsNummer: string, marktId: string): Promise<any> => {
    console.log('getOndernemerMarktPrefs', erkenningsNummer, marktId);
    erkenningsNummerToSerial(erkenningsNummer); // validate
    safeCastStringValueToInt(marktId);
    const {id, specs}: {id: number, specs: {}} = await api.get(`/kiesjekraam/markt/${marktId}/pref/ondernemer/${erkenningsNummer}/`);
    return {id, ...specs};
}

const updateOndernemerMarktPrefs = async (erkenningsNummer: string, marktId: string, prefs: any, user: string): Promise<any> => {
    console.log('updateOndernemerMarktPrefs', prefs, user);
    safeCastStringValueToInt(marktId);
    erkenningsNummerToSerial(erkenningsNummer); // validate
    const data = {specs: prefs}
    const headers = getUserHeader(user);
    const response = await api.patch(
        `/kiesjekraam/markt/${marktId}/pref/ondernemer/${erkenningsNummer}/`,
        data,
        { headers })
    return response;
}

const getBranches = async (marktId: string): Promise<any[]> => {
    console.log('getBranches', marktId);
    safeCastStringValueToInt(marktId);
    const branches: any[] = await api.get(`/kiesjekraam/markt/${marktId}/branche/`);
    return branches;
}

const getStandplaatsen = async (marktId: string, includeInactive: boolean = false): Promise<any[]> => {
    safeCastStringValueToInt(marktId);
    const queryParms = `?markt_version_id=${marktId}` + (includeInactive ? '' : '&active=true');
    const standplaatsen: any[] = await api.get(`/kiesjekraam/standplaats/${queryParms}`);
    return standplaatsen;
}

// this is imported in src/routes/dashboard.ts but then not actually used in template that is rendered
export const getPlaatsvoorkeurenOndernemer = async (ondernemerId: string): Promise<IPlaatsvoorkeur[]> => {
    console.log('getPlaatsvoorkeurenOndernemer', ondernemerId);
    const prefs = await getOndernemerPrefs(ondernemerId);
    return flatten(prefs.map((pref: any) => pref.plaatsen));
};

export const getPlaatsvoorkeurenByMarktEnOndernemer = async (marktId: string, ondernemerId: string): Promise<IPlaatsvoorkeur[]> => {
    console.log('getPlaatsvoorkeurenByMarktEnOndernemer', marktId, ondernemerId);
    safeCastStringValueToInt(marktId);
    const prefs = await getOndernemerMarktPrefs(ondernemerId, marktId);
    const {plaatsen = []}: {plaatsen: IPlaatsvoorkeur[]} = prefs;
    return plaatsen;
}

export const deletePlaatsvoorkeurenByMarktAndKoopman = async (marktId: string, erkenningsNummer: string, user: string) => {
    console.log('deletePlaatsvoorkeurenByMarktAndKoopman', marktId, erkenningsNummer);
    // plaatsvoorkeurenData.length = 0; // clear array
    safeCastStringValueToInt(marktId);
    const prefs = {plaatsen: []}
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, prefs, user);
}

export const updatePlaatsvoorkeur = async (plaatsvoorkeuren: IPlaatsvoorkeur[], user: string): Promise<any> => {
    console.log('updatePlaatsvoorkeur', plaatsvoorkeuren, user)
    // max number of plaatsvoorkeuren is determined by the prop markt.maxAantalKramenPerOndernemer
    // (in the PlaatsvoorkeurenForm)

    const first = plaatsvoorkeuren[0];
    if (!first) {
        throw new Error('No plaatsvoorkeuren provided');
    }
    const {marktId, erkenningsNummer} = first;

    // The sorting widget works pretty weird:
    // refer to convertIPlaatsvoorkeurArrayToApiPlaatsvoorkeuren to see how it was done for MM.
    const reIndexedPlaatsvoorkeuren = orderBy(plaatsvoorkeuren, ['priority'], ['desc']).map((plaats: any, index:number) => ({
        ...plaats,
        priority: index + 1, // priority starts at 1
    }));

    const prefs = {plaatsen: reIndexedPlaatsvoorkeuren}
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, prefs, user);
    return; // MM returns data that is not used, instead the page does a new GET for all data
}

export const getIndelingVoorkeur = async (ondernemerId: string, marktId: string) => {
    console.log('getIndelingVoorkeur')
    safeCastStringValueToInt(marktId);
    const {minimum, maximum, anywhere} = await getOndernemerMarktPrefs(ondernemerId, marktId);
    return {
        minimum,
        maximum,
        anywhere,
    };
}

export const updateMarktVoorkeur = async (
    marktvoorkeur: IMarktondernemerVoorkeur,
    user: string, // actually an email string like "voorbeeld@amsterdam.nl"
): Promise<any> => {
    console.log('updateMarktVoorkeur', marktvoorkeur);

    const {marktId, erkenningsNummer, minimum, maximum, anywhere} = marktvoorkeur;
    const data = { minimum, maximum, anywhere };
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, data, user);

    // MM returns data that is not used, instead the page does a new GET for all data
    // This GET is triggered by the redirect after posting the form
    return;
}

export const getVoorkeurByMarktEnOndernemer = async (
    marktId: string,
    erkenningsNummer: string,
): Promise<any> => {
    console.log('getVoorkeurByMarktEnOndernemer', marktId, erkenningsNummer);
    safeCastStringValueToInt(marktId);
    const prefs = await getOndernemerMarktPrefs(erkenningsNummer, marktId);
    return {
        ...prefs,
        branche: prefs.brancheId,
        parentBrancheId: null,
        markt: String(marktId),
    };
}

export const updateVoorkeur = async (
    updatedVoorkeur: IMarktondernemerVoorkeurRow,
    user: string, // actually an email string like "voorbeeld@amsterdam.nl"
): Promise<any> => {
    console.log('updateVoorkeur', updatedVoorkeur, user);
    const {marktId, erkenningsNummer, inrichting, bakType, brancheId} = updatedVoorkeur;
    const data = { inrichting, bakType, brancheId };
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, data, user);
}

export const getToewijzingenAfwijzingen = async (erkenningsNummer: string, marktId: string = ''): Promise<any> => {
    console.log('getToewijzingenAfwijzingen', erkenningsNummer);
    if (marktId) {
        safeCastStringValueToInt(marktId);
    }
    erkenningsNummerToSerial(erkenningsNummer); // validate
    const since = moment().subtract(2, 'months').format('YYYY-MM-DD');
    const queryParms = `?date__gte=${since}&mode=${DAALDER_ALLOCATION_MODE.SCHEDULED}`;
    const markt = marktId ? `/markt/${marktId}` : ''
    const results = await api.get(`/kiesjekraam/allocation-result/ondernemer/${erkenningsNummer}${markt}/${queryParms}`);
    return results;
}

interface ILegacyRSVP extends Omit<IRSVP, 'erkenningsNummer'> { id: number | null, koopman: string, markt: string }

export const getAanmeldingenByOndernemer = async (erkenningsNummer: string): Promise<IAanwezigheid[]> => {
    console.log('getAanmeldingenByOndernemer', erkenningsNummer);
    erkenningsNummerToSerial(erkenningsNummer); // validate
    const aanwezigheid: IAanwezigheid[] = await api.get(`/kiesjekraam/ondernemer/${erkenningsNummer}/aanwezigheid/`);
    return aanwezigheid
};

export const getAanmeldingenByOndernemerEnMarkt = async (marktId: string, erkenningsNummer: string): Promise<IAanwezigheid[]> => {
    console.log('getAanmeldingenByOndernemerEnMarkt', marktId, erkenningsNummer);
    safeCastStringValueToInt(marktId);
    erkenningsNummerToSerial(erkenningsNummer); // validate
    const aanwezigheid: IAanwezigheid[] = await getAanmeldingenByOndernemer(erkenningsNummer);
    return aanwezigheid.filter(item => item.marktId === safeCastStringValueToInt(marktId))
};

export const getRsvps = async (erkenningsNummer: string): Promise<ILegacyRSVP[]> => {
    console.log('getRsvps', erkenningsNummer);
    // Get monday of the same week as today
    const monday = moment().startOf('isoWeek').format('YYYY-MM-DD');
    // Get sunday 3 weeks later
    const sundayInTwoWeeks = moment(monday).add(20, 'days').format('YYYY-MM-DD');

    const serial = erkenningsNummerToSerial(erkenningsNummer);
    const queryParms = `?inschrijving__ondernemer__serial=${serial}&day__gte=${monday}&day__lte=${sundayInTwoWeeks}`;
    const rsvps: ILegacyRSVP[] = await api.get(`/kiesjekraam/rsvp/${queryParms}`);
    return rsvps
};

export const getRsvpPatterns = async (erkenningsNummer: string): Promise<IRsvpPattern[]> => {
    console.log('getRsvpPatterns', erkenningsNummer);
    const serial = erkenningsNummerToSerial(erkenningsNummer);
    const queryParms = `?inschrijving__ondernemer__serial=${serial}`;
    const rsvpPatterns: IRsvpPattern[] = await api.get(`/kiesjekraam/rsvp-pattern/${queryParms}`);
    return rsvpPatterns;
};

export const saveRsvps = async (data: any, user: string): Promise<any[]> => {
    console.log('saveRsvps', data, user);
    const headers = getUserHeader(user);
    const rsvps: any[] = await api.post('/kiesjekraam/rsvp/', data, { headers });
    return rsvps;  // although returned rsvps are not consumed by AanwezigheidsPage
};

export const saveRsvpPatterns = async (data: any, user: string) => {
    console.log('saveRsvpPatterns', data, user);
    const headers = getUserHeader(user);
        if (data.id) {
        const updatedPattern = await api.patch(`/kiesjekraam/rsvp-pattern/${data.id}/`, data, { headers });
        return updatedPattern;
    } else {
        const newPattern = await api.post('/kiesjekraam/rsvp-pattern/', data, { headers });
        return newPattern;
    }
};

export const getMarktConfig = async (id: number): Promise<any> => {
    console.log('getMarktConfig', id);
    const marktConfig = await api.get(`/kiesjekraam/markt-config/${id}/`);
    return marktConfig;
}

export const getAllocationResult = async (marktId: string, marktDate: string): Promise<any> => {
    console.log('getAllocationResults', marktDate, marktId);
    safeCastStringValueToInt(marktId);
    const mode = DAALDER_ALLOCATION_MODE.SCHEDULED;
    const queryParms = `?day=${marktDate}&markt_version_id=${marktId}&mode=${mode}`;
    const allocationResults = await api.get(`/kiesjekraam/allocation-result/${queryParms}`);
    return allocationResults ? last(allocationResults) : {};
}

export const mergeIndelingData = (config: any, inputData: any): any => {
    return {
        markt: inputData.markt,
        ondernemers: inputData.ondernemers,
        aanmeldingen: inputData.aanwezigheid,
        obstakels: config.geografie.obstakels,
        marktplaatsen: config.locaties,
        paginas: config.paginas,
        branches: config.branches,
    }
}

export const getIndelingData = async (marktId: string, marktDate: string): Promise<any> => {
    console.log('getIndelingData', marktDate, marktId);
    safeCastStringValueToInt(marktId);
    const allocationResult = await getAllocationResult(marktId, marktDate);
    if (allocationResult) {
        const inputData = allocationResult['input_data'];
        const configId = inputData['config_id'];
        const martkConfig = await getMarktConfig(configId);
        return {
            marktId,
            datum: marktDate,
            toewijzingen: allocationResult.toewijzingen,
            afwijzingen: allocationResult.afwijzingen,
            ...mergeIndelingData(martkConfig.specs, inputData),
        }
    }
    return null;
}
