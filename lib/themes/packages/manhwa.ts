import { art, defineTheme } from "../define";

/** Editorial webtoon: ink on cream, thin panel lines, one restrained red. */
export const manhwa = defineTheme({
  id: "manhwa",
  identity: { name: "Manhwa", tagline: "Ink, cream and quiet drama", description: "A clean webtoon page: cream paper, fine ink panels and a single restrained accent.", mood: "light" },
  colors: {
    background: "#f3eee6",
    backgroundAlt: "#e7dfd2",
    surface: "#fbf8f2",
    ink: "#17161c",
    muted: "#55525c",
    accent: "#b23a2e",
    accentInk: "#ffffff",
    playerOne: "#17161c",
    playerTwo: "#b23a2e",
    board: "#17161c",
    cell: "#fbf8f2",
    line: "#17161c",
    highlight: "#17161c",
    winInk: "#fbf8f2",
  },
  typography: { display: "editorial", title: "plain", subtitle: "caps" },
  surfaces: { card: "ink", button: "outline", texture: "screentone", radius: 4 },
  players: { layout: "stack", card: "compact" },
  board: { style: "panel", frame: "none", cellRadius: 2 },
  symbols: { treatment: "ink" },
  artwork: {
    imageBlend: { blend: "multiply", overlayOpacity: 0, frame: "ink" },
    pieces: [
      art("panels", "Character panels", "panels", "page-left", { size: 12, rotate: -2, tint: "ink", mobile: "hide" }),
      art("tone", "Screentone", "screentone", "title-right", { size: 9, x: 1, tint: "ink", opacity: 0.35 }),
      art("lines", "Speed lines", "speed-lines", "behind-board", { size: 30, tint: "ink", opacity: 0.08, mobile: "keep" }),
    ],
  },
  background: { slot: 31, recipe: "vertical" },
  reactions: { style: "panel", flourish: "ink" },
  chapters: { style: "page" },
  chat: { bubble: "ink", sticker: "die-cut" },
  motion: { personality: "snappy" },
  sound: { profile: "soft" },
  specialMoments: { narration: "subtitle" },
  collage: { mode: "light", accents: ["screentone", "speed-lines", "tape"] },
});
