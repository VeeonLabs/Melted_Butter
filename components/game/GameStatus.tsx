"use client";

import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { statusText } from "@/lib/config/resolve";
import { SLOTS } from "@/lib/config/slots";
import { getStatusInfo } from "@/lib/game/gameLogic";
import type { GameState } from "@/lib/game/types";
import { Avatar } from "./Avatar";

export function GameStatus({ state }: { state: GameState }) {
  const { config, slotAssetId, slotPresentation } = useGameConfig();
  const info = getStatusInfo(state);
  const text = statusText(config, info);
  const speaker = info.kind === "draw" ? null : info.player;
  const bubbles = config.comic.enabled && config.comic.speechBubbles && speaker;

  if (!bubbles) {
    return (
      <p role="status" aria-live="polite" className="mb-status">
        {/* key restarts the small entrance animation whenever the message changes */}
        <span key={text} className="status-enter">
          {text}
        </span>
      </p>
    );
  }

  // Comic Mode: the character (or avatar) for whoever's turn it is says the status.
  const slot = SLOTS.character[speaker];
  const right = speaker === "PLAYER_TWO";
  return (
    <div className={`mb-status-speaker ${right ? "is-right" : ""}`}>
      <BlendedImage
        assetId={slotAssetId(slot)}
        presentation={slotPresentation(slot)}
        alt=""
        className="mb-status-speaker__art"
        fallback={<Avatar player={speaker} className="mb-status-speaker__avatar" />}
      />
      <p role="status" aria-live="polite" className={`speech-bubble ${right ? "speech-bubble--right" : ""} mb-status mb-status--bubble`}>
        <span key={text} className="status-enter">
          {text}
        </span>
      </p>
    </div>
  );
}
