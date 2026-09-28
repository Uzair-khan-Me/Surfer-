import * as T from "three";
import { obstacleModel } from "../rendering/ObstacleModels";
import { laneX } from "../config/constants";
export type ObstacleType = "train" | "barrier" | "overhead";
export class Obstacle {
  group = new T.Group();
  types: Record<ObstacleType, T.Group> = {
    train: new T.Group(),
    barrier: new T.Group(),
    overhead: new T.Group(),
  };
  type: ObstacleType = "train";
  lane = 0;
  active = false;
  constructor() {
    for (const g of Object.values(this.types)) this.group.add(g);
    for (const type of ["train", "barrier", "overhead"] as const) {
      this.types[type].add(obstacleModel(type));
    }
  }

  set(type: ObstacleType, lane: number) {
    this.type = type;
    this.lane = lane;
    this.active = true;
    this.group.visible = true;
    this.group.position.x = laneX(lane);
    for (const [key, g] of Object.entries(this.types)) g.visible = key === type;
  }
  get depth() {
    return this.type === "train" ? 6 : 0.6;
  }
  get bottom() {
    return this.type === "overhead" ? 1.325 : 0;
  }
  get top() {
    return this.type === "train" ? 3 : this.type === "overhead" ? 2.6 : 0.96;
  }
}
