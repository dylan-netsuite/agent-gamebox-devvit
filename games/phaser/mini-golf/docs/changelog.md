# Changelog

## v0.0.2.95 - Hole 5 v3: Easier Ramp + Candy-Themed Visuals (2026-02-25)

### Fixed
- **Ramp force reduced from 3 to 1.5** — still too hard to crest. Now beatable at ~60-70% power.

### Changed
- **Removed "HILL" label** from ramp zone.
- **Candy jawbreaker ramp texture**: Replaced green gradient with colorful horizontal candy stripes (red, orange, yellow, green, cyan, purple, pink) with glossy per-stripe highlights and sugar crystal sparkle.
- **Candy plateau texture**: Replaced green elevated area with pastel pink candy base, swirled pastel patches, sugar sparkle, and glossy dome highlight.
- **Rainbow chevrons**: Replaced white/gold chevrons with cycling candy colors (pink, gold, cyan, red, purple, green).

## v0.0.2.92 - Hole 5 v2: Ramp Physics Fix + Major Visual Polish (2026-02-25)

### Fixed
- **Ramp force reduced from 15 to 3** — was impossible to crest the hill. Now beatable at ~80% power.

### Changed
- **Ramp texture overhauled**: Replaced jawbreaker circles with a vertical gradient (dark base → bright crest) with horizontal contour lines, side shadow edges, and noise grain. Reads clearly as "uphill."
- **New plateau texture**: Lighter elevated green with grass noise, rendered above the ramp zone to show raised ground.
- **Bold chevrons**: Full-width alternating white/gold chevrons with progressive alpha (brighter toward crest). "▲ HILL ▲" label at ramp center.
- **3D depth cues**: Dark bottom lip, bright top crest highlight, left/right shadow edges on ramp texture.

## v0.0.2.89 - Hole 5: The Jawbreaker Wedge (2026-02-25)

### Added
- **Hole 5: The Jawbreaker Wedge** — Par 3. Funnel-shaped fairway (wide bottom → narrow ramp → narrow plateau). Ramp zone applies constant downward force simulating uphill gravity. Ball must have ~75-85% power to crest; too much overshoots into back wall. Teaches precise power meter control.
- **Jawbreaker texture**: 128x128 concentric colored rings (red, orange, yellow, green, cyan, purple, pink) with glossy dome highlight. Used for ramp zone overlay.
- **Enhanced ramp zone visuals**: Upward-pointing white chevrons replace generic directional arrows. Jawbreaker texture used as tileSprite background when available.

## v0.0.2.86 - Hole 4 v4: 30px Needle + Bouncier Bumpers (2026-02-25)

### Changed
- **Needle channel narrowed to 30px** (x:80-110, ~12px effective physics gap). Tee and cup at x:95.
- **All bumpers made bouncier**: BUMPER_RESTITUTION 1.3→1.5, GUMDROP_RESTITUTION 1.5→1.8, block restitution 0.85→1.1.

## v0.0.2.83 - Hole 4 v3: Tighter Needle + Hole 2-Style Corner Bumpers (2026-02-25)

