"use client";

import { useState } from "react";
import { ThemeStage } from "@/components/game/ThemeStage";
import { useAssets } from "@/components/providers/AssetProvider";
import { ConfigProvider } from "@/components/providers/ConfigProvider";
import { ChatBubble, ChatSurface, Sticker } from "@/components/themes/ChatPrimitives";
import { Motif } from "@/components/themes/Motifs";
import { SymbolGlyph } from "@/components/themes/SymbolGlyph";
import { ThemeThumbnail } from "@/components/themes/ThemeThumbnail";
import { resolveTheme } from "@/lib/config/resolve";
import { ART_PRESENTATION } from "@/lib/config/slots";
import type { MotionLevel } from "@/lib/config/types";
import { contrastProblems } from "@/lib/themes/contrast";
import * as O from "@/lib/themes/options";
import { THEMES, THEME_ORDER } from "@/lib/themes/registry";
import type { ArtOverride, ResolvedArtPiece, ThemeColors, ThemeEffects, ThemeId, ThemeOverride } from "@/lib/themes/types";
import { AssetPicker, AssetThumb, UploadButton } from "../AssetBits";
import { Button, ColorField, Panel, Range, Segmented, Select, TextField, Toggle } from "../controls";
import { PresentationEditor } from "../PresentationEditor";
import type { SectionProps } from "../types";

const COLOR_LABELS: [keyof ThemeColors, string][] = [
  ["background", "Background"],
  ["backgroundAlt", "Background glow"],
  ["surface", "Cards & bubbles"],
  ["ink", "Text"],
  ["muted", "Soft text"],
  ["accent", "Accent"],
  ["accentInk", "Text on accent"],
  ["playerOne", "Player 1"],
  ["playerTwo", "Player 2"],
  ["board", "Board"],
  ["cell", "Cells"],
  ["line", "Lines & borders"],
  ["highlight", "Winning cells"],
  ["winInk", "Ink on winning cells"],
];

const EFFECT_LABELS: [Exclude<keyof ThemeEffects, "petals">, string][] = [
  ["stars", "Stars"],
  ["nebula", "Nebula"],
  ["planets", "Planets"],
  ["moon", "Moon"],
  ["constellations", "Constellations"],
  ["shootingStars", "Shooting stars"],
  ["sparkles", "Floating sparkles"],
  ["bubbles", "Bubbles"],
  ["pearls", "Pearl string"],
  ["halftone", "Halftone dots"],
  ["speedLines", "Speed lines"],
  ["hamsters", "Peeking hamsters"],
];

type SectionKey = Exclude<keyof ThemeOverride, "colors" | "effects" | "art">;

