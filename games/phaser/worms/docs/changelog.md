# Reddit Royale - Changelog

## [v0.0.12.124] - 2026-02-26 — Fix End-of-Game Resolution (wf-1772087090)

### Fixed
- **Game-over detection guard**: `checkWinCondition()` now guards against re-entry, preventing double `showGameOver()` calls from race conditions between `settleWorms()` and the main `update()` loop.
- **Auto-advance after player turn in single-player**: After the player fires and worms settle, the turn now auto-advances after 1.2s delay. Previously, local non-online, non-AI turns required manual ENTER press with no UI indication.
- **Settling phase isolation**: Added `isSettling` flag to prevent double worm physics updates. The main `update()` loop now skips worm updates while `settleWorms()` is active, eliminating race conditions.
- **Early game-over detection during settling**: `settleWorms()` now checks team alive count each tick and exits early when only one team remains, rather than waiting for all worms to finish settling.
- **Dead worm guard in `startTurn()`**: Now checks if the active worm is alive before starting a turn. If the worm is dead, triggers `checkWinCondition()` instead of starting an invalid turn.
- **Game-over overlay reliability**: Overlay now explicitly registers with `uiContainers` on creation. Background is interactive to block clicks from passing through to game elements.
- **Improved game-over UI**: Replaced generic "ENTER — New Game" text with distinct "Play Again" and "Main Menu" buttons with better visual hierarchy.

### Files Changed
- `src/client/game/scenes/GamePlay.ts` — All game-over flow fixes, settling isolation, auto-advance, overlay improvements.

---

## [v0.0.12.123] - 2026-02-26 — Fix Parachute Effectiveness (wf-1772085203)

### Fixed
- **Auto-parachute during settling for all worms**: Previously only AI worms auto-deployed parachutes when falling dangerously after explosions. Human player worms now also get automatic parachute protection during the post-weapon settling phase, since players can't control worms during that phase anyway.
- **Parachute deceleration improved**: When opened mid-fall at high velocity, the parachute now smoothly decelerates (0.85× per frame) instead of instantly capping at max speed. Slower terminal velocity (0.8 vs 1.0) and gentler gravity (0.1 vs 0.15).

### Balanced
- **Fall damage reduced**: Threshold increased from 60px to 80px, damage per pixel reduced from 0.5 to 0.35. A 120px fall now deals ~14 damage instead of ~30.

### Files Changed
- `src/client/game/entities/Worm.ts` — Fall damage constants, parachute deceleration physics.
- `src/client/game/scenes/GamePlay.ts` — Removed AI-only check for auto-parachute in `settleWorms()`.

---

## [v0.0.12.122] - 2026-02-26 — Rebalance Rope Swing + Player Control (wf-1772078022)

### Improved
- **Rope swing rebalanced**: Damping changed from 0.975 to 0.99 for a natural decay that still allows meaningful swinging. Gravity increased to 0.0035, angular velocity cap raised to 0.06 rad/frame.
- **Player-driven swing**: Left/right arrow keys now pump the pendulum while on the rope, letting players actively build momentum instead of passively waiting.
- **Fixed rope detach direction**: Removed the forced-upward velocity on release (`-Math.abs(...)`) that caused the worm to always fly upward and then take fall damage. Detach now uses actual tangential direction. Release scale adjusted to 0.85.

### Files Changed
- `src/client/game/entities/Worm.ts` — Rebalanced constants, added `swingInput()`, fixed `detachRope()` velocity.
- `src/client/game/scenes/GamePlay.ts` — Wired left/right keys to `swingInput()` when on rope.

---

## [v0.0.12.119] - 2026-02-26 — Smooth Ninja Rope Swing (wf-1772076556)

### Improved
- **Rope swing damping increased**: Changed from 0.995 to 0.975 so the pendulum settles faster instead of oscillating wildly for many seconds.
- **Gravity reduced**: Lowered from 0.004 to 0.003 for gentler swing acceleration.
- **Angular velocity capped**: Added ±0.04 rad/frame cap to prevent runaway spinning at high amplitudes.
- **Smoother detach launch**: Release velocity scaled by 0.7× to prevent overly aggressive flings on rope release.

### Files Changed
- `src/client/game/entities/Worm.ts` — Tuned rope physics constants and added velocity cap.

---

## [v0.0.12.115] - 2026-02-26 — Graceful Active Worm Death (wf-1772065032)

### Fixed
- **Active worm dying mid-turn no longer stalls the game**: When the active worm walks off a cliff or takes fatal fall damage during its turn (outside the weapon resolution flow), the turn now auto-advances after an 800ms delay instead of leaving the player stuck until the turn timer expires.
- **Dead worm input blocked**: `canAct()` now returns `false` when the active worm is dead, preventing phantom movement/weapon input on a dead worm.

### Files Changed
- `src/client/game/scenes/GamePlay.ts` — Added `onActiveWormDied()` method, dead-worm guard in `canAct()`, and active-worm-death detection in `update()`.

---

## [v0.0.12.111] - 2026-02-25 — Fix Game-Over & Restart Bug (wf-1772061756)

### Fixed
- **Game-over screen never appearing**: Added a win condition check in the `update()` loop so worms dying outside the weapon resolution flow (e.g., falling off the map during movement) properly trigger game-over.
- **Broken game initialization on restart**: Added `resetState()` method to `GamePlay.create()` that resets all instance state (`gameOver`, `worms`, `turnOrder`, timers, etc.) before each game. Phaser reuses Scene instances, so the previous game's stale state (dead worms still in the array, `gameOver` stuck at `true`) was corrupting new games.

### Files Changed
- `src/client/game/scenes/GamePlay.ts` — Added `resetState()` method and per-frame `checkWinCondition()` when alive count changes.

---

## [v0.0.12.107] - 2026-02-25 — Local Stats + Map Variety (wf-1772059886)

### Added
- **Local win/loss statistics**: Single-player game results (wins, losses, games played, kills) are now persisted to `localStorage`. A compact stats bar ("W: 5  L: 3  GP: 8  K: 27") appears on the mode select screen when games have been played.
- **Archipelago map**: Scattered green landmasses over shallow turquoise seas (6 octaves, island generation).
- **Lunar Surface map**: Barren grey moonscape with shallow craters against a dark sky (terraced terrain, 3 octaves).
- **Random map option**: "🎲 Random" added as the first option in GameSetup. Selects a random map at game start.
- **`LocalStats` system**: New client-side stats tracker (`src/client/game/systems/LocalStats.ts`) with `recordWin()`, `recordLoss()`, `addKills()` methods backed by localStorage.
- **`randomMapId()` helper**: Utility function in `shared/types/maps.ts` to pick a random playable map.

### Files Changed
- `src/shared/types/maps.ts` — Added Archipelago and Lunar Surface presets, `PLAYABLE_MAP_PRESETS`, `randomMapId()`.
- `src/client/game/systems/LocalStats.ts` — New file for localStorage-backed stats.
- `src/client/game/scenes/GamePlay.ts` — Added `recordLocalStats()` method, called from `showGameOver()`.
- `src/client/game/scenes/GameSetup.ts` — Added Random map meta-option, resolves to real map on start.
- `src/client/game/scenes/ModeSelect.ts` — Shows stats bar below mode buttons when gamesPlayed > 0.

---

## [v0.0.12.103] - 2026-02-25 — AI Passive, Tutorial Persistence, Mobile Adaptations (wf-1772059016)

### Changed
- **AI passive during tutorial**: AI opponents now skip their turn entirely during tutorial mode instead of firing back. This prevents confusion for new players learning the mechanics. The AI turn completes automatically after a 500ms delay.
- **Mobile tutorial text**: Tutorial steps detect touch input and display touch-specific instructions (e.g., "Tap the 🎯 button" instead of "Press SPACE"). Affects all 11 steps including hints.

### Added
- **Tutorial persistence**: Tutorial completion is stored in `localStorage`. After completing or skipping the tutorial, returning to the mode select screen shows a green "✓ Completed" badge on the Tutorial button.
- **Static `TutorialManager.isComplete()`**: Utility method to check if the tutorial has been completed, used by ModeSelect for the badge.

### Files Changed
- `src/client/game/systems/TutorialManager.ts` — Added touch detection, mobile-aware step text, localStorage persistence, static `isComplete()`.
- `src/client/game/scenes/GamePlay.ts` — AI turn skips `executeTurn` when tutorial is active.
- `src/client/game/scenes/ModeSelect.ts` — Imports TutorialManager, shows "✓ Completed" badge on Tutorial button.

---

## [v0.0.12.102] - 2026-02-25 — Tutorial Polish: Interactive Steps, Skip, Progress (wf-1772053086)

### Fixed
- **Movement/jumping highlights**: Removed broken highlight rects for movement and jumping steps that were pointing at touch control coordinates (bottom-left corner) instead of anything meaningful on desktop.

### Changed
- **Parachute step now interactive**: Players must jump and press P to deploy a parachute to advance. Previously was click-to-continue.
- **Ninja Rope step now interactive**: Players must aim and fire to attach the rope. Weapon auto-selects to Ninja Rope when step starts.
- **Teleport step now interactive**: Players must aim and fire to teleport. Weapon auto-selects to Teleport when step starts.
- **Step onEnter hooks**: Each interactive utility step resets weapon state and selects the appropriate weapon automatically.

### Added
- **Skip button**: "SKIP >" text button in the top-right corner of every tutorial step. Dismisses the tutorial immediately.
- **Progress indicator**: "Step X / 11" text shown below the tutorial box on every step.
- **Tutorial event notifications**: `notifyParachute()`, `notifyRopeAttached()`, `notifyTeleportUsed()` methods for GamePlay to signal tutorial completion conditions.

### Files Changed
- `src/client/game/systems/TutorialManager.ts` — Removed broken highlight helpers, made parachute/rope/teleport interactive with conditions and onEnter hooks, added skip button and progress text.
- `src/client/game/scenes/GamePlay.ts` — Added `notifyTutorialFire()` helper, parachute/rope/teleport notifications to tutorial.

---

## [v0.0.12.101] - 2026-02-25 — Touch Power Buttons + Tutorial Highlights (wf-1772050958)

### Added
- **Touch power buttons**: + and − buttons appear on the right side of the screen during aiming on touch devices, providing a mobile-friendly alternative to scroll wheel for power adjustment. Buttons use repeating intervals for continuous adjustment.
- **Tutorial visual highlights**: Interactive tutorial steps now show a pulsing cyan border around the relevant UI element (D-pad for movement, jump button for jumping, weapon grid for weapon switching, aim button for aiming, power bar for firing).
- **HUD bounds API**: `getWeaponGridBounds()` and `getPowerBarBounds()` methods on HUD for tutorial system to query element positions.

### Changed
- **Tutorial completion flow**: Tutorial no longer returns to the ModeSelect screen on completion. Instead, the tutorial overlay is dismissed and the game continues as a normal single-player match, letting the player keep practicing.

### Files Changed
- `src/client/game/ui/TouchControls.ts` — Added `onPowerUp`/`onPowerDown` callbacks, power button creation, `update()` method for state-based visibility.
- `src/client/game/systems/TutorialManager.ts` — Added highlight graphics, per-step `getHighlight` regions, HUD reference, pulse tween.
- `src/client/game/scenes/GamePlay.ts` — Pass power callbacks to TouchControls, pass HUD to TutorialManager, call `touchControls.update()`, change tutorial onComplete to continue game.
- `src/client/game/ui/HUD.ts` — Added `getWeaponGridBounds()` and `getPowerBarBounds()` methods.

---

## [v0.0.12.97] - 2026-02-25 — Tutorial Expansion + Power Hotkeys (wf-1772049179)

