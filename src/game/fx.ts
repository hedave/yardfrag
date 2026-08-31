import * as THREE from "three";

export class Fx {
  private sparks: THREE.Mesh[] = [];
  private sparkAge: number[] = [];
  private muzzle: THREE.PointLight;
  private muzzleAge = 0;
  private tracers: THREE.Line[] = [];
  private tracerAge: number[] = [];
  private readonly sparkMat = new THREE.MeshBasicMaterial({ color: 0xffc07a });
  private readonly tracerMat = new THREE.LineBasicMaterial({
    color: 0xffe0a8,
    transparent: true,
    opacity: 0.8,
  });

  constructor(private scene: THREE.Scene) {
    this.muzzle = new THREE.PointLight(0xffc07a, 0, 8, 2);
    scene.add(this.muzzle);
  }

  flash(x: number, y: number, z: number): void {
    this.muzzle.position.set(x, y, z);
    this.muzzle.intensity = 7;
    this.muzzleAge = 0.05;
  }

  spark(x: number, y: number, z: number, nx: number, ny: number, nz: number): void {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 5), this.sparkMat);
    mesh.position.set(x + nx * 0.08, y + ny * 0.08, z + nz * 0.08);
    this.scene.add(mesh);
    this.sparks.push(mesh);
    this.sparkAge.push(0.18);
  }

  tracer(
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
  ): void {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(ax, ay, az),
      new THREE.Vector3(bx, by, bz),
    ]);
    const line = new THREE.Line(geo, this.tracerMat);
    this.scene.add(line);
    this.tracers.push(line);
    this.tracerAge.push(0.06);
  }

  update(dt: number): void {
    if (this.muzzleAge > 0) {
      this.muzzleAge -= dt;
      this.muzzle.intensity = Math.max(0, (this.muzzleAge / 0.05) * 7);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparkAge[i] -= dt;
      this.sparks[i].scale.multiplyScalar(0.92);
      if (this.sparkAge[i] <= 0) {
        this.scene.remove(this.sparks[i]);
        this.sparks.splice(i, 1);
        this.sparkAge.splice(i, 1);
      }
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracerAge[i] -= dt;
      if (this.tracerAge[i] <= 0) {
        this.scene.remove(this.tracers[i]);
        this.tracers[i].geometry.dispose();
        this.tracers.splice(i, 1);
        this.tracerAge.splice(i, 1);
      }
    }
  }
}
