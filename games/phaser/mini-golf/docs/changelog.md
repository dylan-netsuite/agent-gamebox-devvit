# Changelog

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
