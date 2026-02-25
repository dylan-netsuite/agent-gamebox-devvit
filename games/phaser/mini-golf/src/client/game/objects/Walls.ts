import * as Phaser from 'phaser';
import { WALL_RESTITUTION, WALL_THICKNESS, scaleValue, toScreen } from '../utils/physics';

export class Walls {
  scene: Phaser.Scene;
  bodies: MatterJS.BodyType[] = [];
  private gameObjects: Phaser.GameObjects.GameObject[] = [];
  private fairwayGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.fairwayGraphics = scene.add.graphics();
    this.fairwayGraphics.setDepth(2);
  }

  buildFromPolygons(polygons: { x: number; y: number }[][]): void {
    for (const poly of polygons) {
      if (poly.length < 2) continue;

      const screenPoints: { x: number; y: number }[] = [];
      for (const p of poly) {
        screenPoints.push(toScreen(this.scene, p.x, p.y));
      }

      const thickness = scaleValue(this.scene, WALL_THICKNESS);

      for (let i = 0; i < poly.length - 1; i++) {
        this.addWallSegment(poly[i]!, poly[i + 1]!, screenPoints[i]!, screenPoints[i + 1]!, thickness);
      }

      // Corner joints
      for (let i = 1; i < screenPoints.length - 1; i++) {
        this.addCornerJoint(screenPoints[i]!.x, screenPoints[i]!.y, thickness);
      }
      // Closing corner
      const first = screenPoints[0]!;
      const last = screenPoints[screenPoints.length - 1]!;
      if (Math.abs(first.x - last.x) < 2 && Math.abs(first.y - last.y) < 2) {
        this.addCornerJoint(first.x, first.y, thickness);
      }
    }
  }

  private addWallSegment(
    a: { x: number; y: number },
    b: { x: number; y: number },
    sa: { x: number; y: number },
    sb: { x: number; y: number },
    thickness: number
  ): void {
    const dx = sb.x - sa.x;
    const dy = sb.y - sa.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    if (len < 1) return;

    // Physics body
    const mx = (sa.x + sb.x) / 2;
    const my = (sa.y + sb.y) / 2;
    const body = this.scene.matter.add.rectangle(mx, my, len, thickness, {
      isStatic: true,
      angle,
      restitution: WALL_RESTITUTION,
      friction: 0.1,
      label: 'wall',
    });
    this.bodies.push(body);

    // Visual: TileSprite textured with candy-cane pattern
    const tile = this.scene.add.tileSprite(mx, my, len, thickness, 'candy-cane');
    tile.setRotation(angle);
    tile.setDepth(4);
    this.gameObjects.push(tile);
  }

  private addCornerJoint(x: number, y: number, thickness: number): void {
    const img = this.scene.add.image(x, y, 'candy-cane-corner');
    const scale = thickness / img.width;
    img.setScale(scale);
    img.setDepth(5);
    this.gameObjects.push(img);
  }

  drawFill(polygons: { x: number; y: number }[][]): void {
    for (const poly of polygons) {
      if (poly.length < 3) continue;
      const screenPoly = poly.map((p) => toScreen(this.scene, p.x, p.y));

      // Main green fill
      this.fairwayGraphics.fillStyle(0x2d8a4e, 1);
      this.fairwayGraphics.beginPath();
      this.fairwayGraphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.fairwayGraphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
      }
      this.fairwayGraphics.closePath();
      this.fairwayGraphics.fillPath();

      // Clean inner border
      this.fairwayGraphics.lineStyle(scaleValue(this.scene, 2.5), 0x3aad5c, 0.5);
      this.fairwayGraphics.beginPath();
      this.fairwayGraphics.moveTo(screenPoly[0]!.x, screenPoly[0]!.y);
      for (let i = 1; i < screenPoly.length; i++) {
        this.fairwayGraphics.lineTo(screenPoly[i]!.x, screenPoly[i]!.y);
      }
      this.fairwayGraphics.closePath();
      this.fairwayGraphics.strokePath();
    }
  }

  destroy(): void {
    for (const body of this.bodies) {
      this.scene.matter.world.remove(body);
    }
    this.bodies = [];
    for (const obj of this.gameObjects) {
      obj.destroy();
    }
    this.gameObjects = [];
    this.fairwayGraphics.destroy();
  }
}
