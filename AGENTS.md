# Agent Gamebox

Each `games/{engine}/{game}` directory is an independent npm project and Devvit app. There is no root npm workspace. Run `npm --prefix games/phaser/{game} run <script>` from the root, or run npm inside the game directory. Use Node from `.nvmrc` and `npm ci` with the game's lockfile.

## Architecture

- `src/client`: Browser code using the game's chosen renderer. Preserve Phaser in existing Phaser games; new text/grid games can use DOM controls and CSS. Call backend routes through same-origin `/api/` fetches. Do not import server modules.
- `src/server`: Express running in Devvit's Node 24 serverless runtime. Use SDK `createServer` and `getServerPort`, Devvit Redis for durable state, `fetch` for allowlisted outbound HTTP, and Devvit Realtime for multiplayer messages.
- `src/shared`: Pure logic/types usable on either side. Keep SDK server imports out of it.
- `devvit.json`: App identity, permissions, entrypoints, routes, and build/watch commands. Keep existing app names and subreddit settings.
- `vite.config.ts`: Official `@devvit/start/vite` plugin builds both client and server. Run `vite build`, not a plain Vite dev server.

The runtime does not keep work alive after a response. Do not rely on background timers, process memory, files, raw WebSockets, or streaming for persistent game state. Await writes and realtime sends before returning; use stored deadlines or Devvit Scheduler for work that must survive a request.

Use trusted `context.userId` for identity. Support missing user IDs in public read/gameplay paths; require authentication for account-scoped writes. Validate client-submitted scores and multiplayer actions server-side. Realtime is a notification transport; Redis is authoritative, and reconnects must reload state.

## Current Devvit reference

Check the installed Devvit version, then consult the [official docs](https://developers.reddit.com/docs), [changelog](https://developers.reddit.com/docs/changelog), and published stable npm packages. Keep `devvit`, `@devvit/web`, `@devvit/start`, and any `@devvit/test` version aligned. The docs index is [llms.txt](https://developers.reddit.com/docs/llms.txt). Use Devvit MCP search when available; fall back to the official docs when it is not.

The existing `.cursor/skills/devvit-docs` authors game documentation; it is different from the official experimental `reddit/devvit-skills` documentation lookup skill. Do not replace one with the other silently.

## Validation and playtest

Run `node tools/validate-all.mjs --install phaser/{game}` for a clean install, typecheck, lint, tests, and production build. Omit the game to validate everything. `npm run check` does not edit source. Use `npm run lint:fix` or `npm run prettier` explicitly for formatting changes.

Use `@devvit/test/server/vitest` for backend tests needing isolated Redis or other Devvit capabilities; Blokus has an example. Tests do not require Reddit authentication. A build or test pass does not establish that an app works on Reddit.

When playtesting is within the task's scope, run `npm run dev` inside the game directory and keep that process alive. Use the URL emitted by the CLI. An explicit subreddit argument overrides `DEVVIT_SUBREDDIT`, then `devvit.json`'s `dev.subreddit`; the npm script loads a local `.env` when present. A constructed URL alone is not evidence of deployment.

Use available browser tools to test the Reddit iframe. The optional `.cursor/mcp.json` player profiles support separate authenticated players; do not assume those named tools exist in every client. Never share the same persistent browser profile between concurrent browser processes. Report missing authentication/tools and untested scenarios explicitly.

Keep changes scoped to the user's request. Reviews do not imply deployment or publication. Consult [the modernization assessment](docs/devvit-modernization.md) for known follow-ups.

Local mechanics prototypes can live under `prototypes/` with their own serving and validation commands. They are not deployed Devvit apps and must label mocked persistence or judging. Use isolated state for automation and leave the user's session untouched. Human feedback remains pending until supplied. The [Devvit skill contract](.cursor/skills/devvit-full-cycle/references/workflow-contract.md) defines ownership and handoffs.
