import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WINNING_LINES,
  applyMove,
  canPlayAt,
  createInitialState,
  findWinner,
  gameReducer,
  getStatusInfo,
  isGameState,
} from "./gameLogic";
import type { GameState, PlayerId } from "./types";

const fresh = () => createInitialState({ gameId: "test" });
const play = (moves: number[], start: GameState = fresh()) =>
  moves.reduce((s, i) => applyMove(s, i), start);

/** Builds a move order where `winner` completes `line` and the other player never wins first. */
function sequenceFor(line: readonly number[], winner: PlayerId): number[] {
  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !line.includes(i));
  if (winner === "PLAYER_ONE") {
    const o = others.slice(0, 2);
    return [line[0], o[0], line[1], o[1], line[2]];
  }
  // X plays three non-line cells that don't form a line themselves.
  for (let a = 0; a < others.length; a++)
    for (let b = a + 1; b < others.length; b++)
      for (let c = b + 1; c < others.length; c++) {
        const x = [others[a], others[b], others[c]];
        const xWins = WINNING_LINES.some((l) => l.every((i) => x.includes(i)));
        if (!xWins) return [x[0], line[0], x[1], line[1], x[2], line[2]];
      }
  throw new Error("no sequence");
}

describe("setup", () => {
  it("starts empty with player one to move", () => {
    const s = fresh();
    assert.equal(s.board.length, 9);
    assert.ok(s.board.every((c) => c === null));
    assert.equal(s.currentPlayer, "PLAYER_ONE");
    assert.equal(s.status, "playing");
    assert.deepEqual(getStatusInfo(s), { kind: "turn", player: "PLAYER_ONE" });
  });
});

describe("moves", () => {
  it("can play every cell and alternates turns", () => {
    for (let i = 0; i < 9; i++) {
      const s = applyMove(fresh(), i);
      assert.equal(s.board[i], "PLAYER_ONE");
      assert.equal(s.currentPlayer, "PLAYER_TWO");
      assert.equal(s.lastMove, i);
      assert.deepEqual(getStatusInfo(s), { kind: "turn", player: "PLAYER_TWO" });
    }
  });

  it("ignores occupied cells", () => {
    const s = play([4]);
    assert.equal(applyMove(s, 4), s);
  });

  it("ignores out-of-range and non-integer indices", () => {
    const s = fresh();
    for (const i of [-1, 9, 1.5, NaN]) assert.equal(applyMove(s, i), s);
  });

  it("ignores a move made by the player whose turn it isn't", () => {
    const s = fresh();
    assert.equal(applyMove(s, 0, "PLAYER_TWO"), s);
    assert.notEqual(applyMove(s, 0, "PLAYER_ONE"), s);
  });
});

describe("wins", () => {
  for (const player of ["PLAYER_ONE", "PLAYER_TWO"] as const) {
    WINNING_LINES.forEach((line) => {
      it(`${player} wins on [${line.join(",")}]`, () => {
        const s = play(sequenceFor(line, player));
        assert.equal(s.status, "won");
        assert.equal(s.winner, player);
        assert.deepEqual(s.winningCells, [...line]);
        assert.equal(s.score[player], 1);
        assert.deepEqual(s.streak, { player, count: 1 });
        assert.deepEqual(getStatusInfo(s), { kind: "won", player });
      });
    });
  }

  it("blocks all input after a win", () => {
    const s = play(sequenceFor([0, 1, 2], "PLAYER_ONE"));
    for (let i = 0; i < 9; i++) {
      assert.equal(canPlayAt(s, i), false);
      assert.equal(applyMove(s, i), s);
    }
  });

  it("a win on the ninth move is a win, not a draw", () => {
    const s = play([0, 1, 5, 2, 6, 3, 7, 4, 8]);
    assert.equal(s.status, "won");
    assert.equal(s.winner, "PLAYER_ONE");
    assert.equal(s.score.draws, 0);
  });

  it("findWinner returns null on an empty board", () => {
    assert.equal(findWinner(fresh().board), null);
  });
});

describe("draws", () => {
  it("detects a full board with no winner", () => {
    const s = play([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    assert.equal(s.status, "draw");
    assert.equal(s.winner, null);
    assert.equal(s.score.draws, 1);
    assert.deepEqual(getStatusInfo(s), { kind: "draw" });
    assert.deepEqual(s.streak, { player: null, count: 0 });
    assert.equal(applyMove(s, 0), s);
  });
});

describe("rematch and reset", () => {
  it("rematch clears the board, keeps the score, player one starts", () => {
    const won = play(sequenceFor([2, 4, 6], "PLAYER_TWO"));
    const r = gameReducer(won, { type: "rematch" });
    assert.ok(r.board.every((c) => c === null));
    assert.equal(r.currentPlayer, "PLAYER_ONE");
    assert.equal(r.status, "playing");
    assert.equal(r.winningCells, null);
    assert.equal(r.lastMove, null);
    assert.deepEqual(r.streak, won.streak);
    assert.deepEqual(r.score, won.score);
    assert.equal(r.round, 2);
    assert.equal(r.gameId, won.gameId);
  });

  it("reset score zeros everything and starts round 1", () => {
    let s = play(sequenceFor([0, 1, 2], "PLAYER_ONE"));
    s = gameReducer(s, { type: "rematch" });
    s = play([0, 1, 2, 4, 3, 5, 7, 6, 8], s);
    s = play([4], gameReducer(s, { type: "rematch" }));
    const r = gameReducer(s, { type: "resetScore" });
    assert.deepEqual(r.score, { PLAYER_ONE: 0, PLAYER_TWO: 0, draws: 0 });
    assert.deepEqual(r.streak, { player: null, count: 0 });
    assert.ok(r.board.every((c) => c === null));
    assert.equal(r.currentPlayer, "PLAYER_ONE");
    assert.equal(r.round, 1);
  });

  it("version increases on every accepted change only", () => {
    const s = play([0, 1]);
    assert.equal(s.version, 2);
    assert.equal(applyMove(s, 0).version, 2);
  });
});

describe("persistence shape", () => {
  it("round-trips through JSON", () => {
    const s = play(sequenceFor([0, 4, 8], "PLAYER_ONE"));
    const parsed: unknown = JSON.parse(JSON.stringify(s));
    assert.ok(isGameState(parsed));
    assert.deepEqual(parsed, s);
  });

  it("rejects corrupted data", () => {
    assert.equal(isGameState(null), false);
    assert.equal(isGameState({}), false);
    assert.equal(isGameState({ ...fresh(), board: [1, 2, 3] }), false);
    assert.equal(isGameState({ ...fresh(), status: "paused" }), false);
  });
});

describe("streaks", () => {
  it("counts consecutive wins and switches on a new winner", () => {
    let s = play(sequenceFor([0, 1, 2], "PLAYER_ONE"));
    s = play(sequenceFor([3, 4, 5], "PLAYER_ONE"), gameReducer(s, { type: "rematch" }));
    assert.deepEqual(s.streak, { player: "PLAYER_ONE", count: 2 });
    s = play(sequenceFor([6, 7, 8], "PLAYER_TWO"), gameReducer(s, { type: "rematch" }));
    assert.deepEqual(s.streak, { player: "PLAYER_TWO", count: 1 });
  });

  it("old X/O saves are rejected so a fresh game starts", () => {
    assert.equal(isGameState({ ...fresh(), board: ["X", null, null, null, null, null, null, null, null] }), false);
  });
});
