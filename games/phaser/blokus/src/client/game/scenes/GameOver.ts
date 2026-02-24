import { Scene } from 'phaser';
import * as Phaser from 'phaser';

interface GameOverData {
  playerScore: number;
  aiScore: number;
  playerPiecesPlaced: number;
  aiPiecesPlaced: number;
  won: boolean;
  perfect: boolean;
}

export class GameOver extends Scene {
  private data_: GameOverData;

  constructor() {
    super('GameOver');
  }

  init(data: GameOverData) {
    this.data_ = data;
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
      this.buildUI(w, h, s);
    });
  }

  private buildUI(width: number, height: number, sf: number) {
    const { won, perfect, playerScore, aiScore, playerPiecesPlaced, aiPiecesPlaced } = this.data_;

    const resultText = perfect ? 'PERFECT GAME!' : won ? 'YOU WIN!' : playerScore === aiScore ? 'TIE GAME!' : 'YOU LOSE!';
    const resultColor = won || perfect ? '#44cc44' : playerScore === aiScore ? '#e8913a' : '#cc4444';

    this.add
      .text(width / 2, height * 0.15, resultText, {
        fontFamily: '"Arial Black", Impact, sans-serif',
        fontSize: `${Math.round(48 * sf)}px`,
        color: resultColor,
        stroke: '#000000',
        strokeThickness: 4 * sf,
      })
      .setOrigin(0.5);

    const lineH = Math.round(28 * sf);
    let y = height * 0.32;

    const addLine = (label: string, value: string, color: string) => {
      this.add
        .text(width / 2 - 120 * sf, y, label, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(16 * sf)}px`,
          color: '#8899aa',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(width / 2 + 120 * sf, y, value, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${Math.round(16 * sf)}px`,
          color,
        })
        .setOrigin(1, 0.5);

      y += lineH;
    };

    addLine('Your Score', `${playerScore}`, '#4a90d9');
    addLine('AI Score', `${aiScore}`, '#e8913a');
    addLine('Your Pieces Placed', `${playerPiecesPlaced}/21`, '#4a90d9');
    addLine('AI Pieces Placed', `${aiPiecesPlaced}/21`, '#e8913a');

    if (perfect) {
      y += lineH / 2;
      this.add
        .text(width / 2, y, 'All pieces placed! +15 bonus (+5 monomino)', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(14 * sf)}px`,
          color: '#44cc44',
          fontStyle: 'italic',
        })
        .setOrigin(0.5);
    }

    // Play Again button
    const btnY = height * 0.72;
    this.createButton(width / 2, btnY, 'PLAY AGAIN', 0x4a90d9, sf, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game');
      });
    });

    // Main Menu button
    this.createButton(width / 2, btnY + 64 * sf, 'MAIN MENU', 0x3a3a5e, sf, () => {
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
    const btnW = Math.round(240 * sf);
    const btnH = Math.round(48 * sf);

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

    const hitArea = this.add
      .rectangle(x, y, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);

    hitArea.on('pointerdown', onClick);
  }
}
