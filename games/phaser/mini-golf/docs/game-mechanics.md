# Game Mechanics

## Design Space

All hole coordinates are defined in a 500x800 portrait design space, optimized for mobile Devvit webviews. The coordinate system scales uniformly to fit any viewport while maintaining aspect ratio.

## Course Structure

Currently 9 holes (Front 9 complete). Holes are added iteratively with high visual and gameplay quality.

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
Two isolated rectangular islands — bottom island (x:120-380, y:520-700) with the tee at x:250,y:640, and top island (x:120-380, y:60-280) with the cup at x:250,y:140. Island walls are U-shaped (open on the river-facing side) so the ball can exit/enter freely. The entire gap between islands (x:120-380, y:280-520) is a pink taffy river water hazard. If the ball enters the taffy zone (and is not on the bridge), it triggers a sinking animation (shrink + fade), a +1 stroke penalty, and resets the ball to the tee box. A wide, tall moving bridge (160x100 design units) oscillates vertically between y:500 and y:300 using smooth hermite easing at speed 0.8. The bridge is a visual-only safe zone (no physics body) — the ball passes through freely, and the water hazard is suppressed when the ball's position overlaps the bridge bounds. The player must time their shot to hit the bridge as it aligns with their trajectory. This is the player's first encounter with moving obstacles and water hazards, teaching patience and timing alongside power control.

### Hole 7: The Wafer Windmill (Par 3)
Classic retro mini-golf timing challenge. Straight rectangular fairway (x:150-350, y:60-700) with the tee at x:250,y:650 and cup at x:250,y:110. A massive 4-blade windmill is positioned dead center at x:250,y:380. The blades are 180 design units long — extending wall-to-wall across the 200-unit-wide fairway, completely blocking any safe path around them. Each blade is a kinematic Matter.js rectangle with restitution 1.5, meaning contact violently deflects the ball off course. The windmill rotates at 1.2 rad/s (~5.2 seconds per full rotation). Blades are rendered as wafer cookies with a tan/golden base, grid pattern, light/dark edges, and shadows. The center hub is chocolate-themed. The player must observe the rotation speed, mentally calculate the gap timing, and release their shot so the ball slips cleanly between two blades. This is a pure, distilled test of hand-eye coordination — an absolute staple of retro mini-golf.

### Hole 8: The Teleportation Tunnels (Par 3)
Puzzle-oriented hole with two physically separate walled areas. The tee box (x:150-350, y:540-700) is a small enclosed room with the tee at x:250,y:650. Three colored pipe entrances (Red at x:190, Blue at x:310, Green at x:250) are embedded in the upper portion of the tee box at y:590. The cup sits at x:250,y:160 in a completely separate walled exit area (x:100-400, y:60-320) that is physically unreachable without teleporting. Each pipe entrance is an overlap trigger that instantaneously teleports the ball to a corresponding exit, preserving the ball's exact scalar velocity. **Red pipe** exits at x:350,y:270 — pointing away from the hole, directly into a sand trap zone (x:300-395, y:220-315). **Blue pipe** exits at x:130,y:90 — into the top-left corner for chaotic wall bounces. **Green pipe** exits at x:250,y:240 — pointing perfectly straight at the cup for an effortless slow-rolling hole-in-one. The catch: a static chocolate block (40x20 design units) at x:250,y:610 partially obscures the Green pipe entrance, blocking direct shots. The player must bank the ball off the side wall to slip it past the block and into the Green pipe. This highly puzzle-oriented hole breaks the visual flow, forcing the player to view the screen holistically and deduce the correct bank angle through trial, error, and spatial memory.

### Hole 9: The Ice Cream Glide (Par 3)
S-curve course using diagonal wall geometry for bank-shot redirection. Tee at (100,700) bottom-left, cup at (400,350) right side mid-height. The outer boundary has diagonal corners (45° wall segments) at top-left and top-right that act as built-in reflectors, converting upward velocity to rightward and rightward to downward. The horizontal wall at y=450 is split into two segments (x:50→190 and x:225→450) with a narrow ~35-unit gap (x:190-225) that enables a difficult hole-in-one hero shot. Ice cream slick zones (0.012 frictionAir) cover only the left lane and top lane — rendered with enhanced glossy sheen (bright top highlight, secondary mid-sheen, diagonal gloss streak, white border outline, and colorful sprinkles) to clearly distinguish them from normal turf. The right lane descent has normal turf friction, requiring precise power control. A friction zone near the cup decelerates the ball for a puttable stop. Two rounded taffy water hazards: a large one at (300,480) on the right side below the wall that punishes shots missing the gap rightward, and a small one at (340,220) above the cup that punishes overshooting the approach. Both render with rounded corners and subtle wave ripple effects. One gumdrop bumper (1.8x restitution) at (420,310) adds risk on the cup approach. **Hole-in-one route**: aim up-right from the tee at full power to thread the narrow gap in the horizontal wall; the ball must then bank off the top-right diagonal wall and descend to the cup — requires pixel-perfect angle and maximum power. Birdie route: aim straight up with ~70% power → ball banks off both diagonal wall corners → lands in the upper course → precise second shot threading between the cup-side water hazard and bumper. Par 3 with careful navigation of the S-curve.

