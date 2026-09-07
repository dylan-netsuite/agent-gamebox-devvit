import { navigateTo } from "@devvit/web/client";
import { createGameApi } from "./api";
import { createGarden } from "./garden";
import { RESTRICTIONS, clueWords } from "../shared/rules";
import {
  JOURNEY_API_ROOT,
  JOURNEY_SCENARIO,
  PATHS,
  MAP_SIZE,
  markerFor,
  emptyJourney,
  crossingFor,
  cellsFor,
  validatePath,
  type Journey,
  type JourneyView,
} from "../shared/journey";
import type { Draft } from "../shared/types";

const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const sheet = el<HTMLDialogElement>("entry"),
  word = el<HTMLInputElement>("word"),
  clue = el<HTMLTextAreaElement>("clue"),
  restriction = el<HTMLSelectElement>("restriction");
const explore = el<HTMLButtonElement>("explore"),
  submit = el<HTMLButtonElement>("submit");
const api = createGameApi<JourneyView>(undefined, undefined, {
  root: JOURNEY_API_ROOT,
  scenario: JOURNEY_SCENARIO,
});
const garden = createGarden();
let journey = emptyJourney(),
  ready = false,
  signedIn = false,
  judgeReady = false,
  busy = false;
let inspected: number | null = null,
  revision = 0,
  dirty = false;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let saves: Promise<void> = Promise.resolve();
