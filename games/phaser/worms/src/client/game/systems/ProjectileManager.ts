import * as Phaser from 'phaser';
import type { TerrainEngine } from '../engine/TerrainEngine';
import type { WindSystem } from './WindSystem';
import type { ExplosionEffect } from './ExplosionEffect';
import type { Worm } from '../entities/Worm';
import type { WeaponDef } from '../../../shared/types/weapons';
import { SoundManager } from './SoundManager';

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  weapon: WeaponDef;
  graphics: Phaser.GameObjects.Graphics;
  trail: Phaser.GameObjects.Graphics;
  fuseTimer: number;
  bounceCount: number;
  active: boolean;
}

/**
 * Manages active projectiles: physics updates, terrain collision,
 * bounce logic, fuse timers, and triggering explosions on impact.
 */
export class ProjectileManager {
  private scene: Phaser.Scene;
  private terrain: TerrainEngine;
  private wind: WindSystem;
  private explosions: ExplosionEffect;
  private worms: Worm[];
  private projectiles: Projectile[] = [];
  private onAllResolved: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    terrain: TerrainEngine,
    wind: WindSystem,
    explosions: ExplosionEffect,
    worms: Worm[],
  ) {
    this.scene = scene;
    this.terrain = terrain;
    this.wind = wind;
    this.explosions = explosions;
    this.worms = worms;
  }

  setWorms(worms: Worm[]): void {
    this.worms = worms;
  }

  get hasActive(): boolean {
    return this.projectiles.some((p) => p.active);
  }

  onResolved(cb: () => void): void {
    this.onAllResolved = cb;
  }

  fireProjectile(
    x: number,
    y: number,
    angle: number,
    power: number,
    weapon: WeaponDef,
  ): void {
    const speed = weapon.projectileSpeed * (power / 100);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const gfx = this.scene.add.graphics().setDepth(40);
    const trail = this.scene.add.graphics().setDepth(39);

    this.projectiles.push({
      x,
      y,
      vx,
      vy,
      weapon,
      graphics: gfx,
      trail,
      fuseTimer: weapon.fuse > 0 ? weapon.fuse * 60 : 0,
      bounceCount: 0,
      active: true,
    });
  }

  fireHitscan(
    originX: number,
    originY: number,
    angle: number,
    weapon: WeaponDef,
  ): void {
    const maxDist = 800;
    const step = 3;
    const dx = Math.cos(angle) * step;
    const dy = Math.sin(angle) * step;

    let hitX = originX;
    let hitY = originY;

    for (let d = 0; d < maxDist; d += step) {
      hitX += dx;
      hitY += dy;
      if (hitX < 0 || hitX >= this.terrain.getWidth() || hitY >= this.terrain.getHeight()) break;
      if (this.terrain.isSolid(hitX, hitY)) break;
    }

    this.drawHitscanTracer(originX, originY, hitX, hitY);
    this.explosions.explode(hitX, hitY, weapon.blastRadius, weapon.damage, this.worms);
  }

  placeDynamite(x: number, y: number, weapon: WeaponDef): void {
    const gfx = this.scene.add.graphics().setDepth(40);
    const trail = this.scene.add.graphics().setDepth(39);

    this.projectiles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      weapon,
      graphics: gfx,
      trail,
      fuseTimer: weapon.fuse * 60,
      bounceCount: 0,
      active: true,
    });
  }

  fireAirstrike(targetX: number, weapon: WeaponDef): void {
    const spacing = 35;
    const startX = targetX - ((weapon.shotCount - 1) * spacing) / 2;

    for (let i = 0; i < weapon.shotCount; i++) {
      this.scene.time.delayedCall(i * 150, () => {
        const mx = startX + i * spacing + (Math.random() - 0.5) * 12;
        const gfx = this.scene.add.graphics().setDepth(40);
        const trail = this.scene.add.graphics().setDepth(39);

        this.projectiles.push({
          x: mx,
          y: -60,
          vx: (Math.random() - 0.5) * 0.3,
          vy: weapon.projectileSpeed,
          weapon,
          graphics: gfx,
          trail,
          fuseTimer: 0,
          bounceCount: 0,
          active: true,
        });
      });
    }
  }

  update(): void {
    let anyActive = false;

    for (const p of this.projectiles) {
      if (!p.active) continue;
      anyActive = true;

      const isPlaced = p.weapon.firingMode === 'placed';

      if (!isPlaced) {
        p.vy += p.weapon.projectileGravity;

        if (p.weapon.affectedByWind) {
          p.vx += this.wind.getWindForce();
        }

        p.x += p.vx;
        p.y += p.vy;
      }

      if (p.fuseTimer > 0) {
        p.fuseTimer--;
        if (p.fuseTimer <= 0) {
          this.detonateProjectile(p);
          continue;
        }
      }

      if (
        p.x < -50 ||
        p.x > this.terrain.getWidth() + 50 ||
        p.y > this.terrain.getHeight() + 50
      ) {
        this.removeProjectile(p);
        continue;
      }

      if (!isPlaced && p.y >= 0 && this.terrain.isSolid(p.x, p.y)) {
        if (p.weapon.bounces && p.bounceCount < 5) {
          p.bounceCount++;
          SoundManager.play('bounce');

          while (p.y > 0 && this.terrain.isSolid(p.x, p.y)) {
            p.y -= 1;
          }

          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          p.vy = -Math.abs(p.vy) * p.weapon.bounceFriction;
          p.vx *= p.weapon.bounceFriction;

          if (speed < 0.5) {
            p.vx = 0;
            p.vy = 0;
          }
        } else if (p.fuseTimer > 0) {
          while (p.y > 0 && this.terrain.isSolid(p.x, p.y)) {
            p.y -= 1;
          }
          p.vx = 0;
          p.vy = 0;
        } else {
          this.detonateProjectile(p);
          continue;
        }
      }

      this.drawProjectile(p);
    }

    if (!anyActive && this.projectiles.length > 0) {
      this.projectiles = this.projectiles.filter((p) => p.active);
      if (this.projectiles.length === 0 && this.onAllResolved) {
        this.onAllResolved();
      }
    }
  }

  private detonateProjectile(p: Projectile): void {
    this.explosions.explode(
      p.x,
      p.y,
      p.weapon.blastRadius,
      p.weapon.damage,
      this.worms,
    );
    this.removeProjectile(p);
  }

  private removeProjectile(p: Projectile): void {
    p.active = false;
    p.graphics.destroy();
    p.trail.destroy();
  }

  private drawProjectile(p: Projectile): void {
    p.graphics.clear();

    if (p.weapon.id === 'dynamite') {
      p.graphics.fillStyle(0xcc0000, 1);
      p.graphics.fillRect(p.x - 4, p.y - 8, 8, 16);
      p.graphics.fillStyle(0xffcc00, 1);
      p.graphics.fillCircle(p.x, p.y - 10, 3);
    } else if (p.weapon.id === 'grenade') {
      p.graphics.fillStyle(0x2d5016, 1);
      p.graphics.fillCircle(p.x, p.y, 5);
      p.graphics.fillStyle(0x888888, 1);
      p.graphics.fillRect(p.x - 1, p.y - 7, 2, 3);
    } else {
      // Default rocket shape
      const angle = Math.atan2(p.vy, p.vx);
      p.graphics.fillStyle(0xdddddd, 1);
      p.graphics.fillCircle(p.x, p.y, 3);
      // Tail flame
      const tailX = p.x - Math.cos(angle) * 6;
      const tailY = p.y - Math.sin(angle) * 6;
      p.graphics.fillStyle(0xff6600, 0.8);
      p.graphics.fillCircle(tailX, tailY, 2);
    }

    // Trail
    p.trail.fillStyle(0xaaaaaa, 0.15);
    p.trail.fillCircle(p.x, p.y, 1.5);
  }

  private drawHitscanTracer(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): void {
    const gfx = this.scene.add.graphics().setDepth(45);
    gfx.lineStyle(2, 0xffff00, 0.8);
    gfx.beginPath();
    gfx.moveTo(x1, y1);
    gfx.lineTo(x2, y2);
    gfx.strokePath();

    this.scene.tweens.add({
      targets: gfx,
      alpha: 0,
      duration: 300,
      onComplete: () => gfx.destroy(),
    });
  }

  destroy(): void {
    for (const p of this.projectiles) {
      p.graphics.destroy();
      p.trail.destroy();
    }
    this.projectiles = [];
  }
}
