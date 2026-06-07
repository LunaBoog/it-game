# Handoff: "Stardew-style" fun + educational systems
### From the Harlem Health Rotation RPG → for porting into the IT game

This document is a complete rundown of the mechanics we designed and built, the design thinking behind them, and a concrete plan for adapting all of it into the IT game (helpdesk / sysadmin themed). Hand this whole file to the new chat.

---

## 0. The north star

We took a single-file HTML/JS canvas RPG (top-down, Pokémon/Stardew-ish pixel art) that teaches a real curriculum, and layered on **cozy game loops that make learning feel like play**. The guiding rule throughout:

> **Every fun mechanic also teaches something, and the teaching is delivered through consequence and discovery — never through a lecture.**

The four pillars we kept coming back to:
1. **Diagnose-by-investigation** (the core educational loop).
2. **Collectables** (a reason to explore every corner).
3. **Side quests with small human stories** (fetch/return tasks that double as teachable beats).
4. **A timed mini-game** whose *scoring rule is itself the lesson*.
Plus a **pet** (a cat) that ties the world together and gates a reward.

---

## 1. The base engine (so you understand the substrate)

The whole game is **one HTML file**, no build step, no external libraries. Key facts:

- **Canvas** 640×384, tile grid `TILE=32`, `COLS=20`, `ROWS=12`. Pixel art drawn procedurally (every sprite/tile is hand-coded `fillRect` pixel art) with an optional image-asset override layer (`ART`/`ASSETS`) so real sprites can drop in later.
- **Maps** are 2D arrays of one/two-char tile codes, produced by `buildXMap()` functions and stored in a `maps` object keyed by map name (`clinic`, `street`, `school`, `center`, `market`, `bodega`). Each map is rendered once to an offscreen canvas and cached (`getMapCanvas`).
- **Movement**: grid-based with smooth tween between tiles (`MOVE_MS`), WASD/arrows, `space`/`E` to interact, `N` for notes. Touch D-pad for mobile. `isBlocked(x,y)` checks a tile-code blocklist + NPCs + visible props.
- **Transitions between maps** are handled by an `EXITS` table: `EXITS[mapName][tileCode] = [destMap, destX, destY, facing]`. Stepping onto an exit tile fades out/in and moves you. (This is the mechanism we used to make buildings enterable — see §3.)
- **NPCs** live in `npcs[mapName] = [...]`. **Props** (interactable objects) live in `props[mapName] = [...]`. `getNpcs()`/`getProps()` read the current map. ⚠️ *Every map must have an `npcs` entry (even `[]`) or the render loop crashes iterating `undefined`.*
- **Dialog/panels** render as HTML overlays below the canvas (right-hand column), not on the canvas.
- **Audio**: tiny WebAudio oscillator blips (`SFX.blip/note/right/wrong/win`), lazily created, mute toggle persisted.
- **Save/load**: `localStorage`, JSON. Crucially **generic** — it serializes `flags` (an open object) and `finds` (a Set→array) wholesale, so *new quest flags and collectables persist automatically with zero save-code changes* (see §8). This is the single most important architectural decision for adding content fast.

> **Porting note:** if the IT game is also a single-file canvas RPG, copy these patterns verbatim. If it's a different engine (e.g., a React/DOM grid, Phaser, etc.), the *data shapes* below port cleanly even if the rendering doesn't.

---

## 2. The core educational loop: "Investigate → Commit → Principle"

This is the heart of the game and the most reusable idea. Each "case" NPC opens a **scenario**:

1. An **intro** (who/what, a first-person quote).
2. A grid of **investigation actions** ("points of interest") with a **budget** (e.g., 4 of 6 actions). Each reveals a piece of evidence. *Limited budget forces prioritization — you can't check everything.*
3. You must investigate **≥2** things before you can **commit** to one of ~4 **diagnoses**.
4. Wrong answers get specific, kind feedback explaining *why* it's wrong (each wrong option encodes a real anti-pattern). The right answer unlocks a **"Principle Learned"** card saved to a **Field Notebook**, with a citation to the course unit.
5. A **rigor check**: even on a correct answer, if you committed *before* checking the key evidence, it tells you so ("right answer, but you'd want that confirmation in the field").

