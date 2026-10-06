import type { GameConfig } from "@/lib/config/types";
import type { ThemeId } from "@/lib/themes/types";

export type Scenario = "playing" | "p1win" | "p2win" | "draw" | "perfect" | "close" | "streak";

export type PatchableKey = "identity" | "symbols" | "theme" | "reactions" | "comic" | "hamster" | "space" | "event" | "animations";

export interface SectionProps {
  draft: GameConfig;
  setDraft: (fn: (d: GameConfig) => GameConfig) => void;
  patch: <K extends PatchableKey>(key: K, value: Partial<GameConfig[K]>) => void;
  /** Jump to Image Studio with this slot open. */
  openSlot: (slot: number) => void;
  /** Show a scenario in the live preview. */
  showScenario: (scenario: Scenario) => void;
  /** Called after an asset is deleted so references can be cleared. */
  onAssetRemoved: (id: string) => void;
  /** Theme shown in the live preview while working in Theme Studio. */
  previewTheme: ThemeId;
  setPreviewTheme: (id: ThemeId) => void;
}
