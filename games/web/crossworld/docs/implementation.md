# CrossWorld: Chatterbloom Gardens

The current slice is a mobile crossword map that begins blank and grows through seven accepted word paths. Each acceptance adds one small illustration and opens the next crossing. Native HTML controls, a modal bottom sheet, inline SVG and CSS keep the artwork replaceable without introducing another renderer or backend. The earlier landmark gallery and postcard presentation are superseded.

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

Current cost controls: one fresh review per user per path per 45 seconds; at most 20 attempted reviews per user per scenario per installation per UTC day; at most 200 attempted reviews per subreddit installation per UTC day. Failures count toward these API allowances but never use the gameplay restriction. Completed identical reviews are reused for seven days. There is no automatic review retry. A counter failure stops the request before OpenAI, returns an unavailable response, and logs only the budget stage and numeric error code. These are conservative playtest limits, to be tuned with actual usage.

Reddit requires apps that use HTTP fetch to provide Terms & Conditions and Privacy Policy links in app details. Add the actual policies before wider distribution; this repository does not invent or publish legal terms for the owner.

## Requests and persistence

| Route | Access | Behavior |
| --- | --- | --- |
| `GET /api/chatterbloom-seven-v1/turn` | Everyone | Login/reviewer readiness and the caller's journey; guests start blank. |
| `POST /api/chatterbloom-seven-v1/draft` | Signed-in user | Saves bounded draft fields for the supplied numeric `path` index. |
| `POST /api/chatterbloom-seven-v1/submit` | Signed-in user | Validates progression, crossing and unused rule, reviews the clue, persists acceptance. |
| `/api/chatterbloom-postcard-v1/*` | Existing access rules | Compatibility routes for the previous single-turn client; separate saved state. |
| `/internal/on-app-install`, `/internal/menu/post-create` | Devvit trigger / moderator | Creates a post. All posts in one installation share the caller's scenario progress. |

The new journey response contains `completed` (an ordered array of immutable accepted turns) and `turn` (the current draft, or null when all seven are complete). Client-supplied identity, status and judgment are ignored. Identity comes exclusively from trusted Devvit context. There is no manual accept, skip or reset API.

`src/shared/journey.ts` owns seven five-letter paths on a 13×13 map. Every new path crosses exactly one previously accepted path; the complete board contains 29 occupied cells and exactly seven words, with no incidental touching sequences. `crossingFor` derives the fixed letter and source path from actual shared coordinates. Crossings branch to earlier words instead of always using the last word. Every crossing uses the same letter index in both words, retaining the previous source word as a possible fallback fit. The prototype does not prohibit repeating a word. Players choose their own answers, with no given letter on the first path.

Progress, completion, path rendering and available rules use the configured path/restriction count. The discovery marker sits at the free end farthest from earlier words; later markers are compact plus buttons so labels do not cover accepted letters. The five-letter entry pattern stays large while the full seven-word map fits on a phone.

Restrictions come from the existing seven-rule pool and apply to the clue. Each acceptance uses one previously unused rule. `validateTurn` accepts a server-supplied crossing; legacy callers retain the original second-letter-A slot. The frontend shares validation for fast feedback, but only the server can accept a path.

New path keys use `cq:chatterbloom-seven-v1:path:<index>:<user>:…`. `server/game.ts` exposes a reusable turn store and reviewer with immutable `SET NX` acceptance; `server/journey.ts` derives the completed prefix from those records. The server refuses future paths and returns existing progress for writes to older completed paths. Immutable earlier words make each later crossing and used-rule check stable during concurrent requests. There is no separate award counter to increment twice.

The new seven-word journey starts fresh without deleting or migrating `chatterbloom-paths-v1`, `chatterbloom-postcard-v1` or `crossworld-live-turn-1-v1` records. There is no historical-turn picker in this interface. The 20-review daily user allowance is shared by all seven new paths. The 200-review installation allowance remains shared across users, posts and scenarios. The 45-second cooldown and cached judgments belong to each path; completing a path allows reviewing the next immediately. The next cannot start until the previous acceptance is durable. Standard installation-scoped Redis is used; no global Redis grant is required.

