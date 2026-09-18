import { expect, test } from "vitest";
import {
  ORIGIN_WORLD,
  canEnter,
  emptyAtlas,
  frontierFor,
  lastDate,
  previousDay,
  streakFromDates,
  atlasNodes,
  type AtlasProgress,
} from "./atlas";

const HEDGE = "haunted-hedge";
const SHORE = "sandy-shore",
  GLASS = "glass-reach",
  WRACK = "the-wrackline",
  GATE = "the-long-pier";
const progress = (over: Partial<AtlasProgress> = {}): AtlasProgress => ({
  ...emptyAtlas(),
  ...over,
});
const done = (...entries: [string, string][]): AtlasProgress =>
  progress({
    completed: Object.fromEntries(
      entries.map(([id, date]) => [id, { completedAt: 0, date }]),
    ),
  });

test("the frontier starts at the origin and grows outward one world at a time", () => {
  expect(frontierFor([])).toEqual([ORIGIN_WORLD]);
  expect(frontierFor([SHORE]).sort()).toEqual([GLASS, WRACK]);
  expect(frontierFor([SHORE, GLASS])).toEqual([WRACK]);
  expect(frontierFor([SHORE, WRACK])).toEqual([GLASS]);
  expect(frontierFor([SHORE, GLASS, WRACK])).toEqual([GATE]);
  // Clearing the Shallows Gate opens Region II, and nothing before it does.
  expect(frontierFor([SHORE, GLASS, WRACK, GATE])).toEqual([HEDGE]);
  expect(frontierFor([SHORE, GLASS, WRACK, GATE, HEDGE])).toEqual([]);
});

test("the Gate stays dark until every other world in the region is complete", () => {
  for (const partial of [[], [SHORE], [SHORE, GLASS], [SHORE, WRACK]])
    expect(frontierFor(partial)).not.toContain(GATE);
  expect(frontierFor([SHORE, GLASS, WRACK])).toContain(GATE);
});

test("Region II is unreachable until the Shallows Gate is complete", () => {
  // The Hedge must never be a Shallows frontier destination, at any point.
  for (const partial of [[], [SHORE], [SHORE, GLASS], [SHORE, GLASS, WRACK]]) {
    expect(frontierFor(partial)).not.toContain(HEDGE);
    expect(
      canEnter(
        HEDGE,
        done(...partial.map((id) => [id, "2026-03-01"] as [string, string])),
        "2026-03-09",
      ),
    ).toEqual({
      ok: false,
      reason: "region-locked",
    });
  }
  const cleared = done(
    [SHORE, "2026-03-01"],
    [GLASS, "2026-03-02"],
    [WRACK, "2026-03-03"],
    [GATE, "2026-03-04"],
  );
  expect(frontierFor(Object.keys(cleared.completed))).toEqual([HEDGE]);
  expect(canEnter(HEDGE, cleared, "2026-03-05")).toEqual({ ok: true });
  // It is still subject to the same one-a-day cadence once it opens.
  expect(canEnter(HEDGE, cleared, "2026-03-04")).toEqual({
    ok: false,
    reason: "played-today",
  });
});

test("a world is only enterable when it borders completed terrain", () => {
  const fresh = progress();
  expect(canEnter(SHORE, fresh, "2026-03-01")).toEqual({ ok: true });
  for (const id of [GLASS, WRACK])
    expect(canEnter(id, fresh, "2026-03-01")).toEqual({
      ok: false,
      reason: "not-adjacent",
    });
  expect(canEnter(GATE, fresh, "2026-03-01")).toEqual({
    ok: false,
    reason: "gate-locked",
  });
  expect(canEnter(HEDGE, fresh, "2026-03-01")).toEqual({
    ok: false,
    reason: "region-locked",
  });
  expect(canEnter("not-a-world", fresh, "2026-03-01")).toEqual({
    ok: false,
    reason: "not-in-atlas",
  });
});

