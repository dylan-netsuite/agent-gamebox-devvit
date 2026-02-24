import type { PlayerAnswer, RoundResult } from '../../../shared/types/game';
import { isAnswerValid } from '../../../shared/validation';

export function scoreSinglePlayer(
  roundNumber: number,
  letter: string,
  categoryListId: number,
  categories: string[],
  answers: string[],
  previousTotal: number,
): { result: RoundResult; roundScore: number; totalScore: number } {
  const playerAnswers: PlayerAnswer[] = [];

  for (let catIdx = 0; catIdx < categories.length; catIdx++) {
    const raw = answers[catIdx] ?? '';
    const valid = isAnswerValid(raw, letter);

    playerAnswers.push({
      categoryIndex: catIdx,
      answer: raw,
      valid,
      duplicate: false,
      score: valid ? 1 : 0,
    });
  }

  const roundScore = playerAnswers.reduce((sum, a) => sum + a.score, 0);
  const totalScore = previousTotal + roundScore;

  const result: RoundResult = {
    roundNumber,
    letter,
    categoryListId,
    categories,
    playerResults: [
      {
        userId: 'single-player',
        username: 'You',
        answers: playerAnswers,
        roundScore,
        totalScore,
      },
    ],
  };

  return { result, roundScore, totalScore };
}
