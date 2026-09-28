import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { material } from "../world/primitives";
const bevelCache = new Map<string, T.BufferGeometry>();
export const sphereGeometry = new T.IcosahedronGeometry(1, 1);
export const limbGeometry = new T.CylinderGeometry(0.85, 1, 1, 6, 1);
export const roundGeometry = new T.CylinderGeometry(1, 1, 1, 8, 1);
/** One bevel segment; dimensions are cached, never constructed during animation. */
export function bevelGeometry(w: number, h: number, d: number, r = 0.07) {
  const key = `${w}/${h}/${d}/${r}`;
  if (!bevelCache.has(key))
    bevelCache.set(key, new RoundedBoxGeometry(w, h, d, 1, r));
  return bevelCache.get(key)!;
}
export function mesh(
  parent: T.Object3D,
  geometry: T.BufferGeometry,
  color: number,
  x = 0,
  y = 0,
  z = 0,
  sx = 1,
  sy = 1,
  sz = 1,
  glow = false,
) {
  const m = new T.Mesh(geometry, material(color, glow));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  parent.add(m);
  return m;
}
export function bevel(
  parent: T.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number,
  r = 0.06,
) {
  return mesh(parent, bevelGeometry(w, h, d, r), color, x, y, z);
}
