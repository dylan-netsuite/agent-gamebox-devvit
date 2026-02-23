# Worms - Game Mechanics

## Overview

Turn-based artillery game where players control worms on destructible terrain, using weapons to eliminate opponents.

## Weapons

| Weapon | Mode | Blast Radius | Damage | Wind? | Special |
|--------|------|-------------|--------|-------|---------|
| Bazooka | Projectile | 40px | 45 | Yes | Arcs with gravity |
| Grenade | Projectile | 35px | 40 | Yes | Bounces 3x, 3s fuse |
| Shotgun | Hitscan | 15px | 25×2 | No | 2 instant shots |
| Dynamite | Placed | 70px | 75 | No | 5s fuse, placed at feet |
| Airstrike | Targeted | 25px×5 | 30×5 | Yes | 5 missiles from above |

## Controls

| Input | Action |
|-------|--------|
| ← → | Move worm left/right |
| Click / Space | Start aiming / Fire |
| Mouse move | Adjust aim angle |
| Scroll wheel | Adjust power (while aiming) / Zoom (while idle) |
| 1-5 / Click weapon slot | Select weapon |
| Q / E | Cycle weapons |
| Tab | Switch active worm |
| Enter | Next turn (after firing) |
| Escape | Cancel aiming |
| Left-click drag | Pan camera (in idle/resolved state) |
| Middle-click drag | Pan camera |
| Right-click drag | Pan camera |
| F | Recenter camera on active worm |

## Terrain

- Procedurally generated using layered sine waves
- World size: 2400 × 1200 pixels
- Destructible: explosions carve circular holes
- Worms fall through destroyed terrain (gravity)

## Damage

- Distance-based falloff: `damage × max(0, 1 - distance / (radius × 1.5))`
- Worms have 100 HP
- Health bar: 5px tall, outlined, color-coded: green (>50%) → yellow (25-50%) → red (<25%)
- HP number displayed above worm name in white monospace text
- Floating damage numbers: scale-in animation (1.5x → 1x), color-coded by severity (yellow <20, orange 20-39, red 40+)
- Worms die at 0 HP or by falling off the map

## Camera

- Camera follows active worm with smooth lerp (0.08)
- Left-click drag, middle-click drag, or right-click drag to pan freely
- Panning disables auto-follow until: turn changes, worm moves with arrow keys, or F key is pressed
- F key immediately recenters on active worm
- Scroll wheel zooms in/out (0.3x - 2x range) when not aiming
- Pinch-to-zoom on touch devices: two-finger spread/pinch controls zoom, with simultaneous two-finger pan

## UI Overlays

### Team Health Panel
- Top-left corner, always visible
- Shows per-team aggregate HP with colored bars and numeric totals
- Active team highlighted with larger dot and white outline
- HP bars color-coded (green/yellow/red) matching individual worm bars

### Weapon Tooltip
- Appears when hovering over any weapon slot in the HUD
- Shows weapon name+icon, damage, blast radius, and description
- Disappears when mouse leaves the weapon row

### Minimap
- Top-right corner, 150×75px
- Terrain profile sampled from collision data
- Team-colored dots for all living worms
- White rectangle showing camera viewport
- Click to pan camera to that world position

### Touch Controls (Mobile)
- Only shown on touch devices
- D-pad (left, right, jump) on left side
- Action buttons (aim/fire, weapon cycle, next turn) on right side
- Movement buttons repeat-fire while held

## Wind

- Random value from -10 to +10 each turn
- Affects projectile weapons (bazooka, grenade, airstrike)
- Displayed as directional arrow on HUD
- Force factor: `wind × 0.02` applied per frame

## Turn Flow (Current: Sandbox)

1. Player selects weapon (1-5 or Q/E)
2. Click to start aiming
3. Adjust angle (mouse) and power (scroll)
4. Click to fire
5. Projectile resolves (physics, explosion, damage)
6. Press Enter for next turn (cycles to next worm, randomizes wind)

## Turn Timer

Configurable in Game Setup with 5 presets:

| Preset | Duration | Description |
|--------|----------|-------------|
| Blitz | 15s | Fast-paced |
| Quick | 30s | Short turns |
| Normal | 45s | Default |
| Relaxed | 60s | Extended |
| Unlimited | ∞ | No timer |

- Timer starts counting down when a turn begins
- At ≤5 seconds, a tick sound plays each second
- At 0 seconds, the turn auto-resolves (weapon canceled, turn ends)
- In unlimited mode, no timer is created and the HUD shows "⏱∞"
