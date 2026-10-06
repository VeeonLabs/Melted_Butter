import type { ReactNode } from "react";
import type { GameState } from "@/lib/game/types";
import { SceneArt } from "@/components/themes/ArtPiece";
import { PlayerCard } from "./PlayerCard";

/**
 * The arena: both seats, the status line and the board as one composed
 * scene. The theme's layout (stack / flank / corners / split / strip) only
 * changes CSS grid placement; the markup stays the same.
 */
export function ScoreBoard({ state, status, children }: { state: GameState; status: ReactNode; children: ReactNode }) {
  const { score, status: phase, currentPlayer, winner } = state;
  const playing = phase === "playing";
  const outcome = (p: "PLAYER_ONE" | "PLAYER_TWO") =>
    phase === "draw" ? ("draw" as const) : phase === "won" ? (winner === p ? ("win" as const) : ("lose" as const)) : null;

  return (
    <section aria-label="Players and board" className="mb-arena">
      <SceneArt zone="arena" layer="back" />
      <PlayerCard
        player="PLAYER_ONE"
        score={score.PLAYER_ONE}
        isActive={playing && currentPlayer === "PLAYER_ONE"}
        isWinner={winner === "PLAYER_ONE"}
        outcome={outcome("PLAYER_ONE")}
      />
      <div className="mb-arena__status">{status}</div>
      {children}
      <PlayerCard
        player="PLAYER_TWO"
        score={score.PLAYER_TWO}
        isActive={playing && currentPlayer === "PLAYER_TWO"}
        isWinner={winner === "PLAYER_TWO"}
        outcome={outcome("PLAYER_TWO")}
      />
      <p className="mb-draws">
        <span className="mb-draws__label">draws</span>
        <span className="mb-draws__value">{score.draws}</span>
      </p>
      <SceneArt zone="arena" layer="front" />
    </section>
  );
}
