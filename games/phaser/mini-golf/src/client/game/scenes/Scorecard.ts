import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { HOLES } from '../data/holes';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';
import type { MultiplayerConfig, MultiplayerScores } from '../../../shared/types/multiplayer';

interface ScorecardData {
  scores: number[];
  startHoleIndex?: number;
  viewOnly?: boolean;
  multiplayer?: MultiplayerConfig;
  multiplayerScores?: MultiplayerScores;
}

export class Scorecard extends Scene {
  private scores: number[] = [];
  private startHoleIndex: number = 0;
  private multiplayer: MultiplayerConfig | undefined = undefined;
  private multiplayerScores: MultiplayerScores | undefined = undefined;
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private scrollContainer: Phaser.GameObjects.Container | undefined = undefined;
  private scrollY = 0;
  private scrollContentH = 0;
  private scrollViewH = 0;
  private scrollViewTop = 0;

  constructor() {
    super('Scorecard');
  }

  get isMultiplayer(): boolean {
    return !!this.multiplayer;
  }

  init(data: ScorecardData) {
    this.scores = data.scores ?? [];
    this.startHoleIndex = data.startHoleIndex ?? 0;
    this.multiplayer = data.multiplayer;
    this.multiplayerScores = data.multiplayerScores;
    this.allObjects = [];
    this.scrollY = 0;
  }

  create() {
    fadeIn(this, SCENE_COLORS.dark);
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(0x14381f);

    const bg = this.add.tileSprite(width / 2, height / 2, width, height, 'grass-bg');
    bg.setDepth(0);
    this.allObjects.push(bg);

    const vig = this.add.image(width / 2, height / 2, 'vignette');
    vig.setDisplaySize(width, height);
    vig.setDepth(1);
    this.allObjects.push(vig);

    if (this.isMultiplayer) {
      this.createMultiplayerScorecard(width, height);
    } else {
      this.createSinglePlayerScorecard(width, height);
    }
  }

  private createSinglePlayerScorecard(width: number, height: number): void {
    const cx = width / 2;

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
      const scoreIdx = i - this.startHoleIndex;
      const score = scoreIdx >= 0 && scoreIdx < this.scores.length ? this.scores[scoreIdx] : undefined;
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
    this.addMenuButton(cx, btnY);
  }

  private createMultiplayerScorecard(width: number, height: number): void {
    if (!this.multiplayer || !this.multiplayerScores) return;

    const cx = width / 2;
    const players = this.multiplayer.players;
    const numPlayers = players.length;
    const holesPlayed = this.multiplayerScores[0]?.length ?? 0;

    this.add
      .text(cx, 20, 'SCORECARD', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '22px',
        color: '#ff69b4',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(cx, 44, 'Local Multiplayer', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const scrollTop = 58;
    const scrollViewH = height - scrollTop - 60;
    this.scrollViewH = scrollViewH;
    this.scrollViewTop = scrollTop;

    const container = this.add.container(0, 0);
    container.setDepth(10);
    this.scrollContainer = container;
    this.allObjects.push(container);

    const mask = this.add.graphics();
    mask.fillStyle(0xffffff);
    mask.fillRect(0, scrollTop, width, scrollViewH);
    container.setMask(new Phaser.Display.Masks.GeometryMask(this, mask));
    void mask;

    const rowH = 20;
    const holeColW = 90;
    const parColW = 34;
    const playerColW = Math.min(50, (width - holeColW - parColW - 20) / numPlayers);
    const tableW = holeColW + parColW + playerColW * numPlayers;
    const tableX = cx - tableW / 2;

    let curY = scrollTop + 10;

    container.add(
      this.add
        .text(tableX, curY, 'HOLE', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '9px',
          color: '#ffd700',
        })
        .setOrigin(0, 0.5)
    );

    container.add(
      this.add
        .text(tableX + holeColW, curY, 'PAR', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '9px',
          color: '#ffd700',
        })
        .setOrigin(0.5, 0.5)
    );

    for (let p = 0; p < numPlayers; p++) {
      const px = tableX + holeColW + parColW + playerColW * p + playerColW / 2;
      const player = players[p]!;

      const dot = this.add.graphics();
      dot.fillStyle(player.color, 1);
      dot.fillCircle(px, curY - 9, 4);
      container.add(dot);

      const nameLen = Math.min(player.name.length, 5);
      container.add(
        this.add
          .text(px, curY + 2, player.name.substring(0, nameLen), {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: '8px',
            color: player.colorHex,
          })
          .setOrigin(0.5, 0.5)
      );
    }

    curY += rowH;

    for (let i = 0; i < HOLES.length; i++) {
      const hole = HOLES[i]!;
      const y = curY + i * rowH;
      const scoreIdx = i - this.startHoleIndex;
      const hasScore = scoreIdx >= 0 && scoreIdx < holesPlayed;

      if (i % 2 === 0) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0xffffff, 0.03);
        rowBg.fillRect(tableX - 5, y - rowH / 2, tableW + 10, rowH);
        container.add(rowBg);
      }

