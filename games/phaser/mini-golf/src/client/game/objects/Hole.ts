import * as Phaser from 'phaser';
import { CAPTURE_VELOCITY_THRESHOLD, scaleValue } from '../utils/physics';

export class Hole {
  scene: Phaser.Scene;
  x: number;
  y: number;
  radius: number;
  graphics: Phaser.GameObjects.Graphics;
  flagGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = scaleValue(scene, 12);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);
    this.drawHole();

    this.flagGraphics = scene.add.graphics();
    this.flagGraphics.setDepth(3);
    this.drawFlag();
  }

  private drawHole(): void {
    this.graphics.fillStyle(0x000000, 0.9);
    this.graphics.fillCircle(this.x, this.y, this.radius);
    this.graphics.lineStyle(2, 0x333333, 0.8);
    this.graphics.strokeCircle(this.x, this.y, this.radius);
    this.graphics.fillStyle(0x111111, 0.5);
    this.graphics.fillCircle(this.x, this.y, this.radius * 0.5);
  }

  private drawFlag(): void {
    const poleHeight = scaleValue(this.scene, 30);
    const flagW = scaleValue(this.scene, 14);
    const flagH = scaleValue(this.scene, 10);

    this.flagGraphics.lineStyle(2, 0xcccccc, 0.8);
    this.flagGraphics.beginPath();
    this.flagGraphics.moveTo(this.x, this.y);
    this.flagGraphics.lineTo(this.x, this.y - poleHeight);
    this.flagGraphics.strokePath();

    this.flagGraphics.fillStyle(0xff1493, 1);
    this.flagGraphics.fillTriangle(
      this.x, this.y - poleHeight,
      this.x + flagW, this.y - poleHeight + flagH / 2,
      this.x, this.y - poleHeight + flagH
    );
  }

  canCapture(ballX: number, ballY: number, ballSpeed: number): boolean {
    const dx = ballX - this.x;
    const dy = ballY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.radius && ballSpeed < CAPTURE_VELOCITY_THRESHOLD;
  }

  destroy(): void {
    this.graphics.destroy();
    this.flagGraphics.destroy();
  }
}
