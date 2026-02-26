import * as Phaser from 'phaser';
import { type GridPos, gridToPixel, samePos, GRID_COLS, GRID_ROWS } from '../utils/grid';
import { type NeggType, pickRandomNegg } from '../data/neggs';

export class Negg {
  scene: Phaser.Scene;
  pos: GridPos;
  type: NeggType;
  sprite: Phaser.GameObjects.Image;
  glowSprite: Phaser.GameObjects.Image;
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

    this.glowSprite = scene.add.image(pixel.x, pixel.y, 'particle');
    this.glowSprite.setScale((cellSize * 1.2) / 16);
    this.glowSprite.setTint(type.color);
    this.glowSprite.setAlpha(0.25);
    this.glowSprite.setDepth(4);

    this.sprite = scene.add.image(pixel.x, pixel.y, 'negg-base');
    const neggScale = (cellSize * 0.75) / 48;
    this.sprite.setScale(neggScale);
    this.sprite.setTint(type.color);
    this.sprite.setDepth(5);

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

  destroy(): void {
    this.scene.tweens.killTweensOf(this.sprite);
    this.scene.tweens.killTweensOf(this.glowSprite);
    this.sprite.destroy();
    this.glowSprite.destroy();
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
