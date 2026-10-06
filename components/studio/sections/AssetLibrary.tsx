"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAssetUrl, useAssets } from "@/components/providers/AssetProvider";
import { ASSET_CATEGORIES, type Asset, type AssetCategory } from "@/lib/assets/types";
import { ACCEPT_ATTRIBUTE } from "@/lib/assets/validation";
import { assetUsage } from "@/lib/config/resolve";
import { SLOT_DEFINITIONS } from "@/lib/config/slots";
import { AssetThumb, UploadButton } from "../AssetBits";
import { Button, Panel, Select } from "../controls";
import { setSlotAsset } from "../draft";
import type { SectionProps } from "../types";
import { THEMES, THEME_ORDER } from "@/lib/themes/registry";
import type { ThemeId } from "@/lib/themes/types";
import { ROLE_GROUPS, WORLD_ROLES } from "@/lib/worlds/roles";
import { StatusBadge, useRoleStatus } from "./WorldArtwork";

const formatBytes = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const typeLabel = (mime: string) => mime.replace("image/", "").replace("svg+xml", "svg").replace("jpeg", "jpg").toUpperCase();

function Modal({ open, label, onClose, children }: { open: boolean; label: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={label}
      className="m-auto w-[min(36rem,calc(100vw-1.5rem))] rounded-3xl border border-line bg-surface p-5 text-ink backdrop:bg-black/60"
    >
      {children}
    </dialog>
  );
}

function PreviewImage({ asset }: { asset: Asset }) {
  const url = useAssetUrl(asset.id);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- local blob URL
    <img src={url} alt={asset.name} className="max-h-[60dvh] w-full rounded-2xl bg-bg object-contain" />
  ) : null;
}

function AssetCard({ asset, draft, setDraft, onAskRemove, onPreview, onError }: {
  asset: Asset;
  draft: SectionProps["draft"];
  setDraft: SectionProps["setDraft"];
  onAskRemove: (a: Asset) => void;
  onPreview: (a: Asset) => void;
  onError: (m: string | null) => void;
}) {
  const { replace } = useAssets();
  const replaceRef = useRef<HTMLInputElement>(null);
  const uses = assetUsage(draft, asset.id);
  const slotNumbers = Object.entries(draft.slots)
    .filter(([, s]) => s.assetId === asset.id)
    .map(([k]) => k);

  return (
    <article className="flex min-w-0 flex-col gap-2 rounded-2xl bg-bg/60 p-2.5 ring-1 ring-line" data-asset-card={asset.id}>
      <button type="button" onClick={() => onPreview(asset)} className="rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-accent/40" aria-label={`Preview ${asset.name}`}>
        <AssetThumb asset={asset} className="aspect-square w-full" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold" title={asset.name}>
          {asset.name}
        </p>
        <p className="text-xs text-muted">
          {asset.width}×{asset.height} · {typeLabel(asset.mimeType)} · {formatBytes(asset.size)}
        </p>
        <p className="text-xs text-muted">
          {ASSET_CATEGORIES.find((c) => c.id === asset.category)?.label} · {new Date(asset.createdAt).toLocaleDateString()}
        </p>
        <p className={`mt-1 text-xs ${uses.length ? "text-accent" : "text-muted"}`} data-usage>
          {uses.length ? `Active · ${slotNumbers.length ? `Slot ${slotNumbers.join(", ")}` : uses.join(", ")}` : "Unused"}
        </p>
      </div>
      <select
        aria-label={`Assign ${asset.name} to a slot`}
        value=""
        onChange={(e) => {
          const n = Number(e.target.value);
          if (n) setDraft((d) => setSlotAsset(d, n, asset.id));
        }}
        className="min-h-10 rounded-xl border border-line bg-bg px-2 text-sm text-ink"
      >
        <option value="">Assign to slot…</option>
        {SLOT_DEFINITIONS.map((s) => (
          <option key={s.number} value={s.number}>
            {s.number}. {s.label}
          </option>
        ))}
      </select>
      <div className="flex flex-wrap gap-1.5">
        <input
          ref={replaceRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          data-replace={asset.id}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            onError(null);
            try {
              await replace(asset.id, file);
            } catch (err) {
              onError((err as Error).message);
            }
          }}
        />
        <Button onClick={() => replaceRef.current?.click()}>Replace</Button>
        <Button variant="ghost" onClick={() => onAskRemove(asset)}>
          Remove
        </Button>
      </div>
    </article>
  );
}

