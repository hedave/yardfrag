# Loadout and skins brief

Research-only. Do not implement from this document.

Starts from playtest branch `cursor/playtest-fixes-8ec4`. Local-first: career already lives in `localStorage` key `yardfrag-v1` (`src/game/settings.ts`). No accounts, no shop, no microtransactions.

Yardfrag is a backyard arena shooter. Tools are hedge shears, a seed hose, and a trellis needle — not rifles. Skins stay in that shed.

---

## 1. What a skin is

A **skin** (player-facing: **finish**) is a material, color, and optional decal pass on the **existing first-person viewmodel**. It is not a new gun.

### Locked geometry

`createViewmodel(id)` in `src/game/yardling.ts` already builds the three tools from boxes, cylinders, toruses, and spheres. That silhouette is the product:

| Tool | `WeaponId` | What the player sees |
| --- | --- | --- |
| CLIPPER | `clipper` | Cedar body, tin blade + six teeth, clay grip, shear-notch irons (hood, rear posts, bridge, front post, clay bead) |
| SCATTERHOSE | `hose` | Clay tank, tin nozzle, cedar grip, washer-ring irons + clay bead |
| STAKE | `stake` | Tin barrel, cedar stock, clay collar, trellis-hoop irons + pin + clay tip |

The `irons` group (`g.userData.irons`) is the ADS picture. Hip and sight poses live in `FEEL[id].hipPos / adsPos / hipRot / adsRot` (`src/game/gunfeel.ts`). Skins do not add meshes, hide meshes, scale parts, or move irons.

Bots do not get viewmodels. Third-person yardlings (`createYardling`) stay unsinned. Skins are first-person only.

### What a finish may change

Four shared material slots already exist in `createViewmodel`:

| Slot | Default (today) | Typical parts |
| --- | --- | --- |
| `cedar` | `#3A2A28`, roughness `0.7` | Clipper body/hood, hose grip, Stake stock |
| `tin` | `#C8D4DC`, metalness `0.55`, roughness `0.35` | Clipper blade/teeth, hose nozzle, Stake barrel |
| `clay` | player `#FF8A3D`, emissive `0.22` | Clipper grip + bead, hose tank + bead, Stake collar + tip |
| `iron` | `#D8E2E8`, metalness `0.7`, roughness `0.28`, emissive `#6A8088` `@ 0.18` | Sight posts, washer ring, trellis hoop, pin |

A finish remaps those slots: `color`, `roughness`, `metalness`, `emissive`, `emissiveIntensity`. That is the whole paint job.

Optional **decal**: one procedural canvas texture (same technique as nameplates in `makeNameplate`) on **one large body face** — Clipper `body`, hose `tank`, or Stake `stock`. Pattern IDs are authored in-repo (seed dots, pot rings, hose stripes, trellis lattice). No image files from other games.

Meshes today are mostly unnamed. An implementation must name those three body parts and the four materials so a finish can retint without rebuilding the group. Naming is not a new model.

### What a finish is not

- A second viewmodel, a “legendary” mesh, a charm, a sticker stack, or a kill-counter.
- A change to ADS lift (`raise`), swap dip, bob, or punch. Pose stays `poseLerp(FEEL[id], ads)`.
- A change to muzzle HUD flash, tracer color, spark color, or fire SFX. Those are tool identity, not finish.
- Lime `#F5FF3D` as a large viewmodel fill. That hex is reserved hostile signal (outlines, nameplates, crosshair). Clay `#FF8A3D` is the default player slot; finishes may stain it, not turn it into bot lime.

Sight readability: iron + bead must still read on Potting Hall peach (`#F2C48A`) and Cistern indigo (`#17304C`). Recolor irons only if contrast holds. Do not move the washer / notch / hoop.

---

## 2. Unlock / select UX (home + pause)

Match the existing terracotta / lime chrome. Do not invent a locker, shop rail, or inspect stage.

