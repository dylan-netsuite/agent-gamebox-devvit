import type { Worm } from '../entities/Worm';
import type { ProjectileManager } from './ProjectileManager';
import type { AimIndicator } from '../ui/AimIndicator';
import { WEAPONS, WEAPON_ORDER } from '../../../shared/types/weapons';
import type { WeaponType, WeaponDef } from '../../../shared/types/weapons';

export type WeaponState = 'idle' | 'aiming' | 'firing' | 'resolved';

/**
 * Orchestrates weapon selection, aiming, and firing.
 * Manages the state machine: idle -> aiming -> firing -> resolved.
 */
export class WeaponSystem {
  private projectiles: ProjectileManager;
  private aimIndicator: AimIndicator;
  private currentWeaponIndex = 0;
  private aimAngle = -Math.PI / 4;
  private power = 50;
  private state: WeaponState = 'idle';
  private onStateChange: ((state: WeaponState) => void) | null = null;

  constructor(projectiles: ProjectileManager, aimIndicator: AimIndicator) {
    this.projectiles = projectiles;
    this.aimIndicator = aimIndicator;

    this.projectiles.onResolved(() => {
      if (this.state === 'firing') {
        this.setState('resolved');
      }
    });
  }

  get currentWeapon(): WeaponDef {
    return WEAPONS[WEAPON_ORDER[this.currentWeaponIndex]!]!;
  }

  get weaponIndex(): number {
    return this.currentWeaponIndex;
  }

  get currentState(): WeaponState {
    return this.state;
  }

  get angle(): number {
    return this.aimAngle;
  }

  get currentPower(): number {
    return this.power;
  }

  onState(cb: (state: WeaponState) => void): void {
    this.onStateChange = cb;
  }

  selectWeapon(index: number): void {
    if (this.state !== 'idle' && this.state !== 'aiming') return;
    this.currentWeaponIndex = index % WEAPON_ORDER.length;
  }

  selectWeaponById(id: WeaponType): void {
    const idx = WEAPON_ORDER.indexOf(id);
    if (idx >= 0) this.selectWeapon(idx);
  }

  nextWeapon(): void {
    this.selectWeapon((this.currentWeaponIndex + 1) % WEAPON_ORDER.length);
  }

  prevWeapon(): void {
    this.selectWeapon(
      (this.currentWeaponIndex - 1 + WEAPON_ORDER.length) % WEAPON_ORDER.length,
    );
  }

  startAiming(): void {
    if (this.state !== 'idle') return;
    this.setState('aiming');
    this.aimIndicator.show();
  }

  stopAiming(): void {
    if (this.state !== 'aiming') return;
    this.setState('idle');
    this.aimIndicator.hide();
  }

  adjustAngle(delta: number): void {
    this.aimAngle = Math.max(-Math.PI, Math.min(Math.PI, this.aimAngle + delta));
  }

  adjustPower(delta: number): void {
    this.power = Math.max(10, Math.min(100, this.power + delta));
  }

  setAngleFromPointer(wormX: number, wormY: number, pointerX: number, pointerY: number): void {
    this.aimAngle = Math.atan2(pointerY - wormY, pointerX - wormX);
  }

  setAngleDirect(angle: number): void {
    this.aimAngle = angle;
  }

  setPowerDirect(power: number): void {
    this.power = Math.max(10, Math.min(100, power));
  }

  fire(worm: Worm): void {
    if (this.state !== 'aiming') return;
    this.aimIndicator.hide();
    this.setState('firing');

    const weapon = this.currentWeapon;
    const center = worm.getCenter();

    switch (weapon.firingMode) {
      case 'projectile':
        this.projectiles.fireProjectile(
          center.x,
          center.y,
          this.aimAngle,
          this.power,
          weapon,
        );
        break;

      case 'hitscan':
        for (let i = 0; i < weapon.shotCount; i++) {
          const spread = (i - (weapon.shotCount - 1) / 2) * 0.05;
          this.projectiles.fireHitscan(
            center.x,
            center.y,
            this.aimAngle + spread,
            weapon,
            worm,
          );
        }
        // Hitscan resolves immediately
        this.setState('resolved');
        break;

      case 'placed':
        this.projectiles.placeDynamite(center.x, center.y + 5, weapon);
        break;

      case 'targeted':
        {
          const targetX = center.x + Math.cos(this.aimAngle) * this.power * 3;
          this.projectiles.fireAirstrike(targetX, weapon);
        }
        break;

      case 'teleport':
        {
          const dist = this.power * 3;
          const targetX = center.x + Math.cos(this.aimAngle) * dist;
          const targetY = center.y + Math.sin(this.aimAngle) * dist;
          this.projectiles.teleportWorm(worm, targetX, targetY);
          this.setState('resolved');
        }
        break;
    }
  }

  updateAimDisplay(worm: Worm): void {
    if (this.state !== 'aiming') return;
    const center = worm.getCenter();
    const weapon = this.currentWeapon;

    if (weapon.firingMode === 'teleport') {
      this.aimIndicator.drawTeleportAim(center.x, center.y, this.aimAngle, this.power);
    } else if (weapon.firingMode === 'hitscan') {
      this.aimIndicator.drawHitscanAim(center.x, center.y, this.aimAngle);
    } else {
      this.aimIndicator.drawAim(
        center.x,
        center.y,
        this.aimAngle,
        this.power,
        weapon.projectileSpeed,
        weapon.projectileGravity,
        weapon.affectedByWind,
      );
    }
  }

  forceResolve(): void {
    this.aimIndicator.hide();
    this.setState('resolved');
  }

  reset(): void {
    this.setState('idle');
    this.aimIndicator.hide();
    this.power = 50;
    this.aimAngle = -Math.PI / 4;
  }

  private setState(state: WeaponState): void {
    this.state = state;
    if (this.onStateChange) this.onStateChange(state);
  }
}
