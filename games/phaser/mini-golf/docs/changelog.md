# Changelog

## v0.0.2.22 - Physics Tuning & Course Playability (2026-02-25)

### Changed
- Slowed power meter oscillation from 1.8 Hz to 0.9 Hz for easier timing
- Reduced max shot velocity from 18 to 12 for more controllable shots
- Increased air friction from 0.035 to 0.04 for slower ball roll

### Fixed
- **Hole 2**: Redesigned from closed polygons trapping tee/cup to open L-shaped corridor
- **Hole 6**: Opened island walls and added bridge rails for water crossing
- **Hole 10**: Removed unimplemented thrusting_barrier obstacles, replaced with bumpers; fixed out-of-bounds friction zones
- **Hole 11**: Fixed ramp direction (was pushing ball away from cup, now pushes toward it)
- **Hole 15**: Fixed ramp direction (was pushing ball away from cup, now assists descent)
- **Hole 17**: Opened closed platforms and added bridge with rails through water zone

### Workflow
- Workflow ID: wf-1771986766

## v0.0.2 - Initial Release (2026-02-25)

### Added
- Complete 18-hole "Sugar Rush Retro Invitational" mini golf course
- Matter.js physics engine with tuned ball mechanics (restitution, friction, damping)
- Oscillating sine-wave power meter with directional arrow aiming
- 7 obstacle types: sand traps, ice zones, bumpers, water hazards, windmills, teleporters, ramps
- Conveyor belt zones with lateral force application
- Progressive difficulty across 3 segments (Fundamentals, Challenge, Mastery)
- Splash page with candy-themed design
- Main menu with play and leaderboard access
- Per-hole score display with golf terminology (Hole-in-One, Eagle, Birdie, Par, Bogey)
- Full 18-hole scorecard with color-coded scores
- Ball trail effect and sink particle animation
- Server-side stats tracking and leaderboard via Redis
- Devvit app integration (post creation, menu items)

### Workflow
- Workflow ID: wf-1771983071
