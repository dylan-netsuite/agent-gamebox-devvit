import { createDevvitTest } from "@devvit/test/server/vitest";
import { redis } from "@devvit/web/server";
import { expect, vi } from "vitest";
import { SANDY_SHORE, WORLDS } from "../shared/worlds";
import {
  DIRECTIONS,
  availableCards,
  deckFor,
  usedCards,
  validatePair,
} from "../shared/shore";
import { referenceDraft } from "../shared/reference-solution";
import { createWorldGame } from "./shore";
import { JudgeUnavailable } from "./judge";
import type { Dependencies } from "./game";

const test = createDevvitTest();
const shore = createWorldGame(SANDY_SHORE);
const yes = { validWord: true, fairClue: true, reason: "Fair definition." };
const deps = () => ({
  config: vi.fn(async () => ({ enabled: true, key: "test-placeholder" })),
  judge: vi.fn<Dependencies["judge"]>(async () => yes),
  now: Date.now,
});
// Reviews hold a fixed lease; clear it so a retry in the same test can proceed.
async function expireReview(user: string, day = 0) {
  await redis.del(`cq:${SANDY_SHORE.scenario}:${user}:day:${day}:reviewing`);
  for (const direction of DIRECTIONS)
    await redis.del(
      `cq:${SANDY_SHORE.scenario}:day:${day}:${direction}:${user}:cooldown`,
    );
}
const spentBy = async (user: string) =>
  usedCards((await shore.read(user)).completed).sort();
/** The two cards the reference solution spends on a given discovery. */
const cardsOn = (day: number) => {
  const draft = referenceDraft(SANDY_SHORE, day);
  return [draft.across.criterion, draft.down.criterion].sort();
};

test("every world's deck is exactly the size of the world and drawn from real mechanics", () => {
  for (const world of WORLDS) {
    const deck = deckFor(world);
    expect(deck, world.id).toHaveLength(world.days.length * 2);
    expect(new Set(deck.map((card) => card.id)).size).toBe(deck.length);
    // A world-flavoured name never replaces the stable mechanic id.
    for (const card of deck) {
      expect(card.name).toBeTruthy();
      expect(card.rule).toBeTruthy();
    }
  }
  // The same mechanic reads differently per world without forking the switch.
  expect(deckFor(SANDY_SHORE).find((c) => c.id === "short-words")?.name).toBe(
    "Grains",
  );
  expect(
    deckFor(WORLDS.find((w) => w.id === "haunted-hedge")!).find(
      (c) => c.id === "short-words",
    )?.name,
  ).toBe("Tiny Seeds");
});

test("completing a world spends its deck exactly once", async () => {
  const d = deps();
  expect(availableCards(SANDY_SHORE, [])).toHaveLength(4);
  for (let day = 0; day < SANDY_SHORE.days.length; day++)
    await shore.submit("dealer", referenceDraft(SANDY_SHORE, day), d);
  const done = await shore.read("dealer");
  expect(done.turn).toBeNull();
  expect(await spentBy("dealer")).toEqual(
    deckFor(SANDY_SHORE)
      .map((card) => card.id)
      .sort(),
  );
  expect(availableCards(SANDY_SHORE, done.completed)).toEqual([]);
});

test("a spent card is gone from the deck and is refused before any paid review", async () => {
  const d = deps();
  await shore.submit("spender", referenceDraft(SANDY_SHORE, 0), d);
  const after = await shore.read("spender");
  expect(
    availableCards(SANDY_SHORE, after.completed)
      .map((c) => c.id)
      .sort(),
  ).toEqual(cardsOn(1));
  d.judge.mockClear();
  // Day one spent Driftwood (brief); day two may not spend it again.
  const reuse = {
    ...referenceDraft(SANDY_SHORE, 1),
    across: {
      word: "SALTS",
      clue: "What the sea leaves behind",
      criterion: "brief",
    },
  };
  await expect(shore.submit("spender", reuse, d)).rejects.toThrow(
    "Driftwood has already been spent",
  );
  expect(d.judge).not.toHaveBeenCalled();
  expect((await shore.read("spender")).completed).toHaveLength(1);
});

test("a card outside this world's deck, or spent twice in one pair, is refused", async () => {
  const d = deps();
  const outside = {
    ...referenceDraft(SANDY_SHORE, 0),
    across: { word: "SAND", clue: "Small gritty bits", criterion: "no-e" },
  };
  await expect(shore.submit("picky", outside, d)).rejects.toThrow(
    "not in this world’s deck",
  );
  const doubled = referenceDraft(SANDY_SHORE, 0);
  doubled.down = { ...doubled.down, criterion: doubled.across.criterion };
  await expect(shore.submit("picky", doubled, d)).rejects.toThrow(
    "spend a different card",
  );
  expect(d.judge).not.toHaveBeenCalled();
  expect(await spentBy("picky")).toEqual([]);
});

test("a rejected clue does not consume its card", async () => {
  const d = deps();
  d.judge.mockImplementation(async (draft) =>
    draft.word === "SNAIL"
      ? { validWord: true, fairClue: false, reason: "Clarify this clue." }
      : yes,
  );
  const first = await shore.submit(
    "unlucky",
    referenceDraft(SANDY_SHORE, 0),
    d,
  );
  expect(first.completed).toHaveLength(0);
  // Nothing was accepted, so the whole deck is still in hand.
  expect(await spentBy("unlucky")).toEqual([]);
  expect(availableCards(SANDY_SHORE, first.completed)).toHaveLength(4);

  await expireReview("unlucky");
  d.judge.mockResolvedValue(yes);
  // The same card, on a reworded clue, is still spendable.
  const retry = referenceDraft(SANDY_SHORE, 0);
  retry.down = { ...retry.down, clue: "Slow bug on a leaf" };
  const second = await shore.submit("unlucky", retry, d);
  expect(second.completed).toHaveLength(1);
  expect(await spentBy("unlucky")).toEqual(cardsOn(0));
});

test("an unavailable judge does not consume a card", async () => {
  const d = deps();
  d.judge.mockRejectedValue(new JudgeUnavailable());
  await expect(
    shore.submit("offline", referenceDraft(SANDY_SHORE, 0), d),
  ).rejects.toThrow("unavailable");
  const stalled = await shore.read("offline");
  expect(stalled.completed).toHaveLength(0);
  expect(await spentBy("offline")).toEqual([]);
  expect(availableCards(SANDY_SHORE, stalled.completed)).toHaveLength(4);

  await expireReview("offline");
  d.judge.mockResolvedValue(yes);
  const recovered = await shore.submit(
    "offline",
    referenceDraft(SANDY_SHORE, 0),
    d,
  );
  expect(recovered.completed).toHaveLength(1);
  expect(await spentBy("offline")).toEqual(cardsOn(0));
});

test("a draft reserves nothing: saving does not spend a card", async () => {
  await shore.save("drafter", referenceDraft(SANDY_SHORE, 0));
  const saved = await shore.read("drafter");
  expect(saved.turn?.across.criterion).toBe("brief");
  expect(await spentBy("drafter")).toEqual([]);
  expect(availableCards(SANDY_SHORE, saved.completed)).toHaveLength(4);
});

test("one-use is enforced against accepted pairs, not against the pair being written", () => {
  const completed = [
    {
      ...referenceDraft(SANDY_SHORE, 0),
      reviews: { across: yes, down: yes },
    },
  ];
  // Re-validating the accepted pair itself would wrongly see its own cards as
  // spent; only later pairs are checked against it.
  const next = referenceDraft(SANDY_SHORE, 1);
  expect(validatePair(next, completed, SANDY_SHORE).issues).toEqual([]);
});
