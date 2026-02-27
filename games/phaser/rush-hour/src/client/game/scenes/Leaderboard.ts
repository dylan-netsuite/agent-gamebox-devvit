import { Scene, GameObjects } from 'phaser';
import * as Phaser from 'phaser';
import type { LeaderboardResponse, LeaderboardEntry } from '../../../shared/types/api';
import { drawSceneBackground, updateSceneBlocks, type SceneBg } from '../utils/sceneBackground';
import { transitionTo, fadeIn, SCENE_COLORS } from '../utils/transitions';

type TabType = 'daily' | 'alltime';

export class LeaderboardScene extends Scene {
  private entries: LeaderboardEntry[] = [];
  private userEntry: LeaderboardEntry | null = null;
  private allObjects: GameObjects.GameObject[] = [];
  private activeTab: TabType = 'daily';
  private sceneBg: SceneBg | null = null;
  private elapsed = 0;

  constructor() {
    super('LeaderboardScene');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    fadeIn(this, SCENE_COLORS.gold);
    this.allObjects = [];
    this.entries = [];
    this.userEntry = null;
    this.elapsed = 0;

    this.showLoading();
    void this.loadLeaderboard();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
    if (this.sceneBg) updateSceneBlocks(this.sceneBg.blocks, this.elapsed);
  }

  private showLoading(): void {
    const { width, height } = this.scale;
    this.sceneBg = drawSceneBackground(this, width, height);
    const t = this.add
      .text(width / 2, height / 2, 'Loading leaderboard...', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(14, Math.round(20 * this.sf))}px`,
        color: '#e9c46a',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#e9c46a', blur: 10, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(t);
  }

  private async loadLeaderboard(): Promise<void> {
    try {
      const res = await fetch(`/api/leaderboard?type=${this.activeTab}`);
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
    if (this.sceneBg) {
      for (const obj of this.sceneBg.objects) obj.destroy();
      this.sceneBg = null;
    }
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = this.sf;

    this.sceneBg = drawSceneBackground(this, width, height);

    const back = this.add
      .text(Math.max(10, 20 * sf), Math.max(10, 20 * sf), '< BACK', {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#e63946',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        transitionTo(this, 'MainMenu', undefined, SCENE_COLORS.dark);
      });
    this.allObjects.push(back);

    const titleY = Math.max(20, 30 * sf);
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0xe9c46a, 0.2);
    titleGlow.fillEllipse(cx, titleY, 240 * sf, 50 * sf);
    this.allObjects.push(titleGlow);

    const title = this.add
      .text(cx, titleY, 'LEADERBOARD', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.max(18, Math.round(28 * sf))}px`,
        color: '#e9c46a',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#e9c46a', blur: 16, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    const tabY = Math.max(50, 65 * sf);
    const tabs: { label: string; type: TabType }[] = [
      { label: 'DAILY', type: 'daily' },
      { label: 'ALL TIME', type: 'alltime' },
    ];
    const tabW = Math.min(width * 0.35, 140);
    const tabH = Math.max(26, 34 * sf);

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]!;
      const x = cx + (i - 0.5) * (tabW + 8);
      const isActive = tab.type === this.activeTab;

      const bg = this.add.graphics();
      if (isActive) {
        bg.fillStyle(0xe9c46a, 0.85);
        bg.fillRoundedRect(x - tabW / 2, tabY, tabW, tabH, 6);
        bg.lineStyle(1, 0xffffff, 0.15);
        bg.strokeRoundedRect(x - tabW / 2, tabY, tabW, tabH, 6);
      } else {
        bg.fillStyle(0x1a2a3e, 0.6);
        bg.fillRoundedRect(x - tabW / 2, tabY, tabW, tabH, 6);
        bg.lineStyle(1, 0xffffff, 0.06);
        bg.strokeRoundedRect(x - tabW / 2, tabY, tabW, tabH, 6);
      }
      this.allObjects.push(bg);

