"use client";

import { useMemo, type ReactNode } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { HamsterArt, type HamsterMood } from "@/components/media/HamsterArt";
import { useGameConfig } from "@/components/providers/ConfigProvider";
import { Flourish } from "@/components/themes/Flourish";
import { buildResultScene, type ResultScene, type SceneSide } from "@/lib/config/reactionEngine";
import type { GameState, PlayerId } from "@/lib/game/types";
import type { ReactionStyle } from "@/lib/themes/types";
import { SymbolView } from "./SymbolView";
import { ThemeArtworkLayer } from "@/components/themes/ThemeFrontendArtwork";

const playerColor = (p: PlayerId) => (p === "PLAYER_ONE" ? "var(--mb-p1)" : "var(--mb-p2)");

/** Owner artwork for a slot, or a drawn fallback that still fits the theme. */
function ReactionArt({ slot, player, mood, fill = false, className = "" }: {
  slot: number | null;
  player: PlayerId | null;
  mood: HamsterMood;
  fill?: boolean;
  className?: string;
}) {
  const { config, slotAssetId, slotPresentation } = useGameConfig();
  const hamster = config.hamster.enabled && config.hamster.reactions;
  const drawn = (p: PlayerId) => (hamster ? <HamsterArt mood={mood} className="size-full" /> : <SymbolView player={p} className="size-full" />);
  const fallback = (
    <div className={`mb-reaction-fallback ${fill ? "is-fill" : ""} ${className}`}>
      {player ? (
        <span className="mb-reaction-fallback__one" style={{ color: playerColor(player) }}>
          {drawn(player)}
        </span>
      ) : (
        <span className="mb-reaction-fallback__pair">
          {(["PLAYER_ONE", "PLAYER_TWO"] as const).map((p) => (
            <span key={p} style={{ color: playerColor(p) }}>
              {drawn(p)}
            </span>
          ))}
        </span>
      )}
    </div>
  );
  if (slot === null) return fallback;
  return (
    <BlendedImage assetId={slotAssetId(slot)} presentation={slotPresentation(slot)} alt="" fill={fill} className={className} fallback={fallback} />
  );
}

function Caption({ who, text, right = false }: { who?: string; text: string; right?: boolean }) {
  return (
    <p className={`speech-bubble ${right ? "speech-bubble--right" : ""} mb-caption`}>
      {who && <span className="mb-caption__who">{who}</span>}
      <span className="mb-caption__text">{text}</span>
    </p>
  );
}

const lead = (s: ResultScene) => ({
  slot: s.winner?.slot ?? s.draw?.slot ?? null,
  player: s.winner?.player ?? null,
  mood: (s.winner ? "happy" : "sleepy") as HamsterMood,
  name: s.winner?.name,
  caption: s.winner?.caption ?? s.draw?.caption ?? "",
});

type Renderer = (scene: ResultScene, round: number) => ReactNode;

function Side({ side, mood, right = false }: { side: SceneSide; mood: HamsterMood; right?: boolean }) {
  return (
    <div className={`mb-side reaction-pop ${right ? "is-right" : ""}`}>
      <span className="mb-sticker mb-side__art">
        <ReactionArt slot={side.slot} player={side.player} mood={mood} className="size-full" />
      </span>
      <Caption who={side.name} text={side.caption} right={right} />
    </div>
  );
}

