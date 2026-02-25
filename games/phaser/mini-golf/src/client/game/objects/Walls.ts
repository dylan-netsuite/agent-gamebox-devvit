import * as Phaser from 'phaser';
import { WALL_RESTITUTION, WALL_THICKNESS, scaleValue, toScreen } from '../utils/physics';

export class Walls {
  scene: Phaser.Scene;
  bodies: MatterJS.BodyType[] = [];
  graphics: Phaser.GameObjects.Graphics;
  private stripeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(4);
    this.stripeGraphics = scene.add.graphics();
    this.stripeGraphics.setDepth(5);
  }

  buildFromPolygons(polygons: { x: number; y: number }[][], _color: number = 0xff69b4): void {
    for (const poly of polygons) {
      if (poly.length < 2) continue;

      for (let i = 0; i < poly.length - 1; i++) {
        const a = poly[i]!;
        const b = poly[i + 1]!;
        this.addWallSegment(a, b);
      }
    }
  }

  private addWallSegment(a: { x: number; y: number }, b: { x: number; y: number }): void {
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

    this.drawCandyCaneSegment(sa.x, sa.y, sb.x, sb.y, thickness);
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

    // White base
    this.graphics.lineStyle(thickness, 0xffffff, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.strokePath();

    // Diagonal red stripes — parallelogram-shaped, tilted 45 degrees
    const stripeW = thickness * 0.6;
    const gap = thickness * 1.2;
    const skew = thickness * 0.7;
    const count = Math.ceil((len + skew * 2) / gap) + 2;

    for (let i = -2; i < count; i++) {
      const t = i * gap - skew;

      // Four corners of a skewed parallelogram stripe
      const ax = x1 + ux * t - nx * half;
      const ay = y1 + uy * t - ny * half;
      const bx = x1 + ux * (t + skew) + nx * half;
      const by = y1 + uy * (t + skew) + ny * half;
      const cx = x1 + ux * (t + skew + stripeW) + nx * half;
      const cy = y1 + uy * (t + skew + stripeW) + ny * half;
      const ddx = x1 + ux * (t + stripeW) - nx * half;
      const ddy = y1 + uy * (t + stripeW) - ny * half;

      this.stripeGraphics.fillStyle(0xcc0000, 0.9);
      this.stripeGraphics.beginPath();
      this.stripeGraphics.moveTo(ax, ay);
      this.stripeGraphics.lineTo(bx, by);
      this.stripeGraphics.lineTo(cx, cy);
      this.stripeGraphics.lineTo(ddx, ddy);
      this.stripeGraphics.closePath();
      this.stripeGraphics.fillPath();
    }

    // Edge highlights for 3D depth
    this.stripeGraphics.lineStyle(1, 0xffffff, 0.4);
    this.stripeGraphics.beginPath();
    this.stripeGraphics.moveTo(x1 + nx * half, y1 + ny * half);
    this.stripeGraphics.lineTo(x2 + nx * half, y2 + ny * half);
    this.stripeGraphics.strokePath();
    this.stripeGraphics.lineStyle(1, 0xcccccc, 0.25);
    this.stripeGraphics.beginPath();
    this.stripeGraphics.moveTo(x1 - nx * half, y1 - ny * half);
    this.stripeGraphics.lineTo(x2 - nx * half, y2 - ny * half);
    this.stripeGraphics.strokePath();
  }

  drawFill(polygons: { x: number; y: number }[][], fillColor: number, alpha: number = 1): void {
    for (const poly of polygons) {
      if (poly.length < 3) continue;
      const screenPoly = poly.map((p) => toScreen(this.scene, p.x, p.y));

      // Outer glow
      this.graphics.fillStyle(0x3da85e, alpha * 0.3);
      this.graphics.beginPath();
      this.graphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.graphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
      }
      this.graphics.closePath();
      this.graphics.fillPath();

      // Main fill
      this.graphics.fillStyle(fillColor, alpha);
      this.graphics.beginPath();
      this.graphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.graphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
      }
      this.graphics.closePath();
      this.graphics.fillPath();

      // Inner lighter border
      this.graphics.lineStyle(scaleValue(this.scene, 3), 0x3da85e, 0.5);
      this.graphics.beginPath();
      this.graphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.graphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
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
  }
}
