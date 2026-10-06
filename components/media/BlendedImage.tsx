"use client";

import type { CSSProperties, ReactNode } from "react";
import { useAssetUrl, useAssets } from "@/components/providers/AssetProvider";
import { useOptionalGameConfig } from "@/components/providers/ConfigProvider";
import type { FrameStyle, ImagePresentation, MaskStyle } from "@/lib/config/types";
import type { ResolvedTheme } from "@/lib/themes/types";

const MASKS: Record<Exclude<MaskStyle, "none" | "blob">, string> = {
  "soft-edge":
    "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), linear-gradient(to bottom, transparent, #000 14%, #000 86%, transparent)",
  vignette: "radial-gradient(ellipse 70% 70% at 50% 50%, #000 50%, transparent 100%)",
  "fade-bottom": "linear-gradient(to bottom, #000 45%, transparent 98%)",
  "fade-top": "linear-gradient(to top, #000 45%, transparent 98%)",
  "fade-sides": "linear-gradient(to right, transparent, #000 22%, #000 78%, transparent)",
  circle: "radial-gradient(circle at 50% 50%, #000 69%, transparent 70.5%)",
};

function frameStyle(frame: FrameStyle): CSSProperties {
  switch (frame) {
    case "panel":
      return { border: "3px solid var(--mb-line)", boxShadow: "5px 5px 0 color-mix(in srgb, var(--mb-line) 85%, transparent)" };
    case "ink":
      return { border: "2px solid var(--mb-ink)" };
    case "polaroid":
      return { background: "#fffaf3", padding: "8px 8px 26px", boxShadow: "0 10px 30px rgb(0 0 0 / 0.25)" };
    case "glow":
      return {
        boxShadow:
          "0 0 0 1px color-mix(in srgb, var(--mb-accent) 45%, transparent), 0 0 34px color-mix(in srgb, var(--mb-accent) 35%, transparent)",
      };
    case "pearl":
      return {
        border: "3px solid rgb(255 255 255 / 0.75)",
        boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.4), 0 8px 24px color-mix(in srgb, var(--mb-ink) 18%, transparent)",
      };
    default:
      return {};
  }
}

/** Turns a presentation into concrete styles, applying theme defaults when "integrate" is on. */
export function presentationStyles(p: ImagePresentation, theme: ResolvedTheme, naturalAspect?: number) {
  const ib = theme.artwork.imageBlend;
  const frame: FrameStyle = p.frame === "theme" ? ib.frame : p.frame;
  const blend = p.integrate && p.blend === "normal" ? ib.blend : p.blend;
  const overlayOpacity = p.integrate ? Math.max(p.overlayOpacity, ib.overlayOpacity) : p.overlayOpacity;
  const overlayColor = p.overlayColor === "theme" ? theme.colors.background : p.overlayColor;
  const mask = p.mask !== "none" && p.mask !== "blob" ? MASKS[p.mask] : undefined;
  const radius = p.mask === "blob" ? "58% 42% 55% 45% / 48% 58% 42% 52%" : p.radius >= 999 ? "9999px" : `${p.radius}px`;
  const aspect = p.aspect === "auto" ? (naturalAspect ? String(naturalAspect) : undefined) : p.aspect;
  const s = p.shadow;

  const wrapper: CSSProperties = {
    position: "relative",
    overflow: frame === "polaroid" ? "visible" : "hidden",
    borderRadius: radius,
    aspectRatio: aspect,
    opacity: p.opacity,
    mixBlendMode: blend,
    boxShadow: s > 0 && frame === "none" ? `0 ${14 * s}px ${40 * s}px rgb(0 0 0 / ${0.5 * s})` : undefined,
    maskImage: mask,
    WebkitMaskImage: mask,
    maskComposite: p.mask === "soft-edge" ? "intersect" : undefined,
    WebkitMaskComposite: p.mask === "soft-edge" ? "source-in" : undefined,
    ...frameStyle(frame),
  };
  // Controlled rotation, combined with the polaroid's own slight tilt.
  const rotate = (p.rotate ?? 0) + (frame === "polaroid" ? -1.2 : 0);
  wrapper.transform = rotate ? `rotate(${rotate}deg)` : undefined;
  const inner: CSSProperties = { position: "relative", width: "100%", height: "100%", overflow: "hidden", borderRadius: radius };
  const img: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: p.fit,
    objectPosition: `${p.focalX}% ${p.focalY}%`,
    transform: p.zoom > 1 ? `scale(${p.zoom})` : undefined,
    transformOrigin: `${p.focalX}% ${p.focalY}%`,
    filter: [p.blur ? `blur(${p.blur}px)` : "", p.saturation !== 1 ? `saturate(${p.saturation})` : ""].join(" ").trim() || undefined,
  };
  const overlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: overlayColor,
    opacity: overlayOpacity,
    mixBlendMode: p.integrate ? "soft-light" : "normal",
    pointerEvents: "none",
  };
  return { wrapper, inner, img, overlay };
}

interface BlendedImageProps {
  assetId: string | null;
  presentation: ImagePresentation;
  alt: string;
  className?: string;
  /** Fill the parent (backgrounds) instead of using the aspect ratio. */
  fill?: boolean;
  /** Rendered when there is no image. */
  fallback?: ReactNode;
  /** Theme to blend into; defaults to the surrounding one (thumbnails pass their own). */
  theme?: ResolvedTheme;
}

/** An owner-supplied image, shaped and tinted so it belongs to the current theme. */
export function BlendedImage({ assetId, presentation, alt, className = "", fill = false, fallback = null, theme: themeProp }: BlendedImageProps) {
  const url = useAssetUrl(assetId);
  const { getAsset } = useAssets();
  const ctx = useOptionalGameConfig();
  const theme = themeProp ?? ctx?.theme;
  if (!assetId || !url || !theme) return <>{fallback}</>;
  const asset = getAsset(assetId);
  const natural = asset && asset.height ? asset.width / asset.height : undefined;
  const s = presentationStyles(presentation, theme, natural);
  const wrapper: CSSProperties = fill ? { ...s.wrapper, position: "absolute", inset: 0, aspectRatio: undefined } : s.wrapper;

  return (
    // Spans (display: block) so images can sit inside text containers without invalid nesting.
    <span className={`mb-image block ${className}`} style={{ display: "block", ...wrapper }} data-asset={assetId}>
      <span style={{ display: "block", ...s.inner }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob URLs; next/image can't optimise these */}
        <img src={url} alt={alt} draggable={false} loading="lazy" decoding="async" style={s.img} />
        <span aria-hidden="true" style={{ display: "block", ...s.overlay }} />
      </span>
    </span>
  );
}
