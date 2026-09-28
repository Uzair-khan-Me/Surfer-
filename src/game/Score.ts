export class ScoreManager {
  distance = 0;
  coins = 0;
  best = 0;
  constructor() {
    try {
      const n = Number(localStorage.getItem("afterlight.best"));
      this.best = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    } catch {
      /* Storage may be disabled. */
    }
  }
  get score() {
    return Math.floor(this.distance * 3) + this.coins * 10;
  }
  update(distance: number) {
    this.distance += distance;
  }
  collect() {
    this.coins++;
  }
  reset() {
    this.distance = 0;
    this.coins = 0;
  }
  save() {
    this.best = Math.max(this.best, this.score);
    try {
      localStorage.setItem("afterlight.best", String(this.best));
    } catch {
      /* Best remains available for this session. */
    }
  }
}
