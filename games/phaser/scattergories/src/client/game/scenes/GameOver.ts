import { Scene } from 'phaser';
import { SoundManager } from '../systems/SoundManager';
import type { MultiplayerManager } from '../systems/MultiplayerManager';
import type { PlayerScore } from '../../../shared/types/game';

export interface GameOverData {
  scores: PlayerScore[];
  winnerId: string;
  winnerName: string;
  mp?: MultiplayerManager | null;
  mode?: 'single' | 'multiplayer';
}

export class GameOver extends Scene {
  constructor() {
    super('GameOver');
  }

  create(data: GameOverData) {
    const { scores, winnerName, mp } = data;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const { width } = this.scale;
    const cx = width / 2;

    SoundManager.play('gameOver');

    this.add
      .text(cx, 24, 'GAME OVER', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 60, `Winner: ${winnerName}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f39c12',
      })
      .setOrigin(0.5);

    const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
    const tableW = Math.min(width - 32, 360);
    const tableX = cx - tableW / 2;
    const startY = 95;
    const rowH = 40;

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

    sorted.forEach((player, i) => {
      const y = startY + i * rowH;

      const bg = this.add.graphics();
      const bgColor = i === 0 ? 0x2a3a5a : i % 2 === 0 ? 0x16213e : 0x1a2840;
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(tableX, y, tableW, rowH - 4, 8);

      if (i === 0) {
        bg.lineStyle(2, 0xf39c12, 0.5);
        bg.strokeRoundedRect(tableX, y, tableW, rowH - 4, 8);
      }

      const rankText = i < 3 ? ['🥇', '🥈', '🥉'][i]! : `${i + 1}`;
      this.add.text(tableX + 24, y + (rowH - 4) / 2, rankText, {
        fontFamily: 'monospace',
        fontSize: i < 3 ? '16px' : '12px',
        color: medalColors[i] ?? '#aaaacc',
      }).setOrigin(0.5);

      this.add.text(tableX + 50, y + (rowH - 4) / 2, player.username, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: i === 0 ? 'bold' : 'normal',
        color: i === 0 ? '#ffd700' : '#ffffff',
      }).setOrigin(0, 0.5);

      this.add.text(tableX + tableW - 20, y + (rowH - 4) / 2, `${player.totalScore}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#3498db',
      }).setOrigin(1, 0.5);

      this.add.text(tableX + tableW - 50, y + (rowH - 4) / 2, 'pts', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8899aa',
      }).setOrigin(1, 0.5);
    });

    const btnY = startY + sorted.length * rowH + 20;

    if (mp) {
      this.createButton(cx, btnY, 'REMATCH', 0x2ecc71, () => {
        SoundManager.play('select');
        void this.handleRematch(mp);
      });
    }

    this.createButton(cx, btnY + (mp ? 50 : 0), 'BACK TO MENU', 0x3498db, () => {
      SoundManager.play('select');
      this.scene.start('ModeSelect');
    });
  }

  private createButton(cx: number, y: number, label: string, color: number, action: () => void): void {
    const btnW = 180;
    const btnH = 40;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);

    this.add.text(cx, y + btnH / 2, label, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    const zone = this.add
      .zone(cx, y + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', action);
  }

  private async handleRematch(mp: MultiplayerManager): Promise<void> {
    const newCode = await mp.requestRematch();
    if (newCode) {
      this.scene.start('Lobby', { mp, lobbyCode: newCode });
    }
  }
}
