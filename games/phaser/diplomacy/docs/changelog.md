## v0.0.11 — Phaser-Based Tutorial Highlights & Camera Pan (2026-02-25)

### Fix
- **Province highlighting now works**: Replaced broken DOM-based highlights (`[data-province-id]` selectors that matched nothing) with Phaser Graphics objects that draw pulsing gold borders directly on the canvas polygons.
- **Camera auto-pans to relevant provinces**: When a tutorial step specifies `highlightProvinces`, the camera smoothly tweens to center on those provinces. Previously the camera started at (0,0) showing the North Atlantic, requiring manual scrolling to find Italy.

### Technical Details
- Added `applyTutorialHighlights()` in `Tutorial.ts` using `Phaser.GameObjects.Graphics` to draw province polygon outlines at `DEPTH_TUTORIAL_HIGHLIGHT = 20`.
- Added `panCameraToProvinces()` to compute bounding box of highlighted provinces and tween the camera to center on them.
- Added `clearTutorialHighlights()` with cleanup calls in `reloadTutorialScene()`, `exitTutorial()`, and `shutdown()`.
- Changed `provincePolys` from `private` to `protected` in `GamePlay.ts` for subclass access.
- Removed `addProvinceHighlight()` from `TutorialOverlayDOM.ts` (broken DOM approach).
- Removed `.tutorial-highlight` CSS class and `@keyframes tutorial-pulse` (no longer used).

### Files Changed
- `src/client/game/scenes/Tutorial.ts` — Added Phaser highlight graphics + camera pan logic
- `src/client/game/scenes/GamePlay.ts` — Changed `provincePolys` to `protected`
- `src/client/game/tutorial/TutorialOverlayDOM.ts` — Removed broken DOM highlight code
- `src/client/game/game.css` — Removed unused `.tutorial-highlight` styles

---

## v0.0.10 — Tutorial Accessibility Fix (2026-02-25)

### Fix
- **Tutorial button accessible from GamePlay**: Added a "Tutorial" button to the GamePlay scene (alongside "My Games" and "History") so players can start the tutorial even when an active game exists. Previously, the tutorial was only accessible from the MainMenu lobby, which is bypassed when a game is in progress.

### Technical Details
- Added `createTutorialButton()` as a `protected` method on `GamePlay`, overridden in `Tutorial` to prevent nested tutorial buttons.
- Added `destroyTutorialButton()` cleanup in all scene transition paths.
- Added `#tutorial-btn` CSS styling (green accent to differentiate from other nav buttons).

### Files Changed
- `src/client/game/scenes/GamePlay.ts` — Added tutorial button creation/destruction
- `src/client/game/scenes/Tutorial.ts` — Override to suppress button during tutorial
- `src/client/game/game.css` — Added `#tutorial-btn` styles

---

## v0.0.9.1 — Tutorial Mode (2026-02-25)

### New Feature
- **Interactive tutorial**: Client-side guided tutorial that teaches all core Diplomacy mechanics through a scripted introductory game as Italy, lasting ~3 game years (Spring 1901 through Fall 1903).
- **Tutorial scene**: New `Tutorial` scene extending `GamePlay` with local order resolution (no server communication). Uses the shared `orderResolver` directly on the client.
- **Tutorial overlay**: DOM-based guidance system with step-by-step instructions, province highlights, UI element pointing, step counter, skip button, and completion screen.
- **Scripted bot orders**: Pre-computed orders for 6 bot nations across 8 tutorial turns, crafted to create pedagogically interesting scenarios (supported attacks, dislodgements, convoy opportunities).
- **Mechanics covered**: Movement, holds, supply center capture, support orders, convoy orders, retreats, and builds/disbands.
- **MainMenu integration**: Gold-styled "TUTORIAL" button on the lobby screen.

### Technical Details
- `Tutorial` extends `GamePlay` (key methods changed from `private` to `protected` for extensibility).
- `GamePlay` constructor updated to accept optional config parameter for subclass scene keys.
- `tutorialScript.ts` defines `TutorialStep` and `TutorialTurn` types with step advancement conditions (`waitForNext`, `waitForOrderFrom`, `waitForSubmit`, `waitForRetreat`, `waitForBuild`).
- `TutorialOverlayDOM` singleton manages the tutorial guidance DOM overlay.
- Order resolution uses `resolveOrders()` and `applyResults()` imported from `server/core/orderResolver.ts` (pure logic, no server dependencies).
- Tutorial state (turn index, step index) persists across scene restarts via `_tutorialState` data parameter.

### Files Added
- `src/client/game/scenes/Tutorial.ts`
- `src/client/game/tutorial/tutorialScript.ts`
- `src/client/game/tutorial/TutorialOverlayDOM.ts`

### Files Changed
- `src/client/game/scenes/GamePlay.ts` — Changed key methods/properties from `private` to `protected`
- `src/client/game/scenes/MainMenu.ts` — Added TUTORIAL button
- `src/client/game/game.ts` — Registered Tutorial scene
- `src/client/game/game.css` — Added tutorial overlay styles

---

## v0.0.2.127 — Game History / Replay (2026-02-23)

