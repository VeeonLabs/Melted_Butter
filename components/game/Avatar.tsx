"use client";

import { BlendedImage } from "@/components/media/BlendedImage";
import { HamsterArt } from "@/components/media/HamsterArt";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { SLOTS } from "@/lib/config/slots";
import type { PlayerId } from "@/lib/game/types";

interface AvatarProps {
  player: PlayerId;
  /** Use the alternate avatar (winner mood) when it exists. */
  alternate?: boolean;
  className?: string;
}

export function Avatar({ player, alternate = false, className = "" }: AvatarProps) {
  const { config, slotAssetId, slotPresentation } = useGameConfig();
  const altSlot = SLOTS.altAvatar[player];
  const slot = alternate && slotAssetId(altSlot) ? altSlot : SLOTS.avatar[player];
  const color = player === "PLAYER_ONE" ? "var(--mb-p1)" : "var(--mb-p2)";
  const name = config.players[player].name;

  const fallback =
    config.hamster.enabled && config.hamster.avatars ? (
      <span className="mb-avatar-fallback" style={{ color }}>
        <HamsterArt mood={alternate ? "happy" : "neutral"} className="mb-avatar-fallback__hamster" />
      </span>
    ) : (
      <span
        className="mb-avatar-fallback mb-avatar-fallback--initial"
        style={{ background: `color-mix(in srgb, ${color} 22%, var(--mb-surface))`, color, border: `2px solid ${color}` }}
      >
        {Array.from(name.trim() || "?")[0]?.toUpperCase()}
      </span>
    );

  return (
    <span className={`mb-avatar ${className}`} aria-hidden="true">
      <BlendedImage assetId={slotAssetId(slot)} presentation={slotPresentation(slot)} alt="" className="mb-avatar__image" fallback={fallback} />
    </span>
  );
}