### Added
- **Parachute tutorial step**: New click-to-continue step explaining P key to deploy/close parachute while falling.
- **Ninja Rope tutorial step**: New click-to-continue step explaining rope weapon mechanics (fire to attach, ↑/↓ to adjust length, SPACE to detach).
- **Teleport tutorial step**: New click-to-continue step explaining teleport weapon (aim, adjust power, fire to warp).
- **Power hotkeys (R/T)**: R increases power, T decreases power while aiming — alternative to scroll wheel for users without a mouse.
- Tutorial now has 11 steps (was 8): welcome → movement → jumping → weapon-switch → aiming → fire → parachute → rope → teleport → turn-flow → complete.

### Files Changed
- `src/client/game/systems/TutorialManager.ts` — Added 3 new tutorial steps; updated fire step text to mention R/T.
- `src/client/game/scenes/GamePlay.ts` — Added R/T key bindings for power adjustment during aiming; added keyR/keyT as Phaser Key objects.
- `src/client/game/ui/HUD.ts` — Updated aiming instruction text to show "R/T or Scroll:Power".

---

## [v0.0.12.93] - 2026-02-25 — Tutorial Mode (wf-1772047639)

### Added
- **Tutorial mode**: New "TUTORIAL" button on the ModeSelect screen that launches a guided, interactive tutorial.
- **TutorialManager system**: 8-step guided walkthrough that teaches movement, jumping, weapon switching, aiming, firing, and turn flow.
- Steps use a mix of click-to-continue prompts (with dark backdrop) and condition-based progression (waits for the player to perform the action).
- Tutorial uses a simplified game setup: 1v1 against easy AI, infinite turn timer, hills map.
- Tutorial completion returns the player to the main menu.

### Files Added
- `src/client/game/systems/TutorialManager.ts` — Tutorial step management, overlay UI, and condition tracking.

### Files Changed
- `src/client/game/scenes/ModeSelect.ts` — Added TUTORIAL button (📖 icon).
- `src/client/game/scenes/GamePlay.ts` — Accepts `tutorial` flag, instantiates TutorialManager, hooks notifications for move/jump/weapon-switch/turn-advance, blocks input during modal steps.

---

## [v0.0.12.90] - 2026-02-25 — Explosion Performance Deep Fix (wf-1772046749)

### Fixed
- **Incremental terrain redraw**: Terrain redraws now only recompute pixels within the bounding box of recent craters (+ 4px margin) instead of the entire 1600×800 map. A persistent canvas is reused between redraws, with only the dirty region patched via `putImageData`. This reduces a typical crater redraw from ~1.28M pixels to ~10K pixels — a 100x reduction.
- **Reduced particle counts**: Explosion particles capped at 15 fire (was 20+radius/2), 6 smoke (was 8+radius/5), 4 debris (was 6+radius/8). Ring effect merged into the main Graphics object instead of using a separate one. Particle lifetime shortened for faster fadeout. Total particle objects per explosion reduced from ~90 to ~25.
- **Fewer Graphics objects**: Each explosion now uses 2 Graphics objects (particles + flash) instead of 3 (particles + flash + ring). The ring is drawn on the same Graphics as particles.

### Changed
- **Firecracker icon**: Reverted from 🎆 back to 🧨 (dynamite icon).

---

## [v0.0.12.86] - 2026-02-25 — Visuals, Sounds, Renames & Performance (wf-1772044227)

### Added
- **Custom hitscan visuals**: Banana Cannon fires a thick yellow tracer with a banana-splat impact effect. Blow Dart fires a thin green tracer with a puff impact.
- **Weapon-specific sounds**: Banana Cannon plays a squelchy pop on fire. Blow Dart plays a breathy whoosh.
- **HUD auto-collapse**: On narrow viewports (< 500px width), the HUD starts collapsed automatically.

### Changed
- **Dynamite → Firecracker**: Renamed to 🎆 Firecracker with sparkling visual.
- **Airstrike → Pigeon Strike**: Renamed to 🐦 Pigeon Strike — 5 pigeons dive-bomb from the sky.
- **Cluster Bomb → Confetti Bomb**: Renamed to 🎊 Confetti Bomb — splits into 4 colorful party poppers.
- **Pigeon/Confetti projectile visuals**: Pigeon Strike missiles render as small grey birds with orange beaks. Confetti Bomb renders as a pink/yellow/cyan ball that splits into multi-colored particles.

### Fixed
- **Explosion performance**: Terrain redraws are now deferred via `requestAnimationFrame` batching. Multiple explosions (e.g., Pigeon Strike's 5 missiles, Confetti Bomb's 4 bomblets) now only trigger a single terrain redraw per frame instead of one per explosion, eliminating the frame drops.

---

## [2026-02-25] Left-Side Vertical HUD (v0.0.15.5)

**Workflow:** wf-1771992356

Moved the entire HUD from the bottom of the screen to a vertical panel pinned to the left edge. Weapon slots are now in a 3×3 grid instead of a horizontal row. Power bar, wind indicator, turn state, and timer are stacked vertically below the weapon grid. The toggle collapses/expands horizontally. Touch controls repositioned lower since the bottom viewport is now free. This frees up valuable bottom screen real estate for gameplay visibility.

---

## [2026-02-25] Air Control — Jump + Move (v0.0.15.1)

**Workflow:** wf-1771991806

Added air control so players can steer worms mid-jump using left/right arrows. Air movement is slightly slower than ground movement (1.5 vs 2 px/frame) with gradual acceleration and a speed cap. Works with both keyboard and touch controls.

---

## [2026-02-25] Sniper Drift Intensity Increase (v0.0.12.61)

**Workflow:** wf-1771990408

Doubled sniper wind multiplier (5 -> 10) and more than doubled spread max (0.8 -> 1.8). The sniper is now significantly less accurate past 150px, making long-range shots unreliable.

---

## [2026-02-25] Sniper Range Reduction (v0.0.12.58)

**Workflow:** wf-1771989548

Sniper range reduced from 750px to 350px, drift start from 200px to 150px. AI scoring tightened (bonus 100-250px, penalty beyond 300px). Unit tests adjusted for shorter range.

---

## [2026-02-25] Sniper Range Increase (v0.0.12.52)

**Workflow:** wf-1771988923

Sniper range increased from 500px to 750px, drift start from 150px to 200px. AI scoring widened (bonus 150-500px, penalty beyond 600px). All fallback defaults updated to match.

---

## [2026-02-25] Shotgun Range Bump (v0.0.12.48)

**Workflow:** wf-1771986960

Shotgun range increased from 100px to 175px (driftStart 40 -> 70px). AI scoring thresholds widened to match. 100px was too restrictive for practical use.

---

## [2026-02-25] Hitscan Range Nerf v3 (v0.0.12.44)

**Workflow:** wf-1771985540

### Changed — Drastically reduced hitscan ranges

| Weapon | Range before | Range after |
|--------|-------------|-------------|
| Sniper Rifle | 1200px | 500px |
| Shotgun | 600px | 100px |

Sniper drift starts at 150px (was 300px). Shotgun drift starts at 40px (was 150px). AI scoring adjusted proportionally. Shared `castHitscanRay` default reduced to 500px. Unit test for downward ray updated for new range.

---

## [2026-02-25] Hitscan Weapon Balance Pass v2 — Per-weapon tuning (v0.0.12.40)

**Workflow:** wf-1771984417

### Changed — Per-weapon hitscan parameters

The sniper was still too effective at long range, and the shotgun shared the same hitscan profile (1500px range), making it effective at distances inappropriate for a close-range weapon.

Added optional `hitscanRange`, `hitscanDriftStart`, `hitscanWindMul`, and `hitscanSpreadMax` fields to `WeaponDef`, allowing each hitscan weapon to define its own accuracy falloff curve.

### Sniper Rifle — Further nerfed

| Property | Before (v0.0.12.36) | After |
|----------|---------------------|-------|
| Max range | 1500px | 1200px |
| Drift start | 400px | 300px |
| Wind multiplier | 3× | 5× |
| Spread max | 0.4 | 0.8 |
| AI score bonus | +10 for 200-800px | +10 for 200-600px |
| AI score penalty | -15 beyond 1000px | -20 beyond 800px |

### Shotgun — Range falloff added

| Property | Before | After |
|----------|--------|-------|
| Max range | 1500px (same as sniper) | 600px |
| Drift start | 400px | 150px |
| Wind multiplier | 3× | 2× |
| Spread max | 0.4 | 1.2 |
| AI close-range bonus | None | +25 within 200px |
| AI long-range penalty | None | -30 beyond 400px |
| Description | "Two quick hitscan shots" | "Two close-range hitscan blasts — devastating up close, scatters at distance" |

### Files Changed
- `src/shared/types/weapons.ts` — Added `hitscanRange/DriftStart/WindMul/SpreadMax` to `WeaponDef`; set per-weapon values
- `src/client/game/systems/ProjectileManager.ts` — `fireHitscan()` reads weapon params instead of hardcoded values
- `src/client/game/systems/AIController.ts` — `simulateHitscan()` accepts weapon param; shotgun/sniper scoring adjusted
- `src/client/game/ui/AimIndicator.ts` — `drawHitscanAim()` accepts weapon for per-weapon range/drift visualization
- `src/client/game/systems/WeaponSystem.ts` — Passes weapon to `drawHitscanAim()`

---

## [2026-02-25] Sniper Rifle Balance Pass (v0.0.12.36)

**Workflow:** wf-1771982147

### Changed — Sniper Rifle nerfed for better balance

The Sniper Rifle was overpowered: perfectly accurate at any range, unaffected by wind, with 60 damage. This made it a dominant weapon with no counterplay at distance.

### Balance Changes

| Property | Before | After |
|----------|--------|-------|
| Damage | 60 | 50 |
| Max range | 3000px (full map diagonal) | 1500px |
| Wind influence | None | Drift scales from 0 at 400px to full at 1500px |
| Accuracy | Perfect at all ranges | Spread noise grows past 400px (~20px max deviation) |
| AI long-range bonus | +10 score for shots > 200px | +10 for 200-800px, -15 penalty for > 1000px |

### Design Intent

- **Close range (< 400px)**: Unchanged — perfectly accurate, rewarding positioning
- **Mid range (400-800px)**: Slight wind drift and spread begin; still effective with good aim
- **Long range (800-1500px)**: Significant accuracy degradation; hitting a 20px worm target becomes unreliable
- **Beyond 1500px**: Out of range entirely

### Files Changed
- `src/shared/types/weapons.ts` — Damage 60→50, updated description
- `src/client/game/systems/ProjectileManager.ts` — Range 3000→1500, wind drift and spread noise in `fireHitscan()`
- `src/shared/hitscan.ts` — Range 3000→1500 in `castHitscanRay()`
- `src/client/game/systems/AIController.ts` — Range 3000→1500, wind drift in `simulateHitscan()`, scoring adjusted
- `src/client/game/ui/AimIndicator.ts` — Range 3000→1500, dots fade past 400px in `drawHitscanAim()`

---

## [2026-02-24] HUD Viewport Pinning Fix v3 — Dedicated UI Camera (v0.0.12.29)

**Workflow:** wf-1771976780

### Fixed — UI elements drifting when zooming

The previous two attempts at zoom-independent UI used manual `setScale(1/zoom)` and `setPosition(desiredPos / zoom)` math. This approach is fundamentally broken because Phaser's camera rendering matrix includes an **origin offset** (`viewport center * (1 - zoom)`), causing UI to drift proportionally to how far zoom deviates from 1.

### Solution — Dedicated UI Camera (Standard Phaser 3 Pattern)

Replaced all manual zoom compensation with a second camera that permanently stays at zoom=1 and scroll=(0,0):

