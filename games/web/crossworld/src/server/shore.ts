import { redis } from "@devvit/web/server";
import { randomUUID } from "node:crypto";
import {
  SHORE_SCENARIO,
  DAYS,
  DIRECTIONS,
  asDraft,
  emptyPair,
  parsePair,
  validatePair,
  type Direction,
  type Pair,
  type PairDraft,
  type Shore,
} from "../shared/shore";
import { validateTurn } from "../shared/rules";
import {
  createTurnGame,
  GameError,
  COOLDOWN_MS,
  requireUser,
  type Dependencies,
} from "./game";

const runKey = (user: string) => `cq:${SHORE_SCENARIO}:${user}:run`;
const key = (user: string, day: number, part: string, run = "initial") =>
  `cq:${SHORE_SCENARIO}:${user}${run === "initial" ? "" : `:run:${run}`}:day:${day}:${part}`;
export const canResetShore = (
  user: string | undefined,
  subreddit: string | undefined,
) => Boolean(user && subreddit === "crossworld_game_dev");
const reviewer = (day: number, direction: Direction) =>
  createTurnGame(
    `${SHORE_SCENARIO}:day:${day}:${direction}`,
    (draft) => validateTurn(draft, null, DAYS[day]![direction].length),
    SHORE_SCENARIO,
    false,
  );
async function withReviews(
  user: string,
  day: number,
  draft: PairDraft,
): Promise<Pair> {
  const [across, down] = await Promise.all(
    DIRECTIONS.map((direction) =>
      reviewer(day, direction).readReview(user, asDraft(draft, direction)),
    ),
  );
  return { ...draft, reviews: { across: across ?? null, down: down ?? null } };
}
export async function readShore(user: string): Promise<Shore> {
  const run = (await redis.get(runKey(user))) ?? "initial";
  const version = run === "initial" ? {} : { run };
  const completed: Pair[] = [];
  for (let day = 0; day < DAYS.length; day++) {
    const accepted = await redis.get(key(user, day, "accepted", run));
    if (accepted) {
      completed.push(JSON.parse(accepted) as Pair);
      continue;
    }
    const raw = await redis.get(key(user, day, "draft", run));
    const draft = raw ? parsePair(JSON.parse(raw)) : null;
    return {
      ...version,
      completed,
      turn: draft ? await withReviews(user, day, draft) : emptyPair(),
    };
  }
  return { ...version, completed, turn: null };
}
export async function resetShore(
  user: string | undefined,
  subreddit: string | undefined,
  raw: unknown,
): Promise<Shore> {
  const id = requireUser(user);
  if (!canResetShore(id, subreddit))
    throw new GameError(
      403,
      "Starting fresh is only available in the private playtest.",
    );
  const expected =
    raw && typeof raw === "object" && "run" in raw ? raw.run : null;
  const current = (await redis.get(runKey(id))) ?? "initial";
  if (expected !== current)
    throw new GameError(
      409,
      "This board has already changed. Refresh before starting fresh.",
    );
  const locked = await redis.set(`${runKey(id)}:resetting`, "1", {
    nx: true,
    expiration: new Date(Date.now() + COOLDOWN_MS),
  });
  if (locked !== "OK")
    throw new GameError(
      429,
      "Please wait 45 seconds before starting another fresh board.",
    );
  // Rotate only this account's progress namespace. In-flight writes stay in the
  // old run; existing verdict caches, cooldowns and paid budgets remain intact.
  await redis.set(runKey(id), randomUUID());
  return readShore(id);
}
async function write(
  user: string,
  raw: unknown,
  review: boolean,
  deps?: Dependencies,
): Promise<Shore> {
  const draft = parsePair(raw);
  const day = raw && typeof raw === "object" && "day" in raw ? raw.day : null;
  if (
    !draft ||
    typeof day !== "number" ||
    !Number.isInteger(day) ||
    day < 0 ||
    day >= DAYS.length
  )
    throw new GameError(400, "Choose a valid turn and two clue drafts.");
  const current = await readShore(user);
  const run = current.run ?? "initial";
  const requestedRun =
    raw && typeof raw === "object" && "run" in raw ? raw.run : "initial";
  if (requestedRun !== run)
    throw new GameError(
      409,
      "This board was restarted. Refresh to load your fresh board.",
    );
  if (day < current.completed.length) return current;
  if (day > current.completed.length)
    throw new GameError(
      409,
      "Complete both clues in this turn before discovering the next pair.",
    );
  if (!review) {
    await redis.set(key(user, day, "draft", run), JSON.stringify(draft));
    return readShore(user);
  }
  const result = validatePair(draft, current.completed);
  if (result.issues.length) throw new GameError(400, result.issues.join(" "));
  const pair = result.pair;
  // A fixed lease prevents overlapping paired reviews. Never delete an expired lease.
  const now = deps?.now() ?? Date.now();
  const lock = await redis.set(key(user, day, "reviewing"), String(now), {
    nx: true,
    expiration: new Date(now + COOLDOWN_MS),
  });
  if (lock !== "OK")
    throw new GameError(
      429,
      "Please wait 45 seconds between pair reviews. Both drafts are safe.",
    );
  const latest = await readShore(user);
  if ((latest.run ?? "initial") !== run) return latest;
  if (day < latest.completed.length) return latest;
  await redis.set(key(user, day, "draft", run), JSON.stringify(pair));
  if ((deps?.now() ?? Date.now()) - now > 10_000)
    throw new GameError(
      503,
      "Review could not start. Both drafts are saved. Try again shortly.",
    );
  // Settle both calls before returning, even if one provider request fails. Each reuses
  // the existing fixed cooldown, cached verdict, daily budget and server-only judge.
  const reviews = await Promise.allSettled(
    DIRECTIONS.map((direction) =>
      reviewer(day, direction).submit(user, asDraft(pair, direction), deps),
    ),
  );
  const failure = reviews.find((r) => r.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  const restored = await withReviews(user, day, pair);
  if (
    DIRECTIONS.every(
      (direction) =>
        restored.reviews[direction]?.validWord &&
        restored.reviews[direction]?.fairClue,
    )
  ) {
    // Both words, their criteria and reviews are ONE immutable award.
    // Partial passes never lock a word, or advance the day.
    await redis.set(key(user, day, "accepted", run), JSON.stringify(restored), {
      nx: true,
    });
  }
  return readShore(user);
}
export const saveShore = (user: string, raw: unknown) =>
  write(user, raw, false);
export const submitShore = (user: string, raw: unknown, deps?: Dependencies) =>
  write(user, raw, true, deps);
