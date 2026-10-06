"use client";

import { useId, type ReactNode } from "react";
import type { MotifId } from "@/lib/themes/motifs";

/**
 * Original placeholder artwork, drawn for Melted Butter. Every motif uses
 * currentColor (the piece's tint) plus theme variables, so it recolours with
 * the theme. These show the intended composition until the owner uploads art.
 */

const INK = "var(--mb-ink)";
const SURFACE = "var(--mb-surface)";
const BG = "var(--mb-bg)";

const star4 = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} Q${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} Q${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} Q${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}Z`;
const heart = (x: number, y: number, s: number) =>
  `M${x} ${y + s * 0.9} C${x - s * 1.2} ${y + s * 0.1} ${x - s * 0.9} ${y - s * 0.8} ${x} ${y - s * 0.2} C${x + s * 0.9} ${y - s * 0.8} ${x + s * 1.2} ${y + s * 0.1} ${x} ${y + s * 0.9}Z`;
const blossom = (cx: number, cy: number, r: number, key: string) => (
  <g key={key}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse key={a} cx={cx} cy={cy - r * 0.55} rx={r * 0.38} ry={r * 0.55} transform={`rotate(${a} ${cx} ${cy})`} fill="currentColor" opacity={0.9} />
    ))}
    <circle cx={cx} cy={cy} r={r * 0.2} fill="var(--mb-highlight)" />
  </g>
);

type Draw = (uid: string) => ReactNode;

const MOTIFS: Record<MotifId, { viewBox: string; draw: Draw }> = {
  "pearl-strand": {
    viewBox: "0 0 200 80",
    draw: (u) => (
      <>
        <defs>
          <radialGradient id={`${u}p`} cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#f4ede4" />
            <stop offset="1" stopColor="currentColor" />
          </radialGradient>
        </defs>
        <path d="M6 18 Q100 92 194 22" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
        {Array.from({ length: 15 }, (_, i) => {
          const t = i / 14;
          const x = (1 - t) ** 2 * 6 + 2 * (1 - t) * t * 100 + t ** 2 * 194;
          const y = (1 - t) ** 2 * 18 + 2 * (1 - t) * t * 92 + t ** 2 * 22;
          return <circle key={i} cx={x} cy={y} r={5.4} fill={`url(#${u}p)`} />;
        })}
      </>
    ),
  },
  "pearl-cluster": {
    viewBox: "0 0 100 80",
    draw: (u) => (
      <>
        <defs>
          <radialGradient id={`${u}p`} cx="35%" cy="30%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.6" stopColor="#efe6da" />
            <stop offset="1" stopColor="currentColor" />
          </radialGradient>
        </defs>
        <path d="M18 70 Q14 34 40 22 Q66 34 62 70 Z" fill={SURFACE} stroke="currentColor" strokeWidth="1.4" />
        {[26, 33, 40, 47, 54].map((x) => (
          <path key={x} d={`M40 68 L${x} 30`} stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
        ))}
        <circle cx="70" cy="58" r="10" fill={`url(#${u}p)`} />
        <circle cx="84" cy="66" r="7" fill={`url(#${u}p)`} />
        <circle cx="62" cy="72" r="5.5" fill={`url(#${u}p)`} />
      </>
    ),
  },
  moon: {
    viewBox: "0 0 100 100",
    draw: (u) => (
      <>
        <defs>
          <radialGradient id={`${u}m`} cx="40%" cy="38%" r="65%">
            <stop offset="0" stopColor="#fffaf0" />
            <stop offset="0.7" stopColor="#e9e3d2" />
            <stop offset="1" stopColor="#cfc7b4" />
          </radialGradient>
          <radialGradient id={`${u}g`}>
            <stop offset="0.55" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={`url(#${u}g)`} />
        <circle cx="50" cy="50" r="30" fill={`url(#${u}m)`} />
        <circle cx="42" cy="44" r="4.5" fill="#d8d0bd" opacity="0.7" />
        <circle cx="58" cy="58" r="6" fill="#d8d0bd" opacity="0.55" />
        <circle cx="60" cy="40" r="2.5" fill="#d8d0bd" opacity="0.6" />
      </>
    ),
  },
  crescent: {
    viewBox: "0 0 100 100",
    draw: () => <path d="M64 10 A42 42 0 1 0 90 74 A34 34 0 0 1 64 10 Z" fill="currentColor" />,
  },
  constellation: {
    viewBox: "0 0 120 80",
    draw: () => (
      <g stroke="currentColor" strokeWidth="0.8" fill="currentColor">
        <polyline points="8,62 34,40 58,50 84,18 112,28" fill="none" opacity="0.6" />
        {[
          [8, 62, 2.2],
          [34, 40, 3],
          [58, 50, 2],
          [84, 18, 3.4],
          [112, 28, 2.4],
        ].map(([x, y, r]) => (
          <circle key={`${x}`} cx={x} cy={y} r={r} />
        ))}
      </g>
    ),
  },
  planet: {
    viewBox: "0 0 120 100",
    draw: (u) => (
      <>
        <defs>
          <radialGradient id={`${u}pl`} cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="0.35" stopColor="currentColor" />
            <stop offset="1" stopColor={BG} />
          </radialGradient>
        </defs>
        <path d="M14 62 A48 14 -14 0 1 106 38" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.6" />
        <circle cx="60" cy="50" r="30" fill={`url(#${u}pl)`} />
        <path d="M106 38 A48 14 -14 0 1 14 62" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.85" />
      </>
    ),
  },
  sparkles: {
    viewBox: "0 0 100 100",
    draw: () => (
      <g fill="currentColor">
        <path d={star4(40, 46, 26)} />
        <path d={star4(78, 22, 12)} opacity="0.8" />
        <path d={star4(76, 76, 8)} opacity="0.65" />
      </g>
    ),
  },
  rose: {
    viewBox: "0 0 100 100",
    draw: () => (
      <g>
        {[0, 72, 144, 216, 288].map((a) => (
          <path key={a} d="M50 50 C30 40 30 12 50 10 C70 12 70 40 50 50Z" fill="currentColor" opacity="0.55" transform={`rotate(${a + 18} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="22" fill="currentColor" opacity="0.9" />
        <path d="M50 44 a6 6 0 1 1 7 5 a12 12 0 1 1 -18 -10 a18 18 0 1 1 2 26" fill="none" stroke={BG} strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      </g>
    ),
  },
  "rose-stem": {
    viewBox: "0 0 60 120",
    draw: () => (
      <g>
        <path d="M30 118 C26 86 36 64 30 34" fill="none" stroke="#5c7a4f" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M29 84 C14 80 10 68 12 62 C22 64 28 72 29 84Z" fill="#6e8c5d" />
        <path d="M31 66 C46 62 50 52 48 46 C38 48 32 56 31 66Z" fill="#6e8c5d" />
        <path d="M30 36 C18 30 18 12 30 6 C42 12 42 30 30 36Z" fill="currentColor" />
        <path d="M30 36 C22 28 24 16 30 12 C36 16 38 28 30 36Z" fill={BG} opacity="0.25" />
      </g>
    ),
  },
  "blossom-branch": {
    viewBox: "0 0 200 90",
    draw: () => (
      <g>
        <path d="M2 14 C50 22 80 40 120 44 C150 47 175 60 198 80" fill="none" stroke="#6b4a3a" strokeWidth="3" strokeLinecap="round" />
        <path d="M80 38 C90 24 100 18 112 16" fill="none" stroke="#6b4a3a" strokeWidth="2" strokeLinecap="round" />
        {blossom(48, 22, 14, "a")}
        {blossom(112, 16, 11, "b")}
        {blossom(130, 50, 13, "c")}
        {blossom(176, 70, 10, "d")}
        <circle cx="86" cy="46" r="3.5" fill="currentColor" opacity="0.7" />
        <circle cx="156" cy="56" r="3" fill="currentColor" opacity="0.7" />
      </g>
    ),
  },
  petals: {
    viewBox: "0 0 100 100",
    draw: () => (
      <g fill="currentColor">
        {[
          [24, 30, -20, 1],
          [64, 18, 30, 0.8],
          [44, 62, 70, 0.9],
          [80, 70, -40, 0.6],
          [16, 82, 15, 0.5],
        ].map(([x, y, r, o]) => (
          <path key={`${x}${y}`} d={`M${x} ${y} c6 -9 16 -6 14 2 c-2 7 -10 7 -14 -2z`} transform={`rotate(${r} ${x} ${y})`} opacity={o} />
        ))}
      </g>
    ),
  },
  "hamster-peek": {
    viewBox: "0 0 100 64",
    draw: () => (
      <g>
        <circle cx="26" cy="16" r="10" fill="currentColor" />
        <circle cx="74" cy="16" r="10" fill="currentColor" />
        <circle cx="26" cy="17" r="5" fill="#f6a5b4" />
        <circle cx="74" cy="17" r="5" fill="#f6a5b4" />
        <path d="M12 60 C12 26 30 12 50 12 C70 12 88 26 88 60Z" fill="currentColor" />
        <ellipse cx="50" cy="56" rx="20" ry="10" fill="#fff4e6" />
        <path d="M36 38 q4 -5 8 0 M56 38 q4 -5 8 0" stroke="#3a2418" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="31" cy="47" r="5" fill="#f6a5b4" opacity="0.75" />
        <circle cx="69" cy="47" r="5" fill="#f6a5b4" opacity="0.75" />
        <ellipse cx="50" cy="45" rx="2.6" ry="2" fill="#c96a7e" />
        <ellipse cx="34" cy="61" rx="7" ry="4" fill="#fff4e6" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="66" cy="61" rx="7" ry="4" fill="#fff4e6" stroke="currentColor" strokeWidth="1.5" />
      </g>
    ),
  },
  seeds: {
    viewBox: "0 0 100 60",
    draw: () => (
      <g>
        {[
          [18, 30, -30],
          [38, 18, 20],
          [56, 38, -10],
          [76, 24, 40],
          [88, 46, -50],
        ].map(([x, y, r]) => (
          <g key={`${x}`} transform={`rotate(${r} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx="5" ry="9" fill="#3b2a1e" />
            <path d={`M${x} ${y - 8} L${x} ${y + 8}`} stroke="#e9dcc5" strokeWidth="1.6" />
          </g>
        ))}
      </g>
    ),
  },
  waves: {
    viewBox: "0 0 200 40",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M0 12 Q25 4 50 12 T100 12 T150 12 T200 12" strokeWidth="1.6" />
        <path d="M10 24 Q35 16 60 24 T110 24 T160 24 T210 24" strokeWidth="1.2" opacity="0.7" />
        <path d="M-5 35 Q20 28 45 35 T95 35 T145 35 T195 35" strokeWidth="0.9" opacity="0.45" />
      </g>
    ),
  },
  "horizon-sun": {
    viewBox: "0 0 200 100",
    draw: (u) => (
      <>
        <defs>
          <radialGradient id={`${u}s`} cx="50%" cy="100%" r="60%">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.55" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="200" height="60" fill={`url(#${u}s)`} />
        <path d="M70 60 A30 30 0 0 1 130 60Z" fill="currentColor" />
        <line x1="0" y1="60" x2="200" y2="60" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        {[66, 72, 79, 87, 96].map((y, i) => (
          <line key={y} x1={78 + i * 2} y1={y} x2={122 - i * 2} y2={y} stroke="currentColor" strokeWidth="2" opacity={0.6 - i * 0.1} strokeLinecap="round" />
        ))}
      </>
    ),
  },
  pebbles: {
    viewBox: "0 0 100 50",
    draw: () => (
      <g fill="currentColor">
        <ellipse cx="20" cy="34" rx="14" ry="8" opacity="0.7" />
        <ellipse cx="46" cy="38" rx="9" ry="6" opacity="0.5" />
        <ellipse cx="66" cy="30" rx="12" ry="7" opacity="0.6" />
        <ellipse cx="86" cy="40" rx="6" ry="4" opacity="0.4" />
      </g>
    ),
  },
  coupe: {
    viewBox: "0 0 80 110",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M10 30 Q40 58 70 30 Z" fill="currentColor" fillOpacity="0.18" />
        <path d="M10 30 L70 30" />
        <path d="M40 44 L40 96 M24 100 Q40 92 56 100" />
        {[
          [32, 22, 2],
          [46, 14, 2.6],
          [38, 6, 1.8],
          [52, 24, 1.6],
        ].map(([x, y, r]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={r} strokeWidth="1.1" />
        ))}
      </g>
    ),
  },
  "brush-stroke": {
    viewBox: "0 0 200 60",
    draw: () => (
      <path
        d="M6 38 C30 18 70 14 104 18 C138 22 170 14 194 22 C190 30 184 34 176 36 C150 42 120 38 92 42 C64 46 36 52 10 50 C4 46 3 42 6 38Z M40 46 l30 -3 M120 34 l40 -4"
        fill="currentColor"
      />
    ),
  },
  palette: {
    viewBox: "0 0 100 80",
    draw: () => (
      <g>
        <path d="M50 6 C80 6 96 24 94 42 C92 56 78 54 72 60 C66 68 74 76 58 76 C26 76 6 60 6 40 C6 20 24 6 50 6Z" fill={SURFACE} stroke="currentColor" strokeWidth="1.6" />
        <ellipse cx="66" cy="62" rx="6" ry="5" fill={BG} stroke="currentColor" strokeWidth="1.2" />
        <circle cx="28" cy="30" r="7" fill="var(--mb-p1)" />
        <circle cx="48" cy="20" r="6.5" fill="var(--mb-accent)" />
        <circle cx="70" cy="26" r="6" fill="var(--mb-p2)" />
        <circle cx="24" cy="52" r="6" fill="var(--mb-highlight)" />
        <circle cx="44" cy="60" r="5" fill={INK} />
      </g>
    ),
  },
  "paint-dabs": {
    viewBox: "0 0 100 70",
    draw: () => (
      <g>
        <path d="M10 30 C14 16 34 14 40 24 C46 34 32 44 20 42 C12 40 8 36 10 30Z" fill="currentColor" />
        <path d="M52 16 C60 8 76 10 78 20 C80 30 66 34 58 30 C52 27 49 21 52 16Z" fill="var(--mb-accent)" />
        <path d="M60 46 C66 40 82 42 82 52 C82 60 70 62 64 58 C58 55 56 50 60 46Z" fill="var(--mb-p2)" opacity="0.9" />
        <circle cx="46" cy="52" r="2.2" fill="currentColor" />
        <circle cx="90" cy="30" r="1.8" fill="var(--mb-accent)" />
      </g>
    ),
  },
  "ornament-corner": {
    viewBox: "0 0 100 100",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 96 L4 30 Q4 4 30 4 L96 4" />
        <path d="M12 96 L12 36 Q12 12 36 12 L96 12" opacity="0.5" />
        <path d="M30 4 C30 22 22 30 4 30" />
        <path d="M44 12 C52 24 40 34 30 28 C24 24 28 16 34 18" />
        <path d="M12 44 C24 52 34 40 28 30" />
        <circle cx="30" cy="30" r="3" fill="currentColor" />
      </g>
    ),
  },
  arch: {
    viewBox: "0 0 100 130",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M8 128 L8 52 A42 42 0 0 1 92 52 L92 128" strokeWidth="1.6" />
        <path d="M16 128 L16 54 A34 34 0 0 1 84 54 L84 128" strokeWidth="0.9" opacity="0.6" />
        <path d={star4(50, 2.5, 2.5)} fill="currentColor" stroke="none" />
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + ((i + 0.5) * Math.PI) / 9.5;
          return <circle key={i} cx={50 + 38 * Math.cos(a)} cy={54 + 38 * Math.sin(a)} r="0.9" fill="currentColor" stroke="none" />;
        })}
      </g>
    ),
  },
  diagram: {
    viewBox: "0 0 100 90",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="30" cy="30" r="12" />
        <circle cx="74" cy="22" r="8" />
        <circle cx="64" cy="66" r="10" />
        <path d="M42 28 L64 23 M60 29 l4 -6 -7 -1" />
        <path d="M38 40 L56 58 M52 59 l5 0 -1 -6" />
        <text x="24" y="35" fontSize="13" fill="currentColor" stroke="none" fontFamily="var(--font-hand-face), cursive">x</text>
        <text x="58" y="71" fontSize="13" fill="currentColor" stroke="none" fontFamily="var(--font-hand-face), cursive">o</text>
        <path d="M6 84 Q30 76 50 84 T94 82" opacity="0.6" />
      </g>
    ),
  },
  "sticky-note": {
    viewBox: "0 0 80 80",
    draw: () => (
      <g>
        <path d="M4 6 L76 4 L74 60 L58 76 L6 74Z" fill="currentColor" />
        <path d="M58 76 L60 60 L74 60Z" fill={INK} opacity="0.15" />
        {[24, 36, 48].map((y, i) => (
          <path key={y} d={`M14 ${y} Q${30 + i * 4} ${y - 3} ${58 - i * 8} ${y}`} stroke={INK} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6" />
        ))}
      </g>
    ),
  },
  paperclip: {
    viewBox: "0 0 30 80",
    draw: () => (
      <path d="M10 22 L10 64 A8 8 0 0 0 26 64 L26 14 A10 10 0 0 0 6 14 L6 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    ),
  },
  "speed-lines": {
    viewBox: "0 0 200 200",
    draw: () => (
      <g stroke="currentColor" strokeLinecap="round">
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r1 = 62 + (i % 3) * 8;
          return (
            <line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + 100 * Math.cos(a)} y2={100 + 100 * Math.sin(a)} strokeWidth={i % 2 ? 1 : 2} />
          );
        })}
      </g>
    ),
  },
  panels: {
    viewBox: "0 0 100 140",
    draw: (u) => (
      <>
        <defs>
          <pattern id={`${u}t`} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1" fill="currentColor" opacity="0.55" />
          </pattern>
          <linearGradient id={`${u}f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id={`${u}m`}>
            <rect width="100" height="140" fill={`url(#${u}f)`} />
          </mask>
        </defs>
        <rect x="4" y="4" width="70" height="78" fill={SURFACE} stroke="currentColor" strokeWidth="2" />
        <rect x="4" y="4" width="70" height="78" fill={`url(#${u}t)`} mask={`url(#${u}m)`} />
        <circle cx="39" cy="38" r="12" fill="currentColor" opacity="0.85" />
        <path d="M15 82 C18 60 60 60 63 82" fill="currentColor" opacity="0.85" />
        <rect x="26" y="70" width="70" height="66" fill={SURFACE} stroke="currentColor" strokeWidth="2" />
        <path d="M30 114 Q60 96 92 110" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M30 124 Q60 108 92 120" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      </>
    ),
  },
  screentone: {
    viewBox: "0 0 100 100",
    draw: (u) => (
      <>
        <defs>
          <pattern id={`${u}d`} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.4" fill="currentColor" />
          </pattern>
          <radialGradient id={`${u}g`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id={`${u}m`}>
            <rect width="100" height="100" fill={`url(#${u}g)`} />
          </mask>
        </defs>
        <rect width="100" height="100" fill={`url(#${u}d)`} mask={`url(#${u}m)`} />
      </>
    ),
  },
  hearts: {
    viewBox: "0 0 100 80",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d={heart(36, 36, 20)} transform="rotate(-10 36 36)" />
        <path d={heart(76, 26, 11)} transform="rotate(14 76 26)" opacity="0.75" />
        <path d={heart(70, 62, 7)} opacity="0.55" />
      </g>
    ),
  },
  ribbon: {
    viewBox: "0 0 100 70",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 30 C34 10 10 14 14 28 C18 40 40 36 50 30Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M50 30 C66 10 90 14 86 28 C82 40 60 36 50 30Z" fill="currentColor" fillOpacity="0.2" />
        <circle cx="50" cy="30" r="4.5" fill="currentColor" />
        <path d="M48 34 C42 48 36 56 28 66 M52 34 C58 48 66 58 76 64" />
      </g>
    ),
  },
  "border-line": {
    viewBox: "0 0 300 20",
    draw: () => (
      <g stroke="currentColor" strokeLinecap="round">
        <line x1="4" y1="10" x2="296" y2="10" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1={20 + i * 24} y1="6" x2={20 + i * 24} y2="14" strokeWidth="1" opacity="0.6" />
        ))}
        <circle cx="296" cy="10" r="3.5" fill="currentColor" />
      </g>
    ),
  },
  "torn-strip": {
    viewBox: "0 0 60 160",
    draw: () => (
      <path
        d="M6 2 L54 4 L52 20 L56 34 L51 52 L55 70 L50 88 L54 104 L50 122 L55 140 L52 158 L8 156 L11 140 L5 122 L10 104 L4 86 L9 70 L4 52 L8 36 L3 20Z"
        fill={SURFACE}
        stroke="currentColor"
        strokeWidth="1.2"
      />
    ),
  },
  window: {
    viewBox: "0 0 100 120",
    draw: (u) => (
      <>
        <defs>
          <linearGradient id={`${u}l`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <rect x="10" y="6" width="80" height="100" fill={`url(#${u}l)`} stroke="currentColor" strokeWidth="2.5" />
        <line x1="50" y1="6" x2="50" y2="106" stroke="currentColor" strokeWidth="2" />
        <line x1="10" y1="52" x2="90" y2="52" stroke="currentColor" strokeWidth="2" />
        <rect x="4" y="106" width="92" height="6" fill="currentColor" opacity="0.6" />
      </>
    ),
  },
  bulb: {
    viewBox: "0 0 40 110",
    draw: (u) => (
      <>
        <defs>
          <radialGradient id={`${u}b`}>
            <stop offset="0" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <line x1="20" y1="0" x2="20" y2="70" stroke={INK} strokeWidth="1" opacity="0.6" />
        <rect x="15" y="68" width="10" height="8" fill={INK} opacity="0.7" />
        <circle cx="20" cy="86" r="20" fill={`url(#${u}b)`} />
        <ellipse cx="20" cy="86" rx="8" ry="10" fill="currentColor" />
      </>
    ),
  },
  tag: {
    viewBox: "0 0 200 80",
    draw: () => (
      <g fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 62 C16 30 24 18 30 22 C36 26 30 52 34 54 C40 50 44 20 52 22 C58 26 52 56 58 60" />
        <path d="M74 20 C70 40 68 56 72 62 C80 54 96 40 92 30 C88 22 76 30 76 40 C88 40 100 50 94 60 C88 66 78 64 74 60" />
        <path d="M116 58 C130 52 150 48 188 40" strokeWidth="3.5" />
        <path d="M184 30 l8 10 -10 6" strokeWidth="3.5" />
      </g>
    ),
  },
  sticker: {
    viewBox: "0 0 100 100",
    draw: () => {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 ? 22 : 46;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${50 + r * Math.cos(a)},${52 + r * Math.sin(a)}`;
      }).join(" ");
      return (
        <g>
          <polygon points={pts} fill="#ffffff" stroke="#ffffff" strokeWidth="9" strokeLinejoin="round" />
          <polygon points={pts} fill="currentColor" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <text x="50" y="58" textAnchor="middle" fontSize="15" fontWeight="700" fill={INK} fontFamily="var(--font-marker-face), sans-serif">
            MB
          </text>
        </g>
      );
    },
  },
  poster: {
    viewBox: "0 0 100 130",
    draw: (u) => (
      <>
        <defs>
          <pattern id={`${u}h`} width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.2" fill="var(--mb-p1)" />
          </pattern>
        </defs>
        <rect x="6" y="8" width="88" height="116" fill={SURFACE} stroke={INK} strokeWidth="1.2" />
        <rect x="6" y="64" width="88" height="60" fill={`url(#${u}h)`} opacity="0.6" />
        <text x="12" y="44" fontSize="26" fontWeight="900" fill={INK} fontFamily="var(--font-modern-face), sans-serif" letterSpacing="-1">
          BUT
        </text>
        <text x="12" y="66" fontSize="26" fontWeight="900" fill="var(--mb-p2)" fontFamily="var(--font-modern-face), sans-serif" letterSpacing="-1">
          TER
        </text>
        <rect x="34" y="0" width="34" height="14" fill="#f3ead2" opacity="0.85" transform="rotate(-4 50 7)" />
      </>
    ),
  },
  tape: {
    viewBox: "0 0 100 30",
    draw: () => <path d="M4 4 L96 2 L92 8 L97 14 L93 20 L98 27 L6 28 L9 22 L3 16 L8 10Z" fill="#f3ead2" opacity="0.85" />,
  },
  "wax-seal": {
    viewBox: "0 0 100 100",
    draw: () => (
      <g>
        <path d="M50 6 C66 4 70 14 82 18 C94 24 90 38 94 50 C98 64 86 70 82 82 C76 94 62 92 50 94 C36 96 30 86 18 82 C6 76 10 62 6 50 C2 36 14 30 18 18 C24 8 36 8 50 6Z" fill="currentColor" />
        <circle cx="50" cy="50" r="30" fill="none" stroke={BG} strokeWidth="2" opacity="0.4" />
        <path d={heart(50, 50, 14)} fill={BG} opacity="0.35" />
      </g>
    ),
  },
  thorns: {
    viewBox: "0 0 200 40",
    draw: () => (
      <g fill="currentColor" stroke="currentColor" strokeLinecap="round">
        <path d="M2 24 C40 10 70 34 110 20 C140 10 170 26 198 16" fill="none" strokeWidth="2" />
        {[24, 58, 92, 126, 160].map((x, i) => (
          <path key={x} d={`M${x} ${i % 2 ? 22 : 20} l4 ${i % 2 ? 8 : -8} l4 ${i % 2 ? -7 : 7}Z`} strokeWidth="0.5" />
        ))}
      </g>
    ),
  },
  burst: {
    viewBox: "0 0 100 100",
    draw: () => {
      const pts = Array.from({ length: 24 }, (_, i) => {
        const r = i % 2 ? 30 : 48;
        const a = (Math.PI / 12) * i;
        return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
      }).join(" ");
      return (
        <g>
          <polygon points={pts} fill="currentColor" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <text x="50" y="62" textAnchor="middle" fontSize="34" fill={INK} fontFamily="var(--font-comic-face), Impact, sans-serif">
            !
          </text>
        </g>
      );
    },
  },
  number: {
    viewBox: "0 0 80 60",
    draw: () => (
      <g>
        <text x="2" y="48" fontSize="50" fontWeight="800" fill="none" stroke="currentColor" strokeWidth="1.6" fontFamily="var(--font-modern-face), sans-serif">
          01
        </text>
        <line x1="2" y1="56" x2="78" y2="56" stroke="currentColor" strokeWidth="2" />
      </g>
    ),
  },
};

export function Motif({ id, className = "" }: { id: MotifId; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const m = MOTIFS[id];
  return (
    <svg viewBox={m.viewBox} className={className} aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      {m.draw(uid)}
    </svg>
  );
}

/** Natural aspect of a motif, so owner art can default to the same footprint. */
export function motifAspect(id: MotifId): number {
  const [, , w, h] = MOTIFS[id].viewBox.split(" ").map(Number);
  return w / h;
}
