# IT Support Game

A top-down RPG that teaches IT help-desk principles. Walk the office, find tickets at NPCs, solve them. Side quests hidden in the world reward attention.

## Quick start

**Just want to play it right now?** Double-click `standalone.html` — it runs in any
browser with no install. (Sprites won't load this way; that's expected. For the full
experience with art, use the dev server below.)

**For development / deployment**, you need [Node.js](https://nodejs.org) (v18+):

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173). Edits to files in `src/` auto-reload.

After editing `src/`, regenerate the standalone file with:

```bash
npm run build:standalone
```

## Deploy to Netlify

```bash
npm run build
```

Or connect the GitHub repo to Netlify — `netlify.toml` is already configured.

## Controls

- Arrow keys or WASD to move
- E or space to interact
- Sound toggle in the top bar (off by default — turns on procedural step ticks)
- Reset clears save and restarts the day

## What's new in this glow-up

The renderer was rebuilt to match the public-health RPG's look:
- **Real pixel-person sprites** — each NPC and the player draw as a little character with skin tone, hair, a colored shirt with an accent stripe, arms, legs, and a walking step animation (procedural; sprite PNGs still override them)
- **Shaded office tiles** — distinct floors per area (office, carpet, cool/exam), desks with monitors and papers on them, server racks with blinking LEDs, a glowing ticket monitor
- **Speech-bubble markers** above NPCs (`!` ticket / `?` side quest / `✓` done), with a bob
- **Offscreen map caching** — the floor is baked once and blitted each frame (60fps); re-bakes automatically when a tile sprite loads
- **A "SPACE" prompt** floats over whatever you're facing, so interaction is discoverable
- **Title screen** gates input until you begin; shows a continue line if you have progress
- **Vignette** for depth; the whole nine-room floor fits the frame (letterboxed to the map's aspect ratio at any window size)

Carried over from the prior pass: smooth held-key walking, day counter, end-of-day report with lifetime stats, persistence, sound toggle, touch controls, and the diagnosis-lock fix.

The map is now built **programmatically** in `world.js` (`buildMap()`) so every row is guaranteed uniform width and rooms/doorways/furniture can't drift. Doorways are 2 tiles wide for easy navigation. A reachability check confirmed all 9 NPCs and both props are walkable-reachable from the player's start.

### Sprite identities

Each NPC in `world.js` has a `sprite: { body, body2, accent, hair, skin, glasses? }` object that colors its procedural character. When you generate PNG sprites, they override these automatically — but even without art, every character is now visually distinct.

## Project layout

```
it-game/
  package.json
  index.html
  vite.config.js
  netlify.toml
  public/
    sprites/             drop sprite PNGs here (see asset list below)
  src/
    main.js              entry
    game.js              loop, input, animation, sound
    render.js            drawing (sprite-ready)
    ui.js                modal (intro / scenarios / side quests / EOD)
    scenarios.js         the seven main tickets
    sideQuests.js        quick one-shot scenarios
    world.js             map, NPCs, props, dialogue
    storage.js           localStorage wrapper
    styles.css           global styles
```

## Sprite asset list

All sprites should be 24x24 PNG with transparent backgrounds, 8-bit aesthetic.
Filenames must match exactly. Missing files fall back to primitive shapes.

### Tiles (3 files)
- `floor.png` — office floor tile
- `wall.png` — interior wall (top-down)
- `door.png` — doorway opening
- `desk.png` — generic office desk (optional)

### Player (4 files — facing each direction)
- `player_down.png`, `player_up.png`, `player_left.png`, `player_right.png`

For v1: androgynous IT worker, polo + lanyard, neutral. Mortal-Kombat-style
character select coming in v2 (don't generate that roster yet).

### NPCs — main tickets (7 files, facing down)

| File | Character | Quick description |
|---|---|---|
| `npc_karen.png`   | Karen    | 40s receptionist, pink/coral blouse, glasses on a chain |
| `npc_marcus.png`  | Marcus   | 30s, dark green hoodie, headphones |
| `npc_priya.png`   | Priya    | 30s, deep purple cardigan, glasses |
| `npc_dana.png`    | Dana     | 50s, mustard cardigan, library-coded |
| `npc_jordan.png`  | Jordan   | 20s, teal t-shirt, gamer vibe |
| `npc_riley.png`   | Riley    | 30s, burnt-orange button-up, ops vibe |
| `npc_chen.png`    | Mgr Chen | 40s, navy blazer, confident posture |

### NPCs — side quests (2 files)
- `npc_ed.png`   — 60s accountant, gray sweater, slightly disheveled
- `npc_lisa.png` — 40s accountant, purple blouse, calm

### Props (3 files)
- `ticket_monitor.png` — wall/desk monitor showing a ticket queue, blue glow
- `printer.png`        — office printer with a blinking ink light
- `desk.png`           — covered above

### Markers (3 floating indicators)
- `marker_ticket.png`    — orange exclamation in a chat bubble (~14px)
- `marker_sidequest.png` — blue question in a smaller bubble (~12px)
- `marker_done.png`      — green check (~14px)

**Total: 22 essential files.** Drop them in `public/sprites/`, refresh, done.

## Adding content

- New side quest: add an entry to `src/sideQuests.js`, attach to an NPC or prop in `src/world.js`
- New main ticket: add to `src/scenarios.js`, add an NPC in `src/world.js` with `ticket: "your_key"`
- New room/wall layout: edit the `MAP` constant in `src/world.js`
- New NPC dialogue: add a `chat: [...]` array on the NPC in `src/world.js`
