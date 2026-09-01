import type { WeaponId } from "./types";

/**
 * Yardfrag gunfeel — original backyard-tool numbers.
 *
 * Arena ADS is a second gun, not a FOV slider:
 * - Hip is a loose cone with walk bob and yaw. ADS plants the same
 *   sight (carbine post / shotgun bead / DMR optic), kills sway,
 *   and slows look more than the zoom alone.
 * - Recoil is a kick you fight: it moves the shot and the look, then
 *   eases home. Punch is a short viewmodel snap that dies on its own.
 * - Three tools, three shapes: Clipper climbs a string, Scatterhose
 *   thumps each pump, Stake is one pitch that hangs. No spray tape.
 * - Jump, land, and sprint leftover are a tax you feel in the cone.
 *   Coming off sprint still fires; leftover is the wide cone, not a
 *   dead trigger.
 */
export type RecoilShape = "climb" | "thump" | "kick";

export interface GunTune {
  shape: RecoilShape;
  hipSpread: number;
  adsSpread: number;
  moveSpread: number;
  jumpSpread: number;
  bloomAdd: number;
  bloomMax: number;
  bloomDecay: number;
  firstSpread: number;
  followSpread: number;
  recoilPitch: number;
  recoilYaw: number;
  followPitch: number;
  followYaw: number;
  punchPitch: number;
  punchYaw: number;
  recoverKick: number;
  recoverPunch: number;
  recoverIdle: number;
  burstWindow: number;
  hipRecoil: number;
  adsRecoil: number;
  adsPunch: number;
  adsFov: number;
  adsTime: number;
  adsMove: number;
  adsLook: number;
  sprintDelay: number;
  sprintFadeRate: number;
  swapTime: number;
  raise: number;
  hipPos: readonly [number, number, number];
  adsPos: readonly [number, number, number];
  hipRot: readonly [number, number, number];
  adsRot: readonly [number, number, number];
}

export interface SpreadSample {
  ads: number;
  speed01: number;
  grounded: boolean;
  bloom: number;
  landInacc: number;
  sprintFade: number;
  charge: number;
  charged: boolean;
  burst: number;
}

export interface RecoilState {
  kickP: number;
  kickY: number;
  punchP: number;
  punchY: number;
  yawSign: number;
  burst: number;
  lastShot: number;
}

export const DEFAULT_HIP_FOV = 80;
export const LAND_FADE = 2.6;

export function freshRecoil(): RecoilState {
  return { kickP: 0, kickY: 0, punchP: 0, punchY: 0, yawSign: 1, burst: 0, lastShot: 1 };
}

