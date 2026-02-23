import type { CharacterDrawFn } from './types';

export const drawBananaSam: CharacterDrawFn = (g, x, y, w, h, facingRight, _teamColor) => {
  const cx = x + w / 2;
  const dir = facingRight ? 1 : -1;

  // --- Legs (noodle legs with boots, behind body) ---
  g.fillStyle(0xc8a832, 1);
  g.beginPath();
  g.moveTo(cx + dir * 2, y + h - 4);
  g.lineTo(cx + dir * 5, y + h);
  g.lineTo(cx + dir * 7, y + h);
  g.lineTo(cx + dir * 5, y + h - 4);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(cx - dir * 1, y + h - 3);
  g.lineTo(cx - dir * 3, y + h);
  g.lineTo(cx - dir * 5, y + h);
  g.lineTo(cx - dir * 3, y + h - 3);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x8b7355, 1);
  g.fillRoundedRect(cx + dir * 5, y + h - 2, dir * 3, 2, 1);
  g.fillRoundedRect(cx - dir * 5, y + h - 2, dir * -3, 2, 1);

  // --- Arms (noodle sticks) ---
  g.lineStyle(2, 0xc8a832, 1);
  g.beginPath();
  g.moveTo(cx + dir * 6, y + h * 0.4);
  g.lineTo(cx + dir * 10, y + h * 0.32);
  g.lineTo(cx + dir * 12, y + h * 0.38);
  g.strokePath();
  g.fillStyle(0xc8a832, 1);
  g.fillCircle(cx + dir * 12, y + h * 0.38, 1.5);
  g.lineStyle(2, 0xc8a832, 1);
  g.beginPath();
  g.moveTo(cx - dir * 6, y + h * 0.45);
  g.lineTo(cx - dir * 9, y + h * 0.55);
  g.strokePath();
  g.fillStyle(0xc8a832, 1);
  g.fillCircle(cx - dir * 9, y + h * 0.55, 1.5);

  // --- Banana body — fills hitbox, crescent curve ---
  g.fillStyle(0xf5c842, 1);
  g.beginPath();
  const curve = dir * 2.5;
  g.moveTo(cx - 7, y + h - 3);
  g.lineTo(cx - 7 + curve * 0.3, y + h * 0.5);
  g.lineTo(cx - 6 + curve * 0.4, y + h * 0.3);
  g.lineTo(cx - 4, y + 4);
  g.lineTo(cx, y + 2);
  g.lineTo(cx + 4, y + 4);
  g.lineTo(cx + 6 - curve * 0.4, y + h * 0.3);
  g.lineTo(cx + 7 - curve * 0.3, y + h * 0.5);
  g.lineTo(cx + 7, y + h - 3);
  g.closePath();
  g.fillPath();

  // Lighter belly
  g.fillStyle(0xfce878, 0.45);
  g.fillEllipse(cx - dir * 0.5, y + h * 0.5, 8, h * 0.3);

  // Ridge lines
  g.lineStyle(0.7, 0xd4a017, 0.4);
  g.beginPath();
  g.moveTo(cx - 3 + curve * 0.2, y + 6);
  g.lineTo(cx - 3.5 + curve * 0.35, y + h * 0.7);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 3 - curve * 0.2, y + 6);
  g.lineTo(cx + 3.5 - curve * 0.35, y + h * 0.7);
  g.strokePath();

  // --- Stem ---
  g.fillStyle(0x8b6914, 1);
  g.beginPath();
  g.moveTo(cx - 1.5, y + 2);
  g.lineTo(cx, y - 3);
  g.lineTo(cx + 1.5, y + 2);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x6b4f12, 1);
  g.fillCircle(cx, y - 3, 1.2);

  // --- Helmet / cap ---
  g.fillStyle(0x8b7355, 1);
  g.beginPath();
  g.moveTo(cx - 6, y + 3);
  g.lineTo(cx - 5, y);
  g.lineTo(cx + 5, y);
  g.lineTo(cx + 6, y + 3);
  g.lineTo(cx + dir * 8, y + 4);
  g.lineTo(cx - dir * 4, y + 4);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xa08060, 0.5);
  g.fillEllipse(cx, y + 1, 9, 3);

  // --- Eyes — big worried ovals ---
  const eyeBaseX = cx + dir * 0.5;
  const eyeY = y + 7;
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(eyeBaseX - 2.5, eyeY, 5, 6);
  g.fillEllipse(eyeBaseX + 2.5, eyeY, 5, 6);

  const po = dir * 0.5;
  g.fillStyle(0x222222, 1);
  g.fillCircle(eyeBaseX - 2.5 + po, eyeY + 0.5, 1.8);
  g.fillCircle(eyeBaseX + 2.5 + po, eyeY + 0.5, 1.8);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(eyeBaseX - 2.5 + po + 0.4, eyeY - 0.3, 0.6);
  g.fillCircle(eyeBaseX + 2.5 + po + 0.4, eyeY - 0.3, 0.6);

  // Worried eyebrows
  g.lineStyle(1.5, 0x5a3e1b, 1);
  g.beginPath();
  g.moveTo(eyeBaseX - 5, eyeY - 4.5);
  g.lineTo(eyeBaseX - 1, eyeY - 3);
  g.strokePath();
  g.beginPath();
  g.moveTo(eyeBaseX + 5, eyeY - 4.5);
  g.lineTo(eyeBaseX + 1, eyeY - 3);
  g.strokePath();

  // Sweat drops
  g.fillStyle(0x88ccff, 0.7);
  g.fillEllipse(cx + dir * 7, eyeY - 2, 1.2, 2);
  g.fillEllipse(cx + dir * 6, eyeY - 5, 1, 1.5);

  // Worried mouth
  g.lineStyle(1, 0x5a3e1b, 1);
  g.beginPath();
  g.arc(cx + dir * 0.5, y + 14, 2.5, Math.PI + 0.3, -0.3, false);
  g.strokePath();

  // Team color armband
  g.fillStyle(_teamColor, 0.85);
  g.fillRoundedRect(cx + dir * 4, y + h * 0.38, 3, 2.5, 1);
};
