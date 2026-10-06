"use client";

import { useState } from "react";
import { useAssets } from "@/components/providers/AssetProvider";
import { getSlotDefinition } from "@/lib/config/slots";
import { AssetPicker, AssetThumb, UploadButton, categoryForSlot } from "./AssetBits";
import { Button } from "./controls";
import { setSlotAsset } from "./draft";
import type { SectionProps } from "./types";

/** Compact slot control used outside Image Studio (avatars, event art, symbols). */
export function SlotQuick({ slot, draft, setDraft, openSlot }: { slot: number } & Pick<SectionProps, "draft" | "setDraft" | "openSlot">) {
  const { getAsset, hasAsset } = useAssets();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const def = getSlotDefinition(slot)!;
  const id = draft.slots[String(slot)]?.assetId ?? null;
  const asset = id && hasAsset(id) ? getAsset(id) : undefined;
  const assign = (assetId: string | null) => setDraft((d) => setSlotAsset(d, slot, assetId));

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg/60 p-3 ring-1 ring-line" data-slot-quick={slot}>
      <div className="flex items-center gap-3">
        <AssetThumb asset={asset} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            <span className="text-muted">#{slot}</span> {def.label}
          </p>
          <p className="truncate text-xs text-muted">{asset ? asset.name : "Empty — a drawn fallback is used"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking(true)}>Choose</Button>
        <UploadButton category={categoryForSlot(slot)} onError={setError} onUploaded={(a) => assign(a[0].id)} />
        {asset && (
          <Button variant="ghost" onClick={() => assign(null)}>
            Clear
          </Button>
        )}
        <Button variant="ghost" onClick={() => openSlot(slot)}>
          Fine-tune →
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-p1">
          {error}
        </p>
      )}
      <AssetPicker
        open={picking}
        title={`Slot ${slot} · ${def.label}`}
        category={categoryForSlot(slot)}
        onClose={() => setPicking(false)}
        onPick={(a) => {
          assign(a.id);
          setPicking(false);
        }}
      />
    </div>
  );
}
