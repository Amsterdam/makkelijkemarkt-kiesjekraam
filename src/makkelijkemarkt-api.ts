import {
    A_LIJST_DAYS,
    formatOndernemerName,
} from './domain-knowledge';
import {
    addDays,
    MONDAY,
    numberSort,
    requireEnv,
    THURSDAY,
} from './util';
import axios,
{
    AxiosInstance,
    AxiosResponse,
} from 'axios';
import {
    BrancheId,
    IAfwijzing,
    IBranche,
    IGenericBranche,
    IMarktConfiguratie,
    IMarktondernemer,
    IMarktondernemerVoorkeur,
    IMarktondernemerVoorkeurRow,
    IPlaatsvoorkeur,
    IRSVP,
    IToewijzing,
} from './model/markt.model';
import {
    MarktConfig,
    validateMarktConfig,
} from './model/marktconfig';
import {
    MMarktondernemerVoorkeur,
    MMMarkt,
    MMMarktPlaatsvoorkeuren,
    MMOndernemer,
    MMOndernemerStandalone,
    MMSollicitatieStandalone,
} from './model/makkelijkemarkt.model';
import packageJSON = require('../package.json');
import {
    RedisClient,
} from './redis-client';

const redisClient = new RedisClient().getAsyncClient();

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;

const MAX_RETRY_50X = 10;
const MAX_RETRY_40X = 10;
export const EMPTY_BRANCH: BrancheId = '000-EMPTY';

const HTTP_HEADER_REQUEST_START_TIME = 'requestStartTime';
const CACHE_PREFIX = 'CACHE_';
const CACHE_TTL = 60*10;

requireEnv('API_URL');
requireEnv('API_MMAPPKEY');
requireEnv('API_KEY');

const mmConfig = {
    baseUrl: process.env.API_URL,
    appKey: process.env.API_MMAPPKEY,
    loginUrl: 'login/apiKey/',
    apiKey: process.env.API_KEY,
    clientApp: packageJSON.name,
    clientVersion: packageJSON.version,
    sessionKey: 'mmsession',
    sessionLifetime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * MINUTES_IN_HOUR * 6,
};

const getApi = (): AxiosInstance =>
    axios.create({
        baseURL: mmConfig.baseUrl,
        headers: {
            MmAppKey: mmConfig.appKey,
        },
    });

const login = (api: AxiosInstance) =>
    api.post(mmConfig.loginUrl, {
        api_key: mmConfig.apiKey,
        clientApp: mmConfig.clientApp,
        clientVersion: mmConfig.clientVersion,
    });

export type HttpMethod = 'get' | 'post' | 'put' | 'delete';

const createHttpFunction = (
    api: AxiosInstance,
    httpMethod: HttpMethod,
): ((url: string, token: string, data?) => Promise<AxiosResponse>) => {
    return (url: string, token: string, data?: JSON): Promise<AxiosResponse> => {
        console.log('MM-API REQUEST', httpMethod, url);
        const headers = {
            Authorization: `Bearer ${token}`,
            requestStartTime: new Date().getTime(),
        };

        switch (httpMethod) {
            case 'get':
                return api.get(url, { headers });
            case 'post':
                return api.post(url, data, { headers });
            case 'put':
                return api.put(url, data, { headers });
            case 'delete':
                return api.delete(url, { headers });
            default:
                return api.get(url, { headers });
        }
    };
};

