import type { CharacterDrawFn } from './types';

export const drawClassicWorm: CharacterDrawFn = (g, x, y, w, h, facingRight, teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  // --- Tail ---
  g.fillStyle(teamColor, 0.8);
  g.beginPath();
  g.moveTo(cx - dir * 6, y + h - 2);
  g.lineTo(cx - dir * 10, y + h - 5);
  g.lineTo(cx - dir * 9, y + h);
  g.closePath();
  g.fillPath();

  // --- Body — fills hitbox width, tapers at head ---
  g.fillStyle(teamColor, 1);
  g.beginPath();
  g.moveTo(cx - 7, y + h);
  g.lineTo(cx + 7, y + h);
  g.lineTo(cx + 8, y + h * 0.55);
  g.lineTo(cx + 7, y + h * 0.35);
  g.lineTo(cx + 5, y + 3);
  g.lineTo(cx, y);
  g.lineTo(cx - 5, y + 3);
  g.lineTo(cx - 7, y + h * 0.35);
  g.lineTo(cx - 8, y + h * 0.55);
  g.lineTo(cx - 7, y + h);
  g.closePath();
  g.fillPath();

  // --- Belly highlight ---
  g.fillStyle(0xffffff, 0.15);
  g.fillEllipse(cx, y + h * 0.6, 10, h * 0.35);

  // --- Body segments ---
  g.lineStyle(0.7, 0x000000, 0.12);
  for (let i = 1; i <= 3; i++) {
    const segY = y + h * 0.35 + i * (h * 0.14);
    g.beginPath();
    g.moveTo(cx - 5, segY);
    g.lineTo(cx + 5, segY);
    g.strokePath();
  }

  // --- Team headband ---
  g.fillStyle(0xffffff, 0.45);
  g.fillRoundedRect(cx - 6, y + 3, 12, 2.5, 1);

  // --- Eyes ---
  const eyeX = cx + dir * 1;
  const eyeY = y + 6;

  g.fillStyle(0xffffff, 1);
  g.fillEllipse(eyeX - 2, eyeY, 4.5, 5);
  g.fillEllipse(eyeX + 2, eyeY, 4.5, 5);

  const po = dir * 0.7;
  g.fillStyle(0x111111, 1);
  g.fillCircle(eyeX - 2 + po, eyeY + 0.3, 1.8);
  g.fillCircle(eyeX + 2 + po, eyeY + 0.3, 1.8);

  g.fillStyle(0xffffff, 1);
  g.fillCircle(eyeX - 2 + po + 0.4, eyeY - 0.5, 0.6);
  g.fillCircle(eyeX + 2 + po + 0.4, eyeY - 0.5, 0.6);

  // --- Cheeky grin ---
  g.lineStyle(1, 0x000000, 0.55);
  g.beginPath();
  g.arc(cx + dir * 0.5, y + 11, 3, 0.2, Math.PI - 0.2, false);
  g.strokePath();
};
