"use client";

import type { BlendMode, FrameStyle, ImagePresentation } from "@/lib/config/types";
import { ColorField, Range, Segmented, Select, Toggle } from "./controls";

const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Every image-blending control from the brief, for one image. */
export function PresentationEditor({ value, onChange }: { value: ImagePresentation; onChange: (patch: Partial<ImagePresentation>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" data-presentation-editor>
      <Segmented
        label="Fit"
        value={value.fit}
        options={[
          { value: "cover", label: "Fill (crop)" },
          { value: "contain", label: "Whole image" },
        ]}
        onChange={(fit) => onChange({ fit })}
      />
      <Select
        label="Aspect ratio"
        value={value.aspect}
        options={[
          { value: "auto", label: "Original" },
          { value: "1/1", label: "Square 1:1" },
          { value: "4/5", label: "Portrait 4:5" },
          { value: "3/4", label: "Portrait 3:4" },
          { value: "2/3", label: "Tall 2:3" },
          { value: "9/16", label: "Story 9:16" },
          { value: "16/9", label: "Wide 16:9" },
          { value: "21/9", label: "Cinema 21:9" },
          { value: "4/1", label: "Banner 4:1" },
          { value: "8/5", label: "Card 8:5" },
        ]}
        onChange={(aspect) => onChange({ aspect })}
      />
      <Range label="Crop / zoom" value={value.zoom} min={1} max={3} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(zoom) => onChange({ zoom })} />
      <Range label="Corner radius" value={Math.min(value.radius, 120)} min={0} max={120} onChange={(radius) => onChange({ radius: radius >= 120 ? 999 : radius })} format={(v) => (v >= 120 ? "Round" : `${v}px`)} />
      <Range label="Focal point — horizontal" value={value.focalX} min={0} max={100} onChange={(focalX) => onChange({ focalX })} format={(v) => `${v}%`} />
      <Range label="Focal point — vertical" value={value.focalY} min={0} max={100} onChange={(focalY) => onChange({ focalY })} format={(v) => `${v}%`} />
      <Select
        label="Soft mask"
        value={value.mask}
        options={[
          { value: "none", label: "None" },
          { value: "soft-edge", label: "Soft edges" },
          { value: "vignette", label: "Vignette" },
          { value: "fade-bottom", label: "Fade out at bottom" },
          { value: "fade-top", label: "Fade out at top" },
          { value: "fade-sides", label: "Fade out at sides" },
          { value: "circle", label: "Circle" },
          { value: "blob", label: "Organic blob" },
        ]}
        onChange={(mask) => onChange({ mask })}
      />
      <Select<FrameStyle | "theme">
        label="Frame / panel"
        value={value.frame}
        options={[
          { value: "theme", label: "Match theme" },
          { value: "none", label: "No frame" },
          { value: "panel", label: "Comic panel" },
          { value: "ink", label: "Ink outline" },
          { value: "polaroid", label: "Polaroid" },
          { value: "glow", label: "Soft glow" },
          { value: "pearl", label: "Pearl rim" },
        ]}
        onChange={(frame) => onChange({ frame })}
      />
      <Range label="Opacity" value={value.opacity} min={0.1} max={1} step={0.05} format={pct} onChange={(opacity) => onChange({ opacity })} />
      <Range label="Blur" value={value.blur} min={0} max={20} format={(v) => `${v}px`} onChange={(blur) => onChange({ blur })} />
      <Range label="Shadow" value={value.shadow} min={0} max={1} step={0.05} format={pct} onChange={(shadow) => onChange({ shadow })} />
      <Range label="Colour intensity" value={value.saturation} min={0} max={2} step={0.05} format={pct} onChange={(saturation) => onChange({ saturation })} />
      <Select<BlendMode>
        label="Blend treatment"
        value={value.blend}
        options={[
          { value: "normal", label: "Normal" },
          { value: "multiply", label: "Multiply (ink on paper)" },
          { value: "screen", label: "Screen (light / glow)" },
          { value: "overlay", label: "Overlay" },
          { value: "soft-light", label: "Soft light" },
          { value: "luminosity", label: "Luminosity (tinted by theme)" },
          { value: "lighten", label: "Lighten" },
          { value: "darken", label: "Darken" },
        ]}
        onChange={(blend) => onChange({ blend })}
      />
      <div className="flex flex-col gap-2">
        <Toggle label="Use theme tint for overlay" checked={value.overlayColor === "theme"} onChange={(on) => onChange({ overlayColor: on ? "theme" : "#000000" })} />
        {value.overlayColor !== "theme" && (
          <ColorField label="Overlay colour" value={value.overlayColor} onChange={(overlayColor) => onChange({ overlayColor })} />
        )}
      </div>
      <Range label="Overlay strength" value={value.overlayOpacity} min={0} max={0.9} step={0.05} format={pct} onChange={(overlayOpacity) => onChange({ overlayOpacity })} />
      <div className="sm:col-span-2">
        <Toggle
          label="Blend into the theme"
          hint="Borrows the theme's tint, blend and frame so the picture sits in the scene instead of on top of it."
          checked={value.integrate}
          onChange={(integrate) => onChange({ integrate })}
        />
      </div>
    </div>
  );
}