const apiBase = (
    url: string,
    httpMethod: HttpMethod = 'get',
    requestBody?,
    throwError = false,
): Promise<AxiosResponse> => {

    const api = getApi();

    const httpFunction = createHttpFunction(api, httpMethod);

    let counter50xRetry = 0;
    let counter40xRetry = 0;

    const retry = (api: any) => {
        return login(api).then((res: any) => {
            redisClient.set(mmConfig.sessionKey, res.data.uuid);
            return httpFunction(url, res.data.uuid, requestBody);
        });
    };

    api.interceptors.response.use(
        (response: any) => {
            const currentTime = new Date().getTime()
            const startTime = response.config.headers[HTTP_HEADER_REQUEST_START_TIME];
            console.log('MM-API RESPONSE', response.status, response.config.method, response.config.url, currentTime - startTime, 'ms');
            return response;
        },
        (error: any) => {
            const currentTime = new Date().getTime()
            const startTime = error.config.headers[HTTP_HEADER_REQUEST_START_TIME];
            console.log('MM-API ERROR', error.response?.status || 'NO_HTTP_STATUS', error.config.method, error.config.url, currentTime - startTime, 'ms', error.response?.data?.error);

            if (error.response.status === 504 || error.response.status === 503) {
                counter50xRetry++;
                if (counter50xRetry < MAX_RETRY_50X) {
                    console.log('RETRY 50x');
                    return retry(api);
                }
            }
            counter50xRetry = 0;

            if (error.response.status === 401 || error.response.status === 403) {
                counter40xRetry++;
                if (counter40xRetry < MAX_RETRY_40X) {
                    console.log('RETRY 40x');
                    return retry(api);
                }
            }
            counter40xRetry = 0;
            if (throwError) throw error;
            return error;
        },
    );

    return redisClient.get(mmConfig.sessionKey).then((mmApiSessionToken: any) => {
        return mmApiSessionToken ? httpFunction(url, mmApiSessionToken, requestBody) : retry(api);
    });
};

export const updateRsvp = (
    marktId: string,
    marktDate: string,
    erkenningsNummer: string,
    attending: boolean,
): Promise<IRSVP> =>
    apiBase(
        'rsvp',
        'post',
        `{"marktDate": "${marktDate}", "attending": ${attending}, "marktId": ${marktId}, "koopmanErkenningsNummer": "${erkenningsNummer}"}`,
    ).then(response => response.data);

const getAanmeldingen = (url: string): Promise<IRSVP[]> =>
    apiBase(url).then(response => {
        for (let i = 0; i < response.data.length; i++) {
            response.data[i].marktId = response.data[i].markt;
            response.data[i].erkenningsNummer = response.data[i].koopman;
        }
        return response.data;
    });

export const getAanmeldingenByMarktAndDate = (marktId: string, marktDate: string): Promise<IRSVP[]> =>
    getAanmeldingen(`rsvp/markt/${marktId}/date/${marktDate}`);

export const getAanmeldingenByOndernemerEnMarkt = (marktId: string, erkenningsNummer: string): Promise<IRSVP[]> =>
    getAanmeldingen(`rsvp/markt/${marktId}/koopman/${erkenningsNummer}`);

export const getAanmeldingenByOndernemer = (erkenningsNummer: string): Promise<IRSVP[]> =>
    getAanmeldingen(`rsvp/koopman/${erkenningsNummer}`);

const convertApiPlaatsvoorkeurenToIPlaatsvoorkeurArray = (
    plaatsvoorkeuren: MMMarktPlaatsvoorkeuren[],
): IPlaatsvoorkeur[] => {
    let result = [];
    if (plaatsvoorkeuren === undefined) {
        return result;
    }
    plaatsvoorkeuren.forEach(pv => {
        result = result.concat(
            pv.plaatsen.map((plaats, index) => ({
                marktId: pv.markt,
                erkenningsNummer: pv.koopman,
                plaatsId: plaats,
                priority: plaatsvoorkeuren.length - index,
            })),
        );
    });
    return result;
};

const convertIPlaatsvoorkeurArrayToApiPlaatsvoorkeuren = (
    plaatsvoorkeuren: IPlaatsvoorkeur[],
): MMMarktPlaatsvoorkeuren => {
    if (plaatsvoorkeuren.length < 1) {
        console.log('empty call to convertIPlaatsvoorkeurArrayToApiPlaatsvoorkeuren');
        return null;
    }

    const markt = plaatsvoorkeuren[0].marktId;
    const koopman = plaatsvoorkeuren[0].erkenningsNummer;

    plaatsvoorkeuren.reverse().forEach(pv => {
        if (pv.marktId !== markt || pv.erkenningsNummer !== koopman) {
            console.log('call to convertIPlaatsvoorkeurArrayToApiPlaatsvoorkeuren has wrong input data');
            return null;
        }
    });

    plaatsvoorkeuren.sort((a, b) => b.priority - a.priority);

    return {
        markt: plaatsvoorkeuren[0].marktId,
        koopman: plaatsvoorkeuren[0].erkenningsNummer,
        plaatsen: plaatsvoorkeuren.map(pv => pv.plaatsId),
    };
};

