import {
  freshTurn,
  restoreTurn,
  RESTRICTIONS,
  SCENARIO,
  clueWords,
  submitTurn,
  recordReview,
  usedRestrictions,
  turnReport,
} from "./rules.mjs";

const $ = (id) => document.getElementById(id);
const session =
  new URLSearchParams(location.search)
    .get("session")
    ?.replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64) || "player";
const storageKey = `${SCENARIO}:${session}`;
let turn = freshTurn();
try {
  turn = restoreTurn(JSON.parse(localStorage.getItem(storageKey)));
} catch {
  storageWarning();
}

function storageWarning() {
  $("storage-status").textContent =
    "Browser storage is unavailable. Keep this tab open and copy your turn before leaving.";
}
function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(turn));
  } catch {
    storageWarning();
  }
}

for (const restriction of RESTRICTIONS) {
  const label = document.createElement("label");
  label.className = "restriction";
  const input = document.createElement("input");
  input.type = "radio";
  input.name = "restriction";
  input.value = restriction.id;
  const body = document.createElement("span");
  const title = document.createElement("strong");
  title.textContent = restriction.name;
  const text = document.createElement("span");
  text.textContent = restriction.rule;
  body.append(title, text);
  label.append(input, body);
  $("restrictions").append(label);
  input.addEventListener("change", () => {
    turn.restriction = input.value;
    clearErrors();
    save();
  });
}

function drawBoard() {
  $("board").replaceChildren();
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (row === 1 && col >= 1 && col <= 3) {
        cell.classList.add("old");
        cell.textContent = "MAP"[col - 1];
      }
      if (col === 2) {
        cell.classList.add("target");
        cell.textContent =
          row === 1 ? "A" : turn.word.trim().toUpperCase()[row] || "";
        if (row === 1) cell.classList.add("crossing");
        if (turn.status === "accepted") cell.classList.add("accepted");
        if (row === 0) {
          const number = document.createElement("small");
          number.textContent = "1";
          cell.append(number);
        }
      }
      $("board").append(cell);
    }
  }
}

function clearErrors() {
  $("errors").hidden = true;
  $("errors").replaceChildren();
}
function showErrors(issues) {
  clearErrors();
  const list = document.createElement("ul");
  for (const issue of issues) {
    const item = document.createElement("li");
    item.textContent = issue;
    list.append(item);
  }
  $("errors").append(list);
  $("errors").hidden = false;
}

function render() {
  const locked = !turn.revealed || turn.status !== "editing";
  $("concealed").hidden = turn.revealed;
  $("revealed").hidden = !turn.revealed;
  $("board-badge").textContent =
    turn.status === "accepted"
      ? "Accepted"
      : turn.revealed
        ? "Revealed"
        : "Unrevealed";
  $("restriction-fieldset").disabled = locked;
  $("word").disabled = locked;
  $("clue").disabled = locked;
  $("submit").disabled = locked;
  $("word").value = turn.word;
  $("clue").value = turn.clue;
  for (const input of document.querySelectorAll("input[name=restriction]"))
    input.checked = input.value === turn.restriction;
  $("counter").textContent =
    `${clueWords(turn.clue).length} words · ${turn.clue.length}/140`;
  $("remaining").textContent = `${7 - usedRestrictions(turn).length} available`;
  $("result").hidden = turn.status === "editing";
  $("result-title").textContent =
    turn.status === "accepted"
      ? "Your mock turn is complete."
      : "Ready for clue review";
  $("result-tag").textContent =
    turn.status === "accepted"
      ? "MANUAL REVIEW RECORDED"
      : "RULE CHECKS PASSED";
  $("result-copy").textContent =
    turn.status === "accepted"
      ? "One word added. One restriction spent. The next six slots remain unknown. This mock ends here."
      : "Your restriction is still available. Copy your turn into our chat so we can review the clue’s meaning.";
  $("report").value = turnReport(turn);
  $("review-controls").hidden = turn.status !== "pending";
  $("revise").hidden = turn.status === "accepted";
  drawBoard();
}

$("reveal").addEventListener("click", () => {
  turn.revealed = true;
  save();
  render();
  document.querySelector("input[name=restriction]").focus();
});
for (const id of ["word", "clue"])
  $(id).addEventListener("input", () => {
    turn[id] = $(id).value;
    clearErrors();
    save();
    $("counter").textContent =
      `${clueWords(turn.clue).length} words · ${turn.clue.length}/140`;
    drawBoard();
  });
$("turn-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const result = submitTurn(turn);
  if (result.issues.length) {
    showErrors(result.issues);
    return;
  }
  turn = result.turn;
  clearErrors();
  save();
  render();
  $("result").focus();
});
$("revise").addEventListener("click", () => {
  turn.status = "editing";
  turn.reviewNote = "";
  save();
  render();
  $("clue").focus();
});
$("record-review").addEventListener("click", () => {
  const result = recordReview(turn, $("verdict").value, $("review-note").value);
  $("review-error").textContent = result.error;
  if (result.error) return;
  turn = result.turn;
  save();
  render();
  if (turn.status === "editing") {
    showErrors([`Review requested a revision: ${turn.reviewNote}`]);
    $("clue").focus();
  }
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(turnReport(turn));
    $("copy-status").textContent =
      "Copied. Paste your turn into our chat for review.";
  } catch {
    $("report").focus();
    $("report").select();
    $("copy-status").textContent =
      "Select and copy the turn record above, then paste it into our chat.";
  }
});
$("reset").addEventListener("click", () => {
  if (!confirm("Clear this mock turn and start fresh?")) return;
  turn = freshTurn();
  save();
  clearErrors();
  $("review-error").textContent = "";
  $("copy-status").textContent = "";
  $("verdict").value = "";
  $("review-note").value = "";
  render();
  $("reveal").focus();
});
render();
