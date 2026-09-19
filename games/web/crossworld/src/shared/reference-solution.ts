/**
 * The verified reference solution for Region I, written 1-based. Players supply
 * their own answers — these words exist only to pin the geometry and the
 * crossings, and are used by tests rather than by the game. Card assignments
 * are drawn from each world's own deck.
 *
 * Region I was re-laid after playtesting: its three open worlds were the same
 * size and shared no letters between turns, so nothing escalated. Each world
 * now inherits more locked letters than the last (1, 2, 3, 4) before Region II
 * takes over at 6. The design bible still documents the original flat grids and
 * is stale here; this file and worlds.ts are the source of truth.
 *
 * Every word is unique across the region because REFERENCE_CLUES is keyed by
 * word, so a reused answer would need one clue to satisfy two different cards.
 */
import {
  GLASS_REACH,
  SANDY_SHORE,
  THE_LONG_PIER,
  THE_WRACKLINE,
  type WorldDefinition,
} from "./worlds";
import type { PairDraft } from "./shore";

export type ReferenceSlot = {
  row: number;
  col: number;
  word: string;
  card: string;
};
export type ReferenceDiscovery = {
  place: string;
  across: ReferenceSlot;
  down: ReferenceSlot;
  /** "row,col,letter", 1-based, of the single shared cell. */
  cross: string;
};
export type ReferenceWorld = {
  world: WorldDefinition;
  discoveries: ReferenceDiscovery[];
};

export const REGION_ONE: ReferenceWorld[] = [
  {
    world: SANDY_SHORE,
    discoveries: [
      {
        place: "Sand drifts",
        across: { row: 3, col: 1, word: "SAND", card: "brief" },
        down: { row: 2, col: 3, word: "SNAIL", card: "two-breaths" },
        cross: "3,3,N",
      },
      {
        // SALTS inherits (6,3) L, the last letter of SNAIL.
        place: "Tide pool",
        across: { row: 6, col: 1, word: "SALTS", card: "half-measure" },
        down: { row: 6, col: 5, word: "SHORE", card: "short-words" },
        cross: "6,5,S",
      },
    ],
  },
  {
    world: GLASS_REACH,
    discoveries: [
      {
        place: "Green shard",
        across: { row: 5, col: 1, word: "GLASS", card: "brief" },
        down: { row: 3, col: 2, word: "MELTS", card: "same-start" },
        cross: "5,2,L",
      },
      {
        // SATIN inherits (5,5) S from GLASS; SILT inherits (7,2) S from MELTS.
        place: "Bottle neck",
        across: { row: 7, col: 2, word: "SILT", card: "no-e" },
        down: { row: 5, col: 5, word: "SATIN", card: "long-shadow" },
        cross: "7,5,T",
      },
    ],
  },
  {
    world: THE_WRACKLINE,
    discoveries: [
      {
        place: "Tide-line trace",
        across: { row: 3, col: 1, word: "STEP", card: "half-measure" },
        down: { row: 3, col: 2, word: "TRACE", card: "seven" },
        cross: "3,2,T",
      },
      {
        // WEED inherits (7,2) E from TRACE.
        place: "Drifted weed",
        across: { row: 7, col: 1, word: "WEED", card: "short-words" },
        down: { row: 7, col: 4, word: "DRIFT", card: "no-articles" },
        cross: "7,4,D",
      },
      {
        // WRACK inherits (7,1) W from WEED; KNOT inherits (11,4) T from DRIFT.
        place: "Knotted wrack",
        across: { row: 11, col: 1, word: "KNOT", card: "no-b" },
        down: { row: 7, col: 1, word: "WRACK", card: "long-shadow" },
        cross: "11,1,K",
      },
    ],
  },
  {
    world: THE_LONG_PIER,
    discoveries: [
      {
        place: "First piling",
        across: { row: 2, col: 1, word: "PIER", card: "brief" },
        down: { row: 2, col: 2, word: "IRONS", card: "two-breaths" },
        cross: "2,2,I",
      },
      {
        // ISLES inherits (6,2) S from IRONS.
        place: "The long span",
        across: { row: 6, col: 1, word: "ISLES", card: "half-measure" },
        down: { row: 6, col: 5, word: "SPANS", card: "no-b" },
        cross: "6,5,S",
      },
      {
        // INLET inherits (6,1) I from ISLES; TIDES inherits (10,5) S from SPANS.
        place: "Inlet turn",
        across: { row: 10, col: 1, word: "TIDES", card: "seven" },
        down: { row: 6, col: 1, word: "INLET", card: "long-shadow" },
        cross: "10,1,T",
      },
      {
        // DEEP inherits (10,3) D from TIDES.
        place: "Fog end",
        across: { row: 13, col: 1, word: "ROPES", card: "no-e" },
        down: { row: 10, col: 3, word: "DEEP", card: "same-start" },
        cross: "13,3,P",
      },
    ],
  },
];

/** One clue per reference answer, each obeying that slot's restriction card. */
export const REFERENCE_CLUES: Record<string, string> = {
  // Sandy Shore
  SAND: "Fine grains underfoot",
  SNAIL: "Shelled crawler",
  SALTS: "What the sea leaves behind",
  SHORE: "Land at the edge of a sea",
  // Glass Reach
  GLASS: "Clear brittle window stuff",
  MELTS: "Slowly softens into liquid",
  SILT: "Soft mud that a flood drops",
  SATIN: "A smooth lustrous woven cloth",
  // The Wrackline
  STEP: "One print in wet sand",
  TRACE: "A faint mark left by something passing",
  WEED: "Limp sea herb on sand",
  DRIFT: "To float slowly with current",
  KNOT: "Tied tangle in rope",
  WRACK: "Shoreline litter left by storms",
  // The Long Pier
  PIER: "Walkway over water",
  IRONS: "Metal fastenings",
  ISLES: "Small islands",
  SPANS: "Stretches across a gap",
  TIDES: "The sea rises and falls each day",
  INLET: "A narrow saltwater passage inland",
  ROPES: "Thick cords for hauling",
  DEEP: "Far down, far darker",
};

export const referenceFor = (world: WorldDefinition): ReferenceWorld =>
  REGION_ONE.find((entry) => entry.world.id === world.id)!;

export function referenceDraft(
  world: WorldDefinition,
  day: number,
): PairDraft & { day: number } {
  const discovery = referenceFor(world).discoveries[day]!;
  return {
    day,
    revealed: true,
    across: {
      word: discovery.across.word,
      clue: REFERENCE_CLUES[discovery.across.word]!,
      criterion: discovery.across.card,
    },
    down: {
      word: discovery.down.word,
      clue: REFERENCE_CLUES[discovery.down.word]!,
      criterion: discovery.down.card,
    },
  };
}
