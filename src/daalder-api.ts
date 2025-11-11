import { IMarktondernemerVoorkeur, IPlaatsvoorkeur, IRSVP, IRsvpPattern } from 'model/markt.model';
import { requireEnv } from './util';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { flatten, orderBy } from 'lodash'
import moment from 'moment';

requireEnv('DAALDER_API_USER_TOKEN');
requireEnv('MM_RAH_MM_RAH_SERVICE_HOST');
requireEnv('MM_RAH_MM_RAH_SERVICE_PORT');

// MM_RAH_MM_RAH_SERVICE_HOST and PORT defined by helm/kubernetes. When service name changes, this var should be changed.
export const daalderConfig = {
    baseUrl: `http://${process.env.MM_RAH_MM_RAH_SERVICE_HOST}:${process.env.MM_RAH_MM_RAH_SERVICE_PORT}`,
    authToken: `Token ${process.env.DAALDER_API_USER_TOKEN}`,
};

// New Daalder API client
const api = axios.create({
    baseURL: daalderConfig.baseUrl,
    headers: {
        Authorization: daalderConfig.authToken,
        'Content-Type': 'application/json',
        'kjk-api-key': process.env.DAALDER_API_KEY,
    },
    timeout: 10000, // 10 seconds timeout
});

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

export const getAllocation = async (data: Object): Promise<Object> => await api.post('/allocation/allocate/', { data });

export const updateOndernemerKjkEmail = async (email: string, erkenningsNummer: string): Promise<Object> =>
    await api.post('/kiesjekraam/update-kjk-email/', { email, erkenningsNummer });

// Mock Daalder API

const erkenningsNummerToSerial = (erkenningsNummer: string): string => {
    if (erkenningsNummer.length !== 10) {
        throw new Error(`Invalid erkenningsNummer: ${erkenningsNummer}`);
    }
    return erkenningsNummer.slice(0, 8) + '.' + erkenningsNummer.slice(8, 10);
}

const getUserHeader = (user: string) => ({
    'KJK-User': user,
});

const ondernemer = {
    id: 10385,
    erkenningsnummer: '2019010303', // used frequently
    voorletters: 'T.', // used frequently
    tussenvoegsels: 'van', // used frequently
    achternaam: 'Urk', // used frequently
    // email: '',
    // telefoon: '0612345678',
    // status: 'Actief',
    fotoUrl: 'https://acc.daalder.makkelijkemarkt.amsterdam.nl/image/open/ondernemer/foto/91b60cc8-8864-4318-a8bd-68774d9e2b5c.jpg',
    // 'https://api.makkelijkemarkt.mrkt-a.azure.amsterdam.nl/media/cache/resolve/koopman_rect_small/a76e6b75520aab132a6f3cdde2f0ac18-2019010303.jpg',
    fotoMediumUrl: 'https://acc.daalder.makkelijkemarkt.amsterdam.nl/image/open/ondernemer/foto/91b60cc8-8864-4318-a8bd-68774d9e2b5c.jpg',
    // 'https://api.makkelijkemarkt.mrkt-a.azure.amsterdam.nl/media/cache/resolve/koopman_rect_medium/a76e6b75520aab132a6f3cdde2f0ac18-2019010303.jpg',
    // pasUid: '0435986A041391',
    // perfectViewNummer: null,
    // handhavingsVerzoek: null,
    // weging: 0,
    // vervangers: [], // this key was not present in the testuser 2019010303. Probably not needed, but in handleAttendanceUpdate the vervangers are counted.
    sollicitaties: [
        {
            id: 86851,
            sollicitatieNummer: 1234,
            status: 'soll', // of 'vpl'
            vastePlaatsen: [], // used sometimes (array of numbers)
            // aantal3MeterKramen: 0,
            // aantal4MeterKramen: 0,
            // aantalExtraMeters: 0,
            // aantalElektra: 0,
            // aantalAfvaleiland: 0,
            // grootPerMeter: null,
            // kleinPerMeter: null,
            // grootReiniging: null,
            // kleinReiniging: null,
            // afvalEilandAgf: null,
            // krachtstroomPerStuk: 0,
            // krachtstroom: false,
            doorgehaald: false, // used sometimes
            // doorgehaaldReden: '',
            // koppelveld: '4045_5247',
            markt: {id: 20, naam: 'Plein 41-44', afkorting: '4144'}, // id used frequently, naam used only sometimes, afkorting used by typing AanwezigheidsPage
        },
    ],
    vervangers: [], // used by aanwezigheidspage to count vervangers
};

