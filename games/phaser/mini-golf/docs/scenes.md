# Phaser Scenes

## Boot
- Calls `TextureFactory.generateAll()` to generate all runtime textures (`candy-cane`, `candy-cane-corner`, `grass-bg`, `sparkle`, `vignette`)
- Transitions immediately to Preloader

## Preloader
- `grass-bg` TileSprite background with `vignette` Image overlay
- "MINI GOLF" title with loading bar animation
- Transitions to MainMenu after 500ms

## PlayerSetup
- `grass-bg` TileSprite background with `vignette` Image overlay
- "LOCAL MULTIPLAYER" title with "Set up your players" subtitle
- Player count selector (2, 3, or 4 players)
- Per-player name inputs with assigned colors (red, teal, yellow, purple)
- Course selection: Full 18, Front 9, Back 9
- "BACK TO MENU" button
- Transitions to Game scene with MultiplayerConfig and MultiplayerScores

## MainMenu
- `grass-bg` TileSprite background with `vignette` Image overlay
- Peppermint swirl decorations (`candy-cane-corner` sprites)
- Sparkle sprites with tween animations (scale + alpha pulse)
- "MINI GOLF" title with glow effect and float animation
- "Sugar Rush Retro Invitational" subtitle
- Buttons: PLAY 18 HOLES, LOCAL MULTIPLAYER, LEADERBOARD
- Button hover/press animations

## Game (Core Gameplay)
- `grass-bg` TileSprite background with `vignette` Image overlay
- Sparkle sprites with tween animations in dark background areas
- Loads hole definition from `holes.ts`
- Builds Matter.js level: walls (`candy-cane` TileSprite + `candy-cane-corner` Image), obstacles, zones
- Clean green fairway fill with stroke border
- Manages game state machine: aiming -> power -> simulating -> sinking
- HUD overlay: hole number, peppermint swirl accents, par, stroke count
- **Multiplayer**: Player color-coded banner in HUD shows current player; "Pass device" transition overlay between turns
- Handles water hazard resets with penalty
- Ball capture with sink animation and particle effects
- Score display (Hole-in-One, Eagle, Birdie, Par, Bogey)
- In multiplayer: turn-based — each player completes the hole before advancing; "Pass device" overlay between turns
- Transitions to HoleComplete or Scorecard

## HoleComplete
- `grass-bg` TileSprite background with `vignette` Image overlay
- Shows hole number and name
- Large animated score label
- Stroke count vs par
- Running total score
- **Multiplayer**: Displays all players' scores for the hole, sorted by score
- "NEXT HOLE" button (or "VIEW SCORECARD" on hole 18)

## Scorecard
- `grass-bg` TileSprite background with `vignette` Image overlay
- Full 18-hole scorecard table
- Per-hole: name, par, score, +/- relative to par
- Color-coded scores (gold for HIO, green for under par, red for over)
- **Multiplayer**: Multi-column results per player; winner announcement with tie detection at completion
- Total row with overall score
- Submits score to server on completion (single player, non-viewOnly mode only)
- Supports `viewOnly` mode from MainMenu leaderboard (skips score submission)
- "MAIN MENU" button
