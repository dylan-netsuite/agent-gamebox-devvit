import type { Unit } from '../types/game';
import type { Country } from '../types/game';

/** Starting unit positions for Spring 1901 */
export const STARTING_UNITS: Unit[] = [
  // Austria-Hungary
  { type: 'Army', country: 'AUSTRIA', province: 'VIE' },
  { type: 'Army', country: 'AUSTRIA', province: 'BUD' },
  { type: 'Fleet', country: 'AUSTRIA', province: 'TRI' },

  // England
  { type: 'Fleet', country: 'ENGLAND', province: 'LON' },
  { type: 'Fleet', country: 'ENGLAND', province: 'EDI' },
  { type: 'Army', country: 'ENGLAND', province: 'LVP' },

  // France
  { type: 'Army', country: 'FRANCE', province: 'PAR' },
  { type: 'Army', country: 'FRANCE', province: 'MAR' },
  { type: 'Fleet', country: 'FRANCE', province: 'BRE' },

  // Germany
  { type: 'Army', country: 'GERMANY', province: 'BER' },
  { type: 'Army', country: 'GERMANY', province: 'MUN' },
  { type: 'Fleet', country: 'GERMANY', province: 'KIE' },

  // Italy
  { type: 'Army', country: 'ITALY', province: 'ROM' },
  { type: 'Army', country: 'ITALY', province: 'VEN' },
  { type: 'Fleet', country: 'ITALY', province: 'NAP' },

  // Russia (4 units)
  { type: 'Army', country: 'RUSSIA', province: 'MOS' },
  { type: 'Fleet', country: 'RUSSIA', province: 'SEV' },
  { type: 'Army', country: 'RUSSIA', province: 'WAR' },
  { type: 'Fleet', country: 'RUSSIA', province: 'STP', coast: 'SC' },

  // Turkey
  { type: 'Fleet', country: 'TURKEY', province: 'ANK' },
  { type: 'Army', country: 'TURKEY', province: 'CON' },
  { type: 'Army', country: 'TURKEY', province: 'SMY' },
];

/** Starting supply center ownership */
export const STARTING_SUPPLY_CENTERS: Record<string, Country | null> = {
  // Austria
  VIE: 'AUSTRIA',
  BUD: 'AUSTRIA',
  TRI: 'AUSTRIA',
  // England
  LON: 'ENGLAND',
  EDI: 'ENGLAND',
  LVP: 'ENGLAND',
  // France
  PAR: 'FRANCE',
  MAR: 'FRANCE',
  BRE: 'FRANCE',
  // Germany
  BER: 'GERMANY',
  MUN: 'GERMANY',
  KIE: 'GERMANY',
  // Italy
  ROM: 'ITALY',
  VEN: 'ITALY',
  NAP: 'ITALY',
  // Russia
  MOS: 'RUSSIA',
  SEV: 'RUSSIA',
  WAR: 'RUSSIA',
  STP: 'RUSSIA',
  // Turkey
  ANK: 'TURKEY',
  CON: 'TURKEY',
  SMY: 'TURKEY',
  // Neutral supply centers
  NOR: null,
  SWE: null,
  DEN: null,
  HOL: null,
  BEL: null,
  SPA: null,
  POR: null,
  TUN: null,
  GRE: null,
  SER: null,
  RUM: null,
  BUL: null,
};
