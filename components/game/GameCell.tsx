"use client";

import { RoleFill } from "@/components/themes/WorldArt";
import type { CellValue, PlayerId } from "@/lib/game/types";
import { SymbolView } from "./SymbolView";

interface GameCellProps {
  index: number;
  value: CellValue;
  nextPlayer: PlayerId;
  isPlayable: boolean;
  isWinning: boolean;
  isFaded: boolean;
  /** Player names, used for screen-reader labels. */
  names: Record<PlayerId, string>;
  /** Show a small initial when both players use an identical symbol. */
  badge: boolean;
  onPlay: (index: number) => void;
}

export function GameCell({ index, value, nextPlayer, isPlayable, isWinning, isFaded, names, badge, onPlay }: GameCellProps) {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const contents = value ? names[value] : "empty";
  const label = `Row ${row}, column ${col}, ${contents}${isWinning ? ", winning line" : ""}`;
  const color = (p: PlayerId) => (p === "PLAYER_ONE" ? "var(--mb-p1)" : "var(--mb-p2)");

  return (
    <button
      type="button"
      data-cell={index}
      aria-label={label}
      // aria-disabled (not disabled) keeps cells focusable for keyboard and screen-reader users.
      aria-disabled={!isPlayable}
      onClick={() => {
        if (isPlayable) onPlay(index);
      }}
      className={`mb-cell group ${isPlayable ? "is-playable" : ""} ${isWinning ? "is-winning cell-win" : ""} ${isFaded ? "is-faded" : ""}`}
    >
      <RoleFill role={value === "PLAYER_ONE" ? "cell-p1" : value === "PLAYER_TWO" ? "cell-p2" : "cell-empty"} className="mb-cell__art" />
      {value ? (
        <span className="mb-cell-mark" style={{ color: isWinning ? "var(--mb-win-ink)" : color(value) }}>
          <SymbolView player={value} animate className="size-full" />
          {badge && (
            <span className="mb-cell-badge" aria-hidden="true">
              {Array.from(names[value])[0]?.toUpperCase()}
            </span>
          )}
        </span>
      ) : isPlayable ? (
        // Faint preview of the next symbol on hover (pointer devices only).
        <span className="mb-cell-mark mb-cell-ghost" style={{ color: color(nextPlayer) }}>
          <SymbolView player={nextPlayer} className="size-full" />
        </span>
      ) : null}
    </button>
  );
}
