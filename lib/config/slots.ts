import { THEMES, THEME_ORDER } from "../themes/registry";
import type { ImagePresentation } from "./types";

export const ACTIVE_SLOT_COUNT = 50;

export type SlotGroupId = "player" | "reactions" | "comic" | "backgrounds" | "moments";

export interface SlotGroup {
  id: SlotGroupId;
  title: string;
  range: [number, number];
  description: string;
}

export const SLOT_GROUPS: readonly SlotGroup[] = [
  { id: "player", title: "Player & character", range: [1, 10], description: "Avatars, image symbols and the two characters who speak in Comic Mode." },
  { id: "reactions", title: "Win & loss reactions", range: [11, 20], description: "Shown under the board when a round ends." },
  { id: "comic", title: "Comic & manhwa panels", range: [21, 30], description: "Used for chapter transitions and comic result spreads." },
  { id: "backgrounds", title: "Themes & backgrounds", range: [31, 40], description: "Each theme uses its own background slot." },
  { id: "moments", title: "Special moments", range: [41, 50], description: "Streaks, perfect wins, close matches and surprises." },
];

const LABELS: readonly string[] = [
  "Player 1 avatar",
  "Player 2 avatar",
  "Player 1 symbol",
  "Player 2 symbol",
  "Player 1 alternate avatar",
  "Player 2 alternate avatar",
  "Character A",
  "Character B",
  "Character A alternate",
  "Character B alternate",
  "Player 1 victory",
  "Player 2 victory",
  "Player 1 defeat",
  "Player 2 defeat",
  "Funny slap reaction",
  "Funny shocked reaction",
  "Facepalm reaction",
  "Victory celebration",
  "Losing reaction",
  "Draw reaction",
  "Comic panel 1",
  "Comic panel 2",
  "Comic panel 3",
  "Comic panel 4",
  "Comic panel 5",
  "Comic panel 6",
  "Comic panel 7",
  "Comic panel 8",
  "Comic panel 9",
  "Comic panel 10",
  "Main background",
  "Space background",
  "Moonlight background",
  "Rose background",
  "Pearl background",
  "Blossom background",
  "Comic background",
  "Dark theme background",
  "Hamster background",
  "Custom background",
  "Rematch",
  "Winning streak",
  "Losing streak",
  "Perfect victory",
  "Close match",
  "Last-move reaction",
  "Special celebration",
  "Loading artwork",
  "Special event artwork",
  "Secret / surprise reaction",
];

/** Where each slot shows up, so the owner knows what they're filling. */
const USES: Record<number, string> = {
  1: "Player 1 card and speech bubbles",
  2: "Player 2 card and speech bubbles",
  3: "Board symbol when Player 1 uses an image symbol",
  4: "Board symbol when Player 2 uses an image symbol",
  5: "Player 1 card while they're the winner",
  6: "Player 2 card while they're the winner",
  7: "Speaks for Player 1 in Comic Mode",
  8: "Speaks for Player 2 in Comic Mode",
  9: "Character A in comic result spreads",
  10: "Character B in comic result spreads",
  11: "Player 1 wins",
  12: "Player 2 wins",
  13: "Player 1 loses",
  14: "Player 2 loses",
  41: "Chapter card after a rematch",
  42: "Winner reaches the streak threshold",
  43: "Loser has lost that many in a row",
  44: "Winner used only three moves",
  45: "Win on the very last square",
  46: "Final panel of a comic result spread",
  47: "Every few wins (Reaction Studio)",
  48: "Loading screen",
  49: "Special event banner",
  50: "Rare surprise result",
};

function backgroundUse(slot: number): string {
  const users = THEME_ORDER.filter((id) => THEMES[id].background.slot === slot).map((id) => THEMES[id].identity.name);
  const base = slot === 31 ? "Fallback background for every theme" : "Background";
  return users.length ? `${base}; used by ${users.join(", ")}` : base;
}

export interface SlotDefinition {
  number: number;
  label: string;
  group: SlotGroupId;
  use: string;
}

export const SLOT_DEFINITIONS: readonly SlotDefinition[] = LABELS.map((label, i) => {
  const number = i + 1;
  const group = SLOT_GROUPS.find((g) => number >= g.range[0] && number <= g.range[1])!.id;
  const use =
    USES[number] ??
    (group === "reactions"
      ? "Reaction pool (Reaction Studio)"
      : group === "comic"
        ? "Chapter cards and comic spreads, in rotation"
        : group === "backgrounds"
          ? backgroundUse(number)
          : "");
  return { number, label, group, use };
});

export function getSlotDefinition(slot: number): SlotDefinition | undefined {
  return SLOT_DEFINITIONS[slot - 1];
}

export const BASE_PRESENTATION: ImagePresentation = {
  fit: "cover",
  focalX: 50,
  focalY: 50,
  zoom: 1,
  aspect: "auto",
  radius: 16,
  opacity: 1,
  overlayColor: "theme",
  overlayOpacity: 0,
  mask: "none",
  blur: 0,
  shadow: 0.3,
  blend: "normal",
  saturation: 1,
  rotate: 0,
  integrate: true,
  frame: "theme",
};

/** Starting presentation for owner images that replace a theme's built-in artwork. */
export const ART_PRESENTATION: ImagePresentation = {
  ...BASE_PRESENTATION,
  fit: "contain",
  radius: 12,
  shadow: 0.15,
  frame: "theme",
};

/** Sensible starting presentation for each kind of slot. */
export function defaultPresentationFor(slot: number): ImagePresentation {
  const group = getSlotDefinition(slot)?.group;
  if (slot <= 2 || slot === 5 || slot === 6) {
    return { ...BASE_PRESENTATION, aspect: "1/1", mask: "circle", radius: 999, shadow: 0, frame: "none" };
  }
  if (slot === 3 || slot === 4) {
    return { ...BASE_PRESENTATION, aspect: "1/1", fit: "contain", mask: "soft-edge", radius: 12, shadow: 0, frame: "none", integrate: false };
  }
  if (group === "backgrounds") {
    return { ...BASE_PRESENTATION, mask: "fade-bottom", overlayOpacity: 0.55, radius: 0, shadow: 0, frame: "none", opacity: 0.85 };
  }
  if (slot === 48 || slot === 49) {
    return { ...BASE_PRESENTATION, aspect: "16/9", mask: "vignette", overlayOpacity: 0.2, frame: "none" };
  }
  if (group === "comic") {
    return { ...BASE_PRESENTATION, aspect: "4/5", radius: 4, frame: "panel" };
  }
  return { ...BASE_PRESENTATION, aspect: "1/1", mask: "soft-edge", overlayOpacity: 0.1 };
}

export const SLOTS = {
  avatar: { PLAYER_ONE: 1, PLAYER_TWO: 2 },
  symbol: { PLAYER_ONE: 3, PLAYER_TWO: 4 },
  altAvatar: { PLAYER_ONE: 5, PLAYER_TWO: 6 },
  character: { PLAYER_ONE: 7, PLAYER_TWO: 8 },
  characterAlt: { PLAYER_ONE: 9, PLAYER_TWO: 10 },
  victory: { PLAYER_ONE: 11, PLAYER_TWO: 12 },
  defeat: { PLAYER_ONE: 13, PLAYER_TWO: 14 },
  comicPanels: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
  mainBackground: 31,
  rematch: 41,
  winningStreak: 42,
  losingStreak: 43,
  perfectVictory: 44,
  closeMatch: 45,
  lastMove: 46,
  specialCelebration: 47,
  loading: 48,
  specialEvent: 49,
  secret: 50,
} as const;
