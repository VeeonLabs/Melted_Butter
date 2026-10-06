import type { ThemeId, ThemePackage } from "./types";
import { anastasia } from "./packages/anastasia";
import { blossoms } from "./packages/blossoms";
import { borderline } from "./packages/borderline";
import { comic } from "./packages/comic";
import { custom } from "./packages/custom";
import { darkRomance } from "./packages/dark-romance";
import { graffiti } from "./packages/graffiti";
import { hamster } from "./packages/hamster";
import { jinx } from "./packages/jinx";
import { loveJinx } from "./packages/love-jinx";
import { lowTide } from "./packages/low-tide";
import { manhwa } from "./packages/manhwa";
import { moonlight } from "./packages/moonlight";
import { nerdProject } from "./packages/nerd-project";
import { painter } from "./packages/painter";
import { passion } from "./packages/passion";
import { pearl } from "./packages/pearl";
import { pearlBoy } from "./packages/pearl-boy";
import { roomWithoutWindows } from "./packages/room-without-windows";
import { roses } from "./packages/roses";
import { rosesChampagne } from "./packages/roses-champagne";
import { space } from "./packages/space";
import { whiteNightBlossoms } from "./packages/white-night-blossoms";

/** Display order. Adding a theme = one package file + one line here (+ its id in ThemeId). */
const ORDERED: ThemePackage[] = [
  // Comic worlds (owner-supplied comic artwork)
  pearlBoy,
  lowTide,
  rosesChampagne,
  painter,
  anastasia,
  nerdProject,
  passion,
  jinx,
  loveJinx,
  borderline,
  roomWithoutWindows,
  whiteNightBlossoms,
  // General worlds
  pearl,
  manhwa,
  comic,
  space,
  moonlight,
  roses,
  blossoms,
  hamster,
  darkRomance,
  graffiti,
  custom,
];

export const THEMES = Object.fromEntries(ORDERED.map((t) => [t.id, t])) as Record<ThemeId, ThemePackage>;
export const THEME_ORDER: readonly ThemeId[] = ORDERED.map((t) => t.id);
export const DEFAULT_THEME: ThemeId = "pearl-boy";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(THEMES, value);
}

/** Retired ids that map onto a current world (Twilight Tide merged into Low Tide in Twilight). */
export const THEME_ALIASES: Record<string, ThemeId> = { "twilight-tide": "low-tide" };

export function canonicalThemeId(value: unknown): ThemeId | null {
  if (isThemeId(value)) return value;
  return typeof value === "string" && value in THEME_ALIASES ? THEME_ALIASES[value] : null;
}
