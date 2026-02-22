import type { GamePhase, Turn, RetreatOption, BuildOption } from '../../../shared/types/game';

export type OrderMode = 'move' | 'hold' | 'support-hold' | 'support-move' | 'convoy';

export interface StagedOrder {
  orderType: OrderMode;
  unitType: 'Army' | 'Fleet';
  from: string;
  to?: string;
  coast?: 'NC' | 'SC' | 'EC';
  supportedProvince?: string;
  supportedDestination?: string;
  convoyedProvince?: string;
  convoyedDestination?: string;
}

export interface StagedRetreat {
  from: string;
  destination: string | null; // null = disband
}

export interface StagedBuild {
  type: 'build' | 'disband' | 'waive';
  province?: string | undefined;
  unitType?: 'Army' | 'Fleet' | undefined;
}

export interface OrdersPanelCallbacks {
  onClear: () => void;
  onSubmit: (orders: StagedOrder[]) => void;
  onRefresh: () => void;
  onModeChange: (mode: OrderMode) => void;
  onSubmitRetreats: (retreats: StagedRetreat[]) => void;
  onSubmitBuilds: (builds: StagedBuild[]) => void;
}

class OrdersPanelImpl {
  private container: HTMLElement | null = null;
  private listEl: HTMLElement | null = null;
  private statusEl: HTMLElement | null = null;
  private turnEl: HTMLElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private modeRow: HTMLElement | null = null;
  private logSection: HTMLElement | null = null;
  private callbacks: OrdersPanelCallbacks | null = null;
  private orders: StagedOrder[] = [];
  private currentMode: OrderMode = 'move';
  private showingLog = false;

