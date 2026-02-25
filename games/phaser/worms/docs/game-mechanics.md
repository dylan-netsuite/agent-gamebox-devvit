# Reddit Royale - Game Mechanics

## Overview

Turn-based artillery game where players control worms on destructible terrain, using weapons to eliminate opponents.

## Weapons

| # | Weapon | Mode | Blast Radius | Damage | Wind? | Special |
|---|--------|------|-------------|--------|-------|---------|
| 1 | Bazooka | Projectile | 40px | 45 | Yes | Arcs with gravity |
| 2 | Grenade | Projectile | 35px | 40 | Yes | Bounces 3x, 3s fuse |
| 3 | Banana Cannon | Hitscan | 20px | 25×2 | Wind drift at range | Close-range banana blasts — 175px range, scatter past 70px |
| 4 | Firecracker | Projectile | 70px | 75 | No | 4s fuse, high arc |
| 5 | Pigeon Strike | Targeted | 25px×5 | 30×5 | Yes | 5 pigeons dive-bomb from above |
| 6 | Confetti Bomb | Projectile | 20px + 18px×4 | 20 + 18×4 | Yes | Splits into 4 party poppers on detonation |
| 7 | Blow Dart | Hitscan | 8px | 50 | Wind drift at range | 350px range, accurate up close, heavy drift beyond 150px |
| 8 | Teleport | Teleport | — | — | No | Instantly moves worm to aimed location |
| 9 | Ninja Rope | Rope | — | — | No | Grappling hook for swing traversal |

### Confetti Bomb Details
The main projectile bounces once and detonates after a 2s fuse. On detonation, it deals 20 damage (20px radius) and spawns 4 smaller party poppers. Each popper flies outward in a random upward arc and detonates on terrain impact, dealing 18 damage (18px radius). Effective for area denial and hitting enemies behind cover.

### Banana Cannon Details
Fires two hitscan rays with ±0.05 radian spread. Each ray detects direct worm hits (25 damage per hit) and impacts terrain (20px crater with splash). The banana cannon is a close-range weapon:

| Parameter | Value |
|-----------|-------|
| Max range | 175px |
| Drift start | 70px |
| Wind multiplier | 2× |
| Spread max | 1.2 |

- **Point-blank (< 70px)**: Perfectly accurate — devastating with 50 total damage on direct hits
- **Close range (70-175px)**: Increasing spread; still effective but less reliable
- **Beyond 175px**: Out of range entirely
- **AI scoring**: +25 bonus within 100px, -30 penalty beyond 140px

### Blow Dart Details
Fires a single hitscan dart — instant, no travel time. The dart detects direct worm hits (full 50 damage) and also impacts terrain (8px crater with splash damage). Uses per-weapon hitscan parameters:

| Parameter | Value |
|-----------|-------|
| Max range | 350px |
| Drift start | 150px |
| Wind multiplier | 10× |
| Spread max | 1.8 |

- **Close range (< 150px)**: Perfectly accurate with no drift or spread, rewarding positioning
- **Mid range (150-250px)**: Heavy wind drift and spread kick in; much harder to land hits
- **Long range (250-350px)**: Extreme accuracy degradation — effectively unreliable
- **Beyond 350px**: Out of range entirely
- **AI scoring**: +10 bonus for 100-250px, -30 penalty beyond 300px
- **Aim indicator**: Laser-sight dots fade from full alpha to near-transparent past 150px

### Teleport Details
Utility weapon that teleports the worm to the aimed position. The worm lands at the nearest surface below the target point. Uses a turn but deals no damage. Shows a cyan flash at both the origin and destination. The AI does not use this weapon.

### Ninja Rope Details
Fires a grappling hook in the aimed direction. When the hook hits terrain, it anchors and the worm swings on the rope like a pendulum. Controls while on rope:
- **Up/Down arrows**: Shorten/lengthen the rope (30px min, 200px max)
- **Click or Space**: Release the rope — the worm inherits the swing momentum
- Auto-detaches after 5 seconds
- If the rope flies out of bounds without attaching, the turn resolves immediately (no hang)
- Uses a turn but deals no damage. AI (medium/hard) uses it for repositioning when blocked or at height disadvantage.
- **Visual feedback**:
  - Catenary bezier curve with sag when slack, straight when taut
  - Rope color shifts from brown (slack) to gold (taut) based on angular velocity
  - Rope thickness decreases with tension; glow effect at high speeds
  - Swing arc indicator shows the pendulum path
  - Momentum arrow shows release velocity (green=safe, red=dangerous fall)

## Controls

