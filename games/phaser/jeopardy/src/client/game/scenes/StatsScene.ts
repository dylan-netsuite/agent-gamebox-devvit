import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import type { StatsResponse, UserStats } from '../../../shared/types/api';

export class StatsScene extends Scene {
  private stats: UserStats | null = null;
  private allObjects: GameObjects.GameObject[] = [];

  constructor() {
    super('StatsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x060ce9);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.allObjects = [];
    this.stats = null;

    this.showLoading();
    void this.loadStats();
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  private showLoading(): void {
    const { width, height } = this.scale;
    const text = this.add
      .text(width / 2, height / 2, 'Loading stats...', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#AAAADD',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    this.allObjects.push(text);
  }

  private async loadStats(): Promise<void> {
    try {
      const res = await fetch('/api/stats');
      const data: StatsResponse = await res.json();
      if (data.success && data.stats) {
        this.stats = data.stats;
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
    this.destroyAll();
    this.buildUI();
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  private destroyAll(): void {
    for (const obj of this.allObjects) {
      obj.destroy();
    }
    this.allObjects = [];
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);

    // Background decorative lines
    this.drawDecorLines(width, height);

    // Title bar
    this.drawTitleBar(width, height, sf);

    if (!this.stats || this.stats.gamesPlayed === 0) {
      this.drawEmptyState(width, height, sf);
      return;
    }

    // Content area starts below title bar
    const contentTop = height * 0.16;
    const contentBottom = height * 0.95;
    const contentHeight = contentBottom - contentTop;

    // Row 1: Overall % + Best Game (side by side)
    const row1Y = contentTop + contentHeight * 0.02;
    const row1H = contentHeight * 0.28;
    const cardGap = width * 0.03;
    const halfW = (width * 0.88 - cardGap) / 2;
    const leftX = width * 0.06;
    const rightX = leftX + halfW + cardGap;

    this.drawOverallCard(leftX, row1Y, halfW, row1H, sf);
    this.drawBestGameCard(rightX, row1Y, halfW, row1H, sf);

    // Row 2: Streak + Final Jeopardy (side by side)
    const row2Y = row1Y + row1H + contentHeight * 0.03;
    const row2H = contentHeight * 0.24;

    this.drawStreakCard(leftX, row2Y, halfW, row2H, sf);
    this.drawFinalJeopardyCard(rightX, row2Y, halfW, row2H, sf);

    // Row 3: Correct % by Value (full width bar chart)
    const row3Y = row2Y + row2H + contentHeight * 0.03;
    const row3H = contentHeight * 0.38;
    const fullW = width * 0.88;

    this.drawByValueCard(leftX, row3Y, fullW, row3H, sf);

    // Resize handler
    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  // ---------------------------------------------------------------------------
  // Title bar + Back button
  // ---------------------------------------------------------------------------

  private drawTitleBar(width: number, height: number, sf: number): void {
    // Title
    const title = this.add
      .text(width / 2, height * 0.07, 'MY STATS', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.round(36 * sf)}px`,
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: Math.round(4 * sf),
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 6, fill: true, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    // Back button
    const backBg = this.add.graphics();
    const btnW = 90 * sf;
    const btnH = 36 * sf;
    const btnX = width * 0.06;
    const btnY = height * 0.07 - btnH / 2;
    backBg.fillStyle(0x1a1aff, 0.8);
    backBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8 * sf);
    backBg.lineStyle(2, 0xffd700, 0.6);
    backBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8 * sf);
    this.allObjects.push(backBg);

    const backBtn = this.add
      .text(btnX + btnW / 2, height * 0.07, '< BACK', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.round(16 * sf)}px`,
        color: '#FFD700',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        backBg.clear();
        backBg.fillStyle(0x2a2aff, 1);
        backBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8 * sf);
        backBg.lineStyle(2, 0xffd700, 0.9);
        backBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8 * sf);
      })
      .on('pointerout', () => {
        backBg.clear();
        backBg.fillStyle(0x1a1aff, 0.8);
        backBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8 * sf);
        backBg.lineStyle(2, 0xffd700, 0.6);
        backBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 8 * sf);
      })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('MainMenu');
        });
      });
    this.allObjects.push(backBtn);

    // Games played subtitle
    if (this.stats) {
      const sub = this.add
        .text(width / 2, height * 0.12, `${this.stats.gamesPlayed} game${this.stats.gamesPlayed !== 1 ? 's' : ''} played`, {
          fontFamily: 'Arial',
          fontSize: `${Math.round(14 * sf)}px`,
          color: '#8888BB',
          fontStyle: 'italic',
        })
        .setOrigin(0.5);
      this.allObjects.push(sub);
    }
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  private drawEmptyState(width: number, height: number, sf: number): void {
    const msg = this.add
      .text(width / 2, height * 0.45, 'No stats yet!', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.round(28 * sf)}px`,
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    this.allObjects.push(msg);

    const sub = this.add
      .text(width / 2, height * 0.55, 'Play a game to see your stats here.', {
        fontFamily: 'Arial',
        fontSize: `${Math.round(18 * sf)}px`,
        color: '#AAAADD',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    this.allObjects.push(sub);
  }

  // ---------------------------------------------------------------------------
  // Decorative lines
  // ---------------------------------------------------------------------------

  private drawDecorLines(width: number, height: number): void {
    const g = this.add.graphics();
    g.fillStyle(0xffd700, 0.25);
    g.fillRect(width * 0.05, height * 0.14, width * 0.9, 2);
    g.fillRect(width * 0.05, height * 0.96, width * 0.9, 2);
    this.allObjects.push(g);
  }

  // ---------------------------------------------------------------------------
  // Card helpers
  // ---------------------------------------------------------------------------

  private drawCardBg(x: number, y: number, w: number, h: number): GameObjects.Graphics {
    const g = this.add.graphics();
    g.fillStyle(0x04086e, 0.7);
    g.fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(1.5, 0xffd700, 0.3);
    g.strokeRoundedRect(x, y, w, h, 10);
    this.allObjects.push(g);
    return g;
  }

  private drawCardLabel(
    x: number,
    y: number,
    label: string,
    sf: number,
    color = '#8888BB',
  ): GameObjects.Text {
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'Arial',
        fontSize: `${Math.round(12 * sf)}px`,
        color,
        fontStyle: 'italic',
      })
      .setOrigin(0.5, 0);
    this.allObjects.push(t);
    return t;
  }

  // ---------------------------------------------------------------------------
  // Overall correct % (arc ring)
  // ---------------------------------------------------------------------------

  private drawOverallCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const stats = this.stats!;

    this.drawCardLabel(cx, y + 8 * sf, 'OVERALL CORRECT', sf);

    const pct = stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0;
    const radius = Math.min(w, h) * 0.28;
    const centerY = y + h * 0.56;

    // Background ring
    const bgRing = this.add.graphics();
    bgRing.lineStyle(10 * sf, 0x222266, 1);
    bgRing.beginPath();
    bgRing.arc(cx, centerY, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270), false);
    bgRing.strokePath();
    this.allObjects.push(bgRing);

    // Filled arc
    if (pct > 0) {
      const fillRing = this.add.graphics();
      const endAngle = -90 + 360 * pct;
      const color = pct >= 0.7 ? 0x44ff44 : pct >= 0.4 ? 0xffdd44 : 0xff4444;
      fillRing.lineStyle(10 * sf, color, 1);
      fillRing.beginPath();
      fillRing.arc(cx, centerY, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(endAngle), false);
      fillRing.strokePath();
      this.allObjects.push(fillRing);
    }

    // Percentage text in center
    const pctText = this.add
      .text(cx, centerY, `${Math.round(pct * 100)}%`, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.round(24 * sf)}px`,
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    this.allObjects.push(pctText);

    // Detail text
    const detail = this.add
      .text(cx, centerY + radius + 12 * sf, `${stats.totalCorrect} / ${stats.totalAnswered}`, {
        fontFamily: 'Arial',
        fontSize: `${Math.round(11 * sf)}px`,
        color: '#AAAADD',
      })
      .setOrigin(0.5);
    this.allObjects.push(detail);
  }

  // ---------------------------------------------------------------------------
  // Best Game card
  // ---------------------------------------------------------------------------

  private drawBestGameCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const stats = this.stats!;

    this.drawCardLabel(cx, y + 8 * sf, 'BEST GAME', sf);

    if (stats.bestGame) {
      const scoreStr =
        stats.bestGame.score >= 0
          ? `$${stats.bestGame.score.toLocaleString()}`
          : `-$${Math.abs(stats.bestGame.score).toLocaleString()}`;

      const scoreText = this.add
        .text(cx, y + h * 0.42, scoreStr, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.round(28 * sf)}px`,
          color: stats.bestGame.score >= 0 ? '#44FF44' : '#FF4444',
          shadow: { offsetX: 0, offsetY: 0, color: '#FFD700', blur: 8, fill: false, stroke: true },
        })
        .setOrigin(0.5);
      this.allObjects.push(scoreText);

      const desc = this.add
        .text(cx, y + h * 0.65, stats.bestGame.description || stats.bestGame.date, {
          fontFamily: 'Arial',
          fontSize: `${Math.round(12 * sf)}px`,
          color: '#AAAADD',
          wordWrap: { width: w * 0.85 },
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(desc);

      // Trophy icon (text-based)
      const trophy = this.add
        .text(cx, y + h * 0.85, '★', {
          fontFamily: 'Arial',
          fontSize: `${Math.round(18 * sf)}px`,
          color: '#FFD700',
        })
        .setOrigin(0.5);
      this.allObjects.push(trophy);
    } else {
      const noData = this.add
        .text(cx, y + h / 2, 'N/A', {
          fontFamily: 'Arial',
          fontSize: `${Math.round(20 * sf)}px`,
          color: '#666688',
        })
        .setOrigin(0.5);
      this.allObjects.push(noData);
    }
  }

  // ---------------------------------------------------------------------------
  // Longest Streak card
  // ---------------------------------------------------------------------------

  private drawStreakCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const stats = this.stats!;

    this.drawCardLabel(cx, y + 8 * sf, 'LONGEST STREAK', sf);

    const streakText = this.add
      .text(cx, y + h * 0.48, `${stats.longestStreak}`, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.round(36 * sf)}px`,
        color: '#FFD700',
        shadow: { offsetX: 0, offsetY: 0, color: '#FF8800', blur: 10, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(streakText);

    const subLabel = this.add
      .text(cx, y + h * 0.78, 'consecutive correct', {
        fontFamily: 'Arial',
        fontSize: `${Math.round(11 * sf)}px`,
        color: '#AAAADD',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    this.allObjects.push(subLabel);
  }

  // ---------------------------------------------------------------------------
  // Final Jeopardy %
  // ---------------------------------------------------------------------------

  private drawFinalJeopardyCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const stats = this.stats!;

    this.drawCardLabel(cx, y + 8 * sf, 'FINAL JEOPARDY', sf);

    const fj = stats.finalJeopardy;
    const pct = fj.total > 0 ? fj.correct / fj.total : 0;
    const color = pct >= 0.6 ? '#44FF44' : pct >= 0.3 ? '#FFDD44' : '#FF4444';

    const pctText = this.add
      .text(cx, y + h * 0.45, fj.total > 0 ? `${Math.round(pct * 100)}%` : 'N/A', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.round(30 * sf)}px`,
        color: fj.total > 0 ? color : '#666688',
      })
      .setOrigin(0.5);
    this.allObjects.push(pctText);

    if (fj.total > 0) {
      const detail = this.add
        .text(cx, y + h * 0.75, `${fj.correct} / ${fj.total}`, {
          fontFamily: 'Arial',
          fontSize: `${Math.round(12 * sf)}px`,
          color: '#AAAADD',
        })
        .setOrigin(0.5);
      this.allObjects.push(detail);
    }
  }

  // ---------------------------------------------------------------------------
  // Correct % by Value (horizontal bar chart)
  // ---------------------------------------------------------------------------

  private drawByValueCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const stats = this.stats!;

    this.drawCardLabel(cx, y + 6 * sf, 'CORRECT % BY CLUE VALUE', sf);

    const byVal = stats.correctByValue;
    const sortedKeys = Object.keys(byVal)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);

    if (sortedKeys.length === 0) {
      const noData = this.add
        .text(cx, y + h / 2, 'No data yet', {
          fontFamily: 'Arial',
          fontSize: `${Math.round(16 * sf)}px`,
          color: '#666688',
        })
        .setOrigin(0.5);
      this.allObjects.push(noData);
      return;
    }

    const labelAreaW = 70 * sf;
    const pctLabelW = 55 * sf;
    const barAreaX = x + 16 * sf + labelAreaW;
    const barAreaW = w - 32 * sf - labelAreaW - pctLabelW;

    const startY = y + 26 * sf;
    const availH = h - 34 * sf;
    const barH = Math.min(22 * sf, availH / sortedKeys.length - 4 * sf);
    const gap = Math.max(2 * sf, (availH - barH * sortedKeys.length) / (sortedKeys.length + 1));

    for (let i = 0; i < sortedKeys.length; i++) {
      const val = sortedKeys[i];
      const entry = byVal[String(val)]!;
      const pct = entry.total > 0 ? entry.correct / entry.total : 0;
      const barY = startY + gap + i * (barH + gap);

      // Value label
      const label = this.add
        .text(barAreaX - 8 * sf, barY + barH / 2, `$${val}`, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.round(12 * sf)}px`,
          color: '#FFD700',
        })
        .setOrigin(1, 0.5);
      this.allObjects.push(label);

      // Bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0x222266, 0.6);
      barBg.fillRoundedRect(barAreaX, barY, barAreaW, barH, 4 * sf);
      this.allObjects.push(barBg);

      // Bar fill
      if (pct > 0) {
        const barFill = this.add.graphics();
        const fillColor = pct >= 0.7 ? 0x44ff44 : pct >= 0.4 ? 0xffdd44 : 0xff4444;
        const fillW = Math.max(4 * sf, barAreaW * pct);
        barFill.fillStyle(fillColor, 0.85);
        barFill.fillRoundedRect(barAreaX, barY, fillW, barH, 4 * sf);
        this.allObjects.push(barFill);
      }

      // Percentage + count
      const pctStr = `${Math.round(pct * 100)}%`;
      const countStr = `(${entry.correct}/${entry.total})`;
      const pctLabel = this.add
        .text(barAreaX + barAreaW + 6 * sf, barY + barH / 2, `${pctStr} ${countStr}`, {
          fontFamily: 'Arial',
          fontSize: `${Math.round(10 * sf)}px`,
          color: '#AAAADD',
        })
        .setOrigin(0, 0.5);
      this.allObjects.push(pctLabel);
    }
  }
}
