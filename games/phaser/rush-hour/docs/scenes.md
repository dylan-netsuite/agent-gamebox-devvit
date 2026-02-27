# Rush Hour - Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu
                      ├── PuzzleSelect → Game → PuzzleComplete
                      ├── DailyPuzzle → Game → PuzzleComplete
                      ├── LeaderboardScene
                      └── PuzzleEditor → Game → PuzzleComplete
```

## Scene Inventory

### Boot
- Minimal bootstrap scene
- Immediately transitions to Preloader

### Preloader
- Gradient background with red glow ellipse
- Animated title with Back.easeOut entrance
- Loading bar that fills left-to-right with tween animation
- Fades to MainMenu after 500ms

### MainMenu
- Hub scene with 4 glassmorphism navigation cards:
  - 📋 PUZZLE CATALOG → PuzzleSelect
  - 📅 DAILY PUZZLE → DailyPuzzle
  - 🏆 LEADERBOARD → LeaderboardScene
  - ✏️ CREATE PUZZLE → PuzzleEditor
- Cards have left-side color accent strips, emoji icons, chevrons, and staggered slide-in entrance animations
- Hover: card scales up, background brightens, accent widens
- Press: card compresses then navigates with fade-out
- Gradient title with glow ellipse and floating/breathing animation
- Floating particle system (25 colored dots drifting upward)
- Edge-gradient vignette for depth
- Decorative mini-grid at bottom with 7 vehicles, alternating cell opacity, and idle nudge animation on the red target car
- Responsive layout with scale factor

### PuzzleSelect
- Difficulty tab bar (Beginner/Intermediate/Advanced/Expert)
- Scrollable list of puzzle cards showing name, min moves, vehicle count
- Cards display completion status: stars earned, best moves and time (fetched from `/api/puzzle-progress`)
- Each card has a PLAY button that launches the Game scene

### Game
- Core gameplay scene
- 6×6 grid with draggable vehicles
- Header: puzzle name, difficulty, move counter, timer
- Footer: Undo and Reset buttons
- Exit arrow indicator on right side at row 2
- Smooth pixel-based drag with pre-computed collision ranges and expanded touch targets (+8px)
- Pointer-out safety: auto-snaps vehicle when pointer leaves canvas (`pointerupoutside`, `gameout`)
- Sound effects: snap tick on cell boundary crossing, whoosh on exit animation
- Win detection when target car slides past the right grid boundary
- Submits results to server on completion (including per-puzzle best tracking)

### PuzzleComplete
- Victory screen after solving a puzzle
- Plays celebration arpeggio sound on entry
- Shows star rating (1-3), move count vs minimum, time
- Buttons: Next Puzzle (catalog only), Replay, Main Menu

### DailyPuzzle
- Loading screen that fetches today's puzzle from server
- Falls back to client-side daily puzzle selection
- Transitions to Game scene with `isDaily: true`

### LeaderboardScene
- Tab bar: Daily / All Time
- Table with rank, player name, moves, time, puzzles solved
- Highlights current user's entry
- Medal emojis for top 3

### PuzzleEditor
- Interactive 6×6 grid for placing vehicles
- Toolbar: vehicle type (Car/Truck), orientation (Horiz/Vert)
- Action buttons: Clear, Validate, Play
- Tap grid to place, tap vehicle to remove
- Validate runs BFS solver and shows result
- Play transitions to Game scene with custom puzzle
