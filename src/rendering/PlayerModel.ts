import * as T from "three";
import { PlayerState } from "../game/GameState";
import { bevel, mesh, sphereGeometry, limbGeometry } from "./geometry";
import { box } from "../world/primitives";
import { batchStatic } from "../world/batch";
/** Presentation only. No lane, jump, slide timer, or collision state is owned here. */
export class PlayerModel {
  root = new T.Group();
  private torso = new T.Group();
  private head = new T.Group();
  private hips: T.Group[] = [];
  private knees: T.Group[] = [];
  private shoulders: T.Group[] = [];
  private elbows: T.Group[] = [];
  constructor() {
    this.root.add(this.torso);
    this.torso.position.y = 0.86;
    // Tapered jacket, collar, and a compact courier pack; faceted head instead of a cube.
    mesh(this.torso, limbGeometry, 0xeee7ce, 0, 0.31, 0, 0.34, 0.6, 0.23);
    bevel(this.torso, 0.44, 0.12, 0.3, 0, 0.04, 0, 0x214653, 0.035);
    mesh(this.torso, limbGeometry, 0xdb9a72, 0, 0.65, 0, 0.1, 0.15, 0.1);
    bevel(this.torso, 0.4, 0.47, 0.19, 0, 0.35, 0.26, 0xec693e, 0.065);
    box(this.torso, 0.29, 0.065, 0.025, 0, 0.39, 0.365, 0xe5ffc6, true);
    for (const s of [-1, 1])
      box(this.torso, 0.05, 0.5, 0.04, s * 0.19, 0.34, -0.2, 0x295360);
    this.head.position.y = 0.76;
    this.torso.add(this.head);
    mesh(
      this.head,
      sphereGeometry,
      0xe5ac84,
      0,
      0.09,
      -0.015,
      0.235,
      0.27,
      0.22,
    );
    mesh(
      this.head,
      sphereGeometry,
      0x213943,
      0,
      0.24,
      0.035,
      0.25,
      0.16,
      0.235,
    );
    bevel(this.head, 0.37, 0.09, 0.2, 0, 0.23, -0.16, 0x376872, 0.03);
    for (const s of [-1, 1]) {
      mesh(
        this.head,
        sphereGeometry,
        0xde9e77,
        s * 0.225,
        0.08,
        0,
        0.045,
        0.065,
        0.045,
      );
      box(this.head, 0.035, 0.035, 0.02, s * 0.085, 0.105, -0.22, 0x193c44);
    }
    bevel(this.head, 0.1, 0.055, 0.07, 0, 0.045, -0.215, 0xeab78f, 0.02);
    // Articulated chains: shoulder -> forearm, hip -> shin -> shoe.
    for (const s of [-1, 1]) {
      const shoulder = new T.Group();
      shoulder.position.set(s * 0.35, 0.49, 0);
      this.torso.add(shoulder);
      this.shoulders.push(shoulder);
      mesh(shoulder, limbGeometry, 0xe3dcc4, 0, -0.14, 0, 0.115, 0.3, 0.12);
      const elbow = new T.Group();
      elbow.position.y = -0.29;
      shoulder.add(elbow);
      this.elbows.push(elbow);
      mesh(elbow, limbGeometry, 0xe3dcc4, 0, -0.1, 0, 0.084, 0.21, 0.087);
      mesh(elbow, sphereGeometry, 0xdca57e, 0, -0.24, 0, 0.085, 0.1, 0.085);
      const hip = new T.Group();
      hip.position.set(s * 0.16, 0.82, 0);
      this.root.add(hip);
      this.hips.push(hip);
      mesh(hip, limbGeometry, 0x204452, 0, -0.18, 0, 0.12, 0.36, 0.13);
      const knee = new T.Group();
      knee.position.y = -0.35;
      hip.add(knee);
      this.knees.push(knee);
      mesh(knee, limbGeometry, 0x2f5965, 0, -0.15, 0, 0.095, 0.31, 0.1);
      bevel(knee, 0.22, 0.13, 0.38, 0, -0.37, -0.08, 0xdde9c7, 0.04);
      box(knee, 0.23, 0.045, 0.37, 0, -0.425, -0.075, 0x8ac7af);
    }
    // Bake each rigid part independently so joints stay animated with few draw calls.
    for (const part of [this.head, ...this.elbows, ...this.knees])
      this.batchPart(part);
    // Remaining simple rigid meshes are small; no skeleton or skinning is required.
  }
  private batchPart(part: T.Group) {
    const position = part.position.clone();
    part.position.set(0, 0, 0);
    part.updateMatrix();
    const parent = part.parent;
    part.removeFromParent();
    batchStatic(part);
    parent?.add(part);
    part.position.copy(position);
  }
  pose(state: PlayerState, time: number, lean: number) {
    this.root.scale.set(1, 1, 1);
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, lean);
    const running = state === PlayerState.RUNNING;
    const sliding = state === PlayerState.SLIDING;
    const falling = state === PlayerState.FALLING;
    const jumping = state === PlayerState.JUMPING;
    this.torso.position.set(0, sliding ? 0.15 : 0.86, sliding ? 0.1 : 0);
    this.torso.rotation.set(
      sliding ? 1.38 : running ? -0.075 : falling ? 0.08 : -0.13,
      0,
      0,
    );
    if (running) {
      this.root.position.y = Math.abs(Math.sin(time * 15)) * 0.035;
      this.torso.rotation.y = Math.sin(time * 15) * 0.065;
    }
    for (let i = 0; i < 2; i++) {
      const cycle = Math.sin(time * 15 + i * Math.PI);
      this.hips[i].position.y = sliding ? 0.34 : 0.82;
      this.hips[i].rotation.x = sliding
        ? 1.3
        : running
          ? cycle * 0.68
          : jumping
            ? 0.8
            : falling
              ? 0.27
              : 0;
      this.knees[i].rotation.x = sliding
        ? -0.18
        : running
          ? -Math.max(0, -cycle) * 0.95
          : jumping
            ? -1.05
            : falling
              ? -0.35
              : 0;
      this.shoulders[i].rotation.x = sliding
        ? 0.15
        : running
          ? -cycle * 0.6
          : jumping
            ? -1.5
            : falling
              ? -0.7
              : 0;
      this.shoulders[i].rotation.z = sliding
        ? i === 0
          ? 0.25
          : -0.25
        : falling
          ? i === 0
            ? 0.35
            : -0.35
          : 0;
      this.elbows[i].rotation.x = sliding
        ? 0.45
        : running
          ? 0.35
          : jumping
            ? 0.85
            : 0.2;
    }
    this.head.rotation.x = sliding ? -1.12 : 0.02;
  }
}
