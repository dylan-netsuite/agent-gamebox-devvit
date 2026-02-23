import type { TurnSnapshot } from '../../../shared/types/game';
import type { HistoryResponse } from '../../../shared/types/api';

export interface HistoryPanelCallbacks {
  onSnapshotChange: (snapshot: TurnSnapshot) => void;
  onClose: () => void;
}

class HistoryPanelImpl {
  private container: HTMLElement | null = null;
  private labelEl: HTMLElement | null = null;
  private slider: HTMLInputElement | null = null;
  private logSection: HTMLElement | null = null;
  private callbacks: HistoryPanelCallbacks | null = null;
  private snapshots: TurnSnapshot[] = [];
  private currentIndex = 0;

  async open(callbacks: HistoryPanelCallbacks): Promise<boolean> {
    this.callbacks = callbacks;

    try {
      const res = await fetch('/api/game/history');
      if (!res.ok) return false;
      const data = (await res.json()) as HistoryResponse;
      if (!data.snapshots || data.snapshots.length === 0) return false;
      this.snapshots = data.snapshots;
    } catch {
      return false;
    }

    this.currentIndex = this.snapshots.length - 1;
    this.buildDOM();
    this.updateDisplay();
    this.callbacks.onSnapshotChange(this.snapshots[this.currentIndex]!);
    return true;
  }

  private buildDOM() {
    this.destroy();

    this.container = document.createElement('div');
    this.container.id = 'history-panel';

    const header = document.createElement('div');
    header.className = 'history-header';

    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = 'Game History';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'history-close-btn';
    closeBtn.textContent = '\u00d7';
    closeBtn.onclick = () => this.callbacks?.onClose();

    header.appendChild(title);
    header.appendChild(closeBtn);

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'history-turn-label';

    const controls = document.createElement('div');
    controls.className = 'history-controls';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'history-nav-btn';
    prevBtn.textContent = '\u25c0';
    prevBtn.onclick = () => this.step(-1);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'history-nav-btn';
    nextBtn.textContent = '\u25b6';
    nextBtn.onclick = () => this.step(1);

    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.className = 'history-slider';
    this.slider.min = '0';
    this.slider.max = String(Math.max(0, this.snapshots.length - 1));
    this.slider.value = String(this.currentIndex);
    this.slider.oninput = () => {
      this.currentIndex = parseInt(this.slider!.value, 10);
      this.updateDisplay();
      this.callbacks?.onSnapshotChange(this.snapshots[this.currentIndex]!);
    };

    controls.appendChild(prevBtn);
    controls.appendChild(this.slider);
    controls.appendChild(nextBtn);

    const liveBtn = document.createElement('button');
    liveBtn.className = 'history-live-btn';
    liveBtn.textContent = 'Return to Live';
    liveBtn.onclick = () => this.callbacks?.onClose();

    this.logSection = document.createElement('div');
    this.logSection.className = 'history-log';

    this.container.appendChild(header);
    this.container.appendChild(this.labelEl);
    this.container.appendChild(controls);
    this.container.appendChild(this.logSection);
    this.container.appendChild(liveBtn);

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.container);
  }

  private step(delta: number) {
    const newIndex = this.currentIndex + delta;
    if (newIndex < 0 || newIndex >= this.snapshots.length) return;
    this.currentIndex = newIndex;
    if (this.slider) this.slider.value = String(this.currentIndex);
    this.updateDisplay();
    this.callbacks?.onSnapshotChange(this.snapshots[this.currentIndex]!);
  }

  private updateDisplay() {
    const snap = this.snapshots[this.currentIndex];
    if (!snap || !this.labelEl) return;

    const phaseLabel = snap.phase === 'initial' ? 'Start' :
      snap.phase === 'after-orders' ? 'After Orders' :
      snap.phase === 'after-retreats' ? 'After Retreats' :
      'After Builds';

    this.labelEl.textContent = `${snap.turn.season} ${snap.turn.year} \u2014 ${phaseLabel}`;
    this.labelEl.dataset.index = `${this.currentIndex + 1} / ${this.snapshots.length}`;

    if (this.logSection) {
      this.logSection.innerHTML = '';
      const relevantLog = snap.log.slice(-15);
      if (relevantLog.length === 0) {
        this.logSection.innerHTML = '<div class="history-log-empty">No log entries for this turn</div>';
      } else {
        for (const entry of relevantLog) {
          const row = document.createElement('div');
          row.className = 'history-log-entry';
          if (entry.startsWith('===')) row.classList.add('history-log-header');
          else if (entry.includes('succeeds')) row.classList.add('history-log-success');
          else if (entry.includes('fails') || entry.includes('dislodged')) row.classList.add('history-log-fail');
          row.textContent = entry;
          this.logSection.appendChild(row);
        }
      }
    }
  }

  isOpen(): boolean {
    return this.container !== null;
  }

  destroy() {
    this.container?.remove();
    this.container = null;
    this.labelEl = null;
    this.slider = null;
    this.logSection = null;
  }
}

export const HistoryPanelDOM = new HistoryPanelImpl();