      const label = this.add
        .text(x, tabY + tabH / 2, tab.label, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
          color: isActive ? '#0d0d1a' : '#8899aa',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(label);

      const hit = this.add
        .rectangle(x, tabY + tabH / 2, tabW, tabH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      hit.on('pointerdown', () => {
        if (tab.type !== this.activeTab) {
          this.activeTab = tab.type;
          this.destroyAll();
          this.showLoading();
          void this.loadLeaderboard();
        }
      });
      this.allObjects.push(hit);
    }

    const listY = tabY + Math.max(40, 52 * sf);

    if (this.entries.length === 0) {
      const empty = this.add
        .text(cx, height / 2, 'No entries yet!\nBe the first on the board.', {
          fontFamily: 'Arial',
          fontSize: `${Math.max(14, Math.round(18 * sf))}px`,
          color: '#8899aa',
          align: 'center',
          lineSpacing: 8,
        })
        .setOrigin(0.5);
      this.allObjects.push(empty);
      return;
    }

    const rowH = Math.max(32, 42 * sf);
    const tableW = Math.min(width * 0.9, 500);
    const colRank = cx - tableW * 0.42;
    const colName = cx - tableW * 0.32;
    const colMoves = cx + tableW * 0.12;
    const colTime = cx + tableW * 0.28;
    const colSolved = cx + tableW * 0.42;

    const hStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Arial',
      fontSize: `${Math.max(8, Math.round(11 * sf))}px`,
      color: '#6a7a8a',
    };

    const h1 = this.add.text(colRank, listY, '#', hStyle).setOrigin(0.5);
    const h2 = this.add.text(colName, listY, 'PLAYER', hStyle).setOrigin(0, 0.5);
    const h3 = this.add.text(colMoves, listY, 'MOVES', hStyle).setOrigin(0.5);
    const h4 = this.add.text(colTime, listY, 'TIME', hStyle).setOrigin(0.5);
    const h5 = this.add.text(colSolved, listY, 'SOLVED', hStyle).setOrigin(0.5);
    this.allObjects.push(h1, h2, h3, h4, h5);

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;
      const y = listY + Math.round(20 * sf) + i * rowH;
      const isUser = entry.userId === this.userEntry?.userId;

      const rowBg = this.add.graphics();
      if (isUser) {
        rowBg.fillStyle(0xe9c46a, 0.12);
      } else {
        rowBg.fillStyle(0x1a2a3e, i % 2 === 0 ? 0.3 : 0.15);
      }
      rowBg.fillRoundedRect(cx - tableW / 2, y - rowH / 2 + 4, tableW, rowH - 4, 6);
      if (entry.rank <= 3) {
        const glowColor = entry.rank === 1 ? 0xe9c46a : entry.rank === 2 ? 0xc0c0c0 : 0xcd7f32;
        rowBg.lineStyle(1, glowColor, 0.2);
        rowBg.strokeRoundedRect(cx - tableW / 2, y - rowH / 2 + 4, tableW, rowH - 4, 6);
      }
      this.allObjects.push(rowBg);

      const rankColor = entry.rank <= 3 ? '#e9c46a' : (isUser ? '#e9c46a' : '#ccccee');
      const medals = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'];
      const rankStr = entry.rank <= 3 ? (medals[entry.rank] ?? String(entry.rank)) : String(entry.rank);

      const r = this.add.text(colRank, y, rankStr, {
        fontFamily: 'Arial Black',
        fontSize: `${entry.rank <= 3 ? Math.max(14, Math.round(18 * sf)) : Math.max(11, Math.round(14 * sf))}px`,
        color: rankColor,
      }).setOrigin(0.5);

      const n = this.add.text(colName, y, isUser ? `${entry.username} (you)` : entry.username, {
        fontFamily: isUser ? 'Arial Black' : 'Arial',
        fontSize: `${Math.max(10, Math.round(14 * sf))}px`,
        color: isUser ? '#e9c46a' : '#e0e8f0',
      }).setOrigin(0, 0.5);

      const m = this.add.text(colMoves, y, String(entry.bestMoves), {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#2a9d8f',
      }).setOrigin(0.5);

      const t = this.add.text(colTime, y, this.formatTime(entry.bestTime), {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
        color: '#8899aa',
      }).setOrigin(0.5);

      const s = this.add.text(colSolved, y, String(entry.puzzlesSolved), {
        fontFamily: 'Arial',
        fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
        color: '#8899aa',
      }).setOrigin(0.5);

      this.allObjects.push(r, n, m, t, s);
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
}
