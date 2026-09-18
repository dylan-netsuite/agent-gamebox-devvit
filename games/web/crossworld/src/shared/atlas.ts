// Atlas routing rules. Deliberately pure: the server owns persistence and the
// clock, and these functions own the decisions, so every rule below is testable
// without Redis and cannot drift between the client map and the server guard.
import { WORLDS, type RegionId, type WorldDefinition } from "./worlds";

export const ATLAS_SCENARIO = "atlas-shallows-v1";
export const ATLAS_API_ROOT = `/api/${ATLAS_SCENARIO}`;
/** The Phase 1 slice routes Region I only. */
export const ATLAS_REGION: RegionId = "shallows";
/** The atlas grows outward from here. */
export const ORIGIN_WORLD = "sandy-shore";

export type WorldCompletion = { completedAt: number; date: string };
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
export const atlasWorlds = () =>
  WORLDS.filter((world) => world.region === ATLAS_REGION);
export const isAtlasWorld = (id: string) =>
  atlasWorlds().some((world) => world.id === id);

/**
 * Derived, never stored. Completed worlds only ever grow, so a derived frontier
 * is monotonic — it satisfies "frontier entries never expire" without keeping a
 * second copy of the truth that could fall out of step with it.
 */
export function frontierFor(completed: Iterable<string>): string[] {
  const done = new Set(completed);
  const region = atlasWorlds();
  return region
    .filter((world) => !done.has(world.id))
    .filter((world) => {
      // A Gate borders its whole region, so it lights only when the rest is lit.
      if (world.kind === "gate")
        return region.every(
          (peer) => peer.kind === "gate" || done.has(peer.id),
        );
      if (!done.size) return world.id === ORIGIN_WORLD;
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

export function canEnter(
  worldId: string,
  progress: AtlasProgress,
  today: string,
): EntryCheck {
  const world = atlasWorlds().find((candidate) => candidate.id === worldId);
  if (!world) return { ok: false, reason: "not-in-atlas" };
  // Completed terrain is permanent and is never re-entered for judging.
  if (progress.completed[worldId]) return { ok: false, reason: "completed" };
  // A part-finished world is always resumable, including on a later day.
  if (progress.activeWorld === worldId) return { ok: true };
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
  if (finishedToday) return { ok: false, reason: "played-today" };
  return { ok: true };
}

const lockDetail = (reason: LockReason, remaining: number): string => {
  switch (reason) {
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
): AtlasNode[] {
  const remaining = atlasWorlds().filter(
    (world) => world.kind !== "gate" && !progress.completed[world.id],
  ).length;
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
    };
    // Worlds outside the routed region stay playable but sit outside the run:
    // they never gate the day, never break the streak, and never light the Gate.
    if (world.region !== ATLAS_REGION)
      return {
        ...base,
        state: "open" as const,
        reason: null,
        inRun: false,
        detail: "Open any time. Outside the Shallows run.",
      };
    if (progress.completed[world.id])
      return {
        ...base,
        state: "completed" as const,
        reason: null,
        inRun: true,
        detail: `Complete · ${progress.completed[world.id]!.date}`,
      };
    const check = canEnter(world.id, progress, today);
    if (check.ok)
      return {
        ...base,
        state:
          progress.activeWorld === world.id
            ? ("active" as const)
            : ("open" as const),
        reason: null,
        inRun: true,
        detail:
          progress.activeWorld === world.id
            ? "In progress. Pick up where you left off."
            : "Ready to explore.",
      };
    return {
      ...base,
      state: "locked" as const,
      reason: check.reason,
      inRun: true,
      detail: lockDetail(check.reason, remaining),
    };
  });
}
