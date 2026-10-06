import { createDefaultConfig } from "./defaults";
import * as O from "../themes/options";
import { THEMES, THEME_ORDER, canonicalThemeId } from "../themes/registry";
import { ROLE_IDS, defaultRolePresentation, type RoleId } from "../worlds/roles";
import type { ArtOverride, ThemeColors, ThemeArtworkSlotId, ThemeId, ThemeOverride } from "../themes/types";
import { ART_PRESENTATION } from "./slots";
import type { GameConfig, GlyphId, ImagePresentation, SlotAssignment, SymbolConfig, ThemeSelection } from "./types";

/**
 * Makes any stored or received config safe to use: unknown keys are dropped,
 * missing keys get defaults, enums and numbers are checked. Used for
 * localStorage today and for Supabase rows later.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeShape<T>(defaults: T, raw: unknown): T {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(raw)) return defaults;
    const sample = defaults[0];
    const ok = sample === undefined || raw.every((item) => typeof item === typeof sample);
    return (ok ? raw : defaults) as T;
  }
  if (isRecord(defaults)) {
    if (!isRecord(raw)) return defaults;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) out[key] = mergeShape(defaults[key], raw[key]);
    return out as T;
  }
  if (defaults === null) {
    return (typeof raw === "string" ? raw : null) as T;
  }
  if (typeof defaults === "number") {
    return (typeof raw === "number" && Number.isFinite(raw) ? raw : defaults) as T;
  }
  return (typeof raw === typeof defaults ? raw : defaults) as T;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const HEX = /^#[0-9a-f]{6}$/i;

export const GLYPHS: readonly GlyphId[] = ["x", "o", "moon", "star", "heart", "pearl", "blossom", "rose", "hamster", "planet"];

export function sanitizePresentation(p: ImagePresentation, fallback: ImagePresentation): ImagePresentation {
  return {
    fit: oneOf(p.fit, ["cover", "contain"], fallback.fit),
    focalX: clamp(p.focalX, 0, 100),
    focalY: clamp(p.focalY, 0, 100),
    zoom: clamp(p.zoom, 1, 3),
    aspect: oneOf(p.aspect, ["auto", "1/1", "4/5", "3/4", "2/3", "16/9", "9/16", "21/9", "4/1", "8/5"], fallback.aspect),
    radius: clamp(p.radius, 0, 999),
    opacity: clamp(p.opacity, 0, 1),
    overlayColor: p.overlayColor === "theme" || HEX.test(p.overlayColor) ? p.overlayColor : fallback.overlayColor,
    overlayOpacity: clamp(p.overlayOpacity, 0, 1),
    mask: oneOf(p.mask, ["none", "soft-edge", "vignette", "fade-bottom", "fade-top", "fade-sides", "circle", "blob"], fallback.mask),
    blur: clamp(p.blur, 0, 20),
    shadow: clamp(p.shadow, 0, 1),
    blend: oneOf(
      p.blend,
      ["normal", "multiply", "screen", "overlay", "soft-light", "luminosity", "lighten", "darken"],
      fallback.blend,
    ),
    saturation: clamp(p.saturation, 0, 2),
    rotate: clamp(typeof p.rotate === "number" ? p.rotate : 0, -20, 20),
    integrate: p.integrate,
    frame: oneOf(p.frame, ["theme", "none", "panel", "polaroid", "glow", "pearl", "ink"], fallback.frame),
  };
}

export function sanitizeSymbol(raw: unknown, fallback: SymbolConfig): SymbolConfig {
  if (!isRecord(raw)) return fallback;
  if (raw.kind === "glyph" && GLYPHS.includes(raw.glyph as GlyphId)) return { kind: "glyph", glyph: raw.glyph as GlyphId };
  if (raw.kind === "emoji" && typeof raw.emoji === "string" && raw.emoji.trim()) {
    return { kind: "emoji", emoji: Array.from(raw.emoji.trim()).slice(0, 4).join("") };
  }
  if (raw.kind === "image" && typeof raw.slot === "number" && raw.slot >= 1 && raw.slot <= 50) {
    return { kind: "image", slot: Math.round(raw.slot) };
  }
  return fallback;
}

const pick = <T extends string>(value: unknown, list: { values: readonly T[] }): T | undefined =>
  list.values.includes(value as T) ? (value as T) : undefined;

const num = (value: unknown, min: number, max: number): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : undefined;

/** Drops undefined keys so an empty section stays empty. */
function compact<T extends object>(o: T): T | undefined {
  const entries = Object.entries(o).filter(([, v]) => v !== undefined);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
}

