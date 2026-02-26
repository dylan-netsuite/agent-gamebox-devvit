import { Scene } from 'phaser';
import * as Phaser from 'phaser';

type Difficulty = 'classic' | 'hard';

export class MainMenu extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('MainMenu');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a0a2e);
    this.allObjects = [];
    this.buildUI();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
  }

  private buildUI(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = Math.min(width / 800, height / 600);

    const bg = this.add.tileSprite(cx, height / 2, width, height, 'grid-bg');
    bg.setDepth(0);
    this.allObjects.push(bg);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x1a0a2e, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(1);
    this.allObjects.push(overlay);

    const titleY = height * 0.12;
    const fontSize = Math.max(22, Math.round(38 * sf));

    const glow = this.add.graphics();
    glow.fillStyle(0xffd700, 0.2);
    glow.fillEllipse(cx, titleY, 260 * sf, 60 * sf);
    glow.setDepth(2);
    this.allObjects.push(glow);

    const title = this.add
      .text(cx, titleY, 'MEERCA CHASE', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#ffd700',
        align: 'center',
        stroke: '#8b6914',
        strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 0, color: '#ffaa00', blur: 24, fill: false, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(title);

    const subtitle = this.add
      .text(cx, titleY + fontSize * 0.7, 'A Neopets Classic', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
        color: '#a89cc8',
        fontStyle: 'italic',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(subtitle);

    const btnW = Math.min(width * 0.65, 280);
    const btnH = Math.max(42, Math.round(50 * sf));
    const gap = Math.max(12, Math.round(14 * sf));
    const labelSize = Math.max(14, Math.round(17 * sf));

    let curY = height * 0.35;

    curY = this.addSectionLabel(cx, curY, 'SELECT DIFFICULTY', sf);

    curY = this.addMenuButton(cx, curY, btnW, btnH, 'CLASSIC', labelSize, 0x00c853, () =>
      this.startGame('classic')
    );
    curY += gap;

    curY = this.addMenuButton(cx, curY, btnW, btnH, 'HARD', labelSize, 0xff4444, () =>
      this.startGame('hard')
    );
    curY += gap * 2;

    this.addMenuButton(cx, curY, btnW, btnH, 'LEADERBOARD', labelSize, 0xffd700, () =>
      this.scene.start('Leaderboard')
    );

    const howToY = height * 0.88;
    const howTo = this.add
      .text(cx, howToY, 'Arrow keys to move • Collect Neggs • Avoid your tail!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(9, Math.round(10 * sf))}px`,
        color: '#6b5b8a',
        align: 'center',
        wordWrap: { width: width * 0.85 },
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(howTo);
  }

  private startGame(difficulty: Difficulty): void {
    this.scene.start('Game', { difficulty });
  }

  private addSectionLabel(cx: number, y: number, text: string, sf: number): number {
    const fontSize = Math.max(9, Math.round(10 * sf));
    const label = this.add
      .text(cx, y, text, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#6b5b8a',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.allObjects.push(label);
    return y + 28;
  }

  private addMenuButton(
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
    btnContainer.setDepth(10);
    this.allObjects.push(btnContainer);

    const bg = this.add.graphics();
    bg.fillStyle(0x160b28, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(2, color, 0.5);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
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
      this.tweens.add({ targets: btnContainer, scaleX: 1.04, scaleY: 1.04, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });

    return y + h;
  }
}
