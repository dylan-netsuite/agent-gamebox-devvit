import * as Phaser from 'phaser';
import { PROVINCES } from '../../../shared/data/provinces';
import type { GameState, Unit } from '../../../shared/types/game';
import { COUNTRY_NAMES, COUNTRY_COLORS } from '../../../shared/types/game';

const TOOLTIP_BG = 0x0e1520;
const TOOLTIP_BORDER = 0x3a5060;
const TOOLTIP_PADDING = 8;
const MAX_WIDTH = 200;

export class ProvinceTooltip {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private detailText: Phaser.GameObjects.Text;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(200);
    this.container.setAlpha(0);

    this.bg = scene.add.rectangle(0, 0, MAX_WIDTH, 50, TOOLTIP_BG, 0.95);
    this.bg.setStrokeStyle(1, TOOLTIP_BORDER);
    this.bg.setOrigin(0, 0);
    this.container.add(this.bg);

    this.nameText = scene.add
      .text(TOOLTIP_PADDING, TOOLTIP_PADDING, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#e6c200',
        fontStyle: 'bold',
        wordWrap: { width: MAX_WIDTH - TOOLTIP_PADDING * 2 },
      })
      .setOrigin(0, 0);
    this.container.add(this.nameText);

    this.detailText = scene.add
      .text(TOOLTIP_PADDING, 26, '', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10px',
        color: '#aabbcc',
        wordWrap: { width: MAX_WIDTH - TOOLTIP_PADDING * 2 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0);
    this.container.add(this.detailText);
  }

  show(provinceId: string, worldX: number, worldY: number, gameState: GameState): void {
    const province = PROVINCES[provinceId];
    if (!province) return;

    // Build info lines
    const lines: string[] = [];

    // Type
    const typeLabel = province.type === 'water' ? 'Sea zone' : province.type === 'coastal' ? 'Coastal' : 'Inland';
    lines.push(typeLabel + (province.supplyCenter ? ' • Supply Center' : ''));

    // Owner (for SCs)
    if (province.supplyCenter) {
      const owner = gameState.supplyCenters[provinceId];
      if (owner) {
        lines.push(`Owner: ${COUNTRY_NAMES[owner]}`);
      } else {
        lines.push('Neutral');
      }
    }

    // Units
    const units = gameState.units.filter((u: Unit) => u.province === provinceId);
    for (const unit of units) {
      lines.push(`${COUNTRY_NAMES[unit.country]} ${unit.type}`);
    }

    this.nameText.setText(province.name);

    // Color the name by owner if applicable
    if (province.supplyCenter) {
      const owner = gameState.supplyCenters[provinceId];
      if (owner && COUNTRY_COLORS[owner]) {
        this.nameText.setColor(COUNTRY_COLORS[owner]);
      } else {
        this.nameText.setColor('#e6c200');
      }
    } else {
      this.nameText.setColor('#e6c200');
    }

    this.detailText.setText(lines.join('\n'));

    // Resize background
    const textHeight = this.nameText.height + this.detailText.height + TOOLTIP_PADDING * 3;
    const textWidth = Math.max(this.nameText.width, this.detailText.width) + TOOLTIP_PADDING * 2;
    this.bg.setSize(Math.min(MAX_WIDTH, Math.max(120, textWidth)), textHeight);

    // Position tooltip — offset from cursor, keep on screen
    const { width } = this.scene.scale;
    let tx = worldX + 15;
    let ty = worldY - textHeight - 5;
    if (tx + MAX_WIDTH > width) tx = worldX - MAX_WIDTH - 10;
    if (ty < 0) ty = worldY + 20;

    this.container.setPosition(tx, ty);

    if (!this.visible) {
      this.visible = true;
      this.scene.tweens.add({
        targets: this.container,
        alpha: 1,
        duration: 150,
        ease: 'Power2',
      });
    }
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 100,
      ease: 'Power2',
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
