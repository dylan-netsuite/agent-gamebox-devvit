import * as Phaser from 'phaser';
import type { MapPreset } from '../../../shared/types/maps';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;
const BG_DEPTH = -5;
const FAR_DEPTH = -8;

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Draws thematic procedural background decorations for each map.
 * All elements are Graphics-based (no external assets).
 */
export class BackgroundRenderer {
  private scene: Phaser.Scene;
  private rng: () => number;

  constructor(scene: Phaser.Scene, seed: number) {
    this.scene = scene;
    this.rng = seededRandom(seed + 42424242);
  }

  draw(preset: MapPreset): void {
    switch (preset.id) {
      case 'hills':
        this.drawHills(preset);
        break;
      case 'islands':
        this.drawIslands(preset);
        break;
      case 'cavern':
        this.drawCavern(preset);
        break;
      case 'flatlands':
        this.drawFlatlands(preset);
        break;
      case 'cliffs':
        this.drawCliffs(preset);
        break;
      case 'desert':
        this.drawDesert(preset);
        break;
      case 'tundra':
        this.drawTundra(preset);
        break;
      case 'volcano':
        this.drawVolcano(preset);
        break;
    }
  }

  // ─── Common Helpers ───

  private drawCloud(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    scale: number,
    alpha: number,
    color = 0xffffff,
  ): void {
    gfx.fillStyle(color, alpha);
    const r = 20 * scale;
    gfx.fillCircle(cx, cy, r);
    gfx.fillCircle(cx - r * 0.8, cy + r * 0.2, r * 0.7);
    gfx.fillCircle(cx + r * 0.9, cy + r * 0.15, r * 0.75);
    gfx.fillCircle(cx - r * 0.3, cy - r * 0.5, r * 0.6);
    gfx.fillCircle(cx + r * 0.4, cy - r * 0.45, r * 0.65);
    gfx.fillCircle(cx + r * 1.5, cy + r * 0.3, r * 0.5);
    gfx.fillCircle(cx - r * 1.4, cy + r * 0.25, r * 0.55);
  }

  private drawMountainRange(
    gfx: Phaser.GameObjects.Graphics,
    baseY: number,
    color: number,
    alpha: number,
    peakCount: number,
    peakHeightMin: number,
    peakHeightMax: number,
  ): void {
    gfx.fillStyle(color, alpha);
    gfx.beginPath();
    gfx.moveTo(0, baseY);

    const segmentW = WORLD_WIDTH / peakCount;
    for (let i = 0; i <= peakCount; i++) {
      const x = i * segmentW;
      const peakH = peakHeightMin + this.rng() * (peakHeightMax - peakHeightMin);
      if (i % 2 === 0) {
        gfx.lineTo(x, baseY - peakH);
      } else {
        gfx.lineTo(x, baseY - peakH * 0.3);
      }
    }

    gfx.lineTo(WORLD_WIDTH, baseY);
    gfx.closePath();
    gfx.fillPath();
  }

  private drawSunDisc(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radius: number,
    color: number,
    glowColor: number,
  ): void {
    for (let i = 4; i >= 1; i--) {
      gfx.fillStyle(glowColor, 0.04 * i);
      gfx.fillCircle(x, y, radius + i * 15);
    }
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(x, y, radius);
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillCircle(x - radius * 0.2, y - radius * 0.2, radius * 0.4);
  }

  private drawStars(gfx: Phaser.GameObjects.Graphics, count: number, maxY: number): void {
    for (let i = 0; i < count; i++) {
      const x = this.rng() * WORLD_WIDTH;
      const y = this.rng() * maxY;
      const size = 0.5 + this.rng() * 1.5;
      const brightness = 0.3 + this.rng() * 0.7;
      gfx.fillStyle(0xffffff, brightness);
      gfx.fillCircle(x, y, size);
    }
  }

