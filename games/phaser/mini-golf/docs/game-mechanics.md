# Game Mechanics

## Design Space

All hole coordinates are defined in a 500x800 portrait design space, optimized for mobile Devvit webviews. The coordinate system scales uniformly to fit any viewport while maintaining aspect ratio.

## Course Structure

Currently 13 holes. Holes are added iteratively with high visual and gameplay quality.

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
Narrow corridor gauntlet inspired by Candystand's "Sours" course. Tee at (250,720) bottom center, cup at (250,130) top center. The fairway is a claustrophobic 150-unit-wide corridor (x:175-325) flanked by deep sand trap gutters (x:72-175 left, x:327-428 right) that run the full length. Six kinematic "tongue" obstacles extend and retract from the corridor walls on sine-wave timers with alternating phases. Left tongues extend rightward, right tongues extend leftward. Each tongue is 80 design units long and 18 units thick (leaving 70 units of clearance when fully extended), rendered as colorful sour candy with sugar crystal texture and HSL color cycling. Tongue speeds are tuned for playability: 0.5 Hz (bottom pair, ~2s cycle), 0.6 Hz (middle), 0.7 Hz (top). When a tongue strikes the ball, it applies a moderate lateral knockback force (4-6 units) perpendicular to the corridor, pushing the ball toward the sand gutter where high friction (0.15 frictionAir) slows it dramatically. **Aggressive strategy**: full power straight up, requires good timing to pass tongues during their retracted phases. **Conservative strategy (intended)**: 3-5 soft shots, laying up in the safe zones between tongue pairs, then timing the next shot. A friction zone near the cup decelerates the ball for the final putt. Par 4 with disciplined multi-stage timing.

### Hole 11: The Corkscrew Cannon (Par 3)
L-shaped dogleg course with a narrow cannon obstacle in the vertical section. Tee at (200,730), cup at (410,155). The vertical corridor (x:140-270) runs from the tee up through the cannon. After the cannon exit, the corridor turns 90° right into a horizontal section (x:270-460, y:110-230) where the cup sits at the far end. An ice slick zone (y:550-760) builds speed on approach. A **pre-cannon gumdrop bumper** (radius 14) at (220,620) forces aim adjustment before the cannon. The **narrow cannon** (38 width, down from 55) at y:500 requires minimum upward velocity (~2.8 design units) to pass through; too slow and the ball is rejected. After the cannon, two gumdrop bumpers create a satisfying ricochet chain: one aligned directly with the cannon exit (197,150, radius 18) guarantees impact and deflects the ball RIGHT into the horizontal corridor, and a second (330,165, radius 14) bounces it toward the cup. A small sand trap on the inside of the corner (x:270, y:180, 55x48) punishes cutting the turn. Water hazards surround the entire course and lie behind the cup. No sand bunker around the cup — pure skill-based putting. Exit velocity is 60% of entry speed to provide strong energy for the bumper ricochet chain, and a flared barrel mouth with a glow ring at the top. A sand friction zone on the green (y:70-180) decelerates for putting. Water hazards surround the green and flank the corridor. **Strategy**: ~60-75% power for a clean cannon transit with controlled stop on the green.

### Hole 12: The Conveyor Belt Matrix (Par 4)
Rectangular corridor (x:80-420, y:55-730) with a wall-guided snake path of mint-green candy-themed conveyor belts. Four horizontal legs (A-D, each 320×80 design units spanning x:90-410) alternate pushing RIGHT and LEFT with gentle force magnitude 2. Internal walls between each leg have gaps at alternating ends — right side for rightward-pushing legs, left side for leftward-pushing legs — forcing the ball to zigzag through the course. Vertical corridor barrier walls separate each gap from its adjacent water hazard, creating safe passages between legs. Tee at (250,690) above the HUD with an open green approach. Cup at (140,160) within Leg D on the left side. Water hazards (pink) fill the channels between legs on the non-gap side, contrasting clearly with the mint-green conveyors. The player must aim against each leg's gentle lateral push to control where the ball exits through the gap. The walls do the turning; the conveyors provide the challenge.veyors are the sole challenge mechanic. **Visuals**: Dark conveyor squares with animated orange directional chevron arrows scrolling in the force direction, clipped to cell boundaries via geometry masks. **Strategy**: Requires intuitive vector addition — aim opposite to belt direction to achieve a straight-line result, or use belt momentum to curve around obstacles.

