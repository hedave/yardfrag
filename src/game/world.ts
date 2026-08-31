import * as THREE from "three";
import { AABB } from "./collision";
import { CISTERN, POTTING, mapEnvIntensity, mapExposure, mapFog, mapSky } from "./palette";
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
  envIntensity: number;
  envCanvas: HTMLCanvasElement;
  groundY: number;
  killY: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface MatBag {
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
  leaf: THREE.MeshStandardMaterial;
}

function mulberry(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function paint(
  size: number,
  seed: number,
  draw: (ctx: CanvasRenderingContext2D, n: () => number, s: number) => void,
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  draw(ctx, mulberry(seed), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function fillNoise(
  ctx: CanvasRenderingContext2D,
  n: () => number,
  size: number,
  base: number,
  vary: number,
): void {
  const [r, g, b] = hexRgb(base);
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < size * size; i++) {
    const j = i * 4;
    const k = (n() - 0.5) * vary;
    d[j] = Math.max(0, Math.min(255, r + k));
    d[j + 1] = Math.max(0, Math.min(255, g + k));
    d[j + 2] = Math.max(0, Math.min(255, b + k));
    d[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function plasterMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 18);
    ctx.globalAlpha = 0.16;
    for (let y = 0; y < s; y += 16 + n() * 10) {
      ctx.fillStyle = n() > 0.5 ? "#ffffff" : "#c8b090";
      ctx.fillRect(0, y, s, 3);
    }
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = "#c4b49a";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(n() * s, n() * s);
      ctx.lineTo(n() * s, n() * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function woodMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    const [r, g, b] = hexRgb(color);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x++) {
      const wobble = Math.sin(x * 0.09 + n() * 0.4) * 10;
      const shade = 0.62 + n() * 0.5;
      ctx.fillStyle = `rgb(${r * shade},${g * shade},${b * shade})`;
      ctx.fillRect(x, 0, 1, s);
      if (x % 42 < 2) {
        ctx.fillStyle = `rgba(20,10,6,0.28)`;
        ctx.fillRect(x, 0, 2, s);
      }
      ctx.fillStyle = `rgba(255,210,140,${0.04 + n() * 0.05})`;
      ctx.fillRect(x, (x * 3 + wobble) % s, 1, 8);
    }
  });
}

function tileMap(color: number, grout: string, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 14);
    const step = 32;
    ctx.strokeStyle = grout;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.72;
    for (let i = 0; i <= s; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(s, i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function tinMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    const [r, g, b] = hexRgb(color);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      const rib = 0.55 + 0.55 * Math.abs(Math.sin((y / s) * Math.PI * 12));
      const speck = (n() - 0.5) * 10;
      ctx.fillStyle = `rgb(${r * rib + speck},${g * rib + speck},${b * rib + speck})`;
      ctx.fillRect(0, y, s, 1);
    }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#6a2a18";
    for (let i = 0; i < 18; i++) {
      ctx.fillRect(n() * s, n() * s, 6 + n() * 16, 2);
    }
    ctx.globalAlpha = 1;
  });
}

function speckleMap(color: number, seed: number, vary = 22): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, vary);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = n() > 0.5 ? "#ffffff" : "#202028";
      ctx.fillRect(n() * s, n() * s, 1 + n() * 2, 1 + n() * 2);
    }
    ctx.globalAlpha = 1;
  });
}

function boardMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 16);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#0a1810";
    for (let x = 0; x < s; x += 28) {
      ctx.fillRect(x, 0, 2, s);
    }
    ctx.globalAlpha = 1;
  });
}

function clapMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 14);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#0a1018";
    for (let y = 0; y < s; y += 14) {
      ctx.fillRect(0, y, s, 2);
    }
    ctx.globalAlpha = 1;
  });
}

function strawMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(256, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 20);
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 220; i++) {
      ctx.strokeStyle = n() > 0.5 ? "#fff0b0" : "#8a6020";
      ctx.beginPath();
      const x = n() * s;
      const y = n() * s;
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8 + n() * 18, y + (n() - 0.5) * 8);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function clothMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(128, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 12);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < s; y += 6) ctx.fillRect(0, y, s, 1);
    ctx.globalAlpha = 1;
  });
}