The browser serializes saves, marks edits unsaved immediately and flushes before close, submission and explicit refresh. Different devices use last-save-wins drafts; immutable acceptance always wins. Failed saves retain typed content on the current screen. Reconnect preserves it when the server is still on the same path; server progress takes precedence if another request already accepted that path. A lost successful response is recovered on refresh. An interrupted review before persistence can require a later paid retry; external API calls and Redis writes cannot be one atomic transaction.

The scenario appears in every game endpoint and is verified before gameplay becomes ready. `client/api.ts` retains bounded session recovery: on a missing route, mismatched scenario or HTTP 401/403, feature-detect `devvit.refreshToken`, wait at most four seconds and repeat the GET once. Each fetch has a 25-second deadline. No paid submission is automatically replayed. Service errors remain visible with a Reconnect action. A full private upload followed by one managed playtest has previously resolved stale client/server routing when a watch restart alone did not.

## Map, entry and illustration

The initial map contains only one start marker; accepted scenery and future paths are absent from both the display and the interaction tree. Reveal exposes five empty stones and opens the entry sheet. Subsequent paths include a fixed letter from an earlier accepted word. Unfilled paths remain visible when the sheet closes. Completed paths can be inspected by tapping their stones or tabbing to the path and pressing Enter. At shared cells, the later path is above the earlier one; tap a non-crossing stone to inspect the other word.

Each acceptance mounts one small illustration from `src/client/garden.ts`: leaves, pool, gate, lantern, mushroom, snail, then moon. Coordinates use the map's 450×450 SVG viewBox. Keep the artwork clear of the 13×13 letter layout when replacing these shapes. The older `garden.svg` remains an unused reference asset; it is not loaded by the new client. No artwork or fonts are fetched remotely.

Word entry uses a native dialog for focus containment, Escape dismissal, a close button, explicit labels and a five-letter pattern that remains inside the sheet while the keyboard is open. The sheet scrolls on short viewports. Inputs use readable 16px text; action controls have at least 44px targets and paths extend their hit area around the cells. A real device keyboard and assistive-technology pass remain human checks beyond desktop browser emulation.

Finite reveal animations respect OS reduced motion, the pause control and page visibility. Sound is off until a user gesture enables a short three-note Web Audio chime; reload does not replay discovery. Light/dark and sound/motion preferences are session-local. There are no continuous glowing or pulsing effects. The final screen shows seven accepted paths and supports inspecting their clues; it does not pretend multiworld assembly or sharing is implemented.

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

The final installed build recovered the identical accepted postcard on two full Reddit reloads without automatic animation or sound. Repeat submission and a late draft save returned the unchanged accepted turn. Replay triggered animation with zero review requests, and motion pause stopped all scene animations. Testing used only the explicitly authorized BarryBetsALot account; the owner’s postcard was not played. Original progress remains in the previous scenario’s keys. Subsequent user feedback rejected the postcard style and reported a version-mismatch message; see the next revision. No public publication was performed.

### Illustrated garden and reconnect revision — 2026-09-07

Actual user feedback supersedes the postcard direction: simpler expressive illustration, cohesive location, unusual whimsy and room for the user's own artistic additions. The previous generated concepts were too detailed and one was too dark. The current SVG replaces those concepts.

TypeScript, ESLint, **48 tests** and production build pass. **34 isolated browser checks** pass across the full discovery flow, 320/390/768/1440 widths, audio, motion, keyboard landmark inspection, guest/configuration gates, stale-context recovery, repeated mismatch rejection and unsaved-draft recovery. Nine new code tests exercise bounded context refresh, non-retry of paid submissions, scenario isolation and service errors.

The user's exact failing account/device has not been identified. BarryBetsALot loaded matching build 0.0.2.2 at intake, so the original failure was not reproduced in that account. Local fault injection verifies the new recovery paths; it does not establish the internal cause of Devvit routing. Private upload **0.0.3** followed by playtest **0.0.3.2** installed successfully. The actual Reddit game recovered the unchanged accepted turn across two complete reopens, and the ordinary post link also loaded the matching scenario. The installed Devvit context-refresh bridge responded successfully and the next GET returned HTTP 200. SDK context confirmed BarryBetsALot. Landmark inspection and replay/pause passed with zero new submissions; no fresh paid review was performed in this visual revision. The owner’s turn remains untouched. The exact original account/device failure and subjective acceptance of this art direction remain unverified.