export const getPlaatsvoorkeuren = (marktId: string): Promise<IPlaatsvoorkeur[]> => getPlaatsvoorkeurenByMarkt(marktId);

export const getPlaatsvoorkeurenOndernemer = (erkenningsNummer: string): Promise<IPlaatsvoorkeur[]> =>
    apiBase(`plaatsvoorkeur/koopman/${erkenningsNummer}`).then(response =>
        convertApiPlaatsvoorkeurenToIPlaatsvoorkeurArray(response.data),
    );

export const getPlaatsvoorkeurenByMarkt = (marktId: string): Promise<IPlaatsvoorkeur[]> =>
    apiBase(`plaatsvoorkeur/markt/${marktId}`).then(response =>
        convertApiPlaatsvoorkeurenToIPlaatsvoorkeurArray(response.data),
    );

export const getPlaatsvoorkeurenByMarktEnOndernemer = (
    marktId: string,
    erkenningsNummer: string,
): Promise<IPlaatsvoorkeur[]> =>
    apiBase(`plaatsvoorkeur/markt/${marktId}/koopman/${erkenningsNummer}`).then(response =>
        convertApiPlaatsvoorkeurenToIPlaatsvoorkeurArray(response.data),
    );

export const updatePlaatsvoorkeur = (plaatsvoorkeuren: IPlaatsvoorkeur[]): Promise<IPlaatsvoorkeur> => {
    const pv = convertIPlaatsvoorkeurArrayToApiPlaatsvoorkeuren(plaatsvoorkeuren);
    return apiBase('plaatsvoorkeur', 'post', JSON.stringify(pv)).then(response => response.data);
};

export const deletePlaatsvoorkeurenByMarktAndKoopman = (marktId: string, erkenningsNummer: string) =>
    apiBase(`plaatsvoorkeur/markt/${marktId}/koopman/${erkenningsNummer}`, 'delete').then(
        response => response.data
    );

const convertMMarktondernemerVoorkeurToIMarktondernemerVoorkeur = (
    marktvoorkeuren: MMarktondernemerVoorkeur[],
): IMarktondernemerVoorkeur[] => {
    const result = [];
    if (marktvoorkeuren === undefined) {
        return result;
    }

    marktvoorkeuren.forEach(vk => {
        let branches = [];
        let inrichting:string;

        if (vk.hasInrichting) {
            inrichting = 'eigen-materieel';
        }

        if (vk.branche) {
            branches.push(vk.branche as BrancheId);
        }

        result.push({
            erkenningsNummer: vk.koopman,
            marktId: vk.markt,
            marktDate: null,
            minimum: vk.minimum,
            maximum: vk.maximum,
            krachtStroom: null,
            kraaminrichting: inrichting,
            inrichting,
            anywhere: vk.anywhere,
            bakType: vk.bakType,
            branches: branches,
            verkoopinrichting: inrichting ? [inrichting]: [],
        });

        if (vk.absentFrom) result[result.length - 1].absentFrom = vk.absentFrom;
        if (vk.absentUntil) result[result.length - 1].absentUntil = vk.absentUntil;
    });

    return result;
};

