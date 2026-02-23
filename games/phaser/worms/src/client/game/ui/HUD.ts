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

const SLOT_SIZE = 48;
const SLOT_GAP = 5;
const PAD = 8;
const INFO_W = 120;
const TOGGLE_H = 24;
const BAR_H = 42;

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

  private tooltipContainer: Phaser.GameObjects.Container | null = null;
  private tooltipBg: Phaser.GameObjects.Graphics | null = null;
  private tooltipTexts: Phaser.GameObjects.Text[] = [];
  private lastTooltipSlot = -1;

  private barY = 0;
  private panelW = 0;
  private panelX = 0;
  private weaponRowH = 0;
  private totalExpandedH = 0;

  constructor(scene: Phaser.Scene, weapons: WeaponSystem, wind: WindSystem) {
    this.scene = scene;
    this.weapons = weapons;
    this.wind = wind;

    const cam = scene.cameras.main;
    const weaponCount = WEAPON_ORDER.length;
    this.panelW = INFO_W + PAD + weaponCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP + PAD + INFO_W;
    this.panelW = Math.min(this.panelW, cam.width - 20);
    this.panelX = (cam.width - this.panelW) / 2;
    this.weaponRowH = SLOT_SIZE + PAD * 2;
    this.totalExpandedH = TOGGLE_H + this.weaponRowH + BAR_H;
    this.barY = cam.height - this.totalExpandedH;

    this.barContainer = scene.add
      .container(this.panelX, this.barY)
      .setDepth(200)
      .setScrollFactor(0);

    this.buildBarBg();
    this.buildToggle();
    this.buildWeaponRow();
    this.buildInfoBar();
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

  consumeClick(): boolean {
    if (this._clickedThisFrame) {
      this._clickedThisFrame = false;
      return true;
    }
    return false;
  }

  private buildBarBg(): void {
    this.barBg = this.scene.add.graphics();
    this.barContainer.add(this.barBg);
    this.drawBarBg();
  }

  private drawBarBg(): void {
    this.barBg.clear();
    const h = this.expanded ? this.totalExpandedH : TOGGLE_H + BAR_H;
    this.barBg.fillStyle(BG, BG_ALPHA);
    this.barBg.fillRoundedRect(0, 0, this.panelW, h, { tl: 10, tr: 10, bl: 0, br: 0 });
    this.barBg.lineStyle(1, 0x2a3a4a, 0.5);
    this.barBg.strokeRoundedRect(0, 0, this.panelW, h, { tl: 10, tr: 10, bl: 0, br: 0 });
  }

  private buildToggle(): void {
    this.toggleBg = this.scene.add.graphics();
    this.toggleBg.fillStyle(TOGGLE_BG, 0.8);
    this.toggleBg.fillRoundedRect(0, 0, this.panelW, TOGGLE_H, {
      tl: 10,
      tr: 10,
      bl: 0,
      br: 0,
    });
    this.barContainer.add(this.toggleBg);

    this.toggleArrow = this.scene.add
      .text(this.panelW / 2, TOGGLE_H / 2, '▼', {
        fontSize: '12px',
        color: ACCENT,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.barContainer.add(this.toggleArrow);
  }

  private buildWeaponRow(): void {
    this.weaponContainer = this.scene.add.container(0, TOGGLE_H);
    this.barContainer.add(this.weaponContainer);

    const weaponCount = WEAPON_ORDER.length;
    const totalSlotsW = weaponCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (this.panelW - totalSlotsW) / 2;

    for (let i = 0; i < weaponCount; i++) {
      const weapon = WEAPONS[WEAPON_ORDER[i]!]!;
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const y = PAD;

      const bg = this.scene.add.graphics();
      bg.fillStyle(SLOT_BG, 0.9);
      bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
      bg.lineStyle(1, 0x2a3a4a, 0.4);
      bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
      this.weaponContainer.add(bg);

      const icon = this.scene.add
        .text(x + SLOT_SIZE / 2, y + SLOT_SIZE / 2 - 2, weapon.icon, { fontSize: '20px' })
        .setOrigin(0.5);
      this.weaponContainer.add(icon);

      const key = this.scene.add
        .text(x + SLOT_SIZE - 4, y + 3, `${i + 1}`, {
          fontSize: '8px',
          color: TEXT_DIM,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(1, 0);
      this.weaponContainer.add(key);

      this.weaponSlots.push({ bg, icon, key });
    }
  }

  private buildInfoBar(): void {
    this.statusContainer = this.scene.add.container(0, 0);
    this.barContainer.add(this.statusContainer);
    this.statusContainer.setData('__infoBar', true);

    const powerX = PAD;
    const pwrLabel = this.scene.add.text(powerX + 4, 4, 'POWER', {
      fontSize: '8px',
      color: TEXT_DIM,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    this.statusContainer.add(pwrLabel);

    this.powerText = this.scene.add
      .text(powerX + INFO_W - 8, 4, '50%', {
        fontSize: '10px',
        color: TEXT_PRIMARY,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.statusContainer.add(this.powerText);

    this.powerBarFill = this.scene.add.graphics();
    this.statusContainer.add(this.powerBarFill);

    const centerX = this.panelW / 2;

    this.stateText = this.scene.add
      .text(centerX, 4, '', {
        fontSize: '12px',
        color: TEXT_PRIMARY,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);
    this.statusContainer.add(this.stateText);

    this.instructionText = this.scene.add
      .text(centerX, 20, '', {
        fontSize: '8px',
        color: TEXT_DIM,
        fontFamily: 'monospace',
      })
      .setOrigin(0.5, 0);
    this.statusContainer.add(this.instructionText);

    this.timerText = this.scene.add
      .text(centerX + 90, 4, '', {
        fontSize: '14px',
        color: '#ffcc00',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);
    this.statusContainer.add(this.timerText);

    const windX = this.panelW - INFO_W - PAD;
    const windLabel = this.scene.add.text(windX + 4, 4, 'WIND', {
      fontSize: '8px',
      color: TEXT_DIM,
      fontFamily: 'monospace',
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    this.statusContainer.add(windLabel);

    this.windValueText = this.scene.add
      .text(windX + INFO_W - 8, 4, '', {
        fontSize: '10px',
        color: TEXT_PRIMARY,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.statusContainer.add(this.windValueText);

    this.windArrow = this.scene.add.graphics();
    this.statusContainer.add(this.windArrow);

    this.repositionInfoBar();
  }

  private repositionInfoBar(): void {
    const infoY = this.expanded ? TOGGLE_H + this.weaponRowH : TOGGLE_H;
    this.statusContainer.y = infoY;
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - this.panelX;
      const localY = pointer.y - this.barContainer.y;

      if (localX < 0 || localX > this.panelW || localY < 0) return;

      const panelH = this.expanded ? this.totalExpandedH : TOGGLE_H + BAR_H;
      if (localY > panelH) return;

      this._clickedThisFrame = true;

      if (localY < TOGGLE_H) {
        this.toggle();
        return;
      }

      if (this.expanded && localY >= TOGGLE_H && localY < TOGGLE_H + this.weaponRowH) {
        const weaponCount = WEAPON_ORDER.length;
        const totalSlotsW = weaponCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
        const startX = (this.panelW - totalSlotsW) / 2;
        const slotLocalY = localY - TOGGLE_H - PAD;

        if (slotLocalY >= 0 && slotLocalY <= SLOT_SIZE) {
          for (let i = 0; i < weaponCount; i++) {
            const sx = startX + i * (SLOT_SIZE + SLOT_GAP);
            if (localX >= sx && localX <= sx + SLOT_SIZE) {
              this.weapons.selectWeapon(i);
              return;
            }
          }
        }
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - this.panelX;
      const localY = pointer.y - this.barContainer.y;

      if (
        !this.expanded ||
        localX < 0 ||
        localX > this.panelW ||
        localY < TOGGLE_H ||
        localY >= TOGGLE_H + this.weaponRowH
      ) {
        if (this.hoveredSlot !== -1) this.hoveredSlot = -1;
        return;
      }

      const weaponCount = WEAPON_ORDER.length;
      const totalSlotsW = weaponCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
      const startX = (this.panelW - totalSlotsW) / 2;
      const slotLocalY = localY - TOGGLE_H - PAD;

      let found = -1;
      if (slotLocalY >= 0 && slotLocalY <= SLOT_SIZE) {
        for (let i = 0; i < weaponCount; i++) {
          const sx = startX + i * (SLOT_SIZE + SLOT_GAP);
          if (localX >= sx && localX <= sx + SLOT_SIZE) {
            found = i;
            break;
          }
        }
      }
      this.hoveredSlot = found;
    });
  }

  private toggle(): void {
    if (this.animating) return;
    this.animating = true;
    this.expanded = !this.expanded;

    const cam = this.scene.cameras.main;
    const targetY = this.expanded
      ? cam.height - this.totalExpandedH
      : cam.height - (TOGGLE_H + BAR_H);

    this.scene.tweens.add({
      targets: this.barContainer,
      y: targetY,
      duration: 200,
      ease: 'Cubic.easeOut',
      onUpdate: () => {
        this.drawBarBg();
        this.repositionInfoBar();
      },
      onComplete: () => {
        this.animating = false;
        this.weaponContainer.setVisible(this.expanded);
        this.toggleArrow.setText(this.expanded ? '▼' : '▲');
        this.drawBarBg();
        this.repositionInfoBar();
      },
    });
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
    const weaponCount = WEAPON_ORDER.length;
    const totalSlotsW = weaponCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (this.panelW - totalSlotsW) / 2;

    for (let i = 0; i < this.weaponSlots.length; i++) {
      const slot = this.weaponSlots[i]!;
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);
      const y = PAD;
      slot.bg.clear();

      if (i === selectedIdx) {
        slot.bg.fillStyle(SLOT_SEL_BG, 0.95);
        slot.bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
        slot.bg.lineStyle(2, SLOT_SEL_BORDER, 0.9);
        slot.bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
      } else if (i === this.hoveredSlot) {
        slot.bg.fillStyle(SLOT_HOVER, 0.9);
        slot.bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
        slot.bg.lineStyle(1, 0x3a5a7a, 0.5);
        slot.bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
      } else {
        slot.bg.fillStyle(SLOT_BG, 0.9);
        slot.bg.fillRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
        slot.bg.lineStyle(1, 0x2a3a4a, 0.4);
        slot.bg.strokeRoundedRect(x, y, SLOT_SIZE, SLOT_SIZE, 8);
      }
    }
  }

  private updatePowerBar(): void {
    const barX = PAD + 8;
    const barY = 20;
    const barW = INFO_W - 16;
    const barH = 8;
    const power = this.weapons.currentPower;

    this.powerBarFill.clear();
    this.powerBarFill.fillStyle(0x1a2a3a, 1);
    this.powerBarFill.fillRoundedRect(barX, barY, barW, barH, 4);

    const fillW = Math.max(4, (power / 100) * barW);
    const color = power < 40 ? 0x3fb950 : power < 70 ? 0xd29922 : 0xf85149;
    this.powerBarFill.fillStyle(color, 1);
    this.powerBarFill.fillRoundedRect(barX, barY, fillW, barH, 4);

    this.powerText.setText(`${Math.round(power)}%`);
  }

  private updateWindIndicator(): void {
    const windVal = this.wind.getWind();
    const windX = this.panelW - INFO_W - PAD;
    const arrowX = windX + INFO_W / 2;
    const arrowY = 26;

    this.windArrow.clear();
    const arrowLen = Math.min(Math.abs(windVal) * 3, 40);

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
        arrowX + dir * (arrowLen - 5),
        arrowY - 3,
        arrowX + dir * (arrowLen - 5),
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
    const teamLabel = team === 0 ? '🔴' : '🔵';

    switch (state) {
      case 'idle':
        this.stateText.setText(`${teamLabel} ${weapon.icon} ${weapon.name}`);
        this.instructionText.setText('Click:Aim · W:Jump · ←→:Move · Drag:Pan · F:Center');
        break;
      case 'aiming':
        this.stateText.setText(`${teamLabel} Aiming ${weapon.icon} ${weapon.name}`);
        this.instructionText.setText('Aim · Scroll:Power · Click:Fire');
        break;
      case 'firing':
        this.stateText.setText(`${teamLabel} 💥 Firing...`);
        this.instructionText.setText('');
        break;
      case 'resolved':
        this.stateText.setText(`${teamLabel} ✓ Turn Complete`);
        this.instructionText.setText('ENTER for next turn');
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
      this.timerText.setText('⏱∞');
      return;
    }
    const color = timer <= 10 ? '#ff4444' : timer <= 20 ? '#ffcc00' : '#88ff88';
    this.timerText.setColor(color);
    this.timerText.setText(`⏱${timer}s`);
  }

  private updateTooltip(): void {
    if (!this.expanded || this.hoveredSlot === -1) {
      if (this.tooltipContainer) {
        this.tooltipContainer.setVisible(false);
      }
      this.lastTooltipSlot = -1;
      return;
    }

    if (this.hoveredSlot === this.lastTooltipSlot && this.tooltipContainer?.visible) return;
    this.lastTooltipSlot = this.hoveredSlot;

    const weapon = WEAPONS[WEAPON_ORDER[this.hoveredSlot]!]!;

    if (this.tooltipContainer) {
      this.tooltipContainer.destroy();
    }

    this.tooltipContainer = this.scene.add.container(0, 0).setDepth(300).setScrollFactor(0);
    this.tooltipTexts = [];

    const lines = [
      `${weapon.icon} ${weapon.name}`,
      `💥 ${weapon.damage} dmg  · 💣 ${weapon.blastRadius}px radius`,
      weapon.description,
    ];

    const TT_PAD = 8;
    const LINE_H = 16;
    const ttW = 220;
    const ttH = TT_PAD + lines.length * LINE_H + TT_PAD;

    this.tooltipBg = this.scene.add.graphics();
    this.tooltipBg.fillStyle(0x0f1923, 0.95);
    this.tooltipBg.fillRoundedRect(0, 0, ttW, ttH, 6);
    this.tooltipBg.lineStyle(1, 0x00e5ff, 0.4);
    this.tooltipBg.strokeRoundedRect(0, 0, ttW, ttH, 6);
    this.tooltipContainer.add(this.tooltipBg);

    for (let i = 0; i < lines.length; i++) {
      const t = this.scene.add
        .text(TT_PAD, TT_PAD + i * LINE_H, lines[i]!, {
          fontSize: i === 0 ? '11px' : i === 2 ? '9px' : '10px',
          color: i === 0 ? '#00e5ff' : i === 2 ? '#6e7681' : '#e6edf3',
          fontFamily: 'monospace',
          fontStyle: i === 0 ? 'bold' : 'normal',
          wordWrap: { width: ttW - TT_PAD * 2 },
        })
        .setOrigin(0, 0);
      this.tooltipContainer.add(t);
      this.tooltipTexts.push(t);
    }

    const weaponCount = WEAPON_ORDER.length;
    const totalSlotsW = weaponCount * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;
    const startX = (this.panelW - totalSlotsW) / 2;
    const slotX = startX + this.hoveredSlot * (SLOT_SIZE + SLOT_GAP);

    const tooltipX = this.panelX + slotX + SLOT_SIZE / 2 - ttW / 2;
    const tooltipY = this.barContainer.y - ttH - 6;

    this.tooltipContainer.setPosition(
      Math.max(4, Math.min(tooltipX, this.scene.cameras.main.width - ttW - 4)),
      Math.max(4, tooltipY),
    );
    this.tooltipContainer.setVisible(true);
  }

  destroy(): void {
    this.tooltipContainer?.destroy();
    this.barContainer.destroy();
  }
}
