import { Scene } from 'phaser';
import { TextureFactory } from '../utils/textures';

export class Boot extends Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    TextureFactory.generateAll(this);
  }

  create() {
    this.scene.start('Preloader');
  }
}
