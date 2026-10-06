import { ACTIVE_SLOT_COUNT, BASE_PRESENTATION, defaultPresentationFor } from "./slots";
import { DEFAULT_THEME, THEME_ORDER } from "../themes/registry";
import type { GameConfig, SlotAssignment } from "./types";

export const DEFAULT_GAME_NAME = "Melted Butter";
export const DEFAULT_SUBTITLE = "A little universe made for two.";

export function createDefaultSlots(): Record<string, SlotAssignment> {
  const slots: Record<string, SlotAssignment> = {};
  for (let n = 1; n <= ACTIVE_SLOT_COUNT; n++) {
    slots[String(n)] = { assetId: null, presentation: defaultPresentationFor(n) };
  }
  return slots;
}

export function createDefaultConfig(): GameConfig {
  return {
    schemaVersion: 1,
    identity: {
      gameName: DEFAULT_GAME_NAME,
      subtitle: DEFAULT_SUBTITLE,
      footer: "Made for two.",
      logoAssetId: null,
      logoPresentation: { ...BASE_PRESENTATION, aspect: "1/1", mask: "circle", radius: 999, shadow: 0, frame: "none", integrate: false },
      artworkAssetId: null,
      artworkPresentation: { ...BASE_PRESENTATION, aspect: "21/9", mask: "fade-bottom", radius: 20, overlayOpacity: 0.2, frame: "none" },
    },
    players: {
      PLAYER_ONE: { name: "You", turnText: "Your turn", winText: "You won ❤️", symbol: { kind: "glyph", glyph: "x" } },
      PLAYER_TWO: { name: "Her", turnText: "Her turn", winText: "She won 😂", symbol: { kind: "glyph", glyph: "o" } },
    },
    symbols: { followTheme: true },
    theme: { presetId: DEFAULT_THEME, overrides: {}, enabled: [...THEME_ORDER], playerChoice: true },
    slots: createDefaultSlots(),
    reactions: {
      randomize: true,
      pools: { win: [18], loss: [15, 16, 17, 19], draw: [20] },
      captions: {
        win: ["Absolute domination. 👑", "Too easy, honestly. 💅", "Taking a victory lap. 🏃"],
        loss: ["You got cooked. 😂", "Demands a rematch. Immediately. 🫠", "Claims they let you win. 🙃"],
        draw: ["Nobody wins. Suspicious. 🤝", "Same brain, apparently. 🧠"],
      },
      drawStatus: "It's a draw 🤝",
      showLoserReaction: true,
      moments: {
        perfectVictory: "Flawless. Not a single wasted move. ✨",
        closeMatch: "Down to the very last square. 😮‍💨",
        winningStreak: "{winner} is on a {streak}-win streak. 🔥",
        losingStreak: "{loser} has lost {streak} in a row. Somebody help. 🫣",
        specialCelebration: "{winner} just reached {wins} wins! 🎉",
        secret: "You found the secret ending. 🤫",
        rematch: "The rivalry continues.",
      },
      streakThreshold: 3,
      celebrateEvery: 5,
      secretChance: 0.05,
    },
    comic: {
      enabled: false,
      speechBubbles: true,
      chapterTransitions: true,
      chapterTitle: "Chapter {round}",
      resultPanels: true,
      soundEffects: false,
      sfxWords: ["POW!", "BAM!", "WHAM!", "KAPOW!"],
      halftone: true,
    },
    hamster: { enabled: false, symbols: true, avatars: true, reactions: true, decorations: true },
    space: {
      enabled: false,
      stars: true,
      nebula: true,
      planets: true,
      moon: false,
      constellations: true,
      shootingStars: true,
      particles: true,
      symbols: false,
      reactionEffects: true,
    },
    event: { enabled: false, caption: "Tonight's special episode" },
    animations: { level: "full" },
  };
}
