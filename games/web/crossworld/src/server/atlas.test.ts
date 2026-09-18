import { createDevvitTest } from "@devvit/test/server/vitest";
import { expect, vi } from "vitest";
import {
  GLASS_REACH,
  HAUNTED_HEDGE,
  SANDY_SHORE,
  THE_LONG_PIER,
  THE_WRACKLINE,
  type WorldDefinition,
} from "../shared/worlds";
import { referenceDraft } from "../shared/reference-solution";
import { frontierFor } from "../shared/atlas";
import { createWorldGame } from "./shore";
import { atlasView, enterWorld, readAtlas } from "./atlas";
import type { Dependencies } from "./game";

const test = createDevvitTest();
const yes = { validWord: true, fairClue: true, reason: "Fair definition." };
// Every test drives the clock explicitly. Nothing here reads the wall clock, and
// no test needs Reddit auth or a live judge.
const at = (date: string) => Date.parse(`${date}T12:00:00Z`);
const deps = (date: string) => ({
  config: vi.fn(async () => ({ enabled: true, key: "test-placeholder" })),
  judge: vi.fn<Dependencies["judge"]>(async () => yes),
  now: () => at(date),
});
const game = (world: WorldDefinition) => createWorldGame(world);

async function play(
  user: string,
  world: WorldDefinition,
  date: string,
  days = world.days.length,
) {
  const d = deps(date);
  for (let day = 0; day < days; day++)
    await game(world).submit(user, referenceDraft(world, day), d);
  return d;
}

test("a world may only be written in once it borders completed terrain", async () => {
  const d = deps("2026-10-01");
  for (const world of [GLASS_REACH, THE_WRACKLINE])
    await expect(
      game(world).submit("router", referenceDraft(world, 0), d),
    ).rejects.toThrow("not reachable yet");
  await expect(
    game(THE_LONG_PIER).submit("router", referenceDraft(THE_LONG_PIER, 0), d),
  ).rejects.toThrow("all three Shallows worlds are complete");
  // Nothing reached the paid judge, and nothing was recorded.
  expect(d.judge).not.toHaveBeenCalled();
  expect((await readAtlas("router")).completed).toEqual({});
  // The origin is always open.
  await play("router", SANDY_SHORE, "2026-10-01");
  expect(Object.keys((await readAtlas("router")).completed)).toEqual([
    SANDY_SHORE.id,
  ]);
});

test("finishing a world does not buy the next one until the calendar day turns over", async () => {
  await play("daily", SANDY_SHORE, "2026-10-01");
  const same = deps("2026-10-01");
  // Both branches are revealed, and both are blocked until tomorrow.
  for (const world of [GLASS_REACH, THE_WRACKLINE])
    await expect(
      game(world).submit("daily", referenceDraft(world, 0), same),
    ).rejects.toThrow("One world a day");
  expect(same.judge).not.toHaveBeenCalled();
  const next = deps("2026-10-02");
  await game(GLASS_REACH).submit(
    "daily",
    referenceDraft(GLASS_REACH, 0),
    next,
  );
  expect(next.judge).toHaveBeenCalledTimes(2);
  expect((await readAtlas("daily")).activeWorld).toBe(GLASS_REACH.id);
});

test("a part-finished world is resumable the same day and on a later day", async () => {
  // One of Sandy Shore's two discoveries, then the rest the same day.
  await play("resumer", SANDY_SHORE, "2026-10-01", 1);
  let state = await readAtlas("resumer");
  expect(state.activeWorld).toBe(SANDY_SHORE.id);
  expect(state.completed).toEqual({});
  await game(SANDY_SHORE).submit(
    "resumer",
    referenceDraft(SANDY_SHORE, 1),
    deps("2026-10-01"),
  );
  expect(Object.keys((await readAtlas("resumer")).completed)).toEqual([
    SANDY_SHORE.id,
  ]);
  // Start the next world, leave it, and come back three days later.
  await play("resumer", GLASS_REACH, "2026-10-02", 1);
  await game(GLASS_REACH).submit(
    "resumer",
    referenceDraft(GLASS_REACH, 1),
    deps("2026-10-05"),
  );
  state = await readAtlas("resumer");
  expect(Object.keys(state.completed).sort()).toEqual(
    [GLASS_REACH.id, SANDY_SHORE.id].sort(),
  );
  expect(state.activeWorld).toBeNull();
});

test("missing days breaks the streak counter and nothing else", async () => {
  await play("lapsed", SANDY_SHORE, "2026-10-01");
  await play("lapsed", GLASS_REACH, "2026-10-02");
  expect((await readAtlas("lapsed")).streak).toBe(2);
  // A three week gap.
  await play("lapsed", THE_WRACKLINE, "2026-10-23");
  const state = await readAtlas("lapsed");
  expect(state.streak).toBe(1);
  // Progress, completion dates and the earned frontier all survive untouched.
  expect(Object.keys(state.completed).sort()).toEqual(
    [GLASS_REACH.id, SANDY_SHORE.id, THE_WRACKLINE.id].sort(),
  );
  expect(state.completed[SANDY_SHORE.id]).toMatchObject({
    date: "2026-10-01",
  });
  expect(state.lastCompletedDate).toBe("2026-10-23");
  expect(frontierFor(Object.keys(state.completed))).toEqual([
    THE_LONG_PIER.id,
  ]);
});

