import type { GamePhase, Crater } from './game';

export type LobbyStatus = 'waiting' | 'playing' | 'finished';

export interface LobbyInfo {
  lobbyCode: string;
  postId: string;
  hostUserId: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  status: LobbyStatus;
  createdAt: number;
}

export interface LobbyPlayer {
  userId: string;
  username: string;
  characterId: string;
  teamIndex: number;
  ready: boolean;
}

export interface MultiplayerGameConfig {
  numTeams: number;
  wormsPerTeam: number;
  mapId: string;
  turnTimer: number;
  terrainSeed: number;
  players: LobbyPlayer[];
}

export interface WormSnapshot {
  index: number;
  x: number;
  y: number;
  health: number;
  alive: boolean;
  facingRight: boolean;
}

export interface MoveAction {
  kind: 'move';
  wormIndex: number;
  x: number;
  y: number;
  facingRight: boolean;
}

export interface JumpAction {
  kind: 'jump';
  wormIndex: number;
  backflip?: boolean;
}

export interface AimAction {
  kind: 'aim';
  angle: number;
  power: number;
}

export interface FireAction {
  kind: 'fire';
  wormIndex: number;
  weaponIndex: number;
  angle: number;
  power: number;
  x: number;
  y: number;
  facingRight: boolean;
}

export type PlayerAction = MoveAction | JumpAction | AimAction | FireAction;

export interface TurnResult {
  damages: { wormIndex: number; amount: number }[];
  craters: Crater[];
  wormSnapshots: WormSnapshot[];
}

export type MultiplayerMessage =
  | { type: 'lobby-update'; lobbyCode: string; players: LobbyPlayer[]; phase: GamePhase; hostUserId: string }
  | { type: 'game-start'; config: MultiplayerGameConfig }
  | { type: 'player-action'; action: PlayerAction; playerId: string }
  | { type: 'turn-result'; result: TurnResult; playerId: string }
  | { type: 'turn-advance'; turnOrderIndex: number; wind: number }
  | { type: 'game-over'; winningTeam: number }
  | { type: 'player-left'; userId: string }
  | { type: 'rematch'; lobbyCode: string };
