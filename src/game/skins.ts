import * as THREE from "three";
import { PLAYER } from "./palette";
import type { WeaponId } from "./types";

/**
 * Cosmetic kit only. These palettes paint viewmodel materials and
 * original canvas decals. They must never feed damage, spread, recoil,
 * or ADS numbers — those stay in weapons.ts / gunfeel.ts.
 */

export type SkinSlot = "stock" | "metal" | "accent" | "iron";
export type DecalKind = "none" | "pot" | "chevron" | "hash";

export interface WeaponSkin {
  id: string;
  weapon: WeaponId;
  name: string;
  swatch: string;
  stock: number;
  metal: number;
  accent: number;
  iron: number;
  stockMetal: number;
  metalMetal: number;
  accentMetal: number;
  ironMetal: number;
  stockRough: number;
  metalRough: number;
  accentRough: number;
  ironRough: number;
  accentEmissive: number;
  accentGlow: number;
  ironEmissive: number;
  ironGlow: number;
  decal: DecalKind;
}

export const DEFAULT_SKINS: Record<WeaponId, string> = {
  clipper: "clipper-shed",
  hose: "hose-clay",
  stake: "stake-fence",
};

export const SKINS: readonly WeaponSkin[] = [
  {
    id: "clipper-shed",
    weapon: "clipper",
    name: "Shed Cedar",
    swatch: "#3a2a28",
    stock: 0x3a2a28,
    metal: 0xc8d4dc,
    accent: PLAYER,
    iron: 0xd8e2e8,
    stockMetal: 0.05,
    metalMetal: 0.55,
    accentMetal: 0.08,
    ironMetal: 0.7,
    stockRough: 0.7,
    metalRough: 0.35,
    accentRough: 0.45,
    ironRough: 0.28,
    accentEmissive: PLAYER,
    accentGlow: 0.22,
    ironEmissive: 0x6a8088,
    ironGlow: 0.18,
    decal: "none",
  },
  {
    id: "clipper-lime",
    weapon: "clipper",
    name: "Lime Tooth",
    swatch: "#3dff6a",
    stock: 0x2a211b,
    metal: 0x3dff6a,
    accent: 0xc45c28,
    iron: 0xe8f5d8,
    stockMetal: 0.04,
    metalMetal: 0.35,
    accentMetal: 0.1,
    ironMetal: 0.55,
    stockRough: 0.72,
    metalRough: 0.32,
    accentRough: 0.48,
    ironRough: 0.3,
    accentEmissive: 0xc45c28,
    accentGlow: 0.2,
    ironEmissive: 0x3dff6a,
    ironGlow: 0.12,
    decal: "pot",
  },
  {
    id: "clipper-kiln",
    weapon: "clipper",
    name: "Kiln Clay",
    swatch: "#ff8a3d",
    stock: 0xc45c28,
    metal: 0xf5ff3d,
    accent: 0x1c1612,
    iron: 0xffd8a8,
    stockMetal: 0.08,
    metalMetal: 0.25,
    accentMetal: 0.04,
    ironMetal: 0.45,
    stockRough: 0.52,
    metalRough: 0.4,
    accentRough: 0.62,
    ironRough: 0.32,
    accentEmissive: 0xff8a3d,
    accentGlow: 0.1,
    ironEmissive: 0xff8a3d,
    ironGlow: 0.16,
    decal: "chevron",
  },
  {
    id: "hose-clay",
    weapon: "hose",
    name: "Clay Drum",
    swatch: "#ff8a3d",
    stock: 0x3a2a28,
    metal: 0xc8d4dc,
    accent: PLAYER,
    iron: 0xd8e2e8,
    stockMetal: 0.05,
    metalMetal: 0.55,
    accentMetal: 0.08,
    ironMetal: 0.7,
    stockRough: 0.7,
    metalRough: 0.35,
    accentRough: 0.45,
    ironRough: 0.28,
    accentEmissive: PLAYER,
    accentGlow: 0.22,
    ironEmissive: 0x6a8088,
    ironGlow: 0.18,
    decal: "none",
  },
  {
    id: "hose-cistern",
    weapon: "hose",
    name: "Cistern Wash",
    swatch: "#8fd4de",
    stock: 0x243044,
    metal: 0x8fd4de,
    accent: 0xc8d4dc,
    iron: 0x3dff6a,
    stockMetal: 0.12,
    metalMetal: 0.62,
    accentMetal: 0.5,
    ironMetal: 0.4,
    stockRough: 0.55,
    metalRough: 0.28,
    accentRough: 0.32,
    ironRough: 0.3,
    accentEmissive: 0x8fd4de,
    accentGlow: 0.14,
    ironEmissive: 0x3dff6a,
    ironGlow: 0.2,
    decal: "hash",
  },
  {
    id: "hose-mulch",
    weapon: "hose",
    name: "Mulch Moss",
    swatch: "#2f9e4a",
    stock: 0x6b4433,
    metal: 0xc45c28,
    accent: 0x2f9e4a,
    iron: 0xf5ff3d,
    stockMetal: 0.06,
    metalMetal: 0.28,
    accentMetal: 0.1,
    ironMetal: 0.35,
    stockRough: 0.68,
    metalRough: 0.42,
    accentRough: 0.5,
    ironRough: 0.34,
    accentEmissive: 0x3dff6a,
    accentGlow: 0.18,
    ironEmissive: 0xf5ff3d,
    ironGlow: 0.12,
    decal: "pot",
  },
  {
    id: "stake-fence",
    weapon: "stake",
    name: "Fence Tin",
    swatch: "#c8d4dc",
    stock: 0x3a2a28,
    metal: 0xc8d4dc,
    accent: PLAYER,
    iron: 0xd8e2e8,
    stockMetal: 0.05,
    metalMetal: 0.55,
    accentMetal: 0.08,
    ironMetal: 0.7,
    stockRough: 0.7,
    metalRough: 0.35,
    accentRough: 0.45,
    ironRough: 0.28,
    accentEmissive: PLAYER,
    accentGlow: 0.22,
    ironEmissive: 0x6a8088,
    ironGlow: 0.18,
    decal: "none",
  },
  {
    id: "stake-patio",
    weapon: "stake",
    name: "Patio Lime",
    swatch: "#3dff6a",
    stock: 0xc45c28,
    metal: 0x3dff6a,
    accent: 0x1c1612,
    iron: 0xf5ff3d,
    stockMetal: 0.1,
    metalMetal: 0.32,
    accentMetal: 0.06,
    ironMetal: 0.4,
    stockRough: 0.5,
    metalRough: 0.36,
    accentRough: 0.6,
    ironRough: 0.3,
    accentEmissive: 0x3dff6a,
    accentGlow: 0.12,
    ironEmissive: 0x3dff6a,
    ironGlow: 0.16,
    decal: "chevron",
  },
  {
    id: "stake-terra",
    weapon: "stake",
    name: "Terra Pin",
    swatch: "#c45c28",
    stock: 0x2a211b,
    metal: 0xff8a3d,
    accent: 0xf5ff3d,
    iron: 0xffd8a8,
    stockMetal: 0.04,
    metalMetal: 0.22,
    accentMetal: 0.12,
    ironMetal: 0.38,
    stockRough: 0.72,
    metalRough: 0.44,
    accentRough: 0.4,
    ironRough: 0.32,
    accentEmissive: 0xf5ff3d,
    accentGlow: 0.2,
    ironEmissive: 0xff8a3d,
    ironGlow: 0.14,
    decal: "pot",
  },
];

