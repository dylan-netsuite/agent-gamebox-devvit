export interface RoundResult {
  scores: number[];
  totalStrokes: number;
  totalPar: number;
  relativeToPar: number;
  completedAt: string;
}

export interface UserStats {
  roundsPlayed: number;
  bestScore: number;
  totalStrokes: number;
  holesInOne: number;
  averageStrokes: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

export interface SubmitRoundRequest {
  scores: number[];
  totalStrokes: number;
  totalPar: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  bestScore: number;
  roundsPlayed: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  userRank?: number;
  error?: string;
}
