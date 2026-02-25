# Game Mechanics

## Input System

### Aiming Phase
- When ball is at rest, player moves mouse/touch to rotate directional arrow
- Arrow angle calculated via `atan2(pointerY - ballY, pointerX - ballX)`
- Dotted trajectory line extends beyond arrow tip

### Power Phase
- Player clicks/taps and holds to start power meter
- Power bar oscillates using sine wave at ~1.8 Hz
- Arrow color shifts from blue (low power) to red (max power)

### Shot Execution
- On release, sine value sampled as power (0-1)
- Impulse applied: `power * MAX_FORCE * direction_vector`
- Inputs locked during simulation

## Ball Physics

| Property | Value |
|----------|-------|
| Radius | 8 (design units) |
| Restitution | 0.7 |
| Friction | 0.02 |
| FrictionAir | 0.025 |
| Stop threshold | 0.15 velocity |

## Hole Capture

Ball is captured when:
- Ball center overlaps hole trigger area (12 unit radius)
- Ball speed < 1.8 (capture velocity threshold)

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
1. The Vanilla Straightaway (Par 2)
2. The Licorice Dogleg (Par 2)
3. The Graham Cracker Divide (Par 3)
4. The Gumdrop Bumper Pinball (Par 3)
5. The Jawbreaker Wedge (Par 3)
6. The Taffy River (Par 3)

### Middle 6 (Challenge)
7. The Wafer Windmill (Par 3)
8. The Teleportation Tunnels (Par 3)
9. The Ice Cream Glide (Par 4)
10. The Sour Tongues (Par 4)
11. The Loop-de-Loop (Par 3)
12. The Conveyor Belt Matrix (Par 4)

### Back 6 (Mastery)
13. The Flavour Grabber (Par 4)
14. Gravity Wells (Par 4)
15. The Cascading Plinko (Par 4)
16. The Invisible Maze (Par 4)
17. The Moving Islands (Par 5)
18. The Skull of Doom (Par 3)
