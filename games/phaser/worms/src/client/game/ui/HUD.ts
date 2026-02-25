import * as Phaser from 'phaser';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { WindSystem } from '../systems/WindSystem';
import { WEAPONS, WEAPON_ORDER } from '../../../shared/types/weapons';

const BG = 0x0f1923;
const BG_ALPHA = 0.85;
const SLOT_BG = 0x162231;
const SLOT_HOVER = 0x1e3044;
const SLOT_SEL_BG = 0x2a1525;
const SLOT_SEL_BORDER = 0xe94560;
const ACCENT = '#00e5ff';
const TEXT_PRIMARY = '#e6edf3';
const TEXT_DIM = '#6e7681';
const TOGGLE_BG = 0x1a2a3a;

const SLOT_SIZE = 36;
const SLOT_GAP = 3;
const PAD = 6;
const GRID_COLS = 3;
const TOGGLE_W = 20;
const INFO_H = 60;

export class HUD {
  private scene: Phaser.Scene;
  private weapons: WeaponSystem;
  private wind: WindSystem;

  private barContainer!: Phaser.GameObjects.Container;
  private weaponContainer!: Phaser.GameObjects.Container;
  private barBg!: Phaser.GameObjects.Graphics;

  private weaponSlots: {
    bg: Phaser.GameObjects.Graphics;
    icon: Phaser.GameObjects.Text;
    key: Phaser.GameObjects.Text;
  }[] = [];

  private powerBarFill!: Phaser.GameObjects.Graphics;
  private powerText!: Phaser.GameObjects.Text;
  private windArrow!: Phaser.GameObjects.Graphics;
  private windValueText!: Phaser.GameObjects.Text;

  private toggleBg!: Phaser.GameObjects.Graphics;
  private toggleArrow!: Phaser.GameObjects.Text;

  private stateText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private statusContainer!: Phaser.GameObjects.Container;

  private expanded = true;
  private animating = false;
  private hoveredSlot = -1;
  private _clickedThisFrame = false;
  private getActiveWormName: (() => string) | null = null;
  private getTurnTimer: (() => number) | null = null;
  private getTeam: (() => number) | null = null;
  private getIsRemoteTurn: (() => boolean) | null = null;

  private tooltipContainer!: Phaser.GameObjects.Container;
  private tooltipBg!: Phaser.GameObjects.Graphics;
  private tooltipTexts: Phaser.GameObjects.Text[] = [];
  private lastTooltipSlot = -1;

  private infoContainer!: Phaser.GameObjects.Container;

  private panelW = 0;
  private panelH = 0;
  private weaponGridH = 0;
  private stateH = 36;

  constructor(scene: Phaser.Scene, weapons: WeaponSystem, wind: WindSystem) {
    this.scene = scene;
    this.weapons = weapons;
    this.wind = wind;

    const cam = scene.cameras.main;
    const gridRows = Math.ceil(WEAPON_ORDER.length / GRID_COLS);
    this.weaponGridH = gridRows * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + PAD * 2;
    this.panelW = TOGGLE_W + PAD + GRID_COLS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + PAD * 2;
    this.panelH = this.stateH + this.weaponGridH + INFO_H + PAD;

    const panelY = Math.round((cam.height - this.panelH) / 2);

    this.barContainer = scene.add
      .container(0, panelY)
      .setDepth(200)
      .setScrollFactor(0);

    this.buildBarBg();
    this.buildToggle();
    this.buildStateRow();
    this.buildWeaponGrid();
    this.buildInfoSection();
    this.buildTooltip();
    this.setupInput();
  }

  setActiveWormNameGetter(fn: () => string): void {
    this.getActiveWormName = fn;
  }

  setTurnTimerGetter(fn: () => number): void {
    this.getTurnTimer = fn;
  }

  setTeamGetter(fn: () => number): void {
    this.getTeam = fn;
  }

  setRemoteTurnGetter(fn: () => boolean): void {
    this.getIsRemoteTurn = fn;
  }

  consumeClick(): boolean {
    if (this._clickedThisFrame) {
      this._clickedThisFrame = false;
      return true;
    }
    return false;
  }

  private get contentX(): number {
    return TOGGLE_W;
  }

  private buildBarBg(): void {
    this.barBg = this.scene.add.graphics();
    this.barContainer.add(this.barBg);
    this.drawBarBg();
  }