### Blank-map progression — 2026-09-07

The new direction starts with an empty map and reveals the world through crossword construction. Three accepted paths now form one connected crossword, each with a different clue rule and a small environmental reveal. Earlier scenario records and compatibility routes remain intact.

The shared validation gate passed TypeScript, ESLint, **55 tests in five files**, and production build. Seven new tests cover complete progression, crossing geometry, rule reuse, skip/forgery rejection, late and duplicate writes, concurrency, shared budgets, account isolation and preservation of the earlier scenario. **30 isolated browser checks** passed, including all three paths, rejections, provider errors, failed-save reconnects, completed clue inspection, light/dark, audio opt-in/out, reduced motion, 320/390/768px layouts and a 420px-high entry viewport. Browser testing found and fixed a misleading saved indicator during the debounce window; edits now mark themselves unsaved immediately and closing the sheet flushes the draft.

Private upload **0.0.4**, followed by playtest **0.0.4.2**, installed successfully. Under the separately authorized BarryBetsALot account, all three real OpenAI reviews accepted their submitted word/clue pairs in approximately **3.5s, 2.1s and 1.6s**. The map revealed one, two, then three elements. A full Reddit reload at 390px restored all three accepted paths; keyboard inspection showed the stored clue, and the iframe had no horizontal overflow. The old postcard accepted record was still present. The owner's new garden was not played. These observations establish the tested flow, not broad AI judgment accuracy or subjective design acceptance.

Run artifacts live in the ignored `.workflows/chatterbloom-paths/run1/` directory. The managed playtest remains running for user feedback. Actual iOS/Android keyboards, screen readers and subjective art/gameplay feedback remain untested. Multiworld assembly, daily reset and sharing are outside this three-path slice; no public publication was performed.

### Fresh seven-word human playtest — 2026-09-07

The user's next request extends their personal playtest from three words to all seven. `chatterbloom-seven-v1` provides a fresh board without deleting the older three-word records. Four more routes and illustrations complete the seven-rule sequence; crossings are derived from shared coordinates and can branch to earlier words. Every configured path crosses one earlier path at the same letter index. The geometry test verifies 29 occupied cells and exactly seven words with no accidental adjacency.

The shared gate passed typecheck, lint, **57 tests in five files**, and build. **43 isolated browser checks** passed the seven-word sequence, each later crossing/rule count/reveal, recovery/error states, 320/390/768px layouts and the short entry viewport. The map retains readable letters and compact discovery markers; the entry pattern remains larger for typing.

Private upload **0.0.5** and managed playtest **0.0.5.2** loaded a genuinely fresh scenario for BarryBetsALot. That separate account completed all seven paths with seven real OpenAI acceptances, approximately **1.7–2.9 seconds** each. A full mobile Reddit reopen restored all seven accepted paths, seven used rules and seven scenery elements, with no next-path marker or horizontal overflow. Keyboard inspection recovered the last clue. The owner's new board was not played, and the server remains available for their own test. Subjective feedback and physical-device keyboard/accessibility testing remain pending.

Evidence: ignored `.workflows/chatterbloom-seven/run1/`. No reset endpoint, public publication, multiworld expansion or sharing feature was added.

## Sources checked 2026-09-07

- [Devvit quickstart](https://developers.reddit.com/docs/quickstart): current Node requirement, app registration and playtest setup.
- [Devvit settings and secrets](https://developers.reddit.com/docs/capabilities/server/settings-and-secrets): encrypted server-side settings and CLI setup after installation.
- [Devvit Redis](https://developers.reddit.com/docs/capabilities/server/redis): installation-scoped persistence; shared storage must be designed explicitly.
- [Devvit HTTP fetch](https://developers.reddit.com/docs/capabilities/server/http-fetch): server-only fetch, declared domains and app-policy links.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses JSON format and refusal handling.
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini): pinned snapshot and structured-output support.

- [Devvit playtest lifecycle](https://developers.reddit.com/docs/guides/tools/playtest): private playtest installation, live reload, and full upload version bump.
