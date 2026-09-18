/**
 * The design bible's verified reference solution for Region I, transcribed
 * 1-based exactly as the document writes it. Players supply their own answers —
 * these words exist only to pin the geometry and the crossings, and are used by
 * tests rather than by the game. Card assignments are drawn from each world's
 * own deck, which supersedes the card column in the bible's draft spec table.
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
        across: { row: 2, col: 1, word: "SAND", card: "brief" },
        down: { row: 1, col: 3, word: "ANTS", card: "two-breaths" },
        cross: "2,3,N",
      },
      {
        place: "Tide pool",
        across: { row: 8, col: 1, word: "COAST", card: "half-measure" },
        down: { row: 7, col: 2, word: "FOAM", card: "short-words" },
        cross: "8,2,O",
      },
    ],
  },
  {
    world: GLASS_REACH,
    discoveries: [
      {
        place: "Green shard",
        across: { row: 2, col: 1, word: "GLASS", card: "brief" },
        down: { row: 1, col: 3, word: "WAVE", card: "same-start" },
        cross: "2,3,A",
      },
      {
        place: "Bottle neck",
        across: { row: 8, col: 2, word: "TIDE", card: "no-e" },
        down: { row: 6, col: 3, word: "SHINE", card: "long-shadow" },
        cross: "8,3,I",
      },
    ],
  },
  {
    world: THE_WRACKLINE,
    discoveries: [
      {
        place: "Rope knot",
        across: { row: 3, col: 1, word: "ROPE", card: "half-measure" },
        down: { row: 1, col: 2, word: "FLOAT", card: "seven" },
        cross: "3,2,O",
      },
      {
        place: "Salt-stiff coat",
        across: { row: 9, col: 1, word: "SALT", card: "short-words" },
        down: { row: 9, col: 4, word: "TORN", card: "no-articles" },
        cross: "9,4,T",
      },
    ],
  },
  {
    // Compacted from the bible's 15-row draft: discoveries two and three each
    // sit two rows higher. Every reference word and card is unchanged.
    world: THE_LONG_PIER,
    discoveries: [
      {
        place: "First piling",
        across: { row: 2, col: 1, word: "PIER", card: "brief" },
        down: { row: 2, col: 1, word: "POST", card: "two-breaths" },
        cross: "2,1,P",
      },
      {
        place: "Missing plank",
        across: { row: 7, col: 1, word: "PLANK", card: "half-measure" },
        down: { row: 5, col: 3, word: "GRAIN", card: "no-b" },
        cross: "7,3,A",
      },
      {
        place: "Fog end",
        across: { row: 9, col: 1, word: "CANOE", card: "seven" },
        down: { row: 9, col: 1, word: "CRANE", card: "long-shadow" },
        cross: "9,1,C",
      },
    ],
  },
];

/** One clue per reference answer, each obeying that slot's restriction card. */
export const REFERENCE_CLUES: Record<string, string> = {
  SAND: "Fine grains underfoot",
  ANTS: "Busy insects",
  COAST: "Where land meets sea",
  FOAM: "Sea suds on a wave",
  GLASS: "Clear brittle window stuff",
  WAVE: "Swell surging shoreward",
  TIDE: "Daily push and pull of a bay",
  SHINE: "A brilliantly polished gleam",
  ROPE: "Twisted cord",
  FLOAT: "To stay up on top of water",
  SALT: "Sea grit in your food",
  TORN: "Ripped in two",
  PIER: "Walkway over water",
  POST: "Upright timber",
  PLANK: "Long flat board",
  GRAIN: "Wood lines, or a seed",
  CANOE: "A slim boat you paddle while kneeling",
  CRANE: "A tall wading bird, unmistakably",
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
