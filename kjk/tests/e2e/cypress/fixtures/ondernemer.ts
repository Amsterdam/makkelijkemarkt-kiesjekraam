import { IOndernemer } from '../../../../src/models/index'

export const ONDERNEMER01: IOndernemer = {
  id: 1,
  erkenningsnummer: '12345678',
  voorletters: 'I',
  tussenvoegsels: '',
  achternaam: 'Zieme',
  email: 'tcarroll@ankunding.com',
  telefoon: null,
  status: 'Actief',
  fotoUrl: null,
  fotoMediumUrl: null,
  pasUid: null,
  perfectViewNummer: 216,
  handhavingsVerzoek: null,
  weging: 0,
  sollicitaties: [
    {
      sollicitatieNummer: 13393,
      status: 'soll',
      doorgehaald: false,
      markt: { id: 39, afkorting: 'AC-2022', naam: 'Albert Cuyp-2022' },
    },
  ],
  vervangers: [],
}

export const ONDERNEMER02: IOndernemer = {
  id: 2,
  erkenningsnummer: '87654321',
  voorletters: 'H',
  tussenvoegsels: '',
  achternaam: 'Hand',
  email: 'jeanie79@fisher.com',
  telefoon: null,
  status: 'Actief',
  fotoUrl: null,
  fotoMediumUrl: null,
  pasUid: null,
  perfectViewNummer: 410,
  handhavingsVerzoek: null,
  weging: 0,
  sollicitaties: [
    {
      sollicitatieNummer: 9805,
      status: 'vpl',
      doorgehaald: false,
      markt: { id: 39, afkorting: 'AC-2022', naam: 'Albert Cuyp-2022' },
    },
  ],
  vervangers: [],
}
