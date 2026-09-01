import * as THREE from "three";
import { rayWorld, type AABB } from "./collision";
import type { MapId } from "./types";

/** Backyard tins — not commercial nades. */
export type GadgetId = "mulch" | "wasp";

export interface GadgetDef {
  id: GadgetId;
  name: string;
  verb: string;
  ammoPerLife: number;
  cookMax: number;
  minFuse: number;
  throwSpeed: number;
  lift: number;
  radius: number;
  damage: number;
  inner: number;
  selfScale: number;
  bounce: boolean;
  color: number;
}

export const GADGETS: Record<GadgetId, GadgetDef> = {
  mulch: {
    id: "mulch",
    name: "MULCH TIN",
    verb: "mulched",
    ammoPerLife: 2,
    cookMax: 2.35,
    minFuse: 0.32,
    throwSpeed: 17.4,
    lift: 2.2,
    radius: 4.35,
    damage: 82,
    inner: 0.28,
    selfScale: 0.85,
    bounce: true,
    color: 0xb85a22,
  },
  wasp: {
    id: "wasp",
    name: "WASP JAR",
    verb: "swarmed",
    ammoPerLife: 2,
    cookMax: 2.05,
    minFuse: 0.28,
    throwSpeed: 15.2,
    lift: 1.6,
    radius: 3.15,
    damage: 40,
    inner: 0.34,
    selfScale: 0.85,
    bounce: false,
    color: 0xd4a429,
  },
};

export const GADGET_ORDER: GadgetId[] = ["mulch", "wasp"];

export interface GadgetBelt {
  id: GadgetId;
  ammo: Record<GadgetId, number>;
  cooking: boolean;
  cook: number;
}

export interface Toss {
  id: number;
  ownerId: number;
  kind: GadgetId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fuse: number;
  stuck: boolean;
  mesh: THREE.Group;
}

export interface TossEvent {
  bounced: boolean;
  stuckNow: boolean;
  popped: boolean;
  voided: boolean;
  hitBody: boolean;
}

const TOSS_R = 0.13;
const GRAVITY = 22;
const RESTITUTION = 0.46;
const FRICTION = 0.7;

let nextToss = 1;

export function makeBelt(): GadgetBelt {
  return {
    id: "mulch",
    ammo: { mulch: GADGETS.mulch.ammoPerLife, wasp: GADGETS.wasp.ammoPerLife },
    cooking: false,
    cook: 0,
  };
}

export function restockBelt(belt: GadgetBelt): void {
  belt.ammo.mulch = GADGETS.mulch.ammoPerLife;
  belt.ammo.wasp = GADGETS.wasp.ammoPerLife;
  belt.cooking = false;
  belt.cook = 0;
}

export function cancelCook(belt: GadgetBelt, refund: boolean): void {
  if (refund && belt.cooking) belt.ammo[belt.id] += 1;
  belt.cooking = false;
  belt.cook = 0;
}

export function selectGadget(belt: GadgetBelt, id: GadgetId): boolean {
  if (belt.id === id) return false;
  if (belt.cooking) cancelCook(belt, true);
  belt.id = id;
  return true;
}

export function cycleGadget(belt: GadgetBelt, dir: number): GadgetId {
  const i = GADGET_ORDER.indexOf(belt.id);
  const next = GADGET_ORDER[((i + dir) % GADGET_ORDER.length + GADGET_ORDER.length) % GADGET_ORDER.length]!;
  selectGadget(belt, next);
  return next;
}

export function beginCook(belt: GadgetBelt): boolean {
  if (belt.cooking || belt.ammo[belt.id] <= 0) return false;
  belt.ammo[belt.id] -= 1;
  belt.cooking = true;
  belt.cook = 0;
  return true;
}

export function fuseAfterCook(def: GadgetDef, cooked: number): number {
  return Math.max(def.minFuse, def.cookMax - cooked);
}

