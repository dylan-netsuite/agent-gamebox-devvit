# Rush Hour - Changelog

## v0.1.0 - Initial Release (2026-02-21)

### Added
- Complete Rush Hour sliding block puzzle game
- 40 built-in puzzles across 4 difficulty tiers (Beginner, Intermediate, Advanced, Expert)
- Daily puzzle with deterministic date-based selection
- Leaderboard system with daily and all-time rankings
- Puzzle editor with BFS solver validation
- User-created puzzle saving to server
- Move counter, timer, undo, and reset functionality
- Star rating system (1-3 stars based on move efficiency)
- Responsive UI that scales to any screen size
- Splash screen with animated mini-board preview
- Smooth scene transitions with fade effects
- Server-side stats tracking (puzzles solved, streaks, stars earned)
- Reddit Devvit integration (custom posts, Redis storage)

### Tested
- Deployed and verified on r/rush_hour_devvit_dev
- Splash screen, main menu, puzzle catalog, and game scene all render correctly
- No application errors in console
- Phaser 3.88.2 WebGL rendering confirmed working

## v0.2.0 - Drag Physics Refinement (2026-02-22)

### Changed
- Rewrote drag system: vehicles now follow the pointer smoothly in pixel space (previously snapped to cells during drag)
- Collision range is pre-computed on pointer-down instead of re-checked per-frame, fixing edge cases where vehicles could skip through blockers
- Red target car can now slide past the right grid boundary to trigger win (previously had to stop exactly at col 4)
- Win triggers an ease-out cubic exit animation where the car slides off-screen before transitioning to PuzzleComplete

### Fixed
- Drag responsiveness: removed half-cell dead zone that required users to drag a full half-cell before the vehicle started moving
- Collision detection: replaced fragile per-frame directional checks with a single valid-range computation at drag start
- Win detection: target car no longer needs to land on an exact cell to win; any position past the grid edge triggers exit

### Added
- Drop shadow under dragged vehicles for depth feedback
- Brighter opacity on dragged vehicles to indicate active state
- Smooth exit animation with ease-out cubic easing when the red car exits the board

### Tested
- All 10 automated tests pass (splash, expand, menu, catalog, game load, smooth drag, exit win, puzzle complete, reset, no errors)
- Drag interaction confirmed working via Playwright automation
- Puzzle completion flow verified end-to-end (First Steps puzzle, 1 move, 3 stars)

## v0.3.0 - Polish & Persistence (2026-02-22)

### Added
- **Pointer-out drag safety**: `pointerupoutside` and `gameout` event handlers auto-snap vehicles when the pointer exits the canvas during a drag
- **Touch/mobile tuning**: `touch-action: none` on the game container and canvas prevents page scrolling during drag; expanded hit area (+8px padding) around vehicles for easier touch targeting
- **Sound effects**: Procedural Web Audio API sounds — snap tick on cell boundary crossing, whoosh sweep on exit animation, celebration arpeggio on puzzle completion
- **Progress persistence**: New `GET /api/puzzle-progress` endpoint returns per-puzzle best results (stars, moves, time); displayed on puzzle catalog cards as stars and "Best: X moves • M:SS"
- **BFS validation test suite**: Vitest test verifies all 40 catalog puzzles are valid (no overlaps, in-bounds) and solvable with correct minMoves

### Changed
- **Puzzle catalog rebuilt**: All 40 puzzles regenerated with BFS-verified layouts — no overlaps, all solvable, correct minMoves from BFS solver
- Vehicle hit detection now uses bounding-box with padding instead of grid-cell lookup, improving touch responsiveness
- `POST /api/stats/submit` now also tracks per-puzzle best results in Redis (`rh:progress:{userId}:{puzzleId}`)

### Fixed
- Many original puzzles had overlapping vehicles or incorrect minMoves — all 40 now pass BFS validation
- Several "advanced" and "expert" puzzles were unsolvable — replaced with valid, solvable configurations

### Tested
- 8/8 Playwright tests pass (splash, menu, catalog, game load, drag, win, complete, progress)
- 40/40 BFS puzzle validation tests pass
- 0 console errors
- Progress persistence confirmed: completed puzzle shows stars on catalog card

