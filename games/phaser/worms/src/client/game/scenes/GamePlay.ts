import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { TerrainEngine } from '../engine/TerrainEngine';
import { Worm } from '../entities/Worm';
import { WindSystem } from '../systems/WindSystem';
import { ExplosionEffect } from '../systems/ExplosionEffect';
import { ProjectileManager } from '../systems/ProjectileManager';
import { WeaponSystem } from '../systems/WeaponSystem';
import { AIController } from '../systems/AIController';
import { AimIndicator } from '../ui/AimIndicator';
import { HUD } from '../ui/HUD';
import { TeamPanel } from '../ui/TeamPanel';
import { Minimap } from '../ui/Minimap';
import { TouchControls } from '../ui/TouchControls';
import { SoundManager } from '../systems/SoundManager';
import { WORM_NAMES, TEAM_COLORS } from '../../../shared/types/game';
import type { GameConfig } from './GameSetup';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;
const DEFAULT_TURN_DURATION = 45;

export class GamePlay extends Scene {
  private terrain!: TerrainEngine;
  private worms: Worm[] = [];
  private turnOrder: number[] = [];
  private turnOrderIndex = 0;

  private windSystem!: WindSystem;
  private explosionEffect!: ExplosionEffect;
  private projectileManager!: ProjectileManager;
  private weaponSystem!: WeaponSystem;
  private aimIndicator!: AimIndicator;
  private hud!: HUD;
  private teamPanel!: TeamPanel;
  private minimap!: Minimap;
  private aiController: AIController | null = null;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private skyGradient!: Phaser.GameObjects.Graphics;

  private turnDuration = DEFAULT_TURN_DURATION;
  private turnTimer = DEFAULT_TURN_DURATION;
  private turnTimerEvent: Phaser.Time.TimerEvent | null = null;
  private gameOver = false;
  private gameOverOverlay: Phaser.GameObjects.Container | null = null;

  private numTeams = 2;
  private wormsPerTeam = 2;
  private teamCharacters: string[] = [];
  private aiTeams: number[] = [];
  private mapId = 'hills';
  private isAITurn = false;

  private userPanning = false;
  private panReturnTimer: Phaser.Time.TimerEvent | null = null;
  private wasDragging = false;

  constructor() {
    super('GamePlay');
  }

