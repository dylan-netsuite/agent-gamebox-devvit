# Devvit modernization assessment

Reviewed September 6, 2026 against official documentation, published npm packages, and the current [Reddit Phaser template](https://github.com/reddit/devvit-template-phaser).

## Recommendation

Keep the existing Devvit Web architecture. All nine apps already use HTML entrypoints, the Web SDK, Express, and Redis; a Blocks migration or framework rewrite is unnecessary. Upgrade the platform/tooling, then address multiplayer reliability and guest conversion before migrating to Phaser 4.

This change upgrades the repository's platform baseline. It does **not** establish that every game is production-ready or enable every new Devvit feature.

## Compatibility review and completed changes

| Area               | Original state                                                | Result                                                                             |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| SDK and CLI        | All nine apps pinned to 0.12.11                               | Stable 0.14.2; CLI moved to devDependencies                                        |
| Runtime            | No Node pin; builds targeted Node 22                          | Node 24.18.0 pin, Node 24 package engines and server target                        |
| Build              | Two Vite 6 configs and three concurrent watchers per app      | One Vite 8 config using aligned `@devvit/start`; Devvit owns build/watch lifecycle |
| Manifests          | Deprecated entrypoint `inline` flag                           | Removed; HTML splash/game entrypoints and app identities preserved                 |
| Installation       | Diplomacy lacked a lockfile; Jeopardy's omitted Cheerio       | Fresh, consistent lockfiles for all nine games                                     |
| Type/lint tools    | TypeScript 5.8, ESLint 9; JS rules reapplied after TS rules   | TypeScript 6, ESLint 10, current parser; strict TypeScript settings retained       |
| Validation         | No root runner or CI; `check` edited files                    | Read-only checks, per-game tests, root runner, nine-game CI matrix                 |
| Agent instructions | Invalid workspace commands and browser/deployment assumptions | Root AGENTS.md and corrected Cursor rules/skills                                   |
| Dependency upkeep  | Manual updates across apps                                    | Weekly grouped Devvit updates and separate Actions updates                         |

The [Devvit changelog](https://developers.reddit.com/docs/changelog) documents Node 24, removal of platform-provided `submitCustomPost` splash/loading screens, and deprecation of `inline`. These apps already create posts without those removed arguments and supply splash HTML. No post-creation rewrite was needed. The changelog page reviewed ended at 0.14.1; npm and the official template confirmed stable 0.14.2, which was used instead of a `next` prerelease.

The official template uses `@devvit/start/vite`. Its published 0.14.2 package supports Vite 8, handles both outputs, and guards client/server imports. The [CLI docs](https://developers.reddit.com/docs/guides/tools/devvit_cli) recommend a local CLI devDependency and describe playtest's subreddit precedence. Upload/publish invoke the manifest build, so scripts no longer build or upload redundantly.

Express remains supported. Phaser stays at 3.88.2 here; the current template uses Phaser 4.2.1 and Hono. Neither is a mandatory Devvit migration. A game-engine upgrade needs scene, physics, input, audio, and rendering playtests; replacing Express provides little immediate value.

## Existing defects repaired during validation

- **Blokus:** `totalSquares()` referenced a re-export without importing it, risking a runtime error. Missing Redis replay history now returns `null` as its contract promises. Existing asynchronous UI sends are explicitly unawaited; delivery behavior is unchanged.
- **Diplomacy:** The tutorial imported a pure order resolver from `src/server`, violating the client/server boundary and project references. It now lives in `src/shared/logic`. Bounded array access, optional-property construction, and unused bindings were corrected without changing the order algorithm.
- **Mini Golf:** Optional teleporter parameters and bounded path indexing satisfy the existing strict settings; unused/redundant assignments were removed.
- **Worms:** Corrected optional scene parameters, touch-button visibility types, and unused members. Existing gameplay defaults remain intact.
- **Lint:** TypeScript rules now take precedence over JS rules, removing false errors against type-only Phaser/Matter namespaces; `tsc` still checks actual references. Jeopardy's non-ASCII cleanup regex now avoids a control-character lint violation.

## Validation

The original baseline built all eight apps that could be installed. Four failed type checking and five failed lint. Jeopardy's clean install failed before its checks ran. These results were recorded before upgrading.

After the change, all nine apps pass clean npm installation, type checking, lint, and production builds on Node 24.18.0. Vitest passes **127 tests**: 111 Rush Hour puzzles, 14 Worms hitscan cases, and two Blokus Redis history tests. Six games have no automated tests, which Vitest reports explicitly.

Blokus now tests application history methods with isolated Devvit Redis. The [official test harness](https://developers.reddit.com/docs/guides/tools/devvit_test) also offers scheduler/realtime fixtures and blocks outbound HTTP unless mocked; it provides a foundation for backend regression coverage.

No apps were uploaded or published, and no authenticated Reddit playtest was performed. Desktop/mobile rendering, splash expansion, guest sessions, persistence, and multiplayer reconnects remain live acceptance checks before deployment.

Production dependency audits for Blokus and Jeopardy (the common graph plus Cheerio) reported no high/critical findings, but **18 moderate package findings** cascade from one `protobufjs` advisory in Devvit's dependency graph: [GHSA-j3f2-48v5-ccww](https://github.com/advisories/GHSA-j3f2-48v5-ccww). These are not 18 independent defects. npm suggested downgrading the SDK to 0.12.0, so no automatic fix was applied. Upstream resolution or a separately tested scoped override remains open; exploitability in these apps was not established.

The full development dependency audit for Blokus reports 31 findings (4 high, 25 moderate, 2 low). The high findings involve the current Devvit CLI and its `image-size`/`tmp` dependencies: [image parser advisory](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [additional image parser advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), and [temporary-path advisory](https://github.com/advisories/GHSA-ph9p-34f9-6g65). These affect development tooling rather than the production dependency graph. The latest CLI still includes them; its suggested audit fix is a downgrade to 0.10.25. Track upstream patches or test scoped overrides separately. The upgrade should not be described as vulnerability-free.

Fresh-install verification also exposed extraneous esbuild platform packages in npm's initially generated locks. Normalizing the lockfiles with `npm install --package-lock-only` removed them before rerunning clean installation. Validation installs skip the duplicate npm audit request; the audit findings above were inspected separately.

## Prioritized follow-ups

| Priority | Finding                                                                                                                 | Next change                                                                                                                        |
| -------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| High     | Scattergories sends `round-start` from `setTimeout` after the request finishes (`src/server/index.ts`, `finalizeRound`) | Persist round deadlines/transitions; use scheduler or request-driven transitions with idempotency and reconnect recovery           |
| High     | Multiplayer depends on client actions/results and optimistic UI; compile success cannot verify concurrent behavior      | Add backend authorization, action-validation, duplicate-submission, stale-turn, and reconnect tests for Blokus/Worms/Scattergories |
| Medium   | No use of new login/share effects was found                                                                             | Preserve basic guest gameplay; add login at save/subscribe boundaries and sharing with recoverable state                           |
| Medium   | Worms stores local stats and tutorial completion in localStorage                                                        | Decide which progress must survive updates; move account progress to Redis where appropriate                                       |
| Medium   | Most games lack backend tests                                                                                           | Expand `@devvit/test` coverage for scores, permissions, lobbies, and callbacks                                                     |
| Medium   | Phaser 3 remains behind the template                                                                                    | Trial Phaser 4 in one game and compare rendering/input/physics before rolling out                                                  |
| Optional | No Devvit Journeys integration                                                                                          | Define start/completion events and instrument abandonment/retention                                                                |

The server lifecycle and localStorage limits are documented in the [Devvit Web overview](https://developers.reddit.com/docs/capabilities/devvit-web/devvit_web_overview). Redis should remain authoritative; the [Realtime guide](https://developers.reddit.com/docs/capabilities/realtime/overview) provides subscription and reconnect hooks, not persistence.

[Logged-out player guidance](https://developers.reddit.com/docs/guides/logged-out-users) covers login prompts, sharing, and preserving progress across login. [Devvit Journeys](https://developers.reddit.com/docs/capabilities/analytics/devvit-journeys) is a separate instrumentation decision. Notifications, purchases, blob storage, and external endpoints need concrete game requirements and any applicable access prerequisites; they are not compatibility requirements.

## Agent setup

The existing Devvit MCP command matches the [official AI guide](https://developers.reddit.com/docs/guides/ai). Local instructions were stale: workspace commands could not run, persistent browser profiles were described as isolated/headless, `.env` was mandatory, and a guessed URL could be recorded as deployed. These now use real commands and observed results. Workflow artifacts stay local because `.workflows/` is gitignored.

The official experimental [`reddit/devvit-skills`](https://github.com/reddit/devvit-skills) lookup skill and this repo's `devvit-docs` authoring skill serve different purposes despite sharing a name. Keep that distinction when installing official tooling. AGENTS.md supplies current links and a fallback when Devvit MCP is unavailable.
