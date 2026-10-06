"use client";

import { ConfigProvider } from "@/components/providers/ConfigProvider";
import { SymbolView } from "@/components/game/SymbolView";
import { ThemeStage } from "@/components/game/ThemeStage";
import { GLYPHS } from "@/lib/config/normalize";
import { SLOTS } from "@/lib/config/slots";
import type { GlyphId, SymbolConfig } from "@/lib/config/types";
import type { PlayerId } from "@/lib/game/types";
import { MarkGlyph } from "@/components/game/MarkGlyph";
import { Panel, Segmented, TextField, Toggle } from "../controls";
import { SlotQuick } from "../SlotQuick";
import type { SectionProps } from "../types";

const PRESETS: { label: string; pair: [SymbolConfig, SymbolConfig] }[] = [
  { label: "X vs O", pair: [{ kind: "glyph", glyph: "x" }, { kind: "glyph", glyph: "o" }] },
  { label: "🌙 vs ⭐", pair: [{ kind: "emoji", emoji: "🌙" }, { kind: "emoji", emoji: "⭐" }] },
  { label: "🌹 vs 🌸", pair: [{ kind: "emoji", emoji: "🌹" }, { kind: "emoji", emoji: "🌸" }] },
  { label: "💎 vs 🫧", pair: [{ kind: "emoji", emoji: "💎" }, { kind: "emoji", emoji: "🫧" }] },
  { label: "🐹 vs 🐹", pair: [{ kind: "emoji", emoji: "🐹" }, { kind: "emoji", emoji: "🐹" }] },
  { label: "Drawn moon vs star", pair: [{ kind: "glyph", glyph: "moon" }, { kind: "glyph", glyph: "star" }] },
  { label: "Drawn hamsters", pair: [{ kind: "glyph", glyph: "hamster" }, { kind: "glyph", glyph: "hamster" }] },
  { label: "Uploaded images", pair: [{ kind: "image", slot: 3 }, { kind: "image", slot: 4 }] },
];

const GLYPH_NAMES: Record<GlyphId, string> = {
  x: "X",
  o: "O",
  moon: "Moon",
  star: "Star",
  heart: "Heart",
  pearl: "Pearl",
  blossom: "Blossom",
  rose: "Rose",
  hamster: "Hamster",
  planet: "Planet",
};

export function SymbolSection({ draft, setDraft, patch, openSlot }: SectionProps) {
  const setSymbol = (id: PlayerId, symbol: SymbolConfig) =>
    setDraft((d) => ({ ...d, players: { ...d.players, [id]: { ...d.players[id], symbol } } }));
  const overridden = (draft.hamster.enabled && draft.hamster.symbols) || (draft.space.enabled && draft.space.symbols);

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Symbol Studio" description="What each player puts on the board. The game logic never sees this, only Player 1 and Player 2.">
        <Toggle
          label="Let each world choose its symbols"
          hint="On: Pearl uses pearls, Space uses moon and star, and so on. Off: the symbols below are used in every world."
          checked={draft.symbols.followTheme}
          onChange={(followTheme) => patch("symbols", { followTheme })}
        />
        {overridden && (
          <p className="rounded-xl bg-accent/15 p-3 text-sm" role="note">
            {draft.hamster.enabled && draft.hamster.symbols ? "Hamster" : "Space"} Mode is currently replacing these symbols. Turn off its
            &ldquo;symbols&rdquo; option to use the choices below.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              data-symbol-preset={p.label}
              onClick={() => {
                setSymbol("PLAYER_ONE", p.pair[0]);
                setSymbol("PLAYER_TWO", p.pair[1]);
              }}
              className="min-h-10 rounded-full bg-bg px-3.5 text-sm font-semibold outline-none ring-1 ring-line hover:ring-ink/40 focus-visible:ring-4 focus-visible:ring-accent/40"
            >
              {p.label}
            </button>
          ))}
        </div>
        <ConfigProvider config={{ ...draft, symbols: { followTheme: false } }}>
          <ThemeStage contained className="rounded-2xl p-4">
            <div className="flex items-center justify-center gap-6">
              {(["PLAYER_ONE", "PLAYER_TWO"] as const).map((id) => (
                <div key={id} className="flex flex-col items-center gap-1">
                  <span className="mb-cell size-20" style={{ color: id === "PLAYER_ONE" ? "var(--mb-p1)" : "var(--mb-p2)" }}>
                    <span className="mb-cell-mark">
                      <SymbolView player={id} className="size-full" />
                    </span>
                  </span>
                  <span className="text-xs">{draft.players[id].name}</span>
                </div>
              ))}
            </div>
          </ThemeStage>
        </ConfigProvider>
        <p className="text-xs text-muted">If both players pick the identical symbol, the board adds each player&apos;s initial so they stay distinguishable.</p>
      </Panel>

      {(["PLAYER_ONE", "PLAYER_TWO"] as const).map((id, i) => {
        const symbol = draft.players[id].symbol;
        return (
          <Panel key={id} title={`${draft.players[id].name} (Player ${i + 1})`} description={draft.symbols.followTheme ? "Used when “Let each world choose” is off." : undefined}>
            <Segmented<SymbolConfig["kind"]>
              label="Symbol type"
              value={symbol.kind}
              options={[
                { value: "glyph", label: "Drawn" },
                { value: "emoji", label: "Emoji" },
                { value: "image", label: "Uploaded image" },
              ]}
              onChange={(kind) =>
                setSymbol(
                  id,
                  kind === "glyph"
                    ? { kind, glyph: i === 0 ? "x" : "o" }
                    : kind === "emoji"
                      ? { kind, emoji: i === 0 ? "🌙" : "⭐" }
                      : { kind, slot: SLOTS.symbol[id] },
                )
              }
            />
            {symbol.kind === "glyph" && (
              <div role="radiogroup" aria-label="Drawn symbol" className="grid grid-cols-5 gap-2">
                {GLYPHS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={symbol.glyph === g}
                    aria-label={GLYPH_NAMES[g]}
                    onClick={() => setSymbol(id, { kind: "glyph", glyph: g })}
                    className={`grid aspect-square place-items-center rounded-xl p-2 outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
                      symbol.glyph === g ? "bg-accent/20 ring-2 ring-accent" : "bg-bg ring-1 ring-line"
                    }`}
                    style={{ color: i === 0 ? "var(--mb-p1)" : "var(--mb-p2)" }}
                  >
                    <MarkGlyph glyph={g} className="size-full" />
                  </button>
                ))}
              </div>
            )}
            {symbol.kind === "emoji" && (
              <TextField
                label="Emoji"
                value={symbol.emoji}
                maxLength={8}
                onChange={(emoji) => setSymbol(id, { kind: "emoji", emoji })}
                hint="Paste any emoji, or type one or two characters."
              />
            )}
            {symbol.kind === "image" && <SlotQuick slot={symbol.slot} draft={draft} setDraft={setDraft} openSlot={openSlot} />}
          </Panel>
        );
      })}
    </div>
  );
}
