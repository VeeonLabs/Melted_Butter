import { countMoves, isBoardFull, otherPlayer } from "../game/gameLogic";
import type { GameState, PlayerId } from "../game/types";
import { SLOTS } from "./slots";
import { fillTemplate } from "./template";
import type { GameConfig } from "./types";

/**
 * Picks what to show when a round ends. Pure: given the same config, state
 * and available artwork it always returns the same scene, so both devices
 * agree once the game is synced. "Randomize" uses a seed from the game id and
 * round instead of Math.random for exactly that reason.
 */

export type Moment = "secret" | "perfectVictory" | "specialCelebration" | "winningStreak" | "closeMatch" | null;

export interface SceneSide {
  player: PlayerId;
  name: string;
  slot: number | null;
  caption: string;
}

export interface ResultScene {
  kind: "win" | "draw";
  moment: Moment;
  momentCaption: string | null;
  momentSlot: number | null;
  winner: SceneSide | null;
  loser: SceneSide | null;
  /** Losing streak callout for the loser, when it applies. */
  loserStreakCaption: string | null;
  draw: { slot: number | null; caption: string } | null;
  /** Comic panel artwork for the spread (21–30, rotating). */
  panelSlot: number | null;
  /** Last-move panel (slot 46) for comic spreads. */
  lastMoveSlot: number | null;
  sfx: string | null;
}

/** Small deterministic PRNG (mulberry32) seeded from a string. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chooser(config: GameConfig, state: GameState) {
  const rng = seededRandom(`${state.gameId}:${state.round}:${state.score.PLAYER_ONE}:${state.score.PLAYER_TWO}:${state.score.draws}`);
  return function choose<T>(items: readonly T[]): T | null {
    if (items.length === 0) return null;
    const index = config.reactions.randomize ? Math.floor(rng() * items.length) : (state.round - 1) % items.length;
    return items[index];
  };
}

const unique = (list: number[]) => [...new Set(list)];

export function buildResultScene(
  config: GameConfig,
  state: GameState,
  isFilled: (slot: number) => boolean,
): ResultScene | null {
  if (state.status === "playing") return null;
  const r = config.reactions;
  const choose = chooser(config, state);
  const filled = (slots: number[]) => unique(slots).filter(isFilled);
  // Secret roll is taken first so it's independent of how many images exist.
  const secretRoll = seededRandom(`${state.gameId}:${state.round}:secret`)();
  const panelSlot = choose(filled([...SLOTS.comicPanels]));
  const sfx = config.comic.enabled ? choose(config.comic.sfxWords) : null;
  const lastMoveSlot = isFilled(SLOTS.lastMove) ? SLOTS.lastMove : null;

  if (state.status === "draw" || !state.winner) {
    return {
      kind: "draw",
      moment: null,
      momentCaption: null,
      momentSlot: null,
      winner: null,
      loser: null,
      loserStreakCaption: null,
      draw: { slot: choose(filled(r.pools.draw)), caption: choose(r.captions.draw) ?? "" },
      panelSlot,
      lastMoveSlot,
      sfx,
    };
  }

  const winnerId = state.winner;
  const loserId = otherPlayer(winnerId);
  const winnerName = config.players[winnerId].name;
  const loserName = config.players[loserId].name;
  const wins = state.score[winnerId];
  const vars = { winner: winnerName, loser: loserName, streak: state.streak.count, wins, round: state.round };

  let moment: Moment = null;
  if (secretRoll < r.secretChance && isFilled(SLOTS.secret)) moment = "secret";
  else if (countMoves(state.board, winnerId) === 3) moment = "perfectVictory";
  else if (wins > 0 && wins % r.celebrateEvery === 0) moment = "specialCelebration";
  else if (state.streak.count >= r.streakThreshold) moment = "winningStreak";
  else if (isBoardFull(state.board)) moment = "closeMatch";

  const momentSlotFor: Record<Exclude<Moment, null>, number> = {
    secret: SLOTS.secret,
    perfectVictory: SLOTS.perfectVictory,
    specialCelebration: SLOTS.specialCelebration,
    winningStreak: SLOTS.winningStreak,
    closeMatch: SLOTS.closeMatch,
  };
  const momentSlot = moment && isFilled(momentSlotFor[moment]) ? momentSlotFor[moment] : null;
  const momentCaption = moment ? fillTemplate(r.moments[moment], vars) : null;

  const winnerSlot = choose(filled([SLOTS.victory[winnerId], ...r.pools.win]));
  const losingStreak = state.streak.count >= r.streakThreshold;
  const loserSlot =
    losingStreak && isFilled(SLOTS.losingStreak)
      ? SLOTS.losingStreak
      : choose(filled([SLOTS.defeat[loserId], ...r.pools.loss]));

  return {
    kind: "win",
    moment,
    momentCaption,
    momentSlot,
    winner: {
      player: winnerId,
      name: winnerName,
      slot: momentSlot ?? winnerSlot,
      caption: fillTemplate(choose(r.captions.win) ?? "", vars),
    },
    loser: r.showLoserReaction
      ? { player: loserId, name: loserName, slot: loserSlot, caption: fillTemplate(choose(r.captions.loss) ?? "", vars) }
      : null,
    loserStreakCaption: losingStreak ? fillTemplate(r.moments.losingStreak, vars) : null,
    draw: null,
    panelSlot,
    lastMoveSlot,
    sfx,
  };
}
