# Game Mechanics

## Design Space

All hole coordinates are defined in a 500x800 portrait design space, optimized for mobile Devvit webviews. The coordinate system scales uniformly to fit any viewport while maintaining aspect ratio.

## Course Structure

Currently 6 holes. Holes are added iteratively with high visual and gameplay quality.

### Hole 1: The Vanilla Straightaway (Par 2)
Simple straight vertical rectangle (x:150-350, y:60-740). No obstacles. Full-power straight shot = hole-in-one. Slight miss = easy tap-in par 2. Designed as a calibration hole for the power meter.

### Hole 2: The Licorice Dogleg (Par 2)
L-shaped course with a vertical corridor (x:120-280, y:250-750) bending 90 degrees right into a horizontal corridor (x:120-420, y:80-250). A licorice wall partially blocks the inner bend. A 45-degree chocolate block in the upper-left corner reflects the ball toward the cup. Aim at the block with ~75% power for a bank-shot approach. Introduces calculated bank shots and geometric physics.

### Hole 3: The Gumdrop Bumper Pinball (Par 3)
Wide rectangular arena (x:80-420, y:60-740). Three gumdrop bumpers arranged in a semi-circle arc guard the cup at the top. Bumpers have restitution 1.8 (hyper-elastic) — hitting them sends the ball ricocheting away faster than it arrived, like pinball bumpers. Strategy: thread the microscopic gaps between bumpers with minimal power, or bank multi-angle shots around the perimeter walls. Full-power direct hits result in chaotic rebounds back to the tee. Teaches players that distinct obstacle textures signal different physics behaviors.

### Hole 4: The Graham Cracker Divide (Par 3)
Branching-path layout (x:80-420, y:60-740) with a center divider island (x:110-310, y:150-620) creating two routes. The tee (x:95), needle channel (x:80-110, 30px design / ~12px effective physics gap), and cup (x:95) are all on the same vertical line — a perfect straight shot threads the needle for a hole-in-one, but with only ~6px clearance per side, any angular error clips the wall and bounces into the graham cracker sand trap. The right path is 110px wide (x:310-420) with two 45-degree chocolate block corner bumpers (70x30, same style as Hole 2) tucked into the top-right and bottom-right wall corners that ricochet the ball at 90 degrees, making it a safe two- or three-putt route. The center divider is a graham cracker sand trap — entering it dramatically increases friction air (0.15, 6x normal), stopping the ball dead.

### Hole 5: The Jawbreaker Wedge (Par 3)
Funnel-shaped fairway (x:150-350 wide bottom at y:420-740, narrowing to x:190-310 at y:320, continuing as a narrow corridor to y:60). A ramp zone (x:190-310, y:300-420) applies a constant downward force (forceY:2.25, multiplied by 0.0001 per frame) simulating uphill gravity. The ball must have ~70-80% power to overcome the ramp force and crest the hill. Too little power and the ball decelerates, stops, and rolls back down. Too much power and the ball overshoots the shallow plateau (only 120px from ramp top to back wall at y:60), strikes the back wall, and bounces back down the ramp. The cup sits at x:250, y:140 on the plateau. Visually, the ramp zone features colorful horizontal jawbreaker candy stripes with glossy per-stripe highlights, sugar crystal sparkle, and rainbow-colored upward-pointing chevrons. Teaches precise power meter modulation — players must abandon the "always hit 100%" strategy.

### Hole 6: The Taffy River (Par 3)
Two isolated rectangular islands — bottom island (x:120-380, y:520-740) with the tee at x:250,y:680, and top island (x:120-380, y:60-280) with the cup at x:250,y:140. The entire gap between islands (x:120-380, y:280-520) is a pink taffy river water hazard. If the ball enters the taffy zone, it triggers a sinking animation (shrink + fade), a +1 stroke penalty, and resets the ball to the last stroke position. A narrow moving bridge (80x20 design units) oscillates vertically between y:500 and y:300 using smooth hermite easing at speed 0.8. The bridge is a kinematic Matter.js body that physically supports the ball — the player must time their shot to hit the bridge as it aligns with their trajectory. This is the player's first encounter with moving obstacles and water hazards, teaching patience and timing alongside power control.

## Play Modes

### Full 18
Play all holes in sequence from Hole 1 to the last available hole.

### Front 9 / Back 9
Play holes 1-9 or 10-18 as separate rounds (available when 10+ holes exist).

### Practice
Select any individual hole from the MainMenu to play it as a single-hole round.

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
| Max shot velocity | 25 |
| Speed clamp | 1.5x max velocity |

## Wall Physics

| Property | Value |
|----------|-------|
| Restitution | 0.7 |
| Friction | 0.1 |
| Thickness | 18 design units |
| Visual style | Candy cane peppermint stripes with corner swirls |

## Gumdrop Bumper Physics

| Property | Value |
|----------|-------|
| Restitution | 1.8 (hyper-elastic) |
| Shape | Circle, radius 22 design units |
| Behavior | Static body, pinball-style bounce |
| Visual | `gumdrop` texture with per-bumper color tinting |

## Sand Trap (Graham Cracker) Physics

| Property | Value |
|----------|-------|
| Friction Air | 0.15 (6x normal) |
| Visual | Graham cracker tileable texture (128x128, sandy tan with crumb fragments and crack lines) |
| Behavior | Overlap trigger zone — dramatically slows the ball when it enters |
| Strategy | Avoid at all costs; escaping requires near-full power |

## Ramp (Jawbreaker) Physics

| Property | Value |
|----------|-------|
| Force multiplier | 0.0001 per frame |
| Typical forceY | 2.25 (= 0.000225 effective downward force) |
| Visual | Jawbreaker tileable texture (128x128, concentric colored rings) with upward-pointing chevrons |
| Behavior | Overlap trigger zone — applies constant force opposing ball movement, simulating uphill gravity |
| Strategy | Hit with ~75-85% power to crest; too much overshoots into back wall |

## Moving Bridge Physics

| Property | Value |
|----------|-------|
| Restitution | 0.3 |
| Friction | 0.8 |
| Dimensions | 80x20 design units |
| Speed | 0.8 (progress units per second) |
| Easing | Hermite smoothstep: t²(3-2t) |
| Behavior | Kinematic static body oscillating between startY and endY. Updates every frame in all game states so players can observe and time shots. |
| Visual | Brown plank bridge with dividing lines, top highlight, bottom shadow, and side rails |

## Water Hazard (Taffy River) Physics

| Property | Value |
|----------|-------|
| Penalty | +1 stroke |
| Reset | Ball returns to last stroke position |
| Animation | Ball shrinks to 30% scale and fades to 0 alpha over 500ms before reset |
| Visual | Tileable 256x256 pink taffy texture with flowing sine-wave patterns, glossy sheen, and sugar crystal sparkle |
| Behavior | Overlap trigger zone — any ball contact triggers immediate penalty and reset |

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
