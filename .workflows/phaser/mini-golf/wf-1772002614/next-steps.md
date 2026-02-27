# Next Steps

## 1. Playtest Graham Cracker Sand Trap Physics
**Priority**: High
**Rationale**: The sand trap uses SAND_FRICTION_AIR (0.15) but the actual feel needs manual verification — does entering the trap stop the ball convincingly? Is the damping strong enough to feel punishing but not impossible to escape with full power?
**Scope**: Small (1 cycle)
**Dependencies**: None

## 2. Add Holes 5-9 (Front 9 Completion)
**Priority**: High
**Rationale**: With 4 holes done and a hole selection UI that supports Front 9/Back 9, the next milestone is completing the front 9. Each hole should introduce a new mechanic or combine existing ones in novel ways.
**Scope**: Large (5+ cycles, one per hole)
**Dependencies**: None

## 3. Fix Playwright Canvas Click-Through
**Priority**: Medium
**Rationale**: Automated testing is hampered by the splash iframe and Devvit wrapper elements intercepting pointer events. Using `__PHASER_GAME__` for scene navigation works as a workaround but actual gameplay testing (aiming, power meter, shot execution) can't be automated without real canvas clicks.
**Scope**: Medium (2-3 cycles)
**Dependencies**: Understanding Devvit's iframe layering

## 4. Sound Effects
**Priority**: Medium
**Rationale**: The game is visually polished but completely silent. Adding ball-hit, wall-bounce, hole-sink, and bumper-bounce sounds would significantly improve game feel.
**Scope**: Medium (2-3 cycles)
**Dependencies**: None

## 5. Power Meter Visual Indicator for Max Power Change
**Priority**: Low
**Rationale**: MAX_SHOT_VELOCITY was increased from 18 to 25 but the power meter visual doesn't reflect this — players can't see that they have more power available. Consider adding a power bar fill or numeric indicator.
**Scope**: Small (1 cycle)
**Dependencies**: None