### New Feature
- **Turn snapshots**: Board state (units, supply centers, turn log) is saved after each phase resolution (orders, retreats, builds) and at game start. Stored as a Redis sorted set per game.
- **History panel**: DOM overlay with timeline slider, previous/next buttons, turn label with snapshot counter, and scrollable turn log with color-coded entries.
- **Replay mode**: Clicking "History" in the GamePlay scene hides the orders panel and renders the selected snapshot's units and supply center ownership on the map. Province interactions are disabled during replay.
- **History button**: Gold-styled button positioned below "My Games" in the top-left corner of the GamePlay scene.
- **GameOver integration**: "View History" button on the Game Over screen launches GamePlay in history mode.
- **Graceful fallback**: If no snapshots exist (games started before this version), the history button returns to normal view without errors.

### Technical Details
- `TurnSnapshot` interface: `{ turn, phase, units, supplyCenters, log }` stored in `game:{postId}:history` sorted set.
- `saveTurnSnapshot()` and `getTurnHistory()` in `gameState.ts` handle persistence.
- `GET /api/game/history` endpoint returns all snapshots for a game.
- `HistoryPanelDOM` singleton manages the DOM overlay lifecycle.
- `renderSnapshot()` in GamePlay destroys current unit tokens and redraws from snapshot data, including supply center color updates.
- Snapshots are saved in both normal turn resolution and auto-resolve (timer expiry) code paths.

### Files Changed
- `src/shared/types/game.ts` — Added `TurnSnapshot` interface
- `src/shared/types/api.ts` — Added `HistoryResponse` type
- `src/server/core/gameState.ts` — Added `saveTurnSnapshot()`, `getTurnHistory()`, `historyKey()`
- `src/server/index.ts` — Added `GET /api/game/history` endpoint, snapshot saves after orders/retreats/builds/start/auto-resolve
- `src/client/game/ui/HistoryPanelDOM.ts` — New file: history panel DOM overlay
- `src/client/game/scenes/GamePlay.ts` — Added history button, toggle/exit history mode, `renderSnapshot()`, `initOrdersPanel()`, history mode guards
- `src/client/game/scenes/GameOver.ts` — Added "View History" button
- `src/client/game/game.css` — Added history panel and button styles

---

## v0.0.2.121 — Tier 2 Bot AI: Outcome Simulation (2026-02-21)

### Enhancement
- **Outcome simulation**: Bots now generate multiple candidate order sets and simulate each one using the real `resolveOrders` engine. The order set that produces the highest-scoring board position is selected.
- **Position scoring function**: Evaluates board states based on supply centers owned (×100), units alive (×30), units adjacent to target SCs (×15), units threatening enemy SCs (×5), and a penalty for own SCs under threat (×-20).
- **Candidate generation**: Up to 40 candidate order sets are generated per bot by swapping individual unit orders (hold, all valid moves) and creating coordinated move+support pairs.
- **Opponent prediction**: Assumes all opponents hold all units (conservative baseline). Orders that succeed against holding opponents will succeed against most real orders.
- **Improved retreats**: Bots now prefer retreating to supply centers (especially their own), not just the nearest province to home.

### Technical Details
- `scorePosition(state, country)` evaluates a board position with a weighted multi-factor formula.
- `generateCandidates(state, country, baseline)` creates variant order sets by single-unit swaps and coordinated move+support pairs.
- `simulateAndScore(state, candidateOrders, country, activeCountries)` deep-clones the game state, builds hold orders for opponents, runs `resolveOrders` + `applyResults`, and returns the position score.
- `generateBotOrders()` now generates the Tier 1 baseline, creates candidates, simulates all of them, and picks the highest-scoring set.
- `deepCloneState()` uses JSON round-trip for safe state isolation during simulation.
- Performance budget: ~40 candidates × ~1ms per resolveOrders call = ~40ms per bot country, well within acceptable limits.

### Files Changed
- `src/server/core/botLogic.ts` — Added `scorePosition()`, `generateCandidates()`, `simulateAndScore()`, `deepCloneState()`, `buildHoldOrders()`, `generateAlternativeOrders()`, `isSameOrder()`. Refactored `generateBotOrders()` to use simulation. Improved retreat scoring.

---

## v0.0.2.117 — Tier 1 Bot AI (2026-02-21)

### New Feature
- **Strategic bot behavior**: Bots now use rule-based heuristic AI instead of holding all units every turn.
- **Orders phase**: Bots defend threatened supply centers, attack undefended/neutral SCs, support their own attacks, and pathfind toward distant targets. Anti-self-bounce logic prevents two bot units from moving to the same province.
- **Retreats phase**: Bots retreat toward their nearest friendly supply center instead of always disbanding. Only disband when no valid retreat exists.
- **Builds phase**: Naval powers (England, Turkey) prefer building fleets at coastal home SCs. All bots prioritize building at SCs closest to the front line. When disbanding, bots remove the unit furthest from enemy territory.

