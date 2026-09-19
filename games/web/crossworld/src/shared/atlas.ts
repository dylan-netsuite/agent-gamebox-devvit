// Atlas routing rules. Deliberately pure: the server owns persistence and the
// clock, and these functions own the decisions, so every rule below is testable
// without Redis and cannot drift between the client map and the server guard.
import { WORLDS, type RegionId, type WorldDefinition } from "./worlds";

export const ATLAS_SCENARIO = "atlas-shallows-v1";
export const ATLAS_API_ROOT = `/api/${ATLAS_SCENARIO}`;
/** Regions open in order; a region opens when the previous region's Gate closes. */
export const REGION_ORDER: RegionId[] = ["shallows", "hedge"];
export const REGION_LABEL: Record<RegionId, string> = {
  shallows: "Region I · The Shallows",
  hedge: "Region II · The Hedge",
};
/** The region this phase measures. Others are routed, but not counted. */
export const ATLAS_REGION: RegionId = "shallows";
/** The atlas grows outward from here. */
export const ORIGIN_WORLD = "sandy-shore";

export type WorldCompletion = {
  completedAt: number;
  date: string;
  /** Cards this world spent, read by its siblings. Absent on older records. */
  cards?: string[];
};
export type AtlasProgress = {
  /** Immutable per-world records. The only stored truth about progress. */
  completed: Record<string, WorldCompletion>;
  activeWorld: string | null;
  /** Derived from `completed`, not stored. "" before the first world. */
  lastCompletedDate: string;
  /** Derived from `completed`, not stored. */
  streak: number;
};
export const emptyAtlas = (): AtlasProgress => ({
  completed: {},
  activeWorld: null,
  lastCompletedDate: "",
  streak: 0,
});

export type LockReason =
  | "region-locked"
  | "not-adjacent"
  | "gate-locked"
  | "played-today"
  | "completed"
  | "not-in-atlas";
export type EntryCheck = { ok: true } | { ok: false; reason: LockReason };
export type NodeState = "completed" | "active" | "open" | "locked";
export type AtlasNode = {
  id: string;
  name: string;
  description: string;
  chapter: string;
  ordinal: number;
  kind: WorldDefinition["kind"];
  region: RegionId;
  atlas: { x: number; y: number };
  slots: number;
  regionLabel: string;
  neighbours: string[];
  state: NodeState;
  reason: LockReason | null;
  detail: string;
  /** False for worlds outside the routed region; those ignore atlas cadence. */
  inRun: boolean;
};
export type AtlasView = {
  scenario: string;
  signedIn: boolean;
  today: string;
  streak: number;
  frontier: string[];
  activeWorld: string | null;
  nodes: AtlasNode[];
};

export const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export function previousDay(date: string): string {
  return ymd(Date.parse(`${date}T00:00:00Z`) - 86_400_000);
}
/** Every world is routed. Nothing is reachable outside the frontier rules. */
export const atlasWorlds = () => WORLDS;
export const isAtlasWorld = (id: string) =>
  WORLDS.some((world) => world.id === id);
const worldsIn = (region: RegionId) =>
  WORLDS.filter((world) => world.region === region);
const gateFor = (region: RegionId) =>
  worldsIn(region).find((world) => world.kind === "gate");
const entryFor = (region: RegionId) =>
  worldsIn(region).reduce((first, world) =>
    world.ordinal < first.ordinal ? world : first,
  );
/** A later region stays dark until the previous region's Gate is complete. */
export function regionUnlocked(region: RegionId, done: Set<string>): boolean {
  const index = REGION_ORDER.indexOf(region);
  if (index <= 0) return true;
  const previous = REGION_ORDER[index - 1]!;
  const gate = gateFor(previous);
  return gate
    ? done.has(gate.id)
    : worldsIn(previous).every((world) => done.has(world.id));
}

/**
 * Derived, never stored. Completed worlds only ever grow, so a derived frontier
 * is monotonic — it satisfies "frontier entries never expire" without keeping a
 * second copy of the truth that could fall out of step with it.
 */
export function frontierFor(completed: Iterable<string>): string[] {
  const done = new Set(completed);
  return WORLDS.filter((world) => !done.has(world.id))
    .filter((world) => {
      if (!regionUnlocked(world.region, done)) return false;
      const peers = worldsIn(world.region);
      // A Gate borders its whole region, so it lights only when the rest is lit.
      if (world.kind === "gate")
        return peers.every((peer) => peer.kind === "gate" || done.has(peer.id));
      // The first world of a freshly opened region needs no completed neighbour.
      if (!peers.some((peer) => done.has(peer.id)))
        return world.id === entryFor(world.region).id;
      return world.neighbours.some((id) => done.has(id));
    })
    .map((world) => world.id);
}

/**
 * Derived from the immutable completion records, never from a stored counter.
 * A missed day therefore breaks the count and nothing else: the records it is
 * computed from are untouched, so progress and the frontier survive a gap. A
 * fifty-day run must not also be a fifty-day attendance record.
 */
