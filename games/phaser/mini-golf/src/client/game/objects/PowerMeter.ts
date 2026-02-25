import * as Phaser from 'phaser';
import { POWER_OSCILLATION_HZ } from '../utils/physics';

export class PowerMeter {
  scene: Phaser.Scene;
  container: Phaser.GameObjects.Container;
  private barBg: Phaser.GameObjects.Graphics;
  private barFill: Phaser.GameObjects.Graphics;
  private barBorder: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  active: boolean = false;
  power: number = 0;
  private elapsed: number = 0;
  private barWidth: number;
  private barHeight: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.scale;

    this.barWidth = Math.min(width * 0.5, 300);
    this.barHeight = Math.max(14, height * 0.025);

    const x = (width - this.barWidth) / 2;
    const y = height - this.barHeight - 20;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(100);

    this.barBg = scene.add.graphics();
    this.barBg.fillStyle(0x000000, 0.5);
    this.barBg.fillRoundedRect(x, y, this.barWidth, this.barHeight, 4);
    this.container.add(this.barBg);

    this.barFill = scene.add.graphics();
    this.container.add(this.barFill);

    this.barBorder = scene.add.graphics();
    this.barBorder.lineStyle(2, 0xffffff, 0.4);
    this.barBorder.strokeRoundedRect(x, y, this.barWidth, this.barHeight, 4);
    this.container.add(this.barBorder);

    this.label = scene.add
      .text(width / 2, y - 8, 'POWER', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: '12px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5, 1);
    this.container.add(this.label);

    this.setVisible(false);
  }

  start(): void {
    this.active = true;
    this.elapsed = 0;
    this.power = 0;
    this.setVisible(true);
  }

  stop(): number {
    this.active = false;
    const finalPower = this.power;
    this.setVisible(false);
    return finalPower;
  }

  update(delta: number): void {
    if (!this.active) return;

    this.elapsed += delta / 1000;
    this.power = Math.abs(Math.sin(this.elapsed * Math.PI * POWER_OSCILLATION_HZ));

    const { width, height } = this.scene.scale;
    const x = (width - this.barWidth) / 2;
    const y = height - this.barHeight - 20;

    const r = Math.round(this.power * 255);
    const g = Math.round((1 - this.power) * 100);
    const color = (r << 16) | (g << 8) | 0;

    this.barFill.clear();
    this.barFill.fillStyle(color, 0.9);
    this.barFill.fillRoundedRect(x, y, this.barWidth * this.power, this.barHeight, 4);
  }

  setVisible(v: boolean): void {
    this.container.setVisible(v);
  }

  destroy(): void {
    this.container.destroy();
  }
}
