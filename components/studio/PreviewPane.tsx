"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { GameView } from "@/components/game/Game";
import { ThemeStage } from "@/components/game/ThemeStage";
import { ConfigProvider } from "@/components/providers/ConfigProvider";
import { applyMove, createInitialState, gameReducer, startRematch } from "@/lib/game/gameLogic";
import type { GameState } from "@/lib/game/types";
import type { GameConfig } from "@/lib/config/types";
import { THEMES } from "@/lib/themes/registry";
import type { ThemeId } from "@/lib/themes/types";
import type { Scenario } from "./types";

const play = (moves: number[], s: GameState) => moves.reduce((acc, i) => applyMove(acc, i), s);

/** Board positions for each preview scenario, played through the real reducer. */
export function scenarioState(scenario: Scenario): GameState {
  const base = { ...createInitialState({ gameId: "studio-preview" }), round: 3, score: { PLAYER_ONE: 2, PLAYER_TWO: 1, draws: 1 } };
  switch (scenario) {
    case "playing":
      return play([4, 0, 8], base);
    case "p1win":
      return play([0, 4, 8, 2, 6, 3, 7], base);
    case "p2win":
      return play([0, 4, 8, 1, 7, 2, 3, 6], base);
    case "draw":
      return play([0, 1, 2, 4, 3, 5, 7, 6, 8], base);
    case "perfect":
      return play([0, 3, 1, 4, 2], base);
    case "close":
      return play([0, 1, 5, 2, 6, 3, 7, 4, 8], base);
    case "streak": {
      let s: GameState = { ...base, score: { PLAYER_ONE: 0, PLAYER_TWO: 0, draws: 0 }, round: 1 };
      for (let i = 0; i < 3; i++) s = play([0, 4, 8, 1, 7, 2, 3, 6], i ? startRematch(s) : s);
      return s;
    }
  }
}

export const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "playing", label: "Playing" },
  { id: "p1win", label: "P1 wins" },
  { id: "p2win", label: "P2 wins" },
  { id: "draw", label: "Draw" },
  { id: "perfect", label: "Perfect" },
  { id: "close", label: "Close" },
  { id: "streak", label: "Streak" },
];

function PreviewGame({ initial }: { initial: GameState }) {
  const [state, dispatch] = useReducer(gameReducer, initial);
  const [boardKey, setBoardKey] = useState(0);
  return (
    <GameView
      state={state}
      boardKey={boardKey}
      onPlay={(index) => dispatch({ type: "move", index })}
      onRematch={() => {
        dispatch({ type: "rematch" });
        setBoardKey((k) => k + 1);
      }}
      onResetScore={() => {
        dispatch({ type: "resetScore" });
        setBoardKey((k) => k + 1);
      }}
    />
  );
}

const DEVICES = {
  phone: { label: "Phone", w: 390, h: 844 },
  tablet: { label: "Tablet", w: 1366, h: 1024 },
  desktop: { label: "Desktop", w: 1920, h: 1080 },
} as const;
type DeviceKey = keyof typeof DEVICES;

function usePaneWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(380);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      // Measure the border box rather than the content box. The content box can
      // shrink when this same scroll container gains a vertical scrollbar,
      // which would change the preview scale and potentially make the scrollbar
      // disappear again (creating a resize feedback loop at narrow widths).
      const borderWidth = el.getBoundingClientRect().width;
      setWidth(Math.max(200, Math.round(borderWidth)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** The real game components, rendering the unsaved draft. Fully playable, at true device size, scaled to fit. */
export function PreviewPane({
  draft,
  themeId,
  scenario,
  onScenario,
  nonce,
}: {
  draft: GameConfig;
  themeId: ThemeId;
  scenario: Scenario;
  onScenario: (s: Scenario) => void;
  nonce: number;
}) {
  const [device, setDevice] = useState<DeviceKey>("phone");
  const [paneRef, paneWidth] = usePaneWidth();
  const d = DEVICES[device];
  const scale = Math.min(1, paneWidth / d.w);
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl">Live preview</h2>
        <span className="text-xs text-muted" data-preview-theme={themeId}>
          {THEMES[themeId].identity.name} · unsaved changes show here first
        </span>
      </div>
      <div role="radiogroup" aria-label="Preview scenario" className="flex gap-1 overflow-x-auto pb-1">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={scenario === s.id}
            onClick={() => onScenario(s.id)}
            className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-semibold outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
              scenario === s.id ? "bg-accent text-accent-ink" : "bg-bg ring-1 ring-line"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Preview device" className="flex flex-wrap gap-1">
        {(Object.keys(DEVICES) as DeviceKey[]).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={device === k}
            data-device-option={k}
            onClick={() => setDevice(k)}
            className={`min-h-9 rounded-full px-3 text-xs font-semibold outline-none focus-visible:ring-4 focus-visible:ring-accent/40 ${
              device === k ? "bg-ink text-bg" : "bg-bg ring-1 ring-line"
            }`}
          >
            {DEVICES[k].label} {DEVICES[k].w}×{DEVICES[k].h}
          </button>
        ))}
      </div>
      <div
        ref={paneRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-[20px] ring-1 ring-line"
        style={{ scrollbarGutter: "stable" }}
        data-preview-frame={device}
      >
        <div style={{ width: d.w * scale, maxWidth: "100%", height: d.h * scale, overflow: "hidden" }}>
          <div style={{ width: d.w, height: d.h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <ConfigProvider config={draft} themeId={themeId}>
              <ThemeStage contained className="contain-fixed h-full">
                <div className="mb-main h-full overflow-y-auto" data-preview>
                  <PreviewGame key={`${scenario}-${nonce}`} initial={scenarioState(scenario)} />
                </div>
              </ThemeStage>
            </ConfigProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
