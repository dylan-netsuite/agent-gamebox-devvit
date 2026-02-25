import * as Phaser from 'phaser';
import { WALL_RESTITUTION, WALL_THICKNESS, scaleValue, toScreen } from '../utils/physics';

export interface WallSegment {
  points: { x: number; y: number }[];
  color?: number;
}

export class Walls {
  scene: Phaser.Scene;
  bodies: MatterJS.BodyType[] = [];
  graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(4);
  }

  buildFromPolygons(polygons: { x: number; y: number }[][], color: number = 0xff69b4): void {
    for (const poly of polygons) {
      if (poly.length < 2) continue;

      for (let i = 0; i < poly.length - 1; i++) {
        const a = poly[i]!;
        const b = poly[i + 1]!;

        this.addWallSegment(a, b, color);
      }
    }
  }

  private addWallSegment(
    a: { x: number; y: number },
    b: { x: number; y: number },
    color: number
  ): void {
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

    this.graphics.lineStyle(thickness, color, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(sa.x, sa.y);
    this.graphics.lineTo(sb.x, sb.y);
    this.graphics.strokePath();
  }

  drawFill(polygons: { x: number; y: number }[][], fillColor: number, alpha: number = 1): void {
    for (const poly of polygons) {
      if (poly.length < 3) continue;
      const screenPoly = poly.map((p) => toScreen(this.scene, p.x, p.y));
      this.graphics.fillStyle(fillColor, alpha);
      this.graphics.beginPath();
      this.graphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.graphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
      }
      this.graphics.closePath();
      this.graphics.fillPath();
    }
  }

  destroy(): void {
    for (const body of this.bodies) {
      this.scene.matter.world.remove(body);
    }
    this.bodies = [];
    this.graphics.destroy();
  }
}
