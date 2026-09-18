import {
  ATLAS_API_ROOT,
  ATLAS_SCENARIO,
  type AtlasView,
} from "../shared/atlas";
import { createGameApi } from "./api";

const api = createGameApi<AtlasView>(undefined, undefined, {
  root: ATLAS_API_ROOT,
  scenario: ATLAS_SCENARIO,
});

const MARK: Record<string, string> = {
  "sandy-shore": "≈",
  "glass-reach": "◇",
  "the-wrackline": "⚯",
  "the-long-pier": "⛩",
  "haunted-hedge": "☾",
};

type Options = {
  currentWorld: string;
  /** Saves the open world, then navigates. Supplied by the app shell. */
  open: (worldId: string) => void | Promise<void>;
  busy: () => boolean;
};

export function createAtlasMap(root: HTMLElement, options: Options) {
  const status = document.createElement("p");
  status.className = "atlas-status";
  status.setAttribute("role", "status");
  const links = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  links.setAttribute("class", "atlas-links");
  links.setAttribute("viewBox", "0 0 100 100");
  links.setAttribute("preserveAspectRatio", "none");
  links.setAttribute("aria-hidden", "true");
  const board = document.createElement("div");
  board.className = "atlas-board";
  const grid = document.createElement("div");
  grid.className = "atlas-grid";
  grid.append(links, board);
  const legend = document.createElement("p");
  legend.className = "atlas-legend";
  root.replaceChildren(status, grid, legend);

  let view: AtlasView | null = null;

  function render() {
    const current = view;
    if (!current) return;
    const inRun = current.nodes.filter((node) => node.inRun);
    const cols = Math.max(...current.nodes.map((n) => n.atlas.x)) + 1;
    const rows = Math.max(...current.nodes.map((n) => n.atlas.y)) + 1;
    const at = (node: (typeof current.nodes)[number]) => ({
      x: ((node.atlas.x + 0.5) / cols) * 100,
      y: ((node.atlas.y + 0.5) / rows) * 100,
    });

    const drawn = new Set<string>();
    links.replaceChildren();
    for (const node of inRun)
      for (const id of node.neighbours) {
        const other = inRun.find((candidate) => candidate.id === id);
        const pair = [node.id, id].sort().join("|");
        if (!other || drawn.has(pair)) continue;
        drawn.add(pair);
        const a = at(node),
          b = at(other);
        const edge = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        edge.setAttribute("x1", String(a.x));
        edge.setAttribute("y1", String(a.y));
        edge.setAttribute("x2", String(b.x));
        edge.setAttribute("y2", String(b.y));
        edge.setAttribute("vector-effect", "non-scaling-stroke");
        // A link is live once either end is explored terrain.
        edge.setAttribute(
          "class",
          node.state === "completed" || other.state === "completed"
            ? "atlas-link lit"
            : "atlas-link",
        );
        links.append(edge);
      }

    board.replaceChildren();
    board.style.setProperty("--atlas-cols", String(cols));
    board.style.setProperty("--atlas-rows", String(rows));
    for (const node of current.nodes) {
      const position = at(node);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atlas-node";
      button.dataset.world = node.id;
      button.dataset.state = node.state;
      button.dataset.kind = node.kind;
      button.style.setProperty("--atlas-x", `${position.x}%`);
      button.style.setProperty("--atlas-y", `${position.y}%`);
      // Narrow screens stack the nodes; this marks the ones that are a branch
      // choice so the stacked list still reads as "pick one of these".
      const shared = current.nodes.filter(
        (peer) => peer.inRun && peer.atlas.y === node.atlas.y,
      ).length;
      if (node.inRun && shared > 1) button.dataset.choice = "true";
      const locked = node.state === "locked";
      button.disabled = locked || options.busy();
      button.setAttribute("aria-disabled", String(locked));

      const mark = document.createElement("span");
      mark.className = "atlas-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = MARK[node.id] ?? "◦";
      const copy = document.createElement("span");
      copy.className = "atlas-copy";
      const name = document.createElement("strong");
      name.textContent = node.name;
      const meta = document.createElement("small");
      meta.className = "atlas-meta";
      meta.textContent = node.inRun
        ? `${node.kind === "gate" ? "Gate · " : ""}${node.slots} slots`
        : "Region II";
      const why = document.createElement("small");
      why.className = "atlas-why";
      why.textContent = node.detail;
      copy.append(name, meta, why);
      button.append(mark, copy);
      button.setAttribute(
        "aria-label",
        `${node.name}. ${node.id === options.currentWorld ? "Current world. " : ""}${node.detail}`,
      );
      if (node.id === options.currentWorld) button.dataset.current = "true";
      button.addEventListener("click", () => {
        if (locked || options.busy()) return;
        void enter(node.id);
      });
      board.append(button);
    }

    const done = inRun.filter((node) => node.state === "completed").length;
    status.textContent = current.signedIn
      ? `${done} of ${inRun.length} Shallows worlds complete · ${current.streak}-day streak`
      : "Sign in to Reddit to start routing the atlas.";
    legend.textContent =
      current.nodes.find((node) => node.state === "locked")?.detail ??
      "Finish a world to reveal the worlds bordering it.";
  }

  async function enter(worldId: string) {
    const node = view?.nodes.find((candidate) => candidate.id === worldId);
    if (!node) return;
    // Worlds outside the run and already-completed worlds need no routing call.
    if (node.inRun && node.state !== "completed") {
      try {
        view = await api.request<AtlasView>("/enter", { world: worldId });
        render();
      } catch (error) {
        status.textContent =
          error instanceof Error
            ? error.message
            : "That world could not be opened. Try again.";
        return;
      }
    }
    await options.open(worldId);
  }

  async function refresh() {
    try {
      view = await api.request<AtlasView>("/map");
      render();
    } catch (error) {
      status.textContent =
        error instanceof Error
          ? error.message
          : "The atlas could not be loaded.";
    }
  }
  return { refresh, render };
}
