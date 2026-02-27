# Meerca Chase - Changelog

## v0.0.1.13 - Tail Visibility Fix (2026-02-27)

### Fixed
- **Critical**: Tail segments now remain visible during gameplay. Previously, the `Meerca.move()` method added the old head position to the tail data array without creating a corresponding sprite, causing `tailSprites` to desync from `tail` and all tail sprites to be destroyed within 2 ticks.
- Tail collision detection now matches visual representation — players can see exactly where their tail is.

### Technical
- Modified `Meerca.move()` to create a new tail sprite via `createTailSprite()` and `unshift` it into `tailSprites` in sync with the tail data array addition.

Workflow: wf-1772161247

## v0.0.1 - Initial Release (2026-02-26)

### Added
- Complete Meerca Chase game based on the Neopets classic
- 6 Phaser scenes: Boot, Preloader, MainMenu, Game, GameOver, Leaderboard
- Grid-based snake movement with arrow key, WASD, and touch swipe controls
- 6 Negg types with weighted random spawning (Blue, Green, Yellow, Red, Rainbow, Fish)
- Score tracking with points popup and particle effects on collection
- Speed progression system (faster as score increases)
- Two difficulty levels: Classic and Hard
- Procedurally generated textures (Meerca head, tail, Neggs, grid)
- Neopets-inspired dark purple aesthetic with golden accents
- Animated splash screen with floating Negg decorations
- Server-side score persistence with Redis
- Leaderboard with top 20 scores and user rank
- Personal stats tracking (games played, high score, total Neggs)
- Reddit post creation on app install and via menu action
- Responsive UI that adapts to viewport size
- Input queue system for responsive direction changes
- Grace period at game start to prevent accidental death

### Technical
- Phaser 3.88.2 with WebGL rendering
- Express 5 server with Redis storage
- TypeScript strict mode throughout
- Vite build pipeline with Phaser chunking
- Zero console errors in production

Workflow: wf-1772143964
