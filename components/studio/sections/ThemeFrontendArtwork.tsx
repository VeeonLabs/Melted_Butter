"use client";

import { useState } from "react";
import { useAssets } from "@/components/providers/AssetProvider";
import { resolveTheme } from "@/lib/config/resolve";
import type { ImagePresentation } from "@/lib/config/types";
import { ART_PRESENTATION } from "@/lib/config/slots";
import { THEME_ARTWORK_SLOTS, type ThemeArtworkSlotId, type ThemeOverride } from "@/lib/themes/types";
import { AssetPicker, AssetThumb, UploadButton } from "../AssetBits";
import { Button, Panel } from "../controls";
import { PresentationEditor } from "../PresentationEditor";
import type { SectionProps } from "../types";

function useThemeOverride(setDraft: SectionProps["setDraft"], themeId: SectionProps["previewTheme"]) {
  return (fn: (override: ThemeOverride) => ThemeOverride) =>
    setDraft((d) => ({
      ...d,
      theme: {
        ...d.theme,
        overrides: {
          ...d.theme.overrides,
          [themeId]: fn(d.theme.overrides[themeId] ?? {}),
        },
      },
    }));
}

export function ThemeFrontendArtwork({ draft, setDraft, previewTheme: themeId }: SectionProps) {
  const theme = resolveTheme(draft, themeId);
  const edit = useThemeOverride(setDraft, themeId);

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Theme Artwork"
        description={`Manually curate the frontend artwork for ${theme.identity.name}. These assignments are separate from World Artwork and only affect this theme.`}
        actions={<span className="rounded-full bg-bg px-3 py-1 text-xs font-semibold ring-1 ring-line">{theme.identity.name}</span>}
      >
        <p className="text-sm text-muted">
          Choose or upload an image for any slot, tune its crop and blending, then use the Live Preview device buttons to check phone, tablet and desktop.
          Changes remain in the draft until you press Save changes.
        </p>
      </Panel>

      <Panel title="Frontend artwork slots" description="Recommended sizes are guidance only. Empty slots fall back to the theme's existing design.">
        <div className="grid gap-3 xl:grid-cols-2">
          {THEME_ARTWORK_SLOTS.map((slot) => (
            <ArtworkRow key={slot.id} slot={slot.id} theme={theme} edit={edit} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ArtworkRow({
  slot,
  theme,
  edit,
}: {
  slot: ThemeArtworkSlotId;
  theme: ReturnType<typeof resolveTheme>;
  edit: (fn: (override: ThemeOverride) => ThemeOverride) => void;
}) {
  const { getAsset, hasAsset } = useAssets();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = theme.frontendArtwork[slot];
  const asset = current?.assetId && hasAsset(current.assetId) ? getAsset(current.assetId) : undefined;
  const definition = THEME_ARTWORK_SLOTS.find((item) => item.id === slot)!;

  const assign = (assetId: string | null, presentation = current?.presentation ?? ART_PRESENTATION) => {
    edit((o) => {
      const frontendArtwork = { ...(o.frontendArtwork ?? {}) };
      if (!assetId) delete frontendArtwork[slot];
      else frontendArtwork[slot] = { assetId, presentation };
      return { ...o, frontendArtwork };
    });
  };

  const updatePresentation = (patch: Partial<ImagePresentation>) => {
    if (!asset) return;
    edit((o) => ({
      ...o,
      frontendArtwork: {
        ...(o.frontendArtwork ?? {}),
        [slot]: { assetId: asset.id, presentation: { ...(current?.presentation ?? ART_PRESENTATION), ...patch } },
      },
    }));
  };

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg/60 p-3 ring-1 ring-line" data-theme-artwork-slot={slot}>
      <div className="flex items-center gap-3">
        <AssetThumb asset={asset} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{definition.label}</p>
          <p className="text-xs text-muted">{definition.description}</p>
          <p className="text-[0.7rem] text-muted">Recommended {definition.size[0]}×{definition.size[1]}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking(true)}>{asset ? "Choose / replace" : "Choose"}</Button>
        <UploadButton category="background" onError={setError} onUploaded={(items) => assign(items[0].id)} />
        {asset && (
          <Button variant="ghost" onClick={() => assign(null)}>
            Clear
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-p1">{error}</p>}
      {asset && current && (
        <details className="rounded-xl bg-surface/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Position, crop & blending</summary>
          <div className="mt-3">
            <PresentationEditor value={current.presentation} onChange={updatePresentation} />
          </div>
        </details>
      )}
      <AssetPicker
        open={picking}
        title={`${theme.identity.name} · ${definition.label}`}
        category="background"
        onClose={() => setPicking(false)}
        onPick={(selected) => {
          assign(selected.id);
          setPicking(false);
        }}
      />
    </div>
  );
}
