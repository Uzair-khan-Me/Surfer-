export class AudioManager {
  private context: AudioContext | null = null;
  muted = false;
  private lastCoin = 0;
  unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional. */
    }
  }
  toggle() {
    this.muted = !this.muted;
    this.unlock();
    return this.muted;
  }
  play(kind: "jump" | "coin" | "crash" | "slide") {
    const ctx = this.context;
    if (this.muted || !ctx || ctx.state !== "running") return;
    if (kind === "coin" && ctx.currentTime - this.lastCoin < 0.045) return;
    if (kind === "coin") this.lastCoin = ctx.currentTime;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      const duration = kind === "crash" ? 0.35 : 0.13;
      const pitch = { jump: 290, coin: 1040, crash: 115, slide: 180 }[kind];
      oscillator.type = kind === "crash" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(pitch, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        kind === "crash" ? 35 : kind === "slide" ? 70 : pitch * 1.8,
        now + duration,
      );
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(
        kind === "crash" ? 0.075 : 0.09,
        now + 0.008,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      /* A failed sound must never interrupt the run. */
    }
  }
}
