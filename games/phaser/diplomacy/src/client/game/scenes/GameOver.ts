import { Scene } from 'phaser';
import type { GameState, Country } from '../../../shared/types/game';
import { COUNTRY_NAMES, COUNTRY_COLORS, ALL_COUNTRIES, WIN_CONDITION } from '../../../shared/types/game';
import { SoundManager } from '../ui/SoundManager';

interface Standing {
  country: Country;
  scs: number;
  units: number;
  color: string;
  isWinner: boolean;
}

export class GameOver extends Scene {
  private gameState!: GameState;

  constructor() {
    super('GameOver');
  }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0a18');

    SoundManager.init(this);
    SoundManager.play('victory');

    const standings = this.computeStandings();

    const panelW = Math.min(500, width - 40);
    const panelX = (width - panelW) / 2;
    let y = 30;

    // Crown / trophy
    if (this.gameState.winner) {
      const crown = this.add
        .text(width / 2, y, '👑', { fontSize: '48px' })
        .setOrigin(0.5);
      this.tweens.add({
        targets: crown,
        scaleX: 1.15,
        scaleY: 1.15,
        yoyo: true,
        repeat: -1,
        duration: 800,
        ease: 'Sine.easeInOut',
      });
      y += 60;
    }

    // Title
    this.add
      .text(width / 2, y, 'GAME OVER', {
        fontFamily: 'Georgia, serif',
        fontSize: '36px',
        color: '#e6c200',
        letterSpacing: 6,
      })
      .setOrigin(0.5);
    y += 45;

    // Winner / draw
    if (this.gameState.winner) {
      const winnerName = COUNTRY_NAMES[this.gameState.winner];
      const winnerColor = COUNTRY_COLORS[this.gameState.winner];

      this.add
        .text(width / 2, y, `${winnerName} Achieves Victory!`, {
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          color: winnerColor,
        })
        .setOrigin(0.5);
      y += 30;

      this.add
        .text(width / 2, y, `Controlling ${standings[0]?.scs ?? 0} of ${WIN_CONDITION} required supply centers`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#8899aa',
          fontStyle: 'italic',
        })
        .setOrigin(0.5);
      y += 35;
    } else {
      this.add
        .text(width / 2, y, 'The game ends in a draw', {
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          color: '#aabbcc',
        })
        .setOrigin(0.5);
      y += 40;
    }

    // Turn info
    this.add
      .text(width / 2, y, `Final Turn: ${this.gameState.turn.season} ${this.gameState.turn.year}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#667788',
      })
      .setOrigin(0.5);
    y += 30;

    // Section header
    this.add
      .text(width / 2, y, 'FINAL STANDINGS', {
        fontFamily: 'Georgia, serif',
        fontSize: '16px',
        color: '#e6c200',
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    y += 28;

    // Bar chart
    const barMaxWidth = panelW - 140;
    const maxSC = Math.max(WIN_CONDITION, ...standings.map((s) => s.scs));
    const barHeight = 20;
    const rowGap = 30;

    for (const s of standings) {
      if (s.scs === 0 && s.units === 0) continue;

      const nameText = COUNTRY_NAMES[s.country];
      const barW = Math.max(4, (s.scs / maxSC) * barMaxWidth);
      const barColor = Phaser.Display.Color.HexStringToColor(s.color).color;

      // Country name
      this.add
        .text(panelX, y + barHeight / 2, nameText, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: s.color,
          fontStyle: s.isWinner ? 'bold' : 'normal',
        })
        .setOrigin(0, 0.5);

      // Animated bar
      const barX = panelX + 110;
      const bar = this.add.rectangle(barX, y, 0, barHeight, barColor, 0.85).setOrigin(0, 0);
      bar.setStrokeStyle(1, 0x000000, 0.5);

      this.tweens.add({
        targets: bar,
        width: barW,
        duration: 600,
        ease: 'Cubic.easeOut',
        delay: standings.indexOf(s) * 80,
      });

      // SC count + unit count
      this.add
        .text(barX + barMaxWidth + 8, y + barHeight / 2, `${s.scs} SC`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#ccddee',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);

      this.add
        .text(barX + barMaxWidth + 50, y + barHeight / 2, `${s.units}u`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: '#667788',
        })
        .setOrigin(0, 0.5);

      if (s.isWinner) {
        this.add
          .text(barX + barMaxWidth + 75, y + barHeight / 2, '★', {
            fontSize: '14px',
            color: '#e6c200',
          })
          .setOrigin(0, 0.5);
      }

      y += rowGap;
    }

    y += 15;

    // Turn log summary
    const logEntries = this.gameState.turnLog.filter((e) => e.startsWith('==='));
    if (logEntries.length > 0) {
      this.add
        .text(width / 2, y, `Game lasted ${logEntries.length} turn(s)`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#556677',
        })
        .setOrigin(0.5);
      y += 25;
    }

    // Buttons
    const btnY = Math.max(y + 10, height - 60);

    const historyBg = this.add.rectangle(width / 2 - 110, btnY, 200, 36, 0x2c3e50);
    historyBg.setStrokeStyle(2, 0xe6c200);
    historyBg.setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2 - 110, btnY, 'VIEW HISTORY', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#e6c200',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    historyBg.on('pointerover', () => historyBg.setStrokeStyle(3, 0xe6c200));
    historyBg.on('pointerout', () => historyBg.setStrokeStyle(2, 0xe6c200));
    historyBg.on('pointerdown', () => {
      SoundManager.destroy();
      this.scene.start('GamePlay', { gameState: this.gameState, currentPlayer: null, historyMode: true });
    });

    const lobbyBg = this.add.rectangle(width / 2 + 110, btnY, 200, 36, 0x2c3e50);
    lobbyBg.setStrokeStyle(2, 0xe6c200);
    lobbyBg.setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2 + 110, btnY, 'RETURN TO LOBBY', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#e6c200',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    lobbyBg.on('pointerover', () => lobbyBg.setStrokeStyle(3, 0xe6c200));
    lobbyBg.on('pointerout', () => lobbyBg.setStrokeStyle(2, 0xe6c200));
    lobbyBg.on('pointerdown', () => {
      SoundManager.destroy();
      this.scene.start('MainMenu');
    });
  }

  private computeStandings(): Standing[] {
    return ALL_COUNTRIES
      .map((country) => ({
        country,
        scs: Object.values(this.gameState.supplyCenters).filter((c) => c === country).length,
        units: this.gameState.units.filter((u) => u.country === country).length,
        color: COUNTRY_COLORS[country],
        isWinner: this.gameState.winner === country,
      }))
      .sort((a, b) => {
        if (a.isWinner) return -1;
        if (b.isWinner) return 1;
        return b.scs - a.scs || b.units - a.units;
      });
  }
}
