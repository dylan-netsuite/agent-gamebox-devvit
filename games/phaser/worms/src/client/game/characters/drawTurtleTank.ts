import type { CharacterDrawFn } from './types';

export const drawTurtleTank: CharacterDrawFn = (g, x, y, w, h, facingRight, _teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  // Turtle is wide and low — body extends well beyond hitbox
  const shellW = w + 10;
  const shellH = h * 0.55;
  const shellY = y + h - shellH - 3;
  const shellCx = cx;

  // --- Legs (stubby, underneath shell) ---
  g.fillStyle(0x5a7a4a, 1);
  // Front legs (thicker, visible)
  g.beginPath();
  g.moveTo(shellCx + dir * 6, shellY + shellH - 2);
  g.lineTo(shellCx + dir * 8, y + h);
  g.lineTo(shellCx + dir * 10, y + h);
  g.lineTo(shellCx + dir * 9, shellY + shellH - 1);
  g.closePath();
  g.fillPath();
  // Back legs
  g.beginPath();
  g.moveTo(shellCx - dir * 5, shellY + shellH - 2);
  g.lineTo(shellCx - dir * 7, y + h);
  g.lineTo(shellCx - dir * 9, y + h);
  g.lineTo(shellCx - dir * 8, shellY + shellH - 1);
  g.closePath();
  g.fillPath();
  // Clawed feet
  g.fillStyle(0x4a6a3a, 1);
  g.fillCircle(shellCx + dir * 10, y + h - 0.5, 1.5);
  g.fillCircle(shellCx - dir * 9, y + h - 0.5, 1.5);

  // --- Tail (tiny, sticking out back) ---
  g.fillStyle(0x5a7a4a, 1);
  g.beginPath();
  g.moveTo(shellCx - dir * (shellW / 2 - 2), shellY + shellH - 2);
  g.lineTo(shellCx - dir * (shellW / 2 + 3), shellY + shellH + 1);
  g.lineTo(shellCx - dir * (shellW / 2 - 1), shellY + shellH);
  g.closePath();
  g.fillPath();

  // --- Shell dome (wide, curved) ---
  g.fillStyle(0x7a6a50, 1);
  g.beginPath();
  g.moveTo(shellCx - shellW / 2 + 2, shellY + shellH);
  // Left edge curves up
  g.lineTo(shellCx - shellW / 2, shellY + shellH * 0.5);
  g.lineTo(shellCx - shellW / 2 + 3, shellY + 3);
  // Top dome arc
  g.lineTo(shellCx - shellW * 0.2, shellY);
  g.lineTo(shellCx, shellY - 1);
  g.lineTo(shellCx + shellW * 0.2, shellY);
  // Right edge
  g.lineTo(shellCx + shellW / 2 - 3, shellY + 3);
  g.lineTo(shellCx + shellW / 2, shellY + shellH * 0.5);
  g.lineTo(shellCx + shellW / 2 - 2, shellY + shellH);
  g.closePath();
  g.fillPath();

  // Shell underbelly rim
  g.fillStyle(0x5a4a35, 0.8);
  g.beginPath();
  g.moveTo(shellCx - shellW / 2 + 2, shellY + shellH);
  g.lineTo(shellCx + shellW / 2 - 2, shellY + shellH);
  g.lineTo(shellCx + shellW / 2 - 3, shellY + shellH - 2);
  g.lineTo(shellCx - shellW / 2 + 3, shellY + shellH - 2);
  g.closePath();
  g.fillPath();

  // Shell pattern — plate lines
  g.lineStyle(0.8, 0x5a4a35, 0.6);
  // Central vertical
  g.beginPath();
  g.moveTo(shellCx, shellY);
  g.lineTo(shellCx, shellY + shellH - 2);
  g.strokePath();
  // Horizontal ridge
  g.beginPath();
  g.moveTo(shellCx - shellW * 0.35, shellY + shellH * 0.4);
  g.lineTo(shellCx + shellW * 0.35, shellY + shellH * 0.4);
  g.strokePath();
  // Diagonal plate lines
  g.beginPath();
  g.moveTo(shellCx - 2, shellY + 2);
  g.lineTo(shellCx - shellW * 0.3, shellY + shellH * 0.4);
  g.strokePath();
  g.beginPath();
  g.moveTo(shellCx + 2, shellY + 2);
  g.lineTo(shellCx + shellW * 0.3, shellY + shellH * 0.4);
  g.strokePath();

  // Shell highlight
  g.fillStyle(0x8a7a60, 0.25);
  g.fillEllipse(shellCx + 2, shellY + 4, 6, 4);

  // --- Tank turret ---
  const turretY = shellY - 1;
  g.fillStyle(0x6a5a45, 1);
  g.beginPath();
  g.moveTo(shellCx - 4, turretY + 4);
  g.lineTo(shellCx - 3, turretY);
  g.lineTo(shellCx + 3, turretY);
  g.lineTo(shellCx + 4, turretY + 4);
  g.closePath();
  g.fillPath();

  // Turret top dome
  g.fillStyle(0x5a4a35, 1);
  g.fillEllipse(shellCx, turretY, 5, 3);

  // Cannon barrel
  g.fillStyle(0x4a3a28, 1);
  const barrelLen = 10;
  g.beginPath();
  g.moveTo(shellCx + dir * 3, turretY + 0.5);
  g.lineTo(shellCx + dir * (3 + barrelLen), turretY - 0.5);
  g.lineTo(shellCx + dir * (3 + barrelLen), turretY + 2);
  g.lineTo(shellCx + dir * 3, turretY + 2.5);
  g.closePath();
  g.fillPath();
  // Muzzle
  g.fillStyle(0x3a2a18, 1);
  g.fillRect(shellCx + dir * (3 + barrelLen - 1), turretY - 1, dir * 2, 4);

  // Smoke wisps
  g.fillStyle(0x888888, 0.25);
  g.fillCircle(shellCx + dir * (3 + barrelLen + 2), turretY - 2, 1.5);
  g.fillStyle(0x999999, 0.15);
  g.fillCircle(shellCx + dir * (3 + barrelLen + 3), turretY - 4, 1);

  // --- Head (extending forward from shell) ---
  const headX = shellCx + dir * (shellW / 2 - 1);
  const headY = shellY + shellH * 0.4;

  // Neck
  g.fillStyle(0x6a8a55, 1);
  g.beginPath();
  g.moveTo(shellCx + dir * (shellW / 2 - 4), headY - 1);
  g.lineTo(headX, headY - 2);
  g.lineTo(headX + dir * 2, headY);
  g.lineTo(headX + dir * 2, headY + 5);
  g.lineTo(shellCx + dir * (shellW / 2 - 4), headY + 4);
  g.closePath();
  g.fillPath();

  // Head (oval)
  g.fillStyle(0x6a8a55, 1);
  g.fillEllipse(headX + dir * 3, headY + 1, 7, 6);

  // Droopy eyelid
  const eyeX = headX + dir * 4;
  const eyeYpos = headY;
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(eyeX, eyeYpos, 3.5, 2.5);
  g.fillStyle(0x222222, 1);
  g.fillCircle(eyeX + dir * 0.3, eyeYpos + 0.3, 1);
  // Heavy droopy eyelid
  g.fillStyle(0x4a6a3a, 1);
  g.beginPath();
  g.moveTo(eyeX - 2, eyeYpos - 1.5);
  g.lineTo(eyeX + 2, eyeYpos - 1.5);
  g.lineTo(eyeX + 2, eyeYpos - 0.3);
  g.lineTo(eyeX - 2, eyeYpos + 0.2);
  g.closePath();
  g.fillPath();

  // Flat grumpy mouth
  g.lineStyle(1, 0x4a6a3a, 0.9);
  g.beginPath();
  g.moveTo(headX + dir * 2, headY + 3.5);
  g.lineTo(headX + dir * 6, headY + 3);
  g.strokePath();

  // Nostril
  g.fillStyle(0x4a6a3a, 0.6);
  g.fillCircle(headX + dir * 5.5, headY + 1.5, 0.5);

  // --- Team color badge on shell ---
  g.fillStyle(_teamColor, 0.85);
  g.fillCircle(shellCx, shellY + shellH * 0.35, 2.5);
  g.lineStyle(0.5, _teamColor, 0.4);
  g.strokeCircle(shellCx, shellY + shellH * 0.35, 3.5);
};
