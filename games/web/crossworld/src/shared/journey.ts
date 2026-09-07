import { validateTurn } from "./rules";
import { emptyTurn, type Draft, type Turn } from "./types";

export const JOURNEY_SCENARIO = "chatterbloom-paths-v1";
export const JOURNEY_API_ROOT = `/api/${JOURNEY_SCENARIO}`;
export const PATHS = [
  {
    row: 4,
    col: 3,
    down: false,
    place: "The Listening Leaves",
    note: "A few leaves lean closer. Apparently, they were listening.",
  },
  {
    row: 2,
    col: 5,
    down: true,
    place: "The Stillwater",
    note: "A little pool appears. Its reflection is taking its time.",
  },
  {
    row: 6,
    col: 1,
    down: false,
    place: "The Elsewhere Gate",
    note: "A crooked gate takes root. Something beyond it knocks back.",
  },
] as const;
export type Journey = { completed: Turn[]; turn: Turn | null };
export type JourneyView = {
  scenario: string;
  signedIn: boolean;
  judgeReady: boolean;
  journey: Journey;
};
export const emptyJourney = (): Journey => ({
  completed: [],
  turn: emptyTurn(),
});
export function crossingFor(completed: Turn[]) {
  if (!completed.length) return null;
  const index = completed.length === 1 ? 2 : 4;
  const letter = completed.at(-1)?.word[index];
  return letter ? { index, letter } : null;
}
export function validatePath(draft: Draft, completed: Turn[]) {
  const result = validateTurn(draft, crossingFor(completed));
  if (completed.some((turn) => turn.restriction === draft.restriction))
    result.issues.push("That clue rule has already been used. Choose another.");
  return result;
}
export function cellsFor(path: number) {
  const layout = PATHS[path];
  if (!layout) return [];
  return Array.from({ length: 5 }, (_, i) => ({
    row: layout.row + (layout.down ? i : 0),
    col: layout.col + (layout.down ? 0 : i),
  }));
}