### Hole 13: The Flavour Grabber (Par 4)
Zigzag stepping-stone layout with candy-cane walled platforms over a dark void. Three platforms connected by offset bridges that force doglegs — no straight line from tee to cup. Bottom platform (150-350, 600-700) with tee at (250,670), LEFT bridge (160-220, 460-600) connects to the wider middle staging platform (120-380, 340-460), then a RIGHT bridge (300-360, 220-340) connects to the cup island (140-380, 150-220) with cup at LEFT (190,185). Each platform's walls have gaps at bridge connection points, allowing the ball to pass through freely. **Gumdrop bumpers** are placed at 5 key positions across the hole to help guide the ball through doglegs: cup island right side (300,170), middle platform left (200,400), middle platform right (335,375), bottom platform near bridge (250,610), and bottom platform near tee (220,680). An overhead **claw** patrols the middle platform in a fast figure-eight (lemniscate) pattern centered at (250,400) with amplitude 160x130. The claw casts a 45-unit-radius shadow (with reddish tint) on the ground. The claw can only grab the ball while it's actively rolling (during simulation). The instant the ball stops, it becomes immune — the player can take their time aiming without fear of the claw. If the ball enters the shadow zone during the vulnerable window, the claw grabs it — freezing the ball, playing a snap-fast grab animation (0.4s), then triggering a +1 penalty and tee reset. An 800ms grace period after each shot prevents immediate grabs. Strategy requires navigating two doglegs while timing shots to avoid the fast-moving claw shadow on the middle platform.

### Hole 14: Gravity Wells (Par 4)
Surreal space-themed par 4 with an irregular angular boundary and three powerful gravity vortexes. Tee at bottom-center (250,720), cup at top-right (400,100). The outer boundary is an irregular polygon (not rectangular) with stepped/angled edges that create alcoves and pinch points — visually distinctive from all other holes. Three diagonal candy-cane walls create chicanes that block direct paths, forcing players to navigate around the gravity wells. Well A (350,560, r=55, strength 0.006) guards the lower-right passage past the first chicane. Well B (160,340, r=50, strength 0.007) guards the center-left area near the second chicane. Well C (370,200, r=50, strength 0.008) guards the cup approach. Four distinctly colored gumdrop bumpers at key turning points help redirect the ball through the chicanes: cyan (130,650), hot pink (400,450), lime (120,290), orange (340,100). No friction zone — the cup has no bunker, making precision critical. Strategy requires threading past the wells' outer edges to slingshot around diagonal walls without getting swallowed.

### Hole 15: The Cascading Plinko Board (Par 4)
Chaotic plinko/pachinko-inspired par 4. Tee at top-center (250,80), cup at bottom-center (250,720). The entire fairway is a tall narrow rectangle (80-420, 40-770) with a constant downward ramp force (forceY=4) simulating a steep vertical slope. The peg field consists of 12 staggered rows of small (radius 5) high-restitution bumper pegs — even rows have 6 pegs, odd (offset) rows have 7 pegs. Rows alternate in rainbow candy colors: gold, orange, red, pink, purple, blue, teal, lime, then repeating. At the bottom, funnel walls (80,660→180,700 and 420,660→320,700) guide the ball toward the cup zone. Deep sand traps flank the cup on both sides (left: 82-190,700-768; right: 310-418,700-768), punishing balls that don't land dead center. Once struck, the ball cascades violently and unpredictably through the dense peg field. Deterministic physics means a precise starting angle/power will reliably navigate the pegs — players must observe bounce patterns and micro-adjust angle on subsequent strokes.

