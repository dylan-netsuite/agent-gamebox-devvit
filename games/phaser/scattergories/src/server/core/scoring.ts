import type { PlayerAnswer, PlayerRoundResult, RoundResult } from '../../shared/types/game';
import { isAnswerValidForCategory } from '../../shared/validation';

interface SubmittedAnswers {
  userId: string;
  username: string;
  answers: string[];
}

export function scoreRound(
  roundNumber: number,
  letter: string,
  categoryListId: number,
  categories: string[],
  submissions: SubmittedAnswers[],
  totalScores: Map<string, number>,
): RoundResult {
  const normalizedSubmissions = submissions.map((s) => ({
    ...s,
    normalized: s.answers.map((a) => a.trim().toLowerCase()),
  }));

  const playerResults: PlayerRoundResult[] = [];

  for (const sub of normalizedSubmissions) {
    const answers: PlayerAnswer[] = [];

    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const raw = sub.answers[catIdx] ?? '';
      const norm = sub.normalized[catIdx] ?? '';

      if (!norm || !isAnswerValidForCategory(raw, letter, categories[catIdx] ?? '')) {
        answers.push({
          categoryIndex: catIdx,
          answer: raw,
          valid: false,
          duplicate: false,
          score: 0,
        });
        continue;
      }

      const isDuplicate = normalizedSubmissions.some(
        (other) => other.userId !== sub.userId && (other.normalized[catIdx] ?? '') === norm,
      );

      answers.push({
        categoryIndex: catIdx,
        answer: raw,
        valid: true,
        duplicate: isDuplicate,
        score: isDuplicate ? 0 : 1,
      });
    }

    const roundScore = answers.reduce((sum, a) => sum + a.score, 0);
    const prevTotal = totalScores.get(sub.userId) ?? 0;
    const newTotal = prevTotal + roundScore;
    totalScores.set(sub.userId, newTotal);

    playerResults.push({
      userId: sub.userId,
      username: sub.username,
      answers,
      roundScore,
      totalScore: newTotal,
    });
  }

  return {
    roundNumber,
    letter,
    categoryListId,
    categories,
    playerResults,
  };
}

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
    const valid = isAnswerValidForCategory(raw, letter, categories[catIdx] ?? '');

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
