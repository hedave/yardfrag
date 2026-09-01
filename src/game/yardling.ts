import * as THREE from "three";
import { HIT_FLASH, PLAYER, POT_INK, SIGNAL, SIGNAL_HEX } from "./palette";
import type { WeaponId } from "./types";

const potGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.42, 8);
const bodyGeo = new THREE.BoxGeometry(0.62, 0.78, 0.4);
const limbGeo = new THREE.BoxGeometry(0.14, 0.56, 0.14);
const bootGeo = new THREE.BoxGeometry(0.18, 0.42, 0.18);
const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
const sashGeo = new THREE.BoxGeometry(0.68, 0.16, 0.46);
const hullGeo = new THREE.BoxGeometry(0.78, 1.82, 0.58);
const chevGeo = new THREE.ConeGeometry(0.12, 0.2, 4);

export function createYardling(name: string, bodyColor: number): THREE.Group {
  const g = new THREE.Group();
  const outlineMat = new THREE.MeshBasicMaterial({
    color: SIGNAL,
    side: THREE.BackSide,
  });
  const sashMat = new THREE.MeshBasicMaterial({ color: SIGNAL });
  const chevMat = new THREE.MeshBasicMaterial({ color: SIGNAL });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.55,
    emissive: bodyColor,
    emissiveIntensity: 0.18,
  });
  const potMat = new THREE.MeshStandardMaterial({
    color: POT_INK,
    roughness: 0.45,
    metalness: 0.08,
  });
  const limbMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a32,
    roughness: 0.7,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: SIGNAL,
    emissive: SIGNAL,
    emissiveIntensity: 2.2,
  });

  const hull = new THREE.Mesh(hullGeo, outlineMat);
  hull.name = "outline";
  hull.position.y = 0.92;
  hull.scale.setScalar(1.08);
  hull.castShadow = false;
  g.add(hull);

  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 1.52;
  pot.castShadow = true;
  g.add(pot);

  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8), potMat);
  rim.position.y = 1.74;
  g.add(rim);

  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.98;
  body.castShadow = true;
  g.add(body);

  const sash = new THREE.Mesh(sashGeo, sashMat);
  sash.name = "sash";
  sash.position.y = 1.18;
  g.add(sash);

  const armL = new THREE.Mesh(limbGeo, limbMat);
  armL.name = "armL";
  armL.position.set(-0.42, 1.02, 0);
  g.add(armL);
  const armR = armL.clone();
  armR.name = "armR";
  armR.position.x = 0.42;
  g.add(armR);

  const legL = new THREE.Mesh(bootGeo, limbMat);
  legL.name = "legL";
  legL.position.set(-0.16, 0.28, 0);
  g.add(legL);
  const legR = legL.clone();
  legR.name = "legR";
  legR.position.x = 0.16;
  g.add(legR);

  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.1, 1.5, 0.28);
  g.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.1;
  g.add(eyeR);

  const chev = new THREE.Mesh(chevGeo, chevMat);
  chev.name = "chevron";
  chev.position.y = 2.28;
  chev.rotation.x = Math.PI;
  g.add(chev);

  const plate = makeNameplate(name);
  plate.position.y = 2.05;
  g.add(plate);

  return g;
}

export function flashYardling(g: THREE.Group, hot: boolean): void {
  const color = hot ? HIT_FLASH : SIGNAL;
  const sash = g.getObjectByName("sash");
  const outline = g.getObjectByName("outline");
  const chev = g.getObjectByName("chevron");
  if (sash instanceof THREE.Mesh && sash.material instanceof THREE.MeshBasicMaterial) {
    sash.material.color.setHex(color);
  }
  if (outline instanceof THREE.Mesh && outline.material instanceof THREE.MeshBasicMaterial) {
    outline.material.color.setHex(color);
  }
  if (chev instanceof THREE.Mesh && chev.material instanceof THREE.MeshBasicMaterial) {
    chev.material.color.setHex(color);
  }
}