const byId = new Map(SKINS.map((s) => [s.id, s]));
const decalCache = new Map<DecalKind, THREE.CanvasTexture>();

export function skinsFor(weapon: WeaponId): WeaponSkin[] {
  return SKINS.filter((s) => s.weapon === weapon);
}

export function resolveSkin(weapon: WeaponId, id: unknown): WeaponSkin {
  if (typeof id === "string") {
    const found = byId.get(id);
    if (found && found.weapon === weapon) return found;
  }
  return byId.get(DEFAULT_SKINS[weapon])!;
}

export function resolveSkinId(weapon: WeaponId, id: unknown): string {
  return resolveSkin(weapon, id).id;
}

export function applyViewmodelSkin(group: THREE.Group, weapon: WeaponId, id: unknown): void {
  const skin = resolveSkin(weapon, id);
  group.userData.skinId = skin.id;
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const slot = o.userData.skinSlot as SkinSlot | "decal" | undefined;
    const mat = o.material;
    if (!(mat instanceof THREE.MeshStandardMaterial)) return;
    if (slot === "decal") {
      paintDecal(o, mat, skin);
      return;
    }
    if (!slot) return;
    paintSlot(mat, skin, slot);
  });
}

function paintSlot(mat: THREE.MeshStandardMaterial, skin: WeaponSkin, slot: SkinSlot): void {
  if (slot === "stock") {
    mat.color.setHex(skin.stock);
    mat.metalness = skin.stockMetal;
    mat.roughness = skin.stockRough;
    mat.emissive.setHex(0x000000);
    mat.emissiveIntensity = 0;
    return;
  }
  if (slot === "metal") {
    mat.color.setHex(skin.metal);
    mat.metalness = skin.metalMetal;
    mat.roughness = skin.metalRough;
    mat.emissive.setHex(0x000000);
    mat.emissiveIntensity = 0;
    return;
  }
  if (slot === "accent") {
    mat.color.setHex(skin.accent);
    mat.metalness = skin.accentMetal;
    mat.roughness = skin.accentRough;
    mat.emissive.setHex(skin.accentEmissive);
    mat.emissiveIntensity = skin.accentGlow;
    return;
  }
  mat.color.setHex(skin.iron);
  mat.metalness = skin.ironMetal;
  mat.roughness = skin.ironRough;
  mat.emissive.setHex(skin.ironEmissive);
  mat.emissiveIntensity = skin.ironGlow;
}