### Hole 10: The Sour Tongues (Par 4)
Narrow corridor gauntlet inspired by Candystand's "Sours" course. Tee at (250,720) bottom center, cup at (250,130) top center. The fairway is a claustrophobic 150-unit-wide corridor (x:175-325) flanked by deep sand trap gutters (x:72-175 left, x:327-428 right) that run the full length. Six kinematic "tongue" obstacles extend and retract from the corridor walls on sine-wave timers with alternating phases. Left tongues extend rightward, right tongues extend leftward. Each tongue is 100 design units long and 18 units thick, rendered as colorful sour candy with sugar crystal texture and HSL color cycling. Tongue speeds increase from 1.2 Hz (bottom pair) to 1.4 Hz (middle) to 1.6 Hz (top). When a tongue strikes the ball, it applies a lateral knockback force (5-8 units) perpendicular to the corridor, pushing the ball into the sand gutter where high friction (0.15 frictionAir) slows it dramatically. **Aggressive strategy**: full power straight up, requires the ball to pass all 6 tongues during their retracted phases — frame-perfect timing. **Conservative strategy (intended)**: 2-3 soft shots, laying up in the ~80-unit safe zones between tongue pairs, then timing the next shot. A friction zone near the cup decelerates the ball for the final putt. Par 4 with disciplined multi-stage timing.

## Tongue Obstacle Physics

| Property | Value |
|----------|-------|
| Motion | Sine-wave extension/retraction, `(sin(t * speed * 2π + phase) + 1) / 2` |
| Extension | 0 to full tongue length (100 design units) |
| Collision | AABB overlap check with ball radius |
| Knockback | Lateral force 5-8 units perpendicular to corridor |
| Push-out | Ball repositioned outside tongue bounds + ball radius + 2px |
| Cooldown | 300ms after hit to prevent rapid re-triggering |
| Visual | HSL color cycling sour candy body with rounded corners, white sugar crystal dots, dark outline |

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

## Windmill Physics

| Property | Value |
|----------|-------|
| Blade Count | 4 (90° apart) |
| Blade Length | 180 design units (wall-to-wall) |
| Blade Width | 10 design units |
| Rotation Speed | 1.2 rad/s (~5.2 seconds per full rotation) |
| Collision | Sensor bodies (no Matter.js collision). Manual overlap detection computes tangential + perpendicular knock velocity. Tangential speed: `min(ω × dist × 0.12, 6)`. Perpendicular knock force: 4 units. Ball is pushed clear of blade bounds on hit. |
| Hit Cooldown | 400ms per windmill — prevents repeated hits from the same windmill |
| Behavior | Sensor static bodies rotating around a center point. Each blade is repositioned and re-angled every frame using Matter.js setPosition/setAngle. Rotates in all game states so players can observe and time shots. Ball collision handled manually to avoid sticking. |
| Visual | Wafer cookie theme — tan/golden blades with grid pattern, light/dark edges, blade shadows, chocolate center hub with highlight |

## Moving Bridge Physics

| Property | Value |
|----------|-------|
| Dimensions | 160x100 design units |
| Speed | 0.8 (progress units per second) |
| Easing | Hermite smoothstep: t²(3-2t) |
| Behavior | Visual-only safe zone oscillating between startY and endY. No physics body — ball passes through freely. Water hazard is suppressed when ball position overlaps bridge bounds. Updates every frame in all game states. |
| Visual | Brown plank bridge with dividing lines, top highlight, bottom shadow, and side rails |

## Water Hazard (Taffy River) Physics

| Property | Value |
|----------|-------|
| Penalty | +1 stroke |
| Reset | Ball returns to the tee box |
| Animation | Ball shrinks to 30% scale and fades to 0 alpha over 500ms before reset |
| Visual | Rounded-rect shape (30% corner radius), tileable 256x256 pink taffy texture with flowing sine-wave patterns, glossy sheen, sugar crystal sparkle, subtle white wave ripple lines, and a gloss highlight in the top-left corner |
| Behavior | Overlap trigger zone — triggers penalty and reset unless ball is on a bridge body. Bridge collision check uses body position + ball radius for tolerance. |

## Teleporter Pipe Physics

| Property | Value |
|----------|-------|
| Entry Zone | Rectangular overlap trigger (28x28 screen pixels, from 14 design unit radius) |
| Behavior | When ball center enters the entry rectangle, ball position is instantly set to the exit coordinates. If `exitAngle` is defined, ball exits at that fixed angle with preserved speed (minimum 1.5). Otherwise, velocity (vx, vy) is preserved exactly. |
| Exit Angles | Red: `π` (left into sand trap), Blue: `π*0.75` (down-left, far from hole), Green: `-π/2` (straight up toward hole) |
| Cooldown | 30 frames (~0.5s at 60fps) — prevents immediate re-triggering after teleport |
| Visual | Colored circle endpoints with dark outer ring, colored fill, dark center hole, specular highlight, white stroke ring. Multi-segment cubic Bezier pipe chains (12 waypoints, 4 segments per pipe) connect entry to exit with four rendering layers (dark outline, gray mid-tone, colored fill, white highlight). Each pipe takes a unique route that crosses over other pipes, creating a visually confusing tangle. |
| Colors | Red (0xff3333), Blue (0x3399ff), Green (0x33cc33) |

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
