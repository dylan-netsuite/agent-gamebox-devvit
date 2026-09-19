import { worldFor } from "../shared/worlds";
import { createAtlasMap } from "./atlas-map";
import { readPreference, writePreference } from "./preferences";
import { navigateTo } from "@devvit/web/client";
import { createGameApi } from "./api";
import { startDiag } from "./diag";
import { createShoreArt } from "./shore-art";
import { criterionIcon } from "./criteria-art";
import {
  DIRECTIONS,
  CRITERIA,
  availableCards,
  deckFor,
  cellsFor as cellsForWorld,
  cellKey,
  lettersFor as lettersForWorld,
  emptyShore,
  parsePair,
  validatePair as validateWorldPair,
  type Direction,
  type Seeds,
  type Shore,
  type ShoreView,
  type PairDraft,
} from "../shared/shore";
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const world = worldFor(location.hash.slice(1) || readPreference("world"));
const DAYS = world.days;
const cellsFor = (day: number, direction: Direction) =>
  cellsForWorld(day, direction, world);
let seeds: Seeds = {};
const lettersFor = (completed: Shore["completed"]) =>
  lettersForWorld(completed, world, seeds);
/** Which finished world a carried letter came from, for the tile's label. */
const seedSource = new Map(
  (world.seeds ?? []).map((source) => [
    `${source.row},${source.col}`,
    worldFor(source.from).name,
  ]),
);
const validatePair = (draft: PairDraft, completed: Shore["completed"]) =>
  validateWorldPair(draft, completed, world);
document.documentElement.dataset.world = world.id;
document.documentElement.dataset.region = world.region;
document.title = `CrossWorld · ${world.name}`;
// Grid size is per-world: the Wrackline is 12x4 and the Gate is 13x5.
el("map").style.setProperty("--map-rows", String(world.rows));
el("map").style.setProperty("--map-cols", String(world.cols));
el("journey-track").replaceChildren(
  ...DAYS.map(() => document.createElement("i")),
);
// Stable asset names mean a stale webview looks identical to a fresh one.
// This is the only way to tell them apart from the device.
el("build-stamp").textContent = `Playtest · ${__BUILD_STAMP__}`;
el("world-title").textContent = world.name;
// Worlds differ in length, so the pace note cannot be a fixed number.
el("pace-note").textContent = `${DAYS.length} turns, at your own pace.`;
el("world-chapter").textContent = world.chapter;
el("atlas").setAttribute("aria-label", `${world.name} crossword`);
el("map").setAttribute("aria-label", `${world.name} crossword map`);
el("map-viewport").setAttribute("aria-label", `${world.name} crossword map`);
el("inspect-world").textContent = `Collected in ${world.name}`;
el("completion-world").textContent = `${world.name}, discovered`;
el("restart-title").textContent = `Start a fresh ${world.noun}?`;
el("restart-description").textContent =
  `Your current ${world.name} words and clues will be cleared. Your other world stays as it is.`;
const api = createGameApi<ShoreView>(undefined, undefined, {
  root: world.apiRoot,
  scenario: world.scenario,
});
const art = createShoreArt(world),
  clue = el<HTMLTextAreaElement>("active-clue"),
  discover = el<HTMLButtonElement>("discover"),
  submit = el<HTMLButtonElement>("submit"),
  editor = el<HTMLFormElement>("map-editor"),
  inspect = el<HTMLDialogElement>("inspect");
let spentElsewhere: string[] = [];
let shore = emptyShore(),
  ready = false,
  signedIn = false,
  judgeReady = false,
  canReset = false,
  busy = false,
  dirty = false,
  minimized = false,
  revision = 0,
  active: Direction = "across";
let saveTimer: ReturnType<typeof setTimeout> | undefined,
  saves: Promise<void> = Promise.resolve();
const title = (d: Direction) => (d === "across" ? "Across" : "Down");
const message = (id: string, text: string) => {
  el(id).textContent = text;
  el(id).hidden = !text;
};
const failureText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Could not save. Both drafts are still on this screen.";
const pass = (d: Direction) =>
  Boolean(shore.turn?.reviews[d]?.validWord && shore.turn.reviews[d]?.fairClue);
