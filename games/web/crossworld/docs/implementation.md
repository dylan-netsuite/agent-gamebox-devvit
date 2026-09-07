# CrossWorld: Chatterbloom living postcard

This app ports the personally tested single-turn mock to Reddit. The user chose CrossWorld as its name and OpenAI as its initial clue reviewer. The current slice follows the user’s whimsical, colorful Chatterbloom Gardens direction. The renderer uses HTML controls, layered SVG, and CSS; it does not need Phaser or a separately hosted server. The vector illustration is editable prototype art, with final art direction still open to the user.

## Register, upload, and play

Use Node 24.18.x and run commands inside `games/web/crossworld`:

```sh
npm ci
npm run login
npm run deploy
npm run dev
```

The app is registered to u/suitegeek with Devvit identifier `crossworld-game`. `devvit.json` matches that registration; the player-facing name is CrossWorld. Run `devvit whoami` to check CLI identity before uploading. There is no need to create another app.

`npm run dev` starts a managed Devvit playtest, runs the watch build, installs the app, and prints the actual post URL. The first upload provisioned `r/crossworld_game_dev`, now recorded in `devvit.json`. To target an existing subreddit, use `npm run dev -- <subreddit>`; the app owner needs moderator access. For a private subreddit, invite a separate player account as an approved user. Use a separate browser profile for that account so the owner's turn stays untouched. The moderator menu can create a CrossWorld post if needed. All posts in one installation share a user's progress for this scenario.

These commands upload a private test version. Public publication, review submission and larger-community rollout are separate steps.

## Connect OpenAI

After the first successful upload and installation, use Devvit's encrypted global settings:

```sh
npx devvit settings set judgeApiKey
npx devvit settings set judgeEnabled
```

Enter a project API key into the first command's secret prompt. Enter `true` for `judgeEnabled` only when ready for paid review calls. Never put the key in chat, client code, a committed `.env`, screenshots, or a command-line literal. The key needs permission to create Responses and access `gpt-4.1-mini-2025-04-14`, plus available billing/quota. A separate project key makes revocation and usage tracking easier. Refresh the game after changing settings. Setting `judgeEnabled` to `false` stops new paid reviews while preserving drafts and accepted turns.

`devvit.json` declares `api.openai.com` as an allowed HTTP domain. Devvit's current global allowlist includes this host; the app must still declare it. No API proxy, webhook, custom OAuth flow or separate database is required. The browser only calls the app's same-origin `/api/` routes. Credentials are loaded using server-side `settings.get`.

The judge uses `POST https://api.openai.com/v1/responses`, a pinned model, strict JSON output, `store: false`, a 240-token output cap and a 12-second timeout. The request contains the word and clue plus the game rubric; it contains no Reddit username or ID. `store: false` is a Responses storage option, not a promise of zero provider retention. The provider checks English word validity and clue fairness; there is no independent dictionary lookup in this version.

The prompt treats submitted text as data, allows ordinary inflections and fair everyday definitions, and does not invent substring or word-family restrictions. It does not demand that a clue uniquely identify one word. Structured output validates the shape of the answer; it does not guarantee semantic accuracy or make prompt injection impossible. Refusals, malformed output, timeouts and HTTP failures produce an unavailable response, never an automatic win.

Current cost controls: one fresh review per user per 45 seconds; at most 20 attempted reviews per user per scenario per installation per UTC day; at most 200 attempted reviews per subreddit installation per UTC day. Failures count toward these API allowances but never use the gameplay restriction. Completed identical reviews are reused for seven days. There is no automatic retry. A counter failure stops the request before OpenAI, returns an unavailable response, and logs only the budget stage and numeric error code. These are conservative playtest limits, to be tuned with actual usage.

Reddit requires apps that use HTTP fetch to provide Terms & Conditions and Privacy Policy links in app details. Add the actual policies before wider distribution; this repository does not invent or publish legal terms for the owner.

## Requests and persistence

