import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { LeaderboardResponse, LeaderboardEntry } from '../../../shared/types/api';

export class Leaderboard extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Leaderboard');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a0a2e);
    this.allObjects = [];
    this.buildUI([]);
    void this.loadLeaderboard();
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      const res = await fetch('/api/leaderboard');
      const data = (await res.json()) as LeaderboardResponse;
      if (data.success) {
        this.destroyAll();
        this.buildUI(data.entries, data.userRank);
      }
    } catch {
      // show empty
    }
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
  }

  private buildUI(entries: LeaderboardEntry[], userRank?: number): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = Math.min(width / 800, height / 600);

    const bg = this.add.tileSprite(cx, height / 2, width, height, 'grid-bg');
    bg.setDepth(0);
    this.allObjects.push(bg);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a0a2e, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1);
    this.allObjects.push(overlay);

    const titleY = height * 0.08;
    const titleSize = Math.max(20, Math.round(30 * sf));
    const title = this.add
      .text(cx, titleY, 'LEADERBOARD', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${titleSize}px`,
        color: '#ffd700',
        stroke: '#8b6914',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(title);

    if (entries.length === 0) {
      const empty = this.add
        .text(cx, height / 2, 'No scores yet!\nBe the first to play.', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.max(13, Math.round(16 * sf))}px`,
          color: '#6b5b8a',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(3);
      this.allObjects.push(empty);
    } else {
      const rowH = Math.max(28, Math.round(32 * sf));
      const startY = height * 0.16;
      const colW = Math.min(width * 0.85, 400);
      const leftX = cx - colW / 2;

      for (let i = 0; i < Math.min(entries.length, 15); i++) {
        const entry = entries[i]!;
        const y = startY + i * rowH;
        const isTop3 = i < 3;
        const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
        const textColor = isTop3 ? colors[i]! : '#a89cc8';
        const fontSize = Math.max(11, Math.round(13 * sf));

        const rankText = this.add
          .text(leftX, y, `${entry.rank}.`, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: `${fontSize}px`,
            color: textColor,
          })
          .setOrigin(0, 0.5)
          .setDepth(3);
        this.allObjects.push(rankText);

        const nameText = this.add
          .text(leftX + 40, y, entry.username, {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${fontSize}px`,
            color: textColor,
          })
          .setOrigin(0, 0.5)
          .setDepth(3);
        this.allObjects.push(nameText);

        const scoreText = this.add
          .text(leftX + colW, y, `${entry.highScore}`, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: `${fontSize}px`,
            color: textColor,
          })
          .setOrigin(1, 0.5)
          .setDepth(3);
        this.allObjects.push(scoreText);
      }

      if (userRank !== undefined) {
        const rankY = startY + Math.min(entries.length, 15) * rowH + 20;
        const yourRank = this.add
          .text(cx, rankY, `Your rank: #${userRank}`, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: `${Math.max(12, Math.round(14 * sf))}px`,
            color: '#ffd700',
          })
          .setOrigin(0.5)
          .setDepth(3);
        this.allObjects.push(yourRank);
      }
    }

    const btnW = Math.min(width * 0.5, 200);
    const btnH = Math.max(36, Math.round(40 * sf));
    const backY = height * 0.9;

    const btnContainer = this.add.container(cx, backY);
    btnContainer.setDepth(10);
    this.allObjects.push(btnContainer);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x160b28, 0.9);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
    btnBg.lineStyle(2, 0x6b5b8a, 0.5);
    btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
    btnContainer.add(btnBg);

    const btnText = this.add
      .text(0, 0, 'BACK', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.max(13, Math.round(15 * sf))}px`,
        color: '#e0e8f0',
      })
      .setOrigin(0.5);
    btnContainer.add(btnText);

    const hitArea = this.add
      .rectangle(0, 0, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}
