import { DEFAULT_THEME, THEMES, THEME_ORDER } from "../themes/registry";
import type { FontKey, MotionPersonality, ResolvedTheme, ThemeEffects, ThemeId } from "../themes/types";
import { ROLE_BY_ID, type RoleId } from "../worlds/roles";
import { defaultPresentationFor, getSlotDefinition } from "./slots";
import type { StatusInfo } from "../game/gameLogic";
import type { PlayerId } from "../game/types";
import type { GameConfig, SlotAssignment, SymbolConfig } from "./types";

/** A theme package with the owner's overrides for it applied. */
export function resolveTheme(config: GameConfig, themeId?: ThemeId): ResolvedTheme {
  const pkg = THEMES[themeId ?? config.theme.presetId] ?? THEMES[DEFAULT_THEME];
  const o = config.theme.overrides[pkg.id] ?? {};
  return {
    ...pkg,
    colors: { ...pkg.colors, ...o.colors },
    typography: { ...pkg.typography, ...o.typography },
    surfaces: { ...pkg.surfaces, ...o.surfaces },
    players: { ...pkg.players, ...o.players },
    board: { ...pkg.board, ...o.board },
    background: { ...pkg.background, ...o.background },
    symbols: { ...pkg.symbols, ...o.symbols },
    reactions: { ...pkg.reactions, ...o.reactions },
    chapters: { ...pkg.chapters, ...o.chapters },
    chat: { ...pkg.chat, ...o.chat },
    motion: { ...pkg.motion, ...o.motion },
    sound: { ...pkg.sound, ...o.sound },
    specialMoments: { ...pkg.specialMoments, ...o.specialMoments },
    collage: { ...pkg.collage, mode: o.collage?.mode ?? pkg.collage.mode, pieces: o.collage?.pieces ?? [] },
    roles: o.roles ?? {},
    effects: { ...pkg.effects, ...o.effects },
    artwork: {
      imageBlend: pkg.artwork.imageBlend,
      pieces: pkg.artwork.pieces.map((piece) => {
        const a = o.art?.[piece.id] ?? {};
        return {
          ...piece,
          size: a.size ?? piece.size,
          rotate: a.rotate ?? piece.rotate,
          x: a.x ?? piece.x,
          y: a.y ?? piece.y,
          assetId: a.assetId ?? null,
          presentation: a.presentation ?? null,
          alt: a.alt?.trim() || piece.label,
          hidden: a.hidden ?? false,
        };
      }),
    },
    frontendArtwork: o.frontendArtwork ?? {},
  };
}

/** Themes the player may pick, in display order. The default is always included. */
export function enabledThemes(config: GameConfig): ThemeId[] {
  const on = new Set<ThemeId>([...config.theme.enabled, config.theme.presetId]);
  return THEME_ORDER.filter((id) => on.has(id));
}

/** The theme the player actually sees: their own pick when allowed and enabled, otherwise the owner's default. */
export function effectiveThemeId(config: GameConfig, playerPick: ThemeId | null | undefined): ThemeId {
  if (config.theme.playerChoice && playerPick && enabledThemes(config).includes(playerPick)) return playerPick;
  return config.theme.presetId;
}

/** Theme effects plus whatever Space / Hamster / Comic Mode switch on. */
export function resolveEffects(theme: ResolvedTheme, config: GameConfig): ThemeEffects {
  const e = { ...theme.effects };
  if (config.space.enabled) {
    e.stars ||= config.space.stars;
    e.nebula ||= config.space.nebula;
    e.planets ||= config.space.planets;
    e.moon ||= config.space.moon;
    e.constellations ||= config.space.constellations;
    e.shootingStars ||= config.space.shootingStars;
    e.sparkles ||= config.space.particles;
  }
  if (config.hamster.enabled && config.hamster.decorations) e.hamsters = true;
  if (config.comic.enabled && config.comic.halftone) e.halftone = true;
  return e;
}

export const FONT_VARS: Record<FontKey, string> = {
  elegant: "var(--font-elegant-face), ui-serif, Georgia, serif",
  editorial: "var(--font-editorial-face), ui-serif, Georgia, serif",
  storybook: "var(--font-storybook-face), ui-serif, Georgia, serif",
  modern: "var(--font-modern-face), ui-sans-serif, system-ui, sans-serif",
  comic: "var(--font-comic-face), Impact, 'Arial Black', sans-serif",
  marker: "var(--font-marker-face), 'Comic Sans MS', ui-rounded, sans-serif",
  hand: "var(--font-hand-face), 'Segoe Print', ui-rounded, cursive",
  cute: "var(--font-cute-face), ui-rounded, ui-serif, Georgia, serif",
};

const MOTION_VARS: Record<MotionPersonality, { ease: string; speed: string }> = {
  calm: { ease: "cubic-bezier(0.4, 0, 0.2, 1)", speed: "1.15" },
  floaty: { ease: "cubic-bezier(0.3, 0.8, 0.4, 1)", speed: "1.35" },
  bouncy: { ease: "cubic-bezier(0.2, 1.5, 0.4, 1)", speed: "1" },
  snappy: { ease: "cubic-bezier(0.2, 0.9, 0.3, 1)", speed: "0.75" },
  dramatic: { ease: "cubic-bezier(0.7, 0, 0.2, 1)", speed: "1.4" },
};

