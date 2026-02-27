import type { GamePhase, RoundResult, PlayerScore } from './game';

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
  ready: boolean;
}

export interface RoundConfig {
  roundNumber: number;
  letter: string;
  categoryListId: number;
  categories: string[];
  timerSeconds: number;
}

export type ScatterMessage =
  | { type: 'lobby-update'; lobbyCode: string; players: LobbyPlayer[]; phase: GamePhase; hostUserId: string }
  | { type: 'game-start'; round: RoundConfig }
  | { type: 'round-start'; round: RoundConfig }
  | { type: 'player-submitted'; userId: string; username: string }
  | { type: 'round-results'; results: RoundResult; scores: PlayerScore[] }
  | { type: 'game-over'; scores: PlayerScore[]; winnerId: string; winnerName: string }
  | { type: 'player-left'; userId: string }
  | { type: 'rematch'; lobbyCode: string };
