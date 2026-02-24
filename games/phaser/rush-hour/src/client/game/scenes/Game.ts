import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { PuzzleConfig, Vehicle } from '../../../shared/types/api';
import { playSnap, playWhoosh } from '../utils/sounds';
import { transitionTo, fadeIn, SCENE_COLORS } from '../utils/transitions';

const GRID_SIZE = 6;
const EXIT_ROW = 2;
const HIT_PADDING = 8;

interface VehicleSprite {
  vehicle: Vehicle;
  graphics: Phaser.GameObjects.Graphics;
  row: number;
  col: number;
}

interface MoveRecord {
  vehicleId: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

interface DragState {
  sprite: VehicleSprite;
  startPixel: { x: number; y: number };
  startGrid: { row: number; col: number };
  minCell: number;
  maxCell: number;
  pixelOffset: number;
  lastSnappedCell: number;
}

export class Game extends Scene {
  private puzzle!: PuzzleConfig;
  private isDaily = false;
  private vehicleSprites: VehicleSprite[] = [];
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private moveCount = 0;
  private startTime = 0;
  private timerText!: Phaser.GameObjects.Text;
  private moveText!: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private moveHistory: MoveRecord[] = [];
  private drag: DragState | null = null;
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;
  private won = false;

  constructor() {
    super('Game');
  }