Data shape (abridged from `SCENARIOS`):
```js
marisol:{
  course:'FNPH 622', keyEvidence:['labs'],
  intro:{name:'…', ctx:'…', quote:'"…"'},
  budget:4,
  pois:[ {id:'labs', label:'Check her prenatal labs', evidence:'Hemoglobin low…'}, … ],
  diagnoses:[
    {label:'Reassure her…', correct:false, feedback:'Fatigue alone might be normal, but fatigue + pica + low Hgb is textbook…'},
    {label:'Iron-deficiency anemia with pica…', correct:true, feedback:'Right. Pica is near-pathognomonic…'},
    … ],
  principle:{title:'…', body:'…', cite:'FNPH 622 – Unit 3'},
  debriefer:'Nurse Diaz', debrieferSprite:'staff'
}
```

**Why it works:** it rewards *thinking like a practitioner* (gather evidence, weigh, decide) instead of memorizing. The "wrong but tempting" options are where most of the teaching lives.

**IT reskin (this is your bread and butter):** scenarios become **support tickets / incidents**. POIs = `check the logs`, `ping the host`, `ask the user what changed`, `read the config`, `check recent deploys`. Diagnoses = `just reboot it` (tempting, wrong — treats symptom), `it's a DNS resolution failure, fix the record + flush cache` (right), `escalate to the vendor` (over-escalation), etc. Principles = DNS, DHCP, least privilege, backups/3-2-1, change management, phishing identification. Same exact data shape.

---

## 3. Enterable interiors (the bodega — built this session)

**The idea:** the world had building *facades* you could only look at. We made one a real **interior you walk into**, which instantly made the map feel alive and gave us a container for new content.

**How it's done (fully generic — repeat for any building):**
1. Write a `buildBodegaMap()` that returns the tile array (floor, shelves, counter, walls, and two door tiles on the bottom wall).
2. Register it at runtime so you don't have to touch fragile literals: `maps.bodega = buildBodegaMap(); npcs.bodega = []; LOC_LABELS.bodega = '…';`
3. Put a **door tile** on the parent map (`m[2][4]='Db'`) and wire both directions in `EXITS`:
   ```js
   EXITS.street.Db = ['bodega', 9, 10, 'up'];   // street → inside
   EXITS.bodega    = { Xb:['street', 4, 3, 'down'] }; // inside → street
   ```
4. Add the new tile codes (`bf` floor, `sh` shelf, `co` counter, `Db` storefront door, `Xb` interior exit) to the tile renderer and the `isBlocked` blocklist (shelves/counter block; door tiles are exits so they intercept before blocking).

**Validation tip we used:** before shipping, run a tiny flood-fill from the entry tile to confirm every prop tile is (a) walkable and (b) has a walkable neighbor so the player can stand adjacent and face it. Caught zero bugs only because we checked. Do this for every new interior.

**IT reskin:** make the **server room**, **break room**, **the boss's office**, and a **data center** enterable the same way. Each becomes a room with its own side quest (§5).

---

## 4. Props framework (the workhorse — extended this session)

Everything interactable that isn't a "case NPC" is a **prop**, dispatched by `kind`. Five dispatch functions each switch on `kind`: `propVisible`, `propDone`, `propBubbleKind` (the floating `!`/`?`/`✓` bubble), `drawProp` (pixel art), `handleProp` (interaction). Adding a new mechanic = add a branch to each.

Current kinds:
| kind | what it is | example |
|---|---|---|
| `info` | a discoverable lore object; collecting it adds a "find" | a WIC poster, a mural |
| `search` | furniture you examine; yields a carry-item flag and/or a collectable | a filing drawer, a locker, "under the table" |
| `deliver` | a return target; lights up (`↑`) when you carry the matching item, completes on hand-in for a reward | the boss's office door, a library cart |
| `owner` | a shopkeeper NPC-as-prop (avoids the scenario routing); single-step help quest | the bodega owner |
| `pet` (implemented as `cat`) | the companion; multi-step quest | Pickles the cat |
| `chest` | a hidden stash, only visible after a flag flips | the loose floorboard |
| `kiosk` | opens the token shop | the bus-token kiosk |

