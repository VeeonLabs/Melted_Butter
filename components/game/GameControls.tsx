"use client";

import { useEffect, useState } from "react";

interface GameControlsProps {
  onRematch: () => void;
  onResetScore: () => void;
  isRoundOver: boolean;
}

const CONFIRM_MS = 3000;

/** Rematch and reset. Button language (pill, block, sticker, underline…) comes from the theme. */
export function GameControls({ onRematch, onResetScore, isRoundOver }: GameControlsProps) {
  // Reset score needs a second tap so a stray touch can't wipe the score.
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="mb-controls">
      <button type="button" onClick={onRematch} className={`mb-btn mb-btn--primary ${isRoundOver ? "rematch-nudge" : ""}`}>
        Rematch
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirming) {
            setConfirming(false);
            onResetScore();
          } else {
            setConfirming(true);
          }
        }}
        className={`mb-btn mb-btn--secondary ${confirming ? "is-confirming" : ""}`}
      >
        {confirming ? "Tap again to reset" : "Reset score"}
      </button>
    </div>
  );
}
