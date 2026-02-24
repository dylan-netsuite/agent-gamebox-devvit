# Reddit Royale - Phaser Scenes

## Scene Flow

```
Boot → Preloader → ModeSelect → [branch]
                                  ├── GameSetup → CharacterSelect → GamePlay
                                  │       ↑                            │
                                  │       └──────── (Game Over) ───────┘
                                  ├── LobbyBrowser → Lobby → GamePlay ──→ Lobby (Rematch)
                                  │       ↑              │
                                  │       └── (ESC) ──────┘
                                  └── Leaderboard
```

## Boot (`scenes/Boot.ts`)

Minimal scene that immediately starts the Preloader.

## Preloader (`scenes/Preloader.ts`)

Displays a loading screen with progress bar while loading character portraits. After loading, calls `/api/reconnect` to check if the user has an active lobby:

- **Active lobby (waiting)**: Skips ModeSelect, goes directly to Lobby scene
- **Active lobby (playing)**: Skips to GamePlay with stored game config
- **No active lobby**: Transitions to ModeSelect as normal

## ModeSelect (`scenes/ModeSelect.ts`)

Mode selection hub. Three buttons:

| Mode | Description | Destination |
|------|-------------|-------------|
| Single Player | Battle against CPU opponents | GameSetup (vsCPU forced ON) |
| Local Multiplayer | Pass & play on one device | GameSetup (vsCPU OFF) |
| Online Play | Play with others in real-time | LobbyBrowser |
| Leaderboard | View top players | Leaderboard |

## Leaderboard (`scenes/Leaderboard.ts`)

Displays a ranked table of players sorted by wins. Fetches data from `GET /api/leaderboard`.

| Column | Content |
|--------|---------|
| # | Rank (medals for top 3: 🥇🥈🥉) |
| PLAYER | Username (truncated to 16 chars) |
| W | Total wins |
| L | Total losses |
| GP | Games played |

Shows "No games played yet!" when the leaderboard is empty. ESC returns to ModeSelect.

## LobbyBrowser (`scenes/LobbyBrowser.ts`)

Online lobby discovery and creation. Three options:

| Option | Behavior |
|--------|----------|
| Quick Match | Finds a random open lobby and auto-joins, or creates one if none exist |
| Create Lobby | Creates a new lobby with a unique 6-character code |
| Join by Code | 6-character input field + JOIN button to join a specific lobby |

Keyboard input captures alphanumeric characters for the code field. ESC returns to ModeSelect.

## Lobby (`scenes/Lobby.ts`)

Online multiplayer lobby. Displays:

- Prominent lobby code in a bordered box (e.g., "W J V 6 4 T")
- "Share this code with friends!" hint
- 4 player slots with team color, username, character, and ready status
- Host-only game settings (map, timer, worms per team, character)
- READY/UNREADY toggle and START GAME button (host only)

Subscribes to realtime `lobby-update` and `game-start` messages. On game start, transitions to GamePlay with multiplayer config. ESC returns to LobbyBrowser.

## GameSetup (`scenes/GameSetup.ts`)

Pre-game configuration screen for local play. Accepts optional `forceVsCPU` flag from ModeSelect.

| Option | Values | Default |
|--------|--------|---------|
| Teams | 2-4 | 2 |
| Worms Per Team | 1-3 | 2 |
| Map | Green Hills, Island Chain, Cavern, Flat Arena, Cliffside, Desert Dunes, Frozen Tundra, Volcanic Ridge | Green Hills |
| Timer | 15s Blitz, 30s Quick, 45s Normal, 60s Relaxed, Unlimited | 45s Normal |
| VS CPU | ON / OFF | Set by ModeSelect |
| AI Level | Easy / Medium / Hard | Medium (visible only when VS CPU is ON) |
| Sound | ON / OFF | ON |

Exports `GameConfig` interface (including `aiDifficulty`) consumed by CharacterSelect and GamePlay. ESC returns to ModeSelect.

## CharacterSelect (`scenes/CharacterSelect.ts`)

3x2 portrait grid for choosing a character skin per team. AI teams auto-pick randomly. Passes full `GameConfig` to GamePlay.

## GamePlay (`scenes/GamePlay.ts`)

The main game scene. Manages all gameplay systems. Supports both local and online modes.

### Local vs Online

| Aspect | Local | Online |
|--------|-------|--------|
| MultiplayerManager | null | Instance from Lobby |
| Input control | All teams | Only local team |
| Actions | Local only | Broadcast via realtime |
| Turn advance | Local only | Server-coordinated |

### Initialization (`create`)

1. Draws sky gradient background
2. Draws procedural background decorations via `BackgroundRenderer` (map-specific)
3. Creates `TerrainEngine` with seed (random for local, shared for online)
4. Draws water plane (for maps with water/lava)
5. Spawns worms at evenly-spaced positions
6. Initializes systems: `WindSystem`, `ExplosionEffect`, `ProjectileManager`, `WeaponSystem`
7. Creates UI: `AimIndicator`, `HUD`, `TeamPanel`, `Minimap`, `TouchControls`
8. Pre-creates hidden game-over overlay container
9. Sets up dedicated UI camera via `setupUICamera()` (main camera ignores UI, UI camera ignores world objects)
10. Sets up camera bounds and input handlers
11. If online: sets up multiplayer message listeners

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
| `BackgroundRenderer` | Procedural decorative backgrounds per map (one-shot, depth -5 to -8) |
| `MultiplayerManager` | Realtime channel connection + API calls (online only) |

### Rematch Flow (Online)

After game over in online mode, a REMATCH button appears alongside the "New Game" option. When clicked, the host's client calls `POST /api/game/rematch` which creates a new lobby, copies all players, and broadcasts a `rematch` message on the old channel. Both clients transition to the Lobby scene with the new lobby code.
