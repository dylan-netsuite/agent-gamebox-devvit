import * as Phaser from 'phaser';
import type { GameState, Country } from '../../../shared/types/game';
import { COUNTRY_COLORS, ALL_COUNTRIES } from '../../../shared/types/game';

export class StatusBar {
  private container: Phaser.GameObjects.Container;
  private turnText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private scTexts: Map<Country, Phaser.GameObjects.Text> = new Map();
  readonly height: number;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, compact = false) {
    this.container = scene.add.container(x, y);
    this.container.setDepth(50);

    // Always use a compact single-row layout to maximize map space
    this.height = compact ? 32 : 38;

    const bg = scene.add.rectangle(width / 2, this.height / 2, width, this.height, 0x111122, 0.92);
    bg.setStrokeStyle(1, 0x334455);
    this.container.add(bg);

    const fontSize = compact ? '12px' : '14px';
    const scFontSize = compact ? '9px' : '10px';
    const dotR = compact ? 3.5 : 4;

    this.turnText = scene.add
      .text(8, this.height / 2, '', {
        fontFamily: 'Georgia, serif',
        fontSize,
        color: '#e6c200',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.turnText);

    this.phaseText = scene.add
      .text(compact ? 120 : 140, this.height / 2, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: compact ? '9px' : '10px',
        color: '#8899aa',
      })
      .setOrigin(0, 0.5);
    this.container.add(this.phaseText);

    const scSpacing = compact ? 28 : Math.min(40, (width - 200) / ALL_COUNTRIES.length);
    let scX = width - ALL_COUNTRIES.length * scSpacing - 5;
    for (const country of ALL_COUNTRIES) {
      const color = COUNTRY_COLORS[country];
      const dot = scene.add.circle(scX, this.height / 2, dotR, Phaser.Display.Color.HexStringToColor(color).color);
      this.container.add(dot);

      const txt = scene.add
        .text(scX + dotR + 3, this.height / 2, '', {
          fontFamily: 'Arial, sans-serif',
          fontSize: scFontSize,
          color: '#aabbcc',
        })
        .setOrigin(0, 0.5);
      this.container.add(txt);
      this.scTexts.set(country, txt);

      scX += scSpacing;
    }
  }

  update(gameState: GameState): void {
    this.turnText.setText(`${gameState.turn.season} ${gameState.turn.year}`);

    const phaseNames: Record<string, string> = {
      waiting: 'Waiting',
      diplomacy: 'Diplomacy',
      orders: 'Orders',
      retreats: 'Retreats',
      builds: 'Builds',
      complete: 'Game Over',
    };
    this.phaseText.setText(phaseNames[gameState.phase] ?? gameState.phase);

    for (const country of ALL_COUNTRIES) {
      const scCount = Object.values(gameState.supplyCenters).filter(
        (c) => c === country
      ).length;
      const unitCount = gameState.units.filter((u) => u.country === country).length;
      const txt = this.scTexts.get(country);
      if (txt) {
        txt.setText(`${country.charAt(0)}: ${scCount}/${unitCount}`);
      }
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