function paintDecal(
  mesh: THREE.Mesh,
  mat: THREE.MeshStandardMaterial,
  skin: WeaponSkin,
): void {
  if (skin.decal === "none") {
    mesh.visible = false;
    return;
  }
  mesh.visible = true;
  mat.map = decalTexture(skin.decal);
  mat.color.setHex(0xffffff);
  mat.transparent = true;
  mat.roughness = 0.62;
  mat.metalness = 0.04;
  mat.needsUpdate = true;
}

function decalTexture(kind: Exclude<DecalKind, "none">): THREE.CanvasTexture {
  const hit = decalCache.get(kind);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 64, 64);
  if (kind === "pot") {
    ctx.fillStyle = "#c45c28";
    ctx.beginPath();
    ctx.ellipse(32, 42, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(18, 18, 28, 22);
    ctx.fillStyle = "#6b4433";
    ctx.fillRect(24, 12, 16, 8);
    ctx.fillStyle = "#3dff6a";
    ctx.fillRect(29, 4, 6, 12);
  } else if (kind === "chevron") {
    ctx.fillStyle = "#3dff6a";
    for (let i = 0; i < 4; i++) {
      const y = 4 + i * 15;
      ctx.beginPath();
      ctx.moveTo(6, y);
      ctx.lineTo(32, y + 10);
      ctx.lineTo(58, y);
      ctx.lineTo(58, y + 7);
      ctx.lineTo(32, y + 17);
      ctx.lineTo(6, y + 7);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = "#f5ff3d";
    ctx.lineWidth = 5;
    for (let i = -1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 14, 0);
      ctx.lineTo(i * 14 + 28, 64);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  decalCache.set(kind, tex);
  return tex;
}
