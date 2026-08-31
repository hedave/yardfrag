export class Input {
  forward = 0;
  strafe = 0;
  jump = false;
  jumpPressed = false;
  sprint = false;
  firing = false;
  firePressed = false;
  fireReleased = false;
  reload = false;
  weap: number | null = null;
  cycle = 0;
  lookDx = 0;
  lookDy = 0;
  tab = false;
  tabToggle = false;
  pause = false;
  lockLost = false;
  invertY = false;
  sensitivity = 1;

  private keys = new Set<string>();
  private lookTouch: number | null = null;
  private lookLastX = 0;
  private lookLastY = 0;
  private joyTouch: number | null = null;
  private joyX = 0;
  private joyY = 0;
  private fireTouch = false;
  locked = false;
  private unbind: Array<() => void> = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private touchRoot: HTMLElement,
  ) {}

  attach(): void {
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (["Space", "Tab"].includes(e.code)) e.preventDefault();
      if (down) this.keys.add(e.code);
      else this.keys.delete(e.code);
      if (down && e.code === "Escape") this.pause = true;
      if (down && e.code === "Digit1") this.weap = 0;
      if (down && e.code === "Digit2") this.weap = 1;
      if (down && e.code === "Digit3") this.weap = 2;
      if (down && e.code === "KeyR") this.reload = true;
      if (down && (e.code === "Tab" || e.code === "KeyB")) this.tabToggle = true;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    this.unbind.push(() => window.removeEventListener("keydown", kd));
    this.unbind.push(() => window.removeEventListener("keyup", ku));

    const mm = (e: MouseEvent) => {
      if (!this.locked) return;
      this.lookDx += e.movementX;
      this.lookDy += e.movementY;
    };
    const md = (e: MouseEvent) => {
      if (e.button === 0 && this.locked) {
        this.firing = true;
        this.firePressed = true;
      }
    };
    const mu = (e: MouseEvent) => {
      if (e.button === 0 && this.locked) {
        this.firing = false;
        this.fireReleased = true;
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!this.locked) return;
      this.cycle += e.deltaY > 0 ? 1 : -1;
    };
    document.addEventListener("mousemove", mm);
    document.addEventListener("mousedown", md);
    document.addEventListener("mouseup", mu);
    document.addEventListener("wheel", wheel, { passive: true });
    this.unbind.push(() => document.removeEventListener("mousemove", mm));
    this.unbind.push(() => document.removeEventListener("mousedown", md));
    this.unbind.push(() => document.removeEventListener("mouseup", mu));
    this.unbind.push(() => document.removeEventListener("wheel", wheel));

    const plc = () => {
      const next = document.pointerLockElement === this.canvas;
      if (this.locked && !next) this.lockLost = true;
      this.locked = next;
    };
    document.addEventListener("pointerlockchange", plc);
    this.unbind.push(() => document.removeEventListener("pointerlockchange", plc));

    this.bindTouch();
  }

  requestLock(): void {
    if (this.isTouch()) return;
    const req = this.canvas.requestPointerLock();
    if (req && typeof req.catch === "function") {
      void req.catch(() => {
        /* browser may require a click on the canvas itself */
      });
    }
  }

  exitLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  isTouch(): boolean {
    return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  }

  beginFrame(): void {
    this.forward = (this.keys.has("KeyW") ? 1 : 0) + (this.keys.has("KeyS") ? -1 : 0);
    this.strafe = (this.keys.has("KeyD") ? 1 : 0) + (this.keys.has("KeyA") ? -1 : 0);
    if (this.joyTouch !== null) {
      this.strafe += this.joyX;
      this.forward += -this.joyY;
    }
    this.forward = clamp(this.forward, -1, 1);
    this.strafe = clamp(this.strafe, -1, 1);
    const jumping = this.keys.has("Space");
    this.jumpPressed = jumping && !this.jump;
    this.jump = jumping;
    this.sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    this.tab = this.keys.has("Tab") || this.keys.has("KeyB");
    if (this.fireTouch) this.firing = true;
  }

  endFrame(): void {
    this.lookDx = 0;
    this.lookDy = 0;
    this.firePressed = false;
    this.fireReleased = false;
    this.reload = false;
    this.weap = null;
    this.cycle = 0;
    this.pause = false;
    this.lockLost = false;
    this.tabToggle = false;
    this.jumpPressed = false;
  }

  private bindTouch(): void {
    const joy = this.touchRoot.querySelector("#joy") as HTMLElement;
    const look = this.touchRoot.querySelector("#lookzone") as HTMLElement;
    const fire = this.touchRoot.querySelector("#btn-fire") as HTMLElement;
    const jump = this.touchRoot.querySelector("#btn-jump") as HTMLElement;
    const sprint = this.touchRoot.querySelector("#btn-sprint") as HTMLElement;
    const reload = this.touchRoot.querySelector("#btn-reload") as HTMLElement;
    const pause = this.touchRoot.querySelector("#btn-pause") as HTMLElement;
    const stick = this.touchRoot.querySelector("#joy-stick") as HTMLElement;

    const joyStart = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      joy.setPointerCapture(e.pointerId);
      this.joyTouch = e.pointerId;
      this.updateJoy(joy, stick, e);
    };
    const joyMove = (e: PointerEvent) => {
      if (e.pointerId !== this.joyTouch) return;
      this.updateJoy(joy, stick, e);
    };
    const joyEnd = (e: PointerEvent) => {
      if (e.pointerId !== this.joyTouch) return;
      this.joyTouch = null;
      this.joyX = 0;
      this.joyY = 0;
      stick.style.transform = "";
    };
    joy.addEventListener("pointerdown", joyStart);
    joy.addEventListener("pointermove", joyMove);
    joy.addEventListener("pointerup", joyEnd);
    joy.addEventListener("pointercancel", joyEnd);

    const lookStart = (e: PointerEvent) => {
      if (e.target !== look) return;
      this.lookTouch = e.pointerId;
      this.lookLastX = e.clientX;
      this.lookLastY = e.clientY;
    };
    const lookMove = (e: PointerEvent) => {
      if (e.pointerId !== this.lookTouch) return;
      this.lookDx += e.clientX - this.lookLastX;
      this.lookDy += e.clientY - this.lookLastY;
      this.lookLastX = e.clientX;
      this.lookLastY = e.clientY;
    };
    const lookEnd = (e: PointerEvent) => {
      if (e.pointerId === this.lookTouch) this.lookTouch = null;
    };
    look.addEventListener("pointerdown", lookStart);
    look.addEventListener("pointermove", lookMove);
    look.addEventListener("pointerup", lookEnd);
    look.addEventListener("pointercancel", lookEnd);

    const hold = (el: HTMLElement, down: () => void, up?: () => void) => {
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        down();
      });
      el.addEventListener("pointerup", (e) => {
        e.stopPropagation();
        up?.();
      });
      el.addEventListener("pointercancel", () => up?.());
    };

    hold(
      fire,
      () => {
        this.fireTouch = true;
        this.firing = true;
        this.firePressed = true;
      },
      () => {
        this.fireTouch = false;
        this.firing = false;
        this.fireReleased = true;
      },
    );
    hold(jump, () => {
      this.jump = true;
      this.jumpPressed = true;
    }, () => {
      this.jump = false;
    });
    hold(sprint, () => {
      this.keys.add("ShiftLeft");
    }, () => {
      this.keys.delete("ShiftLeft");
    });
    hold(reload, () => {
      this.reload = true;
    });
    hold(pause, () => {
      this.pause = true;
    });
    const board = this.touchRoot.querySelector("#btn-board") as HTMLElement | null;
    if (board) {
      hold(
        board,
        () => this.keys.add("Tab"),
        () => this.keys.delete("Tab"),
      );
    }

    this.touchRoot.querySelectorAll("#btn-weps button").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const w = Number((btn as HTMLElement).dataset.weap);
        this.weap = w;
      });
    });
  }

  private updateJoy(joy: HTMLElement, stick: HTMLElement, e: PointerEvent): void {
    const r = joy.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2);
    let dy = (e.clientY - cy) / (r.height / 2);
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      dx /= mag;
      dy /= mag;
    }
    this.joyX = dx;
    this.joyY = dy;
    stick.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
  }
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}