function sanitizeArt(raw: unknown): ArtOverride | undefined {
  if (!isRecord(raw)) return undefined;
  return compact<ArtOverride>({
    assetId: typeof raw.assetId === "string" ? raw.assetId : raw.assetId === null ? null : undefined,
    presentation: isRecord(raw.presentation)
      ? sanitizePresentation(mergeShape(ART_PRESENTATION, raw.presentation), ART_PRESENTATION)
      : undefined,
    alt: typeof raw.alt === "string" ? raw.alt.slice(0, 120) : undefined,
    hidden: typeof raw.hidden === "boolean" ? raw.hidden : undefined,
    size: num(raw.size, 2, 40),
    rotate: num(raw.rotate, -30, 30),
    x: num(raw.x, -20, 20),
    y: num(raw.y, -20, 20),
  });
}

/** Accepts current overrides and the earlier flat format ({ display, boardStyle, reactionStyle }). */
export function sanitizeOverride(id: ThemeId, value: Record<string, unknown>): ThemeOverride {
  const sec = (key: string) => (isRecord(value[key]) ? (value[key] as Record<string, unknown>) : {});
  const pkg = THEMES[id];
  const o: ThemeOverride = {};

  const colors = Object.fromEntries(
    Object.entries(sec("colors")).filter(([k, c]) => k in pkg.colors && typeof c === "string" && HEX.test(c)),
  ) as Partial<ThemeColors>;
  if (Object.keys(colors).length) o.colors = colors;

  const t = sec("typography");
  o.typography = compact({
    display: pick(t.display ?? value.display, O.FONT),
    title: pick(t.title, O.TITLE),
    subtitle: pick(t.subtitle, O.SUBTITLE),
  });
  const su = sec("surfaces");
  o.surfaces = compact({
    card: pick(su.card, O.CARD),
    button: pick(su.button, O.BUTTON),
    texture: pick(su.texture, O.TEXTURE),
    radius: num(su.radius, 0, 40),
  });
  const pl = sec("players");
  o.players = compact({ layout: pick(pl.layout, O.LAYOUT), card: pick(pl.card, O.PLAYER_CARD) });
  const b = sec("board");
  o.board = compact({
    style: pick(b.style ?? value.boardStyle, O.BOARD),
    frame: pick(b.frame, O.BOARD_FRAME),
    cellRadius: num(b.cellRadius, 0, 999),
    cellBorder: num(b.cellBorder, 0, 4),
    tilt: num(b.tilt, -3, 3),
  });
  o.background = compact({ recipe: pick(sec("background").recipe, O.BACKGROUND) });
  o.symbols = compact({ treatment: pick(sec("symbols").treatment, O.SYMBOL_TREATMENT) });
  const r = sec("reactions");
  o.reactions = compact({ style: pick(r.style ?? value.reactionStyle, O.REACTION), flourish: pick(r.flourish, O.FLOURISH) });
  o.chapters = compact({ style: pick(sec("chapters").style, O.CHAPTER) });
  o.chat = compact({ bubble: pick(sec("chat").bubble, O.BUBBLE), sticker: pick(sec("chat").sticker, O.STICKER_FRAME) });
  o.motion = compact({ personality: pick(sec("motion").personality, O.MOTION) });
  o.sound = compact({ profile: pick(sec("sound").profile, O.SOUND) });
  o.specialMoments = compact({ narration: pick(sec("specialMoments").narration, O.NARRATION) });

  const effects = Object.fromEntries(
    Object.entries(sec("effects")).filter(
      ([k, v]) => k in pkg.effects && (typeof v === "boolean" || (k === "petals" && ["none", "rose", "blossom", "white"].includes(v as string))),
    ),
  );
  if (Object.keys(effects).length) o.effects = effects;

  const pieceIds = new Set(pkg.artwork.pieces.map((p) => p.id));
  const art = Object.fromEntries(
    Object.entries(sec("art"))
      .filter(([k]) => pieceIds.has(k))
      .map(([k, v]) => [k, sanitizeArt(v)])
      .filter(([, v]) => v !== undefined),
  );
  if (Object.keys(art).length) o.art = art as Record<string, ArtOverride>;

  const assignment = (raw: unknown, fallback: ImagePresentation): SlotAssignment | undefined => {
    if (!isRecord(raw)) return undefined;
    const assetId = typeof raw.assetId === "string" ? raw.assetId : null;
    const presentation = isRecord(raw.presentation) ? sanitizePresentation(mergeShape(fallback, raw.presentation), fallback) : fallback;
    return { assetId, presentation };
  };
  const roles = Object.fromEntries(
    Object.entries(sec("roles"))
      .filter(([k]) => (ROLE_IDS as readonly string[]).includes(k))
      .map(([k, v]) => [k, assignment(v, defaultRolePresentation(k as RoleId))])
      .filter(([, v]) => v !== undefined),
  );
  if (Object.keys(roles).length) o.roles = roles;

  const frontendArtwork = Object.fromEntries(
    Object.entries(sec("frontendArtwork"))
      .filter(([k]) => ["hero", "pageBackground", "gameBackground", "decorativeLeft", "decorativeRight", "cardArtwork", "resultArtwork", "mobileBackground", "desktopBackground", "footerArtwork", "outro", "custom1", "custom2"].includes(k))
      .map(([k, v]) => [k, assignment(v, ART_PRESENTATION)])
      .filter(([, v]) => v !== undefined),
  );
  if (Object.keys(frontendArtwork).length) o.frontendArtwork = frontendArtwork as Partial<Record<ThemeArtworkSlotId, SlotAssignment>>;

  const collage = sec("collage");
  const pieces = Array.isArray(collage.pieces)
    ? collage.pieces
        .map((v) => assignment(v, ART_PRESENTATION))
        .filter((v): v is SlotAssignment => !!v && !!v.assetId)
        .slice(0, 40)
    : undefined;
  o.collage = compact({ mode: pick(collage.mode, { values: ["full", "light", "off"] as const }), pieces: pieces?.length ? pieces : undefined });

  return compact(o) ?? {};
}

