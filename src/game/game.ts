import * as THREE from "three";
import { AABB, capsuleClear, losClear, moveBody, onGround, rayAABB, rayWorld } from "./collision";
import { Sfx } from "./audio";
import { Fx } from "./fx";
import { Input } from "./input";
import { buildMap } from "./maps";
import { NETCODE } from "./netstub";
import { loadPersist, savePersist } from "./settings";
import {
  BOT_COUNT,
  BOT_NAMES,
  FRAG_LIMIT,
  MATCH_SECONDS,
  PLAYER_NAME,
  type Difficulty,
  type MapId,
  type Persist,
  type Phase,
  type WeaponId,
} from "./types";
import { UI, type ScoreRow } from "./ui";
import {
  beginCook,
  cancelCook,
  createGadgetMesh,
  cycleGadget,
  fuseAfterCook,
  GADGETS,
  GADGET_ORDER,
  makeBelt,
  restockBelt,
  selectGadget,
  spawnToss,
  splashDamage,
  stepToss,
  throwVelocity,
  WorkLamp,
  type GadgetId,
  type Toss,
} from "./gadgets";
import {
  canShoot,
  fireInterval,
  makeWeapon,
  WEAPON_ORDER,
  WEAPONS,
  type WeaponState,
} from "./weapons";
import type { Arena } from "./world";
import { BOT_BODIES, PLAYER, PLAYER_HEX, SIGNAL_HEX } from "./palette";
import { createViewmodel, createYardling, flashYardling, poseYardling } from "./yardling";
import {
  adsWeight,
  applyShotRecoil,
  cone,
  crosshairGap,
  damp,
  DEFAULT_HIP_FOV,
  FEEL,
  freshRecoil,
  LAND_FADE,
  lerp,
  lookScale,
  poseLerp,
  recoverRecoil,
  stepAds,
} from "./gunfeel";

const EYE = 1.55;
const EYE_CROUCH = 0.88;
const HX = 0.36;
const HZ = 0.36;
const BODY_H = 1.7;
const BODY_CROUCH = 1.02;
const GRAVITY = 24;
const WALK = 6.2;
const SPRINT = 9.4;
const CROUCH = 2.65;
const JUMP_V = 7.55;
const DEATHCAM_T = 2.55;
/** Ground ease rates — original damp, not a Source/Quake accel port. */
const ACCEL_WALK = 14;
const ACCEL_SPRINT = 8.4;
const ACCEL_CROUCH = 11;
const STOP_WALK = 10;
const STOP_SPRINT = 6.4;
const AIR_ACCEL = 10;

interface Fighter {
  id: number;
  name: string;
  player: boolean;
  alive: boolean;
  hp: number;
  guard: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  grounded: boolean;
  kills: number;
  deaths: number;
  weap: WeaponState;
  mesh: THREE.Group | null;
  color: number;
  respawn: number;
  coyote: number;
  bot: BotMind | null;
  lastAttacker: number;
  hitFlash: number;
  adsWant: boolean;
  sprinting: boolean;
  crouching: boolean;
  eyeH: number;
  landInacc: number;
  recoil: ReturnType<typeof freshRecoil>;
}

interface BotMind {
  react: number;
  nextWander: number;
  way: number;
  strafe: number;
  nextStrafe: number;
  aimYaw: number;
  aimPitch: number;
  ads: boolean;
  stuck: number;
  lastX: number;
  lastZ: number;
  panic: number;
}

