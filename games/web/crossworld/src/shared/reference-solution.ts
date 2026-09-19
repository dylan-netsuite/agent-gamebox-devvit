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
        down: { row: 2, col: 3, word: "SNAIL", card: "short-words" },
        cross: "3,3,N",
      },
      {
        // SALTS inherits (6,3) L, the last letter of SNAIL.
        place: "Tide pool",
        across: { row: 6, col: 1, word: "SALTS", card: "shared-initial" },
        down: { row: 6, col: 5, word: "SHORE", card: "ask" },
        cross: "6,5,S",
      },
    ],
  },
  {
    world: GLASS_REACH,
    discoveries: [
      {
        place: "Green shard",
        across: { row: 5, col: 1, word: "GLASS", card: "half-measure" },
        down: { row: 3, col: 2, word: "MELTS", card: "no-e" },
        cross: "5,2,L",
      },
      {
        // SATIN inherits (5,5) S from GLASS; SILT inherits (7,2) S from MELTS.
        place: "Bottle neck",
        across: { row: 7, col: 2, word: "SILT", card: "same-start" },
        down: { row: 5, col: 5, word: "SATIN", card: "twin-endings" },
        cross: "7,5,T",
      },
    ],
  },
  {
    world: THE_WRACKLINE,
    discoveries: [
      {
        place: "Tide-line trace",
        across: { row: 3, col: 1, word: "STEP", card: "seven" },
        down: { row: 3, col: 2, word: "TRACE", card: "long-shadow" },
        cross: "3,2,T",
      },
      {
        // WEED inherits (7,2) E from TRACE.
        place: "Drifted weed",
        across: { row: 7, col: 1, word: "WEED", card: "no-articles" },
        down: { row: 7, col: 4, word: "DRIFT", card: "fresh-words" },
        cross: "7,4,D",
      },
      {
        // WRACK inherits (7,1) W from WEED; KNOT inherits (11,4) T from DRIFT.
        place: "Knotted wrack",
        across: { row: 11, col: 1, word: "KNOT", card: "double-trouble" },
        down: { row: 7, col: 1, word: "WRACK", card: "count-me-in" },
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
        down: { row: 2, col: 2, word: "IRONS", card: "half-measure" },
        cross: "2,2,I",
      },
      {
        // ISLES inherits (6,2) S from IRONS.
        place: "The long span",
        across: { row: 6, col: 1, word: "ISLES", card: "no-b" },
        down: { row: 6, col: 5, word: "SPANS", card: "mirror-length" },
        cross: "6,5,S",
      },
      {
        // INLET inherits (6,1) I from ISLES; TIDES inherits (10,5) S from SPANS.
        place: "Inlet turn",
        across: { row: 10, col: 1, word: "TIDES", card: "shared-initial" },
        down: { row: 6, col: 1, word: "INLET", card: "echo" },
        cross: "10,1,T",
      },
      {
        // DEEP inherits (10,3) D from TIDES.
        place: "Fog end",
        across: { row: 13, col: 1, word: "ROPES", card: "fresh-words" },
        down: { row: 10, col: 3, word: "DEEP", card: "twin-endings" },
        cross: "13,3,P",
      },
    ],
  },
];

/** One clue per reference answer, each obeying that slot's restriction card. */
export const REFERENCE_CLUES: Record<string, string> = {
  // Sandy Shore: brief, short-words, shared-initial, ask
  SAND: "Fine grains underfoot",
  SNAIL: "Slow bug in a hard case",
  SALTS: "What the sea leaves behind",
  SHORE: "Where does the land stop?",
  // Glass Reach: half-measure, no-e, same-start, twin-endings
  GLASS: "Clear brittle pane",
  MELTS: "Turns to liquid slowly",
  SILT: "Soft silky mud",
  SATIN: "Smooth shining woven cloth",
  // The Wrackline: seven, long-shadow, no-articles, fresh-words,
  // double-trouble, count-me-in
  STEP: "One mark left in the wet sand",
  TRACE: "A faint remainder of something passing",
  WEED: "Limp green growth on wet sand",
  DRIFT: "To float slowly with current",
  KNOT: "Pulled tight in rope",
  WRACK: "Storm litter left by one high tide",
  // The Long Pier: brief, half-measure, no-b, mirror-length, shared-initial,
  // echo, fresh-words, twin-endings. INLET echoes "the sea" back from TIDES.
  PIER: "Walkway over water",
  IRONS: "Metal fastenings",
  ISLES: "Small scattered lands in water",
  SPANS: "Stretches that cross open gaps",
  TIDES: "The sea rises and falls",
  INLET: "A narrow arm of the sea",
  ROPES: "Thick cords for hauling",
  DEEP: "Down where the water is darker",
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
