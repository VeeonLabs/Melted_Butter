/**
 * Core game types. Plain, serialisable data so the same shapes can be stored
 * locally now or synced through Supabase later.
 *
 * The rules only know two abstract players. Names, symbols, avatars and
 * artwork all live in GameConfig (lib/config) and never affect the rules.
 */

export type PlayerId = "PLAYER_ONE" | "PLAYER_TWO";
export type CellValue = PlayerId | null;
export type GameStatus = "playing" | "won" | "draw";

export interface Score {
  PLAYER_ONE: number;
  PLAYER_TWO: number;
  draws: number;
}

export interface Streak {
  /** Player on a winning run, or null after a draw / reset. */
  player: PlayerId | null;
  count: number;
}

export interface GameState {
  /** Private game id. Phase 2 will use this as the realtime channel / row key. */
  gameId: string;
  /** 9 cells, row by row: index = row * 3 + column. */
  board: CellValue[];
  currentPlayer: PlayerId;
  winner: PlayerId | null;
  winningCells: number[] | null;
  status: GameStatus;
  score: Score;
  streak: Streak;
  /** Index of the most recent accepted move, or null on an empty board. */
  lastMove: number | null;
  /** Current round, starting at 1. Increments on rematch. */
  round: number;
  /** Increments on every accepted change. Phase 2 can use it to reject stale updates. */
  version: number;
}

/**
 * Every change goes through one of these actions. In Phase 2 the same actions
 * can be sent over the wire and replayed by the reducer (or validated server-side).
 */
export type GameAction =
  | { type: "move"; index: number; player?: PlayerId }
  | { type: "rematch" }
  | { type: "resetScore" }
  | { type: "syncState"; state: GameState };
