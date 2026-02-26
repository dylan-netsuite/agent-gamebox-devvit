import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { Meerca } from '../objects/Meerca';
import { Negg } from '../objects/Negg';
import {
  GRID_COLS,
  GRID_ROWS,
  type Direction,
  oppositeDir,
  samePos,
} from '../utils/grid';

interface GameData {
  difficulty: 'classic' | 'hard';
}

const BASE_TICK_CLASSIC = 180;
const BASE_TICK_HARD = 130;
const MIN_TICK = 70;
const SPEED_INCREASE_INTERVAL = 50;
const TICK_DECREASE = 8;

export class Game extends Scene {
  private meerca!: Meerca;
  private neggs: Negg[] = [];
  private score = 0;
  private neggsCaught = 0;
  private difficulty: 'classic' | 'hard' = 'classic';
  private tickMs = BASE_TICK_CLASSIC;
  private tickTimer = 0;
  private gameOver = false;
  private cellSize = 0;
  private offsetX = 0;
  private offsetY = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private inputQueue: Direction[] = [];
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeActive = false;
  private graceTimer = 0;
  private readonly GRACE_PERIOD = 600;

  constructor() {
    super('Game');
  }

  init(data: GameData) {
    this.difficulty = data.difficulty ?? 'classic';
    this.score = 0;
    this.neggsCaught = 0;
    this.gameOver = false;
    this.tickTimer = 0;
    this.graceTimer = 0;
    this.tickMs = this.difficulty === 'hard' ? BASE_TICK_HARD : BASE_TICK_CLASSIC;
    this.inputQueue = [];
    this.neggs = [];
    this.swipeActive = false;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(0x1a0a2e);

    this.calculateGrid(width, height);

    this.drawGrid(width, height);

    const startCol = Math.floor(GRID_COLS / 2);
    const startRow = Math.floor(GRID_ROWS / 2);
    this.meerca = new Meerca(this, startCol, startRow, this.cellSize, this.offsetX, this.offsetY);

    this.spawnNegg();
    if (this.difficulty === 'hard') {
      this.spawnNegg();
    }

    this.scoreText = this.add
      .text(width / 2, 12, 'Score: 0', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.max(14, Math.round(width * 0.03))}px`,
        color: '#ffd700',
        stroke: '#1a0a2e',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.setupInput();
  }

  private calculateGrid(width: number, height: number): void {
    const headerSpace = 40;
    const availableH = height - headerSpace;
    const cellW = Math.floor(width / GRID_COLS);
    const cellH = Math.floor(availableH / GRID_ROWS);
    this.cellSize = Math.min(cellW, cellH);
    this.offsetX = Math.floor((width - this.cellSize * GRID_COLS) / 2);
    this.offsetY = headerSpace + Math.floor((availableH - this.cellSize * GRID_ROWS) / 2);
  }

  private drawGrid(width: number, height: number): void {
    const bg = this.add.tileSprite(width / 2, height / 2, width, height, 'grid-bg');
    bg.setDepth(0);

    const border = this.add.graphics();
    border.lineStyle(2, 0x6b5b8a, 0.6);
    border.strokeRect(
      this.offsetX,
      this.offsetY,
      this.cellSize * GRID_COLS,
      this.cellSize * GRID_ROWS
    );
    border.setDepth(1);

    const gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0x2a1a4e, 0.3);
    for (let c = 1; c < GRID_COLS; c++) {
      const x = this.offsetX + c * this.cellSize;
      gridLines.lineBetween(x, this.offsetY, x, this.offsetY + GRID_ROWS * this.cellSize);
    }
    for (let r = 1; r < GRID_ROWS; r++) {
      const y = this.offsetY + r * this.cellSize;
      gridLines.lineBetween(this.offsetX, y, this.offsetX + GRID_COLS * this.cellSize, y);
    }
    gridLines.setDepth(1);
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    const cursors = this.input.keyboard.createCursorKeys();

    cursors.up.on('down', () => this.queueDirection('up'));
    cursors.down.on('down', () => this.queueDirection('down'));
    cursors.left.on('down', () => this.queueDirection('left'));
    cursors.right.on('down', () => this.queueDirection('right'));

    this.input.keyboard.on('keydown-W', () => this.queueDirection('up'));
    this.input.keyboard.on('keydown-S', () => this.queueDirection('down'));
    this.input.keyboard.on('keydown-A', () => this.queueDirection('left'));
    this.input.keyboard.on('keydown-D', () => this.queueDirection('right'));

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeActive = true;
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.swipeActive) return;
      this.swipeActive = false;
      const dx = pointer.x - this.swipeStartX;
      const dy = pointer.y - this.swipeStartY;
      const minSwipe = 30;
      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.queueDirection(dx > 0 ? 'right' : 'left');
      } else {
        this.queueDirection(dy > 0 ? 'down' : 'up');
      }
    });
  }

  private queueDirection(dir: Direction): void {
    if (this.gameOver) return;
    const lastDir = this.inputQueue.length > 0
      ? this.inputQueue[this.inputQueue.length - 1]!
      : this.meerca.direction;
    if (dir === oppositeDir(lastDir)) return;
    if (this.inputQueue.length < 3) {
      this.inputQueue.push(dir);
    }
  }

  override update(_time: number, delta: number): void {
    if (this.gameOver) return;

    if (this.graceTimer < this.GRACE_PERIOD) {
      this.graceTimer += delta;
      this.tickTimer = 0;
      return;
    }

    this.tickTimer += delta;
    if (this.tickTimer < this.tickMs) return;
    this.tickTimer -= this.tickMs;

    if (this.inputQueue.length > 0) {
      this.meerca.setDirection(this.inputQueue.shift()!);
    }

    const { alive, newHead } = this.meerca.move();

    if (!alive) {
      this.handleGameOver();
      return;
    }

    let collected = false;
    for (let i = this.neggs.length - 1; i >= 0; i--) {
      const negg = this.neggs[i]!;
      if (samePos(negg.pos, newHead)) {
        this.collectNegg(negg, i);
        collected = true;
        break;
      }
    }

    if (!collected) {
      this.meerca.shrinkTail();
    }
  }

  private collectNegg(negg: Negg, index: number): void {
    const points = negg.type.points;
    this.score = Math.max(0, this.score + points);
    this.neggsCaught++;
    this.scoreText.setText(`Score: ${this.score}`);

    this.showPointsPopup(negg);
    this.emitCollectParticles(negg);

    negg.destroy();
    this.neggs.splice(index, 1);

    this.spawnNegg();

    const speedThreshold = Math.floor(this.score / SPEED_INCREASE_INTERVAL);
    const baseTick = this.difficulty === 'hard' ? BASE_TICK_HARD : BASE_TICK_CLASSIC;
    this.tickMs = Math.max(MIN_TICK, baseTick - speedThreshold * TICK_DECREASE);
  }

  private showPointsPopup(negg: Negg): void {
    const pixel = {
      x: this.offsetX + negg.pos.col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + negg.pos.row * this.cellSize + this.cellSize / 2,
    };
    const prefix = negg.type.points > 0 ? '+' : '';
    const color = negg.type.points > 0 ? '#ffd700' : '#ff4444';
    const popup = this.add
      .text(pixel.x, pixel.y, `${prefix}${negg.type.points}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '18px',
        color,
        stroke: '#1a0a2e',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: popup,
      y: pixel.y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    });
  }

  private emitCollectParticles(negg: Negg): void {
    const pixel = {
      x: this.offsetX + negg.pos.col * this.cellSize + this.cellSize / 2,
      y: this.offsetY + negg.pos.row * this.cellSize + this.cellSize / 2,
    };

    const particles = this.add.particles(pixel.x, pixel.y, 'particle', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: negg.type.color,
      emitting: false,
    });
    particles.setDepth(25);
    particles.explode(8);
    this.time.delayedCall(500, () => particles.destroy());
  }

  private spawnNegg(): void {
    const occupied = this.meerca.getAllPositions().concat(this.neggs.map((n) => n.pos));
    const negg = Negg.spawnRandom(this, occupied, this.cellSize, this.offsetX, this.offsetY);
    this.neggs.push(negg);
  }

  private handleGameOver(): void {
    this.gameOver = true;

    this.cameras.main.shake(200, 0.01);

    this.time.delayedCall(600, () => {
      this.meerca.destroy();
      for (const negg of this.neggs) negg.destroy();
      this.neggs = [];

      this.scene.start('GameOver', {
        score: this.score,
        neggsCaught: this.neggsCaught,
        difficulty: this.difficulty,
      });
    });
  }
}
