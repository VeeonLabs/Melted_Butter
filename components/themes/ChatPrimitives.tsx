import type { ReactNode } from "react";

/**
 * Theme-aware chat building blocks for the future chat feature. There is one
 * chat architecture; themes only change its look through data-bubble and
 * data-sticker on the stage (see globals.css).
 */
export function ChatSurface({ children, label = "Chat" }: { children: ReactNode; label?: string }) {
  return (
    <section className="mb-chat mb-card" aria-label={label}>
      {children}
    </section>
  );
}

export function ChatBubble({ mine = false, author, children }: { mine?: boolean; author?: string; children: ReactNode }) {
  return (
    <div className={`mb-chat__row ${mine ? "is-mine" : ""}`}>
      <p className={`speech-bubble mb-chat__bubble ${mine ? "speech-bubble--right" : ""}`}>
        {author && <span className="mb-chat__author">{author}</span>}
        {children}
      </p>
    </div>
  );
}

export function Sticker({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="mb-sticker" role="img" aria-label={label}>
      {children}
    </span>
  );
}
