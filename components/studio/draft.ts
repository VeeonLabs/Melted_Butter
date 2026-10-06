import { defaultPresentationFor } from "@/lib/config/slots";
import type { GameConfig, ImagePresentation } from "@/lib/config/types";

/** Pure helpers for editing a draft config immutably. */

export function setSlotAsset(d: GameConfig, slot: number, assetId: string | null): GameConfig {
  const key = String(slot);
  return { ...d, slots: { ...d.slots, [key]: { ...d.slots[key], assetId } } };
}

export function setSlotPresentation(d: GameConfig, slot: number, patch: Partial<ImagePresentation>): GameConfig {
  const key = String(slot);
  const current = d.slots[key];
  return { ...d, slots: { ...d.slots, [key]: { ...current, presentation: { ...current.presentation, ...patch } } } };
}

export function resetSlotPresentation(d: GameConfig, slot: number): GameConfig {
  const key = String(slot);
  return { ...d, slots: { ...d.slots, [key]: { ...d.slots[key], presentation: defaultPresentationFor(slot) } } };
}

/** Removes every reference to an asset (slots, logo, artwork). */
export function clearAssetRefs(d: GameConfig, assetId: string): GameConfig {
  const slots = Object.fromEntries(
    Object.entries(d.slots).map(([k, s]) => [k, s.assetId === assetId ? { ...s, assetId: null } : s]),
  );
  const overrides = Object.fromEntries(
    Object.entries(d.theme.overrides).map(([id, o]) => [
      id,
      o
        ? {
            ...o,
            art: o.art && Object.fromEntries(Object.entries(o.art).map(([k, a]) => [k, a.assetId === assetId ? { ...a, assetId: null } : a])),
            roles: o.roles && Object.fromEntries(Object.entries(o.roles).map(([k, a]) => [k, a?.assetId === assetId ? { ...a, assetId: null } : a])),
            collage: o.collage && { ...o.collage, pieces: o.collage.pieces?.filter((p) => p.assetId !== assetId) },
          }
        : o,
    ]),
  );
  return {
    ...d,
    slots,
    theme: { ...d.theme, overrides },
    identity: {
      ...d.identity,
      logoAssetId: d.identity.logoAssetId === assetId ? null : d.identity.logoAssetId,
      artworkAssetId: d.identity.artworkAssetId === assetId ? null : d.identity.artworkAssetId,
    },
  };
}

/** Which top-level areas differ between two configs, for the Save / Discard summary. */
export function changedAreas(a: GameConfig, b: GameConfig): string[] {
  const labels: Record<string, string> = {
    identity: "Game identity",
    players: "Players",
    symbols: "Symbols",
    theme: "Theme",
    slots: "Images",
    reactions: "Reactions & captions",
    comic: "Comic Mode",
    hamster: "Hamster Mode",
    space: "Space Mode",
    event: "Special event",
    animations: "Animations",
  };
  return Object.keys(labels).filter(
    (k) => JSON.stringify(a[k as keyof GameConfig]) !== JSON.stringify(b[k as keyof GameConfig]),
  ).map((k) => labels[k]);
}
