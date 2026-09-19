import { createDevvitTest } from "@devvit/test/server/vitest";
import { redis } from "@devvit/web/server";
import { expect, vi } from "vitest";
import {
  GLASS_REACH,
  HAUNTED_HEDGE,
  SANDY_SHORE,
  THE_LONG_PIER,
  THE_WRACKLINE,
} from "../shared/worlds";
import { worldFor } from "../shared/worlds";
import { JUDGE_BUDGET_SCENARIO } from "../shared/shore";
import { referenceDraft } from "../shared/reference-solution";
import { recordCompletion } from "./atlas";
import {
  cellsFor,
  cellKey,
  DIRECTIONS,
  emptyPair,
  validatePair,
  type PairDraft,
  type Pair,
} from "../shared/shore";
import { createWorldGame, readShore, saveShore, submitShore } from "./shore";
import type { Dependencies } from "./game";
const test = createDevvitTest();
const hedge = createWorldGame(HAUNTED_HEDGE);
const glass = createWorldGame(GLASS_REACH);
// Region II opens only when the Shallows Gate closes. Recorded in the past so
// the one-a-day rule does not also block the Hedge session under test.
const openHedge = async (user: string) => {
  for (const world of [SANDY_SHORE, GLASS_REACH, THE_WRACKLINE, THE_LONG_PIER])
    await recordCompletion(user, world, Date.parse("2026-01-02T12:00:00Z"));
};
const yes = { validWord: true, fairClue: true, reason: "Fair definition." };
const deps = (): Dependencies => ({
  config: async () => ({ enabled: true, key: "test-placeholder" }),
  judge: vi.fn(async () => yes),
  now: Date.now,
});
const pair = (
  a: string,
  ac: string,
  ar: string,
  d: string,
  dc: string,
  dr: string,
): PairDraft => ({
  revealed: true,
  across: { word: a, clue: ac, criterion: ar },
  down: { word: d, clue: dc, criterion: dr },
});
const fixtures = [
  pair(
    "OWL",
    "Night hunter",
    "two-breaths",
    "GHOST",
    "Restless spirit",
    "no-b",
  ),
  pair(
    "GRANT",
    "Give as a favor",
    "brief",
    "TREES",
    "Tall woody plants",
    "no-e",
  ),
  pair(
    "TALES",
    "Stories that are told aloud by someone",
    "seven",
    "LILAC",
    "Purple perfumed shrub",
    "same-start",
  ),
  pair(
    "CAT",
    "Tiny pet, has paws",
    "short-words",
    "TOMB",
    "Stone burial chamber",
    "half-measure",
  ),
  pair(
    "CLIMB",
    "Ascend a steep mountainside",
    "long-shadow",
    "EPIC",
    "Grand heroic poem",
    "no-articles",
  ),
];
const shorePair = pair(
  "SAND",
  "Fine grains underfoot",
  "brief",
  "SNAIL",
  "Shelled crawler",
  "two-breaths",
);
const payload = (day = 0) => ({ ...fixtures[day]!, day });
test("Haunted Hedge has ten maximal paths and 33 connected cells in the approved silhouette", () => {
  const seen = new Set<string>(),
    totals: number[] = [];
  const completed: Pair[] = [];
  for (const [day, fixture] of fixtures.entries()) {
    expect(validatePair(fixture, completed, HAUNTED_HEDGE).issues).toEqual([]);
    const pairCells = DIRECTIONS.flatMap((d) =>
      cellsFor(day, d, HAUNTED_HEDGE).map(cellKey),
    );
    if (day) expect(pairCells.some((key) => seen.has(key))).toBe(true);
    pairCells.forEach((key) => seen.add(key));
    totals.push(seen.size);
    completed.push({ ...fixture, reviews: { across: yes, down: yes } });
  }
  expect(totals).toEqual([7, 15, 21, 26, 33]);
  const expected = [
    "XXXXX",
    "X...X",
    "XXX.X",
    "X.X.X",
    "XXXXX",
    "..X..",
    "X.XXX",
    "X...X",
    "X...X",
    "XXXXX",
  ];
  expect([...seen].sort()).toEqual(
    expected
      .flatMap((row, r) =>
        [...row].flatMap((v, c) => (v === "X" ? [`${r},${c}`] : [])),
      )
      .sort(),
  );
  for (const direction of DIRECTIONS) {
    const maximal = [];
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 5; c++) {
        if (
          !seen.has(`${r},${c}`) ||
          seen.has(direction === "across" ? `${r},${c - 1}` : `${r - 1},${c}`)
        )
          continue;
        let n = 0;
        while (
          seen.has(direction === "across" ? `${r},${c + n}` : `${r + n},${c}`)
        )
          n++;
        if (n > 1) maximal.push([r, c, n].join(","));
      }
    expect(maximal.sort()).toEqual(
      HAUNTED_HEDGE.days
        .map((day) =>
          [day[direction].row, day[direction].col, day[direction].length].join(
            ",",
          ),
        )
        .sort(),
    );
  }
});
test("all five hedge pairs save, review and restore independently of Sandy Shore", async () => {
  const d = deps();
  await saveShore("explorer", { ...shorePair, day: 0 });
  const original = await readShore("explorer");
  await openHedge("explorer");
  for (let day = 0; day < 5; day++) {
    const state = await hedge.submit("explorer", payload(day), d);
    expect(state.completed).toHaveLength(day + 1);
    expect(state.completed[day]!.across.criterion).toBe(
      fixtures[day]!.across.criterion,
    );
    expect(state.completed[day]!.down.criterion).toBe(
      fixtures[day]!.down.criterion,
    );
  }
  expect(d.judge).toHaveBeenCalledTimes(10);
  expect((await hedge.read("explorer")).turn).toBeNull();
  expect(await readShore("explorer")).toEqual(original);
  expect((await hedge.read("someone-else")).completed).toEqual([]);
});
test("world-specific geometry rejects a Shore-shaped pair before paid review", async () => {
  const d = deps();
  await openHedge("explorer");
  await expect(
    hedge.submit("explorer", { ...shorePair, day: 0 }, d),
  ).rejects.toThrow();
  expect(d.judge).not.toHaveBeenCalled();
  const draft = emptyPair();
  draft.revealed = true;
  draft.across.word = "O  ";
  draft.down.word = "  O  ";
  await hedge.save("explorer", {
    ...draft,
    day: 0,
    scenario: SANDY_SHORE.scenario,
    userId: "someone-else",
  });
  expect((await hedge.read("explorer")).turn?.down.word).toBe("  O  ");
  expect((await readShore("explorer")).turn?.revealed).toBe(false);
  expect((await hedge.read("someone-else")).turn?.revealed).toBe(false);
});
test("only one world is writable at a time, and the allowance is shared by all of them", async () => {
  const d = deps();
  const s = await submitShore("explorer", { ...shorePair, day: 0 }, d);
  expect(s.completed[0]?.across.word).toBe("SAND");
  // Sandy Shore is active and unfinished, so no other world accepts a write.
  await expect(hedge.submit("explorer", payload(), d)).rejects.toThrow(
    "later region",
  );
  await expect(
    glass.submit("explorer", referenceDraft(GLASS_REACH, 0), d),
  ).rejects.toThrow("not reachable yet");
  expect(d.judge).toHaveBeenCalledTimes(2);
  const day = new Date().toISOString().slice(0, 10);
  expect(
    await redis.get(`cq:${JUDGE_BUDGET_SCENARIO}:explorer:budget:${day}`),
  ).toBe("2");
  // Sandy Shore's own key must stay empty: the allowance namespace is pinned and
  // does not follow a world's scenario version.
  expect(
    await redis.get(`cq:${SANDY_SHORE.scenario}:explorer:budget:${day}`),
  ).toBeUndefined();
  expect(
    await redis.get(`cq:${HAUNTED_HEDGE.scenario}:explorer:budget:${day}`),
  ).toBeUndefined();
});
test("switching worlds cannot replenish a used paid review allowance", async () => {
  const d = deps(),
    day = new Date().toISOString().slice(0, 10);
  await openHedge("explorer");
  await redis.set(`cq:${JUDGE_BUDGET_SCENARIO}:explorer:budget:${day}`, "20");
  await expect(hedge.submit("explorer", payload(), d)).rejects.toThrow(
    "allowance",
  );
  expect(d.judge).not.toHaveBeenCalled();
  expect((await hedge.read("explorer")).completed).toHaveLength(0);
});
test("restarting the hedge leaves Shore and other accounts intact and rejects stale hedge writes", async () => {
  const d = deps();
  await submitShore("explorer", { ...shorePair, day: 0 }, d);
  const original = await readShore("explorer");
  await openHedge("explorer");
  await openHedge("friend");
  await hedge.save("explorer", payload());
  await hedge.save("friend", payload());
  const fresh = await hedge.reset("explorer", "crossworld_game_dev", {
    run: "initial",
  });
  expect(fresh.run).toBeTruthy();
  expect(fresh.turn?.revealed).toBe(false);
  expect(await readShore("explorer")).toEqual(original);
  expect((await hedge.read("friend")).turn?.across.word).toBe("OWL");
  await expect(hedge.save("explorer", payload())).rejects.toThrow("restarted");
  await expect(
    hedge.reset("explorer", "another_subreddit", { run: fresh.run }),
  ).rejects.toThrow("private playtest");
});
test("a partial hedge review retains both drafts without affecting Shore", async () => {
  const d = deps();
  await openHedge("explorer");
  d.judge = vi.fn(async (draft) =>
    draft.word === "OWL"
      ? yes
      : { ...yes, fairClue: false, reason: "Try a clearer clue." },
  );
  const result = await hedge.submit("explorer", payload(), d);
  expect(result.completed).toHaveLength(0);
  expect(result.turn?.reviews.across?.fairClue).toBe(true);
  expect(result.turn?.reviews.down?.fairClue).toBe(false);
  expect(result.turn?.down.word).toBe("GHOST");
  expect((await readShore("explorer")).turn?.reviews).toEqual({
    across: null,
    down: null,
  });
});
test("unknown client world names fall back to the existing shore", () => {
  expect(worldFor("haunted-hedge")).toBe(HAUNTED_HEDGE);
  expect(worldFor("unknown-world")).toBe(SANDY_SHORE);
  expect(worldFor(null)).toBe(SANDY_SHORE);
});