export const getOndernemer = async (erkenningsNummer: string): Promise<any> => {
    console.log('getOndernemer', erkenningsNummer);
    // return ondernemer;

    const ondernemer: any = await api.get(`/kiesjekraam/ondernemer/${erkenningsNummer}/`);
    return ondernemer;
}

// markten: id, naam, kiesJeKraamFase, marktDagen

const markt_4045 = {
    id: 20, // dit moet worden afgeleid uit een mapping van MM markt.id naar Daalder markt.id
    afkorting: '4045',
    naam: "Plein '42 - '43",
    //   soort: 'dag', <== wordt niet gebruikt
    //   geoArea: null, <== wordt niet gebruikt
    marktDagen: ['di', 'wo', 'do', 'vr', 'za'], // also used bij AanwezigheidsPage
    //   standaardKraamAfmeting: 4, <== wordt niet gebruikt
    //   extraMetersMogelijk: true, <== wordt niet gebruikt (ook niet in allocation in Daalder)
    //   aanwezigeOpties: {
    //     '4mKramen': true,
    //     extraMeters: true,
    //     krachtstroom: true,
    //     afvalEilandAgf: true
    //   }, <== wordt niet gebruikt
    //   perfectViewNummer: 19, <== wordt niet gebruikt
    aantalKramen: 150,  // wordt gebruikt in MarketListPage
    maxAantalKramenPerOndernemer: null, // <== belangrijk (via: const maxNumKramen = markt.maxAantalKramenPerOndernemer)
    //   aantalMeter: 600, <== wordt niet gebruikt
    //   auditMax: 10, <== wordt niet gebruikt
    kiesJeKraamMededelingActief: true, // bepaald of mededeling getoond wordt op ondernemer markt detail page
    kiesJeKraamMededelingTitel: "Dit is een titel voor een mededeling",
    kiesJeKraamMededelingTekst: "Dit is een tekst voor een mededeling",
    // kiesJeKraamActief: true, // <== wordt gebruikt in combinatie met kiesJeKraamFase
    //   marktBeeindigd: false, <== wordt niet gebruikt
    kiesJeKraamFase: 'live',
    kiesJeKraamGeblokkeerdePlaatsen: '26,133', // null of string
    kiesJeKraamGeblokkeerdeData: null, // null of string van comma separated dates
    //   kiesJeKraamEmailKramenzetter: 'a.hargens@amsterdam.nl', <== kramenzetter mail vanaf Daalder?
    //   marktDagenTekst: 'di. t/m za.',  <== wordt niet gebruikt
    //   indelingsTijdstipTekst: '15.00 uur', <== wordt niet gebruikt
    telefoonNummerContact: '020 25429 12', // wordt gebruikt in OndernemerMarktDetailPage
    //   makkelijkeMarktActief: true, <== wordt niet gebruikt
    // indelingstype: 'a/b-lijst', <== wordt niet gebruikt, alleen om A/B lijst knopje te tonen (of bij allocation misschien)
    //   isABlijstIndeling: false, <== wordt niet gebruikt (of bij allocation misschien)
};

const markten = [
    markt_4045,
];

export const getMarkten = async (includeInactive: boolean = false): Promise<any> => {
    // nog filteren op:
    // markten.filter(
    //     (markt) =>
    //         markt.kiesJeKraamActief &&
    //         (includeInactive ||
    //             markt.kiesJeKraamFase === 'wenperiode' ||
    //             markt.kiesJeKraamFase === 'live' ||
    //             markt.kiesJeKraamFase === 'activatie'),
    // )
    //
    // includeInactive is set to true when logging in as Marktmeester or Marktbewerker,
    // so no need to further support this given that KJK will only be used by ondernemers the future.
    // From Daalder, only marktVersion with active = True are returned.
    console.log('getMarkten');
    // return markten;
    const markten: any[] = await api.get('/kiesjekraam/markt/');
    return markten;
}

