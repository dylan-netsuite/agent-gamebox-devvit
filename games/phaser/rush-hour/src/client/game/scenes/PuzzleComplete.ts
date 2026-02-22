import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { PuzzleConfig } from '../../../shared/types/api';
import { CATALOG_PUZZLES } from '../data/puzzles';
import { playCelebrate } from '../utils/sounds';
import { drawSceneBackground, updateSceneBlocks, type SceneBg } from '../utils/sceneBackground';

interface CompleteData {
  puzzle: PuzzleConfig;
  moves: number;
  time: number;
  stars: number;
  isDaily: boolean;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  size: number;
  color: number;
  alpha: number;
}

export class PuzzleComplete extends Scene {
  private completeData!: CompleteData;
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private sceneBg: SceneBg | null = null;
  private elapsed = 0;
  private confetti: ConfettiPiece[] = [];
  private confettiGraphics: Phaser.GameObjects.Graphics | undefined;

  constructor() {
    super('PuzzleComplete');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  init(data: CompleteData) {
    this.completeData = data;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.allObjects = [];
    this.elapsed = 0;
    this.confetti = [];
    this.buildUI();
    playCelebrate();
    this.spawnConfetti();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
    if (this.sceneBg) updateSceneBlocks(this.sceneBg.blocks, this.elapsed);
    this.updateConfetti(delta);
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    if (this.sceneBg) {
      for (const obj of this.sceneBg.objects) obj.destroy();
      this.sceneBg = null;
    }
    this.confettiGraphics = undefined;
  }

  private spawnConfetti(): void {
    const { width } = this.scale;
    const colors = [0xe63946, 0x457b9d, 0x2a9d8f, 0xe9c46a, 0xf4a261, 0x6a4c93, 0x48bfe3];
    for (let i = 0; i < 40; i++) {
      this.confetti.push({
        x: width * 0.2 + Math.random() * width * 0.6,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 80,
        vy: Math.random() * 100 + 60,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        alpha: 0.7 + Math.random() * 0.3,
      });
    }
  }

  private updateConfetti(delta: number): void {
    if (!this.confettiGraphics) return;
    const g = this.confettiGraphics;
    g.clear();
    const dt = delta / 1000;
    const { height } = this.scale;

    for (const c of this.confetti) {
      c.x += c.vx * dt;
      c.vy += 40 * dt;
      c.y += c.vy * dt;
      c.rot += c.rotSpeed * dt;
      c.vx *= 0.99;

      if (c.y > height + 20) {
        c.alpha = 0;
        continue;
      }

      g.save();
      g.translateCanvas(c.x, c.y);
      g.rotateCanvas(c.rot);
      g.fillStyle(c.color, c.alpha);
      g.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      g.restore();
    }
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = this.sf;

    this.sceneBg = drawSceneBackground(this, width, height);

    this.confettiGraphics = this.add.graphics();
    this.allObjects.push(this.confettiGraphics);

    const titleY = height * 0.1;
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0x2a9d8f, 0.25);
    titleGlow.fillEllipse(cx, titleY, 300 * sf, 60 * sf);
    this.allObjects.push(titleGlow);

    const title = this.add
      .text(cx, titleY, 'PUZZLE COMPLETE!', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${Math.max(22, Math.round(36 * sf))}px`,
        color: '#2a9d8f',
        align: 'center',
        stroke: '#1a5c54',
        strokeThickness: 1,
        shadow: { offsetX: 0, offsetY: 0, color: '#2a9d8f', blur: 20, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.7);
    this.allObjects.push(title);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    const starStr = '★'.repeat(this.completeData.stars) + '☆'.repeat(3 - this.completeData.stars);
    const starsText = this.add
      .text(cx, height * 0.2, starStr, {
        fontFamily: 'Arial',
        fontSize: `${Math.max(28, Math.round(48 * sf))}px`,
        color: '#e9c46a',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#e9c46a', blur: 12, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.5);
    this.allObjects.push(starsText);

    this.tweens.add({
      targets: starsText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      delay: 200,
      ease: 'Back.easeOut',
    });

    const puzzleName = this.add
      .text(cx, height * 0.28, this.completeData.puzzle.name, {
        fontFamily: 'Arial Black',
        fontSize: `${Math.max(16, Math.round(24 * sf))}px`,
        color: '#e0e8f0',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(puzzleName);

    const statsY = height * 0.36;
    const statsGap = Math.max(28, 40 * sf);
    const statCardW = Math.min(width * 0.7, 300);
    const statCardH = Math.max(24, 32 * sf);

    const stats = [
      { label: 'MOVES', value: `${this.completeData.moves}`, sub: `min: ${this.completeData.puzzle.minMoves}` },
      { label: 'TIME', value: this.formatTime(this.completeData.time), sub: '' },
      { label: 'RATING', value: `${this.completeData.stars}/3`, sub: this.getRatingLabel() },
    ];

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i]!;
      const y = statsY + i * statsGap;

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a2a3e, 0.5);
      cardBg.fillRoundedRect(cx - statCardW / 2, y - statCardH / 2, statCardW, statCardH, 6);
      cardBg.lineStyle(1, 0xffffff, 0.06);
      cardBg.strokeRoundedRect(cx - statCardW / 2, y - statCardH / 2, statCardW, statCardH, 6);
      this.allObjects.push(cardBg);

      const label = this.add
        .text(cx - statCardW / 2 + 16, y, stat.label, {
          fontFamily: 'Arial',
          fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
          color: '#8899aa',
        })
        .setOrigin(0, 0.5);
      this.allObjects.push(label);

      const value = this.add
        .text(cx, y, stat.value, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(14, Math.round(18 * sf))}px`,
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5);
      this.allObjects.push(value);

      if (stat.sub) {
        const sub = this.add
          .text(cx + statCardW / 2 - 16, y, stat.sub, {
            fontFamily: 'Arial',
            fontSize: `${Math.max(9, Math.round(11 * sf))}px`,
            color: '#6a7a8a',
            fontStyle: 'italic',
          })
          .setOrigin(1, 0.5);
        this.allObjects.push(sub);
      }
    }