  create(data?: GameConfig) {
    if (data?.numTeams) this.numTeams = data.numTeams;
    if (data?.wormsPerTeam) this.wormsPerTeam = data.wormsPerTeam;
    this.teamCharacters = data?.teamCharacters ?? [];
    this.aiTeams = data?.aiTeams ?? [];
    this.mapId = data?.mapId ?? 'hills';
    this.turnDuration = data?.turnTimer ?? DEFAULT_TURN_DURATION;

    if (this.aiTeams.length > 0) {
      this.aiController = new AIController(this.aiTeams);
    }

    this.cameras.main.setBackgroundColor('#87CEEB');

    const seed = Math.floor(Math.random() * 1_000_000);
    this.terrain = new TerrainEngine(this, WORLD_WIDTH, WORLD_HEIGHT, seed, this.mapId);

    this.drawSky();
    this.spawnWorms();
    this.buildTurnOrder();

    this.windSystem = new WindSystem();
    this.windSystem.randomize();

    this.explosionEffect = new ExplosionEffect(this, this.terrain);

    this.projectileManager = new ProjectileManager(
      this,
      this.terrain,
      this.windSystem,
      this.explosionEffect,
      this.worms,
    );

    this.aimIndicator = new AimIndicator(this, this.windSystem);

    this.weaponSystem = new WeaponSystem(this.projectileManager, this.aimIndicator);
    this.weaponSystem.onState((state) => {
      if (state === 'firing') {
        SoundManager.play('fire');
      }
      if (state === 'resolved') {
        this.stopTurnTimer();
        this.settleWorms(() => {
          this.checkWinCondition();
          if (!this.gameOver && this.isAITurn) {
            this.time.delayedCall(600, () => this.nextTurn());
          }
        });
      }
    });

    this.hud = new HUD(this, this.weaponSystem, this.windSystem);
    this.hud.setActiveWormNameGetter(() => this.activeWorm?.name ?? '');
    this.hud.setTurnTimerGetter(() => this.turnTimer);
    this.hud.setTeamGetter(() => {
      const w = this.activeWorm;
      return w ? w.team : 0;
    });

    this.teamPanel = new TeamPanel(
      this,
      this.numTeams,
      () => this.worms,
      () => this.activeWorm?.team ?? 0,
    );

    this.minimap = new Minimap(
      this,
      this.terrain,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      () => this.worms,
      (wx, wy) => {
        this.onUserPan();
        this.cameras.main.pan(wx, wy, 300, 'Sine.easeInOut');
      },
    );

    void new TouchControls(this, {
      onMoveLeft: () => {
        if (this.gameOver || this.isAITurn) return;
        if (this.weaponSystem.currentState === 'idle') {
          this.activeWorm?.moveLeft();
          this.userPanning = false;
        }
      },
      onMoveRight: () => {
        if (this.gameOver || this.isAITurn) return;
        if (this.weaponSystem.currentState === 'idle') {
          this.activeWorm?.moveRight();
          this.userPanning = false;
        }
      },
      onJump: () => {
        if (this.gameOver || this.isAITurn) return;
        if (this.weaponSystem.currentState === 'idle') {
          this.activeWorm?.jump();
        }
      },
      onAimFire: () => {
        if (this.gameOver || this.isAITurn) return;
        const state = this.weaponSystem.currentState;
        if (state === 'idle') {
          this.weaponSystem.startAiming();
        } else if (state === 'aiming') {
          const worm = this.activeWorm;
          if (worm) this.weaponSystem.fire(worm);
        }
      },
      onNextWeapon: () => {
        if (!this.gameOver && !this.isAITurn) this.weaponSystem.nextWeapon();
      },
      onPrevWeapon: () => {
        if (!this.gameOver && !this.isAITurn) this.weaponSystem.prevWeapon();
      },
      onNextTurn: () => {
        if (this.weaponSystem.currentState === 'resolved' && !this.isAITurn) {
          this.nextTurn();
        }
      },
      getState: () => this.weaponSystem.currentState,
    });

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.centerCameraOnWorm();

    this.setupCameraDrag();
    this.setupPinchZoom();
    this.setupInput();
    this.startTurn();
  }

  private spawnWorms(): void {
    const allNames = [...WORM_NAMES];
    let nameIdx = 0;

    for (let t = 0; t < this.numTeams; t++) {
      const colorStr = TEAM_COLORS[t % TEAM_COLORS.length]!;
      const color = parseInt(colorStr.replace('#', ''), 16);
      const spacing = WORLD_WIDTH / (this.numTeams + 1);
      const baseX = spacing * (t + 1);
      const charId = this.teamCharacters[t] ?? 'banana-sam';

      for (let w = 0; w < this.wormsPerTeam; w++) {
        const x = baseX + (w - (this.wormsPerTeam - 1) / 2) * 100 + (Math.random() - 0.5) * 50;
        const name = allNames[nameIdx % allNames.length] ?? `Worm ${nameIdx + 1}`;
        nameIdx++;
        const worm = new Worm(this, this.terrain, x, name, color, t, 100, charId);
        this.worms.push(worm);
      }
    }
  }

  private buildTurnOrder(): void {
    const teamWorms: number[][] = [];
    for (let t = 0; t < this.numTeams; t++) {
      teamWorms.push([]);
    }
    for (let i = 0; i < this.worms.length; i++) {
      teamWorms[this.worms[i]!.team]!.push(i);
    }

    this.turnOrder = [];
    const maxPerTeam = Math.max(...teamWorms.map((tw) => tw.length));
    for (let round = 0; round < maxPerTeam; round++) {
      for (let t = 0; t < this.numTeams; t++) {
        const tw = teamWorms[t]!;
        if (round < tw.length) {
          this.turnOrder.push(tw[round]!);
        }
      }
    }
    this.turnOrderIndex = 0;
  }

  private get activeWorm(): Worm | undefined {
    return this.worms[this.turnOrder[this.turnOrderIndex]!];
  }

  private startTurn(): void {
    this.startTurnTimer();
    const worm = this.activeWorm;
    if (!worm) return;

    this.isAITurn = this.aiController?.isAITeam(worm.team) ?? false;

    if (this.isAITurn && this.aiController) {
      this.aiController.executeTurn(
        this,
        worm,
        this.worms,
        this.weaponSystem,
        () => {
          // AI couldn't act — advance turn
          this.nextTurn();
        },
      );
    }
  }