| Input | Action |
|-------|--------|
| ← → | Move worm left/right (also works mid-air for air control) |
| W | Jump (can hold ← → simultaneously for directional jumps) |
| B | Backflip (higher jump, moves backward) |
| P | Toggle parachute (while airborne) |
| Click / Space | Start aiming / Fire |
| Mouse move | Adjust aim angle |
| Scroll wheel | Adjust power (while aiming) / Zoom (while idle) |
| 1-9 / Click weapon slot | Select weapon |
| Q / E | Cycle weapons |
| Tab | Switch active worm |
| Enter | Next turn (after firing) |
| Escape | Cancel aiming |
| Left-click drag | Pan camera (in idle/resolved state) |
| Middle-click drag | Pan camera |
| Right-click drag | Pan camera |
| F | Recenter camera on active worm |

## Terrain

- Procedurally generated using layered sine waves with seeded RNG
- World size: 2400 × 1200 pixels
- Destructible: explosions carve circular holes
- Worms fall through destroyed terrain (gravity)
- Texture noise, grass tufts, and edge highlighting for visual depth
- Water plane renders at configurable level for ocean/lava maps

### Maps (8 total)

| Map | Shape Features | Water | Visual Theme | Background Decorations |
|-----|---------------|-------|--------------|----------------------|
| Green Hills | Classic sine waves | No | Green grass, brown earth, blue sky | Sun, 3-layer hill silhouettes, clouds, birds |
| Island Chain | Islands with beach transitions | Ocean (blue, 55% opacity) | Sandy terrain, teal sky | Tropical sun with rays, island/palm silhouettes, clouds, sea birds |
| Underground Cavern | Smooth floor + thick ceiling with stalactites | No | Stone floor, dark ceiling, near-black sky | Glowing crystal clusters, ambient light spots, stalactite drips |
| Flat Arena | High flatness, minimal variation | No | Light green, bright sky | Sun, tree line silhouettes, clouds, birds |
| Cliffside | Terraced (6 steps) | No | Grey rock, purple sky | Snow-capped mountains, mist layers, wispy clouds, eagles |
| Desert Dunes | Plateaus (4 levels) | No | Sandy tan, orange/hot sky | Large sun, mesa silhouettes, heat shimmer, cacti, vultures |
| Frozen Tundra | Ridged peaks | Frozen lake (icy blue, 45%) | White/blue ice, grey sky | Aurora borealis bands, frozen peaks, snowflakes |
| Volcanic Ridge | Ridged terrain | Lava (orange, 80% opacity) | Dark charred rock, deep red sky | Lava glow, volcanic peaks, smoke, embers, dim stars |

### Terrain Style Options
- **ridged**: Folds sine waves for sharp peaks (Tundra, Volcano)
- **plateaus**: Quantizes heights to 4 discrete levels (Desert)
- **terraced**: Creates step-like cliff faces with N steps (Cliffside)
- **islands**: Cuts terrain below water threshold with smooth beach transition (Island Chain)
- **cavern**: Adds ceiling hanging from the top of the world with stalactite features. Ceiling occupies 25-45% of height with guaranteed 20% minimum gap above floor. Ceiling and floor rendered with distinct color palettes. Grass tufts disabled.

### Worm Spawn Positioning
Worms are placed on the terrain floor via `getSurfaceY()`, which scans downward to find the first solid-after-empty transition. In cavern maps (which have a solid ceiling above empty space above the floor), the algorithm skips the initial ceiling region before locating the floor surface, ensuring worms spawn inside the cavern rather than on top of it.

## Damage

- Distance-based falloff: `damage × max(0, 1 - distance / (radius × 1.5))`
- Knockback force: `falloff × 8` (directional) with `-4` upward bias
- Worms have 100 HP
- Health bar: 5px tall, outlined, color-coded: green (>50%) → yellow (25-50%) → red (<25%)
- HP number displayed above worm name in white monospace text
- Floating damage numbers: scale-in animation (1.5x → 1x), color-coded by severity (yellow <20, orange 20-39, red 40+)
- Worms die at 0 HP or by falling off the map

### Fall Damage
- Falls exceeding 60 pixels deal damage: `round((fallDistance - 60) * 0.5)`
- Example: 100px fall = 20 damage, 200px fall = 70 damage
- Fall damage is completely negated when landing with an open parachute

### Parachute
- Toggle with **P** key (keyboard) or 🪂 button (touch) while airborne
- Slows fall velocity to a gentle 1.0 max (normal gravity max is 4.0)
- Applies horizontal drag (0.9× per frame) for controlled descent
- Cancels all fall damage on landing
- Auto-closes when the worm touches ground
- Visual: white and red canopy rendered above the worm with suspension lines
- Sound: whoosh on open, soft thud on landing
- AI awareness: AI-controlled worms automatically deploy parachute when falling dangerously during post-explosion settling

## Camera

