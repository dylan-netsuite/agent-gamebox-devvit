# Game Mechanics

## Core Loop

1. The T-Rex runs automatically — the world scrolls left while the dino stays at a fixed X position
2. Obstacles spawn from the right edge and scroll left
3. The player jumps or ducks to avoid obstacles
4. Score increases continuously based on distance traveled
5. Speed increases aggressively every 100 points
6. A day/night cycle toggles every 500 points
7. Collision with any obstacle ends the game

## Controls

| Input | Action |
|-------|--------|
| Space / Up Arrow / Tap | Jump |
| Down Arrow | Duck (shrinks hitbox; fast-falls if airborne at 500 px/s) |
| Space / Tap (on game over) | Restart |

## Physics

| Parameter | Value |
|-----------|-------|
| Gravity | 2200 px/s² |
| Jump velocity | -780 px/s |
| Initial speed | 420 px/s |
| Max speed | 1200 px/s |
| Speed increment | +45 px/s every 100 points |
| Min obstacle gap | 200 px |

## Obstacles

| Type | Texture | Hitbox (approx) | Notes |
|------|---------|-----------------|-------|
| Small cactus | `cactus-small` | 14×34 | Single narrow cactus |
| Large cactus | `cactus-large` | 22×48 | Taller cactus with arms |
| Cactus group | `cactus-group` | 34×34 | 3 cacti clustered together |
| Pterodactyl | `ptero-1`/`ptero-2` | 40×24 | Spawns after score > 100; flies at 3 heights; more frequent after 600 |

### Pterodactyl Heights

- **Low** (groundY - 40): Must jump over
- **Mid** (groundY - 70): Can duck under or time a short jump
- **High** (groundY - 100): Can run under safely

### Combo Spawns

After score > 400, there is a 30% chance that two obstacles will spawn close together (120-200px apart), creating tight corridors that demand precise timing.

## Scoring

- Score increments by `speed × dt × 0.02` each frame
- Displayed as 5-digit zero-padded number (e.g., `00342`)
- High score shown with `HI` prefix when > 0
- **Milestone flash** every 100 points (score scales up + turns orange briefly)
- Score submitted to server on game over

## Day/Night Cycle

Toggles every 500 points with a camera flash transition.

| Mode | Background | Sprites | Extras |
|------|-----------|---------|--------|
| Day | #f7f7f7 | #535353 | Clouds, mountain silhouettes |
| Night | #1a1a2e | #e0e0e0 (tinted) | Moon, 18 twinkling stars, tinted mountains |

## Dino States

| State | Texture | Hitbox | Transitions to |
|-------|---------|--------|---------------|
| Running | `dino-run-1`/`dino-run-2` (alternating) | 32×42 | Jumping, Ducking, Dead |
| Jumping | `dino-stand` | 32×42 | Running (on land), Dead |
| Ducking | `dino-duck-1`/`dino-duck-2` (alternating) | 50×18 | Running, Dead |
| Dead | `dino-dead` | — | Restart → Running |

## Visual Effects

| Effect | Trigger | Description |
|--------|---------|-------------|
| Running dust | While running on ground | Continuous particle emission behind dino feet |
| Jump dust burst | On jump | 5 dust particles at launch point |
| Landing impact | On landing from jump | Squash/stretch tween + 8 dust particles + expanding ring |
| Speed lines | Speed > 600 px/s | Horizontal streaks across screen, increasing frequency with speed |
| Death shake | On collision | Camera shake (300ms) + red flash |
| Death particles | On collision | 15 debris fragments explode from dino position |
| Death bounce | On collision | Dino bounces up with rotation before settling |
| Score flash | Every 100 points | Score text scales 1.4x + turns orange for 300ms |
| Night flash | Day/night toggle | Brief white camera flash |
| Star twinkle | Night mode | Stars fade in with staggered timing, then pulse continuously |
| Moon fade | Night mode | Crescent moon fades in at top-right |
| Parallax mountains | Always | Mountain silhouettes scroll at 8% of game speed |

## Animation

- Running legs alternate faster as speed increases (min 40ms per frame)
- Pterodactyls flap wings every 200ms
- Clouds drift at 12% of game speed
