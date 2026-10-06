"use client";

import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import type { RoleId } from "@/lib/worlds/roles";

/** One world role rendered to fill its parent (board backdrop, cell style, seat overlay). Nothing when unassigned. */
export function RoleFill({ role, className }: { role: RoleId; className: string }) {
  const { role: get } = useGameConfig();
  const art = get(role);
  if (!art) return null;
  return (
    <span className={className} aria-hidden="true">
      <BlendedImage assetId={art.assetId} presentation={art.presentation} alt="" fill />
    </span>
  );
}
