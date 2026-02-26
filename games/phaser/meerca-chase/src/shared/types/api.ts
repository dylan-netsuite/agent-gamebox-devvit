export interface GameResult {
  score: number;
  neggsCaught: number;
  difficulty: 'classic' | 'hard';
  completedAt: string;
}

export interface UserStats {
  gamesPlayed: number;
  highScore: number;
  totalNeggs: number;
  totalScore: number;
  averageScore: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

export interface SubmitScoreRequest {
  score: number;
  neggsCaught: number;
  difficulty: 'classic' | 'hard';
}

export interface SubmitScoreResponse {
  success: boolean;
  isHighScore?: boolean;
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  highScore: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  userRank?: number;
  error?: string;
}
