# Yardfrag palette

Readability first. Hostile lime is reserved and never used as a large map fill. The two yards do not share one muddy brown. Lighting and fog are authored so those reserved colors hold instead of flattening into the haze.

## Reserved (actors / HUD)

| Role | Hex | Why |
| --- | --- | --- |
| Hostile signal | `#F5FF3D` | Unlit bot outline, sash, nameplate, crosshair. High value, hue sits off both warm plaster and cool tin. Fog is off on these materials so the silhouette still pops at range. |
| Player clay | `#FF8A3D` | Viewmodel + minimap self. Warm, not the bot lime. |
| Pot ink | `#1A1A1E` | Dark pot helmet so the head silhouette holds on cream *and* pale roofs. |
| Hit flash | `#FFFFFF` | One-frame bleach on sash/outline when a bot takes a pellet. |
| Bot bodies | `#E11D74` `#FF6A00` `#4D3BFF` `#FF2BD6` `#00D4AA` | Unique chroma per yardling; outline still reads if a body hue kisses a prop. Bodies take map light; the lime sash does the long-range read. |

## Potting Hall — warm greenhouse afternoon

Late sun through glass. Peach zenith, amber horizon, lamps as warm practicals. Cool sky fill keeps plaster from going one flat cream.

| Slot | Hex | Use |
| --- | --- | --- |
| Sky / fog | `#FFE2B0` zenith · `#F2C48A` · `#E8A868` horizon / `#E0B070` fog | Peach haze. Fog starts farther than a tutorial cube so mid-yard still has chroma. |
| Floor | `#D2B07A` | Sand tile with grout; lighter than wainscot. |
| Plaster walls | `#F3E4C4` | High-value planes, vertex AO at the skirting. |
| Wainscot / beds | `#2A8A52` / `#2F9E4A` | Mid green so floor ≠ wall ≠ prop, and the beds do not crush to black. |
| Teak mezzanine | `#8A4E24` | Only large wood. Grain + underside AO. |
| Clay pots | `#E24A1C` | Props, not bots. |
| Key / fill / rim | `#FFD080` sun, `#9EB8D8` cool fill, `#FFE8C4` warm rim | Split temperature. Exposure ~1.16. |

## Cistern Roofs — cool moonlit tin

Moon key, indigo-teal dusk, amber lamps only as points. Tin is the bright plane; shed walls stay dark so lime reads against both.

| Slot | Hex | Use |
| --- | --- | --- |
| Sky / fog | `#0C1C34` zenith · `#17304C` · `#2A4A68` horizon / `#152838` fog | Indigo dusk. Obvious in two seconds vs peach hall. |
| Courtyard | `#4A5568` | Slate. Not dirt. Moon fill keeps midtones so sheds do not become a void. |
| Shed walls | `#3A4E64` | Blue-slate clapboard that still reads under moon fill, AO in the eaves. |
| Tin roofs | `#8FD4DE` | Pale cyan, corrugated; moon spec catches the key. |
| Brass walks | `#D4A429` | Warm accent on a cool map. |
| Key / fill / rim | `#C8D8FF` moon key, `#6A88B8` fill, `#A8C4E8` rim | Amber lamps only as warm points. Exposure ~0.94 so night stays night. |

## Lighting rules

- Maps stay different times of day. Do not flatten both to a grey three-point rig.
- Signal lime and player clay are never large fills. World materials use roughness/metalness/AO so those two colors stay the loudest marks.
- Yardling outline / sash / chevron / nameplate do not take fog. They are MeshBasic, not a PBR shader ball.
- Geometry is original (code-built). No third-party game maps or commercial kits.
