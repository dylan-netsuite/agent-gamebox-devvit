import { Scene } from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import { TutorialManager } from '../systems/TutorialManager';

interface ModeButton {
  icon: string;
  title: string;
  desc: string;
  badge?: string;
  action: () => void;
}

export class ModeSelect extends Scene {
  constructor() {
    super('ModeSelect');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add
      .text(cx, 28, '👑 REDDIT ROYALE', {
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
        color: '#00e5ff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const modes: ModeButton[] = [
      {
        icon: '📖',
        title: 'TUTORIAL',
        desc: 'Learn the basics step by step',
        badge: TutorialManager.isComplete() ? '✓ Completed' : undefined,
        action: () => {
          SoundManager.play('select');
          this.scene.start('GamePlay', {
            numTeams: 2,
            wormsPerTeam: 1,
            aiTeams: [1],
            aiDifficulty: 'easy',
            mapId: 'hills',
            turnTimer: 0,
            tutorial: true,
          });
        },
      },
      {
        icon: '🤖',
        title: 'SINGLE PLAYER',
        desc: 'Battle against CPU opponents',
        action: () => {
          SoundManager.play('select');
          this.scene.start('GameSetup', { forceVsCPU: true });
        },
      },
      {
        icon: '🎮',
        title: 'LOCAL MULTIPLAYER',
        desc: 'Pass & play on one device',
        action: () => {
          SoundManager.play('select');
          this.scene.start('GameSetup', { forceVsCPU: false });
        },
      },
      {
        icon: '🌐',
        title: 'ONLINE PLAY',
        desc: 'Play with others in real-time',
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
    const btnH = 72;
    const gap = 12;
    const totalH = modes.length * btnH + (modes.length - 1) * gap;
    const startY = (height - totalH) / 2 + 20;

    modes.forEach((mode, i) => {
      const y = startY + i * (btnH + gap);
      this.createModeButton(cx, y, btnW, btnH, mode);
    });

    this.add
      .text(cx, height - 14, '2-4 Players • Turn-Based • Destructible Terrain', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#555577',
      })
      .setOrigin(0.5);
  }

  private createModeButton(cx: number, y: number, w: number, h: number, mode: ModeButton): void {
    const x = cx - w / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 0.95);
    bg.fillRoundedRect(x, y, w, h, 12);
    bg.lineStyle(1, 0x2a3a5a, 0.6);
    bg.strokeRoundedRect(x, y, w, h, 12);

    this.add
      .text(x + 20, y + h / 2 - 2, mode.icon, {
        fontSize: '28px',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 60, y + h / 2 - 10, mode.title, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(x + 60, y + h / 2 + 12, mode.desc, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);

    if (mode.badge) {
      this.add
        .text(x + w - 14, y + h / 2, mode.badge, {
          fontFamily: 'monospace',
          fontSize: '9px',
          color: '#3fb950',
        })
        .setOrigin(1, 0.5);
    }

    const zone = this.add
      .zone(cx, y + h / 2, w, h)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e2d4f, 0.95);
      bg.fillRoundedRect(x, y, w, h, 12);
      bg.lineStyle(2, 0x00e5ff, 0.6);
      bg.strokeRoundedRect(x, y, w, h, 12);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x16213e, 0.95);
      bg.fillRoundedRect(x, y, w, h, 12);
      bg.lineStyle(1, 0x2a3a5a, 0.6);
      bg.strokeRoundedRect(x, y, w, h, 12);
    });

    zone.on('pointerdown', mode.action);
  }
}
