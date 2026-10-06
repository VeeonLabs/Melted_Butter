"use client";

import { useRef, type KeyboardEvent } from "react";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { resolveSymbol, symbolsLookAlike } from "@/lib/config/resolve";
import { canPlayAt } from "@/lib/game/gameLogic";
import type { GameState } from "@/lib/game/types";
import { RoleFill } from "@/components/themes/WorldArt";
import { GameCell } from "./GameCell";
import { WinningLine } from "./WinningLine";

interface GameBoardProps {
  state: GameState;
  onPlay: (index: number) => void;
}

const ARROWS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };

export function GameBoard({ state, onPlay }: GameBoardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { config, theme, role } = useGameConfig();
  const hasBackdrop = role("board") !== null;
  const winning = state.winningCells ?? [];
  const names = { PLAYER_ONE: config.players.PLAYER_ONE.name, PLAYER_TWO: config.players.PLAYER_TWO.name };
  const one = resolveSymbol(config, "PLAYER_ONE", theme);
  const badge = symbolsLookAlike(one, resolveSymbol(config, "PLAYER_TWO", theme)) && !(one.kind === "glyph" && one.glyph === "hamster");

  // Arrow keys move focus around the grid; Tab still works too.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = ARROWS[event.key];
    if (step === undefined) return;
    const current = Number((event.target as HTMLElement).dataset.cell);
    if (Number.isNaN(current)) return;
    const next = current + step;
    const sameRow = Math.floor(next / 3) === Math.floor(current / 3);
    if (next < 0 || next > 8 || (Math.abs(step) === 1 && !sameRow)) return;
    event.preventDefault();
    ref.current?.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus();
  }

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Game board"
      onKeyDown={handleKeyDown}
      data-style={theme.board.style}
      className={`mb-board board-enter ${hasBackdrop ? "has-backdrop" : ""}`}
    >
      <RoleFill role="board" className="mb-board__backdrop" />
      {state.board.map((value, index) => (
        <GameCell
          key={index}
          index={index}
          value={value}
          nextPlayer={state.currentPlayer}
          isPlayable={canPlayAt(state, index)}
          isWinning={winning.includes(index)}
          isFaded={state.status === "won" && !winning.includes(index)}
          names={names}
          badge={badge}
          onPlay={onPlay}
        />
      ))}
      {state.winningCells && <WinningLine cells={state.winningCells} />}
    </div>
  );
}
