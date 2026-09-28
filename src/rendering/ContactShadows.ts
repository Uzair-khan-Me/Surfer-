import * as T from "three";
import type { Player } from "../game/Player";
import type { EncounterManager } from "../game/Encounters";
const size = 32,
  data = new Uint8Array(size * size * 4);
for (let y = 0; y < size; y++)
  for (let x = 0; x < size; x++) {
    const r = Math.hypot(
      (x + 0.5 - size / 2) / (size / 2),
      (y + 0.5 - size / 2) / (size / 2),
    );
    const i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.round(Math.pow(Math.max(0, 1 - r * r), 2) * 255);
  }
const texture = new T.DataTexture(data, size, size);
texture.needsUpdate = true;
const geometry = new T.PlaneGeometry(1, 1);
geometry.rotateX(-Math.PI / 2);
/** Soft contact shading: two draws, no shadow-map render pass on any quality tier. */
export class ContactShadows {
  private playerShadow = new T.Mesh(
    geometry,
    new T.MeshBasicMaterial({
      map: texture,
      color: 0x03121a,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    }),
  );
  private obstacles = new T.InstancedMesh(
    geometry,
    new T.MeshBasicMaterial({
      map: texture,
      color: 0x03121a,
      transparent: true,
      opacity: 0.43,
      depthWrite: false,
    }),
    16,
  );
  private dummy = new T.Object3D();
  constructor(
    scene: T.Scene,
    private player: Player,
    private encounters: EncounterManager,
  ) {
    scene.add(this.playerShadow, this.obstacles);
    this.obstacles.frustumCulled = false;
    this.playerShadow.renderOrder = 1;
    this.obstacles.renderOrder = 1;
    this.update();
  }
  setObstacleShadows(enabled: boolean) {
    this.obstacles.visible = enabled;
  }
  update() {
    const p = this.player;
    this.playerShadow.position.set(p.group.position.x, 0.052, 0);
    const size = 1.2 + p.y * 0.15;
    this.playerShadow.scale.set(size, 1, size * 0.72);
    this.playerShadow.material.opacity = 0.58 / (1 + p.y * 0.4);
    let i = 0;
    for (const row of this.encounters.rows)
      for (const o of row.obstacles) {
        const visible =
          o.active && row.group.position.z > -12 && row.group.position.z < 55;
        this.dummy.position.set(o.group.position.x, 0.05, row.group.position.z);
        this.dummy.scale.set(
          visible ? 2.8 : 0,
          1,
          visible ? (o.type === "train" ? 6.6 : 1.2) : 0,
        );
        this.dummy.updateMatrix();
        this.obstacles.setMatrixAt(i++, this.dummy.matrix);
      }
    this.obstacles.instanceMatrix.needsUpdate = true;
  }
}
