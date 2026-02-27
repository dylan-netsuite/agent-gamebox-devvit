import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { PLAYER_COLORS } from '../logic/BoardLogic';

export class HowToPlay extends Scene {
  constructor() {
    super('HowToPlay');
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    const { width, height } = this.scale;
    const sf = Math.min(width / 1024, height / 768);

    this.buildUI(width, height, sf);

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.children.removeAll(true);
      this.buildUI(gameSize.width, gameSize.height, Math.min(gameSize.width / 1024, gameSize.height / 768));
    });
  }

  private buildUI(width: number, height: number, sf: number) {
    this.add
      .text(width / 2, height * 0.06, 'HOW TO PLAY', {
        fontFamily: '"Arial Black", Impact, sans-serif',
        fontSize: `${Math.round(32 * sf)}px`,
        color: '#4a90d9',
        stroke: '#1a3a6a',
        strokeThickness: 3 * sf,
      })
      .setOrigin(0.5);

    const rules = [
      '1. You are Blue, AI is Orange. Take turns placing pieces.',
      '2. Your first piece must cover your starting square (marked on board).',
      '3. Each new piece must touch your existing pieces at a CORNER.',
      '4. Your pieces may NOT share an EDGE with each other.',
      '5. Different colors CAN touch edges freely.',
      '6. Use R to rotate, F to flip, ESC to deselect.',
      '7. Pass if you have no valid moves.',
      '',
      'SCORING:',
      '  -1 point per unplaced square',
      '  +15 bonus for placing all 21 pieces',
      '  +5 extra if your last piece was the monomino',
    ];

    let y = height * 0.14;
    const lineH = Math.round(22 * sf);

    for (const line of rules) {
      const isHeader = line.startsWith('SCORING');
      this.add
        .text(width * 0.08, y, line, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round((isHeader ? 15 : 13) * sf)}px`,
          color: isHeader ? '#e8913a' : '#aabbcc',
          fontStyle: isHeader ? 'bold' : 'normal',
          wordWrap: { width: width * 0.84 },
        });
      y += lineH;
    }

    // Mini demo: show corner vs edge rule
    const demoY = y + 20 * sf;
    const cellSz = Math.round(18 * sf);

    this.add
      .text(width * 0.08, demoY, 'Corner touch (valid):', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(12 * sf)}px`,
        color: '#44cc44',
      });

    const g = this.add.graphics();
    const demoX = width * 0.08;
    // First piece
    g.fillStyle(PLAYER_COLORS[0]!, 0.7);
    g.fillRoundedRect(demoX, demoY + 18 * sf, cellSz, cellSz, 2);
    g.fillRoundedRect(demoX + cellSz + 1, demoY + 18 * sf, cellSz, cellSz, 2);
    // Corner-touching piece
    g.fillStyle(PLAYER_COLORS[0]!, 0.7);
    g.fillRoundedRect(demoX + (cellSz + 1) * 2, demoY + 18 * sf + cellSz + 1, cellSz, cellSz, 2);
    g.fillRoundedRect(demoX + (cellSz + 1) * 3, demoY + 18 * sf + cellSz + 1, cellSz, cellSz, 2);

    this.add
      .text(width * 0.5, demoY, 'Edge touch (invalid):', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(12 * sf)}px`,
        color: '#cc4444',
      });

    const demoX2 = width * 0.5;
    g.fillStyle(PLAYER_COLORS[0]!, 0.7);
    g.fillRoundedRect(demoX2, demoY + 18 * sf, cellSz, cellSz, 2);
    g.fillRoundedRect(demoX2 + cellSz + 1, demoY + 18 * sf, cellSz, cellSz, 2);
    // Edge-touching (invalid)
    g.fillStyle(0xcc4444, 0.5);
    g.fillRoundedRect(demoX2 + (cellSz + 1) * 2, demoY + 18 * sf, cellSz, cellSz, 2);
    g.fillRoundedRect(demoX2 + (cellSz + 1) * 3, demoY + 18 * sf, cellSz, cellSz, 2);
    // X mark
    g.lineStyle(2, 0xcc4444, 0.8);
    const xCenterX = demoX2 + (cellSz + 1) * 2.5;
    const xCenterY = demoY + 18 * sf + cellSz / 2;
    g.lineBetween(xCenterX - 12, xCenterY - 12, xCenterX + 12, xCenterY + 12);
    g.lineBetween(xCenterX + 12, xCenterY - 12, xCenterX - 12, xCenterY + 12);

    // Back button
    this.createButton(width / 2, height * 0.92, 'BACK', 0x3a3a5e, sf, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu');
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
    const btnW = Math.round(200 * sf);
    const btnH = Math.round(44 * sf);

    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 12 * sf);

    this.add
      .text(x, y, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(16 * sf)}px`,
        color: '#ffffff',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.add
      .rectangle(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001)
      .on('pointerdown', onClick);
  }
}
