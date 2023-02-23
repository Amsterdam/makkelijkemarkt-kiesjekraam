import { IRsvp } from '../../../../src/models/index'
import { addDays, convertDate, getMonday } from '../support/utils'

export interface IRsvpList {
  rsvps: IRsvp[]
}

export const RSVP01: IRsvpList = {
  rsvps: [
    {
      marktDate: convertDate(getMonday(new Date(), 0), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 1), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 2), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 3), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 4), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 5), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 6), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 7), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 8), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 9), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 10), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 11), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 12), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 13), 'yyyymmdd'),
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
      marktDate: convertDate(getMonday(new Date(), 0), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 1), 'yyyymmdd'),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 2), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 3), 'yyyymmdd'),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 4), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 5), 'yyyymmdd'),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 6), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 7), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 8), 'yyyymmdd'),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 9), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 10), 'yyyymmdd'),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 11), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 12), 'yyyymmdd'),
      markt: '39',
      attending: true,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
    {
      marktDate: convertDate(addDays(getMonday(new Date(), 0), 13), 'yyyymmdd'),
      markt: '39',
      attending: false,
      koopmanErkenningsNummer: '12345678',
      marktId: '39',
    },
  ],
}
