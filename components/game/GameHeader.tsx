"use client";

import type { ReactNode } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { SLOTS } from "@/lib/config/slots";
import { ThemeArtworkImage } from "@/components/themes/ThemeFrontendArtwork";

/** Title block. Its treatment (ornament, marker, slash, oversized…) comes from the theme via data-title. */
export function GameHeader({ picker }: { picker?: ReactNode }) {
  const { config, slotAssetId, slotPresentation, role } = useGameConfig();
  const { identity, event } = config;
  const banner = role("banner");

  return (
    <header className="mb-header">
      <ThemeArtworkImage slot="hero" className="mb-header__theme-hero" />
      {picker && <div className="mb-header__picker">{picker}</div>}
      {banner && <BlendedImage assetId={banner.assetId} presentation={banner.presentation} alt="" className="mb-header__banner" />}
      <BlendedImage assetId={identity.artworkAssetId} presentation={identity.artworkPresentation} alt="" className="mb-header__artwork" />
      <BlendedImage assetId={identity.logoAssetId} presentation={identity.logoPresentation} alt="" className="mb-header__logo" />
      <div className="mb-title-wrap">
        <h1 className="mb-title">{identity.gameName}</h1>
        {identity.subtitle && <p className="mb-subtitle">{identity.subtitle}</p>}
      </div>
      {event.enabled && (
        <div className="event-banner mb-card">
          <BlendedImage assetId={slotAssetId(SLOTS.specialEvent)} presentation={slotPresentation(SLOTS.specialEvent)} alt="" />
          {event.caption && <p className="event-banner__caption">{event.caption}</p>}
        </div>
      )}
    </header>
  );
}