test("the Gate opens only once all three Shallows worlds are complete", async () => {
  await play("gater", SANDY_SHORE, "2026-10-01");
  await play("gater", GLASS_REACH, "2026-10-02");
  const early = deps("2026-10-03");
  await expect(
    game(THE_LONG_PIER).submit(
      "gater",
      referenceDraft(THE_LONG_PIER, 0),
      early,
    ),
  ).rejects.toThrow("all three Shallows worlds are complete");
  expect(early.judge).not.toHaveBeenCalled();
  await play("gater", THE_WRACKLINE, "2026-10-03");
  const view = await atlasView("gater", at("2026-10-04"));
  expect(view.frontier).toEqual([THE_LONG_PIER.id]);
  expect(view.nodes.find((node) => node.id === THE_LONG_PIER.id)).toMatchObject(
    { state: "open", kind: "gate" },
  );
  // The Gate's six slots, including its cross-discovery link, then complete the slice.
  await play("gater", THE_LONG_PIER, "2026-10-04");
  const done = await atlasView("gater", at("2026-10-04"));
  expect(done.frontier).toEqual([]);
  expect(done.streak).toBe(4);
  expect(done.nodes.filter((node) => node.state === "completed")).toHaveLength(
    4,
  );
});

test("a completed world is never re-judged, however the request arrives", async () => {
  const first = await play("locked", SANDY_SHORE, "2026-10-01");
  expect(first.judge).toHaveBeenCalledTimes(4);
  const record = (await readAtlas("locked")).completed[SANDY_SHORE.id];
  const replay = deps("2026-10-09");
  for (const day of [0, 1])
    await expect(
      game(SANDY_SHORE).submit(
        "locked",
        referenceDraft(SANDY_SHORE, day),
        replay,
      ),
    ).rejects.toThrow("already complete");
  // A draft save into a finished world is refused on the same path.
  await expect(
    game(SANDY_SHORE).save("locked", referenceDraft(SANDY_SHORE, 0)),
  ).rejects.toThrow("already complete");
  await expect(enterWorld("locked", SANDY_SHORE.id, at("2026-10-09"))).rejects
    .toThrow("already complete");
  expect(replay.judge).not.toHaveBeenCalled();
  // The original locked record is byte-for-byte unchanged.
  expect((await readAtlas("locked")).completed[SANDY_SHORE.id]).toEqual(record);
});

test("entering a world is idempotent, routed server-side, and refused when locked", async () => {
  await expect(enterWorld("enterer", GLASS_REACH.id)).rejects.toThrow(
    "not reachable yet",
  );
  await expect(enterWorld("enterer", "not-a-world")).rejects.toThrow(
    "not part of the Shallows run",
  );
  await expect(enterWorld("enterer", HAUNTED_HEDGE.id)).rejects.toThrow(
    "not part of the Shallows run",
  );
  await expect(enterWorld("enterer", 42)).rejects.toThrow("Choose a world");
  const entered = await enterWorld("enterer", SANDY_SHORE.id);
  expect(entered.activeWorld).toBe(SANDY_SHORE.id);
  expect(await enterWorld("enterer", SANDY_SHORE.id)).toEqual(entered);
});

test("worlds outside the region stay playable and never touch the run", async () => {
  await play("visitor", SANDY_SHORE, "2026-10-01");
  // Region II is reachable on a day the Shallows run is already spent.
  const hedge = deps("2026-10-01");
  const pair = {
    day: 0,
    revealed: true,
    across: { word: "OWL", clue: "Night hunter", criterion: "brief" },
    down: { word: "GHOST", clue: "Restless spirit", criterion: "no-b" },
  };
  const state = await game(HAUNTED_HEDGE).submit("visitor", pair, hedge);
  expect(state.completed).toHaveLength(1);
  // It records no completion, moves no streak and claims no active world.
  const atlas = await readAtlas("visitor");
  expect(Object.keys(atlas.completed)).toEqual([SANDY_SHORE.id]);
  expect(atlas.streak).toBe(1);
  expect(atlas.activeWorld).toBeNull();
  const view = await atlasView("visitor", at("2026-10-01"));
  expect(view.nodes.find((node) => node.id === HAUNTED_HEDGE.id)).toMatchObject(
    { inRun: false, state: "open" },
  );
});

test("the map reads without a signed-in user and shows only the origin", async () => {
  const view = await atlasView(undefined, at("2026-10-01"));
  expect(view.signedIn).toBe(false);
  expect(view.frontier).toEqual([SANDY_SHORE.id]);
  expect(view.streak).toBe(0);
  expect(
    view.nodes.filter((node) => node.inRun && node.state === "locked"),
  ).toHaveLength(3);
});
