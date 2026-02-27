import * as Phaser from 'phaser';
import { scaleValue } from '../utils/physics';

export class AimArrow {
  scene: Phaser.Scene;
  graphics: Phaser.GameObjects.Graphics;
  dottedLine: Phaser.GameObjects.Graphics;
  angle: number = -Math.PI / 2;
  visible: boolean = true;
  private arrowLength: number;
  private ballX: number = 0;
  private ballY: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.arrowLength = scaleValue(scene, 60);

    this.dottedLine = scene.add.graphics();
    this.dottedLine.setDepth(5);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(6);
  }

  updatePosition(bx: number, by: number): void {
    this.ballX = bx;
    this.ballY = by;
  }

  updateAngle(pointerX: number, pointerY: number): void {
    this.angle = Math.atan2(pointerY - this.ballY, pointerX - this.ballX);
  }

  draw(powerNormalized: number): void {
    this.graphics.clear();
    this.dottedLine.clear();

    if (!this.visible) return;

    const len = this.arrowLength * (0.5 + powerNormalized * 0.5);
    const endX = this.ballX + Math.cos(this.angle) * len;
    const endY = this.ballY + Math.sin(this.angle) * len;

    const r = Math.round(100 + powerNormalized * 155);
    const g = Math.round(150 * (1 - powerNormalized));
    const b = Math.round(255 * (1 - powerNormalized));
    const color = (r << 16) | (g << 8) | b;

    const lineWidth = scaleValue(this.scene, 3);
    this.graphics.lineStyle(lineWidth, color, 0.9);
    this.graphics.beginPath();
    this.graphics.moveTo(this.ballX, this.ballY);
    this.graphics.lineTo(endX, endY);
    this.graphics.strokePath();

    const headLen = scaleValue(this.scene, 10);
    const headAngle = 0.4;
    const lx = endX - Math.cos(this.angle - headAngle) * headLen;
    const ly = endY - Math.sin(this.angle - headAngle) * headLen;
    const rx = endX - Math.cos(this.angle + headAngle) * headLen;
    const ry = endY - Math.sin(this.angle + headAngle) * headLen;

    this.graphics.fillStyle(color, 0.9);
    this.graphics.fillTriangle(endX, endY, lx, ly, rx, ry);

    const dotSpacing = scaleValue(this.scene, 12);
    const dotRadius = scaleValue(this.scene, 1.5);
    const numDots = 8;
    this.dottedLine.fillStyle(0xffffff, 0.25);
    for (let i = 1; i <= numDots; i++) {
      const t = i * dotSpacing;
      const dx = this.ballX + Math.cos(this.angle) * (len + t);
      const dy = this.ballY + Math.sin(this.angle) * (len + t);
      this.dottedLine.fillCircle(dx, dy, dotRadius);
    }
  }

  setVisible(v: boolean): void {
    this.visible = v;
    if (!v) {
      this.graphics.clear();
      this.dottedLine.clear();
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.dottedLine.destroy();
  }
}
