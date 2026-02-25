# Plan: Power Boost, Hole Select Menu, Hole 4

## 1. Increase Max Power
- `MAX_SHOT_VELOCITY`: 18 → 25
- Speed clamp in Game.ts update loop: stays at 1.5x max velocity (now 37.5 scaled)
- This gives enough power to clear bumpers and escape sand traps

## 2. Hole Selection Menu
Replace the simple "PLAY 18 HOLES" + "LEADERBOARD" with:
- Section header "PLAY"
- "FULL 18" button — starts at hole 0, plays all
- "FRONT 9" button — starts at hole 0, plays holes 0-8
- "BACK 9" button — starts at hole 9, plays holes 9-17
- Section header "PRACTICE"
- Individual hole buttons in a scrollable grid (2 columns)
- Each shows "HOLE N" with the hole name below

Game.ts init needs to accept `endHoleIndex` to know when to stop.
HoleComplete needs to respect `endHoleIndex` too.

## 3. Hole 4: The Graham Cracker Divide
Layout (500x800 design space):
- Wide outer rectangle: x:80-420, y:60-740
- Center divider wall creating two paths:
  - Left path: VERY narrow (ball radius 8, path ~24px wide)
  - Right path: wide with L-bend
- Graham cracker sand trap fills the center divider area
- Tee at bottom center (250, 690)
- Cup at top center (250, 130)

### Geometry:
- Outer walls: rectangle x:80-420, y:60-740
- Center island (divider): x:140-330, y:200-580
  - Left path gap: x:80-140 (60px wide, tight)
  - Right path: x:330-420 (90px wide, with bend)
- Sand trap zone covers the center island area

### New texture: Graham Cracker
- Tileable 128x128 texture
- Sandy tan base with darker crumb fragments
- Cracked/broken cookie appearance

## Files Changed
| File | Change |
|------|--------|
| `utils/physics.ts` | MAX_SHOT_VELOCITY 18→25 |
| `scenes/MainMenu.ts` | Complete rewrite of button section with hole select |
| `scenes/Game.ts` | Accept endHoleIndex, use it in sinkBall |
| `scenes/HoleComplete.ts` | Pass endHoleIndex through |
| `data/holes.ts` | Add Hole 4 definition with frictionZones |
| `utils/textures.ts` | Add generateGrahamCracker() |
| `objects/Obstacles.ts` | Use graham-cracker texture for sand zones |
