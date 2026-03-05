# Changelog

## [2026-03-05] Difficulty & Visual Overhaul

**Workflow:** wf-20260305b

Made the game significantly harder and added extensive visual effects.

### Difficulty
- Initial speed 320→420, max speed 900→1200, increment +25→+45 per 100 pts
- Gravity 1600→2200, jump velocity -620→-780 (tighter windows)
- Min obstacle gap 300→200, tighter gap formula
- Combo spawns: 30% chance of double obstacles after score 400
- Pterodactyls appear at score 100 (was 200), more frequent after 600
- Night toggle every 500 pts (was 700)

### Visual Effects
- Running dust particle trail behind dino
- Jump dust burst + landing squash/stretch + impact ring
- Death sequence: camera shake + red flash + dino bounce + 15 debris particles
- Speed lines streaming across screen when speed > 600 px/s
- Parallax mountain silhouettes at 8% scroll speed
- Enhanced night mode: crescent moon, 18 twinkling stars, tinted mountains
- Camera flash on day/night transitions
- Score milestone flash: scale 1.4x + orange color every 100 pts
- GameOver panel slides down with score count-up animation
- "NEW HIGH SCORE!" pulsing text on new records

### New Textures (6 added, 21 total)
- `dust`, `debris`, `speed-line`, `mountains`, `moon`, `impact-ring`

### Files Modified
- `src/client/game/utils/textures.ts` — 6 new procedural textures
- `src/client/game/scenes/Game.ts` — complete rewrite with effects + harder difficulty
- `src/client/game/scenes/GameOver.ts` — animated panel, score count-up, pulsing high score

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
