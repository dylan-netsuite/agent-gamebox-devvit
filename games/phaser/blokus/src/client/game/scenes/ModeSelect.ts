import { Scene } from 'phaser';
import { SoundManager } from '../audio/SoundManager';

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
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = Math.min(width / 800, height / 600, 1.5);

    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add
      .text(cx, height * 0.08, 'BLOKUS', {
        fontFamily: '"Arial Black", Impact, sans-serif',
        fontSize: `${Math.round(40 * sf)}px`,
        color: '#4a90d9',
        stroke: '#1a3a6a',
        strokeThickness: 4 * sf,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, height * 0.15, 'SELECT MODE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(12 * sf)}px`,
        color: '#6688aa',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const modes: ModeButton[] = [
      {
        icon: '🤖',
        title: 'VS AI',
        desc: 'Play against the computer',
        action: () => {
          SoundManager.playSelect();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game', { multiplayer: false });
          });
        },
      },
      {
        icon: '🌐',
        title: 'ONLINE PLAY',
        desc: 'Play with another Redditor',
        action: () => {
          SoundManager.playSelect();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('LobbyBrowser');
          });
        },
      },
      {
        icon: '❓',
        title: 'HOW TO PLAY',
        desc: 'Learn the rules',
        action: () => {
          SoundManager.playSelect();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('HowToPlay');
          });
        },
      },
      {
        icon: '🏆',
        title: 'LEADERBOARD',
        desc: 'View top players',
        action: () => {
          SoundManager.playSelect();
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Leaderboard');
          });
        },
      },
    ];

    const btnW = Math.min(width - 32, 360);
    const btnH = Math.round(64 * sf);
    const gap = Math.round(10 * sf);
    const totalH = modes.length * btnH + (modes.length - 1) * gap;
    const startY = (height - totalH) / 2 + 20;

    modes.forEach((mode, i) => {
      const y = startY + i * (btnH + gap);
      this.createModeButton(cx, y, btnW, btnH, sf, mode);
    });
  }

  private createModeButton(cx: number, y: number, w: number, h: number, sf: number, mode: ModeButton): void {
    const x = cx - w / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.lineStyle(1, 0x2a3a5a, 0.6);
    bg.strokeRoundedRect(x, y, w, h, 10);

    this.add
      .text(x + 18, y + h / 2, mode.icon, { fontSize: `${Math.round(24 * sf)}px` })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 54, y + h / 2 - 8, mode.title, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(14 * sf)}px`,
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 54, y + h / 2 + 10, mode.desc, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(10 * sf)}px`,
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);

    const zone = this.add
      .zone(cx, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x222244, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(2, 0x4a90d9, 0.8);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 10);
      bg.lineStyle(1, 0x2a3a5a, 0.6);
      bg.strokeRoundedRect(x, y, w, h, 10);
    });

    zone.on('pointerdown', mode.action);
  }
}
