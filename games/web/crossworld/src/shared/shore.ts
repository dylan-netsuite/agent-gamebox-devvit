import { SANDY_SHORE, type WorldDefinition } from "./worlds";
import { RESTRICTIONS, mechanicFor, validateTurn } from "./rules";
import { type Draft, type Judgment } from "./types";

export const SHORE_SCENARIO = SANDY_SHORE.scenario;
export const SHORE_API_ROOT = SANDY_SHORE.apiRoot;
// The paid-review allowance is deliberately pinned to a fixed namespace rather
// than to a world's scenario key. Versioning a world's grid must never hand a
// player a fresh daily budget or clear their cooldowns.
export const JUDGE_BUDGET_SCENARIO = "sandy-shore-pairs-v1";
export const ROWS = SANDY_SHORE.rows;
export const COLS = SANDY_SHORE.cols;
export const DIRECTIONS = ["across", "down"] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const DAYS = SANDY_SHORE.days;
export const CRITERIA = RESTRICTIONS;
export type DeckCard = {
  id: string;
  name: string;
  label: string;
  detail: string;
  rule: string;
};
/** A world's full deck, resolved from stable mechanic ids to display cards. */
export function deckFor(world: WorldDefinition = SANDY_SHORE): DeckCard[] {
  return world.deck.flatMap((entry) => {
    const mechanic = mechanicFor(entry.mechanic);
    return mechanic
      ? [{ ...mechanic, id: entry.mechanic, name: entry.name }]
      : [];
  });
}
/**
 * Cards spent on accepted pairs. Acceptance is the only thing that consumes a
 * card: a draft, a rejected clue and an unavailable judge all leave the deck
 * untouched, because none of them produce a completed pair.
 */
export const usedCards = (completed: Pair[]): string[] =>
  completed.flatMap((pair) => DIRECTIONS.map((d) => pair[d].criterion));
export function availableCards(
  world: WorldDefinition = SANDY_SHORE,
  completed: Pair[] = [],
): DeckCard[] {
  const spent = new Set(usedCards(completed));
  return deckFor(world).filter((card) => !spent.has(card.id));
}
export const cardName = (world: WorldDefinition, id: string) =>
  deckFor(world).find((card) => card.id === id)?.name ?? id;
export type Entry = { word: string; clue: string; criterion: string };
export type PairDraft = { revealed: boolean; across: Entry; down: Entry };
export type Pair = PairDraft & { reviews: Record<Direction, Judgment | null> };
export type Shore = { completed: Pair[]; turn: Pair | null; run?: string };
export type ShoreView = {
  scenario: string;
  signedIn: boolean;
  judgeReady: boolean;
  canReset?: boolean;
  shore: Shore;
};
export const emptyPair = (): Pair => ({
  revealed: false,
  across: { word: "", clue: "", criterion: "" },
  down: { word: "", clue: "", criterion: "" },
  reviews: { across: null, down: null },
});
export const emptyShore = (): Shore => ({ completed: [], turn: emptyPair() });
export const cellsFor = (
  day: number,
  direction: Direction,
  world: WorldDefinition = SANDY_SHORE,
) => {
  const path = world.days[day]?.[direction];
  return path
    ? Array.from({ length: path.length }, (_, i) => ({
        row: path.row + (direction === "down" ? i : 0),
        col: path.col + (direction === "across" ? i : 0),
      }))
    : [];
};
export const cellKey = (cell: { row: number; col: number }) =>
  `${cell.row},${cell.col}`;
export function lettersFor(
  completed: Pair[],
  world: WorldDefinition = SANDY_SHORE,
) {
  const letters = new Map<string, string>();
  completed.forEach((pair, day) => {
    for (const direction of DIRECTIONS)
      cellsFor(day, direction, world).forEach((cell, i) =>
        letters.set(cellKey(cell), pair[direction].word[i]!),
      );
  });
  return letters;
}
export function crossingsFor(
  day: number,
  direction: Direction,
  completed: Pair[],
  pair?: PairDraft,
  world: WorldDefinition = SANDY_SHORE,
) {
  const fixed = lettersFor(completed, world);
  const other = direction === "across" ? "down" : "across";
  const companion = new Map<string, string>();
  if (pair)
    cellsFor(day, other, world).forEach((cell, i) => {
      const letter = pair[other].word.toUpperCase()[i];
      if (letter && /^[A-Z]$/.test(letter))
        companion.set(cellKey(cell), letter);
    });
  return cellsFor(day, direction, world).flatMap((cell, index) => {
    const key = cellKey(cell),
      letter = fixed.get(key) ?? companion.get(key);
    return letter ? [{ index, letter, fixed: fixed.has(key) }] : [];
  });
}
export const asDraft = (pair: PairDraft, direction: Direction): Draft => ({
  word: pair[direction].word,
  clue: pair[direction].clue,
  revealed: pair.revealed,
  restriction: pair[direction].criterion,
});
export function parsePair(raw: unknown): PairDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.revealed !== "boolean") return null;
  const entries: Entry[] = [];
  for (const direction of DIRECTIONS) {
    const entry = p[direction];
    if (!entry || typeof entry !== "object") return null;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.word !== "string" ||
      e.word.length > 20 ||
      typeof e.clue !== "string" ||
      e.clue.length > 140 ||
      typeof e.criterion !== "string" ||
      e.criterion.length > 30
    )
      return null;
    entries.push({ word: e.word, clue: e.clue, criterion: e.criterion });
  }
  return { revealed: p.revealed, across: entries[0]!, down: entries[1]! };
}
export function validatePair(
  pair: PairDraft,
  completed: Pair[],
  world: WorldDefinition = SANDY_SHORE,
) {
  const day = completed.length,
    layout = world.days[day];
  const issues: string[] = [];
  const normalized = parsePair(pair)!;
  if (!layout)
    return {
      issues: [`All ${world.days.length} discoveries are complete.`],
      pair: normalized,
    };
  const deck = new Set(deckFor(world).map((card) => card.id));
  const spent = new Set(usedCards(completed));
  for (const direction of DIRECTIONS) {
    const label = direction === "across" ? "Across" : "Down";
    const card = pair[direction].criterion;
    // Deck membership and one-use are enforced here, before any paid review.
    if (card && !deck.has(card))
      issues.push(`${label}: that rule is not in this world’s deck.`);
    else if (card && spent.has(card))
      issues.push(
        `${label}: ${cardName(world, card)} has already been spent in this world.`,
      );
    const result = validateTurn(
      asDraft(pair, direction),
      null,
      layout[direction].length,
    );
    normalized[direction] = {
      word: result.word,
      clue: result.clue,
      criterion: pair[direction].criterion,
    };
    issues.push(
      ...result.issues.map(
        (issue) => `${direction === "across" ? "Across" : "Down"}: ${issue}`,
      ),
    );
    for (const crossing of crossingsFor(day, direction, completed, pair, world))
      if (
        result.word.length === layout[direction].length &&
        result.word[crossing.index] !== crossing.letter
      )
        issues.push(
          `${direction === "across" ? "Across" : "Down"}: letter ${crossing.index + 1} must be ${crossing.letter} to match ${crossing.fixed ? "an earlier path" : "the other word in this pair"}.`,
        );
  }
  if (
    pair.across.criterion &&
    pair.across.criterion === pair.down.criterion &&
    deck.has(pair.across.criterion)
  )
    issues.push(
      `Each rule is one-use: spend a different card on Across and Down.`,
    );
  return { issues, pair: normalized };
}
