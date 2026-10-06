"use client";

import { BlendedImage } from "@/components/media/BlendedImage";
import { HamsterArt } from "@/components/media/HamsterArt";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { resolveSymbol } from "@/lib/config/resolve";
import type { PlayerId } from "@/lib/game/types";
import { MarkGlyph } from "./MarkGlyph";

interface SymbolViewProps {
  player: PlayerId;
  className?: string;
  animate?: boolean;
}

/** Draws a player's symbol, whatever it is configured to be. The rules never see this. */
export function SymbolView({ player, className = "", animate = false }: SymbolViewProps) {
  const { config, theme, slotAssetId, slotPresentation, role } = useGameConfig();
  const symbol = resolveSymbol(config, player, theme);
  const pop = animate ? "mark-pop" : "";
  // A world's own symbol artwork wins, unless Hamster / Space Mode is replacing symbols.
  const modeOverride = (config.hamster.enabled && config.hamster.symbols) || (config.space.enabled && config.space.symbols);
  const worldArt = modeOverride ? null : role(player === "PLAYER_ONE" ? "p1-symbol" : "p2-symbol");
  if (worldArt) {
    return <BlendedImage assetId={worldArt.assetId} presentation={worldArt.presentation} alt="" className={`${className} ${pop}`} />;
  }

  if (symbol.kind === "emoji") {
    return (
      <span aria-hidden="true" className={`mb-emoji ${className} ${pop}`}>
        {symbol.emoji}
      </span>
    );
  }

  if (symbol.kind === "image") {
    const assetId = slotAssetId(symbol.slot);
    const fallbackGlyph = player === "PLAYER_ONE" ? "x" : "o";
    return (
      <BlendedImage
        assetId={assetId}
        presentation={slotPresentation(symbol.slot)}
        alt=""
        className={`${className} ${pop}`}
        fallback={<MarkGlyph glyph={fallbackGlyph} className={className} animate={animate} />}
      />
    );
  }

  if (symbol.glyph === "hamster") {
    // Two hamsters stay distinguishable by fur colour and by face.
    return <HamsterArt mood={player === "PLAYER_ONE" ? "happy" : "smug"} className={`${className} ${pop}`} />;
  }

  return <MarkGlyph glyph={symbol.glyph} className={className} animate={animate} />;
}