const editable = () => ready && !busy && Boolean(shore.turn?.revealed);
function prepareLetters() {
  if (!shore.turn?.revealed) return;
  const fixed = lettersFor(shore.completed),
    day = shore.completed.length;
  for (const direction of DIRECTIONS) {
    const word = shore.turn[direction].word
      .toUpperCase()
      .padEnd(DAYS[day]![direction].length, " ")
      .split("");
    cellsFor(day, direction).forEach((cell, i) => {
      const letter = fixed.get(cellKey(cell));
      if (letter) word[i] = letter;
    });
    const next = word.join("");
    if (next !== shore.turn[direction].word)
      shore.turn.reviews[direction] = null;
    shore.turn[direction].word = next;
  }
}
function currentDraft(): PairDraft {
  return parsePair(shore.turn)!;
}
function updateEditor() {
  renderDeck();
  const turn = shore.turn;
  editor.hidden = !turn?.revealed || minimized;
  el("restore-editor").hidden = !turn?.revealed || !minimized;
  el("turn-switch").hidden = !turn?.revealed || minimized;
  el("welcome").hidden = !turn || turn.revealed;
  el("atlas").dataset.editing = String(Boolean(turn?.revealed));
  el("atlas").dataset.overview = String(minimized);
  el("map-view").hidden = !turn?.revealed;
  el("map-view").textContent = minimized ? "Back to clue ↙" : "Full map ↗";
  el("map-view").setAttribute("aria-expanded", String(minimized));
  el("choose-criterion").setAttribute(
    "aria-expanded",
    String(!el("criterion-picker").hidden),
  );
  el("complete").hidden = turn !== null;
  el("all-clues").hidden = shore.completed.length === 0;
  for (const d of DIRECTIONS) {
    el(`${d}-tab`).setAttribute("aria-pressed", String(active === d));
    const entry = turn?.[d];
    const filled = Boolean(
      entry &&
      /^[A-Z]+$/.test(entry.word) &&
      entry.clue.trim() &&
      entry.criterion,
    );
    const reviewed = Boolean(turn?.reviews[d]);
    el(`${d}-status`).textContent = pass(d)
      ? "✓ Passed"
      : reviewed
        ? "Revise"
        : filled
          ? "Ready"
          : "";
    el(`${d}-status`).classList.toggle("revise", reviewed && !pass(d));
    el(`${d}-preview`).textContent = (
      entry?.word || " ".repeat(DAYS[shore.completed.length]?.[d].length ?? 5)
    ).replace(/ /g, "·");
    el(`${d}-rule`).textContent =
      deckFor(world).find((c) => c.id === entry?.criterion)?.name ??
      "Choose a rule";
  }
  if (!turn) return;
  if (clue.value !== turn[active].clue) clue.value = turn[active].clue;
  const wordReady = /^[A-Z]+$/.test(turn[active].word);
  el("clue-label").textContent = wordReady
    ? `A clue for ${turn[active].word}`
    : `A clue for ${title(active)}`;
  el("word-guide").textContent = wordReady
    ? "Point at it without naming it."
    : `${DAYS[shore.completed.length]![active].length} letters · choose your word in the highlighted tiles.`;
  el("clue-count").textContent = `${turn[active].clue.length} / 140`;
  const criterion = deckFor(world).find((c) => c.id === turn[active].criterion);
  el("criterion-icon").innerHTML = criterionIcon(criterion?.id ?? "");
  el("criterion-name").textContent = criterion?.name ?? "Choose a criterion";
  el("choose-criterion").setAttribute(
    "aria-label",
    `${title(active)} criterion: ${criterion?.name ?? "choose a rule"}`,
  );
  el("criterion-rule").textContent =
    criterion?.rule ?? "Give this clue a little creative constraint.";
  el("picker-title").textContent = `A rule for ${title(active)}`;
  for (const button of el(
    "criterion-options",
  ).querySelectorAll<HTMLButtonElement>("button"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.criterion === turn[active].criterion),
    );
  const review = turn.reviews[active];
  message(
    "review",
    review ? `${pass(active) ? "Passed" : "Revise"}: ${review.reason}` : "",
  );
  el("review").classList.toggle("rejected", Boolean(review && !pass(active)));
  const bothReady = DIRECTIONS.every(
    (d) =>
      /^[A-Z]+$/.test(turn[d].word) &&
      turn[d].word.length === DAYS[shore.completed.length]![d].length &&
      turn[d].clue.trim() &&
      turn[d].criterion,
  );
  submit.hidden = !bothReady;
  el("next-word").hidden = bothReady;
  const other = active === "across" ? "down" : "across";
  el("next-word").setAttribute("aria-label", `Write the ${other} word`);
  el("next-word").textContent =
    `Next: ${title(other)} ${other === "down" ? "↓" : "→"}`;
  const prepared = DIRECTIONS.filter(
    (d) =>
      /^[A-Z]+$/.test(turn[d].word) && turn[d].clue.trim() && turn[d].criterion,
  ).length;
  el("pair-status").textContent =
    prepared === 2
      ? "Both clues are ready for review."
      : `${prepared} of 2 clues ready`;
  positionMap();
}
let mapPositionFrame = 0;
let positionedPath = "";
function positionMap(force = false) {
  cancelAnimationFrame(mapPositionFrame);
  mapPositionFrame = requestAnimationFrame(() => {
    const viewport = el("map-viewport");
    const key = `${shore.completed.length}:${active}:${minimized}:${viewport.clientWidth}:${Boolean(shore.turn?.revealed)}`;
    if (!force && positionedPath === key) return;
    positionedPath = key;
    if (
      !shore.turn?.revealed ||
      minimized ||
      matchMedia("(min-width: 721px)").matches
    ) {
      viewport.scrollTop = 0;
      return;
    }
    const path = DAYS[shore.completed.length]![active];
    const map = el("map");
    const unit = (map.clientHeight + 7) / world.rows;
    viewport.style.setProperty(
      "--focus-height",
      `${active === "down" ? path.length * unit + 24 : 156}px`,
    );
    const center =
      map.offsetTop +
      (path.row + (active === "down" ? path.length / 2 : 0.5)) * unit;
    viewport.scrollTop = Math.max(0, center - viewport.clientHeight / 2);
  });
}
function showClues(items: { day: number; direction: Direction }[]) {
  const content = el("inspect-content");
  content.replaceChildren();
  for (const { day, direction } of items) {
    const pair = shore.completed[day];
    if (!pair) continue;
    const block = document.createElement("section");
    block.className = "saved-clue";
    const label = document.createElement("small"),
      word = document.createElement("p"),
      text = document.createElement("p"),
      rule = document.createElement("small"),
      strong = document.createElement("strong");
    label.textContent = `Turn ${day + 1} · ${direction === "across" ? "→ Across" : "↓ Down"}`;
    strong.textContent = pair[direction].word;
    word.append(strong);
    text.textContent = pair[direction].clue;
    rule.textContent =
      CRITERIA.find((r) => r.id === pair[direction].criterion)?.rule ?? "";
    block.append(label, word, text, rule);
    content.append(block);
  }
  if (content.children.length) inspect.showModal();
}
function focusTile(index: number, step = 1) {
  const length = DAYS[shore.completed.length]?.[active].length ?? 0;
  for (let i = index; i >= 0 && i < length; i += step) {
    const target = el("tiles").querySelector<HTMLInputElement>(
      `input[data-index="${i}"]`,
    );
    if (target) {
      target.focus();
      target.select();
      return;
    }
  }
  clue.focus();
}
function selectWord(direction: Direction, index?: number) {
  if (!editable()) return;
  active = direction;
  minimized = false;
  el("criterion-picker").hidden = true;
  message("errors", "");
  clue.removeAttribute("aria-invalid");
  updateEditor();
  renderMap();
  controls();
  if (index !== undefined) focusTile(index);
  else clue.focus();
}
function markEdited(before: PairDraft) {
  if (!shore.turn) return;
  for (const d of DIRECTIONS)
    if (
      before[d].word !== shore.turn[d].word ||
      before[d].clue !== shore.turn[d].clue ||
      before[d].criterion !== shore.turn[d].criterion
    )
      shore.turn.reviews[d] = null;
  dirty = true;
  revision++;
  clue.removeAttribute("aria-invalid");
  message("errors", "");
  el("storage-status").textContent = signedIn
    ? "Unsaved changes"
    : "Guest · not saved";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void queueSave();
  }, 500);
}
function putLetters(index: number, text: string) {
  if (!editable() || !shore.turn) return;
  const before = currentDraft(),
    day = shore.completed.length,
    layout = cellsFor(day, active),
    fixed = lettersFor(shore.completed);
  const letters = text.toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return;
  const slice = letters.slice(0, layout.length - index);
  for (let i = 0; i < slice.length; i++) {
    const expected = fixed.get(cellKey(layout[index + i]!));
    if (expected && expected !== slice[i]) {
      message(
        "errors",
        `Letter ${index + i + 1} is ${expected}, from an earlier path.`,
      );
      positionMap();
      return;
    }
  }
  for (let i = 0; i < slice.length; i++)
    writeCell(cellKey(layout[index + i]!), slice[i]!);
  markEdited(before);
  updateEditor();
  renderMap();
  focusTile(index + slice.length);
}
function writeCell(key: string, letter: string) {
  if (!shore.turn) return;
  for (const d of DIRECTIONS) {
    const index = cellsFor(shore.completed.length, d).findIndex(
      (cell) => cellKey(cell) === key,
    );
    if (index < 0) continue;
    const word = shore.turn[d].word
      .padEnd(DAYS[shore.completed.length]![d].length, " ")
      .split("");
    word[index] = letter;
    shore.turn[d].word = word.join("");
  }
}
function erase(index: number) {
  if (!editable() || !shore.turn) return;
  const before = currentDraft();
  writeCell(cellKey(cellsFor(shore.completed.length, active)[index]!), " ");
  markEdited(before);
  updateEditor();
  renderMap();
  focusTile(index);
}
function renderMap(animate = false) {
  const root = el("tiles");
  root.replaceChildren();
  const shown = shore.completed.length + (shore.turn?.revealed ? 1 : 0),
    fixed = lettersFor(shore.completed);
  const cells = new Map<
    string,
    {
      row: number;
      col: number;
      paths: { day: number; direction: Direction; index: number }[];
    }
  >();
  for (let day = 0; day < shown; day++)
    for (const direction of DIRECTIONS)
      cellsFor(day, direction).forEach((cell, index) => {
        const key = cellKey(cell);
        if (!cells.has(key)) cells.set(key, { ...cell, paths: [] });
        cells.get(key)!.paths.push({ day, direction, index });
      });
  for (const [key, cell] of cells) {
    const current = cell.paths.filter((p) => p.day === shore.completed.length),
      selected = current.find((p) => p.direction === active);
    const typed = current
      .map((p) => shore.turn?.[p.direction].word[p.index])
      .filter((v): v is string => Boolean(v && /[A-Z]/.test(v)));
    const letter = fixed.get(key) ?? typed[0] ?? "",
      conflict =
        new Set([...typed, ...(fixed.has(key) ? [fixed.get(key)!] : [])]).size >
        1;
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.cell = key;
    tile.style.gridRow = String(cell.row + 1);
    tile.style.gridColumn = String(cell.col + 1);
    if (current.length) tile.classList.add("current");
    if (selected) tile.classList.add("active");
    if (fixed.has(key)) tile.classList.add("fixed");
    const carriedFrom = seedSource.get(key);
    if (carriedFrom && !shore.completed.length) tile.classList.add("carried");
    if (conflict) tile.classList.add("conflict");
    if (animate && current.length && !fixed.has(key))
      tile.classList.add("new-tile");
    if (selected && !fixed.has(key)) {
      const field = document.createElement("input");
      field.type = "text";
      field.maxLength = 1;
      field.autocomplete = "off";
      field.autocapitalize = "characters";
      field.spellcheck = false;
      field.enterKeyHint = "next";
      field.value = letter;
      field.dataset.index = String(selected.index);
      field.setAttribute(
        "aria-label",
        `${title(active)} letter ${selected.index + 1} of ${DAYS[shore.completed.length]![active].length}`,
      );
      field.disabled = !editable();
      field.addEventListener("focus", () => field.select());
      field.addEventListener("input", () => {
        if (field.value) putLetters(selected.index, field.value);
        else erase(selected.index);
      });
      field.addEventListener("paste", (event) => {
        event.preventDefault();
        putLetters(selected.index, event.clipboardData?.getData("text") ?? "");
      });
      field.addEventListener("keydown", (event) => {
        if (event.key === "Backspace") {
          event.preventDefault();
          if (field.value) erase(selected.index);
          else {
            const previous = [
              ...root.querySelectorAll<HTMLInputElement>("input"),
            ]
              .filter((n) => Number(n.dataset.index) < selected.index)
              .at(-1);
            if (previous) erase(Number(previous.dataset.index));
          }
        } else if (
          ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(
            event.key,
          )
        ) {
          event.preventDefault();
          const step = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
          focusTile(selected.index + step, step);
        } else if (event.key === "Enter") {
          event.preventDefault();
          clue.focus();
        }
      });
      tile.append(field);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "letter";
      button.textContent = letter;
      button.disabled = !ready || busy;
      button.setAttribute(
        "aria-label",
        `Row ${cell.row + 1}, column ${cell.col + 1}${letter ? `, ${letter}` : ", empty"}${carriedFrom ? `, carried from ${carriedFrom}` : ""}${current.length ? ", select " + current.map((p) => p.direction).join(" or ") : ", inspect clue"}`,
      );
      if (carriedFrom) button.title = `${letter} carried from ${carriedFrom}`;
      button.addEventListener("click", () => {
        if (current.length) {
          const next =
            current.find((p) => p.direction !== active) ?? current[0]!;
          selectWord(next.direction, next.index);
        } else showClues(cell.paths);
      });
      tile.append(button);
    }
    const starts = cell.paths.filter((p) => p.index === 0);
    if (starts.length) {
      const label = document.createElement("span");
      label.className = "number";
      label.textContent = starts
        .map((p) => `${p.day + 1}${p.direction === "across" ? "→" : "↓"}`)
        .join(" ");
      label.setAttribute("aria-hidden", "true");
      tile.append(label);
    }
    root.append(tile);
  }
  art.update(shown, [...cells.values()], animate, shore.completed.length);
  discover.hidden = !shore.turn || shore.turn.revealed;
  discover.disabled = !ready || busy;
  if (shore.turn && !shore.turn.revealed) {
    const options = DIRECTIONS.flatMap((d) =>
      cellsFor(shore.completed.length, d),
    ).filter((cell) => !fixed.has(cellKey(cell)));
    const center = options[Math.floor(options.length / 2)] ?? {
      row: 2,
      col: 2,
    };
    discover.style.left = "50%";
    discover.style.top = `${Math.min(82, Math.max(20, (center.row + 0.5) * 10))}%`;
  }
  el("discover-label").textContent = shore.completed.length
    ? "Uncover the next pair"
    : "Uncover two paths";
  el("discover-place").textContent =
    `${DAYS[shore.completed.length]?.place ?? "Shore complete"} · Turn ${shore.completed.length + 1}`;
  el("turn-label").textContent = shore.turn
    ? `Turn ${shore.completed.length + 1} of ${DAYS.length}`
    : "Every turn taken";
  el("journey-track")
    .querySelectorAll("i")
    .forEach((n, i) => {
      n.classList.toggle("done", i < shore.completed.length);
      n.classList.toggle("now", i === shore.completed.length);
    });
  el("map-caption").textContent = shore.turn?.revealed
    ? `${title(active)} · ${DAYS[shore.completed.length]![active].length} letters`
    : shore.turn
      ? `Unnamed ${world.noun}`
      : `The ${world.noun} you named`;
  el("place-title").textContent = shore.completed.length
    ? (DAYS[shore.completed.length]?.place ?? `Your ${world.noun} is complete.`)
    : world.introduction;
  el("place-copy").textContent = shore.completed.length
    ? `Two more names set down. The marker has moved on across your ${world.noun}.`
    : world.welcome;
  el("progress").textContent = shore.turn
    ? `${shore.completed.length * 2} of ${DAYS.length * 2} words written · ${shown * 2} paths found`
    : `${DAYS.length * 2} words written · ${DAYS.length} discoveries complete`;
  el("story").textContent = shore.turn?.revealed
    ? world.id === "haunted-hedge"
      ? `${shore.completed.length} of ${DAYS.length} lanterns lit · your words hold each other where they cross.`
      : "Your words hold each other where they cross."
    : shore.turn
      ? "Nothing here is named yet."
      : "Finished, and the hills are still there.";
  positionMap();
}
function controls() {
  clue.disabled = !editable();
  for (const id of [
    "across-tab",
    "down-tab",
    "choose-criterion",
    "next-word",
    "minimize",
    "restore-editor",
  ])
    el<HTMLButtonElement>(id).disabled = !editable();
  for (const button of el(
    "criterion-options",
  ).querySelectorAll<HTMLButtonElement>("button"))
    button.disabled = !editable();
  submit.disabled = !editable() || !signedIn || !judgeReady;
  submit.textContent = busy ? "Reviewing…" : "Review both ↗";
  editor.setAttribute("aria-busy", String(busy));
  submit.setAttribute(
    "aria-label",
    busy
      ? "Reviewing both clues"
      : !signedIn
        ? "Sign in to review both clues"
        : !judgeReady
          ? "Clue review unavailable"
          : "Review both clues",
  );
  el<HTMLButtonElement>("refresh").disabled = busy;
  el<HTMLButtonElement>("restart").disabled = busy || !ready || !signedIn;
  el("restart").hidden = !canReset;
  for (const id of ["worlds", "explore-worlds", "close-worlds"])
    el<HTMLButtonElement>(id).disabled = busy;
  for (const button of el("world-options").querySelectorAll<HTMLButtonElement>(
    "button",
  ))
    button.disabled =
      busy ||
      button.dataset.state === "locked" ||
      button.dataset.world === world.id;
}
function applyState(next: Shore, acceptNewRun = false) {
  const changedRun = (next.run ?? "initial") !== (shore.run ?? "initial");
  if (changedRun && !acceptNewRun) return;
  if (!changedRun && next.completed.length < shore.completed.length) return;
  const advanced =
    !changedRun && next.completed.length > shore.completed.length;
  shore = next;
  prepareLetters();
  if (advanced || changedRun) {
    dirty = false;
    revision++;
    active = "across";
    minimized = false;
    el("criterion-picker").hidden = true;
    message("errors", "");
    if (changedRun)
      message("pair-review-status", `Your fresh ${world.name} board is ready.`);
  }
  updateEditor();
  renderMap();
  controls();
  if (advanced) {
    art.celebrate();
    message("pair-review-status", "Both clues passed. The next pair is ready.");
    (shore.turn ? discover : el<HTMLButtonElement>("all-clues")).focus({
      preventScroll: true,
    });
  }
}
function queueSave() {
  clearTimeout(saveTimer);
  if (!ready || !signedIn || !shore.turn || !dirty) return saves;
  const version = revision,
    day = shore.completed.length,
    run = shore.run ?? "initial",
    snapshot = currentDraft();
  el("storage-status").textContent = "Saving…";
  saves = saves
    .catch(() => {})
    .then(async () => {
      try {
        const next = await api.request<Shore>("/draft", {
          ...snapshot,
          day,
          run,
        });
        if (next.completed.length > shore.completed.length) applyState(next);
        if (version === revision) {
          dirty = false;
          el("storage-status").textContent = "Saved";
          message("connection", "");
        }
      } catch (error) {
        if (version === revision) {
          el("storage-status").textContent = "Unsaved changes";
          message("connection", failureText(error));
          el("reconnect").hidden = false;
        }
      }
    });
  return saves;
}
clue.addEventListener("input", () => {
  if (!editable() || !shore.turn) return;
  const before = currentDraft();
  shore.turn[active].clue = clue.value;
  markEdited(before);
  updateEditor();
  controls();
});
for (const direction of DIRECTIONS)
  el(`${direction}-tab`).addEventListener("click", () =>
    selectWord(direction, 0),
  );
