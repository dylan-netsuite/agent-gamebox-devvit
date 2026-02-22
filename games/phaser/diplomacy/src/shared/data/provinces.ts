import type { Province, ProvinceMap } from '../types/map';

/**
 * All 75 provinces of the standard Diplomacy map.
 * Coordinates are on a 1200x900 grid representing Europe.
 */
export const PROVINCES: ProvinceMap = {
  // ═══════════════════════════════════════════
  //  WATER PROVINCES (19)
  // ═══════════════════════════════════════════
  NAO: { id: 'NAO', name: 'North Atlantic Ocean', type: 'water', supplyCenter: false, x: 100, y: 170 },
  NWG: { id: 'NWG', name: 'Norwegian Sea', type: 'water', supplyCenter: false, x: 310, y: 75 },
  BAR: { id: 'BAR', name: 'Barents Sea', type: 'water', supplyCenter: false, x: 530, y: 35 },
  NTH: { id: 'NTH', name: 'North Sea', type: 'water', supplyCenter: false, x: 295, y: 240 },
  SKA: { id: 'SKA', name: 'Skagerrak', type: 'water', supplyCenter: false, x: 385, y: 215 },
  HEL: { id: 'HEL', name: 'Helgoland Bight', type: 'water', supplyCenter: false, x: 370, y: 285 },
  BAL: { id: 'BAL', name: 'Baltic Sea', type: 'water', supplyCenter: false, x: 460, y: 255 },
  BOT: { id: 'BOT', name: 'Gulf of Bothnia', type: 'water', supplyCenter: false, x: 500, y: 170 },
  IRI: { id: 'IRI', name: 'Irish Sea', type: 'water', supplyCenter: false, x: 185, y: 330 },
  ENG: { id: 'ENG', name: 'English Channel', type: 'water', supplyCenter: false, x: 250, y: 375 },
  MAO: { id: 'MAO', name: 'Mid-Atlantic Ocean', type: 'water', supplyCenter: false, x: 90, y: 450 },
  WES: { id: 'WES', name: 'Western Mediterranean', type: 'water', supplyCenter: false, x: 290, y: 610 },
  GOL: { id: 'GOL', name: 'Gulf of Lyon', type: 'water', supplyCenter: false, x: 335, y: 545 },
  TYS: { id: 'TYS', name: 'Tyrrhenian Sea', type: 'water', supplyCenter: false, x: 410, y: 595 },
  ION: { id: 'ION', name: 'Ionian Sea', type: 'water', supplyCenter: false, x: 475, y: 640 },
  ADR: { id: 'ADR', name: 'Adriatic Sea', type: 'water', supplyCenter: false, x: 455, y: 515 },
  AEG: { id: 'AEG', name: 'Aegean Sea', type: 'water', supplyCenter: false, x: 570, y: 610 },
  EAS: { id: 'EAS', name: 'Eastern Mediterranean', type: 'water', supplyCenter: false, x: 620, y: 670 },
  BLA: { id: 'BLA', name: 'Black Sea', type: 'water', supplyCenter: false, x: 645, y: 485 },

  // ═══════════════════════════════════════════
  //  ENGLAND (3 SC + 3 non-SC)
  // ═══════════════════════════════════════════
  CLY: { id: 'CLY', name: 'Clyde', type: 'coastal', supplyCenter: false, x: 215, y: 195 },
  EDI: { id: 'EDI', name: 'Edinburgh', type: 'coastal', supplyCenter: true, homeCountry: 'ENGLAND', x: 250, y: 210 },
  YOR: { id: 'YOR', name: 'Yorkshire', type: 'coastal', supplyCenter: false, x: 265, y: 275 },
  LVP: { id: 'LVP', name: 'Liverpool', type: 'coastal', supplyCenter: true, homeCountry: 'ENGLAND', x: 230, y: 280 },
  LON: { id: 'LON', name: 'London', type: 'coastal', supplyCenter: true, homeCountry: 'ENGLAND', x: 275, y: 330 },
  WAL: { id: 'WAL', name: 'Wales', type: 'coastal', supplyCenter: false, x: 230, y: 325 },

  // ═══════════════════════════════════════════
  //  FRANCE (3 SC + 3 non-SC)
  // ═══════════════════════════════════════════
  BRE: { id: 'BRE', name: 'Brest', type: 'coastal', supplyCenter: true, homeCountry: 'FRANCE', x: 220, y: 400 },
  PIC: { id: 'PIC', name: 'Picardy', type: 'coastal', supplyCenter: false, x: 290, y: 370 },
  PAR: { id: 'PAR', name: 'Paris', type: 'inland', supplyCenter: true, homeCountry: 'FRANCE', x: 285, y: 410 },
  BUR: { id: 'BUR', name: 'Burgundy', type: 'inland', supplyCenter: false, x: 325, y: 410 },
  GAS: { id: 'GAS', name: 'Gascony', type: 'coastal', supplyCenter: false, x: 235, y: 465 },
  MAR: { id: 'MAR', name: 'Marseilles', type: 'coastal', supplyCenter: true, homeCountry: 'FRANCE', x: 310, y: 495 },

  // ═══════════════════════════════════════════
  //  IBERIA (2 neutral SC)
  // ═══════════════════════════════════════════
  SPA: { id: 'SPA', name: 'Spain', type: 'coastal', supplyCenter: true, coasts: ['NC', 'SC'], x: 195, y: 545 },
  POR: { id: 'POR', name: 'Portugal', type: 'coastal', supplyCenter: true, x: 120, y: 530 },

  // ═══════════════════════════════════════════
  //  GERMANY (3 SC + 3 non-SC)
  // ═══════════════════════════════════════════
  KIE: { id: 'KIE', name: 'Kiel', type: 'coastal', supplyCenter: true, homeCountry: 'GERMANY', x: 395, y: 295 },
  BER: { id: 'BER', name: 'Berlin', type: 'coastal', supplyCenter: true, homeCountry: 'GERMANY', x: 430, y: 285 },
  MUN: { id: 'MUN', name: 'Munich', type: 'inland', supplyCenter: true, homeCountry: 'GERMANY', x: 395, y: 380 },
  RUH: { id: 'RUH', name: 'Ruhr', type: 'inland', supplyCenter: false, x: 350, y: 340 },
  SIL: { id: 'SIL', name: 'Silesia', type: 'inland', supplyCenter: false, x: 465, y: 330 },
  PRU: { id: 'PRU', name: 'Prussia', type: 'coastal', supplyCenter: false, x: 480, y: 270 },

  // ═══════════════════════════════════════════
  //  SCANDINAVIA (3 neutral SC + 1 non-SC)
  // ═══════════════════════════════════════════
  NOR: { id: 'NOR', name: 'Norway', type: 'coastal', supplyCenter: true, x: 365, y: 145 },
  SWE: { id: 'SWE', name: 'Sweden', type: 'coastal', supplyCenter: true, x: 430, y: 175 },
  DEN: { id: 'DEN', name: 'Denmark', type: 'coastal', supplyCenter: true, x: 390, y: 245 },
  FIN: { id: 'FIN', name: 'Finland', type: 'coastal', supplyCenter: false, x: 520, y: 120 },

  // ═══════════════════════════════════════════
  //  LOW COUNTRIES (2 neutral SC)
  // ═══════════════════════════════════════════
  HOL: { id: 'HOL', name: 'Holland', type: 'coastal', supplyCenter: true, x: 330, y: 305 },
  BEL: { id: 'BEL', name: 'Belgium', type: 'coastal', supplyCenter: true, x: 310, y: 340 },

  // ═══════════════════════════════════════════
  //  ITALY (3 SC + 3 non-SC)
  // ═══════════════════════════════════════════
  PIE: { id: 'PIE', name: 'Piedmont', type: 'coastal', supplyCenter: false, x: 350, y: 470 },
  VEN: { id: 'VEN', name: 'Venice', type: 'coastal', supplyCenter: true, homeCountry: 'ITALY', x: 405, y: 460 },
  TUS: { id: 'TUS', name: 'Tuscany', type: 'coastal', supplyCenter: false, x: 395, y: 505 },
  ROM: { id: 'ROM', name: 'Rome', type: 'coastal', supplyCenter: true, homeCountry: 'ITALY', x: 415, y: 545 },
  APU: { id: 'APU', name: 'Apulia', type: 'coastal', supplyCenter: false, x: 455, y: 565 },
  NAP: { id: 'NAP', name: 'Naples', type: 'coastal', supplyCenter: true, homeCountry: 'ITALY', x: 440, y: 600 },

  // ═══════════════════════════════════════════
  //  AUSTRIA-HUNGARY (3 SC + 3 non-SC)
  // ═══════════════════════════════════════════
  TYR: { id: 'TYR', name: 'Tyrolia', type: 'inland', supplyCenter: false, x: 410, y: 415 },
  BOH: { id: 'BOH', name: 'Bohemia', type: 'inland', supplyCenter: false, x: 430, y: 365 },
  VIE: { id: 'VIE', name: 'Vienna', type: 'inland', supplyCenter: true, homeCountry: 'AUSTRIA', x: 450, y: 400 },
  TRI: { id: 'TRI', name: 'Trieste', type: 'coastal', supplyCenter: true, homeCountry: 'AUSTRIA', x: 440, y: 470 },
  BUD: { id: 'BUD', name: 'Budapest', type: 'inland', supplyCenter: true, homeCountry: 'AUSTRIA', x: 505, y: 420 },
  GAL: { id: 'GAL', name: 'Galicia', type: 'inland', supplyCenter: false, x: 515, y: 370 },

  // ═══════════════════════════════════════════
  //  BALKANS (3 neutral SC + 1 non-SC)
  // ═══════════════════════════════════════════
  SER: { id: 'SER', name: 'Serbia', type: 'inland', supplyCenter: true, x: 510, y: 485 },
  ALB: { id: 'ALB', name: 'Albania', type: 'coastal', supplyCenter: false, x: 490, y: 540 },
  GRE: { id: 'GRE', name: 'Greece', type: 'coastal', supplyCenter: true, x: 530, y: 595 },
  RUM: { id: 'RUM', name: 'Rumania', type: 'coastal', supplyCenter: true, x: 565, y: 455 },
  BUL: { id: 'BUL', name: 'Bulgaria', type: 'coastal', supplyCenter: true, coasts: ['EC', 'SC'], x: 565, y: 515 },

  // ═══════════════════════════════════════════
  //  RUSSIA (4 SC + 4 non-SC)
  // ═══════════════════════════════════════════
  STP: { id: 'STP', name: 'St. Petersburg', type: 'coastal', supplyCenter: true, homeCountry: 'RUSSIA', coasts: ['NC', 'SC'], x: 570, y: 95 },
  MOS: { id: 'MOS', name: 'Moscow', type: 'inland', supplyCenter: true, homeCountry: 'RUSSIA', x: 640, y: 210 },
  LVN: { id: 'LVN', name: 'Livonia', type: 'coastal', supplyCenter: false, x: 520, y: 230 },
  WAR: { id: 'WAR', name: 'Warsaw', type: 'inland', supplyCenter: true, homeCountry: 'RUSSIA', x: 520, y: 320 },
  UKR: { id: 'UKR', name: 'Ukraine', type: 'inland', supplyCenter: false, x: 590, y: 370 },
  SEV: { id: 'SEV', name: 'Sevastopol', type: 'coastal', supplyCenter: true, homeCountry: 'RUSSIA', x: 660, y: 420 },

  // ═══════════════════════════════════════════
  //  TURKEY (3 SC + 2 non-SC)
  // ═══════════════════════════════════════════
  CON: { id: 'CON', name: 'Constantinople', type: 'coastal', supplyCenter: true, homeCountry: 'TURKEY', x: 595, y: 550 },
  ANK: { id: 'ANK', name: 'Ankara', type: 'coastal', supplyCenter: true, homeCountry: 'TURKEY', x: 680, y: 510 },
  SMY: { id: 'SMY', name: 'Smyrna', type: 'coastal', supplyCenter: true, homeCountry: 'TURKEY', x: 630, y: 585 },
  ARM: { id: 'ARM', name: 'Armenia', type: 'coastal', supplyCenter: false, x: 730, y: 475 },
  SYR: { id: 'SYR', name: 'Syria', type: 'coastal', supplyCenter: false, x: 700, y: 620 },

  // ═══════════════════════════════════════════
  //  NORTH AFRICA (1 neutral SC + 1 non-SC)
  // ═══════════════════════════════════════════
  NAF: { id: 'NAF', name: 'North Africa', type: 'coastal', supplyCenter: false, x: 230, y: 665 },
  TUN: { id: 'TUN', name: 'Tunisia', type: 'coastal', supplyCenter: true, x: 365, y: 650 },
};

export function getProvince(id: string): Province {
  const p = PROVINCES[id];
  if (!p) throw new Error(`Unknown province: ${id}`);
  return p;
}

export function getSupplyCenters(): Province[] {
  return Object.values(PROVINCES).filter((p) => p.supplyCenter);
}

export function getHomeSupplyCenters(country: string): Province[] {
  return Object.values(PROVINCES).filter(
    (p) => p.supplyCenter && p.homeCountry === country
  );
}
