import type { GameState, PlayerInfo } from './game';

export interface InitResponse {
  type: 'init';
  postId: string;
  gameState: GameState | null;
  currentPlayer: PlayerInfo | null;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}
