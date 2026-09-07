# CrossWorld: first Devvit playtest

This app ports the personally tested single-turn mock to Reddit. The user chose CrossWorld as its name and OpenAI as its initial clue reviewer. Theme and art remain the user's decisions. The current renderer uses HTML controls and CSS; it does not need Phaser or a separately hosted server.

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

Current cost controls: one fresh review per user per 45 seconds; at most 20 attempted reviews per user per installation per UTC day; at most 200 attempted reviews app-wide per UTC day. Failures count toward these API allowances but never use the gameplay restriction. Completed identical reviews are reused for seven days. There is no automatic retry. These are conservative playtest limits, to be tuned with actual usage.

Reddit requires apps that use HTTP fetch to provide Terms & Conditions and Privacy Policy links in app details. Add the actual policies before wider distribution; this repository does not invent or publish legal terms for the owner.

## Requests and persistence

| Route                        | Access                  | Behavior                                                                                    |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `GET /api/turn`              | Everyone                | Returns login/configuration readiness and the caller's own turn; guests get an empty turn.  |
| `POST /api/draft`            | Signed-in Reddit user   | Saves bounded draft fields. Ignores client identities, statuses and verdicts.               |
| `POST /api/submit`           | Signed-in Reddit user   | Revalidates slot and restriction, reads cached review or calls judge, and saves acceptance. |
| `/internal/on-app-install`   | Devvit internal trigger | Creates the playtest post.                                                                  |
| `/internal/menu/post-create` | Devvit moderator menu   | Creates another post for the same scenario.                                                 |

User identity comes only from Devvit request context. There is no manual accept or reset API. Current slot and restriction definitions are server-owned shared code. The browser shares that logic for immediate feedback, but modifying the browser cannot change server acceptance.

Redis installation-scoped keys use `cq:crossworld-live-turn-1-v1:<user>:…`. Drafts are editable; acceptance is a separate immutable `SET NX` record and always wins over later draft writes. That one record represents completion and restriction use, avoiding a separate increment that could award twice. A hash of normalized submission, model and rubric version identifies a cached review. A fixed expiring cooldown serializes fresh requests; it is deliberately never deleted by an older request. UTC budget keys expire after 48 hours, review caches after seven days; drafts and accepted progress persist. Global Redis contains only the app-wide daily counter.

Drafts use last-save-wins behavior across devices. The client serializes its own saves, flushes edits before submission/refresh, and keeps typed content visible if a save fails. A response lost after acceptance is recovered by refreshing the saved turn. An interrupted request before the result is persisted can require a fresh paid call after cooldown; exactly-once external billing is not claimed.

## Rules and scope

- The current slot has five A–Z letters, second letter A, crossing the supplied MAP.
- Select one restriction: at most four words; exactly seven words; no E; no whole-word A/AN/THE; every word at most four letters; at least two words with the same initial; or no A.
- Clues contain 1–140 characters and at least one word. A word is a case-insensitive contiguous group of A–Z letters. Apostrophes, hyphens and punctuation split tokens.
- The exact answer as a whole clue word is banned. Its letters inside another word and word-family relatives are allowed. The same rules are visible in the UI.
- A true `validWord` and true `fairClue` accept the turn. A rejection permits editing. Infrastructure errors spend no restriction.
- One playable level, no daily scheduling, generated future grid, seven-day progression, leaderboards, multiplayer, appeals workflow or finished chapter art in this iteration. The single-turn mechanics must work on Reddit before adding those systems.

## Validation and rollout evidence

From repository root:

```sh
node tools/validate-all.mjs --install web/crossworld
```

The app has rule tests, Devvit Redis tests for isolation/concurrency/limits, and adapter tests for exact payload shape and malformed/refused/error responses. Browser QA uses separate mocked API contexts, including draft recovery, review error/revision/acceptance and 320/390/768/1440 pixel widths. Mocked provider tests do not prove live OpenAI connectivity.

After configuration, verify the actual installed post under a separate test account: reveal, write a valid slot word and compliant clue, submit, read the real review, refresh, and confirm the same accepted turn or editable rejected turn returns. Also check that a guest cannot submit. Do not use the owner's live turn for automated acceptance testing. Keep the playtest process available for the user.

## Sources checked 2026-09-07

- [Devvit quickstart](https://developers.reddit.com/docs/quickstart): current Node requirement, app registration and playtest setup.
- [Devvit settings and secrets](https://developers.reddit.com/docs/capabilities/server/settings-and-secrets): encrypted server-side settings and CLI setup after installation.
- [Devvit HTTP fetch](https://developers.reddit.com/docs/capabilities/server/http-fetch): server-only fetch, declared domains and app-policy links.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses JSON format and refusal handling.
- [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini): pinned snapshot and structured-output support.
