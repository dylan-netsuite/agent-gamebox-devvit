import { Boot } from './scenes/Boot';
import { GamePlay } from './scenes/GamePlay';
import { GameSetup } from './scenes/GameSetup';
import { CharacterSelect } from './scenes/CharacterSelect';
import { ModeSelect } from './scenes/ModeSelect';
import { LobbyBrowser } from './scenes/LobbyBrowser';
import { Lobby } from './scenes/Lobby';
import { Leaderboard } from './scenes/Leaderboard';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [Boot, Preloader, ModeSelect, LobbyBrowser, GameSetup, CharacterSelect, Lobby, GamePlay, Leaderboard],
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
