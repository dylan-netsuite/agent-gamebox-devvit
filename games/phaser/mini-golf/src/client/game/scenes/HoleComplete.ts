import { Scene } from 'phaser';
import { HOLES } from '../data/holes';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';

export class HoleComplete extends Scene {
  private holeIndex: number = 0;
  private strokes: number = 0;
  private par: number = 0;
  private scores: number[] = [];

  constructor() {
    super('HoleComplete');
  }

  init(data: { holeIndex: number; strokes: number; par: number; scores: number[] }) {
    this.holeIndex = data.holeIndex;
    this.strokes = data.strokes;
    this.par = data.par;
    this.scores = data.scores;
  }

  create() {
    fadeIn(this, SCENE_COLORS.dark);
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(0x1a472a);

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a472a, 0x1a472a, 0x0d3320, 0x0d3320, 1, 1, 1, 1);
    bg.fillRect(0, 0, width, height);

    const holeDef = HOLES[this.holeIndex]!;
    const diff = this.strokes - this.par;

    this.add
      .text(cx, height * 0.15, `HOLE ${holeDef.id}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '20px',
        color: '#ff69b4',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, height * 0.22, holeDef.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    let scoreColor: string;
    let scoreLabel: string;
    if (this.strokes === 1) {
      scoreLabel = 'HOLE IN ONE!';
      scoreColor = '#ffd700';
    } else if (diff <= -2) {
      scoreLabel = 'EAGLE!';
      scoreColor = '#ffd700';
    } else if (diff === -1) {
      scoreLabel = 'BIRDIE!';
      scoreColor = '#32cd32';
    } else if (diff === 0) {
      scoreLabel = 'PAR';
      scoreColor = '#ffffff';
    } else if (diff === 1) {
      scoreLabel = 'BOGEY';
      scoreColor = '#ff8c00';
    } else {
      scoreLabel = `+${diff}`;
      scoreColor = '#ff4444';
    }

    const scoreText = this.add
      .text(cx, height * 0.38, scoreLabel, {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: '42px',
        color: scoreColor,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.5);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.add
      .text(cx, height * 0.52, `Strokes: ${this.strokes}  |  Par: ${this.par}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#cccccc',
      })
      .setOrigin(0.5);

    const totalStrokes = this.scores.reduce((a, b) => a + b, 0);
    const totalPar = this.scores.reduce((sum, _s, idx) => sum + HOLES[idx]!.par, 0);
    const totalDiff = totalStrokes - totalPar;
    const totalLabel = totalDiff === 0 ? 'E' : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;

    this.add
      .text(cx, height * 0.6, `Total: ${totalStrokes} (${totalLabel})`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#8fbfa0',
      })
      .setOrigin(0.5);

    const isLastHole = this.holeIndex >= HOLES.length - 1;
    const btnLabel = isLastHole ? 'VIEW SCORECARD' : 'NEXT HOLE';
    const btnY = height * 0.75;
    const btnW = 200;
    const btnH = 48;

    const btnContainer = this.add.container(cx, btnY);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff69b4, 1);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 12);
    btnContainer.add(btnBg);

    const btnText = this.add
      .text(0, 0, btnLabel, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    btnContainer.add(btnText);

    const hitArea = this.add
      .rectangle(0, 0, btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerdown', () => {
      if (isLastHole) {
        transitionTo(this, 'Scorecard', { scores: this.scores }, SCENE_COLORS.dark);
      } else {
        transitionTo(
          this,
          'Game',
          { holeIndex: this.holeIndex + 1, scores: this.scores },
          SCENE_COLORS.dark
        );
      }
    });

    btnContainer.setAlpha(0);
    this.tweens.add({
      targets: btnContainer,
      alpha: 1,
      y: { from: btnY + 20, to: btnY },
      duration: 400,
      delay: 600,
      ease: 'Power3',
    });
  }
}
