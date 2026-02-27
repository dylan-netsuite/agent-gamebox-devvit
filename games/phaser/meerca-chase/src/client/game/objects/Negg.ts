import * as Phaser from 'phaser';
import { type GridPos, gridToPixel, samePos, GRID_COLS, GRID_ROWS } from '../utils/grid';
import { type NeggType, pickRandomNegg } from '../data/neggs';

export class Negg {
  scene: Phaser.Scene;
  pos: GridPos;
  type: NeggType;
  sprite: Phaser.GameObjects.Image;
  glowSprite: Phaser.GameObjects.Image;
  warningText: Phaser.GameObjects.Text | null = null;
  cellSize: number;
  offsetX: number;
  offsetY: number;

  constructor(
    scene: Phaser.Scene,
    pos: GridPos,
    type: NeggType,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ) {
    this.scene = scene;
    this.pos = pos;
    this.type = type;
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    const pixel = gridToPixel(pos.col, pos.row, cellSize, offsetX, offsetY);
    const isBad = type.points < 0;
    const textureKey = isBad ? 'negg-bad' : 'negg-base';

    this.glowSprite = scene.add.image(pixel.x, pixel.y, 'particle');
    this.glowSprite.setScale((cellSize * (isBad ? 1.5 : 1.2)) / 16);
    this.glowSprite.setTint(isBad ? 0xff0000 : type.color);
    this.glowSprite.setAlpha(isBad ? 0.35 : 0.25);
    this.glowSprite.setDepth(4);

    this.sprite = scene.add.image(pixel.x, pixel.y, textureKey);
    const neggScale = (cellSize * (isBad ? 0.85 : 0.75)) / 48;
    this.sprite.setScale(neggScale);
    this.sprite.setTint(type.color);
    this.sprite.setDepth(5);

    if (isBad) {
      // Aggressive jittery shake for bad neggs
      scene.tweens.add({
        targets: this.sprite,
        angle: { from: -8, to: 8 },
        duration: 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      scene.tweens.add({
        targets: this.sprite,
        scaleX: neggScale * 1.15,
        scaleY: neggScale * 1.15,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Fast red glow pulse
      scene.tweens.add({
        targets: this.glowSprite,
        alpha: { from: 0.15, to: 0.5 },
        scaleX: (cellSize * 1.8) / 16,
        scaleY: (cellSize * 1.8) / 16,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // "-5" label floating above the bad negg
      const fontSize = Math.max(10, Math.round(cellSize * 0.4));
      this.warningText = scene.add
        .text(pixel.x, pixel.y - cellSize * 0.45, `${type.points}`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${fontSize}px`,
          color: '#ff4444',
          stroke: '#1a0a2e',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(6);

      scene.tweens.add({
        targets: this.warningText,
        y: pixel.y - cellSize * 0.55,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else {
      scene.tweens.add({
        targets: this.sprite,
        scaleX: neggScale * 1.1,
        scaleY: neggScale * 1.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      scene.tweens.add({
        targets: this.glowSprite,
        alpha: 0.15,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glowSprite);
    this.sprite.destroy();
    this.glowSprite.destroy();
    if (this.warningText) {
      this.scene.tweens.killTweensOf(this.warningText);
      this.warningText.destroy();
    }
  }

  static spawnRandom(
    scene: Phaser.Scene,
    occupied: GridPos[],
    cellSize: number,
    offsetX: number,
    offsetY: number
  ): Negg {
    const type = pickRandomNegg();
    let pos: GridPos;
    let attempts = 0;
    do {
      pos = {
        col: Math.floor(Math.random() * GRID_COLS),
        row: Math.floor(Math.random() * GRID_ROWS),
      };
      attempts++;
    } while (occupied.some((o) => samePos(o, pos)) && attempts < 200);

    return new Negg(scene, pos, type, cellSize, offsetX, offsetY);
  }
}