### Changed
- **Needle channel narrowed to 40px** (x:80-120, ~22px effective physics gap, 3px clearance per side). Tee and cup at x:100.
- **Corner bumpers resized to 70x30** (matching Hole 2's chocolate block) and repositioned flush into the actual wall corners at (385, 95) and (385, 705).

## v0.0.2.77 - Hole 4 Redesign v2: Straight-Line Needle + Angled Corner Bumpers (2026-02-25)

### Changed
- **Hole 4 tee moved to x:93** — now directly below the needle channel and cup, forming a perfect straight vertical line for hole-in-one shots.
- **Corner bumpers**: Replaced circular gumdrop bumpers with 45-degree angled chocolate block walls (like Candystand mini golf). Ball ricochets off at 90 degrees when hit directly.
- **Island adjusted to x:106-310** — right path is 110px wide with corner bumper blocks at top-right (x:395, y:155) and bottom-right (x:395, y:615).

## v0.0.2.70 - Power Boost, Hole Select Menu, Hole 4: Graham Cracker Divide (2026-02-25)

### Added
- **Hole 4: The Graham Cracker Divide** — Par 3. Branching-path layout with a narrow risky left corridor and a wide safe right corridor with L-bend. Center divider is a massive graham cracker sand trap that kills ball momentum.
- **Graham cracker texture**: 128x128 tileable texture with sandy tan base, crumb fragments, crack lines, and noise grain. Used for sand trap zones.
- **Hole selection menu**: MainMenu now has PLAY section (FULL 18), PRACTICE section (individual hole buttons in 2-column grid), and LEADERBOARD. Each hole button shows name and number.
- **`endHoleIndex` parameter**: Game and HoleComplete scenes accept `endHoleIndex` to support practice mode (single hole) and partial rounds (front 9, back 9).
- **Scrollable menu**: MainMenu supports touch drag and mouse wheel scrolling when content exceeds viewport.

### Changed
- **MAX_SHOT_VELOCITY**: Increased from 18 to 25 for stronger shots. Fixes inability to clear bumpers on Hole 2.
- **Sand zone rendering**: Sand zones now use `graham-cracker` TileSprite texture instead of plain colored fill with dot overlay.
- **MainMenu**: Complete redesign from 2-button layout to categorized hole selection with section headers.

## v0.0.2.65 - Hole 3: The Gumdrop Bumper Pinball (2026-02-25)

### Added
- **Hole 3**: Wide rectangular arena (x:80-420, y:60-740) with 3 gumdrop bumpers in a semi-circle guarding the cup. Par 3.
- **Gumdrop bumper obstacle**: Static circular physics body with restitution 1.5 (hyper-elastic pinball effect). Rendered as Image with `gumdrop` texture tinted per-bumper color.
- **Gumdrop texture**: 48x48 circular texture with 3D dome gradient, sugar crystal speckles, specular highlight, and outer ring. Color-tinted at runtime via Phaser's `setTint()`.
- **GUMDROP_RESTITUTION constant** (1.5): Higher than standard bumper restitution (1.3) for aggressive pinball-style bounces.

### Changed
- **ObstacleType**: Added `gumdrop_bumper` type
- **Obstacles.ts**: Added `addGumdropBumper()` method with image-based rendering and color tinting
- **Game.ts**: Added `gumdrop_bumper` case to obstacle loading switch
- **TextureFactory**: Added `generateGumdrop()` method

## v0.0.2.58 - Portrait Zoom Fix & Hole 2 Playability (2026-02-25)

### Changed
- **Design space**: Changed from 800x600 (landscape) to 500x800 (portrait) to match mobile Devvit webview proportions. Courses now fill the viewport instead of appearing tiny.
- **Hole 1 coordinates**: Remapped to 500x800 space — walls at x:150-350, y:60-740. Tee at (250,690), cup at (250,110).
- **Hole 2 coordinates**: Remapped to portrait layout with vertical corridor (x:120-280) going up then bending right into horizontal corridor (x:120-420, y:80-250).
- **Hole 2 licorice wall**: Repositioned from fully blocking the corridor (140px wide spanning the entire path) to a vertical partial barrier at the inner bend (100x18, vertical orientation), allowing the ball to navigate past it.
- **Phaser config**: Default dimensions updated to 500x800 to match portrait design space.

### Fixed
- Both holes were zoomed out too far on mobile — course now fills the screen properly
- Hole 2 was unplayable because the licorice wall blocked the entire corridor width

## v0.0.2.51 - Hole 2: The Licorice Dogleg (2026-02-25)

### Added
- **Hole 2**: L-shaped course bending 90 degrees right. Introduces bank-shot gameplay with a 45-degree chocolate block reflector and a licorice wall barrier. Par 2.
- **Chocolate block obstacle**: Static angled rectangle with brown textured sprite (`chocolate-block`), high restitution for clean reflections
- **Licorice wall obstacle**: Static barrier with dark twisted-rope texture (`licorice`) using TileSprite rendering
- **TextureFactory**: Added `chocolate-block` (80x40, brown with score lines and 3D gradient) and `licorice` (64x24, black with diagonal rope stripes and cylindrical shading) texture generation

### Changed
- **Obstacles.ts**: Added `addBlock()` and `addLicoriceWall()` methods with sprite-based rendering and `gameObjects` tracking for proper cleanup
- **Game.ts**: Added `block` and `licorice_wall` cases to obstacle loading switch

## v0.0.2.47 - Menu & Scene Texture Upgrade (2026-02-25)

### Changed
- **MainMenu**: Replaced procedural gradient background + colored circle decorations with `grass-bg` TileSprite, `vignette` Image overlay, `candy-cane-corner` peppermint swirl sprites, and `sparkle` tween-animated sprites
- **Preloader**: Replaced gradient background with `grass-bg` TileSprite + `vignette` Image
- **HoleComplete**: Replaced gradient background with `grass-bg` TileSprite + `vignette` Image
- **Scorecard**: Replaced gradient background with `grass-bg` TileSprite + `vignette` Image
- All scenes now share a consistent visual theme using the TextureFactory texture system

## v0.0.2.43 - Texture-Based Visual Overhaul (2026-02-25)

### Changed
- **Rendering pipeline**: Replaced all procedural `Graphics` API drawing with pre-rendered texture assets generated at boot time via `TextureFactory`
- **Walls**: Now use `TileSprite` with a tileable candy cane texture (smooth diagonal red/white stripes with cylindrical shading) instead of per-frame parallelogram drawing. Corner joints use pre-rendered peppermint swirl `Image` sprites
- **Background**: Single `TileSprite` using a 256x256 grass texture with layered noise, replacing ~5000+ individual `fillRect` calls. Vignette rendered as a single radial gradient `Image`
- **Sparkles**: Reduced from 40 per-frame `Graphics` stars to 4 pre-rendered `Image` sprites animated with tweens (scale + alpha pulse)
- **Fairway**: Simplified to clean `fillPath()` + single `strokePath()` border, removing complex multi-layer inset calculations
- **Course geometry**: Widened Hole 1 from 100px to 200px design width (x:300-500) for better screen presence
- **Boot scene**: Added `TextureFactory.generateAll()` to preload all runtime-generated textures

### Added
- `utils/textures.ts` — `TextureFactory` class generating `candy-cane`, `candy-cane-corner`, `grass-bg`, `sparkle`, and `vignette` textures using HTML5 Canvas 2D API

### Performance
- Eliminated thousands of per-frame `Graphics` draw calls in background and sparkle rendering
- Wall rendering reduced from 3 Graphics layers to simple TileSprite + Image objects

## v0.0.2.39 - Visual Polish Pass (2026-02-25)

### Changed
- **Walls**: Tighter candy cane stripe spacing, thicker walls (14→18), rounded peppermint swirl corner joints, center cylindrical sheen highlight
- **Fairway**: Richer green with visible inner border glow and secondary edge highlight
- **Background**: Dense grass fiber texture (elongated rectangles) replacing random dots, scattered lighter highlights, directional edge vignette
- **Sparkles**: Mix of large diamond 4-point stars (5-13px with inner glow) and small crosses
- **HUD**: Red outer border frame, gold border line, inner gold + red accent borders, larger peppermint swirls, larger hole banner with highlight gradient, text stroke for readability
- **Ball**: Drop shadow, outer ring, bright top-left highlight, subtle bottom-right surface shadow
- **Hole**: Darker ring for depth, stronger rim highlight
- **Flag**: White rectangular flag replacing pink triangle, pole shadow, pole cap

## v0.0.2.31 - Visual Overhaul & Hole 1 Rebuild (2026-02-25)

### Changed
- Stripped all 18 holes, keeping only Hole 1 (The Vanilla Straightaway) for iterative quality improvement
- **Walls**: Replaced solid pink line walls with candy cane peppermint stick rendering — white base with diagonal red stripes, edge highlights for 3D depth
- **Background**: Dark textured grass with procedural noise dots, subtle vignette
- **Sparkles**: 30 twinkling star-shaped sparkle particles on the dark background
- **Fairway**: Rich green fill (0x2d8a4e) with lighter inner border glow (0x3da85e)
- **HUD**: Replaced minimal top bar with candy-themed bottom panel — gold banner with "HOLE 1", peppermint swirl decorations, green/purple gumdrop icons, warm brown/gold color scheme
- **Physics**: Wall restitution increased from 0.6 to 0.7 for bouncier reflections per design doc
- **Score display**: HUD now shows "SCORE: N" instead of just the number

### Removed
- Holes 2-18 (will be rebuilt one at a time with higher quality)
