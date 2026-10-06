import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMove, createInitialState, startRematch } from "../game/gameLogic";
import type { GameState } from "../game/types";
import { createDefaultConfig } from "./defaults";
import { buildResultScene, seededRandom } from "./reactionEngine";

const play = (moves: number[], s: GameState = createInitialState({ gameId: "g" })) =>
  moves.reduce((acc, i) => applyMove(acc, i), s);
const P1_WIN = [0, 3, 1, 4, 2]; // 3 moves: perfect
const P2_SLOW_WIN = [0, 4, 8, 1, 7, 2, 3, 6]; // player two wins using four moves
const P2_WIN = [0, 3, 1, 4, 8, 5];
const DRAW = [0, 1, 2, 4, 3, 5, 7, 6, 8];
const none = () => false;
const all = () => true;

describe("result scene", () => {
  it("nothing while playing", () => {
    assert.equal(buildResultScene(createDefaultConfig(), play([0]), all), null);
  });

  it("win uses captions and player names", () => {
    const c = createDefaultConfig();
    c.reactions.randomize = false;
    const scene = buildResultScene(c, play(P2_WIN), none)!;
    assert.equal(scene.kind, "win");
    assert.equal(scene.winner!.name, "Her");
    assert.equal(scene.loser!.name, "You");
    assert.equal(scene.winner!.caption, "Absolute domination. 👑");
    assert.equal(scene.loser!.caption, "You got cooked. 😂");
    assert.equal(scene.winner!.slot, null);
  });

  it("prefers the winner's own victory slot when it's the only one filled", () => {
    const c = createDefaultConfig();
    const scene = buildResultScene(c, play(P2_WIN), (n) => n === 12 || n === 13)!;
    assert.equal(scene.winner!.slot, 12);
    assert.equal(scene.loser!.slot, 13);
  });

  it("only draws from filled pool slots", () => {
    const c = createDefaultConfig();
    c.reactions.pools.loss = [15, 16, 17, 19];
    const filled = new Set([16, 19]);
    for (let round = 1; round < 40; round++) {
      const s = { ...play(P2_WIN), round, gameId: `g${round}` };
      const slot = buildResultScene(c, s, (n) => filled.has(n))!.loser!.slot;
      assert.ok(slot === 16 || slot === 19, `round ${round}: ${slot}`);
    }
  });

  it("randomize spreads picks; off rotates by round", () => {
    const c = createDefaultConfig();
    c.reactions.pools.win = [15, 16, 17, 18, 19];
    const seen = new Set<number | null>();
    for (let round = 1; round <= 30; round++) {
      seen.add(buildResultScene(c, { ...play(P2_WIN), round, gameId: `x${round}` }, (n) => n >= 15 && n <= 19)!.winner!.slot);
    }
    assert.ok(seen.size >= 3, `only ${seen.size} distinct`);

    c.reactions.randomize = false;
    const pick = (round: number) =>
      buildResultScene(c, { ...play(P2_WIN), round }, (n) => n >= 15 && n <= 19)!.winner!.caption;
    assert.equal(pick(1), "Absolute domination. 👑");
    assert.equal(pick(2), "Too easy, honestly. 💅");
    assert.equal(pick(4), "Absolute domination. 👑");
  });

  it("is deterministic for the same state (both devices agree)", () => {
    const c = createDefaultConfig();
    const s = play(P2_WIN);
    assert.deepEqual(buildResultScene(c, s, all), buildResultScene(c, s, all));
    assert.ok(seededRandom("a")() !== seededRandom("b")());
  });

  it("draw uses the draw pool and caption", () => {
    const c = createDefaultConfig();
    c.reactions.randomize = false;
    const scene = buildResultScene(c, play(DRAW), (n) => n === 20)!;
    assert.equal(scene.kind, "draw");
    assert.equal(scene.draw!.slot, 20);
    assert.equal(scene.draw!.caption, "Nobody wins. Suspicious. 🤝");
  });

  it("perfect victory moment, with its slot when filled", () => {
    const c = createDefaultConfig();
    c.reactions.secretChance = 0;
    const scene = buildResultScene(c, play(P1_WIN), (n) => n === 44)!;
    assert.equal(scene.moment, "perfectVictory");
    assert.equal(scene.momentSlot, 44);
    assert.equal(scene.winner!.slot, 44);
  });

  it("close match when the win lands on the last square", () => {
    const c = createDefaultConfig();
    c.reactions.secretChance = 0;
    const s = play([0, 1, 5, 2, 6, 3, 7, 4, 8]);
    assert.equal(s.winner, "PLAYER_ONE");
    assert.equal(buildResultScene(c, s, none)!.moment, "closeMatch");
  });

  it("streak and celebration moments fill templates", () => {
    const c = createDefaultConfig();
    c.reactions.secretChance = 0;
    let s = createInitialState({ gameId: "g" });
    for (let i = 0; i < 3; i++) s = play(P2_SLOW_WIN, i ? startRematch(s) : s);
    assert.equal(s.winner, "PLAYER_TWO");
    const scene = buildResultScene(c, s, (n) => n === 43)!;
    assert.equal(scene.moment, "winningStreak");
    assert.equal(scene.momentCaption, "Her is on a 3-win streak. 🔥");
    assert.equal(scene.loser!.slot, 43);
    assert.equal(scene.loserStreakCaption, "You has lost 3 in a row. Somebody help. 🫣");
    for (let i = 0; i < 2; i++) s = play(P2_SLOW_WIN, startRematch(s));
    assert.equal(buildResultScene(c, s, none)!.moment, "specialCelebration");
  });

  it("secret reaction needs artwork and the chance", () => {
    const c = createDefaultConfig();
    c.reactions.secretChance = 1;
    assert.equal(buildResultScene(c, play(P2_WIN), (n) => n === 50)!.moment, "secret");
    assert.notEqual(buildResultScene(c, play(P2_WIN), none)!.moment, "secret");
  });

  it("loser reaction can be switched off", () => {
    const c = createDefaultConfig();
    c.reactions.showLoserReaction = false;
    assert.equal(buildResultScene(c, play(P2_WIN), all)!.loser, null);
  });

});
