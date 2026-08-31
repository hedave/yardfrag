import * as THREE from "three";
import { AABB } from "./collision";
import type { MapId, MiniRect, SpawnPoint } from "./types";

export interface Arena {
  id: MapId;
  title: string;
  group: THREE.Group;
  colliders: AABB[];
  spawns: SpawnPoint[];
  waypoints: THREE.Vector3[];
  minimap: MiniRect[];
  lights: THREE.Light[];
  fogColor: number;
  fogNear: number;
  fogFar: number;
  sky: number;
  groundY: number;
  killY: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

interface MatBag {
  soil: THREE.MeshStandardMaterial;
  cedar: THREE.MeshStandardMaterial;
  tin: THREE.MeshStandardMaterial;
  clay: THREE.MeshStandardMaterial;
  moss: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  cloth: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  night: THREE.MeshStandardMaterial;
  straw: THREE.MeshStandardMaterial;
}

function mats(): MatBag {
  const std = (
    color: number,
    extra: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0] = {},
  ) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.82,
      metalness: 0.04,
      ...extra,
    });
  return {
    soil: std(0x3a2a1c, { roughness: 1 }),
    cedar: std(0x6b4433, { roughness: 0.74 }),
    tin: std(0x7d8c86, { roughness: 0.38, metalness: 0.55 }),
    clay: std(0xc45c32, { roughness: 0.62 }),
    moss: std(0x4f6a3a, { roughness: 0.95 }),
    concrete: std(0x6e675e, { roughness: 0.9 }),
    cloth: std(0xd4c4a0, { roughness: 0.88 }),
    glass: std(0x88aacc, {
      roughness: 0.12,
      metalness: 0.28,
      transparent: true,
      opacity: 0.22,
    }),
    brass: std(0xc4a15a, { roughness: 0.35, metalness: 0.7, emissive: 0x3a2a10, emissiveIntensity: 0.35 }),
    night: std(0x1a2230, { roughness: 1 }),
    straw: std(0xc4b07a, { roughness: 0.9 }),
  };
}

export class Yard {
  readonly group = new THREE.Group();
  readonly colliders: AABB[] = [];
  readonly spawns: SpawnPoint[] = [];
  readonly waypoints: THREE.Vector3[] = [];
  readonly minimap: MiniRect[] = [];
  readonly lights: THREE.Light[] = [];
  readonly m = mats();
  fogColor = 0x141820;
  fogNear = 16;
  fogFar = 64;
  sky = 0x151a24;
  killY = -6;
  bounds = { minX: -30, maxX: 30, minZ: -24, maxZ: 24 };

  constructor(
    readonly id: MapId,
    readonly title: string,
  ) {
    this.group.name = title;
  }

  box(
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
    mat: THREE.Material,
    opts: { collide?: boolean; minimap?: string; receive?: boolean; cast?: boolean } = {},
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    this.group.add(mesh);
    if (opts.collide !== false) {
      this.colliders.push(AABB.fromCenter(cx, cy, cz, sx, sy, sz));
    }
    if (opts.minimap) {
      this.minimap.push({ x: cx, z: cz, w: sx, d: sz, color: opts.minimap });
    }
    return mesh;
  }

  cyl(
    cx: number,
    cy: number,
    cz: number,
    radius: number,
    height: number,
    mat: THREE.Material,
    collide = true,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.08, height, 10),
      mat,
    );
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    if (collide) {
      const s = radius * 1.7;
      this.colliders.push(AABB.fromCenter(cx, cy, cz, s, height, s));
    }
    return mesh;
  }

  pot(x: number, z: number, y = 0, scale = 1): void {
    const h = 0.62 * scale;
    this.cyl(x, y + h * 0.5, z, 0.28 * scale, h, this.m.clay, true);
    const plant = new THREE.Mesh(
      new THREE.ConeGeometry(0.34 * scale, 0.7 * scale, 7),
      this.m.moss,
    );
    plant.position.set(x, y + h + 0.28 * scale, z);
    plant.castShadow = true;
    this.group.add(plant);
  }

  spawn(x: number, y: number, z: number, yaw: number): void {
    this.spawns.push({ x, y, z, yaw });
  }

  way(x: number, y: number, z: number): void {
    this.waypoints.push(new THREE.Vector3(x, y, z));
  }

  lamp(x: number, y: number, z: number, intensity = 4.2, color = 0xffc07a): void {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.4,
        roughness: 0.4,
      }),
    );
    bulb.position.set(x, y, z);
    this.group.add(bulb);
    const light = new THREE.PointLight(color, intensity, 16, 2);
    light.position.set(x, y, z);
    this.group.add(light);
    this.lights.push(light);
  }

  finish(): Arena {
    return {
      id: this.id,
      title: this.title,
      group: this.group,
      colliders: this.colliders,
      spawns: this.spawns,
      waypoints: this.waypoints,
      minimap: this.minimap,
      lights: this.lights,
      fogColor: this.fogColor,
      fogNear: this.fogNear,
      fogFar: this.fogFar,
      sky: this.sky,
      groundY: 0,
      killY: this.killY,
      bounds: this.bounds,
    };
  }
}

export function stairs(
  yard: Yard,
  x: number,
  y: number,
  z: number,
  dirX: number,
  dirZ: number,
  steps: number,
  rise: number,
  run: number,
  width: number,
  mat: THREE.Material,
): void {
  const len = Math.hypot(dirX, dirZ) || 1;
  const dx = dirX / len;
  const dz = dirZ / len;
  for (let i = 0; i < steps; i++) {
    const cx = x + dx * (run * (i + 0.5));
    const cz = z + dz * (run * (i + 0.5));
    const cy = y + rise * (i + 0.5);
    const sx = Math.abs(dx) > 0.5 ? run : width;
    const sz = Math.abs(dz) > 0.5 ? run : width;
    yard.box(cx, cy, cz, sx, rise, sz, mat, { minimap: i === 0 ? "#6b4433" : undefined });
  }
}
