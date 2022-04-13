enum DeelnemerStatus {
    VASTE_PLAATS = 'vpl',
    TIJDELIJKE_VASTE_PLAATS = 'vkk',
    SOLLICITANT = 'soll',
}

export interface MMSession {
    uuid: string;
    creationDate: number;
    lifeTime: number;
}

interface MMMarktRef {
    id: string;
    naam: string;
    afkorting: string;
}

export interface MMMarkt {
    id: string;
    afkorting: string;
    naam: string;
    geoArea: any;
    soort: string;
    marktDagen: string[];
    standaardKraamAfmeting: number;
    extraMetersMogelijk: boolean;
    kiesJeKraamFase: string;
    kiesJeKraamActief: boolean;
    kiesJeKraamGeblokkeerdeData: string;
    kiesJeKraamGeblokkeerdePlaatsen: string;
    kiesJeKraamEmailKramenzetter: string;
    aanwezigeOpties: {
        '3mKramen': boolean;
        '4mKramen': boolean;
        extraMeters: boolean;
        elektra: boolean;
        afvaleiland: boolean;
    };
    telefoonNummerContact: string;
    perfectViewNummer: number;
    aantalKramen: number;
    aantalMeter: number;
    auditMax: number;
}

export interface MMOndernemer {
    id: number;
    erkenningsnummer: string;
    voorletters: string;
    tussenvoegsels: string;
    achternaam: string;
    telefoon: string;
    email: string;
    handhavingsVerzoek?: any;
    fotoUrl: string;
    fotoMediumUrl: string;
    status: string;
    perfectViewNummer: number;
    weging: number;
    pasUid: string;
    vervangers: MMVervanger[];
}

export interface MMOndernemerStandalone extends MMOndernemer {
    sollicitaties: MMSollicitatie[];
}

interface MMVervanger {
    vervanger_id: number;
    pas_uid: string;
    erkenningsnummer: string;
    voorletters: string;
    tussenvoegsels: string;
    achternaam: string;
    telefoon: string;
    email: string;
    fotoUrl: string;
    fotoMediumUrl: string;
    status: string;
    perfectViewNummer: number;
}

export interface MMSollicitatie {
    id: number;
    sollicitatieNummer: number;
    status: DeelnemerStatus;
    vastePlaatsen: string[];
    aantal3MeterKramen: number;
    aantal4MeterKramen: number;
    aantalExtraMeters: number;
    aantalElektra: number;
    krachtstroom: boolean;
    doorgehaald: boolean;
    doorgehaaldReden: string;
    markt: MMMarktRef;
    koppelveld: any;
    aantalAfvaleiland: number;
}

export interface MMSollicitatieStandalone extends MMSollicitatie {
    koopman: MMOndernemer;
}

export interface MMMarktPlaatsvoorkeuren {
    markt: string;
    koopman: string;
    plaatsen: string[];
}

export interface MMarktondernemerVoorkeur {
    id?: number;
    anywhere?: boolean;
    minimum?: number;
    maximum?: number;
    hasInrichting?: boolean;
    isBak?: boolean;
    absentFrom?: Date;
    absentUntil?: Date;
    branche: string;
    markt: string;
    koopman: string;
}