| Route                                       | Access                  | Behavior                                                                                    |
| ------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `GET /api/chatterbloom-postcard-v1/turn`    | Everyone                | Returns login/configuration readiness and the caller's own turn; guests get an empty turn.  |
| `POST /api/chatterbloom-postcard-v1/draft`  | Signed-in Reddit user   | Saves bounded draft fields. Ignores client identities, statuses and verdicts.               |
| `POST /api/chatterbloom-postcard-v1/submit` | Signed-in Reddit user   | Revalidates slot and restriction, reads cached review or calls judge, and saves acceptance. |
| `/internal/on-app-install`                  | Devvit internal trigger | Creates the playtest post.                                                                  |
| `/internal/menu/post-create`                | Devvit moderator menu   | Creates another post for the same scenario.                                                 |

The scenario appears in each public game route, so a stale playtest backend cannot route a new postcard submission into an older turn. The client also checks the returned scenario before enabling play. A missing route or mismatched scenario shows an update/reopen message.

User identity comes only from Devvit request context. There is no manual accept or reset API. Current slot and restriction definitions are server-owned shared code. The browser shares that logic for immediate feedback, but modifying the browser cannot change server acceptance.

Redis installation-scoped keys now use `cq:chatterbloom-postcard-v1:<user>:…`. Changing the server-owned scenario gives this postcard a fresh turn. Earlier `cq:crossworld-live-turn-1-v1:<user>:…` records are retained unchanged, but this version does not expose a UI for switching back. The installation budget remains shared across scenarios; the per-user budget is scenario-specific. Drafts are editable; acceptance is a separate immutable `SET NX` record and always wins over later draft writes. That one record represents completion and restriction use, avoiding a separate increment that could award twice. A hash of normalized submission, model and rubric version identifies a cached review. A fixed expiring cooldown serializes fresh requests; it is deliberately never deleted by an older request. UTC budget keys expire after 48 hours, review caches after seven days; drafts and accepted progress persist. The shared daily counter also uses installation-scoped Redis. It is shared across users and posts in that subreddit, not across installations. This app does not require a global Redis grant. Before installing in additional communities, account for the multiplied review allowance or introduce a separately supported shared budget service.

Drafts use last-save-wins behavior across devices. The client serializes its own saves, flushes edits before submission/refresh, and keeps typed content visible if a save fails. A response lost after acceptance is recovered by refreshing the saved turn. An interrupted request before the result is persisted can require a fresh paid call after cooldown; exactly-once external billing is not claimed.

## Rules and scope

- The current slot has five A–Z letters, second letter A, crossing the supplied MAP.
- Select one themed restriction: Pocket Posy (at most four words), Seven Petals (exactly seven), E’s Day Off (no E), Pull the Weeds (no whole-word A/AN/THE), Tiny Seeds (every word at most four letters), Twin Blossoms (any two words share an initial; other words are allowed), or Bee-Free Patch (no B). These restrictions apply to the clue, not the answer. This scenario replaces the earlier no-A card and relaxes the old all-words-same-initial rule.
- Clues contain 1–140 characters and at least one word. A word is a case-insensitive contiguous group of A–Z letters. Apostrophes, hyphens and punctuation split tokens.
- The exact answer as a whole clue word is banned. Its letters inside another word and word-family relatives are allowed. The same rules are visible in the UI.
- A true `validWord` and true `fairClue` accept the turn. A rejection permits editing. Infrastructure errors spend no restriction.
- One playable discovery, no daily scheduling, generated future grid, seven-day progression, leaderboards, multiplayer, appeals workflow, connected-world finale or puzzle sharing in this iteration.

## Living postcard presentation

`src/client/garden.svg` contains the original layered vector landscape, greenhouse, flower symbols, butterfly and gardener Pip. The DOM controller in `garden.ts` loads this trusted bundled asset; user text is never inserted as markup. Art stays separate from game state and can be refined or replaced while preserving the named layers. CSS supplies subtle cloud/butterfly/gardener motion plus a finite vine, flower, window-light and wave sequence. This one sequence uses native browser animation; it does not add GSAP, Rive, or another renderer.

The garden’s final appearance follows the server-returned accepted turn. Drafts, rejections, pending requests and service errors leave it dormant. A new accepted submission scrolls the garden into view, focuses its caption and plays the discovery. Loading an already accepted turn renders the final scene immediately without replay. Replay bloom affects presentation only: it makes no review call and spends nothing.

