"use client";

import { useState } from "react";
import { useAssets } from "@/components/providers/AssetProvider";
import { resolveTheme } from "@/lib/config/resolve";
import { ART_PRESENTATION } from "@/lib/config/slots";
import type { SlotAssignment } from "@/lib/config/types";
import { THEMES, THEME_ORDER } from "@/lib/themes/registry";
import type { ThemeId, ThemeOverride } from "@/lib/themes/types";
import type { CollageMode } from "@/lib/worlds/collage";
import { ROLE_BY_ID, ROLE_GROUPS, WORLD_ROLES, aspectMismatch, defaultRolePresentation, type RoleId } from "@/lib/worlds/roles";
import { AssetPicker, AssetThumb, UploadButton } from "../AssetBits";
import { Button, Panel, Segmented } from "../controls";
import { PresentationEditor } from "../PresentationEditor";
import type { SectionProps } from "../types";

export type RoleStatus = { kind: "uploaded"; width: number; height: number; mismatch: boolean } | { kind: "shared"; slot: number } | { kind: "missing" };

/** What the owner still needs to upload for a world. Shared by World Artwork and the Asset Library checklist. */
export function useRoleStatus(draft: SectionProps["draft"], world: ThemeId) {
  const { getAsset, hasAsset } = useAssets();
  const t = resolveTheme(draft, world);
  return (role: RoleId): RoleStatus => {
    const id = t.roles[role]?.assetId;
    const asset = id && hasAsset(id) ? getAsset(id) : undefined;
    if (asset) return { kind: "uploaded", width: asset.width, height: asset.height, mismatch: aspectMismatch(role, asset.width, asset.height) > 0.25 };
    const slot = ROLE_BY_ID[role].slot;
    const global = slot ? draft.slots[String(slot)]?.assetId : null;
    if (slot && global && hasAsset(global)) return { kind: "shared", slot };
    return { kind: "missing" };
  };
}

export function StatusBadge({ status }: { status: RoleStatus }) {
  if (status.kind === "uploaded") {
    return (
      <span className="text-xs" data-status="uploaded">
        <span className="font-semibold text-accent">Uploaded ✓</span>{" "}
        <span className="text-muted">
          {status.width}×{status.height}
          {status.mismatch && " · different shape than recommended"}
        </span>
      </span>
    );
  }
  if (status.kind === "shared") return <span className="text-xs text-muted" data-status="shared">Using shared slot {status.slot}</span>;
  return <span className="text-xs text-muted" data-status="missing">Missing · placeholder shown</span>;
}

/** Hook for editing one world's override. */
function useWorldOverride(setDraft: SectionProps["setDraft"], world: ThemeId) {
  return (fn: (o: ThemeOverride) => ThemeOverride) =>
    setDraft((d) => ({ ...d, theme: { ...d.theme, overrides: { ...d.theme.overrides, [world]: fn(d.theme.overrides[world] ?? {}) } } }));
}

function RoleRow({ world, role, draft, setDraft }: { world: ThemeId; role: RoleId } & Pick<SectionProps, "draft" | "setDraft">) {
  const { getAsset, hasAsset } = useAssets();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const edit = useWorldOverride(setDraft, world);
  const status = useRoleStatus(draft, world)(role);
  const def = ROLE_BY_ID[role];
  const current = draft.theme.overrides[world]?.roles?.[role];
  const asset = current?.assetId && hasAsset(current.assetId) ? getAsset(current.assetId) : undefined;
  const assign = (patch: Partial<SlotAssignment>) =>
    edit((o) => ({
      ...o,
      roles: { ...o.roles, [role]: { assetId: null, presentation: defaultRolePresentation(role), ...o.roles?.[role], ...patch } },
    }));

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg/60 p-3 ring-1 ring-line" data-role-row={role}>
      <div className="flex items-center gap-3">
        <AssetThumb asset={asset} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{def.label}</p>
          <p className="text-xs text-muted">
            Recommended {def.size[0]}×{def.size[1]} · {def.use}
          </p>
          <StatusBadge status={status} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking(true)}>{asset ? "Change" : "Choose"}</Button>
        <UploadButton category={def.group === "backgrounds" ? "background" : def.group === "results" || def.group === "moments" ? "reaction" : "other"} onError={setError} onUploaded={(a) => assign({ assetId: a[0].id })} />
        {asset && (
          <Button variant="ghost" onClick={() => assign({ assetId: null })}>
            Clear
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-p1">
          {error}
        </p>
      )}
      {asset && current && (
        <details className="rounded-xl bg-surface/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Position, crop & blending</summary>
          <div className="mt-3">
            <PresentationEditor value={current.presentation} onChange={(p) => assign({ presentation: { ...current.presentation, ...p } })} />
          </div>
        </details>
      )}
      <AssetPicker
        open={picking}
        title={`${THEMES[world].identity.name} · ${def.label}`}
        category="other"
        onClose={() => setPicking(false)}
        onPick={(a) => {
          assign({ assetId: a.id });
          setPicking(false);
        }}
      />
    </div>
  );
}

