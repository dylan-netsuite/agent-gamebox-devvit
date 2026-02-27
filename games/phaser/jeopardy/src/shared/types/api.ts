export type GameType = 'latest' | 'onthisday';

export interface Clue {
  id: number;
  question: string;
  answer: string;
  value: number;
  category: string;
  col: number; // 1-6
  row: number; // 1-5
}

export interface FinalJeopardyClue {
  category: string;
  question: string;
  answer: string;
}

export interface GameData {
  gameId: number;
  airDate: string;
  categories: string[]; // 6 category names for J round
  clues: Clue[]; // up to 30 clues (6x5 Jeopardy round)
  djCategories?: string[]; // 6 category names for DJ round
  djClues?: Clue[]; // up to 30 clues (6x5 Double Jeopardy round)
  finalJeopardy: FinalJeopardyClue | null;
  gameType: GameType;
  description: string; // e.g. "February 15, 2026" or "On This Day: February 16, 2003"
}

export interface GameResponse {
  success: boolean;
  data?: GameData;
  error?: string;
  fallback?: boolean;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface AnswerResult {
  value: number;
  correct: boolean;
  isDailyDouble: boolean;
  isFinalJeopardy: boolean;
  skipped?: boolean;
}

export interface GameResult {
  score: number;
  description: string;
  answers: AnswerResult[];
}

export interface UserStats {
  totalAnswered: number;
  totalCorrect: number;
  gamesPlayed: number;
  bestGame: { score: number; date: string; description: string } | null;
  longestStreak: number;
  currentStreak: number;
  correctByValue: Record<string, { correct: number; total: number }>;
  finalJeopardy: { correct: number; total: number };
}

export interface StatsResponse {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

// ---------------------------------------------------------------------------
// Saved game state (board persistence)
// ---------------------------------------------------------------------------

export interface SavedGameState {
  gameId: number;
  round: 'J' | 'DJ';
  score: number;
  usedCells: string[];
  gameResults: AnswerResult[];
  gameDescription: string;
  savedAt: string;
}

export interface SavedGameResponse {
  success: boolean;
  state?: SavedGameState;
  error?: string;
}

// ---------------------------------------------------------------------------
// Per-question community stats
// ---------------------------------------------------------------------------

export interface QuestionStatsRequest {
  questionId: string;
  correct: boolean;
  elapsed: number; // seconds taken to answer
}

export interface QuestionStatsResponse {
  success: boolean;
  correct: number;
  total: number;
  avgCorrectTime: number | null; // avg seconds for correct answers, null if none
  yourTime: number; // echoed back
}

// ---------------------------------------------------------------------------
// Community dashboard
// ---------------------------------------------------------------------------

export interface CommunityStatsResponse {
  success: boolean;
  totalPlayers: number;
  totalGamesPlayed: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  avgCorrectPct: number;
  avgCorrectTime: number | null;
  topPlayers: { rank: number; username: string; bestScore: number }[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  bestScore: number;
  gamesPlayed: number;
}

export interface LeaderboardResponse {
  success: boolean;
  entries: LeaderboardEntry[];
  userRank?: number;
  userEntry?: LeaderboardEntry;
  error?: string;
}
