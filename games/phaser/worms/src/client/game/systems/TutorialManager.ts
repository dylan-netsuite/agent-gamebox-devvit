import * as Phaser from 'phaser';
import type { WeaponSystem } from './WeaponSystem';

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  hint?: string;
  /** If true, step advances on click/tap. Otherwise waits for condition. */
  clickToContinue?: boolean;
  /** Called each frame; return true when step is satisfied. */
  condition?: () => boolean;
}

const OVERLAY_ALPHA = 0.55;
const BOX_W = 320;
const BOX_PAD = 18;
const ACCENT = 0x00e5ff;
const BOX_BG = 0x0f1923;

export class TutorialManager {
  private scene: Phaser.Scene;
  private weapons: WeaponSystem;
  private container!: Phaser.GameObjects.Container;
  private backdropGfx!: Phaser.GameObjects.Graphics;
  private boxGfx!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private steps: TutorialStep[];
  private stepIndex = 0;
  private active = true;
  private waitingForClick = false;
  private playerMoved = false;
  private playerJumped = false;
  private playerSwitchedWeapon = false;
  private initialWeaponIndex = 0;
  private turnAdvanced = false;
  private onComplete: () => void;

  constructor(
    scene: Phaser.Scene,
    weapons: WeaponSystem,
    onComplete: () => void,
  ) {
    this.scene = scene;
    this.weapons = weapons;
    this.onComplete = onComplete;

    this.steps = this.buildSteps();
    this.buildUI();
    this.showStep(0);
  }

  private buildSteps(): TutorialStep[] {
    return [
      {
        id: 'welcome',
        title: '👋 Welcome to Reddit Royale!',
        body: "Let's learn the basics of turn-based artillery combat.\nEach turn you'll move, aim, and fire!",
        clickToContinue: true,
      },
      {
        id: 'movement',
        title: '🏃 Movement',
        body: 'Use the ← → arrow keys to move your worm.\nOn mobile, use the on-screen D-pad.',
        hint: 'Move left or right to continue',
        condition: () => this.playerMoved,
      },
      {
        id: 'jumping',
        title: '🦘 Jumping',
        body: 'Press W to jump over obstacles.\nYou can move in the air too!',
        hint: 'Press W to jump',
        condition: () => this.playerJumped,
      },
      {
        id: 'weapon-switch',
        title: '🔫 Switching Weapons',
        body: 'You have 9 weapons! Press Q/E to cycle through them, use number keys 1-9, or click the weapon grid on the left panel.',
        hint: 'Switch to a different weapon',
        condition: () => this.playerSwitchedWeapon,
      },
      {
        id: 'aiming',
        title: '🎯 Aiming',
        body: 'Click on the battlefield (or press SPACE) to enter aiming mode. Move your mouse to aim — a trajectory preview will appear.',
        hint: 'Click or press SPACE to aim',
        condition: () => this.weapons.currentState === 'aiming',
      },
      {
        id: 'fire',
        title: '💥 Fire!',
        body: 'Scroll to adjust power, then click (or press SPACE again) to fire! Watch your projectile fly.',
        hint: 'Click or press SPACE to fire',
        condition: () =>
          this.weapons.currentState === 'firing' ||
          this.weapons.currentState === 'resolved',
      },
      {
        id: 'turn-flow',
        title: '🔄 Turn Flow',
        body: "After your shot resolves, press ENTER (or tap ⏭) to end your turn. Then it's the opponent's turn!",
        hint: 'Press ENTER to end your turn',
        condition: () => this.turnAdvanced,
      },
      {
        id: 'complete',
        title: '🎉 Tutorial Complete!',
        body: "You're ready for battle! Try Single Player to practice against the CPU, or jump into Online Play for real competition.",
        clickToContinue: true,
      },
    ];
  }

