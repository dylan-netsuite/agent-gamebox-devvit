import { Scene } from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { AIDifficulty } from '../systems/AIOpponent';

interface DiffOption {
  key: AIDifficulty;
  label: string;
  desc: string;
  icon: string;
  color: number;
  opponents: string;
}

export class DifficultySelect extends Scene {
  constructor() {
    super('DifficultySelect');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 300, ease: 'Sine.easeOut' });

    this.add
      .text(cx, 24, 'SINGLE PLAYER', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 54, 'CHOOSE DIFFICULTY', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#9b59b6',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const options: DiffOption[] = [
      {
        key: 'easy',
        label: 'EASY',
        desc: '1 slow opponent — great for practice',
        icon: '🟢',
        color: 0x2ecc71,
        opponents: '1 AI',
      },
      {
        key: 'medium',
        label: 'MEDIUM',
        desc: '2 balanced opponents — a fair challenge',
        icon: '🟡',
        color: 0xf39c12,
        opponents: '2 AI',
      },
      {
        key: 'hard',
        label: 'HARD',
        desc: '3 sharp opponents — can you beat them all?',
        icon: '🔴',
        color: 0xe74c3c,
        opponents: '3 AI',
      },
    ];

    const btnW = Math.min(width - 32, 360);
    const btnH = 70;
    const startY = 80;
    const gap = 10;

    options.forEach((opt, i) => {
      const y = startY + i * (btnH + gap);
      this.createDiffButton(cx, y, btnW, btnH, opt);
    });

    this.add
      .text(cx, height - 16, '[ ESC — Back ]', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666688',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        SoundManager.play('select');
        this.scene.start('ModeSelect');
      });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        SoundManager.play('select');
        this.scene.start('ModeSelect');
      });
    }
  }

  private createDiffButton(cx: number, y: number, w: number, h: number, opt: DiffOption): void {
    const x = cx - w / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(1, opt.color, 0.4);
    bg.strokeRoundedRect(x, y, w, h, 10);

    this.add
      .text(x + 18, y + h / 2 - 4, opt.icon, { fontSize: '24px' })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 52, y + h / 2 - 16, opt.label, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 52, y + h / 2 + 2, opt.desc, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + w - 16, y + h / 2 - 6, opt.opponents, {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#3498db',
      })
      .setOrigin(1, 0.5);

    const zone = this.add
      .zone(cx, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e2d4f, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(2, opt.color, 0.8);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x16213e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(1, opt.color, 0.4);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerdown', () => {
      SoundManager.play('select');
      this.scene.start('GamePlay', { mode: 'single', aiDifficulty: opt.key });
    });
  }
}
