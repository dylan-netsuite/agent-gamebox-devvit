import { createHash } from "node:crypto";
import { redis } from "@devvit/web/server";
import { SCENARIO, validateTurn } from "../shared/rules";
import {
  emptyTurn,
  parseDraft,
  type Draft,
  type Turn,
  type Judgment,
} from "../shared/types";
import {
  judgeClue,
  judgeConfig,
  JudgeUnavailable,
  MODEL,
  JUDGE_VERSION,
  type JudgeConfig,
} from "./judge";

export const USER_DAILY_LIMIT = 20;
export const INSTALLATION_DAILY_LIMIT = 200;
export const COOLDOWN_MS = 45_000;
const prefix = `cq:${SCENARIO}`;
const key = (user: string, part: string) => `${prefix}:${user}:${part}`;
function reviewKeyFor(user: string, draft: Draft): string {
  const normalized = {
    ...draft,
    word: draft.word.trim().toUpperCase(),
    clue: draft.clue.trim(),
  };
  const digest = createHash("sha256")
    .update(JSON.stringify([JUDGE_VERSION, MODEL, normalized]))
    .digest("hex");
  return key(user, `review:${digest}`);
}

export class GameError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireUser(user: string | undefined): string {
  if (!user)
    throw new GameError(401, "Sign in to Reddit to save and submit your turn.");
  return user;
}

async function readAccepted(user: string): Promise<Turn | null> {
  const value = await redis.get(key(user, "accepted"));
  return value ? (JSON.parse(value) as Turn) : null;
}

export async function readTurn(user: string): Promise<Turn> {
  const accepted = await readAccepted(user);
  if (accepted) return accepted;
  const raw = await redis.get(key(user, "draft"));
  if (!raw) return emptyTurn();
  const draft = parseDraft(JSON.parse(raw));
  if (!draft) return emptyTurn();
  const review = await redis.get(reviewKeyFor(user, draft));
  return {
    ...draft,
    status: "editing",
    review: review ? (JSON.parse(review) as Judgment) : null,
  };
}

export async function saveDraft(user: string, raw: unknown): Promise<Turn> {
  const draft = parseDraft(raw);
  if (!draft) throw new GameError(400, "The draft is invalid or too long.");
  const accepted = await readAccepted(user);
  if (accepted) return accepted;
  await redis.set(key(user, "draft"), JSON.stringify(draft));
  // A separate immutable accepted record always takes precedence over concurrent draft writes.
  return (
    (await readAccepted(user)) ?? { ...draft, status: "editing", review: null }
  );
}

type Dependencies = {
  config: () => Promise<JudgeConfig>;
  judge: (draft: Draft, config: JudgeConfig) => Promise<Judgment>;
  now: () => number;
};
const defaults: Dependencies = {
  config: judgeConfig,
  judge: judgeClue,
  now: Date.now,
};

export async function submit(
  user: string,
  raw: unknown,
  deps: Dependencies = defaults,
): Promise<Turn> {
  const parsed = parseDraft(raw);
  if (!parsed)
    throw new GameError(400, "The submission is invalid or too long.");
  const { issues, word, clue } = validateTurn(parsed);
  if (issues.length) throw new GameError(400, issues.join(" "));
  const draft = { ...parsed, word, clue };
  const saved = await saveDraft(user, draft);
  if (saved.status === "accepted") return saved;
  const reviewKey = reviewKeyFor(user, draft);
  const cached = await redis.get(reviewKey);
  if (cached) return finish(user, draft, JSON.parse(cached) as Judgment);
  const config = await deps.config();
  if (!config.enabled || !config.key) throw new JudgeUnavailable();

  const now = deps.now();
  // Keep this fixed cooldown until expiry, including errors. Never DEL a lease another request
  // may now own. It exceeds the provider deadline and prevents concurrent paid calls per user.
  const lock = await redis.set(key(user, "cooldown"), String(now), {
    nx: true,
    expiration: new Date(now + COOLDOWN_MS),
  });
  if (lock !== "OK")
    throw new GameError(
      429,
      "Please wait 45 seconds between clue reviews. Your draft is safe.",
    );
  const winner = await readAccepted(user);
  if (winner) return winner;
  const completed = await redis.get(reviewKey);
  if (completed) return finish(user, draft, JSON.parse(completed) as Judgment);

  const day = new Date(now).toISOString().slice(0, 10);
  const userLimitKey = key(user, `budget:${day}`);
  const userCount = await countReview(userLimitKey, "user-budget");
  if (userCount > USER_DAILY_LIMIT)
    throw new GameError(
      429,
      "Today’s 20-review allowance is used. Come back tomorrow; your restriction is still available.",
    );
  // Standard Devvit Redis is scoped to this subreddit installation. Global Redis
  // requires a separate platform grant and must not be a dependency for submitting.
  const installationLimitKey = `cq:judge-budget:${day}`;
  const installationCount = await countReview(
    installationLimitKey,
    "installation-budget",
  );
  if (installationCount > INSTALLATION_DAILY_LIMIT)
    throw new GameError(
      429,
      "Clue reviews have reached today’s playtest limit. Your restriction is still available.",
    );

  // Do not start a provider call after unexpectedly slow storage operations used the lease.
  if (
    deps.now() - now > 10_000 ||
    (await redis.get(key(user, "cooldown"))) !== String(now)
  )
    throw new JudgeUnavailable();
  const judgment = await deps.judge(draft, config);
  await redis.set(reviewKey, JSON.stringify(judgment), {
    expiration: new Date(now + 7 * 86_400_000),
  });
  return finish(user, draft, judgment);
}

async function countReview(
  counterKey: string,
  stage: "user-budget" | "installation-budget",
): Promise<number> {
  try {
    const count = await redis.incrBy(counterKey, 1);
    if (count === 1) await redis.expire(counterKey, 172_800);
    return count;
  } catch (failure) {
    // Raw storage errors may contain keys or request data. Emit only a fixed stage
    // and numeric RPC code; fail closed before calling the paid provider.
    const code =
      typeof failure === "object" &&
      failure !== null &&
      "code" in failure &&
      typeof failure.code === "number"
        ? failure.code
        : null;
    console.error("crossworld_budget_failed", { stage, code });
    throw new GameError(
      503,
      "Clue review could not start. Your draft is saved and your restriction is still available. Please try again.",
    );
  }
}

async function finish(
  user: string,
  draft: Draft,
  review: Judgment,
): Promise<Turn> {
  const turn: Turn = {
    ...draft,
    status: review.validWord && review.fairClue ? "accepted" : "editing",
    review,
  };
  if (turn.status === "accepted") {
    // Award and restriction consumption are represented by this one atomic record, never counters.
    await redis.set(key(user, "accepted"), JSON.stringify(turn), { nx: true });
    return (await readAccepted(user))!;
  }
  return (await readAccepted(user)) ?? turn;
}
