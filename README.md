# Yardfrag

Original 3D backyard arena shooter for the browser. Dusk dirt, terracotta, and tin roofs — not a clone of Krunker or any commercial game. All maps, yardling silhouettes, tool-guns, HUD, and audio were authored for this project. No third-party game maps, models, or samples.

Inspired by the *pace* of browser arena shooters. The geometry, weapons, and look are original.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Click **Play**, pick a yard and bot mood, then **Drop in**. On desktop, click the view to lock the mouse.

## Build (static)

```bash
npm run build
```

Output is in `dist/`. Serve that folder with any static host (no accounts, no ads, no cloud services).

```bash
npm run preview
```

## Play

- **Move** WASD · **Look** mouse (pointer lock) · **Shoot** click · **Sight (ADS)** right-mouse or F hold · **Jump** Space · **Sprint** Shift
- **Reload** R · **Weapons** 1 / 2 / 3 or scroll
- **Scoreboard** Tab · **Pause** Esc
- First to 20 frags or 6 minutes. Five yardling bots, free-for-all.

Hip fire and sight are two different guns: hip is a loose cone (walk bob, yaw, open crosshair). Hold RMB to raise the tool onto its yard-iron — a short smoothed motion, not a snap — plant the look, and tighten the cone. Recoil kicks the shot and the look; first shot is honest, follow-ups climb, recovery is something you pull against. Jump, land, and sprint leftover open the cone. Sprint blocks full-accuracy fire; reload and swap drop you out of sight.

### Weapons

| Tool | Feel |
| --- | --- |
| **Clipper** | Hitscan hedge shears. Hip sprays; sight is a planted tap gun. Recoil climbs a string. |
| **Scatterhose** | Seed-pellet shotgun. Hip is a wide hose; sight is still a hose, just denser. Big shove. |
| **Stake** | Trellis needle. LMB hold charges, RMB sights. Charge is not the zoom. Heavy single kick. |

### Yards

- **Potting Hall** — indoor greenhouse warehouse: dirt beds, mezzanine, hanging lamps.
- **Cistern Roofs** — dusk rooftops, tin sheds, plank bridges, courtyard below.

### Settings

Look feel, sight feel (ADS multiplier), field of view, hold vs toggle sight, volume, and invert-Y persist in `localStorage` with career stats (frags, falls, time, matches).

### Mobile

Touch look on the right, joystick on the left, FRAG / jump / run / reload. Desktop is the primary layout.

## Audio

Tiny synthesized WebAudio stings only (noise bursts and oscillators). No copyrighted samples.

## Multiplayer

Local bots ship first. Client-server netcode is intentionally stubbed in `src/game/netstub.ts` so the playable loop is not blocked on networking.

## Stack

Vite + TypeScript + Three.js. Geometry is built in code. No AWS, secrets, accounts, or ads.

## Readability

Hostile lime `#F5FF3D` is reserved for bot outlines, nameplates, and the crosshair (dark stroke so it holds on peach *and* indigo skies). Maps do not share one brown: Potting Hall is a warm greenhouse afternoon; Cistern Roofs is cool moonlit tin. Hex table: [PALETTE.md](PALETTE.md).