    const btnY = height * 0.58;
    const btnW = Math.min(width * 0.6, 260);
    const btnH = Math.max(36, 48 * sf);
    const btnGap = Math.max(10, 16 * sf);
    const accentW = 5;

    const buttons: { label: string; color: number; action: () => void }[] = [];

    if (!this.completeData.isDaily) {
      const nextPuzzle = this.getNextPuzzle();
      if (nextPuzzle) {
        buttons.push({
          label: 'NEXT PUZZLE ▶',
          color: 0x2a9d8f,
          action: () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
              this.scene.start('Game', { puzzle: nextPuzzle, isDaily: false });
            });
          },
        });
      }
    }

    buttons.push({
      label: 'REPLAY',
      color: 0x457b9d,
      action: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('Game', { puzzle: this.completeData.puzzle, isDaily: this.completeData.isDaily });
        });
      },
    });

    buttons.push({
      label: 'MAIN MENU',
      color: 0x6a4c93,
      action: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('MainMenu');
        });
      },
    });

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]!;
      const y = btnY + i * (btnH + btnGap);

      const container = this.add.container(cx, y + btnH / 2);
      container.setAlpha(0);
      this.allObjects.push(container);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a2a3e, 0.7);
      cardBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      cardBg.lineStyle(1, 0xffffff, 0.08);
      cardBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 10);
      container.add(cardBg);

      const accent = this.add.graphics();
      accent.fillStyle(btn.color, 0.9);
      accent.fillRoundedRect(-btnW / 2, -btnH / 2, accentW, btnH, { tl: 10, bl: 10, tr: 0, br: 0 });
      container.add(accent);

      const label = this.add
        .text(0, 0, btn.label, {
          fontFamily: 'Arial Black',
          fontSize: `${Math.max(12, Math.round(16 * sf))}px`,
          color: '#e0e8f0',
          align: 'center',
        })
        .setOrigin(0.5);
      container.add(label);

      const hit = this.add
        .rectangle(0, 0, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      container.add(hit);

      hit.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 120, ease: 'Power2' });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
      });
      hit.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scaleX: 0.97, scaleY: 0.97,
          duration: 80, yoyo: true, ease: 'Power2',
          onComplete: btn.action,
        });
      });

      this.tweens.add({
        targets: container,
        alpha: 1,
        x: { from: cx + 50, to: cx },
        duration: 350,
        delay: 400 + i * 100,
        ease: 'Power3',
      });
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  private getRatingLabel(): string {
    if (this.completeData.stars === 3) return 'Perfect!';
    if (this.completeData.stars === 2) return 'Great!';
    return 'Completed';
  }

  private getNextPuzzle(): PuzzleConfig | null {
    const idx = CATALOG_PUZZLES.findIndex((p) => p.id === this.completeData.puzzle.id);
    if (idx >= 0 && idx < CATALOG_PUZZLES.length - 1) {
      return CATALOG_PUZZLES[idx + 1] ?? null;
    }
    return null;
  }
}
