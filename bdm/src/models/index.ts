import { MMarkt } from './mmarkt'
export * from './mmarkt'

export type Nullable<T> = T | null
export type ErkenningsNummer = string

export interface INaam {
  naam: string
  id: number
}

export interface Plan {
  name: string
  pages: number
}
export interface MarketState {
  id: number
  name: string
  valid?: boolean
}

export interface Assignment {
  class: string
  title: string
  landmarkTop: string
  landmarkBottom: string
  plaatsList: string[]
}

export interface Rows {
  rows: string[][]
}

export interface Page {
  title: string
  indelingslijstGroup: Assignment[]
}

export interface Market {
  id: number
  name: string
  phase?: string
  plan?: Plan
  municipality?: string
  stands?: number
  invalid?: boolean
}

// Kraam
export interface Stand {
  bakType?: string
  plaatsId: string
  branches?: string[]
  verkoopinrichting?: string[]
  properties?: string[]
  type?: 'stand'
}

// Obstakel
export interface Obstacle {
  kraamA: string
  kraamB: string
  obstakel: string[]
  type?: 'obstacle'
}

// Plek
export interface Lot {
  plaatsId?: string
  branches?: string[]
  verkoopinrichting?: string[]
  properties?: string[]
  kraamA?: string
  kraamB?: string
  obstakel?: string[]
  type?: 'lot' | 'stand' | 'obstacle'
  selected?: boolean
  blockPosition?: [number, number]
  blockStart?: boolean
  blockEnd?: boolean
  invalid?: boolean
  bakType?: string
}

export interface Geography {
  obstakels: Obstacle[]
}

// Branches for the general Branches list
export interface Branche {
  id: number
  omschrijving: string
  color: string
  afkorting: string
}

export interface Announcement {
  activatie: string
  wenperiode: string
  live: string
}

export interface Announcements {
  marktDetail: Announcement
  marktDetailPlaatsvoorkeuren: Announcement
  aanwezigheid: Announcement
  plaatsVoorkeuren: Announcement
}

export interface AssignedBranche {
  brancheId: string
  verplicht: boolean
  maximumPlaatsen?: number
  allocated?: number
  backGroundColor?: string
  color?: string
}

export interface Markets {
  [key: string]: Market
}

export interface MarketLayout {
  _key: string
  class: string
  landmarkTop: string
  landmarkBottom: string
  title: string
  lots: Lot[]
  invalid?: boolean
}

export interface MarketPage {
  layout: MarketLayout[]
  title: string
  invalid?: boolean
}

export interface MarketEventDetails {
  branches: AssignedBranche[]
  pages: MarketPage[]
}

export interface DayOfWeek {
  id: number
  name: string
  abbreviation: string
}

export interface IMarktConfiguratie {
  branches: AssignedBranche[]
  geografie: Geography
  locaties: Lot[]
  marktOpstelling: Rows
  paginas: Page[]
}

export interface IMarktContext {
  marktId: string
  saveMarktConfig(marktConfiguratie: IMarktConfiguratie): void
  saveInProgress: boolean
  saveIsSuccess: boolean
  saveIsError: boolean
  saveError: IApiError | null
  markt?: MMarkt
  marktNotFound: boolean
  marktConfig?: IMarktConfiguratie
  marktConfigNotFound: boolean
}

export interface IMarktGenericContext {
  genericBranches: Branche[]
  obstakel: INaam[]
  plaatseigenschap: INaam[]
}

export interface IMarkt {
  id: number
  afkorting: string
  naam: string
}

export interface IApiError extends Error {
  status?: number
  statusText?: string
}

export interface IQueryContext {
  isLoading: boolean
  isSuccess: boolean
  errors: (IApiError | null)[]
  queryProgress: number
}

export interface IAction<Payload = {}> {
  type: string
  payload: Payload
}

export interface IItemReducerAction extends IAction<IItemReducerActionPayload> {}
export interface IItemReducerActionPayload<Data = []> {
  data?: Data
  id?: number
  key?: string
  value?: any
  newItem?: any
}

