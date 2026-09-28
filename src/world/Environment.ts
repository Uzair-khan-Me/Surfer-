import * as T from "three";
import { bevel } from "../rendering/geometry";
export class Environment {
  constructor(scene: T.Scene) {
    const moon = new T.Mesh(
      new T.SphereGeometry(15, 24, 12),
      new T.MeshStandardMaterial({
        color: 0xe5c08d,
        emissive: 0xcaa572,
        emissiveIntensity: 0.45,
        roughness: 1,
        fog: false,
      }),
    );
    moon.position.set(-10, 41, -175);
    scene.add(moon);
    const data = new Uint8Array(32 * 32 * 4);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const r = Math.hypot((x - 15.5) / 16, (y - 15.5) / 16);
        const i = (y * 32 + x) * 4;
        data.set([255, 211, 152, Math.round(Math.max(0, 1 - r) ** 3 * 55)], i);
      }
    const glowMap = new T.DataTexture(data, 32, 32);
    glowMap.needsUpdate = true;
    const halo = new T.Sprite(
      new T.SpriteMaterial({
        map: glowMap,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        fog: false,
      }),
    );
    halo.position.set(-10, 41, -178);
    halo.scale.set(70, 70, 1);
    scene.add(halo);
    let seed = 57;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const stars = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      stars[i * 3] = (rand() - 0.5) * 400;
      stars[i * 3 + 1] = 25 + rand() * 90;
      stars[i * 3 + 2] = -190 - rand() * 35;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(stars, 3));
    scene.add(
      new T.Points(
        geo,
        new T.PointsMaterial({
          color: 0xa4c5d2,
          size: 0.23,
          transparent: true,
          opacity: 0.55,
          fog: false,
        }),
      ),
    );
    // Two cheap silhouette layers; physical camera follow supplies subtle parallax.
    const cube = new T.BoxGeometry(1, 1, 1),
      dummy = new T.Object3D();
    for (let layer = 0; layer < 2; layer++) {
      const towers = new T.InstancedMesh(
        cube,
        new T.MeshBasicMaterial({
          color: layer === 0 ? 0x183440 : 0x1c3744,
          fog: false,
        }),
        26,
      );
      const beacons = new Float32Array(26 * 3);
      for (let i = 0; i < 26; i++) {
        const x = (i - 13) * 9 + (layer ? 4 : 0),
          h = 12 + rand() * 27,
          z = -145 - layer * 55;
        dummy.position.set(x, h / 2, z);
        dummy.scale.set(5 + rand() * 3, h, 6);
        dummy.updateMatrix();
        towers.setMatrixAt(i, dummy.matrix);
        beacons.set([x, h + 0.5, z], i * 3);
      }
      towers.computeBoundingSphere();
      scene.add(towers);
      const lights = new T.BufferGeometry();
      lights.setAttribute("position", new T.BufferAttribute(beacons, 3));
      scene.add(
        new T.Points(
          lights,
          new T.PointsMaterial({ color: 0xc6bba0, size: 0.38, fog: false }),
        ),
      );
    }
  }
}
const signs = new Map<string, T.MeshBasicMaterial>();
const signGeometry = new T.PlaneGeometry(3.2, 1.2);
export function addSign(
  parent: T.Group,
  text: string,
  x: number,
  y: number,
  z: number,
  color = "#d5f884",
) {
  const key = text + color;
  let material = signs.get(key);
  if (!material) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#173e43";
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, 246, 86);
    ctx.fillStyle = color;
    ctx.font = "bold 33px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 52);
    ctx.font = "8px sans-serif";
    ctx.fillText("N I G H T   T R A N S I T", 128, 74);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    material = new T.MeshBasicMaterial({ map: texture });
    signs.set(key, material);
  }
  const face = new T.Mesh(signGeometry, material);
  face.position.set(x, y, z);
  parent.add(face);
  bevel(parent, 3.4, 1.4, 0.23, x, y, z - 0.14, 0x506971, 0.07);
}
