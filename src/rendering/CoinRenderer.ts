import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { CoinManager } from "../game/Coin";
const profile = [
  new T.Vector2(0, -0.043),
  new T.Vector2(0.225, -0.043),
  new T.Vector2(0.26, -0.021),
  new T.Vector2(0.26, 0.021),
  new T.Vector2(0.225, 0.043),
  new T.Vector2(0, 0.043),
];
const body = new T.LatheGeometry(profile, 16).toNonIndexed();
body.rotateX(Math.PI / 2);
const colors = new Float32Array(body.getAttribute("position").count * 3);
const shade = new T.Color();
const positions = body.getAttribute("position");
for (let i = 0; i < positions.count; i++) {
  const radius = Math.hypot(positions.getX(i), positions.getY(i));
  shade.setHex(radius > 0.22 ? 0xffe0a0 : 0xe9a82f);
  colors.set([shade.r, shade.g, shade.b], i * 3);
}
body.setAttribute("color", new T.BufferAttribute(colors, 3));
const mark = new T.BoxGeometry(0.105, 0.22, 0.014).toNonIndexed();
mark.rotateZ(0.5);
mark.translate(0, 0, 0.047);
const c = new Float32Array(mark.getAttribute("position").count * 3);
shade.setHex(0xffe8ad);
for (let i = 0; i < c.length; i += 3) c.set([shade.r, shade.g, shade.b], i);
mark.setAttribute("color", new T.BufferAttribute(c, 3));
const back = mark.clone();
back.rotateY(Math.PI);
const geometry = mergeGeometries([body, mark, back])!;
body.dispose();
mark.dispose();
back.dispose();
const material = new T.MeshStandardMaterial({
  vertexColors: true,
  metalness: 0.45,
  roughness: 0.28,
  emissive: 0x8c5108,
  emissiveIntensity: 0.48,
});
/** Reads existing coin transforms/visibility; never changes collection or spawning. */
export class CoinRenderer {
  mesh = new T.InstancedMesh(geometry, material, 72);
  private dummy = new T.Object3D();
  constructor(
    scene: T.Scene,
    private coins: CoinManager,
  ) {
    // Preserve legacy meshes as logical handles; exclude just their rendering layer.
    for (const g of coins.groups)
      for (const c of g.coins) c.mesh.traverse((o) => o.layers.set(31));
    this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    this.mesh.boundingSphere = new T.Sphere(new T.Vector3(0, 1, -110), 170);
    scene.add(this.mesh);
    this.update();
  }
  update() {
    let i = 0;
    for (const g of this.coins.groups)
      for (const c of g.coins) {
        this.dummy.position.set(
          c.mesh.position.x,
          c.mesh.position.y,
          g.row.group.position.z + c.mesh.position.z,
        );
        this.dummy.rotation.y = c.mesh.rotation.y;
        this.dummy.scale.setScalar(c.mesh.visible && !c.collected ? 1 : 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i++, this.dummy.matrix);
      }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