export function poseYardling(
  g: THREE.Group,
  time: number,
  moving: boolean,
  yaw: number,
): void {
  g.rotation.y = yaw;
  const swing = moving ? Math.sin(time * 8) * 0.45 : 0;
  const armL = g.getObjectByName("armL");
  const armR = g.getObjectByName("armR");
  const legL = g.getObjectByName("legL");
  const legR = g.getObjectByName("legR");
  if (armL) armL.rotation.x = swing;
  if (armR) armR.rotation.x = -swing;
  if (legL) legL.rotation.x = -swing * 0.8;
  if (legR) legR.rotation.x = swing * 0.8;
}

/**
 * First-person tools. Silhouettes are original Three primitives in cedar/tin/clay/iron.
 * ADS plants via FEEL adsPos/adsRot (the irons group is a named handle, not a camera).
 * Clipper sight line y=0.118, Scatterhose bead y=0.061, Stake optic y=0.086.
 */
export function createViewmodel(id: WeaponId): THREE.Group {
  const g = new THREE.Group();
  const cedar = new THREE.MeshStandardMaterial({ color: 0x3a2a28, roughness: 0.7 });
  const tin = new THREE.MeshStandardMaterial({
    color: 0xc8d4dc,
    metalness: 0.55,
    roughness: 0.35,
  });
  const clay = new THREE.MeshStandardMaterial({
    color: PLAYER,
    roughness: 0.45,
    emissive: PLAYER,
    emissiveIntensity: 0.22,
  });
  const iron = new THREE.MeshStandardMaterial({
    color: 0xd8e2e8,
    metalness: 0.7,
    roughness: 0.28,
    emissive: 0x6a8088,
    emissiveIntensity: 0.18,
  });
  const bore = new THREE.MeshBasicMaterial({ color: 0x14151a, side: THREE.DoubleSide });
  const sleeve = new THREE.MeshStandardMaterial({ color: 0x2a2a32, roughness: 0.72 });
  const mats: ToolMats = { cedar, tin, clay, iron, bore, sleeve };

  const irons = new THREE.Group();
  irons.name = "irons";

  if (id === "clipper") buildClipper(g, irons, mats);
  else if (id === "hose") buildHose(g, irons, mats);
  else buildStake(g, irons, mats);

  g.add(irons);
  g.userData.irons = irons;
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = false;
  });
  return g;
}

interface ToolMats {
  cedar: THREE.Material;
  tin: THREE.Material;
  clay: THREE.Material;
  iron: THREE.Material;
  bore: THREE.Material;
  sleeve: THREE.Material;
}

