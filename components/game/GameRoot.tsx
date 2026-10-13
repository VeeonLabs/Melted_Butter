"use client";

import { useEffect, useRef, useState } from "react";
import { BlendedImage } from "@/components/media/BlendedImage";
import { AssetProvider, useAssets } from "@/components/providers/AssetProvider";
import { ConfigProvider, useGameConfig } from "@/components/providers/ConfigProvider";
import { useGame, type ChatMessage } from "@/hooks/useGame";
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

/** Pill toggle: "Create" vs "Join" */
function MultiplayerToggle({ mode, onChange }: { mode: "create" | "join"; onChange: (m: "create" | "join") => void }) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        borderRadius: "9999px",
        background: "var(--mb-cell)",
        padding: "0.25rem",
        gap: "0.25rem",
        border: "1px solid var(--mb-line)",
      }}
    >
      {(["create", "join"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            style={{
              flex: 1,
              borderRadius: "9999px",
              padding: "0.35rem 0.75rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "capitalize",
              cursor: "pointer",
              border: "none",
              transition: "all 0.2s ease",
              background: active ? "var(--mb-accent)" : "transparent",
              color: active ? "var(--mb-accent-ink)" : "var(--mb-muted)",
              boxShadow: active ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {m === "create" ? "Create" : "Join"}
          </button>
        );
      })}
    </div>
  );
}