const message = (id: string, text: string) => {
  el(id).textContent = text;
  el(id).hidden = !text;
};
const failureText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Could not save. Your typed draft is still here.";
function draft(): Draft {
  return {
    revealed: journey.turn?.revealed ?? false,
    restriction: restriction.value,
    word: word.value,
    clue: clue.value,
  };
}
function updateForm() {
  const turn = inspected === null ? journey.turn : journey.completed[inspected];
  if (!turn) return;
  word.value = turn.word;
  clue.value = turn.clue;
  restriction.replaceChildren(new Option("Choose a rule", ""));
  for (const rule of RESTRICTIONS) {
    const option = new Option(rule.rule, rule.id);
    option.disabled = journey.completed.some((t) => t.restriction === rule.id);
    restriction.add(option);
  }
  restriction.value = turn.restriction;
  el("remaining").textContent =
    `${RESTRICTIONS.length - journey.completed.length} left`;
  el("turn-form").hidden = inspected !== null;
  el("accepted-note").hidden = inspected === null;
  el("path-label").textContent =
    `PATH ${String((inspected ?? journey.completed.length) + 1).padStart(2, "0")} · ${inspected === null ? "5 LETTERS" : "PART OF YOUR GARDEN"}`;
  el("entry-title").textContent =
    inspected === null ? "Give this path a word" : PATHS[inspected]!.place;
  el("accepted-clue").textContent = turn.clue;
  el("accepted-rule").textContent =
    RESTRICTIONS.find((r) => r.id === turn.restriction)?.rule ?? "";
  message(
    "review",
    turn.review && turn.status === "editing" ? turn.review.reason : "",
  );
  message("errors", "");
  updatePattern();
}
function updatePattern() {
  const fixed = crossingFor(journey.completed);
  const shown =
    inspected === null
      ? word.value.trim().toUpperCase()
      : (journey.completed[inspected]?.word ?? "");
  const pattern = el("pattern");
  pattern.replaceChildren();
  const letters: string[] = [];
  for (let i = 0; i < 5; i++) {
    const stone = document.createElement("span");
    const isFixed = inspected === null && fixed?.index === i;
    stone.textContent = isFixed ? fixed.letter : (shown[i] ?? "·");
    if (isFixed) stone.className = "fixed";
    letters.push(stone.textContent);
    pattern.append(stone);
  }
  pattern.setAttribute("aria-label", `Word path: ${letters.join(" ")}`);
  el("crossing-note").textContent =
    inspected !== null
      ? "Your word is part of the map now."
      : fixed
        ? `Letter ${fixed.index + 1} is ${fixed.letter}, from path ${fixed.source + 1}.`
        : "An open path. Any five-letter English word can take root.";
  el("counter").textContent =
    `${clueWords(clue.value).length} words · ${clue.value.length} / 140`;
}
function renderMap(celebrate = false) {
  const paths = el("paths");
  paths.replaceChildren();
  const turns = [
    ...journey.completed,
    ...(journey.turn?.revealed ? [journey.turn] : []),
  ];
  turns.forEach((turn, index) => {
    const layout = PATHS[index]!,
      current = index === journey.completed.length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `path${layout.down ? " down" : ""}${current ? " current" : ""}`;
    button.dataset.path = String(index);
    button.style.left = `${(layout.col / MAP_SIZE) * 100}%`;
    button.style.top = `${(layout.row / MAP_SIZE) * 100}%`;
    button.style.width = `${((layout.down ? 1 : 5) / MAP_SIZE) * 100}%`;
    button.style.height = `${((layout.down ? 5 : 1) / MAP_SIZE) * 100}%`;
    const crossing = current ? crossingFor(journey.completed) : null;
    cellsFor(index).forEach((_cell, i) => {
      const stone = document.createElement("span");
      stone.className = `stone${crossing?.index === i ? " crossing" : ""}`;
      stone.textContent = current
        ? crossing?.index === i
          ? crossing.letter
          : "·"
        : (turn.word[i] ?? "");
      stone.setAttribute("aria-hidden", "true");
      button.append(stone);
    });
    button.setAttribute(
      "aria-label",
      current
        ? `Write path ${index + 1}, five letters${crossing ? `, letter ${crossing.index + 1} is ${crossing.letter}` : ""}`
        : `Inspect path ${index + 1}: ${turn.word}. ${layout.place}`,
    );
    button.addEventListener("click", () => openSheet(current ? null : index));
    paths.append(button);
  });
  explore.hidden = !journey.turn || journey.turn.revealed;
  explore.disabled = !ready || busy;
  const next = journey.completed.length;
  const marker = markerFor(next);
  explore.style.left = next
    ? `${((marker.col + 0.5) / MAP_SIZE) * 100}%`
    : "50%";
  explore.style.top = next
    ? `${((marker.row + 0.5) / MAP_SIZE) * 100}%`
    : "48%";
  el("explore-label").textContent = next ? "Explore next" : "Begin here";
  explore.classList.toggle("next-marker", next > 0);
  explore.setAttribute("aria-label", next ? "Explore next" : "Begin here");
  el("progress").textContent =
    next === PATHS.length
      ? `${PATHS.length} paths uncovered · A crossword of your own`
      : next
        ? `${next} of ${PATHS.length} paths uncovered`
        : journey.turn?.revealed
          ? "First path uncovered · Make it yours"
          : "An empty map. A place to begin.";
  el("story").textContent = next
    ? PATHS[next - 1]!.note
    : journey.turn?.revealed
      ? "A word of your own. A clue for someone else."
      : "Uncover a path. Give it a word. See what grows.";
  garden.update(next, celebrate);
}
function controls() {
  for (const field of [word, clue, restriction])
    field.disabled = busy || !ready;
  submit.disabled = busy || !ready || !signedIn || !judgeReady;
  submit.textContent = busy
    ? "Listening to your clue…"
    : !signedIn
      ? "Sign in to grow this path"
      : !judgeReady
        ? "Clue review unavailable"
        : "Grow this path ↗";
  el<HTMLButtonElement>("refresh").disabled = busy;
}
function openSheet(path: number | null) {
  if (!ready || busy) return;
  inspected = path;
  updateForm();
  controls();
  if (!sheet.open) sheet.showModal();
}
function applyState(next: Journey, celebrate = false) {
  if (next.completed.length < journey.completed.length) return;
  const advanced = next.completed.length > journey.completed.length;
  journey = next;
  if (advanced) {
    dirty = false;
    revision++;
    inspected = null;
    if (sheet.open) sheet.close();
  }
  renderMap(celebrate && advanced);
  updateForm();
  controls();
  if (advanced) {
    // Native dialog restores focus to its opener, which has just been replaced.
    const target = !explore.hidden
      ? explore
      : el("paths").querySelector<HTMLButtonElement>("button");
    target?.focus({ preventScroll: true });
  }
}
function queueSave() {
  clearTimeout(saveTimer);
  if (!ready || !signedIn || !journey.turn || !dirty) return saves;
  const version = revision,
    path = journey.completed.length,
    snapshot = { ...journey.turn };
  el("storage-status").textContent = "Saving…";
  saves = saves
    .catch(() => {})
    .then(async () => {
      try {
        const next = await api.request<Journey>("/draft", {
          ...snapshot,
          path,
        });
        if (next.completed.length > journey.completed.length) applyState(next);
        if (version === revision) {
          dirty = false;
          el("storage-status").textContent = "Garden saved";
        }
      } catch (error) {
        if (version === revision) {
          el("storage-status").textContent = "Draft not saved · try Refresh";
          message("connection", failureText(error));
          el("reconnect").hidden = false;
        }
      }
    });
  return saves;
}
for (const field of [word, clue, restriction])
  field.addEventListener("input", () => {
    if (!journey.turn || busy) return;
    journey.turn = { ...journey.turn, ...draft(), review: null };
    revision++;
    dirty = true;
    el("storage-status").textContent = signedIn
      ? "Unsaved changes…"
      : "Guest · not saved";
    message("errors", "");
    message("review", "");
    updatePattern();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void queueSave();
    }, 500);
  });