      container.add(
        this.add
          .text(tableX, y, `${hole.id}. ${hole.name}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '9px',
            color: '#cccccc',
          })
          .setOrigin(0, 0.5)
      );

      container.add(
        this.add
          .text(tableX + holeColW, y, `${hole.par}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '10px',
            color: '#aaaaaa',
          })
          .setOrigin(0.5, 0.5)
      );

      for (let p = 0; p < numPlayers; p++) {
        const px = tableX + holeColW + parColW + playerColW * p + playerColW / 2;
        const player = players[p]!;
        const playerScores = this.multiplayerScores![player.id]!;

        if (hasScore && scoreIdx < playerScores.length) {
          const score = playerScores[scoreIdx]!;
          const diff = score - hole.par;
          let scoreColor = '#ffffff';
          if (score === 1) scoreColor = '#ffd700';
          else if (diff < 0) scoreColor = '#32cd32';
          else if (diff === 0) scoreColor = '#ffffff';
          else if (diff === 1) scoreColor = '#ff8c00';
          else scoreColor = '#ff4444';

          container.add(
            this.add
              .text(px, y, `${score}`, {
                fontFamily: '"Arial Black", sans-serif',
                fontSize: '10px',
                color: scoreColor,
              })
              .setOrigin(0.5, 0.5)
          );
        } else {
          container.add(
            this.add
              .text(px, y, '-', {
                fontFamily: 'Arial, sans-serif',
                fontSize: '10px',
                color: '#555555',
              })
              .setOrigin(0.5, 0.5)
          );
        }
      }
    }

    const totalY = curY + HOLES.length * rowH + 8;
    const totalBg = this.add.graphics();
    totalBg.fillStyle(0xff69b4, 0.15);
    totalBg.fillRoundedRect(tableX - 5, totalY - 12, tableW + 10, 24, 6);
    container.add(totalBg);

    container.add(
      this.add
        .text(tableX, totalY, 'TOTAL', {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '10px',
          color: '#ff69b4',
        })
        .setOrigin(0, 0.5)
    );

    let totalPar = 0;
    for (let h = 0; h < holesPlayed; h++) {
      totalPar += HOLES[this.startHoleIndex + h]!.par;
    }

    container.add(
      this.add
        .text(tableX + holeColW, totalY, `${totalPar}`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: '10px',
          color: '#aaaaaa',
        })
        .setOrigin(0.5, 0.5)
    );

    for (let p = 0; p < numPlayers; p++) {
      const px = tableX + holeColW + parColW + playerColW * p + playerColW / 2;
      const player = players[p]!;
      const playerScores = this.multiplayerScores![player.id]!;
      const total = playerScores.reduce((a, b) => a + b, 0);
      const diff = total - totalPar;

      container.add(
        this.add
          .text(px, totalY, `${total}`, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: '10px',
            color: diff <= 0 ? '#32cd32' : '#ff4444',
          })
          .setOrigin(0.5, 0.5)
      );
    }

    const winnerY = totalY + 36;
    const standings = players.map(p => {
      const s = this.multiplayerScores![p.id]!;
      return { player: p, total: s.reduce((a, b) => a + b, 0) };
    }).sort((a, b) => a.total - b.total);

    const winner = standings[0]!;

    container.add(
      this.add
        .text(cx, winnerY, `🏆 ${winner.player.name} WINS! 🏆`, {
          fontFamily: '"Arial Black", "Impact", sans-serif',
          fontSize: '18px',
          color: winner.player.colorHex,
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center',
        })
        .setOrigin(0.5)
    );

    const rankY = winnerY + 30;
    for (let i = 0; i < standings.length; i++) {
      const s = standings[i]!;
      const diff = s.total - totalPar;
      const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;

      container.add(
        this.add
          .text(cx - 80, rankY + i * 20, `${i + 1}. ${s.player.name}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: s.player.colorHex,
          })
          .setOrigin(0, 0.5)
      );

      container.add(
        this.add
          .text(cx + 80, rankY + i * 20, `${s.total} (${diffStr})`, {
            fontFamily: '"Arial Black", sans-serif',
            fontSize: '12px',
            color: diff <= 0 ? '#32cd32' : '#ff4444',
          })
          .setOrigin(1, 0.5)
      );
    }

    this.scrollContentH = (rankY + standings.length * 20 + 20) - scrollTop;

    this.setupScrolling(width);

    const btnY = height - 36;
    this.addMenuButton(cx, btnY);
  }

  private addMenuButton(cx: number, btnY: number): void {
    const btnContainer = this.add.container(cx, btnY);
    btnContainer.setDepth(20);

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

  private setupScrolling(w: number): void {
    if (!this.scrollContainer) return;

    const maxScroll = Math.max(0, this.scrollContentH - this.scrollViewH);
    if (maxScroll <= 0) return;

    const scrollZone = this.add.rectangle(w / 2, this.scrollViewTop + this.scrollViewH / 2, w, this.scrollViewH);
    scrollZone.setInteractive();
    scrollZone.setAlpha(0.001);
    scrollZone.setDepth(9);
    this.allObjects.push(scrollZone);

    let dragging = false;
    let dragStartY = 0;
    let scrollStartY = 0;

    scrollZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragging = true;
      dragStartY = pointer.y;
      scrollStartY = this.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!dragging || !this.scrollContainer) return;
      const dy = pointer.y - dragStartY;
      this.scrollY = Phaser.Math.Clamp(scrollStartY - dy, 0, maxScroll);
      this.scrollContainer.setY(-this.scrollY);
    });

    this.input.on('pointerup', () => {
      dragging = false;
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _go: Phaser.GameObjects.GameObject[], _dx: number, deltaY: number) => {
      if (!this.scrollContainer) return;
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, maxScroll);
      this.scrollContainer.setY(-this.scrollY);
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
