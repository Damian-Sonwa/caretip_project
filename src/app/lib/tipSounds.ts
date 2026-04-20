import { logClientError } from "./clientLog";

/** Short "cha-ching"–style cue using Web Audio (no external assets). */
export function playChaChingSound(): void {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(ctx.destination);

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    playTone(523.25, now, 0.08);
    playTone(659.25, now + 0.06, 0.1);
    playTone(783.99, now + 0.14, 0.14);

    setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 600);
  } catch (err) {
    logClientError("tipSounds.playChaChingSound", err);
  }
}
