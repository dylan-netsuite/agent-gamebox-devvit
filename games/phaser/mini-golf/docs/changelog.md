# Changelog

## v0.0.3.1 - Hole 9: Rounded Hazards, New Hazard, Shinier Ice (2026-02-26)

### Changed
- **Rounded water hazards** — all water zones now render with rounded corners (30% radius) instead of sharp rectangles, giving them a softer taffy-pool look
- **Water zone visual enhancements** — taffy tile sprites clip to rounded shape via geometry mask; subtle white wave ripple lines and top-left gloss highlight added
- **Shinier slick zones** — ice overlay alpha increased to 0.8, top gloss sheen widened to 20% with 0.35 alpha, added secondary mid-sheen band, diagonal highlight streak, white border outline, increased sprinkle density, and stronger wavy drip edge
- **New water hazard near cup** — small taffy pond at (340, 220, 80x60) above the cup punishes overshooting the approach shot

## v0.0.2.307 - Hole 9: Fix Zone Overlaps + Increase Difficulty (2026-02-26)

### Changed
- **Left lane slick zone trimmed** — height reduced from 500 to 248 (y:200-448), stopping before the horizontal wall at y:450. No longer overlaps with the water hazard at y:460-560.
- **Right lane slick zone removed** — the descent from the top-right diagonal to the cup is now on normal turf, requiring more precise power control and making the hole harder.
- **Clearer visual distinction** — ice zones and water hazard no longer overlap, eliminating confusion about surface type.

## v0.0.2.303 - Hole 9 Redesign: S-Curve with Diagonal Wall Bank Shots (2026-02-26)

### Changed
- **Hole 9 redesigned with S-curve layout using diagonal wall geometry** — replaced L-shaped chocolate block reflectors with diagonal wall corners built into the outer boundary. The top-left and top-right corners are 45° wall segments that predictably redirect the ball via Matter.js wall collisions, creating reliable bank shots.
- **Cup relocated to (400,350)** — moved from top-right to right side mid-height, making the third leg of the S-curve a downward approach.
- **Water hazard repositioned to (120,460)** — moved below the horizontal wall (y=450) to serve as a penalty for balls that fall through gaps, without interfering with the intended S-curve path.
- **Chocolate block obstacles removed** — diagonal wall segments in the boundary polygon provide more predictable redirection than standalone block obstacles, which suffered from inconsistent collision angles.
- **Single gumdrop bumper at (420,310)** — one bumper near the cup adds risk/reward on the approach, replacing the previous two-bumper layout.
- **Birdie achievable in 2 strokes** — tested and verified: straight-up shot with 70% power banks off both diagonal corners, lands near cup, second shot sinks it.

## v0.0.2.263 - Hole 9 Redesign: L-Shaped Reflector Zigzag (2026-02-26)

### Changed
- **Hole 9 completely redesigned with L-shaped layout** — replaced nonsensical 3-corridor zigzag with a clean L-shaped course using 45° chocolate block reflectors. Vertical leg 1 (aim up) redirects via reflector to horizontal leg 2 (glide right to cup).
- **Par reduced from 4 to 3** — the L-shaped path with reflectors is completable in 2-3 strokes. Birdie setup on a great first bank shot, hole-in-one possible with perfect aim.
- **Chocolate block reflector replaces bumper-based turns** — circular bumpers can't redirect the ball (they reflect it back). The 45° chocolate block at (130,130) physically redirects upward-traveling balls rightward. This is the satisfying "bank shot" mechanic.
- **Two gumdrop bumpers as lane obstacles** — placed in the horizontal lane (280,110) and near the cup (420,200) for risk/reward, not direction changes.
- **Ice cream zones on both legs** — vertical and horizontal lanes keep the ball gliding with 0.012 frictionAir.
- **Horizontal wall at y=300** — blocks diagonal shortcut from tee to cup, forcing the L-path.
- **Water hazard moved to right side dead-end** — punishes balls that go right without using the reflector.

## v0.0.2.230 - Hole 9 Redesign: Fun 3-Corridor Zigzag (2026-02-26)

