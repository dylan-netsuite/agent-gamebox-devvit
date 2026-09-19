import express from "express";
import {
  context,
  createServer,
  getServerPort,
  reddit,
} from "@devvit/web/server";
import { API_ROOT, SCENARIO } from "../shared/rules";
import { emptyTurn, type GameView } from "../shared/types";
import { readTurn, saveDraft, submit, requireUser, GameError } from "./game";
import { judgeConfig, JudgeUnavailable } from "./judge";

import {
  JOURNEY_API_ROOT,
  JOURNEY_SCENARIO,
  emptyJourney,
  type JourneyView,
} from "../shared/journey";
import { readJourney, saveJourney, submitJourney } from "./journey";
import { emptyShore, type ShoreView } from "../shared/shore";
import { WORLDS } from "../shared/worlds";
import { ATLAS_API_ROOT } from "../shared/atlas";
import { atlasView, enterWorld, seedsFor, spentElsewhere } from "./atlas";
import { createWorldGame, canResetShore } from "./shore";

const app = express();
// TEMPORARY: mobile stray-glyph diagnostics. Registered ahead of the 2kb global
// parser so a DOM geometry dump is accepted, and it never reaches game state.
// Read with `npx devvit logs r/crossworld_game_dev`. Remove with src/client/diag.ts.
app.post("/api/diag", express.json({ limit: "64kb" }), (req, res) => {
  console.log(`CW_DIAG ${JSON.stringify(req.body)}`);
  res.json({ ok: true });
});
app.use(express.json({ limit: "2kb" }));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.get(`${API_ROOT}/turn`, async (_req, res) => {
  const config = await judgeConfig();
  const view: GameView = {
    scenario: SCENARIO,
    signedIn: Boolean(context.userId),
    judgeReady: Boolean(config.enabled && config.key),
    turn: context.userId ? await readTurn(context.userId) : emptyTurn(),
  };
  res.json(view);
});
app.post(`${API_ROOT}/draft`, async (req, res) => {
  res.json(await saveDraft(requireUser(context.userId), req.body));
});
app.post(`${API_ROOT}/submit`, async (req, res) => {
  res.json(await submit(requireUser(context.userId), req.body));
});

app.get(`${JOURNEY_API_ROOT}/turn`, async (_req, res) => {
  const config = await judgeConfig();
  const view: JourneyView = {
    scenario: JOURNEY_SCENARIO,
    signedIn: Boolean(context.userId),
    judgeReady: Boolean(config.enabled && config.key),
    journey: context.userId
      ? await readJourney(context.userId)
      : emptyJourney(),
  };
  res.json(view);
});
app.post(`${JOURNEY_API_ROOT}/draft`, async (req, res) => {
  res.json(await saveJourney(requireUser(context.userId), req.body));
});
app.post(`${JOURNEY_API_ROOT}/submit`, async (req, res) => {
  res.json(await submitJourney(requireUser(context.userId), req.body));
});

// The atlas is readable signed out so the map renders for guests; every write
// path is trusted-user only and re-checks routing server-side.
app.get(`${ATLAS_API_ROOT}/map`, async (_req, res) => {
  res.json(await atlasView(context.userId));
});
app.post(`${ATLAS_API_ROOT}/enter`, async (req, res) => {
  const world =
    req.body && typeof req.body === "object" && "world" in req.body
      ? req.body.world
      : null;
  await enterWorld(requireUser(context.userId), world);
  res.json(await atlasView(context.userId));
});

// Only configured routes select a world; client-supplied identity/world fields are ignored.
for (const world of WORLDS) {
  const game = createWorldGame(world);
  app.get(`${world.apiRoot}/turn`, async (_req, res) => {
    const config = await judgeConfig();
    const view: ShoreView = {
      scenario: world.scenario,
      canReset: canResetShore(context.userId, context.subredditName),
      signedIn: Boolean(context.userId),
      judgeReady: Boolean(config.enabled && config.key),
      shore: context.userId ? await game.read(context.userId) : emptyShore(),
      spentElsewhere: await spentElsewhere(context.userId, world),
      seeds: await seedsFor(context.userId, world),
    };
    res.json(view);
  });
  app.post(`${world.apiRoot}/draft`, async (req, res) =>
    res.json(await game.save(requireUser(context.userId), req.body)),
  );
  app.post(`${world.apiRoot}/submit`, async (req, res) =>
    res.json(await game.submit(requireUser(context.userId), req.body)),
  );
  app.post(`${world.apiRoot}/reset`, async (req, res) =>
    res.json(await game.reset(context.userId, context.subredditName, req.body)),
  );
}

const createPost = () =>
  reddit.submitCustomPost({ title: "CrossWorld · Sandy Shore" });
app.post("/internal/on-app-install", async (_req, res) => {
  await createPost();
  res.json({ status: "success" });
});
app.post("/internal/menu/post-create", async (_req, res) => {
  const post = await createPost();
  res.json({ navigateTo: post.url });
});
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof GameError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (error instanceof JudgeUnavailable) {
      res.status(503).json({ error: error.message });
      return;
    }
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? error.status
        : null;
    if (status === 400 || status === 413) {
      res.status(status).json({
        error:
          "The submission could not be read. Check its length and try again.",
      });
      return;
    }
    console.error("crossword_request_failed");
    res
      .status(500)
      .json({ error: "The turn could not be saved. Please try again." });
  },
);
createServer(app).listen(getServerPort());
