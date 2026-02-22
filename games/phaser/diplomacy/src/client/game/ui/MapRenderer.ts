import * as Phaser from 'phaser';
import { PROVINCES } from '../../../shared/data/provinces';
import type { GameState, Country } from '../../../shared/types/game';
import { COUNTRY_COLORS } from '../../../shared/types/game';
import {
  getProvinceCells,
  pointInPolygon,
  polygonCentroid,
  type Polygon,
  type Point,
} from './provinceGeometry';
import { BRITISH_ISLES, NORTH_AFRICA, CONTINENT, DECORATIVE_ISLANDS, SWITZERLAND } from './coastlines';

const WATER_BASE = 0x4898c8;
const LAND_NEUTRAL = 0xf0ece0;
const SELECTED_COLOR = 0xf0d020;
const SC_STAR_COLOR = 0x111111;
const LABEL_COLOR = '#1a1a1a';
const LABEL_SHADOW = '#f0ece0';
const WATER_LABEL_COLOR = '#1a3a5a';
const ISLAND_FILL = 0xf0ece0;
const ISLAND_BORDER = 0x333333;
const SWITZERLAND_FILL = 0xe8e0d0;
const SWITZERLAND_HATCH = 0x888888;

// Source coordinate space from provinceGeometry.ts
const SRC_MAP_WIDTH = 1200;
const SRC_MAP_HEIGHT = 900;

