import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { ModeSelect } from './scenes/ModeSelect';
import { DifficultySelect } from './scenes/DifficultySelect';
import { LocalSetup } from './scenes/LocalSetup';
import { PassDevice } from './scenes/PassDevice';
import { LobbyBrowser } from './scenes/LobbyBrowser';
import { Lobby } from './scenes/Lobby';
import { GamePlay } from './scenes/GamePlay';
import { RoundResults } from './scenes/RoundResults';
import { GameOver } from './scenes/GameOver';
import { Leaderboard } from './scenes/Leaderboard';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [Boot, Preloader, ModeSelect, DifficultySelect, LocalSetup, PassDevice, LobbyBrowser, Lobby, GamePlay, RoundResults, GameOver, Leaderboard],
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (!container) return;

  function tryStart() {
    const { offsetWidth, offsetHeight } = container!;
    if (offsetWidth > 0 && offsetHeight > 0) {
      void new Game({ ...config, parent: 'game-container' });
    } else {
      requestAnimationFrame(tryStart);
    }
  }
  tryStart();
});