function ArtPieceEditor({ piece, onChange, onReset }: { piece: ResolvedArtPiece; onChange: (patch: Partial<ArtOverride>) => void; onReset: () => void }) {
  const { getAsset, hasAsset } = useAssets();
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const asset = piece.assetId && hasAsset(piece.assetId) ? getAsset(piece.assetId) : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-bg/60 p-3 ring-1 ring-line" data-art-editor={piece.id}>
      <div className="flex items-center gap-3">
        {asset ? (
          <AssetThumb asset={asset} />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface p-1.5 ring-1 ring-line" style={{ color: "var(--mb-accent)" }}>
            <Motif id={piece.motif} className="size-full" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{piece.label}</p>
          <p className="truncate text-xs text-muted">
            {asset ? asset.name : "Built-in original placeholder"} · {O.ART_ANCHOR.options.find((a) => a.value === piece.anchor)?.label}
          </p>
        </div>
        <Toggle label="Show" checked={!piece.hidden} onChange={(v) => onChange({ hidden: !v })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPicking(true)}>{asset ? "Change image" : "Use my image"}</Button>
        <UploadButton category="other" onError={setError} onUploaded={(a) => onChange({ assetId: a[0].id })} />
        {asset && (
          <Button variant="ghost" onClick={() => onChange({ assetId: null })}>
            Back to placeholder
          </Button>
        )}
        <Button variant="ghost" onClick={onReset}>
          Reset piece
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-p1">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Range label="Size" value={piece.size} min={2} max={40} step={0.5} format={(v) => `${v} rem`} onChange={(size) => onChange({ size })} />
        <Range label="Rotation" value={piece.rotate} min={-25} max={25} format={(v) => `${v}°`} onChange={(rotate) => onChange({ rotate })} />
        <Range label="Nudge horizontally" value={piece.x} min={-12} max={12} step={0.5} format={(v) => `${v} rem`} onChange={(x) => onChange({ x })} />
        <Range label="Nudge vertically" value={piece.y} min={-12} max={12} step={0.5} format={(v) => `${v} rem`} onChange={(y) => onChange({ y })} />
      </div>
      {asset && (
        <>
          <TextField label="Alt text" value={piece.alt} maxLength={120} onChange={(alt) => onChange({ alt })} hint="Describe the artwork for screen readers." />
          <details className="rounded-xl bg-surface/60 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Image blending</summary>
            <div className="mt-3">
              <PresentationEditor
                value={piece.presentation ?? ART_PRESENTATION}
                onChange={(p) => onChange({ presentation: { ...(piece.presentation ?? ART_PRESENTATION), ...p } })}
              />
            </div>
          </details>
        </>
      )}
      <AssetPicker
        open={picking}
        title={piece.label}
        category="other"
        onClose={() => setPicking(false)}
        onPick={(a) => {
          onChange({ assetId: a.id });
          setPicking(false);
        }}
      />
    </div>
  );
}

export function ThemeSection({ draft, setDraft, patch, previewTheme: id, setPreviewTheme, showScenario }: SectionProps) {
  const t = resolveTheme(draft, id);
  const sel = draft.theme;
  const isDefault = sel.presetId === id;
  const problems = contrastProblems(t.colors);

  const setOverride = (fn: (o: ThemeOverride) => ThemeOverride) =>
    setDraft((d) => ({ ...d, theme: { ...d.theme, overrides: { ...d.theme.overrides, [id]: fn(d.theme.overrides[id] ?? {}) } } }));
  const setSection = <K extends SectionKey>(key: K, value: Partial<NonNullable<ThemeOverride[K]>>) =>
    setOverride((o) => ({ ...o, [key]: { ...(o[key] as object | undefined), ...value } }));
  const setArt = (pieceId: string, value: Partial<ArtOverride> | null) =>
    setOverride((o) => {
      const art = { ...o.art };
      if (value === null) delete art[pieceId];
      else art[pieceId] = { ...art[pieceId], ...value };
      return { ...o, art };
    });
  const toggleEnabled = (themeId: ThemeId, on: boolean) =>
    patch("theme", { enabled: on ? [...sel.enabled, themeId] : sel.enabled.filter((x) => x !== themeId) });

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Theme Studio"
        description="23 worlds. Pick one to edit and preview it; choose which ones she can switch between, and which one opens by default."
      >
        <Toggle
          label="Let the player choose a world"
          hint="Adds a small World button to the game. Her choice is saved on her device and never changes these settings."
          checked={sel.playerChoice}
          onChange={(playerChoice) => patch("theme", { playerChoice })}
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4" data-theme-gallery>
          {THEME_ORDER.map((themeId) => {
            const enabled = themeId === sel.presetId || sel.enabled.includes(themeId);
            return (
              <div
                key={themeId}
                className={`flex min-w-0 flex-col gap-1.5 rounded-2xl p-1.5 ${id === themeId ? "bg-accent/10 ring-2 ring-accent" : "ring-1 ring-line"}`}
              >
                <button
                  type="button"
                  aria-pressed={id === themeId}
                  data-theme-option={themeId}
                  onClick={() => setPreviewTheme(themeId)}
                  className="rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
                  aria-label={`Edit and preview ${THEMES[themeId].identity.name}`}
                >
                  <ThemeThumbnail theme={resolveTheme(draft, themeId)} className={enabled ? "" : "opacity-40 grayscale"} />
                </button>
                <div className="flex items-center justify-between gap-1 px-1">
                  <span className="truncate text-sm font-semibold">{THEMES[themeId].identity.name}</span>
                  {themeId === sel.presetId ? (
                    <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-bold uppercase text-accent-ink">Default</span>
                  ) : (
                    <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted">
                      <input type="checkbox" checked={enabled} onChange={(e) => toggleEnabled(themeId, e.target.checked)} data-enable={themeId} />
                      On
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title={`Editing ${t.identity.name}`}
        description={t.identity.description}
        actions={
          <div className="flex flex-wrap gap-2">
            {!isDefault && (
              <Button variant="primary" onClick={() => patch("theme", { presetId: id, enabled: sel.enabled.includes(id) ? sel.enabled : [...sel.enabled, id] })}>
                Make default
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() =>
                setDraft((d) => {
                  const overrides = { ...d.theme.overrides };
                  delete overrides[id];
                  return { ...d, theme: { ...d.theme, overrides } };
                })
              }
            >
              Reset to package
            </Button>
          </div>
        }
      >
        <p className="text-sm">
          <span className="text-muted">{isDefault ? "This is the default world." : sel.enabled.includes(id) ? "Available to the player." : "Hidden from the player."}</span>
        </p>
      </Panel>

      <Panel title="Colours" description="Every pair is checked for readable contrast as you edit.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {COLOR_LABELS.map(([key, label]) => (
            <ColorField key={key} label={label} value={t.colors[key]} onChange={(v) => setOverride((o) => ({ ...o, colors: { ...o.colors, [key]: v } }))} />
          ))}
        </div>
        {problems.length > 0 ? (
          <div role="status" className="rounded-xl bg-p1/15 p-3 text-sm" data-contrast-warning>
            <p className="font-semibold">Some text may be hard to read:</p>
            <ul className="mt-1 list-disc pl-5">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-xs text-muted">All colour pairs pass contrast checks.</p>
        )}
      </Panel>

      <Panel title="Typography & surfaces">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Display font" value={t.typography.display} options={O.FONT.options} onChange={(display) => setSection("typography", { display })} />
          <Select label="Title treatment" value={t.typography.title} options={O.TITLE.options} onChange={(title) => setSection("typography", { title })} />
          <Select label="Subtitle" value={t.typography.subtitle} options={O.SUBTITLE.options} onChange={(subtitle) => setSection("typography", { subtitle })} />
          <Select label="Card material" value={t.surfaces.card} options={O.CARD.options} onChange={(card) => setSection("surfaces", { card })} />
          <Select label="Buttons" value={t.surfaces.button} options={O.BUTTON.options} onChange={(button) => setSection("surfaces", { button })} />
          <Select label="Texture" value={t.surfaces.texture} options={O.TEXTURE.options} onChange={(texture) => setSection("surfaces", { texture })} />
          <Select label="Background" value={t.background.recipe} options={O.BACKGROUND.options} onChange={(recipe) => setSection("background", { recipe })} />
          <Range label="Card corners" value={t.surfaces.radius} min={0} max={40} format={(v) => `${v}px`} onChange={(radius) => setSection("surfaces", { radius })} />
        </div>
      </Panel>

      <Panel title="Scene & board" description="How the players frame the board, and the board itself.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Scene layout" value={t.players.layout} options={O.LAYOUT.options} onChange={(layout) => setSection("players", { layout })} />
          <Select label="Player cards" value={t.players.card} options={O.PLAYER_CARD.options} onChange={(card) => setSection("players", { card })} />
          <Select label="Board style" value={t.board.style} options={O.BOARD.options} onChange={(style) => setSection("board", { style })} />
          <Select label="Board frame" value={t.board.frame} options={O.BOARD_FRAME.options} onChange={(frame) => setSection("board", { frame })} />
          <Range
            label="Cell corners"
            value={Math.min(t.board.cellRadius, 40)}
            min={0}
            max={40}
            format={(v) => (v >= 40 ? "Round" : `${v}px`)}
            onChange={(v) => setSection("board", { cellRadius: v >= 40 ? 999 : v })}
          />
          <Range label="Cell border" value={t.board.cellBorder} min={0} max={4} format={(v) => `${v}px`} onChange={(cellBorder) => setSection("board", { cellBorder })} />
          <Range label="Board tilt" value={t.board.tilt} min={-3} max={3} step={0.1} format={(v) => `${v.toFixed(1)}°`} onChange={(tilt) => setSection("board", { tilt })} />
        </div>
      </Panel>

      <Panel title="Symbols" description="Each theme has its own pair. Symbol Studio decides whether themes choose the symbols or you pin your own.">
        <div className="flex items-center gap-4">
          {([0, 1] as const).map((i) => (
            <span key={i} className="grid size-14 place-items-center rounded-xl bg-bg p-2 ring-1 ring-line" style={{ color: i ? "var(--mb-p2)" : "var(--mb-p1)" }}>
              <SymbolGlyph symbol={t.symbols.suggested[i]} index={i} className="size-full" />
            </span>
          ))}
          <p className="text-sm text-muted">{draft.symbols.followTheme ? "Used on the board in this world." : "Not used: symbols are pinned in Symbol Studio."}</p>
        </div>
        <Select label="Symbol treatment" value={t.symbols.treatment} options={O.SYMBOL_TREATMENT.options} onChange={(treatment) => setSection("symbols", { treatment })} />
      </Panel>

      <Panel title="Reactions & moments" description="How wins, losses, draws, streaks and rematches are staged in this world. Images and captions still come from Reaction Studio.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Result presentation" value={t.reactions.style} options={O.REACTION.options} onChange={(style) => setSection("reactions", { style })} />
          <Select label="Win flourish" value={t.reactions.flourish} options={O.FLOURISH.options} onChange={(flourish) => setSection("reactions", { flourish })} />
          <Select label="Special-moment caption" value={t.specialMoments.narration} options={O.NARRATION.options} onChange={(narration) => setSection("specialMoments", { narration })} />
          <Select label="Chapter card (rematch, Comic Mode)" value={t.chapters.style} options={O.CHAPTER.options} onChange={(style) => setSection("chapters", { style })} />
          <Select label="Motion personality" value={t.motion.personality} options={O.MOTION.options} onChange={(personality) => setSection("motion", { personality })} />
          <Select label="Sound identity (Comic Mode sounds)" value={t.sound.profile} options={O.SOUND.options} onChange={(profile) => setSection("sound", { profile })} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => showScenario("p1win")}>Preview a win</Button>
          <Button onClick={() => showScenario("draw")}>Preview a draw</Button>
          <Button onClick={() => showScenario("streak")}>Preview a streak</Button>
          <Button onClick={() => showScenario("perfect")}>Preview a perfect game</Button>
        </div>
      </Panel>

      <Panel title="Artwork" description="The composition for this world. Each piece starts as original placeholder art; swap in your own (only art you have the rights to use).">
        <div className="grid gap-3 xl:grid-cols-2">
          {t.artwork.pieces.map((p) => (
            <ArtPieceEditor key={p.id} piece={p} onChange={(v) => setArt(p.id, v)} onReset={() => setArt(p.id, null)} />
          ))}
        </div>
      </Panel>

      <Panel title="Atmosphere">
        <Select<ThemeEffects["petals"]>
          label="Falling petals"
          value={t.effects.petals}
          options={[
            { value: "none", label: "None" },
            { value: "rose", label: "Rose petals" },
            { value: "blossom", label: "Cherry blossoms" },
            { value: "white", label: "White blossoms" },
          ]}
          onChange={(petals) => setOverride((o) => ({ ...o, effects: { ...o.effects, petals } }))}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {EFFECT_LABELS.map(([key, label]) => (
            <Toggle key={key} label={label} checked={t.effects[key]} onChange={(v) => setOverride((o) => ({ ...o, effects: { ...o.effects, [key]: v } }))} />
          ))}
        </div>
      </Panel>

      <Panel title="Chat & stickers" description="Chat isn't built yet. When it is, it will use these styles, the same ones the game's speech bubbles use now.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Bubbles" value={t.chat.bubble} options={O.BUBBLE.options} onChange={(bubble) => setSection("chat", { bubble })} />
          <Select label="Sticker frame" value={t.chat.sticker} options={O.STICKER_FRAME.options} onChange={(sticker) => setSection("chat", { sticker })} />
        </div>
        <ConfigProvider config={draft} themeId={id}>
          <ThemeStage contained className="rounded-2xl p-4">
            <ChatSurface label="Chat style sample">
              <ChatBubble author={draft.players.PLAYER_TWO.name}>Rematch? I let you win that one.</ChatBubble>
              <ChatBubble mine>Sure you did.</ChatBubble>
              <div className="mb-chat__row is-mine">
                <Sticker label="Hamster sticker">
                  <span className="grid size-14 place-items-center" style={{ color: "var(--mb-p1)" }}>
                    <SymbolGlyph symbol={{ kind: "glyph", glyph: "hamster" }} index={0} className="size-12" />
                  </span>
                </Sticker>
              </div>
            </ChatSurface>
          </ThemeStage>
        </ConfigProvider>
      </Panel>

      <Panel title="Animations" description="Applies to every world. Players who ask their device for reduced motion always get the calm version.">
        <Segmented<MotionLevel>
          label="Motion"
          value={draft.animations.level}
          options={[
            { value: "full", label: "Full" },
            { value: "subtle", label: "Subtle (no ambient motion)" },
            { value: "off", label: "Off" },
          ]}
          onChange={(level) => patch("animations", { level })}
        />
      </Panel>
    </div>
  );
}
