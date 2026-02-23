import type { CharacterDrawFn } from './types';

export const drawProfessorOrange: CharacterDrawFn = (g, x, y, w, h, facingRight, _teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  const fur = 0xe8923a;
  const furDark = 0xc47020;
  const furLight = 0xf5cc88;
  const stripe = 0xaa5510;
  const jacket = 0x6a5a48;
  const jacketDark = 0x504030;
  const shirt = 0xe8e0d0;
  const pinkNose = 0xee8899;
  const pinkBeans = 0xeea0a8;

  // --- Big fluffy tail (behind body) ---
  g.fillStyle(fur, 1);
  g.beginPath();
  g.moveTo(cx - dir * 5, y + h * 0.55);
  g.lineTo(cx - dir * 8, y + h * 0.45);
  g.lineTo(cx - dir * 12, y + h * 0.3);
  g.lineTo(cx - dir * 14, y + h * 0.18);
  g.lineTo(cx - dir * 15, y + h * 0.12);
  g.lineTo(cx - dir * 13, y + h * 0.15);
  g.lineTo(cx - dir * 11, y + h * 0.22);
  g.lineTo(cx - dir * 9, y + h * 0.35);
  g.lineTo(cx - dir * 7, y + h * 0.48);
  g.lineTo(cx - dir * 5, y + h * 0.6);
  g.closePath();
  g.fillPath();
  // Tail tip (lighter)
  g.fillStyle(furLight, 0.7);
  g.fillCircle(cx - dir * 14.5, y + h * 0.14, 2.5);
  // Tail stripes
  g.lineStyle(0.8, stripe, 0.5);
  g.beginPath();
  g.moveTo(cx - dir * 9, y + h * 0.32);
  g.lineTo(cx - dir * 10, y + h * 0.38);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - dir * 11, y + h * 0.24);
  g.lineTo(cx - dir * 12, y + h * 0.3);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - dir * 13, y + h * 0.17);
  g.lineTo(cx - dir * 14, y + h * 0.22);
  g.strokePath();

  // --- Stubby feet with toe beans ---
  g.fillStyle(fur, 1);
  g.fillEllipse(cx - 4, y + h - 1.5, 6, 4);
  g.fillEllipse(cx + 4, y + h - 1.5, 6, 4);
  // Toe beans (pink pads)
  g.fillStyle(pinkBeans, 1);
  g.fillCircle(cx - 5, y + h - 1, 1);
  g.fillCircle(cx - 3.5, y + h - 0.5, 0.8);
  g.fillCircle(cx - 4.5, y + h - 0.3, 0.8);
  g.fillCircle(cx + 3.5, y + h - 0.5, 0.8);
  g.fillCircle(cx + 4.5, y + h - 0.3, 0.8);
  g.fillCircle(cx + 5, y + h - 1, 1);

  // --- Short legs ---
  g.fillStyle(fur, 1);
  g.fillRoundedRect(cx - 6, y + h * 0.72, 5, h * 0.28 - 2, 2);
  g.fillRoundedRect(cx + 1, y + h * 0.72, 5, h * 0.28 - 2, 2);

  // --- Tweed jacket body ---
  g.fillStyle(jacket, 1);
  g.beginPath();
  g.moveTo(cx - 8, y + h * 0.72);
  g.lineTo(cx - 7, y + h * 0.3);
  g.lineTo(cx - 5, y + h * 0.25);
  g.lineTo(cx + 5, y + h * 0.25);
  g.lineTo(cx + 7, y + h * 0.3);
  g.lineTo(cx + 8, y + h * 0.72);
  g.closePath();
  g.fillPath();

  // Jacket texture (tweed lines)
  g.lineStyle(0.3, jacketDark, 0.2);
  for (let i = 0; i < 6; i++) {
    const ly = y + h * 0.32 + i * 3;
    g.beginPath();
    g.moveTo(cx - 7, ly);
    g.lineTo(cx + 7, ly);
    g.strokePath();
  }

  // Shirt V-neck
  g.fillStyle(shirt, 1);
  g.beginPath();
  g.moveTo(cx - 3, y + h * 0.25);
  g.lineTo(cx, y + h * 0.4);
  g.lineTo(cx + 3, y + h * 0.25);
  g.closePath();
  g.fillPath();

  // Jacket lapels
  g.fillStyle(jacketDark, 0.5);
  g.beginPath();
  g.moveTo(cx - 3, y + h * 0.25);
  g.lineTo(cx - 5, y + h * 0.25);
  g.lineTo(cx - 4, y + h * 0.35);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(cx + 3, y + h * 0.25);
  g.lineTo(cx + 5, y + h * 0.25);
  g.lineTo(cx + 4, y + h * 0.35);
  g.closePath();
  g.fillPath();

  // Team color elbow patch
  g.fillStyle(_teamColor, 0.8);
  g.fillEllipse(cx - dir * 7, y + h * 0.48, 3, 4);

  // --- Book arm (front) ---
  g.fillStyle(fur, 1);
  g.beginPath();
  g.moveTo(cx + dir * 7, y + h * 0.32);
  g.lineTo(cx + dir * 9, y + h * 0.34);
  g.lineTo(cx + dir * 10, y + h * 0.5);
  g.lineTo(cx + dir * 8, y + h * 0.52);
  g.lineTo(cx + dir * 7, y + h * 0.44);
  g.closePath();
  g.fillPath();
  // Paw
  g.fillCircle(cx + dir * 9, y + h * 0.52, 2);
  // Open book
  g.fillStyle(0x8b6040, 1);
  g.beginPath();
  g.moveTo(cx + dir * 7, y + h * 0.48);
  g.lineTo(cx + dir * 14, y + h * 0.42);
  g.lineTo(cx + dir * 15, y + h * 0.5);
  g.lineTo(cx + dir * 14, y + h * 0.58);
  g.lineTo(cx + dir * 7, y + h * 0.56);
  g.closePath();
  g.fillPath();
  // Book pages (white)
  g.fillStyle(0xf5f0e0, 1);
  g.beginPath();
  g.moveTo(cx + dir * 8, y + h * 0.49);
  g.lineTo(cx + dir * 13.5, y + h * 0.44);
  g.lineTo(cx + dir * 14, y + h * 0.5);
  g.lineTo(cx + dir * 13.5, y + h * 0.56);
  g.lineTo(cx + dir * 8, y + h * 0.55);
  g.closePath();
  g.fillPath();
  // Book spine
  g.lineStyle(0.5, 0x5a3a20, 0.6);
  g.beginPath();
  g.moveTo(cx + dir * 11, y + h * 0.43);
  g.lineTo(cx + dir * 11, y + h * 0.57);
  g.strokePath();

  // --- Magnifying glass arm (back) ---
  g.fillStyle(fur, 1);
  g.beginPath();
  g.moveTo(cx - dir * 7, y + h * 0.32);
  g.lineTo(cx - dir * 9, y + h * 0.28);
  g.lineTo(cx - dir * 10, y + h * 0.38);
  g.lineTo(cx - dir * 9, y + h * 0.42);
  g.lineTo(cx - dir * 7, y + h * 0.4);
  g.closePath();
  g.fillPath();
  g.fillCircle(cx - dir * 9.5, y + h * 0.42, 1.8);
  // Magnifying glass handle
  g.fillStyle(0x6a5a40, 1);
  g.beginPath();
  g.moveTo(cx - dir * 9, y + h * 0.4);
  g.lineTo(cx - dir * 11, y + h * 0.32);
  g.lineTo(cx - dir * 10.5, y + h * 0.3);
  g.lineTo(cx - dir * 8.5, y + h * 0.38);
  g.closePath();
  g.fillPath();
  // Magnifying glass lens
  g.lineStyle(1.2, 0x888888, 1);
  g.strokeCircle(cx - dir * 12, y + h * 0.24, 3);
  g.fillStyle(0xccddee, 0.3);
  g.fillCircle(cx - dir * 12, y + h * 0.24, 2.5);
  // Lens glint
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(cx - dir * 12.5, y + h * 0.22, 0.8);

  // --- Cat head (round, orange) ---
  g.fillStyle(fur, 1);
  g.fillEllipse(cx, y + h * 0.14, 18, 14);

  // Lighter cheeks/muzzle area
  g.fillStyle(furLight, 0.6);
  g.fillEllipse(cx, y + h * 0.17, 10, 7);

  // Forehead stripes (tabby markings)
  g.lineStyle(0.8, stripe, 0.5);
  g.beginPath();
  g.moveTo(cx, y + h * 0.06);
  g.lineTo(cx - 3, y + h * 0.1);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx, y + h * 0.06);
  g.lineTo(cx + 3, y + h * 0.1);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - 1, y + h * 0.07);
  g.lineTo(cx - 5, y + h * 0.12);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 1, y + h * 0.07);
  g.lineTo(cx + 5, y + h * 0.12);
  g.strokePath();

  // --- Pointy ears ---
  // Left ear
  g.fillStyle(fur, 1);
  g.beginPath();
  g.moveTo(cx - 6, y + h * 0.08);
  g.lineTo(cx - 8, y - 3);
  g.lineTo(cx - 3, y + h * 0.06);
  g.closePath();
  g.fillPath();
  // Left ear inner (pink)
  g.fillStyle(pinkNose, 0.7);
  g.beginPath();
  g.moveTo(cx - 6, y + h * 0.08);
  g.lineTo(cx - 7.5, y - 1);
  g.lineTo(cx - 4, y + h * 0.07);
  g.closePath();
  g.fillPath();
  // Right ear
  g.fillStyle(fur, 1);
  g.beginPath();
  g.moveTo(cx + 3, y + h * 0.06);
  g.lineTo(cx + 8, y - 3);
  g.lineTo(cx + 6, y + h * 0.08);
  g.closePath();
  g.fillPath();
  // Right ear inner (pink)
  g.fillStyle(pinkNose, 0.7);
  g.beginPath();
  g.moveTo(cx + 4, y + h * 0.07);
  g.lineTo(cx + 7.5, y - 1);
  g.lineTo(cx + 6, y + h * 0.08);
  g.closePath();
  g.fillPath();

  // --- Round glasses ---
  g.lineStyle(1, 0x333333, 0.9);
  g.strokeCircle(cx - 3.5, y + h * 0.14, 3.5);
  g.strokeCircle(cx + 3.5, y + h * 0.14, 3.5);
  // Bridge
  g.beginPath();
  g.moveTo(cx - 0.5, y + h * 0.14);
  g.lineTo(cx + 0.5, y + h * 0.14);
  g.strokePath();
  // Temple arms
  g.beginPath();
  g.moveTo(cx - 7, y + h * 0.13);
  g.lineTo(cx - 8, y + h * 0.11);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 7, y + h * 0.13);
  g.lineTo(cx + 8, y + h * 0.11);
  g.strokePath();

  // --- Eyes behind glasses ---
  g.fillStyle(0xf5eedd, 1);
  g.fillEllipse(cx - 3.5, y + h * 0.14, 4, 4.5);
  g.fillEllipse(cx + 3.5, y + h * 0.14, 4, 4.5);
  // Pupils
  const po = dir * 0.5;
  g.fillStyle(0x556644, 1);
  g.fillCircle(cx - 3.5 + po, y + h * 0.14 + 0.3, 1.5);
  g.fillCircle(cx + 3.5 + po, y + h * 0.14 + 0.3, 1.5);
  // Pupil highlights
  g.fillStyle(0x222222, 1);
  g.fillCircle(cx - 3.5 + po, y + h * 0.14 + 0.3, 0.8);
  g.fillCircle(cx + 3.5 + po, y + h * 0.14 + 0.3, 0.8);
  // Eye glints
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(cx - 4 + po, y + h * 0.13, 0.7);
  g.fillCircle(cx + 3 + po, y + h * 0.13, 0.7);

  // Lens reflections
  g.fillStyle(0xffffff, 0.1);
  g.fillCircle(cx - 4.5, y + h * 0.12, 1.2);
  g.fillCircle(cx + 2.5, y + h * 0.12, 1.2);

  // --- Pink nose ---
  g.fillStyle(pinkNose, 1);
  g.beginPath();
  g.moveTo(cx, y + h * 0.18);
  g.lineTo(cx - 1.5, y + h * 0.2);
  g.lineTo(cx + 1.5, y + h * 0.2);
  g.closePath();
  g.fillPath();

  // --- Cat smile ---
  g.lineStyle(0.6, 0x775533, 0.6);
  g.beginPath();
  g.moveTo(cx, y + h * 0.2);
  g.lineTo(cx - 2, y + h * 0.22);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx, y + h * 0.2);
  g.lineTo(cx + 2, y + h * 0.22);
  g.strokePath();

  // --- Whiskers ---
  g.lineStyle(0.4, 0x997755, 0.35);
  g.beginPath();
  g.moveTo(cx - 2, y + h * 0.19);
  g.lineTo(cx - 8, y + h * 0.17);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx - 2, y + h * 0.2);
  g.lineTo(cx - 8, y + h * 0.21);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 2, y + h * 0.19);
  g.lineTo(cx + 8, y + h * 0.17);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 2, y + h * 0.2);
  g.lineTo(cx + 8, y + h * 0.21);
  g.strokePath();
};
