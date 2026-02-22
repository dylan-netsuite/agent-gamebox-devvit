import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import type { LeaderboardResponse, LeaderboardEntry } from '../../../shared/types/api';

export class LeaderboardScene extends Scene {
  private entries: LeaderboardEntry[] = [];
  private userEntry: LeaderboardEntry | null = null;
  private allObjects: GameObjects.GameObject[] = [];

  constructor() {
    super('LeaderboardScene');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x060ce9);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.allObjects = [];
    this.entries = [];
    this.userEntry = null;

    this.showLoading();
    void this.loadLeaderboard();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  private showLoading(): void {
    const { width, height } = this.scale;
    const t = this.add
      .text(width / 2, height / 2, 'Loading leaderboard...', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(14, Math.round(20 * this.sf))}px`,
        color: '#AAAADD',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(t);
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      const res = await fetch('/api/leaderboard');
      const data: LeaderboardResponse = await res.json();
      if (data.success) {
        this.entries = data.entries;
        this.userEntry = data.userEntry ?? null;
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
    this.destroyAll();
    this.buildUI();
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.drawTitleBar(cx, width, height);

    if (this.entries.length === 0) {
      this.drawEmptyState(cx, height);
      return;
    }

    this.drawEntries(cx, width, height);
  }

  private drawTitleBar(cx: number, w: number, _h: number): void {
    const sf = this.sf;
    const topPad = Math.max(10, Math.round(20 * sf));

    const back = this.add
      .text(topPad, topPad, '< BACK', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(16 * sf))}px`,
        color: '#FFD700',
      })
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('MainMenu');
        });
      });
    this.allObjects.push(back);

    const titleY = Math.max(24, Math.round(35 * sf));
    const title = this.add
      .text(cx, titleY, 'LEADERBOARD', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(18, Math.round(28 * sf))}px`,
        color: '#FFD700',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 12, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    const subY = Math.max(42, Math.round(65 * sf));
    const sub = this.add
      .text(cx, subY, 'Top Players by Best Game Score', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(14 * sf))}px`,
        color: '#8888BB',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(sub);

    const sepY = Math.max(55, Math.round(85 * sf));
    const line = this.add.graphics();
    line.lineStyle(1, 0xffd700, 0.3);
    line.lineBetween(w * 0.05, sepY, w * 0.95, sepY);
    this.allObjects.push(line);
  }

  private drawEmptyState(cx: number, h: number): void {
    const t = this.add
      .text(cx, h / 2, 'No scores yet!\nPlay a game to get on the board.', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(14, Math.round(20 * this.sf))}px`,
        color: '#AAAADD',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);
    this.allObjects.push(t);
  }

  private drawEntries(cx: number, w: number, _h: number): void {
    const sf = this.sf;
    const startY = Math.max(65, Math.round(100 * sf));
    const rowH = Math.max(26, Math.round(38 * sf));
    const colRank = w * 0.08;
    const colName = w * 0.18;
    const colScore = w * 0.72;
    const colGames = w * 0.90;

    this.drawHeaderRow(colRank, colName, colScore, colGames, startY - 5);

    const currentUserId = this.userEntry?.userId;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;
      const y = startY + Math.round(20 * sf) + i * rowH;
      const isCurrentUser = entry.userId === currentUserId;

      if (isCurrentUser) {
        const highlight = this.add.graphics();
        highlight.fillStyle(0xffd700, 0.1);
        highlight.fillRoundedRect(w * 0.03, y - rowH / 2 + 4, w * 0.94, rowH - 4, 6);
        this.allObjects.push(highlight);
      }

      this.drawEntryRow(entry, y, colRank, colName, colScore, colGames, isCurrentUser);
    }

    if (this.userEntry && this.entries.every((e) => e.userId !== this.userEntry?.userId)) {
      const sepY = startY + Math.round(20 * sf) + this.entries.length * rowH + 10;
      const sepLine = this.add.graphics();
      sepLine.lineStyle(1, 0x8888bb, 0.3);
      sepLine.lineBetween(w * 0.1, sepY, w * 0.9, sepY);
      this.allObjects.push(sepLine);

      const dots = this.add
        .text(cx, sepY, '...', {
          fontFamily: 'Arial',
          fontSize: `${Math.max(10, Math.round(14 * sf))}px`,
          color: '#8888BB',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(dots);

      const y = sepY + 25;
      const highlight = this.add.graphics();
      highlight.fillStyle(0xffd700, 0.1);
      highlight.fillRoundedRect(w * 0.03, y - rowH / 2 + 4, w * 0.94, rowH - 4, 6);
      this.allObjects.push(highlight);

      this.drawEntryRow(this.userEntry, y, colRank, colName, colScore, colGames, true);
    }
  }

  private drawHeaderRow(
    colRank: number,
    colName: number,
    colScore: number,
    colGames: number,
    y: number,
  ): void {
    const sf = this.sf;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Arial',
      fontSize: `${Math.max(8, Math.round(12 * sf))}px`,
      color: '#8888BB',
    };

    const h1 = this.add.text(colRank, y, '#', style).setOrigin(0.5);
    const h2 = this.add.text(colName, y, 'PLAYER', { ...style }).setOrigin(0, 0.5);
    const h3 = this.add.text(colScore, y, 'BEST', style).setOrigin(0.5);
    const h4 = this.add.text(colGames, y, 'GAMES', style).setOrigin(0.5);
    this.allObjects.push(h1, h2, h3, h4);
  }

  private drawEntryRow(
    entry: LeaderboardEntry,
    y: number,
    colRank: number,
    colName: number,
    colScore: number,
    colGames: number,
    isCurrentUser: boolean,
  ): void {
    const sf = this.sf;

    let rankStr: string;
    let rankColor: string;
    if (entry.rank === 1) {
      rankStr = '\u{1F947}';
      rankColor = '#FFD700';
    } else if (entry.rank === 2) {
      rankStr = '\u{1F948}';
      rankColor = '#C0C0C0';
    } else if (entry.rank === 3) {
      rankStr = '\u{1F949}';
      rankColor = '#CD7F32';
    } else {
      rankStr = String(entry.rank);
      rankColor = isCurrentUser ? '#FFD700' : '#CCCCEE';
    }

    const rankFontSize = entry.rank <= 3
      ? Math.max(14, Math.round(20 * sf))
      : Math.max(11, Math.round(16 * sf));

    const rankText = this.add
      .text(colRank, y, rankStr, {
        fontFamily: 'Arial Black',
        fontSize: `${rankFontSize}px`,
        color: rankColor,
        align: 'center',
      })
      .setOrigin(0.5);

    const nameColor = isCurrentUser ? '#FFD700' : '#FFFFFF';
    const nameStr = isCurrentUser ? `${entry.username} (you)` : entry.username;
    const nameText = this.add
      .text(colName, y, nameStr, {
        fontFamily: isCurrentUser ? 'Arial Black' : 'Arial',
        fontSize: `${Math.max(10, Math.round(15 * sf))}px`,
        color: nameColor,
      })
      .setOrigin(0, 0.5);

    const scoreStr = entry.bestScore < 0 ? `-$${Math.abs(entry.bestScore)}` : `$${entry.bestScore}`;
    const scoreText = this.add
      .text(colScore, y, scoreStr, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(16 * sf))}px`,
        color: entry.rank <= 3 ? '#FFD700' : '#44FF44',
        align: 'center',
      })
      .setOrigin(0.5);

    const gamesText = this.add
      .text(colGames, y, String(entry.gamesPlayed), {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(14 * sf))}px`,
        color: '#AAAADD',
        align: 'center',
      })
      .setOrigin(0.5);

    this.allObjects.push(rankText, nameText, scoreText, gamesText);
  }
}