function leafMap(color: number, seed: number): THREE.CanvasTexture {
  return paint(128, seed, (ctx, n, s) => {
    fillNoise(ctx, n, s, color, 24);
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#145022";
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(n() * s, n() * s);
      ctx.quadraticCurveTo(n() * s, n() * s, n() * s, n() * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function envCanvas(id: MapId): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  if (id === "potting") {
    g.addColorStop(0, "#FFE2B0");
    g.addColorStop(0.42, "#F2C48A");
    g.addColorStop(0.52, "#D48848");
    g.addColorStop(1, "#6E4224");
  } else {
    g.addColorStop(0, "#0C1C34");
    g.addColorStop(0.42, "#17304C");
    g.addColorStop(0.52, "#152838");
    g.addColorStop(1, "#0A1018");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  return c;
}

function tileBoxUVs(geo: THREE.BoxGeometry, sx: number, sy: number, sz: number, tile: number): void {
  const uv = geo.attributes.uv;
  const scales = [
    [sz / tile, sy / tile],
    [sz / tile, sy / tile],
    [sx / tile, sz / tile],
    [sx / tile, sz / tile],
    [sx / tile, sy / tile],
    [sx / tile, sy / tile],
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = scales[f]!;
    for (let i = 0; i < 4; i++) {
      uv.setX(f * 4 + i, uv.getX(f * 4 + i) * su);
      uv.setY(f * 4 + i, uv.getY(f * 4 + i) * sv);
    }
  }
  uv.needsUpdate = true;
}

function shadeBoxAO(geo: THREE.BufferGeometry, sy: number, amount = 0.48): void {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const h = Math.max(0.02, sy);
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) + h * 0.5) / h, 0, 1);
    let ao = 1 - amount * (1 - Math.pow(t, 0.45));
    const ny = nrm.getY(i);
    if (ny < -0.45) ao *= 0.62;
    else if (ny > 0.7) ao = Math.min(1, ao + 0.1);
    colors[i * 3] = ao;
    colors[i * 3 + 1] = ao;
    colors[i * 3 + 2] = ao;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function std(
  color: number,
  extra: ConstructorParameters<typeof THREE.MeshStandardMaterial>[0] = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    vertexColors: true,
    envMapIntensity: 0.85,
    ...extra,
  });
}