- Camera follows active worm with smooth lerp (0.08)
- Left-click drag, middle-click drag, or right-click drag to pan freely
- Panning disables auto-follow until: turn changes, worm moves with arrow keys, or F key is pressed
- F key immediately recenters on active worm
- Scroll wheel zooms in/out (0.3x - 2x range) when not aiming
- Pinch-to-zoom on touch devices: two-finger spread/pinch controls zoom, with simultaneous two-finger pan
- All UI elements (HUD, TeamPanel, Minimap, TouchControls) counter-scale with zoom to stay fixed in screen space — they maintain constant pixel size and position regardless of zoom level

## UI Overlays

### Left-Side HUD Panel
- Pinned to the left edge, vertically centered
- Structure (top to bottom): turn state/weapon info → 3×3 weapon grid → power bar → wind indicator
- Collapsible: click the toggle strip (◀/▶) to slide panel in/out
- Weapon tooltips appear to the right of hovered slots
- Frees up the entire bottom of the viewport for gameplay

### Team Health Panel
- Top-left corner, always visible
- Shows per-team aggregate HP with colored bars and numeric totals
- Active team highlighted with larger dot and white outline
- HP bars color-coded (green/yellow/red) matching individual worm bars

### Weapon Tooltip
- Appears when hovering over any weapon slot in the left HUD panel
- Shows weapon name+icon, damage, blast radius, and description
- Disappears when mouse leaves the weapon grid

### Minimap
- Top-right corner, 150×75px
- Terrain profile sampled from collision data
- Team-colored dots for all living worms
- White rectangle showing camera viewport
- Click to pan camera to that world position

### Touch Controls (Mobile)
- Only shown on touch devices
- D-pad (left, right, jump, parachute) on left side
- Action buttons (aim/fire, weapon cycle, next turn) on right side
- Movement buttons repeat-fire while held
- Parachute (🪂) button above jump button

## Wind

- Random value from -10 to +10 each turn
- Affects projectile weapons (bazooka, grenade, pigeon strike)
- Displayed as directional arrow on HUD
- Force factor: `wind × 0.02` applied per frame

## Turn Flow (Current: Sandbox)

1. Player selects weapon (1-8 or Q/E)
2. Click to start aiming
3. Adjust angle (mouse) and power (scroll)
4. Click to fire
5. Projectile resolves (physics, explosion, damage)
6. Press Enter for next turn (cycles to next worm, randomizes wind)

## Turn Timer

Configurable in Game Setup with 5 presets:

| Preset | Duration | Description |
|--------|----------|-------------|
| Blitz | 15s | Fast-paced |
| Quick | 30s | Short turns |
| Normal | 45s | Default |
| Relaxed | 60s | Extended |
| Unlimited | ∞ | No timer |

- Timer starts counting down when a turn begins
- At ≤5 seconds, a tick sound plays each second
- At 0 seconds, the turn auto-resolves (weapon canceled, turn ends)
- In unlimited mode, no timer is created and the HUD shows "⏱∞"

## Online Multiplayer Turn Flow

In online mode, turns are managed via Devvit Realtime API broadcasts:

1. Active player moves, aims, and fires (broadcasts `player-action` messages for each)
2. Remote player's client replays received actions in real-time
3. When the shot resolves, the active player broadcasts `turn-result` (worm snapshots + craters)
4. Remote client applies the turn result to synchronize state
5. After 2.5 seconds, the active player automatically broadcasts `turn-advance` with next turn index and wind
6. Both clients advance the turn from this single broadcast (preventing double-advance)

### Wind Synchronization
- Wind is generated by the active player during `requestNextTurn()` and included in the `turn-advance` message
- Both clients set wind from the broadcast, ensuring identical physics

### HUD in Online Mode
- Active player sees normal weapon/aim controls
- Waiting player sees "⏳ Opponent's Turn" with "Watching opponent play..."
- During remote fire: "💥 Opponent Firing..."
- After resolve: "✓ Turn Complete"

### Game Over
- When one team is eliminated, the active player broadcasts `game-over` with the winning team
- Both clients display "GAME OVER" with the winner's username
- Pressing ENTER or clicking the prompt disconnects from the Realtime channel and returns to ModeSelect

## Leaderboard

Player statistics are tracked per-post in Redis:
- **Wins**: Incremented for the winning team's player
- **Losses**: Incremented for all losing players
- **Games Played**: Incremented for all participants

Stats are recorded server-side when the `game-over` endpoint is called. The leaderboard sorts players by wins (descending), then losses (ascending).

## AI / CPU Opponent

When "VS CPU" is enabled in Game Setup, all non-player teams are controlled by the AI (`AIController`).

### Difficulty Levels

