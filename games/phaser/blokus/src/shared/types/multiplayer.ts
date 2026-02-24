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
  playerNumber: 1 | 2;
  ready: boolean;
}

export interface MultiplayerGameConfig {
  lobbyCode: string;
  players: LobbyPlayer[];
  turnTimerSeconds: number;
}

export interface BlokusMove {
  pieceId: string;
  cells: [number, number][];
  player: 1 | 2;
}

export type MultiplayerMessage =
  | { type: 'lobby-update'; lobbyCode: string; players: LobbyPlayer[]; hostUserId: string }
  | { type: 'game-start'; config: MultiplayerGameConfig }
  | { type: 'player-move'; move: BlokusMove; userId: string }
  | { type: 'player-pass'; player: 1 | 2; userId: string }
  | { type: 'game-over'; winnerPlayer: 1 | 2 | null; p1Score: number; p2Score: number }
  | { type: 'player-left'; userId: string }
  | { type: 'player-disconnected'; userId: string }
  | { type: 'player-reconnected'; userId: string }
  | { type: 'turn-timeout'; player: 1 | 2 }
  | { type: 'rematch'; lobbyCode: string }
  | { type: 'move-rejected'; reason: string; userId: string };
