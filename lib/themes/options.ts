/**
 * Every shared visual primitive a theme can pick from. Each list drives the
 * TypeScript types, config sanitising and the Studio controls, so a new
 * variant is added in exactly one place (plus its CSS).
 */
const opts = <T extends string>(entries: readonly (readonly [T, string])[]) => ({
  values: entries.map(([v]) => v) as readonly T[],
  options: entries.map(([value, label]) => ({ value, label })),
});

export const FONT = opts([
  ["elegant", "Elegant serif"],
  ["editorial", "Editorial display"],
  ["storybook", "Storybook capitals"],
  ["modern", "Modern grotesk"],
  ["comic", "Comic"],
  ["marker", "Marker"],
  ["hand", "Handwritten"],
  ["cute", "Cute rounded"],
] as const);

export const TITLE = opts([
  ["plain", "Plain"],
  ["italic", "Italic"],
  ["spaced-caps", "Spaced capitals"],
  ["stamped", "Stamped shadow"],
  ["outlined", "Outlined"],
  ["brush-underline", "Brush underline"],
  ["marker", "Marker tag"],
  ["slash", "Slash accent"],
  ["ornament", "Ornamental rules"],
  ["oversized", "Oversized"],
  ["underline", "Hand underline"],
] as const);

export const SUBTITLE = opts([
  ["plain", "Plain"],
  ["italic", "Italic"],
  ["caps", "Small capitals"],
  ["tag", "Label tag"],
  ["hand", "Handwritten"],
] as const);

export const CARD = opts([
  ["glass", "Glass"],
  ["paper", "Paper"],
  ["pearl", "Pearl"],
  ["panel", "Comic panel"],
  ["ink", "Ink outline"],
  ["velvet", "Velvet"],
  ["ornate", "Ornate frame"],
  ["note", "Sticky note"],
  ["sticker", "Sticker"],
  ["minimal", "Minimal"],
] as const);

export const BUTTON = opts([
  ["pill", "Pill"],
  ["block", "Hard-shadow block"],
  ["outline", "Outline"],
  ["underline", "Underlined text"],
  ["sticker", "Sticker"],
  ["glass", "Glass"],
] as const);

export const TEXTURE = opts([
  ["none", "None"],
  ["paper", "Paper fibre"],
  ["grain", "Film grain"],
  ["canvas", "Canvas weave"],
  ["grid", "Graph paper"],
  ["linen", "Linen"],
  ["concrete", "Concrete"],
  ["screentone", "Screentone"],
] as const);

export const BACKGROUND = opts([
  ["radial-top", "Glow from above"],
  ["vertical", "Vertical fade"],
  ["horizon", "Horizon line"],
  ["spotlight", "Spotlight"],
  ["split", "Diagonal split"],
  ["dusk", "Dusk glow"],
  ["flat", "Flat"],
] as const);

export const LAYOUT = opts([
  ["stack", "Stacked (cards above board)"],
  ["flank", "Flanking (cards beside board)"],
  ["corners", "Corners (cards tucked at corners)"],
  ["split", "Asymmetric split"],
  ["strip", "Score strip"],
] as const);

export const PLAYER_CARD = opts([
  ["portrait", "Portrait"],
  ["compact", "Compact"],
  ["polaroid", "Polaroid"],
  ["tag", "Tag"],
  ["minimal", "Minimal"],
] as const);

export const BOARD = opts([
  ["panel", "Manhwa panels"],
  ["ink", "Comic ink"],
  ["soft", "Soft rounded"],
  ["glass", "Glass"],
  ["pearl", "Pearls"],
  ["lines", "Classic lines"],
  ["notebook", "Notebook"],
  ["canvas", "Canvas"],
  ["velvet", "Velvet"],
] as const);

export const BOARD_FRAME = opts([
  ["none", "None"],
  ["double", "Double rule"],
  ["pearl", "Pearl string"],
  ["ornament", "Ornamental corners"],
  ["tape", "Taped corners"],
  ["brush", "Brush stroke"],
  ["float", "Floating glow"],
  ["inset", "Deep inset"],
  ["offset", "Offset shadow"],
] as const);

export const SYMBOL_TREATMENT = opts([
  ["plain", "Plain"],
  ["glow", "Glow"],
  ["ink", "Ink"],
  ["emboss", "Embossed"],
  ["sticker", "Sticker outline"],
  ["sheen", "Pearl sheen"],
] as const);

export const REACTION = opts([
  ["panel", "Comic panels"],
  ["bubble", "Speech bubbles"],
  ["cinematic", "Cinematic"],
  ["editorial", "Editorial card"],
  ["note", "Sticky note"],
  ["poster", "Taped poster"],
] as const);

export const FLOURISH = opts([
  ["none", "None"],
  ["sparkle", "Sparkles"],
  ["petals", "Petals"],
  ["starburst", "Starburst"],
  ["confetti", "Confetti"],
  ["hearts", "Hearts"],
  ["ink", "Ink splash"],
  ["bubbles", "Bubbles"],
] as const);

export const NARRATION = opts([
  ["banner", "Banner"],
  ["tag", "Tag"],
  ["stamp", "Stamp"],
  ["subtitle", "Film subtitle"],
  ["handwritten", "Handwritten"],
] as const);

export const CHAPTER = opts([
  ["panel", "Comic panel"],
  ["title-card", "Storybook title card"],
  ["curtain", "Cinematic curtain"],
  ["page", "Turning page"],
  ["stamp", "Stamp"],
] as const);

export const BUBBLE = opts([
  ["round", "Round"],
  ["square", "Square"],
  ["ink", "Ink outline"],
  ["note", "Note"],
  ["sticker", "Sticker"],
  ["glass", "Glass"],
] as const);

export const STICKER_FRAME = opts([
  ["none", "None"],
  ["circle", "Circle"],
  ["polaroid", "Polaroid"],
  ["tape", "Tape"],
  ["die-cut", "Die-cut outline"],
] as const);

export const MOTION = opts([
  ["calm", "Calm"],
  ["floaty", "Floaty"],
  ["bouncy", "Bouncy"],
  ["snappy", "Snappy"],
  ["dramatic", "Dramatic"],
] as const);

export const SOUND = opts([
  ["chime", "Chime"],
  ["soft", "Soft"],
  ["bright", "Bright"],
  ["low", "Low"],
  ["pop", "Pop"],
] as const);

export const ART_ANCHOR = opts([
  ["title-left", "Beside title (left)"],
  ["title-right", "Beside title (right)"],
  ["board-top-left", "Board, top-left corner"],
  ["board-top-right", "Board, top-right corner"],
  ["board-bottom-left", "Board, bottom-left corner"],
  ["board-bottom-right", "Board, bottom-right corner"],
  ["behind-board", "Behind the board"],
  ["page-left", "Page margin (left, wide screens)"],
  ["page-right", "Page margin (right, wide screens)"],
  ["footer", "Under the controls"],
] as const);
