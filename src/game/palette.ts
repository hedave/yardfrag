import type { MapId } from "./types";

/** Reserved hostile signal — never used as a large map fill. */
export const SIGNAL = 0xf5ff3d;
export const SIGNAL_HEX = "#F5FF3D";

/** Player clay — first-person / minimap self. */
export const PLAYER = 0xff8a3d;
export const PLAYER_HEX = "#FF8A3D";

export const POT_INK = 0x1a1a1e;
export const HIT_FLASH = 0xffffff;

export const BOT_BODIES = [0xe11d74, 0xff6a00, 0x4d3bff, 0xff2bd6, 0x00d4aa] as const;

export const POTTING = {
  sky: 0xf2c48a,
  skyZenith: 0xffe2b0,
  skyHorizon: 0xe8a868,
  fog: 0xe0b070,
  floor: 0xd2b07a,
  plaster: 0xf3e4c4,
  wainscot: 0x1f6b48,
  teak: 0x8a4e24,
  leaf: 0x2f9e4a,
  clay: 0xe24a1c,
  limestone: 0xddd2b4,
  straw: 0xe8c86a,
  glass: 0x7ad0c8,
  cloth: 0xff7a9a,
  key: 0xffd080,
  fillSky: 0x9eb8d8,
  fillGround: 0x8a5a32,
  lamp: 0xffc070,
  rim: 0xffe8c4,
  surround: 0x6e4224,
} as const;

export const CISTERN = {
  sky: 0x17304c,
  skyZenith: 0x0c1c34,
  skyHorizon: 0x2a4a68,
  fog: 0x152838,
  floor: 0x4a5568,
  wall: 0x243044,
  tin: 0x8fd4de,
  brass: 0xd4a429,
  concrete: 0xa8b2be,
  rust: 0xc43a22,
  puddle: 0x2a8f8a,
  straw: 0xc9a227,
  glass: 0x6aa0c8,
  cloth: 0x7ec8d4,
  key: 0xc8d8ff,
  fillSky: 0x6a88b8,
  fillGround: 0x1a2028,
  lamp: 0xffb36a,
  moon: 0xe8eefc,
  rim: 0xa8c4e8,
  surround: 0x121820,
} as const;

export const HUD = {
  ink: "#F7F4EA",
  inkStroke: "#111111",
  signal: SIGNAL_HEX,
  player: PLAYER_HEX,
  vital: "#3DFF6A",
  hurt: "#FF2A1A",
} as const;

export function mapSky(id: MapId): number {
  return id === "potting" ? POTTING.sky : CISTERN.sky;
}

export function mapFog(id: MapId): number {
  return id === "potting" ? POTTING.fog : CISTERN.fog;
}

export function mapExposure(id: MapId): number {
  return id === "potting" ? 1.16 : 0.94;
}

export function mapEnvIntensity(id: MapId): number {
  return id === "potting" ? 0.58 : 0.26;
}
