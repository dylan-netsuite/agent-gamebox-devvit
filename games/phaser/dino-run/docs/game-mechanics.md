# Game Mechanics

## Core Loop

1. The T-Rex runs automatically — the world scrolls left while the dino stays at a fixed X position
2. Obstacles spawn from the right edge and scroll left
3. The player jumps or ducks to avoid obstacles
4. Score increases continuously based on distance traveled
5. Speed increases every 100 points
6. A day/night cycle toggles every 700 points
7. Collision with any obstacle ends the game

## Controls

| Input | Action |
|-------|--------|
| Space / Up Arrow / Tap | Jump |
| Down Arrow | Duck (shrinks hitbox; fast-falls if airborne) |
| Space / Tap (on game over) | Restart |

## Physics

| Parameter | Value |
|-----------|-------|
| Gravity | 1600 px/s² |
| Jump velocity | -620 px/s |
| Initial speed | 320 px/s |
| Max speed | 900 px/s |
| Speed increment | +25 px/s every 100 points |
| Min obstacle gap | 300 px (shrinks with speed) |

## Obstacles

| Type | Texture | Hitbox (approx) | Notes |
|------|---------|-----------------|-------|
| Small cactus | `cactus-small` | 14×34 | Single narrow cactus |
| Large cactus | `cactus-large` | 22×48 | Taller cactus with arms |
| Cactus group | `cactus-group` | 34×34 | 3 cacti clustered together |
| Pterodactyl | `ptero-1`/`ptero-2` | 40×24 | Spawns after score > 200; flies at 3 heights |

### Pterodactyl Heights

- **Low** (groundY - 40): Must jump over
- **Mid** (groundY - 70): Can duck under or avoid with careful timing
- **High** (groundY - 100): Can run under safely

## Scoring

- Score increments by `speed × dt × 0.02` each frame
- Displayed as 5-digit zero-padded number (e.g., `00342`)
- High score shown with `HI` prefix when > 0
- Score submitted to server on game over

## Day/Night Cycle

| Mode | Background | Sprites | Score text |
|------|-----------|---------|------------|
| Day | #f7f7f7 | #535353 | #535353 |
| Night | #1a1a2e | #e0e0e0 (tinted) | #e0e0e0 |

Toggles every 700 points. Night mode also spawns star decorations.

## Dino States

| State | Texture | Hitbox | Transitions to |
|-------|---------|--------|---------------|
| Running | `dino-run-1`/`dino-run-2` (alternating) | 32×42 | Jumping, Ducking, Dead |
| Jumping | `dino-stand` | 32×42 | Running (on land), Dead |
| Ducking | `dino-duck-1`/`dino-duck-2` (alternating) | 50×18 | Running, Dead |
| Dead | `dino-dead` | — | Restart → Running |

## Animation

- Running legs alternate at a rate tied to game speed (faster = quicker animation)
- Pterodactyls flap wings every 0.2 seconds
- Clouds drift at 15% of game speed for parallax effect