### Hole 18: The Jawbreaker Centrifuge (Par 4)
The final boss — a two-route choice-based design. Tee at top-left (100,90), cup at bottom-right (380,700). A massive taffy water void separates two distinct paths:
**Route A — "The Safe Route" (left, x:50-200):** A wider corridor gated by a 2-blade centrifuge windmill (speed 2.0, blade length 80) at y=280 and opposing crusher gates (tongues, speed 0.7) at y=420. Requires 3-4 shots to navigate through the gauntlet and cross the green to the cup.
**Route B — "The Hole-in-One Bridge" (right, x:370-410):** An ultra-narrow 40-unit-wide bridge over the void, ending at y=380. A moving bridge (width 40, speed 0.6) oscillates between y:380-550, connecting the skinny bridge to the green. A perfectly timed max-power shot can ride the bridge to the cup in 1-2 strokes — extremely risky.
The green (x:50-460, y:550-760) features a gumdrop bumper (x:200, y:630), a green bumper (x:300, y:620), and two flanking bumpers near the cup for kinetic ricochet finishes. No new obstacle types — composed from existing windmill, tongue, moving_bridge, bumper, and gumdrop_bumper mechanics.

### Hole 17: The Moving Island Sequence (Par 5)
Grueling par 5 across a vast water void. Tee at top-left (110,90), cup at bottom-right (400,730). Five small rectangular platforms oscillate laterally at different unsynchronized speeds. The ball must land on each moving island's static physics body, which physically supports it and drags it laterally via per-frame position delta. Wide water zones on the left (x:30, w:90) and right (x:390, w:80) edges penalize balls that drift off-screen. The green platform is narrow (x:350-460, open top for entry). Island 1 (green, speed 0.35, 90×40) moves x:120↔380. Island 2 (blue, speed 0.45, 85×38) moves x:370↔130. Island 3 (orange, speed 0.55, 80×35) moves x:140↔360. Island 4 (pink, speed 0.65, 75×35) moves x:360↔140. Island 5 (purple, speed 0.75, 70×32) moves x:150↔350. The player must time shots to land on moving targets and shoot from moving platforms before being carried into edge water hazards.

### Hole 16: The Invisible Maze (Par 4)
Psychologically taxing par 4 presenting a deceptively open, empty green. Tee at top-left (120,100), cup at bottom-right (380,680). The large rectangular boundary (50-450, 50-750) looks completely open, but a complex labyrinth of invisible walls blocks direct paths. The maze uses horizontal barriers (H1-H5) with alternating gaps (left/right) that force a serpentine path. Vertical dividers (V1-V3) between rows prevent shortcuts. A final barrier (H5) near the cup at y=640, combined with a dead-end trap wall, creates a tight 40-unit gap that must be threaded to reach the hole. Dead-end trap walls punish blind shots. When the ball strikes an invisible wall, the wall **flashes white** for a fraction of a second to reveal its geometry, then fades back to full transparency. Players must intentionally bounce the ball to map the hidden maze through spatial memory and trial/error. This hole deliberately drives up stroke counts, emphasizing the importance of low scores on easier holes.

## Moving Island Physics

| Property | Value |
|----------|-------|
| Body | Static Matter.js rectangle, friction 1, restitution 0.2 |
| Movement | Lateral oscillation using hermite smoothstep: t²(3-2t) |
| Velocity Inheritance | Ball position updated by island dx each frame when overlapping |
| Water Safety | `isBallOnIsland()` check integrated into `applyZoneEffects` — ball on island is immune to water |
| Visual | Candy-themed rounded rectangle with color fill, white highlight, dark shadow, stroke border |

## Invisible Wall Physics

| Property | Value |
|----------|-------|
| Collision | Standard Matter.js static rectangle, restitution 0.6 |
| Visual | Fully transparent; flashes white (alpha 1.0) on ball contact |
| Fade Speed | 3.0 alpha/second — visible for ~330ms |
| Detection | Matter.js engine collision pairs checked per frame |

## Gravity Well Physics

