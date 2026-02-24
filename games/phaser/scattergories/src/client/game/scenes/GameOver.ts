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
    const { scores, mp } = data;
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const { width } = this.scale;
    const cx = width / 2;

    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 400, ease: 'Sine.easeOut' });

    SoundManager.play('gameOver');

    const titleText = this.add
      .text(cx, -30, 'GAME OVER', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.tweens.add({
      targets: titleText, y: 24,
      duration: 600, delay: 100, ease: 'Back.easeOut',
    });

    const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
    const winnerName = sorted[0]?.username ?? 'Nobody';

    const winnerText = this.add
      .text(cx, 60, `Winner: ${winnerName}`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#f39c12',
      })
      .setOrigin(0.5);
    winnerText.setAlpha(0);
    this.tweens.add({ targets: winnerText, alpha: 1, duration: 500, delay: 500, ease: 'Sine.easeOut' });

    const tableW = Math.min(width - 32, 360);
    const tableX = cx - tableW / 2;
    const startY = 95;
    const rowH = 40;

    const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

    sorted.forEach((player, i) => {
      const y = startY + i * rowH;
      const rowDelay = 700 + i * 200;

      const bg = this.add.graphics();
      const bgColor = i === 0 ? 0x2a3a5a : i % 2 === 0 ? 0x16213e : 0x1a2840;
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(tableX, y, tableW, rowH - 4, 8);
      if (i === 0) {
        bg.lineStyle(2, 0xf39c12, 0.5);
        bg.strokeRoundedRect(tableX, y, tableW, rowH - 4, 8);
      }
      bg.setAlpha(0);
      bg.setX(-20);
      this.tweens.add({ targets: bg, alpha: 1, x: 0, duration: 400, delay: rowDelay, ease: 'Back.easeOut' });

      const rankText = i < 3 ? ['🥇', '🥈', '🥉'][i]! : `${i + 1}`;
      const rankObj = this.add.text(tableX + 24, y + (rowH - 4) / 2, rankText, {
        fontFamily: 'monospace',
        fontSize: i < 3 ? '16px' : '12px',
        color: medalColors[i] ?? '#aaaacc',
      }).setOrigin(0.5);
      rankObj.setAlpha(0);
      this.tweens.add({ targets: rankObj, alpha: 1, duration: 300, delay: rowDelay + 100 });

      const nameObj = this.add.text(tableX + 50, y + (rowH - 4) / 2, player.username, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: i === 0 ? 'bold' : 'normal',
        color: i === 0 ? '#ffd700' : '#ffffff',
      }).setOrigin(0, 0.5);
      nameObj.setAlpha(0);
      this.tweens.add({ targets: nameObj, alpha: 1, duration: 300, delay: rowDelay + 100 });

      const scoreObj = this.add.text(tableX + tableW - 20, y + (rowH - 4) / 2, `${player.totalScore}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#3498db',
      }).setOrigin(1, 0.5);
      scoreObj.setAlpha(0);
      this.tweens.add({ targets: scoreObj, alpha: 1, duration: 300, delay: rowDelay + 200 });

      const ptsObj = this.add.text(tableX + tableW - 50, y + (rowH - 4) / 2, 'pts', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8899aa',
      }).setOrigin(1, 0.5);
      ptsObj.setAlpha(0);
      this.tweens.add({ targets: ptsObj, alpha: 1, duration: 300, delay: rowDelay + 200 });
    });

    const btnY = startY + sorted.length * rowH + 20;
    const btnDelay = 700 + sorted.length * 200 + 300;

    if (mp) {
      this.createAnimatedButton(cx, btnY, 'REMATCH', 0x2ecc71, btnDelay, () => {
        SoundManager.play('select');
        void this.handleRematch(mp);
      });
    }

    this.createAnimatedButton(cx, btnY + (mp ? 50 : 0), 'BACK TO MENU', 0x3498db, btnDelay + 150, () => {
      SoundManager.play('select');
      this.scene.start('ModeSelect');
    });
  }

  private createAnimatedButton(cx: number, y: number, label: string, color: number, delay: number, action: () => void): void {
    const btnW = 180;
    const btnH = 40;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);
    bg.setAlpha(0);

    const text = this.add.text(cx, y + btnH / 2, label, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    text.setAlpha(0);

    const zone = this.add
      .zone(cx, y + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });
    zone.setAlpha(0);

    this.tweens.add({ targets: [bg, text, zone], alpha: 1, duration: 400, delay, ease: 'Back.easeOut' });
    zone.on('pointerdown', action);
  }

  private async handleRematch(mp: MultiplayerManager): Promise<void> {
    const newCode = await mp.requestRematch();
    if (newCode) {
      await mp.resetForLobby(newCode);
      this.scene.start('Lobby', { mp, lobbyCode: newCode });
    }
  }
}
