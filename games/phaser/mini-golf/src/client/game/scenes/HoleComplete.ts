import { Scene } from 'phaser';
import { HOLES } from '../data/holes';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';
import type { MultiplayerConfig, MultiplayerScores } from '../../../shared/types/multiplayer';

interface HoleCompleteData {
  holeIndex: number;
  endHoleIndex?: number;
  startHoleIndex?: number;
  strokes: number;
  par: number;
  scores: number[];
  multiplayer?: MultiplayerConfig;
  multiplayerScores?: MultiplayerScores;
  playerHoleStrokes?: number[];
}

export class HoleComplete extends Scene {
  private holeIndex: number = 0;
  private endHoleIndex: number = 0;
  private startHoleIndex: number = 0;
  private strokes: number = 0;
  private par: number = 0;
  private scores: number[] = [];
  private multiplayer: MultiplayerConfig | undefined = undefined;
  private multiplayerScores: MultiplayerScores | undefined = undefined;
  private playerHoleStrokes: number[] = [];

  constructor() {
    super('HoleComplete');
  }

  init(data: HoleCompleteData) {
    this.holeIndex = data.holeIndex;
    this.endHoleIndex = data.endHoleIndex ?? HOLES.length - 1;
    this.startHoleIndex = data.startHoleIndex ?? 0;
    this.strokes = data.strokes;
    this.par = data.par;
    this.scores = data.scores;
    this.multiplayer = data.multiplayer;
    this.multiplayerScores = data.multiplayerScores;
    this.playerHoleStrokes = data.playerHoleStrokes ?? [];
  }

