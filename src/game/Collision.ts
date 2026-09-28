import { Player } from "./Player";
import { EncounterManager } from "./Encounters";
import { laneX } from "../config/constants";
export class CollisionSystem {
  obstacleHit(player: Player, encounters: EncounterManager) {
    for (const row of encounters.rows) {
      for (const o of row.obstacles) {
        if (!o.active) continue;
        if (
          Math.abs(row.group.position.z) < o.depth / 2 + 0.3 &&
          Math.abs(player.group.position.x - laneX(o.lane)) < 1.1 + 0.25 &&
          player.y < o.top &&
          player.y + player.height > o.bottom
        )
          return true;
      }
    }
    return false;
  }
}
