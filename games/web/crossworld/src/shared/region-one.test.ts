import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import {
  GLASS_REACH,
  HAUNTED_HEDGE,
  SANDY_SHORE,
  THE_LONG_PIER,
  THE_WRACKLINE,
  WORLDS,
} from "./worlds";
import { RESTRICTIONS } from "./rules";
import {
  DIRECTIONS,
  cellKey,
  cellsFor,
  validatePair,
  type Pair,
} from "./shore";
import { ATLAS_REGION, atlasWorlds, frontierFor } from "./atlas";
import { deckFor } from "./shore";

/** The measured region. Every world is routed; only these are counted. */
const shallows = () =>
  atlasWorlds().filter((world) => world.region === ATLAS_REGION);

import {
  REFERENCE_CLUES as clues,
  REGION_ONE as spec,
  referenceDraft,
} from "./reference-solution";

test.each(spec)(
  "$world.name matches the verified grid spec and every pair crosses once",
  ({ world, discoveries }) => {
    expect(world.days).toHaveLength(discoveries.length);
    const letters = new Map<string, string>();
    const owners = new Map<string, Set<number>>();
    discoveries.forEach((discovery, day) => {
      const shipped = world.days[day]!;
      expect(shipped.place).toBe(discovery.place);
      for (const direction of DIRECTIONS) {
        const slot = discovery[direction];
        // 1-based spec, 0-based data.
        expect(shipped[direction]).toEqual({
          row: slot.row - 1,
          col: slot.col - 1,
          length: slot.word.length,
        });
        expect(RESTRICTIONS.some((card) => card.id === slot.card)).toBe(true);
        cellsFor(day, direction, world).forEach((cell, index) => {
          expect(cell.row).toBeGreaterThanOrEqual(0);
          expect(cell.col).toBeGreaterThanOrEqual(0);
          expect(cell.row).toBeLessThan(world.rows);
          expect(cell.col).toBeLessThan(world.cols);
          const key = cellKey(cell),
            letter = slot.word[index]!;
          // Two slots may share a cell only if they agree on the letter.
          expect(letters.get(key) ?? letter).toBe(letter);
          letters.set(key, letter);
          owners.set(key, (owners.get(key) ?? new Set()).add(day));
        });
      }
      const shared = cellsFor(day, "across", world)
        .map(cellKey)
        .filter((key) =>
          cellsFor(day, "down", world).map(cellKey).includes(key),
        );
      expect(shared).toHaveLength(1);
      const [row, col, letter] = discovery.cross.split(",");
      expect(shared[0]).toBe(`${Number(row) - 1},${Number(col) - 1}`);
      expect(letters.get(shared[0]!)).toBe(letter);
    });
    // The deck is exactly the size of the world and every card is one-use, so a
    // completed world consumes its deck precisely once.
    const cards = discoveries.flatMap((d) => [d.across.card, d.down.card]);
    expect(new Set(cards).size).toBe(cards.length);
    const deck = deckFor(world);
    // A world deals more than it needs, so declining a card is a real choice.
    expect(deck.length).toBeGreaterThan(world.days.length * 2);
    expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
    for (const card of cards)
      expect(deck.map((entry) => entry.id)).toContain(card);
    // No maximal run of two or more cells may exist that is not a declared slot.
    const declared = new Set(
      world.days.flatMap((day, index) =>
        DIRECTIONS.map(
          (direction) =>
            `${direction}:${cellsFor(index, direction, world).map(cellKey).join("|")}`,
        ),
      ),
    );
    for (const direction of DIRECTIONS)
      for (const key of letters.keys()) {
        const [r, c] = key.split(",").map(Number) as [number, number];
        const back = direction === "across" ? `${r},${c - 1}` : `${r - 1},${c}`;
        if (letters.has(back)) continue;
        const run: string[] = [];
        for (let n = 0; ; n++) {
          const next =
            direction === "across" ? `${r},${c + n}` : `${r + n},${c}`;
          if (!letters.has(next)) break;
          run.push(next);
        }
        if (run.length > 1)
          expect(declared).toContain(`${direction}:${run.join("|")}`);
      }
  },
);

