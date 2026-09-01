import * as THREE from "three";

interface Spark {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
}

interface Tracer {
  line: THREE.Line;
  mat: THREE.LineBasicMaterial;
  age: number;
  life: number;
}

/**
 * Yard-colored hit read: terracotta dust, lime flesh, warm tracers.
 * No commercial muzzle / blood packs.
 */
export class Fx {
  private sparks: Spark[] = [];
  private tracers: Tracer[] = [];
  private muzzle: THREE.PointLight;
  private muzzleAge = 0;
  private readonly dustGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
  private readonly fleshGeo = new THREE.SphereGeometry(0.04, 5, 5);
  private readonly dustMat = new THREE.MeshBasicMaterial({ color: 0xc45c28 });
  private readonly warmMat = new THREE.MeshBasicMaterial({ color: 0xffc07a });
  private readonly fleshMat = new THREE.MeshBasicMaterial({ color: 0xf5ff3d });
  private readonly headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  private readonly mulchMat = new THREE.MeshBasicMaterial({ color: 0xb85a22 });
  private readonly waspMat = new THREE.MeshBasicMaterial({ color: 0xf0c44a });

  constructor(private scene: THREE.Scene) {
    this.muzzle = new THREE.PointLight(0xffc07a, 0, 9, 2);
    scene.add(this.muzzle);
  }

  flash(x: number, y: number, z: number): void {
    this.muzzle.position.set(x, y, z);
    this.muzzle.intensity = 6.4;
    this.muzzleAge = 0.048;
  }

  flesh(x: number, y: number, z: number, head: boolean): void {
    const n = head ? 5 : 3;
    for (let i = 0; i < n; i++) {
      this.spawn(
        x,
        y,
        z,
        (Math.random() - 0.5) * 3.2,
        0.8 + Math.random() * 2.4,
        (Math.random() - 0.5) * 3.2,
        head ? this.fleshGeo : this.dustGeo,
        head && i === 0 ? this.headMat : this.fleshMat,
        head ? 0.26 : 0.16,
        head ? 0.07 : 0.045,
      );
    }
  }

  spark(x: number, y: number, z: number, nx: number, ny: number, nz: number): void {
    for (let i = 0; i < 3; i++) {
      const kick = 1.6 + Math.random() * 2.2;
      this.spawn(
        x + nx * 0.06,
        y + ny * 0.06,
        z + nz * 0.06,
        nx * kick + (Math.random() - 0.5) * 1.8,
        ny * kick + 0.6 + Math.random() * 1.4,
        nz * kick + (Math.random() - 0.5) * 1.8,
        this.dustGeo,
        i === 0 ? this.warmMat : this.dustMat,
        0.18 + Math.random() * 0.06,
        0.05,
      );
    }
  }

  blast(x: number, y: number, z: number, kind: "mulch" | "wasp"): void {
    const n = kind === "mulch" ? 16 : 20;
    const mat = kind === "mulch" ? this.mulchMat : this.waspMat;
    const geo = kind === "mulch" ? this.dustGeo : this.fleshGeo;
    for (let i = 0; i < n; i++) {
      const kick = kind === "mulch" ? 5.2 + Math.random() * 3.4 : 2.4 + Math.random() * 2.8;
      this.spawn(
        x,
        y,
        z,
        (Math.random() - 0.5) * kick,
        1.2 + Math.random() * kick * 0.55,
        (Math.random() - 0.5) * kick,
        geo,
        i === 0 ? this.warmMat : mat,
        kind === "mulch" ? 0.32 : 0.42,
        kind === "mulch" ? 0.08 : 0.045,
      );
    }
    this.muzzle.position.set(x, y, z);
    this.muzzle.intensity = kind === "mulch" ? 12 : 7;
    this.muzzleAge = 0.11;
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
    const mat = new THREE.LineBasicMaterial({
      color: 0xffe0a8,
      transparent: true,
      opacity: 0.78,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, mat, age: 0.07, life: 0.07 });
  }

  update(dt: number): void {
    if (this.muzzleAge > 0) {
      this.muzzleAge -= dt;
      this.muzzle.intensity = Math.max(0, (this.muzzleAge / 0.048) * 6.4);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]!;
      s.age -= dt;
      s.vy -= 10 * dt;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      const k = Math.max(0.02, s.age / s.life);
      s.mesh.scale.setScalar(k);
      if (s.age <= 0) {
        this.scene.remove(s.mesh);
        this.sparks.splice(i, 1);
      }
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i]!;
      tr.age -= dt;
      tr.mat.opacity = Math.max(0, (tr.age / tr.life) * 0.78);
      if (tr.age <= 0) {
        this.scene.remove(tr.line);
        tr.line.geometry.dispose();
        tr.mat.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }

  private spawn(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    life: number,
    scale: number,
  ): void {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    this.scene.add(mesh);
    this.sparks.push({ mesh, vx, vy, vz, age: life, life });
  }
}