export const getMarkt = async (marktId: string | number): Promise<any> => {
    console.log('getMarkt', marktId);
    // return markt_4045;

    const markt = await api.get(`/kiesjekraam/markt/${marktId}/`);
    return markt;
}

const marktplaatsen = [
    // moeten nog weggelaten worden indien plaatsId in kiesJeKraamGeblokkeerdePlaatsen
    {
        // bakType: 'geen',
        id: 1, // use standplaats.id or concat marktId + plaatsId
        plaatsId: '26',
        // branches: [],
        // properties: [],
        // verkoopinrichting: [],
    },
    {
        // bakType: 'geen',
        id: 2,
        plaatsId: '27',
        // branches: [],
        // properties: [],
        // verkoopinrichting: [],
    },
];

const branches = [
    // worden in dit format transformed door transformToLegacyBranches
    {
        number: 66,
        brancheId: '505 -  NF - Gebruikte kleding - antiek',
        description: '505 -  NF - Gebruikte kleding - antiek',
        color: '#B8837A',
        verplicht: false,
    },
    {
        number: 69,
        brancheId: '506 -  NF - Gebruikte modeaccessoires',
        description: '506 - NF - Gebruikte modeaccessoires',
        color: '#719790',
        verplicht: false,
    },
];

export const getMarktBasics = async (marktId: string): Promise<any> => {
    // also used by getMarktDetails, die weer alleen door allocatie gerelateerde pages wordt gebruikt
    console.log('getMarktBasics', marktId);
    const markt = await getMarkt(marktId);
    const branches = await getBranches(); // TODO: filter per markt
    const standplaatsen = await getStandplaatsen(marktId);
    return {
        markt, // getMarkt
        marktplaatsen: standplaatsen, // <== algemene voorkeuren page gebruikt standplaatsen
        branches, // <== algemene voorkeuren page gebruikt branches
        // rows: [],
        // obstakels: [],
        // paginas: []
    };
}

const plaatsvoorkeurenData = [
{
    id: 1, // use standplaats.id or concat marktId + plaatsId
    marktId: '20',
    erkenningsNummer: '2019010303',
    plaatsId: '133',
    priority: 0
  },
  {
    id: 2,
    marktId: '20',
    erkenningsNummer: '2019010303',
    plaatsId: '135',
    priority: 1
  },
  {
    id: 3,
    marktId: '20',
    erkenningsNummer: '2019010303',
    plaatsId: '139',
    priority: 2
  }
]

const getOndernemerPrefs = async (erkenningsNummer: string): Promise<any> => {
    console.log('getOndernemerPrefs', erkenningsNummer);
    const serial = erkenningsNummerToSerial(erkenningsNummer);
    const response: [{specs: {}, id: number}] = await api.get(`/kiesjekraam/pref/?inschrijving__ondernemer__serial=${serial}`);
    return response.map(({id, specs}) => ({id, ...specs}));
}

const getOndernemerMarktPrefs = async (erkenningsNummer: string, marktId: number|string): Promise<any> => {
    console.log('getOndernemerMarktPrefs', erkenningsNummer, marktId);
    const {id, specs}: {id: number, specs: {}} = await api.get(`/kiesjekraam/pref/markt/${marktId}/ondernemer/${erkenningsNummer}/`);
    return {id, ...specs};
}

const updateOndernemerMarktPrefs = async (erkenningsNummer: string, marktId: number|string, prefs: any, user: string): Promise<any> => {
    console.log('updateOndernemerMarktPrefs', prefs, user);
    const data = {specs: prefs}
    const headers = getUserHeader(user);
    const response = await api.patch(
        `/kiesjekraam/pref/markt/${marktId}/ondernemer/${erkenningsNummer}/`,
        data,
        { headers })
    // console.log('response', response)
    return response;
}

const getBranches = async (includeInactive: boolean = false): Promise<any[]> => {
    // TODO: filter per markt
    console.log('getBranches', includeInactive);
    const queryParms = includeInactive ? '' : '?active=true';
    const branches: any[] = await api.get(`/kiesjekraam/branche/${queryParms}`);
    return branches;
}

