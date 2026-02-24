# Scattergories - Changelog

## [0.2.0] - 2026-02-24

### Fixed
- Single-player round progression now preserves state (used letters, used lists, total score, round number) across rounds — no more repeat letters/categories or score resets
- Multiplayer timer expiry now calls `finalizeRound()` on the server so rounds complete even if not all players submit manually
- Rematch now disconnects from the old lobby channel and reconnects to the new one via `resetForLobby()`
- GameOver screen no longer crashes on empty scores — derives winner from sorted array with fallback
- Post creation endpoint returns `navigateTo` URL (matching worms pattern) and proper error handling
- Server startup now binds to port with error handler (matching worms pattern)

### Hardened
- `createLobby()` API call now checks `res.ok` and throws on error, preventing undefined crashes
- LobbyBrowser actions (quick match, create, join) now await `ensurePostId()` before proceeding, fixing a race condition
- `/api/game/finalize-round` server endpoint now verifies the caller is a member of the lobby

Workflow: wf-1771955085

## [0.1.0] - 2026-02-24

### Added
- Initial game implementation with full Scattergories gameplay
- Single player mode with solo scoring (1 point per valid answer)
- Online multiplayer with lobby system (2-6 players)
  - Quick match, create lobby, join by code
  - Realtime lobby updates and game messaging
  - Server-authoritative scoring with duplicate detection
- 10 category lists with 12 categories each
- 20-letter pool (A-P, R-T, W) matching the classic die
- 3 rounds per game, 90 seconds per round
- Round results screen with answer comparison table
- Game over screen with final standings and medals
- Rematch functionality for multiplayer
- Persistent leaderboard (wins, total points, games played)
- Reconnection support for interrupted games
- Synthesized sound effects (select, tick, submit, reveal, etc.)
- Responsive UI with dark theme

### Technical
- Phaser 3.88.2 with RESIZE scale mode
- Express.js server with Redis state management
- Devvit Realtime for multiplayer communication
- DOM overlay text inputs for keyboard support
- Lobby TTL of 2 hours for automatic cleanup

Workflow: wf-1771949968
