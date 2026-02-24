# Scattergories - Changelog

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
