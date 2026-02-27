import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { HOLES } from '../data/holes';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';

export class MainMenu extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private elapsed = 0;
  private titleText: Phaser.GameObjects.Text | undefined;
  private titleGlow: Phaser.GameObjects.Graphics | undefined;
  private scrollContainer: Phaser.GameObjects.Container | undefined;
  private scrollMask: Phaser.GameObjects.Graphics | undefined;
  private scrollY = 0;
  private scrollContentH = 0;
  private scrollViewH = 0;
  private scrollViewTop = 0;

  constructor() {
    super('MainMenu');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 1024, this.scale.height / 768);
  }

  private wheelPreventDefault = (e: WheelEvent) => e.preventDefault();

  create() {
    this.cameras.main.setBackgroundColor(0x14381f);
    fadeIn(this, SCENE_COLORS.dark);
    this.allObjects = [];
    this.elapsed = 0;
    this.scrollY = 0;

    this.game.canvas.addEventListener('wheel', this.wheelPreventDefault, { passive: false });

    this.buildUI();

    this.scale.on('resize', () => {
      this.input.off('pointermove');
      this.input.off('pointerup');
      this.input.off('wheel');
      this.destroyAll();
      this.buildUI();
    });

    this.events.on('shutdown', () => {
      this.game.canvas.removeEventListener('wheel', this.wheelPreventDefault);
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
    this.scrollContainer = undefined;
    this.scrollMask?.destroy();
    this.scrollMask = undefined;
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = this.sf;

    this.drawBackground(width, height);
    this.drawDecorations(width, height);
    this.drawTitle(cx, height, sf);
    this.drawMenu(cx, width, height, sf);
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
    const titleY = h * 0.08;
    const fontSize = Math.max(24, Math.round(42 * sf));

    const glow = this.add.graphics();
    glow.fillStyle(0xff69b4, 0.25);
    glow.fillEllipse(cx, titleY, 280 * sf, 70 * sf);
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
      .text(cx, titleY + fontSize * 0.6, 'Sugar Rush Retro Invitational', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(10, Math.round(12 * sf))}px`,
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

  private drawMenu(cx: number, w: number, h: number, sf: number): void {
    const menuTop = h * 0.18;
    const viewH = h - menuTop - 10;
    this.scrollViewH = viewH;
    this.scrollViewTop = menuTop;

    const container = this.add.container(0, 0);
    container.setDepth(10);
    this.scrollContainer = container;
    this.allObjects.push(container);

    const mask = this.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillRect(0, menuTop, w, viewH);
    container.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));
    this.scrollMask = mask;

    const btnW = Math.min(w * 0.75, 300);
    const btnH = Math.max(38, Math.round(44 * sf));
    const gap = Math.max(8, Math.round(10 * sf));
    const labelSize = Math.max(13, Math.round(16 * sf));
    const smallLabelSize = Math.max(10, Math.round(11 * sf));
    let curY = menuTop + 10;

    const startGame = (startIdx: number, endIdx: number) => {
      transitionTo(
        this,
        'Game',
        { holeIndex: startIdx, endHoleIndex: endIdx, scores: [] },
        SCENE_COLORS.dark
      );
    };

    curY = this.addSectionHeader(container, cx, curY, 'PLAY', sf);

    const courseButtons: { label: string; start: number; end: number; color: number }[] = [
      { label: 'FULL 18', start: 0, end: HOLES.length - 1, color: 0xff69b4 },
    ];
    if (HOLES.length > 9) {
      courseButtons.push({ label: 'FRONT 9', start: 0, end: 8, color: 0x32cd32 });
      courseButtons.push({ label: 'BACK 9', start: 9, end: Math.min(17, HOLES.length - 1), color: 0x00ced1 });
    }

    for (const btn of courseButtons) {
      curY = this.addMenuButton(
        container,
        cx,
        curY,
        btnW,
        btnH,
        btn.label,
        labelSize,
        btn.color,
        () => startGame(btn.start, btn.end)
      );
      curY += gap;
    }

    curY += gap;
    curY = this.addSectionHeader(container, cx, curY, 'PRACTICE', sf);

    const holeBtnW = (btnW - gap) / 2;
    const holeBtnH = Math.max(48, Math.round(54 * sf));

    for (let i = 0; i < HOLES.length; i += 2) {
      const leftX = cx - holeBtnW / 2 - gap / 2;
      const rightX = cx + holeBtnW / 2 + gap / 2;

      this.addHoleButton(container, leftX, curY, holeBtnW, holeBtnH, i, labelSize, smallLabelSize, () =>
        startGame(i, i)
      );

      if (i + 1 < HOLES.length) {
        this.addHoleButton(
          container,
          rightX,
          curY,
          holeBtnW,
          holeBtnH,
          i + 1,
          labelSize,
          smallLabelSize,
          () => startGame(i + 1, i + 1)
        );
      }

      curY += holeBtnH + gap;
    }

    curY += gap;

    curY = this.addMenuButton(
      container,
      cx,
      curY,
      btnW,
      btnH,
      'LEADERBOARD',
      labelSize,
      0xffd700,
      () => transitionTo(this, 'Scorecard', { scores: [], viewOnly: true }, SCENE_COLORS.dark)
    );
    curY += gap * 2;

    this.scrollContentH = curY - menuTop;

    this.setupScrolling(w, h);
  }

  private addSectionHeader(
    container: Phaser.GameObjects.Container,
    cx: number,
    y: number,
    text: string,
    sf: number
  ): number {
    const fontSize = Math.max(10, Math.round(11 * sf));
    const label = this.add
      .text(cx, y + 8, text, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#8fbfa0',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(11);
    container.add(label);
    return y + 24;
  }

  private addMenuButton(
    container: Phaser.GameObjects.Container,
    cx: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fontSize: number,
    color: number,
    onClick: () => void
  ): number {
    const btnContainer = this.add.container(cx, y + h / 2);
    btnContainer.setDepth(11);
    container.add(btnContainer);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d3320, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(2, color, 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    btnContainer.add(bg);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#e0e8f0',
        align: 'center',
      })
      .setOrigin(0.5);
    btnContainer.add(text);

    const hitArea = this.add
      .rectangle(0, 0, w, h)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1.03, scaleY: 1.03, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });

    return y + h;
  }

  private addHoleButton(
    container: Phaser.GameObjects.Container,
    cx: number,
    y: number,
    w: number,
    h: number,
    holeIdx: number,
    fontSize: number,
    smallFontSize: number,
    onClick: () => void
  ): void {
    const hole = HOLES[holeIdx]!;
    const btnContainer = this.add.container(cx, y + h / 2);
    btnContainer.setDepth(11);
    container.add(btnContainer);

    const colors = [0xff69b4, 0x32cd32, 0x00ced1, 0xffd700, 0xff6347, 0x9370db];
    const color = colors[holeIdx % colors.length]!;

    const bg = this.add.graphics();
    bg.fillStyle(0x0d3320, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    bg.lineStyle(1.5, color, 0.35);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    btnContainer.add(bg);

    const holeLabel = this.add
      .text(0, -8, `HOLE ${hole.id}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#e0e8f0',
      })
      .setOrigin(0.5);
    btnContainer.add(holeLabel);

    const nameLabel = this.add
      .text(0, 10, hole.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${smallFontSize}px`,
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);
    btnContainer.add(nameLabel);

    const hitArea = this.add
      .rectangle(0, 0, w, h)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1.03, scaleY: 1.03, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });
  }

  private setupScrolling(w: number, _h: number): void {
    if (!this.scrollContainer) return;

    const maxScroll = Math.max(0, this.scrollContentH - this.scrollViewH);
    if (maxScroll <= 0) return;

    const scrollZone = this.add.rectangle(w / 2, this.scrollViewTop + this.scrollViewH / 2, w, this.scrollViewH);
    scrollZone.setInteractive();
    scrollZone.setAlpha(0.001);
    scrollZone.setDepth(9);
    this.allObjects.push(scrollZone);

    let dragging = false;
    let dragStartY = 0;
    let scrollStartY = 0;

    scrollZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragging = true;
      dragStartY = pointer.y;
      scrollStartY = this.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!dragging || !this.scrollContainer) return;
      const dy = pointer.y - dragStartY;
      this.scrollY = Phaser.Math.Clamp(scrollStartY - dy, 0, maxScroll);
      this.scrollContainer.setY(-this.scrollY);
    });

    this.input.on('pointerup', () => {
      dragging = false;
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => {
      if (!this.scrollContainer) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, maxScroll);
      this.scrollContainer.setY(-this.scrollY);
    });
  }
}