  private startTurnTimer(): void {
    if (this.turnDuration <= 0) {
      this.turnTimer = 0;
      return;
    }
    this.turnTimer = this.turnDuration;
    this.turnTimerEvent = this.time.addEvent({
      delay: 1000,
      repeat: this.turnDuration - 1,
      callback: () => {
        this.turnTimer--;
        if (this.turnTimer <= 5 && this.turnTimer > 0) {
          SoundManager.play('tick');
        }
        if (this.turnTimer <= 0) {
          this.onTurnTimeout();
        }
      },
    });
  }

  private stopTurnTimer(): void {
    if (this.turnTimerEvent) {
      this.turnTimerEvent.destroy();
      this.turnTimerEvent = null;
    }
  }

  private onTurnTimeout(): void {
    this.stopTurnTimer();
    const state = this.weaponSystem.currentState;
    if (state === 'aiming') {
      this.weaponSystem.stopAiming();
    }
    if (state === 'idle' || state === 'aiming') {
      this.weaponSystem.forceResolve();
    }
  }

  private settleWorms(onDone: () => void): void {
    let settling = true;
    let ticks = 0;
    const maxTicks = 120;

    const check = () => {
      ticks++;
      settling = false;
      for (const w of this.worms) {
        if (w.alive) {
          w.update();
          if (!w.isGrounded) settling = true;
        }
      }
      if (settling && ticks < maxTicks) {
        this.time.delayedCall(16, check);
      } else {
        onDone();
      }
    };
    check();
  }

  private checkWinCondition(): void {
    const teamsAlive = new Set<number>();
    for (const w of this.worms) {
      if (w.alive) teamsAlive.add(w.team);
    }

    if (teamsAlive.size <= 1) {
      this.gameOver = true;
      const winningTeam = teamsAlive.size === 1 ? [...teamsAlive][0]! : -1;
      this.showGameOver(winningTeam);
    }
  }