/** Letters a turn inherits from any strictly earlier turn in the same world. */
const preLocked = (world: (typeof WORLDS)[number]) => {
  const seen = new Set<string>();
  let total = 0;
  world.days.forEach((_, day) => {
    const mine = new Set(
      DIRECTIONS.flatMap((direction) =>
        cellsFor(day, direction, world).map(cellKey),
      ),
    );
    for (const key of mine) if (seen.has(key)) total++;
    for (const key of mine) seen.add(key);
  });
  return total;
};

test("a carried letter always lands where any letter can work", () => {
  // The seed is whatever the player chose in an earlier world, so it may be a
  // rare one. Index 0 of a slot is the only position where that is always
  // workable: a word-initial constraint never strands a slot the way a fixed
  // interior or final letter can.
  for (const world of WORLDS)
    for (const seed of world.seeds ?? []) {
      const key = `${seed.row},${seed.col}`;
      const slots = world.days
        .flatMap((_, day) =>
          DIRECTIONS.map((direction) =>
            cellsFor(day, direction, world).map(cellKey),
          ),
        )
        .filter((cells) => cells.includes(key));
      expect(
        slots.length,
        `${world.id} seeds an unused cell ${key}`,
      ).toBeGreaterThan(0);
      for (const cells of slots)
        expect(cells.indexOf(key), `${world.id} seeds ${key} mid-slot`).toBe(0);
    }
});

test("Region I escalates: every world locks more letters than the one before", () => {
  // Playtest finding: the three open worlds were the same size and shared no
  // letters between turns, so nothing got harder until the Gate. Inherited
  // letters are the difficulty lever in a construction game, so they now ramp.
  const order = [SANDY_SHORE, GLASS_REACH, THE_WRACKLINE, THE_LONG_PIER];
  expect(order.map(preLocked)).toEqual([1, 2, 3, 4]);
  expect(order.map((world) => world.days.length * 2)).toEqual([4, 4, 6, 8]);
  // Region II still steps up from the Gate rather than repeating it.
  expect(preLocked(HAUNTED_HEDGE)).toBeGreaterThan(preLocked(THE_LONG_PIER));
  expect(HAUNTED_HEDGE.days.length * 2).toBeGreaterThan(
    THE_LONG_PIER.days.length * 2,
  );
});

test("no world hands a player a turn with nothing left to choose", () => {
  // A turn whose letters are almost all decided stops being a choice. The Hedge
  // peak is three locked letters in a five-cell word; nothing may exceed it,
  // and every turn must keep at least two free cells. Carried letters count:
  // they are decided before the player arrives, exactly like an inherited
  // crossing, and they are the easiest way to over-constrain a gate by accident.
  for (const world of WORLDS) {
    const carried = new Set(
      (world.seeds ?? []).map((seed) => `${seed.row},${seed.col}`),
    );
    const seen = new Set<string>();
    world.days.forEach((_, day) => {
      for (const direction of DIRECTIONS) {
        const cells = cellsFor(day, direction, world).map(cellKey);
        const inherited = cells.filter(
          (key) => seen.has(key) || carried.has(key),
        ).length;
        expect(inherited).toBeLessThanOrEqual(3);
        expect(cells.length - inherited).toBeGreaterThanOrEqual(2);
      }
      for (const direction of DIRECTIONS)
        for (const key of cellsFor(day, direction, world).map(cellKey))
          seen.add(key);
    });
  }
});

test.each(spec)(
  "$world.name accepts its reference solution through the real validator",
  ({ world, discoveries }) => {
    const completed: Pair[] = [];
    discoveries.forEach((_, day) => {
      const draft = referenceDraft(world, day);
      expect(validatePair(draft, completed, world).issues).toEqual([]);
      completed.push({
        ...draft,
        reviews: {
          across: { validWord: true, fairClue: true, reason: "ok" },
          down: { validWord: true, fairClue: true, reason: "ok" },
        },
      });
    });
  },
);

