import type { WeaponId } from "./types";

/** One bus so menu ticks and in-match SFX share volume. */
let shared: Sfx | null = null;

/**
 * Original synthesized yard mix. No sample packs.
 * Gains are absolute; user volume lives only on the master.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private white: AudioBuffer | null = null;
  private dirt: AudioBuffer | null = null;
  private volume = 0.7;
  private charge: { osc: OscillatorNode; gain: GainNode } | null = null;
  private footAcc = 0;
  private lastFoot = 0;

  constructor() {
    if (shared) return shared;
    shared = this;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }

  async resume(): Promise<void> {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
  }

  fire(id: WeaponId): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    if (id === "clipper") {
      this.burst(this.white, t, 0.05, 2400, 780, 0.28, 1.1);
      this.tone(t, 340, 160, 0.04, "square", 0.055);
      this.tone(t, 1680, 820, 0.03, "sine", 0.03);
    } else if (id === "hose") {
      this.burst(this.white, t, 0.13, 780, 140, 0.34, 0.7);
      this.burst(this.dirt, t, 0.1, 420, 90, 0.2, 0.5);
      this.tone(t, 72, 38, 0.1, "sine", 0.14);
      this.tone(t, 210, 70, 0.07, "triangle", 0.05);
    } else {
      this.burst(this.white, t, 0.09, 2800, 360, 0.3, 0.9);
      this.tone(t, 150, 62, 0.1, "triangle", 0.12);
      this.tone(t, 1240, 740, 0.07, "sine", 0.045);
    }
  }

  startCharge(): void {
    this.stopCharge();
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(540, ctx.currentTime + 0.72);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.72);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start();
    this.charge = { osc, gain };
  }

  stopCharge(): void {
    if (!this.charge) return;
    const { osc, gain } = this.charge;
    const ctx = this.ensure();
    try {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    }
    this.charge = null;
  }

  reload(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 390, 250, 0.055, "square", 0.04);
    this.tone(ctx.currentTime + 0.07, 300, 190, 0.06, "square", 0.032);
    this.burst(this.dirt, ctx.currentTime + 0.02, 0.045, 700, 180, 0.07, 0.6);
  }

  reloadSeat(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 240, 180, 0.05, "triangle", 0.04);
    this.burst(this.dirt, ctx.currentTime, 0.04, 150, 60, 0.08, 0.5);
  }

  ads(into: boolean): void {
    const ctx = this.ensure();
    if (into) {
      this.burst(this.dirt, ctx.currentTime, 0.07, 380, 110, 0.07, 0.55);
      this.tone(ctx.currentTime, 210, 140, 0.055, "sine", 0.028);
    } else {
      this.burst(this.dirt, ctx.currentTime, 0.05, 200, 70, 0.05, 0.45);
    }
  }

  swap(down: boolean): void {
    const ctx = this.ensure();
    if (down) {
      this.tone(ctx.currentTime, 170, 90, 0.07, "sine", 0.04);
      this.burst(this.dirt, ctx.currentTime, 0.05, 200, 70, 0.06, 0.5);
    } else {
      this.tone(ctx.currentTime, 130, 220, 0.07, "sine", 0.04);
      this.burst(this.white, ctx.currentTime + 0.03, 0.03, 900, 400, 0.04, 0.7);
    }
  }

  hit(head: boolean): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    if (head) {
      this.tone(t, 1480, 880, 0.07, "sine", 0.08);
      this.tone(t, 880, 420, 0.04, "square", 0.035);
      this.burst(this.white, t, 0.03, 2200, 700, 0.05, 1.2);
    } else {
      this.tone(t, 190, 88, 0.055, "sine", 0.07);
      this.burst(this.dirt, t, 0.04, 420, 140, 0.06, 0.6);
    }
  }

  hurt(): void {
    const ctx = this.ensure();
    this.burst(this.white, ctx.currentTime, 0.12, 360, 70, 0.2, 0.5);
    this.tone(ctx.currentTime, 92, 48, 0.12, "sine", 0.07);
  }

  jump(): void {
    this.tone(this.ensure().currentTime, 170, 88, 0.07, "sine", 0.05);
  }

  land(hard: boolean): void {
    const ctx = this.ensure();
    this.burst(this.dirt, ctx.currentTime, hard ? 0.12 : 0.055, hard ? 240 : 160, 48, hard ? 0.28 : 0.14, 0.45);
    this.tone(ctx.currentTime, hard ? 84 : 118, 46, hard ? 0.09 : 0.045, "sine", hard ? 0.07 : 0.032);
  }

  death(): void {
    const ctx = this.ensure();
    this.burst(this.dirt, ctx.currentTime, 0.32, 520, 70, 0.2, 0.4);
    this.tone(ctx.currentTime, 210, 58, 0.42, "triangle", 0.09);
  }

  kill(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 622, 622, 0.07, "triangle", 0.055);
    this.tone(ctx.currentTime + 0.08, 830, 830, 0.1, "triangle", 0.06);
    this.burst(this.white, ctx.currentTime, 0.03, 1400, 600, 0.04, 0.8);
  }

  foot(dt: number, moving: boolean, sprint: boolean): void {
    if (!moving) {
      this.footAcc = 0;
      return;
    }
    this.footAcc += dt * (sprint ? 3.15 : 2.25);
    if (this.footAcc < 1) return;
    this.footAcc = 0;
    const ctx = this.ensure();
    const t = ctx.currentTime;
    if (t - this.lastFoot < 0.16) return;
    this.lastFoot = t;
    const jitter = 0.82 + Math.random() * 0.36;
    this.burst(
      this.dirt,
      t,
      sprint ? 0.04 : 0.032,
      (sprint ? 210 : 150) * jitter,
      48 * jitter,
      sprint ? 0.13 : 0.085,
      0.45,
    );
    this.tone(t, (sprint ? 88 : 72) * jitter, 50, 0.025, "sine", sprint ? 0.028 : 0.018);
  }

  ui(): void {
    this.click();
  }

  click(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 700, 440, 0.04, "sine", 0.032);
  }

  hover(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 840, 840, 0.018, "sine", 0.014);
  }

  preview(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 520, 360, 0.05, "triangle", 0.045);
    this.burst(this.dirt, ctx.currentTime, 0.04, 280, 90, 0.07, 0.5);
  }

  private ensure(): AudioContext {
    if (this.ctx && this.master && this.white && this.dirt) return this.ctx;
    const ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 14;
    comp.ratio.value = 5.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;
    const master = ctx.createGain();
    master.gain.value = this.volume;
    comp.connect(master);
    master.connect(ctx.destination);
    const white = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const w = white.getChannelData(0);
    for (let i = 0; i < w.length; i++) w[i] = Math.random() * 2 - 1;
    const dirt = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = dirt.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.12) * 0.94;
      d[i] = Math.max(-1, Math.min(1, last * 3.2));
    }
    this.ctx = ctx;
    this.master = master;
    this.white = white;
    this.dirt = dirt;
    this.bus = comp;
    return ctx;
  }

  private bus: DynamicsCompressorNode | null = null;

  private burst(
    buf: AudioBuffer | null,
    t: number,
    dur: number,
    startHz: number,
    endHz: number,
    gain: number,
    q: number,
  ): void {
    const ctx = this.ensure();
    const src = ctx.createBufferSource();
    src.buffer = buf ?? this.white;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(Math.max(40, startHz), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endHz), t + dur);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.bus ?? this.master!);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private tone(
    t: number,
    start: number,
    end: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, start), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.bus ?? this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}
