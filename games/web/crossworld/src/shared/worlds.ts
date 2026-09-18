// World configuration is pure data shared by the client and trusted server routes.
export type Direction = "across" | "down";
export type Path = { row: number; col: number; length: number };
export type WorldDay = {
  across: Path;
  down: Path;
  place: string;
  note: string;
};
export type RegionId = "shallows" | "hedge";
export type DeckEntry = { mechanic: string; name: string };
export type WorldKind = "open" | "gate";
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
  /** Grid dimensions. Paths are 0-based and must fit inside rows x cols. */
  rows: number;
  cols: number;
  region: RegionId;
  /** 1-50 across the finished atlas; drives display order and gating. */
  ordinal: number;
  kind: WorldKind;
  /** Placement on the atlas map, in abstract column/row units. */
  atlas: { x: number; y: number };
  /** World ids sharing a border. Gates border every world in their region. */
  neighbours: string[];
  /** Scenery motif key for the shared coastal renderer. */
  motif: "sand" | "glass" | "wrack" | "pier" | "hedge";
  /**
   * This world's restriction deck, sized to its slot count. Every card is
   * one-use, so the deck is exactly consumed by a completed world. `mechanic`
   * is the stable id the deterministic switch and saved records use; `name` is
   * world-flavoured display only, and may be reworded without invalidating a
   * single locked entry.
   */
  deck: DeckEntry[];
  days: WorldDay[];
};

