import test from "node:test";
import assert from "node:assert/strict";
import {
  freshTurn,
  clueWords,
  validateTurn,
  submitTurn,
  recordReview,
  usedRestrictions,
  restoreTurn,
  turnReport,
} from "./rules.mjs";

const draft = (changes = {}) => ({
  ...freshTurn(),
  revealed: true,
  restriction: "brief",
  word: "CANAL",
  clue: "Artificial water passage",
  ...changes,
});

test("a new turn requires a reveal, selection, answer, and clue", () => {
  assert.equal(submitTurn(freshTurn()).issues.length, 4);
  assert.deepEqual(usedRestrictions(freshTurn()), []);
});

test("fit enforces answer length, letters, and the crossing", () => {
  for (const word of ["CAT", "CANALS", "C4NAL", "COAST", "C A L"])
    assert.ok(validateTurn(draft({ word })).issues.length);
  assert.equal(validateTurn(draft({ word: " canal " })).issues.length, 0);
});

test("answer bans match whole words, with explicit punctuation boundaries", () => {
  assert.ok(validateTurn(draft({ clue: "A CANAL!" })).issues.length);
  assert.equal(validateTurn(draft({ clue: "Canalization" })).issues.length, 0);
  assert.deepEqual(clueWords("ACROSS a well-known worker's route"), [
    "across",
    "a",
    "well",
    "known",
    "worker",
    "s",
    "route",
  ]);
});

const cases = [
  ["brief", "Artificial water passage", "An artificial passage used by boats"],
  [
    "seven",
    "An artificial passage that carries boats inland",
    "Artificial passage",
  ],
  ["no-e", "An artificial ditch", "An engineered ditch"],
  ["no-articles", "Artificial passage", "An artificial passage"],
  ["short-words", "Path for a boat", "Passage for a boat"],
  ["same-start", "Constructed craft corridor", "Constructed water corridor"],
  ["no-a", "Ditch for ships", "A ditch for ships"],
];
for (const [restriction, validClue, invalidClue] of cases) {
  test(`${restriction}: pass and fail use the displayed rule`, () => {
    assert.deepEqual(
      validateTurn(draft({ restriction, clue: validClue })).issues,
      [],
    );
    assert.ok(
      validateTurn(draft({ restriction, clue: invalidClue })).issues.length,
    );
  });
}

test("invalid clues and unknown restrictions cannot submit", () => {
  for (const changes of [
    { clue: "" },
    { clue: "!!!" },
    { clue: "x".repeat(141) },
    { restriction: "unknown" },
  ]) {
    const input = draft(changes);
    const result = submitTurn(input);
    assert.equal(result.turn.status, "editing");
    assert.ok(result.issues.length);
    assert.deepEqual(usedRestrictions(input), []);
  }
});

test("passing mechanical checks creates pending human review, spending nothing", () => {
  const input = draft({ word: " canal ", clue: " Artificial water passage " });
  const result = submitTurn(input);
  assert.deepEqual(result.issues, []);
  assert.equal(result.turn.status, "pending");
  assert.equal(result.turn.word, "CANAL");
  assert.equal(result.turn.clue, "Artificial water passage");
  assert.equal(input.status, "editing");
  assert.deepEqual(usedRestrictions(result.turn), []);
  assert.match(
    turnReport(result.turn),
    /no AI call or automatic dictionary check/,
  );
});

test("repeated submissions cannot advance pending or accepted turns", () => {
  const pending = submitTurn(draft()).turn;
  assert.equal(submitTurn(pending).turn, pending);
  assert.ok(submitTurn(pending).issues.length);
  const accepted = recordReview(pending, "accepted", "Fixture review").turn;
  assert.equal(submitTurn(accepted).turn, accepted);
  assert.deepEqual(usedRestrictions(accepted), ["brief"]);
});

test("manual review needs a pending turn, known verdict, and note", () => {
  assert.ok(recordReview(draft(), "accepted", "note").error);
  const pending = submitTurn(draft()).turn;
  assert.ok(recordReview(pending, "maybe", "note").error);
  assert.ok(recordReview(pending, "accepted", " ").error);
  assert.deepEqual(usedRestrictions(pending), []);
});

test("a rejection preserves the draft and does not consume the restriction", () => {
  const pending = submitTurn(draft()).turn;
  const rejected = recordReview(
    pending,
    "revise",
    "Make the clue more specific",
  ).turn;
  assert.equal(rejected.status, "editing");
  assert.equal(rejected.word, pending.word);
  assert.equal(rejected.clue, pending.clue);
  assert.deepEqual(usedRestrictions(rejected), []);
  const resubmitted = submitTurn(rejected).turn;
  assert.equal(resubmitted.status, "pending");
  assert.equal(resubmitted.reviewNote, "");
});

test("acceptance consumes once and cannot be reviewed again", () => {
  const accepted = recordReview(
    submitTurn(draft()).turn,
    "accepted",
    "Word and clue accepted",
  ).turn;
  assert.equal(accepted.status, "accepted");
  assert.deepEqual(usedRestrictions(accepted), ["brief"]);
  assert.ok(recordReview(accepted, "accepted", "Repeated review").error);
});

test("reload preserves valid editing, pending, and accepted states", () => {
  const pending = submitTurn(draft()).turn;
  const accepted = recordReview(pending, "accepted", "Fixture review").turn;
  for (const turn of [draft(), pending, accepted])
    assert.deepEqual(restoreTurn(JSON.parse(JSON.stringify(turn))), turn);
});

test("incompatible or invalid persisted records reset safely", () => {
  const invalid = [
    null,
    {},
    { ...draft(), scenario: "old" },
    { ...draft(), status: "won" },
    { ...draft({ word: "NO" }), status: "pending" },
    { ...draft(), status: "accepted", reviewNote: "" },
  ];
  for (const raw of invalid) assert.deepEqual(restoreTurn(raw), freshTurn());
});
