import { Scene } from 'phaser';

export class MainMenu extends Scene {
  private allObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('MainMenu');
  }

  create() {
    this.cameras.main.setBackgroundColor(0xf7f7f7);
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
    const sf = Math.min(width / 800, height / 400);

    // Ground line
    const groundY = height * 0.72;
    const groundLine = this.add.graphics();
    groundLine.lineStyle(2, 0x535353);
    groundLine.lineBetween(0, groundY, width, groundY);
    this.allObjects.push(groundLine);

    // Dino standing on ground
    const dinoImg = this.add.image(cx - 80 * sf, groundY, 'dino-stand');
    dinoImg.setOrigin(0.5, 1);
    dinoImg.setScale(Math.max(1, sf * 1.5));
    this.allObjects.push(dinoImg);

    // Cactus decorations
    const cactus1 = this.add.image(cx + 60 * sf, groundY, 'cactus-small');
    cactus1.setOrigin(0.5, 1);
    cactus1.setScale(Math.max(1, sf * 1.5));
    this.allObjects.push(cactus1);

    const cactus2 = this.add.image(cx + 140 * sf, groundY, 'cactus-large');
    cactus2.setOrigin(0.5, 1);
    cactus2.setScale(Math.max(1, sf * 1.5));
    this.allObjects.push(cactus2);

    // Clouds
    const cloud1 = this.add.image(width * 0.2, height * 0.2, 'cloud');
    cloud1.setScale(Math.max(1, sf));
    this.allObjects.push(cloud1);

    const cloud2 = this.add.image(width * 0.7, height * 0.15, 'cloud');
    cloud2.setScale(Math.max(0.8, sf * 0.8));
    this.allObjects.push(cloud2);

    // Title
    const titleFontSize = Math.max(28, Math.round(42 * sf));
    const title = this.add
      .text(cx, height * 0.18, 'DINO RUN', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${titleFontSize}px`,
        color: '#535353',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(title);

    // Subtitle
    const subFontSize = Math.max(10, Math.round(14 * sf));
    const subtitle = this.add
      .text(cx, height * 0.18 + titleFontSize * 0.8, 'T-Rex Runner', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${subFontSize}px`,
        color: '#999',
        align: 'center',
      })
      .setOrigin(0.5);
    this.allObjects.push(subtitle);

    // Buttons
    const btnW = Math.min(width * 0.55, 220);
    const btnH = Math.max(36, Math.round(44 * sf));
    const labelSize = Math.max(14, Math.round(16 * sf));
    const gap = Math.max(10, Math.round(12 * sf));

    let curY = height * 0.44;

    curY = this.addMenuButton(cx, curY, btnW, btnH, 'PLAY', labelSize, 0x535353, () =>
      this.scene.start('DinoGame')
    );
    curY += gap;

    this.addMenuButton(cx, curY, btnW, btnH, 'LEADERBOARD', labelSize, 0x999999, () =>
      this.scene.start('Leaderboard')
    );

    // Instructions
    const hintSize = Math.max(9, Math.round(10 * sf));
    const hint = this.add
      .text(cx, height * 0.92, 'Space / Tap to jump  •  Down to duck  •  Avoid obstacles', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${hintSize}px`,
        color: '#aaa',
        align: 'center',
        wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);
    this.allObjects.push(hint);
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
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    btnContainer.add(bg);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#f7f7f7',
        align: 'center',
        letterSpacing: 4,
      })
      .setOrigin(0.5);
    btnContainer.add(text);

    const hitArea = this.add
      .rectangle(0, 0, w, h)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 100,
        ease: 'Power2',
      });
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2',
      });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 60,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });

    return y + h;
  }
}