export const FEEL: Record<WeaponId, GunTune> = {
  clipper: {
    shape: "climb",
    hipSpread: 0.044,
    adsSpread: 0.0022,
    moveSpread: 0.03,
    jumpSpread: 0.064,
    bloomAdd: 0.012,
    bloomMax: 0.072,
    bloomDecay: 3.1,
    firstSpread: 0.4,
    followSpread: 0.0038,
    recoilPitch: 0.042,
    recoilYaw: 0.007,
    followPitch: 0.014,
    followYaw: 0.0055,
    punchPitch: 0.026,
    punchYaw: 0.012,
    recoverKick: 2.5,
    recoverPunch: 11,
    recoverIdle: 5.8,
    burstWindow: 0.2,
    hipRecoil: 1.18,
    adsRecoil: 0.78,
    adsPunch: 0.48,
    adsFov: 50,
    adsTime: 0.17,
    adsMove: 0.46,
    adsLook: 0.7,
    sprintDelay: 0.22,
    sprintFadeRate: 3.4,
    swapTime: 0.42,
    raise: 0.06,
    hipPos: [0.36, -0.4, -0.12],
    adsPos: [0, -0.118, 0.04],
    hipRot: [0.22, 0.4, 0.14],
    adsRot: [0, 0, 0],
  },
  hose: {
    shape: "thump",
    hipSpread: 0.12,
    adsSpread: 0.038,
    moveSpread: 0.022,
    jumpSpread: 0.052,
    bloomAdd: 0.03,
    bloomMax: 0.095,
    bloomDecay: 1.7,
    firstSpread: 1,
    followSpread: 0.012,
    recoilPitch: 0.088,
    recoilYaw: 0.02,
    followPitch: 0.018,
    followYaw: 0.01,
    punchPitch: 0.058,
    punchYaw: 0.024,
    recoverKick: 2.0,
    recoverPunch: 7.2,
    recoverIdle: 4.4,
    burstWindow: 0.58,
    hipRecoil: 1.22,
    adsRecoil: 0.92,
    adsPunch: 0.72,
    adsFov: 62,
    adsTime: 0.21,
    adsMove: 0.56,
    adsLook: 0.84,
    sprintDelay: 0.32,
    sprintFadeRate: 2.6,
    swapTime: 0.5,
    raise: 0.045,
    hipPos: [0.38, -0.4, -0.08],
    adsPos: [0, -0.068, 0.08],
    hipRot: [0.2, 0.34, 0.12],
    adsRot: [0.01, 0, 0],
  },
  stake: {
    shape: "kick",
    hipSpread: 0.03,
    adsSpread: 0.0007,
    moveSpread: 0.02,
    jumpSpread: 0.05,
    bloomAdd: 0.016,
    bloomMax: 0.04,
    bloomDecay: 2.4,
    firstSpread: 0.52,
    followSpread: 0.01,
    recoilPitch: 0.078,
    recoilYaw: 0.012,
    followPitch: 0.01,
    followYaw: 0.005,
    punchPitch: 0.044,
    punchYaw: 0.016,
    recoverKick: 1.7,
    recoverPunch: 6.4,
    recoverIdle: 3.8,
    burstWindow: 0.72,
    hipRecoil: 1.08,
    adsRecoil: 0.86,
    adsPunch: 0.58,
    adsFov: 32,
    adsTime: 0.26,
    adsMove: 0.32,
    adsLook: 0.55,
    sprintDelay: 0.26,
    sprintFadeRate: 2.9,
    swapTime: 0.55,
    raise: 0.075,
    hipPos: [0.34, -0.38, -0.16],
    adsPos: [0, -0.086, 0.1],
    hipRot: [0.16, 0.3, 0.1],
    adsRot: [0, 0, 0],
  },
};

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function damp(cur: number, target: number, rate: number, dt: number): number {
  return lerp(cur, target, 1 - Math.exp(-rate * dt));
}

