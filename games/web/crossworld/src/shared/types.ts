export type Draft = {
  revealed: boolean;
  restriction: string;
  word: string;
  clue: string;
};
export type Judgment = {
  validWord: boolean;
  fairClue: boolean;
  reason: string;
};
export type Turn = Draft & {
  status: "editing" | "accepted";
  review: Judgment | null;
};
export type GameView = {
  scenario: string;
  signedIn: boolean;
  judgeReady: boolean;
  turn: Turn;
};
export const emptyTurn = (): Turn => ({
  revealed: false,
  restriction: "",
  word: "",
  clue: "",
  status: "editing",
  review: null,
});

// Never trust a client-supplied status, identity, verdict, or scenario.
export function parseDraft(raw: unknown): Draft | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (
    typeof d.revealed !== "boolean" ||
    typeof d.restriction !== "string" ||
    d.restriction.length > 30 ||
    typeof d.word !== "string" ||
    d.word.length > 20 ||
    typeof d.clue !== "string" ||
    d.clue.length > 140
  )
    return null;
  return {
    revealed: d.revealed,
    restriction: d.restriction,
    word: d.word,
    clue: d.clue,
  };
}
