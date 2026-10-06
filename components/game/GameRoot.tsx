"use client";

import { useEffect, useState } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { AssetProvider, useAssets } from "@/components/providers/AssetProvider";
import { ConfigProvider, useGameConfig } from "@/components/providers/ConfigProvider";
import { useGame } from "@/hooks/useGame";
import { ThemePicker } from "@/components/themes/ThemePicker";
import { createLocalConfigStore } from "@/lib/config/configStore";
import { createLocalPlayerThemeStore } from "@/lib/config/playerThemeStore";
import { effectiveThemeId } from "@/lib/config/resolve";
import type { ThemeId } from "@/lib/themes/types";
import { SLOTS } from "@/lib/config/slots";
import type { GameConfig } from "@/lib/config/types";
import { GameView } from "./Game";
import { ThemeStage } from "./ThemeStage";

const configStore = createLocalConfigStore();
const playerThemeStore = createLocalPlayerThemeStore();

function useSavedConfig(): GameConfig {
  const [config, setConfig] = useState<GameConfig>(() => configStore.load());
  // Picks up studio saves made in another tab.
  useEffect(() => configStore.subscribe(setConfig), []);
  return config;
}

/** The player's own theme pick, kept apart from the owner's config. */
function usePlayerTheme(): [ThemeId | null, (id: ThemeId | null) => void] {
  const [pick, setPick] = useState<ThemeId | null>(() => playerThemeStore.load());
  useEffect(() => playerThemeStore.subscribe(setPick), []);
  return [
    pick,
    (id) => {
      playerThemeStore.save(id);
      setPick(id);
    },
  ];
}

function LoadingScreen() {
  const { config, slotAssetId, slotPresentation } = useGameConfig();
  return (
    <div className="mb-loading" aria-busy="true">
      <div className="mb-loading__inner">
        <BlendedImage assetId={slotAssetId(SLOTS.loading)} presentation={slotPresentation(SLOTS.loading)} alt="" className="mb-loading__art" />
        <p className="mb-title">{config.identity.gameName}</p>
        <p className="mb-subtitle">Opening…</p>
      </div>
    </div>
  );
}

function PlayerGame({ themePick, onThemePick }: { themePick: ThemeId | null; onThemePick: (id: ThemeId | null) => void }) {
  const { ready } = useAssets();
  const { isSlotFilled } = useGameConfig();
  const { state, boardKey, play, rematch, resetScore, roomId, playerRole, isCreator, terminateRoom } = useGame();
  // Give loading artwork a moment on screen when the owner has set one.
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), 700);
    return () => window.clearTimeout(t);
  }, []);
  const showLoading = !ready || (isSlotFilled(SLOTS.loading) && !minElapsed);

  const createRoom = () => {
    const newRoom = Math.random().toString(36).substring(2, 9);
    window.location.search = `?room=${newRoom}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room link copied to clipboard!");
  };

  return (
    <ThemeStage className="mb-page">
      {showLoading ? (
        <LoadingScreen />
      ) : (
        <main className="mb-main relative">
          {roomId ? (
            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2 bg-black/60 p-4 rounded-xl text-white backdrop-blur-md border border-white/10 shadow-2xl">
              <p className="font-medium">Room: <span className="font-mono text-blue-300">{roomId}</span></p>
              <p className="text-sm text-gray-300">You are: {playerRole ? playerRole.replace('_', ' ') : 'Observer'}</p>
              <div className="flex flex-col gap-2 mt-2">
                <button onClick={copyLink} className="px-4 py-2 bg-blue-500 rounded-lg text-sm font-semibold hover:bg-blue-400 transition-colors cursor-pointer">
                  Copy Invite Link
                </button>
                {isCreator && (
                  <button onClick={terminateRoom} className="px-4 py-2 bg-red-500 rounded-lg text-sm font-semibold hover:bg-red-400 transition-colors cursor-pointer">
                    Terminate Room
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute top-4 left-4 z-50">
              <button onClick={createRoom} className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-bold hover:from-purple-400 hover:to-indigo-400 shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 cursor-pointer">
                Play with a Friend
              </button>
            </div>
          )}
          <GameView
            state={state}
            boardKey={boardKey}
            onPlay={play}
            onRematch={rematch}
            onResetScore={resetScore}
            themePicker={<ThemePicker current={themePick} onPick={onThemePick} />}
          />
        </main>
      )}
    </ThemeStage>
  );
}

/** Player-facing game. Deliberately has no link to, or knowledge of, the studio. */
export default function GameRoot() {
  const config = useSavedConfig();
  const [themePick, setThemePick] = usePlayerTheme();
  return (
    <AssetProvider>
      <ConfigProvider config={config} themeId={effectiveThemeId(config, themePick)}>
        <PlayerGame themePick={themePick} onThemePick={setThemePick} />
      </ConfigProvider>
    </AssetProvider>
  );
}
