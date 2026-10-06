"use client";

import { useAssets } from "@/components/providers/AssetProvider";
import { getSlotDefinition } from "@/lib/config/slots";
import type { ReactionConfig } from "@/lib/config/types";
import { AssetThumb } from "../AssetBits";
import { Button, Panel, Range, TextField, Toggle } from "../controls";
import type { Scenario, SectionProps } from "../types";

const POOL_CANDIDATES = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 41, 42, 43, 44, 45, 46, 47, 50];
type Outcome = keyof ReactionConfig["pools"];

const OUTCOMES: { id: Outcome; title: string; hint: string }[] = [
  { id: "win", title: "Winner pool", hint: "The winner's own victory slot (11 or 12) is always added when it has art." },
  { id: "loss", title: "Loser pool", hint: "The loser's own defeat slot (13 or 14) is always added when it has art." },
  { id: "draw", title: "Draw pool", hint: "Shown when nobody wins." },
];

export function CaptionList({ label, items, onChange }: { label: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <fieldset className="flex flex-col gap-2" data-captions={label}>
      <legend className="mb-1 text-sm font-semibold">{label}</legend>
      {items.map((text, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={text}
            maxLength={200}
            aria-label={`${label} ${i + 1}`}
            onChange={(e) => onChange(items.map((t, j) => (j === i ? e.target.value : t)))}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 text-ink outline-none focus-visible:border-accent"
          />
          <Button variant="ghost" aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
            ✕
          </Button>
        </div>
      ))}
      <Button className="self-start" onClick={() => onChange([...items, ""])}>
        + Add caption
      </Button>
    </fieldset>
  );
}

export function ReactionSection({ draft, patch, showScenario }: SectionProps) {
  const r = draft.reactions;
  const { getAsset, hasAsset } = useAssets();
  const togglePool = (outcome: Outcome, slot: number) => {
    const pool = r.pools[outcome];
    patch("reactions", { pools: { ...r.pools, [outcome]: pool.includes(slot) ? pool.filter((n) => n !== slot) : [...pool, slot] } });
  };
  const tryScenarios: { id: Scenario; label: string }[] = [
    { id: "p1win", label: `${draft.players.PLAYER_ONE.name} wins` },
    { id: "p2win", label: `${draft.players.PLAYER_TWO.name} wins` },
    { id: "draw", label: "Draw" },
    { id: "perfect", label: "Perfect victory" },
    { id: "close", label: "Close match" },
    { id: "streak", label: "Winning streak" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Reaction Studio" description="What appears when a round ends. Several images can share a reaction, so repeated matches feel different.">
        <Toggle
          label="Randomize reactions"
          hint="On: each round draws from the pool. Off: images and captions take turns in order. Both devices will always see the same pick."
          checked={r.randomize}
          onChange={(randomize) => patch("reactions", { randomize })}
        />
        <Toggle label="Show the loser's reaction too" checked={r.showLoserReaction} onChange={(showLoserReaction) => patch("reactions", { showLoserReaction })} />
        <div className="flex flex-wrap gap-2">
          <span className="w-full text-sm font-semibold">Try it in the preview</span>
          {tryScenarios.map((s) => (
            <Button key={s.id} onClick={() => showScenario(s.id)}>
              {s.label}
            </Button>
          ))}
        </div>
      </Panel>

      {OUTCOMES.map((o) => (
        <Panel key={o.id} title={o.title} description={o.hint}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {POOL_CANDIDATES.map((slot) => {
              const id = draft.slots[String(slot)]?.assetId;
              const asset = id && hasAsset(id) ? getAsset(id) : undefined;
              const on = r.pools[o.id].includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  data-pool={`${o.id}-${slot}`}
                  onClick={() => togglePool(o.id, slot)}
                  className={`flex min-w-0 items-center gap-2 rounded-xl p-1.5 text-left outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
                    on ? "bg-accent/15 ring-2 ring-accent" : "bg-bg/60 ring-1 ring-line"
                  }`}
                >
                  <AssetThumb asset={asset} className="size-10" />
                  <span className="min-w-0 text-xs">
                    <span className="block font-semibold">#{slot}</span>
                    <span className="block truncate text-muted">{getSlotDefinition(slot)?.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      ))}

      <Panel title="Captions" description="Every line is editable. One is picked per round, the same way as images.">
        <CaptionList label="Winner captions" items={r.captions.win} onChange={(win) => patch("reactions", { captions: { ...r.captions, win } })} />
        <CaptionList label="Loser captions" items={r.captions.loss} onChange={(loss) => patch("reactions", { captions: { ...r.captions, loss } })} />
        <CaptionList label="Draw captions" items={r.captions.draw} onChange={(draw) => patch("reactions", { captions: { ...r.captions, draw } })} />
      </Panel>

      <Panel title="Special moments" description="Use {winner}, {loser}, {streak}, {wins} and {round} in any of these.">
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              ["perfectVictory", "Perfect victory (slot 44)"],
              ["closeMatch", "Close match (slot 45)"],
              ["winningStreak", "Winning streak (slot 42)"],
              ["losingStreak", "Losing streak (slot 43)"],
              ["specialCelebration", "Special celebration (slot 47)"],
              ["secret", "Secret reaction (slot 50)"],
              ["rematch", "Rematch / chapter card (slot 41)"],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              maxLength={160}
              value={r.moments[key]}
              onChange={(v) => patch("reactions", { moments: { ...r.moments, [key]: v } })}
            />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Range label="Streak starts at" value={r.streakThreshold} min={2} max={10} format={(v) => `${v} wins`} onChange={(streakThreshold) => patch("reactions", { streakThreshold })} />
          <Range label="Celebrate every" value={r.celebrateEvery} min={2} max={25} format={(v) => `${v} wins`} onChange={(celebrateEvery) => patch("reactions", { celebrateEvery })} />
          <Range
            label="Secret reaction chance"
            value={r.secretChance}
            min={0}
            max={0.5}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(secretChance) => patch("reactions", { secretChance })}
          />
        </div>
      </Panel>
    </div>
  );
}
