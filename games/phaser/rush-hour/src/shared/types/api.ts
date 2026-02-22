export type Orientation = 'h' | 'v';
export type VehicleType = 'car' | 'truck';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Vehicle {
  id: string;
  type: VehicleType;
  orientation: Orientation;
  row: number;
  col: number;
  color: string;
  isTarget: boolean;
}

export interface PuzzleConfig {
  id: string;
  name: string;
  difficulty: Difficulty;
  vehicles: Vehicle[];
  minMoves: number;
  author?: string;
}

export interface PuzzleResult {
  puzzleId: string;
  moves: number;
  timeSeconds: number;
  completed: boolean;
  stars: number;
}

export interface DailyPuzzleResponse {
  success: boolean;
  puzzle?: PuzzleConfig;
  date?: string;
  userResult?: PuzzleResult | null;
  communityStats?: {
    totalAttempts: number;
    totalCompleted: number;
    avgMoves: number;
    avgTime: number;
  };
  error?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  bestMoves: number;
  bestTime: number;
  puzzlesSolved: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  type: 'daily' | 'alltime';
  date?: string;
  userRank?: number;
  userEntry?: LeaderboardEntry;
  error?: string;
}

export interface UserStats {
  puzzlesSolved: number;
  totalMoves: number;
  totalTime: number;
  bestStreak: number;
  currentStreak: number;
  dailyStreak: number;
  lastDailyDate: string | null;
  starsEarned: number;
  puzzlesCreated: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

export interface SubmitResultRequest {
  puzzleId: string;
  moves: number;
  timeSeconds: number;
  stars: number;
  isDaily: boolean;
}

export interface UserPuzzleSubmission {
  name: string;
  vehicles: Vehicle[];
  minMoves: number;
}

export interface UserPuzzleResponse {
  success: boolean;
  puzzles?: PuzzleConfig[];
  error?: string;
}

export interface CommunityStatsResponse {
  success: boolean;
  totalPlayers: number;
  totalPuzzlesSolved: number;
  totalDailyCompleted: number;
  avgMoves: number;
  error?: string;
}

export interface PuzzleBest {
  stars: number;
  bestMoves: number;
  bestTime: number;
}

export interface PuzzleProgressResponse {
  success: boolean;
  progress?: Record<string, PuzzleBest>;
  error?: string;
}
