import { context, requestExpandedMode } from '@devvit/web/client';

const startButton = document.getElementById('start-button') as HTMLButtonElement;
const subtitle = document.getElementById('subtitle') as HTMLParagraphElement;

startButton.addEventListener('click', (e) => {
  void requestExpandedMode(e, 'game');
});

function init() {
  const name = context.username;
  if (name) {
    subtitle.textContent = `Welcome, ${name}! Tap to play.`;
  }
}

init();
