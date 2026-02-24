import { CATEGORY_LISTS, VALID_LETTERS } from '../../shared/types/categories';
import type { RoundConfig } from '../../shared/types/multiplayer';

export function pickRoundConfig(
  roundNumber: number,
  usedListIds: number[],
  usedLetters: string[],
): RoundConfig {
  const availableLists = CATEGORY_LISTS.filter((l) => !usedListIds.includes(l.id));
  const list = availableLists[Math.floor(Math.random() * availableLists.length)] ?? CATEGORY_LISTS[0]!;

  const availableLetters = VALID_LETTERS.filter((l) => !usedLetters.includes(l));
  const letter = availableLetters[Math.floor(Math.random() * availableLetters.length)] ?? VALID_LETTERS[0]!;

  return {
    roundNumber,
    letter,
    categoryListId: list.id,
    categories: list.categories,
    timerSeconds: 90,
  };
}
