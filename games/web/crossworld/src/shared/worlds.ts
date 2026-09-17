// World configuration is pure data shared by the client and trusted server routes.
export type Direction = "across" | "down";
export type Path = { row: number; col: number; length: number };
export type WorldDay = {
  across: Path;
  down: Path;
  place: string;
  note: string;
};
export type WorldDefinition = {
  id: string;
  scenario: string;
  apiRoot: string;
  name: string;
  chapter: string;
  introduction: string;
  welcome: string;
  noun: string;
  description: string;
  days: WorldDay[];
};
export const SANDY_SHORE: WorldDefinition = {
  id: "sandy-shore",
  scenario: "sandy-shore-pairs-v1",
  apiRoot: "/api/sandy-shore-pairs-v1",
  name: "Sandy Shore",
  chapter: "A world in ten words",
  noun: "shore",
  introduction: "Beneath the sand.",
  welcome:
    "A little exploring. A little wordplay. Uncover two paths and give them words of your own.",
  description: "Sun-warmed sand, sea-glass water, and words waiting beneath.",
  days: [
    {
      across: { row: 2, col: 0, length: 5 },
      down: { row: 0, col: 1, length: 6 },
      place: "Sand drifts",
      note: "The sand shifts. Two paths appear.",
    },
    {
      across: { row: 4, col: 1, length: 3 },
      down: { row: 1, col: 3, length: 5 },
      place: "Tide pool",
      note: "The tide slips away, leaving a crossing behind.",
    },
    {
      across: { row: 5, col: 0, length: 5 },
      down: { row: 4, col: 2, length: 6 },
      place: "Sea grass",
      note: "The grass parts around two more paths.",
    },
    {
      across: { row: 7, col: 0, length: 3 },
      down: { row: 5, col: 0, length: 5 },
      place: "Shell bank",
      note: "A few shells roll aside. There is more to find.",
    },
    {
      across: { row: 9, col: 0, length: 5 },
      down: { row: 5, col: 4, length: 5 },
      place: "Smooth stones",
      note: "The last stones settle. Your shore is uncovered.",
    },
  ],
};
export const HAUNTED_HEDGE: WorldDefinition = {
  id: "haunted-hedge",
  scenario: "haunted-hedge-pairs-v1",
  apiRoot: "/api/haunted-hedge-pairs-v1",
  name: "Haunted Hedge",
  chapter: "A garden after dark",
  noun: "garden",
  introduction: "Something in the leaves.",
  welcome:
    "Beyond a crooked gate, the hedges are quietly watching. Uncover two paths. Leave a little light behind.",
  description:
    "Lavender mist, watchful hedges, and a trail of waking lanterns.",
  days: [
    {
      across: { row: 2, col: 0, length: 3 },
      down: { row: 0, col: 0, length: 5 },
      place: "Rusted gate",
      note: "The ivy loosens. The first stone paths appear.",
    },
    {
      across: { row: 0, col: 0, length: 5 },
      down: { row: 0, col: 4, length: 5 },
      place: "Watchful topiary",
      note: "Two small eyes blink. The hedges lean aside.",
    },
    {
      across: { row: 4, col: 0, length: 5 },
      down: { row: 2, col: 2, length: 5 },
      place: "Whisper walk",
      note: "The mist drifts away. Pale footprints lead onward.",
    },
    {
      across: { row: 6, col: 2, length: 3 },
      down: { row: 6, col: 4, length: 4 },
      place: "Lost fountain",
      note: "Leaves scatter. Still water holds a moonlit reflection.",
    },
    {
      across: { row: 9, col: 0, length: 5 },
      down: { row: 6, col: 0, length: 4 },
      place: "Moon gate",
      note: "The last hedge opens. A warm light waits beyond.",
    },
  ],
};
export const WORLDS = [SANDY_SHORE, HAUNTED_HEDGE];
export const worldFor = (id: string | null | undefined) =>
  WORLDS.find((world) => world.id === id) ?? SANDY_SHORE;