Prop object shape (real examples we shipped):
```js
// SEARCH that yields a carry-item (starts a fetch quest)
{x:1,y:3,id:'badge_drawer',kind:'search',has:'hasBadge',title:'FILING DRAWER',
 take:'…a staff ID badge — "Dr. A. Patel". Better get it back to her.', empty:'Just forms and pens now.'}

// SEARCH that yields a pure collectable (the "found paper")
{x:17,y:5,id:'exam_drawer',kind:'search',findReward:'note',title:'SUPPLY DRAWER',
 take:'…a hand-written reminder card a nurse left for herself…', empty:'Gauze and gloves.'}

// DELIVER (the matching return target)
{x:16,y:8,id:'badge_return',kind:'deliver',need:'hasBadge',done:'badgeReturned',reward:'pin',
 title:"DR. PATEL'S OFFICE",
 ask:'A note on the door: "If found — my ID badge!"  (find it first)',
 give:'You hand Dr. Patel her badge. She pins a volunteer pin on you.',
 doneText:'Badge safely on her lanyard. "Saved my morning."'}
```
The deliver bubble logic is the nice touch: `done ? ✓ : (carryingItem ? ! (ready) : ? (hint))`.

**IT reskin:** these kinds map 1:1 — `search` = a desk drawer / a server rack / a supply cabinet; `deliver` = the asset cart / the boss's office / the helpdesk return bin; `owner` = the break-room manager or floor lead.

---

## 5. Side quests (5 built this session + the owner beat)

Each is a tiny human story that *also* lands a teaching beat without preaching. The pattern is always **search → carry → deliver → keepsake**, tracked by two flags (`hasX`, `xReturned`).

1. **The boss's lost ID badge** (clinic). Find it misfiled in a drawer; return it to the director's office → *volunteer pin*. Beat: small acts of keeping-track keep a clinic running.
2. **A found note in a drawer** (clinic exam room). A nurse's reminder-to-self about a worried patient → *keepsake note*. Beat: the human work behind the clinical work. (This is the "piece of paper in a drawer" you asked for.)
3. **Overdue library book** (school). Jammed in a locker; return to the library cart → *bookmark*. Beat: closing loops, community resources.
4. **Mr. Chen's reading glasses** (senior center). Knocked under a lunch table; return to his seat → *his lucky tile*. Beat: small dignity restorations for elders.
5. **Post the EBT/WIC sign** (bodega owner). Help the owner put up the "we accept benefits" sign → *the sign as a collectable*. Beat: when a corner store accepts benefits, **fresh food gets closer to home** — ties directly to a curriculum principle ("financial access is health access").

**Design principle:** the reward is a **keepsake, not a stat boost** — it shows up in your Discoveries list as a memento of the story. That's the Stardew move: you remember *who* gave you the thing.

