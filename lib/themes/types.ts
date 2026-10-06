import type { BlendMode, FrameStyle, ImagePresentation, SlotAssignment, SymbolConfig } from "../config/types";
import type { CollageMode } from "../worlds/collage";
import type { RoleId } from "../worlds/roles";
import type {
  ART_ANCHOR,
  BACKGROUND,
  BOARD,
  BOARD_FRAME,
  BUBBLE,
  BUTTON,
  CARD,
  CHAPTER,
  FLOURISH,
  FONT,
  LAYOUT,
  MOTION,
  NARRATION,
  PLAYER_CARD,
  REACTION,
  SOUND,
  STICKER_FRAME,
  SUBTITLE,
  SYMBOL_TREATMENT,
  TEXTURE,
  TITLE,
} from "./options";
import type { MotifId } from "./motifs";

type V<T extends { values: readonly string[] }> = T["values"][number];

export type FontKey = V<typeof FONT>;
export type TitleStyle = V<typeof TITLE>;
export type SubtitleStyle = V<typeof SUBTITLE>;
export type CardStyle = V<typeof CARD>;
export type ButtonStyle = V<typeof BUTTON>;
export type Texture = V<typeof TEXTURE>;
export type BackgroundRecipe = V<typeof BACKGROUND>;
export type SceneLayout = V<typeof LAYOUT>;
export type PlayerCardStyle = V<typeof PLAYER_CARD>;
export type BoardStyle = V<typeof BOARD>;
export type BoardFrame = V<typeof BOARD_FRAME>;
export type SymbolTreatment = V<typeof SYMBOL_TREATMENT>;
export type ReactionStyle = V<typeof REACTION>;
export type Flourish = V<typeof FLOURISH>;
export type NarrationStyle = V<typeof NARRATION>;
export type ChapterStyle = V<typeof CHAPTER>;
export type BubbleStyle = V<typeof BUBBLE>;
export type StickerFrame = V<typeof STICKER_FRAME>;
export type MotionPersonality = V<typeof MOTION>;
export type SoundProfile = V<typeof SOUND>;
export type ArtAnchor = V<typeof ART_ANCHOR>;

export type ThemeId =
  | "pearl-boy"
  | "pearl"
  | "manhwa"
  | "comic"
  | "space"
  | "moonlight"
  | "roses"
  | "blossoms"
  | "hamster"
  | "dark-romance"
  | "custom"
  | "low-tide"
  | "roses-champagne"
  | "white-night-blossoms"
  | "painter"
  | "passion"
  | "anastasia"
  | "nerd-project"
  | "jinx"
  | "love-jinx"
  | "borderline"
  | "room-without-windows"
  | "graffiti";

export interface ThemeColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  playerOne: string;
  playerTwo: string;
  board: string;
  cell: string;
  line: string;
  highlight: string;
  /** Ink on top of the highlight colour (winning cells, line, winner badge). */
  winInk: string;
}

export interface ThemeEffects {
  stars: boolean;
  nebula: boolean;
  planets: boolean;
  moon: boolean;
  constellations: boolean;
  shootingStars: boolean;
  sparkles: boolean;
  petals: "none" | "rose" | "blossom" | "white";
  bubbles: boolean;
  pearls: boolean;
  halftone: boolean;
  speedLines: boolean;
  hamsters: boolean;
}

/** Which colour a built-in placeholder motif is drawn in. */
export type ArtTint = "accent" | "p1" | "p2" | "ink" | "muted" | "highlight" | "line";

/** One decorative/artwork piece in a theme's composition. Owners can replace it with their own image. */
export interface ArtPiece {
  id: string;
  label: string;
  motif: MotifId;
  anchor: ArtAnchor;
  /** Width in rem on wide screens. */
  size: number;
  rotate: number;
  /** Nudge from the anchor point, in rem. */
  x: number;
  y: number;
  layer: "back" | "front";
  opacity: number;
  tint: ArtTint;
  mobile: "keep" | "shrink" | "hide";
}

/** Owner changes to one piece, stored per theme. */
export const THEME_ARTWORK_SLOT_IDS = [
  "hero",
  "pageBackground",
  "gameBackground",
  "decorativeLeft",
  "decorativeRight",
  "cardArtwork",
  "resultArtwork",
  "mobileBackground",
  "desktopBackground",
  "footerArtwork",
  "outro",
  "custom1",
  "custom2",
] as const;
export type ThemeArtworkSlotId = (typeof THEME_ARTWORK_SLOT_IDS)[number];

export interface ThemeArtworkSlotDefinition {
  id: ThemeArtworkSlotId;
  label: string;
  description: string;
  size: [number, number];
}

