import * as Phaser from 'phaser';
import type { GameState, Country, Unit } from '../../../shared/types/game';
import { COUNTRY_NAMES } from '../../../shared/types/game';
import { PROVINCES } from '../../../shared/data/provinces';
import { getValidMoves } from '../../../shared/data/adjacencies';
import type { Order, OrderType } from '../../../shared/types/orders';
import { formatOrder } from '../../../shared/types/orders';

type OrderMode = 'none' | 'selectUnit' | 'selectOrderType' | 'selectTarget' | 'selectSupportTarget';

export class OrderPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private panelWidth: number;
  private panelHeight: number;
  private country: Country;
  private isMobile: boolean;
  private isExpanded = false;
  private collapsedY = 0;
  private expandedY = 0;

  private orders: Order[] = [];
  private mode: OrderMode = 'selectUnit';
  private selectedUnit: Unit | null = null;
  private supportedProvince: string | null = null;

  private instructionText!: Phaser.GameObjects.Text;
  private orderListTexts: Phaser.GameObjects.Text[] = [];
  private actionButtons: Phaser.GameObjects.Container[] = [];

  private onOrdersChange: ((orders: Order[]) => void) | null = null;
  private onSubmit: ((orders: Order[]) => void) | null = null;
  private onProvinceHighlight: ((provinces: string[]) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    px: number,
    py: number,
    width: number,
    height: number,
    country: Country,
    mobile = false
  ) {
    this.scene = scene;
    this.panelWidth = width;
    this.panelHeight = height;
    this.country = country;
    this.isMobile = mobile;
    this.container = scene.add.container(px, py);
    this.container.setDepth(50);

    if (mobile) {
      // Mobile: bottom sheet starts collapsed
      this.collapsedY = py;
      this.expandedY = py - height + 50; // Expand upward
      this.container.setPosition(px, this.collapsedY);
    }

    this.createPanel();
  }

  setHandlers(handlers: {
    onOrdersChange?: (orders: Order[]) => void;
    onSubmit?: (orders: Order[]) => void;
    onProvinceHighlight?: (provinces: string[]) => void;
  }): void {
    this.onOrdersChange = handlers.onOrdersChange ?? null;
    this.onSubmit = handlers.onSubmit ?? null;
    this.onProvinceHighlight = handlers.onProvinceHighlight ?? null;
  }

  private createPanel(): void {
    // Background
    const bg = this.scene.add.rectangle(
      this.panelWidth / 2,
      this.panelHeight / 2,
      this.panelWidth,
      this.panelHeight,
      0x111122,
      0.92
    );
    bg.setStrokeStyle(1, 0x334455);
    this.container.add(bg);

    if (this.isMobile) {
      // Mobile: collapsible header bar
      const headerBg = this.scene.add.rectangle(
        this.panelWidth / 2, 25, this.panelWidth, 50, 0x1a2233, 1
      );
      headerBg.setStrokeStyle(1, 0xe6c200);
      headerBg.setInteractive({ useHandCursor: true });
      this.container.add(headerBg);

      const headerText = this.scene.add
        .text(this.panelWidth / 2, 25, `ORDERS — ${COUNTRY_NAMES[this.country]} ▲`, {
          fontFamily: 'Georgia, serif',
          fontSize: '13px',
          color: '#e6c200',
          letterSpacing: 2,
        })
        .setOrigin(0.5);
      this.container.add(headerText);

      headerBg.on('pointerdown', () => {
        this.isExpanded = !this.isExpanded;
        headerText.setText(`ORDERS — ${COUNTRY_NAMES[this.country]} ${this.isExpanded ? '▼' : '▲'}`);
        this.scene.tweens.add({
          targets: this.container,
          y: this.isExpanded ? this.expandedY : this.collapsedY,
          duration: 200,
          ease: 'Power2',
        });
      });

      // Instructions (below header)
      this.instructionText = this.scene.add
        .text(this.panelWidth / 2, 65, 'Tap a unit on the map', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#aabbcc',
          wordWrap: { width: this.panelWidth - 20 },
          align: 'center',
        })
        .setOrigin(0.5, 0);
      this.container.add(this.instructionText);
    } else {
      // Desktop layout
      const title = this.scene.add
        .text(this.panelWidth / 2, 12, 'ORDERS', {
          fontFamily: 'Georgia, serif',
          fontSize: '16px',
          color: '#e6c200',
          letterSpacing: 3,
        })
        .setOrigin(0.5, 0);
      this.container.add(title);

      const countryLabel = this.scene.add
        .text(this.panelWidth / 2, 32, COUNTRY_NAMES[this.country], {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#8899aa',
        })
        .setOrigin(0.5, 0);
      this.container.add(countryLabel);

      this.instructionText = this.scene.add
        .text(this.panelWidth / 2, 54, 'Click a unit on the map to give orders', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#aabbcc',
          wordWrap: { width: this.panelWidth - 20 },
          align: 'center',
        })
        .setOrigin(0.5, 0);
      this.container.add(this.instructionText);
    }

    // Submit button at bottom
    this.createSubmitButton();
  }

  private createSubmitButton(): void {
    const btnY = this.panelHeight - 35;
    const bg = this.scene.add.rectangle(this.panelWidth / 2, btnY, this.panelWidth - 20, 30, 0x2c3e50);
    bg.setStrokeStyle(1, 0xe6c200);
    bg.setInteractive({ useHandCursor: true });

    const text = this.scene.add
      .text(this.panelWidth / 2, btnY, 'SUBMIT ORDERS', {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#e6c200',
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x34495e));
    bg.on('pointerout', () => bg.setFillStyle(0x2c3e50));
    bg.on('pointerdown', () => {
      this.onSubmit?.(this.orders);
    });

    this.container.add([bg, text]);
  }

  handleProvinceClick(provinceId: string, gameState: GameState): void {
    switch (this.mode) {
      case 'selectUnit':
        this.trySelectUnit(provinceId, gameState);
        break;
      case 'selectTarget':
        this.selectMoveTarget(provinceId);
        break;
      case 'selectSupportTarget':
        this.selectSupportTarget(provinceId);
        break;
      default:
        this.trySelectUnit(provinceId, gameState);
        break;
    }
  }

  private trySelectUnit(provinceId: string, gameState: GameState): void {
    const unit = gameState.units.find(
      (u) => u.province === provinceId && u.country === this.country
    );
    if (!unit) return;

    this.selectedUnit = unit;
    this.mode = 'selectOrderType';
    this.instructionText.setText(`${unit.type} ${PROVINCES[provinceId]?.name ?? provinceId}\nChoose order type:`);
    this.showOrderTypeButtons(unit);
  }

  private showOrderTypeButtons(unit: Unit): void {
    this.clearActionButtons();

    const types: OrderType[] = ['hold', 'move', 'support'];
    if (unit.type === 'Fleet' && PROVINCES[unit.province]?.type === 'water') {
      types.push('convoy');
    }

    types.forEach((type, i) => {
      const btnY = 90 + i * 32;
      const bg = this.scene.add.rectangle(this.panelWidth / 2, btnY, this.panelWidth - 30, 26, 0x1a2a3a);
      bg.setStrokeStyle(1, 0x334455);
      bg.setInteractive({ useHandCursor: true });

      const text = this.scene.add
        .text(this.panelWidth / 2, btnY, type.toUpperCase(), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#ccddee',
        })
        .setOrigin(0.5);

      bg.on('pointerover', () => bg.setStrokeStyle(1, 0xe6c200));
      bg.on('pointerout', () => bg.setStrokeStyle(1, 0x334455));
      bg.on('pointerdown', () => this.selectOrderType(type));

      const btnContainer = this.scene.add.container(0, 0, [bg, text]);
      this.container.add(btnContainer);
      this.actionButtons.push(btnContainer);
    });
  }

  private selectOrderType(type: OrderType): void {
    if (!this.selectedUnit) return;
    this.clearActionButtons();

    if (type === 'hold') {
      this.addOrder({
        type: 'hold',
        country: this.country,
        unitType: this.selectedUnit.type,
        province: this.selectedUnit.province,
      });
      this.resetMode();
      return;
    }

    if (type === 'move') {
      const validMoves = getValidMoves(
        this.selectedUnit.province,
        this.selectedUnit.type,
        this.selectedUnit.coast
      );
      this.instructionText.setText('Click destination on map');
      this.onProvinceHighlight?.(validMoves);
      this.mode = 'selectTarget';
      return;
    }

    if (type === 'support') {
      this.instructionText.setText('Click the unit to support');
      this.mode = 'selectSupportTarget';
      this.supportedProvince = null;
      return;
    }
  }

  private selectMoveTarget(provinceId: string): void {
    if (!this.selectedUnit) return;

    const validMoves = getValidMoves(
      this.selectedUnit.province,
      this.selectedUnit.type,
      this.selectedUnit.coast
    );

    if (!validMoves.includes(provinceId)) {
      this.instructionText.setText('Invalid destination. Try again.');
      return;
    }

    this.addOrder({
      type: 'move',
      country: this.country,
      unitType: this.selectedUnit.type,
      province: this.selectedUnit.province,
      destination: provinceId,
    });
    this.onProvinceHighlight?.([]);
    this.resetMode();
  }

  private selectSupportTarget(provinceId: string): void {
    if (!this.selectedUnit) return;

    if (!this.supportedProvince) {
      this.supportedProvince = provinceId;
      this.instructionText.setText(
        `Supporting ${provinceId}.\nClick destination (or same province to support hold)`
      );
      return;
    }

    // Supporting a hold (clicked same province) or a move (clicked different)
    if (provinceId === this.supportedProvince) {
      this.addOrder({
        type: 'support',
        country: this.country,
        unitType: this.selectedUnit.type,
        province: this.selectedUnit.province,
        supportedProvince: this.supportedProvince,
      });
    } else {
      this.addOrder({
        type: 'support',
        country: this.country,
        unitType: this.selectedUnit.type,
        province: this.selectedUnit.province,
        supportedProvince: this.supportedProvince,
        supportedDestination: provinceId,
      });
    }

    this.resetMode();
  }

  private addOrder(order: Order): void {
    // Replace any existing order for this unit
    this.orders = this.orders.filter((o) => o.province !== order.province);
    this.orders.push(order);
    this.onOrdersChange?.(this.orders);
    this.refreshOrderList();
  }

  private resetMode(): void {
    this.mode = 'selectUnit';
    this.selectedUnit = null;
    // Reset order type selection
    this.supportedProvince = null;
    this.clearActionButtons();
    this.instructionText.setText('Click a unit on the map to give orders');
    this.refreshOrderList();
  }

  private refreshOrderList(): void {
    for (const t of this.orderListTexts) t.destroy();
    this.orderListTexts = [];

    // Place order list below instruction text area, avoid overlap with action buttons
    const startY = this.panelHeight - 80 - this.orders.length * 18;
    this.orders.forEach((order, i) => {
      const y = Math.max(75, startY + i * 18);
      const text = this.scene.add
        .text(10, y, formatOrder(order), {
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          color: '#88ccaa',
          wordWrap: { width: this.panelWidth - 20 },
        });
      this.container.add(text);
      this.orderListTexts.push(text);
    });
  }

  private clearActionButtons(): void {
    for (const btn of this.actionButtons) btn.destroy();
    this.actionButtons = [];
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  destroy(): void {
    this.container.destroy();
  }
}
