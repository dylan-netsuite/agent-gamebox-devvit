import type { AdjacencyMap } from '../types/map';

/**
 * Complete adjacency graph for the standard Diplomacy map.
 * - army: provinces reachable by an Army
 * - fleet: provinces reachable by a Fleet (single-coast provinces)
 * - coastFleet: per-coast adjacencies for multi-coast provinces (STP, SPA, BUL)
 */
export const ADJACENCIES: AdjacencyMap = {
  // ═══════════════════════════════════════════════
  //  WATER PROVINCES
  // ═══════════════════════════════════════════════
  NAO: { army: [], fleet: ['NWG', 'IRI', 'MAO', 'CLY', 'LVP'] },
  NWG: { army: [], fleet: ['NAO', 'BAR', 'NTH', 'NOR', 'EDI', 'CLY'] },
  BAR: { army: [], fleet: ['NWG', 'NOR', 'STP'] },
  NTH: { army: [], fleet: ['NWG', 'NOR', 'SKA', 'DEN', 'HEL', 'HOL', 'BEL', 'ENG', 'LON', 'YOR', 'EDI'] },
  SKA: { army: [], fleet: ['NTH', 'NOR', 'SWE', 'DEN'] },
  HEL: { army: [], fleet: ['NTH', 'DEN', 'HOL', 'KIE'] },
  BAL: { army: [], fleet: ['DEN', 'SWE', 'BOT', 'LVN', 'PRU', 'BER', 'KIE'] },
  BOT: { army: [], fleet: ['BAL', 'SWE', 'FIN', 'LVN', 'STP'] },
  IRI: { army: [], fleet: ['NAO', 'LVP', 'WAL', 'ENG', 'MAO'] },
  ENG: { army: [], fleet: ['IRI', 'NTH', 'BEL', 'PIC', 'BRE', 'MAO', 'LON', 'WAL'] },
  MAO: { army: [], fleet: ['NAO', 'IRI', 'ENG', 'BRE', 'GAS', 'SPA', 'POR', 'WES', 'NAF'] },
  WES: { army: [], fleet: ['MAO', 'GOL', 'TYS', 'NAF', 'TUN', 'SPA'] },
  GOL: { army: [], fleet: ['WES', 'PIE', 'MAR', 'SPA', 'TYS'] },
  TYS: { army: [], fleet: ['GOL', 'WES', 'TUN', 'ION', 'NAP', 'ROM', 'TUS'] },
  ION: { army: [], fleet: ['TYS', 'TUN', 'ADR', 'AEG', 'EAS', 'NAP', 'APU', 'ALB', 'GRE'] },
  ADR: { army: [], fleet: ['ION', 'VEN', 'TRI', 'ALB', 'APU'] },
  AEG: { army: [], fleet: ['ION', 'EAS', 'CON', 'BUL', 'SMY', 'GRE'] },
  EAS: { army: [], fleet: ['AEG', 'ION', 'SMY', 'SYR'] },
  BLA: { army: [], fleet: ['CON', 'BUL', 'RUM', 'SEV', 'ARM', 'ANK'] },

  // ═══════════════════════════════════════════════
  //  ENGLAND
  // ═══════════════════════════════════════════════
  CLY: { army: ['EDI', 'LVP'], fleet: ['EDI', 'LVP', 'NAO', 'NWG'] },
  EDI: { army: ['CLY', 'YOR', 'LVP'], fleet: ['CLY', 'YOR', 'NTH', 'NWG'] },
  YOR: { army: ['EDI', 'LON', 'LVP', 'WAL'], fleet: ['EDI', 'LON', 'NTH'] },
  LVP: { army: ['CLY', 'EDI', 'YOR', 'WAL'], fleet: ['CLY', 'WAL', 'IRI', 'NAO'] },
  LON: { army: ['YOR', 'WAL'], fleet: ['YOR', 'WAL', 'NTH', 'ENG'] },
  WAL: { army: ['YOR', 'LON', 'LVP'], fleet: ['LON', 'LVP', 'IRI', 'ENG'] },

  // ═══════════════════════════════════════════════
  //  FRANCE
  // ═══════════════════════════════════════════════
  BRE: { army: ['PIC', 'PAR', 'GAS'], fleet: ['PIC', 'GAS', 'ENG', 'MAO'] },
  PIC: { army: ['BRE', 'PAR', 'BUR', 'BEL'], fleet: ['BRE', 'BEL', 'ENG'] },
  PAR: { army: ['PIC', 'BRE', 'BUR', 'GAS'], fleet: [] },
  BUR: { army: ['PAR', 'PIC', 'BEL', 'RUH', 'MUN', 'MAR', 'GAS'], fleet: [] },
  GAS: { army: ['BRE', 'PAR', 'BUR', 'MAR', 'SPA'], fleet: ['BRE', 'MAO', 'SPA'] },
  MAR: { army: ['GAS', 'BUR', 'PIE', 'SPA'], fleet: ['PIE', 'GOL', 'SPA'] },

  // ═══════════════════════════════════════════════
  //  IBERIA
  // ═══════════════════════════════════════════════
  SPA: {
    army: ['GAS', 'MAR', 'POR'],
    fleet: [],
    coastFleet: {
      NC: ['GAS', 'MAO', 'POR'],
      SC: ['MAR', 'GOL', 'WES', 'MAO', 'POR'],
    },
  },
  POR: { army: ['SPA'], fleet: ['SPA', 'MAO'] },

  // ═══════════════════════════════════════════════
  //  GERMANY
  // ═══════════════════════════════════════════════
  KIE: { army: ['RUH', 'MUN', 'BER', 'HOL', 'DEN'], fleet: ['HOL', 'DEN', 'BER', 'HEL', 'BAL'] },
  BER: { army: ['KIE', 'MUN', 'SIL', 'PRU'], fleet: ['KIE', 'PRU', 'BAL'] },
  MUN: { army: ['RUH', 'KIE', 'BER', 'SIL', 'BOH', 'TYR', 'BUR'], fleet: [] },
  RUH: { army: ['HOL', 'BEL', 'BUR', 'MUN', 'KIE'], fleet: [] },
  SIL: { army: ['MUN', 'BER', 'PRU', 'WAR', 'GAL', 'BOH'], fleet: [] },
  PRU: { army: ['BER', 'SIL', 'WAR', 'LVN'], fleet: ['BER', 'LVN', 'BAL'] },

  // ═══════════════════════════════════════════════
  //  SCANDINAVIA
  // ═══════════════════════════════════════════════
  NOR: { army: ['SWE', 'FIN', 'STP'], fleet: ['SWE', 'SKA', 'NTH', 'NWG', 'BAR', 'STP'] },
  SWE: { army: ['NOR', 'FIN', 'DEN'], fleet: ['NOR', 'FIN', 'DEN', 'SKA', 'BAL', 'BOT'] },
  DEN: { army: ['KIE', 'SWE'], fleet: ['KIE', 'SWE', 'SKA', 'NTH', 'HEL', 'BAL'] },
  FIN: { army: ['NOR', 'SWE', 'STP'], fleet: ['SWE', 'BOT', 'STP'] },

  // ═══════════════════════════════════════════════
  //  LOW COUNTRIES
  // ═══════════════════════════════════════════════
  HOL: { army: ['BEL', 'RUH', 'KIE'], fleet: ['BEL', 'KIE', 'NTH', 'HEL'] },
  BEL: { army: ['HOL', 'RUH', 'BUR', 'PIC'], fleet: ['HOL', 'PIC', 'ENG', 'NTH'] },

  // ═══════════════════════════════════════════════
  //  ITALY
  // ═══════════════════════════════════════════════
  PIE: { army: ['MAR', 'TYR', 'VEN', 'TUS'], fleet: ['MAR', 'TUS', 'GOL'] },
  VEN: { army: ['PIE', 'TYR', 'TRI', 'TUS', 'APU'], fleet: ['ADR', 'TRI', 'APU'] },
  TUS: { army: ['PIE', 'VEN', 'ROM'], fleet: ['PIE', 'ROM', 'GOL', 'TYS'] },
  ROM: { army: ['TUS', 'VEN', 'APU', 'NAP'], fleet: ['TUS', 'NAP', 'TYS'] },
  APU: { army: ['VEN', 'ROM', 'NAP'], fleet: ['ADR', 'ION', 'VEN', 'NAP'] },
  NAP: { army: ['ROM', 'APU'], fleet: ['TYS', 'ION', 'APU', 'ROM'] },

  // ═══════════════════════════════════════════════
  //  AUSTRIA-HUNGARY
  // ═══════════════════════════════════════════════
  TYR: { army: ['MUN', 'BOH', 'VIE', 'TRI', 'VEN', 'PIE'], fleet: [] },
  BOH: { army: ['MUN', 'SIL', 'GAL', 'VIE', 'TYR'], fleet: [] },
  VIE: { army: ['TYR', 'BOH', 'GAL', 'BUD', 'TRI'], fleet: [] },
  TRI: { army: ['TYR', 'VIE', 'BUD', 'SER', 'ALB', 'VEN'], fleet: ['ADR', 'ALB', 'VEN'] },
  BUD: { army: ['VIE', 'GAL', 'RUM', 'SER', 'TRI'], fleet: [] },
  GAL: { army: ['BOH', 'SIL', 'WAR', 'UKR', 'RUM', 'BUD', 'VIE'], fleet: [] },

  // ═══════════════════════════════════════════════
  //  BALKANS
  // ═══════════════════════════════════════════════
  SER: { army: ['BUD', 'RUM', 'BUL', 'GRE', 'ALB', 'TRI'], fleet: [] },
  ALB: { army: ['SER', 'GRE', 'TRI'], fleet: ['ADR', 'ION', 'GRE', 'TRI'] },
  GRE: { army: ['SER', 'BUL', 'ALB'], fleet: ['ION', 'AEG', 'ALB', 'BUL'] },
  RUM: { army: ['BUD', 'GAL', 'UKR', 'SEV', 'BUL', 'SER'], fleet: ['BLA', 'BUL', 'SEV'] },
  BUL: {
    army: ['SER', 'RUM', 'GRE', 'CON'],
    fleet: [],
    coastFleet: {
      EC: ['BLA', 'CON', 'RUM'],
      SC: ['AEG', 'CON', 'GRE'],
    },
  },

  // ═══════════════════════════════════════════════
  //  RUSSIA
  // ═══════════════════════════════════════════════
  STP: {
    army: ['NOR', 'FIN', 'MOS', 'LVN'],
    fleet: [],
    coastFleet: {
      NC: ['BAR', 'NOR'],
      SC: ['BOT', 'FIN', 'LVN'],
    },
  },
  MOS: { army: ['STP', 'LVN', 'WAR', 'UKR', 'SEV'], fleet: [] },
  LVN: { army: ['STP', 'MOS', 'WAR', 'PRU'], fleet: ['BAL', 'BOT', 'PRU', 'STP'] },
  WAR: { army: ['SIL', 'PRU', 'LVN', 'MOS', 'UKR', 'GAL'], fleet: [] },
  UKR: { army: ['WAR', 'MOS', 'SEV', 'RUM', 'GAL'], fleet: [] },
  SEV: { army: ['MOS', 'UKR', 'RUM', 'ARM'], fleet: ['BLA', 'ARM', 'RUM'] },

  // ═══════════════════════════════════════════════
  //  TURKEY
  // ═══════════════════════════════════════════════
  CON: { army: ['BUL', 'ANK', 'SMY'], fleet: ['BLA', 'AEG', 'ANK', 'SMY', 'BUL'] },
  ANK: { army: ['CON', 'ARM', 'SMY'], fleet: ['BLA', 'ARM', 'CON'] },
  SMY: { army: ['CON', 'ANK', 'ARM', 'SYR'], fleet: ['AEG', 'EAS', 'CON', 'SYR'] },
  ARM: { army: ['ANK', 'SMY', 'SEV', 'SYR'], fleet: ['BLA', 'ANK', 'SEV'] },
  SYR: { army: ['SMY', 'ARM'], fleet: ['EAS', 'SMY'] },

  // ═══════════════════════════════════════════════
  //  NORTH AFRICA
  // ═══════════════════════════════════════════════
  NAF: { army: ['TUN'], fleet: ['MAO', 'WES', 'TUN'] },
  TUN: { army: ['NAF'], fleet: ['WES', 'TYS', 'ION', 'NAF'] },
};