### Changed
- **Hole 9 redesigned to 3-corridor zigzag** — replaced simple 2-lane layout with a three-corridor zigzag using two horizontal dividers. Bottom lane goes RIGHT, middle lane goes LEFT, top lane goes RIGHT to cup. More engaging and strategic path.
- **Par increased from 3 to 4** — extra corridor makes par 4 appropriate.
- **4 gumdrop bumpers added at turns** — colorful bumpers (pink, sky blue, orange, pink) at bottom-right corner, right gap, left gap, and top-left corner. High restitution (1.8) adds excitement and unpredictability.
- **2 water hazards added** — pink taffy pool above the lower gap punishes overshooting, and a taffy puddle in the center of the middle corridor forces careful aim through the lane.
- **3 ice cream zones across all corridors** — slick surfaces in the straightaway sections of each corridor keep the ball gliding.
- **3 friction zones at key points** — right U-turn, left U-turn, and cup landing pad provide controllable rest areas.

### Fixed
- **Hole 9 is now more fun and challenging** — previous 2-lane layout was too simple. New zigzag pattern with bumpers and hazards creates an engaging mini-golf experience with risk/reward decisions at each turn.

## v0.0.2.228 - Hole 9 Redesign: Playable 2-Lane Zigzag (2026-02-26)

### Changed
- **Hole 9 completely redesigned** — replaced unplayable 5-corridor serpentine layout with a clean 2-lane zigzag. Single horizontal divider at y=420 with a wide 150px gap on the right side. Ball navigates right across the bottom lane, through the gap, then left to the cup.
- **Par reduced from 4 to 3** — simpler layout is completable in fewer strokes.
- **Gumdrop bumpers replaced with block deflector** — removed chaotic 1.8x restitution gumdrop bumpers. Single 45-degree chocolate block at the gap corner provides gentle redirection (1.1x restitution).
- **`ICE_FRICTION_AIR` increased from 0.002 to 0.012** — balls now gradually decelerate on ice instead of sliding indefinitely. Still very slippery but manageable.
- **Large friction zones at turns and cup** — right-side U-turn area and the cup landing pad use sand friction, giving players control points to stop and re-aim.
- **Cup moved from (420,140) to (400,200)** — positioned within the friction landing pad for reliable capture.

### Fixed
- **Hole 9 is now playable** — previous layout caused balls to fly off screen, bounce indefinitely, or get stuck. New design tested and verified: ball successfully sinks in 3-5 shots.

## v0.0.2.198 - Hole 9: The Ice Cream Glide (2026-02-25)

### Added
- **Hole 9: The Ice Cream Glide (Par 4)** — massive zig-zag layout covering the full 500x800 design space. Five serpentine corridors with horizontal barriers alternating gaps left/right. Ball must ricochet through the geometric maze with precisely angled, gentle taps.
- **Ice cream slick zones** — 80% of the fairway is covered in "melted ice cream" zones using `ICE_FRICTION_AIR` (0.002) for ultra-low friction. Alternating pastel pink (0xffc0cb) and cream/vanilla (0xffecd2) colors distinguish the slick zones.
- **Normal turf island** — small green patch near the cup (top-right) is the only area with normal friction where the ball can actually stop.
- **Ice cream visual decorations** — dedicated `iceOverlayGraphics` layer (depth 3) renders above the fairway. Includes colorful sprinkle dots, glossy sheen stripe, and wavy drip edges on each ice cream zone.
- **Custom ice zone rendering** — when ice zones have a custom `color` property, they render at 0.75 alpha on a higher-depth overlay layer with decorative sprinkles and drips.

## v0.0.2.181 - Hole 8: Pipe depth + source fix (2026-02-25)

