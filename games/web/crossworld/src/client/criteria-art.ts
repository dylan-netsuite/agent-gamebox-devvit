const dot = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="2.5" fill="currentColor"/>`;
const letters = (text: string) =>
  `<text x="18" y="24" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui,sans-serif" font-size="23" font-weight="500">${text}</text>`;
const slash = '<path d="M7 29 29 7" stroke-width="2"/>';
const icons: Record<string, string> = {
  brief: [dot(11, 12), dot(25, 12), dot(11, 25), dot(25, 25)].join(""),
  seven: [
    dot(9, 9),
    dot(18, 9),
    dot(27, 9),
    dot(9, 18),
    dot(18, 18),
    dot(27, 18),
    dot(18, 27),
  ].join(""),
  "no-e": letters("E") + slash,
  "no-articles":
    '<text x="18" y="12" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui,sans-serif" font-size="9">A · AN</text><text x="18" y="26" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui,sans-serif" font-size="11">THE</text>' +
    slash,
  "short-words":
    '<rect x="3" y="10" width="6" height="16" rx="2"/><rect x="11" y="10" width="6" height="16" rx="2"/><rect x="19" y="10" width="6" height="16" rx="2"/><rect x="27" y="10" width="6" height="16" rx="2"/>',
  "same-start":
    '<text x="18" y="25" text-anchor="middle" fill="currentColor" stroke="none" font-family="Georgia,serif" font-size="24">Aa</text><path d="M7 30h22"/>',
  "no-b": letters("B") + slash,
  "two-breaths": [dot(13, 18), dot(23, 18)].join(""),
  "half-measure":
    '<path d="M5 18h26M5 14v8M31 14v8"/><path d="M18 9v18" stroke-dasharray="3 3"/>',
  "long-shadow":
    '<rect x="3" y="14" width="30" height="8" rx="4"/><path d="M8 26h22" opacity=".45"/>',
  // One tick per answer letter, with the clue's word count matching beneath.
  "mirror-length":
    '<path d="M7 11v6M13 11v6M19 11v6M25 11v6M31 11v6"/><path d="M7 25h24"/>',
  "shared-initial":
    letters("A") + '<path d="M6 30h24" stroke-dasharray="4 3"/>',
  // Two clues passing a word between them.
  echo: '<path d="M5 13h13M18 23H31"/><path d="M15 9l4 4-4 4M21 19l-4 4 4 4"/>',
  "fresh-words":
    '<path d="M18 6v10M18 22v8"/><circle cx="18" cy="19" r="3"/>' +
    '<path d="M8 12a13 13 0 0 0 0 12M28 12a13 13 0 0 1 0 12" opacity=".45"/>',
  ask: letters("?"),
  "count-me-in":
    '<text x="18" y="25" text-anchor="middle" fill="currentColor" stroke="none" font-family="system-ui,sans-serif" font-size="20" font-weight="500">1-10</text>',
  "twin-endings":
    '<path d="M4 14h14M4 22h14"/><circle cx="24" cy="14" r="3.5"/><circle cx="24" cy="22" r="3.5"/>',
  "double-trouble":
    '<text x="18" y="25" text-anchor="middle" fill="currentColor" stroke="none" font-family="Georgia,serif" font-size="22">LL</text>',
};
export const criterionIcon = (id: string) =>
  `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${icons[id] ?? '<path d="M18 5v26M5 18h26M9 9l18 18M9 27 27 9"/>'}</svg>`;
