import { DEFAULT_SKINS, resolveSkinId } from "./skins";
import type { Persist, PersistStats } from "./types";

const KEY = "yardfrag-v1";

const DEFAULT_STATS: PersistStats = {
  kills: 0,
  deaths: 0,
  seconds: 0,
  matches: 0,
};

export const DEFAULT_PERSIST: Persist = {
  sensitivity: 1,
  volume: 0.7,
  invertY: false,
  adsSensitivity: 0.85,
  adsToggle: false,
  fov: 80,
  skins: { ...DEFAULT_SKINS },
  stats: { ...DEFAULT_STATS },
};

export function loadPersist(): Persist {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_PERSIST);
    const parsed = JSON.parse(raw) as Partial<Persist>;
    return {
      sensitivity: clampNum(parsed.sensitivity, 0.25, 2.4, 1),
      volume: clampNum(parsed.volume, 0, 1, 0.7),
      invertY: Boolean(parsed.invertY),
      adsSensitivity: clampNum(parsed.adsSensitivity, 0.35, 1.4, 0.85),
      adsToggle: Boolean(parsed.adsToggle),
      fov: clampNum(parsed.fov, 70, 100, 80),
      skins: readSkins(parsed.skins),
      stats: {
        kills: Math.max(0, parsed.stats?.kills ?? 0),
        deaths: Math.max(0, parsed.stats?.deaths ?? 0),
        seconds: Math.max(0, parsed.stats?.seconds ?? 0),
        matches: Math.max(0, parsed.stats?.matches ?? 0),
      },
    };
  } catch {
    return structuredClone(DEFAULT_PERSIST);
  }
}

export function savePersist(data: Persist): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function formatCareer(stats: PersistStats): string {
  const m = Math.floor(stats.seconds / 60);
  return `Career — ${stats.kills} frags / ${stats.deaths} falls / ${m} min in the yard / ${stats.matches} matches`;
}

function readSkins(raw: Persist["skins"] | undefined): Persist["skins"] {
  const src = raw ?? DEFAULT_SKINS;
  return {
    clipper: resolveSkinId("clipper", src.clipper),
    hose: resolveSkinId("hose", src.hose),
    stake: resolveSkinId("stake", src.stake),
  };
}

function clampNum(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === "number" ? value : fallback;
  return Math.min(max, Math.max(min, n));
}
