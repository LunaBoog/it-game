# Sprite assets — the art guide

Drop PNGs in this folder. **Missing files silently fall back to the built-in
procedural art**, so you can add assets one at a time and the game keeps working
the whole way. List each new file in `SPRITE_MANIFEST` in `src/game.js`
(several optional slots are already there, commented out).

---

## Technical spec

- **Size: 32×32 px** for characters, props, and tiles. The world is built on
  32 px tiles and the engine draws each sprite scaled to fill one tile, so
  authoring at 32×32 means a clean 1:1 (no blurry upscaling). Markers are 16×16.
- **PNG with alpha** (transparent background).
- **Top-down view**, Pokémon Red/Gold angle — slightly high, looking down.
- **8-bit / Game Boy Color palette** — limited colors, hard pixel edges, no
  anti-aliasing. The renderer uses `imageSmoothingEnabled = false`, so soft
  edges will look wrong.
- **Light source: upper-left.** Highlights top-left, shadows bottom-right.
- **Baseline: feet at the bottom edge** of the 32×32 frame, head near the top.
  A character sprite should fill most of the frame vertically.
- **Drop shadow is drawn by the engine** (a soft ellipse under each character),
  so you don't need to paint one into the sprite.

---

## Filename reference

Everything except the player and the nine NPC down-facing sprites is optional.

```
Player (do these first):
  player_down.png  player_up.png  player_left.png  player_right.png

Player walk frames (optional — animates while moving):
  player_down_1.png  player_up_1.png  player_left_1.png  player_right_1.png
  (the engine alternates base <-> _1 every few frames while walking)

Main NPCs — down-facing (v1):
  npc_karen.png  npc_marcus.png  npc_priya.png  npc_dana.png
  npc_jordan.png  npc_riley.png  npc_chen.png

Side-quest NPCs — down-facing:
  npc_ed.png  npc_lisa.png

NPC directional / walk frames (optional, per id):
  npc_<id>_up.png  npc_<id>_left.png  npc_<id>_right.png
  npc_<id>_down_1.png  (walk frame)

Props:
  ticket_monitor.png   printer.png

Markers — 16×16, optional (override the procedural head badges):
  marker_ticket.png     (the "!" over an NPC with an open ticket)
  marker_sidequest.png  (the "?" over a side quest)
  marker_done.png       (the check shown once something is solved)

Tiles — optional (otherwise drawn procedurally):
  tile_W wall   tile_. office floor   tile_o open-plan carpet
  tile_e cool/exam floor   tile_D desk   tile_c chair   tile_S server rack
  e.g. add  tile_W: "./sprites/wall.png"  to the manifest
```

---

## Character identities (keep these on-model)

Each character already has an established color identity used by the procedural
art. Match these so a generated sprite reads as the same person, and so the
office stays color-coded by area. `accent` is a small detail color (tie, badge,
lanyard, trim). Skin/hair are starting points — feel free to add personality.

| Character | Role / area | Body | Shade | Accent | Hair | Skin | Notes |
|-----------|-------------|------|-------|--------|------|------|-------|
| **You** (player) | IT tech | `#2E6FB0` | `#1B4E84` | `#FCDE5A` | `#2C2C2A` | `#C9926B` | The blue you. Needs all 4 directions. |
| **Karen** | Receptionist | `#D4537E` | `#993556` | `#FCDE5A` | `#6B4A2A` | `#E0B080` | Front desk, pink/magenta. |
| **Marcus** | Open desks | `#1D9E75` | `#0F6E56` | `#9FE1CB` | `#2C2C2A` | `#8A5A3A` | Green, "the internet is down" guy. |
| **Priya** | Open desks | `#7F77DD` | `#534AB7` | `#F4C0D1` | `#1A1A18` | `#C9926B` | Purple, file-share / DNS. |
| **Dana** | Print room | `#BA7517` | `#854F0B` | `#FCDE5A` | `#888780` | `#D8B088` | Amber/gold, grey hair, printer. |
| **Jordan** | Open desks 2 | `#0F6E56` | `#085041` | `#85B7EB` | `#412402` | `#8A5A3A` | Deep teal, 47-tabs-open. |
| **Riley** | Open desks 2 | `#D85A30` | `#993C1D` | `#FCDE5A` | `#BA7517` | `#E0B080` | Orange, permissions ticket. |
| **Mgr Chen** | Manager | `#378ADD` | `#185FA5` | `#F1EFE8` | `#2C2C2A` | `#B08050` | Blue, **glasses**, the boss. |
| **Ed** | Accounting | `#888780` | `#5F5E5A` | `#B5D4F4` | `#C8C4B4` | `#D8B088` | Grey, white hair, **glasses**, older. |
| **Lisa** | Accounting | `#534AB7` | `#3C3489` | `#F4C0D1` | `#2C2C2A` | `#C9926B` | Indigo, standby-monitor side quest. |

Shared ink/outline color is roughly `#2C2C2A`. The world palette leans warm
neutrals (floors `#E8E4D8`, walls `#5F5E5A`, desks `#A88862`), with the door
yellow `#FCDE5A` and screen blue `#85B7EB` as recurring accents — matching the
desk yellow and monitor blue keeps props consistent with the room art.

---

## Suggested generation order

1. `player_down` — see it in the game immediately.
2. The other three player directions.
3. The seven main NPCs (down-facing) — they carry the tickets.
4. The two side-quest NPCs (Ed, Lisa).
5. Props: `ticket_monitor`, `printer`.
6. Polish: markers, walk frames, tiles, directional NPCs.