| Property | Value |
|----------|-------|
| Force Model | Normalized quadratic: t = 1 - (dist-deadR)/(attractR-deadR), F = strength × t² |
| Attraction Radius | Per-well (50-55 design units) |
| Dead Zone | 18% of attract radius — ball entering = swallowed (+1 penalty) |
| Strength | 0.0015–0.002 (normalized quadratic; ball visibly curves and gets sucked in) |
| Visual | Spinning purple vortex with 4 spiral arms, orbiting dots, dark center, outer glow |
| Rotation | 2.5 radians/second |

## Claw Physics

| Property | Value |
|----------|-------|
| Path | Figure-eight (lemniscate): x = A·sin(t), y = B·sin(t)·cos(t) |
| Center | (250, 400) design units |
| Amplitude | 160 × 130 design units |
| Shadow Radius | 45 design units |
| Speed | 0.35 cycles/second (~2.9s per full figure-eight) |
| Grab Animation | 0.4 seconds (claw snaps shut, lifts, penalty applied) |
| Grace Period | 0.8 seconds after each shot (ball immune to grab) |
| Penalty | +1 stroke, ball reset to tee |
| Visual | 3-pronged metallic claw with shadow circle, connected by vertical line |

## Conveyor Belt Physics

| Property | Value |
|----------|-------|
| Force Application | Continuous `applyForce` each physics frame while ball overlaps zone |
| Force Multiplier | 0.00003 × forceX/forceY (design units) |
| Force Magnitude | 2 design units (gentle lateral push) |
| Layout | 4 horizontal legs (320×80) with internal wall dividers, wall-guided turns |
| Leg Directions | A→, B←, C→, D← (alternating right/left) |
| Turn Mechanism | Internal walls with gaps at alternating ends (no vertical conveyors) |
| Visual | Mint green candy stripes (0x7fdfbb/0xa8e8ce), sea-green border (0x2e8b57) |
| Indicators | White frosting dots with green accents, scrolling in force direction |
| Animation | Dots scroll at 0.0015× delta per frame, cycling every 20% of cell width |
| Clipping | Geometry mask per conveyor cell prevents dot bleed |

## Cannon Obstacle Physics

| Property | Value |
|----------|-------|
| Trigger Zone | 55x30 design units at cannon entrance, requires upward velocity (vy < 0) |
| Min Speed | 2.8 design units (scaled to screen) |
| Animation | Linear traversal from entry to exit with spiral oscillation, 800ms, ease-in-out timing |
| Ball Scale | Shrinks to 0.4x during transit (0-15% entry shrink, 85-100% exit grow) |
| Ball Alpha | 0.6 during mid-transit, 1.0 at entry/exit |
| Spiral Trail | 6 trailing dots following the ball's corkscrew path through the transparent section |
| Exit Position | Above cannon exit (exitY - 15px scaled), prevents re-trigger |
| Exit Velocity | 40% of entry speed, directed upward |
| Rejection | Velocity reversed at 30% horizontal, 50% vertical bounce |
| Exit Grace | 120ms post-exit immunity from zone effects |
| Exit Glow | Orange glow effect at barrel mouth when ball is >70% through |
| Visual | Dark metallic pipe body with decorative bands, rivets, transparent middle showing corkscrew spiral, dark entry hole, flared exit mouth with glow ring, directional arrow |

## Tongue Obstacle Physics

| Property | Value |
|----------|-------|
| Motion | Sine-wave extension/retraction, `(sin(t * speed * 2π + phase) + 1) / 2` |
| Extension | 0 to full tongue length (80 design units) |
| Collision | AABB overlap check with ball radius |
| Knockback | Lateral force 4-6 units perpendicular to corridor |
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
- Power bar oscillates using sine wave at 0.75 Hz (full cycle ~1.33s)
- Raw sine value is raised to exponent 1.6, expanding the low-power range for easier soft shots while preserving max power (1.0^1.6 = 1.0)
- Arrow color shifts from blue (low power) to red (max power)

### Shot Execution
- On release, curved power value sampled (0-1)
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
- Ball center within capture radius (14 design units, matching visual hole size) AND speed < 4.5
- Swept-path detection checks intermediate positions for fast-moving balls
- Attraction force (strength 0.0003) applied within 25 units of hole center

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
