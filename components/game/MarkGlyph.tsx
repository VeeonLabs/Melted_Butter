import type { GlyphId } from "@/lib/config/types";
import { HamsterArt } from "@/components/media/HamsterArt";

interface MarkGlyphProps {
  glyph: GlyphId;
  className?: string;
  /** Draw or pop the mark in when placed. */
  animate?: boolean;
}

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/**
 * Built-in hand-drawn symbols. Stroke glyphs draw themselves in; filled
 * glyphs pop in. Every glyph is a distinct shape, so colour is never the only cue.
 */
export function MarkGlyph({ glyph, className = "", animate = false }: MarkGlyphProps) {
  if (glyph === "hamster") {
    return <HamsterArt mood="neutral" className={`${className} ${animate ? "mark-pop" : ""}`} />;
  }
  const stroke = glyph === "x" || glyph === "o";
  const cls = `${className} ${animate ? (stroke ? "mark-draw" : "mark-pop") : ""}`;
  const common = { viewBox: "0 0 100 100", "aria-hidden": true, focusable: false, className: cls } as const;

  switch (glyph) {
    case "x":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={13} strokeLinecap="round">
          <path className="mark-stroke" pathLength={1} d="M26 26 L74 74" />
          <path className="mark-stroke" pathLength={1} d="M74 26 L26 74" />
        </svg>
      );
    case "o":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={13} strokeLinecap="round">
          <circle className="mark-stroke" pathLength={1} cx="50" cy="50" r="27" transform="rotate(-100 50 50)" />
        </svg>
      );
    case "rose":
      // A rose head seen from above: cupped bloom with petal folds cut in.
      return (
        <svg {...common}>
          <path d="M50 86 C27 84 14 68 16 48 C18 30 32 18 50 18 C68 18 82 30 84 48 C86 68 73 84 50 86Z" fill="currentColor" />
          <g fill="none" stroke="var(--mb-cell, #fff)" strokeWidth={3.6} strokeLinecap="round" opacity={0.85}>
            <path d="M50 44 C55 40 60 46 56 51 C52 56 43 54 42 47 C41 38 52 33 60 37" />
            <path d="M34 50 C33 36 46 27 59 30 C70 33 74 46 69 57" />
            <path d="M28 62 C34 74 52 78 64 70" />
          </g>
        </svg>
      );
    case "moon":
      return (
        <svg {...common} fill="currentColor">
          <path d="M62 16 A36 36 0 1 0 84 66 A29 29 0 0 1 62 16 Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor">
          <polygon points={starPoints(50, 53, 36, 15)} strokeLinejoin="round" stroke="currentColor" strokeWidth={4} />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill="currentColor">
          <path d="M50 84 C20 64 12 46 20 32 C28 19 45 21 50 34 C55 21 72 19 80 32 C88 46 80 64 50 84 Z" />
        </svg>
      );
    case "pearl":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="28" fill="currentColor" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth={3} />
          <ellipse cx="40" cy="39" rx="9" ry="6" fill="rgb(255 255 255 / 0.7)" transform="rotate(-30 40 39)" />
        </svg>
      );
    case "blossom":
      return (
        <svg {...common} fill="currentColor">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="50" cy="29" rx="13" ry="19" transform={`rotate(${a} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="9" fill="rgb(255 255 255 / 0.75)" />
        </svg>
      );
    case "planet":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="22" fill="currentColor" />
          <ellipse cx="50" cy="52" rx="40" ry="11" fill="none" stroke="currentColor" strokeWidth={5} transform="rotate(-18 50 50)" />
        </svg>
      );
  }
}
