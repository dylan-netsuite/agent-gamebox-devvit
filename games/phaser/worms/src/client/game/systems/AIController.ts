import type { Worm } from '../entities/Worm';
import type { WeaponSystem } from './WeaponSystem';
import type { TerrainEngine } from '../engine/TerrainEngine';
import type { WindSystem } from './WindSystem';
import { WEAPONS, WEAPON_ORDER } from '../../../shared/types/weapons';
import type { WeaponDef } from '../../../shared/types/weapons';
import type { AIDifficulty } from '../scenes/GameSetup';

const AI_THINK_DELAY = 800;
const AI_AIM_DELAY = 500;
const AI_FIRE_DELAY = 300;
const AI_MOVE_STEP_DELAY = 30;

const SIM_MAX_STEPS = 600;

interface DifficultyConfig {
  coarseAngleSteps: number;
  coarsePowerSteps: number;
  refine: boolean;
  refineAngleSteps: number;
  refineAngleSpread: number;
  refinePowerSteps: number;
  refinePowerSpread: number;
  jitterAngle: number;
  jitterPower: number;
  topNPick: number;
  canMove: boolean;
  moveChance: number;
  moveSteps: number;
  moveApproachThreshold: number;
  weaponFilter: Set<string> | null;
  missChance: number;
  missExtraAngle: number;
  missExtraPower: number;
}

const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  easy: {
    coarseAngleSteps: 10,
    coarsePowerSteps: 5,
    refine: false,
    refineAngleSteps: 0,
    refineAngleSpread: 0,
    refinePowerSteps: 0,
    refinePowerSpread: 0,
    jitterAngle: 0.20,
    jitterPower: 18,
    topNPick: 10,
    canMove: true,
    moveChance: 0.25,
    moveSteps: 30,
    moveApproachThreshold: 500,
    weaponFilter: new Set(['bazooka', 'grenade', 'cluster-bomb']),
    missChance: 0.30,
    missExtraAngle: 0.25,
    missExtraPower: 20,
  },
  medium: {
    coarseAngleSteps: 18,
    coarsePowerSteps: 8,
    refine: true,
    refineAngleSteps: 3,
    refineAngleSpread: 0.12,
    refinePowerSteps: 3,
    refinePowerSpread: 10,
    jitterAngle: 0.08,
    jitterPower: 8,
    topNPick: 5,
    canMove: true,
    moveChance: 0.45,
    moveSteps: 50,
    moveApproachThreshold: 400,
    weaponFilter: null,
    missChance: 0.25,
    missExtraAngle: 0.15,
    missExtraPower: 12,
  },
  hard: {
    coarseAngleSteps: 36,
    coarsePowerSteps: 14,
    refine: true,
    refineAngleSteps: 9,
    refineAngleSpread: 0.06,
    refinePowerSteps: 9,
    refinePowerSpread: 6,
    jitterAngle: 0.01,
    jitterPower: 1,
    topNPick: 1,
    canMove: true,
    moveChance: 0.55,
    moveSteps: 40,
    moveApproachThreshold: 350,
    weaponFilter: null,
    missChance: 0,
    missExtraAngle: 0,
    missExtraPower: 0,
  },
};

interface ShotCandidate {
  weaponIdx: number;
  angle: number;
  power: number;
  score: number;
  impactX: number;
  impactY: number;
}

interface SimResult {
  hitX: number;
  hitY: number;
  hitTerrain: boolean;
  outOfBounds: boolean;
}

export class AIController {
  private aiTeams: Set<number>;
  private terrain: TerrainEngine | null = null;
  private wind: WindSystem | null = null;
  private config: DifficultyConfig;

  constructor(aiTeams: number[], difficulty: AIDifficulty = 'medium') {
    this.aiTeams = new Set(aiTeams);
    this.config = DIFFICULTY_CONFIGS[difficulty];
  }

