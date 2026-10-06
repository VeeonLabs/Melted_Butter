"use client";

import { useMemo } from "react";
import { HamsterArt } from "@/components/media/HamsterArt";
import { seededRandom } from "@/lib/config/reactionEngine";
import type { ThemeEffects } from "@/lib/themes/types";

/**
 * Decorative atmosphere. Positions come from a fixed seed so they're stable
 * across renders and identical on server and client. Everything here is
 * aria-hidden and ignores the pointer.
 */
export function EffectsLayer({ effects }: { effects: ThemeEffects }) {
  const r = useMemo(() => {
    const rand = seededRandom("melted-butter-fx");
    return Array.from({ length: 120 }, () => rand());
  }, []);
  const at = (i: number) => r[i % r.length];

  return (
    <div aria-hidden="true" className="mb-fx pointer-events-none absolute inset-0 overflow-hidden">
      {effects.nebula && (
        <>
          <div className="fx-nebula" style={{ left: "-20%", top: "-10%", background: "var(--mb-p2)" }} />
          <div className="fx-nebula" style={{ right: "-25%", top: "30%", background: "var(--mb-p1)", animationDelay: "-6s" }} />
          <div className="fx-nebula" style={{ left: "10%", bottom: "-20%", background: "var(--mb-accent)", opacity: 0.12 }} />
        </>
      )}
      {effects.halftone && <div className="fx-halftone" />}
      {effects.speedLines && <div className="fx-speedlines" />}
      {effects.stars &&
        Array.from({ length: 46 }, (_, i) => (
          <span
            key={`s${i}`}
            className="fx-star"
            style={{
              left: `${at(i) * 100}%`,
              top: `${at(i + 50) * 100}%`,
              width: at(i + 3) > 0.85 ? 3 : 2,
              height: at(i + 3) > 0.85 ? 3 : 2,
              animationDelay: `${-at(i + 7) * 5}s`,
              animationDuration: `${3 + at(i + 9) * 4}s`,
            }}
          />
        ))}
      {effects.constellations && (
        <svg className="fx-constellation" viewBox="0 0 200 120" style={{ left: "4%", top: "9%" }}>
          <polyline points="10,90 46,60 80,72 120,30 170,42" />
          {[
            [10, 90],
            [46, 60],
            [80, 72],
            [120, 30],
            [170, 42],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="3" />
          ))}
        </svg>
      )}
      {effects.shootingStars && <span className="fx-shooting" />}
      {effects.moon && <div className="fx-moon" />}
      {effects.planets && (
        <>
          <div className="fx-planet" style={{ right: "6%", top: "14%", width: 54, height: 54, background: "var(--mb-p2)" }} />
          <div className="fx-planet fx-planet--ring" style={{ left: "5%", bottom: "16%", width: 34, height: 34, background: "var(--mb-p1)" }} />
        </>
      )}
      {effects.sparkles &&
        Array.from({ length: 14 }, (_, i) => (
          <span
            key={`p${i}`}
            className="fx-sparkle"
            style={{ left: `${at(i + 20) * 100}%`, bottom: `${-5 - at(i + 30) * 10}%`, animationDelay: `${-at(i + 40) * 14}s` }}
          />
        ))}
      {effects.petals !== "none" &&
        Array.from({ length: 12 }, (_, i) => (
          <span
            key={`f${i}`}
            className={`fx-petal fx-petal--${effects.petals}`}
            style={{
              left: `${at(i + 60) * 100}%`,
              animationDelay: `${-at(i + 70) * 18}s`,
              animationDuration: `${14 + at(i + 80) * 10}s`,
            }}
          />
        ))}
      {effects.bubbles &&
        Array.from({ length: 12 }, (_, i) => (
          <span
            key={`b${i}`}
            className="fx-bubble"
            style={{
              left: `${at(i + 90) * 100}%`,
              width: 8 + at(i + 100) * 22,
              height: 8 + at(i + 100) * 22,
              animationDelay: `${-at(i + 110) * 16}s`,
            }}
          />
        ))}
      {effects.pearls && (
        <div className="fx-pearls">
          {Array.from({ length: 11 }, (_, i) => (
            <span key={i} style={{ transform: `translateY(${Math.sin(i / 1.7) * 9}px)` }} />
          ))}
        </div>
      )}
      {effects.hamsters && (
        <>
          <HamsterArt mood="sleepy" fur="#e8b07a" className="fx-hamster" />
          <HamsterArt mood="happy" fur="#f2e2cc" className="fx-hamster fx-hamster--right" />
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={`seed${i}`}
              className="fx-seed"
              style={{ left: `${at(i + 5) * 100}%`, top: `${at(i + 15) * 100}%`, rotate: `${at(i + 25) * 180}deg` }}
            />
          ))}
        </>
      )}
    </div>
  );
}
