import { expect, test } from "vitest";
import {
  RESTRICTIONS,
  clueWords,
  familyOf,
  mechanicFor,
  validateTurn,
} from "./rules";
import { WORLDS } from "./worlds";
import { deckFor } from "./shore";
import { parseDraft } from "./types";
const draft = {
  revealed: true,
  restriction: "brief",
  word: "LAMPS",
  clue: "Lights on tables",
};
test("accepts the slot crossing and normalizes input", () => {
  expect(validateTurn({ ...draft, word: " lamps " })).toMatchObject({
    issues: [],
    word: "LAMPS",
    wordCount: 3,
  });
});
test.each(["LAMP", "LIGHT", "12345", "LÁMPS"])(
  "rejects invalid slot answer %s",
  (word) => {
    expect(validateTurn({ ...draft, word }).issues.length).toBeGreaterThan(0);
  },
);
test("does not infer substring or word-family bans", () => {
  expect(validateTurn({ ...draft, clue: "Lamplight sources" }).issues).toEqual(
    [],
  );
  expect(validateTurn({ ...draft, clue: "Lamps" }).issues).toContain(
    "Do not include your exact answer as a whole word in the clue.",
  );
});
test.each([
  ["brief", "Lights on tables", "These are lights on our tables"],
  ["seven", "These lights are often placed on tables", "Lights on tables"],
  ["no-e", "Glowing bulbs", "Electric lights"],
  ["no-b", "Electric lights", "Bright bulbs"],
  ["no-articles", "Table lights", "The table lights"],
  ["short-words", "Give us some glow", "Provide illumination"],
  ["same-start", "Little lights", "Lights on tables"],
])("%s has explicit positive and negative cases", (restriction, good, bad) => {
  expect(validateTurn({ ...draft, restriction, clue: good }).issues).toEqual(
    [],
  );
  expect(
    validateTurn({ ...draft, restriction, clue: bad }).issues.length,
  ).toBeGreaterThan(0);
});
test("punctuation, apostrophes and hyphens split tokens", () => {
  expect(clueWords("It's well-lit!")).toEqual(["it", "s", "well", "lit"]);
});
test("rejects empty clues, unknown restrictions and unrevealed turns", () => {
  for (const patch of [
    { clue: "!!!" },
    { restriction: "fake" },
    { revealed: false },
  ])
    expect(validateTurn({ ...draft, ...patch }).issues.length).toBeGreaterThan(
      0,
    );
});
test("body parsing rejects wrong types and ignores forged identity and verdict", () => {
  expect(parseDraft({ ...draft, word: 123 })).toBeNull();
  expect(parseDraft({ ...draft, clue: "a".repeat(141) })).toBeNull();
  expect(
    parseDraft({
      ...draft,
      status: "accepted",
      userId: "victim",
      review: { fairClue: true },
    }),
  ).toEqual(draft);
});

test("Twin Blossoms allows other initials and requires a repeated initial", () => {
  for (const clue of ["Little lights on tables", "Lights on little tables"])
    expect(
      validateTurn({ ...draft, restriction: "same-start", clue }).issues,
    ).toEqual([]);
  expect(
    validateTurn({ ...draft, restriction: "same-start", clue: "Lights" })
      .issues,
  ).toHaveLength(1);
});

// The eight cards added after playtest feedback that the original ten were one
// idea in ten hats. Each is checked here against the context it reads.
const clue = (
  restriction: string,
  text: string,
  word = "SHORE",
  context = {},
) =>
  validateTurn(
    { revealed: true, restriction, word, clue: text },
    null,
    word.length,
    context,
  ).issues;

test("answer-relative cards scale with the answer being clued", () => {
  // mirror-length asks for one word per answer letter, so it differs per slot.
  expect(clue("mirror-length", "Land at edge of sea", "SHORE")).toEqual([]);
  expect(clue("mirror-length", "Where land stops", "SHORE")).toHaveLength(1);
  expect(clue("mirror-length", "Slow shelled thing", "OWL")).toEqual([]);
  expect(clue("shared-initial", "Sea meets land", "SHORE")).toEqual([]);
  expect(clue("shared-initial", "Where land gives out", "SHORE")).toHaveLength(
    1,
  );
});

test("link cards read other clues and fail closed without them", () => {
  expect(
    clue("echo", "A narrow arm of sea", "INLET", {
      companion: ["the", "sea", "rises"],
    }),
  ).toEqual([]);
  expect(
    clue("echo", "A narrow channel", "INLET", { companion: ["the", "sea"] }),
  ).toHaveLength(1);
  // No context must never silently satisfy a link card.
  expect(clue("echo", "A narrow arm of sea", "INLET")).toHaveLength(1);
  expect(
    clue("fresh-words", "Thick cords for hauling", "ROPES", {
      earlier: ["walkway", "over", "water"],
    }),
  ).toEqual([]);
  expect(
    clue("fresh-words", "Cords over a rail", "ROPES", {
      earlier: ["walkway", "over", "water"],
    }),
  ).toHaveLength(1);
  // fresh-words is trivially satisfied on the first turn and tightens later.
  expect(clue("fresh-words", "Thick cords", "ROPES")).toEqual([]);
});

test("voice and shape cards check the clue's form, not its length", () => {
  expect(clue("ask", "Where does the land stop?", "SHORE")).toEqual([]);
  expect(clue("ask", "Where the land stops", "SHORE")).toHaveLength(1);
  expect(clue("count-me-in", "Litter left by one tide", "WRACK")).toEqual([]);
  expect(clue("count-me-in", "Litter left by a tide", "WRACK")).toHaveLength(1);
  expect(clue("twin-endings", "Smooth woven cloth", "SATIN")).toEqual([]);
  expect(clue("twin-endings", "Woven fabric", "SATIN")).toHaveLength(1);
  expect(clue("double-trouble", "Pulled tight in rope", "KNOT")).toEqual([]);
  expect(clue("double-trouble", "Tied up in rope", "KNOT")).toHaveLength(1);
});

test("no deck is dominated by a single kind of card", () => {
  // The original complaint in one assertion: a deck whose cards are mostly the
  // same family plays as one move repeated, however many cards it holds.
  for (const world of WORLDS) {
    const families = deckFor(world).map((card) => familyOf(card.id));
    expect(families.every(Boolean), world.id).toBe(true);
    const spread = new Set(families);
    expect(
      spread.size,
      `${world.id} spans too few kinds`,
    ).toBeGreaterThanOrEqual(3);
    for (const family of spread) {
      const share = families.filter((f) => f === family).length;
      expect(
        share / families.length,
        `${world.id} is ${share}/${families.length} ${family}`,
      ).toBeLessThanOrEqual(0.5);
    }
  }
});

test("every mechanic is reachable and every deck card is a real mechanic", () => {
  const offered = new Set(WORLDS.flatMap((w) => deckFor(w).map((c) => c.id)));
  for (const id of offered) expect(mechanicFor(id), id).toBeTruthy();
  // A mechanic no world deals is dead weight in the registry.
  for (const mechanic of RESTRICTIONS) expect(offered).toContain(mechanic.id);
});
