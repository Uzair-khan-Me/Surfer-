import * as T from "three";
import type { ObstacleType } from "../game/Obstacle";
import { box } from "../world/primitives";
import { bevel, mesh, roundGeometry } from "./geometry";
import { batchStatic } from "../world/batch";
const templates = new Map<ObstacleType, T.Group>();
/** Shared rigid model templates; clones reuse their baked geometries and materials. */
export function obstacleModel(type: ObstacleType) {
  if (!templates.has(type)) {
    const g = new T.Group();
    if (type === "train") train(g);
    else if (type === "barrier") barrier(g);
    else overhead(g);
    batchStatic(g);
    templates.set(type, g);
  }
  return templates.get(type)!.clone(true);
}
function train(g: T.Group) {
  bevel(g, 2.18, 2.3, 5.94, 0, 1.68, 0, 0x90aba4, 0.16);
  bevel(g, 2.2, 0.42, 5.86, 0, 0.67, 0, 0x254552, 0.08);
  bevel(g, 2.02, 0.2, 5.5, 0, 2.88, 0, 0x506971, 0.09);
  bevel(g, 1.3, 0.14, 2, 0, 3.01, -0.7, 0x38535e, 0.05);
  for (const x of [-0.44, 0, 0.44])
    box(g, 0.2, 0.025, 1.5, x, 3.087, -0.7, 0x18313c);
  // Cab face: recessed windshield, brow, divided glass, bumper and twin headlights.
  const windshield = bevel(
    g,
    1.86,
    0.84,
    0.11,
    0,
    2.17,
    3.025,
    0x12323b,
    0.065,
  );
  windshield.rotation.x = -0.04;
  box(g, 0.045, 0.77, 0.04, 0, 2.17, 3.09, 0x88a6aa);
  box(g, 1.7, 0.1, 0.05, 0, 2.59, 2.93, 0x84c4c1, true);
  bevel(g, 1.72, 0.16, 0.12, 0, 1.08, 2.97, 0xe1ad68, 0.04);
  for (const x of [-0.73, 0.73]) {
    bevel(g, 0.34, 0.21, 0.13, x, 1.34, 2.97, 0x18313c, 0.035);
    box(g, 0.24, 0.095, 0.04, x, 1.36, 3.044, 0xffe8b7, true);
  }
  bevel(g, 1.84, 0.18, 0.19, 0, 0.62, 2.93, 0x506971, 0.055);
  box(g, 0.38, 0.18, 0.15, 0, 0.41, 2.93, 0x162c35);
  for (const side of [-1, 1]) {
    box(g, 0.03, 0.13, 5.6, side * 1.095, 1.14, 0, 0xe1ad68);
    for (const z of [-2.1, 0, 2.1]) {
      box(g, 0.032, 0.74, 0.74, side * 1.098, 2.12, z, 0x12323b);
      box(g, 0.036, 0.56, 0.57, side * 1.119, 2.13, z, 0x7daaa7, true);
    }
    for (const z of [-1.07, 1.07]) {
      box(g, 0.028, 1.6, 0.92, side * 1.105, 1.58, z, 0x54747a);
      box(g, 0.038, 1.43, 0.8, side * 1.125, 1.61, z, 0x90aba4);
      box(g, 0.044, 0.62, 0.62, side * 1.15, 2.01, z, 0x12323b);
      box(g, 0.049, 1.37, 0.025, side * 1.154, 1.6, z, 0x38535e);
      box(g, 0.054, 0.16, 0.055, side * 1.155, 1.49, z + 0.13, 0xe1ad68);
    }
  }
  for (const z of [-1.85, 1.85]) {
    bevel(g, 1.65, 0.27, 0.8, 0, 0.34, z, 0x162c35, 0.06);
    for (const x of [-0.94, 0.94]) {
      const wheel = mesh(
        g,
        roundGeometry,
        0x18313c,
        x,
        0.28,
        z,
        0.28,
        0.15,
        0.28,
      );
      wheel.rotation.z = Math.PI / 2;
    }
  }
}
function barrier(g: T.Group) {
  // Matches the existing 0.96m collider height; chamfers improve edge readability.
  bevel(g, 2.2, 0.61, 0.48, 0, 0.625, 0, 0xfc7446, 0.065);
  for (const x of [-0.86, 0.86]) {
    bevel(g, 0.17, 0.84, 0.38, x, 0.43, 0, 0x506971, 0.035);
    bevel(g, 0.38, 0.1, 0.57, x, 0.05, 0, 0x263c45, 0.025);
  }
  for (const z of [-0.247, 0.247])
    for (let x = -0.83; x < 1; x += 0.42) {
      const stripe = box(g, 0.16, 0.48, 0.015, x, 0.63, z, 0xffdda1);
      stripe.rotation.z = -0.38;
    }
  box(g, 1.9, 0.045, 0.025, 0, 0.9, 0.247, 0xffd891, true);
}
function overhead(g: T.Group) {
  for (const x of [-1.12, 1.12]) {
    bevel(g, 0.17, 2.57, 0.48, x, 1.285, 0, 0x506971, 0.045);
    bevel(g, 0.29, 0.15, 0.55, x, 0.075, 0, 0x263c45, 0.035);
  }
  bevel(g, 2.34, 1.245, 0.57, 0, 1.9475, 0, 0x32677a, 0.07);
  bevel(g, 1.98, 0.78, 0.05, 0, 1.98, 0.294, 0x183d50, 0.025);
  box(g, 2.14, 0.07, 0.025, 0, 1.365, 0.29, 0x94eee5, true);
  for (const x of [-0.59, 0, 0.59]) {
    const a = box(g, 0.24, 0.065, 0.025, x - 0.075, 1.91, 0.33, 0xb3f5e5, true);
    a.rotation.z = -0.65;
    const b = box(g, 0.24, 0.065, 0.025, x + 0.075, 1.91, 0.33, 0xb3f5e5, true);
    b.rotation.z = 0.65;
  }
  for (const x of [-1.05, 1.05])
    box(g, 0.055, 0.35, 0.025, x, 2.09, 0.299, 0xe1ad68);
}
