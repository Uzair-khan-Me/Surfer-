import * as T from "three";
import { Obstacle } from "./Obstacle";
import { makePattern } from "./Patterns";
export class Encounter {
  group = new T.Group();
  obstacles = [new Obstacle(), new Obstacle()];
  safeLane = 1;
  constructor() {
    this.obstacles.forEach((o) => this.group.add(o.group));
  }
}
export class EncounterManager {
  rows: Encounter[] = [];
  index = 0;
  constructor(scene: T.Scene) {
    for (let i = 0; i < 8; i++) {
      const row = new Encounter();
      scene.add(row.group);
      this.rows.push(row);
    }
    this.reset();
  }
  configure(row: Encounter, z: number, hardness: number) {
    row.group.position.z = z;
    const p = makePattern(this.index++, hardness);
    row.safeLane = p.safeLane;
    row.obstacles.forEach((o, i) => {
      o.active = !!p.obstacles[i];
      o.group.visible = o.active;
      if (o.active) o.set(p.obstacles[i].type, p.obstacles[i].lane);
    });
  }
  reset() {
    this.index = 0;
    this.rows.forEach((row, i) => this.configure(row, -48 - i * 32, 0));
  }
  update(dt: number, speed: number, hardness = 0) {
    for (const row of this.rows) row.group.position.z += speed * dt;
    for (const row of this.rows)
      if (row.group.position.z > 15) {
        const far = Math.min(...this.rows.map((r) => r.group.position.z));
        this.configure(row, far - (32 - 8 * hardness), hardness);
      }
  }
}
