import * as Phaser from 'phaser';
import type { Worm } from '../entities/Worm';
import { TEAM_COLORS } from '../../../shared/types/game';

const PANEL_W = 130;
const ROW_H = 22;
const PAD = 6;
const BAR_W = 70;
const BAR_H = 8;
const BG_COLOR = 0x0f1923;
const BG_ALPHA = 0.75;

export class TeamPanel {
  private container: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private rows: { dot: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }[] = [];
  private numTeams: number;
  private getWorms: () => Worm[];
  private getActiveTeam: () => number;

  constructor(
    scene: Phaser.Scene,
    numTeams: number,
    getWorms: () => Worm[],
    getActiveTeam: () => number,
  ) {
    this.numTeams = numTeams;
    this.getWorms = getWorms;
    this.getActiveTeam = getActiveTeam;

    const panelH = PAD + numTeams * ROW_H + PAD;
    this.container = scene.add.container(8, 8).setDepth(200).setScrollFactor(0);

    this.gfx = scene.add.graphics();
    this.gfx.fillStyle(BG_COLOR, BG_ALPHA);
    this.gfx.fillRoundedRect(0, 0, PANEL_W, panelH, 6);
    this.gfx.lineStyle(1, 0x2a3a4a, 0.5);
    this.gfx.strokeRoundedRect(0, 0, PANEL_W, panelH, 6);
    this.container.add(this.gfx);

    for (let t = 0; t < numTeams; t++) {
      const y = PAD + t * ROW_H;
      const colorHex = parseInt((TEAM_COLORS[t] ?? '#ffffff').replace('#', ''), 16);

      const dot = scene.add.graphics();
      dot.fillStyle(colorHex, 1);
      dot.fillCircle(PAD + 5, y + ROW_H / 2, 5);
      this.container.add(dot);

      const text = scene.add
        .text(PANEL_W - PAD, y + ROW_H / 2, '', {
          fontSize: '10px',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          color: '#e6edf3',
        })
        .setOrigin(1, 0.5);
      this.container.add(text);

      this.rows.push({ dot, text });
    }
  }

  update(): void {
    const worms = this.getWorms();
    const activeTeam = this.getActiveTeam();

    this.gfx.clear();
    const panelH = PAD + this.numTeams * ROW_H + PAD;
    this.gfx.fillStyle(BG_COLOR, BG_ALPHA);
    this.gfx.fillRoundedRect(0, 0, PANEL_W, panelH, 6);
    this.gfx.lineStyle(1, 0x2a3a4a, 0.5);
    this.gfx.strokeRoundedRect(0, 0, PANEL_W, panelH, 6);

    for (let t = 0; t < this.numTeams; t++) {
      const row = this.rows[t];
      if (!row) continue;

      const y = PAD + t * ROW_H;
      const colorHex = parseInt((TEAM_COLORS[t] ?? '#ffffff').replace('#', ''), 16);
      let totalHP = 0;
      let maxHP = 0;
      for (const w of worms) {
        if (w.team === t) {
          totalHP += w.alive ? w.health : 0;
          maxHP += w.maxHealth;
        }
      }
      const frac = maxHP > 0 ? totalHP / maxHP : 0;

      row.dot.clear();
      row.dot.fillStyle(colorHex, t === activeTeam ? 1 : 0.5);
      row.dot.fillCircle(PAD + 5, y + ROW_H / 2, t === activeTeam ? 6 : 4);
      if (t === activeTeam) {
        row.dot.lineStyle(1, 0xffffff, 0.8);
        row.dot.strokeCircle(PAD + 5, y + ROW_H / 2, 6);
      }

      const barX = PAD + 16;
      const barY = y + (ROW_H - BAR_H) / 2;
      this.gfx.fillStyle(0x1a2a3a, 1);
      this.gfx.fillRoundedRect(barX, barY, BAR_W, BAR_H, 3);

      const barColor = frac > 0.5 ? 0x4caf50 : frac > 0.25 ? 0xffc107 : 0xf44336;
      if (frac > 0) {
        this.gfx.fillStyle(barColor, 1);
        this.gfx.fillRoundedRect(barX, barY, Math.max(3, BAR_W * frac), BAR_H, 3);
      }

      row.text.setText(`${totalHP}`);
    }
  }

  reposition(cam: Phaser.Cameras.Scene2D.Camera): void {
    const invZ = 1 / cam.zoom;
    this.container.setScale(invZ);
    this.container.setPosition(8 * invZ, 8 * invZ);
  }

  destroy(): void {
    this.container.destroy();
  }
}