### Surfaces that already exist

Home (`#panel-home`): **Play** (primary clay), **Settings**, **Credits** (ghost), then `#career` chips — straw numbers on muted plaques (`frags / falls / min / matches`).

Pause (`#panel-pause`): yard board, then **Resume** (primary), **Settings**, **Quit yard**. Settings already supports `fromPause` so Back returns to pause.

Menu card: soil gradient, clay left rail, straw title with clay-dim shadow, `#menu-card` width `min(400px)` (pause `480px`). One column. Panel swap is `showPanel` + `.enter`.

### Shed panel

Add one menu action and one panel. Player-facing name: **Shed**. Not Loadout, Locker, Arsenal, Collection, or Shop.

| Where | Control | Style |
| --- | --- | --- |
| Home | **Shed** button under Play, above Settings | `.btn.btn-block` — same as Settings, not `.primary` |
| Pause | **Shed** button in the existing `.row` next to Settings | `.btn` — same as Settings |
| Back | Same `fromPause` pattern as Settings | `.btn` |

`#panel-shed` lives inside `#menu-card`. No second overlay, no 3D inspect canvas, no featured banner.

### Layout (one column, existing type)

1. `h2` **Shed** — existing clay uppercase (`letter-spacing: 0.16em`).
2. Tool row: three `.btn`s — **Clipper / Scatterhose / Stake**. Selected tool uses `.primary` (clay fill, soil text). Others stay soil buttons. This is tabbing, not a purchase.
3. Fine line under the row: current finish name + unlock hint, `.fine` / `--muted`.
4. Finish list: one `.btn.btn-block` per finish for the selected tool.
   - Equipped: clay border + straw label (same hover language as `.btn:hover`, or the scoreboard `.me` clay wash).
   - Unlocked, not equipped: default soil button.
   - Locked: muted text, no lime rarity gem. Second line in `.fine`: `25 frags` / `5 matches` / `30 min in the yard` — same nouns as career chips.
5. Career chips stay on home. Shed may repeat the relevant chip values as copy, not as a battle-pass bar.

Optional, still in this panel: **Drop with** — which tool is in hand at match start. Today `makeFighter` always calls `makeWeapon("clipper")`. Three small buttons, one primary. Does not lock the other tools; 1 / 2 / 3 still swap in-match. This is loadout. It is not a skin.

### Select behavior

- Click an unlocked finish → write `persist.loadout.equipped[weaponId]`, `savePersist`, retint the cached viewmodel if one exists.
- Click a locked finish → no buy modal. The row stays muted. Hover / focus can repeat the career gate.
- Pause apply is live: next swap or immediate retint. Do not require a match restart for color.
- Esc / Resume / Back never opens a store.

No prices, no “NEW”, no daily featured, no rarity colors (blue / purple / gold), no crate open, no inspect-and-rotate.

Touch: Shed is a menu panel. Do not add a fourth HUD button. Mobile already has 1 / 2 / 3 on `#btn-weps`.

---

## 3. Data shape

Extend `Persist` additively. Keep key `yardfrag-v1`. `loadPersist` already reads `Partial<Persist>` and fills defaults — new fields must default so old careers keep frags / settings.

### IDs

```
WeaponId = "clipper" | "hose" | "stake"     // already in src/game/types.ts
FinishId = `${WeaponId}.${slug}`            // e.g. clipper.bare, hose.pot-glaze
```

`slug` is kebab-case, yard words only (`bare`, `pot-glaze`, `mulch-stain`, `greenhouse-tin`, `cistern-rust`, `seed-dot`, `night-water`). Never `ak47_asiimov`, `vandal_prime`, or `wrap_slurp`.

Defaults (always unlocked, match today’s unpainted viewmodel):

- `clipper.bare`
- `hose.bare`
- `stake.bare`

### Persist (cosmetic + loadout only)