  private drawBirds(gfx: Phaser.GameObjects.Graphics, count: number, minY: number, maxY: number, color: number): void {
    gfx.lineStyle(1.5, color, 0.6);
    for (let i = 0; i < count; i++) {
      const bx = this.rng() * WORLD_WIDTH;
      const by = minY + this.rng() * (maxY - minY);
      const span = 6 + this.rng() * 8;
      gfx.beginPath();
      gfx.moveTo(bx - span, by + span * 0.3);
      gfx.lineTo(bx, by);
      gfx.lineTo(bx + span, by + span * 0.3);
      gfx.strokePath();
    }
  }

  private drawTreeLine(
    gfx: Phaser.GameObjects.Graphics,
    baseY: number,
    color: number,
    alpha: number,
    count: number,
  ): void {
    gfx.fillStyle(color, alpha);
    const spacing = WORLD_WIDTH / count;
    for (let i = 0; i < count; i++) {
      const tx = i * spacing + this.rng() * spacing * 0.5;
      const th = 15 + this.rng() * 25;
      const tw = 8 + this.rng() * 12;
      // Triangle tree
      gfx.beginPath();
      gfx.moveTo(tx, baseY - th);
      gfx.lineTo(tx - tw / 2, baseY);
      gfx.lineTo(tx + tw / 2, baseY);
      gfx.closePath();
      gfx.fillPath();
    }
  }

  // ─── Per-Map Backgrounds ───

