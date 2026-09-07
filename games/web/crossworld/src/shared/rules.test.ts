import { expect, test } from "vitest";
import { clueWords, validateTurn } from "./rules";
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
  ["no-a", "Electric lights", "Table lights"],
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
