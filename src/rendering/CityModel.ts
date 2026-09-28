import * as T from "three";
import { box } from "../world/primitives";
import { bevel } from "./geometry";
import { batchStatic } from "../world/batch";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
// Recess + illuminated pane + mullion: six triangles, one instanced draw for every window.
const planes = [
  new T.PlaneGeometry(0.83, 1.04),
  new T.PlaneGeometry(0.57, 0.84),
  new T.PlaneGeometry(0.035, 0.85),
];
planes.forEach((g, i) => {
  g.translate(0, 0, i * 0.006);
  const c = new Float32Array(g.getAttribute("position").count * 3);
  c.fill(i === 1 ? 1 : 0.13);
  g.setAttribute("color", new T.BufferAttribute(c, 3));
});
const windowGeometry = mergeGeometries(planes)!;
planes.forEach((g) => g.dispose());
const windowMaterial = new T.MeshBasicMaterial({
  color: 0xffffff,
  vertexColors: true,
});
const dummy = new T.Object3D();
const color = new T.Color();
/** Six modular buildings per recycled chunk. All randomness is local/deterministic. */
export function addCityModel(group: T.Group, index: number) {
  const details = new T.Group();
  details.userData.detail = "high";
  const windows: {
    x: number;
    y: number;
    z: number;
    angle: number;
    tint: number;
  }[] = [];
  for (const side of [-1, 1]) {
    box(group, 5.5, 0.55, 30, side * 7.2, -0.14, 0, 0x293d49);
    for (let j = 0; j < 3; j++) {
      const z = -10 + j * 10;
      const h = 7 + ((index * 7 + j * 3 + (side + 1) * 2) % 11);
      const x = side * (11.5 + (j % 2) * 1.5);
      const w = 4.7,
        d = 7;
      const wall = [0x2b4b59, 0x3f6068, 0x304653][(index + j) % 3];
      bevel(group, w, h, d, x, h / 2, z, wall, 0.13);
      // Dark plinth, parapet, ledges and a small setback roof create actual silhouettes.
      box(group, w + 0.15, 0.4, d + 0.1, x, 0.28, z, 0x1b3341);
      box(group, w + 0.22, 0.16, d + 0.22, x, h - 0.08, z, 0x6a8085);
      box(group, w - 0.28, 0.18, d - 0.25, x, h + 0.075, z, 0x1c3542);
      for (const offset of [-d / 2 + 0.08, d / 2 - 0.08])
        box(
          group,
          0.11,
          h - 0.6,
          0.14,
          x - side * (w / 2 + 0.02),
          h / 2 + 0.15,
          z + offset,
          0x527078,
        );
      for (let y = 1.65; y < h - 0.6; y += 1.85) {
        box(
          group,
          0.11,
          0.13,
          d + 0.06,
          x - side * (w / 2 + 0.03),
          y - 0.66,
          z,
          0x1d3542,
        );
        for (let k = 0; k < 4; k++) {
          const wz = z - 2.55 + k * 1.7;
          const lit = (k + Math.floor(y) + index + j) % 5 !== 0;

          windows.push({
            x: x - side * (w / 2 + 0.06),
            y,
            z: wz,
            angle: (-side * Math.PI) / 2,
            tint: !lit
              ? 0x284856
              : (index + j + k) % 3 === 0
                ? 0xe2ac70
                : 0x76b7b7,
          });
        }
        for (let k = 0; k < 3; k++) {
          const wx = x - 1.5 + k * 1.5;
          windows.push({
            x: wx,
            y,
            z: z + d / 2 + 0.055,
            angle: 0,
            tint:
              (index + k + Math.floor(y)) % 4 === 0
                ? 0x284856
                : (j + k) % 3 === 0
                  ? 0xe2ac70
                  : 0x76b7b7,
          });
        }
        if (j === 1 && y > 4) {
          box(details, 1.25, 0.14, 0.75, x, y - 0.6, z + d / 2 + 0.3, 0x6a8085);
          box(
            details,
            1.25,
            0.09,
            0.08,
            x,
            y - 0.05,
            z + d / 2 + 0.65,
            0x527078,
          );
          for (const bx of [-0.53, 0.53])
            box(
              details,
              0.06,
              0.55,
              0.06,
              x + bx,
              y - 0.32,
              z + d / 2 + 0.65,
              0x527078,
            );
        }
      }
      // Ground-level storefront bays, no interiors.
      for (const wz of [-1.7, 1.7]) {
        box(
          group,
          0.045,
          0.85,
          1.25,
          x - side * (w / 2 + 0.04),
          0.71,
          z + wz,
          0x163b49,
        );
        box(
          group,
          0.09,
          0.08,
          1.35,
          x - side * (w / 2 + 0.09),
          1.19,
          z + wz,
          0xe1ad68,
        );
      }
      bevel(
        details,
        1.1,
        0.65,
        1.65,
        x - 0.55,
        h + 0.41,
        z - 0.85,
        0x506971,
        0.07,
      );
      for (let vz = -0.55; vz < 0.6; vz += 0.25)
        box(
          details,
          0.8,
          0.025,
          0.08,
          x - 0.55,
          h + 0.745,
          z - 0.85 + vz,
          0x213844,
        );
      box(details, 0.12, 1.2, 0.12, x + 1, h + 0.6, z + 1, 0x527078);
      box(details, 0.65, 0.05, 0.05, x + 1, h + 1.05, z + 1, 0x527078);
    }
    // Low platforms and lamps retain their original safe, off-track position.
    bevel(group, 0.16, 5.7, 0.18, side * 5.35, 2.85, 0, 0x506971, 0.035);
    bevel(group, 1.55, 0.22, 0.4, side * 4.72, 5.68, 0, 0x294653, 0.055);
    box(group, 1.25, 0.035, 0.26, side * 4.72, 5.55, 0, 0xc0e3c4, true);
  }
  const lights = new T.InstancedMesh(
    windowGeometry,
    windowMaterial,
    windows.length,
  );
  lights.userData.detail = "windows";
  windows.forEach((w, i) => {
    dummy.position.set(w.x, w.y, w.z);
    dummy.rotation.set(0, w.angle, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    lights.setMatrixAt(i, dummy.matrix);
    color.setHex(w.tint);
    lights.setColorAt(i, color);
  });
  lights.instanceMatrix.needsUpdate = true;
  if (lights.instanceColor) lights.instanceColor.needsUpdate = true;
  lights.computeBoundingSphere();
  group.add(lights);
  batchStatic(details);
  return details;
}