const getStandplaatsen = async (marktId: number|string, includeInactive: boolean = false): Promise<any[]> => {
    const queryParms = `?markt_version_id=${marktId}` + (includeInactive ? '' : '&active=true');
    const standplaatsen: any[] = await api.get(`/kiesjekraam/standplaats/${queryParms}`);
    return standplaatsen;
}

// this is imported in src/routes/dashboard.ts but then not actually used in template that is rendered
export const getPlaatsvoorkeurenOndernemer = async (ondernemerId: string): Promise<IPlaatsvoorkeur[]> => {
    console.log('getPlaatsvoorkeurenOndernemer', ondernemerId);
    // return await api.get(`/kiesjekraam/voorkeur/plaats/ondernemer/${ondernemerId}/`);
    // return plaatsvoorkeurenData.filter(pref => pref.erkenningsNummer === ondernemerId);

    const prefs = await getOndernemerPrefs(ondernemerId);
    return flatten(prefs.map((pref: any) => pref.plaatsen));
};

export const getPlaatsvoorkeurenByMarktEnOndernemer = async (marktId: string, ondernemerId: string): Promise<IPlaatsvoorkeur[]> => {
    console.log('getPlaatsvoorkeurenByMarktEnOndernemer', marktId, ondernemerId);
    const prefs = await getOndernemerMarktPrefs(ondernemerId, marktId);
    const {plaatsen = []}: {plaatsen: IPlaatsvoorkeur[]} = prefs;
    return plaatsen;
}

export const deletePlaatsvoorkeurenByMarktAndKoopman = async (marktId: string, erkenningsNummer: string, user: string) => {
    console.log('deletePlaatsvoorkeurenByMarktAndKoopman', marktId, erkenningsNummer);
    // plaatsvoorkeurenData.length = 0; // clear array
    const prefs = {plaatsen: []}
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, prefs, user);
}

export const updatePlaatsvoorkeur = async (plaatsvoorkeuren: IPlaatsvoorkeur[], user: string): Promise<any> => {
    console.log('updatePlaatsvoorkeur', plaatsvoorkeuren, user)
    // max number of plaatsvoorkeuren is determined by the prop markt.maxAantalKramenPerOndernemer (in the PlaatsvoorkeurenForm)

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

    // const updatedPlaatsen = plaatsvoorkeuren.map(pref => pref.plaatsId);
    // const existingPlaatsen = plaatsvoorkeurenData.map(pref => pref.plaatsId);
    // const toBeAdded = updatedPlaatsen.filter(plaats => !existingPlaatsen.includes(plaats));
    // const toBeRemoved = existingPlaatsen.filter(plaats => !updatedPlaatsen.includes(plaats));

    // console.log('toBeAdded', toBeAdded)
    // console.log('toBeRemoved', toBeRemoved)

    // plaatsvoorkeurenData.length = 0; // clear array

    // orderBy(plaatsvoorkeuren, ['priority'], ['desc']).forEach((updated, index) => {
    //     updated.priority = index;
    //     plaatsvoorkeurenData.push(updated)
    // });
    // Does this sort affect the order as shown on the card OndernemerMarktVoorkeuren ? If so the fix there needs to be removed.

    return; // MM returns data that is not used, instead the page does a new GET for all data
}

const voorkeur = {
  // erkenningsNummer: '2019010303', die van ondernemer object wordt gebruikt
  // marktId: '20', staat wel hidden in de AlgemeneVoorkeurenForm
  // marktDate: null, staat wel hidden in de AlgemeneVoorkeurenForm
  // minimum: 2, staat wel hidden in de AlgemeneVoorkeurenForm
  // maximum: 2, staat wel hidden in de AlgemeneVoorkeurenForm
  // anywhere: true, staat wel hidden in de AlgemeneVoorkeurenForm
  // krachtStroom: null,
  inrichting: '', // of: 'eigen-materieel',
  bakType: 'bak-licht', // of: 'bak-licht', 'bak'
  // branches: [ '206 -  FC - Stroopwafels' ],
  // verkoopinrichting: [],
  brancheId: '506 -  NF - Gebruikte modeaccessoires', // '206 -  FC - Stroopwafels', // used by KJK voorkeuren
  branche: '506 -  NF - Gebruikte modeaccessoires', // used by AanwezigheidsPage
  markt: '20', // used by AanwezigheidsPage
  parentBrancheId: undefined,
  minimum: 1,
  maximum: 2,
  // kraaminrichting: undefined, <== not used
  anywhere: false,
}