function sanitizeTheme(raw: unknown, fallback: ThemeSelection): ThemeSelection {
  if (!isRecord(raw)) return fallback;
  const overrides: ThemeSelection["overrides"] = {};
  if (isRecord(raw.overrides)) {
    for (const [rawId, value] of Object.entries(raw.overrides)) {
      const id = canonicalThemeId(rawId);
      if (!id || !isRecord(value) || overrides[id]) continue;
      const o = sanitizeOverride(id, value);
      if (Object.keys(o).length) overrides[id] = o;
    }
  }
  const presetId = canonicalThemeId(raw.presetId) ?? fallback.presetId;
  const listed = Array.isArray(raw.enabled) ? raw.enabled.map(canonicalThemeId).filter((x): x is ThemeId => !!x) : fallback.enabled;
  const enabled = THEME_ORDER.filter((id) => id === presetId || listed.includes(id));
  return {
    presetId,
    overrides,
    enabled,
    playerChoice: typeof raw.playerChoice === "boolean" ? raw.playerChoice : fallback.playerChoice,
  };
}

const cleanList = (list: string[]) => list.map((s) => s.slice(0, 200)).filter((s) => s.trim().length > 0);
const cleanSlots = (list: number[]) => [...new Set(list.filter((n) => Number.isInteger(n) && n >= 1 && n <= 50))];

export function normalizeConfig(raw: unknown): GameConfig {
  const defaults = createDefaultConfig();
  const merged = mergeShape(defaults, raw);
  const source = isRecord(raw) ? raw : {};

  for (const key of Object.keys(merged.slots)) {
    const slot = merged.slots[key];
    slot.presentation = sanitizePresentation(slot.presentation, defaults.slots[key].presentation);
  }
  merged.identity.logoPresentation = sanitizePresentation(merged.identity.logoPresentation, defaults.identity.logoPresentation);
  merged.identity.artworkPresentation = sanitizePresentation(
    merged.identity.artworkPresentation,
    defaults.identity.artworkPresentation,
  );

  const rawPlayers = isRecord(source.players) ? source.players : {};
  for (const id of ["PLAYER_ONE", "PLAYER_TWO"] as const) {
    const rawPlayer = isRecord(rawPlayers[id]) ? rawPlayers[id] : {};
    merged.players[id].symbol = sanitizeSymbol(rawPlayer.symbol, defaults.players[id].symbol);
  }

  merged.theme = sanitizeTheme(source.theme, defaults.theme);

  const r = merged.reactions;
  r.pools = { win: cleanSlots(r.pools.win), loss: cleanSlots(r.pools.loss), draw: cleanSlots(r.pools.draw) };
  r.captions = { win: cleanList(r.captions.win), loss: cleanList(r.captions.loss), draw: cleanList(r.captions.draw) };
  r.streakThreshold = clamp(Math.round(r.streakThreshold), 2, 20);
  r.celebrateEvery = clamp(Math.round(r.celebrateEvery), 2, 100);
  r.secretChance = clamp(r.secretChance, 0, 1);
  merged.comic.sfxWords = cleanList(merged.comic.sfxWords);
  merged.animations.level = oneOf(merged.animations.level, ["full", "subtle", "off"], "full");
  merged.schemaVersion = 1;

  return merged;
}
