import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { transitionTo, fadeIn, SCENE_COLORS } from '../utils/transitions';

interface FloatingBlock {
  graphics: Phaser.GameObjects.Graphics;
  baseX: number;
  baseY: number;
  baseRot: number;
  w: number;
  h: number;
  color: number;
  alpha: number;
  phase: number;
  speed: number;
}

export class MainMenu extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private blocks: FloatingBlock[] = [];
  private titleText: Phaser.GameObjects.Text | undefined;
  private titleGlow: Phaser.GameObjects.Graphics | undefined;
  private elapsed = 0;

  constructor() {
    super('MainMenu');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    fadeIn(this, SCENE_COLORS.dark);
    this.allObjects = [];
    this.blocks = [];
    this.elapsed = 0;
    this.buildUI();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.blocks = [];
      this.buildUI();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
    this.updateBlocks();
    this.updateTitleFloat();
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    this.titleText = undefined;
    this.titleGlow = undefined;
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = this.sf;

    this.drawBackground(width, height);
    this.drawScatteredBlocks(width, height);
    this.drawVignette(width, height);
    this.drawTitle(cx, height, sf);
    this.drawButtons(cx, width, height, sf);
  }

  private drawBackground(w: number, h: number): void {
    const bg = this.add.graphics();

    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1, 1, 1, 1);
    bg.fillRect(0, 0, w, h);

    bg.fillStyle(0xe63946, 0.06);
    bg.fillEllipse(w * 0.5, h * 0.25, w * 0.8, h * 0.5);

    bg.fillStyle(0x457b9d, 0.04);
    bg.fillEllipse(w * 0.3, h * 0.7, w * 0.5, h * 0.35);

    bg.fillStyle(0x6a4c93, 0.03);
    bg.fillEllipse(w * 0.8, h * 0.6, w * 0.4, h * 0.3);

    this.allObjects.push(bg);
  }

  private drawScatteredBlocks(w: number, h: number): void {
    const colors = [0xe63946, 0x457b9d, 0x2a9d8f, 0xe9c46a, 0xf4a261, 0x6a4c93, 0x48bfe3];
    const unit = Math.min(w, h) * 0.04;

    const blockDefs = [
      { x: 0.06, y: 0.06, rot: -15, type: 'car' },
      { x: 0.85, y: 0.04, rot: 10, type: 'truck' },
      { x: 0.92, y: 0.25, rot: -20, type: 'carV' },
      { x: 0.03, y: 0.35, rot: 18, type: 'truck' },
      { x: 0.88, y: 0.50, rot: -8, type: 'car' },
      { x: 0.08, y: 0.62, rot: 22, type: 'carV' },
      { x: 0.80, y: 0.72, rot: -14, type: 'truckV' },
      { x: 0.15, y: 0.85, rot: 8, type: 'car' },
      { x: 0.65, y: 0.90, rot: -18, type: 'car' },
      { x: 0.40, y: 0.03, rot: 5, type: 'truck' },
      { x: 0.93, y: 0.68, rot: 14, type: 'carV' },
      { x: 0.50, y: 0.92, rot: -6, type: 'car' },
      { x: 0.02, y: 0.82, rot: 12, type: 'truckV' },
      { x: 0.75, y: 0.15, rot: -10, type: 'car' },
    ];

    for (let i = 0; i < blockDefs.length; i++) {
      const def = blockDefs[i]!;
      const color = colors[i % colors.length]!;
      const alpha = 0.12 + Math.random() * 0.1;

      let bw: number, bh: number;
      switch (def.type) {
        case 'car': bw = unit * 2; bh = unit; break;
        case 'truck': bw = unit * 3; bh = unit; break;
        case 'carV': bw = unit; bh = unit * 2; break;
        case 'truckV': bw = unit; bh = unit * 3; break;
        default: bw = unit * 2; bh = unit;
      }

      const bx = def.x * w;
      const by = def.y * h;

      const g = this.add.graphics();
      g.fillStyle(color, alpha);
      g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, Math.min(bw, bh) * 0.2);

      g.lineStyle(1, 0xffffff, alpha * 0.3);
      g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, Math.min(bw, bh) * 0.2);

      g.setPosition(bx, by);
      g.setRotation((def.rot * Math.PI) / 180);
      this.allObjects.push(g);

      this.blocks.push({
        graphics: g,
        baseX: bx,
        baseY: by,
        baseRot: (def.rot * Math.PI) / 180,
        w: bw,
        h: bh,
        color,
        alpha,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
      });
    }
  }

  private updateBlocks(): void {
    const t = this.elapsed / 1000;
    for (const b of this.blocks) {
      const yOff = Math.sin(t * b.speed + b.phase) * 6;
      const xOff = Math.cos(t * b.speed * 0.7 + b.phase) * 3;
      const rotOff = Math.sin(t * b.speed * 0.5 + b.phase) * 0.03;

      b.graphics.setPosition(b.baseX + xOff, b.baseY + yOff);
      b.graphics.setRotation(b.baseRot + rotOff);
    }
  }

  private drawVignette(w: number, h: number): void {
    const edgeSize = Math.max(w, h) * 0.4;

    const top = this.add.graphics();
    top.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.35, 0.35, 0, 0);
    top.fillRect(0, 0, w, edgeSize);
    this.allObjects.push(top);

    const bottom = this.add.graphics();
    bottom.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.4, 0.4);
    bottom.fillRect(0, h - edgeSize, w, edgeSize);
    this.allObjects.push(bottom);

    const left = this.add.graphics();
    left.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3, 0, 0.3, 0);
    left.fillRect(0, 0, edgeSize, h);
    this.allObjects.push(left);

    const right = this.add.graphics();
    right.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.3, 0, 0.3);
    right.fillRect(w - edgeSize, 0, edgeSize, h);
    this.allObjects.push(right);
  }

  private updateTitleFloat(): void {
    if (!this.titleText || !this.titleGlow) return;
    const t = this.elapsed / 1000;
    const yOff = Math.sin(t * 0.8) * 3;
    const scaleOff = 1 + Math.sin(t * 0.6) * 0.015;

    this.titleText.setY(this.titleText.getData('baseY') + yOff);
    this.titleText.setScale(scaleOff);

    this.titleGlow.setAlpha(0.5 + Math.sin(t * 1.2) * 0.25);
  }

  private drawTitle(cx: number, h: number, sf: number): void {
    const titleY = h * 0.1;
    const fontSize = Math.max(28, Math.round(48 * sf));

    const glow = this.add.graphics();
    glow.fillStyle(0xe63946, 0.3);
    glow.fillEllipse(cx, titleY, 300 * sf, 80 * sf);
    this.titleGlow = glow;
    this.allObjects.push(glow);

    const title = this.add
      .text(cx, titleY, 'RUSH HOUR', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#ff6b6b',
        align: 'center',
        stroke: '#8b1a1a',
        strokeThickness: 2,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#e63946',
          blur: 24,
          fill: false,
          stroke: true,
        },
      })
      .setOrigin(0.5);
    title.setData('baseY', titleY);
    this.titleText = title;
    this.allObjects.push(title);

    const subtitle = this.add
      .text(cx, titleY + fontSize * 0.7, 'Slide vehicles to free the red car!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(11, Math.round(15 * sf))}px`,
        color: '#8899aa',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.allObjects.push(subtitle);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      y: subtitle.y,
      duration: 600,
      delay: 200,
      ease: 'Power2',
    });
  }

  private drawButtons(cx: number, w: number, h: number, sf: number): void {
    const buttons = [
      { label: 'PUZZLE CATALOG', scene: 'PuzzleSelect', color: 0x457b9d, icon: '📋' },
      { label: 'DAILY PUZZLE', scene: 'DailyPuzzle', color: 0xe9c46a, icon: '📅' },
      { label: 'LEADERBOARD', scene: 'LeaderboardScene', color: 0x2a9d8f, icon: '🏆' },
      { label: 'CREATE PUZZLE', scene: 'PuzzleEditor', color: 0x6a4c93, icon: '✏️' },
    ];

    const btnW = Math.min(w * 0.75, 340);
    const btnH = Math.max(38, Math.round(50 * sf));
    const gap = Math.max(8, Math.round(12 * sf));
    const totalH = buttons.length * btnH + (buttons.length - 1) * gap;
    const startY = h * 0.22 + (h * 0.6 - totalH) / 2;
    const accentW = 5;
    const iconSize = Math.max(16, Math.round(22 * sf));
    const labelSize = Math.max(13, Math.round(18 * sf));

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]!;
      const y = startY + i * (btnH + gap);

      const container = this.add.container(cx, y + btnH / 2);
      container.setAlpha(0);
      this.allObjects.push(container);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1a2a3e, 0.7);
      cardBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      cardBg.lineStyle(1, 0xffffff, 0.08);
      cardBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
      container.add(cardBg);

      const accent = this.add.graphics();
      accent.fillStyle(btn.color, 0.9);
      accent.fillRoundedRect(-btnW / 2, -btnH / 2, accentW, btnH, { tl: 12, bl: 12, tr: 0, br: 0 });
      container.add(accent);

      const topHighlight = this.add.graphics();
      topHighlight.lineStyle(1, 0xffffff, 0.06);
      topHighlight.beginPath();
      topHighlight.arc(-btnW / 2 + 12, -btnH / 2 + 12, 12, Math.PI, Math.PI * 1.5);
      topHighlight.lineTo(btnW / 2 - 12, -btnH / 2);
      topHighlight.arc(btnW / 2 - 12, -btnH / 2 + 12, 12, Math.PI * 1.5, 0);
      topHighlight.strokePath();
      container.add(topHighlight);

      const icon = this.add
        .text(-btnW / 2 + accentW + 16, 0, btn.icon, {
          fontSize: `${iconSize}px`,
        })
        .setOrigin(0, 0.5);
      container.add(icon);

      const label = this.add
        .text(-btnW / 2 + accentW + 16 + iconSize + 12, 0, btn.label, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${labelSize}px`,
          color: '#e0e8f0',
          align: 'left',
        })
        .setOrigin(0, 0.5);
      container.add(label);

      const chevron = this.add
        .text(btnW / 2 - 20, 0, '›', {
          fontFamily: 'Arial',
          fontSize: `${Math.round(labelSize * 1.4)}px`,
          color: '#556677',
        })
        .setOrigin(0.5);
      container.add(chevron);

      const hitArea = this.add
        .rectangle(0, 0, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      container.add(hitArea);

      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 150,
          ease: 'Power2',
        });
        cardBg.clear();
        cardBg.fillStyle(0x243a52, 0.85);
        cardBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
        cardBg.lineStyle(1, 0xffffff, 0.15);
        cardBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

        accent.clear();
        accent.fillStyle(btn.color, 1);
        accent.fillRoundedRect(-btnW / 2, -btnH / 2, accentW + 2, btnH, { tl: 12, bl: 12, tr: 0, br: 0 });

        chevron.setColor('#8899aa');
      });

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power2',
        });
        cardBg.clear();
        cardBg.fillStyle(0x1a2a3e, 0.7);
        cardBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
        cardBg.lineStyle(1, 0xffffff, 0.08);
        cardBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);

        accent.clear();
        accent.fillStyle(btn.color, 0.9);
        accent.fillRoundedRect(-btnW / 2, -btnH / 2, accentW, btnH, { tl: 12, bl: 12, tr: 0, br: 0 });

        chevron.setColor('#556677');
      });

      hitArea.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scaleX: 0.97,
          scaleY: 0.97,
          duration: 80,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            const colorMap: Record<string, number> = {
              PuzzleSelect: SCENE_COLORS.teal,
              DailyPuzzle: SCENE_COLORS.gold,
              LeaderboardScene: SCENE_COLORS.gold,
              PuzzleEditor: SCENE_COLORS.purple,
            };
            transitionTo(this, btn.scene, undefined, colorMap[btn.scene] ?? SCENE_COLORS.dark);
          },
        });
      });

      this.tweens.add({
        targets: container,
        alpha: 1,
        x: { from: cx + 60, to: cx },
        duration: 400,
        delay: 100 + i * 100,
        ease: 'Power3',
      });
    }
  }
}
