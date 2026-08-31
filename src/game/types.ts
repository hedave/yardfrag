export type MapId = "potting" | "cistern";
export type Difficulty = "laidback" | "mean";
export type WeaponId = "clipper" | "hose" | "stake";
export type Phase = "menu" | "playing" | "paused" | "deathcam" | "results";

export interface SpawnPoint {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface MiniRect {
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
}

export interface PersistStats {
  kills: number;
  deaths: number;
  seconds: number;
  matches: number;
}

export interface Persist {
  sensitivity: number;
  volume: number;
  invertY: boolean;
  adsSensitivity: number;
  adsToggle: boolean;
  fov: number;
  stats: PersistStats;
}

export const BOT_NAMES = [
  "Mulch",
  "Thistle",
  "Ivy",
  "Pollen",
  "Bramble",
] as const;

export const PLAYER_NAME = "You";

export const FRAG_LIMIT = 20;
export const MATCH_SECONDS = 6 * 60;
export const BOT_COUNT = 5;