export class Game {
  readonly net = NETCODE;
  private persist: Persist = loadPersist();
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(DEFAULT_HIP_FOV, 1, 0.08, 180);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly sfx = new Sfx();
  private readonly fx: Fx;
  private readonly input: Input;
  private readonly models = new Map<WeaponId, THREE.Group>();
  private arena: Arena | null = null;
  private fighters: Fighter[] = [];
  private phase: Phase = "menu";
  private mapId: MapId = "potting";
  private difficulty: Difficulty = "laidback";
  private timeLeft = MATCH_SECONDS;
  private sessionSeconds = 0;
  private deathT = 0;
  private killerId = -1;
  private orbit = 0;
  private spawnPick = 0;
  private chargedSfx = false;
  private nextId = 1;
  private boardOn = false;
  private adsLatch = false;
  private hipFov = DEFAULT_HIP_FOV;
  private lastStrafe = 0;
  private adsAudio = false;
  private lockGrace = 0;
  private belt = makeBelt();
  private lamp!: WorkLamp;
  private tosses: Toss[] = [];
  private readonly gadgetModels = new Map<GadgetId, THREE.Group>();
  private bounceSfx = 0;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly ui: UI,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.rotation.order = "YXZ";
    this.fx = new Fx(this.scene);
    this.input = new Input(canvas, ui.touch);
    for (const id of WEAPON_ORDER) {
      const vm = createViewmodel(id);
      vm.visible = false;
      this.camera.add(vm);
      this.models.set(id, vm);
    }
    for (const id of GADGET_ORDER) {
      const held = createGadgetMesh(id, 1.35);
      held.visible = false;
      this.camera.add(held);
      this.gadgetModels.set(id, held);
    }
    this.lamp = new WorkLamp(this.camera);
    this.scene.add(this.camera);
    this.input.attach();
    window.addEventListener("resize", () => this.resize());
    this.resize();
    canvas.addEventListener("click", () => {
      void this.sfx.resume();
      if (this.phase === "playing") this.armLock();
    });
  }

  boot(): void {
    console.info(this.net.note);
    this.ui.loadPersist(this.persist);
    this.applySettings(this.persist);
    this.ui.onSettings = (p) => {
      this.persist = p;
      savePersist(p);
      this.applySettings(p);
    };
    this.ui.onPreview = (id) => this.preview(id);
    this.ui.onStart = (map, diff) => this.startMatch(map, diff);
    this.ui.onResume = () => this.resume();
    this.ui.onQuit = () => this.quitToMenu();
    this.preview("potting");
    this.ui.showMenu("home");
    this.loop();
  }

  private applySettings(p: Persist): void {
    this.input.sensitivity = p.sensitivity;
    this.input.invertY = p.invertY;
    this.sfx.setVolume(p.volume);
    this.hipFov = p.fov;
  }

  private preview(id: MapId): void {
    this.mapId = id;
    this.loadArena(id);
    this.phase = "menu";
    this.ui.showHud(false);
    this.ui.showTouch(false);
    this.ui.hideMenu();
    this.ui.showMenu("home");
  }

  private loadArena(id: MapId): void {
    if (this.arena) this.scene.remove(this.arena.group);
    this.arena = buildMap(id);
    this.scene.add(this.arena.group);
    this.scene.background = new THREE.Color(this.arena.sky);
    this.scene.fog = new THREE.Fog(this.arena.fogColor, this.arena.fogNear, this.arena.fogFar);
    this.renderer.toneMappingExposure = this.arena.exposure;
    this.lamp.setMap(id);
  }

  private startMatch(map: MapId, diff: Difficulty): void {
    void this.sfx.resume();
    this.armLock();
    this.mapId = map;
    this.difficulty = diff;
    this.loadArena(map);
    this.clearFighters();
    this.timeLeft = MATCH_SECONDS;
    this.sessionSeconds = 0;
    this.phase = "playing";
    this.boardOn = false;
    this.clearTosses();
    restockBelt(this.belt);
    this.lamp.set(false);
    this.ui.hideMenu();
    this.ui.showHud(true);
    this.ui.showTouch(this.input.isTouch());
    this.ui.setDeath(false);
    this.ui.showHint(!this.input.isTouch());
    const you = this.makeFighter(PLAYER_NAME, true, PLAYER);
    this.place(you);
    for (let i = 0; i < BOT_COUNT; i++) {
      const bot = this.makeFighter(BOT_NAMES[i] ?? `Yardling ${i}`, false, BOT_BODIES[i] ?? 0xe11d74);
      bot.weap = makeWeapon(WEAPON_ORDER[i % 3]!);
      bot.bot = {
        react: 0,
        nextWander: 0,
        way: i % Math.max(1, this.arena!.waypoints.length),
        strafe: 1,
        nextStrafe: 0.8,
        aimYaw: bot.yaw,
        aimPitch: 0,
        ads: false,
        stuck: 0,
        lastX: bot.x,
        lastZ: bot.z,
        panic: 0,
      };
      this.place(bot);
    }
    this.ui.banner("TEND THE YARD");
  }

  private quitToMenu(): void {
    this.input.exitLock();
    this.phase = "menu";
    this.clearTosses();
    this.lamp.set(false);
    this.clearFighters();
    this.ui.showHud(false);
    this.ui.showTouch(false);
    this.ui.setDeath(false);
    this.ui.showMenu("home");
    this.preview(this.mapId);
  }

  private resume(): void {
    this.phase = "playing";
    this.boardOn = false;
    this.armLock();
    this.ui.hideMenu();
    this.ui.setScoreboard(false, this.rows(), this.arena?.title ?? "");
  }

  private pause(): void {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.input.exitLock();
    this.cancelCharge(this.player());
    this.sfx.stopCharge();
    cancelCook(this.belt, true);
    this.ui.showMenu("pause");
  }

  private armLock(): void {
    this.lockGrace = 0.45;
    this.input.requestLock();
  }

  private endMatch(title: string): void {
    this.phase = "results";
    this.input.exitLock();
    this.clearTosses();
    this.lamp.set(false);
    this.persist.stats.matches += 1;
    this.persist.stats.seconds += this.sessionSeconds;
    savePersist(this.persist);
    this.ui.refreshCareer();
    this.ui.showHud(true);
    this.ui.setResults(title, this.rows());
    this.ui.showMenu("results");
  }

  private makeFighter(name: string, player: boolean, color: number): Fighter {
    const mesh = player ? null : createYardling(name, color);
    if (mesh) this.scene.add(mesh);
    const f: Fighter = {
      id: this.nextId++,
      name,
      player,
      alive: true,
      hp: 100,
      guard: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      pitch: 0,
      grounded: true,
      kills: 0,
      deaths: 0,
      weap: makeWeapon("clipper"),
      mesh,
      color,
      respawn: 0,
      coyote: 0,
      bot: null,
      lastAttacker: -1,
      hitFlash: 0,
      adsWant: false,
      sprinting: false,
      crouching: false,
      eyeH: EYE,
      landInacc: 0,
      recoil: freshRecoil(),
    };
    this.fighters.push(f);
    return f;
  }

  private clearFighters(): void {
    for (const f of this.fighters) {
      if (f.mesh) this.scene.remove(f.mesh);
    }
    this.fighters = [];
  }

  private place(f: Fighter): void {
    const arena = this.arena!;
    const others = this.fighters.filter((o) => o.alive && o.id !== f.id);
    let best = arena.spawns[this.spawnPick++ % arena.spawns.length]!;
    let bestD = -1;
    for (const s of arena.spawns) {
      let min = Infinity;
      for (const o of others) {
        min = Math.min(min, Math.hypot(o.x - s.x, o.z - s.z));
      }
      if (others.length === 0) {
        best = s;
        break;
      }
      if (min > bestD) {
        bestD = min;
        best = s;
      }
    }
    f.x = best.x;
    f.y = best.y + 0.02;
    f.z = best.z;
    f.yaw = best.yaw;
    f.pitch = 0;
    f.vx = f.vy = f.vz = 0;
    f.hp = 100;
    f.alive = true;
    f.respawn = 0;
    f.guard = 1.7;
    f.adsWant = false;
    f.sprinting = false;
    f.crouching = false;
    f.eyeH = EYE;
    f.landInacc = 0;
    f.weap.ads = 0;
    f.weap.bloom = 0;
    f.weap.ready = 0;
    f.weap.sprintFade = 0;
    f.weap.charging = false;
    f.weap.charge = 0;
    f.recoil = freshRecoil();
    if (f.player) {
      this.adsLatch = false;
      this.adsAudio = false;
      restockBelt(this.belt);
    }
    if (f.mesh) {
      f.mesh.visible = true;
      f.mesh.rotation.z = 0;
      const plate = f.mesh.getObjectByName("nameplate");
      const chev = f.mesh.getObjectByName("chevron");
      if (plate) plate.visible = true;
      if (chev) chev.visible = true;
    }
  }

  private player(): Fighter {
    return this.fighters.find((f) => f.player)!;
  }

  private loop = (): void => {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.input.beginFrame();
    this.ui.tick(dt);
    this.fx.update(dt);
    if (this.bounceSfx > 0) this.bounceSfx -= dt;

    if (this.phase === "menu") {
      this.orbit += dt;
      this.camera.fov = 62;
      this.camera.updateProjectionMatrix();
      this.camera.position.set(
        Math.sin(this.orbit * 0.18) * 26,
        11,
        Math.cos(this.orbit * 0.18) * 26,
      );
      this.camera.lookAt(0, 2.4, 0);
      this.camera.rotation.z = 0;
      this.input.endFrame();
      return;
    }

    if (this.phase === "paused" || this.phase === "results") {
      if (this.phase === "paused" && this.input.pause) this.resume();
      if (this.phase === "paused") {
        this.ui.setScoreboard(false, this.rows(), this.arena?.title ?? "");
      }
      this.syncViewmodels(false);
      this.lamp.present(false);
      this.input.endFrame();
      return;
    }

    if (this.lockGrace > 0) this.lockGrace -= dt;
    if (this.input.pause) this.pause();
    else if (this.input.lockLost && this.lockGrace <= 0) this.pause();
    if (this.input.tabToggle) this.boardOn = !this.boardOn;

    if (this.phase === "playing" || this.phase === "deathcam") {
      this.timeLeft -= dt;
      this.sessionSeconds += dt;
      if (this.timeLeft <= 0) {
        this.endMatch("Dusk called it");
        this.input.endFrame();
        return;
      }
    }

    const you = this.player();
    if (this.phase === "playing" && you.alive) this.controlPlayer(you, dt);
    else if (this.phase === "deathcam") this.updateDeathcam(dt);
    if (this.phase === "playing" || this.phase === "deathcam") this.stepTosses(dt);

    for (const f of this.fighters) {
      if (f.guard > 0) f.guard -= dt;
      if (f.hitFlash > 0) {
        f.hitFlash -= dt;
        if (f.mesh) flashYardling(f.mesh, f.hitFlash > 0);
      }
      this.tickWeapon(f, dt);
      if (!f.alive) {
        f.respawn -= dt;
        if (f.respawn <= 0 && !f.player) this.place(f);
        if (f.mesh && !f.alive) {
          f.mesh.rotation.z = Math.min(1.3, f.mesh.rotation.z + dt * 3);
          const plate = f.mesh.getObjectByName("nameplate");
          const chev = f.mesh.getObjectByName("chevron");
          if (plate) plate.visible = false;
          if (chev) chev.visible = false;
        }
        continue;
      }
      if (f.bot) this.controlBot(f, dt);
      this.integrate(f, dt);
      if (f.y < this.arena!.killY) this.kill(f, f.lastAttacker >= 0 ? f.lastAttacker : f.id, true);
      if (f.mesh) {
        f.mesh.position.set(f.x, f.y, f.z);
        poseYardling(f.mesh, this.clock.elapsedTime + f.id, Math.hypot(f.vx, f.vz) > 0.4, f.yaw);
      }
    }

    if (this.phase === "playing" && you.alive) this.cameraFrom(you, dt);
    this.syncViewmodels(this.phase === "playing" && you.alive);
    this.drawMinimap();
    this.ui.compassYaw(you.yaw);
    this.ui.vitals(you.hp, you.weap, you.weap.charge, you.weap.ads);
    const gDef = GADGETS[this.belt.id];
    const cook01 = this.belt.cooking ? this.belt.cook / gDef.cookMax : 0;
    this.ui.gadgets(
      gDef.name,
      this.belt.ammo[this.belt.id],
      cook01,
      this.lamp.on,
      this.belt.ammo[this.belt.id] <= 0 && !this.belt.cooking,
    );
    this.lamp.present(this.phase === "playing" && you.alive);
    const feel = FEEL[you.weap.id];
    const spreadNow = cone(feel, {
      ads: you.weap.ads,
      speed01: Math.hypot(you.vx, you.vz) / SPRINT,
      grounded: you.grounded,
      bloom: you.weap.bloom,
      landInacc: you.landInacc,
      sprintFade: you.weap.sprintFade,
      charge: you.weap.charge,
      charged: WEAPONS[you.weap.id].charge,
      burst: you.recoil.burst,
    });
    this.ui.setAim(you.weap.ads, crosshairGap(spreadNow, you.weap.ads));
    this.ui.hud.dataset.ads = you.weap.ads.toFixed(2);
    this.ui.hud.dataset.fov = this.camera.fov.toFixed(1);
    this.ui.hud.dataset.spread = spreadNow.toFixed(4);
    this.ui.hud.dataset.weap = you.weap.id;
    this.ui.hud.dataset.crouch = you.crouching ? "1" : "0";
    this.ui.hud.dataset.sprint = you.sprinting ? "1" : "0";
    this.ui.hud.dataset.eye = you.eyeH.toFixed(2);
    this.ui.hud.dataset.body = bodyHeight(you).toFixed(2);
    this.ui.hud.dataset.speed = Math.hypot(you.vx, you.vz).toFixed(2);
    this.ui.hud.dataset.ready = you.weap.ready.toFixed(3);
    this.ui.hud.dataset.sprintFade = you.weap.sprintFade.toFixed(3);
    this.ui.hud.dataset.gadget = this.belt.id;
    this.ui.hud.dataset.gadgetAmmo = String(this.belt.ammo[this.belt.id]);
    this.ui.hud.dataset.cook = this.belt.cooking ? "1" : "0";
    this.ui.hud.dataset.lamp = this.lamp.on ? "1" : "0";
    this.ui.hud.dataset.gadgetHeld = this.input.gadgetHeld ? "1" : "0";
    this.ui.hud.dataset.adsBind = "F";
    this.ui.meta(this.timeLeft, you.kills, FRAG_LIMIT);
    this.ui.setScoreboard(this.input.tab || this.boardOn, this.rows(), this.arena!.title);
    this.ui.showHint(this.phase === "playing" && !this.input.locked && !this.input.isTouch());
    this.input.endFrame();
  }

  private controlPlayer(p: Fighter, dt: number): void {
    const feel = FEEL[p.weap.id];
    this.updateAdsWant(p);
    this.stepCrouch(p, this.input.crouch);
    this.handleGadgets(p, dt);
    if (p.adsWant && p.sprinting) {
      this.leaveSprint(p, feel.sprintDelay);
    }
    const canAds =
      p.weap.reloading <= 0 &&
      p.weap.swap <= 0 &&
      p.alive &&
      !p.sprinting &&
      !this.belt.cooking;
    p.weap.ads = stepAds(p.weap.ads, p.adsWant && canAds, feel.adsTime, dt);
    if (p.weap.ads > 0.35 && !this.adsAudio) {
      this.adsAudio = true;
      this.sfx.ads(true);
    } else if (p.weap.ads < 0.12 && this.adsAudio) {
      this.adsAudio = false;
      this.sfx.ads(false);
    }

    const look =
      0.00215 *
      this.input.sensitivity *
      lookScale(this.hipFov, feel.adsFov, p.weap.ads, this.persist.adsSensitivity, feel.adsLook);
    p.yaw -= this.input.lookDx * look;
    const iy = this.input.invertY ? -1 : 1;
    p.pitch -= this.input.lookDy * look * iy;
    p.pitch = Math.max(-1.35, Math.min(1.35, p.pitch));

    if (this.input.weap !== null) this.switchWeap(p, this.input.weap);
    if (this.input.cycle) {
      const i = WEAPON_ORDER.indexOf(p.weap.id);
      this.switchWeap(p, (i + this.input.cycle + 3) % 3);
    }
    if (this.input.reload) this.startReload(p);

    const wantSprint =
      this.input.sprint &&
      !p.crouching &&
      p.weap.ads < 0.2 &&
      !p.adsWant &&
      !this.belt.cooking;
    if (p.sprinting && !wantSprint) this.leaveSprint(p, feel.sprintDelay);
    p.sprinting = wantSprint;
    if (p.sprinting) {
      p.weap.ready = Math.max(p.weap.ready, feel.sprintDelay);
      p.weap.sprintFade = 1;
    }

    const def = WEAPONS[p.weap.id];
    if (this.belt.cooking) {
      /* cook owns the hands — guns wait */
    } else if (def.charge) {
      const chargeOk = p.weap.mag > 0 && p.weap.reloading <= 0 && p.weap.swap <= 0;
      if (this.input.firing && chargeOk) {
        if (p.sprinting) this.leaveSprint(p, feel.sprintDelay);
        if (p.weap.ready <= 0) {
          if (!p.weap.charging) {
            p.weap.charging = true;
            this.sfx.startCharge();
            this.chargedSfx = true;
          }
          p.weap.charge = Math.min(1, p.weap.charge + dt / def.chargeTime);
        }
      }
      if (this.input.fireReleased && p.weap.charging) this.releaseStake(p);
    } else if (def.auto) {
      if (this.input.firing) this.tryFire(p);
    } else if (this.input.firePressed) {
      this.tryFire(p);
    }

    const adsSlow = 1 - p.weap.ads * (1 - feel.adsMove);
    const gait = p.crouching ? CROUCH : p.sprinting ? SPRINT : WALK;
    const speed = gait * adsSlow;
    const wishX =
      Math.cos(p.yaw) * this.input.strafe + -Math.sin(p.yaw) * this.input.forward;
    const wishZ =
      -Math.sin(p.yaw) * this.input.strafe + -Math.cos(p.yaw) * this.input.forward;
    const wlen = Math.hypot(wishX, wishZ);
    const nx = wlen > 0 ? wishX / wlen : 0;
    const nz = wlen > 0 ? wishZ / wlen : 0;
    this.lastStrafe = damp(this.lastStrafe, this.input.strafe, 10, dt);
    if (p.grounded) {
      const going = wlen > 0.08;
      const accel = p.crouching ? ACCEL_CROUCH : p.sprinting ? ACCEL_SPRINT : ACCEL_WALK;
      const stop = p.sprinting || Math.hypot(p.vx, p.vz) > WALK * 0.85 ? STOP_SPRINT : STOP_WALK;
      p.vx = damp(p.vx, going ? nx * speed : 0, going ? accel : stop, dt);
      p.vz = damp(p.vz, going ? nz * speed : 0, going ? accel : stop, dt);
    } else {
      p.vx += nx * AIR_ACCEL * dt;
      p.vz += nz * AIR_ACCEL * dt;
      const h = Math.hypot(p.vx, p.vz);
      const cap = SPRINT * 1.05;
      if (h > cap) {
        p.vx = (p.vx / h) * cap;
        p.vz = (p.vz / h) * cap;
      }
    }
    const eyeWant = p.crouching ? EYE_CROUCH : EYE;
    p.eyeH = damp(p.eyeH, eyeWant, p.crouching ? 18 : 11, dt);
    if ((this.input.jump || this.input.jumpPressed) && (p.grounded || p.coyote > 0)) {
      p.vy = JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      this.sfx.jump();
    }
    this.sfx.foot(dt, wlen > 0.2 && p.grounded, p.sprinting && !p.crouching);
  }

  private stepCrouch(p: Fighter, want: boolean): void {
    if (want) {
      if (!p.crouching && p.sprinting) this.leaveSprint(p, FEEL[p.weap.id].sprintDelay);
      p.crouching = true;
      return;
    }
    if (!p.crouching) return;
    if (
      capsuleClear(p.x, p.y, p.z, HX, BODY_H * 0.5, HZ, this.arena!.colliders)
    ) {
      p.crouching = false;
    }
  }

  private leaveSprint(p: Fighter, delay: number): void {
    p.sprinting = false;
    p.weap.ready = Math.max(p.weap.ready, delay);
    p.weap.sprintFade = 1;
  }

  private updateAdsWant(p: Fighter): void {
    if (this.persist.adsToggle) {
      if (this.input.adsPressed) this.adsLatch = !this.adsLatch;
      if (p.weap.reloading > 0 || p.weap.swap > 0) this.adsLatch = false;
      p.adsWant = this.adsLatch;
    } else {
      p.adsWant = this.input.adsHeld;
    }
  }

  private controlBot(f: Fighter, dt: number): void {
    const mind = f.bot!;
    const mean = this.difficulty === "mean";
    const speed = mean ? 5.9 : 4.4;
    const err = mean ? 0.028 : 0.11;
    const turn = mean ? 7.2 : 2.6;

    mind.react -= dt;
    mind.nextWander -= dt;
    mind.nextStrafe -= dt;
    if (mind.panic > 0) mind.panic -= dt;
    if (mind.nextStrafe <= 0) {
      mind.strafe = Math.random() < 0.5 ? -1 : 1;
      mind.nextStrafe = 0.5 + Math.random() * 1.1;
    }

    const target = this.pickTarget(f, mean ? 0.72 : 1);
    const eyeY = f.y + f.eyeH;
    if (mind.panic > 0) {
      const spin = this.clock.elapsedTime * (7 + f.id * 0.3);
      f.vx = Math.cos(spin) * speed;
      f.vz = Math.sin(spin) * speed;
      mind.ads = false;
      f.adsWant = false;
      f.weap.ads = stepAds(f.weap.ads, false, FEEL[f.weap.id].adsTime, dt);
      if (f.weap.charging) this.cancelCharge(f);
      if (f.grounded && Math.random() < dt * 2.4) f.vy = JUMP_V * 0.7;
      return;
    }
    if (target) {
      const dx = target.x - f.x;
      const dy = target.y + (target.crouching ? 0.72 : 1.42) - eyeY;
      const dz = target.z - f.z;
      const dist = Math.hypot(dx, dy, dz);
      const yaw = Math.atan2(-dx, -dz);
      const pitch = Math.atan2(dy, Math.hypot(dx, dz));
      mind.aimYaw = turnToward(mind.aimYaw, yaw + (hash(f.id) - 0.5) * err, turn, dt);
      mind.aimPitch = turnToward(mind.aimPitch, pitch, turn, dt);
      f.yaw = mind.aimYaw;
      f.pitch = mind.aimPitch;
      const facing = Math.abs(normAngle(f.yaw - yaw)) < (mean ? 0.18 : 0.38);
      mind.ads = dist > 11 && facing;
      f.adsWant = mind.ads;
      const feel = FEEL[f.weap.id];
      const canAds = f.weap.reloading <= 0 && f.weap.swap <= 0;
      f.weap.ads = stepAds(f.weap.ads, mind.ads && canAds, feel.adsTime, dt);
      if (facing && mind.react <= 0 && dist < (mean ? 72 : 40)) {
        const def = WEAPONS[f.weap.id];
        if (def.charge) {
          f.weap.charging = true;
          f.weap.charge = Math.min(1, f.weap.charge + dt / def.chargeTime);
          if (f.weap.charge > 0.72 && (f.weap.ads > 0.5 || dist < 12)) this.releaseStake(f);
        } else {
          this.tryFire(f);
        }
      }
      const rightX = Math.cos(f.yaw) * mind.strafe;
      const rightZ = -Math.sin(f.yaw) * mind.strafe;
      const fx = -Math.sin(f.yaw);
      const fz = -Math.cos(f.yaw);
      const approach = dist > 9 ? 1 : dist < 4 ? -0.4 : 0.15;
      const move = speed * (1 - f.weap.ads * (1 - feel.adsMove));
      f.vx = (fx * approach + rightX * 0.7) * move;
      f.vz = (fz * approach + rightZ * 0.7) * move;
      if (f.grounded && Math.random() < dt * 0.15) f.vy = JUMP_V * 0.85;
    } else {
      const ways = this.arena!.waypoints;
      if (ways.length && mind.nextWander <= 0) {
        const near = ways
          .map((_, i) => i)
          .filter((i) => Math.abs(ways[i]!.y - f.y) < 1.4);
        const pool = near.length > 0 ? near : ways.map((_, i) => i);
        mind.way = pool[Math.floor(Math.random() * pool.length)]!;
        mind.nextWander = 1.4 + Math.random() * 2;
      }
      const w = ways[mind.way] ?? ways[0];
      if (w) {
        const dx = w.x - f.x;
        const dz = w.z - f.z;
        const yaw = Math.atan2(-dx, -dz);
        mind.aimYaw = turnToward(mind.aimYaw, yaw, 3, dt);
        f.yaw = mind.aimYaw;
        const len = Math.hypot(dx, dz) || 1;
        f.vx = (dx / len) * speed;
        f.vz = (dz / len) * speed;
      }
      if (f.weap.charging) this.cancelCharge(f);
      mind.ads = false;
      f.adsWant = false;
      f.weap.ads = stepAds(f.weap.ads, false, FEEL[f.weap.id].adsTime, dt);
    }
    const moved = Math.hypot(f.x - mind.lastX, f.z - mind.lastZ);
    if (moved < 0.07 && Math.hypot(f.vx, f.vz) > 0.4) mind.stuck += dt;
    else mind.stuck = 0;
    mind.lastX = f.x;
    mind.lastZ = f.z;
    if (mind.stuck > 0.55) {
      if (f.grounded) f.vy = JUMP_V * 0.9;
      mind.way = (mind.way + 1) % Math.max(1, this.arena!.waypoints.length);
      mind.nextWander = 0.4;
      mind.stuck = 0;
    }
    if (f.weap.mag <= 0) this.startReload(f);
  }

  private pickTarget(self: Fighter, playerBias: number): Fighter | null {
    let best: Fighter | null = null;
    let bestScore = Infinity;
    const eyeY = self.y + self.eyeH;
    for (const o of this.fighters) {
      if (!o.alive || o.id === self.id) continue;
      const tx = o.x;
      const ty = o.y + (o.crouching ? 0.72 : 1.4);
      const tz = o.z;
      if (!losClear(self.x, eyeY, self.z, tx, ty, tz, this.arena!.colliders)) continue;
      let d = Math.hypot(tx - self.x, ty - eyeY, tz - self.z);
      if (o.player) d *= playerBias;
      if (d < bestScore) {
        bestScore = d;
        best = o;
      }
    }
    if (best && self.bot && self.bot.react <= -1) {
      self.bot.react = this.difficulty === "mean" ? 0.12 : 0.4;
    }
    return best;
  }

  private integrate(f: Fighter, dt: number): void {
    const wasGround = f.grounded;
    const prevVy = f.vy;
    if (!f.grounded) f.vy -= GRAVITY * dt;
    else if (f.vy < 0) f.vy = 0;
    const moved = moveBody(
      f.x,
      f.y,
      f.z,
      f.vx,
      f.vy,
      f.vz,
      HX,
      bodyHeight(f) * 0.5,
      HZ,
      dt,
      this.arena!.colliders,
    );
    f.x = moved.px;
    f.y = moved.py;
    f.z = moved.pz;
    f.vx = moved.vx;
    f.vy = moved.vy;
    f.vz = moved.vz;
    f.grounded = onGround(f.x, f.y, f.z, HX, HZ, this.arena!.colliders);
    if (f.grounded) {
      f.coyote = 0.1;
      if (!wasGround && prevVy < -10) {
        const dmg = Math.min(42, Math.round((-prevVy - 10) * 3.2));
        if (dmg > 0 && f.player) {
          f.hp -= dmg;
          this.ui.hurtFlash();
          this.sfx.hurt();
          if (f.hp <= 0) this.kill(f, f.id, true);
        }
        if (f.player) this.sfx.land(prevVy < -14);
        f.landInacc = Math.min(0.075, 0.028 + (-prevVy - 3) * 0.0048);
      } else if (!wasGround && prevVy < -3 && f.player) {
        this.sfx.land(false);
        f.landInacc = 0.03;
      }
    } else {
      f.coyote -= dt;
    }
    if (f.landInacc > 0) f.landInacc = damp(f.landInacc, 0, LAND_FADE, dt);
    recoverRecoil(f.recoil, FEEL[f.weap.id], dt);
  }

  private tickWeapon(f: Fighter, dt: number): void {
    const feel = FEEL[f.weap.id];
    if (f.weap.cooldown > 0) f.weap.cooldown -= dt;
    if (f.weap.ready > 0) f.weap.ready -= dt;
    if (f.sprinting || f.weap.ready > 0) f.weap.sprintFade = 1;
    else f.weap.sprintFade = damp(f.weap.sprintFade, 0, feel.sprintFadeRate, dt);
    f.weap.bloom = damp(f.weap.bloom, 0, feel.bloomDecay, dt);
    if (f.weap.reloading > 0) {
      f.adsWant = false;
      if (f.player) this.adsLatch = false;
      f.weap.reloading -= dt;
      if (f.weap.reloading <= 0) {
        const def = WEAPONS[f.weap.id];
        const need = def.mag - f.weap.mag;
        const take = Math.min(need, f.weap.reserve);
        f.weap.mag += take;
        f.weap.reserve -= take;
        if (f.player) this.sfx.reloadSeat();
      }
    }
    if (f.weap.swap > 0) {
      f.weap.swap -= dt;
      const half = feel.swapTime * 0.5;
      if (f.weap.pending && f.weap.swap <= half) {
        const keepAds = 0;
        f.weap = makeWeapon(f.weap.pending);
        f.weap.ads = keepAds;
        f.weap.swap = half;
        f.weap.pending = null;
        if (f.player) this.sfx.swap(false);
      }
    }
  }

  private switchWeap(f: Fighter, index: number): void {
    const id = WEAPON_ORDER[((index % 3) + 3) % 3]!;
    if (f.weap.id === id || f.weap.pending === id) return;
    if (f.weap.swap > 0 && f.weap.pending) return;
    this.cancelCharge(f);
    f.adsWant = false;
    if (f.player) this.adsLatch = false;
    f.weap.pending = id;
    f.weap.swap = FEEL[f.weap.id].swapTime;
    if (f.player) this.sfx.swap(true);
  }

  private startReload(f: Fighter): void {
    const def = WEAPONS[f.weap.id];
    if (f.weap.reloading > 0 || f.weap.mag >= def.mag || f.weap.reserve <= 0) return;
    if (f.weap.swap > 0) return;
    this.cancelCharge(f);
    f.adsWant = false;
    if (f.player) this.adsLatch = false;
    f.weap.reloading = def.reload;
    if (f.player) this.sfx.reload();
  }

  private cancelCharge(f: Fighter): void {
    f.weap.charging = false;
    f.weap.charge = 0;
    if (f.player && this.chargedSfx) {
      this.sfx.stopCharge();
      this.chargedSfx = false;
    }
  }

  private releaseStake(f: Fighter): void {
    const charge = f.weap.charge;
    f.weap.charging = false;
    f.weap.charge = 0;
    if (f.player) {
      this.sfx.stopCharge();
      this.chargedSfx = false;
    }
    if (f.weap.mag <= 0 || f.weap.reloading > 0 || f.weap.swap > 0) return;
    if (f.weap.ready > 0) return;
    const def = WEAPONS.stake;
    f.weap.mag -= 1;
    f.weap.cooldown = fireInterval("stake");
    const dmg = 44 + charge * (def.damage - 44);
    this.shoot(f, dmg, 1, def.range);
    if (f.weap.mag <= 0) this.startReload(f);
  }

  private tryFire(f: Fighter): void {
    const def = WEAPONS[f.weap.id];
    const feel = FEEL[f.weap.id];
    if (f.weap.reloading > 0 || f.weap.cooldown > 0 || f.weap.swap > 0) return;
    if (f.sprinting || f.weap.ready > 0) {
      if (f.sprinting) this.leaveSprint(f, feel.sprintDelay);
      else f.weap.sprintFade = 1;
      return;
    }
    if (f.weap.mag <= 0) {
      this.startReload(f);
      return;
    }
    if (!canShoot(f.weap)) return;
    f.weap.mag -= 1;
    f.weap.cooldown = fireInterval(f.weap.id);
    this.shoot(f, def.damage, def.pellets, def.range);
    if (f.weap.mag <= 0) this.startReload(f);
  }

  private shoot(
    src: Fighter,
    damage: number,
    pellets: number,
    range: number,
  ): void {
    const feel = FEEL[src.weap.id];
    const spread = cone(feel, {
      ads: src.weap.ads,
      speed01: Math.hypot(src.vx, src.vz) / SPRINT,
      grounded: src.grounded,
      bloom: src.weap.bloom,
      landInacc: src.landInacc,
      sprintFade: src.weap.sprintFade,
      charge: src.weap.charge,
      charged: WEAPONS[src.weap.id].charge,
      burst: src.recoil.burst,
    });
    src.weap.bloom = Math.min(feel.bloomMax, src.weap.bloom + feel.bloomAdd);
    applyShotRecoil(src.recoil, feel, src.weap.ads);
    const eye = this.eye(src);
    const kickY = src.player ? src.recoil.kickY : src.recoil.kickY * 0.35;
    const kickP = src.player ? src.recoil.kickP : src.recoil.kickP * 0.35;
    const base = this.look(src.yaw + kickY, src.pitch + kickP);
    if (src.player) {
      this.sfx.fire(src.weap.id);
      this.ui.muzzleHud();
      const muzzle = new THREE.Vector3(0.12, -0.08, -0.55).applyMatrix4(this.camera.matrixWorld);
      this.fx.flash(muzzle.x, muzzle.y, muzzle.z);
    }
    let any = false;
    let head = false;
    let hitY = src.y + src.eyeH;
    for (let i = 0; i < pellets; i++) {
      const dir = spreadDir(base.x, base.y, base.z, spread);
      const hit = this.traceShot(src, eye.x, eye.y, eye.z, dir.x, dir.y, dir.z, range);
      if (!hit) continue;
      this.fx.tracer(eye.x, eye.y, eye.z, hit.x, hit.y, hit.z);
      if (hit.kind === "world") {
        this.fx.spark(hit.x, hit.y, hit.z, hit.nx, hit.ny, hit.nz);
      } else {
        any = true;
        if (hit.head) head = true;
        hitY = hit.y;
        if (src.player) this.fx.flesh(hit.x, hit.y, hit.z, hit.head);
        const fall = 1 - (hit.t / range) * (src.weap.id === "hose" ? 0.72 : 0.18);
        const dmg = damage * Math.max(0.25, fall) * (hit.head ? 1.55 : 1);
        this.hurt(hit.target, dmg, src);
      }
    }
    if (any && src.player) {
      this.ui.hit(head, hitY - src.y);
      this.sfx.hit(head);
    }
  }

  private traceShot(
    src: Fighter,
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    range: number,
  ):
    | { kind: "world"; t: number; x: number; y: number; z: number; nx: number; ny: number; nz: number }
    | { kind: "body"; t: number; x: number; y: number; z: number; target: Fighter; head: boolean }
    | null {
    const world = rayWorld(ox, oy, oz, dx, dy, dz, range, this.arena!.colliders);
    let bestT = world?.t ?? range + 1;
    let best:
      | { kind: "world"; t: number; x: number; y: number; z: number; nx: number; ny: number; nz: number }
      | { kind: "body"; t: number; x: number; y: number; z: number; target: Fighter; head: boolean }
      | null = world
      ? { kind: "world", t: world.t, x: world.x, y: world.y, z: world.z, nx: world.nx, ny: world.ny, nz: world.nz }
      : null;
    for (const o of this.fighters) {
      if (!o.alive || o.id === src.id) continue;
      const tall = bodyHeight(o);
      const headBot = o.y + tall - 0.34;
      const headBox = new AABB(o.x - 0.2, headBot, o.z - 0.2, o.x + 0.2, o.y + tall + 0.06, o.z + 0.2);
      const bodyBox = new AABB(o.x - 0.32, o.y + 0.12, o.z - 0.32, o.x + 0.32, headBot, o.z + 0.32);
      const headHit = rayAABB(ox, oy, oz, dx, dy, dz, headBox, bestT);
      const bodyHit = rayAABB(ox, oy, oz, dx, dy, dz, bodyBox, bestT);
      const use = headHit && (!bodyHit || headHit.t <= bodyHit.t) ? headHit : bodyHit;
      const isHead = Boolean(headHit && use === headHit);
      if (!use) continue;
      bestT = use.t;
      best = {
        kind: "body",
        t: use.t,
        x: use.x,
        y: use.y,
        z: use.z,
        target: o,
        head: isHead,
      };
    }
    return best;
  }

  private hurt(target: Fighter, dmg: number, src: Fighter, verb?: string): void {
    if (!target.alive) return;
    if (target.guard > 0 && !verb) return;
    target.hp -= dmg;
    target.lastAttacker = src.id;
    if (target.mesh) {
      target.hitFlash = 0.14;
      flashYardling(target.mesh, true);
    }
    if (target.player) {
      this.ui.hurtFlash();
      this.sfx.hurt();
    }
    if (target.hp <= 0) this.kill(target, src.id, false, verb);
  }

  private kill(target: Fighter, killerId: number, voided: boolean, verbOverride?: string): void {
    if (!target.alive) return;
    target.alive = false;
    target.hp = 0;
    target.deaths += 1;
    target.vx = target.vz = 0;
    this.cancelCharge(target);
    target.weap.ads = 0;
    target.adsWant = false;
    const killer = this.fighters.find((f) => f.id === killerId) ?? target;
    if (killer.id !== target.id) killer.kills += 1;
    const def = WEAPONS[killer.weap.id];
    const verb =
      verbOverride ?? (voided && killer.id === target.id ? "spilled" : def.verb);
    const kName =
      killer.id === target.id ? (verbOverride ? "a tin" : "the drop") : killer.name;
    this.ui.pushFeed(`<em>${esc(kName)}</em> ${verb} <em>${esc(target.name)}</em>`);
    if (killer.player && killer.id !== target.id) {
      this.sfx.kill();
      this.ui.banner(`${verb.toUpperCase()} ${target.name.toUpperCase()}`);
      this.persist.stats.kills += 1;
      savePersist(this.persist);
    }
    if (target.player) {
      cancelCook(this.belt, false);
      this.sfx.death();
      this.persist.stats.deaths += 1;
      savePersist(this.persist);
      this.ui.refreshCareer();
      this.killerId = killer.id;
      this.deathT = DEATHCAM_T;
      this.phase = "deathcam";
      this.ui.setDeath(true, killer.id === target.id ? "gravity" : killer.name);
    } else {
      target.respawn = 2.1;
    }
    if (this.fighters.some((f) => f.kills >= FRAG_LIMIT)) {
      const lead = [...this.fighters].sort((a, b) => b.kills - a.kills)[0]!;
      this.endMatch(`${lead.name} closed the yard`);
    }
  }

  private updateDeathcam(dt: number): void {
    this.deathT -= dt;
    const you = this.player();
    const killer = this.fighters.find((f) => f.id === this.killerId) ?? you;
    this.orbit += dt;
    const ox = killer.x + Math.cos(this.orbit) * 4.2;
    const oz = killer.z + Math.sin(this.orbit) * 4.2;
    if (Math.abs(this.camera.fov - this.hipFov) > 0.2) {
      this.camera.fov = this.hipFov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.position.set(ox, killer.y + 2.4, oz);
    this.camera.lookAt(killer.x, killer.y + 1.3, killer.z);
    this.syncViewmodels(false);
    if (this.deathT <= 0 && this.phase === "deathcam") {
      this.place(you);
      this.phase = "playing";
      this.ui.setDeath(false);
      this.armLock();
    }
  }

  private cameraFrom(p: Fighter, dt: number): void {
    const feel = FEEL[p.weap.id];
    const zoom = lerp(this.hipFov, feel.adsFov, adsWeight(p.weap.ads));
    this.camera.fov = damp(this.camera.fov, zoom, 22, dt);
    this.camera.updateProjectionMatrix();
    this.camera.position.set(p.x, p.y + p.eyeH, p.z);
    const plant = adsWeight(p.weap.ads);
    const roll = -this.lastStrafe * 0.038 * (1 - plant * 0.88) + p.recoil.punchY * 0.42;
    this.camera.rotation.set(
      p.pitch + p.recoil.kickP + p.recoil.punchP,
      p.yaw + p.recoil.kickY + p.recoil.punchY,
      roll,
      "YXZ",
    );
  }

  private handleGadgets(p: Fighter, dt: number): void {
    if (this.input.lampPressed) {
      const on = this.lamp.toggle();
      this.sfx.lamp(on);
    }
    if (this.input.gadgetSlot !== null) {
      const id = GADGET_ORDER[this.input.gadgetSlot];
      if (id) selectGadget(this.belt, id);
    }
    if (this.input.gadgetCycle) cycleGadget(this.belt, this.input.gadgetCycle);

    const def = GADGETS[this.belt.id];
    if (!this.belt.cooking && this.input.gadgetPressed) {
      if (beginCook(this.belt)) {
        this.cancelCharge(p);
        p.adsWant = false;
        if (p.player) this.adsLatch = false;
        if (p.sprinting) this.leaveSprint(p, FEEL[p.weap.id].sprintDelay);
        this.sfx.cook();
      } else {
        this.sfx.dry();
      }
    }
    if (!this.belt.cooking) return;
    if (p.sprinting) this.leaveSprint(p, FEEL[p.weap.id].sprintDelay);
    this.cancelCharge(p);
    p.adsWant = false;
    if (p.player) this.adsLatch = false;
    this.belt.cook += dt;
    if (this.belt.cook >= def.cookMax) {
      this.belt.cooking = false;
      this.belt.cook = 0;
      this.popAt(p.x, p.y + p.eyeH * 0.55, p.z, def.id, p.id);
      return;
    }
    if (this.input.gadgetReleased) this.releaseToss(p);
  }

  private releaseToss(p: Fighter): void {
    if (!this.belt.cooking) return;
    const def = GADGETS[this.belt.id];
    const cooked = this.belt.cook;
    this.belt.cooking = false;
    this.belt.cook = 0;
    const eye = this.eye(p);
    const dir = this.look(p.yaw, p.pitch);
    const vel = throwVelocity(dir.x, dir.y, dir.z, def, p.vx, p.vy, p.vz);
    const toss = spawnToss(
      p.id,
      def.id,
      eye.x + dir.x * 0.55,
      eye.y + dir.y * 0.55 - 0.08,
      eye.z + dir.z * 0.55,
      vel.vx,
      vel.vy,
      vel.vz,
      fuseAfterCook(def, cooked),
    );
    this.scene.add(toss.mesh);
    this.tosses.push(toss);
    this.sfx.toss();
  }

  private stepTosses(dt: number): void {
    const bodies = this.fighters
      .filter((f) => f.alive)
      .map((f) => ({ id: f.id, x: f.x, y: f.y, z: f.z, h: bodyHeight(f) }));
    for (let i = this.tosses.length - 1; i >= 0; i--) {
      const toss = this.tosses[i]!;
      const ev = stepToss(toss, dt, this.arena!.colliders, this.arena!.killY, bodies);
      if (ev.bounced && this.bounceSfx <= 0) {
        this.sfx.bounce();
        this.bounceSfx = 0.08;
      }
      if (ev.stuckNow) this.sfx.stick();
      if (ev.popped) {
        if (!ev.voided) this.popAt(toss.x, toss.y, toss.z, toss.kind, toss.ownerId);
        this.scene.remove(toss.mesh);
        this.tosses.splice(i, 1);
      }
    }
  }

  private popAt(x: number, y: number, z: number, kind: GadgetId, ownerId: number): void {
    const def = GADGETS[kind];
    const src = this.fighters.find((f) => f.id === ownerId);
    this.fx.blast(x, y, z, kind);
    this.sfx.pop(kind);
    if (!src) return;
    for (const f of this.fighters) {
      if (!f.alive) continue;
      const chestY = f.y + bodyHeight(f) * 0.55;
      const dmg = splashDamage(x, y, z, def, f.x, chestY, f.z, f.id === ownerId);
      if (dmg <= 0) continue;
      this.hurt(f, dmg, src, def.verb);
      if (f.bot && f.alive) {
        f.bot.panic = Math.max(f.bot.panic, kind === "wasp" ? 1.7 : 0.7);
        f.bot.react = Math.max(f.bot.react, 0.45);
      }
    }
  }

  private clearTosses(): void {
    for (const t of this.tosses) this.scene.remove(t.mesh);
    this.tosses = [];
    cancelCook(this.belt, false);
    for (const [, g] of this.gadgetModels) g.visible = false;
  }

  private syncViewmodels(show: boolean): void {
    const you = this.fighters.find((f) => f.player);
    const cooking = Boolean(show && you && this.belt.cooking);
    for (const [id, g] of this.gadgetModels) {
      g.visible = cooking && id === this.belt.id;
      if (!g.visible || !you) continue;
      const t = this.clock.elapsedTime;
      const cook = this.belt.cook;
      const shake = cook * 0.028;
      g.position.set(
        0.22 + Math.sin(t * (14 + cook * 10)) * shake,
        -0.26 + Math.cos(t * 11) * shake,
        -0.4,
      );
      g.rotation.set(-0.35 + cook * 0.2, 0.35, 0.18 + Math.sin(t * 9) * shake);
    }
    for (const [id, g] of this.models) {
      g.visible = Boolean(show && you && you.weap.id === id && !cooking);
      if (!you || !g.visible) continue;
      const feel = FEEL[id];
      const pose = poseLerp(feel, you.weap.ads);
      const plant = adsWeight(you.weap.ads);
      const lower = you.weap.swap > 0 ? Math.sin((you.weap.swap / feel.swapTime) * Math.PI) * 0.42 : 0;
      const kick = you.recoil.punchP + you.recoil.kickP * 0.4;
      const t = this.clock.elapsedTime;
      const speed01 = Math.min(1, Math.hypot(you.vx, you.vz) / SPRINT);
      const sway = (1 - plant * 0.94) * (0.007 + speed01 * 0.012);
      const bob = you.grounded ? speed01 * (1 - plant * 0.92) : 0;
      const airDip = you.grounded ? 0 : (1 - plant * 0.7) * 0.018;
      g.position.set(
        pose.px + Math.sin(t * 1.15) * sway + you.recoil.punchY * 0.18,
        pose.py - kick * 0.7 - lower - airDip + Math.cos(t * (7 + bob * 6)) * sway * (0.7 + bob),
        pose.pz + kick * 0.42,
      );
      g.rotation.set(
        pose.rx - kick * 1.25 + bob * Math.sin(t * 8) * 0.04,
        pose.ry + you.recoil.punchY * 0.45,
        pose.rz + (1 - plant) * this.lastStrafe * 0.04,
      );
    }
  }

  private drawMinimap(): void {
    const ctx = this.ui.minimap.getContext("2d");
    if (!ctx || !this.arena) return;
    const w = this.ui.minimap.width;
    const h = this.ui.minimap.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.arena.id === "potting" ? "#3a2a18" : "#0e1824";
    ctx.fillRect(0, 0, w, h);
    const you = this.player();
    const scale = 2.15;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(you.yaw);
    ctx.scale(scale, scale);
    ctx.translate(-you.x, -you.z);
    for (const r of this.arena.minimap) {
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x - r.w / 2, r.z - r.d / 2, r.w, r.d);
    }
    for (const f of this.fighters) {
      if (!f.alive) continue;
      ctx.fillStyle = f.player ? PLAYER_HEX : SIGNAL_HEX;
      ctx.beginPath();
      ctx.arc(f.x, f.z, f.player ? 0.85 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = PLAYER_HEX;
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  private rows(): ScoreRow[] {
    return this.fighters.map((f) => ({
      name: f.name,
      kills: f.kills,
      deaths: f.deaths,
      me: f.player,
    }));
  }

  private eye(f: Fighter): { x: number; y: number; z: number } {
    return { x: f.x, y: f.y + f.eyeH, z: f.z };
  }

  private look(yaw: number, pitch: number): { x: number; y: number; z: number } {
    const cp = Math.cos(pitch);
    return {
      x: -Math.sin(yaw) * cp,
      y: Math.sin(pitch),
      z: -Math.cos(yaw) * cp,
    };
  }

  private resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}

function bodyHeight(f: Fighter): number {
  return f.crouching ? BODY_CROUCH : BODY_H;
}

function turnToward(cur: number, target: number, rate: number, dt: number): number {
  const d = normAngle(target - cur);
  const max = rate * dt;
  if (Math.abs(d) <= max) return cur + d;
  return cur + Math.sign(d) * max;
}

function normAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function spreadDir(
  x: number,
  y: number,
  z: number,
  spread: number,
): { x: number; y: number; z: number } {
  if (spread <= 0) return { x, y, z };
  const nx = x + (Math.random() * 2 - 1) * spread;
  const ny = y + (Math.random() * 2 - 1) * spread;
  const nz = z + (Math.random() * 2 - 1) * spread;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

function hash(n: number): number {
  return ((n * 9301 + 49297) % 233280) / 233280;
}

function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}
