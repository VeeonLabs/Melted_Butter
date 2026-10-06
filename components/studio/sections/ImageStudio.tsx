"use client";

import { useState, type MouseEvent } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useAssets } from "@/components/providers/AssetProvider";
import { ConfigProvider } from "@/components/providers/ConfigProvider";
import { ThemeStage } from "@/components/game/ThemeStage";
import { SLOT_DEFINITIONS, SLOT_GROUPS, getSlotDefinition, type SlotGroupId } from "@/lib/config/slots";
import { AssetPicker, AssetThumb, UploadButton, categoryForSlot } from "../AssetBits";
import { Button, Panel } from "../controls";
import { resetSlotPresentation, setSlotAsset, setSlotPresentation } from "../draft";
import { PresentationEditor } from "../PresentationEditor";
import type { SectionProps } from "../types";

function SlotEditor({ slot, draft, setDraft }: { slot: number } & Pick<SectionProps, "draft" | "setDraft">) {
  const { getAsset, hasAsset } = useAssets();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const def = getSlotDefinition(slot)!;
  const assignment = draft.slots[String(slot)];
  const assetId = assignment.assetId && hasAsset(assignment.assetId) ? assignment.assetId : null;
  const asset = assetId ? getAsset(assetId) : undefined;
  const assign = (id: string | null) => setDraft((d) => setSlotAsset(d, slot, id));

  // Click the preview to put the focal point there.
  function setFocal(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const focalX = Math.round(((e.clientX - box.left) / box.width) * 100);
    const focalY = Math.round(((e.clientY - box.top) / box.height) * 100);
    setDraft((d) => setSlotPresentation(d, slot, { focalX, focalY }));
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-bg/60 p-4 ring-1 ring-accent/50" data-slot-editor={slot}>
      <div>
        <h4 className="font-display text-2xl leading-tight">
          <span className="text-muted">#{slot}</span> {def.label}
        </h4>
        {def.use && <p className="text-sm text-muted">Appears: {def.use}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_1fr]">
        <div className="flex flex-col gap-2">
          {/* Small themed stage, so blending is judged against the real background. */}
          <ConfigProvider config={draft}>
            <ThemeStage contained className="rounded-2xl p-4">
              <div className="relative mx-auto w-full max-w-[13rem]">
                <BlendedImage
                  assetId={assetId}
                  presentation={assignment.presentation}
                  alt={`Preview of slot ${slot}`}
                  className="slot-preview-image w-full"
                  fallback={<div className="grid aspect-square place-items-center rounded-xl border border-dashed border-line text-sm text-muted">No image</div>}
                />
                {assetId && (
                  <div
                    role="presentation"
                    title="Click to set the focal point"
                    onClick={setFocal}
                    className="absolute inset-0 cursor-crosshair"
                    data-focal-target
                  >
                    <span
                      aria-hidden="true"
                      className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgb(0_0_0/0.5)]"
                      style={{ left: `${assignment.presentation.focalX}%`, top: `${assignment.presentation.focalY}%` }}
                    />
                  </div>
                )}
              </div>
            </ThemeStage>
          </ConfigProvider>
          {assetId && <p className="text-xs text-muted">Tip: click the image to set its focal point.</p>}
          <p className="truncate text-sm">{asset ? `${asset.name} · ${asset.width}×${asset.height}` : "Empty slot"}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setPicking(true)}>
              {asset ? "Change image" : "Choose image"}
            </Button>
            <UploadButton category={categoryForSlot(slot)} onError={setError} onUploaded={(a) => assign(a[0].id)} />
            {asset && (
              <Button variant="ghost" onClick={() => assign(null)}>
                Clear slot
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-p1">
              {error}
            </p>
          )}
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Image blending</p>
            <Button variant="ghost" onClick={() => setDraft((d) => resetSlotPresentation(d, slot))}>
              Reset look
            </Button>
          </div>
          <PresentationEditor value={assignment.presentation} onChange={(p) => setDraft((d) => setSlotPresentation(d, slot, p))} />
        </div>
      </div>

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

export function ImageStudio({ draft, setDraft, focusSlot }: Pick<SectionProps, "draft" | "setDraft"> & { focusSlot: number | null }) {
  const { getAsset, hasAsset } = useAssets();
  const initialGroup = focusSlot ? getSlotDefinition(focusSlot)!.group : "player";
  const [group, setGroup] = useState<SlotGroupId>(initialGroup);
  const [selected, setSelected] = useState<number>(focusSlot ?? 1);
  const filled = SLOT_DEFINITIONS.filter((s) => {
    const id = draft.slots[String(s.number)]?.assetId;
    return id && hasAsset(id);
  }).length;
  const groupDef = SLOT_GROUPS.find((g) => g.id === group)!;
  const slots = SLOT_DEFINITIONS.filter((s) => s.group === group);

  return (
    <Panel
      title="Image Studio"
      description="50 active slots. The same library image can fill any number of slots. Empty slots fall back to drawn art, so nothing ever looks broken."
      actions={
        <span className="rounded-full bg-bg px-3 py-1 text-sm ring-1 ring-line" data-filled-count={filled}>
          {filled} / 50 filled
        </span>
      }
    >
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Slot groups">
        {SLOT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={group === g.id}
            onClick={() => {
              setGroup(g.id);
              setSelected(g.range[0]);
            }}
            className={`min-h-10 shrink-0 rounded-full px-3.5 text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
              group === g.id ? "bg-accent text-accent-ink" : "bg-bg ring-1 ring-line"
            }`}
          >
            {g.range[0]}–{g.range[1]} · {g.title}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">{groupDef.description}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" role="tabpanel">
        {slots.map((s) => {
          const id = draft.slots[String(s.number)]?.assetId;
          const asset = id && hasAsset(id) ? getAsset(id) : undefined;
          return (
            <button
              key={s.number}
              type="button"
              aria-pressed={selected === s.number}
              data-slot={s.number}
              onClick={() => setSelected(s.number)}
              className={`flex min-w-0 flex-col gap-1.5 rounded-2xl p-2 text-left outline-none transition focus-visible:ring-4 focus-visible:ring-accent/40 ${
                selected === s.number ? "bg-accent/15 ring-2 ring-accent" : "bg-bg/60 ring-1 ring-line hover:ring-ink/40"
              }`}
            >
              <AssetThumb asset={asset} className="aspect-square w-full" />
              <span className="text-xs font-semibold">
                <span className="text-muted">#{s.number}</span> {s.label}
              </span>
              <span className="truncate text-xs text-muted">{asset ? asset.name : "Empty"}</span>
            </button>
          );
        })}
      </div>

      <SlotEditor key={selected} slot={selected} draft={draft} setDraft={setDraft} />
    </Panel>
  );
}