- **Main camera**: Renders world objects (terrain, worms, projectiles, explosions). Ignores all UI containers.
- **UI camera**: Renders UI containers (HUD, TeamPanel, Minimap, TouchControls, game-over overlay) at exact pixel positions with no transforms.
- Dynamic game objects (projectiles, explosions, etc.) are auto-ignored on the UI camera via the `addedtoscene` event.
- Game-over overlay is pre-created (hidden) in `create()` and registered as a UI object, avoiding dynamic registration issues.

### Files Changed
- `src/client/game/scenes/GamePlay.ts` — Added `setupUICamera()`, pre-created game-over overlay, removed `repositionUI()`
- `src/client/game/ui/HUD.ts` — Removed `reposition()`, `screenBarY()`, all `1/zoom` math; added `getContainers()`
- `src/client/game/ui/TeamPanel.ts` — Removed `reposition()`; added `getContainer()`
- `src/client/game/ui/Minimap.ts` — Removed `reposition()`; added `getContainer()`
- `src/client/game/ui/TouchControls.ts` — Removed `reposition()`; added `getContainer()`

---

## HUD Viewport Pinning Fix v2 (v0.0.12.28)

### Fixed — HUD flying across screen when zooming
- **Root cause**: Previous `reposition()` used `cam.width * (1/zoom)` to compute positions, which incorrectly scales the screen dimension instead of the desired screen position. Phaser applies camera zoom to objects with `setScrollFactor(0)` during rendering, so the correct formula is `desiredScreenPos / zoom` (not `screenDimension / zoom`).
- **HUD.ts**: `reposition()` now uses `panelX / zoom` and `screenBarY / zoom` for position, `1/zoom` for scale. Input hit-testing uses raw screen-space `pointer.x - panelX` (no zoom correction needed since pointer coords are screen-space). Tooltip is now a persistent container (created once, reused) instead of being destroyed/recreated on each hover.
- **TeamPanel.ts / Minimap.ts / TouchControls.ts**: `reposition()` uses `desiredScreenPos / zoom` pattern.
- **HUD.ts toggle()**: Animation target Y computed as `screenTargetY / cam.zoom`.

## Rope Polish, AI Rope Usage & HUD Viewport Fix (v0.0.12.24)

### Fixed — HUD Viewport Pinning (superseded by v0.0.12.28)
- Initial attempt at counter-scaling UI with zoom. Used incorrect position math causing UI to fly across screen.

### Improved — Ninja Rope Visual Feedback
- **Worm.ts `drawRope()`**: Replaced straight-line rope with a quadratic bezier catenary curve that sags when slack and straightens under tension. Rope color shifts from dark brown (relaxed) to bright gold (high tension). Rope thickness varies inversely with angular velocity. Glow effect added at high tension.
- **Worm.ts `drawSwingArc()`**: Faint dotted arc drawn along the pendulum path showing where the worm will travel during its swing. Current position marker dot on the arc.
- **Worm.ts `drawMomentumArrow()`**: Direction arrow shows the velocity vector the worm would inherit on detach. Color-coded green (safe landing) to red (dangerous fall) based on estimated fall height.
- **Anchor point**: Improved visual with dark/light concentric circles.

### Added — AI Rope Repositioning
- **AIController.ts**: AI on medium and hard difficulty can now use the ninja rope to reposition when movement is blocked (walls on both sides too high to climb) or when the closest enemy is on significantly higher ground.
- `shouldUseRope()` evaluates terrain blockage, height disadvantage, and shot quality. Easy AI never uses rope.
- `findRopeAngle()` simulates rope projectile trajectories at 12 angles, scoring for terrain anchor above the worm in the direction of the enemy.
- `executeRopeReposition()` selects ninja-rope, aims, fires, waits for attachment, swings for 2 seconds, then detaches.
- Random rope usage chance: 15% on hard, 8% on medium (only when current shot quality is poor).

---

## AI Parachute, Ninja Rope, Sounds & Knockback Tuning (v0.0.12.18)

### Added — Ninja Rope Utility Weapon
- **weapons.ts**: New weapon type `'ninja-rope'` with `firingMode: 'rope'`, weapon #9 in the order. Icon: 🪝
- **ProjectileManager.ts**: `fireRope()` method fires a grappling hook that travels toward terrain. On hit, the hook anchors and the worm swings on a pendulum.
- **Worm.ts**: `attachRope()` / `detachRope()` / `adjustRopeLength()` methods for rope physics. Pendulum simulation with gravity and angular damping. On detach, the worm inherits the tangential swing velocity for momentum-based traversal.
- **WeaponSystem.ts**: Added `'rope'` case in `fire()` method.
- **AimIndicator.ts**: `drawRopeAim()` method shows a rope-colored dotted line with anchor point preview.
- **GamePlay.ts**: Rope controls — click/space to detach, up/down arrows to adjust rope length, 5-second auto-detach timeout.
- AI does not use ninja rope (skipped like teleport).

### Added — Parachute Sound Effects
- **SoundManager.ts**: Two new sounds:
  - `'parachute-open'`: Breathy bandpass-filtered noise whoosh (0.35s)
  - `'parachute-land'`: Soft low-frequency sine thud (0.15s)
- **Worm.ts**: `openParachute()` plays the whoosh, `onLand()` plays the thud when landing with parachute.

### Added — Rope Sound Effects
- **SoundManager.ts**: Three new sounds:
  - `'rope-fire'`: Rising sawtooth tone (0.1s)
  - `'rope-attach'`: Quick triangle ping (0.08s)
  - `'rope-release'`: Descending sine tone (0.12s)

### Added — AI Parachute Awareness
- **GamePlay.ts**: During `settleWorms()`, AI-team worms that are falling dangerously (approaching fall damage threshold) automatically deploy their parachute.
- **Worm.ts**: `isFallingDangerously()` method returns true when fall distance exceeds 70% of the damage threshold.

### Changed — Knockback Tuning
- **ExplosionEffect.ts**: Knockback force increased from `falloff * 6` to `falloff * 8` (33% stronger). Upward bias increased from `-3` to `-4`. Explosions now launch worms further, making positioning and parachute use more critical.

### Files Changed
- `src/shared/types/weapons.ts` — Added ninja-rope weapon type
- `src/client/game/systems/SoundManager.ts` — 5 new procedural sounds
- `src/client/game/entities/Worm.ts` — Rope state, dangerous fall check, sound integration
- `src/client/game/systems/ProjectileManager.ts` — Rope firing and physics
- `src/client/game/systems/WeaponSystem.ts` — Rope firing mode
- `src/client/game/systems/ExplosionEffect.ts` — Knockback constants
- `src/client/game/systems/AIController.ts` — Skip rope weapon
- `src/client/game/scenes/GamePlay.ts` — AI parachute, rope controls, rope timeout
- `src/client/game/ui/AimIndicator.ts` — Rope aim display
- `src/client/game/ui/HUD.ts` — Updated instruction text

## Parachute, Reduced Fall Damage & Initial-Aiming Fix (v0.0.12.11)

### Added — Parachute Utility
- **Worm.ts**: Added `openParachute()` / `closeParachute()` methods with `parachuteOpen` getter. When open mid-fall, fall velocity caps at 1.0 (vs normal gravity of 4), horizontal velocity is dampened by 0.9 drag per frame, and fall damage is completely negated on landing. Parachute auto-closes when the worm touches ground.
- **Visual**: White/red canopy drawn above the worm with 4 string lines when parachute is active.
- **Keyboard**: `P` key toggles the parachute (works in idle and aiming states, only activatable while airborne).
- **Touch**: 🪂 button added above the jump button on the mobile D-pad.
- **HUD**: Idle instruction text updated to include "P:Parachute".

### Changed — Fall Damage Reduced
- `FALL_DAMAGE_THRESHOLD`: 40 → 60 pixels (worms can fall further before taking damage)
- `FALL_DAMAGE_PER_PIXEL`: 0.8 → 0.5 (less damage per pixel of excess fall)
- Example: A 100px fall now deals 20 damage (was 48). A 200px fall deals 70 (was 128).

### Fixed — Initial-Aiming Bug
- **Problem**: When the game first started, the very first click on the canvas would immediately put the player into aiming mode instead of movement mode.
- **Root cause**: The `pointerup` handler treated any non-drag click as an "aim" command, including the initial canvas focus click.
- **Fix**: Added `turnStartClickConsumed` flag that consumes the first click of each turn, preventing accidental aiming on game start or turn change.

### Files Changed
- `src/client/game/entities/Worm.ts` — Parachute physics, visuals, fall damage constants
- `src/client/game/scenes/GamePlay.ts` — P key binding, first-click fix, touch callback
- `src/client/game/ui/TouchControls.ts` — Parachute button, updated callback interface
- `src/client/game/ui/HUD.ts` — Updated instruction text

## AI Hitscan Accuracy + Unit Tests (v0.0.12.2)

### Improved — AI Hitscan Simulation
- **`simulateHitscan()`** now accepts worm positions and a shooter reference, matching `ProjectileManager.fireHitscan()` logic. The AI can now detect when a hitscan ray would directly hit a worm vs hitting terrain, and correctly excludes the shooter from collision checks.
- **Scoring accuracy**: The `directHit` flag from the simulation is used in shot scoring, replacing the previous distance-based approximation (`hitDist < 15`). The AI now also detects when a friendly or other worm blocks the line of sight.

### Added — Hitscan Unit Tests (14 tests)
- **Shared `castHitscanRay()` function** extracted into `src/shared/hitscan.ts` — pure function testable without Phaser dependencies.
- **Test suite** (`src/shared/hitscan.test.ts`) covering: shooter exclusion (3 tests), direct worm hits (4 tests), terrain collision (2 tests), boundary conditions (3 tests), hitbox geometry (2 tests).
- **Vitest config** and `test` script added to `package.json`.

### Files Changed
- `src/client/game/systems/AIController.ts` — Updated `simulateHitscan()` signature and hitscan scoring
- `src/shared/hitscan.ts` — New shared pure function for hitscan raycasting
- `src/shared/hitscan.test.ts` — 14 unit tests
- `vitest.config.ts` — Vitest configuration
- `package.json` — Added `test` script

## Hitscan Self-Damage Fix (v0.0.12.1)

### Fixed — Sniper Rifle & Shotgun No Longer Damage the Shooter
- **Root cause**: `ProjectileManager.fireHitscan()` checked all worms (including the shooter) against the hitscan ray. Since the ray starts at the worm's center and the worm's hitbox is 20x24px, the first ray step was always inside the shooter's own hitbox, causing an immediate self-hit.
- **Fix**: Added an optional `shooter` parameter to `fireHitscan()` that skips the shooter in the worm collision loop. `WeaponSystem.fire()` now passes the firing worm as the shooter for all hitscan weapons.
- **Affected weapons**: Sniper Rifle (1 shot) and Shotgun (2 shots) — both use the `hitscan` firing mode.
- **No gameplay side effects**: Splash damage from terrain-hit explosions still works normally. Only direct-hit self-damage is prevented.

### Files Changed
- `src/client/game/systems/ProjectileManager.ts` — Added `shooter?: Worm` parameter, skip `worm === shooter` in ray loop
- `src/client/game/systems/WeaponSystem.ts` — Pass firing worm to `fireHitscan()` calls

## AI Movement Fix (v0.0.9.188)

### Fixed — AI Bots Now Actively Move During Turns
- **Proactive movement**: AI bots now move before shooting on ~25-55% of turns (depending on difficulty), instead of only when no shot was possible
- **All difficulties can move**: Easy AI can now move (previously locked to standing still). Easy moves 30 steps, Medium 50 steps, Hard 40 steps per turn
- **Tactical positioning**: AI evaluates distance to enemies, retreat opportunities, and flanking angles when deciding movement direction
- **Adaptive distance**: Movement distance scales with enemy proximity — bots walk farther when enemies are distant, shorter when close
- **Jump during movement**: AI occasionally jumps during walks to traverse obstacles and add unpredictability (15% chance, plus terrain-aware obstacle detection)
- **Movement before shooting**: AI walks, then re-evaluates the best shot from its new position, rather than shooting from a static stance

