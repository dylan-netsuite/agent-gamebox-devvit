---
name: devvit-deploy
description: Build and start an authorized Reddit playtest for one Devvit app, recording observed installation and the CLI URL for automated or human testing. Does not publish publicly.
---

# Devvit playtest preparation

Read [the shared contract](../devvit-full-cycle/references/workflow-contract.md) and root `AGENTS.md`. Input is a game path relative to `games/` and its verified artifact directory.

1. Confirm that the target is a Devvit app and playtesting is within the request. Local prototypes use their documented preview command; they are not Reddit deployments.
2. Run the shared validation gate unless it already passed on the same working content. For a new app, verify identity and required initial upload from the current CLI/docs before launching. Do not overwrite another app's name or configuration.
3. Start `npm run dev` inside `games/{game-path}` in a managed terminal and retain its process identifier. It loads an optional `.env` and runs Devvit's configured build/watch commands. Keep it running through testing and human handoff.
4. Use actual CLI output. Subreddit precedence is an explicit CLI argument, loaded `DEVVIT_SUBREDDIT`, then `devvit.json`'s `dev.subreddit`, with platform-stored fallback. Do not assume `.env` exists.
5. After confirmed installation, record `targetKind: reddit`, `status: ready`, observed URL, app/version, subreddit, readiness evidence, timestamp, and process identifier in `deployment.json`.
6. Record actual auth/build/installation failures. A guessed URL is never deployment evidence. Inspect an existing process before starting a competing watcher; re-establish readiness if it died.

Return evidence and URL to the owner. Do not run `npm run launch` or `devvit publish` as part of playtesting. Ending the CLI does not uninstall the playtest version.
