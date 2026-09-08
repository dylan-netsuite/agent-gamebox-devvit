import { validateTurn } from "./rules";
import { emptyTurn, type Draft, type Turn } from "./types";

export const JOURNEY_SCENARIO = "chatterbloom-seven-v1";
export const JOURNEY_API_ROOT = `/api/${JOURNEY_SCENARIO}`;
export const MAP_SIZE = 13;
export const PATHS = [
  {
    row: 3,
    col: 5,
    down: false,
    place: "The Listening Leaves",
    note: "A few leaves lean closer. Apparently, they were listening.",
  },
  {
    row: 1,
    col: 7,
    down: true,
    place: "The Stillwater",
    note: "A little pool appears. Its reflection is taking its time.",
  },
  {
    row: 5,
    col: 3,
    down: false,
    place: "The Elsewhere Gate",
    note: "A crooked gate takes root. Something beyond it knocks back.",
  },
  {
    row: 1,
    col: 7,
    down: false,
    place: "The Bent Lantern",
    note: "A lantern tilts toward you. It seems to have an idea.",
  },
  {
    row: 4,
    col: 4,
    down: true,
    place: "The Quiet Mushroom",
    note: "A mushroom unfolds. It has been saving this spot.",
  },
  {
    row: 7,
    col: 1,
    down: false,
    place: "The Wandering Snail",
    note: "A snail arrives, carrying yesterday on its back.",
  },
  {
    row: 6,
    col: 2,
    down: true,
    place: "The Crooked Moon",
    note: "Seven words, one little world. The moon comes down to have a look.",
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
  const next = cellsFor(completed.length);
  for (let source = 0; source < completed.length; source++) {
    const previous = cellsFor(source);
    for (const [index, cell] of next.entries()) {
      const sourceIndex = previous.findIndex(
        (p) => p.row === cell.row && p.col === cell.col,
      );
      if (sourceIndex < 0) continue;
      const letter = completed[source]?.word[sourceIndex];
      if (letter) return { index, letter, source };
    }
  }
  return null;
}
// Keep the marker away from earlier words, using the free end of a new path.
export function markerFor(path: number) {
  const occupied = PATHS.slice(0, path).flatMap((_, i) => cellsFor(i));
  const distance = (cell: { row: number; col: number }) =>
    Math.min(
      ...occupied.map(
        (p) => Math.abs(p.row - cell.row) + Math.abs(p.col - cell.col),
      ),
    );
  return (
    cellsFor(path).sort((a, b) => distance(b) - distance(a))[0] ?? {
      row: 6,
      col: 6,
    }
  );
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