### Technical Details
- BFS-based pathfinding (`distanceTo()`) calculates shortest distance from any province to a target set, respecting unit type movement rules (armies can't cross water, fleets can't cross inland).
- `findThreatenedSCs()` identifies owned SCs with adjacent enemy units for defensive prioritization.
- `scoreTarget()` ranks attack targets by distance and ownership (neutral preferred over enemy-owned).
- `generateBotOrders()` uses a 4-tier priority system: defend → attack reachable SC → pathfind toward distant SC → support friendly moves → hold.
- `claimedDestinations` map prevents self-bounces and converts duplicate moves into support orders.
- Multi-coast provinces (STP, SPA, BUL) handled via `determineCoast()`.

### Files Changed
- `src/server/core/botLogic.ts` — Complete rewrite of `generateBotOrders()`, `autoSubmitBotRetreats()`, `autoSubmitBotBuilds()` with strategic heuristics

---

## v0.0.2.113 — Configurable Turn Timer (2026-02-21)

### New Feature
- **Turn timer configuration**: Game host can select a turn time limit in the lobby before starting. Presets: None (default), 5m, 15m, 1h, 24h, 48h.
- **Countdown display**: During gameplay, a live countdown timer appears in the Orders Panel showing remaining time. Turns red and pulses when under 1 minute.
- **Auto-resolve on expiry**: When the deadline passes, the server auto-submits hold orders for players who haven't submitted and resolves the turn. During retreats, remaining dislodged units are disbanded. During builds, pending builds are waived.
- **Lazy deadline enforcement**: The deadline is checked whenever any client polls `/api/game/state`, avoiding the need for server-side cron jobs.

### Technical Details
- New `GameState` fields: `turnTimeLimitMs` (configured duration per turn, null = no limit), `turnDeadline` (Unix timestamp when current turn expires).
- New endpoint: `POST /api/game/configure` — sets game options (currently `turnTimeLimitMs`) during the `waiting` phase.
- `setPhase()` automatically resets `turnDeadline = Date.now() + turnTimeLimitMs` when transitioning to `orders`, `retreats`, or `builds`.
- `autoResolveIfExpired()` handles all three timed phases with appropriate default behavior (hold orders, disband retreats, waive builds).
- Timer display uses `setInterval(1s)` on the client with monospace font for smooth countdown.
- Shared `TURN_TIMER_PRESETS` constant ensures lobby UI and validation stay in sync.

### Files Changed
- `src/shared/types/game.ts` — Added `turnTimeLimitMs`, `turnDeadline` to `GameState`, exported `TURN_TIMER_PRESETS`
- `src/shared/types/api.ts` — Added `turnDeadline` to `GameSummary`
- `src/server/core/gameState.ts` — Updated `createGame()`, `startGame()`, `setPhase()` for timer fields
- `src/server/index.ts` — Added `POST /api/game/configure`, `autoResolveIfExpired()`, updated `/api/game/state` and `/api/user/games`
- `src/client/game/ui/OrdersPanelDOM.ts` — Added `timerEl`, `setDeadline()`, `formatCountdown()`, timer cleanup in `destroy()`
- `src/client/game/scenes/MainMenu.ts` — Added timer picker UI (`createTimerPicker()`, `setTimer()`)
- `src/client/game/scenes/GamePlay.ts` — Passes `turnDeadline` to `OrdersPanelDOM.setDeadline()`
- `src/client/game/game.css` — Added `.orders-timer`, `.timer-warning`, `.timer-expired` styles with pulse animation

---

## v0.0.2.109 — Multi-Game Support / "My Games" Dashboard (2026-02-23)

### New Feature
- **My Games scene**: A new Phaser scene that shows all Diplomacy games the user is participating in across different Reddit posts. Games are grouped into sections: "YOUR TURN", "WAITING FOR OTHERS", "IN LOBBY", and "COMPLETED". Each game card shows the player's country, turn/phase info, player count, and action badges ("YOUR TURN", "VICTORY", "DEFEATED", "DRAW").
- **My Games button in GamePlay**: A floating "My Games" button in the top-left corner of the active game view allows quick access to the dashboard.
- **My Games button in MainMenu**: The lobby screen now includes a "MY GAMES" button with a badge showing the count of games needing attention.
- **Per-user game index**: When a user joins a game, the postId is tracked in a Redis sorted set (`user:{userId}:games`). Existing games are backfilled when users visit them.

### Technical Details
- New Redis key: `user:{userId}:games` — sorted set of postIds the user has joined, scored by join timestamp.
- New endpoint: `GET /api/user/games` — returns `GameSummary[]` with phase, turn, country, player count, isYourTurn flag, and winner info for each game.
- The `/api/init` endpoint now backfills the user's game index for existing games (ensures pre-existing players are tracked).
- Clicking a game card opens that post in a new browser tab via `window.open()`.
- Scrollable list with drag and wheel scroll support.

### Files Changed
- `src/shared/types/api.ts` — Added `GameSummary`, `MyGamesResponse` types
- `src/server/core/gameState.ts` — Added `addUserGame()`, `getUserGamePostIds()` functions
- `src/server/index.ts` — Added `GET /api/user/games` endpoint, backfill in `/api/init`
- `src/client/game/scenes/MyGames.ts` — New scene with game card list, scrolling, back navigation
- `src/client/game/scenes/MainMenu.ts` — Added "MY GAMES" button with badge
- `src/client/game/scenes/GamePlay.ts` — Added floating "My Games" DOM button
- `src/client/game/game.ts` — Registered MyGames scene
- `src/client/game/game.css` — Added `#my-games-btn` styles

