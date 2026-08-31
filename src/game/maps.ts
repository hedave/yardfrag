import * as THREE from "three";
import { stairs, Yard, type Arena } from "./world";
import type { MapId } from "./types";

export function buildMap(id: MapId): Arena {
  return id === "potting" ? buildPotting() : buildCistern();
}

function buildPotting(): Arena {
  const y = new Yard("potting", "Potting Hall");
  y.fogColor = 0x1c1814;
  y.fogNear = 12;
  y.fogFar = 48;
  y.sky = 0x1a1612;
  y.bounds = { minX: -27, maxX: 27, minZ: -19, maxZ: 19 };
  y.killY = -4;

  const W = 52;
  const D = 36;
  const H = 9.2;
  const wall = 0.7;

  y.box(0, -0.4, 0, W, 0.8, D, y.m.soil, { minimap: "#3a2a1c", cast: false });
  y.box(0, 0.04, 0, 14, 0.1, 10, y.m.moss, { collide: false, cast: false });

  y.box(0, H / 2, -D / 2, W, H, wall, y.m.cedar, { minimap: "#5a3828" });
  y.box(0, H / 2, D / 2, W, H, wall, y.m.cedar, { minimap: "#5a3828" });
  y.box(-W / 2, H / 2, 0, wall, H, D, y.m.cedar, { minimap: "#5a3828" });
  y.box(W / 2, H / 2, 0, wall, H, D, y.m.cedar, { minimap: "#5a3828" });

  y.box(0, H + 0.2, 0, W, 0.4, D, y.m.tin, { receive: true });
  y.box(-12, H + 0.18, 0, 8, 0.05, 18, y.m.glass, { collide: false, cast: false });
  y.box(12, H + 0.18, 0, 8, 0.05, 18, y.m.glass, { collide: false, cast: false });

  y.box(-8, 1.6, -6, wall, 3.2, 16, y.m.cedar, { minimap: "#6b4433" });
  y.box(-8, 4.6, -6, wall, 2.8, 16, y.m.cedar);
  y.box(10, 1.6, 8, 14, 3.2, wall, y.m.cedar, { minimap: "#6b4433" });
  y.box(10, 4.6, 8, 14, 2.8, wall, y.m.cedar);

  for (const x of [-16, -4, 8, 18]) {
    y.box(x, 4.6, -12, 0.55, 9.2, 0.55, y.m.concrete, { minimap: "#6e675e" });
  }
  for (const z of [-4, 8]) {
    y.box(16, 4.6, z, 0.55, 9.2, 0.55, y.m.concrete);
  }

  y.box(18, 4.35, -4, 12, 0.35, 20, y.m.cedar, { minimap: "#8a5a3a" });
  y.box(24.4, 2.1, -4, 0.4, 4.2, 20, y.m.cedar);
  stairs(y, 12.2, 0, 8.5, 1, 0, 10, 0.42, 0.62, 2.2, y.m.straw);
  y.box(18, 4.55, 6.4, 12, 1.1, 0.28, y.m.cedar);

  y.box(-1, 0.38, -1, 6.4, 0.76, 2.1, y.m.cedar, { minimap: "#4f6a3a" });
  y.box(-1, 0.38, 2.4, 6.4, 0.76, 2.1, y.m.cedar, { minimap: "#4f6a3a" });
  y.box(-18, 0.7, 8, 4.4, 1.4, 1.6, y.m.cedar, { minimap: "#6b4433" });
  y.box(-18, 0.55, 11.2, 3.2, 1.1, 2.4, y.m.straw);
  y.box(4, 0.85, -12, 3.6, 1.7, 1.3, y.m.concrete, { minimap: "#6e675e" });
  y.box(7.4, 1.1, -12, 1.6, 2.2, 1.6, y.m.concrete);
  y.box(-14, 0.9, -12, 2.4, 1.8, 2.4, y.m.straw, { minimap: "#c4b07a" });
  y.box(-11.2, 0.55, -12, 2.2, 1.1, 1.8, y.m.straw);
  y.box(2, 0.7, 12, 5.5, 1.4, 1.2, y.m.cedar);
  y.box(-22, 1.2, -8, 1.8, 2.4, 6, y.m.cedar, { minimap: "#6b4433" });

  y.box(8, 0.45, 0.5, 1.8, 0.9, 3.4, y.m.clay);
  y.box(-4, 0.8, 12, 1.2, 1.6, 1.2, y.m.tin);

  for (const [px, pz] of [
    [-20, 4],
    [-6, 10],
    [0, -8],
    [12, -6],
    [20, 12],
    [-12, 2],
    [6, 14],
    [-22, 14],
  ] as const) {
    y.pot(px, pz, 0, 0.9 + ((px + pz) % 5) * 0.08);
  }

  y.box(-20, 2.8, -16.6, 8, 0.08, 0.08, y.m.cloth, { collide: false, cast: false });
  y.box(-16, 1.6, -16.6, 0.12, 3.2, 0.12, y.m.cedar, { collide: false });

  y.lamp(-12, 7.4, -6, 5.5);
  y.lamp(6, 7.4, 4, 5.2);
  y.lamp(18, 7.6, -8, 4.4);
  y.lamp(-18, 7.2, 10, 4.8, 0xffd9a0);

  const hemi = new THREE.HemisphereLight(0xffd4a8, 0x3a2a1c, 0.7);
  y.group.add(hemi);
  y.lights.push(hemi);
  const sun = new THREE.DirectionalLight(0xffc899, 0.85);
  sun.position.set(8, 18, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 28;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  y.group.add(sun);
  y.lights.push(sun);

  y.spawn(-20, 0, -10, 0.4);
  y.spawn(20, 4.55, -10, Math.PI);
  y.spawn(20, 0, 14, -2.2);
  y.spawn(-20, 0, 14, 0.8);
  y.spawn(0, 0, -14, 0);
  y.spawn(6, 0, 14, Math.PI);
  y.spawn(-6, 0, 6, 1.2);

  const ways: [number, number, number][] = [
    [-20, 0, -10],
    [-20, 0, 8],
    [-12, 0, 0],
    [-4, 0, -10],
    [0, 0, 0],
    [6, 0, 10],
    [16, 0, 12],
    [16, 0, -8],
    [20, 4.55, -8],
    [20, 4.55, 4],
    [12, 0, -12],
    [-8, 0, 12],
    [2, 0, -14],
    [-16, 0, -4],
  ];
  for (const [wx, wy, wz] of ways) y.way(wx, wy, wz);

  return y.finish();
}

function buildCistern(): Arena {
  const y = new Yard("cistern", "Cistern Roofs");
  y.fogColor = 0x151a28;
  y.fogNear = 18;
  y.fogFar = 70;
  y.sky = 0x121826;
  y.bounds = { minX: -32, maxX: 32, minZ: -26, maxZ: 26 };
  y.killY = -5;

  y.box(0, -0.45, 0, 64, 0.9, 52, y.m.soil, { minimap: "#2c2418", cast: false });
  y.box(0, 0.02, 0, 18, 0.08, 12, y.m.moss, { collide: false, cast: false });

  shed(y, -16, -8, 14, 5.1, 10);
  shed(y, 2, 10, 12, 6.2, 12);
  shed(y, 16, -6, 13, 7.0, 11);
  shed(y, -6, -16, 10, 4.4, 8);
  shed(y, -18, 10, 9, 5.6, 9);

  y.box(-7, 5.58, 1.6, 9.2, 0.28, 1.5, y.m.cedar, { minimap: "#8a5a3a" });
  y.box(9.2, 6.98, 2.2, 8.6, 0.28, 1.4, y.m.cedar, { minimap: "#8a5a3a" });
  y.box(-11, 5.1, -14.2, 1.4, 0.28, 7.2, y.m.cedar);
  y.box(-16.4, 5.78, 3.4, 1.3, 0.28, 8.2, y.m.cedar);

  stairs(y, -16, 0, -22.4, 0, 1, 13, 0.42, 0.52, 2.3, y.m.straw);
  stairs(y, 22.8, 0, -6, -1, 0, 17, 0.42, 0.5, 2.2, y.m.straw);
  stairs(y, 2, 0, 22.6, 0, -1, 16, 0.42, 0.5, 2.2, y.m.straw);
  stairs(y, -6, 0, -24.2, 0, 1, 11, 0.42, 0.5, 2.1, y.m.straw);
  stairs(y, -18, 0, 20.4, 0, -1, 14, 0.42, 0.5, 2.1, y.m.straw);

  y.cyl(8, 4.4, 2, 1.6, 8.8, y.m.tin, true);
  y.box(8, 9.0, 2, 3.4, 0.35, 3.4, y.m.tin, { minimap: "#7d8c86" });
  y.cyl(8, 9.6, 2, 0.18, 1.2, y.m.tin, false);

  y.box(0, 3.4, -2, 2.2, 1.6, 1.4, y.m.tin);
  y.box(18, 8.1, -2, 1.8, 1.4, 1.6, y.m.tin);
  y.box(-14, 6.2, -6, 1.5, 1.3, 1.3, y.m.tin);
  y.box(4, 7.3, 12, 2.4, 1.2, 1.2, y.m.concrete);
  y.box(-18, 6.5, 12, 1.2, 1.8, 1.2, y.m.clay);

  y.box(-2, 1.1, 0, 2.6, 2.2, 2.6, y.m.cedar, { minimap: "#6b4433" });
  y.box(10, 0.7, -16, 3.4, 1.4, 1.8, y.m.straw);
  y.box(-24, 0.9, 0, 2, 1.8, 6, y.m.cedar);
  y.box(24, 1.2, 8, 2.2, 2.4, 4.4, y.m.concrete);

  for (const [px, pz, py, s] of [
    [-4, 4, 0, 1],
    [12, -14, 0, 1.1],
    [-22, -14, 0, 0.85],
    [22, 14, 0, 1],
    [-18, 10, 5.96, 0.8],
    [14, -8, 7.36, 0.75],
    [0, 10, 6.56, 0.7],
  ] as const) {
    y.pot(px, pz, py, s);
  }

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 12, 12),
    new THREE.MeshStandardMaterial({
      color: 0xdde6f4,
      emissive: 0x8899bb,
      emissiveIntensity: 1.2,
      roughness: 1,
    }),
  );
  moon.position.set(-18, 26, -20);
  y.group.add(moon);

  y.lamp(-16, 6.4, -8, 3.6, 0xffb36a);
  y.lamp(2, 7.6, 10, 3.8, 0xffc07a);
  y.lamp(16, 8.4, -6, 3.4, 0xffd0a0);

  const hemi = new THREE.HemisphereLight(0x8aa0c8, 0x3a2a1c, 0.55);
  y.group.add(hemi);
  y.lights.push(hemi);
  const moonL = new THREE.DirectionalLight(0xc8d4f0, 1.05);
  moonL.position.set(-12, 22, -10);
  moonL.castShadow = true;
  moonL.shadow.mapSize.set(1024, 1024);
  moonL.shadow.camera.left = -34;
  moonL.shadow.camera.right = 34;
  moonL.shadow.camera.top = 28;
  moonL.shadow.camera.bottom = -28;
  y.group.add(moonL);
  y.lights.push(moonL);

  y.spawn(-16, 5.46, -8, 0.5);
  y.spawn(2, 6.56, 10, Math.PI);
  y.spawn(16, 7.36, -6, -2);
  y.spawn(-18, 5.96, 10, 0.8);
  y.spawn(-6, 4.76, -16, 0.2);
  y.spawn(8, 0, 2, 1.1);
  y.spawn(-24, 0, -16, 0.4);

  const ways: [number, number, number][] = [
    [-16, 5.46, -8],
    [2, 6.56, 10],
    [16, 7.36, -6],
    [-18, 5.96, 10],
    [-6, 4.76, -16],
    [-7, 5.58, 1.6],
    [9.2, 6.98, 2.2],
    [8, 0, 2],
    [-22, 0, 0],
    [20, 0, 10],
    [0, 0, -10],
    [10, 0, 16],
    [-10, 0, 12],
    [16, 7.36, 2],
  ];
  for (const [wx, wy, wz] of ways) y.way(wx, wy, wz);

  return y.finish();
}

function shed(
  y: Yard,
  x: number,
  z: number,
  sx: number,
  h: number,
  sz: number,
): void {
  y.box(x, h * 0.5, z, sx, h, sz, y.m.cedar, { minimap: "#5a3828" });
  y.box(x, h + 0.16, z, sx + 1.1, 0.32, sz + 1.1, y.m.tin, { minimap: "#7d8c86" });
  const lip = 0.42;
  y.box(x, h + 0.55, z - sz / 2 - 0.35, sx + 1.1, lip, 0.28, y.m.tin);
  y.box(x, h + 0.55, z + sz / 2 + 0.35, sx + 1.1, lip, 0.28, y.m.tin);
  y.box(x - sx / 2 - 0.35, h + 0.55, z, 0.28, lip, sz + 1.1, y.m.tin);
  y.box(x + sx / 2 + 0.35, h + 0.55, z, 0.28, lip, sz + 1.1, y.m.tin);
}
