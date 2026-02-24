import { Scene } from 'phaser';
import { SoundManager } from '../systems/SoundManager';

interface ModeButton {
  icon: string;
  title: string;
  desc: string;
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
      .text(cx, 28, 'SCATTERGORIES', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 62, 'SELECT MODE', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#3498db',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const modes: ModeButton[] = [
      {
        icon: '🎯',
        title: 'SINGLE PLAYER',
        desc: 'Practice solo against the clock',
        action: () => {
          SoundManager.play('select');
          this.scene.start('GamePlay', { mode: 'single' });
        },
      },
      {
        icon: '🌐',
        title: 'ONLINE PLAY',
        desc: 'Compete with others in real-time',
        action: () => {
          SoundManager.play('select');
          this.scene.start('LobbyBrowser');
        },
      },
      {
        icon: '🏆',
        title: 'LEADERBOARD',
        desc: 'View top players',
        action: () => {
          SoundManager.play('select');
          this.scene.start('Leaderboard');
        },
      },
    ];

    const btnW = Math.min(width - 32, 360);
    const btnH = 56;
    const startY = 95;
    const gap = 10;

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
    bg.lineStyle(1, 0x3498db, 0.3);
    bg.strokeRoundedRect(x, y, w, h, 10);

    this.add
      .text(x + 18, y + h / 2, mode.icon, { fontSize: '24px' })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 54, y + h / 2 - 9, mode.title, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 54, y + h / 2 + 11, mode.desc, {
        fontFamily: 'monospace',
        fontSize: '9px',
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
      bg.lineStyle(2, 0x3498db, 0.7);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x16213e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(1, 0x3498db, 0.3);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerdown', mode.action);
  }
}
