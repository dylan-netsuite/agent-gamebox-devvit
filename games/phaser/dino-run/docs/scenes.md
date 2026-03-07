# Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu → DinoGame ⇄ GameOver
                      ↓
                  Leaderboard
```

## Boot

**File:** `src/client/game/scenes/Boot.ts`

Generates all procedural textures via `TextureFactory.generateAll()`. Now generates 21 textures including particle effects, speed lines, mountains, moon, and impact rings.

## Preloader

**File:** `src/client/game/scenes/Preloader.ts`

Displays "DINO RUN" title with animated progress bar. Transitions to MainMenu after 450ms.

## MainMenu

**File:** `src/client/game/scenes/MainMenu.ts`

Displays the game title, decorative dino/cacti, clouds, and two buttons:
- **PLAY** → starts `DinoGame` scene
- **LEADERBOARD** → starts `Leaderboard` scene

Fully responsive — rebuilds UI on resize.

## DinoGame

**File:** `src/client/game/scenes/Game.ts`

The main gameplay scene with all difficulty and visual systems:

| System | Description |
|--------|-------------|
| Physics | High-gravity jump (2200 g, -780 jump vel) with AABB collision |
| Obstacles | 4 types + combo spawns (30% chance of doubles after score 400) |
| Scoring | Distance-based, milestone flash every 100 pts |
| Speed | Starts at 420, +45 per 100 pts, caps at 1200 px/s |
| Particles | Dust trail (running), dust bursts (jump/land), debris (death) |
| Speed lines | Horizontal streaks when speed > 600 px/s |
| Parallax | Mountains at 8% speed, clouds at 12% speed |
| Day/Night | Palette swap every 500 pts with flash + moon/stars |
| Camera FX | Shake + red flash on death, white flash on day/night toggle |
| Landing FX | Squash/stretch tween + impact ring + dust burst |

**Key methods:**
- `update()` — main game loop
- `tryJump()` — jump with dust burst
- `landingImpact()` — squash + ring + dust on landing
- `spawnObstacle()` — creates obstacles with combo spawn logic
- `updateSpeedLines()` — manages speed line spawning/movement
- `transitionTheme()` — smooth day/night transition with moon/stars
- `flashMilestone()` — score scale + color pulse
- `gameOver()` — death sequence (shake, flash, bounce, debris, delayed GameOver launch)

## GameOver

**File:** `src/client/game/scenes/GameOver.ts`

Launched as overlay 400ms after death (after death animation completes):
- Panel slides down with `Back.easeOut`
- Score counts up from 0 with tween
- "NEW HIGH SCORE!" pulses if new record
- "GAME OVER" title in orange accent color
- 600ms restart delay to prevent accidental restarts

## Leaderboard

**File:** `src/client/game/scenes/Leaderboard.ts`

Fetches `/api/leaderboard` and displays top 10 with rank, username, and score. "< BACK" button returns to MainMenu.
