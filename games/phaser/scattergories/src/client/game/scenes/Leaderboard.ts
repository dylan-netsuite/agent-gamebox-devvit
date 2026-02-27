import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { PlayerStats } from '../../../shared/types/game';

export class Leaderboard extends Scene {
  constructor() {
    super('Leaderboard');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add
      .text(cx, 24, 'LEADERBOARD', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    const loadingText = this.add
      .text(cx, height / 2, 'Loading...', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#8899aa',
      })
      .setOrigin(0.5);

    void this.loadLeaderboard(loadingText);

    this.add
      .text(cx, height - 16, '[ ESC \u2014 Back ]', {
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

  private async loadLeaderboard(loadingText: Phaser.GameObjects.Text): Promise<void> {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        loadingText.setText('Failed to load leaderboard');
        return;
      }
      const data = (await res.json()) as { leaderboard: PlayerStats[] };
      loadingText.destroy();
      this.renderLeaderboard(data.leaderboard);
    } catch {
      loadingText.setText('Failed to load leaderboard');
    }
  }

  private renderLeaderboard(entries: PlayerStats[]): void {
    const { width } = this.scale;
    const cx = width / 2;
    const tableW = Math.min(width - 32, 380);
    const startY = 60;
    const rowH = 32;

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x2a3a5a, 0.8);
    headerBg.fillRoundedRect(cx - tableW / 2, startY, tableW, rowH, 8);

    const colX = {
      rank: cx - tableW / 2 + 30,
      name: cx - tableW / 2 + 60,
      wins: cx + tableW / 2 - 130,
      score: cx + tableW / 2 - 70,
      games: cx + tableW / 2 - 15,
    };

    const headerStyle = {
      fontFamily: 'monospace' as const,
      fontSize: '9px',
      fontStyle: 'bold' as const,
      color: '#8899aa',
    };

    this.add.text(colX.rank, startY + rowH / 2, '#', headerStyle).setOrigin(0.5);
    this.add.text(colX.name, startY + rowH / 2, 'PLAYER', headerStyle).setOrigin(0, 0.5);
    this.add.text(colX.wins, startY + rowH / 2, 'W', headerStyle).setOrigin(0.5);
    this.add.text(colX.score, startY + rowH / 2, 'PTS', headerStyle).setOrigin(0.5);
    this.add.text(colX.games, startY + rowH / 2, 'GP', headerStyle).setOrigin(0.5);

    if (entries.length === 0) {
      this.add
        .text(cx, startY + rowH + 40, 'No games played yet!', {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#555577',
        })
        .setOrigin(0.5);
      return;
    }

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
    const maxRows = Math.min(entries.length, 10);

    for (let i = 0; i < maxRows; i++) {
      const entry = entries[i]!;
      const y = startY + rowH + i * rowH;

      const rowBg = this.add.graphics();
      const bgColor = i % 2 === 0 ? 0x16213e : 0x1a2840;
      rowBg.fillStyle(bgColor, 0.9);
      rowBg.fillRoundedRect(cx - tableW / 2, y, tableW, rowH, 8);

      const rankColor = i < 3 ? (medalColors[i] ?? '#ffffff') : '#aaaacc';
      const rankText = i < 3 ? ['🥇', '🥈', '🥉'][i]! : `${i + 1}`;

      this.add.text(colX.rank, y + rowH / 2, rankText, {
        fontFamily: 'monospace',
        fontSize: i < 3 ? '14px' : '10px',
        color: rankColor,
      }).setOrigin(0.5);

      const nameColor = i === 0 ? '#ffd700' : '#ffffff';
      this.add.text(colX.name, y + rowH / 2, entry.username.slice(0, 16), {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: i < 3 ? 'bold' : 'normal',
        color: nameColor,
      }).setOrigin(0, 0.5);

      this.add.text(colX.wins, y + rowH / 2, `${entry.wins}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#2ecc71',
      }).setOrigin(0.5);

      this.add.text(colX.score, y + rowH / 2, `${entry.totalScore}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#3498db',
      }).setOrigin(0.5);

      this.add.text(colX.games, y + rowH / 2, `${entry.gamesPlayed}`, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#8899aa',
      }).setOrigin(0.5);
    }
  }
}