  setContext(terrain: TerrainEngine, wind: WindSystem): void {
    this.terrain = terrain;
    this.wind = wind;
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
    const enemies = allWorms.filter((w) => w.alive && w.team !== activeWorm.team);
    const friendlies = allWorms.filter(
      (w) => w.alive && w.team === activeWorm.team && w !== activeWorm,
    );

    if (enemies.length === 0) {
      onComplete();
      return;
    }

    const cfg = this.config;
    const best = this.findBestShot(activeWorm, enemies, friendlies);
    const closestDist = this.closestEnemyDist(activeWorm, enemies);

    const shouldMoveProactively =
      cfg.canMove &&
      (closestDist > cfg.moveApproachThreshold ||
        (!best || best.score < 40) ||
        Math.random() < cfg.moveChance);

    if (shouldMoveProactively) {
      const moveDir = this.chooseMoveDirection(activeWorm, enemies, best);
      const moveSteps = this.chooseMoveSteps(activeWorm, enemies, cfg);
      const shouldJump = this.shouldJumpDuringMove(activeWorm);

      this.executeMoveThenShoot(
        scene, activeWorm, enemies, friendlies, weaponSystem,
        moveDir, moveSteps, shouldJump,
      );
      return;
    }

    if (!best || best.score < 5) {
      if (cfg.canMove) {
        this.moveTowardEnemy(scene, activeWorm, enemies, cfg.moveSteps, () => {
          const retryBest = this.findBestShot(activeWorm, enemies, friendlies);
          if (retryBest && retryBest.score >= 5) {
            this.executeShot(scene, weaponSystem, activeWorm, retryBest);
          } else {
            this.executeFallbackShot(scene, weaponSystem, activeWorm, enemies);
          }
        });
        return;
      }
      scene.time.delayedCall(AI_THINK_DELAY, () => {
        this.executeFallbackShot(scene, weaponSystem, activeWorm, enemies);
      });
      return;
    }

    scene.time.delayedCall(AI_THINK_DELAY, () => {
      this.executeShot(scene, weaponSystem, activeWorm, best);
    });
  }

  private executeShot(
    scene: Phaser.Scene,
    weaponSystem: WeaponSystem,
    worm: Worm,
    shot: ShotCandidate,
  ): void {
    weaponSystem.selectWeapon(shot.weaponIdx);

    scene.time.delayedCall(AI_AIM_DELAY, () => {
      weaponSystem.startAiming();
      weaponSystem.setAngleDirect(shot.angle);
      weaponSystem.setPowerDirect(shot.power);

      scene.time.delayedCall(AI_FIRE_DELAY, () => {
        weaponSystem.fire(worm);
      });
    });
  }

  private executeFallbackShot(
    scene: Phaser.Scene,
    weaponSystem: WeaponSystem,
    worm: Worm,
    enemies: Worm[],
  ): void {
    const target = this.closestEnemy(worm, enemies);
    const dx = target.x - worm.x;
    const dy = target.y - worm.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let weaponIdx = 0;
    if (dist < 60) {
      weaponIdx = WEAPON_ORDER.indexOf('shotgun');
    } else if (dist < 150) {
      weaponIdx = WEAPON_ORDER.indexOf('grenade');
    }

    const angle = Math.atan2(dy, dx) - 0.3;
    const power = Math.min(85, Math.max(35, dist * 0.15));

    this.executeShot(scene, weaponSystem, worm, {
      weaponIdx,
      angle,
      power,
      score: 0,
      impactX: target.x,
      impactY: target.y,
    });
  }

