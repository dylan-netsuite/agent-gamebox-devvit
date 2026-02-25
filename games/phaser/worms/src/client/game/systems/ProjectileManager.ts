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

interface RopeProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  worm: Worm;
  graphics: Phaser.GameObjects.Graphics;
  active: boolean;
  attached: boolean;
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
  private ropeProjectiles: RopeProjectile[] = [];
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
    return this.projectiles.some((p) => p.active) || this.ropeProjectiles.some((r) => r.active && !r.attached);
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
    shooter?: Worm,
  ): void {
    const maxDist = weapon.hitscanRange ?? 500;
    const driftStart = weapon.hitscanDriftStart ?? 150;
    const windMul = weapon.hitscanWindMul ?? 3;
    const spreadMax = weapon.hitscanSpreadMax ?? 0.4;
    const step = 2;
    const baseDx = Math.cos(angle) * step;
    const baseDy = Math.sin(angle) * step;

    const windForce = this.wind.getWindForce();
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    const spreadSeed = Math.abs(Math.sin(angle * 12345.6789)) * 10000;

    let hitX = originX;
    let hitY = originY;
    let directHitWorm: Worm | null = null;

    for (let d = 0; d < maxDist; d += step) {
      let dx = baseDx;
      let dy = baseDy;

      if (d > driftStart) {
        const t = (d - driftStart) / (maxDist - driftStart);
        dx += windForce * t * windMul * step;

        const spreadAmount = t * spreadMax;
        const noise = Math.sin(spreadSeed + d * 0.1) * spreadAmount;
        dx += perpX * noise;
        dy += perpY * noise;
      }

      hitX += dx;
      hitY += dy;
      if (hitX < 0 || hitX >= this.terrain.getWidth() || hitY >= this.terrain.getHeight()) break;

      for (const worm of this.worms) {
        if (!worm.alive || worm === shooter) continue;
        const wx = worm.x;
        const wy = worm.y;
        if (hitX >= wx - 10 && hitX <= wx + 10 && hitY >= wy - 2 && hitY <= wy + 22) {
          directHitWorm = worm;
          break;
        }
      }
      if (directHitWorm) break;

      if (this.terrain.isSolid(hitX, hitY)) break;
    }

    this.drawHitscanTracer(originX, originY, hitX, hitY);

    if (directHitWorm) {
      directHitWorm.takeDamage(weapon.damage);
      this.explosions.explode(hitX, hitY, Math.max(weapon.blastRadius, 6), 0, []);
    } else {
      this.explosions.explode(hitX, hitY, weapon.blastRadius, weapon.damage, this.worms);
    }
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

  teleportWorm(worm: Worm, targetX: number, targetY: number): void {
    const clampedX = Math.max(10, Math.min(this.terrain.getWidth() - 10, targetX));
    const surfaceY = this.terrain.getSurfaceY(clampedX);
    const finalY = Math.min(targetY, surfaceY - 20);

    // Visual effect at origin
    const originGfx = this.scene.add.graphics().setDepth(50);
    originGfx.fillStyle(0x00e5ff, 0.6);
    originGfx.fillCircle(worm.x, worm.y, 15);
    this.scene.tweens.add({
      targets: originGfx,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 300,
      onComplete: () => originGfx.destroy(),
    });

    worm.x = clampedX;
    worm.y = finalY;

    // Visual effect at destination
    const destGfx = this.scene.add.graphics().setDepth(50);
    destGfx.fillStyle(0x00e5ff, 0.8);
    destGfx.fillCircle(clampedX, finalY, 20);
    this.scene.tweens.add({
      targets: destGfx,
      alpha: 0,
      duration: 400,
      onComplete: () => destGfx.destroy(),
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

  fireRope(x: number, y: number, angle: number, worm: Worm): void {
    const speed = 12;
    const gfx = this.scene.add.graphics().setDepth(42);
    SoundManager.play('rope-fire');

    this.ropeProjectiles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      worm,
      graphics: gfx,
      active: true,
      attached: false,
    });
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

    for (const r of this.ropeProjectiles) {
      if (!r.active || r.attached) continue;
      anyActive = true;

      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.05;

      if (r.x < -50 || r.x > this.terrain.getWidth() + 50 || r.y > this.terrain.getHeight() + 50) {
        r.active = false;
        r.graphics.destroy();
        continue;
      }

      if (r.y >= 0 && this.terrain.isSolid(r.x, r.y)) {
        while (r.y > 0 && this.terrain.isSolid(r.x, r.y)) r.y -= 1;
        r.attached = true;
        r.worm.attachRope(r.x, r.y);
        continue;
      }

      r.graphics.clear();
      r.graphics.fillStyle(0x666666, 1);
      r.graphics.fillCircle(r.x, r.y, 3);
      r.graphics.lineStyle(1, 0x8b6914, 0.6);
      r.graphics.beginPath();
      r.graphics.moveTo(r.worm.x, r.worm.y);
      r.graphics.lineTo(r.x, r.y);
      r.graphics.strokePath();
    }

    const activeRopeFlying = this.ropeProjectiles.some((r) => r.active && !r.attached);
    if (!anyActive && this.projectiles.length > 0) {
      this.projectiles = this.projectiles.filter((p) => p.active);
      if (this.projectiles.length === 0 && !activeRopeFlying && this.onAllResolved) {
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

    if (p.weapon.cluster && p.weapon.clusterCount) {
      this.spawnClusterBomblets(p.x, p.y, p.weapon);
    }

    this.removeProjectile(p);
  }

  private spawnClusterBomblets(x: number, y: number, parentWeapon: WeaponDef): void {
    const count = parentWeapon.clusterCount ?? 4;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 2 + Math.random() * 3;

      const gfx = this.scene.add.graphics().setDepth(40);
      const trail = this.scene.add.graphics().setDepth(39);

      this.projectiles.push({
        x,
        y: y - 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        weapon: {
          ...parentWeapon,
          cluster: false,
          damage: parentWeapon.clusterDamage ?? 18,
          blastRadius: parentWeapon.clusterRadius ?? 18,
          fuse: 0,
          bounces: false,
        },
        graphics: gfx,
        trail,
        fuseTimer: 0,
        bounceCount: 0,
        active: true,
      });
    }
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
    } else if (p.weapon.id === 'cluster-bomb') {
      if (p.weapon.cluster) {
        // Main cluster bomb — larger orange sphere
        p.graphics.fillStyle(0xff6600, 1);
        p.graphics.fillCircle(p.x, p.y, 6);
        p.graphics.fillStyle(0xffcc00, 1);
        p.graphics.fillCircle(p.x - 2, p.y - 2, 2);
        p.graphics.fillCircle(p.x + 2, p.y + 2, 2);
      } else {
        // Sub-bomblet — small orange dot
        p.graphics.fillStyle(0xff8800, 1);
        p.graphics.fillCircle(p.x, p.y, 3);
      }
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

  cleanupRopes(): void {
    for (const r of this.ropeProjectiles) {
      r.graphics.destroy();
    }
    this.ropeProjectiles = [];
  }

  destroy(): void {
    for (const p of this.projectiles) {
      p.graphics.destroy();
      p.trail.destroy();
    }
    this.projectiles = [];
    this.cleanupRopes();
  }
}