  private showGameOver(winningTeam: number): void {
    SoundManager.play('gameover');
    const cam = this.cameras.main;
    this.gameOverOverlay = this.add.container(0, 0).setDepth(500).setScrollFactor(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, cam.width, cam.height);
    this.gameOverOverlay.add(bg);

    const teamLabels = ['Red', 'Blue', 'Yellow', 'Purple'];
    const teamName =
      winningTeam >= 0
        ? `Team ${teamLabels[winningTeam] ?? winningTeam}`
        : 'Nobody';
    const teamColorMap = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6'];
    const teamColor = winningTeam >= 0 ? (teamColorMap[winningTeam] ?? '#ffffff') : '#ffffff';

    const title = this.add
      .text(cam.width / 2, cam.height * 0.35, 'GAME OVER', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '48px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.gameOverOverlay.add(title);

    const winner = this.add
      .text(cam.width / 2, cam.height * 0.48, `${teamName} Wins!`, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: teamColor,
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.gameOverOverlay.add(winner);

    const restartText = this.add
      .text(cam.width / 2, cam.height * 0.62, '[ ENTER — New Game ]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.gameOverOverlay.add(restartText);

    this.tweens.add({
      targets: restartText,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });
  }

  private nextTurn(): void {
    if (this.gameOver) return;

    SoundManager.play('turn');

    let next = (this.turnOrderIndex + 1) % this.turnOrder.length;
    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const worm = this.worms[this.turnOrder[next]!];
      if (worm?.alive) break;
      next = (next + 1) % this.turnOrder.length;
      attempts++;
    }
    this.turnOrderIndex = next;

    this.userPanning = false;
    this.windSystem.randomize();
    this.weaponSystem.reset();
    this.centerCameraOnWorm();
    this.startTurn();
  }

  private centerCameraOnWorm(): void {
    const worm = this.activeWorm;
    if (!worm) return;
    this.cameras.main.pan(worm.x, worm.y, 300, 'Sine.easeInOut');
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();

    const NUMBER_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
    for (let i = 0; i < NUMBER_KEYS.length; i++) {
      const idx = i;
      this.input.keyboard.on(`keydown-${NUMBER_KEYS[i]}`, () => {
        if (!this.gameOver && !this.isAITurn) this.weaponSystem.selectWeapon(idx);
      });
    }

    this.input.keyboard.on('keydown-Q', () => {
      if (!this.gameOver && !this.isAITurn) this.weaponSystem.prevWeapon();
    });
    this.input.keyboard.on('keydown-E', () => {
      if (!this.gameOver && !this.isAITurn) this.weaponSystem.nextWeapon();
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.gameOver) {
        this.scene.start('GameSetup');
        return;
      }
      if (this.weaponSystem.currentState === 'resolved' && !this.isAITurn) {
        this.nextTurn();
      }
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (!this.gameOver && !this.isAITurn) this.weaponSystem.stopAiming();
    });

    this.input.keyboard.on('keydown-F', () => {
      this.recenterCamera();
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameOver || this.isAITurn) return;
      const state = this.weaponSystem.currentState;
      if (state === 'idle') {
        this.weaponSystem.startAiming();
      } else if (state === 'aiming') {
        const worm = this.activeWorm;
        if (worm) this.weaponSystem.fire(worm);
      }
    });

    this.input.keyboard.on('keydown-W', () => {
      if (this.gameOver || this.isAITurn) return;
      if (this.weaponSystem.currentState === 'idle') {
        const worm = this.activeWorm;
        if (worm) worm.jump();
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isAITurn) return;
      if (pointer.rightButtonReleased() || pointer.middleButtonReleased()) return;
      if (this.wasDragging) {
        this.wasDragging = false;
        return;
      }
      if (this.hud.consumeClick()) return;

      const state = this.weaponSystem.currentState;
      if (state === 'idle') {
        this.weaponSystem.startAiming();
      } else if (state === 'aiming') {
        const worm = this.activeWorm;
        if (worm) this.weaponSystem.fire(worm);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isAITurn) return;
      if (this.weaponSystem.currentState === 'aiming') {
        const worm = this.activeWorm;
        if (worm) {
          this.weaponSystem.setAngleFromPointer(
            worm.x,
            worm.y,
            pointer.worldX,
            pointer.worldY,
          );
        }
      }
    });

    this.input.on(
      'wheel',
      (_pointer: Phaser.Input.Pointer, _gos: unknown[], _dx: number, dy: number) => {
        if (this.gameOver) return;
        if (this.isAITurn) return;
        if (this.weaponSystem.currentState === 'aiming') {
          this.weaponSystem.adjustPower(-dy * 0.05);
        } else {
          const cam = this.cameras.main;
          const newZoom = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.3, 2);
          cam.setZoom(newZoom);
        }
      },
    );
  }

  private drawSky(): void {
    this.skyGradient = this.add.graphics();
    this.skyGradient.setDepth(-10);

    const preset = this.terrain.getMapPreset();
    const skyColors = [
      { y: 0, color: preset.colors.skyTop },
      { y: WORLD_HEIGHT * 0.3, color: preset.colors.skyMid },
      { y: WORLD_HEIGHT * 0.7, color: preset.colors.skyLow },
      { y: WORLD_HEIGHT, color: preset.colors.skyBottom },
    ];

    for (let i = 0; i < skyColors.length - 1; i++) {
      const from = skyColors[i]!;
      const to = skyColors[i + 1]!;
      const steps = to.y - from.y;

      for (let y = from.y; y < to.y; y++) {
        const t = (y - from.y) / steps;
        const r = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(from.color),
          Phaser.Display.Color.IntegerToColor(to.color),
          1,
          t,
        );
        this.skyGradient.fillStyle(Phaser.Display.Color.GetColor(r.r, r.g, r.b), 1);
        this.skyGradient.fillRect(0, y, WORLD_WIDTH, 1);
      }
    }
  }

  private setupCameraDrag(): void {
    let dragging = false;
    let dragButton: 'left' | 'right' | 'middle' = 'left';
    let dragStartX = 0;
    let dragStartY = 0;
    let camStartX = 0;
    let camStartY = 0;
    let dragDistance = 0;
    const DRAG_THRESHOLD = 6;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown() || pointer.rightButtonDown()) {
        dragging = true;
        dragButton = pointer.middleButtonDown() ? 'middle' : 'right';
        dragDistance = 0;
        dragStartX = pointer.x;
        dragStartY = pointer.y;
        camStartX = this.cameras.main.scrollX;
        camStartY = this.cameras.main.scrollY;
        return;
      }

      if (pointer.leftButtonDown()) {
        const state = this.weaponSystem.currentState;
        if (state === 'idle' || state === 'resolved') {
          dragging = true;
          dragButton = 'left';
          dragDistance = 0;
          dragStartX = pointer.x;
          dragStartY = pointer.y;
          camStartX = this.cameras.main.scrollX;
          camStartY = this.cameras.main.scrollY;
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!dragging) return;
      const dx = dragStartX - pointer.x;
      const dy = dragStartY - pointer.y;
      dragDistance = Math.sqrt(dx * dx + dy * dy);

      if (dragDistance > DRAG_THRESHOLD) {
        this.cameras.main.scrollX = camStartX + dx;
        this.cameras.main.scrollY = camStartY + dy;
        this.onUserPan();
      }
    });

    this.input.on('pointerup', () => {
      if (!dragging) return;
      if (dragButton === 'left' && dragDistance > DRAG_THRESHOLD) {
        this.wasDragging = true;
      }
      dragging = false;
    });
  }

  private setupPinchZoom(): void {
    const canvas = this.game.canvas;
    let pinching = false;
    let initialDist = 0;
    let initialZoom = 1;
    let initialMidX = 0;
    let initialMidY = 0;
    let initialScrollX = 0;
    let initialScrollY = 0;

    const getTouchDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinching = true;
        const t0 = e.touches[0]!;
        const t1 = e.touches[1]!;
        initialDist = getTouchDist(t0, t1);
        initialZoom = this.cameras.main.zoom;
        initialMidX = (t0.clientX + t1.clientX) / 2;
        initialMidY = (t0.clientY + t1.clientY) / 2;
        initialScrollX = this.cameras.main.scrollX;
        initialScrollY = this.cameras.main.scrollY;
        e.preventDefault();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pinching || e.touches.length < 2) return;
      e.preventDefault();

      const t0 = e.touches[0]!;
      const t1 = e.touches[1]!;
      const dist = getTouchDist(t0, t1);
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      const scale = dist / initialDist;
      const newZoom = Phaser.Math.Clamp(initialZoom * scale, 0.3, 2);
      this.cameras.main.setZoom(newZoom);

      const dmx = initialMidX - midX;
      const dmy = initialMidY - midY;
      this.cameras.main.scrollX = initialScrollX + dmx / newZoom;
      this.cameras.main.scrollY = initialScrollY + dmy / newZoom;

      this.onUserPan();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinching = false;
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    this.events.on('shutdown', () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    });
  }

  private onUserPan(): void {
    this.userPanning = true;
    if (this.panReturnTimer) {
      this.panReturnTimer.destroy();
      this.panReturnTimer = null;
    }
  }

  private recenterCamera(): void {
    this.userPanning = false;
    if (this.panReturnTimer) {
      this.panReturnTimer.destroy();
      this.panReturnTimer = null;
    }
    this.centerCameraOnWorm();
  }

  override update(_time: number, _delta: number) {
    if (this.gameOver) return;

    const worm = this.activeWorm;
    if (!worm) return;

    if (!this.isAITurn && this.weaponSystem.currentState === 'idle' && this.cursors) {
      if (this.cursors.left.isDown) {
        worm.moveLeft();
        this.userPanning = false;
      } else if (this.cursors.right.isDown) {
        worm.moveRight();
        this.userPanning = false;
      }

      if (this.cursors.up.isDown) {
        this.weaponSystem.adjustAngle(-0.03);
      } else if (this.cursors.down.isDown) {
        this.weaponSystem.adjustAngle(0.03);
      }
    }

    if (this.weaponSystem.currentState === 'aiming' && worm) {
      this.weaponSystem.updateAimDisplay(worm);
    }

    this.projectileManager.update();

    for (const w of this.worms) {
      w.update();
    }

    this.followActiveWorm();
    this.hud.update();
    this.teamPanel.update();
    this.minimap.update();
  }

  private followActiveWorm(): void {
    if (this.userPanning) return;

    const worm = this.activeWorm;
    if (!worm || !worm.alive) return;

    const cam = this.cameras.main;
    const targetX = worm.x - cam.width / (2 * cam.zoom);
    const targetY = worm.y - cam.height / (2 * cam.zoom);
    const lerp = 0.08;

    cam.scrollX += (targetX - cam.scrollX) * lerp;
    cam.scrollY += (targetY - cam.scrollY) * lerp;
  }
}