function add(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

function tube(
  parent: THREE.Object3D,
  r0: number,
  r1: number,
  len: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  segs = 8,
  open = false,
): THREE.Mesh {
  let use = mat;
  if (open && mat instanceof THREE.MeshStandardMaterial) {
    use = mat.clone();
    use.side = THREE.DoubleSide;
  }
  return add(
    parent,
    new THREE.CylinderGeometry(r0, r1, len, segs, 1, open),
    use,
    x,
    y,
    z,
    Math.PI / 2,
  );
}

function muzzleAt(parent: THREE.Object3D, x: number, y: number, z: number): void {
  const tip = new THREE.Object3D();
  tip.name = "muzzle";
  tip.position.set(x, y, z);
  parent.add(tip);
}

function addArms(
  parent: THREE.Object3D,
  mats: ToolMats,
  grip: readonly [number, number, number],
  fore: readonly [number, number, number],
): void {
  const arms = new THREE.Group();
  arms.name = "fpArms";
  add(arms, new THREE.BoxGeometry(0.08, 0.08, 0.34), mats.sleeve, grip[0] + 0.1, grip[1] - 0.1, grip[2] + 0.14);
  add(arms, new THREE.BoxGeometry(0.07, 0.08, 0.08), mats.clay, grip[0] + 0.035, grip[1] - 0.015, grip[2]);
  add(arms, new THREE.BoxGeometry(0.07, 0.07, 0.28), mats.sleeve, fore[0] - 0.1, fore[1] - 0.07, fore[2] + 0.05);
  add(arms, new THREE.BoxGeometry(0.065, 0.07, 0.075), mats.clay, fore[0] + 0.015, fore[1] - 0.015, fore[2]);
  parent.add(arms);
}

/** Carbine: receiver, barrel that is the muzzle, handguard, mag, stock. Front post at the muzzle. */
function buildClipper(g: THREE.Group, irons: THREE.Group, m: ToolMats): void {
  add(g, new THREE.BoxGeometry(0.062, 0.12, 0.3), m.cedar, 0, 0.0, 0.28);
  add(g, new THREE.BoxGeometry(0.058, 0.16, 0.08), m.cedar, 0, -0.03, 0.4);
  add(g, new THREE.BoxGeometry(0.05, 0.17, 0.07), m.cedar, 0, -0.15, 0.07, 0.4);
  add(g, new THREE.BoxGeometry(0.04, 0.03, 0.09), m.tin, 0, -0.08, 0.04);
  add(g, new THREE.BoxGeometry(0.08, 0.09, 0.28), m.tin, 0, 0.04, -0.02);
  add(g, new THREE.BoxGeometry(0.02, 0.032, 0.1), m.clay, 0.046, 0.055, -0.02);
  add(g, new THREE.BoxGeometry(0.055, 0.2, 0.1), m.clay, 0, -0.12, -0.05);
  add(g, new THREE.BoxGeometry(0.052, 0.05, 0.09), m.clay, 0, -0.23, -0.03);
  add(g, new THREE.BoxGeometry(0.074, 0.064, 0.24), m.cedar, 0, 0.038, -0.28);
  tube(g, 0.019, 0.018, 0.36, m.tin, 0, 0.05, -0.56);
  tube(g, 0.024, 0.02, 0.03, m.tin, 0, 0.05, -0.74);
  add(g, new THREE.BoxGeometry(0.028, 0.03, 0.03), m.iron, 0, 0.078, -0.74);
  muzzleAt(g, 0, 0.05, -0.756);

  add(irons, new THREE.BoxGeometry(0.012, 0.046, 0.012), m.iron, -0.026, 0.112, -0.14);
  add(irons, new THREE.BoxGeometry(0.012, 0.046, 0.012), m.iron, 0.026, 0.112, -0.14);
  add(irons, new THREE.BoxGeometry(0.064, 0.008, 0.012), m.iron, 0, 0.092, -0.14);
  add(irons, new THREE.BoxGeometry(0.01, 0.05, 0.01), m.iron, 0, 0.1, -0.74);
  add(irons, new THREE.SphereGeometry(0.01, 6, 6), m.clay, 0, 0.128, -0.74);
  addArms(g, m, [0, -0.15, 0.07], [0, 0.01, -0.28]);
}

/** Shotgun: receiver, pump, mag tube, barrel, stock. Muzzle is the tube end. Bead on a rib. */
function buildHose(g: THREE.Group, irons: THREE.Group, m: ToolMats): void {
  add(g, new THREE.BoxGeometry(0.074, 0.13, 0.34), m.cedar, 0, -0.03, 0.24);
  add(g, new THREE.BoxGeometry(0.07, 0.17, 0.09), m.cedar, 0, -0.07, 0.38);
  add(g, new THREE.BoxGeometry(0.055, 0.16, 0.075), m.cedar, 0, -0.17, 0.06, 0.42);
  add(g, new THREE.BoxGeometry(0.092, 0.08, 0.2), m.tin, 0, 0.0, -0.02);
  add(g, new THREE.BoxGeometry(0.042, 0.055, 0.1), m.tin, 0, -0.09, 0.02);
  tube(g, 0.02, 0.02, 0.52, m.tin, 0, -0.03, -0.38);
  tube(g, 0.026, 0.024, 0.58, m.tin, 0, 0.02, -0.42);
  add(g, new THREE.BoxGeometry(0.1, 0.1, 0.2), m.cedar, 0, -0.028, -0.28);
  add(g, new THREE.BoxGeometry(0.104, 0.04, 0.04), m.iron, 0, -0.028, -0.2);
  add(g, new THREE.BoxGeometry(0.104, 0.04, 0.04), m.iron, 0, -0.028, -0.36);
  tube(g, 0.03, 0.03, 0.028, m.iron, 0, 0.02, -0.58);
  tube(g, 0.028, 0.024, 0.032, m.tin, 0, 0.02, -0.71);
  muzzleAt(g, 0, 0.02, -0.728);

  add(irons, new THREE.BoxGeometry(0.014, 0.008, 0.54), m.iron, 0, 0.048, -0.42);
  add(irons, new THREE.SphereGeometry(0.013, 6, 6), m.clay, 0, 0.061, -0.71);
  addArms(g, m, [0, -0.17, 0.06], [0, -0.03, -0.28]);
}

/** Long gun: stock, receiver, mag, long barrel, muzzle brake, optic you sight through. */
function buildStake(g: THREE.Group, irons: THREE.Group, m: ToolMats): void {
  add(g, new THREE.BoxGeometry(0.064, 0.11, 0.36), m.cedar, 0, -0.03, 0.24);
  add(g, new THREE.BoxGeometry(0.06, 0.16, 0.09), m.cedar, 0, -0.06, 0.4);
  add(g, new THREE.BoxGeometry(0.06, 0.07, 0.18), m.cedar, 0, 0.04, 0.16);
  add(g, new THREE.BoxGeometry(0.05, 0.16, 0.07), m.cedar, 0, -0.16, 0.05, 0.34);
  add(g, new THREE.BoxGeometry(0.078, 0.09, 0.3), m.tin, 0, 0.015, -0.08);
  add(g, new THREE.BoxGeometry(0.05, 0.16, 0.09), m.clay, 0, -0.12, -0.04);
  add(g, new THREE.BoxGeometry(0.06, 0.05, 0.22), m.cedar, 0, 0.01, -0.32);
  tube(g, 0.017, 0.015, 0.78, m.tin, 0, 0.018, -0.7);
  tube(g, 0.026, 0.02, 0.06, m.tin, 0, 0.018, -1.08);
  add(g, new THREE.BoxGeometry(0.04, 0.012, 0.05), m.iron, 0, 0.03, -1.08);
  muzzleAt(g, 0, 0.018, -1.112);

  add(g, new THREE.BoxGeometry(0.014, 0.034, 0.045), m.iron, 0.046, 0.06, -0.38);
  add(g, new THREE.BoxGeometry(0.014, 0.034, 0.045), m.iron, -0.046, 0.06, -0.38);
  add(g, new THREE.BoxGeometry(0.014, 0.034, 0.045), m.iron, 0.046, 0.06, -0.54);
  add(g, new THREE.BoxGeometry(0.014, 0.034, 0.045), m.iron, -0.046, 0.06, -0.54);
  tube(irons, 0.05, 0.05, 0.3, m.tin, 0, 0.086, -0.48, 12, true);
  tube(irons, 0.042, 0.042, 0.29, m.bore, 0, 0.086, -0.48, 12, true);
  tube(irons, 0.056, 0.05, 0.035, m.tin, 0, 0.086, -0.33, 12, true);
  tube(irons, 0.06, 0.052, 0.045, m.tin, 0, 0.086, -0.63, 12, true);
  addArms(g, m, [0, -0.16, 0.05], [0, 0.0, -0.32]);
}

function makeNameplate(name: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "bold 30px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 8;
  ctx.strokeText(name, 128, 32);
  ctx.fillStyle = SIGNAL_HEX;
  ctx.fillText(name, 128, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    sizeAttenuation: true,
  });
  const s = new THREE.Sprite(mat);
  s.name = "nameplate";
  s.scale.set(1.55, 0.38, 1);
  return s;
}
