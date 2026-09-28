import * as T from "three";
import { PlayerModel } from "../rendering/PlayerModel";
import {
  laneX,
  GRAVITY,
  JUMP_FORCE,
  SLIDE_DURATION,
} from "../config/constants";
import { PlayerState } from "./GameState";
export class Player {
  group = new T.Group();
  private model = new PlayerModel();
  body = this.model.root;
  lane = 1;
  y = 0;
  velocityY = 0;
  state = PlayerState.RUNNING;
  slideTime = 0;
  time = 0;
  constructor() {
    this.group.add(this.body);
  }
  reset() {
    this.lane = 1;
    this.y = 0;
    this.velocityY = 0;
    this.slideTime = 0;
    this.time = 0;
    this.state = PlayerState.RUNNING;
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.body.scale.set(1, 1, 1);
    this.body.rotation.set(0, 0, 0);
    this.model.pose(PlayerState.RUNNING, 0, 0);
  }
  move(dir: number) {
    if (this.state !== PlayerState.DEAD)
      this.lane = Math.max(0, Math.min(2, this.lane + dir));
  }
  jump() {
    if (this.state !== PlayerState.RUNNING) return false;
    this.velocityY = JUMP_FORCE;
    this.state = PlayerState.JUMPING;
    return true;
  }
  slide() {
    if (this.state !== PlayerState.RUNNING) return false;
    this.state = PlayerState.SLIDING;
    this.slideTime = SLIDE_DURATION;
    return true;
  }
  update(dt: number) {
    if (this.state === PlayerState.DEAD) return;
    this.time += dt;
    const target = laneX(this.lane);
    this.group.position.x = T.MathUtils.damp(
      this.group.position.x,
      target,
      18,
      dt,
    );
    this.body.rotation.z = (this.group.position.x - target) * 0.1;
    if (
      this.state === PlayerState.JUMPING ||
      this.state === PlayerState.FALLING
    ) {
      this.velocityY -= GRAVITY * dt;
      this.y += this.velocityY * dt;
      if (this.velocityY < 0) this.state = PlayerState.FALLING;
      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.state = PlayerState.RUNNING;
      }
    }
    if (this.state === PlayerState.SLIDING) {
      this.slideTime -= dt;
      if (this.slideTime <= 0) this.state = PlayerState.RUNNING;
    }
    this.group.position.y = this.y;
    this.model.pose(
      this.state,
      this.time,
      (this.group.position.x - target) * 0.1,
    );
  }

  get height() {
    return this.state === PlayerState.SLIDING ? 0.68 : 1.85;
  }
}
