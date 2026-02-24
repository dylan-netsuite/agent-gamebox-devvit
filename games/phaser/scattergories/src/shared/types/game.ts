export type GamePhase = 'lobby' | 'playing' | 'scoring' | 'finished';

export interface PlayerAnswer {
  categoryIndex: number;
  answer: string;
  valid: boolean;
  duplicate: boolean;
  score: number;
}

export interface RoundResult {
  roundNumber: number;
  letter: string;
  categoryListId: number;
  categories: string[];
  playerResults: PlayerRoundResult[];
}

export interface PlayerRoundResult {
  userId: string;
  username: string;
  answers: PlayerAnswer[];
  roundScore: number;
  totalScore: number;
}

export interface PlayerScore {
  userId: string;
  username: string;
  totalScore: number;
  roundScores: number[];
}

export interface PlayerStats {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  totalScore: number;
}