/** What each world still needs: role, recommended size, and Uploaded ✓ / Missing. */
function WorldChecklist({ draft, world, setWorld }: { draft: SectionProps["draft"]; world: ThemeId; setWorld: (id: ThemeId) => void }) {
  const status = useRoleStatus(draft, world);
  return (
    <section className="rounded-2xl bg-bg/50 p-3 ring-1 ring-line" data-world-checklist={world}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-display text-xl">World checklist</h4>
        <select
          aria-label="World for checklist"
          value={world}
          onChange={(e) => setWorld(e.target.value as ThemeId)}
          className="min-h-10 rounded-xl border border-line bg-bg px-2 text-sm text-ink"
        >
          {THEME_ORDER.map((id) => (
            <option key={id} value={id}>
              {THEMES[id].identity.name}
            </option>
          ))}
        </select>
      </div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 pr-2">Role</th>
              <th className="py-1 pr-2">Recommended</th>
              <th className="py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROLE_GROUPS.flatMap((g) => WORLD_ROLES.filter((r) => r.group === g.id)).map((r) => (
              <tr key={r.id} className="border-t border-line" data-checklist-role={r.id}>
                <td className="py-1.5 pr-2">{r.label}</td>
                <td className="py-1.5 pr-2 text-muted tabular-nums">
                  {r.size[0]}×{r.size[1]}
                </td>
                <td className="py-1.5">
                  <StatusBadge status={status(r.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AssetLibrary({ draft, setDraft, onAssetRemoved, previewTheme, setPreviewTheme }: SectionProps) {
  const { assets, remove } = useAssets();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [usage, setUsage] = useState<"all" | "used" | "unused">("all");
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>("reaction");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Asset | null>(null);
  const [removing, setRemoving] = useState<Asset | null>(null);

  const q = query.trim().toLowerCase();
  const list = assets.filter((a) => {
    const used = assetUsage(draft, a.id).length > 0;
    return (
      (!q || a.name.toLowerCase().includes(q) || a.fileName.toLowerCase().includes(q)) &&
      (category === "all" || a.category === category) &&
      (usage === "all" || (usage === "used" ? used : !used))
    );
  });
  const removingUses = removing ? assetUsage(draft, removing.id) : [];

  async function confirmRemove(asset: Asset) {
    try {
      await remove(asset.id);
      onAssetRemoved(asset.id);
    } catch (e) {
      setError((e as Error).message);
    }
    setRemoving(null);
  }

  return (
    <Panel
      title="Asset Library"
      description="Every image you've uploaded. The library can grow well beyond 50; only the images assigned to slots are active in the game."
      actions={<span className="rounded-full bg-bg px-3 py-1 text-sm ring-1 ring-line">{assets.length} images</span>}
    >
      <WorldChecklist draft={draft} world={previewTheme} setWorld={setPreviewTheme} />
      <div className="flex flex-wrap items-end gap-2 rounded-2xl bg-bg/50 p-3 ring-1 ring-line">
        <div className="min-w-40 flex-1">
          <Select
            label="Upload as"
            value={uploadCategory}
            options={ASSET_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
            onChange={setUploadCategory}
          />
        </div>
        <UploadButton category={uploadCategory} multiple variant="primary" label="Upload images" onError={setError} onUploaded={() => undefined} />
        <p className="w-full text-xs text-muted">PNG, JPG, WebP or SVG · up to 8 MB (SVG 1 MB) · 32–6000 px per side. Only upload art you have the right to use.</p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-p1/15 p-3 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="asset-search" className="text-sm font-semibold">
            Search
          </label>
          <input
            id="asset-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or file"
            className="min-h-11 rounded-xl border border-line bg-bg px-3 text-ink outline-none focus-visible:border-accent"
          />
        </div>
        <Select
          label="Category"
          value={category}
          options={[{ value: "all", label: "All categories" }, ...ASSET_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
          onChange={setCategory}
        />
        <Select
          label="Status"
          value={usage}
          options={[
            { value: "all", label: "Used & unused" },
            { value: "used", label: "Used in game" },
            { value: "unused", label: "Unused" },
          ]}
          onChange={setUsage}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" aria-live="polite">
        {list.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted">{assets.length ? "Nothing matches these filters." : "No images yet."}</p>}
        {list.map((a) => (
          <AssetCard key={a.id} asset={a} draft={draft} setDraft={setDraft} onAskRemove={setRemoving} onPreview={setPreview} onError={setError} />
        ))}
      </div>

      <Modal open={!!preview} label={preview ? `Preview of ${preview.name}` : "Preview"} onClose={() => setPreview(null)}>
        {preview && (
          <div className="flex flex-col gap-3">
            <PreviewImage asset={preview} />
            <p className="text-sm">
              {preview.fileName} · {preview.width}×{preview.height}
            </p>
            <p className="text-xs text-muted">Stored at {preview.storagePath}</p>
            <Button className="self-end" onClick={() => setPreview(null)}>
              Close
            </Button>
          </div>
        )}
      </Modal>

      <Modal open={!!removing} label="Remove image" onClose={() => setRemoving(null)}>
        {removing && (
          <div className="flex flex-col gap-3" data-remove-dialog>
            <h2 className="font-display text-2xl">Remove “{removing.name}”?</h2>
            {removingUses.length > 0 ? (
              <>
                <p className="text-sm" role="alert">
                  This image is in use. Removing it empties:
                </p>
                <ul className="list-disc pl-5 text-sm text-muted">
                  {removingUses.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted">Those spots go back to their drawn fallbacks. This can&apos;t be undone.</p>
              </>
            ) : (
              <p className="text-sm text-muted">It isn&apos;t used anywhere. This can&apos;t be undone.</p>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setRemoving(null)}>Keep it</Button>
              <Button variant="danger" onClick={() => void confirmRemove(removing)}>
                {removingUses.length ? "Remove anyway" : "Remove"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Panel>
  );
}
