# Arena feel brief — movement + gadgets

Yardfrag should play like a **shipped indie browser arena FPS**: weighty feet, planted tools, readable juice. CS2 / TF2 / HL2-family *feel* — 100% original backyard IP. Clipper / Scatterhose / Stake stay the gun table. Do **not** retune `src/game/gunfeel.ts`.

Match on this branch: first to 20 or 6:00, five yardlings, FFA.

**Principles:** weight over twitch; taxes you already feel (cone leftover, ready-delay, silhouette); utility before splash; hostile lime `#F5FF3D` stays reserved.

## 1. Crouch (not on this branch)

No crouch input, pose, or hitbox today (`EYE` 1.55, `BODY_H` 1.7). Add it as a **peek tool**, not a third stance-gun.

- **Enter:** ~0.12–0.18s settle. Instant key, eased camera and hips.
- **Exit:** ~0.16–0.22s stand-up — longer than enter so you cannot jitter-crouch through a Clipper string.
- **Speed tax:** about two-thirds of walk (`WALK` is 6.2). No crouch-sprint. Jump from crouch is a hop, not a launch.
- **Accuracy:** a small *planted* bonus — a sliver of the ADS cone tighten, not a new laser. Crouch does not replace sight. Hip Scatterhose stays a hose; Stake still wants charge + iron.
- **When it matters:** Potting — teak mezzanine rail, dirt-bed lips, clay pots. Cistern — tin roof edges, brass walks, courtyard crates. Crouch shrinks the pot-helmet silhouette. Standing stays the default fight.

## 2. Sprint (already on this branch)

Shipped contract in `game.ts` / `gunfeel.ts` — **keep the numbers**:

- Walk 6.2 / sprint 9.4. Shift or mobile RUN. Bots never sprint.
- Ground velocity is **snapped** to wish × speed (no accel). Air: +10/s, cap 9.4 × 1.05.
- Sprint only while `ads < 0.2` and not wanting sight. ADS cancels sprint and sets `ready` to `sprintDelay * 0.45`. Fire or Stake-charge cancels sprint and applies full `sprintDelay` (0.22 / 0.32 / 0.26) — **no shot that frame**.
- `sprintFade` stays 1 while running, then damps at `sprintFadeRate`; leftover opens the cone (`hipSpread * 1.2`). Jump / land already tax the cone. Coyote 0.1s.

**Polish only (do not retune FEEL):** short ground ease-in / ease-out so the 9.4 burst has mass (same top speed and air cap). Keep the ready-gate; make the plant audible (`audio.ts` footfall). ADS cancel keeps the 0.45× ready and finishes `stepAds`. Don't change `sprintDelay`, `sprintFadeRate`, spreads, or recoil. No slide or bunnyhop.

## 3. Gadgets (none exist)

Two backyard tools. Slot 4. Not a fourth gun.

**Hot Compost** (cook / boom) — fertilizer tin. Cook on hold, throw on release. Fuse ~2s from cook start. Overcook pops in hand. Bounces twice on dirt / tin; shatters on glass and pots. Brown dust ring + straw sparks — no Source fireball.

**Hornet Jar** (break / harass) — clay crock of yard wasps. Short cook or snap-throw. Shatters on first hard hit; ~1.4s fuse in soil. Cloud is a *vision tax* (blur + specks), not a whiteout. Light chip at center.

**Bots / FFA:** no team. Splash and cloud hit everyone, including the thrower (self ~60%). Bots take full effect. Mean bots may lob Compost at last-seen feet; Laid-back bots keep guns. No nade-line scripts.

**Economy (6:00 / first-to-20):** start with **1 Compost + 1 Jar**. Carry cap 2. Respawn does not refill (50% chance of one leftover). One shed crate per yard, ~45s restock, one charge. Target: **2–4 gadget frags per match**. If tools lose the mid-fight, cut gadget ammo — don't buff the gun table.

## 4. Flashlight (none exist)

Worklight on the tool, not a horror battery.

- **Potting Hall:** peach greenhouse, exposure 1.18, four lamps + sun. Beam is *situational* — under the teak mezzanine, behind moss partitions, far corners (fog 18–56).
- **Cistern Roofs:** dusk, exposure 1.02, hemi 0.62, three amber lamps. Beam earns its key in the **courtyard and shed shade**; roofs stay moonlit. Don't dim the map to sell the toy.
- **Power:** ~12s cell, ~4s refill off. Holding it is a choice. Infinite toggle is the mobile fallback.
- **ADS:** stays on. Hip = flood; sight = pencil on the iron. Does not cancel leftover or sight, or raise the cone.
- **Bots:** they already see via LOS + lime outline. Darkness must not hide yardlings. Optional: a beam on a sash makes them glance (a *tell*, not a stun). No flashlight-blind meta.

## 5. Do not clone

- No Valve / CS / TF / HL maps, bombs, buy menus, class kits, grav-gun, HEV, City 17, 2fort, Dust, or scope / HUD chrome.
- No Krunker maps, models, samples, slidehop, or weapon icons.
- No copied Source movement (surf / bhop scripts), nade-line tables, or spray tapes. Cite *principles* (weight, leftover tax, planted iron) — write original numbers.
- No third-party audio. Synthesize wasps, tin, compost.
- Geometry stays code-authored pots, sheds, teak. Names stay backyard: yardlings, Clipper, Scatterhose, Stake, Potting Hall, Cistern Roofs.
