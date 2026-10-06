"use client";

import type { CSSProperties } from "react";
import { themeDataAttrs, themeStyleVars } from "@/lib/config/resolve";
import type { ResolvedTheme } from "@/lib/themes/types";
import { BlendedImage } from "@/components/media/BlendedImage";
import { ArtPieceView } from "./ArtPiece";
import { SymbolGlyph } from "./SymbolGlyph";

const SAMPLE: (0 | 1 | null)[] = [0, null, 1, null, 0, null, 1, null, null];

/**
 * A miniature of the real composition: background, texture, title, two seats,
 * a board with symbols and the theme's artwork. Uses the same CSS primitives
 * as the game, so it can't drift from what the player sees.
 */
export function ThemeThumbnail({ theme, className = "" }: { theme: ResolvedTheme; className?: string }) {
  const style = themeStyleVars(theme) as CSSProperties;
  const pieces = theme.artwork.pieces.filter((p) => !p.hidden).slice(0, 3);
  const preview = theme.roles.preview;
  const wall = theme.collage.mode !== "off";
  return (
    <span className={`mb-thumb mb-stage ${className}`} style={style} {...themeDataAttrs(theme)} aria-hidden="true">
      {/* The owner's world preview artwork, when supplied, replaces the miniature. */}
      {preview?.assetId && (
        <span className="mb-thumb__preview">
          <BlendedImage assetId={preview.assetId} presentation={preview.presentation} alt="" theme={theme} fill />
        </span>
      )}
      <span className="mb-texture" />
      {wall && (
        <span className={`mb-thumb__wall ${theme.collage.mode === "light" ? "is-light" : ""}`}>
          {["panel", "photo", "panel", "film", "photo", "panel"].map((k, i) => (
            <span key={i} className="mb-thumb__tile" data-kind={k} />
          ))}
        </span>
      )}
      {pieces.map((p) => (
        <ArtPieceView key={p.id} piece={p} theme={theme} />
      ))}
      <span className="mb-thumb__title mb-title">{theme.identity.name}</span>
      <span className="mb-thumb__seats">
        <span className="mb-thumb__seat mb-card" style={{ borderColor: "var(--mb-p1)" }} />
        <span className="mb-thumb__seat mb-card" style={{ borderColor: "var(--mb-p2)" }} />
      </span>
      <span className="mb-thumb__board mb-board-wrap">
        <span className="mb-board" data-style={theme.board.style}>
          {SAMPLE.map((v, i) => (
            <span key={i} className={`mb-cell ${i === 0 || i === 4 ? "is-winning" : ""}`}>
              {v !== null && (
                <span className="mb-cell-mark" style={{ color: i === 0 || i === 4 ? "var(--mb-win-ink)" : v ? "var(--mb-p2)" : "var(--mb-p1)" }}>
                  <SymbolGlyph symbol={theme.symbols.suggested[v]} index={v} className="size-full" />
                </span>
              )}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
