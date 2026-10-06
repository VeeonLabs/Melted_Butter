"use client";

import type { ReactNode } from "react";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { Motif } from "./Motifs";

/**
 * The board's surrounding treatment. Most frames are pure CSS (data-board-frame
 * on the stage); ornament, tape and brush need a few extra drawn elements.
 */
export function BoardFrame({ children }: { children: ReactNode }) {
  const { theme } = useGameConfig();
  const frame = theme.board.frame;
  return (
    <div className="mb-board-wrap">
      {frame === "brush" && (
        <span className="mb-frame-brush" aria-hidden="true">
          <Motif id="brush-stroke" />
        </span>
      )}
      {frame === "ornament" &&
        (["tl", "tr", "bl", "br"] as const).map((c) => (
          <span key={c} className={`mb-frame-corner mb-frame-corner--${c}`} aria-hidden="true">
            <Motif id="ornament-corner" />
          </span>
        ))}
      {frame === "tape" &&
        (["tl", "tr", "bl", "br"] as const).map((c) => <span key={c} className={`mb-frame-tape mb-frame-tape--${c}`} aria-hidden="true" />)}
      {children}
    </div>
  );
}
