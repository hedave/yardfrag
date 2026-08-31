import type { WeaponId } from "./types";

/**
 * Yardfrag gunfeel — original backyard-tool numbers.
 *
 * Principles (arena / Source / modern ADS), not a copy of any title:
 * - Hip fire is a cone you spray into. ADS is a second aim: tighter cone,
 *   slower look, FOV in, viewmodel on the sight line.
 * - Recoil kicks the shot direction; view punch is a short camera snap that
 *   dies on its own. Recovery is exponential, not a canned spray tape.
 * - Sprint and ADS fight each other. Coming out of a sprint is not accurate.
 * - Jump / land bloom is a tax, not a ban.
 */
export interface GunTune {
  hipSpread: number;
  adsSpread: number;
  moveSpread: number;
  jumpSpread: number;
  bloomAdd: number;
  bloomMax: number;
  bloomDecay: number;
  recoilPitch: number;
  recoilYaw: number;
  punchPitch: number;
  punchYaw: number;
  recoverKick: number;
  recoverPunch: number;
  adsFov: number;
  adsTime: number;
  adsMove: number;
  sprintDelay: number;
  swapTime: number;
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
  ready: number;
  charge: number;
  charged: boolean;
}

export interface RecoilState {
  kickP: number;
  kickY: number;
  punchP: number;
  punchY: number;
  yawSign: number;
}

export const DEFAULT_HIP_FOV = 80;

export const FEEL: Record<WeaponId, GunTune> = {
  clipper: {
    hipSpread: 0.032,
    adsSpread: 0.0032,
    moveSpread: 0.02,
    jumpSpread: 0.048,
    bloomAdd: 0.0075,
    bloomMax: 0.055,
    bloomDecay: 4.2,
    recoilPitch: 0.013,
    recoilYaw: 0.0045,
    punchPitch: 0.01,
    punchYaw: 0.004,
    recoverKick: 7.5,
    recoverPunch: 14,
    adsFov: 52,
    adsTime: 0.2,
    adsMove: 0.58,
    sprintDelay: 0.18,
    swapTime: 0.42,
    hipPos: [0.3, -0.3, -0.06],
    adsPos: [0, -0.118, 0.04],
    hipRot: [0.14, 0.32, 0.1],
    adsRot: [0, 0, 0],
  },
  hose: {
    hipSpread: 0.1,
    adsSpread: 0.044,
    moveSpread: 0.016,
    jumpSpread: 0.04,
    bloomAdd: 0.02,
    bloomMax: 0.08,
    bloomDecay: 2.4,
    recoilPitch: 0.034,
    recoilYaw: 0.01,
    punchPitch: 0.028,
    punchYaw: 0.012,
    recoverKick: 5.2,
    recoverPunch: 10,
    adsFov: 58,
    adsTime: 0.26,
    adsMove: 0.5,
    sprintDelay: 0.3,
    swapTime: 0.5,
    hipPos: [0.32, -0.32, -0.04],
    adsPos: [0, -0.068, 0.08],
    hipRot: [0.16, 0.28, 0.08],
    adsRot: [0.01, 0, 0],
  },
  stake: {
    hipSpread: 0.024,
    adsSpread: 0.0009,
    moveSpread: 0.014,
    jumpSpread: 0.038,
    bloomAdd: 0.01,
    bloomMax: 0.03,
    bloomDecay: 3.1,
    recoilPitch: 0.04,
    recoilYaw: 0.006,
    punchPitch: 0.022,
    punchYaw: 0.008,
    recoverKick: 4.4,
    recoverPunch: 9,
    adsFov: 34,
    adsTime: 0.32,
    adsMove: 0.4,
    sprintDelay: 0.24,
    swapTime: 0.55,
    hipPos: [0.28, -0.28, -0.1],
    adsPos: [0, -0.086, 0.1],
    hipRot: [0.1, 0.22, 0.06],
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

export function stepAds(ads: number, want: boolean, time: number, dt: number): number {
  const rate = 1 / Math.max(0.08, time);
  if (want) return Math.min(1, ads + dt * rate);
  return Math.max(0, ads - dt * rate * 1.15);
}

export function cone(feel: GunTune, s: SpreadSample): number {
  const aimed = lerp(feel.hipSpread, feel.adsSpread, clamp01(s.ads));
  const move = feel.moveSpread * clamp01(s.speed01) * lerp(1, 0.4, s.ads);
  const air = s.grounded ? 0 : feel.jumpSpread;
  const fromSprint = s.ready > 0.02 ? feel.hipSpread * 0.9 : 0;
  let spread = aimed + move + air + s.landInacc + s.bloom + fromSprint;
  if (s.charged) {
    const tight = lerp(0.55, 0.08, clamp01(s.charge));
    spread *= lerp(1, tight, 0.65 + s.ads * 0.35);
  }
  return spread;
}

export function applyShotRecoil(r: RecoilState, feel: GunTune): void {
  r.yawSign *= -1;
  if (Math.random() < 0.18) r.yawSign *= -1;
  r.kickP += feel.recoilPitch;
  r.kickY += feel.recoilYaw * r.yawSign * (0.55 + Math.random() * 0.7);
  r.punchP += feel.punchPitch * (0.75 + Math.random() * 0.4);
  r.punchY += feel.punchYaw * r.yawSign * (0.4 + Math.random() * 0.8);
}

export function recoverRecoil(r: RecoilState, feel: GunTune, dt: number): void {
  r.kickP = damp(r.kickP, 0, feel.recoverKick, dt);
  r.kickY = damp(r.kickY, 0, feel.recoverKick, dt);
  r.punchP = damp(r.punchP, 0, feel.recoverPunch, dt);
  r.punchY = damp(r.punchY, 0, feel.recoverPunch, dt);
}

export function lookScale(
  hipFov: number,
  adsFov: number,
  ads: number,
  adsSens: number,
): number {
  const fovRatio = lerp(1, adsFov / Math.max(40, hipFov), clamp01(ads));
  const user = lerp(1, adsSens, clamp01(ads));
  return fovRatio * user;
}

export function poseLerp(
  feel: GunTune,
  ads: number,
): { px: number; py: number; pz: number; rx: number; ry: number; rz: number } {
  const t = smooth(clamp01(ads));
  return {
    px: lerp(feel.hipPos[0], feel.adsPos[0], t),
    py: lerp(feel.hipPos[1], feel.adsPos[1], t),
    pz: lerp(feel.hipPos[2], feel.adsPos[2], t),
    rx: lerp(feel.hipRot[0], feel.adsRot[0], t),
    ry: lerp(feel.hipRot[1], feel.adsRot[1], t),
    rz: lerp(feel.hipRot[2], feel.adsRot[2], t),
  };
}

export function crosshairGap(spread: number, ads: number): number {
  const hip = 6 + spread * 520;
  return lerp(hip, 2, clamp01(ads));
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
