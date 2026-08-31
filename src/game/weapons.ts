import type { WeaponId } from "./types";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  verb: string;
  mag: number;
  reserve: number;
  reload: number;
  rpm: number;
  damage: number;
  pellets: number;
  spread: number;
  range: number;
  auto: boolean;
  charge: boolean;
  chargeTime: number;
  zoomFov: number | null;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  clipper: {
    id: "clipper",
    name: "CLIPPER",
    verb: "clipped",
    mag: 24,
    reserve: 72,
    reload: 1.55,
    rpm: 540,
    damage: 18,
    pellets: 1,
    spread: 0.012,
    range: 90,
    auto: true,
    charge: false,
    chargeTime: 0,
    zoomFov: null,
  },
  hose: {
    id: "hose",
    name: "SCATTERHOSE",
    verb: "hosed",
    mag: 6,
    reserve: 24,
    reload: 2.15,
    rpm: 78,
    damage: 12,
    pellets: 8,
    spread: 0.09,
    range: 28,
    auto: false,
    charge: false,
    chargeTime: 0,
    zoomFov: null,
  },
  stake: {
    id: "stake",
    name: "STAKE",
    verb: "staked",
    mag: 4,
    reserve: 16,
    reload: 2.35,
    rpm: 48,
    damage: 92,
    pellets: 1,
    spread: 0,
    range: 140,
    auto: false,
    charge: true,
    chargeTime: 0.72,
    zoomFov: 36,
  },
};

export const WEAPON_ORDER: WeaponId[] = ["clipper", "hose", "stake"];

export interface WeaponState {
  id: WeaponId;
  mag: number;
  reserve: number;
  cooldown: number;
  reloading: number;
  charge: number;
  charging: boolean;
}

export function makeWeapon(id: WeaponId): WeaponState {
  const d = WEAPONS[id];
  return {
    id,
    mag: d.mag,
    reserve: d.reserve,
    cooldown: 0,
    reloading: 0,
    charge: 0,
    charging: false,
  };
}

export function fireInterval(id: WeaponId): number {
  return 60 / WEAPONS[id].rpm;
}
