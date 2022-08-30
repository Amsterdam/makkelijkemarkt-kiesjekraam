export interface MMarkt {
  id: number
  afkorting: string
  naam: string
  soort: Soort
  geoArea?: number | null
  marktDagen?: MarktDagen[]
  standaardKraamAfmeting?: number
  extraMetersMogelijk?: boolean
  aanwezigeOpties?: any[] | AanwezigeOptiesClass
  perfectViewNummer?: number | null
  aantalKramen?: number | null
  aantalMeter?: number | null
  auditMax?: number
  kiesJeKraamMededelingActief?: boolean
  kiesJeKraamMededelingTitel?: KiesJeKraamMededelingTitel | null
  kiesJeKraamMededelingTekst?: null | string
  kiesJeKraamActief: boolean
  kiesJeKraamFase?: KiesJeKraamFase | null
  kiesJeKraamGeblokkeerdePlaatsen?: null
  kiesJeKraamGeblokkeerdeData?: null | string
  kiesJeKraamEmailKramenzetter?: null | string
  marktDagenTekst?: null | string
  indelingsTijdstipTekst?: IndelingsTijdstipTekst | null
  telefoonNummerContact?: null | string
  makkelijkeMarktActief?: boolean
  indelingstype?: Indelingstype
  isABlijstIndeling?: boolean
}

export interface AanwezigeOptiesClass {
  '3mKramen'?: boolean
  '4mKramen'?: boolean
  extraMeters?: boolean
  elektra?: boolean
  afvaleiland?: boolean
  krachtstroom?: boolean
  eenmaligElektra?: boolean
}

export enum IndelingsTijdstipTekst {
  The900Uur = '9.00 uur',
}

export enum Indelingstype {
  ABLijst = 'a/b-lijst',
  Traditioneel = 'traditioneel',
}

export enum KiesJeKraamFase {
  Activatie = 'activatie',
  Live = 'live',
  Voorbereiding = 'voorbereiding',
  Wenperiode = 'wenperiode',
}

export enum KiesJeKraamMededelingTitel {
  FoodProductenBloemenEnPlantenEnHandmatigeIndeling = 'Food producten, bloemen en planten en handmatige indeling',
  TijdelijkGeenDigitaleIndeling = 'Tijdelijk geen digitale indeling',
}

export enum MarktDagen {
  Di = 'di',
  Do = 'do',
  Ma = 'ma',
  VR = 'vr',
  Wo = 'wo',
  Za = 'za',
  Zo = 'zo',
}

export enum Soort {
  Dag = 'dag',
  Seizoen = 'seizoen',
  Week = 'week',
}