explore.addEventListener("click", () => {
  if (!ready || !journey.turn) return;
  journey.turn.revealed = true;
  dirty = true;
  revision++;
  renderMap();
  openSheet(null);
  void queueSave();
});
el("close").addEventListener("click", () => {
  void queueSave();
  sheet.close();
});
sheet.addEventListener("close", () => {
  void queueSave();
  if (ready)
    (el("paths").querySelector<HTMLButtonElement>(".current") ?? explore).focus(
      { preventScroll: true },
    );
});
el("turn-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (busy || !ready || !signedIn || !judgeReady || !journey.turn) return;
  const current = draft(),
    result = validatePath(current, journey.completed);
  if (result.issues.length) {
    message("errors", result.issues.join(" "));
    return;
  }
  journey.turn = { ...journey.turn, ...current };
  dirty = true;
  revision++;
  const payload = { ...current, path: journey.completed.length };
  busy = true;
  controls();
  message("errors", "");
  message("review", "");
  void (async () => {
    await queueSave();
    try {
      const next = await api.request<Journey>("/submit", payload);
      dirty = false;
      applyState(next, true);
      el("storage-status").textContent = "Garden saved";
    } catch (error) {
      message("errors", failureText(error));
      message("connection", failureText(error));
      el("reconnect").hidden = false;
    } finally {
      busy = false;
      controls();
      renderMap();
    }
  })();
});
async function load() {
  if (busy) return;
  busy = true;
  controls();
  message("connection", "Finding your garden…");
  await queueSave();
  await saves;
  try {
    const view = await api.loadTurn(() =>
      message("connection", "Reconnecting to your garden…"),
    );
    signedIn = view.signedIn;
    judgeReady = view.judgeReady;
    ready = true;
    const local =
      dirty && journey.completed.length === view.journey.completed.length
        ? journey.turn
        : null;
    applyState(local ? { ...view.journey, turn: local } : view.journey);
    message(
      "connection",
      !signedIn
        ? "Sign in to save and grow your garden."
        : !judgeReady
          ? "Clue review is resting. You can still write and save."
          : "",
    );
    el("login").hidden = signedIn;
    el("reconnect").hidden = true;
    el("storage-status").textContent = signedIn
      ? dirty
        ? "Draft kept on this screen"
        : "Garden saved"
      : "Guest · not saved";
  } catch (error) {
    message("connection", failureText(error));
    el("reconnect").hidden = false;
  } finally {
    busy = false;
    controls();
    renderMap();
  }
}
el("refresh").addEventListener("click", () => {
  void load();
});
el("reconnect").addEventListener("click", () => {
  void load();
});
el("login").addEventListener("click", () =>
  navigateTo("https://www.reddit.com/login/"),
);
void load();
