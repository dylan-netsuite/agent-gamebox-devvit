# Blokus - Changelog

## v0.3.1 - Rotation Controls Overhaul (2026-02-24)

### Changed
- Replaced single "↻ Rotate" button with separate **↺ CCW** and **↻ CW** buttons for full directional rotation
- Added **E** keyboard shortcut for counter-clockwise rotation (R = CW, E = CCW)
- Status text now shows current orientation: piece name with degree and flip state (e.g. "Tromino I (90° flipped)")
- Control bar now has 6 buttons: ↺, ↻, ↔ Flip, ↩ Undo, ✕, ⏭ Pass
- All 8 piece orientations (4 rotations × 2 flip states) clearly accessible via CW/CCW + Flip

### Verified
- CW and CCW rotation buttons both work correctly
- Flip button toggles flip state
- Orientation indicator updates in real-time
- All 8 orientations reachable
- Zero console errors

## v0.3.0 - Sound Effects, Drag-and-Drop, Undo (2026-02-24)

### Added
- **Sound Effects**: Procedural audio via Web Audio API (no external files)
  - Piece placement: satisfying low-freq thunk
  - Rotate/Flip: quick click sound
  - Piece selection: soft pop
  - Invalid placement: error buzz
  - AI move: two-tone chime notification
  - Undo: descending sweep
  - Game over: ascending arpeggio (win) or descending (loss)
  - Pass: muted thud
- **Drag-and-Drop**: Drag pieces directly from tray onto the board
  - 8px threshold before drag activates (prevents accidental drags)
  - Ghost preview follows pointer when dragging over board
  - Drop on valid position places piece; drop elsewhere cancels
  - Tap-to-select + tap-to-place still works as fallback
- **Undo Last Move**: Reverts both player's move and AI's response
  - Undo button in control bar (↩ Undo), dimmed when unavailable
  - Keyboard shortcut: Z key
  - Single-level undo (one move pair at a time)
  - Undone piece auto-selected for re-placement
  - `BoardLogic.removePiece()` method added for clean reversal

### Changed
- Control bar now has 5 buttons: Rotate, Flip, Undo, Clear, Pass
- Sound cues provide feedback for all major game actions

### Verified
- Undo correctly reverts both player and AI pieces, restoring scores
- Undo button activates/deactivates based on state
- Tap-to-place workflow confirmed working with sound
- Zero console errors

## v0.2.0 - Piece Selection UX Overhaul (2026-02-24)

### Changed
- Moved piece tray from left side panel to bottom of screen for better mobile ergonomics
- Board now centered horizontally with full width, maximizing board size
- Piece cell size increased from 12px to 18px for much better visibility
- Added horizontal scrollable piece strip with swipe/drag support
- Added size category tab bar (ALL, 1-2, 3, 4, 5) to filter pieces by polyomino size
- Added on-screen control buttons: Rotate, Flip, Clear, Pass (replacing keyboard-only controls)
- Used pieces now shown as dimmed ghosts instead of being hidden entirely
- Pieces with no valid moves shown with reduced opacity and red dot indicator
- Selected piece shows current rotation/flip transformation in tray preview
- Auto-selects first playable piece at start of each turn

### Verified
- Bottom tray renders correctly on both desktop and mobile
- Tab filtering shows only matching piece sizes
- Rotate/Flip/Clear/Pass buttons all functional
- Piece placement and AI response working as before
- Zero console errors

## v0.1.1 - Deployment & Testing (2026-02-23)

### Fixed
- Updated `@devvit/web` and `devvit` packages from 0.12.0 to 0.12.11 for `requestExpandedMode` API compatibility
- Fixed splash screen to use correct `requestExpandedMode(event, 'game')` API for entrypoint navigation

### Verified
- Splash screen loads with username personalization
- Expanded mode transition from splash to game works correctly
- Main menu renders with all buttons and decorative elements
- Game board, piece tray, and UI elements display properly
- Piece placement and validation (valid/invalid preview) works
- AI opponent responds with strategic moves after player's turn
- HOW TO PLAY screen displays rules, scoring, and visual examples
- Zero console errors during full test cycle

## v0.1.0 - Initial Release (2026-02-23)

### Added
- Complete Blokus Duo implementation (14x14 board, 2 players)
- All 21 polyomino pieces per player with rotation and flip support
- Full Blokus placement rules (corner contact, no edge adjacency, starting positions)
- AI opponent with medium difficulty (scoring heuristic: piece size, corners, center proximity)
- 7 Phaser scenes: Boot, Preloader, MainMenu, Game, GameOver, HowToPlay, Leaderboard
- Piece selection tray with visual highlighting
- Ghost preview on board hover (green=valid, red=invalid)
- Keyboard controls (R=rotate, F=flip, ESC=deselect)
- Score calculation with bonuses (+15 all placed, +5 monomino last)
- Server API for stats persistence and leaderboard (Redis-backed)
- Splash screen with animated polyomino decorations
- Responsive layout that scales with viewport
- Dark theme UI (blue player, orange AI)
- How to Play tutorial with visual rule demonstrations
