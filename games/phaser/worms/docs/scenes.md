# Worms - Phaser Scenes

## Scene Flow

```
Boot → Preloader → GameSetup → CharacterSelect → GamePlay
                                    ↑                  │
                                    └──── (Enter) ─────┘
```

## Boot (`scenes/Boot.ts`)

Minimal scene that immediately starts the Preloader.

## Preloader (`scenes/Preloader.ts`)

Displays a loading screen with progress bar, then transitions to GameSetup.

## GameSetup (`scenes/GameSetup.ts`)

Pre-game configuration screen. Players set:

| Option | Values | Default |
|--------|--------|---------|
| Teams | 2–4 | 2 |
| Worms Per Team | 1–3 | 2 |
| Map | Green Hills, Island Chain, Cavern, Flatlands, Cliffs | Green Hills |
| Timer | 15s Blitz, 30s Quick, 45s Normal, 60s Relaxed, ∞ Unlimited | 45s Normal |
| VS CPU | ON / OFF | OFF |
| Sound | ON / OFF | ON |

Exports `GameConfig` interface consumed by CharacterSelect and GamePlay.

## CharacterSelect (`scenes/CharacterSelect.ts`)

3×2 portrait grid for choosing a character skin per team. AI teams auto-pick randomly. Passes full `GameConfig` to GamePlay.

## GamePlay (`scenes/GamePlay.ts`)

The main game scene. Manages all gameplay systems.

### Initialization (`create`)

1. Draws sky gradient background
2. Creates `TerrainEngine` with random seed
3. Spawns 4 worms at evenly-spaced positions
4. Initializes systems: `WindSystem`, `ExplosionEffect`, `ProjectileManager`, `WeaponSystem`
5. Creates UI: `AimIndicator`, `HUD`
6. Sets up camera bounds and input handlers

### Systems Owned

| System | Purpose |
|--------|---------|
| `TerrainEngine` | Destructible terrain rendering + collision |
| `WindSystem` | Per-turn wind value |
| `ExplosionEffect` | Explosion visuals + damage calculation |
| `ProjectileManager` | Projectile physics + lifecycle |
| `WeaponSystem` | Weapon selection + aim + fire state machine |
| `AimIndicator` | Visual aim line + trajectory preview |
| `HUD` | Weapon selector, power bar, wind display, state text, weapon tooltip |
| `TeamPanel` | Aggregate team HP bars in top-left corner |
| `Minimap` | Terrain + worm overview in top-right corner |
| `TouchControls` | Virtual D-pad and action buttons (mobile only) |

### Update Loop

1. Handle worm movement (arrow keys, only in `idle` state)
2. Update aim display (when in `aiming` state)
3. Update projectile physics
4. Update worm gravity/falling
5. Update HUD (weapon slots, power, wind, state text, timer, weapon tooltip)
6. Update TeamPanel (aggregate HP per team)
7. Update Minimap (terrain, worm positions, camera viewport)

### Input Handling

- Keyboard: weapon selection (1-5, Q/E), movement (arrows), aim/fire (Space), turn advance (Enter), cancel (Escape), recenter camera (F)
- Mouse: aim angle (move), fire (click-release), power (scroll wheel while aiming), camera zoom (scroll while idle)
- Camera panning: left-click drag (idle/resolved only), middle-click drag, right-click drag
- Left-click uses a 6px drag threshold to distinguish panning from clicking to aim/fire
- Touch: pinch-to-zoom (two-finger spread/pinch) with simultaneous two-finger pan via raw DOM touch events
- Panning disables auto-follow; F key or turn change re-enables it
