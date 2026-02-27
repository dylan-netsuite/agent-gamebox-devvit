import { Boot } from './scenes/Boot';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { HowToPlay } from './scenes/HowToPlay';
import { LeaderboardScene } from './scenes/Leaderboard';
import { MainMenu } from './scenes/MainMenu';
import { ModeSelect } from './scenes/ModeSelect';
import { LobbyBrowser } from './scenes/LobbyBrowser';
import { Lobby } from './scenes/Lobby';
import { Preloader } from './scenes/Preloader';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#0d0d1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, MainMenu, ModeSelect, LobbyBrowser, Lobby, MainGame, GameOver, HowToPlay, LeaderboardScene],
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