// const indelingVoorkeurData = {
//   minimum: 1,
//   maximum: 2,
//   kraaminrichting: undefined,
//   anywhere: false,
//   brancheId: undefined,
//   parentBrancheId: undefined,
//   inrichting: undefined
// };

export const getIndelingVoorkeur = async (ondernemerId: string, marktId: string) => {
    console.log('getIndelingVoorkeur')
    const {minimum, maximum, anywhere} = await getOndernemerMarktPrefs(ondernemerId, marktId);
    return {
        minimum,
        maximum,
        anywhere,
    };
    // return voorkeur
}

export const updateMarktVoorkeur = async (
    marktvoorkeur: IMarktondernemerVoorkeur,
    user: string, // actually an email string like team.salmagundi.ois@amsterdam.nl
): Promise<any> => {
    console.log('updateMarktVoorkeur', marktvoorkeur);

    // TODO: user is send to keep track of who made the changes.
    console.log('user', user);

    const {marktId, erkenningsNummer, minimum, maximum, anywhere} = marktvoorkeur;
    const data = { minimum, maximum, anywhere };
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, data, user);

    // voorkeur.minimum = Number(marktvoorkeur.minimum) || 0;
    // voorkeur.maximum = Number(marktvoorkeur.maximum) || 0;
    // voorkeur.anywhere = Boolean(marktvoorkeur.anywhere);

    // MM returns data that is not used, instead the page does a new GET for all data
    // This GET is triggered by the redirect after posting the form
    return;
}

const voorkeuren = [voorkeur];

// export const getVoorkeurenByOndernemer = async (
//     erkenningsNummer: string,
// ): Promise<any> => {
//     console.log('getVoorkeurenByOndernemer', erkenningsNummer);
//     // used by RSVP page via DaalderApiDispatch and useMarktVoorkeur hook
//     return voorkeuren
// }
// ==> made this function obsolete, no longer used by the new AanwezigheidsPage

export const getVoorkeurByMarktEnOndernemer = async (
    marktId: string,
    erkenningsNummer: string,
): Promise<any> => {
    console.log('getVoorkeurByMarktEnOndernemer', marktId, erkenningsNummer);
    const prefs = await getOndernemerMarktPrefs(erkenningsNummer, marktId);
    return {
        ...prefs,
        branche: prefs.brancheId,
        parentBrancheId: null,
        markt: String(marktId),
    };
    // return voorkeur;
}

// updateVoorkeur {
//   erkenningsNummer: '2019010303',
//   marktId: '20',
//   marktDate: null,
//   bakType: 'bak-licht',
//   anywhere: null,
//   minimum: null,
//   maximum: null,
//   brancheId: '107 -  FM - Vis (nat)',
//   parentBrancheId: null,
//   inrichting: 'eigen-materieel',
//   absentFrom: null,
//   absentUntil: null,
//   branches: [ '107 -  FM - Vis (nat)' ],
//   verkoopinrichting: [ 'eigen-materieel' ]
// }

export const updateVoorkeur = async (
    updatedVoorkeur: any,
    user: string, // actually an email string like "team.salmagundi.ois@amsterdam.nl"
): Promise<any> => {
    console.log('updateVoorkeur', updatedVoorkeur, user);
    // updatedVoorkeur.erkenningsNummer: '2019010303' kan gebruikt worden voor de api call
    // updatedVoorkeur.marktId: kan gebruikt worden voor de api call
    // updatedVoorkeur.inrichting: null | 'eigen-materieel'
    // updatedVoorkeur.bakType: 'geen' | 'bak-licht' | 'bak'

    const {marktId, erkenningsNummer, inrichting, bakType, brancheId} = updatedVoorkeur;
    const data = { inrichting, bakType, brancheId };
    await updateOndernemerMarktPrefs(erkenningsNummer, marktId, data, user);

    // voorkeur.bakType = updatedVoorkeur.bakType;
    // voorkeur.inrichting = updatedVoorkeur.inrichting;
    // voorkeur.brancheId = updatedVoorkeur.brancheId;
}