function CollagePieces({ world, draft, setDraft }: { world: ThemeId } & Pick<SectionProps, "draft" | "setDraft">) {
  const { getAsset, hasAsset } = useAssets();
  const [error, setError] = useState<string | null>(null);
  const edit = useWorldOverride(setDraft, world);
  const pieces = draft.theme.overrides[world]?.collage?.pieces ?? [];
  const setPieces = (next: SlotAssignment[]) => edit((o) => ({ ...o, collage: { ...o.collage, pieces: next } }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <UploadButton
          category="comic"
          multiple
          variant="primary"
          label="Add collage pieces"
          onError={setError}
          onUploaded={(a) => setPieces([...pieces, ...a.map((x) => ({ assetId: x.id, presentation: ART_PRESENTATION }))])}
        />
        <span className="text-xs text-muted">{pieces.length} pieces · they fill the wall in rotation (panels, polaroids, film frames).</span>
      </div>
      {error && (
        <p role="alert" className="text-xs text-p1">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6" data-collage-pieces>
        {pieces.map((p, i) => (
          <div key={`${p.assetId}-${i}`} className="flex flex-col gap-1 rounded-xl bg-bg/60 p-1.5 ring-1 ring-line">
            <AssetThumb asset={p.assetId && hasAsset(p.assetId) ? getAsset(p.assetId) : undefined} className="aspect-square w-full" />
            <Button variant="ghost" onClick={() => setPieces(pieces.filter((_, j) => j !== i))} aria-label={`Remove collage piece ${i + 1}`}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorldArtwork({ draft, setDraft, previewTheme: world, setPreviewTheme }: SectionProps) {
  const t = resolveTheme(draft, world);
  const edit = useWorldOverride(setDraft, world);
  const status = useRoleStatus(draft, world);
  const done = WORLD_ROLES.filter((r) => status(r.id).kind === "uploaded").length;

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="World Artwork"
        description="Give each comic world its own artwork. Upload, assign a role, position it, preview, then Save. Only use images you have the rights to use."
        actions={<span className="rounded-full bg-bg px-3 py-1 text-sm ring-1 ring-line" data-roles-done={done}>{done} / 24 roles</span>}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="world-select" className="text-sm font-semibold">
            World
          </label>
          <select
            id="world-select"
            value={world}
            onChange={(e) => setPreviewTheme(e.target.value as ThemeId)}
            className="min-h-11 rounded-xl border border-line bg-bg px-3 text-ink"
          >
            {(["comic", "general"] as const).map((kind) => (
              <optgroup key={kind} label={kind === "comic" ? "Comic worlds" : "Worlds"}>
                {THEME_ORDER.filter((id) => THEMES[id].identity.kind === kind).map((id) => (
                  <option key={id} value={id}>
                    {THEMES[id].identity.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <Segmented<CollageMode>
          label="Collage wall"
          value={t.collage.mode}
          options={[
            { value: "full", label: "Full wall" },
            { value: "light", label: "Light (edges only)" },
            { value: "off", label: "Off" },
          ]}
          onChange={(mode) => edit((o) => ({ ...o, collage: { ...o.collage, mode } }))}
        />
      </Panel>

      <Panel title="Collage pieces" description="Individual panels and photos for the wall. Used when there is no main background for the device, or on top of it if you add pieces.">
        <CollagePieces world={world} draft={draft} setDraft={setDraft} />
      </Panel>

      {ROLE_GROUPS.map((g) => (
        <Panel key={g.id} title={g.title}>
          <div className="grid gap-3 xl:grid-cols-2">
            {WORLD_ROLES.filter((r) => r.group === g.id).map((r) => (
              <RoleRow key={r.id} world={world} role={r.id} draft={draft} setDraft={setDraft} />
            ))}
          </div>
        </Panel>
      ))}

      <Panel title="Image guide" description="Recommendations, not requirements. Any PNG, JPG, WebP or SVG works; these sizes look sharpest.">
        <table className="w-full text-left text-sm">
          <tbody>
            {[
              ["Main background", "Desktop 1920×1080 · Tablet 1366×1024 · Mobile 1080×1920"],
              ["World banner", "1200×300"],
              ["World preview", "400×250"],
              ["Board backdrop", "800×800"],
              ["Player avatar / symbol", "512×512"],
              ["Cell styles & overlays", "512×512"],
              ["Reactions & special moments", "800×400"],
            ].map(([k, v]) => (
              <tr key={k} className="border-t border-line">
                <th className="py-2 pr-3 font-semibold">{k}</th>
                <td className="py-2 text-muted">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted">Missing devices fall back desktop → tablet → mobile. Empty roles show original placeholders, never broken images.</p>
      </Panel>
    </div>
  );
}
