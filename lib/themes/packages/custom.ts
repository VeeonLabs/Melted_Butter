import { art, defineTheme } from "../define";

/** A neutral starting point the owner shapes entirely from Studio. */
export const custom = defineTheme({
  id: "custom",
  identity: { name: "Custom", tagline: "Your own world", description: "A quiet neutral base. Change every colour, frame and piece of art in Studio.", mood: "dark" },
  colors: {
    background: "#141220",
    backgroundAlt: "#2a1f3d",
    surface: "#1f1c2e",
    ink: "#f6efe4",
    muted: "#b9b0c6",
    accent: "#f3c969",
    accentInk: "#1a1420",
    playerOne: "#ff8aa8",
    playerTwo: "#8fd8ff",
    board: "#3a3352",
    cell: "#1b1828",
    line: "#4a4266",
    highlight: "#f3c969",
    winInk: "#1a1420",
  },
  artwork: {
    pieces: [
      art("one", "Artwork one", "sparkles", "title-right", { size: 6, x: 1, tint: "accent", opacity: 0.8 }),
      art("two", "Artwork two", "hearts", "board-bottom-left", { size: 6, x: -2, y: 1, tint: "p1", opacity: 0.7 }),
    ],
  },
  background: { slot: 40, recipe: "radial-top" },
  collage: { mode: "off", accents: ["sparkles", "tape"] },
});
