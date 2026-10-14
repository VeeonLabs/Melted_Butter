"use client";

import { useCallback, useEffect, useReducer, useState, useRef } from "react";
import { createInitialState, gameReducer } from "@/lib/game/gameLogic";
import { createLocalGameStore, type GameStore } from "@/lib/game/storage";
import type { GameState, PlayerId, GameAction } from "@/lib/game/types";
import { io, Socket } from "socket.io-client";

export interface ChatMessage {
  sender: string;
  message: string;
  ts: number;
  own?: boolean;
}

const defaultStore = createLocalGameStore();

function hydrate(store: GameStore): GameState {
  return store.load() ?? createInitialState();
}

function getSessionPlayerId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.sessionStorage.getItem("mb:player-id");
    if (!id) {
      id = "p_" + Math.random().toString(36).substring(2, 10);
      window.sessionStorage.setItem("mb:player-id", id);
    }
    return id;
  } catch {
    return "p_" + Math.random().toString(36).substring(2, 10);
  }
}

/**
 * The only place UI meets game state. Phase 2 can replace `store` with a
 * Supabase-backed one and dispatch remote actions into the same reducer.
 */
export function useGame(store: GameStore = defaultStore) {
  const [state, dispatch] = useReducer(gameReducer, store, hydrate);
  // Changes on rematch/reset so the board can replay its entrance animation.
  const [boardKey, setBoardKey] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerId | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room")?.trim();
    if (room) {
      setRoomId(room);
      const socket = io({
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      const playerId = getSessionPlayerId();

      socket.on("connect", () => {
        socket.emit("join-room", { roomId: room, playerId });
      });

      socket.on("player-assigned", ({ role, isCreator }: { role: PlayerId | null; isCreator: boolean }) => {
        setPlayerRole(role);
        setIsCreator(isCreator);
      });

      socket.on("sync-state", (newState: GameState) => {
        dispatch({ type: "syncState", state: newState });
      });

      socket.on("room-terminated", () => {
        alert("The room was terminated by the creator.");
        window.location.href = "/";
      });

      socket.on("chat-message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, { ...msg, own: false }]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    store.save(state);
  }, [state, store]);

  const prevRoundRef = useRef(state.round);
  useEffect(() => {
    if (state.round !== prevRoundRef.current) {
      setBoardKey((k) => k + 1);
      prevRoundRef.current = state.round;
    }
  }, [state.round]);

  const dispatchAndSync = useCallback((action: GameAction) => {
    const actionWithPlayer = 
      (action.type === "move" && !action.player && playerRole) 
      ? { ...action, player: playerRole } 
      : action;
      
    // Compute next state to sync
    // This is safe because dispatchAndSync depends on latest state
    const newState = gameReducer(state, actionWithPlayer);
    
    if (newState === state) return;

    dispatch(actionWithPlayer);

    if (socketRef.current && roomId) {
      socketRef.current.emit("sync-state", { roomId, state: newState });

      if (newState.status === "won" && state.status !== "won") {
        const winnerRoleLabel = newState.winner === "PLAYER_ONE" ? "Player 1" : "Player 2";
        const text = `🏆 ${winnerRoleLabel} won the round!`;
        setMessages((prev) => [...prev, { sender: "System", message: text, ts: Date.now(), own: false }]);
        socketRef.current.emit("chat-message", {
          roomId,
          sender: "System",
          message: text,
        });
      } else if (newState.status === "draw" && state.status !== "draw") {
        const text = `🤝 Round ${newState.round} ended in a draw!`;
        setMessages((prev) => [...prev, { sender: "System", message: text, ts: Date.now(), own: false }]);
        socketRef.current.emit("chat-message", {
          roomId,
          sender: "System",
          message: text,
        });
      }
    }
  }, [state, playerRole, roomId]);

  const terminateRoom = useCallback(() => {
    if (socketRef.current && roomId && isCreator) {
      const playerId = getSessionPlayerId();
      socketRef.current.emit("terminate-room", { roomId, playerId });
      window.location.href = "/";
    }
  }, [roomId, isCreator]);

  const sendChat = useCallback((message: string) => {
    if (!socketRef.current || !roomId || !message.trim()) return;
    const sender = playerRole ?? "Observer";
    const payload: ChatMessage = { sender, message: message.trim(), ts: Date.now(), own: true };
    setMessages((prev) => [...prev, payload]);
    socketRef.current.emit("chat-message", { roomId, message: message.trim(), sender });
  }, [roomId, playerRole]);

  const play = useCallback((index: number) => {
    if (playerRole && playerRole !== state.currentPlayer) {
      console.warn(`[Multiplayer] Move ignored: You are ${playerRole}, but it's ${state.currentPlayer}'s turn.`);
      return;
    }
    dispatchAndSync({ type: "move", index, player: playerRole || undefined });
  }, [dispatchAndSync, playerRole, state.currentPlayer]);

  const rematch = useCallback(() => {
    const randomFirst: PlayerId = Math.random() < 0.5 ? "PLAYER_ONE" : "PLAYER_TWO";
    dispatchAndSync({ type: "rematch", firstPlayer: randomFirst });
    if (socketRef.current && roomId) {
      const firstLabel = randomFirst === "PLAYER_ONE" ? "Player 1" : "Player 2";
      const text = `🎲 Rematch! ${firstLabel} was randomly selected to go first.`;
      setMessages((prev) => [...prev, { sender: "System", message: text, ts: Date.now(), own: false }]);
      socketRef.current.emit("chat-message", {
        roomId,
        sender: "System",
        message: text,
      });
    }
  }, [dispatchAndSync, roomId]);

  const resetScore = useCallback(() => {
    const randomFirst: PlayerId = Math.random() < 0.5 ? "PLAYER_ONE" : "PLAYER_TWO";
    dispatchAndSync({ type: "resetScore", firstPlayer: randomFirst });
    if (socketRef.current && roomId) {
      const firstLabel = randomFirst === "PLAYER_ONE" ? "Player 1" : "Player 2";
      const text = `🎲 Score reset! ${firstLabel} was randomly selected to go first.`;
      setMessages((prev) => [...prev, { sender: "System", message: text, ts: Date.now(), own: false }]);
      socketRef.current.emit("chat-message", {
        roomId,
        sender: "System",
        message: text,
      });
    }
  }, [dispatchAndSync, roomId]);

  return { state, boardKey, play, rematch, resetScore, roomId, playerRole, isCreator, terminateRoom, messages, sendChat };
}
