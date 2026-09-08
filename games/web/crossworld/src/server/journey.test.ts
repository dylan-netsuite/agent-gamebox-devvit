import { createDevvitTest } from "@devvit/test/server/vitest";
import { redis } from "@devvit/web/server";
import { expect, vi } from "vitest";
import { readJourney, saveJourney, submitJourney } from "./journey";
import {
  JOURNEY_SCENARIO,
  MAP_SIZE,
  PATHS,
  cellsFor,
  crossingFor,
} from "../shared/journey";
import { saveDraft, submit } from "./game";
import type { Judgment } from "../shared/types";
const test = createDevvitTest();
const yes = { validWord: true, fairClue: true, reason: "Fair definition." };
const deps = () => ({
  config: vi.fn(async () => ({ enabled: true, key: "test-placeholder" })),
  judge: vi.fn(async () => yes),
  now: Date.now,
});
const drafts = [
  {
    path: 0,
    revealed: true,
    restriction: "brief",
    word: "LAMPS",
    clue: "Lights on tables",
  },
  {
    path: 1,
    revealed: true,
    restriction: "no-articles",
    word: "CAMEL",
    clue: "Humped desert traveler",
  },
  {
    path: 2,
    revealed: true,
    restriction: "no-b",
    word: "PETAL",
    clue: "One part of a flower",
  },
  {
    path: 3,
    revealed: true,
    restriction: "no-e",
    word: "CLOUD",
    clue: "Sky's cotton puff",
  },
  {
    path: 4,
    revealed: true,
    restriction: "seven",
    word: "PEACH",
    clue: "Soft fuzzy fruit with one large stone",
  },
  {
    path: 5,
    revealed: true,
    restriction: "short-words",
    word: "BENCH",
    clue: "Long seat in a park",
  },
  {
    path: 6,
    revealed: true,
    restriction: "same-start",
    word: "TEETH",
    clue: "Tools that tear food",
  },
] as const;
test("fresh journey is blank and every new path crosses an immutable previous letter", async () => {
  const d = deps();
  expect(await readJourney("alice")).toMatchObject({
    completed: [],
    turn: { revealed: false, word: "" },
  });
  for (const draft of drafts) {
    const journey = await submitJourney("alice", draft, d);
    expect(journey.completed).toHaveLength(draft.path + 1);
    expect(journey.turn).toEqual(
      draft.path === PATHS.length - 1
        ? null
        : expect.objectContaining({ revealed: false, word: "" }),
    );
  }
  expect(d.judge).toHaveBeenCalledTimes(7);
  const done = await readJourney("alice");
  expect(done.completed.map((t) => t.word)).toEqual([
    "LAMPS",
    "CAMEL",
    "PETAL",
    "CLOUD",
    "PEACH",
    "BENCH",
    "TEETH",
  ]);
  expect(done.turn).toBeNull();
  expect((await readJourney("bob")).completed).toHaveLength(0);
});
test("future paths, wrong crossing letters and reused rules cannot call the judge", async () => {
  const d = deps();
  await expect(submitJourney("alice", drafts[1], d)).rejects.toThrow(
    "Complete the open path",
  );
  await expect(saveJourney("alice", drafts[2])).rejects.toThrow(
    "Complete the open path",
  );
  await submitJourney("alice", drafts[0], d);
  await expect(
    submitJourney("alice", { ...drafts[1], word: "TIGER" }, d),
  ).rejects.toThrow("Letter 3 must be M");
  await expect(
    submitJourney("alice", { ...drafts[1], restriction: "brief" }, d),
  ).rejects.toThrow("already been used");
  expect(d.judge).toHaveBeenCalledTimes(1);
});
test("late writes and duplicate submits preserve accepted paths and next-path drafts", async () => {
  const d = deps();
  await submitJourney("alice", drafts[0], d);
  await saveJourney("alice", drafts[1]);
  for (const write of [saveJourney, submitJourney]) {
    const state = await write(
      "alice",
      { ...drafts[0], word: "FORGE", status: "accepted" },
      d,
    );
    expect(state.completed[0]?.word).toBe("LAMPS");
    expect(state.turn?.word).toBe("CAMEL");
  }
  expect(d.judge).toHaveBeenCalledTimes(1);
});
test("forged status does not reveal scenery and negative reviews consume nothing", async () => {
  const d = deps();
  d.judge.mockResolvedValue({
    validWord: true,
    fairClue: false,
    reason: "Try a clearer meaning.",
  });
  await saveJourney("alice", { ...drafts[0], status: "accepted", review: yes });
  const state = await submitJourney("alice", drafts[0], d);
  expect(state.completed).toHaveLength(0);
  expect(state.turn).toMatchObject({
    status: "editing",
    review: { fairClue: false },
  });
  await submitJourney("alice", drafts[0], d);
  expect(d.judge).toHaveBeenCalledTimes(1);
});
test("journey shares one user budget across paths and preserves older scenario records", async () => {
  const d = deps();
  await saveDraft("alice", drafts[0]);
  await submit("alice", drafts[0], d);
  expect((await readJourney("alice")).completed).toHaveLength(0);
  await submitJourney("alice", drafts[0], d);
  const day = new Date().toISOString().slice(0, 10);
  const key = `cq:${JOURNEY_SCENARIO}:alice:budget:${day}`;
  expect(await redis.get(key)).toBe("1");
  await redis.set(key, "20");
  await expect(submitJourney("alice", drafts[1], d)).rejects.toThrow(
    "20-review allowance",
  );
  expect((await readJourney("alice")).completed).toHaveLength(1);
  expect(d.judge).toHaveBeenCalledTimes(2);
});
test("concurrent submissions and a stale draft cannot double-award or lose the winning word", async () => {
  const d = deps();
  let release!: (v: Judgment) => void;
  d.judge.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const first = submitJourney("alice", drafts[0], d);
  await vi.waitFor(() => expect(d.judge).toHaveBeenCalledTimes(1));
  await saveJourney("alice", { ...drafts[0], word: "OTHER" });
  await expect(submitJourney("alice", drafts[0], d)).rejects.toThrow(
    "45 seconds",
  );
  release(yes);
  expect((await first).completed[0]?.word).toBe("LAMPS");
  expect((await readJourney("alice")).completed).toHaveLength(1);
});
test("the seven routes form one connected crossword with no incidental touching words", () => {
  const occupied = new Map<string, string>();
  for (const d of drafts)
    for (const [i, cell] of cellsFor(d.path).entries()) {
      const key = `${cell.row},${cell.col}`;
      if (occupied.has(key)) expect(occupied.get(key)).toBe(d.word[i]);
      occupied.set(key, d.word[i]!);
    }
  expect(occupied.size).toBe(29); // Thirty-five letters share exactly six cells.
  const runs: string[] = [];
  for (let r = 0; r < MAP_SIZE; r++)
    for (let c = 0; c < MAP_SIZE; c++)
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
      ] as const) {
        if (!occupied.has(`${r},${c}`) || occupied.has(`${r - dr},${c - dc}`))
          continue;
        let word = "",
          row = r,
          col = c;
        while (occupied.has(`${row},${col}`)) {
          word += occupied.get(`${row},${col}`);
          row += dr;
          col += dc;
        }
        if (word.length > 1) runs.push(word);
      }
  expect(runs.sort()).toEqual(drafts.map((d) => d.word).sort());
});

