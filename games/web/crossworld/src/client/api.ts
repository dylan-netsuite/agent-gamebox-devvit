import { API_ROOT, SCENARIO } from "../shared/rules";
import type { GameView } from "../shared/types";

export class SessionMismatch extends Error {
  constructor() {
    super(
      "The game could not reconnect to this version. Try Reconnect below. If it still fails, reopen the game from the subreddit. Your saved turn is safe.",
    );
  }
}

// The installed Devvit webview exposes this bridge. Feature-detect it for older
// Reddit clients; never read, log, or persist its signed request context.
export async function refreshSession() {
  const bridge = (
    globalThis as typeof globalThis & {
      devvit?: { refreshToken?: () => Promise<void> };
    }
  ).devvit;
  if (typeof bridge?.refreshToken === "function") await bridge.refreshToken();
}

export function createGameApi<View extends { scenario: string } = GameView>(
  fetcher: typeof fetch = fetch,
  refresh: () => Promise<void> = refreshSession,
  options = { root: API_ROOT, scenario: SCENARIO },
) {
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetcher(`${options.root}${path}`, {
      ...(body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
      signal: AbortSignal.timeout(25_000),
    });
    if ([401, 403, 404].includes(response.status)) throw new SessionMismatch();
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw new Error(
        "The game is unavailable. Try Reconnect. Your typed draft is still here.",
      );
    const data = (await response.json()) as T & { error?: string };
    if (!response.ok)
      throw new Error(
        data.error || "Could not reach the game. Please try again.",
      );
    return data;
  }

  async function readTurn() {
    const view = await request<View>("/turn");
    if (view.scenario !== options.scenario) throw new SessionMismatch();
    return view;
  }

  async function loadTurn(onReconnect: () => void = () => {}) {
    try {
      return await readTurn();
    } catch (failure) {
      if (!(failure instanceof SessionMismatch)) throw failure;
      onReconnect();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          refresh(),
          new Promise<void>((resolve) => {
            timer = setTimeout(resolve, 4000);
          }),
        ]);
      } catch {
        /* An unsupported bridge must not prevent the bounded read retry. */
      } finally {
        clearTimeout(timer);
      }
      // Only a read is retried. Saves and paid submissions are never replayed.
      return readTurn();
    }
  }
  return { request, loadTurn };
}
