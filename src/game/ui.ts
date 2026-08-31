import { Sfx } from "./audio";
import type { Difficulty, MapId, Persist } from "./types";
import { type WeaponState, WEAPONS } from "./weapons";

export interface ScoreRow {
  name: string;
  kills: number;
  deaths: number;
  me: boolean;
}

export class UI {
  readonly menu = document.getElementById("menu")!;
  readonly hud = document.getElementById("hud")!;
  readonly touch = document.getElementById("touch")!;
  readonly hint = document.getElementById("hint")!;
  readonly scoreboard = document.getElementById("scoreboard")!;
  readonly deathBanner = document.getElementById("death-banner")!;
  readonly killfeed = document.getElementById("killfeed")!;
  readonly hitmarker = document.getElementById("hitmarker")!;
  readonly headpip = document.getElementById("headpip")!;
  readonly crosshair = document.getElementById("crosshair")!;
  readonly sightIron = document.getElementById("sight-iron");
  readonly vignette = document.getElementById("vignette")!;
  readonly hurt = document.getElementById("hurt")!;
  readonly flashEl = document.getElementById("flash")!;
  readonly center = document.getElementById("center-msg")!;
  readonly minimap = document.getElementById("minimap") as HTMLCanvasElement;
  readonly compass = document.getElementById("compass-track")!;
  readonly selMap = document.getElementById("sel-map") as HTMLSelectElement;
  readonly selDiff = document.getElementById("sel-diff") as HTMLSelectElement;

  onStart: ((map: MapId, diff: Difficulty) => void) | null = null;
  onQuit: (() => void) | null = null;
  onResume: (() => void) | null = null;
  onPreview: ((map: MapId) => void) | null = null;
  onSettings: ((p: Persist) => void) | null = null;

  private persist!: Persist;
  private fromPause = false;
  private feedTimer: number[] = [];
  private hitT = 0;
  private msgT = 0;
  private lastPreview = 0;
  private readonly sfx = new Sfx();
  private compassReady = false;

  constructor() {
    this.bind();
  }

  bind(): void {
    const go = (id: string) => this.showPanel(id);
    document.getElementById("btn-play")!.onclick = () => go("panel-setup");
    document.getElementById("btn-settings")!.onclick = () => {
      this.fromPause = false;
      go("panel-settings");
    };
    document.getElementById("btn-credits")!.onclick = () => go("panel-credits");
    document.getElementById("btn-setup-back")!.onclick = () => go("panel-home");
    document.getElementById("btn-settings-back")!.onclick = () =>
      go(this.fromPause ? "panel-pause" : "panel-home");
    document.getElementById("btn-credits-back")!.onclick = () => go("panel-home");
    document.getElementById("btn-start")!.onclick = () => {
      this.onStart?.(this.selMap.value as MapId, this.selDiff.value as Difficulty);
    };
    document.getElementById("btn-resume")!.onclick = () => this.onResume?.();
    document.getElementById("btn-pause-settings")!.onclick = () => {
      this.fromPause = true;
      go("panel-settings");
    };
    document.getElementById("btn-quit")!.onclick = () => this.onQuit?.();
    document.getElementById("btn-again")!.onclick = () => {
      this.onStart?.(this.selMap.value as MapId, this.selDiff.value as Difficulty);
    };
    document.getElementById("btn-results-home")!.onclick = () => {
      this.showMenu("home");
      this.onQuit?.();
    };
    this.selMap.onchange = () => this.onPreview?.(this.selMap.value as MapId);

    const sens = document.getElementById("rng-sens") as HTMLInputElement;
    const ads = document.getElementById("rng-ads") as HTMLInputElement;
    const fov = document.getElementById("rng-fov") as HTMLInputElement;
    const vol = document.getElementById("rng-vol") as HTMLInputElement;
    const inv = document.getElementById("chk-invert") as HTMLInputElement;
    const toggle = document.getElementById("chk-ads-toggle") as HTMLInputElement;
    const emit = () => {
      this.persist.sensitivity = Number(sens.value);
      this.persist.adsSensitivity = Number(ads.value);
      this.persist.fov = Number(fov.value);
      this.persist.volume = Number(vol.value);
      this.persist.invertY = inv.checked;
      this.persist.adsToggle = toggle.checked;
      this.syncSettingsLabels();
      this.onSettings?.(this.persist);
    };
    sens.oninput = emit;
    ads.oninput = emit;
    fov.oninput = emit;
    vol.oninput = () => {
      emit();
      const now = performance.now();
      if (now - this.lastPreview > 90) {
        this.lastPreview = now;
        void this.sfx.resume();
        this.sfx.setVolume(this.persist.volume);
        this.sfx.preview();
      }
    };
    inv.onchange = emit;
    toggle.onchange = emit;

    this.menu.querySelectorAll(".btn").forEach((el) => {
      el.addEventListener("pointerenter", () => this.sfx.hover());
      el.addEventListener("click", () => {
        void this.sfx.resume();
        this.sfx.click();
      });
    });
    this.menu.querySelectorAll("select").forEach((el) => {
      el.addEventListener("change", () => {
        void this.sfx.resume();
        this.sfx.click();
      });
    });
  }

