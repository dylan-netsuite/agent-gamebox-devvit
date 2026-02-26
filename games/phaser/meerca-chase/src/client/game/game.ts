import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { Leaderboard } from './scenes/Leaderboard';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 500,
    height: 800,
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver, Leaderboard],
};

const StartGame = (parent: string) => {
  const game = new Game({ ...config, parent });
  (window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;
  return game;
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
