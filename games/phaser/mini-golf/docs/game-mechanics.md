# Game Mechanics

## Design Space

All hole coordinates are defined in a 500x800 portrait design space, optimized for mobile Devvit webviews. The coordinate system scales uniformly to fit any viewport while maintaining aspect ratio.

## Course Structure

Currently 2 holes. Holes are added iteratively with high visual and gameplay quality.

### Hole 1: The Vanilla Straightaway (Par 2)
Simple straight vertical rectangle (x:150-350, y:60-740). No obstacles. Full-power straight shot = hole-in-one. Slight miss = easy tap-in par 2. Designed as a calibration hole for the power meter.

### Hole 2: The Licorice Dogleg (Par 2)
L-shaped course with a vertical corridor (x:120-280, y:250-750) bending 90 degrees right into a horizontal corridor (x:120-420, y:80-250). A licorice wall partially blocks the inner bend. A 45-degree chocolate block in the upper-left corner reflects the ball toward the cup. Aim at the block with ~75% power for a bank-shot approach. Introduces calculated bank shots and geometric physics.

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

All visual textures are generated programmatically at boot time using `TextureFactory` (HTML5 Canvas 2D API) and rendered via Phaser's sprite/image/tileSprite system.

- **Background**: Tileable 256x256 grass texture (`grass-bg`) with layered noise and organic variation, overlaid with a radial gradient vignette (`vignette`)
- **Sparkles**: 4 pre-rendered sparkle sprites (`sparkle` — 4-point star with center glow) animated via tweens (scale + alpha pulse), positioned in dark background areas
- **Fairway**: Clean solid green fill (0x2d8a4e) with single lighter-green stroke border (0x3aad5c)
- **Walls**: Tileable candy cane texture (`candy-cane` — 64x32, smooth diagonal red/white stripes with cylindrical shading) rendered as `TileSprite` per segment. Corner joints use peppermint swirl sprites (`candy-cane-corner` — 36x36, alternating red/white wedges with radial highlight)
- **HUD**: Bottom-anchored candy panel with red/gold/brown layers, peppermint swirl corner sprites, ornate gold banner, gumdrop icons, text stroke
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