  private drawHills(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Sun
    this.drawSunDisc(gfx, WORLD_WIDTH * 0.8, WORLD_HEIGHT * 0.12, 45, 0xfff59d, 0xffee58);

    // Distant hill layers (3 layers at different depths)
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.65, 0x2e7d32, 0.15, 8, 80, 180);
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.72, 0x388e3c, 0.2, 10, 60, 140);
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.78, 0x43a047, 0.25, 12, 40, 100);

    // Clouds
    const cloudGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    for (let i = 0; i < 8; i++) {
      const cx = this.rng() * WORLD_WIDTH;
      const cy = 60 + this.rng() * 200;
      const scale = 1.5 + this.rng() * 2;
      this.drawCloud(cloudGfx, cx, cy, scale, 0.5 + this.rng() * 0.3);
    }

    // Birds
    this.drawBirds(cloudGfx, 5, 50, 250, 0x333333);
  }

  private drawIslands(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Tropical sun
    this.drawSunDisc(gfx, WORLD_WIDTH * 0.75, WORLD_HEIGHT * 0.1, 50, 0xffee58, 0xfff176);

    // Sun rays
    const rayGfx = this.scene.add.graphics().setDepth(FAR_DEPTH - 1);
    rayGfx.lineStyle(2, 0xffffff, 0.06);
    const sunX = WORLD_WIDTH * 0.75;
    const sunY = WORLD_HEIGHT * 0.1;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const innerR = 70;
      const outerR = 200 + this.rng() * 100;
      rayGfx.beginPath();
      rayGfx.moveTo(sunX + Math.cos(angle) * innerR, sunY + Math.sin(angle) * innerR);
      rayGfx.lineTo(sunX + Math.cos(angle) * outerR, sunY + Math.sin(angle) * outerR);
      rayGfx.strokePath();
    }

    // Distant island silhouettes
    gfx.fillStyle(0x006064, 0.12);
    for (let i = 0; i < 4; i++) {
      const ix = 200 + this.rng() * (WORLD_WIDTH - 400);
      const iy = WORLD_HEIGHT * 0.72;
      const iw = 60 + this.rng() * 100;
      const ih = 20 + this.rng() * 30;
      gfx.fillEllipse(ix, iy, iw, ih);
      // Palm tree on island
      gfx.fillStyle(0x004d40, 0.15);
      const palmX = ix + (this.rng() - 0.5) * iw * 0.3;
      gfx.fillRect(palmX - 1.5, iy - ih - 20, 3, 22);
      // Palm fronds
      for (let f = 0; f < 4; f++) {
        const fAngle = -Math.PI * 0.8 + (f / 3) * Math.PI * 0.6;
        gfx.beginPath();
        gfx.moveTo(palmX, iy - ih - 20);
        gfx.lineTo(palmX + Math.cos(fAngle) * 18, iy - ih - 20 + Math.sin(fAngle) * 12);
        gfx.lineTo(palmX + Math.cos(fAngle) * 12, iy - ih - 20 + Math.sin(fAngle) * 8);
        gfx.closePath();
        gfx.fillPath();
      }
      gfx.fillStyle(0x006064, 0.12);
    }

    // Fluffy clouds
    const cloudGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    for (let i = 0; i < 6; i++) {
      const cx = this.rng() * WORLD_WIDTH;
      const cy = 40 + this.rng() * 160;
      const scale = 1.2 + this.rng() * 2.5;
      this.drawCloud(cloudGfx, cx, cy, scale, 0.6 + this.rng() * 0.2);
    }

    // Sea birds
    this.drawBirds(cloudGfx, 4, 80, 200, 0x444444);
  }

  private drawCavern(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(BG_DEPTH);

    // Glowing crystal clusters
    const crystalColors = [0x00e5ff, 0x7c4dff, 0x69f0ae, 0xff4081];
    for (let i = 0; i < 20; i++) {
      const cx = this.rng() * WORLD_WIDTH;
      const cy = WORLD_HEIGHT * 0.3 + this.rng() * WORLD_HEIGHT * 0.5;
      const color = crystalColors[Math.floor(this.rng() * crystalColors.length)]!;
      const size = 2 + this.rng() * 4;

      // Glow halo
      gfx.fillStyle(color, 0.08);
      gfx.fillCircle(cx, cy, size * 6);
      gfx.fillStyle(color, 0.15);
      gfx.fillCircle(cx, cy, size * 3);
      // Crystal core
      gfx.fillStyle(color, 0.5);
      gfx.fillCircle(cx, cy, size);
      // Bright center
      gfx.fillStyle(0xffffff, 0.3);
      gfx.fillCircle(cx, cy, size * 0.4);
    }

    // Ambient light spots on ceiling
    for (let i = 0; i < 10; i++) {
      const x = this.rng() * WORLD_WIDTH;
      const y = this.rng() * WORLD_HEIGHT * 0.25;
      const color = crystalColors[Math.floor(this.rng() * crystalColors.length)]!;
      gfx.fillStyle(color, 0.03);
      gfx.fillCircle(x, y, 40 + this.rng() * 60);
    }

    // Stalactite drip effects (vertical dotted lines)
    gfx.fillStyle(0x4fc3f7, 0.15);
    for (let i = 0; i < 15; i++) {
      const dx = this.rng() * WORLD_WIDTH;
      const startY = this.rng() * WORLD_HEIGHT * 0.3;
      const dripLen = 30 + this.rng() * 80;
      for (let dy = 0; dy < dripLen; dy += 6) {
        gfx.fillCircle(dx, startY + dy, 1);
      }
    }
  }

  private drawFlatlands(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Sun
    this.drawSunDisc(gfx, WORLD_WIDTH * 0.2, WORLD_HEIGHT * 0.15, 40, 0xfff59d, 0xffee58);

    // Distant tree line
    this.drawTreeLine(gfx, WORLD_HEIGHT * 0.68, 0x2e7d32, 0.15, 40);
    this.drawTreeLine(gfx, WORLD_HEIGHT * 0.72, 0x388e3c, 0.2, 50);

    // Clouds
    const cloudGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    for (let i = 0; i < 10; i++) {
      const cx = this.rng() * WORLD_WIDTH;
      const cy = 50 + this.rng() * 220;
      const scale = 1 + this.rng() * 2;
      this.drawCloud(cloudGfx, cx, cy, scale, 0.35 + this.rng() * 0.3);
    }

    // Birds
    this.drawBirds(cloudGfx, 7, 40, 200, 0x333333);
  }

  private drawCliffs(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Distant snow-capped mountains
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.55, 0x37474f, 0.12, 6, 150, 300);
    // Snow caps
    const snowGfx = this.scene.add.graphics().setDepth(FAR_DEPTH + 0.1);
    snowGfx.fillStyle(0xffffff, 0.1);
    for (let i = 0; i < 6; i++) {
      const px = (i / 6) * WORLD_WIDTH + this.rng() * 100;
      if (i % 2 === 0) {
        const peakY = WORLD_HEIGHT * 0.55 - (150 + this.rng() * 150);
        snowGfx.fillTriangle(px - 30, peakY + 40, px, peakY, px + 30, peakY + 40);
      }
    }

    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.65, 0x455a64, 0.18, 8, 100, 200);

    // Mist layers
    const mistGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    for (let layer = 0; layer < 3; layer++) {
      const y = WORLD_HEIGHT * (0.5 + layer * 0.1);
      mistGfx.fillStyle(0xb0bec5, 0.04 + layer * 0.02);
      mistGfx.fillRect(0, y, WORLD_WIDTH, 30);
    }

    // Wispy clouds
    for (let i = 0; i < 5; i++) {
      const cx = this.rng() * WORLD_WIDTH;
      const cy = 60 + this.rng() * 150;
      // Wispy = elongated ellipses
      mistGfx.fillStyle(0xffffff, 0.25 + this.rng() * 0.15);
      const w = 60 + this.rng() * 120;
      const h = 6 + this.rng() * 10;
      mistGfx.fillEllipse(cx, cy, w, h);
    }

    // Eagles
    this.drawBirds(mistGfx, 3, 80, 250, 0x263238);
  }

  private drawDesert(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Large desert sun
    this.drawSunDisc(gfx, WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.1, 65, 0xffee58, 0xffa000);

    // Distant mesa silhouettes
    gfx.fillStyle(0xbf360c, 0.1);
    for (let i = 0; i < 5; i++) {
      const mx = this.rng() * WORLD_WIDTH;
      const mw = 80 + this.rng() * 200;
      const mh = 40 + this.rng() * 80;
      const baseY = WORLD_HEIGHT * 0.62;
      // Flat-topped mesa shape
      gfx.beginPath();
      gfx.moveTo(mx - mw / 2, baseY);
      gfx.lineTo(mx - mw * 0.3, baseY - mh);
      gfx.lineTo(mx + mw * 0.3, baseY - mh);
      gfx.lineTo(mx + mw / 2, baseY);
      gfx.closePath();
      gfx.fillPath();
    }

    // Heat shimmer effect (horizontal wavy lines)
    const shimmerGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    shimmerGfx.lineStyle(1, 0xffffff, 0.04);
    for (let y = WORLD_HEIGHT * 0.4; y < WORLD_HEIGHT * 0.75; y += 20) {
      shimmerGfx.beginPath();
      shimmerGfx.moveTo(0, y);
      for (let x = 0; x < WORLD_WIDTH; x += 10) {
        const wave = Math.sin(x * 0.02 + y * 0.1) * 3;
        shimmerGfx.lineTo(x, y + wave);
      }
      shimmerGfx.strokePath();
    }

    // Vultures
    this.drawBirds(shimmerGfx, 4, 60, 200, 0x3e2723);

    // Cactus silhouettes
    gfx.fillStyle(0x33691e, 0.08);
    for (let i = 0; i < 6; i++) {
      const cx = this.rng() * WORLD_WIDTH;
      const baseY = WORLD_HEIGHT * 0.7;
      const h = 20 + this.rng() * 30;
      gfx.fillRect(cx - 2, baseY - h, 4, h);
      // Arms
      if (this.rng() > 0.3) {
        const armY = baseY - h * 0.6;
        const armDir = this.rng() > 0.5 ? 1 : -1;
        gfx.fillRect(cx + armDir * 2, armY, armDir * 8, 3);
        gfx.fillRect(cx + armDir * 10, armY - 10, 3, 13);
      }
    }
  }

  private drawTundra(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Distant frozen peaks
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.6, 0x546e7a, 0.15, 7, 120, 250);
    // Snow highlights on peaks
    gfx.fillStyle(0xeceff1, 0.12);
    for (let i = 0; i < 7; i++) {
      if (i % 2 === 0) {
        const px = (i / 7) * WORLD_WIDTH;
        const peakY = WORLD_HEIGHT * 0.6 - (120 + this.rng() * 130);
        gfx.fillTriangle(px - 20, peakY + 30, px, peakY, px + 20, peakY + 30);
      }
    }

    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.7, 0x607d8b, 0.2, 9, 60, 150);

    // Aurora borealis
    const auroraGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    const auroraColors = [0x00e676, 0x69f0ae, 0x00bfa5, 0x1de9b6, 0xb388ff];
    for (let band = 0; band < 5; band++) {
      const color = auroraColors[band]!;
      const baseY = 40 + band * 50 + this.rng() * 30;
      auroraGfx.lineStyle(8 + this.rng() * 12, color, 0.06 + this.rng() * 0.04);
      auroraGfx.beginPath();
      auroraGfx.moveTo(0, baseY);
      for (let x = 0; x < WORLD_WIDTH; x += 30) {
        const wave = Math.sin(x * 0.003 + band * 1.5) * 40 + Math.sin(x * 0.008 + band) * 15;
        auroraGfx.lineTo(x, baseY + wave);
      }
      auroraGfx.strokePath();
    }

    // Snowflake particles
    auroraGfx.fillStyle(0xffffff, 0.25);
    for (let i = 0; i < 60; i++) {
      const sx = this.rng() * WORLD_WIDTH;
      const sy = this.rng() * WORLD_HEIGHT * 0.8;
      const size = 1 + this.rng() * 2;
      auroraGfx.fillCircle(sx, sy, size);
    }
  }

  private drawVolcano(_preset: MapPreset): void {
    const gfx = this.scene.add.graphics().setDepth(FAR_DEPTH);

    // Lava glow on horizon
    gfx.fillStyle(0xff3d00, 0.08);
    gfx.fillRect(0, WORLD_HEIGHT * 0.6, WORLD_WIDTH, WORLD_HEIGHT * 0.3);
    gfx.fillStyle(0xff6e40, 0.05);
    gfx.fillRect(0, WORLD_HEIGHT * 0.5, WORLD_WIDTH, WORLD_HEIGHT * 0.2);

    // Distant volcanic peaks
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.55, 0x3e0000, 0.2, 5, 150, 300);
    this.drawMountainRange(gfx, WORLD_HEIGHT * 0.65, 0x4e0000, 0.25, 7, 80, 180);

    // Smoke columns
    const smokeGfx = this.scene.add.graphics().setDepth(BG_DEPTH);
    for (let col = 0; col < 3; col++) {
      const baseX = 300 + this.rng() * (WORLD_WIDTH - 600);
      const baseY = WORLD_HEIGHT * 0.35;
      for (let p = 0; p < 15; p++) {
        const py = baseY - p * 20 - this.rng() * 10;
        const px = baseX + (this.rng() - 0.5) * (p * 6);
        const size = 8 + p * 2 + this.rng() * 5;
        smokeGfx.fillStyle(0x424242, 0.04 + (15 - p) * 0.005);
        smokeGfx.fillCircle(px, py, size);
      }
    }

    // Rising ember particles
    smokeGfx.fillStyle(0xff6600, 0.3);
    for (let i = 0; i < 40; i++) {
      const ex = this.rng() * WORLD_WIDTH;
      const ey = WORLD_HEIGHT * 0.4 + this.rng() * WORLD_HEIGHT * 0.5;
      const size = 1 + this.rng() * 2;
      smokeGfx.fillCircle(ex, ey, size);
    }
    smokeGfx.fillStyle(0xffab00, 0.2);
    for (let i = 0; i < 25; i++) {
      const ex = this.rng() * WORLD_WIDTH;
      const ey = WORLD_HEIGHT * 0.3 + this.rng() * WORLD_HEIGHT * 0.4;
      smokeGfx.fillCircle(ex, ey, 0.5 + this.rng() * 1.5);
    }

    // Dim stars visible through smoke
    this.drawStars(smokeGfx, 30, WORLD_HEIGHT * 0.3);
  }
}
