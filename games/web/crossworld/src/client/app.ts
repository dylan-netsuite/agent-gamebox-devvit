import { createGarden } from "./garden";
import { showLoginPrompt } from "@devvit/web/client";
import {
  API_ROOT,
  RESTRICTIONS,
  SCENARIO,
  clueWords,
  validateTurn,
} from "../shared/rules";
import { emptyTurn, type Turn, type GameView } from "../shared/types";

const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const word = el<HTMLInputElement>("word");
const clue = el<HTMLTextAreaElement>("clue");
let turn = emptyTurn();
let loaded = false;
let signedIn = false;
let judgeReady = false;
let busy = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saves: Promise<void> = Promise.resolve();
let dirty = false;
const garden = createGarden();

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
    signal: AbortSignal.timeout(25_000),
  });
  if (response.status === 404)
    throw new Error(
      "This postcard is updating. Reopen the Reddit post to load the matching version. Your earlier turn is safe.",
    );
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(
      data.error || "Could not reach the game. Please try again.",
    );
  return data;
}

function error(message: string) {
  el("errors").hidden = !message;
  el("errors").textContent = message;
}

function board() {
  const nodes = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement("span");
      const crossing = row === 1 && col >= 1 && col <= 3;
      const entry = col === 2;
      cell.className = `cell${crossing ? " old" : ""}${entry ? " target" : ""}${crossing && entry ? " crossing" : ""}${entry && turn.status === "accepted" ? " accepted" : ""}`;
      if (crossing) cell.textContent = "MAP"[col - 1]!;
      else if (entry) cell.textContent = turn.word.toUpperCase()[row] || "";
      nodes.push(cell);
    }
  }
  el("board").replaceChildren(...nodes);
}

function render(celebrate = false) {
  const accepted = turn.status === "accepted";
  const disabled = !loaded || busy || accepted || !turn.revealed;
  el("concealed").hidden = turn.revealed;
  el("revealed").hidden = !turn.revealed;
  el<HTMLButtonElement>("reveal").disabled = !loaded || busy;
  el<HTMLFieldSetElement>("restriction-fieldset").disabled = disabled;
  word.disabled = disabled;
  clue.disabled = disabled;
  el<HTMLButtonElement>("submit").disabled =
    disabled || !signedIn || !judgeReady;
  el<HTMLButtonElement>("reload").disabled = busy;
  el("submit").textContent = busy
    ? "Reviewing your clue…"
    : accepted
      ? "Postcard complete"
      : "Submit word & clue ↗";
  el("counter").textContent =
    `${clueWords(turn.clue).length} words · ${turn.clue.length}/140`;
  el("board-badge").textContent = accepted
    ? "Complete"
    : turn.revealed
      ? "5 letters · down"
      : "Unrevealed";
  el("remaining").textContent = accepted
    ? "1 used · 6 remaining"
    : "7 available";
  el("login").hidden = !loaded || signedIn;
  if (loaded)
    el("connection").textContent = !signedIn
      ? "Sign in to save and submit your turn."
      : !judgeReady
        ? "Clue review is being connected. You can write and save your draft."
        : "Your turn is ready.";
  el("result").hidden = !turn.review;
  if (turn.review) {
    el("result-title").textContent = accepted
      ? "Look what you grew."
      : "Give your clue another pass.";
    el("result-copy").textContent =
      `${turn.review.reason} ${accepted ? "One restriction spent. One little corner brought to life. Your postcard is complete." : "Your restriction is still available. You can revise and submit again."}`;
  }
  for (const input of document.querySelectorAll<HTMLInputElement>(
    'input[name="restriction"]',
  ))
    input.checked = input.value === turn.restriction;
  board();
  garden.update(accepted, celebrate);
}

