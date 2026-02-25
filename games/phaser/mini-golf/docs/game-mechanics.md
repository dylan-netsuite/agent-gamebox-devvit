# Game Mechanics

## Course Structure

Currently 1 hole. Holes will be added iteratively with high visual and gameplay quality.

### Hole 1: The Vanilla Straightaway (Par 2)
Simple straight vertical rectangle. No obstacles. Full-power straight shot = hole-in-one. Slight miss = easy tap-in par 2. Designed as a calibration hole for the power meter.

## Controls

### Aiming Phase
- Move pointer/finger to aim the directional arrow
- Arrow points from ball toward pointer position
- Dotted line extends beyond arrow to show trajectory

### Power Phase
- Click/tap and hold to start power meter
- Power bar oscillates using sine wave at ~0.9 Hz (full cycle ~1.1s)
- Arrow color shifts from blue (low power) to red (max power)

### Shot Execution
- On release, sine value sampled as power (0-1)
- Impulse applied: `power * MAX_SHOT_VELOCITY * scale * direction_vector`
- Inputs locked during simulation

## Ball Physics

| Property | Value |
|----------|-------|
| Radius | 8 (design units) |
| Restitution | 0.6 |
| Friction | 0.03 |
| FrictionAir | 0.025 |
| Stop threshold | 0.12 velocity |
| Max shot velocity | 18 |
| Speed clamp | 1.5x max velocity |

## Wall Physics

| Property | Value |
|----------|-------|
| Restitution | 0.7 |
| Friction | 0.1 |
| Thickness | 14 design units |
| Visual style | Candy cane peppermint stripes |

## Hole Capture

Ball is captured when:
- Ball center within capture radius (20 design units) AND speed < 6.0
- Swept-path detection checks intermediate positions for fast-moving balls
- Attraction force applied within 40 units of hole center

## Visual Theme

- **Background**: Dark textured grass (0x1a472a) with procedural noise dots
- **Sparkles**: 30 twinkling 4-point star particles
- **Fairway**: Rich green (0x2d8a4e) with lighter inner border (0x3da85e)
- **Walls**: Candy cane peppermint sticks — white base with diagonal red parallelogram stripes
- **HUD**: Bottom-anchored candy panel with gold banner, peppermint swirl decorations, gumdrop icons
- **Hole**: Black circle with white flag on pole
- **Ball**: White with subtle highlight and trail effect

## Scoring

| Term | Condition |
|------|-----------|
| Hole in One | 1 stroke |
| Eagle | 2+ under par |
| Birdie | 1 under par |
| Par | Equal to par |
| Bogey | 1 over par |
| +N | N over par |
