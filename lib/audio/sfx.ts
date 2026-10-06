/**
 * Tiny synthesised sound effects for Comic Mode. No audio files are bundled;
 * tones are generated with Web Audio, and only after a user gesture.
 */
import type { SoundProfile } from "../themes/types";

type Cue = "place" | "win" | "draw";

let ctx: AudioContext | null = null;

function tone(c: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, gain = 0.08) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.02);
}

/** Each theme has a sound identity: same cues, different timbre and register. */
const PROFILES: Record<SoundProfile, { wave: OscillatorType; shift: number; gain: number; step: number }> = {
  chime: { wave: "sine", shift: 2, gain: 0.07, step: 0.11 },
  soft: { wave: "sine", shift: 1, gain: 0.05, step: 0.13 },
  bright: { wave: "square", shift: 1, gain: 0.04, step: 0.08 },
  low: { wave: "triangle", shift: 0.5, gain: 0.08, step: 0.14 },
  pop: { wave: "triangle", shift: 1.5, gain: 0.06, step: 0.06 },
};

export function playCue(cue: Cue, profile: SoundProfile = "bright") {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const p = PROFILES[profile];
    if (cue === "place") tone(ctx, 520 * p.shift, 0, 0.08, p.wave, p.gain * 0.7);
    if (cue === "win") [523, 659, 784, 1046].forEach((f, i) => tone(ctx!, f * p.shift, i * p.step, 0.22, p.wave, p.gain));
    if (cue === "draw") [440, 415].forEach((f, i) => tone(ctx!, f * p.shift, i * p.step * 1.6, 0.25, p.wave, p.gain));
  } catch {
    // Sound is optional; ignore any audio failure.
  }
}
