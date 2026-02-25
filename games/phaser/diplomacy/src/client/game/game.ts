import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { GamePlay } from './scenes/GamePlay';
import { MainMenu } from './scenes/MainMenu';
import { MyGames } from './scenes/MyGames';
import { Tutorial } from './scenes/Tutorial';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#0f0f1a',
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [Boot, Preloader, MainMenu, GamePlay, GameOver, MyGames, Tutorial],
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (!container) return;

  function tryStart() {
    const { offsetWidth, offsetHeight } = container!;
    if (offsetWidth > 0 && offsetHeight > 0) {
      StartGame('game-container');
    } else {
      requestAnimationFrame(tryStart);
    }
  }
  tryStart();
});
