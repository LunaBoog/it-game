# Game Handoff Sheet — "The Ticket Queue" (IT Support RPG)

**Purpose of this doc:** a complete record of what was built/changed in this pass,
*and* a blueprint of the patterns to carry into a new game you want built "like
this version." Read Part 1–2 to understand the template, Part 3 for the exact
changelog, Parts 4–7 for the reusable conventions and specs.

---

## Part 1 — What this game is (the template)

A top-down, Pokémon-style RPG that teaches IT troubleshooting. You play the IT
person on Floor 3 of an office. The loop:

1. Read the **ticket monitor** in your room to see the day's queue (7 tickets).
2. Walk the office, find the **NPC** who filed each ticket (marked with a "!").
3. Open a **scenario**: spend a limited number of *actions* investigating clues
   (points of interest), build an **evidence log**, then commit a **diagnosis**.
4. A correct diagnosis closes the ticket and teaches the underlying **principle**
   (e.g. "Physical layer first," "Scope the problem," "Name vs IP / DNS").
5. **Side quests** are *not* on the board — you find them by noticing things while
   walking (a printer blinking for ink, a coworker's "dead" monitor on standby).
6. Clear all 7 tickets, return to the monitor for an **end-of-day** summary, then
   start a fresh day with a reset queue.

**Tech:** vanilla ES modules + HTML5 Canvas. Vite for dev/build. No framework, no
runtime dependencies. localStorage for saves. Ships two ways: a Vite app and a
single double-clickable `standalone.html`.

**Design feel:** calm and readable. Procedural pixel art as a baseline that
real sprite PNGs override when present. The "modal" is an inline panel *below*
the game (not a dimmed overlay), so the office stays visible while you work a
ticket.

---

## Part 2 — Architecture & file map (the blueprint)

The thing worth copying for the new game is the **clean separation of data from
engine from UI**. Content lives in plain data files anyone can edit; the engine
and UI never need touching to add a level, NPC, or scenario.

```
src/
  world.js       DATA: the map, rooms, NPCs, props, player start. Pure data +
                 a programmatic map builder. Edit this to change the level.
  scenarios.js   DATA: the 7 main tickets (clues, evidence, diagnoses, principle).
  sideQuests.js  DATA: the quick one-shot side quests.

  render.js      ENGINE: all canvas drawing — tiles, people, props, markers,
                 camera, lighting. Sprite PNGs override procedural art here.
  game.js        ENGINE: game loop, input (keyboard + touch), movement, state,
                 the sprite manifest, save/load wiring.

  ui.js          UI: everything inside the modal panel (intro, ticket board,
                 scenario flow, side quests, end-of-day, NPC chat).
  storage.js     UTIL: typed localStorage helpers (Set/string/bool/num).
  main.js        ENTRY: imports startGame() and calls it.
  styles.css     All styling (CSS variables theme at the top).

index.html       Markup shell: topbar, legend, viewport/canvas, title screen,
                 touch controls, the modal panel.
tools/
  build-standalone.mjs   Bundles src/ into standalone.html (no bundler needed).
public/sprites/
  README.md      The art spec / asset guide for sprite generation.
  *.png          Drop sprites here; missing files fall back to procedural art.
vite.config.js   base "./" so it works deployed in a subfolder.
netlify.toml     build = vite build, publish = dist.
```

**Key architectural patterns to reuse:**

- **Data-driven content.** A scenario is just an object: `{ title, principle,
  principleText, ticket, ticketMeta, actions, pois[], diagnoses[] }`. A POI is
  `{ id, label, body, evidence, followups?[] }`. Adding a ticket = adding one
  object. No engine changes.
- **Programmatic map builder.** `world.js` builds the grid with `blank()`,
  `carve(room)`, `door()`, `stamp(furniture)` so every row is guaranteed uniform
  width — no hand-aligned ASCII maps that drift.
- **Tile codes → walkability via a Set.** `BLOCKING = new Set(["W","D","S"])`;
  `isWalkable()` just checks membership. Adding a solid tile type is one entry.
- **Procedural-first art with sprite override.** The renderer draws characters
  procedurally from a small color object `{ body, body2, accent, hair, skin,
  glasses? }`. If a matching PNG is loaded, it's used instead. The game looks
  complete before any art exists, and art can be added one file at a time.
- **Typed storage helpers.** `loadSet/saveSet`, `loadNum/saveNum`, etc., all
  namespaced with a prefix (`it-game:`) and wrapped in try/catch so a disabled
  or full localStorage never crashes the game.
- **Single source of truth + a build step.** Edit `src/`, then regenerate the
  standalone bundle. Never hand-edit `standalone.html`.

---

## Part 3 — This session's changelog

Legend: **[ADD]** new · **[CHANGE]** behavior changed · **[GLOW]** polish/visual ·
**[FIX]** bug · **[DOC]** documentation.

### render.js (engine — most of the visual work)

- **[GLOW] Idle "breathing" animation.** Standing characters now bob gently
  (`bobFor()`), and each NPC is desynced by a stable per-id seed (`seedFor()`)
  so the room doesn't move in lockstep. Previously all characters were static.
- **[ADD] Walk-cycle + directional sprite support.** New `pickSprite()` resolves
  the best available image via a fallback chain:
  `id_<facing>_<frame> → id_<facing> → id_down_<frame> → id_down → id`.
  This means optional directional sprites *and* optional 2-frame walk animations
  work automatically when the PNGs exist, with zero code changes.
- **[FIX] Marker PNGs now actually override the procedural badges.** The head
  bubbles ("!", "?", check) can now be replaced by `marker_ticket.png`,
  `marker_sidequest.png`, `marker_done.png`. Previously the README promised these
  but `drawBubble()` never looked at the markers bucket, so generated marker art
  would have silently done nothing.
- **[FIX] Camera centering on large screens.** `sizeCanvas()` letterboxes the
  canvas to the map's aspect ratio, but the follow-camera clamped its low bound
  to `0`, so on a screen larger than the native map (960×704) the office was
  pinned to the top-left with black margins. New `clampCam()` centers the map
  when the view is bigger than it on an axis, and keeps the scrolling follow-cam
  when smaller.
- **[GLOW] Ambient light pass.** New `drawAmbientLight()` adds a soft warm
  overhead wash + cool floor tint under the existing vignette, for a little depth
  without washing out the pixel art.
- **[FIX] `drawPrompt()` cleanup + consistency.** Removed a dead `label = "E"`
  variable that was declared then ignored while the code drew "SPACE". The
  on-canvas prompt now shows **"E"**, matching the bottom hint and the touch
  button (previously the three surfaces disagreed: canvas said SPACE, hint said
  "Press E:", touch button said E).

### game.js (engine — manifest + logic)

- **[DOC] Rewrote the sprite manifest into a full, generator-ready spec.** Inline
  comments now document the complete naming convention (player dirs + walk
  frames, NPC down + directional + walk frames, props, markers, tiles) and which
  are required vs optional. Added commented-out slots for the optional assets so
  you uncomment them as you generate art.
- **[ADD] "Sharp calls" tracking.** New `sharp` Set in game state records which
  tickets were diagnosed correctly on the *first* attempt. Reset on a new day and
  on full reset, persisted to localStorage like `solved`/`sq-solved`.

### ui.js (UI — scoring + usability)

- **[ADD] Records a sharp call** when a scenario is solved with only the correct
  diagnosis tried (`state.triedAnswers.size === 1`).
- **[GLOW] End-of-day now surfaces a "first-try calls" stat (X/7)** plus a line of
  feedback that nudges toward investigating before committing. Rewards mastery
  without punishing players who guess.
- **[FIX] Modal scrolls into view on open.** Because the modal is an inline panel
  *below* the game, on a laptop where the viewport fills the screen it could open
  below the fold, unseen. `openModal()` now scrolls it into view.

### styles.css (UI)

- **[CHANGE] End-of-day stats wrap into a 2×2 grid** on narrow screens (was a
  single non-wrapping row; the new 4th stat would have squeezed it).

### public/sprites/README.md (art spec — fully rewritten)

- **[DOC] Corrected sprite size to 32×32** (was 24×24). The world uses 32px tiles
  and the engine scales each sprite to fill a tile, so 24→32 is a non-integer
  1.33× upscale that makes nearest-neighbor pixel art look muddy. 32×32 = crisp.
- **[DOC] Complete asset guide:** technical spec (alpha, top-down, GBC palette,
  light from upper-left, feet at the bottom edge, engine-drawn shadow), the full
  filename convention, a suggested generation order, and a **character identity
  table** with every NPC's exact colors (body/shade/accent/hair/skin + glasses),
  pulled from `world.js`, so generated sprites stay on-model and the office stays
  color-coded by area.

### tools/build-standalone.mjs (pipeline — reconstructed)

- **[ADD] Rebuilt the missing build tool.** It was referenced in `package.json`
  (`build:standalone`) but absent from the project. It concatenates the modules
  in dependency order (storage → world → scenarios → sideQuests → render → ui →
  game), strips `import`/`export`, inlines `styles.css`, lifts the body markup
  from `index.html`, and appends `startGame()`.

### standalone.html (regenerated)

- **[CHANGE] Rebuilt from the updated source** so the double-click build matches
  the Vite app. ~90 KB, single file.

### Files NOT touched

`world.js`, `scenarios.js`, `sideQuests.js`, `storage.js`, `main.js`,
`index.html`, `vite.config.js`, `package.json`, `netlify.toml`.

---

## Part 4 — Conventions to carry into the new game

These are the decisions that made this version good. Replicate them.

1. **Keep content in flat data files, engine and UI generic.** If adding a level
   or quest requires editing the renderer, the separation has leaked.
2. **Procedural-art-first.** Build the whole game so it's fully playable with
   primitive shapes/colors, then let PNGs override. You're never blocked on art,
   and the art can land incrementally.
3. **One sprite-resolution function with a fallback chain.** All the directional
   / walk-frame / down-only logic lives in `pickSprite()`. Art capability scales
   up by adding files, never by branching code.
4. **Match tile size and sprite authoring size** (here: 32px both). Avoid
   non-integer scaling of pixel art.
5. **Give every character a fixed color identity object** and document it. It
   keeps procedural and generated art consistent and makes the world readable.
6. **Namespaced, try/catch-wrapped storage helpers.** Never let storage throw.
7. **Single source of truth + a build script for the standalone.** Edit `src/`,
   run the build, never hand-edit the bundle.
8. **Reward depth without gating accessibility.** The "first-try calls" stat lets
   skilled players show mastery while letting everyone finish. Prefer this over
   hard fail states for a teaching game.
9. **Input parity across surfaces.** Keyboard (WASD/arrows + E/Space/Enter) and
   touch (on-screen d-pad + action button) both fully supported; prompts on all
   surfaces use the same label.
10. **Calm UI.** Inline panel instead of a dimmed modal; the world stays visible.

---

## Part 5 — Sprite / asset spec (carry-forward summary)

Full version lives in `public/sprites/README.md`. The essentials:

- **32×32 PNG, alpha**, top-down, 8-bit / Game Boy Color palette, hard edges
  (renderer uses `imageSmoothingEnabled = false`).
- **Light from upper-left**, feet at the bottom edge, head near top. Engine draws
  the drop shadow, so don't paint one in.
- **Markers are 16×16.** Tiles are 32×32.
- **Filenames** (all optional except player + NPC down-facing):
  - `player_down/up/left/right.png` (+ optional `_1` walk frames)
  - `npc_<id>.png` (+ optional `npc_<id>_<dir>.png` and `_down_1` walk frame)
  - `ticket_monitor.png`, `printer.png`
  - `marker_ticket.png`, `marker_sidequest.png`, `marker_done.png`
  - `tile_W/./o/e/D/c/S` for wall/floor/carpet/cool-floor/desk/chair/server
- **List each new file in `SPRITE_MANIFEST` in `src/game.js`.** Bucketing is by
  key prefix: `npc_`/`player_` → sprites, `tile_` → tiles, `marker_` → markers,
  anything else → props.

### Character color identities (from world.js)

| Character | Role / area | Body | Shade | Accent | Hair | Skin | Notes |
|-----------|-------------|------|-------|--------|------|------|-------|
| You (player) | IT tech | `#2E6FB0` | `#1B4E84` | `#FCDE5A` | `#2C2C2A` | `#C9926B` | All 4 directions |
| Karen | Receptionist | `#D4537E` | `#993556` | `#FCDE5A` | `#6B4A2A` | `#E0B080` | Pink, front desk |
| Marcus | Open desks | `#1D9E75` | `#0F6E56` | `#9FE1CB` | `#2C2C2A` | `#8A5A3A` | Green |
| Priya | Open desks | `#7F77DD` | `#534AB7` | `#F4C0D1` | `#1A1A18` | `#C9926B` | Purple |
| Dana | Print room | `#BA7517` | `#854F0B` | `#FCDE5A` | `#888780` | `#D8B088` | Amber, grey hair |
| Jordan | Open desks 2 | `#0F6E56` | `#085041` | `#85B7EB` | `#412402` | `#8A5A3A` | Deep teal |
| Riley | Open desks 2 | `#D85A30` | `#993C1D` | `#FCDE5A` | `#BA7517` | `#E0B080` | Orange |
| Mgr Chen | Manager | `#378ADD` | `#185FA5` | `#F1EFE8` | `#2C2C2A` | `#B08050` | Blue, glasses |
| Ed | Accounting | `#888780` | `#5F5E5A` | `#B5D4F4` | `#C8C4B4` | `#D8B088` | Grey, white hair, glasses |
| Lisa | Accounting | `#534AB7` | `#3C3489` | `#F4C0D1` | `#2C2C2A` | `#C9926B` | Indigo |

World palette: floors `#E8E4D8`, walls `#5F5E5A`, desks `#A88862`, door yellow
`#FCDE5A`, screen blue `#85B7EB`, ink/outline `#2C2C2A`.

---

## Part 6 — Build, run & verify

```bash
npm install
npm run dev               # Vite dev server (sprite PNGs load over http)
npm run build             # production build -> dist/  (Netlify publishes this)
npm run build:standalone  # regenerate standalone.html from src/
```

**Rule:** after any `src/` edit, run `npm run build:standalone` to refresh the
single-file build.

**How this pass was verified** (a cheap test setup worth reusing): every module
syntax-checked with `node --check`; the standalone bundle extracted and checked
as a valid ES module; and a headless smoke harness mocked just enough DOM/canvas
to run `startGame()`, pump several animation frames (exercising the renderer),
and open every UI screen — catching runtime errors a syntax check can't. For a
canvas game with no framework, a DOM/canvas mock + "does it boot and render N
frames without throwing" is a high-value, low-effort safety net.

---

## Part 7 — Known open items & deliberate decisions

- **Diagnoses aren't gated.** A player can try answers until one sticks; wrong
  guesses cost nothing. Left open on purpose for accessibility, with the
  "first-try calls" stat carrying the mastery signal. If the new game wants more
  tension: make a wrong diagnosis cost an action, or require investigating ≥1
  clue before the diagnosis buttons unlock.
- **NPCs are down-facing only (v1).** The engine fully supports directional +
  walk-frame NPC sprites; they just need the art. Until then, non-down facings
  fall back to the down sprite.
- **The modal is an inline panel, not an overlay** — intentional. The "click
  backdrop to close" handler only fires on the panel's own margin; the close (×)
  button and Escape are the reliable closers.
- **No audio beyond footsteps.** A single Web Audio square-wave step sound, gated
  behind the Sound toggle. Success/failure cues would be an easy add if wanted.
- **Title screen says "PRESS SPACE"** while in-world prompts say "E"; both keys
  (plus Enter and click) work everywhere. Unify the copy if it bothers you.
```
