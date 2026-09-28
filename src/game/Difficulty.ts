export class DifficultyManager {
  time = 0;
  speed = 12;
  get hardness() {
    return Math.min(this.time / 120, 1);
  }
  update(dt: number) {
    this.time += dt;
    this.speed = Math.min(20, 12 + this.time / 15);
  }
  reset() {
    this.time = 0;
    this.speed = 12;
  }
}
