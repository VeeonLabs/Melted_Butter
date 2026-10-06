"use client";

import { useCallback, useEffect, useReducer, useState, useRef } from "react";
import { createInitialState, gameReducer } from "@/lib/game/gameLogic";
import { createLocalGameStore, type GameStore } from "@/lib/game/storage";
import type { GameState, PlayerId, GameAction } from "@/lib/game/types";
import { io, Socket } from "socket.io-client";

const defaultStore = createLocalGameStore();

function hydrate(store: GameStore): GameState {
  return store.load() ?? createInitialState();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    if (room) {
      setRoomId(room);
      const socket = io();
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", room);
      });

      socket.on("player-assigned", ({ role, isCreator }) => {
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
    }
  }, [state, playerRole, roomId]);

  const terminateRoom = useCallback(() => {
    if (socketRef.current && roomId && isCreator) {
      socketRef.current.emit("terminate-room", roomId);
      window.location.href = "/";
    }
  }, [roomId, isCreator]);

  const play = useCallback((index: number) => {
    dispatchAndSync({ type: "move", index, player: playerRole || undefined });
  }, [dispatchAndSync, playerRole]);

  const rematch = useCallback(() => {
    dispatchAndSync({ type: "rematch" });
  }, [dispatchAndSync]);

  const resetScore = useCallback(() => {
    dispatchAndSync({ type: "resetScore" });
  }, [dispatchAndSync]);

  return { state, boardKey, play, rematch, resetScore, roomId, playerRole, isCreator, terminateRoom };
}
