import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { Vehicle, VehicleType, Orientation } from '../../../shared/types/api';
import { VEHICLE_COLORS } from '../data/puzzles';
import { solve, validatePuzzle } from '../utils/solver';
import { drawSceneBackground, updateSceneBlocks, type SceneBg } from '../utils/sceneBackground';
import { transitionTo, fadeIn, SCENE_COLORS } from '../utils/transitions';

const GRID_SIZE = 6;
const EXIT_ROW = 2;

export class PuzzleEditor extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private vehicles: Vehicle[] = [];
  private selectedType: VehicleType = 'car';
  private selectedOrientation: Orientation = 'h';
  private gridOriginX = 0;
  private gridOriginY = 0;
  private cellSize = 0;
  private nextId = 1;
  private statusText!: Phaser.GameObjects.Text;
  private sceneBg: SceneBg | null = null;
  private elapsed = 0;

  constructor() {
    super('PuzzleEditor');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    fadeIn(this, SCENE_COLORS.purple);
    this.allObjects = [];
    this.vehicles = [];
    this.nextId = 1;
    this.elapsed = 0;
    this.buildUI();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
    if (this.sceneBg) updateSceneBlocks(this.sceneBg.blocks, this.elapsed);
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    if (this.sceneBg) {
      for (const obj of this.sceneBg.objects) obj.destroy();
      this.sceneBg = null;
    }
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = this.sf;

    this.sceneBg = drawSceneBackground(this, width, height);

    const back = this.add
      .text(Math.max(10, 20 * sf), Math.max(10, 20 * sf), '< BACK', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#e63946',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        transitionTo(this, 'MainMenu', undefined, SCENE_COLORS.dark);
      });
    this.allObjects.push(back);

    const titleY = Math.max(20, 30 * sf);
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0x6a4c93, 0.2);
    titleGlow.fillEllipse(cx, titleY, 240 * sf, 50 * sf);
    this.allObjects.push(titleGlow);

    const title = this.add
      .text(cx, titleY, 'PUZZLE EDITOR', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.max(18, Math.round(28 * sf))}px`,
        color: '#b08fd8',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#6a4c93', blur: 16, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    const headerH = Math.max(50, 60 * sf);
    const maxGridSize = Math.min(width * 0.85, height - headerH - 200);
    this.cellSize = Math.floor(maxGridSize / GRID_SIZE);
    const gridSize = this.cellSize * GRID_SIZE;
    this.gridOriginX = (width - gridSize) / 2;
    this.gridOriginY = headerH + 10;

    this.drawGrid();
    this.drawExitArrow();
    this.drawVehicles();
    this.drawToolbar(width, height);

    this.statusText = this.add
      .text(cx, this.gridOriginY + gridSize + Math.max(12, 18 * sf), 'Tap grid to place vehicles. Tap a vehicle to remove it.', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: '#8899aa',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(this.statusText);
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

    const hitArea = this.add
      .rectangle(ox + gridSize / 2, oy + gridSize / 2, gridSize, gridSize)
      .setInteractive()
      .setAlpha(0.001);
    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onGridClick(pointer));
    this.allObjects.push(g, hitArea);
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

  private drawVehicles(): void {
    const { gridOriginX: ox, gridOriginY: oy, cellSize: cs } = this;

    for (const vehicle of this.vehicles) {
      const len = vehicle.type === 'truck' ? 3 : 2;
      const pad = 3;
      const w = vehicle.orientation === 'h' ? cs * len - pad * 2 : cs - pad * 2;
      const h = vehicle.orientation === 'v' ? cs * len - pad * 2 : cs - pad * 2;
      const x = ox + vehicle.col * cs + pad;
      const y = oy + vehicle.row * cs + pad;

      const g = this.add.graphics();
      const color = Phaser.Display.Color.HexStringToColor(vehicle.color).color;
      g.fillStyle(color, 0.9);
      g.fillRoundedRect(x, y, w, h, 6);

      if (vehicle.isTarget) {
        g.lineStyle(2, 0xffffff, 0.3);
        g.strokeRoundedRect(x, y, w, h, 6);
      } else {
        g.lineStyle(1, 0xffffff, 0.15);
        g.strokeRoundedRect(x, y, w, h, 6);
      }

      g.fillStyle(0xffffff, 0.08);
      g.fillRoundedRect(x + 2, y + 2, w - 4, h / 3, 4);

      this.allObjects.push(g);
    }
  }

  private drawToolbar(width: number, height: number): void {
    const sf = this.sf;
    const toolbarY = height - Math.max(100, 130 * sf);
    const cx = width / 2;
    const btnH = Math.max(28, 34 * sf);
    const btnW = Math.max(60, 80 * sf);
    const gap = Math.max(6, 10 * sf);

    const toolbarBg = this.add.graphics();
    toolbarBg.fillStyle(0x0e1424, 0.4);
    toolbarBg.fillRoundedRect(cx - width * 0.42, toolbarY - btnH - 8, width * 0.84, height - toolbarY + btnH + 16, 10);
    toolbarBg.lineStyle(1, 0xffffff, 0.04);
    toolbarBg.strokeRoundedRect(cx - width * 0.42, toolbarY - btnH - 8, width * 0.84, height - toolbarY + btnH + 16, 10);
    this.allObjects.push(toolbarBg);

    const typeLabel = this.add
      .text(cx - 120, toolbarY, 'Type:', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(12 * sf))}px`,
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);
    this.allObjects.push(typeLabel);

    const types: { label: string; value: VehicleType }[] = [
      { label: 'CAR', value: 'car' },
      { label: 'TRUCK', value: 'truck' },
    ];

    for (let i = 0; i < types.length; i++) {
      const t = types[i]!;
      const x = cx - 50 + i * (btnW + gap);
      const isSelected = t.value === this.selectedType;

      const bg = this.add.graphics();
      if (isSelected) {
        bg.fillStyle(0x6a4c93, 0.8);
        bg.fillRoundedRect(x, toolbarY - btnH / 2, btnW, btnH, 6);
        bg.lineStyle(1, 0xffffff, 0.12);
        bg.strokeRoundedRect(x, toolbarY - btnH / 2, btnW, btnH, 6);
      } else {
        bg.fillStyle(0x1a2a3e, 0.6);
        bg.fillRoundedRect(x, toolbarY - btnH / 2, btnW, btnH, 6);
        bg.lineStyle(1, 0xffffff, 0.06);
        bg.strokeRoundedRect(x, toolbarY - btnH / 2, btnW, btnH, 6);
      }
      this.allObjects.push(bg);

      const label = this.add
        .text(x + btnW / 2, toolbarY, t.label, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(9, Math.round(11 * sf))}px`,
          color: isSelected ? '#ffffff' : '#8899aa',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(label);

      const hit = this.add
        .rectangle(x + btnW / 2, toolbarY, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hit.on('pointerdown', () => {
        this.selectedType = t.value;
        this.destroyAll();
        this.buildUI();
      });
      this.allObjects.push(hit);
    }

    const orientY = toolbarY + btnH + gap;
    const orientLabel = this.add
      .text(cx - 120, orientY, 'Direction:', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(12 * sf))}px`,
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);
    this.allObjects.push(orientLabel);

    const orients: { label: string; value: Orientation }[] = [
      { label: 'HORIZ', value: 'h' },
      { label: 'VERT', value: 'v' },
    ];

    for (let i = 0; i < orients.length; i++) {
      const o = orients[i]!;
      const x = cx - 50 + i * (btnW + gap);
      const isSelected = o.value === this.selectedOrientation;

      const bg = this.add.graphics();
      if (isSelected) {
        bg.fillStyle(0x6a4c93, 0.8);
        bg.fillRoundedRect(x, orientY - btnH / 2, btnW, btnH, 6);
        bg.lineStyle(1, 0xffffff, 0.12);
        bg.strokeRoundedRect(x, orientY - btnH / 2, btnW, btnH, 6);
      } else {
        bg.fillStyle(0x1a2a3e, 0.6);
        bg.fillRoundedRect(x, orientY - btnH / 2, btnW, btnH, 6);
        bg.lineStyle(1, 0xffffff, 0.06);
        bg.strokeRoundedRect(x, orientY - btnH / 2, btnW, btnH, 6);
      }
      this.allObjects.push(bg);

      const label = this.add
        .text(x + btnW / 2, orientY, o.label, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(9, Math.round(11 * sf))}px`,
          color: isSelected ? '#ffffff' : '#8899aa',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(label);

      const hit = this.add
        .rectangle(x + btnW / 2, orientY, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hit.on('pointerdown', () => {
        this.selectedOrientation = o.value;
        this.destroyAll();
        this.buildUI();
      });
      this.allObjects.push(hit);
    }

    const actionY = orientY + btnH + gap * 2;
    const actionBtnW = Math.max(80, 100 * sf);
    const accentW = 4;
    const actions = [
      { label: 'CLEAR', color: 0xe63946, action: () => this.clearAll() },
      { label: 'VALIDATE', color: 0x2a9d8f, action: () => this.validateAndSolve() },
      { label: 'PLAY', color: 0x457b9d, action: () => this.playPuzzle() },
    ];

    for (let i = 0; i < actions.length; i++) {
      const a = actions[i]!;
      const x = cx + (i - 1) * (actionBtnW + gap);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a2a3e, 0.7);
      bg.fillRoundedRect(x - actionBtnW / 2, actionY, actionBtnW, btnH, 8);
      bg.lineStyle(1, 0xffffff, 0.08);
      bg.strokeRoundedRect(x - actionBtnW / 2, actionY, actionBtnW, btnH, 8);
      this.allObjects.push(bg);

      const accent = this.add.graphics();
      accent.fillStyle(a.color, 0.9);
      accent.fillRoundedRect(x - actionBtnW / 2, actionY, accentW, btnH, { tl: 8, bl: 8, tr: 0, br: 0 });
      this.allObjects.push(accent);

      const label = this.add
        .text(x, actionY + btnH / 2, a.label, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(10, Math.round(12 * sf))}px`,
          color: '#e0e8f0',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(label);

      const hit = this.add
        .rectangle(x, actionY + btnH / 2, actionBtnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hit.on('pointerdown', a.action);
      this.allObjects.push(hit);
    }
  }

  private onGridClick(pointer: Phaser.Input.Pointer): void {
    const col = Math.floor((pointer.x - this.gridOriginX) / this.cellSize);
    const row = Math.floor((pointer.y - this.gridOriginY) / this.cellSize);

    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return;

    const existing = this.findVehicleAt(row, col);
    if (existing) {
      this.vehicles = this.vehicles.filter((v) => v.id !== existing.id);
      this.destroyAll();
      this.buildUI();
      return;
    }

    const len = this.selectedType === 'truck' ? 3 : 2;
    if (this.selectedOrientation === 'h' && col + len > GRID_SIZE) return;
    if (this.selectedOrientation === 'v' && row + len > GRID_SIZE) return;

    for (let j = 0; j < len; j++) {
      const r = this.selectedOrientation === 'v' ? row + j : row;
      const c = this.selectedOrientation === 'h' ? col + j : col;
      if (this.findVehicleAt(r, c)) return;
    }

    const hasTarget = this.vehicles.some((v) => v.isTarget);
    const isTarget = !hasTarget && this.selectedOrientation === 'h' && row === EXIT_ROW && this.selectedType === 'car';

    const colorIdx = isTarget ? 0 : ((this.nextId % (VEHICLE_COLORS.length - 1)) + 1);
    const vehicle: Vehicle = {
      id: isTarget ? 'X' : String.fromCharCode(64 + this.nextId),
      type: this.selectedType,
      orientation: this.selectedOrientation,
      row,
      col,
      color: VEHICLE_COLORS[colorIdx]!,
      isTarget,
    };

    this.vehicles.push(vehicle);
    if (!isTarget) this.nextId++;

    this.destroyAll();
    this.buildUI();
  }

  private findVehicleAt(row: number, col: number): Vehicle | null {
    for (const v of this.vehicles) {
      const len = v.type === 'truck' ? 3 : 2;
      for (let j = 0; j < len; j++) {
        const r = v.orientation === 'v' ? v.row + j : v.row;
        const c = v.orientation === 'h' ? v.col + j : v.col;
        if (r === row && c === col) return v;
      }
    }
    return null;
  }

  private clearAll(): void {
    this.vehicles = [];
    this.nextId = 1;
    this.destroyAll();
    this.buildUI();
  }

  private validateAndSolve(): void {
    const validation = validatePuzzle(this.vehicles);
    if (!validation.valid) {
      this.statusText.setText(`Error: ${validation.error}`);
      this.statusText.setColor('#e63946');
      return;
    }

    const result = solve(this.vehicles, 100);
    if (!result.solvable) {
      this.statusText.setText('Puzzle is not solvable! Rearrange vehicles.');
      this.statusText.setColor('#e63946');
    } else {
      this.statusText.setText(`Valid! Minimum ${result.minMoves} moves to solve.`);
      this.statusText.setColor('#2a9d8f');
    }
  }

  private playPuzzle(): void {
    const validation = validatePuzzle(this.vehicles);
    if (!validation.valid) {
      this.statusText.setText(`Error: ${validation.error}`);
      this.statusText.setColor('#e63946');
      return;
    }

    const result = solve(this.vehicles, 100);
    if (!result.solvable) {
      this.statusText.setText('Cannot play: puzzle is not solvable!');
      this.statusText.setColor('#e63946');
      return;
    }

    const puzzle = {
      id: `custom-${Date.now()}`,
      name: 'Custom Puzzle',
      difficulty: 'intermediate' as const,
      vehicles: this.vehicles.map((v) => ({ ...v })),
      minMoves: result.minMoves,
    };

    void this.savePuzzle(puzzle);

    transitionTo(this, 'Game', { puzzle, isDaily: false }, SCENE_COLORS.dark);
  }

  private async savePuzzle(puzzle: { id: string; name: string; vehicles: Vehicle[]; minMoves: number }): Promise<void> {
    try {
      await fetch('/api/user-puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: puzzle.name,
          vehicles: puzzle.vehicles,
          minMoves: puzzle.minMoves,
        }),
      });
    } catch (err) {
      console.error('Failed to save puzzle:', err);
    }
  }
}
