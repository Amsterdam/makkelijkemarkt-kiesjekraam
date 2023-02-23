import { IRsvpPattern } from '../../../../src/models/index'

export const RSVP_PATTERN01: IRsvpPattern = {
  markt: '39',
  erkenningsNummer: '12345678',
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
}

export const RSVP_PATTERN02: IRsvpPattern = {
  markt: '39',
  erkenningsNummer: '12345678',
  monday: false,
  tuesday: true,
  wednesday: false,
  thursday: true,
  friday: false,
  saturday: true,
  sunday: false,
}

export const RSVP_PATTERN03: IRsvpPattern = {
  markt: '39',
  erkenningsNummer: '87654321',
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: false,
}