---

## v0.0.2.101 — Camera Panning Fix (2026-02-22)

### Bug Fix
- **Camera panning**: Fixed inability to scroll/pan to southern provinces in fullscreen mode. The camera bounds were too tight, preventing scrolling when the viewport height exceeded the world height at zoom 1.0.

### Changes
- Added 200px padding to camera bounds in all directions, allowing overscroll so every province is reachable
- Extracted `clampCamera()` helper to centralize all scroll clamping logic (drag, zoom, resize)
- Lowered minimum zoom from 0.5 to 0.35 so users can zoom out to see the full map
- Resize handler now correctly resets padded bounds and re-clamps the camera
- Province-select camera tween respects padded bounds

### Files Changed
- `GamePlay.ts` — Camera bounds, drag handler, zoom handler, resize handler, province-select tween

---

## v0.0.2.97 — Private Messaging, Coast Selection, Game Over Screen, Sound Effects (2026-02-22)

### New Features
- **Private messaging / alliances**: Chat panel now has channel tabs — "All" for global chat plus individual country tabs (AUS, FRA, GER, ITA, RUS, TUR) for private 1-on-1 messaging. Each tab shows unread badges. Server stores DM messages in separate Redis sorted sets per channel pair. Only participants in a DM channel can send to it.
- **Coast selection for multi-coast provinces**: When a fleet moves to STP, SPA, or BUL, a coast picker popup appears with "North Coast" / "South Coast" / "East Coast" buttons. The selected coast is passed through to the server `MoveOrder.coast` field. For non-ambiguous moves, `determineCoast()` auto-selects.
- **Game Over screen rewrite**: Full statistics screen with animated SC bar chart per country, winner crown animation, final turn info, game duration, and "Return to Lobby" button. Winner is highlighted with a star. Bars animate in with staggered delays.
- **Sound effects**: Web Audio API-based sound system with distinct sounds for order staging (click), order submission (ascending chord), phase change (chord), chat message (ping), and victory (fanfare). Mute toggle button (🔊/🔇) in bottom-right corner.

