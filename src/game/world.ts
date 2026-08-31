import * as THREE from "three";
import { AABB } from "./collision";
import { CISTERN, POTTING, mapExposure, mapFog, mapSky } from "./palette";
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
  exposure: number;
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

function mats(id: MapId): MatBag {
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
  if (id === "potting") {
    return {
      soil: std(POTTING.floor, { roughness: 1 }),
      cedar: std(POTTING.plaster, { roughness: 0.88 }),
      tin: std(POTTING.teak, { roughness: 0.7 }),
      clay: std(POTTING.clay, { roughness: 0.55 }),
      moss: std(POTTING.wainscot, { roughness: 0.92 }),
      concrete: std(POTTING.limestone, { roughness: 0.9 }),
      cloth: std(POTTING.cloth, { roughness: 0.85 }),
      glass: std(POTTING.glass, {
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.32,
        emissive: POTTING.glass,
        emissiveIntensity: 0.18,
      }),
      brass: std(POTTING.straw, { roughness: 0.45, metalness: 0.35, emissive: 0x3a2a10, emissiveIntensity: 0.2 }),
      night: std(POTTING.teak, { roughness: 1 }),
      straw: std(POTTING.straw, { roughness: 0.88 }),
    };
  }
  return {
    soil: std(CISTERN.floor, { roughness: 0.95 }),
    cedar: std(CISTERN.wall, { roughness: 0.78 }),
    tin: std(CISTERN.tin, { roughness: 0.32, metalness: 0.62 }),
    clay: std(CISTERN.rust, { roughness: 0.6 }),
    moss: std(CISTERN.puddle, { roughness: 0.35, metalness: 0.15 }),
    concrete: std(CISTERN.concrete, { roughness: 0.88 }),
    cloth: std(CISTERN.cloth, { roughness: 0.8 }),
    glass: std(CISTERN.glass, {
      roughness: 0.12,
      metalness: 0.28,
      transparent: true,
      opacity: 0.22,
    }),
    brass: std(CISTERN.brass, { roughness: 0.35, metalness: 0.7, emissive: 0x3a2a08, emissiveIntensity: 0.25 }),
    night: std(CISTERN.wall, { roughness: 1 }),
    straw: std(CISTERN.straw, { roughness: 0.7 }),
  };
}

export class Yard {
  readonly group = new THREE.Group();
  readonly colliders: AABB[] = [];
  readonly spawns: SpawnPoint[] = [];
  readonly waypoints: THREE.Vector3[] = [];
  readonly minimap: MiniRect[] = [];
  readonly lights: THREE.Light[] = [];
  readonly m: MatBag;
  fogColor: number;
  fogNear = 16;
  fogFar = 64;
  sky: number;
  killY = -6;
  bounds = { minX: -30, maxX: 30, minZ: -24, maxZ: 24 };

  constructor(
    readonly id: MapId,
    readonly title: string,
  ) {
    this.group.name = title;
    this.m = mats(id);
    this.fogColor = mapFog(id);
    this.sky = mapSky(id);
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
    const leaf = new THREE.MeshStandardMaterial({
      color: this.id === "potting" ? POTTING.leaf : CISTERN.puddle,
      roughness: 0.85,
    });
    const plant = new THREE.Mesh(
      new THREE.ConeGeometry(0.34 * scale, 0.7 * scale, 7),
      leaf,
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
      exposure: mapExposure(this.id),
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
    yard.box(cx, cy, cz, sx, rise, sz, mat, { minimap: i === 0 ? "#C9A227" : undefined });
  }
}
