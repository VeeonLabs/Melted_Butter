"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAssetUrl, useAssets } from "@/components/providers/AssetProvider";
import type { Asset, AssetCategory } from "@/lib/assets/types";
import { ACCEPT_ATTRIBUTE } from "@/lib/assets/validation";
import { getSlotDefinition } from "@/lib/config/slots";
import { Button } from "./controls";

export function categoryForSlot(slot: number): AssetCategory {
  const group = getSlotDefinition(slot)?.group;
  if (slot === 3 || slot === 4) return "symbol";
  if (group === "player") return slot >= 7 ? "character" : "player";
  if (group === "reactions") return "reaction";
  if (group === "comic") return "comic";
  if (group === "backgrounds") return "background";
  return "moment";
}

export function AssetThumb({ asset, className = "size-14" }: { asset: Asset | undefined; className?: string }) {
  const url = useAssetUrl(asset?.id);
  return (
    <span className={`block shrink-0 overflow-hidden rounded-xl bg-bg ring-1 ring-line ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URL
        <img src={url} alt="" className="size-full object-cover" draggable={false} />
      ) : (
        <span className="grid size-full place-items-center text-xs text-muted">—</span>
      )}
    </span>
  );
}

/** Hidden file input + button. Validates through AssetProvider.upload. */
export function UploadButton({
  category,
  onUploaded,
  label = "Upload new",
  multiple = false,
  variant = "secondary",
  onError,
}: {
  category: AssetCategory;
  onUploaded: (assets: Asset[]) => void;
  label?: string;
  multiple?: boolean;
  variant?: "primary" | "secondary";
  onError: (message: string | null) => void;
}) {
  const { upload } = useAssets();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    onError(null);
    const done: Asset[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        done.push(await upload(file, category));
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
    if (errors.length) onError(errors.join(" "));
    if (done.length) onUploaded(done);
  }

  return (
    <>
      <input
        ref={ref}
        id={id}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-upload={category}
        onChange={(e) => void handle(e.target.files)}
      />
      <Button variant={variant} onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}

/** Modal library picker built on <dialog> (focus trap and Escape for free). */
export function AssetPicker({
  open,
  title,
  category,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  category: AssetCategory;
  onPick: (asset: Asset) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { assets } = useAssets();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = assets.filter((a) => !q || a.name.toLowerCase().includes(q) || a.category.includes(q));

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[min(40rem,calc(100vw-1.5rem))] rounded-3xl border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-line p-4">
          <h2 className="font-display text-2xl">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4 pb-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search images"
            aria-label="Search images"
            className="min-h-10 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-ink outline-none focus-visible:border-accent"
          />
          <UploadButton category={category} onError={setError} onUploaded={(a) => onPick(a[0])} variant="primary" />
        </div>
        {error && (
          <p role="alert" className="px-4 text-sm text-p1">
            {error}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
          {list.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted">No images yet. Upload one to start.</p>}
          {list.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onPick(a)}
              className="flex min-w-0 flex-col gap-1 rounded-2xl p-1.5 text-left outline-none ring-accent hover:bg-bg focus-visible:ring-2"
            >
              <AssetThumb asset={a} className="aspect-square w-full" />
              <span className="truncate text-xs">{a.name}</span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