export const THEME_ARTWORK_SLOTS: readonly ThemeArtworkSlotDefinition[] = [
  { id: "hero", label: "Hero / Top", description: "Large artwork near the theme title", size: [1200, 420] },
  { id: "pageBackground", label: "Page Background", description: "Full-page atmosphere behind the frontend", size: [1920, 1080] },
  { id: "gameBackground", label: "Game Background", description: "Artwork behind the playable scene", size: [1600, 1000] },
  { id: "decorativeLeft", label: "Decorative Left", description: "Non-interactive artwork framing the scene", size: [700, 1000] },
  { id: "decorativeRight", label: "Decorative Right", description: "Non-interactive artwork framing the scene", size: [700, 1000] },
  { id: "cardArtwork", label: "Card Artwork", description: "Decorative art behind player/result cards", size: [900, 700] },
  { id: "resultArtwork", label: "Result Artwork", description: "Artwork shown with a completed round", size: [1200, 650] },
  { id: "mobileBackground", label: "Mobile Background", description: "Phone-specific page background", size: [1080, 1920] },
  { id: "desktopBackground", label: "Desktop Background", description: "Wide-screen page background", size: [1920, 1080] },
  { id: "footerArtwork", label: "Footer Artwork", description: "Small decorative artwork near the footer", size: [900, 260] },
  { id: "outro", label: "Outro Artwork", description: "Optional final artwork for the round-result area", size: [1600, 900] },
  { id: "custom1", label: "Custom 1", description: "Flexible theme-specific artwork", size: [1000, 1000] },
  { id: "custom2", label: "Custom 2", description: "Flexible theme-specific artwork", size: [1000, 1000] },
] as const;

export interface ArtOverride {
  assetId?: string | null;
  presentation?: ImagePresentation;
  alt?: string;
  hidden?: boolean;
  size?: number;
  rotate?: number;
  x?: number;
  y?: number;
}

/** A piece after owner overrides are applied. */
export interface ResolvedArtPiece extends ArtPiece {
  assetId: string | null;
  presentation: ImagePresentation | null;
  alt: string;
  hidden: boolean;
}

/**
 * A complete visual world. Every section is configuration over shared
 * primitives; nothing here changes the rules of the game.
 */
export interface ThemePackage {
  id: ThemeId;
  identity: { name: string; tagline: string; description: string; mood: "dark" | "light"; kind: "comic" | "general" };
  colors: ThemeColors;
  typography: { display: FontKey; title: TitleStyle; subtitle: SubtitleStyle };
  surfaces: { card: CardStyle; button: ButtonStyle; texture: Texture; radius: number };
  players: { layout: SceneLayout; card: PlayerCardStyle };
  board: { style: BoardStyle; frame: BoardFrame; cellRadius: number; cellBorder: number; tilt: number };
  symbols: { suggested: [SymbolConfig, SymbolConfig]; treatment: SymbolTreatment };
  artwork: {
    pieces: ArtPiece[];
    /** Defaults used when an owner image is set to blend into the theme. */
    imageBlend: { blend: BlendMode; overlayOpacity: number; frame: FrameStyle };
  };
  /** Background slot (31–40) and the CSS recipe behind everything. */
  background: { slot: number; recipe: BackgroundRecipe };
  effects: ThemeEffects;
  reactions: { style: ReactionStyle; flourish: Flourish };
  chapters: { style: ChapterStyle };
  chat: { bubble: BubbleStyle; sticker: StickerFrame };
  motion: { personality: MotionPersonality };
  sound: { profile: SoundProfile };
  specialMoments: { narration: NarrationStyle };
  /** The artwork wall around the scene and the motifs scattered on it. */
  collage: { mode: CollageMode; accents: MotifId[] };
}

/** Theme package after owner overrides, with art pieces resolved. */
export interface ResolvedTheme extends Omit<ThemePackage, "artwork" | "collage"> {
  artwork: { pieces: ResolvedArtPiece[]; imageBlend: ThemePackage["artwork"]["imageBlend"] };
  frontendArtwork: Partial<Record<ThemeArtworkSlotId, SlotAssignment>>;
  collage: ThemePackage["collage"] & { pieces: SlotAssignment[] };
  /** Owner artwork assigned to this world's roles. */
  roles: Partial<Record<RoleId, SlotAssignment>>;
}

/** Owner tweaks for one theme. Every key is optional; missing means "use the package". */
export interface ThemeOverride {
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemePackage["typography"]>;
  surfaces?: Partial<ThemePackage["surfaces"]>;
  players?: Partial<ThemePackage["players"]>;
  board?: Partial<ThemePackage["board"]>;
  background?: { recipe?: BackgroundRecipe };
  symbols?: { treatment?: SymbolTreatment };
  reactions?: Partial<ThemePackage["reactions"]>;
  chapters?: Partial<ThemePackage["chapters"]>;
  chat?: Partial<ThemePackage["chat"]>;
  motion?: Partial<ThemePackage["motion"]>;
  sound?: Partial<ThemePackage["sound"]>;
  specialMoments?: Partial<ThemePackage["specialMoments"]>;
  effects?: Partial<ThemeEffects>;
  art?: Record<string, ArtOverride>;
  /** World artwork roles (backgrounds, banner, board, players, results, moments). */
  roles?: Partial<Record<RoleId, SlotAssignment>>;
  /** Manual frontend artwork assigned to named theme locations. */
  frontendArtwork?: Partial<Record<ThemeArtworkSlotId, SlotAssignment>>;
  collage?: { mode?: CollageMode; pieces?: SlotAssignment[] };
}
