import {
  JOURNEY_SCENARIO,
  PATHS,
  validatePath,
  type Journey,
} from "../shared/journey";
import { createTurnGame, GameError, type Dependencies } from "./game";
import { parseDraft, type Turn } from "../shared/types";

const pathGame = (path: number, completed: Turn[]) =>
  createTurnGame(
    `${JOURNEY_SCENARIO}:path:${path}`,
    (draft) => validatePath(draft, completed),
    JOURNEY_SCENARIO,
  );

export async function readJourney(user: string): Promise<Journey> {
  const completed: Turn[] = [];
  // Accepted records are immutable. The prefix can only grow, never change underneath a request.
  for (let path = 0; path < PATHS.length; path++) {
    const turn = await pathGame(path, completed).readTurn(user);
    if (turn.status !== "accepted") return { completed, turn };
    completed.push(turn);
  }
  return { completed, turn: null };
}

async function writePath(
  user: string,
  raw: unknown,
  review: boolean,
  deps?: Dependencies,
) {
  const draft = parseDraft(raw);
  const path =
    raw && typeof raw === "object" && "path" in raw ? raw.path : null;
  if (
    !draft ||
    typeof path !== "number" ||
    !Number.isInteger(path) ||
    path < 0 ||
    path >= PATHS.length
  )
    throw new GameError(400, "Choose a valid path and draft.");
  const journey = await readJourney(user);
  if (path > journey.completed.length)
    throw new GameError(
      409,
      "Complete the open path before exploring further.",
    );
  // Late saves/retries never rewrite an earlier path, consume another rule, or review again.
  if (path < journey.completed.length) return journey;
  const game = pathGame(path, journey.completed);
  if (review) await game.submit(user, draft, deps);
  else await game.saveDraft(user, draft);
  return readJourney(user);
}
export const saveJourney = (user: string, raw: unknown) =>
  writePath(user, raw, false);
export const submitJourney = (
  user: string,
  raw: unknown,
  deps?: Dependencies,
) => writePath(user, raw, true, deps);
