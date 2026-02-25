# Phaser Scenes

## Boot
- Minimal setup scene
- Transitions immediately to Preloader

## Preloader
- Displays "MINI GOLF" title with loading bar
- Animated gradient background
- Transitions to MainMenu after 500ms

## MainMenu
- Candy-themed background with floating pieces
- "MINI GOLF" title with glow effect and float animation
- "Sugar Rush Retro Invitational" subtitle
- Two buttons: PLAY 18 HOLES, LEADERBOARD
- Button hover/press animations

## Game (Core Gameplay)
- Loads hole definition from `holes.ts`
- Builds Matter.js level: walls, obstacles, zones
- Manages game state machine: aiming -> power -> simulating -> sinking
- HUD overlay: hole number, name, par, stroke count
- Handles water hazard resets with penalty
- Ball capture with sink animation and particle effects
- Score display (Hole-in-One, Eagle, Birdie, Par, Bogey)
- Transitions to HoleComplete or Scorecard

## HoleComplete
- Shows hole number and name
- Large animated score label
- Stroke count vs par
- Running total score
- "NEXT HOLE" button (or "VIEW SCORECARD" on hole 18)

## Scorecard
- Full 18-hole scorecard table
- Per-hole: name, par, score, +/- relative to par
- Color-coded scores (gold for HIO, green for under par, red for over)
- Total row with overall score
- Submits score to server on completion
- "MAIN MENU" button
