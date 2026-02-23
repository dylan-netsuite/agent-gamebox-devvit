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
    this.terrain.carve(x, y, radius);
    this.terrain.redraw();

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

          const knockbackForce = falloff * 6;
          const angle = Math.atan2(dy, dx);
          worm.applyKnockback(
            Math.cos(angle) * knockbackForce,
            Math.sin(angle) * knockbackForce - 3,
          );
        }
      }
    }

    return { damages };
  }

  private playVisual(x: number, y: number, radius: number): void {
    const gfx = this.scene.add.graphics().setDepth(50);
    const particleCount = 15 + Math.floor(radius / 3);
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * (radius * 0.1);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        size: 1.5 + Math.random() * 2.5,
      });
    }

    // Flash circle
    const flash = this.scene.add.graphics().setDepth(49);
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(x, y, radius * 0.6);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    const timer = this.scene.time.addEvent({
      delay: 16,
      repeat: 30,
      callback: () => {
        gfx.clear();
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.life -= 0.03;
          if (p.life > 0) {
            const r = 255;
            const g = Math.floor(180 * p.life);
            const b = Math.floor(40 * p.life);
            gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), p.life);
            gfx.fillCircle(p.x, p.y, p.size * p.life);
          }
        }
      },
    });

    this.scene.time.delayedCall(550, () => {
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