test("finishing a world blocks the next one until the calendar day turns over", () => {
  const after = done([SHORE, "2026-03-01"]);
  expect(canEnter(GLASS, after, "2026-03-01")).toEqual({
    ok: false,
    reason: "played-today",
  });
  expect(canEnter(GLASS, after, "2026-03-02")).toEqual({ ok: true });
  // Finishing early buys nothing: the block is keyed on the date, not elapsed time.
  expect(canEnter(WRACK, after, "2026-03-01")).toEqual({
    ok: false,
    reason: "played-today",
  });
});

test("a part-finished world can be resumed the same day and on any later day", () => {
  const midway = progress({ activeWorld: SHORE });
  expect(canEnter(SHORE, midway, "2026-03-01")).toEqual({ ok: true });
  expect(canEnter(SHORE, midway, "2026-03-09")).toEqual({ ok: true });
  // Resuming is still allowed on a day another world was completed.
  const busy = progress({
    activeWorld: GLASS,
    completed: { [SHORE]: { completedAt: 0, date: "2026-03-01" } },
  });
  expect(canEnter(GLASS, busy, "2026-03-01")).toEqual({ ok: true });
});

test("a completed world is never re-enterable, so a locked entry is never re-judged", () => {
  const after = done([SHORE, "2026-03-01"]);
  expect(canEnter(SHORE, after, "2026-03-02")).toEqual({
    ok: false,
    reason: "completed",
  });
});

test("the streak counts consecutive days and a gap resets it without touching progress", () => {
  expect(streakFromDates([])).toBe(0);
  expect(streakFromDates(["2026-03-01"])).toBe(1);
  expect(streakFromDates(["2026-03-01", "2026-03-02", "2026-03-03"])).toBe(3);
  // A missed day only shortens the trailing run.
  expect(streakFromDates(["2026-03-01", "2026-03-02", "2026-03-09"])).toBe(1);
  expect(streakFromDates(["2026-03-01", "2026-03-08", "2026-03-09"])).toBe(2);
  // Two worlds finished on one date cannot inflate the count.
  expect(streakFromDates(["2026-03-01", "2026-03-01"])).toBe(1);
  expect(streakFromDates(["2026-03-02", "2026-03-01"])).toBe(2);
  expect(previousDay("2026-03-01")).toBe("2026-02-28");
  expect(previousDay("2026-01-01")).toBe("2025-12-31");
  expect(lastDate(["2026-03-01", "2026-03-09", "2026-02-02"])).toBe(
    "2026-03-09",
  );
});

test("a gap in play keeps every completed world and the frontier it earned", () => {
  const lapsed = done([SHORE, "2026-03-01"], [GLASS, "2026-03-02"]);
  const dates = Object.values(lapsed.completed).map((entry) => entry.date);
  expect(streakFromDates([...dates, "2026-04-20"])).toBe(1);
  expect(Object.keys(lapsed.completed).sort()).toEqual([GLASS, SHORE].sort());
  expect(frontierFor(Object.keys(lapsed.completed))).toEqual([WRACK]);
  expect(canEnter(WRACK, lapsed, "2026-04-20")).toEqual({ ok: true });
});

test("map nodes explain why each world is unavailable, including Region II", () => {
  const nodes = atlasNodes(done([SHORE, "2026-03-01"]), "2026-03-01");
  const at = (id: string) => nodes.find((node) => node.id === id)!;
  expect(at(SHORE).state).toBe("completed");
  expect(at(GLASS)).toMatchObject({ state: "locked", reason: "played-today" });
  expect(at(GATE)).toMatchObject({ state: "locked", reason: "gate-locked" });
  expect(at(GATE).detail).toContain("2 to go");
  expect(at(HEDGE)).toMatchObject({
    state: "locked",
    reason: "region-locked",
    inRun: false,
  });
  expect(at(HEDGE).detail).toContain("The Long Pier");
  const tomorrow = atlasNodes(done([SHORE, "2026-03-01"]), "2026-03-02");
  expect(tomorrow.find((node) => node.id === GLASS)!.state).toBe("open");
});
