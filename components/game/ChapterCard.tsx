"use client";

import { useEffect } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { SLOTS } from "@/lib/config/slots";
import { fillTemplate } from "@/lib/config/template";

const DURATION_MS = 1500;

/** Comic Mode scene transition between rounds. Tap, click or Escape skips it. */
export function ChapterCard({ round, onDone }: { round: number; onDone: () => void }) {
  const { config, slotAssetId, slotPresentation } = useGameConfig();

  useEffect(() => {
    const timer = window.setTimeout(onDone, config.animations.level === "off" ? 400 : DURATION_MS);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDone();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDone, config.animations.level]);

  const panels = SLOTS.comicPanels.filter((n) => slotAssetId(n));
  const slot = slotAssetId(SLOTS.rematch) ? SLOTS.rematch : panels.length ? panels[(round - 1) % panels.length] : null;
  const title = fillTemplate(config.comic.chapterTitle, { round });

  return (
    <button type="button" onClick={onDone} className="chapter-card" aria-label={`${title}. Continue`}>
      <span className="chapter-card__inner">
        {slot !== null && (
          <BlendedImage assetId={slotAssetId(slot)} presentation={slotPresentation(slot)} alt="" className="chapter-card__art" />
        )}
        <span className="chapter-card__title font-display">{title}</span>
        {config.reactions.moments.rematch && <span className="chapter-card__sub">{config.reactions.moments.rematch}</span>}
      </span>
    </button>
  );
}
