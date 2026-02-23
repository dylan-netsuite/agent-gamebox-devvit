import type { Worm } from '../entities/Worm';
import type { WeaponSystem } from './WeaponSystem';

const AI_THINK_DELAY = 800;
const AI_AIM_DELAY = 600;
const AI_FIRE_DELAY = 400;

export class AIController {
  private aiTeams: Set<number>;

  constructor(aiTeams: number[]) {
    this.aiTeams = new Set(aiTeams);
  }

  isAITeam(team: number): boolean {
    return this.aiTeams.has(team);
  }

  executeTurn(
    scene: Phaser.Scene,
    activeWorm: Worm,
    allWorms: Worm[],
    weaponSystem: WeaponSystem,
    onComplete: () => void,
  ): void {
    const enemies = allWorms.filter(
      (w) => w.alive && w.team !== activeWorm.team,
    );

    if (enemies.length === 0) {
      onComplete();
      return;
    }

    const target = this.pickTarget(activeWorm, enemies);
    const { angle, power, weaponIdx } = this.calculateShot(activeWorm, target);

    scene.time.delayedCall(AI_THINK_DELAY, () => {
      weaponSystem.selectWeapon(weaponIdx);

      scene.time.delayedCall(AI_AIM_DELAY, () => {
        weaponSystem.startAiming();
        weaponSystem.setAngleDirect(angle);
        weaponSystem.setPowerDirect(power);

        scene.time.delayedCall(AI_FIRE_DELAY, () => {
          weaponSystem.fire(activeWorm);
        });
      });
    });
  }

  private pickTarget(self: Worm, enemies: Worm[]): Worm {
    let closest = enemies[0]!;
    let minDist = Infinity;
    for (const e of enemies) {
      const dx = e.x - self.x;
      const dy = e.y - self.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        closest = e;
      }
    }
    return closest;
  }

  private calculateShot(
    self: Worm,
    target: Worm,
  ): { angle: number; power: number; weaponIdx: number } {
    const dx = target.x - self.x;
    const dy = target.y - self.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Pick weapon: grenade for close range, bazooka otherwise
    let weaponIdx = 0; // bazooka
    if (dist < 200) {
      weaponIdx = 1; // grenade
    }

    // Calculate a rough ballistic angle
    const gravity = 0.15;
    const speed = 5.5;
    const targetAngle = Math.atan2(dy, dx);

    // Lob upward to arc toward target
    let angle = targetAngle - 0.3;
    let power = Math.min(95, Math.max(30, dist * 0.18));

    // For targets above, aim more directly
    if (dy < -50) {
      angle = targetAngle - 0.15;
      power = Math.min(90, dist * 0.15);
    }

    // For targets below, give more arc
    if (dy > 50) {
      angle = targetAngle - 0.5;
      power = Math.min(95, dist * 0.2);
    }

    // Clamp angle to upper half
    angle = Math.max(-Math.PI, Math.min(0.1, angle));

    // Add inaccuracy for difficulty balance
    const inaccuracy = (Math.random() - 0.5) * 0.25;
    angle += inaccuracy;
    power += (Math.random() - 0.5) * 15;
    power = Math.max(20, Math.min(100, power));

    return { angle, power, weaponIdx };
  }
}
