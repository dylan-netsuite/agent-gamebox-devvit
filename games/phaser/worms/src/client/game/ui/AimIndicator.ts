import * as Phaser from 'phaser';
import type { WindSystem } from '../systems/WindSystem';
import type { WeaponDef } from '../../../shared/types/weapons';

/**
 * Visual aim indicator showing angle line and dotted trajectory preview.
 * Updates in real-time as the player adjusts aim angle and power.
 */
export class AimIndicator {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private wind: WindSystem;
  private visible = false;

  constructor(scene: Phaser.Scene, wind: WindSystem) {
    this.scene = scene;
    this.wind = wind;
    this.graphics = scene.add.graphics().setDepth(60);
  }

  show(): void {
    this.visible = true;
    this.graphics.setVisible(true);
  }

  hide(): void {
    this.visible = false;
    this.graphics.setVisible(false);
    this.graphics.clear();
  }

  drawAim(
    originX: number,
    originY: number,
    angle: number,
    power: number,
    projectileSpeed: number,
    projectileGravity: number,
    affectedByWind: boolean,
  ): void {
    if (!this.visible) return;
    this.graphics.clear();

    // Aim line
    const lineLen = 30 + power * 0.4;
    const endX = originX + Math.cos(angle) * lineLen;
    const endY = originY + Math.sin(angle) * lineLen;

    this.graphics.lineStyle(2, 0xff4444, 0.9);
    this.graphics.beginPath();
    this.graphics.moveTo(originX, originY);
    this.graphics.lineTo(endX, endY);
    this.graphics.strokePath();

    // Crosshair at end
    const crossSize = 5;
    this.graphics.lineStyle(1, 0xff4444, 0.7);
    this.graphics.strokeCircle(endX, endY, crossSize);

    // Trajectory dots (simulate projectile path)
    const speed = projectileSpeed * (power / 100);
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let px = originX;
    let py = originY;
    const windForce = affectedByWind ? this.wind.getWindForce() : 0;

    this.graphics.fillStyle(0xffffff, 0.4);
    for (let i = 0; i < 40; i++) {
      vy += projectileGravity;
      vx += windForce;
      px += vx;
      py += vy;

      if (py > this.scene.cameras.main.scrollY + this.scene.cameras.main.height + 100) break;
      if (px < -50 || px > 2500) break;

      if (i % 3 === 0) {
        this.graphics.fillCircle(px, py, 1.5);
      }
    }
  }

  drawHitscanAim(
    originX: number,
    originY: number,
    angle: number,
    weapon?: WeaponDef,
  ): void {
    if (!this.visible) return;
    this.graphics.clear();

    const maxLen = weapon?.hitscanRange ?? 1500;
    const driftStart = weapon?.hitscanDriftStart ?? 400;

    const endX = originX + Math.cos(angle) * maxLen;
    const endY = originY + Math.sin(angle) * maxLen;

    this.graphics.lineStyle(1, 0xff4444, 0.3);
    this.graphics.beginPath();
    this.graphics.moveTo(originX, originY);
    this.graphics.lineTo(endX, endY);
    this.graphics.strokePath();

    const dotSpacing = maxLen < 800 ? 40 : 80;
    for (let d = dotSpacing; d < maxLen; d += dotSpacing) {
      const dx = originX + Math.cos(angle) * d;
      const dy = originY + Math.sin(angle) * d;
      if (dx < -50 || dx > 2500 || dy < -50 || dy > 1300) break;

      const alpha = d < driftStart ? 0.5 : 0.5 * (1 - (d - driftStart) / (maxLen - driftStart));
      this.graphics.fillStyle(0xff4444, Math.max(0.1, alpha));
      this.graphics.fillCircle(dx, dy, 1.5);
    }
  }

  drawTeleportAim(
    originX: number,
    originY: number,
    angle: number,
    power: number,
  ): void {
    if (!this.visible) return;
    this.graphics.clear();

    const dist = power * 3;
    const targetX = originX + Math.cos(angle) * dist;
    const targetY = originY + Math.sin(angle) * dist;

    // Dashed line from worm to target
    this.graphics.lineStyle(1, 0x00e5ff, 0.4);
    this.graphics.beginPath();
    this.graphics.moveTo(originX, originY);
    this.graphics.lineTo(targetX, targetY);
    this.graphics.strokePath();

    // Landing crosshair
    this.graphics.lineStyle(2, 0x00e5ff, 0.8);
    this.graphics.strokeCircle(targetX, targetY, 8);
    this.graphics.lineStyle(1, 0x00e5ff, 0.6);
    this.graphics.beginPath();
    this.graphics.moveTo(targetX - 12, targetY);
    this.graphics.lineTo(targetX + 12, targetY);
    this.graphics.moveTo(targetX, targetY - 12);
    this.graphics.lineTo(targetX, targetY + 12);
    this.graphics.strokePath();
  }

  drawRopeAim(
    originX: number,
    originY: number,
    angle: number,
  ): void {
    if (!this.visible) return;
    this.graphics.clear();

    const maxLen = 250;
    const endX = originX + Math.cos(angle) * maxLen;
    const endY = originY + Math.sin(angle) * maxLen;

    this.graphics.lineStyle(1, 0x8b6914, 0.5);
    this.graphics.beginPath();
    this.graphics.moveTo(originX, originY);
    this.graphics.lineTo(endX, endY);
    this.graphics.strokePath();

    this.graphics.fillStyle(0x8b6914, 0.7);
    for (let d = 30; d < maxLen; d += 30) {
      const dx = originX + Math.cos(angle) * d;
      const dy = originY + Math.sin(angle) * d;
      this.graphics.fillCircle(dx, dy, 1.5);
    }

    this.graphics.fillStyle(0x666666, 0.8);
    this.graphics.fillCircle(endX, endY, 4);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
