"use client";

import type { CSSProperties } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { ART_PRESENTATION } from "@/lib/config/slots";
import type { ArtAnchor, ArtTint, ResolvedArtPiece, ResolvedTheme } from "@/lib/themes/types";
import { Motif } from "./Motifs";

const TINTS: Record<ArtTint, string> = {
  accent: "var(--mb-accent)",
  p1: "var(--mb-p1)",
  p2: "var(--mb-p2)",
  ink: "var(--mb-ink)",
  muted: "var(--mb-muted)",
  highlight: "var(--mb-highlight)",
  line: "var(--mb-line)",
};

/**
 * One artwork piece: the owner's image when assigned, otherwise the theme's
 * original placeholder motif. Placement comes from CSS keyed on data-anchor,
 * so it can adapt (or hide) on small screens without covering the board.
 */
export function ArtPieceView({ piece, theme }: { piece: ResolvedArtPiece; theme?: ResolvedTheme }) {
  if (piece.hidden) return null;
  const style = {
    "--art-size": piece.size,
    "--art-x": piece.x,
    "--art-y": piece.y,
    "--art-rotate": `${piece.rotate}deg`,
    opacity: piece.opacity,
    color: TINTS[piece.tint],
  } as CSSProperties;
  const placeholder = <Motif id={piece.motif} className="mb-art__motif" />;

  return (
    <span className="mb-art" data-anchor={piece.anchor} data-layer={piece.layer} data-mobile={piece.mobile} data-piece={piece.id} style={style}>
      {piece.assetId ? (
        <BlendedImage
          assetId={piece.assetId}
          presentation={piece.presentation ?? ART_PRESENTATION}
          alt={piece.alt}
          theme={theme}
          className="mb-art__image"
          fallback={placeholder}
        />
      ) : (
        placeholder
      )}
    </span>
  );
}

const ARENA_ANCHORS: readonly ArtAnchor[] = ["board-top-left", "board-top-right", "board-bottom-left", "board-bottom-right", "behind-board"];

/** The theme's composition for one zone and layer. */
export function SceneArt({ zone, layer }: { zone: "scene" | "arena"; layer: "back" | "front" }) {
  const { theme } = useGameConfig();
  const pieces = theme.artwork.pieces.filter(
    (p) => p.layer === layer && ARENA_ANCHORS.includes(p.anchor) === (zone === "arena"),
  );
  if (!pieces.length) return null;
  return (
    <div className={`mb-art-layer mb-art-layer--${layer}`} aria-hidden={pieces.every((p) => !p.assetId) || undefined}>
      {pieces.map((p) => (
        <ArtPieceView key={p.id} piece={p} theme={theme} />
      ))}
    </div>
  );
}
