import { Scene } from 'phaser';
import type { LeaderboardResponse } from '../../../shared/types/api';

export class Leaderboard extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Leaderboard');
  }

  create() {
    this.cameras.main.setBackgroundColor(0xf7f7f7);
    this.allObjects = [];
    this.buildUI([]);

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI([]);
    });

    void this.fetchLeaderboard();
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
  }

  private buildUI(entries: { rank: number; username: string; highScore: number }[]): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = Math.min(width / 800, height / 400);

    // Title
    const titleSize = Math.max(22, Math.round(32 * sf));
    const title = this.add
      .text(cx, height * 0.1, 'LEADERBOARD', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${titleSize}px`,
        color: '#535353',
        align: 'center',
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.allObjects.push(title);

    // Back button
    const backSize = Math.max(12, Math.round(14 * sf));
    const back = this.add
      .text(20, 20, '< BACK', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${backSize}px`,
        color: '#999',
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    back.on('pointerdown', () => this.scene.start('MainMenu'));
    back.on('pointerover', () => back.setColor('#535353'));
    back.on('pointerout', () => back.setColor('#999'));
    this.allObjects.push(back);

    // Entries
    const entrySize = Math.max(12, Math.round(14 * sf));
    const startY = height * 0.22;
    const rowH = Math.max(24, Math.round(30 * sf));
    const maxW = Math.min(width * 0.85, 500);
    const leftX = cx - maxW / 2;
    const rightX = cx + maxW / 2;

    if (entries.length === 0) {
      const loading = this.add
        .text(cx, height * 0.45, 'Loading...', {
          fontFamily: '"Courier New", monospace',
          fontSize: `${entrySize}px`,
          color: '#999',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(5)
        .setName('loading-text');
      this.allObjects.push(loading);
      return;
    }

    for (let i = 0; i < entries.length && i < 10; i++) {
      const e = entries[i]!;
      const y = startY + i * rowH;
      const isTop3 = e.rank <= 3;
      const color = isTop3 ? '#535353' : '#888';
      const weight = isTop3 ? 'bold' : 'normal';

      // Rank
      const rank = this.add
        .text(leftX, y, `${e.rank}.`, {
          fontFamily: '"Courier New", monospace',
          fontSize: `${entrySize}px`,
          color,
          fontStyle: weight,
        })
        .setDepth(5);
      this.allObjects.push(rank);

      // Name
      const name = this.add
        .text(leftX + 40, y, e.username, {
          fontFamily: '"Courier New", monospace',
          fontSize: `${entrySize}px`,
          color,
          fontStyle: weight,
        })
        .setDepth(5);
      this.allObjects.push(name);

      // Score
      const score = this.add
        .text(rightX, y, String(e.highScore).padStart(5, '0'), {
          fontFamily: '"Courier New", monospace',
          fontSize: `${entrySize}px`,
          color,
          fontStyle: weight,
          align: 'right',
        })
        .setOrigin(1, 0)
        .setDepth(5);
      this.allObjects.push(score);

      // Separator line
      if (i < entries.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, 0xe0e0e0);
        line.lineBetween(leftX, y + rowH - 4, rightX, y + rowH - 4);
        line.setDepth(4);
        this.allObjects.push(line);
      }
    }
  }

  private async fetchLeaderboard(): Promise<void> {
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) return;
      const data = (await res.json()) as LeaderboardResponse;
      if (data.success) {
        this.destroyAll();
        this.buildUI(data.entries);
      }
    } catch {
      /* offline */
    }
  }
}
