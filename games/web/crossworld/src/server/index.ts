import express from "express";
import {
  context,
  createServer,
  getServerPort,
  reddit,
} from "@devvit/web/server";
import { SCENARIO } from "../shared/rules";
import { emptyTurn, type GameView } from "../shared/types";
import { readTurn, saveDraft, submit, requireUser, GameError } from "./game";
import { judgeConfig, JudgeUnavailable } from "./judge";

const app = express();
app.use(express.json({ limit: "2kb" }));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.get("/api/turn", async (_req, res) => {
  const config = await judgeConfig();
  const view: GameView = {
    scenario: SCENARIO,
    signedIn: Boolean(context.userId),
    judgeReady: Boolean(config.enabled && config.key),
    turn: context.userId ? await readTurn(context.userId) : emptyTurn(),
  };
  res.json(view);
});
app.post("/api/draft", async (req, res) => {
  res.json(await saveDraft(requireUser(context.userId), req.body));
});
app.post("/api/submit", async (req, res) => {
  res.json(await submit(requireUser(context.userId), req.body));
});

const createPost = () =>
  reddit.submitCustomPost({ title: "CrossWorld · One word, one clue" });
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
      res
        .status(status)
        .json({
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