test("the Phase 1 slice routes four Shallows worlds and gates the Hedge behind them", () => {
  // Worlds 4-7 of Region I (Gullery, Low Water, The Bell Buoy) are deliberately
  // not in this slice; they are pure data against the same verified spec.
  expect(shallows().map((world) => world.id)).toEqual([
    "sandy-shore",
    "glass-reach",
    "the-wrackline",
    "the-long-pier",
  ]);
  expect(HAUNTED_HEDGE.region).not.toBe(ATLAS_REGION);
  expect(HAUNTED_HEDGE.ordinal).toBe(8);
  for (const world of shallows())
    expect(world.neighbours).not.toContain(HAUNTED_HEDGE.id);
  // The Hedge is never a Shallows frontier destination: it appears only once
  // the Gate itself is complete, never as one of the region's own choices.
  const route = shallows().map((world) => world.id);
  for (let size = 0; size < route.length; size++)
    expect(frontierFor(route.slice(0, size))).not.toContain(HAUNTED_HEDGE.id);
  expect(frontierFor(route)).toEqual([HAUNTED_HEDGE.id]);
});

test("atlas adjacency is symmetric and the Gate borders every world in its region", () => {
  for (const world of shallows())
    for (const id of world.neighbours) {
      const other = shallows().find((candidate) => candidate.id === id);
      expect(other, `${world.id} -> ${id}`).toBeDefined();
      expect(other!.neighbours).toContain(world.id);
    }
  const gate = shallows().find((world) => world.kind === "gate")!;
  expect(gate.id).toBe("the-long-pier");
  expect(new Set(gate.neighbours)).toEqual(
    new Set(
      shallows()
        .filter((world) => world.kind !== "gate")
        .map((world) => world.id),
    ),
  );
});

test("every world's paths fit its own grid and world ids stay unique", () => {
  expect(new Set(WORLDS.map((world) => world.id)).size).toBe(WORLDS.length);
  expect(new Set(WORLDS.map((world) => world.scenario)).size).toBe(
    WORLDS.length,
  );
  for (const world of WORLDS)
    world.days.forEach((_, day) => {
      for (const direction of DIRECTIONS)
        for (const cell of cellsFor(day, direction, world)) {
          expect(cell.row).toBeLessThan(world.rows);
          expect(cell.col).toBeLessThan(world.cols);
        }
    });
  // The Gate stays the tallest board in the slice; anything beyond 13 rows does
  // not fit the mobile overview at a usable tile size.
  expect(Math.max(...WORLDS.map((world) => world.rows))).toBe(13);
});

test("no two worlds share an atlas cell, so map cards cannot be placed on top of each other", () => {
  // The map places each card with CSS grid-row/grid-column taken straight from
  // these coordinates, so unique cells make overlap structurally impossible at
  // any viewport. Rendered geometry is verified separately in a browser.
  const cells = WORLDS.map((world) => `${world.atlas.x},${world.atlas.y}`);
  expect(new Set(cells).size).toBe(WORLDS.length);
  for (const world of WORLDS) {
    expect(world.atlas.x).toBeGreaterThanOrEqual(0);
    expect(world.atlas.y).toBeGreaterThanOrEqual(0);
  }
});

test("every world's grid shape has a literal aspect-ratio in the stylesheet", () => {
  // A board whose aspect-ratio does not resolve collapses to zero height, and
  // because #scenery is overflow:visible the art and letters keep painting while
  // every tile vanishes — a silent failure. Known-good engines resolve the
  // var() form, so this pins the literal form as defence in depth, and catches
  // a new world being added without a ratio at all.
  const css = readFileSync(
    new URL("../client/style.css", import.meta.url),
    "utf8",
  );
  expect(css).not.toMatch(/aspect-ratio:\s*var\([^)]*\)\s*\/\s*var\(/);
  const base = css.match(/\.map \{[\s\S]*?aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/);
  expect(base, "base .map aspect-ratio").not.toBeNull();
  const declared = new Map<string, string>([
    ["default", `${base![1]}/${base![2]}`],
  ]);
  for (const m of css.matchAll(
    /:root\[data-world="([^"]+)"\] \.map \{\s*aspect-ratio:\s*(\d+)\s*\/\s*(\d+)/g,
  ))
    declared.set(m[1]!, `${m[2]}/${m[3]}`);
  for (const world of WORLDS) {
    const want = `${world.cols}/${world.rows}`;
    const got = declared.get(world.id) ?? declared.get("default");
    expect(got, `${world.id} (${world.rows}x${world.cols}) aspect-ratio`).toBe(
      want,
    );
  }
});