const convertIMarktondernemerVoorkeurToMMarktondernemerVoorkeur = (
    marktvoorkeur: IMarktondernemerVoorkeur,
): MMarktondernemerVoorkeur => {
    // By nulling the fields 'bakType', 'hasInrichting' and 'branche'
    // we let the MM-api know that these fields
    // can be ignored in the update.

    let bakType = null;
    let branche = null;
    if (marktvoorkeur.branches !== null) {
        branche = marktvoorkeur.branches[0] as BrancheId;
        bakType = marktvoorkeur.bakType;
    }

    let hasInrichting: boolean = null;
    if (marktvoorkeur.verkoopinrichting !== undefined) {
        hasInrichting = !!marktvoorkeur.verkoopinrichting.includes('eigen-materieel');
    }

    const result: MMarktondernemerVoorkeur = {
        koopman: marktvoorkeur.erkenningsNummer,
        markt: marktvoorkeur.marktId,
        anywhere: marktvoorkeur.anywhere,
        minimum: marktvoorkeur.minimum,
        maximum: marktvoorkeur.maximum,
        hasInrichting: hasInrichting,
        bakType: bakType,
        branche: branche,
    };

    if (marktvoorkeur.absentFrom !== undefined) {
        result.absentFrom = marktvoorkeur.absentFrom;
    }
    if (marktvoorkeur.absentUntil !== undefined) {
        result.absentUntil = marktvoorkeur.absentUntil;
    }

    return result;
};

export const updateMarktVoorkeur = (marktvoorkeur: IMarktondernemerVoorkeur): Promise<MMarktondernemerVoorkeur> =>
    apiBase(
        'marktvoorkeur',
        'post',
        JSON.stringify(convertIMarktondernemerVoorkeurToMMarktondernemerVoorkeur(marktvoorkeur)),
    ).then(response => response.data);

const indelingVoorkeurPrio = (voorkeur: IMarktondernemerVoorkeur): number =>
    (voorkeur.marktId ? 1 : 0) | (voorkeur.marktDate ? 2 : 0);

const indelingVoorkeurSort = (a: IMarktondernemerVoorkeur, b: IMarktondernemerVoorkeur) =>
    numberSort(indelingVoorkeurPrio(b), indelingVoorkeurPrio(a));

const indelingVoorkeurMerge = (
    a: IMarktondernemerVoorkeurRow,
    b: IMarktondernemerVoorkeurRow,
): IMarktondernemerVoorkeurRow => {
    const merged = Object.assign({}, a);

    if (b.minimum !== null) {
        merged.minimum = b.minimum;
    }
    if (b.maximum !== null) {
        merged.maximum = b.maximum;
    }
    if (b.krachtStroom !== null) {
        merged.krachtStroom = b.krachtStroom;
    }
    if (b.kraaminrichting !== null) {
        merged.kraaminrichting = b.kraaminrichting;
    }
    if (b.anywhere !== null) {
        merged.anywhere = b.anywhere;
    }
    if (b.brancheId !== null) {
        merged.brancheId = b.brancheId;
    }
    if (b.parentBrancheId !== null) {
        merged.parentBrancheId = b.parentBrancheId;
    }
    if (b.inrichting !== null) {
        merged.inrichting = b.inrichting;
    }
    return merged;
};

export const getIndelingVoorkeur = (
    erkenningsNummer: string,
    marktId: string = null,
    marktDate: string = null,
): Promise<IMarktondernemerVoorkeur> =>
    apiBase(`marktvoorkeur/markt/${marktId}/koopman/${erkenningsNummer}`).then(response =>
        convertMMarktondernemerVoorkeurToIMarktondernemerVoorkeur(response.data)
            .sort(indelingVoorkeurSort)
            .reduce(indelingVoorkeurMerge, null),
    );

export const getIndelingVoorkeuren = (marktId: string, marktDate: string = null): Promise<IMarktondernemerVoorkeur[]> =>
    getVoorkeurenByMarkt(marktId);

const convertVoorkeurToVoorkeurRow = (obj: IMarktondernemerVoorkeur): IMarktondernemerVoorkeurRow => {
    if (obj === undefined) {
        return null;
    }
    return {
        ...obj,
        brancheId: (obj.branches[0] as BrancheId) || EMPTY_BRANCH,
        parentBrancheId: obj.branches.includes('bak') ? 'bak' : '',
        inrichting: obj.verkoopinrichting[0] || '',
    };
};

export const getVoorkeurByMarktEnOndernemer = (
    marktId: string,
    erkenningsNummer: string,
): Promise<IMarktondernemerVoorkeurRow> =>
    apiBase(`marktvoorkeur/markt/${marktId}/koopman/${erkenningsNummer}`).then(response => {
        return convertVoorkeurToVoorkeurRow(
            convertMMarktondernemerVoorkeurToIMarktondernemerVoorkeur(response.data)[0],
        );
    });

