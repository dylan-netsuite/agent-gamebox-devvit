# Phaser Scenes

## Boot
- Calls `TextureFactory.generateAll()` to generate all runtime textures (`candy-cane`, `candy-cane-corner`, `grass-bg`, `sparkle`, `vignette`)
- Transitions immediately to Preloader

## Preloader
- `grass-bg` TileSprite background with `vignette` Image overlay
- "MINI GOLF" title with loading bar animation
- Transitions to MainMenu after 500ms

## MainMenu
- `grass-bg` TileSprite background with `vignette` Image overlay
- Peppermint swirl decorations (`candy-cane-corner` sprites)
- Sparkle sprites with tween animations (scale + alpha pulse)
- "MINI GOLF" title with glow effect and float animation
- "Sugar Rush Retro Invitational" subtitle
- Two buttons: PLAY 18 HOLES, LEADERBOARD
- Button hover/press animations

## Game (Core Gameplay)
- `grass-bg` TileSprite background with `vignette` Image overlay
- Sparkle sprites with tween animations in dark background areas
- Loads hole definition from `holes.ts`
- Builds Matter.js level: walls (`candy-cane` TileSprite + `candy-cane-corner` Image), obstacles, zones
- Clean green fairway fill with stroke border
- Manages game state machine: aiming -> power -> simulating -> sinking
- HUD overlay: hole number, peppermint swirl accents, par, stroke count
- Handles water hazard resets with penalty
- Ball capture with sink animation and particle effects
- Score display (Hole-in-One, Eagle, Birdie, Par, Bogey)
- Transitions to HoleComplete or Scorecard

## HoleComplete
- `grass-bg` TileSprite background with `vignette` Image overlay
- Shows hole number and name
- Large animated score label
- Stroke count vs par
- Running total score
- "NEXT HOLE" button (or "VIEW SCORECARD" on hole 18)

## Scorecard
- `grass-bg` TileSprite background with `vignette` Image overlay
- Full 18-hole scorecard table
- Per-hole: name, par, score, +/- relative to par
- Color-coded scores (gold for HIO, green for under par, red for over)
- Total row with overall score
- Submits score to server on completion
- "MAIN MENU" button
