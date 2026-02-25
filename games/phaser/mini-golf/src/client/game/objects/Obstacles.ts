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

export class Obstacles {
  scene: Phaser.Scene;
  private zones: ActiveZone[] = [];
  private teleporters: ActiveTeleporter[] = [];
  private windmills: WindmillData[] = [];
  private bridges: MovingBridgeData[] = [];
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

    if (type === 'water' && this.scene.textures.exists('taffy')) {
      const tile = this.scene.add.tileSprite(tl.x + w / 2, tl.y + h / 2, w, h, 'taffy');
      tile.setDepth(2);
      tile.setAlpha(0.85);
      this.gameObjects.push(tile);
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
        ball.setPosition(tp.exitX, tp.exitY);
        this.scene.matter.body.setVelocity(ball.body, { x: vx, y: vy });
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