export const getVoorkeurenByMarkt = (marktId: string): Promise<IMarktondernemerVoorkeur[]> =>
    apiBase(`marktvoorkeur/markt/${marktId}`).then(response =>
        convertMMarktondernemerVoorkeurToIMarktondernemerVoorkeur(response.data),
    );

export const getVoorkeurenByOndernemer = (erkenningsNummer: string): Promise<IMarktondernemerVoorkeur[]> =>
    apiBase(`marktvoorkeur/koopman/${erkenningsNummer}`).then(response =>
        convertMMarktondernemerVoorkeurToIMarktondernemerVoorkeur(response.data),
    );

export const getMarkt = (marktId: string): Promise<MMMarkt> =>
    apiBase(`markt/${marktId}`).then(response => response.data);

export const getMarkten = (includeInactive = false): Promise<MMMarkt[]> =>
    apiBase('markt/').then(({ data: markten = [] }) =>
        markten.filter(
            markt =>
                markt.kiesJeKraamActief &&
                (includeInactive ||
                    markt.kiesJeKraamFase === 'wenperiode' ||
                    markt.kiesJeKraamFase === 'live' ||
                    markt.kiesJeKraamFase === 'activatie'),
        ),
    );

export const getMarktenForOndernemer = (
    ondernemer: Promise<MMOndernemerStandalone> | MMOndernemerStandalone,
    includeInactive = false,
): Promise<MMMarkt[]> => {
    return Promise.all([getMarkten(includeInactive), ondernemer]).then(([markten, ondernemer]) => {
        return ondernemer.sollicitaties.reduce((result, sollicitatie) => {
            const markt = markten.find(({ id }) => id === sollicitatie.markt.id);
            return markt ? result.concat(markt) : result;
        }, []);
    });
};

export const getOndernemer = (erkenningsNummer: string): Promise<MMOndernemerStandalone> => {
    return apiBase(`koopman/erkenningsnummer/${erkenningsNummer}`).then(response => {
        if (!response || !response.data) {
            throw Error('Ondernemer niet gevonden');
        }

        // Filter inactieve sollicitaties, aangezien we die nooit gebruiken binnen
        // dit systeem.
        const ondernemer = response.data;
        ondernemer.sollicitaties = ondernemer.sollicitaties.filter(sollicitatie => {
            return !sollicitatie.doorgehaald;
        });
        return ondernemer;
    });
};

export const getOndernemersByMarkt = (marktId: string): Promise<IMarktondernemer[]> => {
    return apiBase(`sollicitaties/markt/${marktId}?listLength=10000&includeDoorgehaald=0`).then(response => {
        const sollicitaties: MMSollicitatieStandalone[] = response.data;
        return sollicitaties.map(sollicitatie => {
            const { koopman, sollicitatieNummer, status, markt, vastePlaatsen } = sollicitatie;

            return {
                description: formatOndernemerName(koopman),
                erkenningsNummer: koopman.erkenningsnummer,
                plaatsen: vastePlaatsen,
                voorkeur: {
                    marktId: String(markt.id),
                    erkenningsNummer: koopman.erkenningsnummer,
                    maximum: Math.max(1, (vastePlaatsen || []).length),
                },
                sollicitatieNummer,
                status,
            };
        });
    });
};

export const getALijst = (marktId: string, marktDate: string): Promise<MMOndernemer[]> => {
    const day = new Date(marktDate).getDay();

    if (A_LIJST_DAYS.includes(day)) {
        const monday = addDays(marktDate, MONDAY - day),
            thursday = addDays(marktDate, THURSDAY - day);

        return apiBase(`rapport/aanwezigheid/${marktId}/${monday}/${thursday}`).then(response => response.data);
    } else {
        return new Promise(resolve => resolve([]));
    }
};

export const checkActivationCode = (username: string, code: string): Promise<any> =>
    getOndernemer(username).then(ondernemer => {
        if (!ondernemer.pasUid) {
            throw Error('Incorrect username/password');
        }

        return typeof code === 'string' && code.length > 0 && code === ondernemer.pasUid;
    });

