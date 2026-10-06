import type { CellValue, GameAction, GameState, PlayerId } from "./types";

export const BOARD_SIZE = 3;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const PLAYER_IDS: readonly PlayerId[] = ["PLAYER_ONE", "PLAYER_TWO"];
export const FIRST_PLAYER: PlayerId = "PLAYER_ONE";

export const WINNING_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createEmptyBoard(): CellValue[] {
  return Array.from({ length: CELL_COUNT }, () => null);
}

export function createGameId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createInitialState(options: { gameId?: string } = {}): GameState {
  return {
    gameId: options.gameId ?? createGameId(),
    board: createEmptyBoard(),
    currentPlayer: FIRST_PLAYER,
    winner: null,
    winningCells: null,
    status: "playing",
    score: { PLAYER_ONE: 0, PLAYER_TWO: 0, draws: 0 },
    streak: { player: null, count: 0 },
    lastMove: null,
    round: 1,
    version: 0,
  };
}

export function otherPlayer(player: PlayerId): PlayerId {
  return player === "PLAYER_ONE" ? "PLAYER_TWO" : "PLAYER_ONE";
}

export function findWinner(board: readonly CellValue[]): { player: PlayerId; cells: number[] } | null {
  for (const [a, b, c] of WINNING_LINES) {
    const owner = board[a];
    if (owner && owner === board[b] && owner === board[c]) {
      return { player: owner, cells: [a, b, c] };
    }
  }
  return null;
}

export function isBoardFull(board: readonly CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

export function countMoves(board: readonly CellValue[], player?: PlayerId): number {
  return board.filter((cell) => (player ? cell === player : cell !== null)).length;
}

export function canPlayAt(state: GameState, index: number): boolean {
  return (
    state.status === "playing" &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < CELL_COUNT &&
    state.board[index] === null
  );
}

/** Returns the same object when the move is not allowed, so callers can detect no-ops. */
export function applyMove(state: GameState, index: number, player?: PlayerId): GameState {
  if (!canPlayAt(state, index)) return state;
  if (player !== undefined && player !== state.currentPlayer) return state;

  const board = state.board.slice();
  board[index] = state.currentPlayer;
  const version = state.version + 1;

  const win = findWinner(board);
  if (win) {
    const streak =
      state.streak.player === win.player
        ? { player: win.player, count: state.streak.count + 1 }
        : { player: win.player, count: 1 };
    return {
      ...state,
      board,
      winner: win.player,
      winningCells: win.cells,
      status: "won",
      score: { ...state.score, [win.player]: state.score[win.player] + 1 },
      streak,
      lastMove: index,
      version,
    };
  }

  if (isBoardFull(board)) {
    return {
      ...state,
      board,
      status: "draw",
      score: { ...state.score, draws: state.score.draws + 1 },
      streak: { player: null, count: 0 },
      lastMove: index,
      version,
    };
  }

  return { ...state, board, currentPlayer: otherPlayer(state.currentPlayer), lastMove: index, version };
}

/** New round, same score. Player one always opens. */
export function startRematch(state: GameState): GameState {
  return {
    ...state,
    board: createEmptyBoard(),
    currentPlayer: FIRST_PLAYER,
    winner: null,
    winningCells: null,
    status: "playing",
    lastMove: null,
    round: state.round + 1,
    version: state.version + 1,
  };
}

/** Clears score and streak and starts a fresh first round. Keeps the game id. */
export function resetScore(state: GameState): GameState {
  return {
    ...startRematch(state),
    score: { PLAYER_ONE: 0, PLAYER_TWO: 0, draws: 0 },
    streak: { player: null, count: 0 },
    round: 1,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "move":
      return applyMove(state, action.index, action.player);
    case "rematch":
      return startRematch(state);
    case "resetScore":
      return resetScore(state);
    case "syncState":
      // Always trust the synchronized state for now.
      return action.state;
    default:
      return state;
  }
}

/** Presentation-free description of the status line. Text comes from config. */
export type StatusInfo =
  | { kind: "turn"; player: PlayerId }
  | { kind: "won"; player: PlayerId }
  | { kind: "draw" };

export function getStatusInfo(state: GameState): StatusInfo {
  if (state.status === "draw") return { kind: "draw" };
  if (state.status === "won" && state.winner) return { kind: "won", player: state.winner };
  return { kind: "turn", player: state.currentPlayer };
}

/* ---------- Validation for anything coming from storage or the network ---------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isPlayerId(value: unknown): value is PlayerId {
  return value === "PLAYER_ONE" || value === "PLAYER_TWO";
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false;
  const { board, score, winningCells, streak } = value;
  return (
    typeof value.gameId === "string" &&
    Array.isArray(board) &&
    board.length === CELL_COUNT &&
    board.every((cell) => cell === null || isPlayerId(cell)) &&
    isPlayerId(value.currentPlayer) &&
    (value.winner === null || isPlayerId(value.winner)) &&
    (winningCells === null ||
      (Array.isArray(winningCells) &&
        winningCells.length === BOARD_SIZE &&
        winningCells.every((i) => isCount(i) && i < CELL_COUNT))) &&
    (value.status === "playing" || value.status === "won" || value.status === "draw") &&
    isRecord(score) &&
    isCount(score.PLAYER_ONE) &&
    isCount(score.PLAYER_TWO) &&
    isCount(score.draws) &&
    isRecord(streak) &&
    (streak.player === null || isPlayerId(streak.player)) &&
    isCount(streak.count) &&
    (value.lastMove === null || (isCount(value.lastMove) && value.lastMove < CELL_COUNT)) &&
    isCount(value.round) &&
    isCount(value.version)
  );
}
