import * as Phaser from 'phaser';

const BTN_SIZE = 44;
const BTN_GAP = 6;
const BG_COLOR = 0x0f1923;
const BG_ALPHA = 0.55;
const ACCENT = 0x00e5ff;
const FIRE_COLOR = 0xe94560;

export interface TouchCallbacks {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onJump: () => void;
  onAimFire: () => void;
  onNextWeapon: () => void;
  onPrevWeapon: () => void;
  onNextTurn: () => void;
  onParachute: () => void;
  getState: () => string;
}

export class TouchControls {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private callbacks: TouchCallbacks;
  private moveLeftInterval: ReturnType<typeof setInterval> | null = null;
  private moveRightInterval: ReturnType<typeof setInterval> | null = null;

  constructor(scene: Phaser.Scene, callbacks: TouchCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.container = scene.add.container(0, 0).setDepth(250).setScrollFactor(0);

    if (!scene.sys.game.device.input.touch) {
      this.container.setVisible(false);
      return;
    }
    this.buildDPad();
    this.buildActionButtons();
  }

  private buildDPad(): void {
    const cam = this.scene.cameras.main;
    const baseX = 16;
    const baseY = cam.height - 90;

    this.makeButton(baseX, baseY, '←', () => {
      this.moveLeftInterval = setInterval(() => this.callbacks.onMoveLeft(), 50);
      this.callbacks.onMoveLeft();
    }, () => {
      if (this.moveLeftInterval) { clearInterval(this.moveLeftInterval); this.moveLeftInterval = null; }
    });

    this.makeButton(baseX + BTN_SIZE + BTN_GAP, baseY, '→', () => {
      this.moveRightInterval = setInterval(() => this.callbacks.onMoveRight(), 50);
      this.callbacks.onMoveRight();
    }, () => {
      if (this.moveRightInterval) { clearInterval(this.moveRightInterval); this.moveRightInterval = null; }
    });

    this.makeButton(
      baseX + (BTN_SIZE + BTN_GAP) / 2,
      baseY - BTN_SIZE - BTN_GAP,
      '↑',
      () => this.callbacks.onJump(),
    );

    this.makeButton(
      baseX + (BTN_SIZE + BTN_GAP) / 2,
      baseY - 2 * (BTN_SIZE + BTN_GAP),
      '🪂',
      () => this.callbacks.onParachute(),
    );
  }

  private buildActionButtons(): void {
    const cam = this.scene.cameras.main;
    const rightX = cam.width - BTN_SIZE - 16;
    const baseY = cam.height - 90;

    this.makeButton(rightX, baseY, '🎯', () => this.callbacks.onAimFire(), undefined, FIRE_COLOR);

    this.makeButton(rightX - BTN_SIZE - BTN_GAP, baseY, '◀', () => this.callbacks.onPrevWeapon());
    this.makeButton(rightX + BTN_SIZE + BTN_GAP, baseY, '▶', () => this.callbacks.onNextWeapon());

    this.makeButton(
      rightX,
      baseY - BTN_SIZE - BTN_GAP,
      '⏭',
      () => this.callbacks.onNextTurn(),
    );
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    onDown: () => void,
    onUp?: () => void,
    color: number = ACCENT,
  ): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(BG_COLOR, BG_ALPHA);
    bg.fillRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
    bg.lineStyle(2, color, 0.7);
    bg.strokeRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
    this.container.add(bg);

    const text = this.scene.add
      .text(x + BTN_SIZE / 2, y + BTN_SIZE / 2, label, {
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.container.add(text);

    const hitArea = this.scene.add
      .rectangle(x + BTN_SIZE / 2, y + BTN_SIZE / 2, BTN_SIZE, BTN_SIZE, 0x000000, 0)
      .setInteractive()
      .setScrollFactor(0);
    this.container.add(hitArea);

    hitArea.on('pointerdown', () => {
      bg.clear();
      bg.fillStyle(color, 0.4);
      bg.fillRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
      bg.lineStyle(2, color, 1);
      bg.strokeRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
      onDown();
    });

    hitArea.on('pointerup', () => {
      bg.clear();
      bg.fillStyle(BG_COLOR, BG_ALPHA);
      bg.fillRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
      bg.lineStyle(2, color, 0.7);
      bg.strokeRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
      onUp?.();
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(BG_COLOR, BG_ALPHA);
      bg.fillRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
      bg.lineStyle(2, color, 0.7);
      bg.strokeRoundedRect(x, y, BTN_SIZE, BTN_SIZE, 8);
      onUp?.();
    });
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  destroy(): void {
    if (this.moveLeftInterval) clearInterval(this.moveLeftInterval);
    if (this.moveRightInterval) clearInterval(this.moveRightInterval);
    this.container.destroy();
  }
}
