import { CRITERIA } from "../shared/shore";
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
};
export const criterionIcon = (id: string) =>
  `<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${icons[id] ?? '<path d="M18 5v26M5 18h26M9 9l18 18M9 27 27 9"/>'}</svg>`;
export const visualCriteria = CRITERIA.map((rule, i) => ({
  ...rule,
  label: [
    "Up to 4 words",
    "7 words",
    "No E",
    "No articles",
    "Short words",
    "Same initials",
    "No B",
  ][i]!,
}));
