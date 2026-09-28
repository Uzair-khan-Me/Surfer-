import * as T from "three";
import { material } from "../world/primitives";
import { laneX } from "../config/constants";
import { EncounterManager, Encounter } from "./Encounters";
import { Player } from "./Player";
const geometry = new T.CylinderGeometry(0.26, 0.26, 0.085, 12);
geometry.rotateX(Math.PI / 2);
const rimGeometry = new T.TorusGeometry(0.19, 0.025, 4, 12);
export class Coin {
  mesh = new T.Mesh(geometry, material(0xffc45e, true));
  collected = false;
  constructor() {
    const ring = new T.Mesh(rimGeometry, material(0xffecaf));
    ring.position.z = 0.05;
    this.mesh.add(ring);
  }
  reset(x: number, z: number, y = 1) {
    this.collected = false;
    this.mesh.visible = true;
    this.mesh.position.set(x, y, z);
  }
}
export class CoinManager {
  groups: { row: Encounter; coins: Coin[]; lastZ: number }[] = [];
  time = 0;
  constructor(encounters: EncounterManager) {
    for (const row of encounters.rows) {
      const coins = Array.from({ length: 9 }, () => new Coin());
      coins.forEach((c) => row.group.add(c.mesh));
      this.groups.push({ row, coins, lastZ: row.group.position.z });
    }
    this.reset();
  }
  private fill(g: (typeof this.groups)[number]) {
    g.coins.forEach((c, i) => {
      const lane = g.row.safeLane;
      const offset = i < 3 ? Math.sin((i / 3) * Math.PI) * 0.45 : 0;
      c.reset(laneX(lane) + offset, 12 - i * 2.3, 1 + Math.sin(i * 0.5) * 0.12);
    });
    g.lastZ = g.row.group.position.z;
  }
  reset() {
    this.time = 0;
    this.groups.forEach((g) => this.fill(g));
  }
  update(dt: number, player: Player, collect: () => void, canCollect = true) {
    this.time += dt;
    for (const g of this.groups) {
      if (g.row.group.position.z < g.lastZ - 1) this.fill(g);
      g.lastZ = g.row.group.position.z;
      for (const c of g.coins) {
        if (c.collected) continue;
        c.mesh.rotation.y = this.time * 2.5;
        const z = g.row.group.position.z + c.mesh.position.z;
        if (
          canCollect &&
          Math.abs(z) < 0.6 &&
          Math.abs(c.mesh.position.x - player.group.position.x) < 0.65 &&
          player.y < c.mesh.position.y + 0.3 &&
          player.y + player.height > c.mesh.position.y - 0.3
        ) {
          c.collected = true;
          c.mesh.visible = false;
          collect();
        }
      }
    }
  }
}
