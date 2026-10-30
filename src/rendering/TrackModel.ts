import * as T from "three";
import { batchStatic } from "../world/batch";
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

// Pre-bake static track meshes and instanced tie/support buffers once across all 8 chunks.
let cachedMeshes:
  { geometry: T.BufferGeometry; material: T.Material }[] | null = null;
let cachedTieMatrices: T.InstancedBufferAttribute | null = null;
let cachedTieSphere: T.Sphere | null = null;
let cachedSupportMatrices: T.InstancedBufferAttribute | null = null;
let cachedSupportSphere: T.Sphere | null = null;

function ensureTrackTemplate() {
  if (cachedMeshes) return;
  const template = new T.Group();
  box(template, 8.4, 0.2, 30, 0, -0.42, 0, 0x13252e);

  const ties = new T.InstancedMesh(sleeperGeometry, material(0x48585d), 120);
  const supports = new T.InstancedMesh(
    supportGeometry,
    material(0x506971),
    240,
  );
  let ti = 0,
    si = 0;

  for (const lane of [-2.7, 0, 2.7]) {
    const bed = new T.Mesh(bevelGeometry(2.46, 0.27, 30, 0.1), ballastMaterial);
    bed.position.set(lane, -0.29, 0);
    template.add(bed);
    for (const offset of [-0.79, 0.79]) {
      const x = lane + offset;
      box(template, 0.17, 0.035, 30, x, -0.07, 0, 0x506971);
      box(template, 0.05, 0.085, 30, x, -0.0225, 0, 0x506971);
      box(template, 0.108, 0.04, 30, x, 0.02, 0, 0x9abfc1);
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
  for (const x of [-4.65, 4.65]) {
    box(template, 0.7, 0.52, 30, x, -0.03, 0, 0x3a5759);
    box(
      template,
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
      box(
        template,
        0.14,
        0.025,
        1.4,
        x - Math.sign(x) * 0.15,
        0.248,
        z,
        0xc5b38d,
      );
  }

  batchStatic(template);
  cachedMeshes = template.children
    .filter((c): c is T.Mesh => c instanceof T.Mesh)
    .map((m) => ({
      geometry: m.geometry,
      material: m.material as T.Material,
    }));

  ties.computeBoundingSphere();
  supports.computeBoundingSphere();
  cachedTieMatrices = ties.instanceMatrix;
  cachedTieSphere = ties.boundingSphere!.clone();
  cachedSupportMatrices = supports.instanceMatrix;
  cachedSupportSphere = supports.boundingSphere!.clone();
}

export function addTrackModel(group: T.Group) {
  ensureTrackTemplate();
  for (const { geometry, material: mat } of cachedMeshes!) {
    group.add(new T.Mesh(geometry, mat));
  }
  const ties = new T.InstancedMesh(sleeperGeometry, material(0x48585d), 120);
  ties.instanceMatrix = cachedTieMatrices!;
  ties.boundingSphere = cachedTieSphere!.clone();
  ties.userData.detail = "ties";

  const supports = new T.InstancedMesh(
    supportGeometry,
    material(0x506971),
    240,
  );
  supports.instanceMatrix = cachedSupportMatrices!;
  supports.boundingSphere = cachedSupportSphere!.clone();
  supports.userData.detail = "high";

  group.add(ties, supports);
}