Selectable in Game Setup via the "AI LEVEL" row (visible only when VS CPU is ON):

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Coarse angle steps | 10 | 18 | 36 |
| Coarse power steps | 5 | 8 | 14 |
| Refinement pass | No | Yes (3×3, wide spread) | Yes (9×9, tight spread) |
| Angle jitter | ±0.20 rad | ±0.08 rad | ±0.01 rad |
| Power jitter | ±18 | ±8 | ±1 |
| Miss chance | 30% (+0.25 rad, +20 power) | 25% (+0.15 rad, +12 power) | 0% |
| Pick pool | Top 10 | Top 5 | Best only |
| Movement | Yes (30 steps, 25% chance) | Yes (50 steps, 45% chance) | Yes (40 steps, 55% chance) |
| Approach threshold | 500px | 400px | 350px |
| Rope usage | Never | When blocked or height-disadvantaged (8% random) | When blocked or height-disadvantaged (15% random) |
| Weapons | Bazooka, Grenade, Confetti Bomb | All (except Teleport) | All (except Teleport) |

### Miss Chance
On Easy and Medium difficulties, a percentage of shots receive an additional random offset on top of normal jitter, simulating intentional inaccuracy. This prevents the AI from being too dominant while still making intelligent decisions about weapon choice and positioning.

### Two-Pass Targeting (Medium/Hard)
1. **Coarse pass**: sweeps angles and power levels to find all shots that land near enemies
2. **Refinement pass**: fine-grained search around the best coarse hit for improved accuracy (Medium uses a wide 3×3 grid, Hard uses a tight 9×9 grid)

### Targeting Strategy
- The AI evaluates every enemy with every available weapon, simulating many angle/power combinations
- Each simulated shot uses the real projectile physics: weapon speed, gravity, wind force, bouncing, fuse timers
- Shots are scored by proximity to enemy, self-damage risk, friendly fire risk, kill potential, and direct-hit bonus
- The top candidates are kept; one is picked with difficulty-dependent jitter for human-like imperfection

### Weapon Selection
The AI selects weapons based on the tactical situation:
- **Banana Cannon/Blow Dart**: Used when enemies have clear line of sight (hitscan with direct hit detection)
- **Firecracker**: Used when very close to an enemy (< 80px) and no allies nearby
- **Grenade**: Preferred for short-range lobbing behind cover (bounce simulation)
- **Bazooka**: Default medium-to-long range projectile with wind compensation
- **Pigeon Strike**: Used when enemies are far away or behind terrain walls

### Movement
The AI proactively moves before shooting on a configurable percentage of turns. Movement triggers when:
- Enemy distance exceeds the approach threshold (500/400/350px by difficulty)
- No good shot exists from the current position (score < 40)
- Random chance based on difficulty (25%/45%/55%)

Movement behavior:
- **Direction**: Walks toward closest enemy by default. Retreats 40% of the time when enemy is very close (<60px). Occasionally flanks in a random direction.
- **Distance**: Scales with enemy proximity — full steps when far, 25% steps when close (<100px).
- **Jumping**: 15% random jump chance during walks, plus automatic jumps when terrain obstacles are detected ahead.
- **Re-evaluation**: After moving, the AI recalculates the best shot from its new position.

If no good shot exists even after moving, the AI falls back to firing a rough shot toward the nearest enemy.

### Rope Repositioning (Medium/Hard)
Before shooting, the AI evaluates whether to use the ninja rope for tactical repositioning. Rope usage triggers when:
- **Movement blocked**: Walls on both sides of the worm exceed climbable height
- **Height disadvantage**: Closest enemy is 120+ pixels above the current position
- **Opportunistic**: Random chance (15% hard, 8% medium) when the best available shot is weak (score < 30)

Rope execution:
1. `findRopeAngle()` simulates the rope projectile at 12 candidate angles, looking for terrain anchor points above and toward the nearest enemy
2. Anchors are scored by direction (favors toward enemy), height gain, and valid rope length range
3. The AI selects the ninja rope, aims at the chosen angle, fires, waits for attachment, swings for 2 seconds, then detaches
4. After detaching, the turn resolves normally (the rope uses the turn)

Easy AI never uses the ninja rope.

### Timing
- Think delay: 800ms before weapon selection
- Aim delay: 500ms before setting angle/power
- Fire delay: 300ms before firing
- Movement: 30ms per step (up to 50 steps = 1.5s of walk time on Medium)

## Rematch

In online multiplayer, when a game ends:
1. Both players see the game-over overlay with "GAME OVER" and the winner's name
2. A green REMATCH button appears below the "New Game" option
3. Clicking REMATCH calls `POST /api/game/rematch` which:
   - Creates a new lobby with a fresh code
   - Copies all players from the old game into the new lobby
   - Broadcasts a `rematch` message on the old channel
4. Both clients disconnect from the old channel and transition to the Lobby scene with the new code
5. Players can adjust settings and ready up for another game
