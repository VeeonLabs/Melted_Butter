"use client";

import type { CSSProperties } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import type { ThemeArtworkSlotId } from "@/lib/themes/types";
import { deviceFor } from "@/lib/worlds/roles";

export function ThemeArtworkImage({ slot, className = "", fill = false, alt = "" }: { slot: ThemeArtworkSlotId; className?: string; fill?: boolean; alt?: string }) {
  const { theme } = useGameConfig();
  const assignment = theme.frontendArtwork[slot];
  if (!assignment?.assetId) return null;
  return <BlendedImage assetId={assignment.assetId} presentation={assignment.presentation} alt={alt} fill={fill} className={className} />;
}

export function ThemeFrontendBackdrop({ width, height }: { width: number; height: number }) {
  const { theme } = useGameConfig();
  const device = deviceFor(width, height);
  const primary = device === "mobile" ? theme.frontendArtwork.mobileBackground : theme.frontendArtwork.desktopBackground;
  const assignment = primary ?? theme.frontendArtwork.pageBackground;
  if (!assignment?.assetId) return null;
  return (
    <div className="mb-theme-frontend-backdrop" aria-hidden="true">
      <BlendedImage assetId={assignment.assetId} presentation={assignment.presentation} alt="" fill />
    </div>
  );
}

export function ThemeFrontendDecorations() {
  const { theme } = useGameConfig();
  const left = theme.frontendArtwork.decorativeLeft;
  const right = theme.frontendArtwork.decorativeRight;
  const card = theme.frontendArtwork.cardArtwork;
  const footer = theme.frontendArtwork.footerArtwork;
  const hasAny = left?.assetId || right?.assetId || card?.assetId || footer?.assetId;
  if (!hasAny) return null;
  return (
    <div className="mb-theme-frontend-decor" aria-hidden="true">
      {left?.assetId && <BlendedImage assetId={left.assetId} presentation={left.presentation} alt="" className="mb-theme-frontend-decor__left" />}
      {right?.assetId && <BlendedImage assetId={right.assetId} presentation={right.presentation} alt="" className="mb-theme-frontend-decor__right" />}
      {card?.assetId && <BlendedImage assetId={card.assetId} presentation={card.presentation} alt="" className="mb-theme-frontend-decor__card" />}
      {footer?.assetId && <BlendedImage assetId={footer.assetId} presentation={footer.presentation} alt="" className="mb-theme-frontend-decor__footer" />}
    </div>
  );
}

export function ThemeArtworkLayer({ slot, className = "", style }: { slot: ThemeArtworkSlotId; className?: string; style?: CSSProperties }) {
  const { theme } = useGameConfig();
  const assignment = theme.frontendArtwork[slot];
  if (!assignment?.assetId) return null;
  return (
    <div className={`mb-theme-artwork-layer ${className}`} style={style} aria-hidden="true">
      <BlendedImage assetId={assignment.assetId} presentation={assignment.presentation} alt="" fill />
    </div>
  );
}
