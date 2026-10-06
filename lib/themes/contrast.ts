/** WCAG relative-luminance contrast between two #rrggbb colours. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

import type { ThemeColors } from "./types";

/** The pairs that carry information, with the minimum ratio each needs. */
export const CONTRAST_RULES: { fg: keyof ThemeColors; bg: keyof ThemeColors; min: number; label: string }[] = [
  { fg: "ink", bg: "background", min: 4.5, label: "Text on background" },
  { fg: "ink", bg: "surface", min: 4.5, label: "Text on cards" },
  { fg: "muted", bg: "surface", min: 4.5, label: "Soft text on cards" },
  { fg: "accentInk", bg: "accent", min: 4.5, label: "Button text" },
  { fg: "winInk", bg: "highlight", min: 4.5, label: "Winning cells" },
  { fg: "playerOne", bg: "cell", min: 3, label: "Player 1 symbol" },
  { fg: "playerTwo", bg: "cell", min: 3, label: "Player 2 symbol" },
];

export function contrastProblems(colors: ThemeColors): string[] {
  return CONTRAST_RULES.filter((r) => contrastRatio(colors[r.fg], colors[r.bg]) < r.min).map(
    (r) => `${r.label}: ${contrastRatio(colors[r.fg], colors[r.bg]).toFixed(2)} (needs ${r.min})`,
  );
}
