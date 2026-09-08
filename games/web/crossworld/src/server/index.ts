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
import {
  SHORE_API_ROOT,
  SHORE_SCENARIO,
  emptyShore,
  type ShoreView,
} from "../shared/shore";
import {
  readShore,
  saveShore,
  submitShore,
  resetShore,
  canResetShore,
} from "./shore";

const app = express();
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

app.get(`${SHORE_API_ROOT}/turn`, async (_req, res) => {
  const config = await judgeConfig();
  const view: ShoreView = {
    scenario: SHORE_SCENARIO,
    canReset: canResetShore(context.userId, context.subredditName),
    signedIn: Boolean(context.userId),
    judgeReady: Boolean(config.enabled && config.key),
    shore: context.userId ? await readShore(context.userId) : emptyShore(),
  };
  res.json(view);
});
app.post(`${SHORE_API_ROOT}/draft`, async (req, res) =>
  res.json(await saveShore(requireUser(context.userId), req.body)),
);
app.post(`${SHORE_API_ROOT}/submit`, async (req, res) =>
  res.json(await submitShore(requireUser(context.userId), req.body)),
);
app.post(`${SHORE_API_ROOT}/reset`, async (req, res) =>
  res.json(await resetShore(context.userId, context.subredditName, req.body)),
);

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
