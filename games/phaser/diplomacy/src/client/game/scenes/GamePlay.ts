import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import type { GameState, PlayerInfo, Unit, Country } from '../../../shared/types/game';
import { COUNTRY_COLORS, ALL_COUNTRIES } from '../../../shared/types/game';
import { PROVINCES } from '../../../shared/data/provinces';
import { ADJACENCIES, getValidMoves, determineCoast } from '../../../shared/data/adjacencies';
import { getProvincePolygons, getWaterOverlays } from '../../../shared/data/boardAdapter';
import { DiplomacyTheme, POWER_COLORS } from '../ui/theme';
import {
  OrdersPanelDOM,
  type StagedOrder,
  type StagedRetreat,
  type StagedBuild,
  type OrderMode,
} from '../ui/OrdersPanelDOM';
import { ChatPanelDOM, type ChatMessage } from '../ui/ChatPanelDOM';
import { HistoryPanelDOM } from '../ui/HistoryPanelDOM';
import { SoundManager } from '../ui/SoundManager';
import type { Order, MoveOrder, HoldOrder, SupportOrder, ConvoyOrder } from '../../../shared/types/orders';
import type { SubmitOrdersResponse, SubmitRetreatsResponse, SubmitBuildsResponse, ErrorResponse } from '../../../shared/types/api';

const DEPTH_GRID = 0;
const DEPTH_WATER = 1;
const DEPTH_LAND = 2;
const DEPTH_WATER_OVERLAY = 3;
const DEPTH_SC_MARKER = 4;
const DEPTH_LABEL = 5;
const DEPTH_ORDER_ARROW = 8;
const DEPTH_UNIT = 10;
const DEPTH_ARROW = 15;

const POLL_INTERVAL_MS = 5000;

const ARROW_COLORS: Record<string, number> = {
  move: 0xffffff,
  hold: 0xf0c040,
  'support-hold': 0x2ecc71,
  'support-move': 0x2ecc71,
  convoy: 0x3498db,
};

type ProvinceMeta = {
  id: string;
  name: string;
  type: 'land' | 'sea';
  supplyCenter: boolean;
  homeCountry?: Country | undefined;
  polygon: Array<{ x: number; y: number }>;
  x: number;
  y: number;
  width: number;
  height: number;
};

export class GamePlay extends Scene {
  private gameState!: GameState;
  private currentPlayer: PlayerInfo | null = null;
  private previousUnits: Unit[] | null = null;

  private worldWidth = 2000;
  private worldHeight = 1400;
  private readonly CAM_PAD = 200;

  private provinces: ProvinceMeta[] = [];
  private provincePolys: Record<string, Phaser.GameObjects.Polygon> = {};
  private provinceLabels: Record<string, Phaser.GameObjects.Text> = {};
  private unitTokens: Record<string, Phaser.GameObjects.GameObject[]> = {};

  private selectedProvinceId: string | null = null;
  private selectedUnitProvince: string | null = null;
  private legalTargets: Set<string> = new Set();
  private stagedOrders: StagedOrder[] = [];
  private orderedProvinces: Set<string> = new Set();

  private orderMode: OrderMode = 'move';
  private supportStep: 'select-supporter' | 'select-supported' | 'select-destination' | null = null;
  private supporterProvince: string | null = null;
  private supportedProvince: string | null = null;

  private convoyStep: 'select-fleet' | 'select-army' | 'select-destination' | null = null;
  private convoyFleetProvince: string | null = null;
  private convoyArmyProvince: string | null = null;

  private hoverArrowGraphics!: Phaser.GameObjects.Graphics;
  private orderArrowGraphics!: Phaser.GameObjects.Graphics;
  private tooltipEl: HTMLDivElement | null = null;
  private coastPickerEl: HTMLDivElement | null = null;
  private pendingCoastOrder: { unitType: 'Army' | 'Fleet'; from: string; to: string } | null = null;
  private myGamesBtn: HTMLButtonElement | null = null;
  private historyBtn: HTMLButtonElement | null = null;
  private historyMode = false;

  private isDragging = false;
  private dragMoved = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private chatMessages: ChatMessage[] = [];
  private lastChatTimestamp = 0;

  constructor() {
    super('GamePlay');
  }

  private autoOpenHistory = false;

  init(data: { gameState: GameState; currentPlayer: PlayerInfo | null; previousUnits?: Unit[]; historyMode?: boolean }) {
    this.gameState = data.gameState;
    this.currentPlayer = data.currentPlayer;
    this.previousUnits = data.previousUnits ?? null;
    this.autoOpenHistory = data.historyMode ?? false;
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor(DiplomacyTheme.background);
    cam.setBounds(
      -this.CAM_PAD,
      -this.CAM_PAD,
      this.worldWidth + this.CAM_PAD * 2,
      this.worldHeight + this.CAM_PAD * 2
    );
    cam.setZoom(1);

    this.drawGrid();
    this.buildProvinces();
    this.drawProvinces();
    this.drawWaterOverlays();
    this.drawSupplyCenterMarkers();

    this.orderArrowGraphics = this.add.graphics().setDepth(DEPTH_ORDER_ARROW);
    this.hoverArrowGraphics = this.add.graphics().setDepth(DEPTH_ARROW);

    this.drawUnits();
    this.setupCameraControls();
    this.setupResizeHandler();
    this.setupTooltip();

    this.input.keyboard?.on('keydown-ESC', () => this.clearSelection());
    this.input.setTopOnly(true);

    OrdersPanelDOM.init({
      onClear: () => {
        this.stagedOrders = [];
        this.orderedProvinces.clear();
        OrdersPanelDOM.setOrders(this.stagedOrders);
        this.clearSelection();
        this.redrawOrderArrows();
      },
      onSubmit: (orders) => void this.submitOrders(orders),
      onRefresh: () => void this.refreshGameState(),
      onModeChange: (mode) => this.onModeChange(mode),
      onSubmitRetreats: (retreats) => void this.submitRetreats(retreats),
      onSubmitBuilds: (builds) => void this.submitBuilds(builds),
    });

    ChatPanelDOM.init((text, channel) => void this.sendChat(text, channel), this.currentPlayer?.country);
    SoundManager.init(this);
    this.createMyGamesButton();
    this.createHistoryButton();

    this.updatePanelState();
    this.startPollingIfNeeded();

    if (this.previousUnits) {
      this.animateUnitMovements(this.previousUnits);
    }

    if (this.autoOpenHistory) {
      this.autoOpenHistory = false;
      void this.toggleHistoryMode();
    }
  }

  // ── Grid ──────────────────────────────────────

  private drawGrid() {
    const grid = this.add.graphics().setDepth(DEPTH_GRID);
    grid.lineStyle(1, DiplomacyTheme.grid, 1);
    for (let x = 0; x <= this.worldWidth; x += 200) {
      grid.lineBetween(x, 0, x, this.worldHeight);
    }
    for (let y = 0; y <= this.worldHeight; y += 200) {
      grid.lineBetween(0, y, this.worldWidth, y);
    }
  }

  // ── Province building ─────────────────────────

