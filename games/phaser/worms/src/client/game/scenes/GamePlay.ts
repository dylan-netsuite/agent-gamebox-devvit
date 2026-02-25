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
import { BackgroundRenderer } from '../systems/BackgroundRenderer';
import { TutorialManager } from '../systems/TutorialManager';
import { LocalStats } from '../systems/LocalStats';
import { WORM_NAMES, TEAM_COLORS } from '../../../shared/types/game';
import type { GameConfig, AIDifficulty } from './GameSetup';
import { MultiplayerManager } from '../systems/MultiplayerManager';
import type { MultiplayerMessage, LobbyPlayer, PlayerAction } from '../../../shared/types/multiplayer';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1200;
const DEFAULT_TURN_DURATION = 45;

interface OnlineGameConfig extends GameConfig {
  multiplayerManager?: MultiplayerManager;
  terrainSeed?: number;
  onlinePlayers?: LobbyPlayer[];
  tutorial?: boolean;
}

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
  private touchControls!: TouchControls;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiContainers = new Set<Phaser.GameObjects.GameObject>();
  private aiController: AIController | null = null;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;
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
  private aiDifficulty: AIDifficulty = 'medium';
  private mapId = 'hills';
  private isAITurn = false;

  private userPanning = false;
  private panReturnTimer: Phaser.Time.TimerEvent | null = null;
  private wasDragging = false;
  private ropeAttachTime = 0;
  private firingStartTime = 0;

  // Multiplayer state
  private mp: MultiplayerManager | null = null;
  private onlinePlayers: LobbyPlayer[] = [];
  private localTeamIndex = -1;
  private isRemoteTurn = false;
  private mpHandler: ((msg: MultiplayerMessage) => void) | null = null;
  private pendingMoveThrottle = 0;
  private turnStartClickConsumed = false;
  private tutorial: TutorialManager | null = null;

  constructor() {
    super('GamePlay');
  }

  private resetState(): void {
    this.stopTurnTimer();
    this.tutorial?.destroy();

    this.worms = [];
    this.turnOrder = [];
    this.turnOrderIndex = 0;
    this.gameOver = false;
    this.gameOverOverlay = null;
    this.isAITurn = false;
    this.isRemoteTurn = false;
    this.aiController = null;
    this.userPanning = false;
    this.wasDragging = false;
    this.ropeAttachTime = 0;
    this.firingStartTime = 0;
    this.turnStartClickConsumed = false;
    this.tutorial = null;
    this.mp = null;
    this.onlinePlayers = [];
    this.localTeamIndex = -1;
    this.mpHandler = null;
    this.pendingMoveThrottle = 0;
    this.turnTimer = DEFAULT_TURN_DURATION;
    this.turnTimerEvent = null;
    this.numTeams = 2;
    this.wormsPerTeam = 2;
    this.teamCharacters = [];
    this.aiTeams = [];
    this.aiDifficulty = 'medium';
    this.mapId = 'hills';
    this.turnDuration = DEFAULT_TURN_DURATION;
    this.uiContainers = new Set();
    if (this.panReturnTimer) {
      this.panReturnTimer.destroy();
      this.panReturnTimer = null;
    }
  }

  create(data?: OnlineGameConfig) {
    this.resetState();

    if (data?.numTeams) this.numTeams = data.numTeams;
    if (data?.wormsPerTeam) this.wormsPerTeam = data.wormsPerTeam;
    this.teamCharacters = data?.teamCharacters ?? [];
    this.aiTeams = data?.aiTeams ?? [];
    this.aiDifficulty = data?.aiDifficulty ?? 'medium';
    this.mapId = data?.mapId ?? 'hills';
    this.turnDuration = data?.turnTimer ?? DEFAULT_TURN_DURATION;

    // Multiplayer setup
    this.mp = data?.multiplayerManager ?? null;
    this.onlinePlayers = data?.onlinePlayers ?? [];
    if (this.mp && this.onlinePlayers.length > 0) {
      const myPlayer = this.onlinePlayers.find((p) => p.userId === this.mp!.userId);
      this.localTeamIndex = myPlayer?.teamIndex ?? -1;
    }

    if (this.aiTeams.length > 0) {
      this.aiController = new AIController(this.aiTeams, this.aiDifficulty);
    }

    this.cameras.main.setBackgroundColor('#87CEEB');

    const seed = data?.terrainSeed ?? Math.floor(Math.random() * 1_000_000);
    this.terrain = new TerrainEngine(this, WORLD_WIDTH, WORLD_HEIGHT, seed, this.mapId);

    this.drawSky();
    new BackgroundRenderer(this, seed).draw(this.terrain.getMapPreset());
    this.drawWater();
    this.spawnWorms();
    this.buildTurnOrder();

    this.windSystem = new WindSystem();
    this.windSystem.randomize();

    if (this.aiController) {
      this.aiController.setContext(this.terrain, this.windSystem);
    }

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
          if (this.isOnline && this.isLocalTurn) {
            this.broadcastTurnResult();
          }
          this.checkWinCondition();
          if (!this.gameOver) {
            if (this.isAITurn) {
              this.time.delayedCall(600, () => this.advanceTurn());
            } else if (this.isOnline && this.isLocalTurn) {
              this.time.delayedCall(2500, () => {
                if (this.weaponSystem.currentState === 'resolved' && !this.gameOver) {
                  this.requestNextTurn();
                }
              });
            }
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
    this.hud.setRemoteTurnGetter(() => this.isRemoteTurn);

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

    this.touchControls = new TouchControls(this, {
      onMoveLeft: () => {
        if (!this.canAct()) return;
        if (this.weaponSystem.currentState === 'idle') {
          const w = this.activeWorm;
          if (w?.isGrounded) w.moveLeft(); else w?.airMoveLeft();
          this.userPanning = false;
          this.broadcastMove();
          this.tutorial?.notifyMove();
        }
      },
      onMoveRight: () => {
        if (!this.canAct()) return;
        if (this.weaponSystem.currentState === 'idle') {
          const w = this.activeWorm;
          if (w?.isGrounded) w.moveRight(); else w?.airMoveRight();
          this.userPanning = false;
          this.broadcastMove();
          this.tutorial?.notifyMove();
        }
      },
      onJump: () => {
        if (!this.canAct()) return;
        if (this.weaponSystem.currentState === 'idle') {
          this.activeWorm?.jump();
          this.broadcastJump();
          this.tutorial?.notifyJump();
        }
      },
      onAimFire: () => {
        if (!this.canAct()) return;
        const state = this.weaponSystem.currentState;
        if (state === 'idle') {
          this.weaponSystem.startAiming();
        } else if (state === 'aiming') {
          const worm = this.activeWorm;
          if (worm) {
            this.broadcastFire(worm);
            this.notifyTutorialFire();
            this.weaponSystem.fire(worm);
          }
        }
      },
      onNextWeapon: () => {
        if (this.canAct()) this.weaponSystem.nextWeapon();
      },
      onPrevWeapon: () => {
        if (this.canAct()) this.weaponSystem.prevWeapon();
      },
      onNextTurn: () => {
        if (this.weaponSystem.currentState === 'resolved' && this.canAct()) {
          this.requestNextTurn();
        }
      },
      onParachute: () => {
        if (!this.canAct()) return;
        const worm = this.activeWorm;
        if (worm) {
          if (worm.parachuteOpen) {
            worm.closeParachute();
          } else {
            worm.openParachute();
            this.tutorial?.notifyParachute();
          }
        }
      },
      onPowerUp: () => {
        if (this.canAct() && this.weaponSystem.currentState === 'aiming') {
          this.weaponSystem.adjustPower(2);
        }
      },
      onPowerDown: () => {
        if (this.canAct() && this.weaponSystem.currentState === 'aiming') {
          this.weaponSystem.adjustPower(-2);
        }
      },
      getState: () => this.weaponSystem.currentState,
    });

    this.gameOverOverlay = this.add.container(0, 0).setDepth(500).setScrollFactor(0);
    this.gameOverOverlay.setVisible(false);

    if (data?.tutorial) {
      this.tutorial = new TutorialManager(this, this.weaponSystem, () => {
        this.tutorial = null;
      }, this.hud);
      this.tutorial.setInitialWeaponIndex(this.weaponSystem.weaponIndex);
    }

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.setupUICamera();
    this.centerCameraOnWorm();

    this.setupCameraDrag();
    this.setupPinchZoom();
    this.setupInput();

    if (this.isOnline) {
      this.setupMultiplayerListeners();
    }

    this.startTurn();
  }

  private get isOnline(): boolean {
    return this.mp !== null;
  }

  private get isLocalTurn(): boolean {
    if (!this.isOnline) return true;
    const worm = this.activeWorm;
    if (!worm) return false;
    return worm.team === this.localTeamIndex;
  }

  private canAct(): boolean {
    if (this.gameOver) return false;
    if (this.isAITurn) return false;
    if (this.isRemoteTurn) return false;
    if (this.tutorial?.isBlocking()) return false;
    return true;
  }

  private setupMultiplayerListeners(): void {
    if (!this.mp) return;

    this.mpHandler = (msg: MultiplayerMessage) => {
      switch (msg.type) {
        case 'player-action':
          if (msg.playerId !== this.mp!.userId) {
            this.replayAction(msg.action);
          }
          break;
        case 'turn-result':
          if (msg.playerId !== this.mp!.userId) {
            this.applyTurnResult(msg.result);
          }
          break;
        case 'turn-advance':
          this.onRemoteTurnAdvance(msg.turnOrderIndex, msg.wind);
          break;
        case 'game-over':
          if (!this.gameOver) {
            this.gameOver = true;
            this.showGameOver(msg.winningTeam);
          }
          break;
        case 'player-left':
          console.log(`[MP] Player left: ${msg.userId}`);
          break;
        case 'rematch': {
          console.log(`[MP] Rematch! New lobby: ${msg.lobbyCode}`);
          if (!this.mp) break;
          const postId = this.mp.postId;
          const userId = this.mp.userId;
          const username = this.mp.username;
          void this.mp.disconnect();
          this.mp = null;
          const newMp = new MultiplayerManager(postId, userId, username, msg.lobbyCode);
          this.scene.start('Lobby', { mp: newMp, lobbyCode: msg.lobbyCode });
          break;
        }
      }
    };

    this.mp.onMessage(this.mpHandler);

    this.events.on('shutdown', () => {
      if (this.mpHandler && this.mp) {
        this.mp.offMessage(this.mpHandler);
      }
    });
  }

  private replayAction(action: PlayerAction): void {
    const wormIndex = 'wormIndex' in action ? action.wormIndex : this.turnOrder[this.turnOrderIndex]!;
    const worm = this.worms[wormIndex];
    if (!worm) return;

    switch (action.kind) {
      case 'move':
        worm.x = action.x;
        worm.y = action.y;
        worm.facingRight = action.facingRight;
        break;
      case 'jump':
        if (action.backflip) {
          worm.backflip();
        } else {
          worm.jump();
        }
        break;
      case 'fire': {
        worm.x = action.x;
        worm.y = action.y;
        worm.facingRight = action.facingRight;
        this.weaponSystem.selectWeapon(action.weaponIndex);
        this.weaponSystem.startAiming();
        this.weaponSystem.setAngleDirect(action.angle);
        this.weaponSystem.setPowerDirect(action.power);
        this.time.delayedCall(200, () => {
          this.weaponSystem.fire(worm);
        });
        break;
      }
    }
  }

  private applyTurnResult(result: import('../../../shared/types/multiplayer').TurnResult): void {
    for (const snap of result.wormSnapshots) {
      const w = this.worms[snap.index];
      if (!w) continue;
      w.x = snap.x;
      w.y = snap.y;
      w.facingRight = snap.facingRight;
      if (!snap.alive && w.alive) {
        w.takeDamage(w.health);
      } else if (w.health !== snap.health) {
        const diff = w.health - snap.health;
        if (diff > 0) w.takeDamage(diff);
      }
    }

    for (const crater of result.craters) {
      this.terrain.addCrater(crater.x, crater.y, crater.radius);
    }
  }

  private onRemoteTurnAdvance(turnOrderIndex: number, wind: number): void {
    if (this.gameOver) return;

    SoundManager.play('turn');
    this.turnOrderIndex = turnOrderIndex;
    this.windSystem.setWind(wind);
    this.weaponSystem.reset();
    this.userPanning = false;
    this.centerCameraOnWorm();

    const worm = this.activeWorm;
    this.isRemoteTurn = worm ? worm.team !== this.localTeamIndex : true;
    this.isAITurn = false;

    this.startTurn();
  }

  private notifyTutorialFire(): void {
    if (!this.tutorial) return;
    const weapon = this.weaponSystem.currentWeapon;
    if (weapon.firingMode === 'teleport') {
      this.tutorial.notifyTeleportUsed();
    }
  }

  private broadcastMove(): void {
    if (!this.mp || !this.isLocalTurn) return;
    const now = Date.now();
    if (now - this.pendingMoveThrottle < 100) return;
    this.pendingMoveThrottle = now;

    const worm = this.activeWorm;
    if (!worm) return;
    const wormIndex = this.turnOrder[this.turnOrderIndex]!;
    void this.mp.sendAction({
      kind: 'move',
      wormIndex,
      x: worm.x,
      y: worm.y,
      facingRight: worm.facingRight,
    });
  }

  private broadcastJump(backflip = false): void {
    if (!this.mp || !this.isLocalTurn) return;
    const wormIndex = this.turnOrder[this.turnOrderIndex]!;
    void this.mp.sendAction({ kind: 'jump', wormIndex, backflip });
  }

  private broadcastFire(worm: Worm): void {
    if (!this.mp || !this.isLocalTurn) return;
    const wormIndex = this.turnOrder[this.turnOrderIndex]!;
    void this.mp.sendAction({
      kind: 'fire',
      wormIndex,
      weaponIndex: this.weaponSystem.weaponIndex,
      angle: this.weaponSystem.angle,
      power: this.weaponSystem.currentPower,
      x: worm.x,
      y: worm.y,
      facingRight: worm.facingRight,
    });
  }

  private broadcastTurnResult(): void {
    if (!this.mp) return;
    const snapshots = this.worms.map((w, i) => ({
      index: i,
      x: w.x,
      y: w.y,
      health: w.health,
      alive: w.alive,
      facingRight: w.facingRight,
    }));

    const newCraters = this.terrain.getRecentCraters();

    void this.mp.sendTurnResult({
      damages: [],
      craters: newCraters,
      wormSnapshots: snapshots,
    });
  }

  private requestNextTurn(): void {
    if (this.isOnline) {
      const next = this.findNextAliveIndex();
      this.windSystem.randomize();
      const wind = this.windSystem.getWind();
      void this.mp!.sendEndTurn(next, wind);
    } else {
      this.advanceTurn();
    }
  }

  private findNextAliveIndex(): number {
    let next = (this.turnOrderIndex + 1) % this.turnOrder.length;
    let attempts = 0;
    while (attempts < this.turnOrder.length) {
      const worm = this.worms[this.turnOrder[next]!];
      if (worm?.alive) break;
      next = (next + 1) % this.turnOrder.length;
      attempts++;
    }
    return next;
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
    this.turnStartClickConsumed = false;
    const worm = this.activeWorm;
    if (!worm) return;

    this.isAITurn = this.aiController?.isAITeam(worm.team) ?? false;
    this.isRemoteTurn = this.isOnline && worm.team !== this.localTeamIndex;

    if (this.isAITurn && this.aiController) {
      if (this.tutorial?.isActive()) {
        this.time.delayedCall(500, () => this.advanceTurn());
      } else {
        this.aiController.executeTurn(
          this,
          worm,
          this.worms,
          this.weaponSystem,
          () => {
            this.advanceTurn();
          },
          this.projectileManager,
        );
      }
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
    if (!this.canAct()) return;
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
          if (this.aiController?.isAITeam(w.team) && w.isFallingDangerously() && !w.parachuteOpen) {
            w.openParachute();
          }
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
      if (this.isOnline && this.isLocalTurn) {
        void this.mp!.sendGameOver(winningTeam);
      }
      this.showGameOver(winningTeam);
    }
  }

  private recordLocalStats(winningTeam: number): void {
    if (this.isOnline) return;
    if (this.tutorial?.isActive()) return;
    if (this.aiTeams.length === 0) return;

    const kills = this.worms.filter(
      (w) => !w.alive && this.aiTeams.includes(w.team),
    ).length;
    LocalStats.addKills(kills);

    if (winningTeam === 0) {
      LocalStats.recordWin();
    } else {
      LocalStats.recordLoss();
    }
  }

  private showGameOver(winningTeam: number): void {
    SoundManager.play('gameover');
    this.recordLocalStats(winningTeam);
    const cam = this.cameras.main;
    if (!this.gameOverOverlay) {
      this.gameOverOverlay = this.add.container(0, 0).setDepth(500).setScrollFactor(0);
    }
    this.gameOverOverlay.removeAll(true);
    this.gameOverOverlay.setVisible(true);

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

    if (this.isOnline) {
      const onlinePlayer = this.onlinePlayers[winningTeam];
      if (onlinePlayer) {
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
          .text(cam.width / 2, cam.height * 0.48, `${onlinePlayer.username} Wins!`, {
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            fontSize: '28px',
            fontStyle: 'bold',
            color: teamColor,
            stroke: '#000000',
            strokeThickness: 3,
          })
          .setOrigin(0.5);
        this.gameOverOverlay.add(winner);
      }
    }

    if (!this.gameOverOverlay.list.some((o) => o instanceof Phaser.GameObjects.Text && (o as Phaser.GameObjects.Text).text === 'GAME OVER')) {
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
    }

    const restartText = this.add
      .text(cam.width / 2, cam.height * 0.62, '[ ENTER — New Game ]', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.gameOverOverlay.add(restartText);

    restartText.on('pointerdown', () => {
      if (this.mp) {
        void this.mp.disconnect();
        this.mp = null;
      }
      this.scene.start('ModeSelect');
    });

    this.tweens.add({
      targets: restartText,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 800,
    });

    if (this.isOnline && this.mp) {
      const rematchText = this.add
        .text(cam.width / 2, cam.height * 0.72, '[ REMATCH ]', {
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#3fb950',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      this.gameOverOverlay!.add(rematchText);

      rematchText.on('pointerdown', () => {
        if (!this.mp) return;
        const postId = this.mp.postId;
        const userId = this.mp.userId;
        const username = this.mp.username;
        rematchText.setText('Setting up rematch...');
        rematchText.removeInteractive();
        void this.mp.requestRematch().then((newCode) => {
          if (newCode) {
            void this.mp?.disconnect();
            const newMp = new MultiplayerManager(postId, userId, username, newCode);
            this.scene.start('Lobby', { mp: newMp, lobbyCode: newCode });
          } else {
            rematchText.setText('Rematch failed');
            rematchText.setInteractive({ useHandCursor: true });
          }
        });
      });

      this.tweens.add({
        targets: rematchText,
        alpha: 0.6,
        yoyo: true,
        repeat: -1,
        duration: 600,
      });
    }
  }

  private advanceTurn(): void {
    if (this.gameOver) return;

    SoundManager.play('turn');
    this.tutorial?.notifyTurnAdvanced();

    const next = this.findNextAliveIndex();
    this.turnOrderIndex = next;

    this.userPanning = false;
    this.windSystem.randomize();
    this.weaponSystem.reset();
    this.projectileManager.resetFiredFlag();
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
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    const NUMBER_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    for (let i = 0; i < NUMBER_KEYS.length; i++) {
      const idx = i;
      this.input.keyboard.on(`keydown-${NUMBER_KEYS[i]}`, () => {
        if (this.canAct()) {
          this.weaponSystem.selectWeapon(idx);
          this.tutorial?.notifyWeaponSwitch(idx);
        }
      });
    }

    this.input.keyboard.on('keydown-Q', () => {
      if (this.canAct()) {
        this.weaponSystem.prevWeapon();
        this.tutorial?.notifyWeaponSwitch(this.weaponSystem.weaponIndex);
      }
    });
    this.input.keyboard.on('keydown-E', () => {
      if (this.canAct()) {
        this.weaponSystem.nextWeapon();
        this.tutorial?.notifyWeaponSwitch(this.weaponSystem.weaponIndex);
      }
    });

    this.input.keyboard.on('keydown-ENTER', () => {
      if (this.gameOver) {
        if (this.mp) {
          void this.mp.disconnect();
          this.mp = null;
        }
        this.scene.start('ModeSelect');
        return;
      }
      if (this.weaponSystem.currentState === 'resolved' && this.canAct()) {
        this.requestNextTurn();
      }
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.canAct()) this.weaponSystem.stopAiming();
    });

    this.input.keyboard.on('keydown-F', () => {
      this.recenterCamera();
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.canAct()) return;
      const worm = this.activeWorm;
      if (worm?.isOnRope) {
        worm.detachRope();
        this.projectileManager.cleanupRopes();
        this.weaponSystem.forceResolve();
        return;
      }
      const state = this.weaponSystem.currentState;
      if (state === 'idle') {
        this.weaponSystem.startAiming();
      } else if (state === 'aiming') {
        if (worm) {
          this.broadcastFire(worm);
          this.notifyTutorialFire();
          this.weaponSystem.fire(worm);
        }
      }
    });

    this.input.keyboard.on('keydown-W', () => {
      if (!this.canAct()) return;
      if (this.weaponSystem.currentState === 'idle') {
        const worm = this.activeWorm;
        if (worm) {
          worm.jump();
          this.broadcastJump();
          this.tutorial?.notifyJump();
        }
      }
    });

    this.input.keyboard.on('keydown-B', () => {
      if (!this.canAct()) return;
      if (this.weaponSystem.currentState === 'idle') {
        const worm = this.activeWorm;
        if (worm) {
          worm.backflip();
          this.broadcastJump(true);
        }
      }
    });

    this.input.keyboard.on('keydown-P', () => {
      if (!this.canAct()) return;
      const worm = this.activeWorm;
      if (worm) {
        if (worm.parachuteOpen) {
          worm.closeParachute();
        } else {
          worm.openParachute();
          this.tutorial?.notifyParachute();
        }
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.canAct()) return;
      if (pointer.rightButtonReleased() || pointer.middleButtonReleased()) return;
      if (this.wasDragging) {
        this.wasDragging = false;
        return;
      }
      if (this.hud.consumeClick()) return;

      if (!this.turnStartClickConsumed) {
        this.turnStartClickConsumed = true;
        return;
      }

      const worm = this.activeWorm;
      if (worm?.isOnRope) {
        worm.detachRope();
        this.projectileManager.cleanupRopes();
        this.weaponSystem.forceResolve();
        return;
      }

      const state = this.weaponSystem.currentState;
      if (state === 'idle') {
        this.weaponSystem.startAiming();
      } else if (state === 'aiming') {
        if (worm) {
          this.broadcastFire(worm);
          this.notifyTutorialFire();
          this.weaponSystem.fire(worm);
        }
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.canAct()) return;
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
        if (this.isAITurn || this.isRemoteTurn) return;
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

  private drawWater(): void {
    const preset = this.terrain.getMapPreset();
    const waterLevel = preset.terrainStyle.waterLevel;
    if (waterLevel == null || waterLevel <= 0) return;

    const waterY = Math.floor(WORLD_HEIGHT * waterLevel);
    const waterH = WORLD_HEIGHT - waterY;
    const wc = preset.colors.waterColor ?? [30, 100, 200];
    const alpha = preset.colors.waterAlpha ?? 0.5;

    const waterGfx = this.add.graphics();
    waterGfx.setDepth(5);

    const color = Phaser.Display.Color.GetColor(wc[0], wc[1], wc[2]);
    waterGfx.fillStyle(color, alpha);
    waterGfx.fillRect(0, waterY, WORLD_WIDTH, waterH);

    waterGfx.fillStyle(
      Phaser.Display.Color.GetColor(
        Math.min(255, wc[0] + 40),
        Math.min(255, wc[1] + 40),
        Math.min(255, wc[2] + 40),
      ),
      alpha * 0.4,
    );
    waterGfx.fillRect(0, waterY, WORLD_WIDTH, 3);
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

    if (this.canAct() && this.cursors) {
      if (worm.isOnRope) {
        if (this.cursors.up.isDown) {
          worm.adjustRopeLength(-2);
        } else if (this.cursors.down.isDown) {
          worm.adjustRopeLength(2);
        }
      } else if (this.weaponSystem.currentState === 'idle') {
        if (this.cursors.left.isDown) {
          if (worm.isGrounded) {
            worm.moveLeft();
          } else {
            worm.airMoveLeft();
          }
          this.userPanning = false;
          this.broadcastMove();
          this.tutorial?.notifyMove();
        } else if (this.cursors.right.isDown) {
          if (worm.isGrounded) {
            worm.moveRight();
          } else {
            worm.airMoveRight();
          }
          this.userPanning = false;
          this.broadcastMove();
          this.tutorial?.notifyMove();
        }

        if (this.cursors.up.isDown) {
          this.weaponSystem.adjustAngle(-0.03);
        } else if (this.cursors.down.isDown) {
          this.weaponSystem.adjustAngle(0.03);
        }
      } else if (this.weaponSystem.currentState === 'aiming') {
        if (this.cursors.up.isDown) {
          this.weaponSystem.adjustAngle(-0.03);
        } else if (this.cursors.down.isDown) {
          this.weaponSystem.adjustAngle(0.03);
        }
        if (this.keyR?.isDown) {
          this.weaponSystem.adjustPower(1);
        } else if (this.keyT?.isDown) {
          this.weaponSystem.adjustPower(-1);
        }
      }
    }

    if (worm.isOnRope) {
      this.tutorial?.notifyRopeAttached();
      if (this.ropeAttachTime === 0) {
        this.ropeAttachTime = this.time.now;
      } else if (this.time.now - this.ropeAttachTime > 5000) {
        worm.detachRope();
        this.projectileManager.cleanupRopes();
        this.weaponSystem.forceResolve();
        this.ropeAttachTime = 0;
      }
    } else {
      this.ropeAttachTime = 0;
    }

    if (this.weaponSystem.currentState === 'firing') {
      if (this.firingStartTime === 0) {
        this.firingStartTime = this.time.now;
      } else if (this.time.now - this.firingStartTime > 10_000) {
        this.projectileManager.cleanupRopes();
        this.weaponSystem.forceResolve();
        this.firingStartTime = 0;
      }
    } else {
      this.firingStartTime = 0;
    }

    if (this.weaponSystem.currentState === 'aiming' && worm) {
      this.weaponSystem.updateAimDisplay(worm);
    }

    this.projectileManager.update();

    const aliveCountBefore = this.worms.filter((w) => w.alive).length;
    for (const w of this.worms) {
      w.update();
    }
    const aliveCountAfter = this.worms.filter((w) => w.alive).length;

    if (aliveCountAfter < aliveCountBefore && !this.gameOver) {
      this.checkWinCondition();
    }

    this.followActiveWorm();
    this.hud.update();
    this.teamPanel.update();
    this.minimap.update();
    this.touchControls.update();
    this.tutorial?.update();
  }

  private setupUICamera(): void {
    const cam = this.cameras.main;
    this.uiCamera = this.cameras.add(0, 0, cam.width, cam.height);
    this.uiCamera.setName('ui');

    for (const obj of this.hud.getContainers()) {
      this.uiContainers.add(obj);
    }
    this.uiContainers.add(this.teamPanel.getContainer());
    this.uiContainers.add(this.minimap.getContainer());
    this.uiContainers.add(this.touchControls.getContainer());
    if (this.gameOverOverlay) {
      this.uiContainers.add(this.gameOverOverlay);
    }
    if (this.tutorial) {
      this.uiContainers.add(this.tutorial.getContainer());
    }

    for (const obj of this.uiContainers) {
      cam.ignore(obj);
    }

    for (const obj of this.children.list) {
      if (!this.uiContainers.has(obj)) {
        this.uiCamera.ignore(obj);
      }
    }

    this.events.on('addedtoscene', (obj: Phaser.GameObjects.GameObject) => {
      if (!this.uiContainers.has(obj)) {
        this.uiCamera.ignore(obj);
      }
    });
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
