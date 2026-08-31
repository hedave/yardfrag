export class AABB {
  constructor(
    public minX: number,
    public minY: number,
    public minZ: number,
    public maxX: number,
    public maxY: number,
    public maxZ: number,
  ) {}

  static fromCenter(
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
  ): AABB {
    const hx = sx * 0.5;
    const hy = sy * 0.5;
    const hz = sz * 0.5;
    return new AABB(cx - hx, cy - hy, cz - hz, cx + hx, cy + hy, cz + hz);
  }

  get cx(): number {
    return (this.minX + this.maxX) * 0.5;
  }
  get cy(): number {
    return (this.minY + this.maxY) * 0.5;
  }
  get cz(): number {
    return (this.minZ + this.maxZ) * 0.5;
  }
}

export interface HitInfo {
  t: number;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

const EPS = 1e-6;

export function overlaps(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
  b: AABB,
): boolean {
  return (
    maxX > b.minX + EPS &&
    minX < b.maxX - EPS &&
    maxY > b.minY + EPS &&
    minY < b.maxY - EPS &&
    maxZ > b.minZ + EPS &&
    minZ < b.maxZ - EPS
  );
}

export function resolveAxis(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
  b: AABB,
  axis: "x" | "y" | "z",
): number {
  if (!overlaps(minX, minY, minZ, maxX, maxY, maxZ, b)) return 0;
  if (axis === "x") {
    const left = b.minX - maxX;
    const right = b.maxX - minX;
    return Math.abs(left) < Math.abs(right) ? left : right;
  }
  if (axis === "y") {
    const down = b.minY - maxY;
    const up = b.maxY - minY;
    return Math.abs(down) < Math.abs(up) ? down : up;
  }
  const back = b.minZ - maxZ;
  const fwd = b.maxZ - minZ;
  return Math.abs(back) < Math.abs(fwd) ? back : fwd;
}

export function moveBody(
  px: number,
  py: number,
  pz: number,
  vx: number,
  vy: number,
  vz: number,
  hx: number,
  hy: number,
  hz: number,
  dt: number,
  colliders: AABB[],
): { px: number; py: number; pz: number; vx: number; vy: number; vz: number; grounded: boolean } {
  px += vx * dt;
  ({ px } = slide(px, py, pz, hx, hy, hz, colliders, "x"));
  pz += vz * dt;
  ({ pz } = slide(px, py, pz, hx, hy, hz, colliders, "z"));
  py += vy * dt;
  const beforeY = py;
  const slid = slide(px, py, pz, hx, hy, hz, colliders, "y");
  py = slid.py;
  const grounded = vy <= 0 && py > beforeY - 1e-5 && py !== beforeY;
  if (grounded) vy = 0;
  else if (py < beforeY && vy > 0) vy = 0;
  return { px, py, pz, vx, vy, vz, grounded };
}

function slide(
  px: number,
  py: number,
  pz: number,
  hx: number,
  hy: number,
  hz: number,
  colliders: AABB[],
  axis: "x" | "y" | "z",
): { px: number; py: number; pz: number } {
  const minX = px - hx;
  const maxX = px + hx;
  const minY = py;
  const maxY = py + hy * 2;
  const minZ = pz - hz;
  const maxZ = pz + hz;
  for (const b of colliders) {
    const d = resolveAxis(minX, minY, minZ, maxX, maxY, maxZ, b, axis);
    if (d === 0) continue;
    if (axis === "x") px += d;
    else if (axis === "y") py += d;
    else pz += d;
  }
  return { px, py, pz };
}

/** Slab ray vs AABB. Returns t along a unit-ish dir; dir should be normalized. */
export function onGround(
  px: number,
  py: number,
  pz: number,
  hx: number,
  hz: number,
  colliders: AABB[],
): boolean {
  const minY = py - 0.08;
  const maxY = py + 0.04;
  for (const b of colliders) {
    if (overlaps(px - hx, minY, pz - hz, px + hx, maxY, pz + hz, b)) return true;
  }
  return false;
}

export function rayAABB(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  b: AABB,
  maxT: number,
): HitInfo | null {
  let tEnter = -Infinity;
  let tExit = Infinity;
  let nx = 0;
  let ny = 1;
  let nz = 0;

  const slab = (
    o: number,
    d: number,
    min: number,
    max: number,
    ax: number,
    ay: number,
    az: number,
  ): boolean => {
    if (Math.abs(d) < 1e-9) return o >= min && o <= max;
    const inv = 1 / d;
    let t1 = (min - o) * inv;
    let t2 = (max - o) * inv;
    let n1x = -ax;
    let n1y = -ay;
    let n1z = -az;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
      n1x = ax;
      n1y = ay;
      n1z = az;
    }
    if (t1 > tEnter) {
      tEnter = t1;
      nx = n1x;
      ny = n1y;
      nz = n1z;
    }
    tExit = Math.min(tExit, t2);
    return tExit >= tEnter;
  };

  if (!slab(ox, dx, b.minX, b.maxX, 1, 0, 0)) return null;
  if (!slab(oy, dy, b.minY, b.maxY, 0, 1, 0)) return null;
  if (!slab(oz, dz, b.minZ, b.maxZ, 0, 0, 1)) return null;
  if (tExit < 0 || tEnter > maxT) return null;
  const t = tEnter < 0 ? 0 : tEnter;
  return { t, x: ox + dx * t, y: oy + dy * t, z: oz + dz * t, nx, ny, nz };
}

export function rayWorld(
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxT: number,
  colliders: AABB[],
): HitInfo | null {
  let best: HitInfo | null = null;
  for (const b of colliders) {
    const hit = rayAABB(ox, oy, oz, dx, dy, dz, b, maxT);
    if (!hit) continue;
    if (!best || hit.t < best.t) best = hit;
  }
  return best;
}

export function losClear(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  colliders: AABB[],
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const dz = bz - az;
  const dist = Math.hypot(dx, dy, dz);
  if (dist < 0.001) return true;
  const inv = 1 / dist;
  const hit = rayWorld(ax, ay, az, dx * inv, dy * inv, dz * inv, dist - 0.2, colliders);
  return !hit;
}