function queueSave(): Promise<void> {
  clearTimeout(saveTimer);
  if (!signedIn || !dirty || turn.status === "accepted") return saves;
  const snapshot = { ...turn };
  dirty = false;
  el("storage-status").textContent = "Saving draft…";
  const task = saves
    .catch(() => {})
    .then(async () => {
      const saved = await api<Turn>("/draft", snapshot);
      if (saved.status === "accepted") {
        turn = saved;
        word.value = saved.word;
        clue.value = saved.clue;
        render();
      }
      el("storage-status").textContent = dirty
        ? "Unsaved changes…"
        : "Saved to your Reddit account.";
    })
    .catch((failure) => {
      dirty = true;
      el("storage-status").textContent =
        "Draft not saved. Keep this window open and try again.";
      throw failure;
    });
  saves = task;
  return task;
}

function changed() {
  turn = { ...turn, word: word.value, clue: clue.value, review: null };
  dirty = true;
  error("");
  render();
  el("storage-status").textContent = signedIn
    ? "Unsaved changes…"
    : "Sign in to save this draft.";
  clearTimeout(saveTimer);
  if (signedIn)
    saveTimer = setTimeout(() => {
      void queueSave().catch(() => {
        dirty = true;
        el("storage-status").textContent =
          "Draft not saved. Keep this window open and try again.";
      });
    }, 500);
}

for (const restriction of RESTRICTIONS) {
  const label = document.createElement("label");
  label.className = "restriction";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "restriction";
  input.value = restriction.id;
  const body = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = restriction.name;
  const rule = document.createElement("span");
  rule.textContent = restriction.rule;
  body.append(name, rule);
  label.append(input, body);
  el("restrictions").append(label);
  input.addEventListener("change", () => {
    turn.restriction = input.value;
    changed();
  });
}
word.addEventListener("input", changed);
clue.addEventListener("input", changed);
el("reveal").addEventListener("click", () => {
  turn.revealed = true;
  changed();
  document
    .querySelector<HTMLInputElement>('input[name="restriction"]')
    ?.focus();
});
el("login").addEventListener("click", () => {
  showLoginPrompt();
});

el("turn-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (busy || turn.status === "accepted") return;
  const { issues } = validateTurn(turn);
  if (issues.length) {
    error(issues.join(" "));
    return;
  }
  busy = true;
  error("");
  render();
  void (async () => {
    try {
      await queueSave();
      if (turn.status === "accepted") return;
      turn = await api<Turn>("/submit", turn);
      word.value = turn.word;
      clue.value = turn.clue;
      el("storage-status").textContent =
        turn.status === "accepted"
          ? "Completed turn saved to your Reddit account."
          : "Draft saved. Revise when ready.";
    } catch (failure) {
      error(
        failure instanceof Error
          ? failure.message
          : "Review interrupted. Refresh to check your saved turn before retrying.",
      );
    } finally {
      busy = false;
      render(turn.status === "accepted");
      if (turn.status === "accepted") {
        el("garden-caption").focus({ preventScroll: true });
        el("garden-scene").scrollIntoView({
          block: "start",
          behavior: "instant",
        });
      } else if (turn.review) el("result").focus();
    }
  })();
});

async function load() {
  busy = true;
  error("");
  render();
  try {
    // Flush edits before refresh; a failed save must not silently discard them.
    await queueSave();
    const view = await api<GameView>("/turn");
    if (view.scenario !== SCENARIO) {
      loaded = false;
      signedIn = false;
      judgeReady = false;
      throw new Error(
        "This postcard is updating. Reopen the Reddit post to load the matching version. Your earlier turn is safe.",
      );
    }
    turn = view.turn;
    signedIn = view.signedIn;
    judgeReady = view.judgeReady;
    loaded = true;
    word.value = turn.word;
    clue.value = turn.clue;
    el("storage-status").textContent = signedIn
      ? "Loaded your saved turn."
      : "Sign in to save your draft.";
  } catch (failure) {
    el("connection").textContent = "Could not load your saved turn.";
    error(
      failure instanceof Error
        ? failure.message
        : "Check your connection, then use Refresh saved turn. Your typed draft is still here.",
    );
  } finally {
    busy = false;
    render();
  }
}
el("reload").addEventListener("click", () => {
  void load();
});
void load();