export class MapRenderer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private borderGraphics: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private onProvinceClick: ((provinceId: string) => void) | null = null;
  private onProvinceHover: ((provinceId: string, worldX: number, worldY: number) => void) | null = null;
  private onProvinceOut: (() => void) | null = null;
  private selectedProvince: string | null = null;
  private hitZones: Map<string, Phaser.GameObjects.Zone> = new Map();
  private bgSprite: Phaser.GameObjects.Image | null = null;
  private isMobile: boolean;

  private mapOffsetX = 0;
  private mapOffsetY = 0;
  private mapScale = 1;
  private mapWidth: number;
  private mapHeight: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number,
    mobile = false
  ) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.isMobile = mobile;
    this.container = scene.add.container(x, y);

    this.bgGraphics = scene.add.graphics();
    this.borderGraphics = scene.add.graphics();

    this.container.add(this.bgGraphics);
    this.container.add(this.borderGraphics);

    this.mapScale = Math.min(mapWidth / SRC_MAP_WIDTH, mapHeight / SRC_MAP_HEIGHT);
    this.mapOffsetX = (mapWidth - SRC_MAP_WIDTH * this.mapScale) / 2;
    this.mapOffsetY = (mapHeight - SRC_MAP_HEIGHT * this.mapScale) / 2;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  private toScreenX(px: number): number {
    return this.mapOffsetX + px * this.mapScale;
  }

  private toScreenY(py: number): number {
    return this.mapOffsetY + py * this.mapScale;
  }

  private toScreenPoly(poly: Polygon): Point[] {
    return poly.map((p) => ({
      x: this.toScreenX(p.x),
      y: this.toScreenY(p.y),
    }));
  }

  setProvinceClickHandler(handler: (provinceId: string) => void): void {
    this.onProvinceClick = handler;
  }

  setProvinceHoverHandler(
    onHover: (provinceId: string, worldX: number, worldY: number) => void,
    onOut: () => void
  ): void {
    this.onProvinceHover = onHover;
    this.onProvinceOut = onOut;
  }

  setSelectedProvince(provinceId: string | null): void {
    this.selectedProvince = provinceId;
  }

  render(gameState: GameState): void {
    this.bgGraphics.clear();
    this.borderGraphics.clear();
    this.clearLabels();

    this.bgGraphics.fillStyle(WATER_BASE, 1);
    this.bgGraphics.fillRect(0, 0, this.mapWidth, this.mapHeight);

    const cells = getProvinceCells();

    this.drawProvincePolygons(cells, gameState);
    this.drawDecorativeIslands();
    this.drawSwitzerland();
    this.drawBorders(cells);
    this.drawCoastlines();
    this.drawSupplyCenters(gameState);
    this.drawLabels(cells);
    this.createHitZones(cells);
  }

  // ── Polygon drawing helpers ─────────────────────────

  private fillPoly(gfx: Phaser.GameObjects.Graphics, poly: Point[]): void {
    if (poly.length < 3) return;
    gfx.beginPath();
    gfx.moveTo(poly[0]!.x, poly[0]!.y);
    for (let i = 1; i < poly.length; i++) {
      gfx.lineTo(poly[i]!.x, poly[i]!.y);
    }
    gfx.closePath();
    gfx.fillPath();
  }

  private strokePoly(gfx: Phaser.GameObjects.Graphics, poly: Point[]): void {
    if (poly.length < 3) return;
    gfx.beginPath();
    gfx.moveTo(poly[0]!.x, poly[0]!.y);
    for (let i = 1; i < poly.length; i++) {
      gfx.lineTo(poly[i]!.x, poly[i]!.y);
    }
    gfx.closePath();
    gfx.strokePath();
  }

  // ── Province Polygons ──────────────────────────────

  private drawProvincePolygons(
    cells: Map<string, Polygon>,
    gameState: GameState
  ): void {
    for (const [id, cell] of cells) {
      if (cell.length < 3) continue;
      const province = PROVINCES[id];
      if (!province) continue;

      const screenPoly = this.toScreenPoly(cell);
      const { color, alpha } = this.getProvinceColor(id, province, gameState);

      this.bgGraphics.fillStyle(color, alpha);
      this.fillPoly(this.bgGraphics, screenPoly);

      if (this.selectedProvince === id) {
        this.borderGraphics.lineStyle(3, SELECTED_COLOR, 1);
        this.strokePoly(this.borderGraphics, screenPoly);
      }
    }
  }

  private getProvinceColor(
    id: string,
    province: { type: string; supplyCenter: boolean; x: number; y: number },
    gameState: GameState
  ): { color: number; alpha: number } {
    if (province.type === 'water') {
      return { color: WATER_BASE, alpha: 1 };
    }

    const scOwner = province.supplyCenter
      ? (gameState.supplyCenters[id] as Country | undefined)
      : undefined;

    if (scOwner && COUNTRY_COLORS[scOwner]) {
      const cc = Phaser.Display.Color.HexStringToColor(COUNTRY_COLORS[scOwner]);
      return { color: (cc.red << 16) | (cc.green << 8) | cc.blue, alpha: 1 };
    }

    return { color: LAND_NEUTRAL, alpha: 1 };
  }

  // ── Decorative Islands ──────────────────────────────

  private drawDecorativeIslands(): void {
    for (const island of DECORATIVE_ISLANDS) {
      const screenPoly = this.toScreenPoly(island);

      this.bgGraphics.fillStyle(ISLAND_FILL, 1);
      this.fillPoly(this.bgGraphics, screenPoly);

      this.borderGraphics.lineStyle(1.5, ISLAND_BORDER, 0.6);
      this.strokePoly(this.borderGraphics, screenPoly);
    }
  }

  // ── Switzerland (impassable, hatched) ──────────────

  private drawSwitzerland(): void {
    const screenPoly = this.toScreenPoly(SWITZERLAND);

    this.bgGraphics.fillStyle(SWITZERLAND_FILL, 1);
    this.fillPoly(this.bgGraphics, screenPoly);

    // Diagonal hatching
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of screenPoly) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    this.borderGraphics.lineStyle(0.8, SWITZERLAND_HATCH, 0.5);
    const step = 6 * this.mapScale;
    for (let d = minX + minY; d < maxX + maxY; d += step) {
      const x1 = Math.max(minX, d - maxY);
      const y1 = d - x1;
      const x2 = Math.min(maxX, d - minY);
      const y2 = d - x2;
      if (y1 >= minY && y1 <= maxY && y2 >= minY && y2 <= maxY) {
        this.borderGraphics.beginPath();
        this.borderGraphics.moveTo(x1, y1);
        this.borderGraphics.lineTo(x2, y2);
        this.borderGraphics.strokePath();
      }
    }

    this.borderGraphics.lineStyle(2, 0x333333, 0.8);
    this.strokePoly(this.borderGraphics, screenPoly);
  }

  // ── Borders ────────────────────────────────────────

  private drawBorders(cells: Map<string, Polygon>): void {
    for (const [id, cell] of cells) {
      if (cell.length < 3) continue;
      const province = PROVINCES[id];
      if (!province) continue;

      const screenPoly = this.toScreenPoly(cell);
      if (province.type === 'water') {
        this.borderGraphics.lineStyle(0.8, 0x2a5a8a, 0.35);
      } else {
        this.borderGraphics.lineStyle(1.5, 0x000000, 1.0);
      }
      this.strokePoly(this.borderGraphics, screenPoly);
    }
  }

  // ── Coastline Outlines ─────────────────────────────

  private drawCoastlines(): void {
    const coastlines = [CONTINENT, BRITISH_ISLES, NORTH_AFRICA];
    for (const coastline of coastlines) {
      const screenPoly = this.toScreenPoly(coastline);
      this.borderGraphics.lineStyle(2.5, 0x000000, 1.0);
      this.strokePoly(this.borderGraphics, screenPoly);
    }
  }

  // ── Supply Centers (Black Stars) ──────────────────

  private drawSupplyCenters(gameState: GameState): void {
    for (const [id, province] of Object.entries(PROVINCES)) {
      if (!province.supplyCenter) continue;

      const sx = this.toScreenX(province.x);
      const sy = this.toScreenY(province.y);
      const size = Math.max(5, 7 * this.mapScale);
      const starY = sy - 12 * this.mapScale;

      // Black star with thin white outline for visibility
      this.borderGraphics.lineStyle(1.2, 0xffffff, 0.5);
      this.borderGraphics.fillStyle(SC_STAR_COLOR, 0.85);
      this.drawStar(sx, starY, size, 5);

      // Owner-colored ring around owned supply centers
      const scOwner = gameState.supplyCenters[id] as Country | undefined;
      if (scOwner && COUNTRY_COLORS[scOwner]) {
        const ownerColor = Phaser.Display.Color.HexStringToColor(COUNTRY_COLORS[scOwner]).color;
        this.borderGraphics.lineStyle(1.5, ownerColor, 0.6);
        this.borderGraphics.strokeCircle(sx, starY, size * 1.5);
      }
    }
  }

  private drawStar(cx: number, cy: number, r: number, points: number): void {
    const innerR = r * 0.4;
    this.borderGraphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? r : innerR;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) this.borderGraphics.moveTo(px, py);
      else this.borderGraphics.lineTo(px, py);
    }
    this.borderGraphics.closePath();
    this.borderGraphics.fillPath();
    this.borderGraphics.strokePath();
  }

  // ── Labels ─────────────────────────────────────────

  private drawLabels(cells: Map<string, Polygon>): void {
    for (const [id, province] of Object.entries(PROVINCES)) {
      const cell = cells.get(id);
      if (!cell || cell.length < 3) continue;

      const isWater = province.type === 'water';
      const isSC = province.supplyCenter;

      const centroid = polygonCentroid(cell);
      const sx = this.toScreenX(centroid.x);
      const sy = this.toScreenY(centroid.y);

      const yOffset = isSC ? 8 : 4;

      const baseFontSize = isWater ? 8 : isSC ? 10.5 : 9;
      const fontSize = `${Math.max(baseFontSize - 1, baseFontSize * this.mapScale)}px`;

      const labelText = this.scene.add
        .text(sx, sy + yOffset * this.mapScale, province.name, {
          fontFamily: isWater ? 'Georgia, serif' : "'Segoe UI', Arial, sans-serif",
          fontSize,
          color: isWater ? WATER_LABEL_COLOR : LABEL_COLOR,
          fontStyle: isWater ? 'italic' : isSC ? 'bold' : 'normal',
          stroke: isWater ? '#6aacdc' : LABEL_SHADOW,
          strokeThickness: isWater ? 0.8 : 2,
          letterSpacing: isWater ? 1 : 0,
        })
        .setOrigin(0.5, 0)
        .setDepth(15);

      if (isWater) {
        labelText.setAlpha(0.55);
      }

      this.container.add(labelText);
      this.labels.push(labelText);
    }
  }

  // ── Hit Zones (clickable areas) ────────────────────

  private createHitZones(cells: Map<string, Polygon>): void {
    if (this.hitZones.size > 0) return;

    for (const [id, cell] of cells) {
      if (cell.length < 3) continue;
      const screenPoly = this.toScreenPoly(cell);

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of screenPoly) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }

      const pad = this.isMobile ? 8 : 0;
      const w = maxX - minX + pad * 2;
      const h = maxY - minY + pad * 2;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      const zone = this.scene.add
        .zone(cx, cy, w, h)
        .setInteractive({ useHandCursor: true })
        .setDepth(25);

      zone.setData('polygon', screenPoly);
      zone.setData('provinceId', id);

      zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const poly = zone.getData('polygon') as Point[];
        const local = this.worldToLocal(pointer.x, pointer.y);
        if (pointInPolygon(local, poly)) {
          if (this.isMobile) {
            this.onProvinceHover?.(id, pointer.x, pointer.y);
          }
          this.onProvinceClick?.(id);
        }
      });

      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        this.onProvinceHover?.(id, pointer.x, pointer.y);
      });

      zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        this.onProvinceHover?.(id, pointer.x, pointer.y);
      });

      zone.on('pointerout', () => {
        this.onProvinceOut?.();
      });

      this.container.add(zone);
      this.hitZones.set(id, zone);
    }
  }

  private worldToLocal(wx: number, wy: number): Point {
    const sx = this.container.scaleX || 1;
    const sy = this.container.scaleY || 1;
    return {
      x: (wx - this.container.x) / sx,
      y: (wy - this.container.y) / sy,
    };
  }

  // ── Cleanup ────────────────────────────────────────

  private clearLabels(): void {
    for (const label of this.labels) {
      label.destroy();
    }
    this.labels = [];
  }

  destroy(): void {
    this.clearLabels();
    if (this.bgSprite) {
      this.bgSprite.destroy();
      this.bgSprite = null;
    }
    this.container.destroy();
  }
}