// Region I · The Shallows. Coordinates below are 0-based; the design bible's
// verified grid spec is 1-based, so every row/col here is one lower than the
// table. Every discovery's Across and Down cross at exactly one shared letter.
export const SANDY_SHORE: WorldDefinition = {
  // Reshaped from five discoveries to two. The grid changed, so this is a new
  // world version: older runs stay untouched under the previous scenario key
  // rather than being re-read against slots they no longer fit.
  id: "sandy-shore",
  scenario: "sandy-shore-shallows-v2",
  apiRoot: "/api/sandy-shore-shallows-v2",
  name: "Sandy Shore",
  chapter: "Where you wash up",
  noun: "shore",
  introduction: "Beneath the sand.",
  welcome:
    "A little exploring. A little wordplay. Uncover two paths and give them words of your own.",
  description: "Sun-warmed sand, sea-glass water, and words waiting beneath.",
  rows: 10,
  cols: 5,
  region: "shallows",
  ordinal: 1,
  kind: "open",
  atlas: { x: 1, y: 0 },
  neighbours: ["glass-reach", "the-wrackline", "the-long-pier"],
  motif: "sand",
  deck: [
    { mechanic: "brief", name: "Driftwood" },
    { mechanic: "two-breaths", name: "Two Shells" },
    { mechanic: "half-measure", name: "Low Tide" },
    { mechanic: "short-words", name: "Grains" },
  ],
  days: [
    {
      // 1A (2,1) SAND x 1D (1,3) ANTS, crossing (2,3) N
      across: { row: 1, col: 0, length: 4 },
      down: { row: 0, col: 2, length: 4 },
      place: "Sand drifts",
      note: "The sand shifts. Two paths appear.",
    },
    {
      // 2A (8,1) COAST x 2D (7,2) FOAM, crossing (8,2) O
      across: { row: 7, col: 0, length: 5 },
      down: { row: 6, col: 1, length: 4 },
      place: "Tide pool",
      note: "The tide slips away, leaving a crossing behind.",
    },
  ],
};
export const GLASS_REACH: WorldDefinition = {
  id: "glass-reach",
  scenario: "glass-reach-shallows-v1",
  apiRoot: "/api/glass-reach-shallows-v1",
  name: "Glass Reach",
  chapter: "A beach that hums",
  noun: "reach",
  introduction: "Sea-glass, still warm.",
  welcome:
    "Every piece here hums faintly when you name it. Uncover two paths and see what answers.",
  description: "A shore of tumbled sea-glass that hums when you name a piece.",
  rows: 10,
  cols: 5,
  region: "shallows",
  ordinal: 2,
  kind: "open",
  atlas: { x: 0, y: 1 },
  neighbours: ["sandy-shore", "the-long-pier"],
  motif: "glass",
  deck: [
    { mechanic: "brief", name: "Pocket Find" },
    { mechanic: "same-start", name: "Matched Pair" },
    { mechanic: "no-e", name: "Clouded Glass" },
    { mechanic: "long-shadow", name: "Long Shard" },
  ],
  days: [
    {
      // 1A (2,1) GLASS x 1D (1,3) WAVE, crossing (2,3) A
      across: { row: 1, col: 0, length: 5 },
      down: { row: 0, col: 2, length: 4 },
      place: "Green shard",
      note: "A green edge catches the light. Two paths open around it.",
    },
    {
      // 2A (8,2) TIDE x 2D (6,3) SHINE, crossing (8,3) I
      across: { row: 7, col: 1, length: 4 },
      down: { row: 5, col: 2, length: 5 },
      place: "Bottle neck",
      note: "A smoothed neck of glass rolls free, and the humming shifts.",
    },
  ],
};
export const THE_WRACKLINE: WorldDefinition = {
  id: "the-wrackline",
  scenario: "the-wrackline-shallows-v1",
  apiRoot: "/api/the-wrackline-shallows-v1",
  name: "The Wrackline",
  chapter: "The tide’s leavings",
  noun: "wrackline",
  introduction: "Everything here belonged to someone.",
  welcome:
    "A long seam of rope, wood and salt. Uncover two paths and name what the water left.",
  description: "The tide’s leavings, in a long seam of rope, wood and salt.",
  rows: 12,
  cols: 4,
  region: "shallows",
  ordinal: 3,
  kind: "open",
  atlas: { x: 2, y: 1 },
  neighbours: ["sandy-shore", "the-long-pier"],
  motif: "wrack",
  deck: [
    { mechanic: "half-measure", name: "Short Rope" },
    { mechanic: "seven", name: "Seven Knots" },
    { mechanic: "short-words", name: "Small Salvage" },
    { mechanic: "no-articles", name: "Cut the Line" },
  ],
  days: [
    {
      // 1A (3,1) ROPE x 1D (1,2) FLOAT, crossing (3,2) O
      across: { row: 2, col: 0, length: 4 },
      down: { row: 0, col: 1, length: 5 },
      place: "Rope knot",
      note: "A knot loosens. Two frayed paths run out of it.",
    },
    {
      // 2A (9,1) SALT x 2D (9,4) TORN, crossing (9,4) T
      across: { row: 8, col: 0, length: 4 },
      down: { row: 8, col: 3, length: 4 },
      place: "Salt-stiff coat",
      note: "Stiff with salt, the cloth gives. Something is still in the pocket.",
    },
  ],
};
export const THE_LONG_PIER: WorldDefinition = {
  id: "the-long-pier",
  scenario: "the-long-pier-shallows-v1",
  apiRoot: "/api/the-long-pier-shallows-v1",
  name: "The Long Pier",
  chapter: "Region I · Gate",
  noun: "pier",
  introduction: "Further out than the map has room for.",
  welcome:
    "The capstone of the Shallows. Three discoveries, and one letter that carries between them.",
  description:
    "A pier that continues further out than the map has room for. Opens once the Shallows are complete.",
  // Compacted from the bible's 15-row draft to 13 rows without changing any
  // reference word: discoveries two and three each sit two rows higher. Thirteen
  // is the provable floor for two five-letter Downs plus a full-width Across.
  rows: 13,
  cols: 5,
  region: "shallows",
  ordinal: 7,
  kind: "gate",
  atlas: { x: 1, y: 2 },
  neighbours: ["sandy-shore", "glass-reach", "the-wrackline"],
  motif: "pier",
  deck: [
    { mechanic: "brief", name: "Short Span" },
    { mechanic: "two-breaths", name: "Two Posts" },
    { mechanic: "half-measure", name: "Fog Bank" },
    { mechanic: "no-b", name: "Missing Plank" },
    { mechanic: "seven", name: "Seven Pilings" },
    { mechanic: "long-shadow", name: "Far Out" },
  ],
  days: [
    {
      // 1A (2,1) PIER x 1D (2,1) POST, crossing (2,1) P
      across: { row: 1, col: 0, length: 4 },
      down: { row: 1, col: 0, length: 4 },
      place: "First piling",
      note: "The first piling stands clear of the water. The boards begin here.",
    },
    {
      // 2A (7,1) PLANK x 2D (5,3) GRAIN, crossing (7,3) A
      across: { row: 6, col: 0, length: 5 },
      down: { row: 4, col: 2, length: 5 },
      place: "Missing plank",
      note: "A plank is gone. The grain of the next one runs out over the water.",
    },
    {
      // 3A (9,1) CANOE x 3D (9,1) CRANE, crossing (9,1) C. 3A also runs through
      // (9,3), the last letter of 2D GRAIN — the region's one cross-discovery link.
      across: { row: 8, col: 0, length: 5 },
      down: { row: 8, col: 0, length: 5 },
      place: "Fog end",
      note: "The pier ends in fog. A letter you already wrote is waiting out here.",
    },
  ],
};
// Region II · The Hedge. Reassigned out of Region I; it is not a Shallows
// frontier destination and does not count toward the Gate. Its scenario key is
// unchanged so existing runs keep working.
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
  rows: 10,
  cols: 5,
  region: "hedge",
  ordinal: 8,
  kind: "open",
  atlas: { x: 1, y: 3 },
  neighbours: [],
  motif: "hedge",
  deck: [
    { mechanic: "two-breaths", name: "Two Breaths" },
    { mechanic: "no-b", name: "Bee-Free Patch" },
    { mechanic: "brief", name: "Pocket Posy" },
    { mechanic: "no-e", name: "E’s Day Off" },
    { mechanic: "seven", name: "Seven Petals" },
    { mechanic: "same-start", name: "Twin Blossoms" },
    { mechanic: "short-words", name: "Tiny Seeds" },
    { mechanic: "half-measure", name: "Half Measure" },
    { mechanic: "long-shadow", name: "Long Shadow" },
    { mechanic: "no-articles", name: "Pull the Weeds" },
  ],
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
export const WORLDS = [
  SANDY_SHORE,
  GLASS_REACH,
  THE_WRACKLINE,
  THE_LONG_PIER,
  HAUNTED_HEDGE,
];
export const worldFor = (id: string | null | undefined) =>
  WORLDS.find((world) => world.id === id) ?? SANDY_SHORE;