function PlayerGame({ themePick, onThemePick }: { themePick: ThemeId | null; onThemePick: (id: ThemeId | null) => void }) {
  const { ready } = useAssets();
  const { isSlotFilled } = useGameConfig();
  const { state, boardKey, play, rematch, resetScore, roomId, playerRole, isCreator, terminateRoom, messages, sendChat } = useGame();

  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), 700);
    return () => window.clearTimeout(t);
  }, []);
  const showLoading = !ready || (isSlotFilled(SLOTS.loading) && !minElapsed);

  // Panel state
  const [mode, setMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const joinInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createRoom = () => {
    const newRoom = Math.random().toString(36).substring(2, 9);
    window.location.search = `?room=${newRoom}`;
  };

  const joinRoom = () => {
    const code = joinCode.trim();
    if (!code) {
      setJoinError("Enter a room code or paste the invite link.");
      joinInputRef.current?.focus();
      return;
    }
    // Accept either a full URL or a bare room code
    let roomCode = code;
    try {
      const url = new URL(code);
      const param = url.searchParams.get("room");
      if (param) roomCode = param;
    } catch {
      // not a URL, treat as bare code
    }
    window.location.search = `?room=${roomCode}`;
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ThemeStage className="mb-page">
      {showLoading ? (
        <LoadingScreen />
      ) : (
        <main className="mb-main" style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem" }}>
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", width: "100%", maxWidth: roomId ? "54rem" : "32rem", margin: "0 auto 1rem" }}>
            {/* Left: room controls */}
            <div>
              {roomId ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.85rem", borderRadius: "9999px", background: "color-mix(in srgb, var(--mb-surface) 90%, transparent)", border: "1px solid var(--mb-line)", fontSize: "0.72rem", color: "var(--mb-ink)", fontWeight: 600 }}>
                    <span style={{ width: "0.45rem", height: "0.45rem", borderRadius: "9999px", background: "var(--mb-accent)", display: "inline-block" }} />
                    Live · Room {roomId}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--mb-muted)", background: "var(--mb-cell)", padding: "0.3rem 0.75rem", borderRadius: "9999px", border: "1px solid var(--mb-line)" }}>
                    {playerRole ? playerRole.replace("_", " ") : "Observer"}
                  </span>
                  {playerRole && state.status === "playing" && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: playerRole === state.currentPlayer ? "var(--mb-accent-ink)" : "var(--mb-muted)",
                      background: playerRole === state.currentPlayer ? "var(--mb-accent)" : "color-mix(in srgb, var(--mb-surface) 80%, transparent)",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "9999px",
                      border: "1px solid var(--mb-line)",
                      transition: "all 0.2s ease",
                    }}>
                      {playerRole === state.currentPlayer ? "🟢 Your turn" : "⏳ Opponent's turn"}
                    </span>
                  )}
                  <button
                    onClick={copyLink}
                    style={{ padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1px solid var(--mb-line)", background: copied ? "var(--mb-accent)" : "var(--mb-surface)", color: copied ? "var(--mb-accent-ink)" : "var(--mb-ink)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Link"}
                  </button>
                  {isCreator && (
                    <button
                      onClick={terminateRoom}
                      style={{ padding: "0.3rem 0.85rem", borderRadius: "9999px", border: "1px solid color-mix(in srgb, var(--mb-p1) 40%, transparent)", background: "color-mix(in srgb, var(--mb-p1) 15%, transparent)", color: "var(--mb-p1)", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                    >
                      End Room
                    </button>
                  )}
                </div>
              ) : (
                /* Pre-room panel */
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem", borderRadius: "var(--mb-card-radius, 1rem)", background: "color-mix(in srgb, var(--mb-surface) 95%, transparent)", border: "1px solid var(--mb-line)", width: "15rem", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
                  <MultiplayerToggle mode={mode} onChange={(m) => { setMode(m); setJoinError(""); }} />
                  {mode === "create" ? (
                    <button
                      onClick={createRoom}
                      style={{ padding: "0.5rem 1rem", borderRadius: "9999px", background: "var(--mb-accent)", color: "var(--mb-accent-ink)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none", transition: "opacity 0.2s" }}
                    >
                      Play with a Friend
                    </button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <input
                        ref={joinInputRef}
                        type="text"
                        value={joinCode}
                        onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                        placeholder="Room code or invite link"
                        style={{ width: "100%", padding: "0.45rem 0.75rem", borderRadius: "0.5rem", background: "var(--mb-cell)", border: `1px solid ${joinError ? "var(--mb-p1)" : "var(--mb-line)"}`, color: "var(--mb-ink)", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
                        aria-label="Room code or invite link"
                      />
                      {joinError && <p style={{ fontSize: "0.68rem", color: "var(--mb-p1)", margin: 0 }}>{joinError}</p>}
                      <button
                        onClick={joinRoom}
                        style={{ padding: "0.45rem 1rem", borderRadius: "9999px", background: "var(--mb-accent)", color: "var(--mb-accent-ink)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", border: "none" }}
                      >
                        Join Room
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Admin link */}
            <a
              href="/admin"
              style={{ padding: "0.3rem 0.85rem", borderRadius: "9999px", background: "var(--mb-surface)", border: "1px solid var(--mb-line)", color: "var(--mb-muted)", fontSize: "0.72rem", fontWeight: 600, textDecoration: "none", transition: "color 0.2s", whiteSpace: "nowrap" }}
            >
              Admin Studio
            </a>
          </div>

          {/* Game + Chat parallel container */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: "1.5rem",
              alignItems: "flex-start",
              justifyContent: "center",
              width: "100%",
              maxWidth: roomId ? "54rem" : "32rem",
              margin: "0 auto",
              transition: "max-width 0.3s ease",
            }}
          >
            {/* Game board */}
            <div style={{ flex: "1 1 24rem", minWidth: "18rem", maxWidth: "32rem" }}>
              <GameView
                state={state}
                boardKey={boardKey}
                onPlay={play}
                onRematch={rematch}
                onResetScore={resetScore}
                themePicker={<ThemePicker current={themePick} onPick={onThemePick} />}
              />
            </div>

            {/* Chat panel — parallel with game board when in a room */}
            {roomId && (
              <div
                style={{
                  flex: "1 1 18rem",
                  minWidth: "16rem",
                  maxWidth: "20rem",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "var(--mb-card-radius, 1.25rem)",
                  background: "color-mix(in srgb, var(--mb-surface) 95%, transparent)",
                  border: "1px solid var(--mb-line)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(12px)",
                  overflow: "hidden",
                  height: "540px",
                  maxHeight: "calc(100vh - 10rem)",
                }}
              >
                {/* Chat header */}
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--mb-line)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--mb-cell)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>💬</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--mb-ink)" }}>Room Chat</span>
                  </div>
                  {messages.length > 0 && (
                    <span style={{ fontSize: "0.68rem", background: "var(--mb-accent)", color: "var(--mb-accent-ink)", borderRadius: "9999px", padding: "0.15rem 0.5rem", fontWeight: 700 }}>
                      {messages.length} msg{messages.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {/* Messages list */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {messages.length === 0 && (
                    <div style={{ margin: "auto 0", textAlign: "center", color: "var(--mb-muted)", padding: "1rem" }}>
                      <p style={{ fontSize: "0.85rem", margin: "0 0 0.25rem" }}>👋 Say hello!</p>
                      <p style={{ fontSize: "0.72rem", margin: 0 }}>Chat with your opponent in real-time during the match.</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: msg.own ? "flex-end" : "flex-start",
                        maxWidth: "100%",
                      }}
                    >
                      <span style={{ fontSize: "0.62rem", color: "var(--mb-muted)", marginBottom: "0.15rem", padding: "0 0.25rem" }}>
                        {msg.own ? "You" : msg.sender.replace("_", " ")}
                      </span>
                      <div
                        style={{
                          borderRadius: "1rem",
                          borderBottomRightRadius: msg.own ? "0.25rem" : "1rem",
                          borderBottomLeftRadius: msg.own ? "1rem" : "0.25rem",
                          padding: "0.45rem 0.75rem",
                          fontSize: "0.78rem",
                          lineHeight: 1.35,
                          maxWidth: "85%",
                          wordBreak: "break-word",
                          background: msg.own ? "var(--mb-accent)" : "var(--mb-cell)",
                          color: msg.own ? "var(--mb-accent-ink)" : "var(--mb-ink)",
                          border: msg.own ? "none" : "1px solid var(--mb-line)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input bar */}
                <div style={{ padding: "0.65rem 0.75rem", borderTop: "1px solid var(--mb-line)", display: "flex", gap: "0.4rem", background: "var(--mb-cell)" }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatInput.trim()) {
                        sendChat(chatInput);
                        setChatInput("");
                      }
                    }}
                    placeholder="Type a message…"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "0.45rem 0.75rem",
                      borderRadius: "9999px",
                      background: "var(--mb-surface)",
                      border: "1px solid var(--mb-line)",
                      color: "var(--mb-ink)",
                      fontSize: "0.75rem",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        sendChat(chatInput);
                        setChatInput("");
                      }
                    }}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "9999px",
                      background: "var(--mb-accent)",
                      color: "var(--mb-accent-ink)",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Send message"
                  >
                    ↑
                  </button>
                </div>
              </div>
            )}
          </div>
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
