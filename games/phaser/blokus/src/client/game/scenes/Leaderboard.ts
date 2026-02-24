import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { LeaderboardResponse } from '../../../shared/types/api';

export class LeaderboardScene extends Scene {
  private entries: LeaderboardResponse['entries'] = [];
  private userRank: number | undefined;

  constructor() {
    super('Leaderboard');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);

    this.buildUI(width, height, sf, true);
    void this.loadLeaderboard();

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.children.removeAll(true);
      this.buildUI(gameSize.width, gameSize.height, Math.min(gameSize.width / 1024, gameSize.height / 768), false);
    });
  }

  private async loadLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      const data = (await res.json()) as LeaderboardResponse;
      if (data.success) {
        this.entries = data.entries;
        this.userRank = data.userRank;
      }
    } catch {
      // offline
    }

    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);
    this.children.removeAll(true);
    this.buildUI(width, height, sf, false);
  }

  private buildUI(width: number, height: number, sf: number, loading: boolean) {
    this.add
      .text(width / 2, height * 0.06, 'LEADERBOARD', {
        fontFamily: '"Arial Black", Impact, sans-serif',
        fontSize: `${Math.round(32 * sf)}px`,
        color: '#e8913a',
        stroke: '#6a3a10',
        strokeThickness: 3 * sf,
      })
      .setOrigin(0.5);

    if (loading) {
      this.add
        .text(width / 2, height * 0.4, 'Loading...', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(16 * sf)}px`,
          color: '#6688aa',
        })
        .setOrigin(0.5);
    } else if (this.entries.length === 0) {
      this.add
        .text(width / 2, height * 0.4, 'No scores yet. Be the first to play!', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(16 * sf)}px`,
          color: '#6688aa',
        })
        .setOrigin(0.5);
    } else {
      // Header
      const headerY = height * 0.14;
      const colX = [width * 0.1, width * 0.2, width * 0.5, width * 0.75];

      const headers = ['#', 'Player', 'Best Score', 'Wins'];
      for (let i = 0; i < headers.length; i++) {
        this.add
          .text(colX[i]!, headerY, headers[i]!, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: `${Math.round(13 * sf)}px`,
            color: '#8899aa',
          });
      }

      // Entries
      const rowH = Math.round(26 * sf);
      for (let i = 0; i < this.entries.length; i++) {
        const entry = this.entries[i]!;
        const y = headerY + (i + 1) * rowH;
        const isTop3 = i < 3;
        const color = isTop3 ? '#ffd166' : '#aabbcc';

        this.add.text(colX[0]!, y, `${entry.rank}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(13 * sf)}px`,
          color,
        });
        this.add.text(colX[1]!, y, entry.username, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(13 * sf)}px`,
          color,
        });
        this.add.text(colX[2]!, y, `${entry.bestScore}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(13 * sf)}px`,
          color,
        });
        this.add.text(colX[3]!, y, `${entry.gamesWon}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(13 * sf)}px`,
          color,
        });
      }

      if (this.userRank !== undefined) {
        this.add
          .text(width / 2, height * 0.85, `Your rank: #${this.userRank}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${Math.round(14 * sf)}px`,
            color: '#4a90d9',
          })
          .setOrigin(0.5);
      }
    }

    // Back button
    this.createButton(width / 2, height * 0.93, 'BACK', 0x3a3a5e, sf, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
      });
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    sf: number,
    onClick: () => void
  ) {
    const btnW = Math.round(200 * sf);
    const btnH = Math.round(44 * sf);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 12 * sf);

    this.add
      .text(x, y, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(16 * sf)}px`,
        color: '#ffffff',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .rectangle(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001)
      .on('pointerdown', onClick);
  }
}
