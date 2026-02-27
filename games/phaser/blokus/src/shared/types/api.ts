export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  bestScore: number;
  totalPiecesPlaced: number;
  perfectGames: number;
}

export interface GameResult {
  playerScore: number;
  aiScore: number;
  playerPiecesPlaced: number;
  aiPiecesPlaced: number;
  playerUnplacedSquares: number;
  aiUnplacedSquares: number;
  won: boolean;
  perfect: boolean;
}

export interface SubmitResultRequest {
  playerScore: number;
  aiScore: number;
  playerPiecesPlaced: number;
  won: boolean;
  perfect: boolean;
}

export interface StatsResponse {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  bestScore: number;
  gamesWon: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  userRank?: number;
  error?: string;
}

export interface CommunityStatsResponse {
  success: boolean;
  gamesPlayed: number;
  totalPiecesPlaced: number;
  error?: string;
}
