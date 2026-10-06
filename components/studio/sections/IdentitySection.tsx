"use client";

import { useState } from "react";
import { useAssets } from "@/components/providers/AssetProvider";
import type { ImagePresentation } from "@/lib/config/types";
import { AssetPicker, AssetThumb, UploadButton } from "../AssetBits";
import { Button, Panel, TextField, Toggle } from "../controls";
import { PresentationEditor } from "../PresentationEditor";
import { SlotQuick } from "../SlotQuick";
import type { SectionProps } from "../types";

function IdentityImage({
  label,
  assetId,
  presentation,
  onAsset,
  onPresentation,
}: {
  label: string;
  assetId: string | null;
  presentation: ImagePresentation;
  onAsset: (id: string | null) => void;
  onPresentation: (p: Partial<ImagePresentation>) => void;
}) {
  const { getAsset, hasAsset } = useAssets();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const asset = assetId && hasAsset(assetId) ? getAsset(assetId) : undefined;
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg/60 p-3 ring-1 ring-line">
      <div className="flex items-center gap-3">
        <AssetThumb asset={asset} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-muted">{asset ? asset.name : "None"}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking(true)}>Choose</Button>
        <UploadButton category="identity" onError={setError} onUploaded={(a) => onAsset(a[0].id)} />
        {asset && (
          <Button variant="ghost" onClick={() => onAsset(null)}>
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-p1">
          {error}
        </p>
      )}
      {asset && (
        <details className="rounded-xl bg-surface/60 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Image blending</summary>
          <div className="mt-3">
            <PresentationEditor value={presentation} onChange={onPresentation} />
          </div>
        </details>
      )}
      <AssetPicker
        open={picking}
        title={label}
        category="identity"
        onClose={() => setPicking(false)}
        onPick={(a) => {
          onAsset(a.id);
          setPicking(false);
        }}
      />
    </div>
  );
}

export function IdentitySection({ draft, setDraft, patch, openSlot }: SectionProps) {
  const { identity, players, reactions, event } = draft;
  const setPlayer = (id: "PLAYER_ONE" | "PLAYER_TWO", p: Partial<(typeof players)["PLAYER_ONE"]>) =>
    setDraft((d) => ({ ...d, players: { ...d.players, [id]: { ...d.players[id], ...p } } }));

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Game identity" description="The name, subtitle and artwork at the top of the game.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Game name" value={identity.gameName} onChange={(gameName) => patch("identity", { gameName })} maxLength={40} />
          <TextField label="Subtitle" value={identity.subtitle} onChange={(subtitle) => patch("identity", { subtitle })} />
          <TextField label="Footer line" value={identity.footer} onChange={(footer) => patch("identity", { footer })} hint="Leave empty to hide it." />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <IdentityImage
            label="Game logo"
            assetId={identity.logoAssetId}
            presentation={identity.logoPresentation}
            onAsset={(logoAssetId) => patch("identity", { logoAssetId })}
            onPresentation={(p) => patch("identity", { logoPresentation: { ...identity.logoPresentation, ...p } })}
          />
          <IdentityImage
            label="Main artwork"
            assetId={identity.artworkAssetId}
            presentation={identity.artworkPresentation}
            onAsset={(artworkAssetId) => patch("identity", { artworkAssetId })}
            onPresentation={(p) => patch("identity", { artworkPresentation: { ...identity.artworkPresentation, ...p } })}
          />
        </div>
      </Panel>

      <Panel title="Players" description="Names and status lines. The rules only know Player 1 and Player 2; everything here is presentation.">
        <div className="grid gap-4 lg:grid-cols-2">
          {(["PLAYER_ONE", "PLAYER_TWO"] as const).map((id, i) => (
            <div key={id} className="flex flex-col gap-3 rounded-2xl bg-bg/40 p-3 ring-1 ring-line">
              <p className="text-sm font-semibold" style={{ color: i === 0 ? "var(--mb-p1)" : "var(--mb-p2)" }}>
                Player {i + 1}
              </p>
              <TextField label="Name" value={players[id].name} onChange={(name) => setPlayer(id, { name })} maxLength={24} />
              <TextField label="Turn message" value={players[id].turnText} onChange={(turnText) => setPlayer(id, { turnText })} />
              <TextField label="Win message" value={players[id].winText} onChange={(winText) => setPlayer(id, { winText })} />
              <SlotQuick slot={i === 0 ? 1 : 2} draft={draft} setDraft={setDraft} openSlot={openSlot} />
            </div>
          ))}
        </div>
        <TextField label="Draw message" value={reactions.drawStatus} onChange={(drawStatus) => patch("reactions", { drawStatus })} />
      </Panel>

      <Panel title="Special event" description="An optional banner under the title, using slot 49.">
        <Toggle label="Show special event banner" checked={event.enabled} onChange={(enabled) => patch("event", { enabled })} />
        <TextField label="Banner caption" value={event.caption} onChange={(caption) => patch("event", { caption })} />
        <SlotQuick slot={49} draft={draft} setDraft={setDraft} openSlot={openSlot} />
      </Panel>
    </div>
  );
}
