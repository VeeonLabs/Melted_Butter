import { isGameState } from "./gameLogic";
import type { GameState } from "./types";

/**
 * Where the game state lives. This phase uses localStorage so a refresh keeps the
 * board and score. Phase 2 can provide a Supabase-backed store with the same
 * load/save shape plus a subscribe() for remote updates.
 */
export interface GameStore {
  load(): GameState | null;
  save(state: GameState): void;
  clear(): void;
}

export const STORAGE_KEY = "melted-butter:game:v2";

export function createLocalGameStore(key: string = STORAGE_KEY): GameStore {
  const storage = (): Storage | null => {
    try {
      return typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      return null;
    }
  };

  return {
    load() {
      try {
        const raw = storage()?.getItem(key);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isGameState(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        storage()?.setItem(key, JSON.stringify(state));
      } catch {
        // Storage full or blocked (private mode). The game still works in memory.
      }
    },
    clear() {
      try {
        storage()?.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
