import * as T from "three";
import { box, material } from "../world/primitives";
import { bevelGeometry } from "./geometry";
const sleeperGeometry = new T.BoxGeometry(2.08, 0.11, 0.19);
const supportGeometry = new T.BoxGeometry(0.24, 0.055, 0.25);
const matrix = new T.Matrix4();
// A single 64px tile gives the ballast texture without individual stone meshes.
const data = new Uint8Array(64 * 64 * 4);
let seed = 91;
for (let i = 0; i < 4096; i++) {
  seed = (seed * 16807) % 2147483647;
  const v = 84 + (seed % 52);
  data.set([v, v + 8, v + 10, 255], i * 4);
}
const ballastTexture = new T.DataTexture(data, 64, 64);
ballastTexture.wrapS = ballastTexture.wrapT = T.RepeatWrapping;
ballastTexture.repeat.set(3, 18);
ballastTexture.magFilter = T.NearestFilter;
ballastTexture.needsUpdate = true;
ballastTexture.colorSpace = T.SRGBColorSpace;
const ballastMaterial = new T.MeshStandardMaterial({
  color: 0x526168,
  roughness: 1,
  map: ballastTexture,
});
export function addTrackModel(group: T.Group) {
  box(group, 8.4, 0.2, 30, 0, -0.42, 0, 0x13252e);
  const ties = new T.InstancedMesh(sleeperGeometry, material(0x48585d), 120);
  ties.userData.detail = "ties";
  const supports = new T.InstancedMesh(
    supportGeometry,
    material(0x506971),
    240,
  );
  supports.userData.detail = "high";
  let ti = 0,
    si = 0;
  for (const lane of [-2.7, 0, 2.7]) {
    const bed = new T.Mesh(bevelGeometry(2.46, 0.27, 30, 0.1), ballastMaterial);
    bed.position.set(lane, -0.29, 0);
    group.add(bed);
    for (const offset of [-0.79, 0.79]) {
      const x = lane + offset;
      box(group, 0.17, 0.035, 30, x, -0.07, 0, 0x506971); // foot
      box(group, 0.05, 0.085, 30, x, -0.0225, 0, 0x506971); // web
      box(group, 0.108, 0.04, 30, x, 0.02, 0, 0x9abfc1); // polished crown
    }
    for (let z = -14.625; z < 15; z += 0.75) {
      matrix.makeTranslation(lane, -0.13, z);
      ties.setMatrixAt(ti++, matrix);
      for (const side of [-1, 1]) {
        matrix.makeTranslation(lane + side * 0.79, -0.0525, z);
        supports.setMatrixAt(si++, matrix);
      }
    }
  }
  ties.instanceMatrix.needsUpdate = true;
  supports.instanceMatrix.needsUpdate = true;
  ties.computeBoundingSphere();
  supports.computeBoundingSphere();
  group.add(ties, supports);
  for (const x of [-4.65, 4.65]) {
    box(group, 0.7, 0.52, 30, x, -0.03, 0, 0x3a5759);
    box(
      group,
      0.065,
      0.035,
      30,
      x - Math.sign(x) * 0.3,
      0.25,
      0,
      0x82c8ba,
      true,
    );
    for (let z = -13; z < 15; z += 3)
      box(group, 0.14, 0.025, 1.4, x - Math.sign(x) * 0.15, 0.248, z, 0xc5b38d);
  }
}