export function throwVelocity(
  lookX: number,
  lookY: number,
  lookZ: number,
  def: GadgetDef,
  inheritX: number,
  inheritY: number,
  inheritZ: number,
): { vx: number; vy: number; vz: number } {
  return {
    vx: lookX * def.throwSpeed + inheritX * 0.38,
    vy: lookY * def.throwSpeed + def.lift + inheritY * 0.22,
    vz: lookZ * def.throwSpeed + inheritZ * 0.38,
  };
}

export function spawnToss(
  ownerId: number,
  kind: GadgetId,
  x: number,
  y: number,
  z: number,
  vx: number,
  vy: number,
  vz: number,
  fuse: number,
): Toss {
  const mesh = createGadgetMesh(kind, 1);
  mesh.position.set(x, y, z);
  return {
    id: nextToss++,
    ownerId,
    kind,
    x,
    y,
    z,
    vx,
    vy,
    vz,
    fuse,
    stuck: false,
    mesh,
  };
}

export function stepToss(
  toss: Toss,
  dt: number,
  colliders: AABB[],
  killY: number,
  bodies: Array<{ id: number; x: number; y: number; z: number; h: number }>,
): TossEvent {
  const ev: TossEvent = {
    bounced: false,
    stuckNow: false,
    popped: false,
    voided: false,
    hitBody: false,
  };
  toss.fuse -= dt;
  if (toss.y < killY) {
    ev.voided = true;
    ev.popped = true;
    return ev;
  }
  if (toss.fuse <= 0) {
    ev.popped = true;
    return ev;
  }
  if (toss.stuck) {
    toss.mesh.position.set(toss.x, toss.y, toss.z);
    return ev;
  }

  if (hitsBody(toss, bodies)) {
    ev.hitBody = true;
    ev.popped = true;
    return ev;
  }

  toss.vy -= GRAVITY * dt;
  const speed = Math.hypot(toss.vx, toss.vy, toss.vz);
  const dist = speed * dt;
  if (dist > 1e-5) {
    const inv = 1 / speed;
    const hit = rayWorld(
      toss.x,
      toss.y,
      toss.z,
      toss.vx * inv,
      toss.vy * inv,
      toss.vz * inv,
      dist + TOSS_R,
      colliders,
    );
    if (hit && hit.t <= dist + TOSS_R) {
      toss.x = hit.x + hit.nx * TOSS_R;
      toss.y = hit.y + hit.ny * TOSS_R;
      toss.z = hit.z + hit.nz * TOSS_R;
      const def = GADGETS[toss.kind];
      if (!def.bounce) {
        toss.vx = toss.vy = toss.vz = 0;
        toss.stuck = true;
        ev.stuckNow = true;
      } else {
        const vdot = toss.vx * hit.nx + toss.vy * hit.ny + toss.vz * hit.nz;
        toss.vx = (toss.vx - 2 * vdot * hit.nx) * RESTITUTION;
        toss.vy = (toss.vy - 2 * vdot * hit.ny) * RESTITUTION;
        toss.vz = (toss.vz - 2 * vdot * hit.nz) * RESTITUTION;
        if (hit.ny > 0.65) {
          toss.vx *= FRICTION;
          toss.vz *= FRICTION;
          if (Math.abs(toss.vy) < 1.15) toss.vy = 0;
        }
        ev.bounced = true;
      }
    } else {
      toss.x += toss.vx * dt;
      toss.y += toss.vy * dt;
      toss.z += toss.vz * dt;
    }
  }

  if (hitsBody(toss, bodies)) {
    ev.hitBody = true;
    ev.popped = true;
  }

  toss.mesh.position.set(toss.x, toss.y, toss.z);
  if (!toss.stuck) {
    toss.mesh.rotation.x += dt * 9;
    toss.mesh.rotation.z += dt * 6;
  }
  return ev;
}

export function splashDamage(
  ox: number,
  oy: number,
  oz: number,
  def: GadgetDef,
  x: number,
  y: number,
  z: number,
  owner: boolean,
): number {
  const dist = Math.hypot(x - ox, y - oy, z - oz);
  if (dist > def.radius) return 0;
  const t = 1 - dist / def.radius;
  const fall = def.inner + (1 - def.inner) * t * t;
  const raw = def.damage * fall;
  return owner ? raw * def.selfScale : raw;
}

