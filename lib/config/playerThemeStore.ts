import { canonicalThemeId } from "../themes/registry";
import type { ThemeId } from "../themes/types";

/**
 * The player's own theme pick. Deliberately separate from the owner's
 * GameConfig: choosing a theme on the game screen never edits Studio settings.
 * Stored per device now; Phase 2 can keep it per player in Supabase.
 */
export interface PlayerThemeStore {
  load(): ThemeId | null;
  save(id: ThemeId | null): void;
  subscribe(listener: (id: ThemeId | null) => void): () => void;
}

export const PLAYER_THEME_KEY = "melted-butter:player-theme:v1";

export function createLocalPlayerThemeStore(key: string = PLAYER_THEME_KEY): PlayerThemeStore {
  const read = (): ThemeId | null => {
    try {
      return canonicalThemeId(window.localStorage.getItem(key));
    } catch {
      return null;
    }
  };
  return {
    load: () => (typeof window === "undefined" ? null : read()),
    save(id) {
      try {
        if (id) window.localStorage.setItem(key, id);
        else window.localStorage.removeItem(key);
      } catch {
        // Choice simply won't persist; the theme still changes for this visit.
      }
    },
    subscribe(listener) {
      if (typeof window === "undefined") return () => {};
      const onStorage = (e: StorageEvent) => e.key === key && listener(read());
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