export function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Smootherstep — shared ADS weight for pose, FOV, look, and cone mix. */
export function adsWeight(ads: number): number {
  const t = clamp01(ads);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function stepAds(ads: number, want: boolean, time: number, dt: number): number {
  const span = Math.max(0.1, time);
  const rate = (want ? 3.35 : 3.9) / span;
  return damp(ads, want ? 1 : 0, rate, dt);
}

export function cone(feel: GunTune, s: SpreadSample): number {
  const aimed = lerp(feel.hipSpread, feel.adsSpread, adsWeight(s.ads));
  const move = feel.moveSpread * clamp01(s.speed01) * lerp(1, 0.28, adsWeight(s.ads));
  const air = s.grounded ? 0 : feel.jumpSpread * lerp(1, 0.42, adsWeight(s.ads));
  const land = s.landInacc * lerp(1, 0.38, adsWeight(s.ads));
  const sprint = feel.hipSpread * 1.2 * clamp01(s.sprintFade) * lerp(1, 0.3, adsWeight(s.ads));
  const first = s.burst <= 0 ? feel.firstSpread : 1;
  const follow = s.burst > 0 ? feel.followSpread * Math.min(7, s.burst) : 0;
  let spread = (aimed + move + air + land + sprint) * first + follow + s.bloom;
  if (s.charged) {
    const tight = lerp(0.55, 0.08, clamp01(s.charge));
    spread *= lerp(1, tight, 0.65 + adsWeight(s.ads) * 0.35);
  }
  return spread;
}

export function applyShotRecoil(r: RecoilState, feel: GunTune, ads: number): void {
  if (feel.shape === "thump") applyThump(r, feel, ads);
  else if (feel.shape === "kick") applyKick(r, feel, ads);
  else applyClimb(r, feel, ads);
}

/** Clipper: first shot honest, string steepens, yaw holds then weaves. */
function applyClimb(r: RecoilState, feel: GunTune, ads: number): void {
  if (r.lastShot > feel.burstWindow) {
    r.burst = 0;
    r.yawSign = Math.random() < 0.5 ? -1 : 1;
  }
  const n = r.burst;
  const plant = adsWeight(ads);
  const scale = lerp(feel.hipRecoil, feel.adsRecoil, plant);
  const yawMul = lerp(1.4, 0.42, plant);
  const first = n <= 0 ? 0.7 : 1;
  const climb = n <= 0 ? 0 : feel.followPitch * n * (1 + 0.28 * n);
  const pitch = feel.recoilPitch * first + climb;
  const yaw = (feel.recoilYaw + feel.followYaw * n) * r.yawSign;
  r.kickP += pitch * scale;
  r.kickY += yaw * yawMul * scale;
  r.punchP += feel.punchPitch * lerp(1.15, feel.adsPunch, plant) * (0.85 + Math.random() * 0.22);
  r.punchY += feel.punchYaw * r.yawSign * lerp(1.2, 0.38, plant) * (0.5 + Math.random() * 0.55);
  if (n >= 4 && Math.random() < 0.28) r.yawSign *= -1;
  r.burst += 1;
  r.lastShot = 0;
}

/** Scatterhose: one pump, one thump. No string. ADS is still a hose. */
function applyThump(r: RecoilState, feel: GunTune, ads: number): void {
  r.yawSign = Math.random() < 0.5 ? -1 : 1;
  const plant = adsWeight(ads);
  const scale = lerp(feel.hipRecoil, feel.adsRecoil, plant);
  r.kickP += feel.recoilPitch * scale;
  r.kickY += feel.recoilYaw * r.yawSign * lerp(1.2, 0.72, plant) * scale;
  r.punchP += feel.punchPitch * lerp(1.4, feel.adsPunch, plant);
  r.punchY += feel.punchYaw * r.yawSign * lerp(1.15, 0.58, plant) * (0.55 + Math.random() * 0.5);
  r.burst = 1;
  r.lastShot = 0;
}

/** Stake: one shot, one pitch. Recover hangs. Charge does not live here. */
function applyKick(r: RecoilState, feel: GunTune, ads: number): void {
  r.yawSign = Math.random() < 0.5 ? -1 : 1;
  const plant = adsWeight(ads);
  const scale = lerp(feel.hipRecoil, feel.adsRecoil, plant);
  r.kickP = feel.recoilPitch * scale;
  r.kickY = feel.recoilYaw * r.yawSign * lerp(1.08, 0.36, plant) * scale;
  r.punchP = feel.punchPitch * lerp(1.2, feel.adsPunch, plant);
  r.punchY = feel.punchYaw * r.yawSign * lerp(1.05, 0.32, plant);
  r.burst = 1;
  r.lastShot = 0;
}

export function recoverRecoil(r: RecoilState, feel: GunTune, dt: number): void {
  r.lastShot += dt;
  if (r.lastShot > feel.burstWindow) r.burst = 0;
  let kickRate: number;
  if (feel.shape === "kick") {
    kickRate = feel.recoverKick;
  } else if (feel.shape === "thump") {
    kickRate = feel.recoverKick + feel.recoverIdle;
  } else {
    const climbing = r.lastShot < feel.burstWindow;
    kickRate = feel.recoverKick + (climbing ? 0 : feel.recoverIdle);
  }
  r.kickP = damp(r.kickP, 0, kickRate, dt);
  r.kickY = damp(r.kickY, 0, kickRate, dt);
  r.punchP = damp(r.punchP, 0, feel.recoverPunch, dt);
  r.punchY = damp(r.punchY, 0, feel.recoverPunch, dt);
}

export function lookScale(
  hipFov: number,
  adsFov: number,
  ads: number,
  adsSens: number,
  adsLook: number,
): number {
  const t = adsWeight(ads);
  const fovRatio = lerp(1, adsFov / Math.max(40, hipFov), t);
  const user = lerp(1, adsSens, t);
  const plant = lerp(1, adsLook, t);
  return fovRatio * user * plant;
}

export function poseLerp(
  feel: GunTune,
  ads: number,
): { px: number; py: number; pz: number; rx: number; ry: number; rz: number } {
  const t = adsWeight(ads);
  const lift = feel.raise * Math.sin(Math.PI * t);
  const pull = feel.raise * 0.35 * Math.sin(Math.PI * t);
  return {
    px: lerp(feel.hipPos[0], feel.adsPos[0], t),
    py: lerp(feel.hipPos[1], feel.adsPos[1], t) + lift,
    pz: lerp(feel.hipPos[2], feel.adsPos[2], t) + pull,
    rx: lerp(feel.hipRot[0], feel.adsRot[0], t),
    ry: lerp(feel.hipRot[1], feel.adsRot[1], t),
    rz: lerp(feel.hipRot[2], feel.adsRot[2], t),
  };
}

export function crosshairGap(spread: number, ads: number): number {
  const hip = 7 + spread * 560;
  return lerp(hip, 1.6, adsWeight(ads));
}
