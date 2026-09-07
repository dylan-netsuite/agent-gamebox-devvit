import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameApi, SessionMismatch } from "./api";
import { SCENARIO, API_ROOT } from "../shared/rules";
import { emptyTurn } from "../shared/types";

const view = {
  scenario: SCENARIO,
  signedIn: true,
  judgeReady: true,
  turn: emptyTurn(),
};
const json = (data: unknown, status = 200) => Response.json(data, { status });
afterEach(() => vi.useRealTimers());

describe("session recovery", () => {
  it("loads the current scenario without refreshing or issuing a write", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(view));
    const refresh = vi.fn().mockResolvedValue(undefined);
    expect(await createGameApi(fetcher, refresh).loadTurn()).toEqual(view);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]![0]).toBe(`${API_ROOT}/turn`);
    expect(fetcher.mock.calls[0]![1]?.method).toBeUndefined();
    expect(refresh).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404])(
    "refreshes stale context on HTTP %s and restores the saved turn",
    async (status) => {
      const saved = {
        ...view,
        turn: {
          ...emptyTurn(),
          revealed: true,
          word: "LAMPS",
          clue: "Lights on tables",
        },
      };
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(json({}, status))
        .mockResolvedValueOnce(json(saved));
      const refresh = vi.fn().mockResolvedValue(undefined);
      expect(await createGameApi(fetcher, refresh).loadTurn()).toEqual(saved);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(fetcher).toHaveBeenCalledTimes(2);
    },
  );
  it("rejects another scenario on both reads without returning its progress", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () =>
        json({ ...view, scenario: "older-scenario" }),
      );
    await expect(
      createGameApi(fetcher, async () => {}).loadTurn(),
    ).rejects.toBeInstanceOf(SessionMismatch);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("never retries a failed paid submission", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({}, 404));
    const refresh = vi.fn();
    await expect(
      createGameApi(fetcher, refresh).request("/submit", emptyTurn()),
    ).rejects.toBeInstanceOf(SessionMismatch);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("preserves service errors and does not mistake them for stale versions", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({ error: "Review unavailable" }, 503));
    const refresh = vi.fn();
    await expect(createGameApi(fetcher, refresh).loadTurn()).rejects.toThrow(
      "Review unavailable",
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("finishes recovery if the Reddit bridge never responds", async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({}, 404))
      .mockResolvedValueOnce(json(view));
    const pending = createGameApi(
      fetcher,
      () => new Promise(() => {}),
    ).loadTurn();
    await vi.advanceTimersByTimeAsync(4000);
    expect(await pending).toEqual(view);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("can recover when older clients reject context refresh", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({}, 404))
      .mockResolvedValueOnce(json(view));
    expect(
      await createGameApi(fetcher, async () => {
        throw new Error("Unsupported effect");
      }).loadTurn(),
    ).toEqual(view);
  });
});