```ts
interface PersistLoadout {
  startWeapon: WeaponId;                       // drop-in tool; default "clipper"
  equipped: Record<WeaponId, FinishId>;        // one finish per tool
  unlocked: FinishId[];                        // earned ids; defaults implied if missing
}

// on Persist:
loadout: PersistLoadout
```

`unlocked` lists earned extras. Bare finishes are implicit. On load: if `equipped[id]` is unknown or still locked, fall back to `${id}.bare`. Ignore finishes whose `weapon` prefix does not match the slot.

Career gates stay on `persist.stats` — do not duplicate counters.

```ts
type FinishUnlock =
  | { kind: "default" }
  | { kind: "career"; frags?: number; matches?: number; minutes?: number };
```

Unlock is `AND` across provided fields (e.g. `{ frags: 25 }` means `stats.kills >= 25`). Recompute on load and after each `savePersist` of stats (frag, fall, end-match). No hidden weekly clock.

### Finish catalog (code table, not persist)

```ts
interface FinishDef {
  id: FinishId;
  weapon: WeaponId;
  name: string;            // player: "Pot glaze", "Mulch stain"
  unlock: FinishUnlock;
  slots: Partial<Record<"cedar" | "tin" | "clay" | "iron", FinishSlot>>;
  decal?: FinishDecal;     // optional, one body face
}

interface FinishSlot {
  color: number;                 // 0xRRGGBB
  roughness?: number;
  metalness?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

interface FinishDecal {
  mesh: "body" | "tank" | "stock";
  pattern: "seed-dot" | "pot-ring" | "hose-stripe" | "trellis";
  ink: number;
  ground?: number;
}
```

### Cosmetic-only fields

These may appear on a finish. Nothing else.

- `slots.*.color / roughness / metalness / emissive / emissiveIntensity`
- `decal.pattern / ink / ground / mesh` (mesh is a name on the original group, not new geometry)
- `name`, `id`, `weapon`, `unlock` (metadata)

`WeaponState` (`mag`, `reserve`, `cooldown`, `reloading`, `charge`, `ads`, `bloom`, `ready`, `sprintFade`, `swap`, `pending`) stays gameplay. Do not hang a finish id on the fighter unless a later implementer needs a debug hook — persist is the source of truth.

### Suggested first catalog (still not an implementation)

Keep it small: bare + two extras per tool. Gates use career nouns already on the home chips.

| id | Name | Gate |
| --- | --- | --- |
| `clipper.bare` | Bare cedar | default |
| `clipper.pot-glaze` | Pot glaze | 10 frags |
| `clipper.greenhouse-tin` | Greenhouse tin | 5 matches |
| `hose.bare` | Wet clay | default |
| `hose.mulch-stain` | Mulch stain | 10 frags |
| `hose.seed-dot` | Seed packet | 30 min |
| `stake.bare` | Trellis tin | default |
| `stake.cistern-rust` | Cistern rust | 5 matches |
| `stake.night-water` | Night water | 25 frags |

Colors, when authored, come from `PALETTE.md` / yard props (clay `#E24A1C`, teak `#8A4E24`, tin `#8FD4DE`, rust `#C43A22`, pot ink `#1A1A1E`) — not from other shooters’ finish ramps.

---

## 4. What must NEVER change with a skin

If a finish file contains any of these, it is a bug. Combat numbers live in `WEAPONS` and `FEEL` only.

### Damage and ballistics (`WeaponDef` + shoot path)

Do not touch `src/game/weapons.ts` or the shoot math in `game.ts`:

- `damage`, `pellets`, `range`, `rpm`, `mag`, `reserve`, `reload`
- `auto`, `charge`, `chargeTime`
- Stake charge curve: `44 + charge * (def.damage - 44)` (`releaseStake`)
- Head multiplier `1.55` and range falloff (`hose` `0.72`, others `0.18`, floor `0.25`)
- `fireInterval`, `canShoot`, bloom add on shot

### Spread (`GunTune` + `cone()`)