Sound is off on every page load. Opting in creates a Web Audio context from that button gesture; discovery/replay plays a short four-note synthesized chime. No external sound files or audio network calls are used. Turning sound off closes the context. The app remains playable if audio is unavailable. Motion can be paused; OS reduced-motion always takes priority. Hidden pages stop animation and suspend sound. The controls are session-local preferences; final artwork alone is persisted via the accepted turn.

## Validation and rollout evidence

From repository root:

```sh
node tools/validate-all.mjs --install web/crossworld
```

The app has rule tests, Devvit Redis tests for isolation/concurrency/limits, and adapter tests for exact payload shape and malformed/refused/error responses. Browser QA uses separate mocked API contexts, including draft recovery, review error/revision/acceptance and 320/390/768/1440 pixel widths. Mocked provider tests do not prove live OpenAI connectivity.

After configuration, verify the actual installed post under a separate test account: reveal, write a valid slot word and compliant clue, submit, read the real review, refresh, and confirm the same accepted turn or editable rejected turn returns. Also check that a guest cannot submit. Use a separately authorized test account for automated acceptance testing. Keep the playtest process available for the user.

### Live submission verification — 2026-09-07

The first real submissions exposed a platform gap that the SDK test fixture did not enforce: the global Redis budget counter failed with RPC code 9. Diagnostic build 0.0.1.9 confirmed the failure at that operation. Submission now uses installation-scoped counters, with regressions for unavailable global Redis and safe failure handling for either daily counter.

On installed build 0.0.1.13, OpenAI rejected an unrelated clue, recovered the rejected review on refresh, reused an identical review, and enforced the cooldown on a revised clue. It then accepted the original VAMPS clue. The UI used one restriction, locked the turn, and recovered the same accepted result after a full Reddit reload. Repeat submission and a late draft save preserved acceptance. Typecheck, lint, all 37 tests and build passed. These two live judgments establish connectivity and tested transitions, not general judgment accuracy.

### Chatterbloom postcard verification — 2026-09-07

The garden adds two rule/storage regressions; all **39 tests**, TypeScript, ESLint and production build pass. **26 isolated browser checks** cover the reveal, pending/rejected/unavailable/accepted review states, draft recovery, keyboard focus, four responsive widths, audio opt-in, motion controls, accepted reload, visual-only replay, guest/configuration gates, and stale-backend protection. Screenshots were inspected at desktop and phone sizes. Browser audio was exercised technically; listening quality and actual iOS/Android devices still need human feedback.

The real OpenAI review on build 0.0.1.20 accepted BarryBetsALot’s new postcard submission in approximately 3.1 seconds, and the garden bloomed. A full Reddit reload then exposed mismatched platform routing: new client assets and context version, but the previous scenario from the server. A clean prerelease restart alone did not resolve it. A full private `devvit upload` to 0.0.2 followed by a managed playtest at **0.0.2.2** restored consistent routing. The client now checks the scenario, and the game endpoints include it in their paths; an older backend returns a visible update message instead of reading or writing an earlier turn. The internal Devvit cause is unconfirmed; this is an observed deployment recovery, not an SDK root-cause claim.

The final installed build recovered the identical accepted postcard on two full Reddit reloads without automatic animation or sound. Repeat submission and a late draft save returned the unchanged accepted turn. Replay triggered animation with zero review requests, and motion pause stopped all scene animations. Testing used only the explicitly authorized BarryBetsALot account; the owner’s postcard was not played. Original progress remains in the previous scenario’s keys. Human impressions of the art, sound, pacing and clue fairness remain pending. No public publication was performed.

## Sources checked 2026-09-07

- [Devvit quickstart](https://developers.reddit.com/docs/quickstart): current Node requirement, app registration and playtest setup.
- [Devvit settings and secrets](https://developers.reddit.com/docs/capabilities/server/settings-and-secrets): encrypted server-side settings and CLI setup after installation.
- [Devvit Redis](https://developers.reddit.com/docs/capabilities/server/redis): installation-scoped persistence; shared storage must be designed explicitly.
- [Devvit HTTP fetch](https://developers.reddit.com/docs/capabilities/server/http-fetch): server-only fetch, declared domains and app-policy links.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses JSON format and refusal handling.
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini): pinned snapshot and structured-output support.

- [Devvit playtest lifecycle](https://developers.reddit.com/docs/guides/tools/playtest): private playtest installation, live reload, and full upload version bump.
