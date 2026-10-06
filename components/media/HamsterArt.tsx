export type HamsterMood = "happy" | "sad" | "smug" | "neutral" | "sleepy";

interface HamsterArtProps {
  mood?: HamsterMood;
  /** Fur colour; defaults to currentColor so it follows the player colour. */
  fur?: string;
  className?: string;
  title?: string;
}

/** An original round hamster, drawn in SVG. Mood changes the face only. */
export function HamsterArt({ mood = "neutral", fur = "currentColor", className = "", title }: HamsterArtProps) {
  const eyes = {
    happy: (
      <g stroke="#3a2418" strokeWidth={3.2} strokeLinecap="round" fill="none">
        <path d="M36 50 q4 -5 8 0" />
        <path d="M56 50 q4 -5 8 0" />
      </g>
    ),
    sad: (
      <g fill="#3a2418">
        <circle cx="40" cy="51" r="3.4" />
        <circle cx="60" cy="51" r="3.4" />
        <path d="M63 56 q2 6 0 9 q-2 -3 0 -9z" fill="#8fd3ff" />
      </g>
    ),
    smug: (
      <g stroke="#3a2418" strokeWidth={3.2} strokeLinecap="round">
        <path d="M35 51 h9" />
        <path d="M56 51 h9" />
      </g>
    ),
    neutral: (
      <g fill="#3a2418">
        <circle cx="40" cy="50" r="3.6" />
        <circle cx="60" cy="50" r="3.6" />
        <circle cx="41.2" cy="48.8" r="1.1" fill="#fff" />
        <circle cx="61.2" cy="48.8" r="1.1" fill="#fff" />
      </g>
    ),
    sleepy: (
      <g stroke="#3a2418" strokeWidth={3} strokeLinecap="round" fill="none">
        <path d="M36 51 q4 4 8 0" />
        <path d="M56 51 q4 4 8 0" />
      </g>
    ),
  }[mood];

  const mouth = {
    happy: <path d="M45 61 q5 6 10 0" stroke="#3a2418" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
    sad: <path d="M45 64 q5 -5 10 0" stroke="#3a2418" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
    smug: <path d="M46 61 q6 3 10 -2" stroke="#3a2418" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
    neutral: <path d="M47 61 q3 2 6 0" stroke="#3a2418" strokeWidth={2.4} fill="none" strokeLinecap="round" />,
    sleepy: <ellipse cx="50" cy="62" rx="2.6" ry="2" fill="#3a2418" />,
  }[mood];

  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx="26" cy="28" r="11" fill={fur} />
      <circle cx="74" cy="28" r="11" fill={fur} />
      <circle cx="26" cy="29" r="6" fill="#f6a5b4" />
      <circle cx="74" cy="29" r="6" fill="#f6a5b4" />
      <ellipse cx="50" cy="56" rx="38" ry="34" fill={fur} />
      <ellipse cx="50" cy="68" rx="24" ry="20" fill="#fff4e6" />
      <circle cx="31" cy="60" r="6.5" fill="#f6a5b4" opacity={0.75} />
      <circle cx="69" cy="60" r="6.5" fill="#f6a5b4" opacity={0.75} />
      {eyes}
      <ellipse cx="50" cy="57" rx="3" ry="2.2" fill="#c96a7e" />
      {mouth}
      {mood === "sleepy" && (
        <text x="74" y="22" fontSize="14" fill="#9fb4ff" fontWeight="700">
          z
        </text>
      )}
    </svg>
  );
}
