import { Scene } from 'phaser';
import { HOLES } from '../data/holes';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';

export class Scorecard extends Scene {
  private scores: number[] = [];

  constructor() {
    super('Scorecard');
  }

  init(data: { scores: number[]; viewOnly?: boolean }) {
    this.scores = data.scores ?? [];
  }

  create() {
    fadeIn(this, SCENE_COLORS.dark);
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(0x14381f);

    const bg = this.add.tileSprite(width / 2, height / 2, width, height, 'grass-bg');
    bg.setDepth(0);

    const vig = this.add.image(width / 2, height / 2, 'vignette');
    vig.setDisplaySize(width, height);
    vig.setDepth(1);

    this.add
      .text(cx, 30, 'SCORECARD', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '24px',
        color: '#ff69b4',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(cx, 55, 'Sugar Rush Retro Invitational', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const startY = 80;
    const rowH = 22;
    const colX = [cx - 160, cx - 40, cx + 40, cx + 120];

    this.add
      .text(colX[0]!, startY, 'HOLE', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '11px',
        color: '#ffd700',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);
    this.add
      .text(colX[1]!, startY, 'PAR', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '11px',
        color: '#ffd700',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(2);
    this.add
      .text(colX[2]!, startY, 'SCORE', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '11px',
        color: '#ffd700',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(2);
    this.add
      .text(colX[3]!, startY, '+/-', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '11px',
        color: '#ffd700',
      })
      .setOrigin(0.5, 0.5)
      .setDepth(2);

    let totalStrokes = 0;
    let totalPar = 0;

    for (let i = 0; i < HOLES.length; i++) {
      const hole = HOLES[i]!;
      const y = startY + (i + 1) * rowH;
      const score = this.scores[i];
      const hasScore = score !== undefined;

      if (i % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0xffffff, 0.03);
        rowBg.fillRect(colX[0]! - 10, y - rowH / 2, 300, rowH);
        rowBg.setDepth(2);
      }

      this.add
        .text(colX[0]!, y, `${hole.id}. ${hole.name}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: '#cccccc',
        })
        .setOrigin(0, 0.5)
        .setDepth(2);

      this.add
        .text(colX[1]!, y, `${hole.par}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#aaaaaa',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(2);

      if (hasScore) {
        totalStrokes += score;
        totalPar += hole.par;
        const diff = score - hole.par;
        let scoreColor = '#ffffff';
        if (score === 1) scoreColor = '#ffd700';
        else if (diff < 0) scoreColor = '#32cd32';
        else if (diff === 0) scoreColor = '#ffffff';
        else if (diff === 1) scoreColor = '#ff8c00';
        else scoreColor = '#ff4444';

        this.add
          .text(colX[2]!, y, `${score}`, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: '11px',
            color: scoreColor,
          })
          .setOrigin(0.5, 0.5)
          .setDepth(2);

        const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
        this.add
          .text(colX[3]!, y, diffStr, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: scoreColor,
          })
          .setOrigin(0.5, 0.5)
          .setDepth(2);
      } else {
        this.add
          .text(colX[2]!, y, '-', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
            color: '#555555',
          })
          .setOrigin(0.5, 0.5)
          .setDepth(2);
      }
    }

    const totalY = startY + (HOLES.length + 1) * rowH + 10;
    const totalBg = this.add.graphics();
    totalBg.fillStyle(0xff69b4, 0.15);
    totalBg.fillRoundedRect(colX[0]! - 10, totalY - 14, 300, 28, 6);
    totalBg.setDepth(2);

    if (this.scores.length > 0) {
      const totalDiff = totalStrokes - totalPar;
      const totalLabel =
        totalDiff === 0 ? 'EVEN' : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;

      this.add
        .text(colX[0]!, totalY, 'TOTAL', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '12px',
          color: '#ff69b4',
        })
        .setOrigin(0, 0.5)
        .setDepth(2);

      this.add
        .text(colX[1]!, totalY, `${totalPar}`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '12px',
          color: '#aaaaaa',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(2);

      this.add
        .text(colX[2]!, totalY, `${totalStrokes}`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '12px',
          color: '#ffffff',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(2);

      this.add
        .text(colX[3]!, totalY, totalLabel, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '12px',
          color: totalDiff <= 0 ? '#32cd32' : '#ff4444',
        })
        .setOrigin(0.5, 0.5)
        .setDepth(2);
    }

    if (this.scores.length === HOLES.length) {
      void this.submitScore(totalStrokes, totalPar);
    }

    const btnY = Math.min(totalY + 50, height - 50);
    const btnContainer = this.add.container(cx, btnY);
    btnContainer.setDepth(10);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff69b4, 1);
    btnBg.fillRoundedRect(-80, -22, 160, 44, 12);
    btnContainer.add(btnBg);

    const btnText = this.add
      .text(0, 0, 'MAIN MENU', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    btnContainer.add(btnText);

    const hitArea = this.add
      .rectangle(0, 0, 160, 44)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    btnContainer.add(hitArea);

    hitArea.on('pointerdown', () => {
      transitionTo(this, 'MainMenu', undefined, SCENE_COLORS.dark);
    });
  }

  private async submitScore(totalStrokes: number, totalPar: number): Promise<void> {
    try {
      await fetch('/api/stats/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: this.scores,
          totalStrokes,
          totalPar,
        }),
      });
    } catch {
      // non-fatal
    }
  }
}
