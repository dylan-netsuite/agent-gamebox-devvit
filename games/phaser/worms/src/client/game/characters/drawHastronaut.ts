import type { CharacterDrawFn } from './types';

export const drawHastronaut: CharacterDrawFn = (g, x, y, w, h, facingRight, _teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  const suitColor = 0xe8e8e8;
  const suitDark = 0xbbbbbb;
  const suitOutline = 0x555555;

  // --- Boots ---
  g.fillStyle(suitDark, 1);
  g.beginPath();
  g.moveTo(cx - 4, y + h - 4);
  g.lineTo(cx - 5, y + h);
  g.lineTo(cx - 1, y + h);
  g.lineTo(cx - 1, y + h - 3);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(cx + 1, y + h - 3);
  g.lineTo(cx + 1, y + h);
  g.lineTo(cx + 5, y + h);
  g.lineTo(cx + 4, y + h - 4);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x888888, 1);
  g.fillRect(cx - 5, y + h - 1, 4, 1);
  g.fillRect(cx + 1, y + h - 1, 4, 1);

  // --- Legs ---
  g.fillStyle(suitColor, 1);
  g.beginPath();
  g.moveTo(cx - 6, y + h * 0.62);
  g.lineTo(cx - 4, y + h - 4);
  g.lineTo(cx, y + h - 3);
  g.lineTo(cx + 4, y + h - 4);
  g.lineTo(cx + 6, y + h * 0.62);
  g.lineTo(cx, y + h * 0.58);
  g.closePath();
  g.fillPath();

  // --- Torso (fills hitbox width, slightly puffy) ---
  g.fillStyle(suitColor, 1);
  g.beginPath();
  g.moveTo(cx - 6, y + h * 0.62);
  g.lineTo(cx - 8, y + h * 0.38);
  g.lineTo(cx - 7, y + h * 0.24);
  g.lineTo(cx + 7, y + h * 0.24);
  g.lineTo(cx + 8, y + h * 0.38);
  g.lineTo(cx + 6, y + h * 0.62);
  g.closePath();
  g.fillPath();

  // Suit outline
  g.lineStyle(0.6, suitOutline, 0.3);
  g.beginPath();
  g.moveTo(cx - 6, y + h * 0.62);
  g.lineTo(cx - 8, y + h * 0.38);
  g.lineTo(cx - 7, y + h * 0.24);
  g.lineTo(cx + 7, y + h * 0.24);
  g.lineTo(cx + 8, y + h * 0.38);
  g.lineTo(cx + 6, y + h * 0.62);
  g.strokePath();

  // Belt
  g.fillStyle(suitDark, 0.6);
  g.fillRect(cx - 6, y + h * 0.58, 12, 1.5);

  // Chest panel
  g.fillStyle(0x444444, 1);
  g.fillRoundedRect(cx - 3, y + h * 0.33, 6, 3.5, 1);
  g.fillStyle(0xff4444, 1);
  g.fillRect(cx - 2, y + h * 0.35, 1, 1);
  g.fillStyle(0x44ff44, 1);
  g.fillRect(cx - 0.5, y + h * 0.35, 1, 1);
  g.fillStyle(0x4488ff, 1);
  g.fillRect(cx + 1, y + h * 0.35, 1, 1);

  // --- Backpack ---
  g.fillStyle(suitDark, 1);
  g.beginPath();
  g.moveTo(cx - dir * 7, y + h * 0.24);
  g.lineTo(cx - dir * 10, y + h * 0.27);
  g.lineTo(cx - dir * 11, y + h * 0.48);
  g.lineTo(cx - dir * 9, y + h * 0.52);
  g.lineTo(cx - dir * 7, y + h * 0.48);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xaaaaaa, 1);
  g.fillRect(cx - dir * 10, y + h * 0.31, dir * 2.5, 3);
  g.lineStyle(0.7, 0x999999, 0.5);
  g.beginPath();
  g.moveTo(cx - dir * 9, y + h * 0.27);
  g.lineTo(cx - dir * 7, y + h * 0.22);
  g.strokePath();

  // --- Gun arm ---
  g.fillStyle(suitColor, 1);
  g.beginPath();
  g.moveTo(cx + dir * 7, y + h * 0.27);
  g.lineTo(cx + dir * 9, y + h * 0.29);
  g.lineTo(cx + dir * 10, y + h * 0.48);
  g.lineTo(cx + dir * 9, y + h * 0.53);
  g.lineTo(cx + dir * 7, y + h * 0.46);
  g.closePath();
  g.fillPath();
  g.fillStyle(suitDark, 1);
  g.fillCircle(cx + dir * 9.5, y + h * 0.53, 2);
  // Pistol
  g.fillStyle(0x4a3a2a, 1);
  g.beginPath();
  g.moveTo(cx + dir * 9, y + h * 0.51);
  g.lineTo(cx + dir * 14, y + h * 0.48);
  g.lineTo(cx + dir * 14, y + h * 0.53);
  g.lineTo(cx + dir * 9.5, y + h * 0.56);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x3a2a1a, 1);
  g.fillRect(cx + dir * 9, y + h * 0.53, dir * 2, 3);

  // --- Shrug arm ---
  g.fillStyle(suitColor, 1);
  g.beginPath();
  g.moveTo(cx - dir * 7, y + h * 0.27);
  g.lineTo(cx - dir * 9, y + h * 0.2);
  g.lineTo(cx - dir * 11, y + h * 0.13);
  g.lineTo(cx - dir * 10, y + h * 0.23);
  g.closePath();
  g.fillPath();
  g.fillStyle(suitDark, 1);
  g.fillCircle(cx - dir * 11, y + h * 0.12, 2);
  g.lineStyle(0.8, suitDark, 0.8);
  g.beginPath();
  g.moveTo(cx - dir * 11 - 1.5, y + h * 0.1);
  g.lineTo(cx - dir * 11 - 2, y + h * 0.04);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - dir * 11, y + h * 0.09);
  g.lineTo(cx - dir * 11, y + h * 0.02);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - dir * 11 + 1.5, y + h * 0.1);
  g.lineTo(cx - dir * 11 + 2, y + h * 0.05);
  g.strokePath();

  // --- Helmet (big round) ---
  const helmetCy = y + h * 0.12;
  const helmetR = 8.5;

  g.fillStyle(0xf0f0f0, 1);
  g.fillCircle(cx, helmetCy, helmetR);
  g.lineStyle(0.8, suitOutline, 0.5);
  g.strokeCircle(cx, helmetCy, helmetR);

  // Visor
  g.fillStyle(0x1a2a3a, 0.9);
  g.fillEllipse(cx + dir * 0.5, helmetCy + 0.5, helmetR * 1.4, helmetR * 1.2);

  // Visor reflection
  g.lineStyle(1.2, 0x5588aa, 0.3);
  g.beginPath();
  g.arc(cx - dir * 1, helmetCy - 1, helmetR * 0.5, -2.2, -0.8, false);
  g.strokePath();
  g.fillStyle(0x88bbdd, 0.1);
  g.fillEllipse(cx + dir * 2, helmetCy + 1, 2, 3);

  // Helmet rim
  g.fillStyle(suitDark, 1);
  g.beginPath();
  g.moveTo(cx - 6, helmetCy + helmetR - 1);
  g.lineTo(cx + 6, helmetCy + helmetR - 1);
  g.lineTo(cx + 5, helmetCy + helmetR + 1);
  g.lineTo(cx - 5, helmetCy + helmetR + 1);
  g.closePath();
  g.fillPath();

  // Team color patch
  g.fillStyle(_teamColor, 0.9);
  g.fillRoundedRect(cx + dir * 6, y + h * 0.26, 3, 3, 1);
};