## v0.4.0 - Visual Overhaul: Splash & Main Menu (2026-02-22)

### Changed
- **Splash screen**: Gradient title (red → orange → gold), pulsing glow backdrop, breathing scale animation, enhanced mini-board with gradient vehicle cells and glow shadows, larger play button with pulse ring animation, vignette overlay
- **Main menu**: Replaced flat colored buttons with glassmorphism cards featuring left-side color accent strips, emoji icons, chevrons, and staggered slide-in entrance animations; hover/press micro-interactions with scale tweens
- **Preloader**: Animated loading bar that fills left-to-right with gradient background and glow effect
- **Mini-grid**: Now shows 6+ vehicles (not just the red car), alternating cell opacity, idle nudge animation on the target car, glow halo around the grid

### Added
- Floating particle system on splash screen (CSS) and main menu (Phaser) — small colored dots drift upward for ambient depth
- Vignette overlay on splash (CSS) and main menu (Phaser edge gradients)
- Title float animation on main menu — gentle Y oscillation and scale breathing
- Pulse ring animation around the PLAY button on splash screen
- Target car glow pulse on splash mini-board

### Tested
- 8/8 visual and navigation tests pass
- Splash screen renders with particles, gradient title, glowing board
- All 4 menu buttons navigate to correct scenes
- 0 console errors

## v0.4.1 - Splash Overflow Fix & Layout Tightening (2026-02-22)

### Fixed
- **Splash screen overflow**: Content was overflowing the Reddit inline post embed — title clipped at top, PLAY button invisible at bottom
- Switched all splash sizing from fixed px/vw units to viewport-height-relative units (`vh`, `min()`) so the layout scales to fit any embed height
- Mini-board now uses `width: min(55vh, 65vw, 260px)` instead of `max-width: 300px` — shrinks proportionally in small viewports
- Title font size uses `clamp(24px, 7vh, 52px)` instead of `clamp(36px, 10vw, 58px)` — height-aware
- Added `flex-shrink` properties so content compresses gracefully
- Added `overflow: hidden` on html, body, and `.splash-bg` for safety

### Changed
- **Main menu**: Tighter button spacing (gap from 18px to 12px, height from 58px to 50px), mini-grid moved lower and made smaller (`height * 0.92`, capped at `min(w*0.22, h*0.16, 110)`)
- Reduced splash content gap from `12px` to `min(1.5vh, 10px)`
- Play button padding reduced to viewport-relative units

### Tested
- 6/6 tests pass
- Splash screen: title, board, and PLAY button all fully visible in inline post embed
- Main menu: all 4 cards and mini-grid visible with no clipping
- Navigation works correctly
- 0 console errors

## v0.5.0 - Dynamic Scattered Blocks Background (2026-02-22)

### Changed
- **Splash screen**: Replaced the static 6×6 mini-board grid with scattered floating vehicle blocks in the background — ~14 rounded rectangles in vehicle colors (red, blue, teal, yellow, orange, purple, cyan) positioned around the edges with subtle CSS float animations
- **Main menu**: Replaced `drawMiniGrid()` with `drawScatteredBlocks()` — ~14 Phaser graphics objects scattered across the canvas with gentle position/rotation drift tweens
- Removed all `.mini-board`, `.mini-row`, `.mini-cell`, `.exit-arrow` HTML and CSS
- Removed `drawMiniGrid()` method and the mini-grid glow/arrow/target-car tweens from MainMenu scene
- Splash layout is now title + subtitle + play button only (vertically centered) — simpler and cleaner

### Added
- `blockFloat` CSS animation with per-block timing, rotation, and drift variations
- `FloatingBlock` interface and `drawScatteredBlocks()` / `updateBlocks()` methods in MainMenu Phaser scene
- Blocks include both horizontal (car/truck) and vertical orientations for visual variety
- Semi-transparent blocks with subtle glow box-shadows and thin white borders