### Technical Details
- DM channels use sorted key pairs (e.g., `ENGLAND:FRANCE`) to ensure consistent Redis keys regardless of sender/receiver order.
- Server validates that only participants in a DM channel can send messages to it.
- Client polls all relevant channels (global + all DM channels for the player's country) in a single request.
- `StagedOrder` extended with optional `coast` field. `MoveOrder` coast is set when staging fleet moves to multi-coast provinces.
- Sound generation uses `OscillatorNode` + `GainNode` with exponential ramp for natural decay. No external audio files needed.
- GamePlay now transitions to GameOver scene when phase becomes `'complete'` (via polling or order submission).

### Files Changed
- `ChatPanelDOM.ts` — Rewritten with channel tabs, per-channel message storage, unread tracking, DM support
- `GamePlay.ts` — Coast picker, sound triggers, DM channel polling, game-over transition, `SoundManager` integration
- `GameOver.ts` — Full rewrite with animated bar chart, crown, statistics, return-to-lobby button
- `OrdersPanelDOM.ts` — Added `coast` field to `StagedOrder`, coast display in order formatting
- `SoundManager.ts` — New file: Web Audio API sound generation with mute toggle
- `game.css` — Chat tab styles, coast picker popup, sound toggle button, chat empty state
- `server/index.ts` — DM channel support in chat endpoint, channel validation, multi-channel list

---

## v0.0.2.96 — Convoy Orders, Visual Arrows, Lobby Improvements, Turn Animation, Chat (2026-02-22)

### New Features
- **Convoy order support**: Added "Convoy" button to the order mode selector. Three-step flow: click fleet in sea province, click army to convoy, click destination. Serialized as `ConvoyOrder` for the server.
- **Persistent visual order arrows**: Staged orders now render colored arrows on the map. Move orders show white arrows, hold orders show yellow circles, support orders show green arrows with dashed lines to supported units, convoy orders show blue arrows with dashed lines to convoyed armies.
- **Lobby improvements**: MainMenu now auto-polls every 3 seconds for new players joining. Shows a player list below the country selection grid. Auto-transitions to GamePlay when the game starts (no manual refresh needed). Properly cleans up polling on scene shutdown.
- **Turn resolution animation**: When units move after order resolution, they animate from their previous position to their new position with an 800ms cubic ease-out tween. Previous unit positions are passed through scene restart data.
- **Chat/negotiation system**: New ChatPanelDOM overlay in the bottom-left corner. Toggle button with unread message badge. Text input with send button. Messages stored in Redis sorted set (by timestamp). Polled every 5 seconds alongside game state. Messages show author name colored by country.

### Technical Details
- `OrderMode` type extended with `'convoy'`. `StagedOrder` extended with `convoyedProvince` and `convoyedDestination` fields.
- `orderArrowGraphics` (depth 8) separate from `hoverArrowGraphics` (depth 15) for persistent vs. hover arrows.
- `animateUnitMovements()` matches units by country+type and tweens from old to new positions.
- Chat uses `redis.zAdd`/`redis.zRange` with timestamp scores (Devvit Redis doesn't support list operations). Single POST endpoint handles both send and list actions.
- Lobby polling uses `setInterval(3000)` with change detection on player count.

### Files Changed
- `GamePlay.ts` — Convoy flow, persistent order arrows, turn animation, chat integration, separated hover/order arrow graphics
- `OrdersPanelDOM.ts` — Added convoy mode button and convoy order formatting
- `MainMenu.ts` — Auto-polling lobby, player list display, proper cleanup
- `ChatPanelDOM.ts` — New file: chat panel with toggle, unread badge, message list, input
- `game.css` — Chat panel styles, chat toggle button, message formatting, country color CSS variables
- `server/index.ts` — Chat endpoint using Redis sorted sets (zAdd/zRange/zCard/zRemRangeByRank)

---

## v0.0.2.88 — Full Order Types, Turn Log, Retreat/Build UI, Duplicate Prevention, Polling (2026-02-22)

### New Features
- **Support/Hold order types**: Added order mode selector (Move / Hold / S Hold / S Move) to the Orders Panel. Hold orders are created with a single click on a unit. Support-Hold requires two clicks (supporter, then supported unit). Support-Move requires three clicks (supporter, supported unit, destination). All order types are correctly serialized and sent to the server.
- **Turn resolution log**: Added a "Turn Log" toggle button that shows/hides a scrollable log of all past turn events. Log entries are color-coded: gold for turn headers, green for successes, red for failures/dislodgements.
- **Retreat phase UI**: When the game enters the retreat phase, dislodged units are shown with dropdown selectors for valid retreat destinations or disband. Submitted via `POST /api/game/retreats`.
- **Build phase UI**: When the game enters the build phase, players see build/disband options with province and unit type selectors. Submitted via `POST /api/game/builds`.
- **Duplicate order prevention**: Staging an order for a unit that already has an order automatically replaces the previous one. Each order row has an × remove button for manual deletion.
- **Real-time state polling**: Auto-polls `/api/game/state` every 5 seconds when waiting for other players (after submitting orders, during retreats/builds for other players, or in waiting/diplomacy phase). Polling stops when the player needs to act and restarts after submission.

### Technical Details
- `StagedOrder` now has an `orderType` field (`move` | `hold` | `support-hold` | `support-move`) with optional `supportedProvince` and `supportedDestination` fields.
- `GamePlay.ts` implements a multi-step support flow with `supportStep` state machine (`select-supporter` → `select-supported` → `select-destination`).
- `submitOrders()` converts staged orders to server-compatible `MoveOrder`, `HoldOrder`, and `SupportOrder` types.
- Polling uses `setInterval` with change detection (phase, turn, unit count) to avoid unnecessary reloads.

### Files Changed
- `GamePlay.ts` — Added order mode handling, support flow, retreat/build submission, duplicate prevention, polling lifecycle
- `OrdersPanelDOM.ts` — Complete rewrite with mode selector, turn log toggle, retreat/build UI, per-order remove buttons
- `game.css` — Added mode selector, log entries, select dropdowns, retreat/build styles, submit button highlighting

---

## v0.0.2.82 — Wire Up Server-Side Order Processing (2026-02-22)

### New Features
- **Functional order submission**: The Submit Orders button now sends staged move orders (and implicit hold orders for unordered units) to `POST /api/game/orders`. The server resolves the turn when all players have submitted, and the client refreshes with updated unit positions.
- **Turn/phase display**: The Orders Panel now shows the current turn and phase (e.g., "SPRING 1905 — ORDERS PHASE") in a gold header.
- **Player status**: The status bar shows the player's assigned country and submission state (e.g., "Playing as ENGLAND", "Orders submitted. Waiting for 3 player(s).").
- **Refresh button**: Replaced the non-functional "Adjudicate" button with a "Refresh" button that polls `/api/game/state` for the latest state. Useful when waiting for other players to submit.
- **Smart submit state**: Submit Orders button is automatically disabled when not in the orders phase or when orders have already been submitted.

### Technical Details
- `GamePlay.ts` converts `StagedOrder[]` (from → to) into the server's `Order[]` format (`MoveOrder` for staged moves, `HoldOrder` for remaining units). After successful submission, the scene restarts with the updated `GameState`.
- The server auto-submits hold orders for all bot players, so in a single-human game, each submit immediately resolves the turn.
- Full year cycle tested: Spring → Fall (with supply center updates) → next Spring.

### Files Changed
- `GamePlay.ts` — Added `submitOrders()`, `refreshGameState()`, `reloadScene()`, `updatePanelState()` methods; wired real callbacks to OrdersPanelDOM
- `OrdersPanelDOM.ts` — Added turn/phase display, Refresh button, submit enable/disable API, removed Adjudicate button
- `game.css` — Added `.orders-turn` styling for the turn indicator

---

## v0.0.2.78 — Province Tooltips & Supply Center Markers (2026-02-22)

### New Features
- **Province tooltips**: Hovering over any province now shows a tooltip with the full province name, type (Coastal/Inland/Water/Non-playable), supply center owner if applicable, and any unit stationed there. The tooltip follows the mouse cursor and is styled with a dark translucent background to match the game theme.
- **Supply center markers**: All 34 supply center provinces now display a small star marker below their label. Stars are colored gold for neutral supply centers and use the controlling power's color when owned.

### Technical Details
- Tooltip is implemented as a DOM overlay (`#province-tooltip` div) rather than a Phaser text object, providing crisp rendering at any zoom level and consistent styling with CSS.
- Supply center markers use `Phaser.GameObjects.Star` at `DEPTH_SC_MARKER = 4`, positioned between water overlays and labels in the depth ordering.
- Tooltip content is built dynamically from the `ProvinceMeta` data, `gameState.supplyCenters`, and `gameState.units`.

### Files Changed
- `GamePlay.ts` — Added `setupTooltip()`, `showTooltip()`, `hideTooltip()`, `drawSupplyCenterMarkers()` methods; updated province pointer events to show/hide tooltip; cleanup in `shutdown()`
- `game.css` — Added `#province-tooltip` styles with dark theme, rounded corners, and pointer-events:none

---

## v0.0.2.74 — Fix Remaining Black Gaps: Sicily & Corsica/Sardinia (2026-02-22)

### Bug Fixes
- **Added Sicily (SIC) landmass polygon**: Traced from the boundary between the Tyrrhenian Sea (TYS) and Ionian Sea (ION) polygons. Renders as grey non-playable landmass south of Naples.
- **Added Corsica/Sardinia (COR) landmass polygon**: Traced from the boundary between Gulf of Lyon (GOL/LYO), Tyrrhenian Sea (TYS), and Western Mediterranean (WES) polygons. Renders as grey non-playable landmass between France and Italy.
- **Generalized non-playable landmass handling**: Refactored `fillColorFor` and label color logic to use a set/array of non-playable IDs instead of hardcoded checks.

### Technical Details
The SVG does not contain explicit island polygons — islands are gaps between adjacent sea province polygons. The island boundaries were traced by identifying shared edges between neighboring sea polygons and constructing closed rings from the inner edges. SVG coordinates (610x560 viewbox) were scaled to world coordinates (2000x1400) using factors 3.2787x and 2.5y.

### Files Changed
- `board.generated.ts` — Added SIC and COR polygon entries
- `boardAdapter.ts` — Include SIC and COR as non-gameplay polygons
- `GamePlay.ts` — Added SIC and COR to non-playable landmass list, generalized fill/label logic

---

## v0.0.2.70 — Fix Ireland Rendering (2026-02-21)

### Bug Fixes
- **Fixed Ireland black gap**: Added an Ireland (IRE) landmass polygon derived from the inner edges of the Irish Sea (IRI) and North Atlantic (NAO) SVG polygons. Ireland now renders as a grey non-playable landmass, matching Switzerland's treatment.

### Technical Details
Ireland is not a playable province in Diplomacy — it's a non-interactive landmass sitting inside the Irish Sea water province. The SVG extraction tool only extracts province polygons, so the island had no coverage and showed the dark background. The fix manually traces the island boundary from the shared edges of the IRI and NAO polygons in the SVG (viewbox 610x560), scales to world coordinates (2000x1400), and adds it as an "IRE" entry in `board.generated.ts`. The `boardAdapter.ts` and `GamePlay.ts` were updated to treat IRE identically to SWI (grey fill, white label, non-interactive).

---

## v0.0.2.69 — Fix Province Hitbox Detection (2026-02-21)

### Bug Fixes
- **Fixed province hitbox misalignment**: Removed the `boardLayer` container that was causing Phaser's input system to incorrectly transform pointer coordinates for hit testing. All game objects are now added directly to the scene.
- **Depth-based draw ordering**: Replaced container-based layer ordering with explicit `setDepth()` calls. Water provinces at depth 1, land at depth 2, water overlays at depth 3, labels at depth 5, units at depth 10, arrows at depth 15.

### Technical Details
The root cause was that `Phaser.GameObjects.Polygon` objects inside a `Container` have their hit areas tested in the container's local coordinate space, but when the Phaser camera applies scroll/zoom transforms, the pointer-to-local-space conversion doesn't account for the container transform correctly. Removing the container lets Phaser's camera-based input system handle the coordinate transformation directly.

### Testing
- Map renders identically to previous version
- No console errors
- Province selection accuracy improved

---

## v0.0.2.65 — Full Map Rewrite with SVG Polygons (2026-02-21)

### Features
- **SVG-extracted province polygons**: Replaced GeoJSON-based province geometry with polygons extracted from a standard Diplomacy SVG map. Province shapes are now pixel-accurate to the board game.
- **Phaser camera-based pan/zoom**: Replaced container-based scaling with Phaser's native camera system for smooth pan (drag), zoom (scroll wheel), and pointer-anchored zoom.
- **Full game interactivity restored**: Units (armies/fleets) render with power-specific colors. Clicking a unit highlights legal move targets in green. Clicking a legal target stages a move order.
- **Orders panel overlay**: Added a DOM-based orders panel in the top-right with Clear All, Submit Orders, Adjudicate, and Game Menu buttons. Staged orders display as "A PAR → BUR" format.
- **Reddit dark theme**: Dark blue water (0x0d4770), cream land (0xfff3c0), dark borders matching Reddit's color palette.
- **2000x1400 world space**: Province polygons are rendered in a generous world coordinate system, allowing detailed zoom-in without pixelation.
- **Water overlays**: Waterway overlays from the SVG render on top of base water for geographic accuracy.
- **Arrow previews**: Hovering a legal target while a unit is selected draws a white arrow from origin to destination.

### Architecture Changes
- **Removed `MapRenderer.ts`**: All rendering logic now lives directly in `GamePlay.ts` using Phaser Polygon game objects instead of Graphics.fillPath.
- **Added `board.generated.ts`**: Auto-generated from `diplomacy_board.svg` using `tools/extract-board-polygons.js`. Contains polygon coordinates for 76 provinces.
- **Added `boardAdapter.ts`**: Maps between generated province IDs (NRG, NAT, MID, NWY) and game province IDs (NWG, NAO, MAO, NOR).
- **Added `theme.ts`**: Centralized color palette for water, land, borders, and power-specific unit colors.
- **Added `OrdersPanelDOM.ts`**: DOM overlay for orders management, separate from Phaser's canvas.
- **Updated `game.css`**: Added orders panel styles with semi-transparent dark background and button grid layout.

### Technical Details
- SVG source: `diplomacy_board.svg` (610x560 viewBox, scaled to 2000x1400)
- Extraction tool: `tools/extract-board-polygons.js` (parses SVG groups, stitches polylines, handles paths with arcs)
- Hit detection: Phaser's built-in `Phaser.Geom.Polygon.Contains` for precise per-polygon hit testing
- Province count: 76 polygons (75 game provinces + Switzerland)
- Zoom range: 0.5x to 2.5x with pointer-anchored zoom
- Pan: Camera-based drag with bounded scrolling

### Testing
- All 8 test scenarios passed
- No console errors
- Map renders with accurate province shapes, units, supply center colors, and orders panel

---

## v0.0.2.64 — Responsive Fullscreen Map Fix (2026-02-21)

### Bug Fixes
- **Fixed map scaling**: Changed `MapRenderer` scaling from a 750x750 square assumption to the actual 1200x900 source coordinate space. The map now correctly fills the full width in landscape viewports and the full height in portrait viewports.
- **Removed hardcoded coordinate offsets**: `toScreenX`/`toScreenY` no longer apply arbitrary `-40`/`+20` pixel offsets. Coordinates now map directly from source space to screen space via scale + centering offset.
- **Added viewport resize handler**: `GamePlay` scene now listens for `scale.resize` events and restarts the scene to re-render the map at the new dimensions.

### Technical Details
- Source map coordinate space: 1200x900 (from `provinceGeometry.ts` `MAP_WIDTH`/`MAP_HEIGHT`)
- Scale formula: `Math.min(viewportWidth / 1200, viewportHeight / 900)`
- Centering: remaining margin split evenly on the constrained axis
- At mobile 375x584: width-constrained at scale 0.3125, map renders 375x281 centered vertically
- At desktop 724x584: height-constrained at scale 0.649, map renders 779x584 (clamped to 724) centered horizontally

---

## v0.0.2.61 — Map-Only View (2026-02-21)

### Features
- **Removed all game pieces**: Units (Army/Fleet) no longer render on the map, letting you focus purely on the map geography.
- **Fullscreen map**: Removed the StatusBar, OrderPanel, and message overlay. The map now fills the entire viewport with no UI chrome.
- **Cleaned up dead code**: Removed unit drawing, order visualization (move arrows, support dashes, convoy lines, hold shields), and country territory border logic from `MapRenderer.ts`.
- **Simplified province coloring**: Province colors now only reflect supply center ownership — no unit-based coloring or blending.

### Technical Changes
- **`src/client/game/scenes/GamePlay.ts`**: Stripped down to map-only mode — no StatusBar, OrderPanel, message overlay, polling, or order submission. Map gets full `width × height` viewport. Kept zoom/pan controls and province hover tooltips.
- **`src/client/game/ui/MapRenderer.ts`**: Removed `drawUnits()`, `drawCountryBorders()`, `drawOrders()`, and all order arrow methods. Removed `unitSprites`, `countryBorderGraphics`, `orderArrows` fields. Removed `HOLD_SHIELD_COLOR`, `CONVOY_COLOR`, `TERRITORY_BORDER_*` constants. Removed unused imports (`Unit`, `Order`, `MoveOrder`, `ConvoyOrder`, `ADJACENCIES`).

### Testing
- All 7 test scenarios passed.
- Map renders cleanly without pieces at both mobile and desktop sizes.
- No game-related console errors.

---

## v0.0.2.57 — Desktop & Fullscreen Display Fix (2026-02-21)

### Features
- **Fixed CSS Height Chain**: Replaced `100vh` with `100%` height on `html`, `body`, `#app`, and `#game-container` for proper iframe sizing in Devvit's expanded mode dialog.
- **Compact Status Bar**: Unified desktop and mobile status bars into a single-row layout (38px desktop, 32px mobile), saving ~22px of vertical space for the map.
- **Improved Mobile Detection**: Lowered mobile threshold from 640px to 480px, ensuring the desktop layout (side panel) is used in Devvit's expanded dialog (~724px wide).
- **Adaptive Panel Width**: Order panel width now scales based on available width — narrower on medium screens (< 700px), wider on large screens.
- **Tall Inline View**: Added `height: "tall"` to the default splash entrypoint in `devvit.json` for a taller inline post embed.
- **Better Viewport Meta**: Updated `game.html` viewport meta to match splash screen's comprehensive settings.

### Technical Changes
- **`src/client/game/game.css`**: Fixed height chain with `html, body { height: 100% }` and `#app { position: absolute; inset: 0 }`. Added `canvas { display: block }`.
- **`src/client/game/game.ts`**: Changed Phaser scale config to use `'100%'` for width/height instead of fixed pixel values.
- **`src/client/game/scenes/GamePlay.ts`**: Lowered `isMobile` threshold to 480px. Added responsive panel width calculation for medium screens.
- **`src/client/game/ui/StatusBar.ts`**: Unified to compact single-row layout for all screen sizes with adaptive SC spacing.
- **`src/client/splash/splash.css`**: Fixed `100vh` to `100%` height with proper `html, body` reset.
- **`src/client/game.html`**: Updated viewport meta tag for iframe compatibility.
- **`devvit.json`**: Added `"height": "tall"` to default entrypoint.

### Testing
- All 8 test scenarios passed.
- Verified game fills entire dialog iframe (724x584) with no overflow or scrollbars.
- Desktop layout confirmed: side panel, compact status bar, map fills remaining space.
- Mobile layout confirmed at 390x844.
- No console errors.

### Notes
- The expanded mode dialog size (724x584 on desktop) is controlled by the Devvit platform, not the app. The game now properly fills this space.
- Browser Fullscreen API is not available in Devvit iframes (`document.fullscreenEnabled === false`).

---

## v0.0.2.48 — Classic Diplomacy Map Visual Revamp (2026-02-21)

### Features
- **Classic Board Game Aesthetic**: Completely revamped the map to match the classic Diplomacy board game look from the reference image.
- **Authentic Country Colors**: Updated all seven country colors to match the standard Diplomacy palette — England (pink), France (blue), Germany (gray), Austria (purple), Italy (brown/orange), Russia (yellow-olive), Turkey (dark green).
- **Deep Blue Ocean**: Water zones now render in a rich, deep blue that clearly contrasts with land territories.
- **Black Star Supply Centers**: Replaced gold glowing stars with classic black 5-pointed stars with subtle white outlines.
- **Switzerland Hatching**: Added the impassable Switzerland territory with diagonal hatching pattern.
- **Improved Typography**: Province labels now show full names with serif italic styling for water zones.
- **Cleaner Borders**: Water zone borders are now subtle blue lines, while land borders remain solid black.

### Technical Changes
- **`src/shared/types/game.ts`**: Updated `COUNTRY_COLORS` to match the classic Diplomacy palette.
- **`src/client/game/ui/MapRenderer.ts`**: Major visual overhaul — new color constants, simplified province coloring, black star supply centers, Switzerland rendering, improved label styling with full province names, unit markers with black outlines.
- **`src/client/game/ui/coastlines.ts`**: Added `SWITZERLAND` polygon for the impassable territory.
- **`src/client/game/ui/ProvinceTooltip.ts`**: Updated tooltip colors to match new darker palette.
- **`src/client/game/scenes/Preloader.ts`**: Removed unused SVG background generation/loading.
- **`src/client/game/scenes/GamePlay.ts`**: Updated camera background color to match new water color.

### Testing
- All 12 test scenarios passed.
- Verified country colors, water zones, neutral territories, supply centers, labels, units, Switzerland, status bar, and mobile layout.
- No game-related console errors.

---

## v0.0.2.47 — Accurate Territory Polygons (2026-02-18)

### Features
- **Accurate Map Geography**: Replaced algorithmic Voronoi cells with accurate province polygons derived from open-source GeoJSON data.
- **Clearly Defined Territories**: Provinces now match the standard Diplomacy map shape, with distinct coastlines and borders.
- **Improved Visual Fidelity**: The map now looks like a real map rather than a mathematical approximation.

### Technical Changes
- **GeoJSON Integration**: Imported `diplomacy_map.json` containing standard Diplomacy map coordinates.
- **Polygon Processing**: Updated `provinceGeometry.ts` to parse GeoJSON and transform lat/long coordinates to the game's coordinate system.
- **Removed Voronoi Logic**: Deleted the complex and approximate Voronoi tessellation code.

### Modified Files
- `src/client/game/ui/provinceGeometry.ts` — Replaced Voronoi generation with GeoJSON parsing and coordinate transformation.
- `src/client/game/data/diplomacy_map.json` — Added GeoJSON data file.

### Testing
- Verified map rendering with new polygons.
- Confirmed game loads and runs without errors.
- Visual inspection via screenshots confirms accurate territory shapes.
