import type { SymbolConfig } from "../config/types";
import type { ArtPiece, ThemeEffects, ThemePackage } from "./types";

export const NO_EFFECTS: ThemeEffects = {
  stars: false,
  nebula: false,
  planets: false,
  moon: false,
  constellations: false,
  shootingStars: false,
  sparkles: false,
  petals: "none",
  bubbles: false,
  pearls: false,
  halftone: false,
  speedLines: false,
  hamsters: false,
};

export const glyph = (g: Extract<SymbolConfig, { kind: "glyph" }>["glyph"]): SymbolConfig => ({ kind: "glyph", glyph: g });
export const emoji = (e: string): SymbolConfig => ({ kind: "emoji", emoji: e });

/** Art piece with sensible defaults; themes state only what's specific. */
export function art(
  id: string,
  label: string,
  motif: ArtPiece["motif"],
  anchor: ArtPiece["anchor"],
  o: Partial<Omit<ArtPiece, "id" | "label" | "motif" | "anchor">> = {},
): ArtPiece {
  return { id, label, motif, anchor, size: 8, rotate: 0, x: 0, y: 0, layer: "back", opacity: 1, tint: "accent", mobile: "shrink", ...o };
}

type Spec = Pick<ThemePackage, "id" | "colors"> & {
  identity: Omit<ThemePackage["identity"], "kind"> & { kind?: ThemePackage["identity"]["kind"] };
} & {
  [K in Exclude<keyof ThemePackage, "id" | "identity" | "colors" | "effects" | "artwork">]?: Partial<ThemePackage[K]>;
} & { effects?: Partial<ThemeEffects>; artwork: Partial<ThemePackage["artwork"]> & { pieces: ArtPiece[] } };

/** Fills shared defaults, so each theme file only describes what makes it different. */
export function defineTheme(spec: Spec): ThemePackage {
  const dark = spec.identity.mood === "dark";
  return {
    id: spec.id,
    identity: { kind: "general", ...spec.identity },
    colors: spec.colors,
    typography: { display: "elegant", title: "plain", subtitle: "italic", ...spec.typography },
    surfaces: { card: dark ? "glass" : "paper", button: "pill", texture: "none", radius: 20, ...spec.surfaces },
    players: { layout: "stack", card: "portrait", ...spec.players },
    board: { style: "soft", frame: "none", cellRadius: 16, cellBorder: 0, tilt: 0, ...spec.board },
    symbols: { suggested: [glyph("x"), glyph("o")], treatment: "plain", ...spec.symbols },
    artwork: { imageBlend: { blend: "normal", overlayOpacity: 0.12, frame: "none" }, ...spec.artwork },
    background: { slot: 31, recipe: "radial-top", ...spec.background },
    effects: { ...NO_EFFECTS, ...spec.effects },
    reactions: { style: "bubble", flourish: "sparkle", ...spec.reactions },
    chapters: { style: "title-card", ...spec.chapters },
    chat: { bubble: "round", sticker: "circle", ...spec.chat },
    motion: { personality: "calm", ...spec.motion },
    sound: { profile: "soft", ...spec.sound },
    specialMoments: { narration: "banner", ...spec.specialMoments },
    collage: { mode: spec.identity.kind === "comic" ? "full" : "light", accents: ["sparkles", "tape"], ...spec.collage },
  };
}