function mats(id: MapId): MatBag {
  if (id === "potting") {
    return {
      soil: std(POTTING.floor, { map: tileMap(POTTING.floor, "#8a6a3a", 11), roughness: 0.96, envMapIntensity: 0.25 }),
      cedar: std(POTTING.plaster, { map: plasterMap(POTTING.plaster, 21), roughness: 0.9, envMapIntensity: 0.35 }),
      tin: std(POTTING.teak, { map: woodMap(POTTING.teak, 31), roughness: 0.68, envMapIntensity: 0.4 }),
      clay: std(POTTING.clay, { map: speckleMap(POTTING.clay, 41, 28), roughness: 0.52, envMapIntensity: 0.3 }),
      moss: std(POTTING.wainscot, { map: boardMap(POTTING.wainscot, 51), roughness: 0.92, envMapIntensity: 0.2 }),
      concrete: std(POTTING.limestone, { map: speckleMap(POTTING.limestone, 61), roughness: 0.88, envMapIntensity: 0.3 }),
      cloth: std(POTTING.cloth, { map: clothMap(POTTING.cloth, 71), roughness: 0.86, envMapIntensity: 0.2 }),
      glass: std(POTTING.glass, {
        roughness: 0.08,
        metalness: 0.18,
        transparent: true,
        opacity: 0.28,
        emissive: POTTING.glass,
        emissiveIntensity: 0.14,
        vertexColors: false,
        envMapIntensity: 1.1,
      }),
      brass: std(POTTING.straw, {
        map: strawMap(POTTING.straw, 81),
        roughness: 0.42,
        metalness: 0.28,
        emissive: 0x3a2a10,
        emissiveIntensity: 0.12,
      }),
      night: std(POTTING.teak, { map: woodMap(POTTING.teak, 91), roughness: 0.78, envMapIntensity: 0.35 }),
      straw: std(POTTING.straw, { map: strawMap(POTTING.straw, 101), roughness: 0.9, envMapIntensity: 0.2 }),
      leaf: std(POTTING.leaf, { map: leafMap(POTTING.leaf, 111), roughness: 0.84, envMapIntensity: 0.2 }),
    };
  }
  return {
    soil: std(CISTERN.floor, { map: tileMap(CISTERN.floor, "#2a3038", 12), roughness: 0.94, envMapIntensity: 0.2 }),
    cedar: std(CISTERN.wall, { map: clapMap(CISTERN.wall, 22), roughness: 0.8, envMapIntensity: 0.22 }),
    tin: std(CISTERN.tin, {
      map: tinMap(CISTERN.tin, 32),
      roughness: 0.42,
      metalness: 0.48,
      envMapIntensity: 0.95,
    }),
    clay: std(CISTERN.rust, { map: speckleMap(CISTERN.rust, 42, 36), roughness: 0.58, envMapIntensity: 0.35 }),
    moss: std(CISTERN.puddle, {
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.72,
      envMapIntensity: 1.05,
      vertexColors: false,
    }),
    concrete: std(CISTERN.concrete, { map: speckleMap(CISTERN.concrete, 62), roughness: 0.86, envMapIntensity: 0.3 }),
    cloth: std(CISTERN.cloth, { map: clothMap(CISTERN.cloth, 72), roughness: 0.8, envMapIntensity: 0.25 }),
    glass: std(CISTERN.glass, {
      roughness: 0.1,
      metalness: 0.32,
      transparent: true,
      opacity: 0.2,
      vertexColors: false,
      envMapIntensity: 1,
    }),
    brass: std(CISTERN.brass, {
      roughness: 0.32,
      metalness: 0.74,
      emissive: 0x3a2a08,
      emissiveIntensity: 0.16,
      envMapIntensity: 1.05,
    }),
    night: std(CISTERN.wall, { map: clapMap(CISTERN.wall, 92), roughness: 1, envMapIntensity: 0.18 }),
    straw: std(CISTERN.straw, { map: strawMap(CISTERN.straw, 102), roughness: 0.7, envMapIntensity: 0.3 }),
    leaf: std(CISTERN.puddle, { map: leafMap(CISTERN.puddle, 112), roughness: 0.8, envMapIntensity: 0.25 }),
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
    opts: { collide?: boolean; minimap?: string; receive?: boolean; cast?: boolean; tile?: number; ao?: number } = {},
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    tileBoxUVs(geo, sx, sy, sz, opts.tile ?? 2.6);
    shadeBoxAO(geo, sy, opts.ao);
    const mesh = new THREE.Mesh(geo, mat);
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
    const geo = new THREE.CylinderGeometry(radius, radius * 1.08, height, 12);
    shadeBoxAO(geo, height);
    const mesh = new THREE.Mesh(geo, mat);
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
    const plant = new THREE.Mesh(new THREE.ConeGeometry(0.34 * scale, 0.7 * scale, 7), this.m.leaf);
    plant.position.set(x, y + h + 0.28 * scale, z);
    plant.castShadow = true;
    this.group.add(plant);
    const dirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.06, 8), this.m.soil);
    dirt.position.set(x, y + h + 0.02, z);
    this.group.add(dirt);
  }

  spawn(x: number, y: number, z: number, yaw: number): void {
    this.spawns.push({ x, y, z, yaw });
  }

  way(x: number, y: number, z: number): void {
    this.waypoints.push(new THREE.Vector3(x, y, z));
  }

  lamp(x: number, y: number, z: number, intensity = 4.2, color = 0xffc07a): void {
    this.box(x, y + 0.16, z, 0.42, 0.06, 0.42, this.m.brass, { collide: false, cast: false });
    this.box(x, y + 0.28, z, 0.06, 0.22, 0.06, this.m.brass, { collide: false, cast: false });
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.8,
        roughness: 0.35,
        vertexColors: false,
      }),
    );
    bulb.position.set(x, y, z);
    this.group.add(bulb);
    const light = new THREE.PointLight(color, intensity, 18, 1.7);
    light.position.set(x, y, z);
    light.castShadow = false;
    this.group.add(light);
    this.lights.push(light);
  }

  keyLight(
    color: number,
    intensity: number,
    x: number,
    y: number,
    z: number,
    span: number,
  ): THREE.DirectionalLight {
    const sun = new THREE.DirectionalLight(color, intensity);
    sun.position.set(x, y, z);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 2.5;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -span;
    sun.shadow.camera.right = span;
    sun.shadow.camera.top = span * 0.78;
    sun.shadow.camera.bottom = -span * 0.78;
    sun.shadow.camera.updateProjectionMatrix();
    sun.target.position.set(0, 1.2, 0);
    this.group.add(sun);
    this.group.add(sun.target);
    this.lights.push(sun);
    return sun;
  }

  fillLight(color: number, intensity: number, x: number, y: number, z: number): THREE.DirectionalLight {
    const fill = new THREE.DirectionalLight(color, intensity);
    fill.position.set(x, y, z);
    fill.castShadow = false;
    this.group.add(fill);
    this.lights.push(fill);
    return fill;
  }

  hemi(sky: number, ground: number, intensity: number): THREE.HemisphereLight {
    const hemi = new THREE.HemisphereLight(sky, ground, intensity);
    this.group.add(hemi);
    this.lights.push(hemi);
    return hemi;
  }

  private atmosphere(): void {
    const zenith = new THREE.Color(this.id === "potting" ? POTTING.skyZenith : CISTERN.skyZenith);
    const horizon = new THREE.Color(this.id === "potting" ? POTTING.skyHorizon : CISTERN.skyHorizon);
    const geo = new THREE.SphereGeometry(110, 28, 18);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 110;
      const t = THREE.MathUtils.smoothstep(-0.08, 0.72, y);
      c.copy(horizon).lerp(zenith, t);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const sky = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false,
      }),
    );
    sky.frustumCulled = false;
    sky.name = "sky";
    this.group.add(sky);

    const surround = this.id === "potting" ? POTTING.surround : CISTERN.surround;
    this.box(0, -1.15, 0, 160, 1.4, 140, std(surround, { roughness: 1, envMapIntensity: 0.1, vertexColors: true }), {
      collide: false,
      cast: false,
      tile: 12,
    });

    if (this.id === "potting") {
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe8b8, fog: false }),
      );
      sun.position.set(22, 34, 16);
      this.group.add(sun);
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(5.4, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0xffd080,
          transparent: true,
          opacity: 0.22,
          fog: false,
          depthWrite: false,
        }),
      );
      halo.position.copy(sun.position);
      this.group.add(halo);
    } else {
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 14, 14),
        new THREE.MeshBasicMaterial({ color: CISTERN.moon, fog: false }),
      );
      moon.position.set(-22, 30, -24);
      this.group.add(moon);
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(240);
      const rng = mulberry(77);
      for (let i = 0; i < 80; i++) {
        const a = rng() * Math.PI * 2;
        const e = 0.18 + rng() * 0.7;
        const r = 88;
        starPos[i * 3] = Math.cos(a) * Math.cos(e) * r;
        starPos[i * 3 + 1] = Math.sin(e) * r;
        starPos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
      }
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      const starDot = document.createElement("canvas");
      starDot.width = starDot.height = 16;
      const sctx = starDot.getContext("2d")!;
      const sg = sctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      sg.addColorStop(0, "rgba(255,255,255,1)");
      sg.addColorStop(0.45, "rgba(220,230,255,0.7)");
      sg.addColorStop(1, "rgba(220,230,255,0)");
      sctx.fillStyle = sg;
      sctx.fillRect(0, 0, 16, 16);
      const starTex = new THREE.CanvasTexture(starDot);
      this.group.add(
        new THREE.Points(
          starGeo,
          new THREE.PointsMaterial({
            map: starTex,
            color: 0xe8eefc,
            size: 0.9,
            sizeAttenuation: true,
            fog: false,
            transparent: true,
            depthWrite: false,
          }),
        ),
      );
    }
  }

  finish(): Arena {
    this.atmosphere();
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
      envIntensity: mapEnvIntensity(this.id),
      envCanvas: envCanvas(this.id),
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
    yard.box(cx, cy, cz, sx, rise, sz, mat, { minimap: i === 0 ? "#C9A227" : undefined, tile: 1.4 });
  }
}

export function rail(
  yard: Yard,
  x: number,
  y: number,
  z: number,
  sx: number,
  sz: number,
  mat: THREE.Material,
): void {
  yard.box(x, y + 0.42, z, sx, 0.08, sz, mat, { tile: 1.2 });
  yard.box(x, y + 0.18, z, Math.max(0.08, sx * 0.12), 0.36, Math.max(0.08, sz * 0.12), mat, {
    collide: false,
    tile: 0.8,
  });
}