  private buildUI(): void {
    const cam = this.scene.cameras.main;
    this.container = this.scene.add
      .container(0, 0)
      .setDepth(400)
      .setScrollFactor(0);

    this.backdropGfx = this.scene.add.graphics();
    this.container.add(this.backdropGfx);

    this.boxGfx = this.scene.add.graphics();
    this.container.add(this.boxGfx);

    const boxW = Math.min(BOX_W, cam.width - 24);

    this.titleText = this.scene.add
      .text(cam.width / 2, 0, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#00e5ff',
        stroke: '#000000',
        strokeThickness: 2,
        wordWrap: { width: boxW - BOX_PAD * 2 },
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.container.add(this.titleText);

    this.bodyText = this.scene.add
      .text(cam.width / 2, 0, '', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '13px',
        color: '#e6edf3',
        wordWrap: { width: boxW - BOX_PAD * 2 },
        align: 'center',
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);
    this.container.add(this.bodyText);

    this.hintText = this.scene.add
      .text(cam.width / 2, 0, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#6e7681',
        align: 'center',
      })
      .setOrigin(0.5, 0);
    this.container.add(this.hintText);

    this.scene.tweens.add({
      targets: this.hintText,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 900,
    });

    this.scene.input.on('pointerdown', () => {
      if (this.waitingForClick && this.active) {
        this.advanceStep();
      }
    });

    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-ENTER', () => {
        if (this.waitingForClick && this.active) {
          this.advanceStep();
        }
      });
    }
  }

  private showStep(index: number): void {
    if (index >= this.steps.length) {
      this.complete();
      return;
    }

    this.stepIndex = index;
    const step = this.steps[index]!;
    const cam = this.scene.cameras.main;
    const boxW = Math.min(BOX_W, cam.width - 24);

    this.titleText.setText(step.title);
    this.bodyText.setText(step.body);

    const titleH = this.titleText.height;
    const bodyH = this.bodyText.height;
    const hintH = step.clickToContinue || step.hint ? 20 : 0;
    const boxH = BOX_PAD + titleH + 8 + bodyH + (hintH > 0 ? 10 + hintH : 0) + BOX_PAD;

    const boxX = (cam.width - boxW) / 2;
    const boxY = cam.height * 0.15;

    this.backdropGfx.clear();
    this.boxGfx.clear();

    if (step.clickToContinue) {
      this.backdropGfx.fillStyle(0x000000, OVERLAY_ALPHA);
      this.backdropGfx.fillRect(0, 0, cam.width, cam.height);
    }

    this.boxGfx.fillStyle(BOX_BG, 0.92);
    this.boxGfx.fillRoundedRect(boxX, boxY, boxW, boxH, 10);
    this.boxGfx.lineStyle(2, ACCENT, 0.6);
    this.boxGfx.strokeRoundedRect(boxX, boxY, boxW, boxH, 10);

    this.titleText.setPosition(cam.width / 2, boxY + BOX_PAD);
    this.bodyText.setPosition(cam.width / 2, boxY + BOX_PAD + titleH + 8);

    if (step.clickToContinue) {
      this.hintText.setText('Click or press ENTER to continue');
      this.hintText.setPosition(cam.width / 2, boxY + boxH - BOX_PAD - 6);
      this.hintText.setVisible(true);
      this.waitingForClick = true;
    } else if (step.hint) {
      this.hintText.setText(step.hint);
      this.hintText.setPosition(cam.width / 2, boxY + boxH - BOX_PAD - 6);
      this.hintText.setVisible(true);
      this.waitingForClick = false;
    } else {
      this.hintText.setVisible(false);
      this.waitingForClick = false;
    }

    this.container.setVisible(true);
  }

  private advanceStep(): void {
    const nextIndex = this.stepIndex + 1;
    if (nextIndex >= this.steps.length) {
      this.complete();
      return;
    }
    this.showStep(nextIndex);
  }

  private complete(): void {
    this.active = false;
    this.container.setVisible(false);
    this.onComplete();
  }

  notifyMove(): void {
    this.playerMoved = true;
  }

  notifyJump(): void {
    this.playerJumped = true;
  }

  notifyWeaponSwitch(newIndex: number): void {
    if (newIndex !== this.initialWeaponIndex) {
      this.playerSwitchedWeapon = true;
    }
  }

  notifyTurnAdvanced(): void {
    this.turnAdvanced = true;
  }

  setInitialWeaponIndex(idx: number): void {
    this.initialWeaponIndex = idx;
  }

  /** Returns true when tutorial overlay is blocking input. */
  isBlocking(): boolean {
    return this.active && this.waitingForClick;
  }

  isActive(): boolean {
    return this.active;
  }

  getCurrentStepId(): string {
    return this.steps[this.stepIndex]?.id ?? '';
  }

  update(): void {
    if (!this.active) return;

    if (this.weapons.weaponIndex !== this.initialWeaponIndex) {
      this.playerSwitchedWeapon = true;
    }

    const step = this.steps[this.stepIndex];
    if (!step || step.clickToContinue) return;

    if (step.condition && step.condition()) {
      this.advanceStep();
    }
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  destroy(): void {
    this.container?.destroy();
  }
}
