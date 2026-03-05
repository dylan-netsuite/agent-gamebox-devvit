# Phaser Scenes

## Scene Flow

```
Boot → Preloader → MainMenu → DinoGame ⇄ GameOver
                      ↓
                  Leaderboard
```

## Boot

**File:** `src/client/game/scenes/Boot.ts`

Generates all procedural textures via `TextureFactory.generateAll()`, then transitions to Preloader. No user-facing UI.

**Textures generated:** dino-stand, dino-run-1/2, dino-duck-1/2, dino-dead, cactus-small, cactus-large, cactus-group, ptero-1/2, ground, cloud, star, restart-icon

## Preloader

**File:** `src/client/game/scenes/Preloader.ts`

Displays "DINO RUN" title with animated progress bar. Transitions to MainMenu after 450ms.

## MainMenu

**File:** `src/client/game/scenes/MainMenu.ts`

Displays the game title, decorative dino and cacti, and two buttons:
- **PLAY** → starts `DinoGame` scene
- **LEADERBOARD** → starts `Leaderboard` scene

Fully responsive — rebuilds UI on resize using scale factor `sf = min(width/800, height/400)`.

## DinoGame

**File:** `src/client/game/scenes/Game.ts`

The main gameplay scene. Key systems:

| System | Description |
|--------|-------------|
| Physics | Custom gravity-based jump with AABB collision detection |
| Obstacles | Spawns cacti and pterodactyls with dynamic gap based on speed |
| Scoring | Continuous distance-based scoring displayed as 5-digit counter |
| Animation | Frame-based dino running/ducking, pterodactyl wing flap |
| Day/Night | Palette swap every 700 points with star spawning |
| Input | Keyboard (Space, Up, Down) and pointer/touch |

On game over, launches `GameOver` as an overlay scene and submits score to server.

**Key methods:**
- `update()` — main game loop (physics, spawning, collision, scoring)
- `tryJump()` — initiates jump if grounded
- `spawnObstacle()` — creates random obstacle at right edge
- `checkCollisions()` — AABB overlap test between dino and all obstacles
- `applyTheme()` — switches day/night colors and tints
- `restart()` — called by GameOver to reset the scene

## GameOver

**File:** `src/client/game/scenes/GameOver.ts`

Launched as an overlay on DinoGame. Shows:
- "GAME OVER" title
- Final score (5-digit)
- High score indicator or "NEW HIGH SCORE!" label
- Restart icon and instructions

500ms delay before allowing restart to prevent accidental double-starts.

## Leaderboard

**File:** `src/client/game/scenes/Leaderboard.ts`

Fetches `/api/leaderboard` and displays top 10 entries with rank, username, and score. Features a "< BACK" button to return to MainMenu. Top 3 entries are styled with bolder text.
