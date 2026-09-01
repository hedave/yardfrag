import * as THREE from "three";
import { HIT_FLASH, PLAYER, POT_INK, SIGNAL, SIGNAL_HEX } from "./palette";
import type { SkinSlot } from "./skins";
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

  const irons = new THREE.Group();
  irons.name = "irons";

  if (id === "clipper") {
    const body = slotMesh(new THREE.BoxGeometry(0.12, 0.14, 0.62), cedar, "stock");
    body.position.set(0, 0, -0.28);
    g.add(body);
    const blade = slotMesh(new THREE.BoxGeometry(0.055, 0.04, 0.5), tin, "metal");
    blade.position.set(0, 0.055, -0.72);
    g.add(blade);
    for (let i = 0; i < 6; i++) {
      const tooth = slotMesh(new THREE.BoxGeometry(0.1, 0.028, 0.035), tin, "metal");
      tooth.position.set(0, 0.08, -0.52 - i * 0.075);
      g.add(tooth);
    }
    const grip = slotMesh(new THREE.BoxGeometry(0.07, 0.2, 0.09), clay, "accent");
    grip.position.set(0, -0.16, 0.02);
    g.add(grip);
    const hood = slotMesh(new THREE.BoxGeometry(0.09, 0.028, 0.05), cedar, "stock");
    hood.position.set(0, 0.09, -0.08);
    const rearL = slotMesh(new THREE.BoxGeometry(0.016, 0.07, 0.016), iron, "iron");
    rearL.position.set(-0.03, 0.122, -0.1);
    const rearR = rearL.clone();
    rearR.position.x = 0.03;
    const bridge = slotMesh(new THREE.BoxGeometry(0.078, 0.012, 0.016), iron, "iron");
    bridge.position.set(0, 0.09, -0.1);
    const front = slotMesh(new THREE.BoxGeometry(0.012, 0.055, 0.012), iron, "iron");
    front.position.set(0, 0.102, -0.94);
    const bead = slotMesh(new THREE.SphereGeometry(0.012, 6, 6), clay, "accent");
    bead.position.set(0, 0.134, -0.94);
    g.add(makeDecal(0.16, 0.09, -0.061, 0.02, -0.22));
    irons.add(hood, rearL, rearR, bridge, front, bead);
  } else if (id === "hose") {
    const tank = slotMesh(new THREE.CylinderGeometry(0.11, 0.13, 0.32, 8), clay, "accent");
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, -0.02, -0.12);
    g.add(tank);
    const nozzle = slotMesh(new THREE.CylinderGeometry(0.045, 0.1, 0.3, 8), tin, "metal");
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0, -0.42);
    g.add(nozzle);
    const grip = slotMesh(new THREE.BoxGeometry(0.075, 0.2, 0.1), cedar, "stock");
    grip.position.set(0, -0.16, 0.04);
    g.add(grip);
    const ring = slotMesh(new THREE.TorusGeometry(0.046, 0.01, 8, 18), iron, "iron");
    ring.position.set(0, 0.078, -0.16);
    const bead = slotMesh(new THREE.SphereGeometry(0.014, 6, 6), clay, "accent");
    bead.position.set(0, 0.076, -0.56);
    g.add(makeDecal(0.14, 0.1, -0.128, -0.02, -0.12));
    irons.add(ring, bead);
  } else {
    const barrel = slotMesh(new THREE.CylinderGeometry(0.026, 0.032, 1.18, 8), tin, "metal");
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.48);
    g.add(barrel);
    const stock = slotMesh(new THREE.BoxGeometry(0.07, 0.11, 0.34), cedar, "stock");
    stock.position.set(0, -0.06, 0.12);
    g.add(stock);
    const collar = slotMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), clay, "accent");
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, -0.08);
    g.add(collar);
    const hoop = slotMesh(new THREE.TorusGeometry(0.05, 0.009, 8, 20), iron, "iron");
    hoop.position.set(0, 0.082, -0.04);
    const pin = slotMesh(new THREE.BoxGeometry(0.01, 0.05, 0.01), iron, "iron");
    pin.position.set(0, 0.078, -1.02);
    const tip = slotMesh(new THREE.SphereGeometry(0.012, 6, 6), clay, "accent");
    tip.position.set(0, 0.108, -1.02);
    g.add(makeDecal(0.12, 0.08, -0.036, -0.04, 0.1));
    irons.add(hoop, pin, tip);
  }

  g.add(irons);
  g.userData.irons = irons;
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = false;
  });
  return g;
}

function slotMesh(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  slot: SkinSlot,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.skinSlot = slot;
  return mesh;
}

function makeDecal(w: number, h: number, x: number, y: number, z: number): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    transparent: true,
    roughness: 0.62,
    metalness: 0.04,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.name = "skin-decal";
  mesh.userData.skinSlot = "decal";
  mesh.position.set(x, y, z);
  mesh.rotation.y = -Math.PI / 2;
  mesh.visible = false;
  return mesh;
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
