/** The seven Great Powers of Diplomacy */
export type Country =
  | 'AUSTRIA'
  | 'ENGLAND'
  | 'FRANCE'
  | 'GERMANY'
  | 'ITALY'
  | 'RUSSIA'
  | 'TURKEY';

export const ALL_COUNTRIES: Country[] = [
  'AUSTRIA',
  'ENGLAND',
  'FRANCE',
  'GERMANY',
  'ITALY',
  'RUSSIA',
  'TURKEY',
];

export type Season = 'Spring' | 'Fall';

export interface Turn {
  year: number;
  season: Season;
}

export type UnitType = 'Army' | 'Fleet';

export interface Unit {
  type: UnitType;
  country: Country;
  province: string;
  coast?: 'NC' | 'SC' | 'EC';
}

export type GamePhase =
  | 'waiting'
  | 'diplomacy'
  | 'orders'
  | 'retreats'
  | 'builds'
  | 'complete';

export interface PlayerInfo {
  userId: string;
  username: string;
  country: Country;
}

export interface RetreatOption {
  unit: Unit;
  from: string;
  validDestinations: string[];
}

export interface BuildOption {
  country: Country;
  delta: number; // positive = builds, negative = disbands
  validProvinces: string[];
}

export interface GameState {
  gameId: string;
  postId: string;
  phase: GamePhase;
  turn: Turn;
  players: PlayerInfo[];
  units: Unit[];
  supplyCenters: Record<string, Country | null>;
  dislodged: RetreatOption[];
  builds: BuildOption[];
  winner: Country | null;
  turnLog: string[];
  ordersSubmitted: Country[];
}

export const COUNTRY_COLORS: Record<Country, string> = {
  AUSTRIA: '#A040A0',
  ENGLAND: '#D08888',
  FRANCE: '#3858B0',
  GERMANY: '#888888',
  ITALY: '#C07838',
  RUSSIA: '#B8B830',
  TURKEY: '#287848',
};

export const COUNTRY_NAMES: Record<Country, string> = {
  AUSTRIA: 'Austria-Hungary',
  ENGLAND: 'England',
  FRANCE: 'France',
  GERMANY: 'Germany',
  ITALY: 'Italy',
  RUSSIA: 'Russia',
  TURKEY: 'Turkey',
};

export const WIN_CONDITION = 18;
