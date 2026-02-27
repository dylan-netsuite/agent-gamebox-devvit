import type { TutorialStep } from './tutorialScript';

export interface TutorialOverlayCallbacks {
  onNext: () => void;
  onSkip: () => void;
}

class TutorialOverlayImpl {
  private container: HTMLElement | null = null;
  private messageBox: HTMLElement | null = null;
  private titleEl: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private nextBtn: HTMLButtonElement | null = null;
  private stepCounter: HTMLElement | null = null;
  private skipBtn: HTMLButtonElement | null = null;
  private callbacks: TutorialOverlayCallbacks | null = null;
  private highlightEls: HTMLElement[] = [];

  init(callbacks: TutorialOverlayCallbacks) {
    this.callbacks = callbacks;
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'tutorial-overlay';

    this.skipBtn = document.createElement('button');
    this.skipBtn.className = 'tutorial-skip';
    this.skipBtn.textContent = 'Skip Tutorial';
    this.skipBtn.onclick = () => this.callbacks?.onSkip();
    this.container.appendChild(this.skipBtn);

    this.messageBox = document.createElement('div');
    this.messageBox.className = 'tutorial-message';

    this.stepCounter = document.createElement('div');
    this.stepCounter.className = 'tutorial-step-counter';
    this.messageBox.appendChild(this.stepCounter);

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'tutorial-title';
    this.messageBox.appendChild(this.titleEl);

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'tutorial-body';
    this.messageBox.appendChild(this.bodyEl);

    this.nextBtn = document.createElement('button');
    this.nextBtn.className = 'tutorial-next-btn';
    this.nextBtn.textContent = 'Next';
    this.nextBtn.onclick = () => this.callbacks?.onNext();
    this.messageBox.appendChild(this.nextBtn);

    this.container.appendChild(this.messageBox);

    const app = document.getElementById('app') ?? document.body;
    app.appendChild(this.container);
  }

  showStep(step: TutorialStep, stepIndex: number, totalSteps: number) {
    if (!this.container || !this.titleEl || !this.bodyEl || !this.nextBtn || !this.stepCounter) return;

    this.container.style.display = 'block';
    this.stepCounter.textContent = `Step ${stepIndex + 1} of ${totalSteps}`;
    this.titleEl.textContent = step.title;
    this.bodyEl.innerHTML = step.message.replace(/\n/g, '<br>');

    if (step.waitForNext) {
      this.nextBtn.style.display = 'block';
      this.nextBtn.textContent = 'Next';
    } else {
      this.nextBtn.style.display = 'none';
    }

    this.clearHighlights();

    if (step.pointTo) {
      this.pointToElement(step.pointTo);
    }
  }

  private pointToElement(target: string) {
    let el: HTMLElement | null = null;
    switch (target) {
      case 'orders-panel':
        el = document.getElementById('orders-panel');
        break;
      case 'mode-row':
        el = document.querySelector('.orders-mode-row') as HTMLElement;
        break;
      case 'submit-btn':
        el = document.querySelector('.orders-submit') as HTMLElement;
        break;
    }
    if (el) {
      el.classList.add('tutorial-pointed');
    }
  }

  clearHighlights() {
    for (const el of this.highlightEls) el.remove();
    this.highlightEls = [];
    document.querySelectorAll('.tutorial-pointed').forEach((el) => el.classList.remove('tutorial-pointed'));
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
    this.clearHighlights();
  }

  showCompletion(onReturn: () => void) {
    if (!this.container || !this.titleEl || !this.bodyEl || !this.nextBtn || !this.stepCounter) return;

    this.container.style.display = 'block';
    this.stepCounter.textContent = 'Complete!';
    this.titleEl.textContent = 'Tutorial Complete!';
    this.bodyEl.innerHTML = [
      'Congratulations! You\'ve learned the core mechanics of Diplomacy:',
      '',
      '<b>Move</b> — Send units to adjacent provinces',
      '<b>Hold</b> — Defend your position',
      '<b>Support</b> — Add strength to attacks or defenses',
      '<b>Convoy</b> — Transport armies across water',
      '<b>Retreat</b> — Reposition dislodged units',
      '<b>Build</b> — Create new units after gaining supply centers',
      '',
      'In a real game, you\'ll also negotiate with other players using the chat panel. Alliances, betrayals, and diplomacy are what make this game legendary!',
    ].join('<br>');

    this.nextBtn.style.display = 'block';
    this.nextBtn.textContent = 'Return to Lobby';
    this.nextBtn.onclick = onReturn;

    if (this.skipBtn) this.skipBtn.style.display = 'none';
    this.clearHighlights();
  }

  destroy() {
    this.clearHighlights();
    this.container?.remove();
    this.container = null;
    this.messageBox = null;
    this.titleEl = null;
    this.bodyEl = null;
    this.nextBtn = null;
    this.stepCounter = null;
    this.skipBtn = null;
    this.callbacks = null;
  }
}

export const TutorialOverlayDOM = new TutorialOverlayImpl();