export function createGadgetMesh(id: GadgetId, scale: number): THREE.Group {
  const g = new THREE.Group();
  if (id === "mulch") {
    const rust = new THREE.MeshStandardMaterial({
      color: 0x8a3a18,
      roughness: 0.72,
      metalness: 0.28,
    });
    const lid = new THREE.MeshStandardMaterial({
      color: 0xc45c28,
      roughness: 0.5,
      metalness: 0.2,
    });
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.22, 8), rust);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 8), lid);
    cap.position.y = 0.12;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 6, 10), lid);
    stripe.rotation.x = Math.PI / 2;
    g.add(can, cap, stripe);
  } else {
    const clay = new THREE.MeshStandardMaterial({
      color: 0xe24a1c,
      roughness: 0.55,
    });
    const cork = new THREE.MeshStandardMaterial({
      color: 0xc9a227,
      roughness: 0.8,
    });
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.2, 8), clay);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.035, 8), clay);
    lip.position.y = 0.1;
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.06, 6), cork);
    plug.position.y = 0.14;
    g.add(jar, lip, plug);
  }
  g.scale.setScalar(scale);
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = false;
      o.receiveShadow = false;
    }
  });
  return g;
}

/**
 * Work lamp parented to the view. Same light on both yards — Cistern dusk
 * makes it read; Potting Hall's peach key keeps it a faint fill.
 */
export class WorkLamp {
  readonly light: THREE.SpotLight;
  readonly fill: THREE.PointLight;
  readonly beam: THREE.Mesh;
  on = false;
  private mapId: MapId = "potting";
  private shown = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.light = new THREE.SpotLight(0xffe2a8, 0, 34, 0.38, 0.5, 1.05);
    this.light.position.set(0.14, -0.05, -0.16);
    this.light.castShadow = false;
    const target = new THREE.Object3D();
    target.name = "lamp-target";
    target.position.set(0, -0.1, -18);
    camera.add(target);
    this.light.target = target;
    camera.add(this.light);

    this.fill = new THREE.PointLight(0xffd090, 0, 7.2, 2);
    this.fill.position.set(0.1, -0.02, -0.4);
    camera.add(this.fill);

    const geo = new THREE.ConeGeometry(1.05, 6.8, 14, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe2a8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.beam = new THREE.Mesh(geo, mat);
    this.beam.name = "lamp-beam";
    this.beam.rotation.x = -Math.PI / 2;
    this.beam.position.set(0.12, -0.06, -3.8);
    this.beam.visible = false;
    camera.add(this.beam);
  }

  setMap(id: MapId): void {
    this.mapId = id;
    this.apply();
  }

  toggle(): boolean {
    this.on = !this.on;
    this.apply();
    return this.on;
  }

  set(on: boolean): void {
    this.on = on;
    this.apply();
  }

  present(active: boolean): void {
    this.shown = active;
    this.apply();
  }

  private apply(): void {
    const live = this.on && this.shown;
    const dusk = this.mapId === "cistern";
    this.light.intensity = live ? (dusk ? 17.5 : 5.4) : 0;
    this.light.distance = dusk ? 40 : 22;
    this.fill.intensity = live ? (dusk ? 2.6 : 0.75) : 0;
    const mat = this.beam.material;
    if (mat instanceof THREE.MeshBasicMaterial) {
      mat.opacity = live ? (dusk ? 0.13 : 0.04) : 0;
    }
    this.beam.visible = live;
  }
}

function hitsBody(
  toss: Toss,
  bodies: Array<{ id: number; x: number; y: number; z: number; h: number }>,
): boolean {
  for (const b of bodies) {
    if (b.id === toss.ownerId) continue;
    const dx = toss.x - b.x;
    const dz = toss.z - b.z;
    if (Math.hypot(dx, dz) > 0.46) continue;
    if (toss.y >= b.y - 0.05 && toss.y <= b.y + b.h + 0.08) return true;
  }
  return false;
}