  loadPersist(p: Persist): void {
    this.persist = p;
    (document.getElementById("rng-sens") as HTMLInputElement).value = String(p.sensitivity);
    (document.getElementById("rng-ads") as HTMLInputElement).value = String(p.adsSensitivity);
    (document.getElementById("rng-fov") as HTMLInputElement).value = String(p.fov);
    (document.getElementById("rng-vol") as HTMLInputElement).value = String(p.volume);
    (document.getElementById("chk-invert") as HTMLInputElement).checked = p.invertY;
    (document.getElementById("chk-ads-toggle") as HTMLInputElement).checked = p.adsToggle;
    this.syncSettingsLabels();
    this.refreshCareer();
  }

  refreshCareer(): void {
    const s = this.persist.stats;
    const m = Math.floor(s.seconds / 60);
    const root = document.getElementById("career")!;
    root.innerHTML = [
      chip(s.kills, "frags"),
      chip(s.deaths, "falls"),
      chip(m, "min"),
      chip(s.matches, "matches"),
    ].join("");
  }

  showMenu(which: "home" | "pause" | "results"): void {
    this.menu.classList.remove("playing", "paused", "results", "hidden");
    this.hud.classList.toggle("menu-over", which === "pause" || which === "results");
    if (which === "home") {
      this.showPanel("panel-home");
    } else if (which === "pause") {
      this.menu.classList.add("paused");
      this.showPanel("panel-pause");
    } else {
      this.menu.classList.add("results");
      this.showPanel("panel-results");
    }
  }

  hideMenu(): void {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    this.menu.classList.add("playing");
    this.menu.classList.remove("paused", "results");
    this.hud.classList.remove("menu-over");
    this.scoreboard.classList.add("hidden");
  }

  showHud(on: boolean): void {
    this.hud.classList.toggle("hidden", !on);
  }

  showTouch(on: boolean): void {
    this.touch.classList.toggle("hidden", !on);
    this.touch.classList.toggle("desktop-hidden", !on);
  }

  showHint(on: boolean): void {
    this.hint.classList.toggle("hidden", !on);
  }

  setDeath(on: boolean, by = ""): void {
    this.deathBanner.classList.toggle("hidden", !on);
    this.hud.classList.toggle("deathcam", on);
    document.getElementById("death-by")!.textContent = by ? `by ${by}` : "";
  }

  setScoreboard(on: boolean, rows: ScoreRow[], mapName: string): void {
    const paused = this.menu.classList.contains("paused");
    this.scoreboard.classList.toggle("hidden", !on || paused);
    document.getElementById("board-map")!.textContent = mapName;
    const html = renderBoard(rows);
    document.getElementById("board-body")!.innerHTML = html;
    const pauseBody = document.getElementById("pause-board-body");
    if (pauseBody) pauseBody.innerHTML = html;
    const pauseMap = document.getElementById("pause-board-map");
    if (pauseMap) pauseMap.textContent = mapName;
  }

