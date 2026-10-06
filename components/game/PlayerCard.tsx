"use client";

import { useGameConfig } from "@/components/providers/ConfigProvider";
import type { PlayerId } from "@/lib/game/types";
import { RoleFill } from "@/components/themes/WorldArt";
import { Avatar } from "./Avatar";
import { SymbolView } from "./SymbolView";

interface PlayerCardProps {
  player: PlayerId;
  score: number;
  isActive: boolean;
  isWinner: boolean;
  /** How this seat's round ended, for the world's win / lose / draw overlay. */
  outcome?: "win" | "lose" | "draw" | null;
}

/** One seat. Its composition (portrait, compact, polaroid, tag, minimal) comes from the theme via CSS. */
export function PlayerCard({ player, score, isActive, isWinner, outcome = null }: PlayerCardProps) {
  const { config } = useGameConfig();
  const name = config.players[player].name;
  const one = player === "PLAYER_ONE";
  const badge = isWinner ? "Winner" : isActive ? "Playing" : null;

  return (
    <div
      className={`mb-seat mb-card ${one ? "mb-seat--one" : "mb-seat--two"} ${isActive || isWinner ? "is-active" : ""} ${isWinner ? "is-winner" : ""}`}
      style={{ ["--seat-color" as string]: one ? "var(--mb-p1)" : "var(--mb-p2)" }}
    >
      {outcome && <RoleFill role={`${outcome}-overlay`} className="mb-seat__overlay" />}
      <Avatar player={player} alternate={isWinner} className="mb-seat__avatar" />
      <div className="mb-seat__name">
        <span className="mb-seat__symbol">
          <SymbolView player={player} className="size-full" />
        </span>
        <span className="mb-seat__label">{name}</span>
        <span className="sr-only">{badge ? `, ${badge.toLowerCase()}` : ""}</span>
      </div>
      <p className="mb-seat__score" aria-label={`${score} wins`}>
        {score}
      </p>
      <span aria-hidden="true" className={`mb-seat__badge ${badge ? "is-on" : ""}`}>
        {badge ?? "Playing"}
      </span>
    </div>
  );
}
