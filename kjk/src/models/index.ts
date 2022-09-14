export type ErkenningsNummer = string

export interface IAanwezigheidsPageRouteParams {
  marktId: string
  erkenningsNummer: ErkenningsNummer
}

export interface IRsvp {
  markt: string
  marktId: string // we get 'markt' with a GET from MM api, but need to provide 'marktId' with POST
  marktDate: string
  koopmanErkenningsNummer: ErkenningsNummer
  attending: boolean
}

export interface IRsvpPattern {
  markt: string
  erkenningsNummer: ErkenningsNummer
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}

export interface IMarkt {
  kiesJeKraamMededelingTekst: string
  kiesJeKraamMededelingTitel: string
  marktDagen: string[]
}

export interface IMarktVoorkeur {
  absentFrom: null
  absentUntil: null
  anywhere: boolean
  bakType: string
  branche: string
  hasInrichting: boolean
  id: number
  koopman: ErkenningsNummer
  markt: string
  maximum: number
  minimum: number
}

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
  markt: Pick<IMarkt, 'id' | 'afkorting' | 'naam'>
  sollicitatieNummer: number
  status: string
  doorgehaald: boolean
}

export interface IMarkt {
  id: number
  afkorting: string
  naam: string
}

export interface IApiError extends Error {
  status?: number
}