  setResults(title: string, rows: ScoreRow[]): void {
    document.getElementById("results-title")!.textContent = title;
    document.getElementById("results-board")!.innerHTML = rows
      .slice()
      .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths)
      .map(
        (r, i) =>
          `<div class="${r.me ? "me" : ""}"><span class="rank">${i + 1}</span><span>${esc(r.name)}</span><span>${r.kills} — ${r.deaths}</span></div>`,
      )
      .join("");
  }

  vitals(hp: number, weap: WeaponState, charging: number, ads = 0): void {
    const def = WEAPONS[weap.id];
    const vital = document.getElementById("vital-hp");
    vital?.classList.toggle("low", hp <= 30);
    vital?.classList.toggle("crit", hp <= 15);
    (document.getElementById("hp-fill") as HTMLElement).style.width = `${Math.max(0, hp)}%`;
    document.getElementById("hp-num")!.textContent = String(Math.ceil(hp));
    const name = document.getElementById("weap-name")!;
    name.textContent = def.name;
    name.classList.toggle("sighted", ads > 0.55);
    const chipEl = document.getElementById("sight-chip");
    if (chipEl) chipEl.classList.toggle("on", ads > 0.55);
    const ammo = document.getElementById("vital-ammo");
    ammo?.classList.toggle("dry", weap.mag <= 0 && weap.reloading <= 0);
    ammo?.classList.toggle("reloading", weap.reloading > 0);
    document.getElementById("ammo-mag")!.textContent =
      weap.reloading > 0 ? "···" : String(weap.mag);
    document.getElementById("ammo-res")!.textContent = String(weap.reserve);
    const wrap = document.getElementById("charge-wrap")!;
    wrap.classList.toggle("hidden", !def.charge);
    wrap.classList.toggle("hot", charging > 0.72);
    (document.getElementById("charge-fill") as HTMLElement).style.width =
      `${Math.round(charging * 100)}%`;
  }

  meta(timeLeft: number, frags: number, limit: number): void {
    const m = Math.floor(timeLeft / 60);
    const s = Math.floor(timeLeft % 60);
    document.getElementById("timer")!.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    document.getElementById("fragline")!.textContent = `${frags} / ${limit}`;
    document.getElementById("match-meta")?.classList.toggle("late", timeLeft <= 30);
  }

  pushFeed(text: string): void {
    const el = document.createElement("div");
    el.className = "feed-item";
    el.innerHTML = text;
    this.killfeed.prepend(el);
    const id = window.setTimeout(() => {
      el.classList.add("out");
      window.setTimeout(() => el.remove(), 280);
    }, 3800);
    this.feedTimer.push(id);
    while (this.killfeed.children.length > 6) this.killfeed.lastElementChild?.remove();
  }

  hit(head: boolean, headHeight = 1.5): void {
    this.hitmarker.classList.remove("show", "head");
    void this.hitmarker.offsetWidth;
    this.hitmarker.classList.add("show");
    this.hitmarker.classList.toggle("head", head);
    this.crosshair.classList.add("hit");
    this.headpip.classList.toggle("head", head);
    this.headpip.classList.add("show");
    const lift = Math.max(-28, Math.min(36, (1.55 - headHeight) * 42));
    this.headpip.style.transform = `translate(-50%, calc(-50% + ${lift.toFixed(1)}px))`;
    this.hitT = head ? 0.2 : 0.14;
  }

  setAim(ads: number, gap: number): void {
    this.crosshair.style.setProperty("--gap", `${gap.toFixed(1)}px`);
    this.crosshair.classList.toggle("ads", ads > 0.55);
    this.crosshair.style.opacity = String(1 - Math.min(0.92, ads * 1.05));
    if (this.vignette) this.vignette.style.opacity = String(ads * 0.55);
    if (this.sightIron) {
      this.sightIron.style.opacity = String(Math.max(0, ads - 0.12) * 0.82);
    }
  }

  hurtFlash(): void {
    this.hurt.style.opacity = "1";
  }

  muzzleHud(): void {
    this.flashEl.style.opacity = "1";
  }

  banner(text: string): void {
    this.center.textContent = text;
    this.center.classList.add("show");
    this.msgT = 1.15;
  }

  compassYaw(yaw: number): void {
    if (!this.compassReady) {
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const parts: string[] = [];
      for (let k = 0; k < 3; k++) {
        for (const d of dirs) parts.push(`<span class="c-tick${d.length === 1 ? " major" : ""}">${d}</span>`);
      }
      this.compass.innerHTML = parts.join("");
      this.compassReady = true;
    }
    const deg = ((-yaw * 180) / Math.PI + 3600) % 360;
    const span = 56;
    const cycle = span * 8;
    const x = -(deg / 360) * cycle - cycle;
    this.compass.style.transform = `translateX(${x}px)`;
  }

  tick(dt: number): void {
    if (this.hitT > 0) {
      this.hitT -= dt;
      if (this.hitT <= 0) {
        this.hitmarker.classList.remove("show", "head");
        this.crosshair.classList.remove("hit");
        this.headpip.classList.remove("show", "head");
      }
    }
    if (this.msgT > 0) {
      this.msgT -= dt;
      if (this.msgT <= 0) this.center.classList.remove("show");
    }
    const ho = Number(this.hurt.style.opacity || 0);
    if (ho > 0) this.hurt.style.opacity = String(Math.max(0, ho - dt * 2.4));
    const fo = Number(this.flashEl.style.opacity || 0);
    if (fo > 0) this.flashEl.style.opacity = String(Math.max(0, fo - dt * 8));
  }

  private showPanel(id: string): void {
    this.menu.querySelectorAll(".panel").forEach((p) => p.classList.add("hidden"));
    const panel = document.getElementById(id)!;
    panel.classList.remove("hidden", "enter");
    void panel.offsetWidth;
    panel.classList.add("enter");
  }

  private syncSettingsLabels(): void {
    document.getElementById("sens-val")!.textContent = this.persist.sensitivity.toFixed(2);
    document.getElementById("ads-val")!.textContent = this.persist.adsSensitivity.toFixed(2);
    document.getElementById("fov-val")!.textContent = String(Math.round(this.persist.fov));
    document.getElementById("vol-val")!.textContent =
      `${Math.round(this.persist.volume * 100)}%`;
    const vol = document.getElementById("rng-vol") as HTMLInputElement;
    const sens = document.getElementById("rng-sens") as HTMLInputElement;
    const ads = document.getElementById("rng-ads") as HTMLInputElement;
    const fov = document.getElementById("rng-fov") as HTMLInputElement;
    paintRange(sens, 0.25, 2.4);
    paintRange(ads, 0.35, 1.4);
    paintRange(fov, 70, 100);
    paintRange(vol, 0, 1);
  }
}

function paintRange(el: HTMLInputElement, min: number, max: number): void {
  const t = (Number(el.value) - min) / (max - min);
  el.style.setProperty("--fill", `${Math.round(Math.max(0, Math.min(1, t)) * 100)}%`);
}

function renderBoard(rows: ScoreRow[]): string {
  return rows
    .slice()
    .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths)
    .map(
      (r, i) =>
        `<tr class="${r.me ? "me" : ""}"><td class="rank">${i + 1}</td><td>${esc(r.name)}</td><td>${r.kills}</td><td>${r.deaths}</td></tr>`,
    )
    .join("");
}

function chip(n: number, label: string): string {
  return `<span class="stat"><b>${n}</b> ${label}</span>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
