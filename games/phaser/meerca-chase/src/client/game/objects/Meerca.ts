import * as Phaser from 'phaser';
import { type GridPos, type Direction, DIR_VECTORS, isInBounds, samePos, gridToPixel } from '../utils/grid';

export class Meerca {
  scene: Phaser.Scene;
  head: GridPos;
  tail: GridPos[];
  direction: Direction;
  nextDirection: Direction;
  headSprite: Phaser.GameObjects.Image;
  tailSprites: Phaser.GameObjects.Image[];
  cellSize: number;
  offsetX: number;
  offsetY: number;

  constructor(
    scene: Phaser.Scene,
    startCol: number,
    startRow: number,
    cellSize: number,
    offsetX: number,
    offsetY: number
  ) {
    this.scene = scene;
    this.cellSize = cellSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.head = { col: startCol, row: startRow };
    this.tail = [
      { col: startCol - 1, row: startRow },
      { col: startCol - 2, row: startRow },
    ];
    this.direction = 'right';
    this.nextDirection = 'right';

    const headPos = gridToPixel(this.head.col, this.head.row, cellSize, offsetX, offsetY);
    this.headSprite = scene.add.image(headPos.x, headPos.y, 'meerca-head');
    const headScale = (cellSize * 0.9) / 64;
    this.headSprite.setScale(headScale);
    this.headSprite.setDepth(10);

    this.tailSprites = [];
    for (const seg of this.tail) {
      const sprite = this.createTailSprite(seg);
      this.tailSprites.push(sprite);
    }
  }

  private createTailSprite(pos: GridPos): Phaser.GameObjects.Image {
    const pixel = gridToPixel(pos.col, pos.row, this.cellSize, this.offsetX, this.offsetY);
    const sprite = this.scene.add.image(pixel.x, pixel.y, 'tail-segment');
    const tailScale = (this.cellSize * 0.7) / 48;
    sprite.setScale(tailScale);
    sprite.setDepth(9);
    sprite.setAlpha(0.85);
    return sprite;
  }

  setDirection(dir: Direction): void {
    this.nextDirection = dir;
  }

  move(): { alive: boolean; newHead: GridPos } {
    this.direction = this.nextDirection;
    const vec = DIR_VECTORS[this.direction];
    const newHead: GridPos = {
      col: this.head.col + vec.col,
      row: this.head.row + vec.row,
    };

    if (!isInBounds(newHead)) {
      return { alive: false, newHead };
    }

    if (this.tail.some((seg) => samePos(seg, newHead))) {
      return { alive: false, newHead };
    }

    const oldHead = { ...this.head };
    this.tail.unshift(oldHead);
    this.tailSprites.unshift(this.createTailSprite(oldHead));
    this.head = newHead;

    this.updateSprites();

    return { alive: true, newHead };
  }

  grow(): void {
    const lastTail = this.tail[this.tail.length - 1];
    if (!lastTail) return;
    const newSeg = { ...lastTail };
    this.tail.push(newSeg);
    const sprite = this.createTailSprite(newSeg);
    this.tailSprites.push(sprite);
  }

  shrinkTail(): void {
    const removed = this.tail.pop();
    if (removed) {
      const sprite = this.tailSprites.pop();
      sprite?.destroy();
    }
  }

  private updateSprites(): void {
    const headPos = gridToPixel(this.head.col, this.head.row, this.cellSize, this.offsetX, this.offsetY);
    this.headSprite.setPosition(headPos.x, headPos.y);

    const rotation: Record<Direction, number> = {
      right: 0,
      down: Math.PI / 2,
      left: Math.PI,
      up: -Math.PI / 2,
    };
    this.headSprite.setRotation(rotation[this.direction]);

    for (let i = 0; i < this.tail.length; i++) {
      const seg = this.tail[i]!;
      const sprite = this.tailSprites[i];
      if (sprite) {
        const pos = gridToPixel(seg.col, seg.row, this.cellSize, this.offsetX, this.offsetY);
        sprite.setPosition(pos.x, pos.y);
        const fadeAlpha = Math.max(0.3, 0.85 - i * 0.03);
        sprite.setAlpha(fadeAlpha);
        const fadeScale = Math.max(0.4, 0.7 - i * 0.015);
        sprite.setScale((this.cellSize * fadeScale) / 48);
      }
    }
  }

  getAllPositions(): GridPos[] {
    return [this.head, ...this.tail];
  }

  destroy(): void {
    this.headSprite.destroy();
    for (const sprite of this.tailSprites) {
      sprite.destroy();
    }
    this.tailSprites = [];
  }
}
