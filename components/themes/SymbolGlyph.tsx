import { MarkGlyph } from "@/components/game/MarkGlyph";
import { HamsterArt } from "@/components/media/HamsterArt";
import type { SymbolConfig } from "@/lib/config/types";

/** Draws a symbol from config alone (no slots), for thumbnails and previews. */
export function SymbolGlyph({ symbol, index, className = "" }: { symbol: SymbolConfig; index: 0 | 1; className?: string }) {
  if (symbol.kind === "emoji") {
    return (
      <span className={`mb-emoji ${className}`} aria-hidden="true">
        {symbol.emoji}
      </span>
    );
  }
  if (symbol.kind === "glyph" && symbol.glyph === "hamster") return <HamsterArt mood={index ? "smug" : "happy"} className={className} />;
  return <MarkGlyph glyph={symbol.kind === "glyph" ? symbol.glyph : index ? "o" : "x"} className={className} />;
}