  private drawBarBg(): void {
    this.barBg.clear();
    const w = this.expanded ? this.panelW : TOGGLE_W;
    this.barBg.fillStyle(BG, BG_ALPHA);
    this.barBg.fillRoundedRect(0, 0, w, this.panelH, { tl: 0, tr: 10, bl: 0, br: 10 });
    this.barBg.lineStyle(1, 0x2a3a4a, 0.5);
    this.barBg.strokeRoundedRect(0, 0, w, this.panelH, { tl: 0, tr: 10, bl: 0, br: 10 });
  }

  private buildToggle(): void {
    this.toggleBg = this.scene.add.graphics();
    this.toggleBg.fillStyle(TOGGLE_BG, 0.8);
    this.toggleBg.fillRoundedRect(0, 0, TOGGLE_W, this.panelH, { tl: 0, tr: 0, bl: 0, br: 0 });
    this.barContainer.add(this.toggleBg);

    this.toggleArrow = this.scene.add
      .text(TOGGLE_W / 2, this.panelH / 2, '◀', {
        fontSize: '12px',
        color: ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.barContainer.add(this.toggleArrow);
  }

  private buildStateRow(): void {
    this.statusContainer = this.scene.add.container(this.contentX + PAD, PAD);
    this.barContainer.add(this.statusContainer);

    this.stateText = this.scene.add
      .text(0, 0, '', {
        fontSize: '10px',
        color: TEXT_PRIMARY,
        fontFamily: 'monospace',
        fontStyle: 'bold',
        wordWrap: { width: this.panelW - TOGGLE_W - PAD * 2 },
      })
      .setOrigin(0, 0);
    this.statusContainer.add(this.stateText);

    this.instructionText = this.scene.add
      .text(0, 14, '', {
        fontSize: '7px',
        color: TEXT_DIM,
        fontFamily: 'monospace',
        wordWrap: { width: this.panelW - TOGGLE_W - PAD * 2 },
      })
      .setOrigin(0, 0);
    this.statusContainer.add(this.instructionText);

    this.timerText = this.scene.add
      .text(this.panelW - TOGGLE_W - PAD * 2, 0, '', {
        fontSize: '12px',
        color: '#ffcc00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.statusContainer.add(this.timerText);
  }

  private buildWeaponGrid(): void {
    const gridY = this.stateH;
    this.weaponContainer = this.scene.add.container(this.contentX + PAD, gridY);
    this.barContainer.add(this.weaponContainer);

    for (let i = 0; i < WEAPON_ORDER.length; i++) {
      const weapon = WEAPONS[WEAPON_ORDER[i]!]!;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = col * (SLOT_SIZE + SLOT_GAP);
      const y = PAD + row * (SLOT_SIZE + SLOT_GAP);

      const bg = this.scene.add.graphics();
      bg.fillStyle(SLOT_BG, 0.9);
      bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
      bg.lineStyle(1, 0x2a3a4a, 0.4);
      bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
      this.weaponContainer.add(bg);

      const icon = this.scene.add
        .text(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2 - 2, weapon.icon, { fontSize: '16px' })
        .setOrigin(0.5);
      this.weaponContainer.add(icon);

      const key = this.scene.add
        .text(x + SLOT_SIZE - 3, y + 2, `${i + 1}`, {
          fontSize: '7px',
          color: TEXT_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0);
      this.weaponContainer.add(key);

      this.weaponSlots.push({ bg, icon, key });
    }
  }

  private buildInfoSection(): void {
    const infoY = this.stateH + this.weaponGridH;
    this.infoContainer = this.scene.add.container(this.contentX + PAD, infoY);
    this.barContainer.add(this.infoContainer);

    const sectionW = this.panelW - TOGGLE_W - PAD * 2;

    const pwrLabel = this.scene.add.text(0, 0, 'POWER', {
      fontSize: '7px',
      color: TEXT_DIM,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    this.infoContainer.add(pwrLabel);

    this.powerText = this.scene.add
      .text(sectionW, 0, '50%', {
        fontSize: '9px',
        color: TEXT_PRIMARY,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.infoContainer.add(this.powerText);

    this.powerBarFill = this.scene.add.graphics();
    this.infoContainer.add(this.powerBarFill);

    const windLabel = this.scene.add.text(0, 28, 'WIND', {
      fontSize: '7px',
      color: TEXT_DIM,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    this.infoContainer.add(windLabel);

    this.windValueText = this.scene.add
      .text(sectionW, 28, '', {
        fontSize: '9px',
        color: TEXT_PRIMARY,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.infoContainer.add(this.windValueText);

    this.windArrow = this.scene.add.graphics();
    this.infoContainer.add(this.windArrow);
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const local = {
        x: pointer.x - this.barContainer.x,
        y: pointer.y - this.barContainer.y,
      };

      if (local.x < 0 || local.y < 0 || local.y > this.panelH) return;
      const panelW = this.expanded ? this.panelW : TOGGLE_W;
      if (local.x > panelW) return;

      this._clickedThisFrame = true;

      if (local.x < TOGGLE_W) {
        this.toggle();
        return;
      }

      if (this.expanded) {
        const gridY = this.stateH;
        const gridLocalX = local.x - this.contentX - PAD;
        const gridLocalY = local.y - gridY - PAD;

        if (gridLocalX >= 0 && gridLocalY >= 0) {
          const col = Math.floor(gridLocalX / (SLOT_SIZE + SLOT_GAP));
          const row = Math.floor(gridLocalY / (SLOT_SIZE + SLOT_GAP));
          const inSlotX = gridLocalX - col * (SLOT_SIZE + SLOT_GAP);
          const inSlotY = gridLocalY - row * (SLOT_SIZE + SLOT_GAP);

          if (col < GRID_COLS && inSlotX <= SLOT_SIZE && inSlotY <= SLOT_SIZE) {
            const idx = row * GRID_COLS + col;
            if (idx < WEAPON_ORDER.length) {
              this.weapons.selectWeapon(idx);
              return;
            }
          }
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const local = {
        x: pointer.x - this.barContainer.x,
        y: pointer.y - this.barContainer.y,
      };

      if (
        !this.expanded ||
        local.x < this.contentX ||
        local.x > this.panelW ||
        local.y < this.stateH ||
        local.y > this.stateH + this.weaponGridH
      ) {
        if (this.hoveredSlot !== -1) this.hoveredSlot = -1;
        return;
      }

      const gridLocalX = local.x - this.contentX - PAD;
      const gridLocalY = local.y - this.stateH - PAD;
      const col = Math.floor(gridLocalX / (SLOT_SIZE + SLOT_GAP));
      const row = Math.floor(gridLocalY / (SLOT_SIZE + SLOT_GAP));
      const inSlotX = gridLocalX - col * (SLOT_SIZE + SLOT_GAP);
      const inSlotY = gridLocalY - row * (SLOT_SIZE + SLOT_GAP);

      let found = -1;
      if (col >= 0 && col < GRID_COLS && inSlotX <= SLOT_SIZE && inSlotY >= 0 && inSlotY <= SLOT_SIZE) {
        const idx = row * GRID_COLS + col;
        if (idx >= 0 && idx < WEAPON_ORDER.length) found = idx;
      }
      this.hoveredSlot = found;
    });
  }

  private toggle(): void {
    if (this.animating) return;
    this.expanded = !this.expanded;

    const contentVisible = this.expanded;
    this.weaponContainer.setVisible(contentVisible);
    this.statusContainer.setVisible(contentVisible);
    this.infoContainer.setVisible(contentVisible);

    this.toggleArrow.setText(this.expanded ? '◀' : '▶');
    this.drawBarBg();
  }

  update(): void {
    this.updateWeaponSlots();
    this.updatePowerBar();
    this.updateWindIndicator();
    this.updateStateDisplay();
    this.updateTimer();
    this.updateTooltip();
  }

  private updateWeaponSlots(): void {
    if (!this.expanded) return;

    const selectedIdx = this.weapons.weaponIndex;

    for (let i = 0; i < this.weaponSlots.length; i++) {
      const slot = this.weaponSlots[i]!;
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const x = col * (SLOT_SIZE + SLOT_GAP);
      const y = PAD + row * (SLOT_SIZE + SLOT_GAP);
      slot.bg.clear();

      if (i === selectedIdx) {
        slot.bg.fillStyle(SLOT_SEL_BG, 0.95);
        slot.bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
        slot.bg.lineStyle(2, SLOT_SEL_BORDER, 0.9);
        slot.bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
      } else if (i === this.hoveredSlot) {
        slot.bg.fillStyle(SLOT_HOVER, 0.9);
        slot.bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
        slot.bg.lineStyle(1, 0x3a5a7a, 0.5);
        slot.bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
      } else {
        slot.bg.fillStyle(SLOT_BG, 0.9);
        slot.bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
        slot.bg.lineStyle(1, 0x2a3a4a, 0.4);
        slot.bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 6);
      }
    }
  }

  private updatePowerBar(): void {
    const sectionW = this.panelW - TOGGLE_W - PAD * 2;
    const barX = 0;
    const barY = 12;
    const barW = sectionW;
    const barH = 6;
    const power = this.weapons.currentPower;

    this.powerBarFill.clear();
    this.powerBarFill.fillStyle(0x1a2a3a, 1);
    this.powerBarFill.fillRoundedRect(barX, barY, barW, barH, 3);

    const fillW = Math.max(3, (power / 100) * barW);
    const color = power < 40 ? 0x3fb950 : power < 70 ? 0xd29922 : 0xf85149;
    this.powerBarFill.fillStyle(color, 1);
    this.powerBarFill.fillRoundedRect(barX, barY, fillW, barH, 3);

    this.powerText.setText(`${Math.round(power)}%`);
  }

  private updateWindIndicator(): void {
    const sectionW = this.panelW - TOGGLE_W - PAD * 2;
    const windVal = this.wind.getWind();
    const arrowX = sectionW / 2;
    const arrowY = 42;

    this.windArrow.clear();
    const arrowLen = Math.min(Math.abs(windVal) * 3, sectionW / 2 - 4);

    if (Math.abs(windVal) > 0.5) {
      const dir = windVal > 0 ? 1 : -1;
      const arrowColor = windVal > 0 ? 0x58a6ff : 0xf85149;

      this.windArrow.lineStyle(2, arrowColor, 0.85);
      this.windArrow.beginPath();
      this.windArrow.moveTo(arrowX - dir * arrowLen, arrowY);
      this.windArrow.lineTo(arrowX + dir * arrowLen, arrowY);
      this.windArrow.strokePath();

      this.windArrow.fillStyle(arrowColor, 0.85);
      this.windArrow.fillTriangle(
        arrowX + dir * arrowLen,
        arrowY,
        arrowX + dir * (arrowLen - 4),
        arrowY - 3,
        arrowX + dir * (arrowLen - 4),
        arrowY + 3,
      );
    } else {
      this.windArrow.fillStyle(0x3a5a7a, 0.6);
      this.windArrow.fillCircle(arrowX, arrowY, 2);
    }

    const dirLabel = windVal > 0.5 ? '→' : windVal < -0.5 ? '←' : '·';
    this.windValueText.setText(`${dirLabel} ${Math.abs(windVal).toFixed(1)}`);
  }

  private updateStateDisplay(): void {
    const state = this.weapons.currentState;
    const weapon = this.weapons.currentWeapon;
    const team = this.getTeam?.() ?? 0;
    const teamLabels = ['🔴', '🔵', '🟡', '🟣'];
    const teamLabel = teamLabels[team] ?? '🔴';
    const isRemote = this.getIsRemoteTurn?.() ?? false;

    if (isRemote) {
      if (state === 'firing') {
        this.stateText.setText(`${teamLabel} 💥 Firing...`);
        this.instructionText.setText('');
      } else if (state === 'resolved') {
        this.stateText.setText(`${teamLabel} ✓ Complete`);
        this.instructionText.setText('');
      } else {
        this.stateText.setText(`${teamLabel} ⏳ Opponent`);
        this.instructionText.setText('Watching...');
      }
      return;
    }

    switch (state) {
      case 'idle':
        this.stateText.setText(`${teamLabel} ${weapon.icon} ${weapon.name}`);
        this.instructionText.setText('Click:Aim · W:Jump · ←→:Move');
        break;
      case 'aiming':
        this.stateText.setText(`${teamLabel} Aiming ${weapon.icon}`);
        this.instructionText.setText('Scroll:Power · Click:Fire');
        break;
      case 'firing':
        this.stateText.setText(`${teamLabel} 💥 Firing...`);
        this.instructionText.setText('');
        break;
      case 'resolved':
        this.stateText.setText(`${teamLabel} ✓ Complete`);
        this.instructionText.setText('ENTER: next turn');
        break;
    }
  }

  private updateTimer(): void {
    const timer = this.getTurnTimer?.() ?? 0;
    const state = this.weapons.currentState;
    if (state === 'resolved' || state === 'firing') {
      this.timerText.setText('');
      return;
    }
    if (timer <= 0) {
      this.timerText.setColor('#88ff88');
      this.timerText.setText('∞');
      return;
    }
    const color = timer <= 10 ? '#ff4444' : timer <= 20 ? '#ffcc00' : '#88ff88';
    this.timerText.setColor(color);
    this.timerText.setText(`${timer}s`);
  }

  private buildTooltip(): void {
    const TT_PAD = 6;
    const LINE_H = 14;
    const ttW = 180;
    const numLines = 3;
    const ttH = TT_PAD + numLines * LINE_H + TT_PAD;

    this.tooltipContainer = this.scene.add.container(0, 0).setDepth(300).setScrollFactor(0);
    this.tooltipContainer.setVisible(false);

    this.tooltipBg = this.scene.add.graphics();
    this.tooltipBg.fillStyle(0x0f1923, 0.95);
    this.tooltipBg.fillRoundedRect(0, 0, ttW, ttH, 6);
    this.tooltipBg.lineStyle(1, 0x00e5ff, 0.4);
    this.tooltipBg.strokeRoundedRect(0, 0, ttW, ttH, 6);
    this.tooltipContainer.add(this.tooltipBg);

    const styles: { fontSize: string; color: string; fontStyle: string }[] = [
      { fontSize: '10px', color: '#00e5ff', fontStyle: 'bold' },
      { fontSize: '9px', color: '#e6edf3', fontStyle: 'normal' },
      { fontSize: '8px', color: '#6e7681', fontStyle: 'normal' },
    ];

    for (let i = 0; i < numLines; i++) {
      const t = this.scene.add
        .text(TT_PAD, TT_PAD + i * LINE_H, '', {
          fontSize: styles[i]!.fontSize,
          color: styles[i]!.color,
          fontFamily: 'monospace',
          fontStyle: styles[i]!.fontStyle,
          wordWrap: { width: ttW - TT_PAD * 2 },
        })
        .setOrigin(0, 0);
      this.tooltipContainer.add(t);
      this.tooltipTexts.push(t);
    }
  }

  private updateTooltip(): void {
    if (!this.expanded || this.hoveredSlot === -1) {
      this.tooltipContainer.setVisible(false);
      this.lastTooltipSlot = -1;
      return;
    }

    if (this.hoveredSlot === this.lastTooltipSlot && this.tooltipContainer.visible) return;
    this.lastTooltipSlot = this.hoveredSlot;

    const weapon = WEAPONS[WEAPON_ORDER[this.hoveredSlot]!]!;
    const ttW = 180;
    const TT_PAD = 6;
    const LINE_H = 14;
    const ttH = TT_PAD + 3 * LINE_H + TT_PAD;

    const lines = [
      `${weapon.icon} ${weapon.name}`,
      `\u{1F4A5} ${weapon.damage} dmg  \u00B7 \u{1F4A3} ${weapon.blastRadius}px`,
      weapon.description,
    ];

    for (let i = 0; i < this.tooltipTexts.length; i++) {
      this.tooltipTexts[i]!.setText(lines[i] ?? '');
    }

    this.tooltipBg.clear();
    this.tooltipBg.fillStyle(0x0f1923, 0.95);
    this.tooltipBg.fillRoundedRect(0, 0, ttW, ttH, 6);
    this.tooltipBg.lineStyle(1, 0x00e5ff, 0.4);
    this.tooltipBg.strokeRoundedRect(0, 0, ttW, ttH, 6);

    const col = this.hoveredSlot % GRID_COLS;
    const row = Math.floor(this.hoveredSlot / GRID_COLS);
    const slotX = this.contentX + PAD + col * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE;
    const slotY = this.barContainer.y + this.stateH + PAD + row * (SLOT_SIZE + SLOT_GAP);

    const tooltipX = this.barContainer.x + slotX + 6;
    const tooltipY = slotY;

    const cam = this.scene.cameras.main;
    this.tooltipContainer.setPosition(
      Math.min(tooltipX, cam.width - ttW - 4),
      Math.max(4, Math.min(tooltipY, cam.height - ttH - 4)),
    );
    this.tooltipContainer.setVisible(true);
  }

  getContainers(): Phaser.GameObjects.GameObject[] {
    return [this.barContainer, this.tooltipContainer];
  }

  destroy(): void {
    this.tooltipContainer?.destroy();
    this.barContainer.destroy();
  }
}
