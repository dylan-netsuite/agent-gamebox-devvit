import { navigateTo } from "@devvit/web/client";
import { createGameApi } from "./api";
import { createShoreArt } from "./shore-art";
import { criterionIcon, visualCriteria } from "./criteria-art";
import {
  SHORE_API_ROOT,
  SHORE_SCENARIO,
  DAYS,
  DIRECTIONS,
  CRITERIA,
  cellsFor,
  cellKey,
  lettersFor,
  emptyShore,
  parsePair,
  validatePair,
  type Direction,
  type Shore,
  type ShoreView,
  type PairDraft,
} from "../shared/shore";
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const api = createGameApi<ShoreView>(undefined, undefined, {
  root: SHORE_API_ROOT,
  scenario: SHORE_SCENARIO,
});
const art = createShoreArt(),
  clue = el<HTMLTextAreaElement>("active-clue"),
  discover = el<HTMLButtonElement>("discover"),
  submit = el<HTMLButtonElement>("submit"),
  editor = el<HTMLFormElement>("map-editor"),
  inspect = el<HTMLDialogElement>("inspect");
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
  const turn = shore.turn;
  editor.hidden = !turn?.revealed || minimized;
  el("restore-editor").hidden = !turn?.revealed || !minimized;
  el("turn-switch").hidden = !turn?.revealed;
  el("complete").hidden = turn !== null;
  el("all-clues").hidden = shore.completed.length === 0;
  for (const d of DIRECTIONS) {
    el(`${d}-tab`).setAttribute("aria-pressed", String(active === d));
    el(`${d}-status`).textContent = pass(d) ? "✓" : "";
  }
  if (!turn) return;
  clue.value = turn[active].clue;
  el("clue-label").textContent = `Clue for ${title(active)}`;
  el("word-guide").textContent =
    `${DAYS[shore.completed.length]![active].length} letters · tap the tiles to write your word`;
  const criterion = visualCriteria.find((c) => c.id === turn[active].criterion);
  el("criterion-icon").innerHTML = criterionIcon(criterion?.id ?? "");
  el("criterion-name").textContent = criterion?.label ?? "Choose a criterion";
  el("choose-criterion").setAttribute(
    "aria-label",
    `${title(active)} criterion: ${criterion?.label ?? "choose a rule"}`,
  );
  el("criterion-rule").textContent = criterion?.rule ?? "";
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
  el("next-word").textContent = other === "down" ? "↓" : "→";
  positionEditor();
}
function positionEditor() {
  if (!shore.turn?.revealed) return;
  const map = el("map"),
    path = DAYS[shore.completed.length]![active];
  const unit = map.clientHeight / 10;
  const start = path.row * unit,
    end = (path.row + (active === "down" ? path.length : 1)) * unit;
  const height = Math.max(
    editor.offsetHeight,
    el("criterion-picker").hidden ? 0 : el("criterion-picker").offsetHeight,
    180,
  );
  const below = end + 10,
    above = start - height - 10;
  const top = below + height <= map.clientHeight ? below : Math.max(0, above);
  editor.style.top = `${Math.min(top, map.clientHeight - height)}px`;
  el("restore-editor").style.top =
    `${Math.min(end + 8, map.clientHeight - 50)}px`;
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
      positionEditor();
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
        `Row ${cell.row + 1}, column ${cell.col + 1}${letter ? `, ${letter}` : ", empty"}${current.length ? ", select " + current.map((p) => p.direction).join(" or ") : ", inspect clue"}`,
      );
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
  art.update(shown, [...cells.values()], animate);
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
    discover.style.left = `${(center.col + 0.5) * 20}%`;
    discover.style.top = `${(center.row + 0.5) * 10}%`;
  }
  el("discover-label").textContent = shore.completed.length
    ? "Uncover the next pair"
    : "Uncover two paths";
  el("progress").textContent = shore.turn
    ? `Turn ${shore.completed.length + 1} / 5 · ${shown * 2} paths found`
    : "10 / 10 paths discovered";
  el("story").textContent = shore.turn?.revealed
    ? "Tap a tile to write. Tap a rule to choose."
    : shore.turn
      ? "Two paths are waiting beneath the shore."
      : "";
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
  submit.textContent = busy ? "…" : "✓";
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
    if (changedRun) message("pair-review-status", "Your fresh board is ready.");
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
  el(`${direction}-tab`).addEventListener("click", () => selectWord(direction));
el("next-word").addEventListener("click", () =>
  selectWord(active === "across" ? "down" : "across", 0),
);
el("choose-criterion").addEventListener("click", () => {
  el("criterion-picker").hidden = !el("criterion-picker").hidden;
  positionEditor();
  if (!el("criterion-picker").hidden)
    el("criterion-options")
      .querySelector<HTMLButtonElement>('button[aria-pressed="true"],button')
      ?.focus({ preventScroll: true });
});
el("close-picker").addEventListener("click", () => {
  el("criterion-picker").hidden = true;
  positionEditor();
  el("choose-criterion").focus({ preventScroll: true });
});
for (const rule of visualCriteria) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "criterion-card";
  button.dataset.criterion = rule.id;
  button.innerHTML = criterionIcon(rule.id);
  const text = document.createElement("span");
  text.textContent = rule.label;
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
  el("criterion-options").append(button);
}
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
    message("errors", result.issues[0]!);
    positionEditor();
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
      positionEditor();
    }
  })();
});
async function load() {
  if (busy) return;
  busy = true;
  controls();
  message("connection", "Finding your shore…");
  await queueSave();
  await saves;
  try {
    const view = await api.loadTurn(() =>
      message("connection", "Reconnecting…"),
    );
    signedIn = view.signedIn;
    judgeReady = view.judgeReady;
    canReset = Boolean(view.canReset);
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
    positionEditor();
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
window.addEventListener("resize", positionEditor);
void load();
