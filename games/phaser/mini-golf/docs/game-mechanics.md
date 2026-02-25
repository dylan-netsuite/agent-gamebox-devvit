# Game Mechanics

## Input System

### Aiming Phase
- When ball is at rest, player moves mouse/touch to rotate directional arrow
- Arrow angle calculated via `atan2(pointerY - ballY, pointerX - ballX)`
- Dotted trajectory line extends beyond arrow tip

### Power Phase
- Player clicks/taps and holds to start power meter
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

## Hole Capture

Ball is captured when:
- Ball center within capture radius (20 design units) AND speed < 6.0
- Swept-path detection checks interpolated positions to prevent tunneling past the hole
- Attraction force gently pulls slow balls within 40 units toward the hole center

Sink animation: ball scales to 0, particle burst, score text display.

## Scoring

- Stroke incremented on each shot and on water hazard penalties
- Score labels: Hole-in-One, Eagle (-2), Birdie (-1), Par (0), Bogey (+1), etc.
- Total score = sum of all 18 hole strokes vs total par

## Obstacles

| Type | Effect |
|------|--------|
| Sand traps | Increase frictionAir to 0.15 |
| Ice/slick | Reduce frictionAir to 0.001 |
| Bumpers | Restitution 1.5 (pinball-style bounce) |
| Water | Reset to last position + 1 stroke penalty |
| Windmill | Rotating kinematic blades block path |
| Teleporters | Instant position swap, preserve velocity |
| Ramps | Opposing force vector (simulates elevation) |
| Conveyors | Lateral force applied while on belt |

## 18-Hole Course

### Front 6 (Fundamentals)
1. The Vanilla Straightaway (Par 2) - Simple straight channel
2. The Licorice Dogleg (Par 3) - L-shaped corridor with bumper at turn
3. The Graham Cracker Divide (Par 3) - Central dividers create left/right paths with sand trap
4. The Gumdrop Bumper Pinball (Par 3) - Open rectangle with 3 spread-out bumpers
5. The Jawbreaker Wedge (Par 3) - Hourglass-shaped channel with upward ramp boost
6. The Taffy River (Par 3) - Two island platforms connected by 60-unit bridge over water

### Middle 6 (Challenge)
7. The Wafer Windmill (Par 3) - Straight channel with 3-blade windmill at gentle speed
8. The Teleportation Tunnels (Par 3) - Two boxes connected by 3 colored teleporters
9. The Ice Cream Glide (Par 5) - Wide zig-zag maze entirely covered in ice
10. The Sour Tongues (Par 3) - Narrow channel with alternating bumpers and sand
11. The Loop-de-Loop (Par 3) - Straight channel with upward ramp boost and water edges
12. The Conveyor Belt Matrix (Par 4) - Open area with 4 directional conveyor belts

### Back 6 (Mastery)
13. The Flavour Grabber (Par 3) - Central arena surrounded by water moats
14. Gravity Wells (Par 3) - Open field with gravity well obstacles
15. The Cascading Plinko (Par 4) - Top-to-bottom plinko board with spaced pegs and gentle ramp
16. The Invisible Maze (Par 4) - Open area with hidden internal wall segments
17. The Moving Islands (Par 3) - Two platforms connected by 60-unit bridge through water
18. The Skull of Doom (Par 3) - 80-unit bridge into arena with windmill and flanking water
