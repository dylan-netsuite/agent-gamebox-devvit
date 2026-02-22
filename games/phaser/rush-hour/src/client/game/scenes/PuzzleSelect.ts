import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { CATALOG_PUZZLES } from '../data/puzzles';
import type { Difficulty, PuzzleBest, PuzzleConfig } from '../../../shared/types/api';
import { drawSceneBackground, updateSceneBlocks, type SceneBg } from '../utils/sceneBackground';

const DIFFICULTY_COLORS: Record<Difficulty, number> = {
  beginner: 0x2a9d8f,
  intermediate: 0x457b9d,
  advanced: 0xe9c46a,
  expert: 0xe63946,
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
};

export class PuzzleSelect extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private selectedDifficulty: Difficulty = 'beginner';
  private scrollY = 0;
  private progress: Record<string, PuzzleBest> = {};
  private sceneBg: SceneBg | null = null;
  private elapsed = 0;

  constructor() {
    super('PuzzleSelect');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.allObjects = [];
    this.scrollY = 0;
    this.elapsed = 0;
    this.buildUI();
    void this.loadProgress();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
    if (this.sceneBg) updateSceneBlocks(this.sceneBg.blocks, this.elapsed);
  }

  private async loadProgress(): Promise<void> {
    try {
      const res = await fetch('/api/puzzle-progress');
      const data = await res.json();
      if (data.success && data.progress) {
        this.progress = data.progress;
        this.destroyAll();
        this.buildUI();
      }
    } catch {
      // use empty progress
    }
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
        fontSize: `${Math.max(11, Math.round(16 * sf))}px`,
        color: '#e63946',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('MainMenu');
        });
      });
    this.allObjects.push(back);

    const titleY = Math.max(20, 30 * sf);
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0x2a9d8f, 0.2);
    titleGlow.fillEllipse(cx, titleY, 260 * sf, 50 * sf);
    this.allObjects.push(titleGlow);

    const title = this.add
      .text(cx, titleY, 'PUZZLE CATALOG', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.max(18, Math.round(28 * sf))}px`,
        color: '#ffffff',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#2a9d8f', blur: 16, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    const tabY = Math.max(50, 70 * sf);
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const tabW = Math.min((width - 40) / 4, 120);
    const tabH = Math.max(24, 32 * sf);

    for (let i = 0; i < difficulties.length; i++) {
      const diff = difficulties[i]!;
      const x = cx - (difficulties.length * tabW) / 2 + i * tabW + tabW / 2;
      const isSelected = diff === this.selectedDifficulty;

      const tabBg = this.add.graphics();
      if (isSelected) {
        tabBg.fillStyle(DIFFICULTY_COLORS[diff]!, 0.85);
        tabBg.fillRoundedRect(x - tabW / 2 + 2, tabY, tabW - 4, tabH, 6);
        tabBg.lineStyle(1, 0xffffff, 0.15);
        tabBg.strokeRoundedRect(x - tabW / 2 + 2, tabY, tabW - 4, tabH, 6);
      } else {
        tabBg.fillStyle(0x1a2a3e, 0.6);
        tabBg.fillRoundedRect(x - tabW / 2 + 2, tabY, tabW - 4, tabH, 6);
        tabBg.lineStyle(1, 0xffffff, 0.06);
        tabBg.strokeRoundedRect(x - tabW / 2 + 2, tabY, tabW - 4, tabH, 6);
      }
      this.allObjects.push(tabBg);

      const tabLabel = this.add
        .text(x, tabY + tabH / 2, DIFFICULTY_LABELS[diff]!, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(7, Math.round(10 * sf))}px`,
          color: isSelected ? '#ffffff' : '#8899aa',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(tabLabel);

      const tabHit = this.add
        .rectangle(x, tabY + tabH / 2, tabW - 4, tabH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      tabHit.on('pointerdown', () => {
        this.selectedDifficulty = diff;
        this.scrollY = 0;
        this.destroyAll();
        this.buildUI();
      });
      this.allObjects.push(tabHit);
    }

    const puzzles = CATALOG_PUZZLES.filter((p) => p.difficulty === this.selectedDifficulty);
    const listY = tabY + Math.max(40, 50 * sf);
    const cardH = Math.max(50, 70 * sf);
    const cardGap = Math.max(6, 10 * sf);
    const cardW = Math.min(width * 0.85, 400);

    for (let i = 0; i < puzzles.length; i++) {
      const puzzle = puzzles[i]!;
      const y = listY + i * (cardH + cardGap) + this.scrollY;

      if (y + cardH < listY || y > height) continue;

      this.drawPuzzleCard(puzzle, cx, y, cardW, cardH, i + 1, i);
    }
  }

  private drawPuzzleCard(
    puzzle: PuzzleConfig,
    cx: number,
    y: number,
    w: number,
    h: number,
    num: number,
    index: number
  ): void {
    const sf = this.sf;
    const best = this.progress[puzzle.id];
    const accentColor = DIFFICULTY_COLORS[puzzle.difficulty]!;
    const accentW = 5;

    const container = this.add.container(cx, y + h / 2);
    container.setAlpha(0);
    this.allObjects.push(container);

    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x1a2a3e, 0.7);
    cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    cardBg.lineStyle(1, 0xffffff, 0.08);
    cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    container.add(cardBg);

    const accent = this.add.graphics();
    accent.fillStyle(accentColor, best ? 0.9 : 0.6);
    accent.fillRoundedRect(-w / 2, -h / 2, accentW, h, { tl: 10, bl: 10, tr: 0, br: 0 });
    container.add(accent);

    const numText = this.add
      .text(-w / 2 + accentW + 14, 0, `#${num}`, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(14, Math.round(22 * sf))}px`,
        color: Phaser.Display.Color.IntegerToColor(accentColor).rgba,
      })
      .setOrigin(0, 0.5);
    container.add(numText);

    const nameText = this.add
      .text(-w / 2 + accentW + 54, -h * 0.15, puzzle.name, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(12, Math.round(18 * sf))}px`,
        color: '#e0e8f0',
      })
      .setOrigin(0, 0.5);
    container.add(nameText);

    let infoStr = `Min moves: ${puzzle.minMoves}  •  ${puzzle.vehicles.length} vehicles`;
    if (best) {
      infoStr = `Best: ${best.bestMoves} moves  •  ${this.formatTime(best.bestTime)}`;
    }

    const infoText = this.add
      .text(-w / 2 + accentW + 54, h * 0.15, infoStr, {
        fontFamily: 'Arial',
        fontSize: `${Math.max(9, Math.round(12 * sf))}px`,
        color: best ? '#aabbcc' : '#8899aa',
      })
      .setOrigin(0, 0.5);
    container.add(infoText);

    if (best) {
      const starStr = '★'.repeat(best.stars) + '☆'.repeat(3 - best.stars);
      const starText = this.add
        .text(w / 2 - 16, 0, starStr, {
          fontFamily: 'Arial',
          fontSize: `${Math.max(12, Math.round(16 * sf))}px`,
          color: '#e9c46a',
        })
        .setOrigin(1, 0.5);
      container.add(starText);
    } else {
      const playBtn = this.add
        .text(w / 2 - 16, 0, 'PLAY ▶', {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
          color: '#e63946',
        })
        .setOrigin(1, 0.5);
      container.add(playBtn);
    }

    const hitArea = this.add
      .rectangle(0, 0, w, h)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.02, scaleY: 1.02, duration: 120, ease: 'Power2' });
      cardBg.clear();
      cardBg.fillStyle(0x243a52, 0.85);
      cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      cardBg.lineStyle(1, 0xffffff, 0.15);
      cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
      cardBg.clear();
      cardBg.fillStyle(0x1a2a3e, 0.7);
      cardBg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      cardBg.lineStyle(1, 0xffffff, 0.08);
      cardBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.97, scaleY: 0.97,
        duration: 80, yoyo: true, ease: 'Power2',
        onComplete: () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game', { puzzle, isDaily: false });
          });
        },
      });
    });

    this.tweens.add({
      targets: container,
      alpha: 1,
      x: { from: cx + 40, to: cx },
      duration: 350,
      delay: 80 + index * 60,
      ease: 'Power3',
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
}
