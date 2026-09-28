import * as T from "three";
const boxGeometry = new T.BoxGeometry(1, 1, 1);
const materials = new Map<number, T.MeshStandardMaterial>();
// Shared surfaces: direct key-light highlights without environment-map cost.
const metals = new Set([0x719596, 0x9abfc1, 0x506971, 0x88a6aa]);
const glass = new Set([0x12323b, 0x88c8b1, 0x295662]);
export function material(color: number, glow = false) {
  const key = color + (glow ? 0x1000000 : 0);
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness: glow
          ? 0.42
          : metals.has(color)
            ? 0.27
            : glass.has(color)
              ? 0.22
              : 0.78,
        metalness: metals.has(color) ? 0.65 : glass.has(color) ? 0.3 : 0.06,
        emissive: glow ? color : 0,
        emissiveIntensity: glow ? 0.65 : 0,
      }),
    );
  return materials.get(key)!;
}
export function box(
  parent: T.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number,
  glow = false,
) {
  const mesh = new T.Mesh(boxGeometry, material(color, glow));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