  init(opts: OrdersPanelCallbacks) {
    this.callbacks = opts;
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'orders-panel';

    this.turnEl = document.createElement('div');
    this.turnEl.className = 'orders-turn';

    const title = document.createElement('div');
    title.className = 'orders-title';
    title.textContent = 'Orders';

    this.modeRow = document.createElement('div');
    this.modeRow.className = 'orders-mode-row';
    this.buildModeButtons();

    this.listEl = document.createElement('div');
    this.listEl.className = 'orders-list';

    this.logSection = document.createElement('div');
    this.logSection.className = 'orders-log';
    this.logSection.style.display = 'none';

    const controls = document.createElement('div');
    controls.className = 'orders-controls';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'orders-btn';
    clearBtn.textContent = 'Clear All';
    clearBtn.onclick = () => this.callbacks?.onClear();

    this.submitBtn = document.createElement('button');
    this.submitBtn.className = 'orders-btn orders-submit';
    this.submitBtn.textContent = 'Submit Orders';
    this.submitBtn.onclick = () => this.callbacks?.onSubmit(this.orders);

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'orders-btn';
    refreshBtn.textContent = 'Refresh';
    refreshBtn.onclick = () => this.callbacks?.onRefresh();

    const logBtn = document.createElement('button');
    logBtn.className = 'orders-btn';
    logBtn.textContent = 'Turn Log';
    logBtn.onclick = () => this.toggleLog();

    this.statusEl = document.createElement('div');
    this.statusEl.className = 'orders-status';

    this.container.appendChild(this.turnEl);
    this.container.appendChild(title);
    this.container.appendChild(this.modeRow);
    this.container.appendChild(this.listEl);
    this.container.appendChild(this.logSection);
    controls.appendChild(clearBtn);
    controls.appendChild(this.submitBtn);
    controls.appendChild(refreshBtn);
    controls.appendChild(logBtn);
    this.container.appendChild(controls);
    this.container.appendChild(this.statusEl);

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.container);
  }

  private buildModeButtons() {
    if (!this.modeRow) return;
    this.modeRow.innerHTML = '';
    const modes: { mode: OrderMode; label: string }[] = [
      { mode: 'move', label: 'Move' },
      { mode: 'hold', label: 'Hold' },
      { mode: 'support-hold', label: 'S Hold' },
      { mode: 'support-move', label: 'S Move' },
      { mode: 'convoy', label: 'Convoy' },
    ];
    for (const { mode, label } of modes) {
      const btn = document.createElement('button');
      btn.className = `orders-mode-btn${mode === this.currentMode ? ' active' : ''}`;
      btn.textContent = label;
      btn.onclick = () => {
        this.currentMode = mode;
        this.buildModeButtons();
        this.callbacks?.onModeChange(mode);
      };
      this.modeRow.appendChild(btn);
    }
  }

  getMode(): OrderMode {
    return this.currentMode;
  }

  setOrders(orders: StagedOrder[]) {
    this.orders = orders;
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    if (orders.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'orders-empty';
      empty.textContent = 'No orders yet';
      this.listEl.appendChild(empty);
      return;
    }
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i]!;
      const row = document.createElement('div');
      row.className = 'orders-row';
      row.textContent = formatStagedOrder(o);

      const removeBtn = document.createElement('span');
      removeBtn.className = 'orders-row-remove';
      removeBtn.textContent = '×';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        this.orders.splice(i, 1);
        this.setOrders([...this.orders]);
      };
      row.appendChild(removeBtn);

      this.listEl.appendChild(row);
    }
  }

  setTurnInfo(turn: Turn, phase: GamePhase) {
    if (this.turnEl) {
      this.turnEl.textContent = `${turn.season} ${turn.year} — ${phaseLabel(phase)}`;
    }
  }

  setSubmitEnabled(enabled: boolean) {
    if (this.submitBtn) {
      this.submitBtn.disabled = !enabled;
      this.submitBtn.style.opacity = enabled ? '1' : '0.4';
      this.submitBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
  }

  setSubmitLabel(label: string) {
    if (this.submitBtn) this.submitBtn.textContent = label;
  }

  setStatus(text: string) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  showModeRow(visible: boolean) {
    if (this.modeRow) this.modeRow.style.display = visible ? 'flex' : 'none';
  }

  setTurnLog(log: string[]) {
    if (!this.logSection) return;
    this.logSection.innerHTML = '';
    if (log.length === 0) {
      this.logSection.innerHTML = '<div class="orders-empty">No log entries</div>';
      return;
    }
    const recent = log.slice(-30);
    for (const entry of recent) {
      const row = document.createElement('div');
      row.className = 'orders-log-entry';
      if (entry.startsWith('===')) {
        row.className += ' orders-log-header';
      } else if (entry.includes('succeeds')) {
        row.className += ' orders-log-success';
      } else if (entry.includes('fails') || entry.includes('dislodged')) {
        row.className += ' orders-log-fail';
      }
      row.textContent = entry;
      this.logSection.appendChild(row);
    }
    this.logSection.scrollTop = this.logSection.scrollHeight;
  }

  private toggleLog() {
    this.showingLog = !this.showingLog;
    if (this.logSection) {
      this.logSection.style.display = this.showingLog ? 'block' : 'none';
    }
    if (this.listEl) {
      this.listEl.style.display = this.showingLog ? 'none' : 'block';
    }
  }

  showRetreatUI(retreats: RetreatOption[], onSubmit: (staged: StagedRetreat[]) => void) {
    if (!this.listEl || !this.submitBtn) return;
    this.showModeRow(false);
    this.listEl.innerHTML = '';

    const staged: StagedRetreat[] = [];

    for (const opt of retreats) {
      const row = document.createElement('div');
      row.className = 'orders-row retreat-row';
      row.innerHTML = `<strong>${opt.unit.type[0]} ${opt.from}</strong> dislodged`;

      const select = document.createElement('select');
      select.className = 'orders-select';
      const disbandOpt = document.createElement('option');
      disbandOpt.value = '';
      disbandOpt.textContent = 'Disband';
      select.appendChild(disbandOpt);
      for (const dest of opt.validDestinations) {
        const destOpt = document.createElement('option');
        destOpt.value = dest;
        destOpt.textContent = `→ ${dest}`;
        select.appendChild(destOpt);
      }
      select.onchange = () => {
        const existing = staged.findIndex((s) => s.from === opt.from);
        const entry: StagedRetreat = {
          from: opt.from,
          destination: select.value || null,
        };
        if (existing >= 0) staged[existing] = entry;
        else staged.push(entry);
      };
      staged.push({ from: opt.from, destination: null });

      row.appendChild(select);
      this.listEl.appendChild(row);
    }

    this.submitBtn.textContent = 'Submit Retreats';
    this.submitBtn.onclick = () => onSubmit(staged);
    this.setSubmitEnabled(true);
  }

  showBuildUI(builds: BuildOption[], onSubmit: (staged: StagedBuild[]) => void) {
    if (!this.listEl || !this.submitBtn) return;
    this.showModeRow(false);
    this.listEl.innerHTML = '';

    const staged: StagedBuild[] = [];

    for (const opt of builds) {
      const header = document.createElement('div');
      header.className = 'orders-row';
      header.innerHTML = opt.delta > 0
        ? `<strong>${opt.country}</strong>: Build ${opt.delta} unit(s)`
        : `<strong>${opt.country}</strong>: Disband ${Math.abs(opt.delta)} unit(s)`;
      this.listEl.appendChild(header);

      if (opt.delta > 0) {
        for (let i = 0; i < opt.delta && i < opt.validProvinces.length; i++) {
          const row = document.createElement('div');
          row.className = 'orders-row';

          const provSelect = document.createElement('select');
          provSelect.className = 'orders-select';
          const waiveOpt = document.createElement('option');
          waiveOpt.value = '';
          waiveOpt.textContent = 'Waive';
          provSelect.appendChild(waiveOpt);
          for (const prov of opt.validProvinces) {
            const o = document.createElement('option');
            o.value = prov;
            o.textContent = prov;
            provSelect.appendChild(o);
          }

          const typeSelect = document.createElement('select');
          typeSelect.className = 'orders-select';
          for (const t of ['Army', 'Fleet']) {
            const o = document.createElement('option');
            o.value = t;
            o.textContent = t;
            typeSelect.appendChild(o);
          }

          const idx = staged.length;
          staged.push({ type: 'waive', province: undefined, unitType: undefined });
          const update = () => {
            if (!provSelect.value) {
              staged[idx] = { type: 'waive' };
            } else {
              staged[idx] = {
                type: 'build',
                province: provSelect.value,
                unitType: typeSelect.value as 'Army' | 'Fleet',
              };
            }
          };
          provSelect.onchange = update;
          typeSelect.onchange = update;

          row.appendChild(provSelect);
          row.appendChild(typeSelect);
          this.listEl.appendChild(row);
        }
      } else {
        for (let i = 0; i < Math.abs(opt.delta) && i < opt.validProvinces.length; i++) {
          const row = document.createElement('div');
          row.className = 'orders-row';

          const provSelect = document.createElement('select');
          provSelect.className = 'orders-select';
          for (const prov of opt.validProvinces) {
            const o = document.createElement('option');
            o.value = prov;
            o.textContent = `Disband ${prov}`;
            provSelect.appendChild(o);
          }

          const idx = staged.length;
          staged.push({
            type: 'disband',
            province: opt.validProvinces[0],
          });
          provSelect.onchange = () => {
            staged[idx] = { type: 'disband', province: provSelect.value };
          };

          row.appendChild(provSelect);
          this.listEl.appendChild(row);
        }
      }
    }

    this.submitBtn.textContent = 'Submit Builds';
    this.submitBtn.onclick = () => onSubmit(staged);
    this.setSubmitEnabled(true);
  }

  destroy() {
    this.container?.remove();
    this.container = null;
    this.listEl = null;
    this.statusEl = null;
    this.turnEl = null;
    this.submitBtn = null;
    this.modeRow = null;
    this.logSection = null;
    this.showingLog = false;
    this.currentMode = 'move';
  }
}

function phaseLabel(phase: GamePhase): string {
  switch (phase) {
    case 'waiting': return 'Waiting';
    case 'diplomacy': return 'Diplomacy';
    case 'orders': return 'Orders Phase';
    case 'retreats': return 'Retreats';
    case 'builds': return 'Builds';
    case 'complete': return 'Game Over';
  }
}

function formatStagedOrder(o: StagedOrder): string {
  const prefix = `${o.unitType[0]} ${o.from}`;
  const coastSuffix = o.coast ? ` (${o.coast})` : '';
  switch (o.orderType) {
    case 'move': return `${prefix} → ${o.to}${coastSuffix}`;
    case 'hold': return `${prefix} Hold`;
    case 'support-hold': return `${prefix} S ${o.supportedProvince} (hold)`;
    case 'support-move': return `${prefix} S ${o.supportedProvince} → ${o.supportedDestination}`;
    case 'convoy': return `${prefix} C ${o.convoyedProvince} → ${o.convoyedDestination}`;
  }
}

export const OrdersPanelDOM = new OrdersPanelImpl();