  private buildProvinces() {
    const polygons = getProvincePolygons();

    for (const [id, prov] of Object.entries(PROVINCES)) {
      const polygon = polygons[id];
      if (!polygon || polygon.length < 3) continue;

      const xs = polygon.map((p) => p.x);
      const ys = polygon.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      this.provinces.push({
        id,
        name: prov.name,
        type: prov.type === 'water' ? 'sea' : 'land',
        supplyCenter: prov.supplyCenter,
        homeCountry: prov.homeCountry,
        polygon,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      });
    }

    const nonPlayable: Array<{ id: string; name: string }> = [
      { id: 'SWI', name: 'Switzerland' },
      { id: 'IRE', name: 'Ireland' },
      { id: 'SIC', name: 'Sicily' },
      { id: 'COR', name: 'Corsica' },
    ];
    for (const { id, name } of nonPlayable) {
      const poly = polygons[id];
      if (poly && poly.length >= 3) {
        const xs = poly.map((p) => p.x);
        const ys = poly.map((p) => p.y);
        this.provinces.push({
          id,
          name,
          type: 'land',
          supplyCenter: false,
          polygon: poly,
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        });
      }
    }
  }

  private drawProvinces() {
    const sorted = [...this.provinces].sort((a, b) => {
      const aw = a.type === 'sea' ? 0 : 1;
      const bw = b.type === 'sea' ? 0 : 1;
      return aw - bw;
    });

    for (const province of sorted) {
      const minX = province.x;
      const minY = province.y;
      const local = province.polygon.map((p) => ({ x: p.x - minX, y: p.y - minY }));
      const flat = local.flatMap((p) => [p.x, p.y]);
      const fill = this.fillColorFor(province);
      const depth = province.type === 'sea' ? DEPTH_WATER : DEPTH_LAND;

      const poly = this.add
        .polygon(minX, minY, flat, fill, 0.95)
        .setOrigin(0)
        .setClosePath(true)
        .setStrokeStyle(2, DiplomacyTheme.coastline, 0.95)
        .setDepth(depth);

      poly.setInteractive(new Phaser.Geom.Polygon(flat), Phaser.Geom.Polygon.Contains);
      poly.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        this.highlightProvince(province.id, true);
        this.showTooltip(province);
        if (this.selectedProvinceId && this.legalTargets.has(province.id)) {
          this.drawHoverArrow(this.selectedProvinceId, province.id);
        }
      });
      poly.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        this.highlightProvince(province.id, false);
        this.hideTooltip();
        this.clearHoverArrow();
      });
      poly.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (this.dragMoved) return;
        if (pointer.rightButtonDown()) {
          this.clearSelection();
          return;
        }
        this.onProvinceClick(province.id);
      });

      this.provincePolys[province.id] = poly;

      const { x: cx, y: cy } = this.labelPositionFor(province);
      const isSea = province.type === 'sea';
      const label = this.add
        .text(cx, cy, province.id, {
          fontFamily: 'Arial Black',
          fontSize: '18px',
          color: ['SWI', 'IRE', 'SIC', 'COR'].includes(province.id) ? '#FFFFFF' : '#D7DADC',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH_LABEL);

      if (isSea) label.setAlpha(0.55);

      this.provinceLabels[province.id] = label;
    }
  }

  private drawWaterOverlays() {
    const overlays = getWaterOverlays();
    for (const poly of overlays) {
      if (!poly || poly.length < 3) continue;
      const flat = poly.flatMap((p) => [p.x, p.y]);
      this.add
        .polygon(0, 0, flat, DiplomacyTheme.waterFill, 1)
        .setOrigin(0)
        .setClosePath(true)
        .setStrokeStyle(2, DiplomacyTheme.coastline, 0.95)
        .setDepth(DEPTH_WATER_OVERLAY);
    }
  }

  private fillColorFor(province: ProvinceMeta): number {
    const nonPlayableIds = new Set(['SWI', 'IRE', 'SIC', 'COR']);
    if (nonPlayableIds.has(province.id)) return 0x555555;
    if (province.type === 'sea') return DiplomacyTheme.waterFill;

    const scOwner = province.supplyCenter
      ? (this.gameState.supplyCenters[province.id] as Country | undefined)
      : undefined;

    if (scOwner && COUNTRY_COLORS[scOwner]) {
      const cc = Phaser.Display.Color.HexStringToColor(COUNTRY_COLORS[scOwner]);
      return (cc.red << 16) | (cc.green << 8) | cc.blue;
    }

    return DiplomacyTheme.landFill;
  }

  private labelPositionFor(province: ProvinceMeta): { x: number; y: number } {
    const pts = province.polygon;
    let signedArea = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const pi = pts[i]!;
      const pj = pts[j]!;
      const a = pi.x * pj.y - pj.x * pi.y;
      signedArea += a;
      cx += (pi.x + pj.x) * a;
      cy += (pi.y + pj.y) * a;
    }
    signedArea *= 0.5;
    if (Math.abs(signedArea) > 1e-5) {
      cx = cx / (6 * signedArea);
      cy = cy / (6 * signedArea);
      return { x: cx, y: cy };
    }
    return { x: province.x + province.width / 2, y: province.y + province.height / 2 };
  }

  // ── Units ──────────────────────────────────────

  private drawUnits() {
    for (const unit of this.gameState.units) {
      const province = this.provinces.find((p) => p.id === unit.province);
      if (!province) continue;

      const labelObj = this.provinceLabels[unit.province];
      const fallbackX = province.x + province.width / 2;
      const fallbackY = province.y + province.height / 2;
      const tokenOffsetY = 22;
      const centerX = labelObj ? labelObj.x : fallbackX;
      const centerY = labelObj ? labelObj.y - tokenOffsetY : fallbackY - tokenOffsetY;

      const color = POWER_COLORS[unit.country] ?? 0xffffff;
      const isArmy = unit.type === 'Army';

      const token = this.add
        .rectangle(centerX, centerY, isArmy ? 28 : 48, isArmy ? 28 : 16, color, 0.95)
        .setStrokeStyle(3, 0x000000, 1)
        .setDepth(DEPTH_UNIT)
        .setInteractive()
        .on('pointerdown', () => this.onUnitDown(unit.province, unit.type));

      token.on('pointerover', () => this.input.setDefaultCursor('pointer'));
      token.on('pointerout', () => this.input.setDefaultCursor('default'));

      const unitLabel = this.add
        .text(centerX, centerY, isArmy ? 'A' : 'F', {
          fontFamily: 'Arial Black',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH_UNIT + 1);

      this.unitTokens[unit.province] = [token, unitLabel];
    }
  }

  // ── Turn resolution animation ─────────────────

  private animateUnitMovements(prevUnits: Unit[]) {
    for (const unit of this.gameState.units) {
      const prev = prevUnits.find(
        (u) => u.country === unit.country && u.type === unit.type && u.province !== unit.province
      );
      if (!prev) continue;

      const tokens = this.unitTokens[unit.province];
      if (!tokens || tokens.length === 0) continue;

      const fromCenter = this.centerOf(prev.province);
      const toCenter = this.centerOf(unit.province);

      for (const obj of tokens) {
        if (obj instanceof Phaser.GameObjects.Rectangle || obj instanceof Phaser.GameObjects.Text) {
          const finalX = obj.x;
          const finalY = obj.y;
          const offsetX = fromCenter.x - toCenter.x;
          const offsetY = fromCenter.y - toCenter.y;
          obj.setPosition(finalX + offsetX, finalY + offsetY);
          this.tweens.add({
            targets: obj,
            x: finalX,
            y: finalY,
            duration: 800,
            ease: 'Cubic.easeOut',
          });
        }
      }
    }
  }

  // ── Province interaction ───────────────────────

  private highlightProvince(provinceId: string, hovered: boolean) {
    if (this.selectedProvinceId === provinceId) return;
    const poly = this.provincePolys[provinceId];
    if (!poly) return;
    poly.setAlpha(hovered ? 1 : 0.85);
    if (!this.legalTargets.has(provinceId)) {
      poly.setStrokeStyle(hovered ? 3 : 2, DiplomacyTheme.coastline, 0.95);
    }
  }

  private selectProvince(provinceId: string) {
    if (this.selectedProvinceId) {
      const prev = this.provincePolys[this.selectedProvinceId];
      if (prev) prev.setStrokeStyle(2, DiplomacyTheme.coastline, 0.95);
    }
    this.selectedProvinceId = provinceId;
    const poly = this.provincePolys[provinceId];
    if (poly) poly.setStrokeStyle(4, 0xffffff, 1);

    const province = this.provinces.find((p) => p.id === provinceId);
    if (province) {
      const cam = this.cameras.main;
      const pad = this.CAM_PAD;
      const viewW = cam.width / cam.zoom;
      const viewH = cam.height / cam.zoom;
      const targetX = province.x + province.width / 2;
      const targetY = province.y + province.height / 2;
      this.tweens.add({
        targets: cam,
        scrollX: Phaser.Math.Clamp(
          targetX - viewW / 2,
          -pad,
          Math.max(-pad, this.worldWidth + pad - viewW)
        ),
        scrollY: Phaser.Math.Clamp(
          targetY - viewH / 2,
          -pad,
          Math.max(-pad, this.worldHeight + pad - viewH)
        ),
        duration: 250,
        ease: 'Sine.easeOut',
      });
    }
    this.clearHoverArrow();
  }

  private clearSelection() {
    if (this.selectedProvinceId) {
      const p = this.provincePolys[this.selectedProvinceId];
      if (p) p.setStrokeStyle(2, DiplomacyTheme.coastline, 0.95);
    }
    this.selectedProvinceId = null;
    this.selectedUnitProvince = null;
    this.supportStep = null;
    this.supporterProvince = null;
    this.supportedProvince = null;
    this.convoyStep = null;
    this.convoyFleetProvince = null;
    this.convoyArmyProvince = null;
    this.clearLegalHighlights();
    this.clearHoverArrow();
  }

  private onModeChange(mode: OrderMode) {
    this.orderMode = mode;
    this.clearSelection();
    switch (mode) {
      case 'hold':
        OrdersPanelDOM.setStatus('Click a unit to hold');
        break;
      case 'support-hold':
      case 'support-move':
        OrdersPanelDOM.setStatus('Click the SUPPORTING unit first');
        break;
      case 'convoy':
        this.convoyStep = 'select-fleet';
        OrdersPanelDOM.setStatus('Click a FLEET (in sea) to convoy with');
        break;
      default:
        OrdersPanelDOM.setStatus(`Playing as ${this.currentPlayer?.country ?? '?'}`);
    }
  }

  private onUnitDown(provinceId: string, unitType: 'Army' | 'Fleet') {
    if (this.historyMode) return;
    if (this.orderMode === 'hold') {
      this.stageOrder({ orderType: 'hold', unitType, from: provinceId });
      return;
    }
    if (this.orderMode === 'support-hold' || this.orderMode === 'support-move') {
      this.handleSupportClick(provinceId);
      return;
    }
    if (this.orderMode === 'convoy') {
      this.handleConvoyClick(provinceId);
      return;
    }

    this.selectedUnitProvince = provinceId;
    this.selectProvince(provinceId);
    this.computeLegalTargets(provinceId, unitType);
    this.applyLegalHighlights();
  }

  private onProvinceClick(provinceId: string) {
    if (this.historyMode) return;
    if (this.orderMode === 'hold') {
      const unitAt = this.gameState.units.find((u) => u.province === provinceId);
      if (unitAt && this.isMyUnit(unitAt)) {
        this.stageOrder({ orderType: 'hold', unitType: unitAt.type, from: provinceId });
      }
      return;
    }
    if (this.orderMode === 'support-hold' || this.orderMode === 'support-move') {
      this.handleSupportClick(provinceId);
      return;
    }
    if (this.orderMode === 'convoy') {
      this.handleConvoyClick(provinceId);
      return;
    }

    if (!this.selectedProvinceId) {
      this.selectProvince(provinceId);
      const unitAt = this.gameState.units.find((u) => u.province === provinceId);
      if (unitAt) {
        this.selectedUnitProvince = provinceId;
        this.computeLegalTargets(provinceId, unitAt.type);
        this.applyLegalHighlights();
      }
      return;
    }

    if (this.selectedProvinceId === provinceId) {
      this.clearSelection();
      return;
    }

    if (this.legalTargets.has(provinceId) && this.selectedUnitProvince) {
      const unit = this.gameState.units.find((u) => u.province === this.selectedUnitProvince);
      if (unit) {
        if (unit.type === 'Fleet' && this.isMultiCoastProvince(provinceId)) {
          this.showCoastPicker(unit.type, this.selectedUnitProvince, provinceId);
          return;
        }
        const autoCoast = unit.type === 'Fleet' ? determineCoast(this.selectedUnitProvince, provinceId) : undefined;
        this.stageOrder({
          orderType: 'move',
          unitType: unit.type,
          from: this.selectedUnitProvince,
          to: provinceId,
          coast: autoCoast as 'NC' | 'SC' | 'EC' | undefined,
        });
      }
      this.clearSelection();
    } else {
      this.selectProvince(provinceId);
      const unitAt = this.gameState.units.find((u) => u.province === provinceId);
      if (unitAt) {
        this.selectedUnitProvince = provinceId;
        this.computeLegalTargets(provinceId, unitAt.type);
        this.applyLegalHighlights();
      } else {
        this.selectedUnitProvince = null;
        this.clearLegalHighlights();
      }
    }
  }

  // ── Convoy flow ───────────────────────────────

  private handleConvoyClick(provinceId: string) {
    if (this.convoyStep === 'select-fleet') {
      const unit = this.gameState.units.find((u) => u.province === provinceId);
      if (!unit || unit.type !== 'Fleet' || !this.isMyUnit(unit)) {
        OrdersPanelDOM.setStatus('Click one of YOUR FLEETS in a sea province');
        return;
      }
      const prov = PROVINCES[provinceId];
      if (!prov || prov.type !== 'water') {
        OrdersPanelDOM.setStatus('Fleet must be in a sea province to convoy');
        return;
      }
      this.convoyFleetProvince = provinceId;
      this.convoyStep = 'select-army';
      this.selectProvince(provinceId);
      OrdersPanelDOM.setStatus('Now click the ARMY to be convoyed');
      return;
    }

    if (this.convoyStep === 'select-army') {
      const unit = this.gameState.units.find((u) => u.province === provinceId);
      if (!unit || unit.type !== 'Army') {
        OrdersPanelDOM.setStatus('Click an ARMY to convoy');
        return;
      }
      this.convoyArmyProvince = provinceId;
      this.convoyStep = 'select-destination';
      this.selectProvince(provinceId);

      const moves = getValidMoves(provinceId, 'Army');
      this.legalTargets = new Set(moves);
      this.applyLegalHighlights();
      OrdersPanelDOM.setStatus('Now click the DESTINATION for the convoyed army');
      return;
    }

    if (this.convoyStep === 'select-destination') {
      this.stageOrder({
        orderType: 'convoy',
        unitType: 'Fleet',
        from: this.convoyFleetProvince!,
        convoyedProvince: this.convoyArmyProvince!,
        convoyedDestination: provinceId,
      });
      this.convoyStep = 'select-fleet';
      this.convoyFleetProvince = null;
      this.convoyArmyProvince = null;
      this.clearSelection();
      OrdersPanelDOM.setStatus('Click a FLEET (in sea) to convoy with');
    }
  }

  // ── Coast picker ─────────────────────────────

  private static readonly MULTI_COAST_PROVINCES: Record<string, string[]> = {
    STP: ['NC', 'SC'],
    SPA: ['NC', 'SC'],
    BUL: ['EC', 'SC'],
  };

  private isMultiCoastProvince(provinceId: string): boolean {
    return provinceId in GamePlay.MULTI_COAST_PROVINCES;
  }

  private showCoastPicker(unitType: 'Army' | 'Fleet', from: string, to: string) {
    this.hideCoastPicker();
    this.pendingCoastOrder = { unitType, from, to };

    const coasts = GamePlay.MULTI_COAST_PROVINCES[to];
    if (!coasts) return;

    const el = document.createElement('div');
    el.id = 'coast-picker';

    const label = document.createElement('div');
    label.className = 'coast-picker-label';
    label.textContent = `Select coast for ${to}:`;
    el.appendChild(label);

    const btnRow = document.createElement('div');
    btnRow.className = 'coast-picker-btns';

    for (const coast of coasts) {
      const btn = document.createElement('button');
      btn.className = 'coast-picker-btn';
      btn.textContent = coast === 'NC' ? 'North Coast' : coast === 'SC' ? 'South Coast' : 'East Coast';
      btn.onclick = () => {
        if (this.pendingCoastOrder) {
          this.stageOrder({
            orderType: 'move',
            unitType: this.pendingCoastOrder.unitType,
            from: this.pendingCoastOrder.from,
            to: this.pendingCoastOrder.to,
            coast: coast as 'NC' | 'SC' | 'EC',
          });
        }
        this.hideCoastPicker();
        this.clearSelection();
      };
      btnRow.appendChild(btn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'coast-picker-btn coast-picker-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
      this.hideCoastPicker();
    };
    btnRow.appendChild(cancelBtn);

    el.appendChild(btnRow);
    const app = document.getElementById('app') ?? document.body;
    app.appendChild(el);
    this.coastPickerEl = el;
  }

  private hideCoastPicker() {
    this.coastPickerEl?.remove();
    this.coastPickerEl = null;
    this.pendingCoastOrder = null;
  }

  // ── Support flow ──────────────────────────────

  private handleSupportClick(provinceId: string) {
    if (!this.supportStep || this.supportStep === 'select-supporter') {
      const unit = this.gameState.units.find((u) => u.province === provinceId);
      if (!unit || !this.isMyUnit(unit)) {
        OrdersPanelDOM.setStatus('Click one of YOUR units to support with');
        return;
      }
      this.supporterProvince = provinceId;
      this.supportStep = 'select-supported';
      this.selectProvince(provinceId);

      const adj = ADJACENCIES[provinceId];
      if (adj) {
        const reachable = new Set([
          ...(unit.type === 'Army' ? adj.army : adj.fleet),
          ...(adj.coastFleet ? Object.values(adj.coastFleet).flat() : []),
        ]);
        this.legalTargets = reachable;
        this.applyLegalHighlights();
      }
      OrdersPanelDOM.setStatus('Now click the unit to SUPPORT');
      return;
    }

    if (this.supportStep === 'select-supported') {
      this.supportedProvince = provinceId;
      if (this.orderMode === 'support-hold') {
        this.stageOrder({
          orderType: 'support-hold',
          unitType: this.getUnitTypeAt(this.supporterProvince!) ?? 'Army',
          from: this.supporterProvince!,
          supportedProvince: provinceId,
        });
        this.resetSupportFlow();
        return;
      }
      this.supportStep = 'select-destination';
      this.selectProvince(provinceId);
      const supportedUnit = this.gameState.units.find((u) => u.province === provinceId);
      if (supportedUnit) {
        const moves = getValidMoves(provinceId, supportedUnit.type);
        const supporterAdj = this.getAdjacentProvinces(this.supporterProvince!);
        this.legalTargets = new Set(moves.filter((m) => supporterAdj.has(m)));
        this.applyLegalHighlights();
      }
      OrdersPanelDOM.setStatus('Now click the DESTINATION of the supported move');
      return;
    }

    if (this.supportStep === 'select-destination') {
      this.stageOrder({
        orderType: 'support-move',
        unitType: this.getUnitTypeAt(this.supporterProvince!) ?? 'Army',
        from: this.supporterProvince!,
        supportedProvince: this.supportedProvince!,
        supportedDestination: provinceId,
      });
      this.resetSupportFlow();
    }
  }

  private resetSupportFlow() {
    this.supportStep = 'select-supporter';
    this.supporterProvince = null;
    this.supportedProvince = null;
    this.clearSelection();
    OrdersPanelDOM.setStatus('Click the SUPPORTING unit first');
  }

  private getUnitTypeAt(provinceId: string): 'Army' | 'Fleet' | null {
    const u = this.gameState.units.find((u) => u.province === provinceId);
    return u ? u.type : null;
  }

  private getAdjacentProvinces(provinceId: string): Set<string> {
    const adj = ADJACENCIES[provinceId];
    if (!adj) return new Set();
    const all = new Set([...adj.army, ...adj.fleet]);
    if (adj.coastFleet) {
      for (const coastList of Object.values(adj.coastFleet)) {
        for (const p of coastList) all.add(p);
      }
    }
    return all;
  }

  private isMyUnit(unit: Unit): boolean {
    return this.currentPlayer != null && unit.country === this.currentPlayer.country;
  }

  // ── Order staging (with duplicate prevention) ─

  private stageOrder(order: StagedOrder) {
    if (this.orderedProvinces.has(order.from)) {
      this.stagedOrders = this.stagedOrders.filter((o) => o.from !== order.from);
    }
    this.stagedOrders.push(order);
    this.orderedProvinces.add(order.from);
    OrdersPanelDOM.setOrders(this.stagedOrders);
    this.redrawOrderArrows();
    SoundManager.play('order');
  }

  // ── Persistent order arrows ───────────────────

  private redrawOrderArrows() {
    this.orderArrowGraphics.clear();
    for (const order of this.stagedOrders) {
      const color = ARROW_COLORS[order.orderType] ?? 0xffffff;
      const from = this.centerOf(order.from);

      if (order.orderType === 'hold') {
        this.orderArrowGraphics.lineStyle(3, color, 0.7);
        this.orderArrowGraphics.strokeCircle(from.x, from.y, 18);
        continue;
      }

      let toId: string | undefined;
      if (order.orderType === 'move') toId = order.to;
      else if (order.orderType === 'support-hold') toId = order.supportedProvince;
      else if (order.orderType === 'support-move') toId = order.supportedDestination;
      else if (order.orderType === 'convoy') toId = order.convoyedDestination;

      if (!toId) continue;
      const to = this.centerOf(toId);

      this.orderArrowGraphics.lineStyle(3, color, 0.7);
      this.orderArrowGraphics.strokeLineShape(new Phaser.Geom.Line(from.x, from.y, to.x, to.y));

      const angle = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y);
      const headLen = 12;
      this.orderArrowGraphics.lineBetween(
        to.x, to.y,
        to.x - headLen * Math.cos(angle - Math.PI / 6),
        to.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      this.orderArrowGraphics.lineBetween(
        to.x, to.y,
        to.x - headLen * Math.cos(angle + Math.PI / 6),
        to.y - headLen * Math.sin(angle + Math.PI / 6)
      );

      if (order.orderType === 'support-move' && order.supportedProvince) {
        const supported = this.centerOf(order.supportedProvince);
        this.orderArrowGraphics.lineStyle(2, color, 0.4);
        this.orderArrowGraphics.strokeLineShape(
          new Phaser.Geom.Line(from.x, from.y, supported.x, supported.y)
        );
      }

      if (order.orderType === 'convoy' && order.convoyedProvince) {
        const army = this.centerOf(order.convoyedProvince);
        this.orderArrowGraphics.lineStyle(2, color, 0.4);
        this.orderArrowGraphics.strokeLineShape(
          new Phaser.Geom.Line(from.x, from.y, army.x, army.y)
        );
      }
    }
  }

  // ── Legal targets ─────────────────────────────

  private computeLegalTargets(fromId: string, unitType: 'Army' | 'Fleet') {
    this.legalTargets.clear();
    const moves = getValidMoves(fromId, unitType);
    for (const m of moves) this.legalTargets.add(m);
  }

  private applyLegalHighlights() {
    for (const [, p] of Object.entries(this.provincePolys)) {
      p.setStrokeStyle(2, DiplomacyTheme.coastline, 0.95).setAlpha(0.85);
    }
    if (this.selectedProvinceId) {
      const selP = this.provincePolys[this.selectedProvinceId];
      selP?.setStrokeStyle(4, 0xffffff, 1).setAlpha(1);
    }
    this.legalTargets.forEach((pid) => {
      const p = this.provincePolys[pid];
      if (p) p.setStrokeStyle(4, 0x2ecc71, 1).setAlpha(1);
    });
  }

  private clearLegalHighlights() {
    for (const [, p] of Object.entries(this.provincePolys)) {
      p.setStrokeStyle(2, DiplomacyTheme.coastline, 0.95).setAlpha(0.85);
    }
  }

  // ── Arrows ─────────────────────────────────────

  private centerOf(provinceId: string): { x: number; y: number } {
    const label = this.provinceLabels[provinceId];
    if (label) return { x: label.x, y: label.y };
    const p = this.provinces.find((pr) => pr.id === provinceId);
    if (p) return { x: p.x + p.width / 2, y: p.y + p.height / 2 };
    return { x: 0, y: 0 };
  }

  private drawHoverArrow(fromId: string, toId: string) {
    const from = this.centerOf(fromId);
    const to = this.centerOf(toId);
    this.hoverArrowGraphics.clear();
    this.hoverArrowGraphics.lineStyle(4, 0xffffff, 0.9);
    this.hoverArrowGraphics.strokeLineShape(new Phaser.Geom.Line(from.x, from.y, to.x, to.y));
    const angle = Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y);
    const headLen = 14;
    this.hoverArrowGraphics.lineBetween(
      to.x, to.y,
      to.x - headLen * Math.cos(angle - Math.PI / 6),
      to.y - headLen * Math.sin(angle - Math.PI / 6)
    );
    this.hoverArrowGraphics.lineBetween(
      to.x, to.y,
      to.x - headLen * Math.cos(angle + Math.PI / 6),
      to.y - headLen * Math.sin(angle + Math.PI / 6)
    );
  }

  private clearHoverArrow() {
    this.hoverArrowGraphics.clear();
  }

  // ── Supply center markers ──────────────────────

  private drawSupplyCenterMarkers() {
    for (const province of this.provinces) {
      if (!province.supplyCenter) continue;
      const label = this.provinceLabels[province.id];
      const cx = label ? label.x : province.x + province.width / 2;
      const cy = label ? label.y + 14 : province.y + province.height / 2 + 14;
      const owner = this.gameState.supplyCenters[province.id] as Country | undefined;
      const fill = owner && POWER_COLORS[owner] ? POWER_COLORS[owner]! : 0xf0c040;
      const star = this.add.star(cx, cy, 5, 3, 7, fill, 1).setDepth(DEPTH_SC_MARKER);
      star.setStrokeStyle(1.5, 0x000000, 0.8);
    }
  }

  // ── Tooltip ───────────────────────────────────

  private setupTooltip() {
    let el = document.getElementById('province-tooltip') as HTMLDivElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'province-tooltip';
      document.body.appendChild(el);
    }
    this.tooltipEl = el;
    this.game.canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.tooltipEl || this.tooltipEl.style.display === 'none') return;
      this.tooltipEl.style.left = `${e.clientX + 12}px`;
      this.tooltipEl.style.top = `${e.clientY + 12}px`;
    });
  }

  private showTooltip(province: ProvinceMeta) {
    if (!this.tooltipEl) return;
    const nonPlayableIds = new Set(['SWI', 'IRE', 'SIC', 'COR']);
    const isNonPlayable = nonPlayableIds.has(province.id);
    let typeLabel: string;
    if (isNonPlayable) {
      typeLabel = 'Non-playable';
    } else {
      const prov = PROVINCES[province.id];
      typeLabel = prov ? prov.type.charAt(0).toUpperCase() + prov.type.slice(1) : province.type === 'sea' ? 'Water' : 'Land';
    }
    const details: string[] = [typeLabel];
    if (province.supplyCenter) {
      const owner = this.gameState.supplyCenters[province.id];
      details.push(owner ? `SC: ${owner}` : 'SC: Neutral');
    }
    const unitHere = this.gameState.units.find((u) => u.province === province.id);
    if (unitHere) details.push(`${unitHere.type} (${unitHere.country})`);
    this.tooltipEl.innerHTML =
      `<div class="tooltip-name">${province.name}</div>` +
      `<div class="tooltip-detail">${details.join(' · ')}</div>`;
    this.tooltipEl.style.display = 'block';
  }

  private hideTooltip() {
    if (this.tooltipEl) this.tooltipEl.style.display = 'none';
  }

  // ── My Games button ────────────────────────────

  private createMyGamesButton(): void {
    if (this.myGamesBtn) return;
    const btn = document.createElement('button');
    btn.id = 'my-games-btn';
    btn.textContent = 'My Games';
    btn.onclick = () => {
      this.stopPolling();
      OrdersPanelDOM.destroy();
      ChatPanelDOM.destroy();
      HistoryPanelDOM.destroy();
      this.hideCoastPicker();
      this.hideTooltip();
      SoundManager.destroy();
      this.destroyMyGamesButton();
      this.destroyHistoryButton();
      this.scene.start('MyGames');
    };
    const app = document.getElementById('app') ?? document.body;
    app.appendChild(btn);
    this.myGamesBtn = btn;
  }

  private destroyMyGamesButton(): void {
    this.myGamesBtn?.remove();
    this.myGamesBtn = null;
  }

  // ── History button + replay mode ──────────────

  private createHistoryButton(): void {
    if (this.historyBtn) return;
    const btn = document.createElement('button');
    btn.id = 'history-btn';
    btn.textContent = 'History';
    btn.onclick = () => void this.toggleHistoryMode();
    const app = document.getElementById('app') ?? document.body;
    app.appendChild(btn);
    this.historyBtn = btn;
  }

  private destroyHistoryButton(): void {
    this.historyBtn?.remove();
    this.historyBtn = null;
  }

  private async toggleHistoryMode(): Promise<void> {
    if (this.historyMode) {
      this.exitHistoryMode();
      return;
    }

    OrdersPanelDOM.destroy();
    this.historyMode = true;
    if (this.historyBtn) this.historyBtn.textContent = 'Loading...';

    const opened = await HistoryPanelDOM.open({
      onSnapshotChange: (snapshot) => this.renderSnapshot(snapshot),
      onClose: () => this.exitHistoryMode(),
    });

    if (!opened) {
      this.historyMode = false;
      if (this.historyBtn) this.historyBtn.textContent = 'History';
      this.initOrdersPanel();
      this.updatePanelState();
      return;
    }

    if (this.historyBtn) this.historyBtn.textContent = 'Exit History';
  }

  private exitHistoryMode(): void {
    this.historyMode = false;
    HistoryPanelDOM.destroy();
    if (this.historyBtn) this.historyBtn.textContent = 'History';
    this.reloadScene();
  }

  private renderSnapshot(snapshot: import('../../../shared/types/game').TurnSnapshot): void {
    for (const key of Object.keys(this.unitTokens)) {
      const objs = this.unitTokens[key];
      if (objs) for (const obj of objs) obj.destroy();
    }
    this.unitTokens = {};

    for (const [id, poly] of Object.entries(this.provincePolys)) {
      const province = this.provinces.find((p) => p.id === id);
      if (!province) continue;
      const nonPlayableIds = new Set(['SWI', 'IRE', 'SIC', 'COR']);
      if (nonPlayableIds.has(id)) continue;
      if (province.type === 'sea') continue;

      const scOwner = province.supplyCenter
        ? (snapshot.supplyCenters[id] as Country | undefined)
        : undefined;

      let fill: number;
      if (scOwner && COUNTRY_COLORS[scOwner]) {
        const cc = Phaser.Display.Color.HexStringToColor(COUNTRY_COLORS[scOwner]);
        fill = (cc.red << 16) | (cc.green << 8) | cc.blue;
      } else {
        fill = DiplomacyTheme.landFill;
      }
      poly.setFillStyle(fill, 0.95);
    }

    for (const unit of snapshot.units) {
      const province = this.provinces.find((p) => p.id === unit.province);
      if (!province) continue;

      const labelObj = this.provinceLabels[unit.province];
      const fallbackX = province.x + province.width / 2;
      const fallbackY = province.y + province.height / 2;
      const tokenOffsetY = 22;
      const centerX = labelObj ? labelObj.x : fallbackX;
      const centerY = labelObj ? labelObj.y - tokenOffsetY : fallbackY - tokenOffsetY;

      const color = POWER_COLORS[unit.country] ?? 0xffffff;
      const isArmy = unit.type === 'Army';

      const token = this.add
        .rectangle(centerX, centerY, isArmy ? 28 : 48, isArmy ? 28 : 16, color, 0.95)
        .setStrokeStyle(3, 0x000000, 1)
        .setDepth(DEPTH_UNIT);

      const unitLabel = this.add
        .text(centerX, centerY, isArmy ? 'A' : 'F', {
          fontFamily: 'Arial Black',
          fontSize: '14px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH_UNIT + 1);

      this.unitTokens[unit.province] = [token, unitLabel];
    }
  }

  private initOrdersPanel(): void {
    OrdersPanelDOM.init({
      onClear: () => {
        this.stagedOrders = [];
        this.orderedProvinces.clear();
        OrdersPanelDOM.setOrders(this.stagedOrders);
        this.clearSelection();
        this.redrawOrderArrows();
      },
      onSubmit: (orders) => void this.submitOrders(orders),
      onRefresh: () => void this.refreshGameState(),
      onModeChange: (mode) => this.onModeChange(mode),
      onSubmitRetreats: (retreats) => void this.submitRetreats(retreats),
      onSubmitBuilds: (builds) => void this.submitBuilds(builds),
    });
  }

  // ── Camera controls ────────────────────────────

  private clampCamera() {
    const cam = this.cameras.main;
    const pad = this.CAM_PAD;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const minX = -pad;
    const minY = -pad;
    const maxX = Math.max(minX, this.worldWidth + pad - viewW);
    const maxY = Math.max(minY, this.worldHeight + pad - viewH);
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minX, maxX);
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minY, maxY);
  }

  private setupCameraControls() {
    const cam = this.cameras.main;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragMoved = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.cameraStartX = cam.scrollX;
      this.cameraStartY = cam.scrollY;
    });
    this.input.on('pointerup', () => { this.isDragging = false; });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) return;
      const dx = (pointer.x - this.dragStartX) / cam.zoom;
      const dy = (pointer.y - this.dragStartY) / cam.zoom;
      if (!this.dragMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) this.dragMoved = true;
      cam.scrollX = this.cameraStartX - dx;
      cam.scrollY = this.cameraStartY - dy;
      this.clampCamera();
    });
    this.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _over: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number
    ) => {
      const zoomDelta = -deltaY * 0.001;
      const oldZoom = cam.zoom;
      const newZoom = Phaser.Math.Clamp(oldZoom * (1 + zoomDelta), 0.35, 2.5);
      if (newZoom === oldZoom) return;
      const worldPointBefore = new Phaser.Math.Vector2();
      cam.getWorldPoint(pointer.x, pointer.y, worldPointBefore);
      cam.setZoom(newZoom);
      const worldPointAfter = new Phaser.Math.Vector2();
      cam.getWorldPoint(pointer.x, pointer.y, worldPointAfter);
      cam.scrollX += worldPointBefore.x - worldPointAfter.x;
      cam.scrollY += worldPointBefore.y - worldPointAfter.y;
      this.clampCamera();
    });
  }

  private setupResizeHandler() {
    this.scale.on('resize', () => {
      const cam = this.cameras.main;
      cam.setBounds(
        -this.CAM_PAD,
        -this.CAM_PAD,
        this.worldWidth + this.CAM_PAD * 2,
        this.worldHeight + this.CAM_PAD * 2
      );
      this.clampCamera();
    });
  }

  // ── Server communication ───────────────────────

  private updatePanelState() {
    OrdersPanelDOM.setTurnInfo(this.gameState.turn, this.gameState.phase);
    OrdersPanelDOM.setDeadline(this.gameState.turnDeadline ?? null);
    OrdersPanelDOM.setTurnLog(this.gameState.turnLog);

    if (this.gameState.phase === 'retreats') {
      const myRetreats = this.currentPlayer
        ? this.gameState.dislodged.filter((d) => d.unit.country === this.currentPlayer!.country)
        : [];
      if (myRetreats.length > 0) {
        OrdersPanelDOM.showModeRow(false);
        OrdersPanelDOM.showRetreatUI(myRetreats, (staged) => void this.submitRetreats(staged));
        OrdersPanelDOM.setStatus('Choose where to retreat or disband');
      } else {
        OrdersPanelDOM.showModeRow(false);
        OrdersPanelDOM.setSubmitEnabled(false);
        OrdersPanelDOM.setStatus('Waiting for other players to retreat...');
      }
      return;
    }

    if (this.gameState.phase === 'builds') {
      const myBuilds = this.currentPlayer
        ? this.gameState.builds.filter((b) => b.country === this.currentPlayer!.country)
        : [];
      if (myBuilds.length > 0) {
        OrdersPanelDOM.showModeRow(false);
        OrdersPanelDOM.showBuildUI(myBuilds, (staged) => void this.submitBuilds(staged));
        OrdersPanelDOM.setStatus('Choose units to build or disband');
      } else {
        OrdersPanelDOM.showModeRow(false);
        OrdersPanelDOM.setSubmitEnabled(false);
        OrdersPanelDOM.setStatus('Waiting for other players to build...');
      }
      return;
    }

    OrdersPanelDOM.showModeRow(this.gameState.phase === 'orders');
    const canSubmit =
      this.gameState.phase === 'orders' &&
      this.currentPlayer != null &&
      !this.gameState.ordersSubmitted.includes(this.currentPlayer.country);
    OrdersPanelDOM.setSubmitEnabled(canSubmit);
    OrdersPanelDOM.setSubmitLabel('Submit Orders');

    if (!this.currentPlayer) {
      OrdersPanelDOM.setStatus('Not assigned to a power');
    } else if (this.gameState.phase === 'complete') {
      OrdersPanelDOM.setStatus(this.gameState.winner ? `${this.gameState.winner} wins!` : 'Game Over');
    } else if (this.gameState.phase !== 'orders') {
      OrdersPanelDOM.setStatus(`Phase: ${this.gameState.phase}`);
    } else if (this.gameState.ordersSubmitted.includes(this.currentPlayer.country)) {
      const remaining = this.gameState.players.length - this.gameState.ordersSubmitted.length;
      OrdersPanelDOM.setStatus(remaining > 0 ? `Orders submitted. Waiting for ${remaining} player(s).` : 'All orders in. Resolving...');
    } else {
      OrdersPanelDOM.setStatus(`Playing as ${this.currentPlayer.country}`);
    }
  }

  private async submitOrders(staged: StagedOrder[]): Promise<void> {
    if (!this.currentPlayer) { OrdersPanelDOM.setStatus('Not assigned to a power'); return; }
    if (this.gameState.ordersSubmitted.includes(this.currentPlayer.country)) { OrdersPanelDOM.setStatus('Orders already submitted this turn'); return; }

    OrdersPanelDOM.setStatus('Submitting orders...');
    OrdersPanelDOM.setSubmitEnabled(false);

    const myUnits = this.gameState.units.filter((u) => u.country === this.currentPlayer!.country);
    const orders: Order[] = [];
    const orderedFroms = new Set(staged.map((s) => s.from));

    for (const s of staged) {
      const unit = myUnits.find((u) => u.province === s.from);
      if (!unit) continue;
      switch (s.orderType) {
        case 'move': {
          const move: MoveOrder = { type: 'move', country: this.currentPlayer.country, unitType: unit.type, province: s.from, destination: s.to! };
          if (s.coast) move.coast = s.coast;
          orders.push(move);
          break;
        }
        case 'hold': {
          const hold: HoldOrder = { type: 'hold', country: this.currentPlayer.country, unitType: unit.type, province: s.from };
          orders.push(hold);
          break;
        }
        case 'support-hold': {
          const sup: SupportOrder = { type: 'support', country: this.currentPlayer.country, unitType: unit.type, province: s.from, supportedProvince: s.supportedProvince! };
          orders.push(sup);
          break;
        }
        case 'support-move': {
          const sup: SupportOrder = { type: 'support', country: this.currentPlayer.country, unitType: unit.type, province: s.from, supportedProvince: s.supportedProvince!, supportedDestination: s.supportedDestination! };
          orders.push(sup);
          break;
        }
        case 'convoy': {
          const conv: ConvoyOrder = { type: 'convoy', country: this.currentPlayer.country, unitType: unit.type, province: s.from, convoyedProvince: s.convoyedProvince!, convoyedDestination: s.convoyedDestination! };
          orders.push(conv);
          break;
        }
      }
    }

    for (const unit of myUnits) {
      if (orderedFroms.has(unit.province)) continue;
      orders.push({ type: 'hold', country: this.currentPlayer.country, unitType: unit.type, province: unit.province } as HoldOrder);
    }

    try {
      const res = await fetch('/api/game/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orders }) });
      if (!res.ok) { const err = (await res.json()) as ErrorResponse; OrdersPanelDOM.setStatus(`Error: ${err.message}`); OrdersPanelDOM.setSubmitEnabled(true); return; }
      const data = (await res.json()) as SubmitOrdersResponse;
      OrdersPanelDOM.setStatus(data.message);
      SoundManager.play('submit');
      if (data.gameState.phase === 'complete') {
        this.gameState = data.gameState;
        this.stopPolling();
        OrdersPanelDOM.destroy();
        ChatPanelDOM.destroy();
        HistoryPanelDOM.destroy();
        this.hideCoastPicker();
        this.destroyMyGamesButton();
        this.destroyHistoryButton();
        SoundManager.destroy();
        if (this.tooltipEl) { this.tooltipEl.remove(); this.tooltipEl = null; }
        this.scene.start('GameOver', { gameState: data.gameState });
        return;
      }
      const prevUnits = [...this.gameState.units];
      this.gameState = data.gameState;
      this.stagedOrders = [];
      this.orderedProvinces.clear();
      this.reloadScene(prevUnits);
    } catch {
      OrdersPanelDOM.setStatus('Network error. Try again.');
      OrdersPanelDOM.setSubmitEnabled(true);
    }
  }

  private async submitRetreats(staged: StagedRetreat[]): Promise<void> {
    OrdersPanelDOM.setStatus('Submitting retreats...');
    OrdersPanelDOM.setSubmitEnabled(false);
    const retreats = staged.map((s) => ({ type: (s.destination ? 'retreat' : 'disband') as 'retreat' | 'disband', country: this.currentPlayer!.country, unitType: 'Army' as const, province: s.from, destination: s.destination ?? undefined }));
    try {
      const res = await fetch('/api/game/retreats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ retreats }) });
      if (!res.ok) { const err = (await res.json()) as ErrorResponse; OrdersPanelDOM.setStatus(`Error: ${err.message}`); OrdersPanelDOM.setSubmitEnabled(true); return; }
      const data = (await res.json()) as SubmitRetreatsResponse;
      this.gameState = data.gameState;
      this.reloadScene();
    } catch { OrdersPanelDOM.setStatus('Network error. Try again.'); OrdersPanelDOM.setSubmitEnabled(true); }
  }

  private async submitBuilds(staged: StagedBuild[]): Promise<void> {
    OrdersPanelDOM.setStatus('Submitting builds...');
    OrdersPanelDOM.setSubmitEnabled(false);
    const builds = staged.map((s) => ({ type: s.type, country: this.currentPlayer!.country, unitType: s.unitType, province: s.province }));
    try {
      const res = await fetch('/api/game/builds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ builds }) });
      if (!res.ok) { const err = (await res.json()) as ErrorResponse; OrdersPanelDOM.setStatus(`Error: ${err.message}`); OrdersPanelDOM.setSubmitEnabled(true); return; }
      const data = (await res.json()) as SubmitBuildsResponse;
      this.gameState = data.gameState;
      this.reloadScene();
    } catch { OrdersPanelDOM.setStatus('Network error. Try again.'); OrdersPanelDOM.setSubmitEnabled(true); }
  }

  private async refreshGameState(): Promise<void> {
    OrdersPanelDOM.setStatus('Refreshing...');
    try {
      const res = await fetch('/api/game/state');
      if (!res.ok) { OrdersPanelDOM.setStatus('Failed to refresh'); return; }
      const state = (await res.json()) as GameState;
      const prevUnits = [...this.gameState.units];
      this.gameState = state;
      this.reloadScene(prevUnits);
    } catch { OrdersPanelDOM.setStatus('Network error'); }
  }

  // ── Chat ──────────────────────────────────────

  private async sendChat(text: string, channel?: string): Promise<void> {
    try {
      await fetch('/api/game/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, channel: channel ?? 'global' }),
      });
    } catch { /* ignore */ }
  }

  private getChatChannels(): string[] {
    const channels = ['global'];
    if (this.currentPlayer) {
      for (const c of ALL_COUNTRIES) {
        if (c === this.currentPlayer.country) continue;
        channels.push([this.currentPlayer.country, c].sort().join(':'));
      }
    }
    return channels;
  }

  private async pollChat(): Promise<void> {
    try {
      const res = await fetch('/api/game/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', after: this.lastChatTimestamp, channels: this.getChatChannels() }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      const newMsgs = data.messages.filter((m) => m.timestamp > this.lastChatTimestamp);
      if (newMsgs.length > 0) {
        this.chatMessages.push(...newMsgs);
        this.lastChatTimestamp = Math.max(...newMsgs.map((m) => m.timestamp));
        for (const msg of newMsgs) {
          ChatPanelDOM.addMessage(msg);
          SoundManager.play('chat');
        }
      }
    } catch { /* ignore */ }
  }

  // ── Polling ───────────────────────────────────

  private startPollingIfNeeded() {
    this.stopPolling();
    if (!this.currentPlayer) return;

    const shouldPoll =
      (this.gameState.phase === 'orders' && this.gameState.ordersSubmitted.includes(this.currentPlayer.country)) ||
      (this.gameState.phase === 'retreats' && !this.gameState.dislodged.some((d) => d.unit.country === this.currentPlayer!.country)) ||
      (this.gameState.phase === 'builds' && !this.gameState.builds.some((b) => b.country === this.currentPlayer!.country)) ||
      this.gameState.phase === 'waiting' ||
      this.gameState.phase === 'diplomacy';

    if (shouldPoll) {
      this.pollTimer = setInterval(() => { void this.pollState(); void this.pollChat(); }, POLL_INTERVAL_MS);
    } else {
      this.pollTimer = setInterval(() => void this.pollChat(), POLL_INTERVAL_MS);
    }
  }

  private stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  private async pollState(): Promise<void> {
    try {
      const res = await fetch('/api/game/state');
      if (!res.ok) return;
      const state = (await res.json()) as GameState;
      const changed =
        state.phase !== this.gameState.phase ||
        state.turn.year !== this.gameState.turn.year ||
        state.turn.season !== this.gameState.turn.season ||
        state.ordersSubmitted.length !== this.gameState.ordersSubmitted.length ||
        state.units.length !== this.gameState.units.length;
      if (changed) {
        if (state.phase !== this.gameState.phase) SoundManager.play('phase');
        if (state.phase === 'complete') {
          this.gameState = state;
          this.stopPolling();
          OrdersPanelDOM.destroy();
          ChatPanelDOM.destroy();
          HistoryPanelDOM.destroy();
          this.hideCoastPicker();
          this.destroyMyGamesButton();
          this.destroyHistoryButton();
          SoundManager.destroy();
          if (this.tooltipEl) { this.tooltipEl.remove(); this.tooltipEl = null; }
          this.scene.start('GameOver', { gameState: state });
          return;
        }
        const prevUnits = [...this.gameState.units];
        this.gameState = state;
        this.reloadScene(prevUnits);
      }
    } catch { /* ignore */ }
  }

  // ── Scene lifecycle ───────────────────────────

  private reloadScene(previousUnits?: Unit[]) {
    this.stopPolling();
    OrdersPanelDOM.destroy();
    ChatPanelDOM.destroy();
    HistoryPanelDOM.destroy();
    this.hideCoastPicker();
    this.destroyMyGamesButton();
    this.destroyHistoryButton();
    if (this.tooltipEl) { this.tooltipEl.remove(); this.tooltipEl = null; }
    this.scene.restart({ gameState: this.gameState, currentPlayer: this.currentPlayer, previousUnits });
  }

  shutdown(): void {
    this.stopPolling();
    OrdersPanelDOM.destroy();
    ChatPanelDOM.destroy();
    HistoryPanelDOM.destroy();
    this.hideCoastPicker();
    this.destroyMyGamesButton();
    this.destroyHistoryButton();
    if (this.tooltipEl) { this.tooltipEl.remove(); this.tooltipEl = null; }
  }
}