### Difficulty-Specific Movement Behavior
| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Move chance | 25% | 45% | 55% |
| Max steps | 30 | 50 | 40 |
| Approach threshold | 500px | 400px | 350px |

## Hitscan Weapon Fix (v0.0.9.183)

### Fixed — Shotgun & Sniper Long-Range Effectiveness
- **Extended hitscan range** from 800px to 3000px (full map diagonal). Both weapons can now reach anywhere on the 2400x1200 world.
- **Added direct worm hit detection** to hitscan raycast. The ray now checks each step against all alive worms (16x22 bounding box), registering a direct hit with full weapon damage. Previously, the ray only checked terrain collision and relied on tiny blast radius to damage nearby worms.
- **Increased shotgun blast radius** from 15px to 20px for slightly more forgiving terrain hits.
- **Extended aim indicator** from 600px to 3000px with dotted laser-sight markers every 80px for visibility at long range.

### Fixed — AI Hitscan Behavior
- AI `simulateHitscan()` range extended from 800px to 3000px to match
- AI hitscan scoring improved: direct worm hits scored higher (base 90 + 20 bonus vs 70 for near-miss)

### Technical Details
- Direct hit: full weapon damage applied via `worm.takeDamage()`, small visual explosion spawned with 0 splash damage
- Terrain hit: explosion at impact point with normal splash damage (unchanged behavior)
- Worm hitbox for hitscan: ±10px horizontal, -2 to +22px vertical from worm.x/worm.y
- Ray step size reduced from 3px to 2px for more accurate hit detection

## Map Backgrounds (v0.0.9.179)

### Added — Procedural Background Decorations
- **New system**: `BackgroundRenderer` draws thematic visual elements behind terrain for every map
- **Green Hills**: Sun disc, 3-layer distant rolling hill silhouettes, fluffy cumulus clouds, flying birds
- **Island Chain**: Tropical sun with radial rays, distant island/palm tree silhouettes, puffy clouds, sea birds
- **Underground Cavern**: Glowing crystal clusters in 4 colors (cyan, purple, green, pink), ambient light halos, stalactite drip effects
- **Flat Arena**: Sun, double tree line silhouettes, scattered clouds, birds
- **Cliffside**: Distant snow-capped mountain range, horizontal mist layers, wispy elongated clouds, eagles
- **Desert Dunes**: Large blazing sun with glow rings, flat-topped mesa silhouettes, heat shimmer wave lines, cactus silhouettes, circling vultures
- **Frozen Tundra**: 5-band aurora borealis in green/teal/purple, frozen peak silhouettes with snow highlights, scattered snowflake particles
- **Volcanic Ridge**: Lava glow on the horizon, dark volcanic peak silhouettes, rising smoke columns, ember particles, dim stars visible through haze

### Technical Details
- Uses seeded RNG from the terrain seed for deterministic backgrounds across multiplayer clients
- Decorations rendered at depth -5 (foreground elements) and -8 (distant elements), between sky (-10) and terrain (0)
- All graphics drawn with Phaser Graphics API — no external image assets required
- Common helper methods for clouds, mountains, sun discs, stars, birds, and tree lines

## New Weapons & Movement (v0.0.9.178)

### Added — 3 New Weapons
- **Cluster Bomb** (slot 6): Projectile weapon that splits into 4 bomblets on detonation. Main hit does 20 damage (20px radius), each bomblet does 18 damage (18px radius). Affected by wind, bounces once, 2s fuse.
- **Sniper Rifle** (slot 7): Single hitscan shot dealing 60 damage with a tiny 8px crater. High precision, not affected by wind.
- **Teleport** (slot 8): Utility weapon that instantly teleports the worm to the aimed location. No damage, no crater. Resolves immediately. Visual flash effects at origin and destination.

### Added — Movement Ability
- **Backflip** (B key): Higher vertical jump (-8 vy) that moves the worm backward. Already existed in code but now has a dedicated keybind.

### Changed — Weapon System
- `WeaponType` extended with `'cluster-bomb' | 'sniper' | 'teleport'`
- `FiringMode` extended with `'teleport'` mode
- `WeaponDef` extended with optional `cluster`, `clusterCount`, `clusterDamage`, `clusterRadius` fields
- `WEAPON_ORDER` expanded to 8 weapons (was 5)
- Number keys 1-8 now select weapons (was 1-5)
- HUD weapon slots reduced from 48px to 40px to fit all 8

### Changed — AI
- AI skips teleport weapon (utility, no offensive value)
- Cluster bomb added to Easy AI weapon pool
- Scoring bonuses: cluster bomb preferred at close range, sniper preferred at long range

### Changed — Multiplayer
- `JumpAction` extended with optional `backflip` flag for multiplayer sync
- Backflip actions are broadcast and replayed correctly on remote clients

### Changed — UI
- HUD instruction text now shows "B:Backflip" alongside "W:Jump"
- Teleport aim indicator shows dashed line with cyan crosshair at landing point
- Cluster bomb projectile rendered as orange sphere; sub-bomblets as smaller orange dots

## Cavern Map Overhaul (v0.0.9.175)

### Fixed — Cavern Playability
- Removed `ridged` terrain from cavern preset — floor is now smooth and walkable
- Reduced floor height range (`minHeight: 0.15, maxHeight: 0.4`) to keep floor in lower portion of world
- Added `flatness: 0.3` for gentler floor terrain
- Reduced octaves from 6 to 4 for smoother terrain curves

### Improved — Ceiling Generation
- Ceiling now occupies 25-45% of world height (was 5-25%) for a proper underground feel
- Added stalactite features — occasional downward spikes from the ceiling
- Floor-ceiling gap enforcement — minimum 20% of world height guaranteed between ceiling bottom and floor top
- Ceiling map now receives the floor heightmap to dynamically avoid overlaps

