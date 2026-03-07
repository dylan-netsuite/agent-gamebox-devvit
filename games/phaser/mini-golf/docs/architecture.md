# Architecture

## Tech Stack

- **Framework**: Phaser 3.88.2 with Matter.js physics
- **Platform**: Reddit Devvit (webview app)
- **Server**: Express 5 + Devvit Redis
- **Build**: Vite 6, TypeScript 5.8
- **Theme**: "Sugar Rush" retro confectionery aesthetic

## Project Structure

```
src/
  client/
    splash.html / splash/     -- Inline post card (splash page)
    game.html / game/         -- Fullscreen Phaser game
      scenes/                 -- Boot, Preloader, MainMenu, PlayerSetup, Game, HoleComplete, Scorecard
      objects/                -- GolfBall, AimArrow, PowerMeter, Hole, Walls, Obstacles
      data/                   -- 18-hole course definitions
      utils/                  -- Physics constants, transitions, coordinate helpers
  server/
    index.ts                  -- Express API (stats, leaderboard)
    core/post.ts              -- Reddit post creation
  shared/
    types/api.ts              -- Shared request/response types
    types/multiplayer.ts      -- PlayerInfo, MultiplayerConfig, MultiplayerScores, player colors
```

## Data Flow

1. User sees splash card in Reddit feed
2. Clicks PLAY -> `requestExpandedMode` switches to game.html
3. Phaser boots: Boot -> Preloader -> MainMenu
4. **Single player**: Player starts round from MainMenu -> Game scene loads hole data
5. **Multiplayer**: Player selects "LOCAL MULTIPLAYER" -> PlayerSetup scene (configure 2-4 players, names, colors) -> Game scene with turn-based pass-and-play
6. On round completion, Scorecard submits score via `POST /api/stats/submit` (single player only)
7. Server persists to Redis, updates leaderboard sorted sets

## Physics Engine

- Matter.js with zero gravity (top-down 2D)
- Ball: restitution 0.7, frictionAir 0.025
- Walls: static polygon bodies, restitution 0.7
- Bumpers: static circles, restitution 1.5
- Zones: sensor overlaps that modify ball frictionAir or apply forces
