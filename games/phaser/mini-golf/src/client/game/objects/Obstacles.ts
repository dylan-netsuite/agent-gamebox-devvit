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
  | 'tongue'
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
  exitAngle?: number;
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
  exitAngle?: number;
  cooldown: number;
}

interface WindmillData {
  body: MatterJS.BodyType[];
  graphics: Phaser.GameObjects.Graphics;
  cx: number;
  cy: number;
  speed: number;
  currentAngle: number;
  hitCooldown: number;
}

interface MovingBridgeData {
  graphics: Phaser.GameObjects.Graphics;
  startY: number;
  endY: number;
  currentY: number;
  width: number;
  height: number;
  cx: number;
  speed: number;
  progress: number;
  direction: 1 | -1;
}

interface TongueData {
  body: MatterJS.BodyType;
  graphics: Phaser.GameObjects.Graphics;
  anchorX: number;
  anchorY: number;
  tongueLen: number;
  tongueH: number;
  side: 'left' | 'right';
  speed: number;
  phase: number;
  hitCooldown: number;
}

export class Obstacles {
  scene: Phaser.Scene;
  private zones: ActiveZone[] = [];
  private teleporters: ActiveTeleporter[] = [];
  private windmills: WindmillData[] = [];
  private bridges: MovingBridgeData[] = [];
  private tongues: TongueData[] = [];
  private bodies: MatterJS.BodyType[] = [];
  private gameObjects: Phaser.GameObjects.GameObject[] = [];
  private graphics: Phaser.GameObjects.Graphics;
  private zoneGraphics: Phaser.GameObjects.Graphics;
  private iceOverlayGraphics: Phaser.GameObjects.Graphics;
  private pipeGraphics: Phaser.GameObjects.Graphics;
  private windmillGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5);
    this.zoneGraphics = scene.add.graphics();
    this.zoneGraphics.setDepth(1);
    this.iceOverlayGraphics = scene.add.graphics();
    this.iceOverlayGraphics.setDepth(3);
    this.pipeGraphics = scene.add.graphics();
    this.pipeGraphics.setDepth(1);
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
      restitution: 1.1,
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
        alpha = zone.color !== undefined ? 0.75 : 0.5;
        break;
      case 'water':
        color = zone.color ?? 0xff69b4;
        alpha = 0.5;
        break;
    }

    this.zoneGraphics.fillStyle(color, alpha);
    if (type === 'water') {
      const r = Math.min(w, h) * 0.3;
      this.zoneGraphics.fillRoundedRect(tl.x, tl.y, w, h, r);
    } else {
      this.zoneGraphics.fillRect(tl.x, tl.y, w, h);
    }

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

    if (type === 'ice' && zone.color !== undefined) {
      const g = this.iceOverlayGraphics;

      g.fillStyle(color, 0.8);
      g.fillRect(tl.x, tl.y, w, h);

      // Bright glossy sheen stripe across the top third
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(tl.x, tl.y, w, h * 0.2);

      // Secondary mid-sheen for a wet/glassy look
      g.fillStyle(0xffffff, 0.15);
      g.fillRect(tl.x, tl.y + h * 0.2, w, h * 0.15);

      // Diagonal gloss highlight streak
      g.lineStyle(3, 0xffffff, 0.3);
      g.beginPath();
      g.moveTo(tl.x + w * 0.1, tl.y + h * 0.15);
      g.lineTo(tl.x + w * 0.7, tl.y + h * 0.05);
      g.strokePath();

      // Thin outline border to separate from turf
      g.lineStyle(1.5, 0xffffff, 0.4);
      g.strokeRect(tl.x, tl.y, w, h);

      // Sprinkle dots scattered across the ice cream surface
      const sprinkleColors = [0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3, 0x54a0ff, 0x5f27cd];
      const sprinkleCount = Math.floor((w * h) / 350);
      for (let i = 0; i < sprinkleCount; i++) {
        const sx = tl.x + 4 + Math.random() * (w - 8);
        const sy = tl.y + 4 + Math.random() * (h - 8);
        const sc = sprinkleColors[Math.floor(Math.random() * sprinkleColors.length)]!;
        g.fillStyle(sc, 0.7);
        const angle = Math.random() * Math.PI;
        const len = 3 + Math.random() * 2;
        g.fillRect(sx - Math.cos(angle) * len / 2, sy - Math.sin(angle) * len / 2, len, 1.5);
      }

      // Wavy drip edge along the bottom
      g.lineStyle(2, color, 0.5);
      g.beginPath();
      const dripY = tl.y + h;
      g.moveTo(tl.x, dripY);
      for (let dx = 0; dx <= w; dx += 8) {
        const wavey = dripY + Math.sin(dx * 0.15) * 3;
        g.lineTo(tl.x + dx, wavey);
      }
      g.strokePath();
    }

    if (type === 'water') {
      const r = Math.min(w, h) * 0.3;
      if (this.scene.textures.exists('taffy')) {
        const tile = this.scene.add.tileSprite(tl.x + w / 2, tl.y + h / 2, w, h, 'taffy');
        tile.setDepth(2);
        tile.setAlpha(0.85);
        const mask = this.scene.make.graphics({ x: 0, y: 0 });
        mask.fillStyle(0xffffff);
        mask.fillRoundedRect(tl.x, tl.y, w, h, r);
        tile.setMask(mask.createGeometryMask());
        this.gameObjects.push(tile);
      }
      const wg = this.iceOverlayGraphics;
      wg.lineStyle(1.5, 0xffffff, 0.25);
      for (let wy = tl.y + 6; wy < tl.y + h - 4; wy += 8) {
        wg.beginPath();
        const startX = tl.x + 4;
        wg.moveTo(startX, wy);
        for (let dx = 0; dx <= w - 8; dx += 6) {
          wg.lineTo(startX + dx, wy + Math.sin((dx + wy) * 0.2) * 2);
        }
        wg.strokePath();
      }
      wg.fillStyle(0xffffff, 0.15);
      wg.fillRoundedRect(tl.x + 2, tl.y + 2, w * 0.6, h * 0.3, r * 0.5);
    }
  }

  addRampZone(zone: ZoneDef, forceX: number, forceY: number): void {
    const tl = toScreen(this.scene, zone.x, zone.y);
    const br = toScreen(this.scene, zone.x + zone.width, zone.y + zone.height);
    const w = br.x - tl.x;
    const h = br.y - tl.y;

    const rect = new Phaser.Geom.Rectangle(tl.x, tl.y, w, h);
    this.zones.push({ type: 'ramp', rect, forceX, forceY });

    // Jawbreaker ramp texture
    if (this.scene.textures.exists('jawbreaker')) {
      const tile = this.scene.add.tileSprite(tl.x + w / 2, tl.y + h / 2, w, h, 'jawbreaker');
      tile.setDepth(2);
      this.gameObjects.push(tile);
    }

    const g = this.zoneGraphics;

    // Bottom edge: dark candy shadow
    g.fillStyle(0x4a0020, 0.6);
    g.fillRect(tl.x, tl.y + h - scaleValue(this.scene, 6), w, scaleValue(this.scene, 6));

    // Top edge: bright candy highlight
    g.fillStyle(0xffccee, 0.5);
    g.fillRect(tl.x, tl.y, w, scaleValue(this.scene, 4));

    // Candy-colored upward chevrons
    const chevronSpacing = scaleValue(this.scene, 20);
    const chevronW = w * 0.42;
    const chevronH = scaleValue(this.scene, 10);
    const centerX = tl.x + w / 2;
    const lineW = scaleValue(this.scene, 3);
    const candyColors = [0xff69b4, 0xffd700, 0x00ced1, 0xff6347, 0x9370db, 0x32cd32];

    let rowIdx = 0;
    for (let cy = tl.y + h - chevronSpacing * 0.5; cy > tl.y + chevronH; cy -= chevronSpacing) {
      const alpha = 0.5 + (1 - (cy - tl.y) / h) * 0.4;
      const color = candyColors[rowIdx % candyColors.length]!;

      g.lineStyle(lineW, color, alpha);
      g.beginPath();
      g.moveTo(centerX - chevronW, cy + chevronH);
      g.lineTo(centerX, cy);
      g.lineTo(centerX + chevronW, cy + chevronH);
      g.strokePath();

      rowIdx++;
    }

    // Plateau zone above the ramp (candy-themed elevated area)
    if (this.scene.textures.exists('ramp-plateau')) {
      const plateauTl = toScreen(this.scene, zone.x, zone.y - (zone.height * 2));
      const plateauBr = toScreen(this.scene, zone.x + zone.width, zone.y);
      const pw = plateauBr.x - plateauTl.x;
      const ph = plateauBr.y - plateauTl.y;

      const pTile = this.scene.add.tileSprite(
        plateauTl.x + pw / 2, plateauTl.y + ph / 2, pw, ph, 'ramp-plateau'
      );
      pTile.setDepth(2);
      pTile.setAlpha(0.55);
      this.gameObjects.push(pTile);
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

  private generateTangledPath(
    entry: { x: number; y: number },
    exit: { x: number; y: number },
    colorSeed: number,
  ): { x: number; y: number }[] {
    const s = (v: number) => scaleValue(this.scene, v);
    const midX = (entry.x + exit.x) / 2;
    const midY = (entry.y + exit.y) / 2;
    const g = Math.abs(exit.y - entry.y);

    const band = (colorSeed >> 8) & 0xff;
    const variant = band < 85 ? 0 : band < 170 ? 1 : 2;

    if (variant === 0) {
      // Red: hard right loop, cross far left, tight spiral right, cross left, curl to exit
      return [
        { x: entry.x, y: entry.y },
        { x: entry.x + s(100), y: entry.y - s(5) },
        { x: midX + s(140), y: midY + g * 0.35 },
        { x: midX + s(50), y: midY + g * 0.22 },
        { x: midX - s(130), y: midY + g * 0.12 },
        { x: midX - s(100), y: midY },
        { x: midX + s(120), y: midY - g * 0.05 },
        { x: midX + s(80), y: midY - g * 0.12 },
        { x: midX - s(110), y: midY - g * 0.18 },
        { x: midX - s(70), y: midY - g * 0.24 },
        { x: midX + s(90), y: midY - g * 0.28 },
        { x: midX + s(30), y: midY - g * 0.33 },
        { x: exit.x - s(40), y: exit.y + s(25) },
        { x: exit.x + s(15), y: exit.y + s(8) },
        { x: exit.x - s(5), y: exit.y + s(2) },
        { x: exit.x, y: exit.y },
      ];
    } else if (variant === 1) {
      // Blue: hard left, far right loop, back left, tight right spiral, left hook to exit
      return [
        { x: entry.x, y: entry.y },
        { x: entry.x - s(90), y: entry.y - s(10) },
        { x: midX - s(130), y: midY + g * 0.32 },
        { x: midX - s(40), y: midY + g * 0.2 },
        { x: midX + s(140), y: midY + g * 0.1 },
        { x: midX + s(100), y: midY },
        { x: midX - s(120), y: midY - g * 0.06 },
        { x: midX - s(60), y: midY - g * 0.14 },
        { x: midX + s(130), y: midY - g * 0.18 },
        { x: midX + s(70), y: midY - g * 0.24 },
        { x: midX - s(100), y: midY - g * 0.27 },
        { x: midX - s(40), y: midY - g * 0.33 },
        { x: exit.x + s(50), y: exit.y + s(30) },
        { x: exit.x - s(20), y: exit.y + s(12) },
        { x: exit.x + s(8), y: exit.y + s(3) },
        { x: exit.x, y: exit.y },
      ];
    } else {
      // Green: right zigzag, far left, right spiral, left cross, right hook to exit
      return [
        { x: entry.x, y: entry.y },
        { x: entry.x + s(70), y: entry.y - s(15) },
        { x: midX + s(120), y: midY + g * 0.33 },
        { x: midX + s(30), y: midY + g * 0.2 },
        { x: midX - s(140), y: midY + g * 0.1 },
        { x: midX - s(80), y: midY + g * 0.02 },
        { x: midX + s(130), y: midY - g * 0.05 },
        { x: midX + s(60), y: midY - g * 0.13 },
        { x: midX - s(120), y: midY - g * 0.17 },
        { x: midX - s(50), y: midY - g * 0.23 },
        { x: midX + s(110), y: midY - g * 0.27 },
        { x: midX + s(20), y: midY - g * 0.33 },
        { x: exit.x - s(35), y: exit.y + s(22) },
        { x: exit.x + s(25), y: exit.y + s(10) },
        { x: exit.x - s(10), y: exit.y + s(3) },
        { x: exit.x, y: exit.y },
      ];
    }
  }

  addTeleporter(def: TeleporterDef): void {
    const entry = toScreen(this.scene, def.entryX, def.entryY);
    const exit = toScreen(this.scene, def.exitX, def.exitY);
    const r = scaleValue(this.scene, 14);

    const entryRect = new Phaser.Geom.Rectangle(entry.x - r, entry.y - r, r * 2, r * 2);
    this.teleporters.push({
      entryRect,
      exitX: exit.x,
      exitY: exit.y,
      exitAngle: def.exitAngle,
      cooldown: 0,
    });

    const color = def.color ?? 0x9370db;
    const g = this.graphics;

    const pipeW = scaleValue(this.scene, 5);
    const s = scaleValue(this.scene, 1);

    const bezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    };

    const drawChainedBeziers = (
      gfx: Phaser.GameObjects.Graphics,
      waypoints: { x: number; y: number }[],
      offsetXPx = 0,
    ) => {
      if (waypoints.length < 2) return;
      const segs = 30;
      gfx.beginPath();
      gfx.moveTo(waypoints[0].x + offsetXPx, waypoints[0].y);

      for (let w = 0; w < waypoints.length - 1; w += 3) {
        const p0 = waypoints[w];
        const p1 = waypoints[Math.min(w + 1, waypoints.length - 1)];
        const p2 = waypoints[Math.min(w + 2, waypoints.length - 1)];
        const p3 = waypoints[Math.min(w + 3, waypoints.length - 1)];
        for (let i = 1; i <= segs; i++) {
          const t = i / segs;
          const px = bezierPoint(t, p0.x, p1.x, p2.x, p3.x) + offsetXPx;
          const py = bezierPoint(t, p0.y, p1.y, p2.y, p3.y);
          gfx.lineTo(px, py);
        }
      }
      gfx.strokePath();
    };

    const wp = this.generateTangledPath(entry, exit, def.color ?? 0);
    const pg = this.pipeGraphics;

    pg.lineStyle(pipeW * 3, color, 0.1);
    drawChainedBeziers(pg, wp);

    pg.lineStyle(pipeW + 3 * s, 0x111111, 0.6);
    drawChainedBeziers(pg, wp);

    pg.lineStyle(pipeW + 1 * s, 0x333333, 0.5);
    drawChainedBeziers(pg, wp);

    pg.lineStyle(pipeW, color, 0.85);
    drawChainedBeziers(pg, wp);

    pg.lineStyle(pipeW * 0.3, 0xffffff, 0.2);
    drawChainedBeziers(pg, wp, -pipeW * 0.2);

    for (const pos of [entry, exit]) {
      g.fillStyle(0x000000, 0.3);
      g.fillCircle(pos.x + 1, pos.y + 1, r + 3);

      g.fillStyle(0x333333, 1);
      g.fillCircle(pos.x, pos.y, r + 3);

      g.fillStyle(color, 0.9);
      g.fillCircle(pos.x, pos.y, r);

      g.fillStyle(0x000000, 0.6);
      g.fillCircle(pos.x, pos.y, r * 0.55);

      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(pos.x - r * 0.3, pos.y - r * 0.3, r * 0.25);

      g.lineStyle(2, 0xffffff, 0.5);
      g.strokeCircle(pos.x, pos.y, r + 2);
    }
  }

  addWindmill(def: ObstacleDef): void {
    const pos = toScreen(this.scene, def.x, def.y);
    const bladeLen = scaleValue(this.scene, def.bladeLength ?? 50);
    const bladeW = scaleValue(this.scene, 10);
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
        isSensor: true,
        angle,
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
      hitCooldown: 0,
    });
    this.windmillGraphics.push(g);
  }

  addMovingBridge(def: ObstacleDef): void {
    const startPos = toScreen(this.scene, def.x + (def.width ?? 80) / 2, def.y);
    const endPos = toScreen(this.scene, def.x + (def.width ?? 80) / 2, def.targetY ?? def.y);
    const w = scaleValue(this.scene, def.width ?? 80);
    const h = scaleValue(this.scene, def.height ?? 20);

    const g = this.scene.add.graphics();
    g.setDepth(7);

    this.bridges.push({
      graphics: g,
      startY: startPos.y,
      endY: endPos.y,
      currentY: startPos.y,
      width: w,
      height: h,
      cx: startPos.x,
      speed: def.speed ?? 0.8,
      progress: 0,
      direction: -1,
    });
  }

  updateBridges(delta: number): void {
    for (const bridge of this.bridges) {
      bridge.progress += (bridge.speed * bridge.direction * delta) / 1000;

      if (bridge.progress >= 1) {
        bridge.progress = 1;
        bridge.direction = -1;
      } else if (bridge.progress <= 0) {
        bridge.progress = 0;
        bridge.direction = 1;
      }

      const t = bridge.progress;
      const eased = t * t * (3 - 2 * t);
      const cy = bridge.startY + (bridge.endY - bridge.startY) * eased;
      bridge.currentY = cy;

      const g = bridge.graphics;
      g.clear();

      const halfW = bridge.width / 2;
      const halfH = bridge.height / 2;
      const x = bridge.cx - halfW;
      const y = cy - halfH;

      // Bridge planks
      g.fillStyle(0xd2691e, 1);
      g.fillRect(x, y, bridge.width, bridge.height);

      // Plank lines
      const plankCount = 5;
      const plankW = bridge.width / plankCount;
      g.lineStyle(1, 0x8b4513, 0.6);
      for (let i = 1; i < plankCount; i++) {
        g.beginPath();
        g.moveTo(x + i * plankW, y);
        g.lineTo(x + i * plankW, y + bridge.height);
        g.strokePath();
      }

      // Top highlight
      g.fillStyle(0xdeb887, 0.4);
      g.fillRect(x, y, bridge.width, halfH * 0.4);

      // Bottom shadow
      g.fillStyle(0x000000, 0.15);
      g.fillRect(x, y + bridge.height - halfH * 0.3, bridge.width, halfH * 0.3);

      // Side rails
      const railH = scaleValue(this.scene, 3);
      g.fillStyle(0xa0522d, 1);
      g.fillRect(x, y - railH, bridge.width, railH);
      g.fillRect(x, y + bridge.height, bridge.width, railH);
    }
  }

  addTongue(def: ObstacleDef): void {
    const side = (def.forceX ?? 1) > 0 ? 'right' : 'left';
    const tongueLen = scaleValue(this.scene, def.width ?? 100);
    const tongueH = scaleValue(this.scene, def.height ?? 18);
    const wallPos = toScreen(
      this.scene,
      side === 'left' ? def.x : def.x + (def.width ?? 100),
      def.y
    );

    const body = this.scene.matter.add.rectangle(wallPos.x, wallPos.y, tongueLen, tongueH, {
      isStatic: true,
      isSensor: true,
      label: 'tongue',
    });
    this.bodies.push(body);

    const g = this.scene.add.graphics();
    g.setDepth(7);

    this.tongues.push({
      body,
      graphics: g,
      anchorX: wallPos.x,
      anchorY: wallPos.y,
      tongueLen,
      tongueH,
      side,
      speed: def.speed ?? 1.2,
      phase: def.angle ?? 0,
      hitCooldown: 0,
    });
  }

  updateTongues(delta: number, ball?: GolfBall): void {
    const time = this.scene.time.now / 1000;

    for (const t of this.tongues) {
      if (t.hitCooldown > 0) t.hitCooldown -= delta;

      const wave = (Math.sin((time * t.speed * Math.PI * 2) + t.phase) + 1) / 2;
      const extend = wave * t.tongueLen;

      const dir = t.side === 'left' ? 1 : -1;
      const cx = t.anchorX + (dir * extend) / 2;
      const cy = t.anchorY;

      this.scene.matter.body.setPosition(t.body, { x: cx, y: cy });

      const g = t.graphics;
      g.clear();

      const x = cx - extend / 2;
      const y = cy - t.tongueH / 2;
      const w = extend;
      const h = t.tongueH;

      if (w > 1) {
        // Sour candy tongue body
        const hue = ((time * 60 + t.phase * 30) % 360);
        const sourColor = Phaser.Display.Color.HSLToColor(hue / 360, 0.7, 0.55).color;
        g.fillStyle(sourColor, 0.9);
        g.fillRoundedRect(x, y, w, h, Math.min(h * 0.3, 4));

        // Sugar crystal texture
        g.fillStyle(0xffffff, 0.3);
        const crystalCount = Math.floor(w / 8);
        for (let i = 0; i < crystalCount; i++) {
          const cx2 = x + 3 + ((i * 7 + t.phase * 13) % (w - 6));
          const cy2 = y + 2 + ((i * 5 + t.phase * 7) % (h - 4));
          g.fillRect(cx2, cy2, 2, 2);
        }

        // Dark outline
        g.lineStyle(1, 0x000000, 0.3);
        g.strokeRoundedRect(x, y, w, h, Math.min(h * 0.3, 4));
      }

      // Ball collision
      if (ball && t.hitCooldown <= 0 && w > 2) {
        const bx = ball.body.position.x;
        const by = ball.body.position.y;
        const br = ball.radius;

        if (
          bx + br > x &&
          bx - br < x + w &&
          by + br > y &&
          by - br < y + h
        ) {
          const knockDir = t.side === 'left' ? 1 : -1;
          const knockForce = 5 + wave * 3;
          this.scene.matter.body.setVelocity(ball.body, {
            x: knockDir * knockForce,
            y: ball.body.velocity.y * 0.3,
          });

          const pushOut = t.side === 'left' ? x + w + br + 2 : x - br - 2;
          this.scene.matter.body.setPosition(ball.body, {
            x: pushOut,
            y: by,
          });

          t.hitCooldown = 300;
        }
      }
    }
  }

  updateWindmills(delta: number, ball?: GolfBall): void {
    for (const wm of this.windmills) {
      wm.currentAngle += (wm.speed * delta) / 1000;
      if (wm.hitCooldown > 0) wm.hitCooldown -= delta;
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

        if (ball && wm.hitCooldown <= 0) {
          const ballX = ball.body.position.x;
          const ballY = ball.body.position.y;
          const dx = ballX - wm.cx;
          const dy = ballY - wm.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < halfLen + ball.radius && dist > 0) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const perpX = -sin;
            const perpY = cos;

            const proj = dx * cos + dy * sin;
            const perpDist = Math.abs(dx * perpX + dy * perpY);
            const bladeW = scaleValue(this.scene, 10);

            if (
              Math.abs(proj) < halfLen + ball.radius &&
              perpDist < bladeW / 2 + ball.radius
            ) {
              const tangentX = -dy;
              const tangentY = dx;
              const tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY);
              const bladeSpeed = Math.min(wm.speed * dist * 0.12, 6);
              const knockForce = 4;

              const perpSign = Math.sign(dx * perpX + dy * perpY) || 1;
              const knockX = perpX * perpSign;
              const knockY = perpY * perpSign;

              const vx =
                (tangentX / tangentLen) * bladeSpeed + knockX * knockForce;
              const vy =
                (tangentY / tangentLen) * bladeSpeed + knockY * knockForce;

              this.scene.matter.body.setVelocity(ball.body, { x: vx, y: vy });

              const pushDist = bladeW + ball.radius * 2 + 4;
              this.scene.matter.body.setPosition(ball.body, {
                x: ballX + knockX * (pushDist - perpDist),
                y: ballY + knockY * (pushDist - perpDist),
              });

              wm.hitCooldown = 400;
            }
          }
        }

        const bladeW = scaleValue(this.scene, 10);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const perpX = -sin;
        const perpY = cos;

        const tipX = wm.cx + cos * halfLen;
        const tipY = wm.cy + sin * halfLen;
        const hw = bladeW / 2;

        const x0 = wm.cx + perpX * hw;
        const y0 = wm.cy + perpY * hw;
        const x1 = tipX + perpX * hw;
        const y1 = tipY + perpY * hw;
        const x2 = tipX - perpX * hw;
        const y2 = tipY - perpY * hw;
        const x3 = wm.cx - perpX * hw;
        const y3 = wm.cy - perpY * hw;

        // Blade shadow
        wm.graphics.fillStyle(0x000000, 0.15);
        wm.graphics.beginPath();
        wm.graphics.moveTo(x0 + 2, y0 + 2);
        wm.graphics.lineTo(x1 + 2, y1 + 2);
        wm.graphics.lineTo(x2 + 2, y2 + 2);
        wm.graphics.lineTo(x3 + 2, y3 + 2);
        wm.graphics.closePath();
        wm.graphics.fillPath();

        // Wafer base color
        wm.graphics.fillStyle(0xd4a44c, 1);
        wm.graphics.beginPath();
        wm.graphics.moveTo(x0, y0);
        wm.graphics.lineTo(x1, y1);
        wm.graphics.lineTo(x2, y2);
        wm.graphics.lineTo(x3, y3);
        wm.graphics.closePath();
        wm.graphics.fillPath();

        // Wafer grid lines along the blade
        const gridSpacing = scaleValue(this.scene, 12);
        const gridCount = Math.floor(halfLen / gridSpacing);
        wm.graphics.lineStyle(1, 0xc08830, 0.5);
        for (let g = 1; g <= gridCount; g++) {
          const t = (g * gridSpacing) / halfLen;
          const gx = wm.cx + cos * halfLen * t;
          const gy = wm.cy + sin * halfLen * t;
          wm.graphics.beginPath();
          wm.graphics.moveTo(gx + perpX * hw, gy + perpY * hw);
          wm.graphics.lineTo(gx - perpX * hw, gy - perpY * hw);
          wm.graphics.strokePath();
        }

        // Center line along blade length
        wm.graphics.lineStyle(1, 0xc08830, 0.3);
        wm.graphics.beginPath();
        wm.graphics.moveTo(wm.cx, wm.cy);
        wm.graphics.lineTo(tipX, tipY);
        wm.graphics.strokePath();

        // Highlight edge
        wm.graphics.lineStyle(1, 0xf0d080, 0.4);
        wm.graphics.beginPath();
        wm.graphics.moveTo(x0, y0);
        wm.graphics.lineTo(x1, y1);
        wm.graphics.strokePath();

        // Dark edge
        wm.graphics.lineStyle(1, 0x8b6914, 0.4);
        wm.graphics.beginPath();
        wm.graphics.moveTo(x3, y3);
        wm.graphics.lineTo(x2, y2);
        wm.graphics.strokePath();
      }

      // Chocolate center hub
      const hubR = scaleValue(this.scene, 10);
      wm.graphics.fillStyle(0x000000, 0.2);
      wm.graphics.fillCircle(wm.cx + 1, wm.cy + 1, hubR);
      wm.graphics.fillStyle(0x5c3317, 1);
      wm.graphics.fillCircle(wm.cx, wm.cy, hubR);
      wm.graphics.fillStyle(0x7b4a2a, 1);
      wm.graphics.fillCircle(wm.cx, wm.cy, hubR * 0.7);
      wm.graphics.fillStyle(0xffffff, 0.25);
      wm.graphics.fillCircle(wm.cx - hubR * 0.25, wm.cy - hubR * 0.25, hubR * 0.3);
    }
  }

  private isBallOnBridge(ball: GolfBall): boolean {
    const bx = ball.body.position.x;
    const by = ball.body.position.y;
    for (const bridge of this.bridges) {
      const halfW = bridge.width / 2;
      const halfH = bridge.height / 2;
      if (
        bx >= bridge.cx - halfW &&
        bx <= bridge.cx + halfW &&
        by >= bridge.currentY - halfH &&
        by <= bridge.currentY + halfH
      ) {
        return true;
      }
    }
    return false;
  }

  applyZoneEffects(ball: GolfBall): { inWater: boolean } {
    let inWater = false;
    let inSpecialZone = false;

    const bx = ball.body.position.x;
    const by = ball.body.position.y;

    const onBridge = this.isBallOnBridge(ball);

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
          if (!onBridge) {
            inWater = true;
          }
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
        const speed = Math.sqrt(vx * vx + vy * vy);

        ball.setPosition(tp.exitX, tp.exitY);

        if (tp.exitAngle !== undefined) {
          const exitSpeed = Math.max(speed, 1.5);
          this.scene.matter.body.setVelocity(ball.body, {
            x: Math.cos(tp.exitAngle) * exitSpeed,
            y: Math.sin(tp.exitAngle) * exitSpeed,
          });
        } else {
          this.scene.matter.body.setVelocity(ball.body, { x: vx, y: vy });
        }

        tp.cooldown = 30;
        return true;
      }
    }
    return false;
  }

  update(delta: number, ball: GolfBall): { inWater: boolean; teleported: boolean } {
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
    for (const b of this.bridges) {
      b.graphics.destroy();
    }
    this.bridges = [];
    for (const t of this.tongues) {
      t.graphics.destroy();
    }
    this.tongues = [];
    for (const obj of this.gameObjects) {
      obj.destroy();
    }
    this.gameObjects = [];
    this.graphics.destroy();
    this.zoneGraphics.destroy();
    this.iceOverlayGraphics.destroy();
    this.pipeGraphics.destroy();
    for (const g of this.windmillGraphics) {
      g.destroy();
    }
    this.windmillGraphics = [];
  }
}
