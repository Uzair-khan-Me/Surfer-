import * as T from "three";
export class Particles {
  private mesh = new T.InstancedMesh(
    new T.SphereGeometry(0.06, 4, 3),
    new T.MeshBasicMaterial({ color: 0xffd478 }),
    24,
  );
  private dummy = new T.Object3D();
  private life = 0;
  private x = 0;
  private y = 0;
  constructor(scene: T.Scene) {
    scene.add(this.mesh);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }
  burst(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.life = 0.4;
    this.mesh.visible = true;
  }
  reset() {
    this.life = 0;
    this.mesh.visible = false;
  }
  update(dt: number) {
    if (this.life <= 0) return;
    this.life -= dt;
    const age = 0.4 - this.life;
    for (let i = 0; i < 24; i++) {
      const a = i * 2.4;
      this.dummy.position.set(
        this.x + Math.cos(a) * age * 3,
        this.y + Math.sin(a) * age * 2 + age,
        Math.sin(i * 6) * age * 3,
      );
      this.dummy.scale.setScalar(Math.max(0, this.life * 2));
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.life <= 0) this.mesh.visible = false;
  }
}