### Improved — Cave Visuals
- Ceiling rendered with distinct darker blue-shifted tones, separate from floor coloring
- Darker cave background (`skyTop/skyMid/skyLow` all near-black) for underground atmosphere
- Grass tufts disabled for cavern maps (stone caves shouldn't have grass)
- Warmer floor stone colors for better visual contrast with dark ceiling

### Previous — Cavern Spawn Fix (v0.0.9.172)
- `getSurfaceY()` updated to skip ceiling solid region and find the floor surface
- Works correctly for both cavern and non-cavern maps

## Level Design Overhaul (v0.0.9.169)

### Added — 3 New Maps
- **Desert Dunes**: Sun-scorched sand with mesa-like plateaus, warm orange sky gradient
- **Frozen Tundra**: Icy ridged peaks with frozen lakes (water), grey stormy sky
- **Volcanic Ridge**: Charred ridged rock over rivers of molten lava (orange water), dark red sky

### Added — Water Plane Rendering
- Maps with `waterLevel` now render a semi-transparent water plane at the bottom of the world
- Water color and opacity configurable per map preset
- Island Chain: blue ocean water at 55% opacity
- Frozen Tundra: icy blue-grey water at 45% opacity
- Volcanic Ridge: glowing orange lava at 80% opacity
- Surface highlight line at the top of the water for depth cue

### Added — Terrain Visual Improvements
- **Texture noise**: Hash-based noise variation applied to all terrain pixels for organic appearance
- **Grass tufts**: Small pixel clusters rendered above the terrain surface at regular intervals
- **Edge highlighting**: Terrain edge pixels receive a brightness boost for definition
- **Sub-surface color variation**: Rock/deep terrain has noise-based shading instead of flat color

### Added — Terrain Shape Features
- `ridged` terrain style: Creates sharp ridge lines by folding sine waves (used by Cavern, Tundra, Volcano)
- `plateaus` terrain style: Quantizes height to discrete levels for mesa/plateau shapes (used by Desert)
- `terraced` terrain style: Creates step-like cliff faces with configurable step count (used by Cliffside)
- Improved island beach transitions with smoother fade at water edges

### Changed — Existing Map Updates
- **Island Chain**: Now has visible ocean water plane, updated description
- **Underground Cavern**: Uses ridged terrain for more dramatic stalactites, updated description
- **Cliffside**: Uses terraced terrain (6 steps) for distinct cliff faces
- All map descriptions refreshed for flavor

## AI Difficulty Rebalance (v0.0.9.166)

### Changed — Medium AI Nerfed
- Removed the tight refinement pass (was 5×5) and replaced with a wider 3×3 grid
- Increased base jitter from ±0.04 rad / ±5 power to ±0.08 rad / ±8 power
- Increased pick pool from top 3 to top 5 candidates
- Added 25% miss chance that applies extra ±0.15 rad / ±12 power offset

### Changed — Easy AI Nerfed
- Reduced coarse grid from 14×6 to 10×5 for fewer accurate candidates
- Increased jitter from ±0.12 rad / ±12 power to ±0.20 rad / ±18 power
- Added 30% miss chance with extra ±0.25 rad / ±20 power offset
- Removed shotgun from weapon pool (now only Bazooka and Grenade)
- Increased pick pool from top 8 to top 10

### Added — Miss Chance System
- New `missChance`, `missExtraAngle`, `missExtraPower` fields in `DifficultyConfig`
- When triggered, adds a large random offset on top of normal jitter
- Easy: 30% chance, Medium: 25% chance, Hard: 0% (unchanged)

## AI Accuracy Tuning + Difficulty Levels (v0.0.9.160)

### Added — AI Difficulty Levels
- New "AI LEVEL" selector in Game Setup (Easy / Medium / Hard)
- Selector only visible when VS CPU is enabled
- Each difficulty uses distinct parameters for search grid resolution, refinement, jitter, and weapon pool
- Easy: coarse aim, high jitter, limited weapons (bazooka/grenade/shotgun), no movement
- Medium: balanced search grid with refinement pass, moderate jitter, all weapons, movement enabled
- Hard: high-resolution search grid with fine refinement, near-zero jitter, always picks the best shot

### Changed — Two-Pass Accuracy System
- Projectile weapon targeting now uses a two-pass search (Medium and Hard only):
  1. **Coarse pass**: sweeps many angles and power levels to find promising candidates
  2. **Refinement pass**: fine-grained search around the best coarse hit for near-pixel-perfect accuracy
- Coarse grid increased from 12-16 angle steps to 14-36 (depending on difficulty)
- Power grid increased from 6 steps to 6-14 (depending on difficulty)
- Direct hit bonus: shots landing within 5px of target center receive +15 score
- Estimated damage scoring: shots within blast radius get bonus based on projected damage fraction

### Changed — Difficulty-Aware Jitter
- Easy: ±0.12 rad angle jitter, ±12 power jitter, random pick from top 8 candidates
- Medium: ±0.04 rad angle jitter, ±5 power jitter, random pick from top 3
- Hard: ±0.01 rad angle jitter, ±1 power jitter, always picks the absolute best shot

### Changed — GameConfig
- Added `aiDifficulty` field to `GameConfig` interface
- Difficulty passed through GameSetup → CharacterSelect → GamePlay → AIController

## Smart AI Overhaul (v0.0.9.158)

### Changed — AI Controller
- Complete rewrite of `AIController` with simulation-based targeting
- AI now simulates actual projectile physics (speed, gravity, wind, bounces, fuse timers) to find shots that will hit enemies
- Trajectory simulation uses the real weapon parameters from `WeaponDef` instead of hardcoded approximations
- Wind compensation: AI accounts for current wind force when calculating projectile trajectories
- Terrain collision checking: simulated shots are rejected if they hit terrain before reaching the target
- Self-damage prevention: shots that would land within the AI's own blast radius are heavily penalized
- Friendly fire avoidance: shots near allied fighters are penalized in the scoring system

### Changed — Weapon Selection
- AI now uses all 5 weapons strategically based on situation:
  - **Bazooka**: Default ranged projectile for medium-to-long range
  - **Grenade**: Close-range with bounce simulation for hitting behind cover
  - **Shotgun**: Hitscan for close-range with simulated line-of-sight verification
  - **Dynamite**: Placed weapon when adjacent to enemies
  - **Airstrike**: Targeted weapon for enemies behind terrain or at long range
- Weapon scoring considers kill potential (bonus if target health <= weapon damage)

### Added — AI Movement
- AI walks toward the nearest enemy before firing when no good shot is found from current position
- Movement uses 15 steps at 30ms intervals for natural-looking movement

### Changed — Shot Selection
- AI evaluates many candidate angle/power combinations per weapon per enemy
- Candidates scored by: proximity to target, self-damage risk, friendly fire risk, kill potential
- Top 5 candidates kept; one chosen randomly for slight unpredictability
- Minimal jitter (±0.03 radians, ±4 power) added for human-like imperfection

### Technical — Context Injection
- `AIController.setContext(terrain, wind)` called after terrain and wind initialization in `GamePlay.create()`
- AI has direct access to `TerrainEngine.isSolid()` and `WindSystem.getWindForce()` for accurate simulation

## Splash Screen Redesign (v0.0.9.152)

### Changed — Splash Screen
- Complete visual overhaul to match in-game dark theme (`#1a1a2e` → `#0f3460` gradient)
- Added Rambo Snoo pixel-art mascot with bobbing animation and drop-shadow glow
- PLAY button restyled to match game's `#e94560` red action button
- Subtitle now uses cyan monospace (`#00e5ff`) matching in-game accent color
- Added subtle grid overlay with radial fade for tactical atmosphere
- Added floating glow orbs (red + cyan) for ambient motion
- Removed old sky-blue/green gradient, terrain silhouette, and weapon emoji icons
- CSS classes renamed from old `.worm-icon`/`wormBounce` to `.mascot-container`/`mascotBob`

### Added — Assets
- `public/rambo_snoo.png` — Rambo Snoo pixel-art mascot image

## Rebrand to Reddit Royale (v0.0.9.146)

### Changed — Branding
- Game title renamed from "Worms" to "Reddit Royale" across all UI surfaces
- Splash screen: crown icon (👑), "REDDIT ROYALE" title, "Battle Royale on Reddit" subtitle
- ModeSelect, GameSetup, Preloader scenes: updated title to "👑 REDDIT ROYALE"
- "WORMS PER TEAM" label renamed to "FIGHTERS PER TEAM"
- Footer text "X worms •..." changed to "X fighters •..."
- Team preview worm emojis (🪱) replaced with sword emojis (⚔)
- Lobby "WORMS" selector renamed to "FIGHTERS"
- Post title changed from "Worms - Artillery Warfare" to "Reddit Royale"
- Menu item label changed from "New Worms Game" to "New Reddit Royale Game"
- CSS classes renamed: `.worm-icon` → `.game-icon`, `wormBounce` → `iconBounce`
- HTML page titles updated to "Reddit Royale"
- Internal code identifiers (variables, Redis keys, app name, directory) unchanged

## Multiplayer Turn Sync + Full Game Completion (v0.0.9.138)

### Fixed — Turn Auto-Advance
- Turns now auto-advance 2.5 seconds after a shot resolves in online mode
- Previously required manual ENTER press to advance, causing stalled games
- Active player sends `end-turn` message; both clients advance via `turn-advance` broadcast

### Fixed — Wind Synchronization
- Wind values are now deterministic between clients
- Host generates wind in `requestNextTurn()` and broadcasts via `turn-advance`
- Removed local `windSystem.randomize()` in online mode
- Previously each client generated its own wind, causing gameplay desync

### Fixed — Double Turn-Advance Bug
- In online mode, `requestNextTurn()` no longer calls `advanceTurn()` locally
- Both clients (local and remote) now advance exclusively via the `turn-advance` broadcast
- Prevents the active player from advancing twice (once locally, once from broadcast)

### Added — Remote Turn HUD Indicator
- HUD now shows "⏳ Opponent's Turn" with "Watching opponent play..." during remote turns
- Shows "💥 Opponent Firing..." during remote fire actions
- Team labels support 4 teams (🔴, 🔵, 🟡, 🟣)

### Fixed — Game Over Cleanup
- ENTER on game-over screen now properly disconnects the MultiplayerManager before returning to ModeSelect
- Added clickable "[ ENTER — New Game ]" text for mouse/touch users
- Clean disconnect logged: `[MP] Disconnected from channel`

### Verified — Full Multiplayer Game (Two Accounts, Start to Game Over)
- Played complete game: suitegeek vs BarryBetsALot through 10+ turn cycles to game-over
- Turn sync: Each player's actions (move, aim, fire) replicated correctly on the other client
- Damage sync: Health bars matched on both clients throughout (200→178→125→100→0)
- Terrain sync: Craters from explosions visible on both clients
- Wind sync: All wind values matched between clients
- Game over: Both clients showed "GAME OVER" + "BarryBetsALot Wins!" simultaneously
- Return to menu: Both clients returned to ModeSelect cleanly with MP disconnect
- Zero console errors on both clients

---

## Two-Player Multiplayer E2E Test (v0.0.9.135)

### Verified — Full Multiplayer Flow (Two Accounts)
- Tested with player_one (suitegeek) and player_two (BarryBetsALot) simultaneously
- Player reconnection: suitegeek auto-reconnected to existing lobby J9FPSQ on page load
- Lobby join by code: BarryBetsALot navigated Online Play → typed J9FPSQ → joined lobby
- Realtime sync: Both players see each other in lobby, names and characters display correctly
- Ready system: BarryBetsALot clicked READY, status synced to host's view in real-time
- Game start: Host clicked START GAME, both clients transitioned to GamePlay simultaneously
- Game state sync: Both players see identical terrain, worms, health bars, and UI
- Zero console errors on both clients

## Lobby TTL + Player Reconnection (v0.0.9.135)

### Added — Lobby TTL (Auto-Cleanup)
- All lobby Redis keys (`_state`, `_players`, `_config`) expire after 2 hours
- TTL refreshed on player join, status changes, and game start
- Stale/expired lobbies filtered from listings automatically
- Post lobby list cleaned up when listing detects missing entries

### Added — Player Reconnection
- New `GET /api/reconnect` endpoint checks if the user is in an active lobby
- Preloader calls `/api/reconnect` before routing: if lobby found, skips ModeSelect
- Reconnects to lobby (status=waiting) or gameplay (status=playing with stored config)
- Game config saved to Redis on game start for reconnecting players

### Added — Game Config Persistence
- `POST /api/game/start` now saves the `MultiplayerGameConfig` to Redis
- `GET /api/reconnect` returns stored config so reconnecting players can rejoin mid-game

### Technical — New Redis Keys
- `worms_lobby_{code}_config` — stored game config for reconnection (2h TTL)

## Mode Selection + Lobby System (v0.0.9.132)

### Added — Mode Selection Scene
- New `ModeSelect` scene with three mode buttons: Single Player, Local Multiplayer, Online Play
- Single Player auto-enables VS CPU in GameSetup
- Local Multiplayer goes to GameSetup with VS CPU off
- Online Play routes to new LobbyBrowser scene

### Added — Lobby Browser Scene
- New `LobbyBrowser` scene for online play discovery
- Quick Match: finds and auto-joins an open lobby, or creates one if none exist
- Create Lobby: generates a new lobby with a unique 6-character code
- Join by Code: keyboard input for entering a specific lobby code

### Added — Lobby Code System
- Server generates 6-character alphanumeric lobby codes (A-Z, 2-9)
- Codes stored in Redis with collision checking
- Multiple lobbies can exist per post
- Each lobby gets its own realtime channel: `worms_lobby_{code}`

### Added — Lobby Code Display
- Lobby scene prominently displays the lobby code in a bordered box with cyan accent
- "Share this code with friends!" hint text below the code
- Code formatted with letter spacing for readability

### Added — Server Lobby Endpoints
- `POST /api/lobbies/create` - creates a new lobby
- `POST /api/lobbies/join` - joins by lobby code
- `GET /api/lobbies/open` - finds a random open lobby
- `GET /api/lobbies/list` - lists all open lobbies for the post

### Changed — Navigation Flow
- Preloader now always routes to ModeSelect (removed auto-detect online logic)
- GameSetup accepts `forceVsCPU` flag from ModeSelect
- GameSetup and LobbyBrowser have ESC/Back navigation to ModeSelect
- Lobby has ESC/Back navigation to LobbyBrowser
- GamePlay game-over returns to ModeSelect instead of GameSetup

### Changed — Multiplayer Architecture
- MultiplayerManager now uses `lobbyCode` instead of `postId` for channel name
- All API calls include `lobbyCode` in request body
- Realtime channels changed from `worms_{postId}` to `worms_lobby_{code}`
- LobbyInfo type added to shared types with status, player count, host info

### Changed — Splash Screen
- Simplified to just call `requestExpandedMode` on PLAY click (removed pre-join fetch)

### Technical — Redis Keys
- `worms_{postId}_lobbies` - set of lobby codes per post
- `worms_lobby_{code}_state` - lobby metadata (LobbyInfo)
- `worms_lobby_{code}_players` - lobby player list

## Pinch-to-Zoom (v0.0.9.114)

### Added — Pinch-to-Zoom Gesture
- Two-finger pinch on mobile devices zooms the camera in/out (0.3x – 2.0x range)
- Two-finger drag simultaneously pans the camera
- Implemented via raw DOM `touchstart`/`touchmove`/`touchend` listeners on the Phaser canvas
- `preventDefault()` blocks the browser's native page zoom during the gesture
- Triggers `onUserPan()` to disable auto-follow during pinch gestures
- Event listeners cleaned up on scene `shutdown` to prevent leaks

## UI Features: Team Panel, Weapon Preview, Minimap, Touch Controls (v0.0.9.109)

### Added — Team Health Summary Panel
- New `TeamPanel` component in top-left corner (scroll-independent, depth 200)
- Displays aggregate HP per team with colored dots, HP bars, and numeric totals
- Active team highlighted with larger dot and white outline
- HP bars color-coded: green (>50%), yellow (25-50%), red (<25%)

### Added — Weapon Damage Preview Tooltip
- Hovering over any weapon slot in the HUD shows a tooltip above it
- Tooltip displays: weapon name + icon, damage + blast radius, and description
- Styled with dark background, cyan accent for weapon name, gray for description
- Auto-positioned to stay within screen bounds

### Added — Minimap
- New `Minimap` component in top-right corner (150×75px, scroll-independent)
- Terrain silhouette sampled from `TerrainEngine.getSurfaceY()` at 1:16 scale
- Team-colored dots for all living worm positions
- White rectangle showing current camera viewport
- Click on minimap to pan camera to that world position

### Added — Touch/Mobile Controls
- New `TouchControls` component (only visible on touch devices)
- Left side: ← → movement buttons with repeat-fire on hold, ↑ jump button
- Right side: 🎯 aim/fire button, ◀ ▶ weapon cycle, ⏭ next turn
- Semi-transparent styling to avoid obscuring gameplay
- Event-driven: wired into the same callbacks as keyboard input

### Changed — GamePlay Scene
- Initialized TeamPanel, Minimap, and TouchControls in `create()`
- TeamPanel and Minimap updated every frame in `update()`
- Minimap click-to-pan triggers `onUserPan()` for proper camera state management

## Health Bars, Damage Numbers & Map Panning (v0.0.9.101)

### Improved — Health Bars
- Health bar height increased from 3px to 5px, width expanded from `WORM_WIDTH+4` to `WORM_WIDTH+10`
- Added 1px black border outline for better contrast against all terrain types
- Bar centered on worm X position instead of offset from character draw origin
- HP numeric value now displayed above the worm name as white monospace text (e.g. "100", "75")
- HP text fades out with worm on death

### Improved — Damage Numbers
- Font size increased from 16px to 22px for explosion damage, 14px to 20px for fall damage
- Added scale-in animation: starts at 1.5x scale, springs down to 1x over 200ms (Back.easeOut)
- Color-coded by severity: yellow (<20 damage), orange (20-39), red (40+)
- Float duration extended to 1500ms (from 1200ms) with 200ms delay for readability
- Same improvements applied to fall damage indicators in `Worm.ts`

### Improved — Map Panning
- **Left-click drag panning**: drag anywhere on the map to pan the camera (with 6px threshold to distinguish from clicks)
- **Middle-click drag**: also pans the camera
- **Right-click drag**: retained from before
- **Drag vs click distinction**: if pointer moves <6px, treated as a click (aim/fire); otherwise treated as a pan
- **Auto-follow disabled during pan**: `followActiveWorm()` stops tracking when user has panned, preventing the camera from lerping back
- **F key to recenter**: pressing F immediately recenters the camera on the active worm
- **Auto-recenter on turn change**: `userPanning` flag resets when a new turn starts
- **Auto-recenter on movement**: moving with arrow keys resets panning so the camera follows the worm
- **HUD instruction text** updated: `Click:Aim · W:Jump · ←→:Move · Drag:Pan · F:Center`
- Aim/fire logic moved from `pointerdown` to `pointerup` to avoid conflicts with drag panning

## Configurable Turn Timer (v0.0.9.98)

### Added — Turn Timer Selection in Game Setup
- **TIMER row** between MAP and VS CPU in the Game Setup screen
- 5 presets: 15s (Blitz), 30s (Quick), 45s (Normal), 60s (Relaxed), ∞ (Unlimited)
- Left/right arrow cycling with wrap-around, matching the MAP selector UX
- Descriptive label below the value (e.g., "Blitz", "Quick", "Normal")

### Changed — Turn Timer in Gameplay
- **`GamePlay.ts`**: Turn duration is now read from `GameConfig.turnTimer` instead of a hardcoded constant
- **`HUD.ts`**: When unlimited mode is active (timer = 0), the HUD shows "⏱∞" in green instead of "⏱0s"
- When the timer is 0 (unlimited), no countdown event is created — turns never auto-expire
- Default remains 45s (Normal) for backward compatibility

### Config Pipeline
- `GameConfig.turnTimer` flows through GameSetup → CharacterSelect → GamePlay
- `TIMER_PRESETS` array defined in `GameSetup.ts` with value/label/desc for each option

## Fix Aim Angle Range (v0.0.9.94)

### Fixed — Downward Aiming
- **`WeaponSystem.adjustAngle()`**: Expanded clamp from `[-PI, 0]` to `[-PI, PI]`, allowing full 360-degree aim range via keyboard (Up/Down arrows)
- **`WeaponSystem.setAngleFromPointer()`**: Removed the `0.1` radian ceiling that prevented pointer-based aiming below horizontal — aim now follows the mouse freely in all directions
- Players can now aim steeply downward to hit enemies below them on cliffs, shoot into terrain at close range, or fire at targets directly beneath elevated positions

## AI, Sound Effects, and Terrain Variety (v0.0.9.90)

### Added — AI / Single-Player Mode
- **VS CPU toggle** in Game Setup: when enabled, all teams except Team 1 are AI-controlled
- **AIController system** (`AIController.ts`): picks closest enemy target, selects weapon (grenade for close range, bazooka otherwise), calculates ballistic angle with intentional inaccuracy for balanced difficulty
- AI turns execute automatically with a think delay (800ms), aim delay (600ms), and fire delay (400ms)
- Player input is disabled during AI turns — no accidental interference
- AI auto-advances to the next turn after its projectile resolves
- Character Select auto-picks random characters for AI teams and skips their selection step
- Team preview in Game Setup shows 🤖 CPU labels under AI-controlled teams

### Added — Sound Effects (Web Audio API)
- **SoundManager** (`SoundManager.ts`): fully procedural sound synthesis using `OscillatorNode` + `GainNode` — no audio asset files needed
- 10 distinct sounds: `explosion`, `fire`, `bounce`, `damage`, `turn`, `gameover`, `select`, `jump`, `death`, `tick`
- Each sound uses unique waveforms (sine, sawtooth, square, noise) with frequency sweeps and gain envelopes
- **Integration points**: explosions, weapon fire, grenade bounce, worm damage, worm death, jump, turn change, game over, timer tick (last 5s), character select navigation, game setup buttons
- **Sound toggle** in Game Setup: ON/OFF toggle with global mute control
- Zero external dependencies — works in any browser with Web Audio API support

### Added — Terrain Variety / Map Selection
- **5 map presets** (`shared/types/maps.ts`):
  - **Green Hills** — rolling green hills, the classic battlefield (default)
  - **Island Chain** — scattered islands over deep water, sandy terrain colors, teal sky
  - **Underground Cavern** — dark cave with stalactite ceiling, grey/purple tones, dark sky
  - **Flat Arena** — mostly flat terrain for pure aim battles, light green, bright sky
  - **Cliffside** — extreme peaks and deep valleys, rocky grey terrain, purple sky
- **MAP selector** in Game Setup: left/right arrows to cycle through presets with name and description
- `TerrainGenerator` updated with `TerrainStyle` support: `flatness`, `islands` (water gaps), `cavern` (ceiling generation)
- `TerrainEngine` updated with `MapPreset` colors: per-biome surface, sub-surface, and deep colors
- `generateCeilingMap()` added for cavern-style terrain with stalactites hanging from above
- Sky gradient in GamePlay now uses map preset colors for thematic consistency

### Changed
- `GameConfig` interface extended with `aiTeams?: number[]` and `mapId?: string`
- `GameSetup` scene redesigned with tighter layout to fit MAP, VS CPU, and SOUND rows
- `WeaponSystem` gained `setAngleDirect()` and `setPowerDirect()` methods for AI use
- `CharacterSelect` passes through `aiTeams` and `mapId` config to `GamePlay`
- `TerrainEngine` constructor now accepts optional `mapId` parameter

## Character Select Polish (v0.0.9.86)

### Changed
- **Wider portraits**: Images now fill nearly the entire panel width (panelW - 2px) instead of being constrained by large padding
- **Tighter grid**: Gaps between panels reduced from ~16px margins + 10px padding to just 3px between panels with edge-to-edge layout
- **Brighter unselected**: Overlay darkening reduced from 60% to 25% opacity; tint changed from dark grey (0x555566) to light grey (0x99999a) at 85% alpha — unselected characters are now clearly visible
- **Readable names**: Unselected character names brightened from #556677 at 60% to #8899aa at 80% alpha

---

## Character Select Screen Redesign (v0.0.9.82)

### Changed
- **Layout**: Replaced single-character carousel with TMNT arcade-style 3x2 portrait grid showing all 6 characters at once
- **Art**: Each character now displays their actual concept art as a portrait image (256x256 JPEG thumbnails loaded at startup)
- **Selection**: Selected character is fully colorized with a team-color border glow; unselected characters are desaturated and dimmed
- **Navigation**: Arrow keys navigate the 2D grid (left/right/up/down) instead of just left/right
- **Preloader**: Added asset loading phase with progress bar for character portraits
- **Font**: Switched to pixel-style "Press Start 2P" font for retro arcade feel

### Removed
- **Classic Worm**: Removed from character roster, registry, and all fallback references (replaced with Banana Sam as default)
- Old single-character preview with procedural drawing in the select screen (procedural drawing still used in-game)

### Added
- `portrait` field on `CharacterDef` interface for linking characters to their art assets
- `src/client/public/portraits/` directory with 6 character portrait JPEGs
- Loading progress bar in Preloader scene

---

## New Character: Professor Orange (v0.0.9.79)

### Added
- **Professor Orange**: An orange tabby cat professor in a tweed jacket with round glasses
- **Head**: Round orange cat face with darker tabby stripe markings, lighter cheeks/muzzle
- **Ears**: Pointy cat ears with pink inner ear coloring
- **Eyes**: Big round eyes behind dark-framed round glasses with lens reflections
- **Face details**: Pink triangle nose, cat smile mouth, whiskers extending both sides
- **Body**: Brown tweed jacket with horizontal texture lines, shirt V-neck, dark lapels
- **Arms**: Front arm holds an open book (brown cover, white pages, visible spine), back arm holds a magnifying glass (silver rim, translucent lens with glint)
- **Legs/Feet**: Short stubby legs with orange paw pads showing pink toe beans
- **Tail**: Big fluffy orange tail extending behind with lighter tip and darker stripe markings
- **Team color**: Displayed as an elbow patch on the jacket
- Character registered as 7th entry (id: `professor-orange`)
- Total characters now: 7

---

## High Noon Snoo Proportions (v0.0.9.75)

### Changed
- **Head**: Changed from circle (r=8) to wide ellipse (22x18px) — much wider and rounder, matching Snoo's signature big-head look
- **Body**: Replaced angular polygon torso with a round ellipse poncho (20x18px) — shorter, stubbier, cuter
- **Cowboy hat**: Brim widened from 22px to 28px, crown from 14x12 to 18x16 — properly oversized Western hat
- **Legs**: Shortened significantly (start at 72% of hitbox height instead of 62%) — stubby little legs
- **Ears**: Moved outward to match wider head (at headRx edges)
- **Eyes**: Scaled up to 5x6px ovals (from 4x5) and spaced wider (4px from center instead of 3px) to fill the bigger face
- **Mouth**: Repositioned lower on the larger face
- **Antenna**: Extended outward more (4px instead of 3px) with slightly larger ball
- Overall silhouette is now a big round head on a compact round body — much more Snoo-like

---

## Fix: High Noon Snoo Colors (v0.0.9.71)

### Changed
- **High Noon Snoo body color**: Changed from orange-red (`0xff4500`) to white (`0xf0ece8`) to match the actual Snoo mascot. Snoo's body, head, arms, legs, and hands are now all white with warm-tinted shading.
- **Eyes**: Changed from white ovals to orange-red (`0xff4500`) ovals with white glint highlights, matching Snoo's signature look.
- **Antenna**: Changed stalk from orange-red to dark/black (`0x333333`), ball from orange-red to white. Antenna now curves to one side like the real Snoo.
- **Ears**: Added small white ear bumps on sides of head.
- **Mouth**: Changed from flat line to a slight smirk matching Snoo's expression.
- **primaryColor** in character definition updated from `0xff4500` to `0xf0ece8`.

---

## New Character: High Noon Snoo (v0.0.9.68)

### Added
- **High Noon Snoo** — 6th playable character: Reddit's Snoo reimagined as a Wild West cowboy gunslinger.
- `drawHighNoonSnoo.ts` — Procedural drawing function with:
  - Classic orange-red Snoo round head with white oval eyes (no pupils) and antenna
  - Large brown cowboy hat with tall crown, wide brim, hat band, and crown dent
  - Tan poncho/duster coat over the torso with drape lines and edge highlights
  - Brown cowboy boots with gold spurs
  - Silver revolver with cylinder, grip, and hammer detail
  - Belt with gold buckle and diagonal bandolier with bullet details
  - Team-color sheriff star badge (6-pointed) on coat
  - Small neutral Snoo mouth, brim shadow on face
- Character definition: id `high-noon-snoo`, tagline "Draw."
- Registered in `CharacterRegistry.ts`

---

## New Character: Fish Attawater (v0.0.9.64)

### Added
- **Fish Attawater** — 5th playable character: a fish in a trench coat and fedora, disguised with a fake nose, mustache, and round glasses.
- `drawFishAttawater.ts` — Procedural drawing function with:
  - Green fish head with gill lines and lighter cheek area
  - Round glasses with lens glare over white/black eyes
  - Oversized fake nose (Groucho-style, orange/pink)
  - Bushy black fake mustache
  - Tan detective trench coat filling the 16px hitbox width, with button flap, belt, collar, and tie
  - Algae/slime stains on the coat (green and purple spots)
  - Fish tail poking out the back of the coat with fin detail lines
  - Yellow/blue water gun held in a green fin-hand
  - Fedora hat with crown, brim, band, and dent detail
  - Team-color detective badge on coat lapel
- Character definition: id `fish-attawater`, tagline "Staying deep undercover."
- Registered in `CharacterRegistry.ts`

---

## Character Proportions — Final (v0.0.9.60)

### Changed — Classic Worm, Banana Sam, Always Hastronaut
Found the middle ground between too-wide (v0.0.9.52) and too-skinny (v0.0.9.56). Bodies now fill the full 16px hitbox width at their widest point, with natural tapering. Arms and accessories extend slightly beyond.

- **Classic Worm**: Body 14px at belly (`cx-7` to `cx+7`), bulges to 16px at mid-body, tapers to 10px at head. Solid, satisfying worm shape.
- **Banana Sam**: Body 14px at belly (`cx-7` to `cx+7`), crescent curve clearly visible. Tapers to 8px at top. Noodle arms extend past body.
- **Always Hastronaut**: Torso 16px at shoulders (`cx-8` to `cx+8`), tapers to 12px at waist. Properly puffy spacesuit. Helmet radius 8.5. Arms, backpack, pistol extend naturally.
- **Turtle Tank**: Unchanged.

---

## Normal Character Proportions (v0.0.9.56)

### Changed — Classic Worm, Banana Sam, Always Hastronaut
Dialed back from overly wide v0.0.9.52 proportions to natural sizes matching the concept art. Bodies now mostly fill the 16px hitbox width without extending far beyond. Only appendages (arms, pistol, backpack, tail) extend past the body.

- **Classic Worm**: Body 12px at belly, tapering to 8px at head. Natural worm shape.
- **Banana Sam**: Body 10-12px wide, natural banana crescent within the hitbox. Thin noodle arms extend out.
- **Always Hastronaut**: Torso 12-14px wide, slightly puffy suit. Helmet radius 8. Arms, backpack, and pistol extend naturally.
- **Turtle Tank**: Unchanged — wide shell is correct for the character.

---

## Chunky Character Proportions (v0.0.9.52)

### Changed — Classic Worm, Banana Sam, Always Hastronaut
Fixed overly narrow character proportions. Characters were too skinny compared to concept art because body widths used small hard-coded pixel values. Now all three use relative widths that fill and extend beyond the 16px hitbox.

- **Classic Worm**: Body width increased from ~10px to `w * 0.9` (14.4px). Fills hitbox naturally with a rounded, chunky profile.
- **Banana Sam**: Body width increased from ~8px to `w + 4` (20px). Now reads as a distinctly wide, chunky banana shape matching the concept art's belly proportions. Arms, hat, and details scaled proportionally.
- **Always Hastronaut**: Suit width increased from ~12px to `w + 8` (24px). Puffy, bulky spacesuit silhouette now matches the concept art. Helmet radius increased from 7 to 9. Arms, backpack, and pistol all proportionally wider.
- **Turtle Tank**: No changes needed — already had `shellW = w + 10` from v0.0.9.51.

---

## Character Visual Redesign (v0.0.9.51)

### Changed — All 4 Characters
Redesigned all character draw functions to use organic shapes and curved paths instead of rectangular bodies. Characters are now visually distinct at both preview scale and gameplay scale.

- **Classic Worm**: Replaced `fillRoundedRect` body with a tapered worm shape using `beginPath/moveTo/lineTo`. Added visible tail, body segments, belly highlight, headband, cheeky grin, and large expressive eyes.
- **Banana Sam**: Replaced boxy silhouette with a pronounced banana crescent curve. Added thin noodle arms (one reaching nervously, one swinging), distinct legs with boots, sweat drops, and worried mouth arc. The body now uses a path-based crescent instead of straight-edged polygon.
- **Turtle Tank**: Shell now extends well beyond the hitbox horizontally (shellW = w + 10) for a wide, low dome. Head extends forward with a visible neck. Stubby legs poke out underneath. Shell has plate pattern lines and underbelly rim. Turret sits distinctly on top with a tapered barrel shape.
- **Always Hastronaut**: Oversized round helmet as the focal point. Tapered torso with visible waist, distinct legs, and boot shapes. Gun arm with pistol extends to one side, shrug arm with open palm and spread fingers on the other. Life support backpack visible on the back.

### Technical Notes
- Physics hitbox (16x20) unchanged — collision, movement, and gravity all work identically
- Draw functions can render outside the hitbox for visual flair (arms, turret barrel, shell edges)
- All characters use `beginPath/moveTo/lineTo/closePath/fillPath` instead of `fillRoundedRect` for body shapes

---

## New Character: Always Hastronaut (v0.0.9.49)

### Added
- **Always Hastronaut**: Fourth playable character — an astronaut with a pistol and a shrug, based on the "always has been" meme
  - Big round helmet with dark reflective visor, curved highlight reflections, and helmet rim
  - Bulky white spacesuit body with chest control panel (red, green, blue buttons)
  - Life support backpack on the back with tube detail
  - Gun arm holding a brown pistol with barrel tip detail (front hand)
  - Shrug arm with open palm and spread fingers (back hand, casual pose)
  - Shoulder joints, suit belt line, and boots with tread detail
  - Team color patch on shoulder for identification
  - Tagline: "It's just business."
- Character roster now at **4 characters** (Classic Worm, Banana Sam, Turtle Tank, Always Hastronaut)
- Character select screen now shows "4 characters available"

---

## New Character: Turtle Tank (v0.0.9.46)

### Added
- **Turtle Tank**: Third playable character — a grumpy green tortoise with an iron tank turret welded to his shell
  - Domed shell body with hex-plate pattern and ridge lines
  - Tank turret base on top of shell with cannon barrel pointing in facing direction
  - Smoke wisps rising from the barrel
  - Green turtle head with droopy half-lidded annoyed eyes and flat "meh" mouth
  - Stubby legs with claws, tiny pointed tail
  - Team color badge circle on the shell
  - Tagline: "Meh."
- Character roster now at **3 characters** (Classic Worm, Banana Sam, Turtle Tank)
- Character select screen now shows "3 characters available"

---

## Character System + Banana Sam (v0.0.9.44)

### Added — Character System
- **Character architecture**: Modular character system with `CharacterDef` type definitions, draw function registry, and per-team character selection
- **CharacterRegistry**: Maps character IDs to procedural draw functions; new characters can be added by writing a single draw function and registering it
- **Draw function interface**: `CharacterDrawFn(graphics, x, y, w, h, facingRight, teamColor)` — each character is drawn procedurally via Phaser Graphics

### Added — Banana Sam (First Character)
- **Yellow banana-shaped body** with curved edges and dark ridge lines
- **Brown helmet/cap** with brim that flips based on facing direction
- **Big worried eyes** with pupils, highlights, and angled worried eyebrows
- **Sweat drop** on the side of his face
- **Worried frown** mouth
- **Brown boots** with darker soles
- **Stem** on top of the banana
- **Team color armband** around the midsection so team identity is clear

### Added — Character Select Screen
- **New "CHOOSE YOUR FIGHTER" scene** between GameSetup and GamePlay
- **Team-by-team selection**: Each team picks their character in sequence (Team Red first, then Blue, etc.)
- **Large 4x preview** of the character with animated idle (flips facing direction every 1.5s)
- **Character info**: Name, tagline (in quotes), and full description displayed below the preview
- **Left/right arrow navigation** (click or keyboard) to browse the roster
- **Team progress dots** at top: Active team has white ring, completed teams show checkmark
- **"LOCK IN" button** with ENTER keyboard shortcut
- **Camera flash** transition effect when locking in a character
- **ESC to go back** to GameSetup
- **Footer**: Keyboard control hints

### Changed
- **Scene flow**: Boot → Preloader → GameSetup → **CharacterSelect** → GamePlay
- **GameConfig**: Now includes `teamCharacters: string[]` to pass character selections through
- **Worm entity**: Accepts `characterId` parameter; delegates drawing to the character registry instead of hardcoded rendering
- **Classic Worm**: Original worm appearance extracted into its own draw function (`drawClassicWorm.ts`) as the default character

---

## Camera Follow + Game Setup Menu (v0.0.9.41)

### Fixed — Camera Follow
- **Camera now tracks the active worm**: Added smooth lerp-based camera follow in the `update()` loop. The camera gently pans to keep the active worm centered as it walks, jumps, or gets knocked back. Uses a lerp factor of 0.08 for smooth, non-jarring movement that doesn't interfere with manual camera drag.

### Added — Game Setup Menu
- **New GameSetup scene**: Inserted between Preloader and GamePlay in the scene flow
- **Team configuration**: Choose 2-4 teams with +/- buttons
- **Worms per team**: Choose 1-3 worms per team with +/- buttons
- **Team preview**: Visual preview showing colored dots and worm icons for each team
- **Dark themed UI**: Styled with dark navy background, cyan accents, and a red "START BATTLE" button
- **Keyboard shortcut**: Press ENTER to start the battle
- **Dynamic spawning**: GamePlay now accepts config from setup and spawns the correct number of teams/worms
- **Return to setup**: Game Over screen now returns to GameSetup instead of restarting, letting players reconfigure

### Changed
- **Scene flow**: Boot → Preloader → GameSetup → GamePlay → (Game Over) → GameSetup
- **Worm spawning**: Now supports 2-4 teams with dynamic spacing and names from the shared `WORM_NAMES` pool
- **Game Over**: Updated to support all 4 team colors (Red, Blue, Yellow, Purple)

---

## Teams, Health System & Movement (v0.0.9.39)

### Added — Team-Based Turn System
- **2 teams**: Team Red (Boggy, Spadge) vs Team Blue (Mac, Bazza), each with 2 worms
- **Alternating turn rotation**: Red → Blue → Red → Blue, skipping dead worms
- **Configurable turn timer** (default 45s): Countdown displayed in HUD; auto-resolves turn when time expires
- **Win condition**: Game ends when all worms on one team are eliminated
- **Game Over screen**: Dark overlay with winning team name/color and "Press ENTER to Play Again"
- **Scene restart**: ENTER on Game Over screen restarts the match with fresh terrain and teams

### Added — Health & Death System
- **Health persistence**: Damage carries across turns (health bars visually reflect accumulated damage)
- **Worm death**: When health reaches 0, worm plays death animation (fade out) and a tombstone (🪦) marker appears
- **Dead worm removal**: Dead worms are skipped in turn rotation and excluded from gameplay
- **Explosion knockback**: Worms near an explosion are pushed away proportional to proximity (force = falloff × 6, with upward bias)
- **Fall damage**: Worms take damage when falling more than 40px (0.8 damage per pixel beyond threshold)

### Added — Movement Improvements
- **Jump**: Press W while idle to jump (velocity -6)
- **Backflip**: Press W while moving opposite to facing direction (velocity -8 up, ±4 horizontal)
- **Horizontal velocity during airborne**: Worms maintain horizontal momentum when knocked back or backflipping, with 0.98 friction per frame
- **Grounded state tracking**: Worms track whether they're on the ground, preventing mid-air jumps

### Changed — HUD Updates
- **Team indicator**: Red circle (🔴) or blue circle (🔵) shown next to weapon name
- **Turn timer**: ⏱ countdown displayed in yellow/red, hidden during firing/resolved states
- **Updated instructions**: Now shows "Click:Aim · W:Jump · ←→:Move"

---

## Fix: Dynamite Throw + Wind Rebalance (v0.0.9.36)

### Fixed
- **Dynamite now throws**: Changed dynamite from `placed` to `projectile` firing mode with `projectileSpeed: 5` and `projectileGravity: 0.18`, giving it a short, heavy arc. It lands on terrain and sits until its 4-second fuse expires, then detonates. Previously it just appeared at the worm's feet with no arc.
- **Wind force reduced 4x**: Lowered `WindSystem.forceFactor` from `0.02` to `0.005`. At the old value, max wind (10) applied `0.2` force per frame — enough to completely overpower projectile velocity. Now wind is a noticeable tactical factor without making it impossible to fire into the wind.

---

## Fix: Grenade Falling Through Terrain (v0.0.9.32)

### Fixed
- **Grenade no longer falls through the ground**: When a bouncing projectile exhausted its bounce count but still had fuse time remaining, neither the bounce nor the detonate branch executed — gravity kept pulling it through terrain. Now the projectile is pushed out of terrain and stopped (vx=0, vy=0) to rest on the surface until the fuse expires.
- This also fixes any future bouncing + fused weapon that could hit the same edge case.

---

## Unified Bottom Bar Status (v0.0.9.29)

### Changed
- **Status display moved into bottom bar**: Weapon name, turn state, and instructions now display centered between POWER and WIND in the always-visible info bar — no more floating overlay at the top of the screen
- **Cleaner game view**: Removed the separate floating status container, freeing up the top of the viewport for unobstructed gameplay
- **Compact info bar**: All critical info (power, status, wind) in one row at the bottom

---

## Horizontal HUD + Physics Tuning (v0.0.9.27)

### Changed
- **HUD layout**: Complete rewrite to wide horizontal layout — weapon icons in a horizontal row instead of vertical list
- **Always-visible power/wind**: POWER bar (left) and WIND indicator (right) are always visible, even when weapon row is collapsed
- **Compact design**: Only 3 rows tall (toggle bar, weapon icons, info bar) — takes up minimal screen space
- **Weapon slots**: Square icon tiles in a horizontal row with numbered keybinds

### Fixed — Weapon Physics
- **Bazooka**: Reduced speed (12→8) and gravity (0.15→0.12) for a smoother, more visible arc trajectory
- **Grenade**: Reduced speed (10→7), gravity (0.2→0.15), bounce friction (0.6→0.5) for bouncier, more predictable behavior; increased max bounce count (3→5); grenades now stop properly when speed is negligible
- **Dynamite**: Removed all gravity (0.3→0), reduced fuse (5→4 seconds); placed items now skip physics entirely (no gravity applied, stays exactly where placed)
- **Airstrike**: Reduced missile speed (8→5) and gravity (0.1→0.08); missiles spawn higher (y=-60) with slight random x offset for more natural scatter; increased spacing (30→35) with 150ms stagger between missiles
- **ProjectileManager**: Placed weapons skip physics loop entirely; grenade bounce extracts from terrain properly and stops at low speed

---

## UI: Bottom Panel HUD Redesign (v0.0.9.23)

### Changed
- **Complete HUD rewrite**: Replaced top-bar layout with a bottom-pinned, centered panel inspired by Domino Nation's UI
- **Collapsible panel**: Toggle arrow (▼/▲) at the top of the panel smoothly animates expand/collapse with a Cubic.easeOut tween
- **Weapon rows**: Full-width rows with icon + name + key number, replacing the old small square slots
- **Selected state**: Red/pink highlight border and text color on the active weapon row
- **Hover state**: Lighter background on hovered rows
- **Collapsed bar**: Shows current weapon icon + name when collapsed, keeping the UI minimal
- **Section header**: "WEAPONS" label in cyan accent color
- **Power/Wind inline**: Compact power bar and wind indicator below the weapon list
- **Floating status**: Game state and instructions moved to a floating bar at the top of the screen
- **Input handling**: Replaced Phaser Zone-based hit detection with coordinate-based hit testing on scene input for reliable click handling inside scrollFactor(0) containers

---

## UI: Semi-Transparent HUD (v0.0.9.14)

### Changed
- **Top bar background**: Reduced alpha from 0.92 to 0.55 — sky/game world now visible through the menu
- **Weapon slot backgrounds**: Reduced alpha from 0.95 to 0.7
- **Power/Wind panel backgrounds**: Reduced alpha from 0.95 to 0.7
- **Border opacity**: Reduced across all HUD elements for a lighter feel
- Confirmed HUD stays pinned to top of screen during camera pan/zoom (scrollFactor 0)

---

## Fix: Weapon Selection + HUD Polish (v0.0.9.11)

### Fixed
- **Keyboard weapon selection**: Changed Phaser key bindings from `keydown-1` to `keydown-ONE` format (Phaser requires word-form key names)
- **Click-through prevention**: Clicking HUD weapon slots no longer triggers the game scene's aim/fire handler

### Changed
- **HUD** (`ui/HUD.ts`): Complete redesign with dark theme (GitHub-inspired palette), clickable weapon slots with hover states, weapon description text, active worm indicator, cleaner layout
- **GamePlay.ts**: Updated keyboard bindings, added HUD click consumption check, worm name getter for HUD

### UI Improvements
- Clickable weapon slots with interactive zones (no longer keyboard-only)
- Hover highlight on weapon slots
- Weapon description shown below selector
- Active worm name displayed in top-right
- Bottom-center status bar with current weapon and contextual instructions
- Dark semi-transparent panels with rounded corners
- Color-coded power bar (green/yellow/red)
- Wind indicator with directional arrow

---

## Phase 2: Weapons & Projectiles (v0.0.9)

### Added
- **WeaponSystem** (`systems/WeaponSystem.ts`): State machine for weapon selection, aiming, and firing with 5 weapons
- **ProjectileManager** (`systems/ProjectileManager.ts`): Physics simulation for projectiles with gravity, wind, bouncing, and terrain collision
- **ExplosionEffect** (`systems/ExplosionEffect.ts`): Visual explosions with particles, screen shake, terrain carving, and distance-based damage
- **WindSystem** (`systems/WindSystem.ts`): Per-turn random wind affecting projectile trajectories
- **HUD** (`ui/HUD.ts`): Weapon selector (5 slots), power bar, wind indicator, state text, instructions
- **AimIndicator** (`ui/AimIndicator.ts`): Aim line with trajectory preview dots

### Changed
- **weapons.ts**: Enhanced with `firingMode`, `projectileSpeed`, `projectileGravity`, `shotCount`, `bounceFriction`, `icon` fields
- **GamePlay.ts**: Complete rewrite to integrate all weapon systems, new input handling for aim/fire/turn flow

### Weapons Implemented
| Weapon | Firing Mode | Status |
|--------|------------|--------|
| Bazooka | Projectile (arc) | Working |
| Grenade | Projectile (bounce + fuse) | Working |
| Shotgun | Hitscan (2 shots) | Working |
| Dynamite | Placed (5s fuse) | Working |
| Airstrike | Targeted (5 missiles) | Working |

---

## Phase 1: Foundation & Terrain (v0.0.7)

### Added
- Project scaffold: `package.json`, `devvit.json`, TypeScript configs, Vite build
- Splash screen with WORMS branding and PLAY button
- **TerrainEngine**: Procedural heightmap generation, bitmap collision mask, RenderTexture rendering, crater carving
- **TerrainGenerator**: Seeded sine-wave heightmap for deterministic terrain
- **Worm entity**: Terrain-following movement, gravity/falling, health bar, name labels
- **GamePlay scene**: Sky gradient, terrain, 4 worms, camera controls (pan/zoom)
- Server stub: `/api/init`, `/api/game/state`, menu action for post creation
- Redis-backed game state storage

### Fixed
- Removed `onAppInstall` trigger that was causing installation failures
- Added `server.listen(port)` to properly start Express server

---

## Quick Match + Rematch + Leaderboard + Visual Polish (v0.0.9.143)

### Added
- **Leaderboard scene**: New scene accessible from ModeSelect showing ranked players by wins, with medals for top 3
- **Player stats tracking**: Server records wins, losses, and games played per user in Redis on game over
- **Stats API endpoints**: `GET /api/stats` (user stats) and `GET /api/leaderboard` (top players)
- **Rematch flow**: REMATCH button on game-over screen (online mode) creates a new lobby with the same players
- **Rematch server endpoint**: `POST /api/game/rematch` creates new lobby, copies players, broadcasts transition
- **Rematch message type**: Added `{ type: 'rematch'; lobbyCode: string }` to `MultiplayerMessage`
- **Hit flash effect**: Worms flash white when taking damage
- **Idle bobbing animation**: Grounded worms gently bob up and down
- **Enhanced explosions**: Fire particles, rising smoke, terrain debris, expanding shockwave ring
- **Quick Match loading dots**: Animated status text with cycling dots during lobby search/create/join
- **Quick Match busy guard**: Prevents double-click on lobby browser buttons during operations

### Changed
- **ModeSelect**: Added 4th button for Leaderboard
- **ExplosionEffect**: Rewritten `playVisual` with three particle types (fire, smoke, debris) and ring effect
- **Worm**: Added `playHitFlash()` and idle bob in `draw()`

### Technical
- `PlayerStats` interface in `shared/types/game.ts`
- `statsKey`, `leaderboardKey`, `recordGameResult`, `getUserStats`, `getLeaderboard` in `gameState.ts`
- `requestRematch()` in `MultiplayerManager`
- Leaderboard scene registered in `game.ts`

## [v0.0.12.68] - 2026-02-25 — HUD Collapse Fix (wf-1771994096)

### Fixed
- **HUD collapse toggle**: Collapsing the left-side HUD no longer slides the entire container off-screen. The toggle strip (◀/▶) now stays pinned at x=0 and remains visible and clickable at all times.
- **Toggle mechanism**: Replaced the sliding animation with instant show/hide of content containers (weapon grid, status row, info section). The background redraws to match the collapsed/expanded width.

## [v0.0.12.69] - 2026-02-25 — Collapsed HUD Mini-Display (wf-1771994843)

### Added
- **Mini-display in collapsed HUD**: When the left panel is collapsed, the narrow toggle strip now shows three key pieces of information stacked vertically: team emoji, selected weapon icon, and turn timer countdown. This gives players essential turn info at a glance without needing to expand the panel.

## [v0.0.12.73] - 2026-02-25 — Weapon Slot Fix + Collapsed Wind (wf-1771995626)

### Fixed
- **Weapon icon clipping**: Increased weapon grid slot size from 36px to 42px so multi-codepoint emoji (✈️ airstrike, 🪝 ninja rope) are no longer partially cut off.

### Added
- **Wind indicator in collapsed HUD**: The collapsed mini-display now shows a compact wind readout (←4 or →3) with direction-colored text (blue for rightward, red for leftward) below the timer.

## [v0.0.12.77] - 2026-02-25 — Fix End-Game Hang (wf-1771998198)

### Fixed
- **Rope shots hanging the game**: Ninja rope shots that missed all terrain and flew out of bounds would leave the game stuck in `firing` state indefinitely. The `ProjectileManager` resolution logic now uses a `hasFired` flag instead of checking `projectiles.length`, so rope-only shots correctly trigger turn resolution when the rope goes out of bounds.
- **Added firing safety timeout**: A 10-second safety timer in the game loop force-resolves the weapon state if it gets stuck in `firing` with no active projectiles or ropes, preventing any future edge-case hangs.

## [v0.0.12.78] - 2026-02-25 — Weapon Renames (wf-1772043257)

### Changed
- **Shotgun → Banana Cannon**: Renamed to 🍌 Banana Cannon for a more fun, family-friendly feel. All mechanics (damage, range, hitscan params, shot count) remain identical.
- **Sniper Rifle → Blow Dart**: Renamed to 🎯 Blow Dart. All mechanics (damage, range, drift, spread) remain identical.
