"use client";

import { HamsterArt } from "@/components/media/HamsterArt";
import { Panel, TextField, Toggle } from "../controls";
import { SlotQuick } from "../SlotQuick";
import { CaptionList } from "./ReactionSection";
import type { SectionProps } from "../types";

export function ComicSection({ draft, setDraft, patch, openSlot }: SectionProps) {
  const c = draft.comic;
  return (
    <div className="flex flex-col gap-4">
      <Panel title="Comic Mode" description="Turns the game into a comic: speech bubbles, chapter cards between rounds and dramatic multi-panel results. Works with any theme and never touches the rules.">
        <Toggle label="Comic Mode" checked={c.enabled} onChange={(enabled) => patch("comic", { enabled })} />
        <div className={`flex flex-col gap-4 ${c.enabled ? "" : "opacity-50"}`} inert={!c.enabled}>
          <Toggle label="Speech bubbles" hint="Characters A and B (slots 7–8) speak the turn messages." checked={c.speechBubbles} onChange={(speechBubbles) => patch("comic", { speechBubbles })} />
          <Toggle label="Chapter transitions" hint="A chapter card between rounds, using slot 41 or rotating comic panels 21–30." checked={c.chapterTransitions} onChange={(chapterTransitions) => patch("comic", { chapterTransitions })} />
          <TextField label="Chapter title" value={c.chapterTitle} onChange={(chapterTitle) => patch("comic", { chapterTitle })} hint="{round} becomes the round number." />
          <Toggle label="Dramatic result panels" hint="Winner, loser and last-move panels (slot 46) as a comic spread." checked={c.resultPanels} onChange={(resultPanels) => patch("comic", { resultPanels })} />
          <Toggle label="Halftone texture" checked={c.halftone} onChange={(halftone) => patch("comic", { halftone })} />
          <Toggle label="Sound effects" hint="Short synthesized blips for moves and results. No audio files." checked={c.soundEffects} onChange={(soundEffects) => patch("comic", { soundEffects })} />
          <CaptionList label="SFX words" items={c.sfxWords} onChange={(sfxWords) => patch("comic", { sfxWords })} />
        </div>
      </Panel>
      <Panel title="Comic artwork" description="Characters who speak for each player.">
        <div className="grid gap-3 lg:grid-cols-2">
          {[7, 8, 9, 10].map((n) => (
            <SlotQuick key={n} slot={n} draft={draft} setDraft={setDraft} openSlot={openSlot} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function HamsterSection({ draft, patch }: SectionProps) {
  const h = draft.hamster;
  return (
    <Panel title="Hamster Mode" description="Two very round hamsters move in. Works on top of any theme; the Hamster theme gives them a cosy home.">
      <div className="flex justify-center gap-3 rounded-2xl bg-bg/60 p-3" aria-label="Hamster moods: happy, smug, sad, sleepy" role="img">
        {(["happy", "smug", "sad", "sleepy"] as const).map((m, i) => (
          <HamsterArt key={m} mood={m} fur={i % 2 ? "#f4e4cf" : "#ffaf66"} className="size-16" />
        ))}
      </div>
      <Toggle label="Hamster Mode" checked={h.enabled} onChange={(enabled) => patch("hamster", { enabled })} />
      <div className={`flex flex-col gap-4 ${h.enabled ? "" : "opacity-50"}`} inert={!h.enabled}>
        <Toggle label="Hamster symbols" hint="Happy hamster vs smug hamster on the board." checked={h.symbols} onChange={(symbols) => patch("hamster", { symbols })} />
        <Toggle label="Hamster avatars" hint="Used when a player has no avatar image." checked={h.avatars} onChange={(avatars) => patch("hamster", { avatars })} />
        <Toggle label="Hamster reactions" hint="Happy, sad and sleepy hamsters when a reaction slot is empty." checked={h.reactions} onChange={(reactions) => patch("hamster", { reactions })} />
        <Toggle label="Hamster decorations" hint="Peeking hamsters and sunflower seeds." checked={h.decorations} onChange={(decorations) => patch("hamster", { decorations })} />
      </div>
    </Panel>
  );
}

export function SpaceSection({ draft, patch }: SectionProps) {
  const s = draft.space;
  const options: [keyof typeof s, string, string?][] = [
    ["stars", "Stars"],
    ["nebula", "Nebula"],
    ["planets", "Planets"],
    ["moon", "Moon"],
    ["constellations", "Constellations"],
    ["shootingStars", "Shooting stars"],
    ["particles", "Drifting particles"],
    ["symbols", "Space symbols", "Moon vs star on the board."],
    ["reactionEffects", "Starburst on wins"],
  ];
  return (
    <Panel title="Space Mode" description="Adds the cosmos to whatever theme is active. The Space theme is the full version; this layers it on anything.">
      <Toggle label="Space Mode" checked={s.enabled} onChange={(enabled) => patch("space", { enabled })} />
      <div className={`grid gap-3 sm:grid-cols-2 ${s.enabled ? "" : "opacity-50"}`} inert={!s.enabled}>
        {options.map(([key, label, hint]) => (
          <Toggle key={key} label={label} hint={hint} checked={s[key] as boolean} onChange={(v) => patch("space", { [key]: v })} />
        ))}
      </div>
    </Panel>
  );
}
