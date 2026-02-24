import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { PIECE_DEFINITIONS, getTransformedCells } from '../data/pieces';

export class MainMenu extends Scene {
  private decorPieces: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('MainMenu');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);

    this.buildUI(width, height, sf);

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const w = gameSize.width;
      const h = gameSize.height;
      const s = Math.min(w / 1024, h / 768);
      this.children.removeAll(true);
      this.decorPieces = [];
      this.buildUI(w, h, s);
    });
  }

  private buildUI(width: number, height: number, sf: number) {
    this.drawDecorativePieces(width, height, sf);

    this.add
      .text(width / 2, height * 0.18, 'BLOKUS', {
        fontFamily: '"Arial Black", Impact, sans-serif',
        fontSize: `${Math.round(56 * sf)}px`,
        color: '#4a90d9',
        stroke: '#1a3a6a',
        strokeThickness: 6 * sf,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.26, 'Claim your territory!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(16 * sf)}px`,
        color: '#6688aa',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    this.createButton(width / 2, height * 0.45, 'PLAY', 0x4a90d9, sf, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game');
      });
    });

    this.createButton(width / 2, height * 0.58, 'HOW TO PLAY', 0x3a7ab8, sf, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('HowToPlay');
      });
    });

    this.createButton(width / 2, height * 0.71, 'LEADERBOARD', 0xe8913a, sf, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Leaderboard');
      });
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    color: number,
    sf: number,
    onClick: () => void
  ) {
    const btnW = Math.round(260 * sf);
    const btnH = Math.round(52 * sf);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 12 * sf);

    const text = this.add
      .text(x, y, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(18 * sf)}px`,
        color: '#ffffff',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const hitArea = this.add
      .rectangle(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - btnW / 2 - 2, y - btnH / 2 - 2, btnW + 4, btnH + 4, 14 * sf);
      text.setScale(1.05);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 12 * sf);
      text.setScale(1);
    });

    hitArea.on('pointerdown', onClick);
  }

  private drawDecorativePieces(width: number, height: number, sf: number) {
    const cellSize = 10 * sf;
    const positions = [
      { x: width * 0.08, y: height * 0.15, pieceIdx: 9, color: 0x4a90d9, alpha: 0.15, rot: 0 },
      { x: width * 0.88, y: height * 0.1, pieceIdx: 14, color: 0xe8913a, alpha: 0.12, rot: 1 },
      { x: width * 0.05, y: height * 0.7, pieceIdx: 18, color: 0xe8913a, alpha: 0.1, rot: 2 },
      { x: width * 0.92, y: height * 0.75, pieceIdx: 16, color: 0x4a90d9, alpha: 0.12, rot: 3 },
      { x: width * 0.15, y: height * 0.9, pieceIdx: 11, color: 0x4a90d9, alpha: 0.1, rot: 1 },
      { x: width * 0.85, y: height * 0.45, pieceIdx: 20, color: 0xe8913a, alpha: 0.08, rot: 0 },
    ];

    for (const pos of positions) {
      const piece = PIECE_DEFINITIONS[pos.pieceIdx];
      if (!piece) continue;
      const cells = getTransformedCells(piece.cells, pos.rot, false);
      const g = this.add.graphics();
      g.fillStyle(pos.color, pos.alpha);
      for (const [r, c] of cells) {
        g.fillRoundedRect(
          pos.x + c * (cellSize + 2),
          pos.y + r * (cellSize + 2),
          cellSize,
          cellSize,
          2
        );
      }
      this.decorPieces.push(g);
    }
  }
}