  get isMultiplayer(): boolean {
    return !!this.multiplayer;
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

    const holeDef = HOLES[this.holeIndex]!;

    this.add
      .text(cx, height * 0.08, `HOLE ${holeDef.id}`, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '20px',
        color: '#ff69b4',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(cx, height * 0.14, holeDef.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(2);

    if (this.isMultiplayer) {
      this.createMultiplayerResults(cx, width, height);
    } else {
      this.createSinglePlayerResults(cx, height);
    }

    const isLastHole = this.holeIndex >= this.endHoleIndex;
    const btnLabel = isLastHole ? 'VIEW SCORECARD' : 'NEXT HOLE';
    const btnY = height * 0.85;
    const btnW = 200;
    const btnH = 48;

    const btnContainer = this.add.container(cx, btnY);
    btnContainer.setDepth(10);

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
      if (this.isMultiplayer) {
        this.handleMultiplayerNext(isLastHole);
      } else {
        this.handleSinglePlayerNext(isLastHole);
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

  private createSinglePlayerResults(cx: number, height: number): void {
    const diff = this.strokes - this.par;

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
      .text(cx, height * 0.35, scoreLabel, {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: '42px',
        color: scoreColor,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.5)
      .setDepth(2);

    this.tweens.add({
      targets: scoreText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.add
      .text(cx, height * 0.5, `Strokes: ${this.strokes}  |  Par: ${this.par}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#cccccc',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const totalStrokes = this.scores.reduce((a, b) => a + b, 0);
    const totalPar = this.scores.reduce((sum, _s, idx) => sum + HOLES[this.startHoleIndex + idx]!.par, 0);
    const totalDiff = totalStrokes - totalPar;
    const totalLabel = totalDiff === 0 ? 'E' : totalDiff > 0 ? `+${totalDiff}` : `${totalDiff}`;

    this.add
      .text(cx, height * 0.58, `Total: ${totalStrokes} (${totalLabel})`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#8fbfa0',
      })
      .setOrigin(0.5)
      .setDepth(2);
  }

  private createMultiplayerResults(cx: number, width: number, height: number): void {
    if (!this.multiplayer || !this.multiplayerScores) return;

    const headerY = height * 0.2;
    this.add
      .text(cx, headerY, 'RESULTS', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '14px',
        color: '#8fbfa0',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setDepth(2);

    const rowH = 52;
    const startY = headerY + 30;
    const cardW = Math.min(width * 0.85, 380);
    const players = this.multiplayer.players;

    const sortedPlayers = players.map((p, i) => ({
      player: p,
      strokes: this.playerHoleStrokes[i] ?? 0,
    })).sort((a, b) => a.strokes - b.strokes);

    for (let i = 0; i < sortedPlayers.length; i++) {
      const { player, strokes } = sortedPlayers[i]!;
      const y = startY + i * rowH;
      const diff = strokes - this.par;

      const cardBg = this.add.graphics();
      cardBg.fillStyle(player.color, 0.15);
      cardBg.fillRoundedRect(cx - cardW / 2, y, cardW, rowH - 6, 10);
      cardBg.lineStyle(2, player.color, 0.4);
      cardBg.strokeRoundedRect(cx - cardW / 2, y, cardW, rowH - 6, 10);
      cardBg.setDepth(2);

      if (i === 0) {
        const crown = this.add
          .text(cx - cardW / 2 + 16, y + (rowH - 6) / 2, '👑', {
            fontSize: '16px',
          })
          .setOrigin(0, 0.5)
          .setDepth(3);
        this.tweens.add({
          targets: crown,
          scaleX: { from: 0, to: 1 },
          scaleY: { from: 0, to: 1 },
          duration: 400,
          delay: 300,
          ease: 'Back.easeOut',
        });
      }

      const nameX = cx - cardW / 2 + (i === 0 ? 40 : 16);
      this.add
        .text(nameX, y + (rowH - 6) / 2, player.name, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '16px',
          color: player.colorHex,
          stroke: '#000000',
          strokeThickness: 1,
        })
        .setOrigin(0, 0.5)
        .setDepth(3);

      let diffLabel: string;
      let diffColor: string;
      if (strokes === 1) {
        diffLabel = 'ACE!';
        diffColor = '#ffd700';
      } else if (diff <= -2) {
        diffLabel = 'EAGLE';
        diffColor = '#ffd700';
      } else if (diff === -1) {
        diffLabel = 'BIRDIE';
        diffColor = '#32cd32';
      } else if (diff === 0) {
        diffLabel = 'PAR';
        diffColor = '#ffffff';
      } else if (diff === 1) {
        diffLabel = 'BOGEY';
        diffColor = '#ff8c00';
      } else {
        diffLabel = `+${diff}`;
        diffColor = '#ff4444';
      }

      this.add
        .text(cx + cardW / 2 - 16, y + (rowH - 6) / 2 - 8, `${strokes}`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '18px',
          color: '#ffffff',
        })
        .setOrigin(1, 0.5)
        .setDepth(3);

      this.add
        .text(cx + cardW / 2 - 16, y + (rowH - 6) / 2 + 10, diffLabel, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: diffColor,
        })
        .setOrigin(1, 0.5)
        .setDepth(3);
    }

    const totalsY = startY + players.length * rowH + 10;
    this.add
      .text(cx, totalsY, 'STANDINGS', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '12px',
        color: '#8fbfa0',
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(2);

    const standingsY = totalsY + 22;
    const scoreLengths = Object.values(this.multiplayerScores).map(s => s.length);
    const holesPlayed = scoreLengths.length > 0 ? Math.max(...scoreLengths) : 0;

    const standings = players.map(p => {
      const playerScores = this.multiplayerScores![p.id]!;
      const total = playerScores.reduce((a, b) => a + b, 0);
      let totalPar = 0;
      for (let h = 0; h < holesPlayed; h++) {
        totalPar += HOLES[this.startHoleIndex + h]!.par;
      }
      return { player: p, total, totalPar, diff: total - totalPar };
    }).sort((a, b) => a.total - b.total);

    for (let i = 0; i < standings.length; i++) {
      const s = standings[i]!;
      const y = standingsY + i * 22;
      const diffStr = s.diff === 0 ? 'E' : s.diff > 0 ? `+${s.diff}` : `${s.diff}`;

      this.add
        .text(cx - cardW / 3, y, s.player.name, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          color: s.player.colorHex,
        })
        .setOrigin(0, 0.5)
        .setDepth(2);

      this.add
        .text(cx + cardW / 3, y, `${s.total} (${diffStr})`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '13px',
          color: s.diff <= 0 ? '#32cd32' : '#ff4444',
        })
        .setOrigin(1, 0.5)
        .setDepth(2);
    }
  }

  private handleSinglePlayerNext(isLastHole: boolean): void {
    if (isLastHole) {
      transitionTo(this, 'Scorecard', { scores: this.scores, startHoleIndex: this.startHoleIndex }, SCENE_COLORS.dark);
    } else {
      transitionTo(
        this,
        'Game',
        {
          holeIndex: this.holeIndex + 1,
          endHoleIndex: this.endHoleIndex,
          startHoleIndex: this.startHoleIndex,
          scores: this.scores,
        },
        SCENE_COLORS.dark
      );
    }
  }

  private handleMultiplayerNext(isLastHole: boolean): void {
    if (isLastHole) {
      transitionTo(
        this,
        'Scorecard',
        {
          scores: [],
          startHoleIndex: this.startHoleIndex,
          multiplayer: this.multiplayer,
          multiplayerScores: this.multiplayerScores,
        },
        SCENE_COLORS.dark
      );
    } else {
      transitionTo(
        this,
        'Game',
        {
          holeIndex: this.holeIndex + 1,
          endHoleIndex: this.endHoleIndex,
          startHoleIndex: this.startHoleIndex,
          scores: [],
          multiplayer: this.multiplayer,
          multiplayerScores: this.multiplayerScores,
          currentPlayerIndex: 0,
        },
        SCENE_COLORS.dark
      );
    }
  }
}
