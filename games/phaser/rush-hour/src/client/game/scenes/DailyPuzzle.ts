import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import type { PuzzleConfig } from '../../../shared/types/api';
import { getDailyPuzzle } from '../data/puzzles';
import { drawSceneBackground, updateSceneBlocks, type SceneBg } from '../utils/sceneBackground';

export class DailyPuzzle extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private sceneBg: SceneBg | null = null;
  private elapsed = 0;
  private loadingText: Phaser.GameObjects.Text | undefined;

  constructor() {
    super('DailyPuzzle');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.allObjects = [];
    this.elapsed = 0;

    const { width, height } = this.scale;
    this.sceneBg = drawSceneBackground(this, width, height);

    this.showLoading();
    void this.loadDaily();

    this.scale.on('resize', () => {
      this.destroyAll();
      const s = this.scale;
      this.sceneBg = drawSceneBackground(this, s.width, s.height);
      this.showLoading();
      void this.loadDaily();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
    if (this.sceneBg) updateSceneBlocks(this.sceneBg.blocks, this.elapsed);
    if (this.loadingText) {
      this.loadingText.setAlpha(0.5 + Math.sin(this.elapsed / 400) * 0.4);
    }
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    if (this.sceneBg) {
      for (const obj of this.sceneBg.objects) obj.destroy();
      this.sceneBg = null;
    }
    this.loadingText = undefined;
  }

  private showLoading(): void {
    const { width, height } = this.scale;
    const t = this.add
      .text(width / 2, height / 2, 'Loading daily puzzle...', {
        fontFamily: 'Arial',
        fontSize: `${Math.max(14, Math.round(20 * this.sf))}px`,
        color: '#e9c46a',
        align: 'center',
        shadow: { offsetX: 0, offsetY: 0, color: '#e9c46a', blur: 12, fill: false, stroke: true },
      })
      .setOrigin(0.5);
    this.loadingText = t;
    this.allObjects.push(t);
  }

  private async loadDaily(): Promise<void> {
    let puzzle: PuzzleConfig;

    try {
      const res = await fetch('/api/daily-puzzle');
      const data = await res.json() as { success: boolean; puzzle?: PuzzleConfig };
      if (data.success && data.puzzle) {
        puzzle = data.puzzle;
      } else {
        puzzle = getDailyPuzzle();
      }
    } catch {
      puzzle = getDailyPuzzle();
    }

    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Game', { puzzle, isDaily: true });
    });
  }
}
