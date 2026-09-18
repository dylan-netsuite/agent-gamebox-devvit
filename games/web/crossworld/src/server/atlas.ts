import { redis } from "@devvit/web/server";
import {
  ATLAS_SCENARIO,
  atlasNodes,
  atlasWorlds,
  canEnter,
  emptyAtlas,
  frontierFor,
  isAtlasWorld,
  lastDate,
  streakFromDates,
  ymd,
  type AtlasProgress,
  type AtlasView,
  type LockReason,
  type WorldCompletion,
} from "../shared/atlas";
import type { WorldDefinition } from "../shared/worlds";
import { GameError } from "./game";

const metaKey = (user: string) => `cq:${ATLAS_SCENARIO}:${user}:meta`;
const worldKey = (user: string, world: string) =>
  `cq:${ATLAS_SCENARIO}:${user}:world:${world}`;

/**
 * Completions are stored one immutable record per world and are never rewritten.
 * Everything else about progress — the frontier, the streak, the last completed
 * date — is derived from them, so there is no second copy of the truth to
 * corrupt and no counter that a retry can double-count.
 */
export async function readAtlas(
  user: string | undefined,
): Promise<AtlasProgress> {
  if (!user) return emptyAtlas();
  const worlds = atlasWorlds();
  const [meta, ...records] = await Promise.all([
    redis.get(metaKey(user)),
    ...worlds.map((world) => redis.get(worldKey(user, world.id))),
  ]);
  const completed: Record<string, WorldCompletion> = {};
  worlds.forEach((world, index) => {
    const raw = records[index];
    if (raw) completed[world.id] = JSON.parse(raw) as WorldCompletion;
  });
  const dates = Object.values(completed).map((entry) => entry.date);
  const active = meta
    ? ((JSON.parse(meta) as { activeWorld?: string | null }).activeWorld ??
      null)
    : null;
  return {
    completed,
    // A completed world is no longer the active one, whatever the stored meta says.
    activeWorld: active && !completed[active] ? active : null,
    lastCompletedDate: lastDate(dates),
    streak: streakFromDates(dates),
  };
}

const refusal: Record<LockReason, { status: number; message: string }> = {
  completed: {
    status: 409,
    message:
      "This world is already complete. Completed words are permanent and are never reviewed again.",
  },
  "played-today": {
    status: 409,
    message:
      "One world a day. Your next choice opens tomorrow — your progress and streak are safe.",
  },
  "not-adjacent": {
    status: 409,
    message:
      "That world is not reachable yet. Finish a world that borders it first.",
  },
  "gate-locked": {
    status: 409,
    message: "The Long Pier opens once all three Shallows worlds are complete.",
  },
  "not-in-atlas": {
    status: 400,
    message: "That world is not part of the Shallows run.",
  },
};

export async function enterWorld(
  user: string,
  worldId: unknown,
  now = Date.now(),
): Promise<AtlasProgress> {
  if (typeof worldId !== "string" || worldId.length > 60)
    throw new GameError(400, "Choose a world to explore.");
  const progress = await readAtlas(user);
  const check = canEnter(worldId, progress, ymd(now));
  if (!check.ok) {
    const { status, message } = refusal[check.reason];
    throw new GameError(status, message);
  }
  if (progress.activeWorld !== worldId)
    await redis.set(metaKey(user), JSON.stringify({ activeWorld: worldId }));
  return readAtlas(user);
}

/**
 * Called once the final pair of a world locks. The per-world `nx` write makes
 * this idempotent: replays and concurrent submits cannot move a completion date
 * or inflate a streak.
 */
export async function recordCompletion(
  user: string,
  world: WorldDefinition,
  now = Date.now(),
): Promise<void> {
  if (!isAtlasWorld(world.id)) return;
  const record: WorldCompletion = { completedAt: now, date: ymd(now) };
  await redis.set(worldKey(user, world.id), JSON.stringify(record), {
    nx: true,
  });
  await redis.set(metaKey(user), JSON.stringify({ activeWorld: null }));
}

/**
 * The enforcement point for every write into a world, and the only way the
 * active world is ever set. Entering is implicit on a first legal write so the
 * server stays the single authority — a client cannot reach a world by skipping
 * a call, and it cannot be locked out by stale map state either. Worlds outside
 * the routed region are intentionally exempt: they stay playable and ignore
 * atlas cadence entirely.
 */
export async function assertPlayable(
  user: string,
  world: WorldDefinition,
  now = Date.now(),
): Promise<void> {
  if (!isAtlasWorld(world.id)) return;
  const progress = await readAtlas(user);
  if (progress.activeWorld === world.id) return;
  const check = canEnter(world.id, progress, ymd(now));
  if (!check.ok) {
    const { status, message } = refusal[check.reason];
    throw new GameError(status, message);
  }
  await redis.set(metaKey(user), JSON.stringify({ activeWorld: world.id }));
}

/** Dev-playtest reset only. Mirrors the per-world run rotation in shore.ts. */
export async function clearCompletion(
  user: string,
  world: WorldDefinition,
): Promise<void> {
  if (!isAtlasWorld(world.id)) return;
  await redis.del(worldKey(user, world.id));
  await redis.set(metaKey(user), JSON.stringify({ activeWorld: null }));
}

export async function atlasView(
  user: string | undefined,
  now = Date.now(),
): Promise<AtlasView> {
  const today = ymd(now);
  const progress = await readAtlas(user);
  return {
    scenario: ATLAS_SCENARIO,
    signedIn: Boolean(user),
    today,
    streak: progress.streak,
    frontier: frontierFor(Object.keys(progress.completed)),
    activeWorld: progress.activeWorld,
    nodes: atlasNodes(progress, today),
  };
}
