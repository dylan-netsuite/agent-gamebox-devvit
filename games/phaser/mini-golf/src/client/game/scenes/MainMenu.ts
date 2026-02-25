import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';

export class MainMenu extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private elapsed = 0;
  private titleText: Phaser.GameObjects.Text | undefined;
  private titleGlow: Phaser.GameObjects.Graphics | undefined;

  constructor() {
    super('MainMenu');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x14381f);
    fadeIn(this, SCENE_COLORS.dark);
    this.allObjects = [];
    this.elapsed = 0;
    this.buildUI();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  override update(_time: number, delta: number) {
    this.elapsed += delta;
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
    this.drawDecorations(width, height);
    this.drawTitle(cx, height, sf);
    this.drawButtons(cx, width, height, sf);
  }

  private drawBackground(w: number, h: number): void {
    const bg = this.add.tileSprite(w / 2, h / 2, w, h, 'grass-bg');
    bg.setDepth(0);
    this.allObjects.push(bg);

    const vig = this.add.image(w / 2, h / 2, 'vignette');
    vig.setDisplaySize(w, h);
    vig.setDepth(1);
    this.allObjects.push(vig);
  }

  private drawDecorations(w: number, h: number): void {
    const swirlPositions = [
      { x: 0.08, y: 0.12 },
      { x: 0.92, y: 0.15 },
      { x: 0.05, y: 0.65 },
      { x: 0.88, y: 0.72 },
      { x: 0.4, y: 0.06 },
    ];

    for (const pos of swirlPositions) {
      const img = this.add.image(pos.x * w, pos.y * h, 'candy-cane-corner');
      const scale = (18 + Math.random() * 14) / img.width;
      img.setScale(scale);
      img.setDepth(2);
      img.setAlpha(0.5 + Math.random() * 0.3);
      this.allObjects.push(img);
    }

    const sparklePositions = [
      { x: 0.85, y: 0.08 },
      { x: 0.15, y: 0.85 },
      { x: 0.7, y: 0.9 },
      { x: 0.92, y: 0.4 },
    ];

    for (const pos of sparklePositions) {
      const sp = this.add.image(pos.x * w, pos.y * h, 'sparkle');
      sp.setDepth(2);
      sp.setScale(0.3 + Math.random() * 0.3);
      sp.setAlpha(0);
      this.allObjects.push(sp);

      this.tweens.add({
        targets: sp,
        alpha: { from: 0, to: 0.5 + Math.random() * 0.4 },
        scaleX: { from: sp.scaleX * 0.5, to: sp.scaleX },
        scaleY: { from: sp.scaleY * 0.5, to: sp.scaleY },
        duration: 1500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
        ease: 'Sine.easeInOut',
      });
    }
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
    const titleY = h * 0.12;
    const fontSize = Math.max(28, Math.round(52 * sf));

    const glow = this.add.graphics();
    glow.fillStyle(0xff69b4, 0.25);
    glow.fillEllipse(cx, titleY, 320 * sf, 90 * sf);
    glow.setDepth(3);
    this.titleGlow = glow;
    this.allObjects.push(glow);

    const title = this.add
      .text(cx, titleY, 'MINI GOLF', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#ff69b4',
        align: 'center',
        stroke: '#8b0a50',
        strokeThickness: 3,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#ff1493',
          blur: 24,
          fill: false,
          stroke: true,
        },
      })
      .setOrigin(0.5)
      .setDepth(4);
    title.setData('baseY', titleY);
    this.titleText = title;
    this.allObjects.push(title);

    const subtitle = this.add
      .text(cx, titleY + fontSize * 0.65, 'Sugar Rush Retro Invitational', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(11, Math.round(14 * sf))}px`,
        color: '#8fbfa0',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(4);
    this.allObjects.push(subtitle);

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 600,
      delay: 200,
      ease: 'Power2',
    });
  }

  private drawButtons(cx: number, w: number, h: number, sf: number): void {
    const buttons = [
      { label: 'PLAY 18 HOLES', scene: 'Game', color: 0xff69b4, data: { holeIndex: 0, scores: [] } },
      { label: 'LEADERBOARD', scene: 'Scorecard', color: 0xffd700, data: { scores: [], viewOnly: true } },
    ];

    const btnW = Math.min(w * 0.7, 320);
    const btnH = Math.max(44, Math.round(56 * sf));
    const gap = Math.max(12, Math.round(16 * sf));
    const totalH = buttons.length * btnH + (buttons.length - 1) * gap;
    const startY = h * 0.3 + (h * 0.5 - totalH) / 2;
    const labelSize = Math.max(15, Math.round(20 * sf));

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i]!;
      const y = startY + i * (btnH + gap);

      const container = this.add.container(cx, y + btnH / 2);
      container.setAlpha(0);
      container.setDepth(10);
      this.allObjects.push(container);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0d3320, 0.8);
      cardBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
      cardBg.lineStyle(2, btn.color, 0.4);
      cardBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 14);
      container.add(cardBg);

      const label = this.add
        .text(0, 0, btn.label, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${labelSize}px`,
          color: '#e0e8f0',
          align: 'center',
        })
        .setOrigin(0.5);
      container.add(label);

      const hitArea = this.add
        .rectangle(0, 0, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      container.add(hitArea);

      hitArea.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.04,
          scaleY: 1.04,
          duration: 150,
          ease: 'Power2',
        });
      });

      hitArea.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power2',
        });
      });

      hitArea.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scaleX: 0.96,
          scaleY: 0.96,
          duration: 80,
          yoyo: true,
          ease: 'Power2',
          onComplete: () => {
            transitionTo(this, btn.scene, btn.data as Record<string, unknown>, SCENE_COLORS.dark);
          },
        });
      });

      this.tweens.add({
        targets: container,
        alpha: 1,
        y: { from: y + btnH / 2 + 40, to: y + btnH / 2 },
        duration: 400,
        delay: 100 + i * 120,
        ease: 'Power3',
      });
    }
  }
}
