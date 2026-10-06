/**
 * Central configuration. Everything the owner can change lives here, so no
 * component hard-codes names, images, symbols or theme values. All of it is
 * plain JSON so it can move to a Supabase row later without reshaping.
 */
import type { PlayerId } from "../game/types";

/* ---------- Images ---------- */

export type FitMode = "cover" | "contain";
export type AspectRatio = "auto" | "1/1" | "4/5" | "3/4" | "2/3" | "16/9" | "9/16" | "21/9" | "4/1" | "8/5";
export type MaskStyle = "none" | "soft-edge" | "vignette" | "fade-bottom" | "fade-top" | "fade-sides" | "circle" | "blob";
export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "soft-light"
  | "luminosity"
  | "lighten"
  | "darken";
export type FrameStyle = "none" | "panel" | "polaroid" | "glow" | "pearl" | "ink";

/** How one image sits inside the game. Every control here is editable in Image Studio. */
export interface ImagePresentation {
  fit: FitMode;
  /** Focal point / object position, 0–100. */
  focalX: number;
  focalY: number;
  /** Crop by zooming toward the focal point, 1–3. */
  zoom: number;
  aspect: AspectRatio;
  /** Corner radius in px. */
  radius: number;
  opacity: number;
  /** "theme" uses the active theme's background colour. */
  overlayColor: string;
  overlayOpacity: number;
  mask: MaskStyle;
  blur: number;
  shadow: number;
  blend: BlendMode;
  saturation: number;
  /** Controlled rotation in degrees, -20 to 20. */
  rotate: number;
  /** Blend the image into the active theme (tint, blend mode, frame defaults). */
  integrate: boolean;
  /** "theme" uses the active theme's frame. */
  frame: FrameStyle | "theme";
}

export interface SlotAssignment {
  assetId: string | null;
  presentation: ImagePresentation;
}

/* ---------- Symbols ---------- */

export type GlyphId = "x" | "o" | "moon" | "star" | "heart" | "pearl" | "blossom" | "rose" | "hamster" | "planet";

export type SymbolConfig =
  | { kind: "glyph"; glyph: GlyphId }
  | { kind: "emoji"; emoji: string }
  /** Uses the image in this slot (3 = player 1 symbol, 4 = player 2 symbol by default). */
  | { kind: "image"; slot: number };

export interface PlayerConfig {
  name: string;
  turnText: string;
  winText: string;
  symbol: SymbolConfig;
}

/* ---------- Themes ---------- */

import type { ThemeId, ThemeOverride } from "../themes/types";
export type { ThemeId, ThemeOverride } from "../themes/types";

export interface ThemeSelection {
  /** The owner's default theme. */
  presetId: ThemeId;
  /** Owner tweaks per theme, kept when switching back and forth. */
  overrides: Partial<Record<ThemeId, ThemeOverride>>;
  /** Themes the player may choose from (the default is always included). */
  enabled: ThemeId[];
  /** Whether the player can pick a theme on the game screen. */
  playerChoice: boolean;
}

/* ---------- Reactions ---------- */

export interface ReactionConfig {
  randomize: boolean;
  /** Slot numbers that can be drawn for each outcome. Player-specific victory/defeat slots are always included when filled. */
  pools: { win: number[]; loss: number[]; draw: number[] };
  captions: { win: string[]; loss: string[]; draw: string[] };
  drawStatus: string;
  showLoserReaction: boolean;
  moments: {
    perfectVictory: string;
    closeMatch: string;
    winningStreak: string;
    losingStreak: string;
    specialCelebration: string;
    secret: string;
    rematch: string;
  };
  streakThreshold: number;
  celebrateEvery: number;
  /** 0–1 chance of the secret reaction when slot 50 has artwork. */
  secretChance: number;
}

/* ---------- Modes ---------- */

export interface ComicConfig {
  enabled: boolean;
  speechBubbles: boolean;
  chapterTransitions: boolean;
  /** Supports {round}. */
  chapterTitle: string;
  resultPanels: boolean;
  soundEffects: boolean;
  sfxWords: string[];
  halftone: boolean;
}

export interface HamsterConfig {
  enabled: boolean;
  symbols: boolean;
  avatars: boolean;
  reactions: boolean;
  decorations: boolean;
}

export interface SpaceConfig {
  enabled: boolean;
  stars: boolean;
  nebula: boolean;
  planets: boolean;
  moon: boolean;
  constellations: boolean;
  shootingStars: boolean;
  particles: boolean;
  symbols: boolean;
  reactionEffects: boolean;
}

export interface IdentityConfig {
  gameName: string;
  subtitle: string;
  footer: string;
  logoAssetId: string | null;
  logoPresentation: ImagePresentation;
  artworkAssetId: string | null;
  artworkPresentation: ImagePresentation;
}

export type MotionLevel = "full" | "subtle" | "off";

export interface GameConfig {
  schemaVersion: 1;
  identity: IdentityConfig;
  players: Record<PlayerId, PlayerConfig>;
  /** When true, each theme's own symbols are used; when false, the symbols set in Symbol Studio. */
  symbols: { followTheme: boolean };
  theme: ThemeSelection;
  /** Keys "1"–"50". */
  slots: Record<string, SlotAssignment>;
  reactions: ReactionConfig;
  comic: ComicConfig;
  hamster: HamsterConfig;
  space: SpaceConfig;
  event: { enabled: boolean; caption: string };
  animations: { level: MotionLevel };
}