/** Check if a province is adjacent to another for a given unit type */
export function isAdjacent(
  from: string,
  to: string,
  unitType: 'Army' | 'Fleet',
  fromCoast?: string
): boolean {
  const adj = ADJACENCIES[from];
  if (!adj) return false;

  if (unitType === 'Army') {
    return adj.army.includes(to);
  }

  if (adj.coastFleet && fromCoast) {
    const coastAdj = adj.coastFleet[fromCoast];
    return coastAdj ? coastAdj.includes(to) : false;
  }

  return adj.fleet.includes(to);
}

/** Get all valid destinations for a unit */
export function getValidMoves(
  province: string,
  unitType: 'Army' | 'Fleet',
  coast?: string
): string[] {
  const adj = ADJACENCIES[province];
  if (!adj) return [];

  if (unitType === 'Army') return [...adj.army];

  if (adj.coastFleet && coast) {
    return [...(adj.coastFleet[coast] ?? [])];
  }

  return [...adj.fleet];
}

/** Determine which coast a fleet enters when moving to a multi-coast province */
export function determineCoast(from: string, to: string): string | undefined {
  const toAdj = ADJACENCIES[to];
  if (!toAdj?.coastFleet) return undefined;

  for (const [coast, provinces] of Object.entries(toAdj.coastFleet)) {
    if (provinces.includes(from)) return coast;
  }
  return undefined;
}