export const checkLogin = (): Promise<any> => {
    const api = getApi();
    return login(api).then(() => console.log('Login OK'));
};

export const callApiGeneric = async (endpoint: string, method: HttpMethod, body?: JSON): Promise<AxiosResponse> => {
    const result = await apiBase(endpoint, method, body, true);

    return result.data;
};

export function createAllocations(marktId: string, date: string, data: Object): Promise<any> {
    const url = `allocation/markt/${marktId}/date/${date}`;
    const obj: string = JSON.stringify(data);
    return apiBase(url, 'post', obj).then(response => {
        return response;
    });
}

export function getAllocations(marktId: string, date: string): Promise<any[]> {
    const url = `allocation/markt/${marktId}/date/${date}`;
    return apiBase(url, 'get').then(response => {
        return response.data;
    });
}

function getAllocationsByOndernemerAndMarkt(marktId: string, erkenningsNummer: string): Promise<any[]> {
    const url = `allocation/markt/${marktId}/koopman/${erkenningsNummer}`;
    return apiBase(url, 'get').then(response => {
        return response.data;
    });
}

function getAllocationsByOndernemer(erkenningsNummer: string): Promise<any[]> {
    const url = `allocation/koopman/${erkenningsNummer}`;
    return apiBase(url, 'get').then(response => {
        return response.data;
    });
}

const removeUnallocatedAllocations = (allocations: any[]): IToewijzing[] => {
    return allocations.filter(allocation => allocation.isAllocated);
};

const removeAllocatedAllocations = (allocations: any[]): IAfwijzing[] => {
    return allocations.filter(allocation => !allocation.isAllocated);
};

export const getToewijzingen = (marktId: string, marktDate: string): Promise<IToewijzing[]> => {
    return getAllocations(marktId, marktDate).then(response => {
        return removeUnallocatedAllocations(response);
    });
};

export const getAfwijzingen = (marktId: string, marktDate: string): Promise<IAfwijzing[]> => {
    return getAllocations(marktId, marktDate).then(response => {
        return removeAllocatedAllocations(response);
    });
};

export const getToewijzingenByOndernemerAndMarkt = (
    marktId: string,
    erkenningsNummer: string
): Promise<IToewijzing[]> => {
    return getAllocationsByOndernemerAndMarkt(marktId, erkenningsNummer).then( response => {
        return removeUnallocatedAllocations(response);
    });
};

export const getAfwijzingenByOndernemerAndMarkt = (
    marktId: string,
    erkenningsNummer: string,
): Promise<IAfwijzing[]> => {
    return getAllocationsByOndernemerAndMarkt(marktId, erkenningsNummer).then(response => {
        return removeAllocatedAllocations(response);
    });
};

export const getToewijzingenByOndernemer = (erkenningsNummer: string): Promise<IToewijzing[]> => {
    return getAllocationsByOndernemer(erkenningsNummer).then(response => {
        return removeUnallocatedAllocations(response);
    });
};

export const getAfwijzingenByOndernemer = (erkenningsNummer: string): Promise<IAfwijzing[]> => {
    return getAllocationsByOndernemer(erkenningsNummer).then(response => {
        return removeAllocatedAllocations(response);
    });
};

export const CACHE_KEY_GENERIC_BRANCHES = 'genericBranches';
export const getCacheKeyForMarktConfiguratie = (marktId:string) => `marktconfiguratie/${marktId}`;
const prefixCacheKey = (key: string): string => `${CACHE_PREFIX}${key}`;

export const invalidateCache = async (key:string): Promise<void> => {
    console.log(`CACHE invalidate ${prefixCacheKey(key)}`);
    await redisClient.del(prefixCacheKey(key));
}

const getCachedJSONResponse = async (key: string): Promise<JSON|void> => {
    const cachedResponse: any = await redisClient.get(prefixCacheKey(key));
    if (cachedResponse) {
        console.log(`CACHE hit ${key}`);
        return JSON.parse(cachedResponse);
    }
}

