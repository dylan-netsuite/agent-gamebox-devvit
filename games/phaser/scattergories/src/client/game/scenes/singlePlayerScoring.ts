import type { PlayerAnswer, RoundResult } from '../../../shared/types/game';
import { isAnswerValid } from '../../../shared/validation';
import type { AIPlayer } from '../systems/AIOpponent';

export function scoreSinglePlayer(
  roundNumber: number,
  letter: string,
  categoryListId: number,
  categories: string[],
  answers: string[],
  previousTotal: number,
  aiPlayers?: AIPlayer[],
  aiAnswerSets?: string[][],
): { result: RoundResult; roundScore: number; totalScore: number } {
  const allAnswers = [answers, ...(aiAnswerSets ?? [])];
  const allNormalized = allAnswers.map((a) => a.map((s) => s.trim().toLowerCase()));

  const allPlayerResults: { userId: string; username: string; answers: PlayerAnswer[]; roundScore: number }[] = [];

  for (let pi = 0; pi < allAnswers.length; pi++) {
    const playerAns = allAnswers[pi]!;
    const playerNorm = allNormalized[pi]!;
    const pAnswers: PlayerAnswer[] = [];

    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const raw = playerAns[catIdx] ?? '';
      const norm = playerNorm[catIdx] ?? '';
      const valid = isAnswerValid(raw, letter);

      if (!valid || !norm) {
        pAnswers.push({ categoryIndex: catIdx, answer: raw, valid: false, duplicate: false, score: 0 });
        continue;
      }

      const isDuplicate = allNormalized.some(
        (otherNorm, oi) => oi !== pi && otherNorm[catIdx] === norm,
      );

      pAnswers.push({
        categoryIndex: catIdx,
        answer: raw,
        valid: true,
        duplicate: isDuplicate,
        score: isDuplicate ? 0 : 1,
      });
    }

    allPlayerResults.push({
      userId: pi === 0 ? 'single-player' : (aiPlayers?.[pi - 1]?.id ?? `ai-${pi}`),
      username: pi === 0 ? 'You' : (aiPlayers?.[pi - 1]?.name ?? `Bot ${pi}`),
      answers: pAnswers,
      roundScore: pAnswers.reduce((sum, a) => sum + a.score, 0),
    });
  }

  const humanRoundScore = allPlayerResults[0]!.roundScore;
  const totalScore = previousTotal + humanRoundScore;

  const result: RoundResult = {
    roundNumber,
    letter,
    categoryListId,
    categories,
    playerResults: allPlayerResults.map((pr, i) => ({
      ...pr,
      totalScore: i === 0 ? totalScore : pr.roundScore,
    })),
  };

  return { result, roundScore: humanRoundScore, totalScore };
}
