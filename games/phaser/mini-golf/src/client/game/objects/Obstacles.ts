import * as Phaser from 'phaser';
import {
  BUMPER_RESTITUTION,
  GUMDROP_RESTITUTION,
  SAND_FRICTION_AIR,
  ICE_FRICTION_AIR,
  toScreen,
  scaleValue,
} from '../utils/physics';
import type { GolfBall } from './GolfBall';

export type ObstacleType =
  | 'bumper'
  | 'sand'
  | 'ice'
  | 'water'
  | 'windmill'
  | 'teleporter'
  | 'ramp'
  | 'conveyor'
  | 'thrusting_barrier'
  | 'gravity_well'
  | 'moving_bridge'
  | 'block'
  | 'licorice_wall'
  | 'gumdrop_bumper';

export interface ObstacleDef {
  type: ObstacleType;
  x: number;
  y: number;
  radius?: number;
  width?: number;
  height?: number;
  angle?: number;
  speed?: number;
  targetX?: number;
  targetY?: number;
  forceX?: number;
  forceY?: number;
  color?: number;
  bladeCount?: number;
  bladeLength?: number;
}

export interface ZoneDef {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number;
}

export interface TeleporterDef {
  entryX: number;
  entryY: number;
  exitX: number;
  exitY: number;
  color?: number;
}

interface ActiveZone {
  type: 'sand' | 'ice' | 'water' | 'ramp' | 'conveyor';
  rect: Phaser.Geom.Rectangle;
  forceX?: number;
  forceY?: number;
}

interface ActiveTeleporter {
  entryRect: Phaser.Geom.Rectangle;
  exitX: number;
  exitY: number;
  cooldown: number;
}

interface WindmillData {
  body: MatterJS.BodyType[];
  graphics: Phaser.GameObjects.Graphics;
  cx: number;
  cy: number;
  speed: number;
  currentAngle: number;
}

