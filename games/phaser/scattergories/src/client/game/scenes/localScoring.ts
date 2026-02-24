import type { PlayerAnswer, RoundResult } from '../../../shared/types/game';
import { isAnswerValid } from '../../../shared/validation';

export function scoreLocalMultiplayer(
  roundNumber: number,
  letter: string,
  categoryListId: number,
  categories: string[],
  playerNames: string[],
  allAnswers: string[][],
  previousScores: number[],
): { result: RoundResult; newScores: number[] } {
  const normalizedAll = allAnswers.map((answers) =>
    answers.map((a) => a.trim().toLowerCase()),
  );

  const playerResults = playerNames.map((name, pi) => {
    const answers = allAnswers[pi] ?? [];
    const normalized = normalizedAll[pi] ?? [];
    const playerAnswers: PlayerAnswer[] = [];

    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const raw = answers[catIdx] ?? '';
      const norm = normalized[catIdx] ?? '';

      if (!norm || !isAnswerValid(raw, letter)) {
        playerAnswers.push({ categoryIndex: catIdx, answer: raw, valid: false, duplicate: false, score: 0 });
        continue;
      }

      const isDuplicate = normalizedAll.some(
        (otherNorm, oi) => oi !== pi && otherNorm[catIdx] === norm,
      );

      playerAnswers.push({
        categoryIndex: catIdx,
        answer: raw,
        valid: true,
        duplicate: isDuplicate,
        score: isDuplicate ? 0 : 1,
      });
    }

    const roundScore = playerAnswers.reduce((sum, a) => sum + a.score, 0);
    const totalScore = (previousScores[pi] ?? 0) + roundScore;

    return { userId: `local-${pi}`, username: name, answers: playerAnswers, roundScore, totalScore };
  });

  const newScores = playerResults.map((pr) => pr.totalScore);

  return {
    result: { roundNumber, letter, categoryListId, categories, playerResults },
    newScores,
  };
}
