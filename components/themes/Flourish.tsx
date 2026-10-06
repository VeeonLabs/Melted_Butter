import type { CSSProperties } from "react";
import type { Flourish as FlourishKind } from "@/lib/themes/types";

/** Small celebratory particles. One component; the theme picks the shape via data-kind. */
export function Flourish({ kind }: { kind: FlourishKind }) {
  if (kind === "none") return null;
  return (
    <div aria-hidden="true" className="mb-flourish" data-kind={kind}>
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 70 + (i % 3) * 26;
        return (
          <span
            key={i}
            style={
              {
                "--dx": `${Math.cos(angle) * dist}px`,
                "--dy": `${Math.sin(angle) * dist * 0.7}px`,
                "--spin": `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg`,
                "--delay": `${(i % 4) * 40}ms`,
                "--hue": i % 3,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