export class Obstacles {
  scene: Phaser.Scene;
  private zones: ActiveZone[] = [];
  private teleporters: ActiveTeleporter[] = [];
  private windmills: WindmillData[] = [];
  private bodies: MatterJS.BodyType[] = [];
  private gameObjects: Phaser.GameObjects.GameObject[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private windmillGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5);
    this.zoneGraphics = scene.add.graphics();
    this.zoneGraphics.setDepth(1);
  }

  addBumper(def: ObstacleDef): void {
    const pos = toScreen(this.scene, def.x, def.y);
    const r = scaleValue(this.scene, def.radius ?? 15);

    const body = this.scene.matter.add.circle(pos.x, pos.y, r, {
      isStatic: true,
      restitution: BUMPER_RESTITUTION,
      label: 'bumper',
    });
    this.bodies.push(body);

    const color = def.color ?? 0xff6347;
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(pos.x, pos.y, r);
    this.graphics.lineStyle(2, 0xffffff, 0.5);
    this.graphics.strokeCircle(pos.x, pos.y, r);
    this.graphics.fillStyle(0xffffff, 0.3);
    this.graphics.fillCircle(pos.x - r * 0.25, pos.y - r * 0.25, r * 0.35);
  }

  addBlock(def: ObstacleDef): void {
    const pos = toScreen(this.scene, def.x, def.y);
    const w = scaleValue(this.scene, def.width ?? 60);
    const h = scaleValue(this.scene, def.height ?? 30);
    const angle = def.angle ?? Math.PI / 4;

    const body = this.scene.matter.add.rectangle(pos.x, pos.y, w, h, {
      isStatic: true,
      angle,
      restitution: 0.85,
      friction: 0.05,
      label: 'block',
    });
    this.bodies.push(body);

    const img = this.scene.add.image(pos.x, pos.y, 'chocolate-block');
    img.setDisplaySize(w, h);
    img.setRotation(angle);
    img.setDepth(6);
    this.gameObjects.push(img);
  }

  addLicoriceWall(def: ObstacleDef): void {
    const pos = toScreen(this.scene, def.x, def.y);
    const w = scaleValue(this.scene, def.width ?? 100);
    const h = scaleValue(this.scene, def.height ?? 20);
    const angle = def.angle ?? 0;

    const body = this.scene.matter.add.rectangle(pos.x, pos.y, w, h, {
      isStatic: true,
      angle,
      restitution: 0.7,
      friction: 0.1,
      label: 'licorice_wall',
    });
    this.bodies.push(body);

    const tile = this.scene.add.tileSprite(pos.x, pos.y, w, h, 'licorice');
    tile.setRotation(angle);
    tile.setDepth(6);
    this.gameObjects.push(tile);
  }

  addGumdropBumper(def: ObstacleDef): void {
    const pos = toScreen(this.scene, def.x, def.y);
    const r = scaleValue(this.scene, def.radius ?? 22);

    const body = this.scene.matter.add.circle(pos.x, pos.y, r, {
      isStatic: true,
      restitution: GUMDROP_RESTITUTION,
      label: 'gumdrop_bumper',
    });
    this.bodies.push(body);

    const img = this.scene.add.image(pos.x, pos.y, 'gumdrop');
    const scale = (r * 2) / img.width;
    img.setScale(scale);
    img.setTint(def.color ?? 0xff6347);
    img.setDepth(6);
    this.gameObjects.push(img);
  }

  addZone(type: 'sand' | 'ice' | 'water', zone: ZoneDef): void {
    const tl = toScreen(this.scene, zone.x, zone.y);
    const br = toScreen(this.scene, zone.x + zone.width, zone.y + zone.height);
    const w = br.x - tl.x;
    const h = br.y - tl.y;

    const rect = new Phaser.Geom.Rectangle(tl.x, tl.y, w, h);
    this.zones.push({ type, rect });

    let color: number;
    let alpha: number;
    switch (type) {
      case 'sand':
        color = zone.color ?? 0xd2b48c;
        alpha = 0.6;
        break;
      case 'ice':
        color = zone.color ?? 0xadd8e6;
        alpha = 0.5;
        break;
      case 'water':
        color = zone.color ?? 0xff69b4;
        alpha = 0.5;
        break;
    }

    this.zoneGraphics.fillStyle(color, alpha);
    this.zoneGraphics.fillRect(tl.x, tl.y, w, h);

    if (type === 'sand') {
      if (this.scene.textures.exists('graham-cracker')) {
        const tile = this.scene.add.tileSprite(tl.x + w / 2, tl.y + h / 2, w, h, 'graham-cracker');
        tile.setDepth(2);
        tile.setAlpha(0.85);
        this.gameObjects.push(tile);
      } else {
        const dotCount = Math.floor((w * h) / 200);
        this.zoneGraphics.fillStyle(0xc4a882, 0.4);
        for (let i = 0; i < dotCount; i++) {
          const dx = tl.x + Math.random() * w;
          const dy = tl.y + Math.random() * h;
          this.zoneGraphics.fillCircle(dx, dy, 1.5);
        }
      }
    }
  }

  addRampZone(zone: ZoneDef, forceX: number, forceY: number): void {
    const tl = toScreen(this.scene, zone.x, zone.y);
    const br = toScreen(this.scene, zone.x + zone.width, zone.y + zone.height);
    const w = br.x - tl.x;
    const h = br.y - tl.y;

    const rect = new Phaser.Geom.Rectangle(tl.x, tl.y, w, h);
    this.zones.push({ type: 'ramp', rect, forceX, forceY });

    this.zoneGraphics.fillStyle(0x8b4513, 0.4);
    this.zoneGraphics.fillRect(tl.x, tl.y, w, h);

    const arrowSpacing = scaleValue(this.scene, 20);
    const arrowSize = scaleValue(this.scene, 6);
    this.zoneGraphics.fillStyle(0xffffff, 0.2);
    const angle = Math.atan2(forceY, forceX);
    for (let ax = tl.x + arrowSpacing; ax < tl.x + w; ax += arrowSpacing) {
      for (let ay = tl.y + arrowSpacing; ay < tl.y + h; ay += arrowSpacing) {
        const ex = ax + Math.cos(angle) * arrowSize;
        const ey = ay + Math.sin(angle) * arrowSize;
        this.zoneGraphics.lineStyle(1, 0xffffff, 0.2);
        this.zoneGraphics.beginPath();
        this.zoneGraphics.moveTo(ax, ay);
        this.zoneGraphics.lineTo(ex, ey);
        this.zoneGraphics.strokePath();
      }
    }
  }

  addConveyorZone(zone: ZoneDef, forceX: number, forceY: number): void {
    const tl = toScreen(this.scene, zone.x, zone.y);
    const br = toScreen(this.scene, zone.x + zone.width, zone.y + zone.height);
    const w = br.x - tl.x;
    const h = br.y - tl.y;

    const rect = new Phaser.Geom.Rectangle(tl.x, tl.y, w, h);
    this.zones.push({ type: 'conveyor', rect, forceX, forceY });

    this.zoneGraphics.fillStyle(zone.color ?? 0x808080, 0.5);
    this.zoneGraphics.fillRect(tl.x, tl.y, w, h);
  }

  addTeleporter(def: TeleporterDef): void {
    const entry = toScreen(this.scene, def.entryX, def.entryY);
    const exit = toScreen(this.scene, def.exitX, def.exitY);
    const r = scaleValue(this.scene, 14);

    const entryRect = new Phaser.Geom.Rectangle(entry.x - r, entry.y - r, r * 2, r * 2);
    this.teleporters.push({ entryRect, exitX: exit.x, exitY: exit.y, cooldown: 0 });

    const color = def.color ?? 0x9370db;
    this.graphics.fillStyle(color, 0.8);
    this.graphics.fillCircle(entry.x, entry.y, r);
    this.graphics.fillCircle(exit.x, exit.y, r);
    this.graphics.lineStyle(2, 0xffffff, 0.4);
    this.graphics.strokeCircle(entry.x, entry.y, r);
    this.graphics.strokeCircle(exit.x, exit.y, r);
  }

  addWindmill(def: ObstacleDef): void {
    const pos = toScreen(this.scene, def.x, def.y);
    const bladeLen = scaleValue(this.scene, def.bladeLength ?? 50);
    const bladeW = scaleValue(this.scene, 8);
    const bladeCount = def.bladeCount ?? 4;
    const speed = def.speed ?? 1.5;

    const bladeBodies: MatterJS.BodyType[] = [];
    const g = this.scene.add.graphics();
    g.setDepth(7);

    for (let i = 0; i < bladeCount; i++) {
      const angle = (i * Math.PI * 2) / bladeCount;
      const bx = pos.x + Math.cos(angle) * (bladeLen / 2);
      const by = pos.y + Math.sin(angle) * (bladeLen / 2);

      const body = this.scene.matter.add.rectangle(bx, by, bladeLen, bladeW, {
        isStatic: true,
        angle,
        restitution: 0.9,
        label: 'windmill_blade',
      });
      bladeBodies.push(body);
      this.bodies.push(body);
    }

    this.windmills.push({
      body: bladeBodies,
      graphics: g,
      cx: pos.x,
      cy: pos.y,
      speed,
      currentAngle: 0,
    });
    this.windmillGraphics.push(g);
  }

  updateWindmills(delta: number): void {
    for (const wm of this.windmills) {
      wm.currentAngle += (wm.speed * delta) / 1000;
      const bladeCount = wm.body.length;

      wm.graphics.clear();

      for (let i = 0; i < bladeCount; i++) {
        const body = wm.body[i]!;
        const angle = wm.currentAngle + (i * Math.PI * 2) / bladeCount;

        const bladeLen = Math.sqrt(
          (body.bounds.max.x - body.bounds.min.x) ** 2 +
            (body.bounds.max.y - body.bounds.min.y) ** 2
        );
        const halfLen = bladeLen / 2;

        const bx = wm.cx + Math.cos(angle) * (halfLen * 0.5);
        const by = wm.cy + Math.sin(angle) * (halfLen * 0.5);

        this.scene.matter.body.setPosition(body, { x: bx, y: by });
        this.scene.matter.body.setAngle(body, angle);

        const ex = wm.cx + Math.cos(angle) * halfLen;
        const ey = wm.cy + Math.sin(angle) * halfLen;

        wm.graphics.lineStyle(scaleValue(this.scene, 8), 0xe9c46a, 0.9);
        wm.graphics.beginPath();
        wm.graphics.moveTo(wm.cx, wm.cy);
        wm.graphics.lineTo(ex, ey);
        wm.graphics.strokePath();
      }

      wm.graphics.fillStyle(0x8b4513, 1);
      wm.graphics.fillCircle(wm.cx, wm.cy, scaleValue(this.scene, 6));
    }
  }

  applyZoneEffects(ball: GolfBall): { inWater: boolean } {
    let inWater = false;
    let inSpecialZone = false;

    const bx = ball.body.position.x;
    const by = ball.body.position.y;

    for (const zone of this.zones) {
      if (!zone.rect.contains(bx, by)) continue;

      switch (zone.type) {
        case 'sand':
          ball.setFrictionAir(SAND_FRICTION_AIR);
          inSpecialZone = true;
          break;
        case 'ice':
          ball.setFrictionAir(ICE_FRICTION_AIR);
          inSpecialZone = true;
          break;
        case 'water':
          inWater = true;
          break;
        case 'ramp':
          if (zone.forceX !== undefined && zone.forceY !== undefined) {
            this.scene.matter.body.applyForce(ball.body, ball.body.position, {
              x: zone.forceX * 0.0001,
              y: zone.forceY * 0.0001,
            });
          }
          break;
        case 'conveyor':
          if (zone.forceX !== undefined && zone.forceY !== undefined) {
            this.scene.matter.body.applyForce(ball.body, ball.body.position, {
              x: zone.forceX * 0.00005,
              y: zone.forceY * 0.00005,
            });
          }
          break;
      }
    }

    if (!inSpecialZone && !inWater) {
      ball.resetFrictionAir();
    }

    return { inWater };
  }

  checkTeleporters(ball: GolfBall): boolean {
    const bx = ball.body.position.x;
    const by = ball.body.position.y;

    for (const tp of this.teleporters) {
      if (tp.cooldown > 0) {
        tp.cooldown--;
        continue;
      }
      if (tp.entryRect.contains(bx, by)) {
        const vx = ball.body.velocity.x;
        const vy = ball.body.velocity.y;
        ball.setPosition(tp.exitX, tp.exitY);
        this.scene.matter.body.setVelocity(ball.body, { x: vx, y: vy });
        tp.cooldown = 30;
        return true;
      }
    }
    return false;
  }

  update(delta: number, ball: GolfBall): { inWater: boolean; teleported: boolean } {
    this.updateWindmills(delta);
    const { inWater } = this.applyZoneEffects(ball);
    const teleported = this.checkTeleporters(ball);
    return { inWater, teleported };
  }

  destroy(): void {
    for (const body of this.bodies) {
      this.scene.matter.world.remove(body);
    }
    this.bodies = [];
    this.zones = [];
    this.teleporters = [];
    this.windmills = [];
    for (const obj of this.gameObjects) {
      obj.destroy();
    }
    this.gameObjects = [];
    this.graphics.destroy();
    this.zoneGraphics.destroy();
    for (const g of this.windmillGraphics) {
      g.destroy();
    }
    this.windmillGraphics = [];
  }
}
