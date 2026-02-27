import * as Phaser from 'phaser';

interface FloatingBlock {
  graphics: Phaser.GameObjects.Graphics;
  baseX: number;
  baseY: number;
  baseRot: number;
  phase: number;
  speed: number;
}

export interface SceneBg {
  objects: Phaser.GameObjects.GameObject[];
  blocks: FloatingBlock[];
}

const COLORS = [0xe63946, 0x457b9d, 0x2a9d8f, 0xe9c46a, 0xf4a261, 0x6a4c93, 0x48bfe3];

const BLOCK_DEFS = [
  { x: 0.04, y: 0.05, rot: -12, type: 'car' },
  { x: 0.88, y: 0.06, rot: 10, type: 'truck' },
  { x: 0.92, y: 0.35, rot: -18, type: 'carV' },
  { x: 0.03, y: 0.55, rot: 16, type: 'car' },
  { x: 0.90, y: 0.65, rot: -10, type: 'carV' },
  { x: 0.06, y: 0.85, rot: 14, type: 'truck' },
  { x: 0.80, y: 0.88, rot: -8, type: 'car' },
  { x: 0.45, y: 0.03, rot: 5, type: 'car' },
];

/**
 * Draws a unified background: gradient, soft glows, scattered blocks, and vignette.
 * Returns handles for cleanup and animation.
 */
export function drawSceneBackground(scene: Phaser.Scene, w: number, h: number): SceneBg {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const blocks: FloatingBlock[] = [];

  const bg = scene.add.graphics();
  bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f3460, 0x0f3460, 1, 1, 1, 1);
  bg.fillRect(0, 0, w, h);
  bg.fillStyle(0xe63946, 0.05);
  bg.fillEllipse(w * 0.5, h * 0.25, w * 0.7, h * 0.45);
  bg.fillStyle(0x457b9d, 0.035);
  bg.fillEllipse(w * 0.3, h * 0.7, w * 0.45, h * 0.3);
  bg.fillStyle(0x6a4c93, 0.025);
  bg.fillEllipse(w * 0.8, h * 0.6, w * 0.35, h * 0.25);
  objects.push(bg);

  const unit = Math.min(w, h) * 0.035;

  for (let i = 0; i < BLOCK_DEFS.length; i++) {
    const def = BLOCK_DEFS[i]!;
    const color = COLORS[i % COLORS.length]!;
    const alpha = 0.08 + Math.random() * 0.06;

    let bw: number, bh: number;
    switch (def.type) {
      case 'car': bw = unit * 2; bh = unit; break;
      case 'truck': bw = unit * 3; bh = unit; break;
      case 'carV': bw = unit; bh = unit * 2; break;
      default: bw = unit * 2; bh = unit;
    }

    const bx = def.x * w;
    const by = def.y * h;

    const g = scene.add.graphics();
    g.fillStyle(color, alpha);
    g.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, Math.min(bw, bh) * 0.2);
    g.lineStyle(1, 0xffffff, alpha * 0.25);
    g.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, Math.min(bw, bh) * 0.2);
    g.setPosition(bx, by);
    g.setRotation((def.rot * Math.PI) / 180);
    objects.push(g);

    blocks.push({
      graphics: g,
      baseX: bx,
      baseY: by,
      baseRot: (def.rot * Math.PI) / 180,
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.35,
    });
  }

  const edgeSize = Math.max(w, h) * 0.35;

  const top = scene.add.graphics();
  top.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3, 0.3, 0, 0);
  top.fillRect(0, 0, w, edgeSize);
  objects.push(top);

  const bottom = scene.add.graphics();
  bottom.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.35, 0.35);
  bottom.fillRect(0, h - edgeSize, w, edgeSize);
  objects.push(bottom);

  const left = scene.add.graphics();
  left.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.25, 0, 0.25, 0);
  left.fillRect(0, 0, edgeSize, h);
  objects.push(left);

  const right = scene.add.graphics();
  right.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.25, 0, 0.25);
  right.fillRect(w - edgeSize, 0, edgeSize, h);
  objects.push(right);

  return { objects, blocks };
}

export function updateSceneBlocks(blocks: FloatingBlock[], elapsed: number): void {
  const t = elapsed / 1000;
  for (const b of blocks) {
    const yOff = Math.sin(t * b.speed + b.phase) * 5;
    const xOff = Math.cos(t * b.speed * 0.7 + b.phase) * 2.5;
    const rotOff = Math.sin(t * b.speed * 0.5 + b.phase) * 0.025;
    b.graphics.setPosition(b.baseX + xOff, b.baseY + yOff);
    b.graphics.setRotation(b.baseRot + rotOff);
  }
}
