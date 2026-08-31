import { CISTERN, POTTING } from "./palette";
import { rail, stairs, Yard, type Arena } from "./world";
import type { MapId } from "./types";

export function buildMap(id: MapId): Arena {
  return id === "potting" ? buildPotting() : buildCistern();
}

function buildPotting(): Arena {
  const y = new Yard("potting", "Potting Hall");
  y.fogNear = 30;
  y.fogFar = 92;
  y.bounds = { minX: -27, maxX: 27, minZ: -19, maxZ: 19 };
  y.killY = -4;

  const W = 52;
  const D = 36;
  const H = 9.2;
  const wall = 0.7;

  y.box(0, -0.4, 0, W, 0.8, D, y.m.soil, { minimap: "#D2B07A", cast: false, tile: 2.2 });
  y.box(0, 0.04, 0, 14, 0.1, 10, y.m.straw, { collide: false, cast: false, tile: 1.6 });

  y.box(0, H / 2, -D / 2, W, H, wall, y.m.cedar, { minimap: "#F3E4C4", tile: 3.2 });
  y.box(0, H / 2, D / 2, W, H, wall, y.m.cedar, { minimap: "#F3E4C4", tile: 3.2 });
  y.box(-W / 2, H / 2, 0, wall, H, D, y.m.cedar, { minimap: "#F3E4C4", tile: 3.2 });
  y.box(W / 2, H / 2, 0, wall, H, D, y.m.cedar, { minimap: "#F3E4C4", tile: 3.2 });
  y.box(0, 1.05, -D / 2 + 0.42, W - 2, 2.1, 0.22, y.m.moss, { collide: false, tile: 1.8 });
  y.box(0, 1.05, D / 2 - 0.42, W - 2, 2.1, 0.22, y.m.moss, { collide: false, tile: 1.8 });
  y.box(-W / 2 + 0.42, 1.05, 0, 0.22, 2.1, D - 2, y.m.moss, { collide: false, tile: 1.8 });
  y.box(W / 2 - 0.42, 1.05, 0, 0.22, 2.1, D - 2, y.m.moss, { collide: false, tile: 1.8 });

  y.box(0, H + 0.2, 0, W, 0.4, D, y.m.tin, { receive: true, tile: 4 });
  for (const x of [-16, -8, 0, 8, 16]) {
    y.box(x, H - 0.15, 0, 0.28, 0.5, D - 2, y.m.night, { collide: false, tile: 2 });
  }
  for (const z of [-10, 0, 10]) {
    y.box(0, H - 0.15, z, W - 2, 0.42, 0.28, y.m.night, { collide: false, tile: 2 });
  }
  y.box(-12, H + 0.18, 0, 8, 0.05, 18, y.m.glass, { collide: false, cast: false });
  y.box(12, H + 0.18, 0, 8, 0.05, 18, y.m.glass, { collide: false, cast: false });
  for (const x of [-15, -12, -9, 9, 12, 15]) {
    y.box(x, H + 0.22, 0, 0.1, 0.08, 18, y.m.night, { collide: false, cast: false });
  }

  highWindows(y, 0, H * 0.62, -D / 2 + 0.38, W - 6, 2.4, 0.08, true);
  highWindows(y, 0, H * 0.62, D / 2 - 0.38, W - 6, 2.4, 0.08, true);

  y.box(-8, 1.6, -6, wall, 3.2, 16, y.m.moss, { minimap: "#1F6B48" });
  y.box(-8, 4.6, -6, wall, 2.8, 16, y.m.moss);
  y.box(10, 1.6, 8, 14, 3.2, wall, y.m.moss, { minimap: "#1F6B48" });
  y.box(10, 4.6, 8, 14, 2.8, wall, y.m.moss);

  for (const x of [-16, -4, 8, 18]) {
    y.box(x, 4.6, -12, 0.55, 9.2, 0.55, y.m.concrete, { minimap: "#DDD2B4" });
    y.box(x, 9.05, -12, 0.86, 0.22, 0.86, y.m.concrete, { collide: false });
  }
  for (const z of [-4, 8]) {
    y.box(16, 4.6, z, 0.55, 9.2, 0.55, y.m.concrete);
    y.box(16, 9.05, z, 0.86, 0.22, 0.86, y.m.concrete, { collide: false });
  }

  y.box(18, 4.35, -4, 12, 0.35, 20, y.m.night, { minimap: "#8A4E24", tile: 2.4 });
  y.box(24.4, 2.1, -4, 0.4, 4.2, 20, y.m.night);
  stairs(y, 12.2, 0, 8.5, 1, 0, 10, 0.42, 0.62, 2.2, y.m.straw);
  y.box(18, 4.55, 6.4, 12, 1.1, 0.28, y.m.night);
  rail(y, 18, 4.55, -13.8, 11.4, 0.12, y.m.night);
  rail(y, 12.2, 4.55, -4, 0.12, 18, y.m.night);
  y.box(18, 4.18, -4, 11.4, 0.08, 0.12, y.m.brass, { collide: false });

  y.box(-1, 0.38, -1, 6.4, 0.76, 2.1, y.m.moss, { minimap: "#1F6B48" });
  y.box(-1, 0.38, 2.4, 6.4, 0.76, 2.1, y.m.moss, { minimap: "#1F6B48" });
  y.box(-18, 0.7, 8, 4.4, 1.4, 1.6, y.m.night, { minimap: "#8A4E24" });
  y.box(-18, 0.55, 11.2, 3.2, 1.1, 2.4, y.m.straw);
  y.box(4, 0.85, -12, 3.6, 1.7, 1.3, y.m.concrete, { minimap: "#DDD2B4" });
  y.box(7.4, 1.1, -12, 1.6, 2.2, 1.6, y.m.concrete);
  y.box(-14, 0.9, -12, 2.4, 1.8, 2.4, y.m.straw, { minimap: "#E8C86A" });
  y.box(-11.2, 0.55, -12, 2.2, 1.1, 1.8, y.m.straw);
  y.box(2, 0.7, 12, 5.5, 1.4, 1.2, y.m.night);
  y.box(-22, 1.2, -8, 1.8, 2.4, 6, y.m.night, { minimap: "#8A4E24" });

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
    [-2, -3],
    [14, 4],
  ] as const) {
    y.pot(px, pz, 0, 0.9 + ((px + pz) % 5) * 0.08);
  }

  y.box(-20, 2.8, -16.6, 8, 0.08, 0.08, y.m.cloth, { collide: false, cast: false });
  y.box(-16, 1.6, -16.6, 0.12, 3.2, 0.12, y.m.cedar, { collide: false });
  y.box(6, 6.6, 4, 0.04, 1.6, 0.04, y.m.brass, { collide: false, cast: false });
  y.box(-12, 6.8, -6, 0.04, 1.4, 0.04, y.m.brass, { collide: false, cast: false });

  y.lamp(-12, 7.4, -6, 7.2, POTTING.lamp);
  y.lamp(6, 7.4, 4, 6.8, POTTING.lamp);
  y.lamp(18, 7.6, -8, 5.6, POTTING.lamp);
  y.lamp(-18, 7.2, 10, 6.2, POTTING.lamp);

  y.hemi(POTTING.fillSky, POTTING.fillGround, 0.72);
  y.keyLight(POTTING.key, 1.55, 10, 20, 8, 30);
  y.fillLight(POTTING.fillSky, 0.32, -14, 10, -8);
  y.fillLight(POTTING.rim, 0.22, 4, 8, -16);

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

