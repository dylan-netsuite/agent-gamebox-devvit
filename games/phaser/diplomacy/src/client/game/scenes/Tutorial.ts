import * as Phaser from 'phaser';
import { GamePlay } from './GamePlay';
import type { GameState, Country, PlayerInfo, Unit, BuildOption } from '../../../shared/types/game';
import { ALL_COUNTRIES, COUNTRY_NAMES } from '../../../shared/types/game';
import { STARTING_UNITS, STARTING_SUPPLY_CENTERS } from '../../../shared/data/startingPositions';
import { getHomeSupplyCenters } from '../../../shared/data/provinces';
import { resolveOrders, applyResults } from '../../../server/core/orderResolver';
import { TUTORIAL_TURNS, type TutorialTurn, type TutorialStep } from '../tutorial/tutorialScript';
import { TutorialOverlayDOM } from '../tutorial/TutorialOverlayDOM';
import { OrdersPanelDOM, type StagedOrder, type StagedRetreat, type StagedBuild } from '../ui/OrdersPanelDOM';
import { ChatPanelDOM } from '../ui/ChatPanelDOM';
import { HistoryPanelDOM } from '../ui/HistoryPanelDOM';
import { SoundManager } from '../ui/SoundManager';
import type { Order, HoldOrder, MoveOrder, SupportOrder, ConvoyOrder } from '../../../shared/types/orders';

const TUTORIAL_PLAYER: PlayerInfo = {
  userId: 'tutorial-player',
  username: 'You',
  country: 'ITALY',
};

function createTutorialGameState(): GameState {
  const players: PlayerInfo[] = [TUTORIAL_PLAYER];
  for (const country of ALL_COUNTRIES) {
    if (country === 'ITALY') continue;
    players.push({
      userId: `bot:${country.toLowerCase()}`,
      username: `Bot (${COUNTRY_NAMES[country]})`,
      country,
    });
  }

  return {
    gameId: 'tutorial',
    postId: 'tutorial',
    phase: 'orders',
    turn: { year: 1901, season: 'Spring' },
    players,
    units: [...STARTING_UNITS.map((u) => ({ ...u }))],
    supplyCenters: { ...STARTING_SUPPLY_CENTERS },
    dislodged: [],
    builds: [],
    winner: null,
    turnLog: ['=== Spring 1901 ==='],
    ordersSubmitted: [],
    turnTimeLimitMs: null,
    turnDeadline: null,
  };
}

const DEPTH_TUTORIAL_HIGHLIGHT = 20;
const HIGHLIGHT_COLOR = 0xe6c200;

export class Tutorial extends GamePlay {
  private turnIndex = 0;
  private stepIndex = 0;
  private tutorialComplete = false;
  private highlightGraphics: Phaser.GameObjects.Graphics | null = null;
  private highlightTween: Phaser.Tweens.Tween | null = null;
  private highlightAlpha = { value: 1 };

  constructor() {
    super({ key: 'Tutorial' });
  }

  // ── Disable network operations ──────────────────

  protected override createTutorialButton(): void {
    // Already in tutorial — don't show the button
  }

  protected override startPollingIfNeeded(): void {
    // No polling in tutorial
  }

  protected override async pollState(): Promise<void> {
    // No server polling
  }

  protected override async refreshGameState(): Promise<void> {
    // No server refresh
  }

  protected override async sendChat(): Promise<void> {
    // No chat in tutorial
  }

  // ── Tutorial step engine ────────────────────────

  private getCurrentTurn(): TutorialTurn | undefined {
    return TUTORIAL_TURNS[this.turnIndex];
  }

  private getCurrentStep(): TutorialStep | undefined {
    return this.getCurrentTurn()?.steps[this.stepIndex];
  }

  private getTotalStepsInTurn(): number {
    return this.getCurrentTurn()?.steps.length ?? 0;
  }

  private showCurrentStep() {
    const step = this.getCurrentStep();
    if (!step) return;
    TutorialOverlayDOM.showStep(step, this.stepIndex, this.getTotalStepsInTurn());
    this.applyTutorialHighlights(step.highlightProvinces);
    this.panCameraToProvinces(step.highlightProvinces);
  }

  private advanceStep() {
    this.stepIndex++;
    const turn = this.getCurrentTurn();
    if (!turn || this.stepIndex >= turn.steps.length) {
      return;
    }
    this.showCurrentStep();
  }

  // ── Phaser-based province highlights ───────────

