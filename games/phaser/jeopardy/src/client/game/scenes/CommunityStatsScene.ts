import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import type { CommunityStatsResponse } from '../../../shared/types/api';

interface CommunityData {
  totalPlayers: number;
  totalGamesPlayed: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  avgCorrectPct: number;
  avgCorrectTime: number | null;
  topPlayers: { rank: number; username: string; bestScore: number }[];
}

export class CommunityStatsScene extends Scene {
  private communityData: CommunityData | null = null;
  private allObjects: GameObjects.GameObject[] = [];

  constructor() {
    super('CommunityStatsScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x060ce9);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.allObjects = [];
    this.communityData = null;

    this.showLoading();
    void this.loadData();
  }

  private showLoading(): void {
    const { width, height } = this.scale;
    const text = this.add
      .text(width / 2, height / 2, 'Loading community stats...', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#AAAADD',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    this.allObjects.push(text);
  }

  private async loadData(): Promise<void> {
    try {
      const res = await fetch('/api/community-stats');
      const json: CommunityStatsResponse = await res.json();
      if (json.success) {
        this.communityData = json;
      }
    } catch (err) {
      console.error('Failed to load community stats:', err);
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
    const sf = Math.min(width / 1024, height / 768);

    this.drawDecorLines(width, height);
    this.drawTitleBar(width, height, sf);

    if (!this.communityData) {
      this.drawEmptyState(width, height, sf);
      return;
    }

    const contentTop = height * 0.16;
    const contentBottom = height * 0.95;
    const contentHeight = contentBottom - contentTop;

    // Hero: Total players
    const heroY = contentTop + contentHeight * 0.02;
    const heroH = contentHeight * 0.16;
    this.drawHero(width * 0.06, heroY, width * 0.88, heroH, sf);

    // Row 1: Games Played + Questions Answered
    const row1Y = heroY + heroH + contentHeight * 0.03;
    const row1H = contentHeight * 0.16;
    const cardGap = width * 0.03;
    const halfW = (width * 0.88 - cardGap) / 2;
    const leftX = width * 0.06;
    const rightX = leftX + halfW + cardGap;

    this.drawStatCard(leftX, row1Y, halfW, row1H, sf, 'GAMES PLAYED', this.formatNumber(this.communityData.totalGamesPlayed), '#FFD700');
    this.drawStatCard(rightX, row1Y, halfW, row1H, sf, 'QUESTIONS ANSWERED', this.formatNumber(this.communityData.totalQuestionsAnswered), '#6EC6FF');

    // Row 2: Correct % (arc) + Avg Time
    const row2Y = row1Y + row1H + contentHeight * 0.03;
    const row2H = contentHeight * 0.24;

    this.drawCorrectPctCard(leftX, row2Y, halfW, row2H, sf);
    this.drawAvgTimeCard(rightX, row2Y, halfW, row2H, sf);

    // Row 3: Top 3 podium
    const row3Y = row2Y + row2H + contentHeight * 0.03;
    const row3H = contentHeight * 0.3;
    this.drawPodium(leftX, row3Y, width * 0.88, row3H, sf);

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  // ---------------------------------------------------------------------------
  // Title bar + Back
  // ---------------------------------------------------------------------------

  private drawTitleBar(width: number, height: number, sf: number): void {
    const title = this.add
      .text(width / 2, height * 0.07, 'COMMUNITY', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(20, Math.round(36 * sf))}px`,
        color: '#FFD700',
        stroke: '#8B6914',
        strokeThickness: Math.max(2, Math.round(4 * sf)),
        shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 6, fill: true, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    const backBg = this.add.graphics();
    const btnW = Math.max(70, 90 * sf);
    const btnH = Math.max(28, 36 * sf);
    const btnX = width * 0.06;
    const btnY = height * 0.07 - btnH / 2;
    backBg.fillStyle(0x1a1aff, 0.8);
    backBg.fillRoundedRect(btnX, btnY, btnW, btnH, Math.max(4, 8 * sf));
    backBg.lineStyle(2, 0xffd700, 0.6);
    backBg.strokeRoundedRect(btnX, btnY, btnW, btnH, Math.max(4, 8 * sf));
    this.allObjects.push(backBg);

    const backBtn = this.add
      .text(btnX + btnW / 2, height * 0.07, '< BACK', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(16 * sf))}px`,
        color: '#FFD700',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        backBg.clear();
        backBg.fillStyle(0x2a2aff, 1);
        backBg.fillRoundedRect(btnX, btnY, btnW, btnH, Math.max(4, 8 * sf));
        backBg.lineStyle(2, 0xffd700, 0.9);
        backBg.strokeRoundedRect(btnX, btnY, btnW, btnH, Math.max(4, 8 * sf));
      })
      .on('pointerout', () => {
        backBg.clear();
        backBg.fillStyle(0x1a1aff, 0.8);
        backBg.fillRoundedRect(btnX, btnY, btnW, btnH, Math.max(4, 8 * sf));
        backBg.lineStyle(2, 0xffd700, 0.6);
        backBg.strokeRoundedRect(btnX, btnY, btnW, btnH, Math.max(4, 8 * sf));
      })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('MainMenu');
        });
      });
    this.allObjects.push(backBtn);
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  private drawEmptyState(width: number, height: number, sf: number): void {
    const msg = this.add
      .text(width / 2, height * 0.45, 'No community data yet!', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(18, Math.round(28 * sf))}px`,
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    this.allObjects.push(msg);

    const sub = this.add
      .text(width / 2, height * 0.55, 'Play a game to start building the community stats.', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(12, Math.round(18 * sf))}px`,
        color: '#AAAADD',
        fontStyle: 'italic',
        wordWrap: { width: width * 0.8 },
        align: 'center',
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

  // ---------------------------------------------------------------------------
  // Hero — total players
  // ---------------------------------------------------------------------------

  private drawHero(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const d = this.communityData!;

    const numText = this.add
      .text(cx, y + h * 0.35, this.formatNumber(d.totalPlayers), {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(24, Math.round(44 * sf))}px`,
        color: '#FFD700',
        shadow: { offsetX: 0, offsetY: 0, color: '#FF8800', blur: 10, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(numText);

    const label = this.add
      .text(cx, y + h * 0.75, d.totalPlayers === 1 ? 'PLAYER' : 'PLAYERS', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(14 * sf))}px`,
        color: '#8888BB',
        fontStyle: 'italic',
        letterSpacing: 4,
      })
      .setOrigin(0.5);
    this.allObjects.push(label);
  }

  // ---------------------------------------------------------------------------
  // Stat card (generic number card)
  // ---------------------------------------------------------------------------

  private drawStatCard(
    x: number, y: number, w: number, h: number, sf: number,
    label: string, value: string, valueColor: string,
  ): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;

    const labelText = this.add
      .text(cx, y + h * 0.22, label, {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: '#8888BB',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    this.allObjects.push(labelText);

    const valueText = this.add
      .text(cx, y + h * 0.6, value, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(18, Math.round(28 * sf))}px`,
        color: valueColor,
      })
      .setOrigin(0.5);
    this.allObjects.push(valueText);
  }

  // ---------------------------------------------------------------------------
  // Community correct % (arc ring)
  // ---------------------------------------------------------------------------

  private drawCorrectPctCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const d = this.communityData!;

    const labelText = this.add
      .text(cx, y + 8 * sf, 'COMMUNITY CORRECT %', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: '#8888BB',
        fontStyle: 'italic',
      })
      .setOrigin(0.5, 0);
    this.allObjects.push(labelText);

    const pct = d.totalQuestionsAnswered > 0 ? d.totalCorrect / d.totalQuestionsAnswered : 0;
    const radius = Math.min(w, h) * 0.28;
    const centerY = y + h * 0.56;

    const bgRing = this.add.graphics();
    bgRing.lineStyle(Math.max(4, 10 * sf), 0x222266, 1);
    bgRing.beginPath();
    bgRing.arc(cx, centerY, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(270), false);
    bgRing.strokePath();
    this.allObjects.push(bgRing);

    if (pct > 0) {
      const fillRing = this.add.graphics();
      const endAngle = -90 + 360 * pct;
      const color = pct >= 0.7 ? 0x44ff44 : pct >= 0.4 ? 0xffdd44 : 0xff4444;
      fillRing.lineStyle(Math.max(4, 10 * sf), color, 1);
      fillRing.beginPath();
      fillRing.arc(cx, centerY, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(endAngle), false);
      fillRing.strokePath();
      this.allObjects.push(fillRing);
    }

    const pctText = this.add
      .text(cx, centerY, `${Math.round(pct * 100)}%`, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(16, Math.round(24 * sf))}px`,
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    this.allObjects.push(pctText);

    const detail = this.add
      .text(cx, centerY + radius + Math.max(6, 12 * sf), `${this.formatNumber(d.totalCorrect)} / ${this.formatNumber(d.totalQuestionsAnswered)}`, {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(11 * sf))}px`,
        color: '#AAAADD',
      })
      .setOrigin(0.5);
    this.allObjects.push(detail);
  }

  // ---------------------------------------------------------------------------
  // Average answer time
  // ---------------------------------------------------------------------------

  private drawAvgTimeCard(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const d = this.communityData!;

    const labelText = this.add
      .text(cx, y + 8 * sf, 'AVG CORRECT TIME', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: '#8888BB',
        fontStyle: 'italic',
      })
      .setOrigin(0.5, 0);
    this.allObjects.push(labelText);

    if (d.avgCorrectTime !== null) {
      const timeText = this.add
        .text(cx, y + h * 0.48, `${d.avgCorrectTime.toFixed(1)}s`, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(22, Math.round(36 * sf))}px`,
          color: '#6EC6FF',
          shadow: { offsetX: 0, offsetY: 0, color: '#0088FF', blur: 8, fill: false, stroke: true },
        })
        .setOrigin(0.5);
      this.allObjects.push(timeText);

      const subLabel = this.add
        .text(cx, y + h * 0.75, 'per correct answer', {
          fontFamily: 'Arial',
          fontSize: `${Math.max(9, Math.round(11 * sf))}px`,
          color: '#AAAADD',
          fontStyle: 'italic',
        })
        .setOrigin(0.5);
      this.allObjects.push(subLabel);
    } else {
      const noData = this.add
        .text(cx, y + h * 0.5, 'N/A', {
          fontFamily: 'Arial',
          fontSize: `${Math.max(16, Math.round(20 * sf))}px`,
          color: '#666688',
        })
        .setOrigin(0.5);
      this.allObjects.push(noData);
    }
  }

  // ---------------------------------------------------------------------------
  // Top 3 podium
  // ---------------------------------------------------------------------------

  private drawPodium(x: number, y: number, w: number, h: number, sf: number): void {
    this.drawCardBg(x, y, w, h);
    const cx = x + w / 2;
    const d = this.communityData!;

    const label = this.add
      .text(cx, y + 8 * sf, 'TOP PLAYERS', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: '#8888BB',
        fontStyle: 'italic',
      })
      .setOrigin(0.5, 0);
    this.allObjects.push(label);

    if (d.topPlayers.length === 0) {
      const noData = this.add
        .text(cx, y + h / 2, 'No players yet', {
          fontFamily: 'Arial',
          fontSize: `${Math.max(14, Math.round(18 * sf))}px`,
          color: '#666688',
        })
        .setOrigin(0.5);
      this.allObjects.push(noData);
      return;
    }

    const medals = ['1ST', '2ND', '3RD'];
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const startY = y + Math.max(28, 36 * sf);
    const rowH = Math.min(Math.max(32, 44 * sf), (h - 40 * sf) / 3);

    for (let i = 0; i < d.topPlayers.length; i++) {
      const p = d.topPlayers[i]!;
      const rowY = startY + i * rowH;

      // Rank badge
      const badge = this.add
        .text(x + Math.max(20, 30 * sf), rowY + rowH / 2, medals[i] ?? `${p.rank}`, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(12, Math.round(18 * sf))}px`,
          color: medalColors[i] ?? '#FFFFFF',
        })
        .setOrigin(0.5);
      this.allObjects.push(badge);

      // Username
      const name = this.add
        .text(x + Math.max(60, 80 * sf), rowY + rowH / 2, p.username, {
          fontFamily: 'Arial',
          fontSize: `${Math.max(12, Math.round(16 * sf))}px`,
          color: '#FFFFFF',
        })
        .setOrigin(0, 0.5);
      this.allObjects.push(name);

      // Score
      const scoreStr = p.bestScore >= 0
        ? `$${p.bestScore.toLocaleString()}`
        : `-$${Math.abs(p.bestScore).toLocaleString()}`;
      const score = this.add
        .text(x + w - Math.max(16, 24 * sf), rowY + rowH / 2, scoreStr, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(12, Math.round(16 * sf))}px`,
          color: p.bestScore >= 0 ? '#44FF44' : '#FF4444',
        })
        .setOrigin(1, 0.5);
      this.allObjects.push(score);

      // Divider line (except after last)
      if (i < d.topPlayers.length - 1) {
        const divider = this.add.graphics();
        divider.fillStyle(0xffd700, 0.15);
        divider.fillRect(x + 20, rowY + rowH - 1, w - 40, 1);
        this.allObjects.push(divider);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private formatNumber(n: number): string {
    if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString();
  }
}
