# Agent Gamebox

Nine independent [Devvit Web](https://developers.reddit.com/docs/) apps that run inside Reddit posts, with Phaser clients, Express backends, and Redis persistence.

| Game                                         | Description                                  |
| -------------------------------------------- | -------------------------------------------- |
| [Blokus](games/phaser/blokus/)               | Tile-placement strategy                      |
| [Dino Run](games/phaser/dino-run/)           | T-Rex endless runner                         |
| [Diplomacy](games/phaser/diplomacy/)         | Seven-power negotiation board game           |
| [Jeopardy](games/phaser/jeopardy/)           | Quiz show with J-Archive questions           |
| [Meerca Chase](games/phaser/meerca-chase/)   | Grid-based chase game                        |
| [Mini Golf](games/phaser/mini-golf/)         | Physics-based mini golf                      |
| [Rush Hour](games/phaser/rush-hour/)         | Sliding puzzle game                          |
| [Scattergories](games/phaser/scattergories/) | Word-based party game                        |
| [Worms](games/phaser/worms/)                 | Artillery strategy with destructible terrain |

## Development

Use Node **24.18.0** from [.nvmrc](.nvmrc). Devvit SDK/CLI packages are pinned to **0.14.2**. Each game has its own dependencies and lockfile; there is no root npm workspace.

```bash
nvm install
nvm use
cd games/phaser/blokus
npm ci
npm run dev
```

`npm run dev` starts Devvit playtest and its Vite build watcher. It loads a game-local `.env` when present; `.env` is optional because the apps already set `dev.subreddit` in `devvit.json`. An explicit subreddit argument takes precedence over `DEVVIT_SUBREDDIT`, then the manifest setting. Follow the CLI's emitted playtest URL and keep the process alive during browser tests.

| Command inside a game | Effect                                             |
| --------------------- | -------------------------------------------------- |
| `npm run build`       | Build client and server with `@devvit/start/vite`  |
| `npm run type-check`  | Check app code and Vite configuration              |
| `npm run lint`        | Check source with ESLint                           |
| `npm run check`       | Typecheck and lint, without editing files          |
| `npm run test`        | Run Vitest; explicitly report games with no tests  |
| `npm run lint:fix`    | Apply ESLint fixes                                 |
| `npm run prettier`    | Format files                                       |
| `npm run login`       | Authenticate the local Devvit CLI                  |
| `npm run deploy`      | Check and upload; Devvit runs the configured build |
| `npm run launch`      | Check and submit a version for publication review  |

From the repository root, use `npm --prefix games/phaser/blokus run build` to target one app. `npm run ... -w` does not work in this repository.

## Validation

```bash
# Clean install, typecheck, lint, tests, and production build for all games
node tools/validate-all.mjs --install

# Validate one game using already-installed dependencies
node tools/validate-all.mjs phaser/blokus
```

[GitHub Actions](.github/workflows/validate.yml) runs the same validation per game on pull requests and pushes to main. [Dependabot](.github/dependabot.yml) groups Devvit package updates. Phaser major upgrades require a deliberate migration.

Blokus uses the official `@devvit/test` harness for isolated Redis tests. Rush Hour and Worms also have unit tests. Other games currently report no tests; passing builds do not imply gameplay coverage. See [the assessment](docs/devvit-modernization.md) for validation results and remaining work.

For live verification, use an authenticated Reddit playtest and browser automation that can inspect the nested game iframe. The optional `.cursor/mcp.json` defines two persistent player profiles for multiplayer testing; these tools must be enabled in the chosen client. Use a separate profile for each browser process. Profile and screenshot directories are gitignored.

## Architecture

```text
games/phaser/{game}/
├── src/
│   ├── client/       Phaser scenes and HTML splash/game entrypoints
│   ├── server/       Express routes and Devvit SDK calls
│   └── shared/       Pure logic and types used on both sides
├── devvit.json       App identity, permissions, routes, build/watch scripts
├── vite.config.ts   Official Devvit Vite plugin
├── package.json
└── package-lock.json
```

Browser code calls same-origin `/api/` routes. Express runs in Devvit's Node 24 serverless runtime using the SDK's server adapter. Store durable state in Redis, await work before returning a response, and use Devvit Realtime for multiplayer notifications. Shared logic must not import the server SDK.

## Agents

[AGENTS.md](AGENTS.md) is the shared repository guidance. Cursor rules point to it, and existing game workflow skills remain in `.cursor/skills/`:

```text
/devvit-full-cycle phaser/jeopardy Add score tracking
```

The game cycle covers planning, implementation, validation, playtesting, browser verification, documentation, and a commit. It records local artifacts under `.workflows/{game-path}/{wf-id}/`, which remains gitignored. Read-only reviews do not start this cycle, and browser/deployment success requires observed evidence.

For current API context, use [official Devvit docs](https://developers.reddit.com/docs), their [LLM index](https://developers.reddit.com/docs/llms.txt), or the optional Devvit MCP. The repository's `devvit-docs` skill authors game docs; the official experimental skill with the same name is a separate documentation lookup tool.

## Uploading all apps

`bash tools/upload-all.sh` checks and uploads each app sequentially. This changes uploaded app versions; use it when a bulk upload is intended. The CLI invokes each manifest's build command. Publication is a separate action.
