import { redis } from "@devvit/web/server";
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
  type Dependencies,
} from "./game";

const key = (user: string, day: number, part: string) =>
  `cq:${SHORE_SCENARIO}:${user}:day:${day}:${part}`;
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
  const completed: Pair[] = [];
  for (let day = 0; day < DAYS.length; day++) {
    const accepted = await redis.get(key(user, day, "accepted"));
    if (accepted) {
      completed.push(JSON.parse(accepted) as Pair);
      continue;
    }
    const raw = await redis.get(key(user, day, "draft"));
    const draft = raw ? parsePair(JSON.parse(raw)) : null;
    return {
      completed,
      turn: draft ? await withReviews(user, day, draft) : emptyPair(),
    };
  }
  return { completed, turn: null };
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
  if (day < current.completed.length) return current;
  if (day > current.completed.length)
    throw new GameError(
      409,
      "Complete both clues in this turn before discovering the next pair.",
    );
  if (!review) {
    await redis.set(key(user, day, "draft"), JSON.stringify(draft));
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
  if (day < latest.completed.length) return latest;
  await redis.set(key(user, day, "draft"), JSON.stringify(pair));
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
    await redis.set(key(user, day, "accepted"), JSON.stringify(restored), {
      nx: true,
    });
  }
  return readShore(user);
}
export const saveShore = (user: string, raw: unknown) =>
  write(user, raw, false);
export const submitShore = (user: string, raw: unknown, deps?: Dependencies) =>
  write(user, raw, true, deps);
