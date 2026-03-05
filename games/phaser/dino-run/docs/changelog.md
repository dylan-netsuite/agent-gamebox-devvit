# Changelog

## [2026-03-05] Initial Game Creation

**Workflow:** wf-20260305

Created the Dino Run (T-Rex Runner) game from scratch as a Devvit app.

### Features
- Endless side-scrolling runner with T-Rex dinosaur character
- Jump and duck controls (keyboard + touch)
- Four obstacle types: small cactus, large cactus, cactus group, pterodactyl
- Increasing speed with distance-based scoring
- Day/night cycle every 700 points
- All sprites generated procedurally (no external assets)
- Splash screen with high score display
- Fullscreen game with responsive layout
- Server-side score persistence with Redis
- Community leaderboard (top 20)
- Auto-post creation on app install
- Mod menu for manual post creation

### Files Created
- `src/client/` — Splash screen, game HTML/CSS, Phaser bootstrap
- `src/client/game/scenes/` — Boot, Preloader, MainMenu, DinoGame, GameOver, Leaderboard
- `src/client/game/utils/textures.ts` — Procedural texture generation (15 textures)
- `src/server/` — Express API with stats, score submission, leaderboard endpoints
- `src/shared/types/api.ts` — Shared TypeScript interfaces
- `devvit.json`, `package.json`, `tsconfig.json`, `eslint.config.js`