  init(data: { puzzle: PuzzleConfig; isDaily: boolean }) {
    this.puzzle = data.puzzle;
    this.isDaily = data.isDaily;
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    fadeIn(this, SCENE_COLORS.dark);
    this.allObjects = [];
    this.vehicleSprites = [];
    this.moveCount = 0;
    this.moveHistory = [];
    this.drag = null;
    this.won = false;
    this.startTime = Date.now();

    this.buildUI();

    this.timerEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.updateTimer(),
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onPointerDown(pointer));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer));
    this.input.on('pointerup', () => this.onPointerUp());
    this.input.on('pointerupoutside', () => this.onPointerUp());
    this.input.on('gameout', () => this.onPointerUp());

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    this.vehicleSprites = [];
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const sf = this.sf;

    this.drawBackground(width, height);

    const headerH = Math.max(50, 70 * sf);
    this.drawHeader(width, headerH);

    const maxGridSize = Math.min(width * 0.9, height - headerH - 80);
    this.cellSize = Math.floor(maxGridSize / GRID_SIZE);
    const gridSize = this.cellSize * GRID_SIZE;
    this.gridOriginX = (width - gridSize) / 2;
    this.gridOriginY = headerH + (height - headerH - gridSize) / 2 - 10;

    this.drawGrid();
    this.drawExitArrow();
    this.createVehicleSprites();
    this.drawFooter(width, height);
  }

  private drawBackground(w: number, h: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1, 1, 1, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(0xe63946, 0.04);
    bg.fillEllipse(w * 0.5, h * 0.3, w * 0.6, h * 0.4);
    bg.fillStyle(0x457b9d, 0.03);
    bg.fillEllipse(w * 0.3, h * 0.7, w * 0.4, h * 0.3);
    this.allObjects.push(bg);
  }

  private drawHeader(width: number, headerH: number): void {
    const sf = this.sf;
    const pad = Math.max(10, 16 * sf);

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x0e1424, 0.5);
    headerBg.fillRect(0, 0, width, headerH);
    headerBg.lineStyle(1, 0xffffff, 0.05);
    headerBg.lineBetween(0, headerH, width, headerH);
    this.allObjects.push(headerBg);

    const back = this.add
      .text(pad, headerH / 2, '< BACK', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#e63946',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.timerEvent?.destroy();
        if (this.isDaily) {
          transitionTo(this, 'MainMenu', undefined, SCENE_COLORS.dark);
        } else {
          transitionTo(this, 'PuzzleSelect', undefined, SCENE_COLORS.dark);
        }
      });
    this.allObjects.push(back);

    const title = this.add
      .text(width / 2, headerH * 0.35, this.puzzle.name.toUpperCase(), {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.max(14, Math.round(20 * sf))}px`,
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    const diffColor: Record<string, string> = { beginner: '#2a9d8f', intermediate: '#457b9d', advanced: '#e9c46a', expert: '#e63946', grandmaster: '#8b0000' };
    const sub = this.add
      .text(width / 2, headerH * 0.65, `${this.puzzle.difficulty.toUpperCase()}  •  Min: ${this.puzzle.minMoves} moves`, {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: diffColor[this.puzzle.difficulty] ?? '#8899aa',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(sub);

    this.moveText = this.add
      .text(width - pad, headerH * 0.35, `Moves: ${this.moveCount}`, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#ffffff',
        align: 'right',
      })
      .setOrigin(1, 0.5);
    this.allObjects.push(this.moveText);

    this.timerText = this.add
      .text(width - pad, headerH * 0.65, '0:00', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
        color: '#8899aa',
        align: 'right',
      })
      .setOrigin(1, 0.5);
    this.allObjects.push(this.timerText);
  }

  private drawGrid(): void {
    const g = this.add.graphics();
    const { gridOriginX: ox, gridOriginY: oy, cellSize: cs } = this;
    const gridSize = cs * GRID_SIZE;

    g.fillStyle(0x000000, 0.15);
    g.fillRoundedRect(ox - 2, oy + 4, gridSize + 4, gridSize + 4, 10);

    g.fillStyle(0x1a1a2e, 1);
    g.fillRoundedRect(ox - 4, oy - 4, gridSize + 8, gridSize + 8, 8);
    g.lineStyle(1, 0x2a3a4a, 0.3);
    g.strokeRoundedRect(ox - 4, oy - 4, gridSize + 8, gridSize + 8, 8);

    g.lineStyle(1, 0x2a3a4a, 0.4);
    for (let r = 0; r <= GRID_SIZE; r++) {
      g.lineBetween(ox, oy + r * cs, ox + gridSize, oy + r * cs);
    }
    for (let c = 0; c <= GRID_SIZE; c++) {
      g.lineBetween(ox + c * cs, oy, ox + c * cs, oy + gridSize);
    }

    this.allObjects.push(g);
  }

  private drawExitArrow(): void {
    const { gridOriginX: ox, gridOriginY: oy, cellSize: cs } = this;
    const gridSize = cs * GRID_SIZE;

    const exitG = this.add.graphics();
    exitG.fillStyle(0xe63946, 0.3);
    exitG.fillTriangle(
      ox + gridSize + 8, oy + EXIT_ROW * cs + cs * 0.2,
      ox + gridSize + 8, oy + EXIT_ROW * cs + cs * 0.8,
      ox + gridSize + 24, oy + EXIT_ROW * cs + cs * 0.5
    );
    this.allObjects.push(exitG);
  }

  private createVehicleSprites(): void {
    for (const vehicle of this.puzzle.vehicles) {
      const sprite = this.drawVehicle(vehicle, vehicle.row, vehicle.col);
      this.vehicleSprites.push(sprite);
    }
  }

  private drawVehicle(vehicle: Vehicle, row: number, col: number): VehicleSprite {
    const { gridOriginX: ox, gridOriginY: oy, cellSize: cs } = this;
    const len = vehicle.type === 'truck' ? 3 : 2;
    const pad = 3;

    const w = vehicle.orientation === 'h' ? cs * len - pad * 2 : cs - pad * 2;
    const h = vehicle.orientation === 'v' ? cs * len - pad * 2 : cs - pad * 2;
    const x = ox + col * cs + pad;
    const y = oy + row * cs + pad;

    const g = this.add.graphics();

    const color = Phaser.Display.Color.HexStringToColor(vehicle.color).color;
    g.fillStyle(color, 0.9);
    g.fillRoundedRect(x, y, w, h, 6);

    if (vehicle.isTarget) {
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeRoundedRect(x, y, w, h, 6);

      const arrowX = x + w * 0.7;
      const arrowY = y + h / 2;
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(
        arrowX, arrowY - 6,
        arrowX, arrowY + 6,
        arrowX + 8, arrowY
      );
    } else {
      g.lineStyle(1, 0xffffff, 0.15);
      g.strokeRoundedRect(x, y, w, h, 6);
    }

    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(x + 2, y + 2, w - 4, h / 3, 4);

    this.allObjects.push(g);

    return { vehicle, graphics: g, row, col };
  }

  private drawVehicleAtPixel(vehicle: Vehicle, px: number, py: number, isDragging: boolean): Phaser.GameObjects.Graphics {
    const { cellSize: cs } = this;
    const len = vehicle.type === 'truck' ? 3 : 2;
    const pad = 3;

    const w = vehicle.orientation === 'h' ? cs * len - pad * 2 : cs - pad * 2;
    const h = vehicle.orientation === 'v' ? cs * len - pad * 2 : cs - pad * 2;
    const x = px + pad;
    const y = py + pad;

    const g = this.add.graphics();

    if (isDragging) {
      g.fillStyle(0x000000, 0.25);
      g.fillRoundedRect(x + 3, y + 3, w, h, 6);
    }

    const color = Phaser.Display.Color.HexStringToColor(vehicle.color).color;
    g.fillStyle(color, isDragging ? 1.0 : 0.9);
    g.fillRoundedRect(x, y, w, h, 6);

    if (vehicle.isTarget) {
      g.lineStyle(2, 0xffffff, isDragging ? 0.5 : 0.3);
      g.strokeRoundedRect(x, y, w, h, 6);

      const arrowX = x + w * 0.7;
      const arrowY = y + h / 2;
      g.fillStyle(0xffffff, 0.5);
      g.fillTriangle(
        arrowX, arrowY - 6,
        arrowX, arrowY + 6,
        arrowX + 8, arrowY
      );
    } else {
      g.lineStyle(1, 0xffffff, isDragging ? 0.25 : 0.15);
      g.strokeRoundedRect(x, y, w, h, 6);
    }

    g.fillStyle(0xffffff, 0.08);
    g.fillRoundedRect(x + 2, y + 2, w - 4, h / 3, 4);

    this.allObjects.push(g);
    return g;
  }

  private drawFooter(width: number, height: number): void {
    const sf = this.sf;
    const btnY = height - Math.max(35, 50 * sf);
    const btnH = Math.max(28, 36 * sf);
    const btnW = Math.max(70, 90 * sf);
    const gap = Math.max(10, 16 * sf);

    const buttons = [
      { label: 'UNDO', action: () => this.undo(), color: 0x457b9d },
      { label: 'RESET', action: () => this.resetPuzzle(), color: 0xe63946 },
    ];

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]!;
      const x = width / 2 + (i - (buttons.length - 1) / 2) * (btnW + gap);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a2a3e, 0.7);
      bg.fillRoundedRect(x - btnW / 2, btnY, btnW, btnH, 8);
      bg.lineStyle(1, 0xffffff, 0.08);
      bg.strokeRoundedRect(x - btnW / 2, btnY, btnW, btnH, 8);

      const accentBar = this.add.graphics();
      accentBar.fillStyle(btn.color, 0.8);
      accentBar.fillRect(x - btnW / 2, btnY + btnH - 3, btnW, 3);
      this.allObjects.push(bg, accentBar);

      const label = this.add
        .text(x, btnY + btnH / 2 - 1, btn.label, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
          color: '#e0e8f0',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(label);

      const hit = this.add
        .rectangle(x, btnY + btnH / 2, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hit.on('pointerdown', btn.action);
      this.allObjects.push(hit);
    }
  }

  private updateTimer(): void {
    if (this.won) return;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.timerText.setText(`${mins}:${String(secs).padStart(2, '0')}`);
  }

  private getGridExcluding(excludeId: string): boolean[][] {
    const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => false)
    );
    for (const vs of this.vehicleSprites) {
      if (vs.vehicle.id === excludeId) continue;
      const len = vs.vehicle.type === 'truck' ? 3 : 2;
      for (let j = 0; j < len; j++) {
        const r = vs.vehicle.orientation === 'v' ? vs.row + j : vs.row;
        const c = vs.vehicle.orientation === 'h' ? vs.col + j : vs.col;
        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
          grid[r]![c] = true;
        }
      }
    }
    return grid;
  }

  private computeDragRange(vs: VehicleSprite): { min: number; max: number } {
    const grid = this.getGridExcluding(vs.vehicle.id);
    const len = vs.vehicle.type === 'truck' ? 3 : 2;
    const isH = vs.vehicle.orientation === 'h';
    const fixedAxis = isH ? vs.row : vs.col;
    const currentCell = isH ? vs.col : vs.row;

    let minCell = 0;
    for (let i = currentCell - 1; i >= 0; i--) {
      const occupied = isH ? grid[fixedAxis]![i] : grid[i]![fixedAxis];
      if (occupied) {
        minCell = i + 1;
        break;
      }
    }

    const boardMax = GRID_SIZE - len;
    let maxCell = boardMax;
    for (let i = currentCell + len; i < GRID_SIZE; i++) {
      const occupied = isH ? grid[fixedAxis]![i] : grid[i]![fixedAxis];
      if (occupied) {
        maxCell = i - len;
        break;
      }
    }

    if (vs.vehicle.isTarget && isH && fixedAxis === EXIT_ROW && maxCell >= boardMax) {
      maxCell = GRID_SIZE;
    }

    return { min: minCell, max: maxCell };
  }

  private findVehicleAt(px: number, py: number): VehicleSprite | null {
    const { gridOriginX: ox, gridOriginY: oy, cellSize: cs } = this;

    for (const vs of this.vehicleSprites) {
      const len = vs.vehicle.type === 'truck' ? 3 : 2;
      const vx = ox + vs.col * cs;
      const vy = oy + vs.row * cs;
      const vw = vs.vehicle.orientation === 'h' ? cs * len : cs;
      const vh = vs.vehicle.orientation === 'v' ? cs * len : cs;

      if (
        px >= vx - HIT_PADDING &&
        px <= vx + vw + HIT_PADDING &&
        py >= vy - HIT_PADDING &&
        py <= vy + vh + HIT_PADDING
      ) {
        return vs;
      }
    }
    return null;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.won) return;

    const vs = this.findVehicleAt(pointer.x, pointer.y);
    if (!vs) return;

    const range = this.computeDragRange(vs);
    const currentCell = vs.vehicle.orientation === 'h' ? vs.col : vs.row;

    const pixelOffset = vs.vehicle.orientation === 'h'
      ? pointer.x - (this.gridOriginX + vs.col * this.cellSize)
      : pointer.y - (this.gridOriginY + vs.row * this.cellSize);

    this.drag = {
      sprite: vs,
      startPixel: { x: pointer.x, y: pointer.y },
      startGrid: { row: vs.row, col: vs.col },
      minCell: range.min,
      maxCell: range.max,
      pixelOffset,
      lastSnappedCell: currentCell,
    };
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.drag || this.won) return;

    const { sprite: vs, minCell, maxCell, pixelOffset } = this.drag;
    const isH = vs.vehicle.orientation === 'h';

    let vehiclePixel: number;
    if (isH) {
      vehiclePixel = pointer.x - pixelOffset;
    } else {
      vehiclePixel = pointer.y - pixelOffset;
    }

    const origin = isH ? this.gridOriginX : this.gridOriginY;
    const minPixel = origin + minCell * this.cellSize;
    const maxPixel = origin + maxCell * this.cellSize;
    vehiclePixel = Math.max(minPixel, Math.min(maxPixel, vehiclePixel));

    const fracCell = (vehiclePixel - origin) / this.cellSize;
    const nearestCell = Math.round(fracCell);
    if (nearestCell !== this.drag.lastSnappedCell) {
      this.drag.lastSnappedCell = nearestCell;
      playSnap();
    }

    vs.graphics.destroy();
    const idx = this.allObjects.indexOf(vs.graphics);

    const px = isH ? vehiclePixel : this.gridOriginX + vs.col * this.cellSize;
    const py = isH ? this.gridOriginY + vs.row * this.cellSize : vehiclePixel;

    const newG = this.drawVehicleAtPixel(vs.vehicle, px, py, true);
    vs.graphics = newG;
    if (idx >= 0) {
      this.allObjects[idx] = newG;
    }

    if (isH) {
      (this.drag as DragState & { _fracCol?: number })._fracCol = fracCell;
    } else {
      (this.drag as DragState & { _fracRow?: number })._fracRow = fracCell;
    }
  }

  private onPointerUp(): void {
    if (!this.drag || this.won) return;

    const { sprite: vs, startGrid, minCell, maxCell } = this.drag;
    const isH = vs.vehicle.orientation === 'h';

    const fracCol = (this.drag as DragState & { _fracCol?: number })._fracCol;
    const fracRow = (this.drag as DragState & { _fracRow?: number })._fracRow;

    let snappedCell: number;
    if (isH && fracCol !== undefined) {
      snappedCell = Math.round(fracCol);
    } else if (!isH && fracRow !== undefined) {
      snappedCell = Math.round(fracRow);
    } else {
      snappedCell = isH ? vs.col : vs.row;
    }

    snappedCell = Math.max(minCell, Math.min(maxCell, snappedCell));

    const boardMax = GRID_SIZE - (vs.vehicle.type === 'truck' ? 3 : 2);
    if (vs.vehicle.isTarget && isH && snappedCell > boardMax) {
      vs.col = boardMax;
      this.moveCount++;
      this.moveText.setText(`Moves: ${this.moveCount}`);
      this.moveHistory.push({
        vehicleId: vs.vehicle.id,
        fromRow: startGrid.row,
        fromCol: startGrid.col,
        toRow: vs.row,
        toCol: vs.col,
      });
      this.redrawVehicle(vs);
      this.drag = null;
      this.animateExit(vs);
      return;
    }

    if (isH) {
      vs.col = snappedCell;
    } else {
      vs.row = snappedCell;
    }

    const moved = vs.row !== startGrid.row || vs.col !== startGrid.col;

    if (moved) {
      this.moveCount++;
      this.moveText.setText(`Moves: ${this.moveCount}`);
      this.moveHistory.push({
        vehicleId: vs.vehicle.id,
        fromRow: startGrid.row,
        fromCol: startGrid.col,
        toRow: vs.row,
        toCol: vs.col,
      });
      playSnap();
    }

    this.redrawVehicle(vs);
    this.drag = null;
  }

  private animateExit(vs: VehicleSprite): void {
    this.won = true;
    this.timerEvent?.destroy();
    playWhoosh();

    const gridRight = this.gridOriginX + GRID_SIZE * this.cellSize;
    const exitTarget = gridRight + this.cellSize * 2;
    const startX = this.gridOriginX + vs.col * this.cellSize;
    const duration = 400;
    const startTime = Date.now();

    const exitLoop = () => {
      const t = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const currentX = startX + (exitTarget - startX) * eased;

      vs.graphics.destroy();
      const idx = this.allObjects.indexOf(vs.graphics);
      const py = this.gridOriginY + vs.row * this.cellSize;
      const newG = this.drawVehicleAtPixel(vs.vehicle, currentX, py, false);
      vs.graphics = newG;
      if (idx >= 0) {
        this.allObjects[idx] = newG;
      }

      if (t < 1) {
        requestAnimationFrame(exitLoop);
      } else {
        this.onWin();
      }
    };

    exitLoop();
  }

  private redrawVehicle(vs: VehicleSprite): void {
    vs.graphics.destroy();
    const idx = this.allObjects.indexOf(vs.graphics);
    const newSprite = this.drawVehicle(vs.vehicle, vs.row, vs.col);
    vs.graphics = newSprite.graphics;
    if (idx >= 0) {
      this.allObjects[idx] = newSprite.graphics;
    }
  }

  private undo(): void {
    if (this.moveHistory.length === 0 || this.won) return;

    const lastMove = this.moveHistory.pop()!;
    const vs = this.vehicleSprites.find((s) => s.vehicle.id === lastMove.vehicleId);
    if (!vs) return;

    vs.row = lastMove.fromRow;
    vs.col = lastMove.fromCol;
    this.redrawVehicle(vs);

    this.moveCount--;
    this.moveText.setText(`Moves: ${this.moveCount}`);
  }

  private resetPuzzle(): void {
    if (this.won) return;

    for (const vs of this.vehicleSprites) {
      vs.row = vs.vehicle.row;
      vs.col = vs.vehicle.col;
      this.redrawVehicle(vs);
    }

    this.moveCount = 0;
    this.moveHistory = [];
    this.moveText.setText(`Moves: ${this.moveCount}`);
    this.startTime = Date.now();
  }

  private onWin(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    let stars = 1;
    if (this.moveCount <= this.puzzle.minMoves) {
      stars = 3;
    } else if (this.moveCount <= this.puzzle.minMoves * 1.5) {
      stars = 2;
    }

    void this.submitResult(elapsed, stars);

    this.time.delayedCall(400, () => {
      transitionTo(
        this,
        'PuzzleComplete',
        { puzzle: this.puzzle, moves: this.moveCount, time: elapsed, stars, isDaily: this.isDaily },
        SCENE_COLORS.teal,
        400
      );
    });
  }

  private async submitResult(elapsed: number, stars: number): Promise<void> {
    try {
      await fetch('/api/stats/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId: this.puzzle.id,
          moves: this.moveCount,
          timeSeconds: Math.round(elapsed),
          stars,
          isDaily: this.isDaily,
        }),
      });
    } catch (err) {
      console.error('Failed to submit result:', err);
    }
  }
}
