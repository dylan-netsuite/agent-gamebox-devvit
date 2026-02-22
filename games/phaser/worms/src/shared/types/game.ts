export type GamePhase = 'lobby' | 'playing' | 'finished';

export interface WormState {
  id: string;
  name: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  alive: boolean;
  facingRight: boolean;
}

export interface PlayerInfo {
  userId: string;
  username: string;
  teamColor: string;
  worms: WormState[];
  ready: boolean;
}

export interface TurnInfo {
  activePlayerIndex: number;
  activeWormIndex: number;
  turnNumber: number;
  timeRemaining: number;
  wind: number;
}

export interface Crater {
  x: number;
  y: number;
  radius: number;
}

export interface GameState {
  postId: string;
  phase: GamePhase;
  players: PlayerInfo[];
  turn: TurnInfo;
  craters: Crater[];
  terrainSeed: number;
  winner: string | null;
}

export const TEAM_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6'] as const;

export const WORM_NAMES = [
  'Boggy', 'Spadge', 'Mac', 'Bazza', 'Giblet', 'Snoopy',
  'Clagnut', 'Spadger', 'Wazzock', 'Numpty', 'Pillock', 'Muppet',
] as const;

export const DEFAULT_WORM_HEALTH = 100;
export const WORMS_PER_TEAM = 3;
export const TURN_DURATION = 45;
