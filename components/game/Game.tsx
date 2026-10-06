"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { playCue } from "@/lib/audio/sfx";
import type { GameState } from "@/lib/game/types";
import { SceneArt } from "@/components/themes/ArtPiece";
import { BoardFrame } from "@/components/themes/BoardFrame";
import { ChapterCard } from "./ChapterCard";
import { GameBoard } from "./GameBoard";
import { GameControls } from "./GameControls";
import { GameHeader } from "./GameHeader";
import { GameStatus } from "./GameStatus";
import { ScoreBoard } from "./ScoreBoard";
import { WinReaction } from "./WinReaction";
import { ThemeFrontendDecorations, ThemeArtworkLayer } from "@/components/themes/ThemeFrontendArtwork";

export interface GameViewProps {
  state: GameState;
  /** Changes on rematch/reset; replays the board entrance and the chapter card. */
  boardKey: number;
  onPlay: (index: number) => void;
  onRematch: () => void;
  onResetScore: () => void;
  /** Theme selector shown in the header (player game only). */
  themePicker?: ReactNode;
}

/**
 * The whole player-facing screen. It only renders state and reports intents,
 * so it works the same with local state, the studio preview, or (later) a
 * Supabase-synced game.
 */
export function GameView({ state, boardKey, onPlay, onRematch, onResetScore, themePicker }: GameViewProps) {
  const { config, theme } = useGameConfig();
  const [chapterKey, setChapterKey] = useState(boardKey);
  const [chapterOpen, setChapterOpen] = useState(false);

  // Derived from props during render (React's recommended pattern), not in an effect.
  if (boardKey !== chapterKey) {
    setChapterKey(boardKey);
    setChapterOpen(config.comic.enabled && config.comic.chapterTransitions);
  }
  const closeChapter = useCallback(() => setChapterOpen(false), []);

  const sound = config.comic.enabled && config.comic.soundEffects;
  const lastVersion = useRef(state.version);
  useEffect(() => {
    if (state.version === lastVersion.current) return;
    lastVersion.current = state.version;
    if (!sound || state.lastMove === null) return;
    playCue(state.status === "won" ? "win" : state.status === "draw" ? "draw" : "place", theme.sound.profile);
  }, [state.version, state.status, state.lastMove, sound, theme.sound.profile]);

  return (
    <div className="mb-scene">
      <ThemeFrontendDecorations />
      <ThemeArtworkLayer slot="gameBackground" className="mb-theme-artwork-layer--game" />
      <ThemeArtworkLayer slot="custom1" className="mb-theme-artwork-layer--custom1" />
      <ThemeArtworkLayer slot="custom2" className="mb-theme-artwork-layer--custom2" />
      <SceneArt zone="scene" layer="back" />
      <GameHeader picker={themePicker} />
      <ScoreBoard state={state} status={<GameStatus state={state} />}>
        <BoardFrame>
          <GameBoard key={boardKey} state={state} onPlay={onPlay} />
        </BoardFrame>
      </ScoreBoard>
      <WinReaction state={state} />
      <GameControls onRematch={onRematch} onResetScore={onResetScore} isRoundOver={state.status !== "playing"} />
      {config.identity.footer && <footer className="mb-footer">{config.identity.footer}</footer>}
      <SceneArt zone="scene" layer="front" />
      {chapterOpen && <ChapterCard round={state.round} onDone={closeChapter} />}
    </div>
  );
}
