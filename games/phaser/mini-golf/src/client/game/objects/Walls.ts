import * as Phaser from 'phaser';
import { WALL_RESTITUTION, WALL_THICKNESS, scaleValue, toScreen } from '../utils/physics';

export class Walls {
  scene: Phaser.Scene;
  bodies: MatterJS.BodyType[] = [];
  graphics: Phaser.GameObjects.Graphics;
  private stripeGraphics: Phaser.GameObjects.Graphics;
  private cornerGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(4);
    this.stripeGraphics = scene.add.graphics();
    this.stripeGraphics.setDepth(5);
    this.cornerGraphics = scene.add.graphics();
    this.cornerGraphics.setDepth(6);
  }

  buildFromPolygons(polygons: { x: number; y: number }[][], _color: number = 0xff69b4): void {
    for (const poly of polygons) {
      if (poly.length < 2) continue;

      const screenPoints: { x: number; y: number }[] = [];
      for (const p of poly) {
        screenPoints.push(toScreen(this.scene, p.x, p.y));
      }

      const thickness = scaleValue(this.scene, WALL_THICKNESS);

      for (let i = 0; i < screenPoints.length - 1; i++) {
        const a = poly[i]!;
        const b = poly[i + 1]!;
        this.addWallBody(a, b);
        this.drawCandyCaneSegment(
          screenPoints[i]!.x,
          screenPoints[i]!.y,
          screenPoints[i + 1]!.x,
          screenPoints[i + 1]!.y,
          thickness
        );
      }

      // Draw rounded corner joints
      for (let i = 1; i < screenPoints.length - 1; i++) {
        this.drawCornerJoint(screenPoints[i]!.x, screenPoints[i]!.y, thickness);
      }
      // Close the loop corners if polygon is closed
      if (
        screenPoints.length > 2 &&
        Math.abs(screenPoints[0]!.x - screenPoints[screenPoints.length - 1]!.x) < 2 &&
        Math.abs(screenPoints[0]!.y - screenPoints[screenPoints.length - 1]!.y) < 2
      ) {
        this.drawCornerJoint(screenPoints[0]!.x, screenPoints[0]!.y, thickness);
      }
    }
  }

  private addWallBody(a: { x: number; y: number }, b: { x: number; y: number }): void {
    const sa = toScreen(this.scene, a.x, a.y);
    const sb = toScreen(this.scene, b.x, b.y);

    const mx = (sa.x + sb.x) / 2;
    const my = (sa.y + sb.y) / 2;
    const dx = sb.x - sa.x;
    const dy = sb.y - sa.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const thickness = scaleValue(this.scene, WALL_THICKNESS);

    if (len < 1) return;

    const body = this.scene.matter.add.rectangle(mx, my, len, thickness, {
      isStatic: true,
      angle,
      restitution: WALL_RESTITUTION,
      friction: 0.1,
      label: 'wall',
    });
    this.bodies.push(body);
  }

  private drawCandyCaneSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    thickness: number
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;

    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const half = thickness / 2;

    // White base with slight cream tint
    this.graphics.lineStyle(thickness, 0xf8f0f0, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.strokePath();

    // Tight diagonal red stripes — closely spaced for authentic candy cane look
    const stripeW = thickness * 0.45;
    const gap = thickness * 0.85;
    const skew = thickness * 0.9;
    const count = Math.ceil((len + skew * 2) / gap) + 4;

    for (let i = -3; i < count; i++) {
      const t = i * gap;

      const ax = x1 + ux * t - nx * half;
      const ay = y1 + uy * t - ny * half;
      const bx = x1 + ux * (t + skew) + nx * half;
      const by = y1 + uy * (t + skew) + ny * half;
      const cx = x1 + ux * (t + skew + stripeW) + nx * half;
      const cy = y1 + uy * (t + skew + stripeW) + ny * half;
      const ddx = x1 + ux * (t + stripeW) - nx * half;
      const ddy = y1 + uy * (t + stripeW) - ny * half;

      this.stripeGraphics.fillStyle(0xcc0000, 1);
      this.stripeGraphics.beginPath();
      this.stripeGraphics.moveTo(ax, ay);
      this.stripeGraphics.lineTo(bx, by);
      this.stripeGraphics.lineTo(cx, cy);
      this.stripeGraphics.lineTo(ddx, ddy);
      this.stripeGraphics.closePath();
      this.stripeGraphics.fillPath();
    }

    // Outer edge highlights for cylindrical 3D look
    this.stripeGraphics.lineStyle(1.5, 0xffffff, 0.5);
    this.stripeGraphics.beginPath();
    this.stripeGraphics.moveTo(x1 + nx * half, y1 + ny * half);
    this.stripeGraphics.lineTo(x2 + nx * half, y2 + ny * half);
    this.stripeGraphics.strokePath();

    this.stripeGraphics.lineStyle(1.5, 0xddcccc, 0.35);
    this.stripeGraphics.beginPath();
    this.stripeGraphics.moveTo(x1 - nx * half, y1 - ny * half);
    this.stripeGraphics.lineTo(x2 - nx * half, y2 - ny * half);
    this.stripeGraphics.strokePath();

    // Center highlight for cylindrical sheen
    this.stripeGraphics.lineStyle(thickness * 0.15, 0xffffff, 0.15);
    this.stripeGraphics.beginPath();
    this.stripeGraphics.moveTo(x1, y1);
    this.stripeGraphics.lineTo(x2, y2);
    this.stripeGraphics.strokePath();
  }

  private drawCornerJoint(x: number, y: number, thickness: number): void {
    const r = thickness / 2 + 1;

    // White base circle — slightly larger to cover stripe overlap
    this.cornerGraphics.fillStyle(0xf8f0f0, 1);
    this.cornerGraphics.fillCircle(x, y, r);

    // Red spiral segments for peppermint swirl look
    const segments = 6;
    for (let i = 0; i < segments; i += 2) {
      const startAngle = (i * Math.PI * 2) / segments;
      const endAngle = startAngle + Math.PI / (segments / 2);

      this.cornerGraphics.fillStyle(0xcc0000, 1);
      this.cornerGraphics.beginPath();
      this.cornerGraphics.moveTo(x, y);
      this.cornerGraphics.arc(x, y, r, startAngle, endAngle, false);
      this.cornerGraphics.closePath();
      this.cornerGraphics.fillPath();
    }

    // Center dot
    this.cornerGraphics.fillStyle(0xcc0000, 1);
    this.cornerGraphics.fillCircle(x, y, r * 0.2);

    // Highlight
    this.cornerGraphics.fillStyle(0xffffff, 0.25);
    this.cornerGraphics.fillCircle(x - r * 0.2, y - r * 0.2, r * 0.35);

    // Outer ring
    this.cornerGraphics.lineStyle(1.5, 0xffffff, 0.35);
    this.cornerGraphics.strokeCircle(x, y, r);
  }

  drawFill(polygons: { x: number; y: number }[][], fillColor: number, alpha: number = 1): void {
    const thickness = scaleValue(this.scene, WALL_THICKNESS);
    const inset = thickness * 0.1;

    for (const poly of polygons) {
      if (poly.length < 3) continue;
      const screenPoly = poly.map((p) => toScreen(this.scene, p.x, p.y));

      // Main green fill
      this.graphics.fillStyle(fillColor, alpha);
      this.graphics.beginPath();
      this.graphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.graphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
      }
      this.graphics.closePath();
      this.graphics.fillPath();

      // Inner lighter border (inset glow like the concept)
      this.graphics.lineStyle(scaleValue(this.scene, 4), 0x3aad5c, 0.6);
      this.graphics.beginPath();
      const cx = screenPoly.reduce((s, p) => s + p.x, 0) / screenPoly.length;
      const cy = screenPoly.reduce((s, p) => s + p.y, 0) / screenPoly.length;
      for (let i = 0; i < screenPoly.length; i++) {
        const p = screenPoly[i]!;
        const ix = p.x + (cx - p.x) * (inset / Math.max(1, Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)));
        const iy = p.y + (cy - p.y) * (inset / Math.max(1, Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)));
        if (i === 0) this.graphics.moveTo(ix, iy);
        else this.graphics.lineTo(ix, iy);
      }
      this.graphics.closePath();
      this.graphics.strokePath();

      // Subtle inner edge highlight
      this.graphics.lineStyle(scaleValue(this.scene, 1.5), 0x4cc070, 0.3);
      this.graphics.beginPath();
      for (let i = 0; i < screenPoly.length; i++) {
        const p = screenPoly[i]!;
        const factor = inset * 2.5;
        const ix = p.x + (cx - p.x) * (factor / Math.max(1, Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)));
        const iy = p.y + (cy - p.y) * (factor / Math.max(1, Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2)));
        if (i === 0) this.graphics.moveTo(ix, iy);
        else this.graphics.lineTo(ix, iy);
      }
      this.graphics.closePath();
      this.graphics.strokePath();
    }
  }

  destroy(): void {
    for (const body of this.bodies) {
      this.scene.matter.world.remove(body);
    }
    this.bodies = [];
    this.graphics.destroy();
    this.stripeGraphics.destroy();
    this.cornerGraphics.destroy();
  }
}