### Fixed
- **Pipe paths render under fairway** — moved pipe Bezier paths to a separate `pipeGraphics` layer at depth 1 (below fairway at depth 2). Pipe endpoint circles remain at depth 5 above the fairway. Pipes now appear to go "underground" beneath the green.
- **Pipe path-to-color mapping** — fixed variant selector from `colorSeed & 0xff` to `(colorSeed >> 8) & 0xff`, using the green channel instead of blue. Previously Red and Green both mapped to variant 0 (same path shape) while Blue got variant 2 (Green's intended path). Now each color gets a unique path that sources from its matching colored endpoint.
- **Blue pipe exit relocated** — moved from (370,300) near red exit to (130,100) top-left corner, well separated from red at (350,270).

## v0.0.2.169 - Hole 8: Tangled Pipe Visuals + Blue Pipe Rebalance (2026-02-25)

### Changed
- **Tangled pipe visuals** — replaced single-curve pipe paths with multi-segment Bezier chains (4 cubic segments, 12 waypoints per pipe). Each pipe now takes a wildly different route through the gap, with paths crossing over each other to create a confusing tangle. Three unique path variants (red/blue/green) ensure visual confusion about which pipe goes where.
- **Blue pipe rebalanced** — moved exit from (130, 90) top-left to (370, 300) bottom-right corner of exit area, and changed exit angle from `π/4` to `π*0.75` (down-left). Now exits far from the hole, requiring multiple shots to reach the cup — no longer possible to easily hole-in-one via blue pipe.
- **Pipe rendering upgraded** — 4-layer rendering (dark outline, gray mid-tone, colored fill, white highlight) with 30 steps per Bezier segment for smoother curves.

## v0.0.2.157 - Hole 8: Fixed Exit Directions + Pipe Decoration (2026-02-25)

### Fixed
- **Teleporter exit directions** — each pipe now has a fixed exit angle instead of preserving the ball's incoming velocity direction. Green pipe exits straight up toward the hole (`-π/2`), Red pipe exits left into the sand trap (`π`), Blue pipe exits down-right into a corner (`π/4`). Minimum exit speed of 1.5 ensures consistent behavior.

### Added
- **Bezier pipe decoration** — curved pipe visuals drawn between entry and exit points using a custom cubic Bezier approximation (20-segment `lineTo` path). Three layers per pipe: dark outline, colored fill, white highlight. Creates a tangled pipe aesthetic between the two separated areas.
- **`exitAngle` property on `TeleporterDef`** — optional angle (radians) that overrides velocity preservation. When set, ball exits at the specified angle with preserved speed.

### Fixed
- **`bezierCurveTo` TypeError** — replaced unavailable `Phaser.GameObjects.Graphics.bezierCurveTo` with manual cubic Bezier curve approximation using `lineTo` segments.

## v0.0.2.153 - Hole 8: The Teleportation Tunnels (2026-02-25)

### Added
- **Hole 8: The Teleportation Tunnels** — Par 3. Puzzle-oriented hole with two physically separate walled areas connected only by teleporter pipes. Tee box at bottom has three colored pipe entrances (Red, Blue, Green). Cup is in a walled-off exit area at top, unreachable without teleporting.
- **Three-pipe teleporter system**: Red pipe exits into a sand trap (away from hole), Blue pipe exits into a corner for chaotic bounces, Green pipe exits pointing straight at the cup for an easy roll-in.
- **Chocolate block puzzle**: A static chocolate block partially obscures the Green pipe entrance, forcing players to bank off the side wall to reach it. Direct shots are blocked.

### Changed
- **Enhanced teleporter visuals** — pipe entrances/exits now render with a dark outer ring, colored fill, dark center hole, specular highlight, and white stroke ring for a 3D pipe appearance.

## v0.0.2.142 - Fix Windmill Ball Sticking (2026-02-25)

### Fixed
- **Ball no longer sticks to windmill blades** — converted blade bodies from solid static rectangles to sensors (`isSensor: true`), eliminating Matter.js collision resolution that trapped the ball. Replaced with manual overlap detection that computes tangential + perpendicular knock velocity and applies it as an impulse.
- **Removed duplicate `updateWindmills()` call** — was being called both unconditionally in `Game.update()` and again inside `obstacles.update()` during simulation, causing double rotation speed.

### Changed
- **Windmill collision is now fully manual** — blade bodies are sensors (no physics collision). On overlap, the ball receives a velocity based on the blade's tangential speed at the contact point plus a perpendicular knock force, then gets pushed clear of the blade bounds.
- **400ms hit cooldown per windmill** — prevents the ball from being hit multiple times by the same windmill in rapid succession, ensuring a clean single deflection.
- **Tuned deflection force** — tangential speed multiplier 0.12 (capped at 6), perpendicular knock force of 4 units. Ball gets knocked firmly but stays within the play area.

## v0.0.2.128 - Hole 7: The Wafer Windmill (2026-02-25)

### Added
- **Hole 7: The Wafer Windmill** — classic retro mini-golf timing challenge. Straight fairway with a massive 4-blade windmill dead center. Blades extend wall-to-wall (180 design units), completely blocking any safe path. High restitution (1.5) blades violently deflect the ball on contact. Player must time their shot to slip through the gap between rotating blades.
- **Wafer cookie windmill visuals** — upgraded windmill rendering with tan/golden wafer-colored blades, grid pattern, light/dark edges, blade shadows, and a chocolate center hub with highlight.

### Fixed
- **Windmill rotation now animates in all game states** — previously windmills only rotated during the `simulating` state. Now `updateWindmills()` is called unconditionally in the update loop, matching bridge behavior.

## v0.0.2.120 - Hole 6: Bridge is now a pass-through safe zone (2026-02-25)

### Fixed
- **Ball no longer bounces off the bridge** — the bridge was a solid Matter.js physics body that acted as a wall, blocking the ball. Converted the bridge to a purely visual element with a zone-based safe area check. The ball now passes through the bridge area freely, and the water hazard is suppressed when the ball overlaps the bridge bounds.

### Changed
- **Bridge is no longer a physics body** — it's a visual-only oscillating graphic with a rectangular bounds check that protects the ball from the water hazard. This matches the top-down 2D perspective where "on the bridge" means "within the bridge's screen bounds."

## v0.0.2.116 - Hole 6 Major Fixes + All Holes Tee Spacing (2026-02-25)

### Fixed
- **Ball can now land on the bridge** — water zone check now skips if ball overlaps a bridge body, preventing false hazard triggers.
- **Water hazard no longer freezes the game** — state machine race condition fixed; uses `sinking` state to block updates during the tween animation, then cleanly transitions back to `aiming`.
- **Water hazard resets to tee box** instead of last stroke position.

### Changed
- **Bridge height doubled from 50 to 100 design units** — much larger vertical landing target.
- **All holes: tee positions moved up ~40 design units** (y:690→650, etc.) and bottom walls shortened to y:700, adding visible breathing room between the ball and the HUD panel.

## v0.0.2.112 - Hole 6: Taller Bridge (2026-02-25)

### Changed
- **Bridge height increased from 20 to 50 design units** — gives a much larger vertical landing zone as the bridge oscillates, making timing more forgiving.

## v0.0.2.108 - Hole 6 Fix: Open Walls + Wider Bridge (2026-02-25)

### Fixed
- **Island walls no longer block the ball** — changed from closed rectangles to U-shaped open polygons so the river-facing sides have no wall. Ball can now freely exit the tee island and enter the cup island.

### Changed
- **Bridge widened from 80 to 160 design units** — doubles the landing surface for much more forgiving timing.

## v0.0.2.103 - Hole 6: The Taffy River (2026-02-25)

### Added
- **Hole 6: The Taffy River** — two isolated islands connected by a moving bridge over a pink taffy water hazard.
- **Moving bridge obstacle**: Kinematic body oscillating vertically between the two islands with smooth easing. First moving obstacle in the game.
- **Taffy texture**: Procedural 256x256 pink taffy texture with flowing wave patterns, glossy sheen, and sugar sparkle.
- **Water hazard sinking animation**: Ball shrinks and fades before resetting to last position (replaces instant teleport).
- **Bridge always animates**: Bridge oscillation runs in all game states (aiming, power, simulating) so players can time their shots.

## v0.0.2.98 - Hole 5 v4: Ramp Force Tuned to 2.25 (2026-02-25)

### Changed
- **Ramp force adjusted from 1.5 to 2.25** — splits the difference for the ideal difficulty sweet spot.

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
