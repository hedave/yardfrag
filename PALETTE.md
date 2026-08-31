# Yardfrag palette

Readability first. Hostile lime is reserved and never used as a large map fill. The two yards do not share one muddy brown.

## Reserved (actors / HUD)

| Role | Hex | Why |
| --- | --- | --- |
| Hostile signal | `#F5FF3D` | Unlit bot outline, sash, nameplate, crosshair. High value, hue sits off both warm plaster and cool tin. |
| Player clay | `#FF8A3D` | Viewmodel + minimap self. Warm, not the bot lime. |
| Pot ink | `#1A1A1E` | Dark pot helmet so the head silhouette holds on cream *and* pale roofs. |
| Hit flash | `#FFFFFF` | One-frame bleach on sash/outline when a bot takes a pellet. |
| Bot bodies | `#E11D74` `#FF6A00` `#4D3BFF` `#FF2BD6` `#00D4AA` | Unique chroma per yardling; outline still reads if a body hue kisses a prop. |

## Potting Hall — warm greenhouse afternoon

| Slot | Hex | Use |
| --- | --- | --- |
| Sky / fog | `#F2C48A` / `#E8B878` | Peach haze. Bright value vs dark pot heads. |
| Floor | `#D2B07A` | Sand tile, lighter than walls were. |
| Plaster walls | `#F3E4C4` | High-value planes. |
| Wainscot / beds | `#1F6B48` / `#2F9E4A` | Dark/mid green so floor ≠ wall ≠ prop. |
| Teak mezzanine | `#8A4E24` | Only large wood. |
| Clay pots | `#E24A1C` | Props, not bots. |
| Key / fill | `#FFD080` warm key, `#9EB8D8` cool fill | Split temperature. |

## Cistern Roofs — cool moonlit tin

| Slot | Hex | Use |
| --- | --- | --- |
| Sky / fog | `#17304C` / `#1E3A52` | Indigo-teal dusk. Obvious in two seconds vs peach hall. |
| Courtyard | `#4A5568` | Slate. Not dirt. |
| Shed walls | `#243044` | Dark blue-slate. |
| Tin roofs | `#8FD4DE` | Pale cyan, high value against the sky. |
| Brass walks | `#D4A429` | Warm accent on a cool map. |
| Key / fill | `#C8D8FF` moon key, amber lamps only as warm points |  |

## HUD

Crosshair and hit marker use `#F5FF3D` with a `#111111` stroke so they hold on peach sky and indigo sky. Health fill `#3DFF6A`. Hurt vignette `#FF2A1A`.
