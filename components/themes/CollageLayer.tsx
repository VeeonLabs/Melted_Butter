"use client";

import { useMemo, type CSSProperties } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { buildCollage, type CollageTile, type Rect } from "@/lib/worlds/collage";
import type { Device } from "@/lib/worlds/roles";
import type { SlotAssignment } from "@/lib/config/types";
import { Motif } from "./Motifs";

/** Original placeholder for one wall tile: abstract panel, blurred photo, film strip, paper or note. */
function TilePlaceholder({ tile }: { tile: CollageTile }) {
  const flip = tile.piece % 2 === 1;
  switch (tile.kind) {
    case "panel": {
      // An abstract comic page: two or three sub-panels, screentone, and thin
      // outline shapes. It suggests where comic art goes without depicting anyone.
      const split = 35 + (tile.piece % 4) * 8;
      return (
        <span className="mb-tile__panel">
          <svg viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeLinecap="round">
              <path d={`M0 ${split} L100 ${split - 6}`} strokeWidth="3" stroke="var(--mb-surface)" />
              {tile.piece % 3 === 0 && <path d={`M${flip ? 62 : 38} ${split - 4} L${flip ? 58 : 42} 140`} strokeWidth="3" stroke="var(--mb-surface)" />}
              <path d={`M8 ${split - 10} C30 ${split - 30} 60 ${split - 34} 92 ${split - 18}`} strokeWidth="1.2" opacity="0.55" />
              <path d={`M14 ${split - 2} C34 ${split - 18} 62 ${split - 20} 86 ${split - 8}`} strokeWidth="0.8" opacity="0.4" />
              <g transform={flip ? "translate(100 0) scale(-1 1)" : undefined} opacity="0.5" strokeWidth="1.3">
                <circle cx="34" cy={split + 34} r="11" />
                <path d={`M14 140 C16 ${split + 58} 54 ${split + 56} 58 140`} />
              </g>
            </g>
          </svg>
        </span>
      );
    }
    case "photo":
      return <span className="mb-tile__photo" style={{ ["--a" as string]: `${(tile.piece * 37) % 100}%` }} />;
    case "film":
      return (
        <span className="mb-tile__film">
          <span />
          <span />
          <span />
        </span>
      );
    case "paper":
      return (
        <span className="mb-tile__paper">
          <svg viewBox="0 0 100 60" aria-hidden="true">
            {[16, 30, 44].map((y, i) => (
              <path key={y} d={`M10 ${y} Q${35 + i * 5} ${y - 4} ${60 + i * 8} ${y} T${90 - i * 12} ${y}`} />
            ))}
          </svg>
        </span>
      );
    default:
      return <span className="mb-tile__note" />;
  }
}

function TileView({ tile, piece }: { tile: CollageTile; piece: SlotAssignment | null }) {
  const style = {
    left: tile.x,
    top: tile.y,
    width: tile.w,
    height: tile.h,
    transform: `rotate(${tile.rotate}deg)`,
  } as CSSProperties;
  return (
    <span className="mb-tile" data-kind={piece ? "owner" : tile.kind} data-tile={tile.id} style={style}>
      {piece?.assetId ? (
        <BlendedImage assetId={piece.assetId} presentation={piece.presentation} alt="" fill fallback={<TilePlaceholder tile={tile} />} />
      ) : (
        <TilePlaceholder tile={tile} />
      )}
      {tile.tape && <span className="mb-tile__tape" />}
    </span>
  );
}

const ACCENT_TINTS = ["var(--mb-accent)", "var(--mb-p1)", "var(--mb-p2)"];

/**
 * The world's artwork wall. It fills the whole stage behind the scene sheet;
 * the sheet (board, cards, status, controls) is drawn above it, so artwork can
 * never cover anything interactive. Tiles fully behind the sheet are skipped.
 */
export function CollageLayer({ width, height, safe, device, hasBackground }: { width: number; height: number; safe: Rect | null; device: Device; hasBackground: boolean }) {
  const { theme } = useGameConfig();
  const { mode, accents: accentMotifs, pieces } = theme.collage;
  const { tiles, accents } = useMemo(
    () => buildCollage({ seed: theme.id, width, height, device, mode, safe }),
    [theme.id, width, height, device, mode, safe],
  );
  // An owner's full background is already a composed collage: only add tiles if they supplied pieces for it.
  const showTiles = !hasBackground || pieces.length > 0;
  if (mode === "off" || (!showTiles && hasBackground)) return null;

  return (
    <div className="mb-collage" aria-hidden="true" data-collage-tiles={showTiles ? tiles.length : 0}>
      {showTiles && (
        <div className="mb-collage__art">
          {tiles.map((t) => (
            <TileView key={t.id} tile={t} piece={pieces.length ? pieces[t.piece % pieces.length] : null} />
          ))}
        </div>
      )}
      {!hasBackground && (
        <div className="mb-collage__accents">
          {accents.map((a, i) => (
            <span
              key={a.id}
              className="mb-collage__accent"
              style={{ left: a.x, top: a.y, width: a.size, height: a.size, transform: `rotate(${a.rotate}deg)`, color: ACCENT_TINTS[i % 3] }}
            >
              <Motif id={accentMotifs[a.motif % accentMotifs.length]} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
