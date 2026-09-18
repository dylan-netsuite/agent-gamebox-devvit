import { expect, test } from "vitest";
import { HAUNTED_HEDGE, THE_LONG_PIER, WORLDS } from "./worlds";
import { RESTRICTIONS } from "./rules";
import {
  DIRECTIONS,
  cellKey,
  cellsFor,
  validatePair,
  type Pair,
} from "./shore";
import { ATLAS_REGION, atlasWorlds, frontierFor } from "./atlas";

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
    // Cards are one-use within a world, matching the bible's deck sizing.
    const cards = discoveries.flatMap((d) => [d.across.card, d.down.card]);
    expect(new Set(cards).size).toBe(cards.length);
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

test("the Gate carries exactly one cross-discovery link, on the last letter of its second Down", () => {
  const world = THE_LONG_PIER;
  const owners = new Map<string, Set<number>>();
  world.days.forEach((_, day) => {
    for (const direction of DIRECTIONS)
      for (const cell of cellsFor(day, direction, world))
        owners.set(
          cellKey(cell),
          (owners.get(cellKey(cell)) ?? new Set()).add(day),
        );
  });
  const links = [...owners].filter(([, days]) => days.size > 1);
  expect(links).toHaveLength(1);
  const grain = cellsFor(1, "down", world).at(-1)!;
  expect(links[0]![0]).toBe(cellKey(grain));
  // GRAIN's N, inherited by CANOE — the one preview of Region II.
  expect(links[0]![1]).toEqual(new Set([1, 2]));
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

test("the Phase 1 slice routes four Shallows worlds and leaves the Hedge out of them", () => {
  // Worlds 4-7 of Region I (Gullery, Low Water, The Bell Buoy) are deliberately
  // not in this slice; they are pure data against the same verified spec.
  expect(atlasWorlds().map((world) => world.id)).toEqual([
    "sandy-shore",
    "glass-reach",
    "the-wrackline",
    "the-long-pier",
  ]);
  expect(HAUNTED_HEDGE.region).not.toBe(ATLAS_REGION);
  expect(HAUNTED_HEDGE.ordinal).toBe(8);
  for (const world of atlasWorlds())
    expect(world.neighbours).not.toContain(HAUNTED_HEDGE.id);
  // The Hedge can never surface as a Shallows frontier destination, at any
  // point in the run.
  const everyRoute = atlasWorlds().map((world) => world.id);
  for (let size = 0; size <= everyRoute.length; size++)
    expect(frontierFor(everyRoute.slice(0, size))).not.toContain(
      HAUNTED_HEDGE.id,
    );
});

test("atlas adjacency is symmetric and the Gate borders every world in its region", () => {
  for (const world of atlasWorlds())
    for (const id of world.neighbours) {
      const other = atlasWorlds().find((candidate) => candidate.id === id);
      expect(other, `${world.id} -> ${id}`).toBeDefined();
      expect(other!.neighbours).toContain(world.id);
    }
  const gate = atlasWorlds().find((world) => world.kind === "gate")!;
  expect(gate.id).toBe("the-long-pier");
  expect(new Set(gate.neighbours)).toEqual(
    new Set(
      atlasWorlds()
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
