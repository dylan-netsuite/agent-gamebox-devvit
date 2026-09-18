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
    const cols = Math.max(...current.nodes.map((n) => n.atlas.x)) + 1;
    const rows = Math.max(...current.nodes.map((n) => n.atlas.y)) + 1;

    board.replaceChildren();
    board.style.setProperty("--atlas-cols", String(cols));
    board.style.setProperty("--atlas-rows", String(rows));
    for (const node of current.nodes) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atlas-node";
      button.dataset.world = node.id;
      button.dataset.state = node.state;
      button.dataset.kind = node.kind;
      // Grid placement, so two cards can never occupy the same space.
      button.style.setProperty("--atlas-col", String(node.atlas.x + 1));
      button.style.setProperty("--atlas-row", String(node.atlas.y + 1));
      // Narrow screens stack the nodes; this marks the ones that are a branch
      // choice so the stacked list still reads as "pick one of these".
      const shared = current.nodes.filter(
        (peer) => peer.atlas.y === node.atlas.y,
      ).length;
      if (shared > 1) button.dataset.choice = "true";
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
      meta.textContent = `${node.regionLabel.split(" · ")[0]} · ${node.kind === "gate" ? "Gate · " : ""}${node.slots} slots`;
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
    drawLinks(current);

    const inRun = current.nodes.filter((node) => node.inRun);
    const done = inRun.filter((node) => node.state === "completed").length;
    status.textContent = current.signedIn
      ? `${done} of ${inRun.length} Shallows worlds complete · ${current.streak}-day streak`
      : "Sign in to Reddit to start routing the atlas.";
    legend.textContent =
      current.nodes.find((node) => node.inRun && node.state === "locked")
        ?.detail ?? "Finish a world to reveal the worlds bordering it.";
  }

  /**
   * Connector endpoints are measured from the laid-out cards rather than from
   * abstract grid percentages, so they stay correct whatever height a card
   * grows to. Links are decorative and are dropped on the stacked layout.
   */
  function drawLinks(current: AtlasView) {
    links.replaceChildren();
    if (!matchMedia("(min-width: 760px)").matches) return;
    const box = board.getBoundingClientRect();
    if (!box.width || !box.height) return;
    links.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const centre = (id: string) => {
      const node = board.querySelector<HTMLElement>(`[data-world="${id}"]`);
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: rect.left - box.left + rect.width / 2,
        y: rect.top - box.top + rect.height / 2,
      };
    };
    const drawn = new Set<string>();
    for (const node of current.nodes)
      for (const id of node.neighbours) {
        const pair = [node.id, id].sort().join("|");
        if (drawn.has(pair)) continue;
        drawn.add(pair);
        const from = centre(node.id),
          to = centre(id);
        if (!from || !to) continue;
        const other = current.nodes.find((peer) => peer.id === id);
        const edge = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        edge.setAttribute("x1", String(from.x));
        edge.setAttribute("y1", String(from.y));
        edge.setAttribute("x2", String(to.x));
        edge.setAttribute("y2", String(to.y));
        // A link is live once either end is explored terrain.
        edge.setAttribute(
          "class",
          node.state === "completed" || other?.state === "completed"
            ? "atlas-link lit"
            : "atlas-link",
        );
        links.append(edge);
      }
  }
  addEventListener("resize", () => {
    if (view) drawLinks(view);
  });

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
