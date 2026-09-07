---
name: devvit-deploy
description: Build and playtest one Agent Gamebox app when the user requests deployment or a full development cycle. Record the observed CLI result for browser testing.
---

# Devvit playtest

Input: game path relative to `games/`, for example `phaser/jeopardy`, plus an optional workflow ID. Follow root `AGENTS.md`.

1. Run `node tools/validate-all.mjs phaser/jeopardy` from the repository root, substituting the selected game. Resolve failures before playtesting.
2. Start `npm run dev` inside `games/{game-path}` in a managed terminal. This loads the optional `.env` and runs Devvit's configured build/watch commands. Keep it alive through browser testing.
3. Use the playtest URL emitted by the CLI. Subreddit precedence is an explicit CLI argument, `DEVVIT_SUBREDDIT`, then `devvit.json`'s `dev.subreddit` (with platform-stored fallback). Do not assume `.env` exists or overrides an explicit argument.
4. After the CLI confirms installation, record the URL, app name, subreddit, time, and terminal/session identifier in `.workflows/{game-path}/{wf-id}/deployment.json` with `status: deployed`.
5. If the CLI reports an error or authentication is unavailable, record the actual failure. A constructed URL is only a candidate URL, never evidence of successful deployment.

This skill playtests the selected app. Public publication requires a user request that covers publication; do not invoke `npm run launch` as part of playtesting.
