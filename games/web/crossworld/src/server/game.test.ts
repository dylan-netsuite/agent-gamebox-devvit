import { createDevvitTest } from "@devvit/test/server/vitest";
import { redis } from "@devvit/web/server";
import { expect, vi } from "vitest";
import { readTurn, saveDraft, submit, requireUser } from "./game";
import { SCENARIO } from "../shared/rules";
import type { Judgment } from "../shared/types";

const test = createDevvitTest();
const draft = {
  revealed: true,
  restriction: "brief",
  word: "LAMPS",
  clue: "Lights on tables",
};
const yes = { validWord: true, fairClue: true, reason: "Fair definition." };
const no = {
  validWord: true,
  fairClue: false,
  reason: "The clue does not fit this meaning.",
};
const dependencies = (review = yes) => ({
  config: vi.fn(async () => ({ enabled: true, key: "test-only-placeholder" })),
  judge: vi.fn(async () => review),
  now: Date.now,
});
test("login is required before account operations", () => {
  expect(() => requireUser(undefined)).toThrow("Sign in");
  expect(requireUser("t2_test")).toBe("t2_test");
});
test("drafts persist separately by trusted user and cannot forge completion", async () => {
  await saveDraft("alice", { ...draft, status: "accepted", review: yes });
  expect(await readTurn("alice")).toMatchObject({
    ...draft,
    status: "editing",
    review: null,
  });
  expect((await readTurn("bob")).word).toBe("");
});
test("invalid rules are rejected before spending on the judge", async () => {
  const deps = dependencies();
  await expect(
    submit("alice", { ...draft, word: "LIGHT" }, deps),
  ).rejects.toThrow("second letter");
  expect(deps.config).not.toHaveBeenCalled();
  expect(deps.judge).not.toHaveBeenCalled();
});
test("missing credentials preserve the draft and all restrictions", async () => {
  const deps = dependencies();
  deps.config.mockResolvedValue({ enabled: false, key: "" });
  await saveDraft("alice", draft);
  await expect(submit("alice", draft, deps)).rejects.toThrow("unavailable");
  expect((await readTurn("alice")).status).toBe("editing");
  expect(deps.judge).not.toHaveBeenCalled();
});
test("acceptance survives reload, repeat submit and a late draft save", async () => {
  const deps = dependencies();
  const accepted = await submit("alice", draft, deps);
  expect(accepted.status).toBe("accepted");
  expect(await submit("alice", draft, deps)).toEqual(accepted);
  expect(await saveDraft("alice", { ...draft, word: "PARTS" })).toEqual(
    accepted,
  );
  expect(await readTurn("alice")).toEqual(accepted);
  expect(deps.judge).toHaveBeenCalledTimes(1);
});
test("concurrent submissions make only one paid call", async () => {
  let release!: (review: Judgment) => void;
  const deps = dependencies();
  deps.judge.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  const first = submit("alice", draft, deps);
  await vi.waitFor(() => expect(deps.judge).toHaveBeenCalledTimes(1));
  await expect(submit("alice", draft, deps)).rejects.toThrow("45 seconds");
  release(yes);
  expect((await first).status).toBe("accepted");
});
test("negative judgments remain editable and identical retries use the cached judgment", async () => {
  const deps = dependencies(no);
  expect((await submit("alice", draft, deps)).status).toBe("editing");
  expect((await submit("alice", draft, deps)).review).toEqual(no);
  expect(await readTurn("alice")).toMatchObject({
    status: "editing",
    word: draft.word,
    review: no,
  });
  expect(deps.judge).toHaveBeenCalledTimes(1);
});
test("provider failure preserves draft and cooldown instead of retrying automatically", async () => {
  const deps = dependencies();
  deps.judge.mockRejectedValue(new Error("provider unavailable"));
  await saveDraft("alice", draft);
  await expect(submit("alice", draft, deps)).rejects.toThrow(
    "provider unavailable",
  );
  expect((await readTurn("alice")).status).toBe("editing");
  await expect(submit("alice", draft, deps)).rejects.toThrow("45 seconds");
  expect(deps.judge).toHaveBeenCalledTimes(1);
});
test("per-user and app-wide budgets stop new provider calls", async () => {
  const deps = dependencies();
  const day = new Date().toISOString().slice(0, 10);
  await redis.set(`cq:${SCENARIO}:alice:budget:${day}`, "20");
  await expect(submit("alice", draft, deps)).rejects.toThrow(
    "20-review allowance",
  );
  await redis.global.set(`cq:judge-budget:${day}`, "200");
  await expect(submit("bob", draft, deps)).rejects.toThrow("playtest limit");
  expect(deps.judge).not.toHaveBeenCalled();
});