const cacheJSONResponse = async (key: string, response: unknown): Promise<void> => {
    console.log(`CACHE set ${key} ttl ${CACHE_TTL}`);
    await redisClient.set(prefixCacheKey(key), JSON.stringify(response), 'EX', CACHE_TTL);
}

const getGenericBranches = async (): Promise<IGenericBranche[]> => {
    const url = '/branche/all';
    const cachedResponse = await getCachedJSONResponse(CACHE_KEY_GENERIC_BRANCHES);
    if (cachedResponse) {
        return cachedResponse as unknown as IGenericBranche[];
    }

    const genericBranches = await callApiGeneric(url, 'get');
    await cacheJSONResponse(CACHE_KEY_GENERIC_BRANCHES, genericBranches);
    return genericBranches as unknown as IGenericBranche[];
};

const getLatestMarktConfig = async (marktId: string): Promise<IMarktConfiguratie> => {
    const url = `/markt/${marktId}/marktconfiguratie/latest`;
    const cacheKey = getCacheKeyForMarktConfiguratie(marktId);
    const cachedResponse = await getCachedJSONResponse(cacheKey);
    if (cachedResponse) {
        return cachedResponse as unknown as IMarktConfiguratie;
    }

    const marktConfig = await callApiGeneric(url, 'get');
    await cacheJSONResponse(cacheKey, marktConfig);
    return marktConfig as unknown as IMarktConfiguratie;
};

const transformToLegacyBranches = (genericBranches: IGenericBranche[]): IBranche[] => {
    const legacyBranches = genericBranches.map(
        ({ id: number, afkorting: brancheId, omschrijving: description, color }) => ({
            number,
            brancheId,
            description,
            color: color ? `#${color}` : '',
        }),
    );
    return legacyBranches;
};

const transformToLegacyMarktConfig = (genericBranches: IGenericBranche[], configJSON: IMarktConfiguratie) => {
    // this function is based on MarktConfig.store and MarktConfig.get methods
    const legacyBranches = transformToLegacyBranches(genericBranches);
    const { marktOpstelling: markt, ...rest } = configJSON;
    let marktConfig = {
        ...rest,
        markt,
        branches: MarktConfig.mergeBranches(legacyBranches, configJSON.branches),
    };
    validateMarktConfig(marktConfig);
    marktConfig = MarktConfig.homogenizeData(marktConfig);

    const marktplaatsen = marktConfig.locaties;
    const rows = marktConfig.markt.rows.map(row =>
        row.map(plaatsId => marktplaatsen.find(plaats => plaats.plaatsId === plaatsId)),
    );
    return {
        marktplaatsen,
        rows,
        branches: marktConfig.branches,
        obstakels: marktConfig.geografie.obstakels,
        paginas: marktConfig.paginas,
    };
};

export async function getMarktBasics(marktId: string) {
    // this function is based on pakjekraam-api.getMarktBasics
    const mmarkt = await getMarkt(marktId);
    const { kiesJeKraamGeblokkeerdePlaatsen: geblokkeerdePlaatsen } = mmarkt;

    try {
        const genericBranches = await getGenericBranches();
        const marktConfig = await getLatestMarktConfig(marktId);
        const legacyMarktConfig = transformToLegacyMarktConfig(genericBranches, marktConfig);
        // Verwijder geblokkeerde plaatsen. Voorheen werd een `inactive` property
        // toegevoegd en op `false` gezet, maar aangezien deze nergens werd gecontroleerd
        // (behalve in de indeling), worden de plaatsen nu simpelweg verwijderd.
        if (geblokkeerdePlaatsen) {
            const blocked = geblokkeerdePlaatsen.replace(/\s+/g, '').split(',');
            legacyMarktConfig.marktplaatsen = legacyMarktConfig.marktplaatsen.map(plaats => {
                    blocked.includes(plaats.plaatsId) ? plaats.inactive = true : null;
                    return plaats;
				}
            );
        }
        return {
            markt: mmarkt,
            ...legacyMarktConfig,
        };
    } catch (error) {
        console.error(error);
        throw error;
    }
}
