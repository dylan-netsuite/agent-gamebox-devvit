import type { CharacterDrawFn } from './types';

export const drawHighNoonSnoo: CharacterDrawFn = (g, x, y, w, h, facingRight, _teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  const snooWhite = 0xf0ece8;
  const snooShadow = 0xddd5cc;
  const snooEyeColor = 0xff4500;
  const antennaStalk = 0x333333;
  const poncho = 0xc4a060;
  const ponchoDark = 0x9a7a40;
  const bootBrown = 0x5a3a1a;
  const hatBrown = 0x7a5a30;
  const hatDark = 0x5a4020;

  // Snoo proportions: big head sits high, stubby body below
  const headCy = y + h * 0.22;
  const headRx = 11;
  const headRy = 9;

  // --- Stubby cowboy boots ---
  g.fillStyle(bootBrown, 1);
  g.fillRoundedRect(cx - 6, y + h - 3, 5, 3, 1);
  g.fillRoundedRect(cx + 1, y + h - 3, 5, 3, 1);
  g.fillStyle(0x3a2a10, 1);
  g.fillRect(cx - 6, y + h - 1, 5, 1);
  g.fillRect(cx + 1, y + h - 1, 5, 1);
  // Spurs
  g.fillStyle(0xddaa22, 1);
  g.fillCircle(cx - dir * 6, y + h - 1.5, 1);
  g.lineStyle(0.5, 0xddaa22, 0.8);
  g.beginPath();
  g.moveTo(cx - dir * 6, y + h - 1.5);
  g.lineTo(cx - dir * 7.5, y + h - 1);
  g.strokePath();

  // --- Short stubby legs ---
  g.fillStyle(snooWhite, 1);
  g.fillRoundedRect(cx - 6, y + h * 0.72, 5, h * 0.28 - 3, 2);
  g.fillRoundedRect(cx + 1, y + h * 0.72, 5, h * 0.28 - 3, 2);

  // --- Round poncho body (wide, short) ---
  g.fillStyle(poncho, 1);
  g.fillEllipse(cx, y + h * 0.55, 20, 18);

  // Poncho drape lines
  g.lineStyle(0.5, ponchoDark, 0.35);
  g.beginPath();
  g.moveTo(cx - 3, y + h * 0.42);
  g.lineTo(cx - 5, y + h * 0.65);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 3, y + h * 0.42);
  g.lineTo(cx + 5, y + h * 0.65);
  g.strokePath();

  // Poncho V-neck opening showing white chest
  g.fillStyle(snooWhite, 1);
  g.beginPath();
  g.moveTo(cx - 3, y + h * 0.42);
  g.lineTo(cx, y + h * 0.52);
  g.lineTo(cx + 3, y + h * 0.42);
  g.closePath();
  g.fillPath();

  // Belt
  g.fillStyle(0x4a3a20, 1);
  g.fillRect(cx - 8, y + h * 0.6, 16, 1.5);
  g.fillStyle(0xddaa22, 1);
  g.fillRoundedRect(cx - 1.5, y + h * 0.59, 3, 2.5, 0.5);

  // Bandolier
  g.lineStyle(1.2, 0x5a3a1a, 0.6);
  g.beginPath();
  g.moveTo(cx - dir * 6, y + h * 0.42);
  g.lineTo(cx + dir * 5, y + h * 0.62);
  g.strokePath();
  g.fillStyle(0xccaa44, 0.8);
  g.fillCircle(cx - dir * 3, y + h * 0.47, 0.8);
  g.fillCircle(cx - dir * 1, y + h * 0.52, 0.8);
  g.fillCircle(cx + dir * 1, y + h * 0.57, 0.8);

  // --- Revolver arm (front) ---
  g.fillStyle(snooWhite, 1);
  g.beginPath();
  g.moveTo(cx + dir * 8, y + h * 0.45);
  g.lineTo(cx + dir * 10, y + h * 0.47);
  g.lineTo(cx + dir * 11, y + h * 0.58);
  g.lineTo(cx + dir * 9, y + h * 0.6);
  g.lineTo(cx + dir * 8, y + h * 0.54);
  g.closePath();
  g.fillPath();
  g.fillCircle(cx + dir * 10, y + h * 0.59, 2);
  // Revolver
  g.fillStyle(0x666666, 1);
  g.beginPath();
  g.moveTo(cx + dir * 9.5, y + h * 0.56);
  g.lineTo(cx + dir * 15, y + h * 0.52);
  g.lineTo(cx + dir * 15, y + h * 0.57);
  g.lineTo(cx + dir * 10, y + h * 0.6);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x555555, 1);
  g.fillCircle(cx + dir * 12, y + h * 0.55, 1.2);
  g.fillStyle(0x4a3020, 1);
  g.fillRect(cx + dir * 9.5, y + h * 0.59, dir * 2, 2.5);

  // --- Hip arm (back) ---
  g.fillStyle(snooWhite, 1);
  g.beginPath();
  g.moveTo(cx - dir * 8, y + h * 0.45);
  g.lineTo(cx - dir * 9, y + h * 0.52);
  g.lineTo(cx - dir * 8, y + h * 0.62);
  g.lineTo(cx - dir * 6, y + h * 0.62);
  g.lineTo(cx - dir * 7, y + h * 0.52);
  g.closePath();
  g.fillPath();
  g.fillCircle(cx - dir * 7, y + h * 0.62, 1.5);

  // --- Big round Snoo head ---
  g.fillStyle(snooWhite, 1);
  g.fillEllipse(cx, headCy, headRx * 2, headRy * 2);

  // Shading
  g.fillStyle(snooShadow, 0.25);
  g.fillEllipse(cx - dir * 3, headCy + 2, headRx * 1.2, headRy * 1.1);

  // Ears (wider apart for wider head)
  g.fillStyle(snooWhite, 1);
  g.fillCircle(cx - headRx + 1, headCy - 4, 3);
  g.fillCircle(cx + headRx - 1, headCy - 4, 3);

  // --- Snoo eyes (orange-red, bigger for rounder face) ---
  g.fillStyle(snooEyeColor, 1);
  g.fillEllipse(cx - 4, headCy + 1, 5, 6);
  g.fillEllipse(cx + 4, headCy + 1, 5, 6);
  // Eye glints
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(cx - 5, headCy - 0.5, 1.2);
  g.fillCircle(cx + 3, headCy - 0.5, 1.2);

  // --- Snoo mouth (smirk) ---
  g.lineStyle(0.8, 0x333333, 0.7);
  g.beginPath();
  g.moveTo(cx - 3, headCy + 6);
  g.lineTo(cx + 1, headCy + 6.5);
  g.lineTo(cx + 4, headCy + 5.5);
  g.strokePath();

  // --- Antenna (dark stalk, white ball, curving out) ---
  g.lineStyle(1.5, antennaStalk, 1);
  g.beginPath();
  g.moveTo(cx, headCy - headRy);
  g.lineTo(cx + dir * 4, headCy - headRy - 6);
  g.strokePath();
  g.fillStyle(snooWhite, 1);
  g.fillCircle(cx + dir * 4, headCy - headRy - 6.5, 2.2);

  // --- BIG cowboy hat ---
  // Hat brim (extra wide)
  g.fillStyle(hatBrown, 1);
  g.beginPath();
  g.moveTo(cx - 14, headCy - 3);
  g.lineTo(cx + 14, headCy - 3);
  g.lineTo(cx + 13, headCy);
  g.lineTo(cx - 13, headCy);
  g.closePath();
  g.fillPath();

  // Hat crown (tall, wide)
  g.fillStyle(hatBrown, 1);
  g.beginPath();
  g.moveTo(cx - 9, headCy - 3);
  g.lineTo(cx - 8, headCy - 13);
  g.lineTo(cx - 4, headCy - 16);
  g.lineTo(cx + 4, headCy - 16);
  g.lineTo(cx + 8, headCy - 13);
  g.lineTo(cx + 9, headCy - 3);
  g.closePath();
  g.fillPath();

  // Hat band
  g.fillStyle(hatDark, 1);
  g.fillRect(cx - 8, headCy - 4.5, 16, 2);

  // Hat crown dent
  g.lineStyle(0.6, hatDark, 0.5);
  g.beginPath();
  g.moveTo(cx - 5, headCy - 16);
  g.lineTo(cx, headCy - 14);
  g.lineTo(cx + 5, headCy - 16);
  g.strokePath();

  // Brim shadow on face
  g.fillStyle(0x000000, 0.06);
  g.fillEllipse(cx, headCy + 1, 20, 3);

  // --- Team color sheriff star badge ---
  g.fillStyle(_teamColor, 0.9);
  const bx = cx - dir * 5;
  const by = y + h * 0.48;
  g.beginPath();
  g.moveTo(bx, by - 2.5);
  g.lineTo(bx + 1, by - 0.8);
  g.lineTo(bx + 2.5, by - 0.8);
  g.lineTo(bx + 1.3, by + 0.3);
  g.lineTo(bx + 1.8, by + 2);
  g.lineTo(bx, by + 1);
  g.lineTo(bx - 1.8, by + 2);
  g.lineTo(bx - 1.3, by + 0.3);
  g.lineTo(bx - 2.5, by - 0.8);
  g.lineTo(bx - 1, by - 0.8);
  g.closePath();
  g.fillPath();
};