**IT reskin (ready to build, same shapes):**
- **The boss's lost keycard/badge** → return to the IT director's office. (direct port of #1)
- **A sticky note with a password on it** found in a drawer → teachable beat about credential hygiene; the keepsake is the note + a one-liner about why this is exactly what *not* to do. (port of #2, and a genuinely great security lesson)
- **A loaner laptop / borrowed dongle** left in a meeting room → return to the asset cart. (port of #3)
- **A misplaced MFA hardware key (YubiKey)** under a desk → return to its owner. (port of #4)
- **Post the phishing-awareness poster** with the break-room lead → security-awareness beat. (port of #5)

---

## 6. The pet (Pickles the cat) — companion + reward gate

**The idea:** a recurring animal that gives the world personality and gates a small economy reward, via a multi-step quest.

Chain (this session we *moved her indoors* into a bodega aisle so she has a home):
1. You meet a **hungry cat** in the bodega aisle (she meows at an empty bowl).
2. Objective: **find cat food** — leads you to a **food pantry** in another building (the pantry itself is a teaching prop: free neighborhood food, no questions).
3. **Feed her** → she headbutts you in thanks and **paws open a loose floorboard** in the back corner, revealing a hidden **stash** (a `chest` prop that was invisible until `flags.catRevealed`).
4. Open the stash → a **bus token** + coins, with a note "first ride's on Pickles" — which **bootstraps the mini-game economy** (§7).

So the pet is both a personality anchor *and* the on-ramp to the mini-game. That dual role is worth preserving.

**IT reskin options:**
- An **office cat** (literal port), or
- A **rescued Roomba / a "rubber-duck" debugging companion** you charge/feed; once happy it nudges loose a **ceiling tile / a taped-under-the-desk legacy admin note** revealing a stash that bootstraps your minigame currency. The "feed → reveal hidden stash → bootstrap economy" skeleton is the reusable part.

---

## 7. The mini-game: "Nutrient Express" Market Dash (built an earlier session)

**The idea — and this is the cleverest reusable trick:** a 30-second timed collection dash on a dedicated map (`market`), where **the scoring rule *is* the lesson.** Players learn the concept by optimizing their score, not by reading.

Mechanics:
- **Economy/onramp:** you need a **token** to ride. First token comes from the cat's stash; after that you buy tokens at a **kiosk** (`TICKET_COST=12` coins) using coins you earn *on the route*. Self-sustaining loop. (`boardBusPrompt` → ride; `openKiosk` → buy.)
- **The dash:** `MINI_MS=30000` (30s). Tokens spawn on the field (`MINI_TOKENS=6`) with weighted types: `TOK_WEIGHTS=['iron','iron','vitc','vitc','water','tannin']`.
- **The teaching combo** (this is the whole point):
  - grab **Iron (Fe)** → +1, and arms a combo.
  - grab **Vitamin C right after iron** → **+3 absorption bonus** with a celebratory flash: *"Vitamin C after iron! +3."*
  - grab **water** → +1 (neutral, hydration).
  - grab a **tannin (☕ tea/coffee) right after iron** → **breaks the combo** with a flash: *"Tannins blunt iron — pair iron with citrus instead."*
- **Score → coins** (1:1), a **best score** is tracked, and **score ≥ 20** earns the **"Absorption Ace"** collectable badge.
- The end screen restates the science in one plain sentence.

The combo rule encodes a real clinical fact (iron + vitamin C ↑ absorption; tannins ↓ it) that *also* shows up in a diagnostic case (Marisol's iron-deficiency anemia). **The minigame and a case reinforce the same principle through different verbs.** Do that on purpose.

**IT reskin — keep the structure, swap the pairing:**
- **"Packet Router Dash":** collect packets; pair a **SYN** with its **ACK** for the combo bonus; a **malformed/malware packet** is the tannin-equivalent that breaks the combo. Teaches the handshake.
- **"Patch Tuesday Dash":** collect items; pair a **vulnerability (CVE)** with its **patch** for the bonus; clicking a **phishing link** breaks the combo. Teaches patch hygiene + phishing.
- **"Backup Run":** pair **data** with an **offsite copy**; **ransomware** token breaks an unbacked-up streak. Teaches 3-2-1 backups.
The reusable skeleton: *a token you "arm" + a token that completes the combo for a big bonus + a "trap" token that punishes the wrong pairing + a one-line lesson on the results screen.*

---

## 8. Collectables + the Field Companion HUD

- A central `FINDS` registry: `id → {icon, name}`. `FINDTOTAL = Object.keys(FINDS).length` so the counter updates itself when you add entries. We're at **11 finds** now (posters, mural, locker, pantry tuna, Pickles' charm, Absorption Ace, + this session's note/pin/bookmark/lucky-tile/EBT-sign).
- `inv = {coins, tickets, finds:Set}`. `addFind(id)` adds to the Set, plays a chime, updates HUD, saves.
- The **Field Companion** side panel shows: coins, tokens, finds `x/total`, cases `x/7`, a live **objectives** list (`currentObjectives()` rebuilds from flags each render — including conditional side-quest lines like *"Return the badge to her office"* only while you're carrying it), and a **Discoveries** gallery of collected keepsakes.

**Crucial save trick:** `save()` writes `{solved, coins, tickets, finds:[...set], best, flags}` and `load()` does `Object.assign(flags, saved.flags)` + rebuilds the Set. Because both `flags` and `finds` are open containers, **every new flag/collectable persists with no save-code edits.** Build your IT version this way first — it removes all the friction from adding content.

**IT reskin:** collectables become **stickers/patches** ("RTFM", "Root-Cause Ace", "Zero-Trust"), **retro hardware** (a floppy, a token-ring cable), **easter-egg posters** (original, not branded). Same registry.

---

## 9. The design principles that made it fun *and* educational

These are the transferable lessons — the "why," not the "what":

1. **Teach through consequence, never lectures.** Wrong choices get specific feedback; the *tempting wrong answer* is where the lesson lands.
2. **The scoring rule is the curriculum.** (The minigame.) If players optimize the score, they've internalized the concept.
3. **Reinforce one principle through multiple verbs** — a case *and* a minigame *and* an ambient prop can all teach the same idea differently.
4. **Reward with keepsakes, not just numbers.** Mementos tied to a person/story are stickier than +5 XP.
5. **Small human stories beat abstractions.** "Mr. Chen lost his glasses" lands harder than "elder dignity matters."
6. **Limited budgets force real decisions.** The investigate-budget is what turns clicking into thinking.
7. **Ambient learning is optional and discoverable.** Lore props reward curiosity without blocking progress.
8. **A pet/companion is the social glue** and a great way to gate or bootstrap a system.
9. **Bootstrap your economies in-world** (the cat's stash funds the first ride) so nothing feels like a menu.

---

## 10. Content guardrails to carry forward

The source game is a health curriculum and includes sensitive clinical material. Two notes for whoever builds next, even in an unrelated IT game:

- The original contains one **clinical eating-disorder teaching case** handled deliberately as **recognize → document → refer** (the student's job is to spot a pattern and route to specialists, *not* to diagnose, confront, or advise). We did **not** modify it, and we did **not** replicate that subject matter into any new content. For an IT game this topic shouldn't appear at all — drop it.
- House style we held to for any new content, worth keeping as a default: **no numbers tied to bodies** (calories/weights/BMI/macros), **no commentary on appearance** in any direction, and **non-food, non-body rewards** for new quests. There's a deliberately body-neutral/affirming easter egg in the school ("all bodies welcome, no weigh-ins") that sets the tone. Easy to honor in IT-land — just keep rewards as gear/stickers and keep tone affirming.

---

## 11. How we worked (build/verify workflow — recommend you reuse)

Because it's one big HTML file, we edited via **self-verifying Python patch scripts**: each edit asserts its anchor string appears exactly once, then replaces it, printing `ok`/`FAIL` per edit. After patching we (a) extracted the largest `<script>` block and ran `node --check` for a syntax pass, (b) grepped that each new system appears exactly once with no duplicate declarations, and (c) ran a tiny standalone JS harness to flood-fill new rooms and confirm props are reachable. This caught problems before they ever hit the browser. Strongly recommend the same discipline for the IT game.

---

## 12. Quick port checklist for the IT game

- [ ] Confirm the engine has: map registry, `EXITS` table, `npcs`/`props` per map, generic `flags`+`finds` save.
- [ ] Build the **scenario loop** first (investigate→commit→principle) — it's the educational backbone. Reskin patients → tickets.
- [ ] Add the **prop framework** with kinds `info/search/deliver/owner/pet/chest/kiosk`.
- [ ] Make 1–2 buildings **enterable** (server room, boss's office).
- [ ] Ship the **5 side quests** (badge/keycard, password sticky-note, loaner return, MFA key, security poster).
- [ ] Add a **pet/companion** that bootstraps the economy.
- [ ] Build **one mini-game** whose combo rule teaches a real pairing (handshake / patch-vuln / backup).
- [ ] Wire the **Field Companion** HUD + collectable registry.
- [ ] Hold the content guardrails; verify with the patch-script + `node --check` + reachability flood-fill.

---

*Everything above is implemented and shipping in the health game (`public_health_rpg_v8.html`). The data shapes are copy-adaptable; the design principles are the part that actually matters.*
