# Reddit Royale - Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Game Engine | Phaser 3.88.2 (WebGL) |
| Physics | Custom projectile physics (gravity + wind simulation) |
| Terrain | Bitmap collision mask (Uint8Array) + RenderTexture |
| Server | Express 5 on Devvit serverless |
| Storage | Devvit Redis |
| Realtime | Devvit Realtime API (WebSocket channels) |
| Platform | Devvit Web (Reddit custom posts) |

## Project Structure

```
games/phaser/worms/
├── src/
│   ├── client/
│   │   ├── splash.html              # Inline post entry (dark theme + Rambo Snoo)
│   │   ├── splash/                   # Splash screen (TS + CSS)
│   │   ├── public/rambo_snoo.png     # Mascot image (static asset)
│   │   └── game/
│   │       ├── game.ts              # Phaser config + bootstrap
│   │       ├── scenes/
│   │       │   ├── Boot.ts          # Asset loading init
│   │       │   ├── Preloader.ts     # Loading screen
│   │       │   ├── ModeSelect.ts    # Mode selection hub
│   │       │   ├── LobbyBrowser.ts  # Online lobby discovery
│   │       │   ├── Lobby.ts         # Multiplayer lobby
│   │       │   ├── GameSetup.ts     # Local game config
│   │       │   ├── CharacterSelect.ts # Character picker
│   │       │   └── GamePlay.ts      # Main game scene
│   │       ├── engine/
│   │       │   ├── TerrainEngine.ts  # Destructible terrain with grass tufts, texture noise, edge highlighting, cavern ceiling rendering
│   │       │   └── TerrainGenerator.ts # Procedural heightmap + ceiling map with ridged/plateaus/terraced/island/cavern modes
│   │       ├── entities/
│   │       │   └── Worm.ts          # Worm entity
│   │       ├── systems/
│   │       │   ├── AIController.ts   # Simulation-based CPU opponent AI (Easy/Medium/Hard) with proactive movement
│   │       │   ├── WeaponSystem.ts   # Weapon selection + firing
│   │       │   ├── ProjectileManager.ts # Projectile physics
│   │       │   ├── WindSystem.ts     # Per-turn wind
│   │       │   ├── ExplosionEffect.ts # Explosions + damage
│   │       │   ├── SoundManager.ts   # Audio system
│   │       │   └── MultiplayerManager.ts # Realtime API + lobby ops
│   │       └── ui/
│   │           ├── HUD.ts           # Heads-up display
│   │           ├── AimIndicator.ts  # Aim line + trajectory
│   │           ├── TeamPanel.ts     # Team health panel
│   │           ├── Minimap.ts       # Terrain overview
│   │           └── TouchControls.ts # Mobile input
│   ├── server/
│   │   ├── index.ts                 # Express routes + realtime broadcast
│   │   └── core/
│   │       ├── gameState.ts         # Redis state + lobby registry
│   │       └── post.ts             # Post creation helper
│   └── shared/
│       └── types/
│           ├── api.ts              # API types
│           ├── game.ts             # Game state types
│           ├── multiplayer.ts      # Lobby + realtime message types
│           ├── characters.ts       # Character definitions
│           ├── maps.ts             # 8 map presets with terrain styles and colors
│           ├── terrain.ts          # Terrain config types
│           └── weapons.ts          # Weapon definitions
├── devvit.json
├── package.json
└── docs/
```

## Data Flow

### Local Play
1. **Splash** (`splash.html`): Inline Reddit post with PLAY button
2. **Expand**: `requestExpandedMode('game')` opens `game.html`
3. **Phaser Boot**: Boot -> Preloader -> ModeSelect -> GameSetup -> CharacterSelect -> GamePlay
4. **GamePlay**: All logic runs locally, no server communication

