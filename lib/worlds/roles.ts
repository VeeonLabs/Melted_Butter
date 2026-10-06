import { BASE_PRESENTATION, defaultPresentationFor } from "../config/slots";
import type { ImagePresentation } from "../config/types";

/**
 * The 24 artwork roles every world can fill. Roles that correspond to one of
 * the 50 global slots override that slot only while this world is active, so
 * the reaction engine, avatars and moments keep working unchanged.
 */
export type RoleGroup = "backgrounds" | "identity" | "board" | "players" | "results" | "moments";
export type Device = "desktop" | "tablet" | "mobile";

export interface WorldRole {
  id: RoleId;
  label: string;
  group: RoleGroup;
  /** Recommended size in px (guidance, not validation). */
  size: [number, number];
  /** Global slot this role stands in for inside its world. */
  slot?: number;
  use: string;
}

export const ROLE_IDS = [
  "bg-desktop",
  "bg-tablet",
  "bg-mobile",
  "preview",
  "banner",
  "board",
  "p1-avatar",
  "p2-avatar",
  "p1-symbol",
  "p2-symbol",
  "cell-empty",
  "cell-p1",
  "cell-p2",
  "win-overlay",
  "draw-overlay",
  "lose-overlay",
  "p1-win",
  "p2-win",
  "p1-loss",
  "p2-loss",
  "draw",
  "special-1",
  "special-2",
  "special-3",
] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const ROLE_GROUPS: { id: RoleGroup; title: string }[] = [
  { id: "backgrounds", title: "Main backgrounds" },
  { id: "identity", title: "World identity" },
  { id: "board", title: "Board & cells" },
  { id: "players", title: "Players" },
  { id: "results", title: "Results & reactions" },
  { id: "moments", title: "Special moments" },
];

export const WORLD_ROLES: readonly WorldRole[] = [
  { id: "bg-desktop", label: "Main background — Desktop", group: "backgrounds", size: [1920, 1080], use: "Full-bleed behind the game on wide screens" },
  { id: "bg-tablet", label: "Main background — Tablet", group: "backgrounds", size: [1366, 1024], use: "Full-bleed behind the game on tablets" },
  { id: "bg-mobile", label: "Main background — Mobile", group: "backgrounds", size: [1080, 1920], use: "Full-bleed behind the game on phones" },
  { id: "preview", label: "World selector preview", group: "identity", size: [400, 250], use: "The card in the player's world picker" },
  { id: "banner", label: "World header banner", group: "identity", size: [1200, 300], use: "Above the title" },
  { id: "board", label: "Board backdrop", group: "board", size: [800, 800], use: "Behind the cells, inside the board" },
  { id: "cell-empty", label: "Empty cell style", group: "board", size: [512, 512], use: "Every empty cell" },
  { id: "cell-p1", label: "Player 1 cell style", group: "board", size: [512, 512], use: "Cells Player 1 has taken" },
  { id: "cell-p2", label: "Player 2 cell style", group: "board", size: [512, 512], use: "Cells Player 2 has taken" },
  { id: "p1-avatar", label: "Player 1 avatar", group: "players", size: [512, 512], slot: 1, use: "Player 1's card" },
  { id: "p2-avatar", label: "Player 2 avatar", group: "players", size: [512, 512], slot: 2, use: "Player 2's card" },
  { id: "p1-symbol", label: "Player 1 symbol artwork", group: "players", size: [512, 512], slot: 3, use: "Player 1's mark on the board" },
  { id: "p2-symbol", label: "Player 2 symbol artwork", group: "players", size: [512, 512], slot: 4, use: "Player 2's mark on the board" },
  { id: "win-overlay", label: "Win overlay", group: "results", size: [512, 512], use: "Washes the winner's card when a round ends" },
  { id: "lose-overlay", label: "Lose overlay", group: "results", size: [512, 512], use: "Washes the other card when a round ends" },
  { id: "draw-overlay", label: "Draw overlay", group: "results", size: [512, 512], use: "Washes both cards after a draw" },
  { id: "p1-win", label: "Player 1 win reaction", group: "results", size: [800, 400], slot: 11, use: "Result when Player 1 wins" },
  { id: "p2-win", label: "Player 2 win reaction", group: "results", size: [800, 400], slot: 12, use: "Result when Player 2 wins" },
  { id: "p1-loss", label: "Player 1 lose reaction", group: "results", size: [800, 400], slot: 13, use: "Result when Player 1 loses" },
  { id: "p2-loss", label: "Player 2 lose reaction", group: "results", size: [800, 400], slot: 14, use: "Result when Player 2 loses" },
  { id: "draw", label: "Draw reaction", group: "results", size: [800, 400], slot: 20, use: "Result after a draw" },
  { id: "special-1", label: "Special moment 1 — perfect game", group: "moments", size: [800, 400], slot: 44, use: "Winner used only three moves" },
  { id: "special-2", label: "Special moment 2 — winning streak", group: "moments", size: [800, 400], slot: 42, use: "Winner reaches the streak threshold" },
  { id: "special-3", label: "Special moment 3 — celebration", group: "moments", size: [800, 400], slot: 47, use: "Every few wins" },
];

export const ROLE_BY_ID = Object.fromEntries(WORLD_ROLES.map((r) => [r.id, r])) as Record<RoleId, WorldRole>;
export const ROLE_FOR_SLOT: Record<number, RoleId> = Object.fromEntries(
  WORLD_ROLES.filter((r) => r.slot).map((r) => [r.slot!, r.id]),
);
export const BACKGROUND_ROLE: Record<Device, RoleId> = { desktop: "bg-desktop", tablet: "bg-tablet", mobile: "bg-mobile" };

/**
 * Device bucket from the scene's measured size. Shape matters: a 1366×1024
 * tablet is as wide as a laptop but much squarer (anything under 3:2 is tablet).
 */
export function deviceFor(width: number, height: number = width / 1.78): Device {
  if (width < 700) return "mobile";
  if (width < 1100 || width / Math.max(1, height) < 1.5) return "tablet";
  return "desktop";
}

/** The asked-for device first, then desktop → tablet → mobile for anything missing. */
export function backgroundFallbackOrder(device: Device): RoleId[] {
  const order: Device[] = [device, ...(["desktop", "tablet", "mobile"] as const).filter((d) => d !== device)];
  return order.map((d) => BACKGROUND_ROLE[d]);
}

export function defaultRolePresentation(role: RoleId): ImagePresentation {
  const r = ROLE_BY_ID[role];
  if (r.slot) return defaultPresentationFor(r.slot);
  const plain = { ...BASE_PRESENTATION, integrate: false, frame: "none" as const, shadow: 0, radius: 0, mask: "none" as const };
  switch (r.group) {
    case "backgrounds":
      return plain;
    case "identity":
      return role === "banner" ? { ...plain, aspect: "4/1" as const, radius: 18, mask: "fade-sides" as const } : { ...plain, radius: 12 };
    case "board":
      return role === "board" ? { ...plain, opacity: 0.85 } : { ...plain, opacity: 0.9 };
    case "results":
      return { ...plain, opacity: 0.4, blend: "soft-light" as const };
    default:
      return defaultPresentationFor(44);
  }
}

/** How far an uploaded image's shape is from the recommendation (0 = same aspect). */
export function aspectMismatch(role: RoleId, width: number, height: number): number {
  const [w, h] = ROLE_BY_ID[role].size;
  return Math.abs(Math.log(width / height / (w / h)));
}
