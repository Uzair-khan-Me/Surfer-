import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
const palettes = new Map<string, T.MeshStandardMaterial>();
/** Bake rigid geometry by surface profile, not paint color. Joints/instances stay separate. */
export function batchStatic(group: T.Group) {
  group.updateMatrixWorld(true);
  const inverse = group.matrixWorld.clone().invert();
  const batches = new Map<T.Material, T.BufferGeometry[]>();
  const meshes: T.Mesh[] = [];
  group.traverse((obj) => {
    if (
      !(obj instanceof T.Mesh) ||
      obj instanceof T.InstancedMesh ||
      !(obj.material instanceof T.MeshStandardMaterial)
    )
      return;
    const source = obj.material;
    let target = source;
    let geometry = obj.geometry.clone();
    if (geometry.index) {
      const expanded = geometry.toNonIndexed();
      geometry.dispose();
      geometry = expanded;
    }
    geometry.applyMatrix4(
      new T.Matrix4().multiplyMatrices(inverse, obj.matrixWorld),
    );
    if (!source.map && !source.emissiveMap) {
      const key = `${source.roughness}/${source.metalness}/${source.emissive.getHex()}/${source.emissiveIntensity}`;
      if (!palettes.has(key))
        palettes.set(
          key,
          new T.MeshStandardMaterial({
            color: 0xffffff,
            vertexColors: true,
            roughness: source.roughness,
            metalness: source.metalness,
            emissive: source.emissive,
            emissiveIntensity: source.emissiveIntensity,
          }),
        );
      target = palettes.get(key)!;
      const old = geometry.getAttribute("color");
      const colors = new Float32Array(
        geometry.getAttribute("position").count * 3,
      );
      for (let i = 0; i < colors.length / 3; i++) {
        colors[i * 3] = source.color.r * (old ? old.getX(i) : 1);
        colors[i * 3 + 1] = source.color.g * (old ? old.getY(i) : 1);
        colors[i * 3 + 2] = source.color.b * (old ? old.getZ(i) : 1);
      }
      geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
    }
    const list = batches.get(target) || [];
    list.push(geometry);
    batches.set(target, list);
    meshes.push(obj);
  });
  // Every geometry is non-indexed, avoiding mixed Box/RoundedBox merge failures.
  for (const [material, geometries] of batches) {
    const geometry = mergeGeometries(geometries);
    if (!geometry) throw new Error("Rigid geometry batch failed");
    group.add(new T.Mesh(geometry, material));
    geometries.forEach((g) => g.dispose());
  }
  for (const mesh of meshes) mesh.removeFromParent();
}