export interface IItemReducerItem {
  id: number | string
}

export interface IBrancheAction extends IAction<IBranchePayload> {}
export interface IBranchePayload extends IItemReducerActionPayload<Branche[]> {}

export interface IOndernemer {
  achternaam: string
  email: string
  erkenningsnummer: ErkenningsNummer
  fotoMediumUrl?: string
  fotoUrl?: string
  handhavingsVerzoek?: string
  id: number
  pasUid?: string
  perfectViewNummer: number
  sollicitaties: ISollicitatie[]
  status: string
  telefoon?: string
  tussenvoegsels: string
  vervangers: IOndernemer[]
  voorletters: string
  weging: number
}

export interface ISollicitatie {
  id: string
  sollicitatieNummer: number
  status: string
  vastePlaatsen: number[]
  aantal3MeterKramen: Nullable<number>
  aantal4MeterKramen: Nullable<number>
  aantalExtraMeters: Nullable<number>
  aantalElektra: Nullable<number>
  aantalAfvaleiland: Nullable<number>
  grootPerMeter: Nullable<number>
  kleinPerMeter: Nullable<number>
  grootReiniging: Nullable<number>
  kleinReiniging: Nullable<number>
  afvalEilandAgf: Nullable<number>
  krachtstroomPerStuk: Nullable<number>
  krachtstroom: boolean
  doorgehaald: boolean
  doorgehaaldReden: string
  // "koppelveld": null,
  // "markt": {
  //     "id": 39,
  //     "afkorting": "AC-2022",
  //     "naam": "Albert Cuyp-2022",
  //     "isABlijstIndeling": false
  // },
  markt: IMarkt
  koopman: IOndernemer
  // "koopman": {
  //     "id": 162,
  //     "erkenningsnummer": "2068723555",
  //     "voorletters": "M",
  //     "tussenvoegsels": "",
  //     "achternaam": "Lesch",
  //     "email": "dschuppe@gmail.com",
  //     "telefoon": null,
  //     "status": "Actief",
  //     "fotoUrl": null,
  //     "fotoMediumUrl": null,
  //     "pasUid": null,
  //     "vervangers": []
  // }
}

export interface IAllocationApiData {
  id: number
  isAllocated: boolean
  rejectReason: string
  plaatsen: string[]
  date: string
  anywhere: boolean
  minimum: number
  maximum: number
  bakType: string
  hasInrichting: boolean
  koopman: ErkenningsNummer
  branche: string
  markt: string
  plaatsvoorkeuren: string[]
}

export interface IAllocation {
  marktId: string
  isAllocated: boolean
  ondernemer: {
    sollicitatieNummer: string
    status: string
    plaatsen: string[]
    erkenningsNummer: ErkenningsNummer
    plaatsvoorkeuren: string[]
    voorkeur: {
      minimum: number
      maximum: number
      anywhere: boolean
      bakType: string
      branches: string[]
      verkoopinrichting: string[]
    }
  }
  plaatsen: string[]
  marktDate: string
  erkenningsNummer: ErkenningsNummer
  reason: string
}

export interface IPlaatsvoorkeur {
  id: number
  plaatsen: string[]
  markt: string
  koopman: ErkenningsNummer
}

export interface ICreateAllocationBody {
  afwijzingen: IAllocation[]
  toewijzingen: IAllocation[]
}

export const WeekDays: DayOfWeek[] = [
  { id: 0, name: 'Maandag', abbreviation: 'MA' },
  { id: 1, name: 'Dinsdag', abbreviation: 'DI' },
  { id: 2, name: 'Woensdag', abbreviation: 'WO' },
  { id: 3, name: 'Donderdag', abbreviation: 'DO' },
  { id: 4, name: 'Vrijdag', abbreviation: 'VR' },
  { id: 5, name: 'Zaterdag', abbreviation: 'ZA' },
  { id: 6, name: 'Zondag', abbreviation: 'ZO' },
]