/** One renderer per reaction style. Themes pick a style; adding a style is one entry here plus CSS. */
const RENDERERS: Record<ReactionStyle | "spread", Renderer> = {
  spread: (scene) => {
    const l = lead(scene);
    const third = scene.lastMoveSlot ?? scene.panelSlot;
    return (
      <div className="comic-spread reaction-pop">
        <div className="comic-panel comic-panel--hero">
          <ReactionArt slot={l.slot} player={l.player} mood={l.mood} fill />
          {scene.sfx && <span className="sfx-stamp">{scene.sfx}</span>}
          <div className="comic-panel__caption">
            <Caption who={l.name} text={l.caption} />
          </div>
        </div>
        <div className="comic-panel">
          {scene.loser && (
            <>
              <ReactionArt slot={scene.loser.slot} player={scene.loser.player} mood="sad" fill />
              <div className="comic-panel__caption">
                <Caption who={scene.loser.name} text={scene.loser.caption} right />
              </div>
            </>
          )}
        </div>
        <div className="comic-panel">
          {third !== null ? (
            <ReactionArt slot={third} player={null} mood="neutral" fill />
          ) : (
            <p className="comic-panel__end">{scene.kind === "draw" ? "To be continued…" : "The end?"}</p>
          )}
        </div>
      </div>
    );
  },
  panel: (scene) => (
    <div className={`mb-panels ${scene.loser ? "has-two" : ""}`}>
      {[
        ...(scene.winner ? [{ s: scene.winner, mood: "happy" as HamsterMood, right: false }] : []),
        ...(scene.loser ? [{ s: scene.loser, mood: "sad" as HamsterMood, right: true }] : []),
      ].map(({ s, mood, right }, i) => (
        <div key={s.player} className="comic-panel comic-panel--short reaction-pop" style={{ animationDelay: `${300 + i * 140}ms` }}>
          <ReactionArt slot={s.slot} player={s.player} mood={mood} fill />
          <div className="comic-panel__caption">
            <Caption who={s.name} text={s.caption} right={right} />
          </div>
        </div>
      ))}
      {scene.draw && (
        <div className="comic-panel comic-panel--short reaction-pop">
          <ReactionArt slot={scene.draw.slot} player={null} mood="sleepy" fill />
          <div className="comic-panel__caption">
            <Caption text={scene.draw.caption} />
          </div>
        </div>
      )}
    </div>
  ),
  bubble: (scene) => (
    <div className="mb-sides">
      {scene.winner && <Side side={scene.winner} mood="happy" />}
      {scene.loser && <Side side={scene.loser} mood="sad" right />}
      {scene.draw && (
        <div className="mb-side reaction-pop">
          <span className="mb-sticker mb-side__art">
            <ReactionArt slot={scene.draw.slot} player={null} mood="sleepy" className="size-full" />
          </span>
          <Caption text={scene.draw.caption} />
        </div>
      )}
    </div>
  ),
  cinematic: (scene) => {
    const l = lead(scene);
    return (
      <>
        <div className="cinematic reaction-pop">
          <ReactionArt slot={l.slot} player={l.player} mood={l.mood} fill />
          <div className="cinematic__text">
            {l.name && <span className="cinematic__who">{l.name}</span>}
            <span className="cinematic__line">{l.caption}</span>
          </div>
        </div>
        {scene.loser && (
          <p className="mb-aside-line reaction-pop">
            {scene.loser.name}: {scene.loser.caption}
          </p>
        )}
      </>
    );
  },
  editorial: (scene, round) => {
    const l = lead(scene);
    return (
      <article className="mb-editorial mb-card reaction-pop">
        <div className="mb-editorial__art">
          <ReactionArt slot={l.slot} player={l.player} mood={l.mood} fill />
        </div>
        <div className="mb-editorial__body">
          <p className="mb-editorial__kicker">
            Round {round} · {scene.kind === "draw" ? "Even" : "Winner"}
          </p>
          <p className="mb-editorial__name">{scene.kind === "draw" ? "A draw" : l.name}</p>
          <p className="mb-editorial__quote">{l.caption}</p>
          {scene.loser && (
            <p className="mb-editorial__aside">
              {scene.loser.name}: {scene.loser.caption}
            </p>
          )}
        </div>
      </article>
    );
  },
  note: (scene) => {
    const l = lead(scene);
    return (
      <div className="mb-notes">
        <div className="mb-note reaction-pop">
          <span className="mb-note__art">
            <ReactionArt slot={l.slot} player={l.player} mood={l.mood} className="size-full" />
          </span>
          <p className="mb-note__text">
            {l.name && <strong>{l.name}: </strong>}
            {l.caption}
          </p>
        </div>
        {scene.loser && (
          <div className="mb-note mb-note--small reaction-pop">
            <p className="mb-note__text">
              <strong>{scene.loser.name}: </strong>
              {scene.loser.caption}
            </p>
          </div>
        )}
      </div>
    );
  },
  poster: (scene) => {
    const l = lead(scene);
    return (
      <div className="mb-poster mb-card reaction-pop">
        <div className="mb-poster__art">
          <ReactionArt slot={l.slot} player={l.player} mood={l.mood} fill />
        </div>
        <p className="mb-poster__headline">{scene.kind === "draw" ? "Draw." : `${l.name}!`}</p>
        <p className="mb-poster__caption">{l.caption}</p>
        {scene.loser && <p className="mb-poster__small">{scene.loser.name}: {scene.loser.caption}</p>}
      </div>
    );
  },
};

export function WinReaction({ state }: { state: GameState }) {
  const { config, theme, isSlotFilled } = useGameConfig();
  const scene = useMemo(() => buildResultScene(config, state, isSlotFilled), [config, state, isSlotFilled]);

  // Fixed min-height keeps the controls from jumping when a reaction appears.
  if (!scene) return <div className="mb-result-space" />;

  const style = config.comic.enabled && config.comic.resultPanels ? "spread" : theme.reactions.style;
  const spaceBurst = scene.kind === "win" && config.space.enabled && config.space.reactionEffects;

  return (
    <section aria-label="Round result" className="mb-result" data-result={scene.kind} data-moment={scene.moment ?? ""} data-style={style}>
      {scene.kind === "win" && <Flourish kind={spaceBurst ? "starburst" : theme.reactions.flourish} />}
      <ThemeArtworkLayer slot="resultArtwork" className="mb-theme-artwork-layer--result" />
      <ThemeArtworkLayer slot="outro" className="mb-theme-artwork-layer--outro" />
      {scene.momentCaption && <p className="narration">{scene.momentCaption}</p>}
      {RENDERERS[style](scene, state.round)}
      {scene.loserStreakCaption && style !== "spread" && <p className="mb-aside-line">{scene.loserStreakCaption}</p>}
    </section>
  );
}