test("each path crosses its actual predecessor even when the map branches", () => {
  const accepted = drafts.map((d) => ({
    ...d,
    status: "accepted" as const,
    review: yes,
  }));
  expect(crossingFor([])).toBeNull();
  expect(
    accepted.slice(1).map((_, i) => crossingFor(accepted.slice(0, i + 1))),
  ).toEqual([
    { source: 0, index: 2, letter: "M" },
    { source: 1, index: 4, letter: "L" },
    { source: 1, index: 0, letter: "C" },
    { source: 2, index: 1, letter: "E" },
    { source: 4, index: 3, letter: "C" },
    { source: 5, index: 1, letter: "E" },
  ]);
  expect(crossingFor(accepted)).toBeNull();
});

test("fresh seven-word board preserves the earlier three-word record and ends only at seven", async () => {
  const oldKey = "cq:chatterbloom-paths-v1:path:0:alice:accepted";
  const old = JSON.stringify({ ...drafts[0], status: "accepted", review: yes });
  await redis.set(oldKey, old);
  expect((await readJourney("alice")).completed).toHaveLength(0);
  const d = deps();
  for (const draft of drafts) await submitJourney("alice", draft, d);
  const final = await readJourney("alice");
  expect(final.completed).toHaveLength(7);
  expect(new Set(final.completed.map((t) => t.restriction)).size).toBe(7);
  expect(final.turn).toBeNull();
  await expect(
    submitJourney("alice", { ...drafts[0], path: 7 }, d),
  ).rejects.toThrow("valid path");
  expect(await submitJourney("alice", drafts[6], d)).toEqual(final);
  expect(d.judge).toHaveBeenCalledTimes(7);
  expect(await redis.get(oldKey)).toBe(old);
});
