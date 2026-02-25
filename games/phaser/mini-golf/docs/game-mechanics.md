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
| Thickness | 18 design units |
| Visual style | Candy cane peppermint stripes with corner swirls |

## Hole Capture

Ball is captured when:
- Ball center within capture radius (20 design units) AND speed < 6.0
- Swept-path detection checks intermediate positions for fast-moving balls
- Attraction force applied within 40 units of hole center

## Visual Theme

- **Background**: Dark textured grass (0x14381f) with dense fiber-like elongated rectangles, scattered lighter highlights, directional edge vignette
- **Sparkles**: Mix of large diamond 4-point stars (5-13px with inner glow) and small cross sparkles
- **Fairway**: Rich green (0x2d8a4e) with visible inner border glow and secondary edge highlight
- **Walls**: Candy cane peppermint sticks — cream base with tight diagonal red parallelogram stripes, cylindrical center sheen, rounded peppermint swirl corner joints
- **HUD**: Bottom-anchored candy panel with red outer border, gold border line, inner gold + red accent, ornate gold banner with highlight gradient, peppermint swirl decorations, gumdrop icons, text stroke
- **Hole**: Black circle with darker depth ring, rim highlight, white rectangular flag with pole shadow and cap
- **Ball**: White with drop shadow, outer ring, bright top-left highlight, subtle bottom-right surface shadow, trail effect

## Scoring

| Term | Condition |
|------|-----------|
| Hole in One | 1 stroke |
| Eagle | 2+ under par |
| Birdie | 1 under par |
| Par | Equal to par |
| Bogey | 1 over par |
| +N | N over par |
