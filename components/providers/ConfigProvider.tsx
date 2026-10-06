"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getSlot, resolveEffects, resolveTheme, slotAsset } from "@/lib/config/resolve";
import { ROLE_FOR_SLOT, type RoleId } from "@/lib/worlds/roles";
import type { GameConfig, ImagePresentation } from "@/lib/config/types";
import type { ResolvedTheme, ThemeEffects, ThemeId } from "@/lib/themes/types";
import { useAssets } from "./AssetProvider";

interface ConfigContextValue {
  config: GameConfig;
  theme: ResolvedTheme;
  effects: ThemeEffects;
  /**
   * Asset id for a slot. Inside a world, that world's role artwork (e.g. its
   * own avatars or reactions) wins over the global slot. Null when empty.
   */
  slotAssetId: (slot: number) => string | null;
  slotPresentation: (slot: number) => ImagePresentation;
  isSlotFilled: (slot: number) => boolean;
  /** This world's artwork for a role, or null when not assigned. */
  role: (id: RoleId) => { assetId: string; presentation: ImagePresentation } | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

/**
 * Provides one GameConfig and one resolved theme to everything below. The game
 * gets the saved config and the player's theme; the studio preview gets the
 * draft and whichever theme is being edited.
 */
export function ConfigProvider({ config, themeId, children }: { config: GameConfig; themeId?: ThemeId; children: ReactNode }) {
  const { hasAsset } = useAssets();
  const value = useMemo<ConfigContextValue>(() => {
    const theme = resolveTheme(config, themeId);
    const role = (id: RoleId) => {
      const a = theme.roles[id];
      return a?.assetId && hasAsset(a.assetId) ? { assetId: a.assetId, presentation: a.presentation } : null;
    };
    const worldSlot = (slot: number) => (ROLE_FOR_SLOT[slot] ? role(ROLE_FOR_SLOT[slot]) : null);
    const slotAssetId = (slot: number) => worldSlot(slot)?.assetId ?? slotAsset(config, slot, hasAsset);
    return {
      config,
      theme,
      effects: resolveEffects(theme, config),
      slotAssetId,
      slotPresentation: (slot) => worldSlot(slot)?.presentation ?? getSlot(config, slot).presentation,
      isSlotFilled: (slot) => slotAssetId(slot) !== null,
      role,
    };
  }, [config, themeId, hasAsset]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useGameConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useGameConfig must be used inside <ConfigProvider>.");
  return ctx;
}

/** Same as useGameConfig, but returns null outside a provider (e.g. theme thumbnails in Studio). */
export function useOptionalGameConfig(): ConfigContextValue | null {
  return useContext(ConfigContext);
}
