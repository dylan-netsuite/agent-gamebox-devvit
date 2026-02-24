import { Scene } from 'phaser';
import { SoundManager } from '../systems/SoundManager';

interface ModeButton {
  icon: string;
  title: string;
  desc: string;
  color: number;
  action: () => void;
}

export class ModeSelect extends Scene {
  constructor() {
    super('ModeSelect');
  }

  create() {
    const { width } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 400, ease: 'Sine.easeOut' });

    this.add
      .text(cx, 24, 'SCATTERGORIES', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 56, 'SELECT MODE', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#3498db',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const modes: ModeButton[] = [
      {
        icon: '🤖',
        title: 'SINGLE PLAYER',
        desc: 'Play against AI opponents',
        color: 0x9b59b6,
        action: () => {
          SoundManager.play('select');
          this.scene.start('GamePlay', { mode: 'single' });
        },
      },
      {
        icon: '👥',
        title: 'LOCAL PLAY',
        desc: 'Pass & play on one device',
        color: 0x2ecc71,
        action: () => {
          SoundManager.play('select');
          this.scene.start('LocalSetup');
        },
      },
      {
        icon: '🌐',
        title: 'LIVE MULTIPLAYER',
        desc: 'Compete online in real-time',
        color: 0x3498db,
        action: () => {
          SoundManager.play('select');
          this.scene.start('LobbyBrowser');
        },
      },
      {
        icon: '🏆',
        title: 'LEADERBOARD',
        desc: 'View top players',
        color: 0xf39c12,
        action: () => {
          SoundManager.play('select');
          this.scene.start('Leaderboard');
        },
      },
    ];

    const btnW = Math.min(width - 32, 360);
    const btnH = 52;
    const startY = 80;
    const gap = 8;

    modes.forEach((mode, i) => {
      const y = startY + i * (btnH + gap);
      this.createModeButton(cx, y, btnW, btnH, mode);
    });
  }

  private createModeButton(cx: number, y: number, w: number, h: number, mode: ModeButton): void {
    const x = cx - w / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(1, mode.color, 0.3);
    bg.strokeRoundedRect(x, y, w, h, 10);

    this.add
      .text(x + 16, y + h / 2, mode.icon, { fontSize: '22px' })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 48, y + h / 2 - 8, mode.title, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 48, y + h / 2 + 10, mode.desc, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);

    const zone = this.add
      .zone(cx, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e2d4f, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(2, mode.color, 0.7);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x16213e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(1, mode.color, 0.3);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerdown', mode.action);
  }
}