  private applyTutorialHighlights(provinceIds?: string[]) {
    this.clearTutorialHighlights();
    if (!provinceIds || provinceIds.length === 0) return;

    this.highlightGraphics = this.add.graphics().setDepth(DEPTH_TUTORIAL_HIGHLIGHT);
    this.highlightAlpha = { value: 1 };

    for (const pid of provinceIds) {
      const poly = this.provincePolys[pid];
      if (!poly) continue;
      const province = this.provinces.find((p) => p.id === pid);
      if (!province) continue;

      const points = province.polygon;
      this.highlightGraphics.lineStyle(4, HIGHLIGHT_COLOR, 1);
      this.highlightGraphics.beginPath();
      this.highlightGraphics.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < points.length; i++) {
        this.highlightGraphics.lineTo(points[i]!.x, points[i]!.y);
      }
      this.highlightGraphics.closePath();
      this.highlightGraphics.strokePath();
    }

    this.highlightTween = this.tweens.add({
      targets: this.highlightAlpha,
      value: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.highlightGraphics?.setAlpha(this.highlightAlpha.value);
      },
    });
  }

  private clearTutorialHighlights() {
    this.highlightTween?.destroy();
    this.highlightTween = null;
    this.highlightGraphics?.destroy();
    this.highlightGraphics = null;
  }

  private panCameraToProvinces(provinceIds?: string[]) {
    if (!provinceIds || provinceIds.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const pid of provinceIds) {
      const province = this.provinces.find((p) => p.id === pid);
      if (!province) continue;
      for (const pt of province.polygon) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }

    if (!isFinite(minX)) return;

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cam = this.cameras.main;
    const pad = 200;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;

    this.tweens.add({
      targets: cam,
      scrollX: Phaser.Math.Clamp(cx - viewW / 2, -pad, Math.max(-pad, 2000 + pad - viewW)),
      scrollY: Phaser.Math.Clamp(cy - viewH / 2, -pad, Math.max(-pad, 1400 + pad - viewH)),
      duration: 600,
      ease: 'Sine.easeInOut',
    });
  }

  protected override stageOrder(order: StagedOrder) {
    super.stageOrder(order);

    const step = this.getCurrentStep();
    if (step?.waitForOrderFrom && order.from === step.waitForOrderFrom) {
      this.time.delayedCall(300, () => this.advanceStep());
    }
  }

  // ── Order submission (local resolution) ─────────

  protected override async submitOrders(staged: StagedOrder[]): Promise<void> {
    if (!this.currentPlayer) return;

    const step = this.getCurrentStep();
    const turn = this.getCurrentTurn();
    if (!turn) return;

    OrdersPanelDOM.setStatus('Resolving orders...');
    OrdersPanelDOM.setSubmitEnabled(false);

    const myUnits = this.gameState.units.filter((u) => u.country === this.currentPlayer!.country);
    const playerOrders: Order[] = [];
    const orderedFroms = new Set(staged.map((s) => s.from));

    for (const s of staged) {
      const unit = myUnits.find((u) => u.province === s.from);
      if (!unit) continue;
      switch (s.orderType) {
        case 'move': {
          const move: MoveOrder = { type: 'move', country: this.currentPlayer!.country, unitType: unit.type, province: s.from, destination: s.to! };
          if (s.coast) move.coast = s.coast;
          playerOrders.push(move);
          break;
        }
        case 'hold':
          playerOrders.push({ type: 'hold', country: this.currentPlayer!.country, unitType: unit.type, province: s.from } as HoldOrder);
          break;
        case 'support-hold':
          playerOrders.push({ type: 'support', country: this.currentPlayer!.country, unitType: unit.type, province: s.from, supportedProvince: s.supportedProvince! } as SupportOrder);
          break;
        case 'support-move':
          playerOrders.push({ type: 'support', country: this.currentPlayer!.country, unitType: unit.type, province: s.from, supportedProvince: s.supportedProvince!, supportedDestination: s.supportedDestination! } as SupportOrder);
          break;
        case 'convoy':
          playerOrders.push({ type: 'convoy', country: this.currentPlayer!.country, unitType: unit.type, province: s.from, convoyedProvince: s.convoyedProvince!, convoyedDestination: s.convoyedDestination! } as ConvoyOrder);
          break;
      }
    }

    for (const unit of myUnits) {
      if (orderedFroms.has(unit.province)) continue;
      playerOrders.push({ type: 'hold', country: this.currentPlayer!.country, unitType: unit.type, province: unit.province } as HoldOrder);
    }

    const allOrders: Record<string, Order[]> = { ITALY: playerOrders };
    for (const [country, orders] of Object.entries(turn.botOrders)) {
      if (country === 'ITALY') continue;
      if (orders.length > 0) {
        allOrders[country] = orders;
      }
    }

    const prevUnits = [...this.gameState.units];
    const { results, dislodged, log } = resolveOrders(this.gameState, allOrders);
    applyResults(this.gameState, results, dislodged);

    this.gameState.turnLog.push(...log);
    this.gameState.dislodged = dislodged;

    SoundManager.play('submit');

    if (step?.waitForSubmit) {
      TutorialOverlayDOM.hide();
    }

    if (dislodged.length > 0) {
      this.gameState.phase = 'retreats';
      this.advanceToNextTurn();
      this.reloadTutorialScene(prevUnits);
      return;
    }

    this.handlePostResolution(prevUnits);
  }

  private handlePostResolution(prevUnits: Unit[]) {
    const turn = this.getCurrentTurn();
    if (!turn) return;

    if (turn.season === 'Fall') {
      this.updateSupplyCenters();
      const buildInfo = this.calculateBuilds();
      if (buildInfo.length > 0) {
        this.gameState.phase = 'builds';
        this.gameState.builds = buildInfo;
        this.advanceToNextTurn();
        this.reloadTutorialScene(prevUnits);
        return;
      }
    }

    this.advanceTurn();
    this.advanceToNextTurn();
    this.reloadTutorialScene(prevUnits);
  }

  protected override async submitRetreats(staged: StagedRetreat[]): Promise<void> {
    const prevUnits = [...this.gameState.units];

    for (const retreat of staged) {
      if (retreat.destination) {
        const unit = this.gameState.dislodged.find((d) => d.from === retreat.from);
        if (unit) {
          const newUnit: Unit = { ...unit.unit, province: retreat.destination };
          delete newUnit.coast;
          this.gameState.units.push(newUnit);
        }
      }
    }

    this.gameState.dislodged = [];

    const turn = this.getCurrentTurn();
    if (turn && turn.season === 'Fall') {
      this.updateSupplyCenters();
      const buildInfo = this.calculateBuilds();
      if (buildInfo.length > 0) {
        this.gameState.phase = 'builds';
        this.gameState.builds = buildInfo;
        this.advanceToNextTurn();
        this.reloadTutorialScene(prevUnits);
        return;
      }
    }

    this.advanceTurn();
    this.advanceToNextTurn();
    this.reloadTutorialScene(prevUnits);
  }

  protected override async submitBuilds(staged: StagedBuild[]): Promise<void> {
    const prevUnits = [...this.gameState.units];

    for (const build of staged) {
      if (build.type === 'build' && build.province && build.unitType) {
        this.gameState.units.push({
          type: build.unitType,
          country: this.currentPlayer!.country,
          province: build.province,
        });
      } else if (build.type === 'disband' && build.province) {
        this.gameState.units = this.gameState.units.filter(
          (u) => !(u.province === build.province && u.country === this.currentPlayer!.country)
        );
      }
    }

    // Bot builds: each bot builds armies in open home SCs if they have builds available
    for (const player of this.gameState.players) {
      if (player.country === 'ITALY') continue;
      const botBuilds = this.calculateBuildsForCountry(player.country);
      if (botBuilds.delta > 0) {
        let remaining = botBuilds.delta;
        for (const prov of botBuilds.validProvinces) {
          if (remaining <= 0) break;
          this.gameState.units.push({ type: 'Army', country: player.country, province: prov });
          remaining--;
        }
      } else if (botBuilds.delta < 0) {
        let toDisband = Math.abs(botBuilds.delta);
        const botUnits = this.gameState.units.filter((u) => u.country === player.country);
        while (toDisband > 0 && botUnits.length > 0) {
          const victim = botUnits.pop()!;
          this.gameState.units = this.gameState.units.filter((u) => u !== victim);
          toDisband--;
        }
      }
    }

    this.gameState.builds = [];
    this.advanceTurn();
    this.advanceToNextTurn();
    this.reloadTutorialScene(prevUnits);
  }

  // ── Game state helpers ──────────────────────────

  private updateSupplyCenters() {
    for (const unit of this.gameState.units) {
      if (this.gameState.supplyCenters[unit.province] !== undefined) {
        this.gameState.supplyCenters[unit.province] = unit.country;
      }
    }
  }

  private calculateBuilds(): BuildOption[] {
    const builds: BuildOption[] = [];
    for (const player of this.gameState.players) {
      const info = this.calculateBuildsForCountry(player.country);
      if (info.delta !== 0) {
        builds.push(info);
      }
    }
    return builds;
  }

  private calculateBuildsForCountry(country: Country): BuildOption {
    const scCount = Object.values(this.gameState.supplyCenters).filter((c) => c === country).length;
    const unitCount = this.gameState.units.filter((u) => u.country === country).length;
    const delta = scCount - unitCount;

    let validProvinces: string[] = [];
    if (delta > 0) {
      const homeSCs = getHomeSupplyCenters(country).map((p) => p.id);
      validProvinces = homeSCs.filter((sc) => {
        const owner = this.gameState.supplyCenters[sc];
        if (owner !== country) return false;
        const occupied = this.gameState.units.some((u) => u.province === sc);
        return !occupied;
      });
    } else if (delta < 0) {
      validProvinces = this.gameState.units
        .filter((u) => u.country === country)
        .map((u) => u.province);
    }

    return { country, delta, validProvinces };
  }

  private advanceTurn() {
    if (this.gameState.turn.season === 'Spring') {
      this.gameState.turn.season = 'Fall';
    } else {
      this.gameState.turn.season = 'Spring';
      this.gameState.turn.year++;
    }
    this.gameState.phase = 'orders';
    this.gameState.ordersSubmitted = [];
    this.gameState.turnLog = [`=== ${this.gameState.turn.season} ${this.gameState.turn.year} ===`];
  }

  private advanceToNextTurn() {
    this.turnIndex++;
    this.stepIndex = 0;

    if (this.turnIndex >= TUTORIAL_TURNS.length) {
      this.tutorialComplete = true;
    }
  }

  private reloadTutorialScene(previousUnits?: Unit[]) {
    this.clearTutorialHighlights();
    this.stopPolling();
    OrdersPanelDOM.destroy();
    ChatPanelDOM.destroy();
    HistoryPanelDOM.destroy();
    TutorialOverlayDOM.destroy();
    SoundManager.destroy();

    const tooltipEl = document.getElementById('province-tooltip');
    if (tooltipEl) tooltipEl.remove();
    const myGamesBtn = document.getElementById('my-games-btn');
    if (myGamesBtn) myGamesBtn.remove();
    const historyBtn = document.getElementById('history-btn');
    if (historyBtn) historyBtn.remove();
    const tutorialBtn = document.getElementById('tutorial-btn');
    if (tutorialBtn) tutorialBtn.remove();

    this.scene.restart({
      gameState: this.gameState,
      currentPlayer: this.currentPlayer,
      previousUnits,
      _tutorialState: {
        turnIndex: this.turnIndex,
        stepIndex: this.stepIndex,
        tutorialComplete: this.tutorialComplete,
      },
    });
  }

  override init(data?: {
    gameState?: GameState;
    currentPlayer?: PlayerInfo | null;
    previousUnits?: Unit[];
    _tutorialState?: { turnIndex: number; stepIndex: number; tutorialComplete: boolean };
  }) {
    if (data?._tutorialState) {
      this.turnIndex = data._tutorialState.turnIndex;
      this.stepIndex = data._tutorialState.stepIndex;
      this.tutorialComplete = data._tutorialState.tutorialComplete;
      super.init({
        gameState: data.gameState!,
        currentPlayer: data.currentPlayer ?? TUTORIAL_PLAYER,
        previousUnits: data.previousUnits,
      });
    } else if (data?.gameState) {
      super.init({
        gameState: data.gameState,
        currentPlayer: data.currentPlayer ?? TUTORIAL_PLAYER,
        previousUnits: data.previousUnits,
      });
    } else {
      const state = createTutorialGameState();
      super.init({
        gameState: state,
        currentPlayer: TUTORIAL_PLAYER,
      });
      this.turnIndex = 0;
      this.stepIndex = 0;
      this.tutorialComplete = false;
    }
  }

  override create() {
    super.create();

    TutorialOverlayDOM.init({
      onNext: () => this.advanceStep(),
      onSkip: () => this.exitTutorial(),
    });

    if (this.tutorialComplete) {
      TutorialOverlayDOM.showCompletion(() => this.exitTutorial());
    } else {
      this.showCurrentStep();
    }
  }

  private exitTutorial() {
    this.clearTutorialHighlights();
    this.stopPolling();
    OrdersPanelDOM.destroy();
    ChatPanelDOM.destroy();
    HistoryPanelDOM.destroy();
    TutorialOverlayDOM.destroy();
    SoundManager.destroy();

    const tooltipEl = document.getElementById('province-tooltip');
    if (tooltipEl) tooltipEl.remove();
    const myGamesBtn = document.getElementById('my-games-btn');
    if (myGamesBtn) myGamesBtn.remove();
    const historyBtn = document.getElementById('history-btn');
    if (historyBtn) historyBtn.remove();
    const tutorialBtn = document.getElementById('tutorial-btn');
    if (tutorialBtn) tutorialBtn.remove();

    this.scene.start('MainMenu');
  }

  override shutdown(): void {
    this.clearTutorialHighlights();
    TutorialOverlayDOM.destroy();
    super.shutdown();
  }
}
