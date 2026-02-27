import type { CharacterDrawFn } from './types';

export const drawFishAttawater: CharacterDrawFn = (g, x, y, w, h, facingRight, _teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  const coatColor = 0xc4a872;
  const coatDark = 0x9a8055;
  const fishGreen = 0x5aaa5a;
  const fishLight = 0x7acc7a;

  // --- Fish tail poking out the back of the coat ---
  g.fillStyle(fishGreen, 1);
  g.beginPath();
  g.moveTo(cx - dir * 6, y + h * 0.65);
  g.lineTo(cx - dir * 12, y + h * 0.5);
  g.lineTo(cx - dir * 15, y + h * 0.4);
  g.lineTo(cx - dir * 14, y + h * 0.55);
  g.lineTo(cx - dir * 15, y + h * 0.7);
  g.lineTo(cx - dir * 12, y + h * 0.6);
  g.lineTo(cx - dir * 6, y + h * 0.7);
  g.closePath();
  g.fillPath();
  // Tail fin lines
  g.lineStyle(0.6, 0x3a7a3a, 0.5);
  g.beginPath();
  g.moveTo(cx - dir * 12, y + h * 0.52);
  g.lineTo(cx - dir * 14, y + h * 0.55);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - dir * 12, y + h * 0.58);
  g.lineTo(cx - dir * 14.5, y + h * 0.62);
  g.strokePath();

  // --- Shoes (peeking out from coat) ---
  g.fillStyle(0x3a3a3a, 1);
  g.fillRoundedRect(cx - 5, y + h - 2, 4, 2, 1);
  g.fillRoundedRect(cx + 1, y + h - 2, 4, 2, 1);

  // --- Trench coat body (main body shape, fills hitbox) ---
  g.fillStyle(coatColor, 1);
  g.beginPath();
  g.moveTo(cx - 7, y + h - 2);
  g.lineTo(cx + 7, y + h - 2);
  g.lineTo(cx + 8, y + h * 0.35);
  g.lineTo(cx + 7, y + h * 0.2);
  g.lineTo(cx - 7, y + h * 0.2);
  g.lineTo(cx - 8, y + h * 0.35);
  g.lineTo(cx - 7, y + h - 2);
  g.closePath();
  g.fillPath();

  // Coat center line (button flap)
  g.lineStyle(0.8, coatDark, 0.5);
  g.beginPath();
  g.moveTo(cx, y + h * 0.22);
  g.lineTo(cx, y + h - 2);
  g.strokePath();

  // Coat buttons
  g.fillStyle(coatDark, 0.8);
  g.fillCircle(cx + 1, y + h * 0.35, 1);
  g.fillCircle(cx + 1, y + h * 0.48, 1);
  g.fillCircle(cx + 1, y + h * 0.61, 1);

  // Belt/waist line
  g.fillStyle(coatDark, 0.5);
  g.fillRect(cx - 7, y + h * 0.55, 14, 1.5);

  // Coat collar
  g.fillStyle(coatDark, 0.7);
  g.beginPath();
  g.moveTo(cx - 4, y + h * 0.2);
  g.lineTo(cx - 7, y + h * 0.15);
  g.lineTo(cx - 6, y + h * 0.22);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(cx + 4, y + h * 0.2);
  g.lineTo(cx + 7, y + h * 0.15);
  g.lineTo(cx + 6, y + h * 0.22);
  g.closePath();
  g.fillPath();

  // Tie peeking out
  g.fillStyle(0x333333, 1);
  g.beginPath();
  g.moveTo(cx - 1, y + h * 0.2);
  g.lineTo(cx, y + h * 0.17);
  g.lineTo(cx + 1, y + h * 0.2);
  g.lineTo(cx, y + h * 0.35);
  g.closePath();
  g.fillPath();

  // Coat stains (algae/slime spots)
  g.fillStyle(0x55aa55, 0.35);
  g.fillCircle(cx + dir * 4, y + h * 0.4, 1.5);
  g.fillCircle(cx - dir * 3, y + h * 0.7, 1.2);
  g.fillStyle(0x7755aa, 0.3);
  g.fillCircle(cx - dir * 5, y + h * 0.5, 1);

  // --- Water gun arm (front) ---
  g.fillStyle(fishGreen, 1);
  g.beginPath();
  g.moveTo(cx + dir * 7, y + h * 0.28);
  g.lineTo(cx + dir * 9, y + h * 0.25);
  g.lineTo(cx + dir * 10, y + h * 0.38);
  g.lineTo(cx + dir * 9, y + h * 0.42);
  g.lineTo(cx + dir * 7, y + h * 0.38);
  g.closePath();
  g.fillPath();
  // Green fin-hand
  g.fillStyle(fishGreen, 1);
  g.fillCircle(cx + dir * 9.5, y + h * 0.42, 2);
  // Water gun (bright yellow/blue)
  g.fillStyle(0xddcc22, 1);
  g.beginPath();
  g.moveTo(cx + dir * 9, y + h * 0.38);
  g.lineTo(cx + dir * 14, y + h * 0.32);
  g.lineTo(cx + dir * 14, y + h * 0.38);
  g.lineTo(cx + dir * 10, y + h * 0.42);
  g.closePath();
  g.fillPath();
  // Water gun tank
  g.fillStyle(0x4488dd, 1);
  g.fillCircle(cx + dir * 11, y + h * 0.3, 1.5);
  // Gun trigger/grip
  g.fillStyle(0xcc8822, 1);
  g.fillRect(cx + dir * 10, y + h * 0.39, dir * 1.5, 2);

  // --- Other arm (behind, in coat sleeve) ---
  g.fillStyle(coatColor, 1);
  g.beginPath();
  g.moveTo(cx - dir * 7, y + h * 0.28);
  g.lineTo(cx - dir * 9, y + h * 0.35);
  g.lineTo(cx - dir * 10, y + h * 0.5);
  g.lineTo(cx - dir * 8, y + h * 0.52);
  g.lineTo(cx - dir * 7, y + h * 0.42);
  g.closePath();
  g.fillPath();
  g.fillStyle(fishGreen, 1);
  g.fillCircle(cx - dir * 9, y + h * 0.52, 1.5);

  // --- Fish head (green, rounded) ---
  g.fillStyle(fishGreen, 1);
  g.fillEllipse(cx, y + h * 0.1, 14, 10);

  // Lighter cheek area
  g.fillStyle(fishLight, 0.4);
  g.fillEllipse(cx - dir * 1, y + h * 0.12, 8, 6);

  // Fish gill lines
  g.lineStyle(0.6, 0x3a7a3a, 0.4);
  g.beginPath();
  g.moveTo(cx - dir * 4, y + h * 0.08);
  g.lineTo(cx - dir * 5, y + h * 0.14);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - dir * 3, y + h * 0.07);
  g.lineTo(cx - dir * 4, y + h * 0.13);
  g.strokePath();

  // --- Round glasses ---
  g.lineStyle(1, 0x333333, 0.9);
  g.strokeCircle(cx - 3, y + h * 0.09, 3);
  g.strokeCircle(cx + 3, y + h * 0.09, 3);
  // Bridge
  g.beginPath();
  g.moveTo(cx - 0.5, y + h * 0.09);
  g.lineTo(cx + 0.5, y + h * 0.09);
  g.strokePath();
  // Lens glare
  g.fillStyle(0xffffff, 0.15);
  g.fillCircle(cx - 3.5, y + h * 0.07, 1);
  g.fillCircle(cx + 2.5, y + h * 0.07, 1);

  // Eyes behind glasses
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx - 3, y + h * 0.09, 3.5, 3);
  g.fillEllipse(cx + 3, y + h * 0.09, 3.5, 3);
  const po = dir * 0.5;
  g.fillStyle(0x222222, 1);
  g.fillCircle(cx - 3 + po, y + h * 0.09 + 0.3, 1.2);
  g.fillCircle(cx + 3 + po, y + h * 0.09 + 0.3, 1.2);

  // --- Fake nose (big, pink/orange, Groucho-style) ---
  g.fillStyle(0xdd8855, 1);
  g.beginPath();
  g.moveTo(cx + dir * 2, y + h * 0.1);
  g.lineTo(cx + dir * 6, y + h * 0.13);
  g.lineTo(cx + dir * 5, y + h * 0.17);
  g.lineTo(cx + dir * 2, y + h * 0.15);
  g.closePath();
  g.fillPath();
  // Nose highlight
  g.fillStyle(0xeeaa77, 0.5);
  g.fillCircle(cx + dir * 5, y + h * 0.14, 1.2);

  // --- Fake mustache (bushy, black) ---
  g.fillStyle(0x222222, 1);
  g.beginPath();
  g.moveTo(cx + dir * 1, y + h * 0.15);
  g.lineTo(cx + dir * 6, y + h * 0.14);
  g.lineTo(cx + dir * 7, y + h * 0.16);
  g.lineTo(cx + dir * 5, y + h * 0.18);
  g.lineTo(cx + dir * 2, y + h * 0.19);
  g.lineTo(cx - dir * 1, y + h * 0.18);
  g.lineTo(cx - dir * 2, y + h * 0.16);
  g.closePath();
  g.fillPath();

  // --- Fedora ---
  g.fillStyle(0x9a8055, 1);
  // Hat brim (wide)
  g.beginPath();
  g.moveTo(cx - 9, y + h * 0.03);
  g.lineTo(cx + 9, y + h * 0.03);
  g.lineTo(cx + 8, y + h * 0.06);
  g.lineTo(cx - 8, y + h * 0.06);
  g.closePath();
  g.fillPath();
  // Hat crown
  g.fillStyle(0x8a7045, 1);
  g.beginPath();
  g.moveTo(cx - 6, y + h * 0.03);
  g.lineTo(cx - 5, y - 3);
  g.lineTo(cx + 5, y - 3);
  g.lineTo(cx + 6, y + h * 0.03);
  g.closePath();
  g.fillPath();
  // Hat band
  g.fillStyle(0x5a4a30, 1);
  g.fillRect(cx - 5, y - 1, 10, 1.5);
  // Hat dent
  g.lineStyle(0.5, 0x7a6a50, 0.4);
  g.beginPath();
  g.moveTo(cx - 3, y - 3);
  g.lineTo(cx, y - 2);
  g.lineTo(cx + 3, y - 3);
  g.strokePath();

  // --- Team color badge (detective badge on coat) ---
  g.fillStyle(_teamColor, 0.9);
  g.beginPath();
  g.moveTo(cx - dir * 4, y + h * 0.3);
  g.lineTo(cx - dir * 3, y + h * 0.27);
  g.lineTo(cx - dir * 2, y + h * 0.3);
  g.lineTo(cx - dir * 2.5, y + h * 0.33);
  g.lineTo(cx - dir * 3.5, y + h * 0.33);
  g.closePath();
  g.fillPath();
};