const allocations = [
    {
    id: 174421,
    isAllocated: true,
    rejectReason: null,
    plaatsen: [ '131' ],
    date: '2024-11-03',
    anywhere: true,
    minimum: 1,
    maximum: 2,
    // this shows as aantal 1,1 (waarschijnlijk minimum = 1 en extra plaatsen = 1)
    bakType: 'geen', // 'bak-licht', 'bak' => maar tabel toont gewoon de inhoud van de string
    hasInrichting: false, // true
    koopman: '2019010303',
    branche: '206 -  FC - Stroopwafels',
    markt: '20',
    plaatsvoorkeuren: [ '131', '133' ] // null or [] also allowed
  }
]

const toewijzingen = allocations.map(allocation => ({ ...allocation, isAllocated: true }));
const afwijzingen = allocations.map(allocation => ({ ...allocation, isAllocated: false }));

export const getToewijzingenByOndernemer = async (erkenningsNummer: string): Promise<any> => {
    console.log('getToewijzingenByOndernemer', erkenningsNummer);
    return toewijzingen.filter(toewijzing => toewijzing.koopman === erkenningsNummer);
}

export const getToewijzingenByOndernemerAndMarkt = async (marktId: string, erkenningsNummer: string): Promise<any> => {
    console.log('getToewijzingenByOndernemerAndMarkt', marktId, erkenningsNummer);
    return toewijzingen.filter(toewijzing => toewijzing.koopman === erkenningsNummer && toewijzing.markt === marktId);
}

export const getAfwijzingenByOndernemer = async (erkenningsNummer: string): Promise<any> => {
    console.log('getAfwijzingenByOndernemer', erkenningsNummer);
    return afwijzingen.filter(afwijzing => afwijzing.koopman === erkenningsNummer);
}

export const getAfwijzingenByOndernemerAndMarkt = async (marktId: string, erkenningsNummer: string): Promise<any> => {
    console.log('getAfwijzingenByOndernemerAndMarkt', marktId, erkenningsNummer);
    return afwijzingen.filter(afwijzing => afwijzing.koopman === erkenningsNummer && afwijzing.markt === marktId);
}

const rsvps = [
  // let op: id is null of een echt id (waarschijnlijk of ze al bestaan in db of net gegenereerd als nieuwe)
  // twee weken aan rsvp data, gerekend vanaf maandag
  {
      "id": null,
      "marktDate": "2025-10-31",
      "attending": true,
      "markt": '311',
      "koopman": "2019010303"
  },
  {
      "id": null,
      "marktDate": "2025-11-01",
      "attending": true,
      "markt": '311',
      "koopman": "2019010303"
  },
];

const rsvpPatterns = [
  {
      "id": 2568,
      "markt": "311",
      "koopman": "2019010303",
      // "patternDate": "2025-10-09 07:56:54", // probably not used, but verify MM
      "monday": false,
      "tuesday": false,
      "wednesday": false,
      "thursday": false,
      "friday": true,
      "saturday": false,
      "sunday": false
  },
  {
      "id": 2565,
      "markt": "222",
      "koopman": "2019010303",
      // "patternDate": "2025-10-09 07:56:17", // probably not used, but verify MM
      "monday": false,
      "tuesday": false,
      "wednesday": false,
      "thursday": false,
      "friday": false,
      "saturday": false,
      "sunday": false
  },
];

interface ILegacyRSVP extends Omit<IRSVP, 'erkenningsNummer'> { id: number | null, koopman: string, markt: string }

export const getAanmeldingenByOndernemer = async (erkenningsNummer: string): Promise<ILegacyRSVP[]> => {
    console.log('getAanmeldingenByOndernemer', erkenningsNummer);
    const rsvps: ILegacyRSVP[] = await getRsvps(erkenningsNummer);
    // add marktId for legacy
    return rsvps.filter(rsvp => rsvp.koopman === erkenningsNummer).map(rsvp => ({ ...rsvp, marktId: rsvp.markt.toString() }));
};