### Tested
- 6/6 tests pass
- Splash screen shows floating colored blocks, no grid
- Main menu shows scattered blocks behind title and buttons
- All navigation works
- No overflow regression
- 0 console errors

## v0.6.0 - Unified Visual Polish Across All Scenes (2026-02-22)

### Added
- **Shared background utility** (`sceneBackground.ts`): Reusable module that draws gradient background, scattered floating vehicle blocks, and vignette edges. Used by PuzzleSelect, PuzzleComplete, Leaderboard, PuzzleEditor, and DailyPuzzle scenes.
- **Confetti particles** on PuzzleComplete: 40 falling confetti pieces with vehicle colors, rotation, and gravity physics
- **Title glow effects**: Each scene title now has a colored glow ellipse behind it (teal for PuzzleSelect, gold for Leaderboard, purple for PuzzleEditor, green for PuzzleComplete)
- **Staggered entrance animations** on PuzzleSelect cards (slide-in from right with delay per card)
- **Hover/press micro-interactions** on PuzzleSelect cards (scale 1.02 on hover, 0.97 on press with yoyo)
- **Loading pulse animation** on DailyPuzzle loading text

### Changed
- **PuzzleSelect**: Cards now use glassmorphism style with left accent strips colored by difficulty, thin white borders, and rounded corners. Tab buttons use glassmorphism (selected = filled, unselected = glass)
- **Game scene**: Added gradient background behind grid, glassmorphism header bar with subtle border, grid drop shadow, footer buttons with glassmorphism styling and color accent bars (blue for UNDO, red for RESET)
- **PuzzleComplete**: Background with scattered blocks + vignette, title scale-pop entrance, stars scale-pop entrance, stat rows in glassmorphism cards, buttons in glassmorphism cards with accent strips and staggered slide-in
- **Leaderboard**: Background with scattered blocks, glassmorphism tabs, table rows with alternating glassmorphism backgrounds, top 3 rows get colored glow borders (gold/silver/bronze)
- **PuzzleEditor**: Background with scattered blocks, glassmorphism toolbar container, toggle buttons with glassmorphism (selected = purple, unselected = glass), action buttons with accent strips
- **DailyPuzzle**: Background with scattered blocks, loading text in gold with glow shadow and pulse animation
- All scenes now have `update()` method to animate floating blocks

### Tested
- 7/7 tests pass
- All scenes have unified gradient + blocks + vignette background
- Cards/buttons use glassmorphism style with accent strips
- Entrance animations on cards/buttons
- All navigation works across all scenes
- 0 console errors

## v0.7.0 - Scene Transitions, Puzzle Scrolling & Mobile Layout (2026-02-23)

### Added
- **Accent-colored scene transitions** (`transitions.ts`): New `transitionTo()` and `fadeIn()` helpers replace raw camera fade calls. Transitions use scene-appropriate tint colors — teal for PuzzleSelect, gold for DailyPuzzle/Leaderboard, purple for PuzzleEditor, red for Preloader, dark for game-focused scenes.
- **Puzzle scrolling**: PuzzleSelect now supports mouse wheel scrolling, touch drag scrolling with momentum/inertia, and boundary clamping. A geometry mask clips cards to the list area. A "↕ Scroll for more" hint appears when content overflows.
- **Scroll-drag awareness**: Touch-dragging on the card list doesn't accidentally open a puzzle — `pointerdown` on cards is suppressed if the user was scroll-dragging.

### Changed
- All 8 Phaser scenes refactored to use shared `transitionTo()` / `fadeIn()` helpers instead of inline `camera.fadeOut`/`fadeIn` calls
- `PuzzleSelect` cards are now rendered inside a masked container with proper viewport culling and on-demand rebuilding during scroll
- Scene color constants centralized in `SCENE_COLORS` object

### Tested
- Splash screen renders without overflow on desktop and mobile (375x667)
- Main menu shows all 4 buttons on mobile viewport
- Game scene fits properly on iPhone SE viewport (375x667)
- Scene transitions execute with accent-colored fades
- 0 console errors across all tested scenarios
- Build compiles cleanly with no type errors