export function themeStyleVars(theme: ResolvedTheme): Record<string, string> {
  const c = theme.colors;
  const m = MOTION_VARS[theme.motion.personality];
  return {
    "--mb-bg": c.background,
    "--mb-bg-alt": c.backgroundAlt,
    "--mb-surface": c.surface,
    "--mb-ink": c.ink,
    "--mb-muted": c.muted,
    "--mb-accent": c.accent,
    "--mb-accent-ink": c.accentInk,
    "--mb-p1": c.playerOne,
    "--mb-p2": c.playerTwo,
    "--mb-board": c.board,
    "--mb-cell": c.cell,
    "--mb-line": c.line,
    "--mb-highlight": c.highlight,
    "--mb-win-ink": c.winInk,
    "--mb-card-radius": `${theme.surfaces.radius}px`,
    "--mb-cell-radius": `${Math.min(theme.board.cellRadius, 999)}px`,
    "--mb-cell-border": `${theme.board.cellBorder}px`,
    "--mb-board-tilt": `${theme.board.tilt}deg`,
    "--mb-font-display": FONT_VARS[theme.typography.display],
    "--mb-ease": m.ease,
    "--mb-speed": m.speed,
  };
}

/** Data attributes the shared CSS primitives key off. Same names everywhere: stage, previews, thumbnails. */
export function themeDataAttrs(theme: ResolvedTheme): Record<string, string> {
  return {
    "data-theme": theme.id,
    "data-mood": theme.identity.mood,
    "data-font": theme.typography.display,
    "data-title": theme.typography.title,
    "data-subtitle": theme.typography.subtitle,
    "data-card": theme.surfaces.card,
    "data-button": theme.surfaces.button,
    "data-texture": theme.surfaces.texture,
    "data-bg": theme.background.recipe,
    "data-layout": theme.players.layout,
    "data-player-card": theme.players.card,
    "data-board": theme.board.style,
    "data-board-frame": theme.board.frame,
    "data-symbol": theme.symbols.treatment,
    "data-reaction": theme.reactions.style,
    "data-chapter": theme.chapters.style,
    "data-bubble": theme.chat.bubble,
    "data-sticker": theme.chat.sticker,
    "data-motion-personality": theme.motion.personality,
    "data-narration": theme.specialMoments.narration,
  };
}

export function getSlot(config: GameConfig, slot: number): SlotAssignment {
  return config.slots[String(slot)] ?? { assetId: null, presentation: defaultPresentationFor(slot) };
}

/** Asset id in a slot, ignoring ids whose asset no longer exists. */
export function slotAsset(config: GameConfig, slot: number, hasAsset: (id: string) => boolean): string | null {
  const id = getSlot(config, slot).assetId;
  return id && hasAsset(id) ? id : null;
}

/** Every slot an asset is assigned to (identity uses included), for the library and delete warnings. */
export function assetUsage(config: GameConfig, assetId: string): string[] {
  const uses: string[] = [];
  for (const [key, slot] of Object.entries(config.slots)) {
    if (slot.assetId === assetId) uses.push(`Slot ${key} · ${getSlotDefinition(Number(key))?.label ?? ""}`);
  }
  if (config.identity.logoAssetId === assetId) uses.push("Game logo");
  if (config.identity.artworkAssetId === assetId) uses.push("Main artwork");
  for (const [id, o] of Object.entries(config.theme.overrides)) {
    for (const [pieceId, a] of Object.entries(o?.art ?? {})) {
      if (a.assetId !== assetId) continue;
      const theme = THEMES[id as ThemeId];
      const label = theme?.artwork.pieces.find((p) => p.id === pieceId)?.label ?? pieceId;
      uses.push(`${theme?.identity.name ?? id} artwork · ${label}`);
    }
    const name = THEMES[id as ThemeId]?.identity.name ?? id;
    for (const [slot, a] of Object.entries(o?.frontendArtwork ?? {})) {
      if (a?.assetId === assetId) uses.push(`${name} frontend · ${slot}`);
    }
    for (const [role, a] of Object.entries(o?.roles ?? {})) {
      if (a?.assetId === assetId) uses.push(`${name} · ${ROLE_BY_ID[role as RoleId]?.label ?? role}`);
    }
    if (o?.collage?.pieces?.some((p) => p.assetId === assetId)) uses.push(`${name} · Collage`);
  }
  return uses;
}

export function statusText(config: GameConfig, info: StatusInfo): string {
  if (info.kind === "draw") return config.reactions.drawStatus;
  const p = config.players[info.player];
  return info.kind === "won" ? p.winText : p.turnText;
}

/**
 * The symbol actually drawn: Hamster / Space Mode first, then the theme's own
 * symbols (when the owner lets symbols follow the theme), then Symbol Studio.
 */
export function resolveSymbol(config: GameConfig, player: PlayerId, theme?: ResolvedTheme): SymbolConfig {
  if (config.hamster.enabled && config.hamster.symbols) return { kind: "glyph", glyph: "hamster" };
  if (config.space.enabled && config.space.symbols) {
    return { kind: "glyph", glyph: player === "PLAYER_ONE" ? "moon" : "star" };
  }
  if (theme && config.symbols.followTheme) return theme.symbols.suggested[player === "PLAYER_ONE" ? 0 : 1];
  return config.players[player].symbol;
}

export function symbolsLookAlike(a: SymbolConfig, b: SymbolConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
