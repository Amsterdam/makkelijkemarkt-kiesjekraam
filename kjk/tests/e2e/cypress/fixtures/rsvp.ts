import { IRsvp } from '../../../../src/models/index'
import { addDays, convertDate, getMonday } from '../support/utils'

export interface IRsvpList {
  rsvps: IRsvp[]
}

export const RSVP01: IRsvpList = {
  rsvps: [
    {
      marktDate: convertDate(getMonday(new Date(), 0)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 1)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 2)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 3)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 4)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 5)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 6)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 7)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 8)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 9)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 10)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 11)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 12)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 13)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
  ],
}

export const RSVP02: IRsvpList = {
  rsvps: [
    {
      marktDate: convertDate(getMonday(new Date(), 0)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 1)),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 2)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 3)),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 4)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 5)),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 6)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 7)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 8)),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 9)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 10)),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 11)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 12)),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 13)),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
  ],
}