export const getAanmeldingenByOndernemerEnMarkt = async (marktId: string | number, erkenningsNummer: string): Promise<ILegacyRSVP[]> => {
    console.log('getAanmeldingenByOndernemerEnMarkt', marktId, erkenningsNummer);
    const rsvps: ILegacyRSVP[] = await getRsvps(erkenningsNummer);
    // add marktId for legacy
    return rsvps
        .filter(rsvp => rsvp.koopman === erkenningsNummer && rsvp.markt === marktId)
        .map(rsvp => ({ ...rsvp, marktId: rsvp.markt.toString() }));
};

export const getRsvps = async (erkenningsNummer: string): Promise<ILegacyRSVP[]> => {
    console.log('getRsvps', erkenningsNummer);
    // Get monday of the same week as today
    const monday = moment().startOf('isoWeek').format('YYYY-MM-DD');
    // Get sunday two weeks later
    const sundayInTwoWeeks = moment().startOf('isoWeek').add(13, 'days').format('YYYY-MM-DD');

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

    // {
    //   marktDate: '2025-10-17',
    //   shortName: 'vr',
    //   koopman: '2019010303',
    //   markt: '20',
    //   attending: false,
    //   day: 'friday',
    //   dateNL: '17-10-2025',
    //   isInThePast: false,
    //   isActiveMarketDay: true,
    //   id: 16900,
    //   koopmanErkenningsNummer: '2019010303',
    //   marktId: '20'
    // },

    const headers = getUserHeader(user);
    const rsvps: any[] = await api.post('/kiesjekraam/rsvp/', data, { headers });
    return rsvps;  // although returned rsvps are not consumed by AanwezigheidsPage

    // data.rsvps.forEach((updatedRsvp: any) => {
    //     const existing = rsvps.find(existingRsvp => existingRsvp.marktDate === updatedRsvp.marktDate && existingRsvp.koopman === updatedRsvp.koopman && existingRsvp.markt === updatedRsvp.markt);
    //     if (existing) {
    //         existing.attending = updatedRsvp.attending;
    //     } else {
    //         const newId = Math.max(0, ...rsvps.map(rsvp => rsvp.id || 0)) + 1;
    //         console.log('creating', newId)
    //         rsvps.push({
    //             id: newId,
    //             marktDate: updatedRsvp.marktDate,
    //             attending: updatedRsvp.attending,
    //             markt: updatedRsvp.markt,
    //             koopman: updatedRsvp.koopman,
    //         });
    //     }
    // });
    // return rsvps
};

export const saveRsvpPatterns = async (data: any, user: string) => {
    console.log('saveRsvpPatterns', data, user);
    // {
    //   monday: false,
    //   tuesday: false,
    //   wednesday: false,
    //   thursday: false,
    //   friday: true,
    //   saturday: false,
    //   sunday: false,
    //   erkenningsNummer: '2019010303',
    //   markt: '20'
    // }

    // const existingPattern: ILegacyRSVPPattern = rsvpPatterns.find(p => p.koopman === data.erkenningsNummer && p.markt === data.markt)
    // const pattern: Partial<ILegacyRSVPPattern> = existingPattern || {
    //     id: Math.max(0, ...rsvpPatterns.map(p => p.id || 0)) + 1,
    //     markt: data.markt,
    //     koopman: data.erkenningsNummer,
    // };
    // pattern.monday = data.monday;
    // pattern.tuesday = data.tuesday;
    // pattern.wednesday = data.wednesday;
    // pattern.thursday = data.thursday;
    // pattern.friday = data.friday;
    // pattern.saturday = data.saturday;
    // pattern.sunday = data.sunday;
    // return pattern;

    const headers = getUserHeader(user);
        if (data.id) {
        const updatedPattern = await api.patch(`/kiesjekraam/rsvp-pattern/${data.id}/`, data, { headers });
        return updatedPattern;
    } else {
        const newPattern = await api.post('/kiesjekraam/rsvp-pattern/', data, { headers });
        return newPattern;
    }
};
