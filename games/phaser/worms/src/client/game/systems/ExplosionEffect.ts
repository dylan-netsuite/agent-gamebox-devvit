import * as Phaser from 'phaser';
import type { TerrainEngine } from '../engine/TerrainEngine';
import type { Worm } from '../entities/Worm';
import { SoundManager } from './SoundManager';

export interface ExplosionResult {
  damages: { worm: Worm; damage: number }[];
}

/**
 * Handles explosion visuals, terrain carving, and damage calculation.
 * Damage falls off linearly with distance from the blast center.
 */
export class ExplosionEffect {
  private scene: Phaser.Scene;
  private terrain: TerrainEngine;

  constructor(scene: Phaser.Scene, terrain: TerrainEngine) {
    this.scene = scene;
    this.terrain = terrain;
  }

  explode(
    x: number,
    y: number,
    radius: number,
    baseDamage: number,
    worms: Worm[],
  ): ExplosionResult {
    this.terrain.addCrater(x, y, radius);
    this.terrain.scheduleRedraw();

    SoundManager.play('explosion');
    this.playVisual(x, y, radius);

    const shakeIntensity = Math.min(0.02, radius * 0.0004);
    this.scene.cameras.main.shake(200 + radius * 2, shakeIntensity);

    const damages: ExplosionResult['damages'] = [];
    for (const worm of worms) {
      if (!worm.alive) continue;
      const center = worm.getCenter();
      const dx = center.x - x;
      const dy = center.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius * 1.5) {
        const falloff = Math.max(0, 1 - dist / (radius * 1.5));
        const damage = Math.round(baseDamage * falloff);
        if (damage > 0) {
          worm.takeDamage(damage);
          damages.push({ worm, damage });
          this.showDamageNumber(center.x, center.y - 20, damage);

          const knockbackForce = falloff * 8;
          const angle = Math.atan2(dy, dx);
          worm.applyKnockback(
            Math.cos(angle) * knockbackForce,
            Math.sin(angle) * knockbackForce - 4,
          );
        }
      }
    }

    return { damages };
  }

  private playVisual(x: number, y: number, radius: number): void {
    const gfx = this.scene.add.graphics().setDepth(50);
    const fireCount = Math.min(15, 8 + Math.floor(radius / 5));
    const smokeCount = Math.min(6, 3 + Math.floor(radius / 10));
    const debrisCount = Math.min(4, 2 + Math.floor(radius / 15));
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
      color: number;
      type: 'fire' | 'smoke' | 'debris';
    }[] = [];

    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * (radius * 0.12);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        size: 2 + Math.random() * 3,
        color: 0,
        type: 'fire',
      });
    }

    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * (radius * 0.04);
      particles.push({
        x: x + (Math.random() - 0.5) * radius * 0.3,
        y: y + (Math.random() - 0.5) * radius * 0.3,
        vx: Math.cos(angle) * speed,
        vy: -0.5 - Math.random() * 1.5,
        life: 1,
        size: 4 + Math.random() * 6,
        color: 0,
        type: 'smoke',
      });
    }

    for (let i = 0; i < debrisCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 3 + Math.random() * (radius * 0.08);
      const brown = Phaser.Display.Color.GetColor(
        120 + Math.floor(Math.random() * 40),
        80 + Math.floor(Math.random() * 30),
        40,
      );
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        life: 1,
        size: 1 + Math.random() * 2,
        color: brown,
        type: 'debris',
      });
    }

    const flash = this.scene.add.graphics().setDepth(49);
    flash.fillStyle(0xffffff, 0.9);
    flash.fillCircle(x, y, radius * 0.7);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 120,
      onComplete: () => flash.destroy(),
    });

    let ringRadius = radius * 0.3;
    let ringAlpha = 0.5;
    const totalFrames = 30;
    let frame = 0;

    const timer = this.scene.time.addEvent({
      delay: 20,
      repeat: totalFrames - 1,
      callback: () => {
        gfx.clear();
        frame++;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.type === 'smoke' ? 0.025 : 0.035;
          if (p.life <= 0) continue;

          if (p.type === 'fire') {
            p.vy += 0.12;
            const g = Math.floor(200 * p.life);
            const b = Math.floor(50 * p.life * p.life);
            gfx.fillStyle(Phaser.Display.Color.GetColor(255, g, b), p.life * 0.9);
            gfx.fillCircle(p.x, p.y, p.size * p.life);
          } else if (p.type === 'smoke') {
            p.vy -= 0.01;
            p.size += 0.15;
            const grey = Math.floor(60 + 40 * p.life);
            gfx.fillStyle(Phaser.Display.Color.GetColor(grey, grey, grey), p.life * 0.4);
            gfx.fillCircle(p.x, p.y, p.size * (1.2 - p.life * 0.2));
          } else {
            p.vy += 0.25;
            gfx.fillStyle(p.color, p.life);
            gfx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          }
        }

        ringRadius += 1.5;
        ringAlpha -= 0.02;
        if (ringAlpha > 0) {
          gfx.lineStyle(2, 0xffaa44, ringAlpha);
          gfx.strokeCircle(x, y, ringRadius);
        }
      },
    });

    this.scene.time.delayedCall(totalFrames * 20 + 50, () => {
      timer.destroy();
      gfx.destroy();
    });
  }

  private showDamageNumber(x: number, y: number, damage: number): void {
    const color = damage >= 40 ? '#ff2222' : damage >= 20 ? '#ff8844' : '#ffcc00';
    const text = this.scene.add
      .text(x, y, `-${damage}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color,
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200)
      .setScale(1.5);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      delay: 200,
      onComplete: () => text.destroy(),
    });
  }
}
