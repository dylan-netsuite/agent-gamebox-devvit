import { createDevvitTest } from "@devvit/test/server/vitest";
import { redis } from "@devvit/web/server";
import { expect, vi } from "vitest";
import { readJourney, saveJourney, submitJourney } from "./journey";
import { JOURNEY_SCENARIO, cellsFor } from "../shared/journey";
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
      draft.path === 2
        ? null
        : expect.objectContaining({ revealed: false, word: "" }),
    );
  }
  expect(d.judge).toHaveBeenCalledTimes(3);
  const done = await readJourney("alice");
  expect(done.completed.map((t) => t.word)).toEqual([
    "LAMPS",
    "CAMEL",
    "PETAL",
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
test("the three routes form one connected crossword with no incidental touching words", () => {
  const occupied = new Map<string, string>();
  for (const d of drafts)
    for (const [i, cell] of cellsFor(d.path).entries()) {
      const key = `${cell.row},${cell.col}`;
      if (occupied.has(key)) expect(occupied.get(key)).toBe(d.word[i]);
      occupied.set(key, d.word[i]!);
    }
  expect(occupied.size).toBe(13); // Fifteen letters share exactly two cells.
  const runs: string[] = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
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
  expect(runs.sort()).toEqual(["CAMEL", "LAMPS", "PETAL"]);
});
