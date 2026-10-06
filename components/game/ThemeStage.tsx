"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { CollageLayer } from "@/components/themes/CollageLayer";
import { themeDataAttrs, themeStyleVars } from "@/lib/config/resolve";
import type { Rect } from "@/lib/worlds/collage";
import { backgroundFallbackOrder, deviceFor } from "@/lib/worlds/roles";
import { SLOTS } from "@/lib/config/slots";
import { EffectsLayer } from "./EffectsLayer";
import { ThemeFrontendBackdrop } from "@/components/themes/ThemeFrontendArtwork";

interface ThemeStageProps {
  children: ReactNode;
  /** Page mode pins the background to the viewport; contained mode (studio preview) keeps it inside the box. */
  contained?: boolean;
  className?: string;
}

/**
 * Turns the resolved theme package into CSS variables and data attributes.
 * Every visual primitive (layout, board, frame, cards, type, texture…) is
 * styled from those attributes, so themes are configuration, not branches.
 */
/** Width tokens the CSS composes against (e.g. [data-size~="ge760"]). */
export function sizeTokens(width: number): string {
  const t: string[] = [];
  if (width <= 420) t.push("le420");
  if (width <= 640) t.push("le640");
  if (width >= 640) t.push("ge640");
  if (width >= 760) t.push("ge760");
  if (width >= 900) t.push("ge900");
  if (width <= 1099) t.push("le1099");
  return t.join(" ");
}

/**
 * Measures the stage itself rather than the viewport, so composition follows
 * the space the scene really has: the narrow Studio preview gets exactly the
 * phone composition. (Measured instead of CSS container queries, which would
 * also re-anchor position: fixed backdrops and overlays to the stage.)
 */
function useStageGeometry() {
  const ref = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ width: number; height: number; safe: Rect | null }>(() => ({
    width: typeof window === "undefined" ? 390 : window.innerWidth,
    height: typeof window === "undefined" ? 844 : window.innerHeight,
    safe: null,
  }));
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let observedScene: Element | null = null;
    const measure = () => {
      const box = el.getBoundingClientRect();
      const scene = el.querySelector(".mb-scene");
      if (scene && scene !== observedScene) {
        observedScene = scene;
        ro.observe(scene);
      }
      const s = scene?.getBoundingClientRect();
      // Rects relative to the stage (unscaled, so the Studio's scaled device preview measures correctly).
      const k = el.offsetWidth ? box.width / el.offsetWidth : 1;
      const safe = s ? { x: (s.left - box.left) / k, y: (s.top - box.top) / k, w: s.width / k, h: s.height / k } : null;
      setGeo((g) => {
        const next = { width: el.offsetWidth, height: el.offsetHeight, safe };
        return JSON.stringify(g) === JSON.stringify(next) ? g : next;
      });
    };
    // Fires once on observe, then on every size change.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, geo] as const;
}

export function ThemeStage({ children, contained = false, className = "" }: ThemeStageProps) {
  const { config, theme, effects, slotAssetId, slotPresentation, role } = useGameConfig();
  const [ref, { width, height, safe }] = useStageGeometry();
  // Contained (Studio device preview): the box is the screen. Page: the browser window is.
  const screenHeight = contained || typeof window === "undefined" ? height : window.innerHeight;
  const device = deviceFor(width, screenHeight);
  // 1. This world's background for the device (desktop → tablet → mobile fallback)
  // 2. the theme's background slot, 3. the main background (31).
  const worldBg = backgroundFallbackOrder(device).map(role).find((r) => r !== null) ?? null;
  const bgSlot = slotAssetId(theme.background.slot) ? theme.background.slot : SLOTS.mainBackground;
  const bg = worldBg ?? (slotAssetId(bgSlot) ? { assetId: slotAssetId(bgSlot)!, presentation: slotPresentation(bgSlot) } : null);
  const collageOn = theme.collage.mode !== "off";

  return (
    <div
      ref={ref}
      data-size={sizeTokens(width)}
      data-device={device}
      data-collage={collageOn ? theme.collage.mode : undefined}
      className={`mb-stage ${className}`}
      style={themeStyleVars(theme) as CSSProperties}
      data-motion={config.animations.level}
      {...themeDataAttrs(theme)}
    >
      <div className={`mb-backdrop ${contained ? "is-contained" : ""}`}>
        {bg && <BlendedImage key={`${theme.id}-${bg.assetId}`} assetId={bg.assetId} presentation={bg.presentation} alt="" fill className="theme-fade mb-backdrop__image" />}
        <ThemeFrontendBackdrop width={width} height={height} />
        {/* Keyed so a theme change fades the new atmosphere in. */}
        <div key={theme.id} className="theme-fade mb-backdrop__fx">
          <span className="mb-texture" />
          <EffectsLayer effects={effects} />
        </div>
      </div>
      {collageOn && <CollageLayer width={width} height={height} safe={safe} device={device} hasBackground={!!worldBg} />}
      {children}
    </div>
  );
}