function highWindows(
  y: Yard,
  x: number,
  cy: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  alongX: boolean,
): void {
  const panes = 7;
  const span = alongX ? width : depth;
  const step = span / panes;
  for (let i = 0; i < panes; i++) {
    const ox = alongX ? x - span / 2 + step * (i + 0.5) : x;
    const oz = alongX ? z : z - span / 2 + step * (i + 0.5);
    y.box(ox, cy, oz, alongX ? step - 0.18 : depth, height, alongX ? depth : step - 0.18, y.m.glass, {
      collide: false,
      cast: false,
    });
    y.box(ox, cy, oz, alongX ? 0.08 : depth + 0.02, height + 0.12, alongX ? depth + 0.02 : 0.08, y.m.night, {
      collide: false,
      cast: false,
    });
  }
}

function buildCistern(): Arena {
  const y = new Yard("cistern", "Cistern Roofs");
  y.fogNear = 26;
  y.fogFar = 108;
  y.bounds = { minX: -32, maxX: 32, minZ: -26, maxZ: 26 };
  y.killY = -5;

  y.box(0, -0.45, 0, 64, 0.9, 52, y.m.soil, { minimap: "#4A5568", cast: false, tile: 3 });
  y.box(0, 0.02, 0, 18, 0.08, 12, y.m.moss, { collide: false, cast: false });
  y.box(-6, 0.03, 8, 5, 0.05, 3.2, y.m.moss, { collide: false, cast: false });
  y.box(8, 0.03, -8, 4.2, 0.05, 2.6, y.m.moss, { collide: false, cast: false });

  shed(y, -16, -8, 14, 5.1, 10);
  shed(y, 2, 10, 12, 6.2, 12);
  shed(y, 16, -6, 13, 7.0, 11);
  shed(y, -6, -16, 10, 4.4, 8);
  shed(y, -18, 10, 9, 5.6, 9);

  y.box(-7, 5.58, 1.6, 9.2, 0.28, 1.5, y.m.brass, { minimap: "#D4A429" });
  y.box(9.2, 6.98, 2.2, 8.6, 0.28, 1.4, y.m.brass, { minimap: "#D4A429" });
  y.box(-11, 5.1, -14.2, 1.4, 0.28, 7.2, y.m.brass);
  y.box(-16.4, 5.78, 3.4, 1.3, 0.28, 8.2, y.m.brass);
  rail(y, -7, 5.72, 1.6, 9.0, 0.1, y.m.brass);
  rail(y, 9.2, 7.12, 2.2, 8.4, 0.1, y.m.brass);

  stairs(y, -16, 0, -22.4, 0, 1, 13, 0.42, 0.52, 2.3, y.m.brass);
  stairs(y, 22.8, 0, -6, -1, 0, 17, 0.42, 0.5, 2.2, y.m.brass);
  stairs(y, 2, 0, 22.6, 0, -1, 16, 0.42, 0.5, 2.2, y.m.brass);
  stairs(y, -6, 0, -24.2, 0, 1, 11, 0.42, 0.5, 2.1, y.m.brass);
  stairs(y, -18, 0, 20.4, 0, -1, 14, 0.42, 0.5, 2.1, y.m.brass);

  y.cyl(8, 4.4, 2, 1.6, 8.8, y.m.tin, true);
  y.box(8, 9.0, 2, 3.4, 0.35, 3.4, y.m.tin, { minimap: "#8FD4DE" });
  y.cyl(8, 9.6, 2, 0.18, 1.2, y.m.tin, false);
  y.cyl(8, 10.3, 2, 0.32, 0.16, y.m.clay, false);

  y.box(0, 3.4, -2, 2.2, 1.6, 1.4, y.m.tin);
  y.box(18, 8.1, -2, 1.8, 1.4, 1.6, y.m.tin);
  y.box(-14, 6.2, -6, 1.5, 1.3, 1.3, y.m.tin);
  y.box(4, 7.3, 12, 2.4, 1.2, 1.2, y.m.concrete);
  y.box(-18, 6.5, 12, 1.2, 1.8, 1.2, y.m.clay);

  y.box(-2, 1.1, 0, 2.6, 2.2, 2.6, y.m.cedar, { minimap: "#243044" });
  y.box(10, 0.7, -16, 3.4, 1.4, 1.8, y.m.straw);
  y.box(-24, 0.9, 0, 2, 1.8, 6, y.m.cedar);
  y.box(24, 1.2, 8, 2.2, 2.4, 4.4, y.m.concrete);
  y.box(12, 0.55, 4, 1.4, 1.1, 1.4, y.m.clay);
  y.box(-8, 0.4, -4, 3.6, 0.12, 0.8, y.m.straw, { collide: false });

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

  y.lamp(-16, 6.4, -8, 4.8, CISTERN.lamp);
  y.lamp(2, 7.6, 10, 5.1, CISTERN.lamp);
  y.lamp(16, 8.4, -6, 4.6, CISTERN.lamp);
  y.lamp(-2, 2.6, 0, 3.4, CISTERN.lamp);

  y.hemi(CISTERN.fillSky, CISTERN.fillGround, 0.38);
  y.keyLight(CISTERN.key, 1.05, -14, 24, -12, 36);
  y.fillLight(CISTERN.rim, 0.28, 16, 10, 10);
  y.fillLight(CISTERN.lamp, 0.08, 0, 6, 4);

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
  y.box(x, h * 0.5, z, sx, h, sz, y.m.cedar, { minimap: "#243044", tile: 2.4 });
  y.box(x, h + 0.16, z, sx + 1.1, 0.32, sz + 1.1, y.m.tin, { minimap: "#8FD4DE", tile: 1.4 });
  const lip = 0.42;
  y.box(x, h + 0.55, z - sz / 2 - 0.35, sx + 1.1, lip, 0.28, y.m.tin, { tile: 1.2 });
  y.box(x, h + 0.55, z + sz / 2 + 0.35, sx + 1.1, lip, 0.28, y.m.tin, { tile: 1.2 });
  y.box(x - sx / 2 - 0.35, h + 0.55, z, 0.28, lip, sz + 1.1, y.m.tin, { tile: 1.2 });
  y.box(x + sx / 2 + 0.35, h + 0.55, z, 0.28, lip, sz + 1.1, y.m.tin, { tile: 1.2 });
  for (let i = -2; i <= 2; i++) {
    y.box(x + i * (sx / 5), h + 0.34, z, 0.1, 0.1, sz + 0.9, y.m.tin, { collide: false, tile: 1 });
  }
  y.box(x - sx / 2 + 0.12, h * 0.42, z, 0.14, h * 0.72, 1.4, y.m.night, { collide: false });
  y.box(x + sx / 2 - 0.08, h * 0.62, z + sz * 0.18, 0.06, 0.9, 1.2, y.m.glass, { collide: false, cast: false });
  y.box(x - sx / 2 + 0.2, 0.08, z - sz / 2 + 0.2, 0.55, 0.16, 0.55, y.m.concrete, { collide: false });
  y.box(x + sx / 2 - 0.2, 0.08, z + sz / 2 - 0.2, 0.55, 0.16, 0.55, y.m.concrete, { collide: false });
  y.box(x + sx * 0.28, h + 0.55, z - sz * 0.2, 0.7, 0.55, 0.7, y.m.clay, { collide: false });
}
