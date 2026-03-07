import { context, requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button') as HTMLButtonElement;
const subtitle = document.getElementById('subtitle') as HTMLParagraphElement;
const highScoreEl = document.getElementById('high-score') as HTMLSpanElement;
const scoreDisplay = document.getElementById('score-display') as HTMLDivElement;

startButton.addEventListener('click', (e) => {
  void requestExpandedMode(e, 'game');
});

async function fetchHighScore(): Promise<number> {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return 0;
    const data = (await res.json()) as { success: boolean; stats?: { highScore: number } };
    return data.success && data.stats ? data.stats.highScore : 0;
  } catch {
    return 0;
  }
}

function animateScore(target: number): void {
  if (target <= 0) {
    highScoreEl.textContent = '0';
    return;
  }

  scoreDisplay.classList.add('has-score');
  const duration = 600;
  const start = performance.now();

  function step(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    highScoreEl.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

async function init() {
  const name = context.username;
  if (name) {
    subtitle.textContent = `Welcome back, ${name}!`;
  }

  const score = await fetchHighScore();
  animateScore(score);
}

void init();
