import { Boot } from './scenes/Boot';
import { CommunityStatsScene } from './scenes/CommunityStatsScene';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { MainMenu } from './scenes/MainMenu';
import { StatsScene } from './scenes/StatsScene';
import * as Phaser from 'phaser';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  parent: 'game-container',
  backgroundColor: '#028af8',
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver, StatsScene, CommunityStatsScene, LeaderboardScene],
};

const StartGame = (parent: string) => {
  const game = new Game({ ...config, parent });
  // Expose for Playwright testing
  (window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;
  return game;
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (!container) return;

  // Wait for the container to have valid dimensions before starting Phaser.
  // In Devvit iframes the container can have zero size briefly on load,
  // which causes WebGL "Framebuffer Incomplete Attachment" errors.
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
