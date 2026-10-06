import { art, defineTheme, glyph } from "../define";

/** Controlled graffiti: 70% clean structure, 30% street energy. The board stays the hero. */
export const graffiti = defineTheme({
  id: "graffiti",
  identity: { name: "Graffiti", tagline: "Street poster, edited", description: "Concrete, marker tags, tape and a sticker or two, kept on a clean grid so the board stays the hero.", mood: "light" },
  colors: {
    background: "#e9e6df",
    backgroundAlt: "#d6d1c6",
    surface: "#fbfaf7",
    ink: "#141414",
    muted: "#4d4d4d",
    accent: "#ff5a36",
    accentInk: "#141414",
    playerOne: "#2b52e6",
    playerTwo: "#e0306f",
    board: "#141414",
    cell: "#fbfaf7",
    line: "#141414",
    highlight: "#f9e04b",
    winInk: "#141414",
  },
  typography: { display: "marker", title: "marker", subtitle: "tag" },
  surfaces: { card: "sticker", button: "sticker", texture: "concrete", radius: 6 },
  players: { layout: "corners", card: "tag" },
  board: { style: "ink", frame: "tape", cellRadius: 4, cellBorder: 2, tilt: -0.8 },
  symbols: { suggested: [glyph("x"), glyph("heart")], treatment: "sticker" },
  artwork: {
    imageBlend: { blend: "multiply", overlayOpacity: 0, frame: "polaroid" },
    pieces: [
      art("tag", "Graffiti tag", "tag", "title-left", { size: 10, rotate: -6, x: 0, y: 0.5, tint: "p2", opacity: 0.8 }),
      art("poster", "Poster fragment", "poster", "page-right", { size: 11, rotate: 3, tint: "ink", mobile: "hide" }),
      art("sticker", "Star sticker", "sticker", "board-top-right", { size: 5, rotate: 14, x: 2, y: -2.2, tint: "accent", layer: "front" }),
    ],
  },
  background: { slot: 37, recipe: "flat" },
  reactions: { style: "poster", flourish: "confetti" },
  chapters: { style: "stamp" },
  chat: { bubble: "sticker", sticker: "tape" },
  motion: { personality: "bouncy" },
  sound: { profile: "pop" },
  specialMoments: { narration: "tag" },
  collage: { mode: "light", accents: ["sticker", "tag", "tape", "burst"] },
});
