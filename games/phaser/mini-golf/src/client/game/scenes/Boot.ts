import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // No external assets to preload for graphics-only MVP
  }

  create() {
    this.scene.start('Preloader');
  }
}
