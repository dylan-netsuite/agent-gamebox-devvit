import { createDevvitTest } from "@devvit/test/server/vitest";
import { redis } from "@devvit/web/server";
import { expect, vi } from "vitest";
import {
  readShore,
  saveShore,
  submitShore,
  resetShore,
  canResetShore,
} from "./shore";
import {
  DAYS,
  DIRECTIONS,
  JUDGE_BUDGET_SCENARIO,
  ROWS,
  COLS,
  cellsFor,
  cellKey,
  lettersFor,
  crossingsFor,
  validatePair,
  emptyPair,
  type PairDraft,
} from "../shared/shore";
import { SANDY_SHORE } from "../shared/worlds";
import { referenceDraft } from "../shared/reference-solution";
import { readJourney, saveJourney } from "./journey";
import { JudgeUnavailable } from "./judge";
import type { Dependencies } from "./game";
import type { Judgment } from "../shared/types";
const test = createDevvitTest();
const yes = { validWord: true, fairClue: true, reason: "Fair definition." };
const deps = () => ({
  config: vi.fn(async () => ({ enabled: true, key: "test-placeholder" })),
  judge: vi.fn<Dependencies["judge"]>(async () => yes),
  now: Date.now,
});
const pair = (
  across: string,
  acrossClue: string,
  acrossCriterion: string,
  down: string,
  downClue: string,
  downCriterion: string,
): PairDraft => ({
  revealed: true,
  across: { word: across, clue: acrossClue, criterion: acrossCriterion },
  down: { word: down, clue: downClue, criterion: downCriterion },
});
// Derived from the reference solution so geometry and deck changes flow through
// instead of pinning words and cards here. Players supply their own answers.
const fixtures: PairDraft[] = SANDY_SHORE.days.map((_, day) => {
  const { across, down } = referenceDraft(SANDY_SHORE, day);
  return { revealed: true, across, down };
});
test("unfinished tile drafts retain spatial crossing positions across save and reload", async () => {
  const draft = emptyPair();
  draft.revealed = true;
  // Day one crosses at across index 2 and down index 1.
  draft.down.word = " C   ";
  draft.across.word = "  D ";
  await saveShore("tile-draft", { ...draft, day: 0 });
  const loaded = await readShore("tile-draft");
  expect(loaded.turn?.down.word).toBe(" C   ");
  expect(crossingsFor(0, "across", [], loaded.turn!)).toEqual([
    { index: 2, letter: "C", fixed: false },
  ]);
  expect(crossingsFor(0, "down", [], loaded.turn!)).toEqual([
    { index: 1, letter: "D", fixed: false },
  ]);
});
const payload = (day: number, changes: Partial<PairDraft> = {}) => ({
  ...fixtures[day]!,
  ...changes,
  day,
});
async function expireReview(day = 0) {
  await redis.del(`cq:${SANDY_SHORE.scenario}:alice:day:${day}:reviewing`);
  for (const direction of DIRECTIONS)
    await redis.del(
      `cq:${SANDY_SHORE.scenario}:day:${day}:${direction}:alice:cooldown`,
    );
}
test("the reshaped shore has 16 tiles, four maximal paths and matching letters at both crossings", () => {
  // 1D SNAIL runs down into 2A SALTS, so the two discoveries share (5,2).
  const expected = [
    ".....",
    "..X..",
    "XXXX.",
    "..X..",
    "..X..",
    "XXXXX",
    "....X",
    "....X",
    "....X",
    "....X",
  ];
  const completed = fixtures.map((p) => ({
    ...p,
    reviews: { across: yes, down: yes },
  }));
  const board = lettersFor(completed);
  expect(board.size).toBe(16);
  for (let row = 0; row < ROWS; row++)
    expect(
      Array.from({ length: COLS }, (_, col) =>
        board.has(`${row},${col}`) ? "X" : ".",
      ).join(""),
    ).toBe(expected[row]);
  const found: string[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++)
      for (const direction of DIRECTIONS) {
        const dr = direction === "down" ? 1 : 0,
          dc = direction === "across" ? 1 : 0;
        if (!board.has(`${row},${col}`) || board.has(`${row - dr},${col - dc}`))
          continue;
        let word = "",
          r = row,
          c = col;
        while (board.has(`${r},${c}`)) {
          word += board.get(`${r},${c}`);
          r += dr;
          c += dc;
        }
        if (word.length > 1) found.push(word);
      }
  expect(found.sort()).toEqual(
    fixtures.flatMap((p) => DIRECTIONS.map((d) => p[d].word)).sort(),
  );
  for (let day = 0; day < DAYS.length; day++)
    expect(
      validatePair(fixtures[day]!, completed.slice(0, day)).issues,
    ).toEqual([]);
});
test("both discoveries accept their clues, retain independent criteria, and survive a new read", async () => {
  const d = deps();
  expect(await readShore("alice")).toEqual({
    completed: [],
    turn: emptyPair(),
  });
  for (let day = 0; day < DAYS.length; day++) {
    const state = await submitShore("alice", payload(day), d);
    expect(state.completed).toHaveLength(day + 1);
    expect(state.turn).toEqual(day === DAYS.length - 1 ? null : emptyPair());
  }
  expect(d.judge).toHaveBeenCalledTimes(DAYS.length * 2);
  const done = await readShore("alice");
  expect(done.completed.map((p) => p.across.word)).toEqual(
    fixtures.map((p) => p.across.word),
  );
  expect(done.completed[0]?.across.criterion).toBe("brief");
  expect(done.completed[0]?.down.criterion).toBe(fixtures[0]!.down.criterion);
  expect(done.turn).toBeNull();
  expect((await readShore("bob")).completed).toHaveLength(0);
});
test("future turns, malformed payloads, wrong lengths and companion conflicts fail before paid review", async () => {
  const d = deps();
  for (const raw of [
    payload(0, { across: { ...fixtures[0]!.across, word: "GRAINS" } }),
    payload(0, { down: { ...fixtures[0]!.down, word: "BANANA" } }),
    payload(0, { down: { ...fixtures[0]!.down, criterion: "invented" } }),
    { ...payload(0), day: 1.5 },
    { ...payload(0), day: 9 },
    payload(0, { revealed: false }),
  ])
    await expect(submitShore("alice", raw, d)).rejects.toThrow();
  await expect(submitShore("alice", payload(1), d)).rejects.toThrow(
    "Complete both clues",
  );
  await expect(saveShore("alice", payload(1))).rejects.toThrow(
    "Complete both clues",
  );
  expect(d.judge).not.toHaveBeenCalled();
});
test("every crossing with earlier days and the companion word is validated, not just the first", async () => {
  const d = deps();
  for (let day = 0; day < DAYS.length - 1; day++)
    await submitShore("alice", payload(day), d);
  const completed = (await readShore("alice")).completed;
  const last = DAYS.length - 1;
  const current = fixtures[last]!;
  expect(validatePair(current, completed).issues).toEqual([]);
  const shared = new Map<string, number>();
  for (let day = 0; day < DAYS.length; day++)
    for (const direction of DIRECTIONS)
      for (const cell of cellsFor(day, direction))
        shared.set(cellKey(cell), (shared.get(cellKey(cell)) ?? 0) + 1);
  for (const direction of DIRECTIONS)
    for (const [i, cell] of cellsFor(last, direction).entries()) {
      if (shared.get(cellKey(cell)) !== 2) continue;
      const word = current[direction].word.split("");
      word[i] = word[i] === "Z" ? "Q" : "Z";
      const wrong = {
        ...current,
        [direction]: { ...current[direction], word: word.join("") },
      };
      expect(validatePair(wrong, completed).issues.length).toBeGreaterThan(0);
      await expect(
        submitShore("alice", { ...wrong, day: last }, d),
      ).rejects.toThrow("must be");
    }
  expect(d.judge).toHaveBeenCalledTimes((DAYS.length - 1) * 2);
});
test("a partial pass remains editable, reloads both reviews, and reuses the unchanged successful review on retry", async () => {
  const d = deps();
  d.judge.mockImplementation(async (draft) =>
    draft.word === "SNAIL"
      ? { validWord: true, fairClue: false, reason: "Clarify this clue." }
      : yes,
  );
  const first = await submitShore("alice", payload(0), d);
  expect(first.completed).toHaveLength(0);
  expect(first.turn?.reviews.across).toEqual(yes);
  expect(first.turn?.reviews.down?.fairClue).toBe(false);
  expect((await readShore("alice")).turn?.reviews).toEqual(first.turn?.reviews);
  await expireReview();
  d.judge.mockResolvedValue(yes);
  const revised = payload(0, {
    down: { ...fixtures[0]!.down, clue: "Slow bug on a leaf" },
  });
  expect((await submitShore("alice", revised, d)).completed).toHaveLength(1);
  expect(d.judge).toHaveBeenCalledTimes(3);
});
test("one provider failure cannot advance or lock the other word, and all provider calls settle before return", async () => {
  const d = deps();
  d.judge.mockImplementation(async (draft) => {
    if (draft.word === "SNAIL") throw new JudgeUnavailable();
    return yes;
  });
  await expect(submitShore("alice", payload(0), d)).rejects.toThrow(
    "unavailable",
  );
  const state = await readShore("alice");
  expect(state.completed).toHaveLength(0);
  expect(state.turn?.reviews.across).toEqual(yes);
  expect(state.turn?.down.word).toBe("SNAIL");
  expect(state.turn?.reviews.down).toBeNull();
  await expireReview();
  d.judge.mockResolvedValue(yes);
  expect((await submitShore("alice", payload(0), d)).completed).toHaveLength(1);
  expect(d.judge).toHaveBeenCalledTimes(3);
});
test("concurrent pairs, duplicate submits and late saves cannot mix answers or award twice", async () => {
  const d = deps();
  const releases: ((j: Judgment) => void)[] = [];
  d.judge.mockImplementation(
    () =>
      new Promise((resolve) => {
        releases.push(resolve);
      }),
  );
  const first = submitShore("alice", payload(0), d);
  await vi.waitFor(() => expect(d.judge).toHaveBeenCalledTimes(2));
  await expect(submitShore("alice", payload(0), d)).rejects.toThrow(
    "45 seconds",
  );
  await saveShore(
    "alice",
    payload(0, { across: { ...fixtures[0]!.across, word: "DUNE" } }),
  );
  releases.forEach((release) => release(yes));
  expect((await first).completed[0]?.across.word).toBe("SAND");
  await saveShore("alice", payload(1));
  for (const write of [saveShore, submitShore]) {
    const state = await write(
      "alice",
      { ...payload(0), status: "accepted" },
      d,
    );
    expect(state.completed).toHaveLength(1);
    expect(state.turn?.across.word).toBe("SALTS");
  }
  expect(d.judge).toHaveBeenCalledTimes(2);
});
test("drafts strip forged awards and stay isolated from the earlier seven-word scenario", async () => {
  const d = deps();
  const legacy = {
    path: 0,
    revealed: true,
    restriction: "brief",
    word: "LAMPS",
    clue: "Lights on tables",
  };
  await saveJourney("alice", legacy);
  await saveShore("alice", {
    ...payload(0),
    reviews: { across: yes, down: yes },
    completed: [payload(0)],
    userId: "bob",
  });
  const state = await readShore("alice");
  expect(state.completed).toEqual([]);
  expect(state.turn?.reviews).toEqual({ across: null, down: null });
  expect((await readShore("bob")).turn).toEqual(emptyPair());
  expect((await readJourney("alice")).turn?.word).toBe("LAMPS");
  expect(d.judge).not.toHaveBeenCalled();
});
test("both clues count toward the shared daily allowance and disabled judging never awards a pair", async () => {
  const d = deps();
  await submitShore("alice", payload(0), d);
  const key = `cq:${JUDGE_BUDGET_SCENARIO}:alice:budget:${new Date().toISOString().slice(0, 10)}`;
  expect(await redis.get(key)).toBe("2");
  await redis.set(key, "20");
  await expect(submitShore("alice", payload(1), d)).rejects.toThrow(
    "20-review allowance",
  );
  expect(d.judge).toHaveBeenCalledTimes(2);
  expect((await readShore("alice")).completed).toHaveLength(1);
  const off = deps();
  off.config.mockResolvedValue({ enabled: false, key: "" });
  await expect(submitShore("bob", payload(0), off)).rejects.toThrow(
    "unavailable",
  );
  expect(off.judge).not.toHaveBeenCalled();
  expect((await readShore("bob")).completed).toHaveLength(0);
});
test("private restart clears only the caller's map and preserves legacy progress, verdicts and paid budgets", async () => {
  const d = deps();
  await submitShore("alice", payload(0), d);
  await submitShore("bob", payload(0), d);
  await saveJourney("alice", {
    path: 0,
    revealed: true,
    restriction: "brief",
    word: "LAMPS",
    clue: "Lights on tables",
  });
  const old = await readShore("bob");
  const fresh = await resetShore("alice", "crossworld_game_dev", {
    run: "initial",
    userId: "bob",
  });
  expect(fresh.run).toBeTruthy();
  expect(fresh.completed).toEqual([]);
  expect(fresh.turn).toEqual(emptyPair());
  expect(await readShore("alice")).toEqual(fresh);
  expect(await readShore("bob")).toEqual(old);
  expect((await readJourney("alice")).turn?.word).toBe("LAMPS");
  const budget = `cq:${JUDGE_BUDGET_SCENARIO}:alice:budget:${new Date().toISOString().slice(0, 10)}`;
  expect(await redis.get(budget)).toBe("2");
  await expireReview();
  const accepted = await submitShore(
    "alice",
    { ...payload(0), run: fresh.run },
    d,
  );
  expect(accepted.completed).toHaveLength(1);
  expect(accepted.run).toBe(fresh.run);
  expect(d.judge).toHaveBeenCalledTimes(4); // Same Alice clues reuse their verdicts after restart.
  expect(await redis.get(budget)).toBe("2");
});
test("restart rejects missing identity, other installations, stale requests and repeat clicks", async () => {
  expect(canResetShore(undefined, "crossworld_game_dev")).toBe(false);
  expect(canResetShore("alice", "another_subreddit")).toBe(false);
  await expect(
    resetShore(undefined, "crossworld_game_dev", { run: "initial" }),
  ).rejects.toThrow();
  await expect(
    resetShore("alice", "another_subreddit", { run: "initial" }),
  ).rejects.toThrow("private playtest");
  await expect(resetShore("alice", "crossworld_game_dev", {})).rejects.toThrow(
    "already changed",
  );
  const attempts = await Promise.allSettled([
    resetShore("alice", "crossworld_game_dev", { run: "initial" }),
    resetShore("alice", "crossworld_game_dev", { run: "initial" }),
  ]);
  expect(attempts.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const fresh = await readShore("alice");
  await expect(
    resetShore("alice", "crossworld_game_dev", { run: "initial" }),
  ).rejects.toThrow("already changed");
  await expect(
    resetShore("alice", "crossworld_game_dev", { run: fresh.run }),
  ).rejects.toThrow("45 seconds");
  expect(await readShore("alice")).toEqual(fresh);
});
test("a restarted board rejects stale saves and paid submissions, including older clients", async () => {
  const d = deps();
  await saveShore("alice", payload(0));
  const fresh = await resetShore("alice", "crossworld_game_dev", {
    run: "initial",
  });
  await expect(saveShore("alice", payload(0))).rejects.toThrow("restarted");
  await expect(
    submitShore("alice", { ...payload(0), run: "initial" }, d),
  ).rejects.toThrow("restarted");
  expect(d.judge).not.toHaveBeenCalled();
  expect(await readShore("alice")).toEqual(fresh);
  await saveShore("alice", { ...payload(0), run: fresh.run });
  expect((await readShore("alice")).turn?.across.word).toBe("SAND");
});
test("a review already in flight cannot repopulate the fresh board", async () => {
  const d = deps(),
    releases: ((j: Judgment) => void)[] = [];
  d.judge.mockImplementation(
    () => new Promise((resolve) => releases.push(resolve)),
  );
  const pending = submitShore("alice", payload(0), d);
  await vi.waitFor(() => expect(d.judge).toHaveBeenCalledTimes(2));
  const fresh = await resetShore("alice", "crossworld_game_dev", {
    run: "initial",
  });
  releases.forEach((resolve) => resolve(yes));
  expect(await pending).toEqual(fresh);
  expect(await readShore("alice")).toEqual(fresh);
});
