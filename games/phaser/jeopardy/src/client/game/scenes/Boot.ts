import { Scene } from 'phaser';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Nothing to preload — assets are loaded in the Preloader scene.
  }

  create() {
    this.scene.start('Preloader');
  }
}