`hipSpread`, `adsSpread`, `moveSpread`, `jumpSpread`, `bloomAdd`, `bloomMax`, `bloomDecay`, `firstSpread`, `followSpread`. Also the live inputs: walk, air, land tax, sprint leftover, charge tighten, burst follow.

Crosshair gap (`crosshairGap`) is a read of spread. Do not retune it per finish.

### Recoil (`GunTune` + `applyShotRecoil` / `recoverRecoil`)

`recoilPitch`, `recoilYaw`, `followPitch`, `followYaw`, `punchPitch`, `punchYaw`, `recoverKick`, `recoverPunch`, `recoverIdle`, `burstWindow`, `hipRecoil`, `adsRecoil`, `adsPunch`. Kick still moves look and shot. Punch still dies on its own.

### ADS numbers

Arena sight is a second gun, not a skin zoom.

- `adsFov`, `adsTime`, `adsMove`, `adsLook`
- `adsPos`, `adsRot`, `hipPos`, `hipRot`, `raise`
- `adsWeight` / `stepAds` / `lookScale` / `poseLerp`
- User settings `fov`, `adsSensitivity`, `adsToggle` — these are persist settings, not finishes

Measured playtest targets stay: Clipper hip FOV 80 → sight ~50, hose ~62, Stake ~32. Stake charge is not the zoom.

### Also never per-finish

- `sprintDelay`, `sprintFadeRate`, `swapTime`
- Viewmodel bob / sway / swap-lower in `syncViewmodels`
- `Sfx.fire` / charge drone / ads / swap ticks
- `Fx` muzzle light, terracotta dust, lime flesh, tracers
- HUD: weapon name, ammo, SIGHT chip, washer overlay (`#sight-iron`)
- Collision, movement, HP, bot aim

A finish that “feels better” because it tightened the cone or shortened swap is not a finish.

---

## 5. Anti-clone

Yardfrag already refuses Krunker maps, ripped models, and sample packs. Skins follow the same rule.

### Forbidden marketplace patterns

Do not ship any of these, even as jokes:

- Rarity ladders (Consumer → Covert, Iron → Gold, Common → Mythic)
- Cases, keys, loot boxes, trade-ups, contracts, wear / float bars
- A store, daily featured, rotating offers, V-Bucks / radianite / key prices
- Trading, listing, gift, or “marketplace” UI
- StatTrak / kill-counter finishes, charm rails, sticker corners
- Inspect stage: orbit cam, fullscreen gun, price under the model
- Battle-pass exclusive tracks or timed shop tiles
- “Variants” that change VFX, tracers, or inspect animations as a tier flex

If the screen looks like CS inventory, Valorant Collection, or Fortnite Locker, it is wrong. Shed is a soil plaque with three tool buttons.

### Forbidden art

- No ripped or traced textures from CS, Valorant, Fortnite, or any commercial title (Fade, Doppler, Asiimov grid, Howl, Prime circuit, slurp wrap, etc.).
- No downloaded “free skin” packs. Decals are drawn in code, like nameplates.
- No anime / dragon / holographic foil language. Names stay shed-side: glaze, stain, tin, rust, seed, mulch, night water.
- No second silhouette. A gold dragon Clipper with a new barrel is a new gun. Reject it.

### Original yard language

Finishes read as potting-bench work: wet clay, teak stain, greenhouse tin, cistern rust, seed-packet dots. Palette stays dusk dirt + terracotta + reserved lime. Credits line still holds: maps, tools, HUD, and audio authored here.

---

## Out of scope

- Implementation (viewmodel naming, persist field, Shed panel, catalog table).
- New weapons, maps, netcode, gunfeel retune, palette restyle.
- Third-person tool meshes on yardlings.
- Cloud saves, accounts, ads.

Failure for a later implementer: any PR that adds a shop, a new gun mesh, or a number from `WEAPONS` / `FEEL` on a finish.
