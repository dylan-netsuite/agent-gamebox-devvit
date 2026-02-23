# Worms - Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser 3.88.2 (WebGL) |
| Physics | Custom projectile physics (gravity + wind simulation) |
| Terrain | Bitmap collision mask (Uint8Array) + RenderTexture |
| Server | Express 5 on Devvit serverless |
| Storage | Devvit Redis |
| Platform | Devvit Web (Reddit custom posts) |

## Project Structure

```
games/phaser/worms/
├── src/
│   ├── client/
│   │   ├── splash.html              # Inline post entry
│   │   ├── splash/                   # Splash screen (TS + CSS)
│   │   └── game/
│   │       ├── game.ts              # Phaser config + bootstrap
│   │       ├── scenes/
│   │       │   ├── Boot.ts          # Asset loading init
│   │       │   ├── Preloader.ts     # Loading screen
│   │       │   └── GamePlay.ts      # Main game scene
│   │       ├── engine/
│   │       │   ├── TerrainEngine.ts  # Destructible terrain
│   │       │   └── TerrainGenerator.ts # Procedural heightmap
│   │       ├── entities/
│   │       │   └── Worm.ts          # Worm entity
│   │       ├── systems/
│   │       │   ├── WeaponSystem.ts   # Weapon selection + firing
│   │       │   ├── ProjectileManager.ts # Projectile physics
│   │       │   ├── WindSystem.ts     # Per-turn wind
│   │       │   └── ExplosionEffect.ts # Explosions + damage
│   │       └── ui/
│   │           ├── HUD.ts           # Heads-up display (clickable weapon selector, power/wind panels)
│   │           └── AimIndicator.ts  # Aim line + trajectory
│   ├── server/
│   │   ├── index.ts                 # Express routes
│   │   └── core/
│   │       ├── gameState.ts         # Redis game state CRUD
│   │       └── post.ts             # Post creation helper
│   └── shared/
│       └── types/
│           ├── api.ts              # API types
│           ├── game.ts             # Game state types
│           ├── terrain.ts          # Terrain config types
│           └── weapons.ts          # Weapon definitions
├── devvit.json
├── package.json
└── docs/
```

## Data Flow

1. **Splash** (`splash.html`): Inline Reddit post with PLAY button
2. **Expand**: `requestExpandedMode('game')` opens `game.html`
3. **Phaser Boot**: Boot → Preloader → GamePlay scene chain
4. **GamePlay**: Initializes terrain, worms, weapon systems, HUD
5. **Server**: `/api/init` returns game state; `/api/game/state` for polling

## Key Systems

### TerrainEngine
- Generates procedural heightmap via layered sine waves (seeded for determinism)
- Maintains a `Uint8Array` collision mask (1 = solid, 0 = empty)
- Renders to Phaser `RenderTexture` with grass/dirt layers
- `carve(x, y, radius)` removes circular chunks for explosions

### WeaponSystem
- State machine: `idle → aiming → firing → resolved`
- 5 weapons with distinct firing modes: projectile, hitscan, placed, targeted
- Manages aim angle and power
- Weapon selection via keyboard (1-5, Q/E) or HUD click

### ProjectileManager
- Simulates projectile physics (gravity, wind force, bouncing)
- Detects terrain collision via collision mask
- Triggers ExplosionEffect on impact or fuse expiry

### WindSystem
- Random wind value (-10 to +10) per turn
- Applies constant horizontal force to airborne projectiles

### ExplosionEffect
- Carves terrain, calculates distance-based damage falloff
- Particle effects, screen shake, floating damage numbers
