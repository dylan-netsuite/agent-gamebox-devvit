# Meerca Chase - Changelog

## v0.0.1.20 - Bad Egg Visual Distinction (2026-02-27)

### Changed
- Fish Neggs (bad eggs, -5 points) now use a completely different visual treatment from good Neggs:
  - **Unique texture**: Spiky shape with X eyes and a frown instead of smooth egg
  - **Color change**: Red (#cc3333) instead of subtle gray (#607d8b) — pops against the dark purple background
  - **Red danger glow**: Larger, brighter, faster-pulsing red glow (vs. standard color glow)
  - **Jitter animation**: Aggressive shaking and scaling instead of gentle breathing pulse
  - **Point label**: Floating "-5" text above the Negg that bobs up and down
- Bad egg sprite is 13% larger than normal Neggs for additional visual weight
- All existing good Negg visuals are unchanged

### Technical
- Added `generateBadNegg()` to `TextureFactory` producing `negg-bad` texture with procedural spikes, X-mark eyes, and frown arc
- `Negg` constructor branches on `type.points < 0` to select texture, glow color, animation style, and spawn warning text
- `Negg.destroy()` properly cleans up the additional `warningText` game object and its tweens

Workflow: wf-1772162913

## v0.0.1.16 - Splash Screen Redesign (2026-02-27)

### Changed
- Complete splash screen redesign with animated Meerca snake chasing Neggs across a scrolling grid background
- CSS-drawn Meerca head with ears, eyes, and mouth followed by 5 tail segments on a looping path
- Colorful Negg trail (all 6 types) with pulsing glow animations along the snake's path
- Score popups (+1, +5, +2, +10) float upward on a timed loop to suggest gameplay action
- Scrolling purple checkerboard grid background matching the in-game aesthetic
- "MEERCA CHASE" split across two lines with bouncy drop animation
- "A NEOPETS CLASSIC" displayed as a purple pill badge
- High score fetched from server and displayed with animated count-up
- Personalized "Welcome back, {username}!" greeting
- "CHASE!" button with inline Negg icon and shimmer effect
- Helpful hint text: "Arrow keys to move • Collect Neggs • Avoid your tail"

Workflow: wf-1772161990

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
