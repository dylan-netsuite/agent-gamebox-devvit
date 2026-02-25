import * as Phaser from 'phaser';
import {
  CAPTURE_VELOCITY_THRESHOLD,
  CAPTURE_RADIUS,
  ATTRACTION_RADIUS,
  ATTRACTION_STRENGTH,
  scaleValue,
} from '../utils/physics';
import type { GolfBall } from './GolfBall';

export class Hole {
  scene: Phaser.Scene;
  x: number;
  y: number;
  captureRadius: number;
  attractionRadius: number;
  visualRadius: number;
  graphics: Phaser.GameObjects.Graphics;
  flagGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.captureRadius = scaleValue(scene, CAPTURE_RADIUS);
    this.attractionRadius = scaleValue(scene, ATTRACTION_RADIUS);
    this.visualRadius = scaleValue(scene, 14);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);
    this.drawHole();

    this.flagGraphics = scene.add.graphics();
    this.flagGraphics.setDepth(3);
    this.drawFlag();
  }

  private drawHole(): void {
    // Outer shadow ring
    this.graphics.fillStyle(0x0a0a0a, 0.2);
    this.graphics.fillCircle(this.x, this.y, this.attractionRadius);

    // Darker ring around hole
    this.graphics.fillStyle(0x111111, 0.6);
    this.graphics.fillCircle(this.x, this.y, this.visualRadius * 1.3);

    // Main hole
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(this.x, this.y, this.visualRadius);

    // Rim highlight
    this.graphics.lineStyle(2, 0x444444, 0.7);
    this.graphics.strokeCircle(this.x, this.y, this.visualRadius);

    // Inner depth
    this.graphics.fillStyle(0x080808, 0.8);
    this.graphics.fillCircle(this.x, this.y, this.visualRadius * 0.6);
  }

  private drawFlag(): void {
    const poleHeight = scaleValue(this.scene, 34);
    const flagW = scaleValue(this.scene, 12);
    const flagH = scaleValue(this.scene, 8);

    // Pole shadow
    this.flagGraphics.lineStyle(3, 0x000000, 0.2);
    this.flagGraphics.beginPath();
    this.flagGraphics.moveTo(this.x + 1, this.y + 1);
    this.flagGraphics.lineTo(this.x + 1, this.y - poleHeight + 1);
    this.flagGraphics.strokePath();

    // Pole
    this.flagGraphics.lineStyle(2, 0xdddddd, 0.9);
    this.flagGraphics.beginPath();
    this.flagGraphics.moveTo(this.x, this.y);
    this.flagGraphics.lineTo(this.x, this.y - poleHeight);
    this.flagGraphics.strokePath();

    // White rectangular flag
    this.flagGraphics.fillStyle(0xffffff, 0.95);
    this.flagGraphics.fillRect(this.x, this.y - poleHeight, flagW, flagH);
    this.flagGraphics.lineStyle(1, 0xcccccc, 0.5);
    this.flagGraphics.strokeRect(this.x, this.y - poleHeight, flagW, flagH);

    // Pole cap
    this.flagGraphics.fillStyle(0xeeeeee, 1);
    this.flagGraphics.fillCircle(this.x, this.y - poleHeight, 1.5);
  }

  applyAttraction(ball: GolfBall): void {
    const dx = this.x - ball.body.position.x;
    const dy = this.y - ball.body.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.attractionRadius || dist < 1) return;

    const speed = ball.getSpeed();
    if (speed > CAPTURE_VELOCITY_THRESHOLD * 2) return;

    const strength = ATTRACTION_STRENGTH * (1 - dist / this.attractionRadius);
    const fx = (dx / dist) * strength;
    const fy = (dy / dist) * strength;
    this.scene.matter.body.applyForce(ball.body, ball.body.position, { x: fx, y: fy });
  }

  canCapture(ball: GolfBall): boolean {
    const bx = ball.body.position.x;
    const by = ball.body.position.y;
    const speed = ball.getSpeed();

    const dx = bx - this.x;
    const dy = by - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.captureRadius && speed < CAPTURE_VELOCITY_THRESHOLD) {
      return true;
    }

    if (speed < CAPTURE_VELOCITY_THRESHOLD * 3) {
      const vx = ball.body.velocity.x;
      const vy = ball.body.velocity.y;
      const prevX = bx - vx;
      const prevY = by - vy;

      const steps = Math.max(1, Math.ceil(speed / (this.captureRadius * 0.5)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = prevX + (bx - prevX) * t;
        const py = prevY + (by - prevY) * t;
        const pdx = px - this.x;
        const pdy = py - this.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < this.captureRadius && speed < CAPTURE_VELOCITY_THRESHOLD) {
          return true;
        }
      }
    }

    return false;
  }

  destroy(): void {
    this.graphics.destroy();
    this.flagGraphics.destroy();
  }
}