export function streakFromDates(dates: Iterable<string>): number {
  const unique = [...new Set(dates)].sort();
  if (!unique.length) return 0;
  let streak = 1;
  for (let i = unique.length - 1; i > 0; i--) {
    if (unique[i - 1] !== previousDay(unique[i]!)) break;
    streak++;
  }
  return streak;
}
export const lastDate = (dates: Iterable<string>): string =>
  [...dates].sort().at(-1) ?? "";

/**
 * Playtest escape hatch. `ignoreCadence` skips the one-world-a-day rule so a
 * whole run can be played in one sitting. It is never set in production, and
 * it deliberately does not relax adjacency, gate or region gating: those are
 * the atlas design, not a pacing rule.
 */
export type EntryOptions = { ignoreCadence?: boolean };

/**
 * Which worlds share a one-use card pool. Cards spend across a region's open
 * worlds, so what you burn in the first world is gone from the next and the
 * route becomes a real decision. A gate deals fresh: it is the exam, and it is
 * meant to test every card again rather than whatever you have left.
 */
export const cardScope = (world: WorldDefinition): string[] =>
  world.kind === "gate"
    ? [world.id]
    : WORLDS.filter((w) => w.region === world.region && w.kind !== "gate").map(
        (w) => w.id,
      );

export function canEnter(
  worldId: string,
  progress: AtlasProgress,
  today: string,
  options: EntryOptions = {},
): EntryCheck {
  const world = WORLDS.find((candidate) => candidate.id === worldId);
  if (!world) return { ok: false, reason: "not-in-atlas" };
  // Completed terrain is permanent and is never re-entered for judging.
  if (progress.completed[worldId]) return { ok: false, reason: "completed" };
  // A part-finished world is always resumable, including on a later day.
  if (progress.activeWorld === worldId) return { ok: true };
  const done = new Set(Object.keys(progress.completed));
  if (!regionUnlocked(world.region, done))
    return { ok: false, reason: "region-locked" };
  if (!frontierFor(Object.keys(progress.completed)).includes(worldId))
    return {
      ok: false,
      reason: world.kind === "gate" ? "gate-locked" : "not-adjacent",
    };
  // Read the cadence straight off the completion records rather than trusting
  // the derived field, so a caller cannot hand in a progress object whose
  // summary disagrees with its own history.
  const finishedToday =
    lastDate(Object.values(progress.completed).map((entry) => entry.date)) ===
    today;
  if (finishedToday && !options.ignoreCadence)
    return { ok: false, reason: "played-today" };
  return { ok: true };
}

/** Non-gate worlds still to clear in this world's own region. */
const remainingIn = (region: RegionId, progress: AtlasProgress) =>
  worldsIn(region).filter(
    (world) => world.kind !== "gate" && !progress.completed[world.id],
  ).length;

const lockDetail = (
  reason: LockReason,
  remaining: number,
  world: WorldDefinition,
): string => {
  switch (reason) {
    case "region-locked": {
      const index = REGION_ORDER.indexOf(world.region);
      const gate = gateFor(REGION_ORDER[index - 1] ?? world.region);
      return `${REGION_LABEL[world.region]} opens once ${gate?.name ?? "the previous Gate"} is complete.`;
    }
    case "gate-locked":
      return `The Gate opens once all three Shallows worlds are complete. ${remaining} to go.`;
    case "played-today":
      return "One world a day. Your next choice opens tomorrow.";
    case "not-adjacent":
      return "Not reachable yet. Finish a world that borders this one.";
    default:
      return "Not available.";
  }
};

export function atlasNodes(
  progress: AtlasProgress,
  today: string,
  options: EntryOptions = {},
): AtlasNode[] {
  return WORLDS.map((world) => {
    const base = {
      id: world.id,
      name: world.name,
      description: world.description,
      chapter: world.chapter,
      ordinal: world.ordinal,
      kind: world.kind,
      region: world.region,
      atlas: world.atlas,
      slots: world.days.length * 2,
      neighbours: world.neighbours,
      regionLabel: REGION_LABEL[world.region],
      // Only the measured region counts toward the Shallows progress line.
      inRun: world.region === ATLAS_REGION,
    };
    if (progress.completed[world.id])
      return {
        ...base,
        state: "completed" as const,
        reason: null,
        detail: `Complete · ${progress.completed[world.id]!.date}`,
      };
    const check = canEnter(world.id, progress, today, options);
    if (check.ok)
      return {
        ...base,
        state:
          progress.activeWorld === world.id
            ? ("active" as const)
            : ("open" as const),
        reason: null,
        detail:
          progress.activeWorld === world.id
            ? "In progress. Pick up where you left off."
            : "Ready to explore.",
      };
    return {
      ...base,
      state: "locked" as const,
      reason: check.reason,
      detail: lockDetail(
        check.reason,
        remainingIn(world.region, progress),
        world,
      ),
    };
  });
}
