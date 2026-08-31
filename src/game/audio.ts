import type { WeaponId } from "./types";

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private volume = 0.7;
  private charge: { osc: OscillatorNode; gain: GainNode } | null = null;
  private footAcc = 0;

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  async resume(): Promise<void> {
    const ctx = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
  }

  fire(id: WeaponId): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    if (id === "clipper") {
      this.noiseBurst(t, 0.07, 1800, 900, 0.45);
      this.tone(t, 220, 90, 0.05, "square", 0.08);
    } else if (id === "hose") {
      this.noiseBurst(t, 0.16, 900, 200, 0.7);
      this.tone(t, 80, 40, 0.1, "sawtooth", 0.12);
    } else {
      this.noiseBurst(t, 0.12, 2400, 400, 0.55);
      this.tone(t, 140, 50, 0.09, "triangle", 0.16);
      this.tone(t, 880, 220, 0.04, "sine", 0.05);
    }
  }

  startCharge(): void {
    this.stopCharge();
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(620, ctx.currentTime + 0.72);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09 * this.volume + 0.0001, ctx.currentTime + 0.72);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start();
    this.charge = { osc, gain };
  }

  stopCharge(): void {
    if (!this.charge) return;
    try {
      this.charge.osc.stop();
    } catch {
      /* already stopped */
    }
    this.charge = null;
  }

  reload(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 420, 280, 0.06, "square", 0.05);
    this.tone(ctx.currentTime + 0.08, 320, 200, 0.07, "square", 0.04);
    this.noiseBurst(ctx.currentTime + 0.02, 0.05, 900, 240, 0.08);
  }

  reloadSeat(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 260, 200, 0.05, "triangle", 0.05);
    this.noiseBurst(ctx.currentTime, 0.04, 160, 70, 0.1);
  }

  ads(into: boolean): void {
    const ctx = this.ensure();
    if (into) {
      this.noiseBurst(ctx.currentTime, 0.06, 400, 140, 0.08);
      this.tone(ctx.currentTime, 220, 140, 0.05, "sine", 0.03);
    } else {
      this.noiseBurst(ctx.currentTime, 0.05, 180, 80, 0.06);
    }
  }

  swap(down: boolean): void {
    const ctx = this.ensure();
    if (down) {
      this.tone(ctx.currentTime, 180, 90, 0.07, "sine", 0.05);
      this.noiseBurst(ctx.currentTime, 0.05, 220, 80, 0.07);
    } else {
      this.tone(ctx.currentTime, 140, 240, 0.07, "sine", 0.05);
    }
  }

  hit(head: boolean): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, head ? 920 : 540, head ? 420 : 180, 0.05, "square", head ? 0.08 : 0.05);
  }

  hurt(): void {
    this.noiseBurst(this.ensure().currentTime, 0.12, 400, 80, 0.4);
  }

  jump(): void {
    this.tone(this.ensure().currentTime, 180, 90, 0.08, "sine", 0.06);
  }

  land(hard: boolean): void {
    const ctx = this.ensure();
    this.noiseBurst(ctx.currentTime, hard ? 0.14 : 0.06, hard ? 260 : 180, 50, hard ? 0.42 : 0.2);
    this.tone(ctx.currentTime, hard ? 90 : 120, 50, hard ? 0.1 : 0.05, "sine", hard ? 0.08 : 0.04);
  }

  death(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 220, 70, 0.4, "sawtooth", 0.12);
  }

  kill(): void {
    const ctx = this.ensure();
    this.tone(ctx.currentTime, 523, 523, 0.08, "triangle", 0.07);
    this.tone(ctx.currentTime + 0.09, 784, 784, 0.1, "triangle", 0.07);
  }

  foot(dt: number, moving: boolean, sprint: boolean): void {
    if (!moving) {
      this.footAcc = 0;
      return;
    }
    this.footAcc += dt * (sprint ? 3.3 : 2.4);
    if (this.footAcc < 1) return;
    this.footAcc = 0;
    const ctx = this.ensure();
    this.noiseBurst(ctx.currentTime, sprint ? 0.045 : 0.035, sprint ? 220 : 160, 55, sprint ? 0.14 : 0.09);
    this.tone(ctx.currentTime, sprint ? 95 : 80, 55, 0.03, "sine", sprint ? 0.035 : 0.022);
  }

  ui(): void {
    this.tone(this.ensure().currentTime, 660, 440, 0.04, "sine", 0.04);
  }

  private ensure(): AudioContext {
    if (this.ctx && this.master && this.noise) return this.ctx;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = this.volume;
    master.connect(ctx.destination);
    const data = new Float32Array(ctx.sampleRate * 1);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBuffer(1, data.length, ctx.sampleRate);
    noise.getChannelData(0).set(data);
    this.ctx = ctx;
    this.master = master;
    this.noise = noise;
    return ctx;
  }

  private noiseBurst(
    t: number,
    dur: number,
    startHz: number,
    endHz: number,
    gain: number,
  ): void {
    const ctx = this.ensure();
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(startHz, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endHz), t + dur);
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain * this.volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master!);
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
    osc.frequency.setValueAtTime(start, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + dur);
    g.gain.setValueAtTime(gain * this.volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
}
