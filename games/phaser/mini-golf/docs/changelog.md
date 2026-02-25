# Changelog

## v0.0.2.26 - Difficulty Tuning Pass (2026-02-25)

### Changed
- Increased max shot velocity from 12 to 18 so ball can reach cups on long holes
- Reduced air friction from 0.04 to 0.025 for longer ball rolls
- Raised ball stop velocity from 0.08 to 0.12 to prevent endless slow rolling
- Raised capture velocity threshold from 5.0 to 6.0 for more forgiving sinks
- Increased speed clamp multiplier from 1.2x to 1.5x to preserve momentum after bumper bounces
- **Hole 4**: Spread bumpers apart (320/480/400 instead of 350/450/400) and reduced radii from 20 to 14
- **Hole 5**: Fixed ramp direction from forceY:3 (pushing away from cup) to forceY:-2 (boosting toward cup)
- **Hole 6**: Widened bridge from 40 to 60 units (370-430)
- **Hole 7**: Reduced windmill to 3 blades (from 4), shorter blades (60 vs 70), slower speed (1.0 vs 1.5)
- **Hole 9**: Shortened zig-zag walls (gaps at y:350 instead of y:400), raised par from 4 to 5
- **Hole 13**: Reduced par from 4 to 3 (cup is only 220 units from tee)
- **Hole 14**: Reduced par from 4 to 3 (gravity wells aren't implemented yet)
- **Hole 15**: Removed 4 plinko pegs (12→8), widened row spacing, reduced ramp force from 1.5 to 0.8
- **Hole 17**: Widened bridge from 40 to 60 units, reduced par from 4 to 3
- **Hole 18**: Widened bridge from 60 to 80 units, slowed windmill from 2.5 to 1.5, shortened blades from 60 to 55

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