el("next-word").addEventListener("click", () =>
  selectWord(active === "across" ? "down" : "across", 0),
);
el("choose-criterion").addEventListener("click", () => {
  el("criterion-picker").hidden = !el("criterion-picker").hidden;
  el("choose-criterion").setAttribute(
    "aria-expanded",
    String(!el("criterion-picker").hidden),
  );
  positionMap();
  if (!el("criterion-picker").hidden)
    el("criterion-options")
      .querySelector<HTMLButtonElement>('button[aria-pressed="true"],button')
      ?.focus({ preventScroll: true });
});
el("close-picker").addEventListener("click", () => {
  el("criterion-picker").hidden = true;
  el("choose-criterion").setAttribute("aria-expanded", "false");
  positionMap();
  el("choose-criterion").focus({ preventScroll: true });
});
let renderedDeck = "";
function renderDeck() {
  // Every card is one-use, so a spent card leaves the picker for good. Rebuild
  // only when the remaining deck actually changes, to preserve focus.
  const cards = availableCards(world, shore.completed, spentElsewhere);
  const signature = cards.map((card) => card.id).join("|");
  if (signature === renderedDeck) return;
  renderedDeck = signature;
  const options = el("criterion-options");
  options.replaceChildren();
  for (const rule of cards) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "criterion-card";
    button.dataset.criterion = rule.id;
    button.innerHTML = criterionIcon(rule.id);
    const text = document.createElement("span");
    const name = document.createElement("strong"),
      detail = document.createElement("small");
    name.textContent = rule.name;
    detail.textContent = rule.label;
    text.append(name, detail);
    button.append(text);
    button.setAttribute("aria-label", `${rule.name}: ${rule.rule}`);
    button.title = rule.rule;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (!editable() || !shore.turn) return;
      const before = currentDraft();
      shore.turn[active].criterion = rule.id;
      markEdited(before);
      el("criterion-picker").hidden = true;
      updateEditor();
      controls();
      el("choose-criterion").focus({ preventScroll: true });
    });
    options.append(button);
  }
  // Cards spend across the region's open worlds, so the count is what is left
  // to you here and now, not what this world started with.
  el("deck-count").textContent =
    `${cards.length} rules in hand · ${DAYS.length * 2 - shore.completed.length * 2} to place`;
}
renderDeck();
el("minimize").addEventListener("click", () => {
  minimized = true;
  el("criterion-picker").hidden = true;
  updateEditor();
  el("restore-editor").focus({ preventScroll: true });
});
el("restore-editor").addEventListener("click", () => {
  minimized = false;
  updateEditor();
  clue.focus();
});
discover.addEventListener("click", () => {
  if (!ready || busy || !shore.turn) return;
  shore.turn.revealed = true;
  prepareLetters();
  dirty = true;
  revision++;
  active = "across";
  minimized = false;
  updateEditor();
  renderMap(true);
  controls();
  art.celebrate();
  el("across-tab").focus({ preventScroll: true });
  void queueSave();
});
el("close").addEventListener("click", () => inspect.close());
el("all-clues").addEventListener("click", () =>
  showClues(
    shore.completed.flatMap((_, day) =>
      DIRECTIONS.map((direction) => ({ day, direction })),
    ),
  ),
);
editor.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editable() || !signedIn || !judgeReady || !shore.turn) return;
  const result = validatePair(currentDraft(), shore.completed);
  if (result.issues.length) {
    const invalidDirection = result.issues[0]!.startsWith("Down:")
      ? "down"
      : "across";
    selectWord(invalidDirection);
    message("errors", result.issues[0]!);
    clue.setAttribute("aria-invalid", "true");
    positionMap();
    return;
  }
  const payload = {
    ...result.pair,
    day: shore.completed.length,
    run: shore.run ?? "initial",
  };
  dirty = true;
  revision++;
  busy = true;
  controls();
  renderMap();
  message("errors", "");
  message("pair-review-status", "Reviewing both clues.");
  void (async () => {
    await queueSave();
    try {
      const next = await api.request<Shore>("/submit", payload);
      dirty = false;
      applyState(next);
      el("storage-status").textContent = "Saved";
      if (next.turn) {
        active =
          DIRECTIONS.find(
            (d) =>
              next.turn!.reviews[d] &&
              (!next.turn!.reviews[d]!.validWord ||
                !next.turn!.reviews[d]!.fairClue),
          ) ?? active;
        updateEditor();
        message(
          "pair-review-status",
          "This pair needs a revision. Both words are still editable.",
        );
      }
    } catch (error) {
      message("errors", failureText(error));
      try {
        const view = await api.loadTurn();
        if (view.shore.completed.length > shore.completed.length)
          applyState(view.shore);
        else if (shore.turn && view.shore.turn) {
          shore.turn.reviews = view.shore.turn.reviews;
          updateEditor();
        }
      } catch {
        /* Keep both local drafts and the original error. */
      }
    } finally {
      busy = false;
      controls();
      renderMap();
      positionMap();
    }
  })();
});
async function load() {
  if (busy) return;
  busy = true;
  controls();
  message("connection", `Finding ${world.name}…`);
  await queueSave();
  await saves;
  try {
    const view = await api.loadTurn(() =>
      message("connection", "Reconnecting…"),
    );
    signedIn = view.signedIn;
    judgeReady = view.judgeReady;
    canReset = Boolean(view.canReset);
    spentElsewhere = view.spentElsewhere ?? [];
    seeds = view.seeds ?? {};
    ready = true;
    const local =
      dirty &&
      shore.completed.length === view.shore.completed.length &&
      (shore.run ?? "initial") === (view.shore.run ?? "initial")
        ? shore.turn
        : null;
    applyState(local ? { ...view.shore, turn: local } : view.shore, true);
    message(
      "connection",
      !signedIn
        ? "Sign in to save your words and clues."
        : !judgeReady
          ? "Clue review is unavailable. You can still write and save."
          : "",
    );
    el("login").hidden = signedIn;
    el("reconnect").hidden = true;
    el("storage-status").textContent = signedIn
      ? dirty
        ? "Drafts kept on this screen"
        : "Saved"
      : "Guest · not saved";
  } catch (error) {
    message("connection", failureText(error));
    el("reconnect").hidden = false;
  } finally {
    busy = false;
    controls();
    renderMap();
    positionMap();
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
el("restart").addEventListener("click", () => {
  if (!ready || busy || !signedIn || !canReset) return;
  el<HTMLDialogElement>("restart-confirm").showModal();
});
el("cancel-restart").addEventListener("click", () =>
  el<HTMLDialogElement>("restart-confirm").close(),
);
el("confirm-restart").addEventListener("click", () => {
  if (!ready || busy || !signedIn || !canReset) return;
  el<HTMLDialogElement>("restart-confirm").close();
  busy = true;
  clearTimeout(saveTimer);
  controls();
  renderMap();
  void (async () => {
    await saves;
    try {
      const next = await api.request<Shore>("/reset", {
        run: shore.run ?? "initial",
      });
      dirty = false;
      applyState(next, true);
      message("connection", "");
      el("reconnect").hidden = true;
      el("storage-status").textContent = "Saved";
      el("restart").closest("details")?.removeAttribute("open");
    } catch (error) {
      message("connection", failureText(error));
      el("reconnect").hidden = false;
    } finally {
      busy = false;
      controls();
      renderMap();
      if (!shore.turn?.revealed) discover.focus({ preventScroll: true });
    }
  })();
});
el("map-view").addEventListener("click", () => {
  minimized = !minimized;
  el("criterion-picker").hidden = true;
  updateEditor();
});
el("help").addEventListener("click", () =>
  el<HTMLDialogElement>("instructions").showModal(),
);
el("close-help").addEventListener("click", () =>
  el<HTMLDialogElement>("instructions").close(),
);
el("criterion-picker").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    el("close-picker").click();
  }
});
document.addEventListener("click", (event) => {
  const settings = document.querySelector<HTMLDetailsElement>(".settings")!;
  if (event.target instanceof Node && !settings.contains(event.target))
    settings.open = false;
});
const worldDialog = el<HTMLDialogElement>("world-picker");
function showWorlds() {
  if (busy) return;
  message("world-switch-error", "");
  worldDialog.showModal();
  void atlasMap.refresh();
}
el("worlds").addEventListener("click", showWorlds);
el("explore-worlds").addEventListener("click", showWorlds);
el("close-worlds").addEventListener("click", () => worldDialog.close());
worldDialog.addEventListener("cancel", (event) => {
  if (busy) event.preventDefault();
});
const atlasMap = createAtlasMap(el("world-options"), {
  currentWorld: world.id,
  busy: () => busy,
  open: (id) => openWorld(id),
});
async function openWorld(next: string) {
  if (busy || next === world.id) return;
  busy = true;
  controls();
  renderMap();
  message("world-switch-error", "Saving your place…");
  await queueSave();
  await saves;
  if (dirty) {
    busy = false;
    message(
      "world-switch-error",
      signedIn
        ? "Your changes could not be saved. Close this menu and reconnect before switching worlds."
        : "Sign in to save your words before switching worlds.",
    );
    controls();
    renderMap();
    return;
  }
  writePreference("world", next);
  // Reload only our iframe, retaining Devvit's signed URL query. All writes have
  // settled on the old world's API before a new world can mount.
  location.hash = next;
  location.reload();
}
window.addEventListener("resize", () => positionMap(true));
void load();
// TEMPORARY: see src/client/diag.ts. Remove with the /api/diag route.
startDiag();
