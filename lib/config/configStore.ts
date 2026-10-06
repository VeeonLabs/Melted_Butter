import { createDefaultConfig } from "./defaults";
import { normalizeConfig } from "./normalize";
import type { GameConfig } from "./types";

/**
 * Where the owner's configuration lives. This phase keeps it in localStorage
 * on the device; a Supabase implementation can read/write a single row with the
 * same interface (writes guarded by owner-only RLS).
 */
export interface ConfigStore {
  load(): GameConfig;
  save(config: GameConfig): void;
  /** Called when the config changes elsewhere (another tab now, realtime later). Returns unsubscribe. */
  subscribe(listener: (config: GameConfig) => void): () => void;
}

export const CONFIG_STORAGE_KEY = "melted-butter:config:v1";

export function createLocalConfigStore(key: string = CONFIG_STORAGE_KEY): ConfigStore {
  const storage = (): Storage | null => {
    try {
      return typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      return null;
    }
  };

  const read = (): GameConfig => {
    try {
      const raw = storage()?.getItem(key);
      return raw ? normalizeConfig(JSON.parse(raw)) : createDefaultConfig();
    } catch {
      return createDefaultConfig();
    }
  };

  return {
    load: read,
    save(config) {
      try {
        storage()?.setItem(key, JSON.stringify(config));
      } catch {
        throw new Error("Couldn't save. Browser storage is full or blocked.");
      }
    },
    subscribe(listener) {
      if (typeof window === "undefined") return () => {};
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener(read());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
  };
}
