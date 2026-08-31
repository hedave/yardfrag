import * as THREE from "three";
import type { WeaponId } from "./types";

const potGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.42, 8);
const bodyGeo = new THREE.BoxGeometry(0.62, 0.78, 0.4);
const limbGeo = new THREE.BoxGeometry(0.14, 0.56, 0.14);
const bootGeo = new THREE.BoxGeometry(0.18, 0.42, 0.18);
const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);

export function createYardling(bodyColor: number, potColor: number): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.78,
  });
  const potMat = new THREE.MeshStandardMaterial({
    color: potColor,
    roughness: 0.6,
  });
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4433, roughness: 0.8 });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffe08a,
    emissive: 0xffc24a,
    emissiveIntensity: 1.4,
  });

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

  const bib = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.42), wood);
  bib.position.set(0, 1.12, 0.02);
  g.add(bib);

  const armL = new THREE.Mesh(limbGeo, wood);
  armL.name = "armL";
  armL.position.set(-0.42, 1.02, 0);
  g.add(armL);
  const armR = armL.clone();
  armR.name = "armR";
  armR.position.x = 0.42;
  g.add(armR);

  const legL = new THREE.Mesh(bootGeo, wood);
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

  return g;
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
  const cedar = new THREE.MeshStandardMaterial({ color: 0x6b4433, roughness: 0.7 });
  const tin = new THREE.MeshStandardMaterial({
    color: 0x8a9690,
    metalness: 0.55,
    roughness: 0.4,
  });
  const clay = new THREE.MeshStandardMaterial({ color: 0xc45c32, roughness: 0.5 });

  if (id === "clipper") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.7), cedar);
    body.position.set(0.22, -0.18, -0.55);
    g.add(body);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.55), tin);
    blade.position.set(0.22, -0.1, -0.95);
    g.add(blade);
    for (let i = 0; i < 6; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.04), tin);
      tooth.position.set(0.22, -0.07, -0.72 - i * 0.08);
      g.add(tooth);
    }
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), clay);
    grip.position.set(0.22, -0.32, -0.38);
    g.add(grip);
  } else if (id === "hose") {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.34, 8), clay);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0.26, -0.2, -0.48);
    g.add(tank);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.28, 8), tin);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0.26, -0.18, -0.78);
    g.add(nozzle);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), cedar);
    grip.position.set(0.26, -0.34, -0.42);
    g.add(grip);
  } else {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.15, 8), tin);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.2, -0.16, -0.85);
    g.add(barrel);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.36), cedar);
    stock.position.set(0.2, -0.22, -0.32);
    g.add(stock);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 8), clay);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0.2, -0.06, -0.55);
    g.add(scope);
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = false;
  });
  return g;
}