### Online Play
1. **Splash -> ModeSelect -> LobbyBrowser**: Player creates/joins a lobby
2. **Lobby**: Players ready up, host configures settings
3. **Server**: `/api/lobbies/create` generates 6-char lobby code, stores in Redis
4. **Realtime**: All lobby members subscribe to `worms_lobby_{code}` channel
5. **Game Start**: Host triggers `game-start` broadcast, all clients transition to GamePlay
6. **Gameplay**: Active player's client runs physics, broadcasts actions/results via realtime

## Multiplayer Architecture

### Client-Authoritative Model
- Active player's client executes game logic (physics, damage)
- Actions and results are broadcast to other clients via Devvit Realtime API
- Other clients replay the actions for visual consistency
- Server persists lobby state and relays messages

### Lobby Code System
- 6-character alphanumeric codes (A-Z, 2-9, excluding ambiguous characters)
- Generated server-side with collision checking against Redis
- Multiple lobbies can exist per post
- Each lobby has its own realtime channel: `worms_lobby_{code}`

## Key Systems

### TerrainEngine
- Generates procedural heightmap via layered sine waves (seeded for determinism)
- Supports ridged, plateau, terraced, island, and cavern terrain modes per map preset
- Cavern mode: generates separate ceiling map with stalactite features, enforces min gap, renders ceiling with distinct darker coloring
- Maintains a `Uint8Array` collision mask (1 = solid, 0 = empty)
- Renders to Phaser `RenderTexture` with hash-noise texture variation, grass tufts, and edge highlighting
- Water plane rendering for maps with `waterLevel` (ocean, frozen lakes, lava)
- `carve(x, y, radius)` removes circular chunks for explosions

### WeaponSystem
- State machine: `idle -> aiming -> firing -> resolved`
- 8 weapons with distinct firing modes: projectile, hitscan, placed, targeted, teleport
- Manages aim angle and power
- Weapon selection via keyboard (1-8, Q/E) or HUD click

### ProjectileManager
- Simulates projectile physics (gravity, wind force, bouncing)
- Detects terrain collision via collision mask
- Triggers ExplosionEffect on impact or fuse expiry
- Cluster bomb sub-projectile spawning on detonation
- Teleport worm relocation with visual effects
- Hitscan raycast with direct worm hit detection (3000px range, 2px step, 16x22 hitbox)

### WindSystem
- Random wind value (-10 to +10) per turn
- Applies constant horizontal force to airborne projectiles

### ExplosionEffect
- Carves terrain, calculates distance-based damage falloff
- Particle effects, screen shake, floating damage numbers

### BackgroundRenderer
- Procedural decorative background elements drawn behind terrain (depth -5 to -8)
- Uses seeded RNG from terrain seed for deterministic rendering across clients
- Each of the 8 maps gets unique thematic decorations:
  - **Green Hills**: Sun, 3-layer rolling hill silhouettes, fluffy clouds, birds
  - **Island Chain**: Tropical sun with rays, distant island/palm silhouettes, cumulus clouds, sea birds
  - **Underground Cavern**: Glowing crystal clusters (cyan/purple/green/pink), ambient light spots, stalactite drip effects
  - **Flat Arena**: Sun, double tree line silhouettes, scattered clouds, birds
  - **Cliffside**: Snow-capped distant mountains, mist layers, wispy elongated clouds, eagles
  - **Desert Dunes**: Large sun with glow, mesa silhouettes, heat shimmer waves, cactus silhouettes, vultures
  - **Frozen Tundra**: 5-band aurora borealis, frozen peak silhouettes with snow highlights, snowflake particles
  - **Volcanic Ridge**: Lava glow on horizon, volcanic peak silhouettes, smoke columns, ember particles, dim stars
- Common helpers: `drawCloud`, `drawMountainRange`, `drawSunDisc`, `drawStars`, `drawBirds`, `drawTreeLine`

### MultiplayerManager
- Connects to Devvit Realtime API channels
- Static methods for lobby CRUD (create, join, find open)
- Instance methods for in-game actions (sendAction, sendTurnResult, etc.)
- All API calls include `lobbyCode` in the request body