  private findBestShot(
    self: Worm,
    enemies: Worm[],
    friendlies: Worm[],
  ): ShotCandidate | null {
    const candidates: ShotCandidate[] = [];
    const selfCenter = self.getCenter();
    const cfg = this.config;

    for (let wi = 0; wi < WEAPON_ORDER.length; wi++) {
      const weaponId = WEAPON_ORDER[wi]!;
      const weapon = WEAPONS[weaponId]!;

      if (cfg.weaponFilter && !cfg.weaponFilter.has(weaponId)) continue;

      // AI doesn't use utility weapons
      if (weapon.firingMode === 'teleport') continue;

      if (weapon.firingMode === 'placed') {
        const nearestDist = this.closestEnemyDist(self, enemies);
        if (nearestDist < 80) {
          candidates.push({
            weaponIdx: wi,
            angle: 0,
            power: 0,
            score: this.scorePlacedWeapon(self, enemies, friendlies, weapon),
            impactX: selfCenter.x,
            impactY: selfCenter.y,
          });
        }
        continue;
      }

      if (weapon.firingMode === 'hitscan') {
        for (const enemy of enemies) {
          const ec = enemy.getCenter();
          const angle = Math.atan2(ec.y - selfCenter.y, ec.x - selfCenter.x);
          const dist = Math.sqrt(
            (ec.x - selfCenter.x) ** 2 + (ec.y - selfCenter.y) ** 2,
          );
          const hitResult = this.simulateHitscan(selfCenter.x, selfCenter.y, angle);
          const hitDist = Math.sqrt(
            (hitResult.x - ec.x) ** 2 + (hitResult.y - ec.y) ** 2,
          );
          // Direct worm hit detection mirrors ProjectileManager logic
          const directHit = hitDist < 15;
          if (directHit || hitDist < weapon.blastRadius * 2) {
            let score = directHit ? 90 : 70;
            if (dist < 150) score += 20;
            if (directHit) score += 20;
            if (enemy.health <= weapon.damage * weapon.shotCount) score += 30;
            score -= this.friendlyFireRisk(selfCenter, angle, 200, friendlies) * 40;

            candidates.push({
              weaponIdx: wi,
              angle,
              power: 100,
              score,
              impactX: hitResult.x,
              impactY: hitResult.y,
            });
          }
        }
        continue;
      }

      if (weapon.firingMode === 'targeted') {
        for (const enemy of enemies) {
          const ec = enemy.getCenter();
          const dx = ec.x - selfCenter.x;
          const dist = Math.sqrt(
            (ec.x - selfCenter.x) ** 2 + (ec.y - selfCenter.y) ** 2,
          );
          const angle = dx >= 0 ? 0 : Math.PI;
          const power = Math.min(100, Math.max(10, Math.abs(dx) / 3));
          let score = 60;
          if (dist > 300) score += 15;

          for (const f of friendlies) {
            const fc = f.getCenter();
            if (Math.abs(fc.x - ec.x) < 40) score -= 40;
          }
          if (Math.abs(selfCenter.x - ec.x) < 40) score -= 30;

          candidates.push({
            weaponIdx: wi,
            angle,
            power,
            score,
            impactX: ec.x,
            impactY: ec.y,
          });
        }
        continue;
      }

      // Projectile weapons: coarse sweep
      for (const enemy of enemies) {
        const ec = enemy.getCenter();
        const dx = ec.x - selfCenter.x;
        const dy = ec.y - selfCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const angleSteps = cfg.coarseAngleSteps;
        const powerSteps = cfg.coarsePowerSteps;

        for (let ai = 0; ai < angleSteps; ai++) {
          const angle = -Math.PI + (ai / angleSteps) * Math.PI;

          for (let pi = 0; pi < powerSteps; pi++) {
            const power = 15 + (pi / (powerSteps - 1)) * 85;

            const sim = this.simulateProjectile(
              selfCenter.x,
              selfCenter.y,
              angle,
              power,
              weapon,
            );

            if (sim.outOfBounds) continue;

            const score = this.scoreImpact(
              sim, ec, weapon, selfCenter, friendlies, dist,
            );

            if (score > 0) {
              candidates.push({
                weaponIdx: wi,
                angle,
                power,
                score,
                impactX: sim.hitX,
                impactY: sim.hitY,
              });
            }
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);

    // Refinement pass around the best coarse candidate
    if (cfg.refine && candidates.length > 0) {
      const best = candidates[0]!;
      const weapon = WEAPONS[WEAPON_ORDER[best.weaponIdx]!]!;

      if (weapon.firingMode === 'projectile') {
        const targetEnemy = this.findTargetNear(best.impactX, best.impactY, enemies);
        if (targetEnemy) {
          const ec = targetEnemy.getCenter();
          const rAngleSteps = cfg.refineAngleSteps;
          const rPowerSteps = cfg.refinePowerSteps;
          const aSpread = cfg.refineAngleSpread;
          const pSpread = cfg.refinePowerSpread;

          for (let ra = 0; ra < rAngleSteps; ra++) {
            const angle = best.angle - aSpread + (ra / (rAngleSteps - 1)) * (aSpread * 2);

            for (let rp = 0; rp < rPowerSteps; rp++) {
              const power = Math.max(
                10,
                Math.min(100, best.power - pSpread + (rp / (rPowerSteps - 1)) * (pSpread * 2)),
              );

              const sim = this.simulateProjectile(
                selfCenter.x,
                selfCenter.y,
                angle,
                power,
                weapon,
              );

              if (sim.outOfBounds) continue;

              const dist = Math.sqrt(
                (ec.x - selfCenter.x) ** 2 + (ec.y - selfCenter.y) ** 2,
              );
              const score = this.scoreImpact(
                sim, ec, weapon, selfCenter, friendlies, dist,
              );

              if (score > 0) {
                candidates.push({
                  weaponIdx: best.weaponIdx,
                  angle,
                  power,
                  score,
                  impactX: sim.hitX,
                  impactY: sim.hitY,
                });
              }
            }
          }

          candidates.sort((a, b) => b.score - a.score);
        }
      }
    }

    const topN = Math.min(cfg.topNPick, candidates.length);
    const pick = candidates[Math.floor(Math.random() * topN)]!;

    pick.angle += (Math.random() - 0.5) * cfg.jitterAngle;
    pick.power += (Math.random() - 0.5) * cfg.jitterPower;

    if (cfg.missChance > 0 && Math.random() < cfg.missChance) {
      pick.angle += (Math.random() - 0.5) * cfg.missExtraAngle;
      pick.power += (Math.random() - 0.5) * cfg.missExtraPower;
    }

    pick.power = Math.max(10, Math.min(100, pick.power));

    return pick;
  }

  private scoreImpact(
    sim: SimResult,
    enemyCenter: { x: number; y: number },
    weapon: WeaponDef,
    selfCenter: { x: number; y: number },
    friendlies: Worm[],
    distToEnemy: number,
  ): number {
    const impactDx = sim.hitX - enemyCenter.x;
    const impactDy = sim.hitY - enemyCenter.y;
    const impactDist = Math.sqrt(impactDx * impactDx + impactDy * impactDy);

    if (impactDist > weapon.blastRadius * 2.5) return 0;

    let score = 0;

    if (impactDist <= weapon.blastRadius) {
      score = 100 - (impactDist / weapon.blastRadius) * 30;
    } else {
      score = 40 - (impactDist / (weapon.blastRadius * 2.5)) * 40;
    }

    if (impactDist < 5) score += 15;

    const dmgFrac = Math.max(0, 1 - impactDist / weapon.blastRadius);
    const estimatedDmg = weapon.damage * dmgFrac;
    if (estimatedDmg > 0) score += 10;

    const selfDist = Math.sqrt(
      (sim.hitX - selfCenter.x) ** 2 + (sim.hitY - selfCenter.y) ** 2,
    );
    if (selfDist < weapon.blastRadius * 1.2) {
      score -= 80;
    } else if (selfDist < weapon.blastRadius * 2) {
      score -= 30;
    }

    for (const f of friendlies) {
      const fc = f.getCenter();
      const fDist = Math.sqrt(
        (sim.hitX - fc.x) ** 2 + (sim.hitY - fc.y) ** 2,
      );
      if (fDist < weapon.blastRadius * 1.5) {
        score -= 50;
      }
    }

    if (weapon.id === 'grenade' && distToEnemy < 200) score += 5;
    if (weapon.id === 'bazooka' && distToEnemy > 150) score += 5;
    if (weapon.id === 'cluster-bomb' && distToEnemy < 250) score += 8;
    if (weapon.id === 'sniper' && distToEnemy > 200) score += 10;

    return score;
  }

  private findTargetNear(
    x: number,
    y: number,
    enemies: Worm[],
  ): Worm | null {
    let best: Worm | null = null;
    let bestDist = Infinity;
    for (const e of enemies) {
      const ec = e.getCenter();
      const d = Math.sqrt((ec.x - x) ** 2 + (ec.y - y) ** 2);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private simulateProjectile(
    startX: number,
    startY: number,
    angle: number,
    power: number,
    weapon: WeaponDef,
  ): SimResult {
    const speed = weapon.projectileSpeed * (power / 100);
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    let x = startX;
    let y = startY;

    const windForce = this.wind ? this.wind.getWindForce() : 0;
    const gravity = weapon.projectileGravity;
    const useWind = weapon.affectedByWind;
    let fuseTimer = weapon.fuse > 0 ? weapon.fuse * 60 : 0;

    for (let step = 0; step < SIM_MAX_STEPS; step++) {
      vy += gravity;
      if (useWind) vx += windForce;

      x += vx;
      y += vy;

      if (fuseTimer > 0) {
        fuseTimer--;
        if (fuseTimer <= 0) {
          return { hitX: x, hitY: y, hitTerrain: false, outOfBounds: false };
        }
      }

      if (!this.terrain) continue;

      if (x < -50 || x > this.terrain.getWidth() + 50 || y > this.terrain.getHeight() + 50) {
        return { hitX: x, hitY: y, hitTerrain: false, outOfBounds: true };
      }

      if (y >= 0 && this.terrain.isSolid(x, y)) {
        if (weapon.bounces) {
          while (y > 0 && this.terrain.isSolid(x, y)) y -= 1;
          vy = -Math.abs(vy) * weapon.bounceFriction;
          vx *= weapon.bounceFriction;
          const spd = Math.sqrt(vx * vx + vy * vy);
          if (spd < 0.5) {
            if (fuseTimer > 0) continue;
            return { hitX: x, hitY: y, hitTerrain: true, outOfBounds: false };
          }
          continue;
        }
        if (fuseTimer > 0) {
          while (y > 0 && this.terrain.isSolid(x, y)) y -= 1;
          vx = 0;
          vy = 0;
          continue;
        }
        return { hitX: x, hitY: y, hitTerrain: true, outOfBounds: false };
      }
    }

    return { hitX: x, hitY: y, hitTerrain: false, outOfBounds: true };
  }

  private simulateHitscan(
    originX: number,
    originY: number,
    angle: number,
  ): { x: number; y: number } {
    const maxDist = 3000;
    const step = 2;
    const dx = Math.cos(angle) * step;
    const dy = Math.sin(angle) * step;

    let hitX = originX;
    let hitY = originY;

    for (let d = 0; d < maxDist; d += step) {
      hitX += dx;
      hitY += dy;
      if (!this.terrain) continue;
      if (hitX < 0 || hitX >= this.terrain.getWidth() || hitY >= this.terrain.getHeight()) break;
      if (this.terrain.isSolid(hitX, hitY)) break;
    }
    return { x: hitX, y: hitY };
  }

  private scorePlacedWeapon(
    self: Worm,
    enemies: Worm[],
    friendlies: Worm[],
    weapon: WeaponDef,
  ): number {
    const sc = self.getCenter();
    let score = 0;

    for (const e of enemies) {
      const ec = e.getCenter();
      const dist = Math.sqrt((ec.x - sc.x) ** 2 + (ec.y - sc.y) ** 2);
      if (dist < weapon.blastRadius) {
        score += 70;
        if (e.health <= weapon.damage) score += 30;
      } else if (dist < weapon.blastRadius * 1.5) {
        score += 30;
      }
    }

    score -= 40;

    for (const f of friendlies) {
      const fc = f.getCenter();
      const dist = Math.sqrt((fc.x - sc.x) ** 2 + (fc.y - sc.y) ** 2);
      if (dist < weapon.blastRadius * 1.5) {
        score -= 50;
      }
    }

    return score;
  }

  private friendlyFireRisk(
    origin: { x: number; y: number },
    angle: number,
    range: number,
    friendlies: Worm[],
  ): number {
    let risk = 0;
    for (const f of friendlies) {
      const fc = f.getCenter();
      const dx = fc.x - origin.x;
      const dy = fc.y - origin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > range) continue;
      const angleToFriendly = Math.atan2(dy, dx);
      const angleDiff = Math.abs(angleToFriendly - angle);
      if (angleDiff < 0.3) risk += 1;
    }
    return risk;
  }

  private closestEnemy(self: Worm, enemies: Worm[]): Worm {
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

  private closestEnemyDist(self: Worm, enemies: Worm[]): number {
    let minDist = Infinity;
    for (const e of enemies) {
      const dx = e.x - self.x;
      const dy = e.y - self.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) minDist = dist;
    }
    return minDist;
  }

  private chooseMoveDirection(
    worm: Worm,
    enemies: Worm[],
    bestShot: ShotCandidate | null,
  ): number {
    const target = this.closestEnemy(worm, enemies);
    const dist = Math.abs(target.x - worm.x);

    // If enemy is very close (< 60px), sometimes retreat to get a better shot
    if (dist < 60 && Math.random() < 0.4) {
      return target.x > worm.x ? -1 : 1;
    }

    // If we have a decent shot and enemy is at medium range, try flanking (random direction)
    if (bestShot && bestShot.score > 30 && dist < 300 && Math.random() < 0.3) {
      return Math.random() < 0.5 ? 1 : -1;
    }

    // Default: move toward closest enemy
    return target.x > worm.x ? 1 : -1;
  }

  private chooseMoveSteps(
    worm: Worm,
    enemies: Worm[],
    cfg: DifficultyConfig,
  ): number {
    const dist = this.closestEnemyDist(worm, enemies);

    // Far away = move more; close = move less
    if (dist > 600) return cfg.moveSteps;
    if (dist > 300) return Math.floor(cfg.moveSteps * 0.7);
    if (dist > 100) return Math.floor(cfg.moveSteps * 0.4);
    return Math.floor(cfg.moveSteps * 0.25);
  }

  private shouldJumpDuringMove(worm: Worm): boolean {
    if (!this.terrain) return false;

    // Check if there's a wall/obstacle ahead — jump to climb over it
    const lookAhead = worm.facingRight ? worm.x + 20 : worm.x - 20;
    if (lookAhead > 0 && lookAhead < this.terrain.getWidth()) {
      const groundY = this.terrain.getSurfaceY(lookAhead);
      if (worm.y - groundY > 6) return true;
    }

    // Small random chance to jump for unpredictability
    return Math.random() < 0.15;
  }

  private executeMoveThenShoot(
    scene: Phaser.Scene,
    worm: Worm,
    enemies: Worm[],
    friendlies: Worm[],
    weaponSystem: WeaponSystem,
    moveDir: number,
    steps: number,
    shouldJump: boolean,
  ): void {
    let stepsDone = 0;
    let hasJumped = false;
    const jumpAtStep = Math.floor(steps * 0.3 + Math.random() * steps * 0.4);

    const moveTimer = scene.time.addEvent({
      delay: AI_MOVE_STEP_DELAY,
      repeat: steps - 1,
      callback: () => {
        if (!worm.alive || !worm.isGrounded) return;
        if (moveDir > 0) worm.moveRight();
        else worm.moveLeft();
        stepsDone++;

        if (shouldJump && !hasJumped && stepsDone >= jumpAtStep && worm.isGrounded) {
          worm.jump();
          hasJumped = true;
        }
      },
    });

    scene.time.delayedCall(steps * AI_MOVE_STEP_DELAY + 300, () => {
      moveTimer.destroy();

      const best = this.findBestShot(worm, enemies, friendlies);
      if (best && best.score >= 5) {
        this.executeShot(scene, weaponSystem, worm, best);
      } else {
        this.executeFallbackShot(scene, weaponSystem, worm, enemies);
      }
    });
  }

  private moveTowardEnemy(
    scene: Phaser.Scene,
    worm: Worm,
    enemies: Worm[],
    steps: number,
    onDone: () => void,
  ): void {
    const target = this.closestEnemy(worm, enemies);
    const moveDir = target.x > worm.x ? 1 : -1;
    const maxSteps = steps;

    const moveTimer = scene.time.addEvent({
      delay: AI_MOVE_STEP_DELAY,
      repeat: maxSteps - 1,
      callback: () => {
        if (!worm.alive || !worm.isGrounded) return;
        if (moveDir > 0) worm.moveRight();
        else worm.moveLeft();
      },
    });

    scene.time.delayedCall(maxSteps * AI_MOVE_STEP_DELAY + 200, () => {
      moveTimer.destroy();
      onDone();
    });
  }
}
