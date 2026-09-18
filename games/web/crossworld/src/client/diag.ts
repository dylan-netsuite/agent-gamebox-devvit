// TEMPORARY instrumentation for the mobile stray-glyph bug: a letter renders
// far below the grid instead of inside its tile, and it only reproduces on a
// real device, where no inspector can attach inside the Reddit app's webview.
//
// Each capture POSTs DOM geometry to /api/diag, which logs one CW_DIAG line.
// Read it with `npx devvit logs r/crossworld_game_dev`.
//
// Delete this file, its import in app.ts, and the /api/diag route once the root
// cause is known. Nothing here reads or writes game state.

const ENDPOINT = "/api/diag";
const MAX_GLYPHS = 40;
// Correlates captures within one sitting without touching Reddit identity.
const session = Math.random().toString(36).slice(2, 8);

type Box = { x: number; y: number; w: number; h: number };
const box = (rect: DOMRect): Box => ({
  x: Math.round(rect.x),
  y: Math.round(rect.y),
  w: Math.round(rect.width),
  h: Math.round(rect.height),
});

function describe(node: Element | null): string {
  if (!node) return "-";
  const id = node.id ? `#${node.id}` : "";
  // SVG elements expose className as SVGAnimatedString, not a string.
  const names = typeof node.className === "string" ? node.className.trim() : "";
  const classes = names ? `.${names.split(/\s+/).join(".")}` : "";
  return `${node.tagName.toLowerCase()}${id}${classes}`;
}

function chain(node: Element | null): string {
  const parts: string[] = [];
  let current = node;
  while (current && parts.length < 4) {
    parts.push(describe(current));
    current = current.parentElement;
  }
  return parts.join(" < ");
}

// Ranges are used instead of the parent's box so a bare text node reports the
// glyph's own position rather than its container's.
function glyphs() {
  const found: { text: string; at: string; box: Box }[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (
    let node = walker.nextNode();
    node && found.length < MAX_GLYPHS;
    node = walker.nextNode()
  ) {
    const text = (node.nodeValue ?? "").trim();
    if (!/^[A-Za-z]$/.test(text)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    found.push({
      text,
      at: chain(node.parentElement),
      box: box(range.getBoundingClientRect()),
    });
  }
  return found;
}

function tileInputs() {
  return [...document.querySelectorAll<HTMLInputElement>("#tiles input")].map(
    (field) => ({
      i: field.dataset.index ?? "?",
      v: field.value,
      box: box(field.getBoundingClientRect()),
    }),
  );
}

export function captureDiag(tag: string) {
  try {
    const map = document.getElementById("map");
    const tiles = document.getElementById("tiles");
    const style = map ? getComputedStyle(map) : null;
    const payload = {
      s: session,
      tag,
      ua: navigator.userAgent.slice(0, 160),
      vp: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
      // aspect-ratio and clientH re-test the collapsed-board theory on a real
      // device; Playwright WebKit never reproduced it.
      map: map
        ? {
            box: box(map.getBoundingClientRect()),
            clientH: map.clientHeight,
            ratio: style?.aspectRatio ?? "",
            rows: style?.getPropertyValue("--map-rows").trim() ?? "",
            cols: style?.getPropertyValue("--map-cols").trim() ?? "",
          }
        : null,
      tiles: tiles
        ? {
            box: box(tiles.getBoundingClientRect()),
            kids: tiles.childElementCount,
            // A correct tile is one grid track tall (~46px at 528/10 with a
            // 7px gap). A tile near the full board height would mean the track
            // itself is wrong, not just the field inside it.
            cells: [...tiles.children].slice(0, 12).map((tile) => ({
              k: (tile as HTMLElement).dataset.cell ?? "?",
              box: box(tile.getBoundingClientRect()),
            })),
          }
        : null,
      active: describe(
        document.activeElement instanceof Element
          ? document.activeElement
          : null,
      ),
      inputs: tileInputs(),
      glyphs: glyphs(),
    };
    // keepalive so a capture fired on blur still leaves a backgrounding webview.
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Diagnostics must never break the game. */
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;
const later = (tag: string, wait: number) => {
  clearTimeout(timer);
  timer = setTimeout(() => captureDiag(tag), wait);
};

const inTiles = (target: EventTarget | null) =>
  target instanceof Element && target.closest("#tiles");

export function startDiag() {
  // renderMap() replaces every tile on each keystroke, so listeners are
  // delegated on document rather than bound to the inputs themselves.
  later("load", 1500);
  document.addEventListener("input", (event) => {
    if (inTiles(event.target)) later("input", 700);
  });
  document.addEventListener("focusout", (event) => {
    if (inTiles(event.target)) later("blur", 400);
  });
  (globalThis as typeof globalThis & { __cwDiag?: () => void }).__cwDiag = () =>
    captureDiag("manual");
}
