import type { GameState, Country, PlayerInfo, GamePhase, Turn, TurnSnapshot } from './game';
import type { Order, RetreatOrder, BuildOrder, OrderResult } from './orders';

export interface InitResponse {
  type: 'init';
  postId: string;
  gameState: GameState | null;
  currentPlayer: PlayerInfo | null;
}

export interface GameSummary {
  postId: string;
  gameId: string;
  phase: GamePhase;
  turn: Turn;
  country: Country;
  playerCount: number;
  isYourTurn: boolean;
  winner: Country | null;
  turnDeadline: number | null;
}

export interface MyGamesResponse {
  games: GameSummary[];
}

export interface CreateGameResponse {
  type: 'create';
  gameState: GameState;
}

export interface JoinGameResponse {
  type: 'join';
  gameState: GameState;
  player: PlayerInfo;
}

export interface JoinGameRequest {
  country: Country;
}

export interface SubmitOrdersRequest {
  orders: Order[];
}

export interface SubmitOrdersResponse {
  type: 'orders';
  success: boolean;
  message: string;
  gameState: GameState;
}

export interface SubmitRetreatsRequest {
  retreats: RetreatOrder[];
}

export interface SubmitRetreatsResponse {
  type: 'retreats';
  success: boolean;
  gameState: GameState;
}

export interface SubmitBuildsRequest {
  builds: BuildOrder[];
}

export interface SubmitBuildsResponse {
  type: 'builds';
  success: boolean;
  gameState: GameState;
}

export interface ResolveResponse {
  type: 'resolve';
  results: OrderResult[];
  gameState: GameState;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}

export interface StartGameResponse {
  type: 'start';
  gameState: GameState;
}

export interface HistoryResponse {
  snapshots: TurnSnapshot[];
}
