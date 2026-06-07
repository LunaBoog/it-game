# Handoff — SDV Glow-Up, Session 1 (foundation slice + repo/deploy)

**Project:** "The Ticket Queue" (IT Support RPG) · local folder `it-game-v2` ·
GitHub `LunaBoog/it-game` (private).

**What this session did, in one line:** layered the first slice of the
"Stardew-style" cozy systems onto the IT game — a generic prop-kind dispatch, a
collectables registry, a coin/token economy, a befriendable office cat that
bootstraps that economy, a USB-drop phishing side quest, and a Field Companion
HUD — then initialized git, pushed to GitHub, and set up the Netlify deploy.

Read Part 1 for the mental model, Part 2 for the exact file-by-file changelog,
Part 3 for the data shapes (how to add more without re-reading code), Part 4 for
the build/verify pipeline, Part 5 for the git/deploy record, Part 6 for what's
next.

Legend: **[ADD]** new · **[CHANGE]** behavior changed · **[GLOW]** polish/visual ·
**[FIX]** bug · **[DOC]** documentation.

---

## Part 1 — The mental model (what got added and why)

The SDV handoff's required-first substrate is "collectables + an open-container
save + a generic prop framework," because every cozy mechanic rewards into it.
The IT game already had the clean data/engine/UI split and typed `localStorage`
helpers, but its props were **hardwired** (`isMonitor` / `isPrinter`) instead of
the generic `kind`-dispatch the health game used. So step one was adding that
dispatch; everything else hangs off it.

The five new systems:

1. **Prop-kind dispatch** — props now carry a `kind` (`monitor | printer | pet |
   search | chest | usb`). Adding an interactable is a data entry plus one draw
   branch, not an engine edit.
2. **Collectables** — a self-counting `FINDS` registry (`collectables.js`) +ind a
   `finds` Set. Keepsakes, not stat boosts (the Stardew move: you remember *who*
   gave you the thing).
3. **Economy** — `coins` and `tokens` persisted as numbers. Tokens are the gate
   for the future secret break-room mini-game.
4. **The pet (Mittens)** — a 3-beat befriend quest that **bootstraps the
   economy**: meet hungry → fetch food → feed → she paws open a hidden ceiling
   stash that pays your first coins + token + keepsake.
5. **Field Companion HUD** — coins/finds pills in the topbar + a ★ button that
   opens a Discoveries gallery (keepsakes, economy, and a live objectives list).

Plus one piece of content to prove the pattern extends: a **USB-on-the-floor
phishing side quest** reusing the existing side-quest flow.

**Important overlap note:** Ed (`unplugged`) and Lisa (`monitorStandby`) already
*are* the "fussy accountant whose PC won't power on" and "dead monitor that's
just asleep" beats. New office-task content should **extend** that family, not
duplicate it.

---

## Part 2 — File-by-file changelog

### src/collectables.js  **(NEW FILE)**
- **[ADD]** The `FINDS` registry: `id -> { icon, name, note }`. `FINDTOTAL =
  Object.keys(FINDS).length` so the counter grows itself — adding one entry is
  the only change needed. Ships with two keepsakes:
  - `charm` — "Mittens' collar charm" (from the pet quest)
  - `usbWise` — "USB-Wise badge" (from the phishing side quest)

### src/world.js
- **[CHANGE]** Rewrote the `PROPS` export and **[DOC]** documented the prop-kind
  vocabulary + optional fields (`walkable`, `needFlag`, `doneFlag`) in a header
  comment.
- **[ADD]** `kind` field on the two existing props (`monitor`, `printer`).
- **[ADD]** Four new props:
  | id | kind | tile | room | notes |
  |---|---|---|---|---|
  | `cat` | pet | (8,18) | Conf. room | "Mittens" |
  | `cat-food` | search | (4,12) | Print room | `giveFlag:hasCatFood`, `needPriorFlag:catMet` |
  | `cat-stash` | chest | (14,16) | Conf. room | `walkable`, `needFlag:catRevealed`, `doneFlag:stashTaken`, pays `coins:15, tokens:1, findReward:charm` |
  | `usb-drop` | usb | (9,11) | Open desks 2 | `walkable`, `sideQuest:usbDrop` |

### src/sideQuests.js
- **[ADD]** `usbDrop` side quest — phishing awareness (USB-drop attack). Three
  options; correct = "bag it and hand it to security." Carries
  `reward: { find:"usbWise", coins:6 }` (new field — see ui.js).

### src/game.js (engine — state, dispatch, economy)
- **[ADD]** Imports: the four new UI openers from `ui.js`; `FINDS, FINDTOTAL`
  from `collectables.js`.
- **[ADD]** Module-scoped `S` (live-state pointer) + `propVisible(p)` so hidden
  props (a chest behind `needFlag`) neither block movement nor interact.
- **[CHANGE]** `propAt()` is now visibility-aware; new `solidPropAt()` returns a
  prop only if it's visible **and** not `walkable`.
- **[CHANGE]** Movement blocking uses `solidPropAt()`, so `walkable` floor props
  (the USB, the stash tile) don't wall off the floor.
- **[CHANGE]** `facedTarget()` recognizes `monitor / pet / search / chest`.
- **[ADD]** `interact()` dispatch → `openPet / openSearch / openChest`; the
  already-solved `prop-sq` branch now falls back to a short "already handled"
  line instead of doing nothing.
- **[ADD]** Interact-hint labels for the new kinds.
- **[ADD]** State fields (open containers, persisted): `flags` (Set of true
  flag-names), `finds` (Set of collected ids), `coins` (num), `tokens` (num),
  plus an `inDialog` modal-gate flag.
- **[ADD]** State helpers: `setFlag / hasFlag / addFind / addCoins / addTokens`.
- **[CHANGE]** `updateProgressUI()` refreshes the new `#finds-progress` and
  `#coins-progress` pills.
- **[CHANGE]** `isModalOpen()` includes `inDialog`.
- **[ADD]** Wires the Companion (★) button → `openDiscoveries()`.
- **[CHANGE]** The full-reset handler re-inits `flags/finds/coins/tokens`.

### src/render.js (engine — drawing)
- **[CHANGE]** Generalized the props draw loop: skips props hidden by `needFlag`,
  dispatches by `kind`, and floats the right bubble via new `propBubbleKind()`.
- **[CHANGE]** The interact prompt now also shows over `pet/search/chest`.
- **[ADD]** Procedural pixel art: `drawCat()` (orange tabby, flicking tail,
  "fed" heart), `drawCabinet()`, `drawStash()` (open ceiling tile w/ coin glint),
  `drawUsb()` (USB stick w/ glint). All overrideable by PNGs later.
- **[ADD]** `propBubbleKind(p, state)` — the per-kind `! / ? / ✓` logic.

### src/ui.js (UI — new screens)
- **[ADD]** Imports `PROPS` from world, `FINDS/FINDTOTAL` from collectables.
- **[CHANGE]** `closeModal()` clears `inDialog`.
- **[CHANGE]** `resolveSideQuest()` now grants `sq.reward` (coins + find) on a
  correct answer — backwards-compatible (quests without `reward` are unaffected).
- **[ADD]** `openPet(p)` — the 3-beat cat dialog, driven entirely by flags.
- **[ADD]** `openSearch(p)` — examine furniture; can grant a carry-flag and/or a
  find (respects `needPriorFlag` and the already-taken state).
- **[ADD]** `openChest(p)` — pays out coins/tokens/find once, then reads empty.
- **[ADD]** `openDiscoveries()` + `currentObjectives()` — the Field Companion
  gallery and the live, flag-derived objectives list.

### src/index.html
- **[ADD]** Topbar HUD: a `#coins-progress` pill and a `#companion-btn` button
  containing a `#finds-progress` span (the ★ counter).

### src/styles.css
- **[ADD]** Field Companion / gallery styles appended at the end:
  `.companion-econ`, `.reward-row`, `.reward-chip`, `.find-grid`, `.find-card`
  (+`.locked`), `.find-icon`, `.find-text`, `.find-name`, `.find-note`.

### tools/build-standalone.mjs
- **[CHANGE]** Added `"collectables.js"` to `MODULE_ORDER` (after
  `sideQuests.js`). **Without this line the standalone build silently omits the
  new module and the game throws on boot.**

### standalone.html
- **[CHANGE]** Regenerated from the updated `src/` (~111 KB). Never hand-edit;
  run `npm run build:standalone`.

### Files NOT touched
`scenarios.js`, `storage.js`, `main.js`, `vite.config.js`, `package.json`,
`netlify.toml`, `public/sprites/README.md`.

---

## Part 3 — Data shapes (how to add more content)

Everything below is **data-only** — no engine/UI edits needed.

**A new collectable** (`collectables.js`):
```js
breakroomAce: { icon:"\u{1F3C6}", name:"Break-room Ace", note:"Top run in the secret break-room game." }
```
`FINDTOTAL` and the gallery update themselves.

**A new `search` prop** (examine furniture; optional carry-flag + keepsake):
```js
{ id:"desk-drawer", x:.., y:.., kind:"search", room:"…", title:"DESK DRAWER",
  giveFlag:"hasThing",         // optional: sets a flag when taken
  needPriorFlag:"someFlag",    // optional: inert until this flag is set
  findReward:"someFindId",     // optional: grants a collectable
  take:"…what you find…", empty:"…once already taken…",
  lockedText:"…shown before needPriorFlag…" }
```

**A new hidden `chest`** (economy payout, revealed by a flag):
```js
{ id:"stash2", x:.., y:.., kind:"chest", walkable:true,
  needFlag:"revealFlag", doneFlag:"tookIt",
  coins:10, tokens:1, findReward:"someFindId",
  title:"…", give:"…first open…", done:"…after…" }
```

**A `usb`-style awareness quest** (a floor object that opens a choice):
prop `{ id, x, y, kind:"usb", walkable:true, sideQuest:"myQuest" }` +
a `sideQuests.js` entry with optional `reward:{ find, coins }`.

**A new pet:** add a `kind:"pet"` prop with a `name`; the quest beats live in
`openPet()` and key off these flags.

### Flag chain reference (the pet quest)
`catMet` → set on first approach · `hasCatFood` → set by the supply cabinet
(requires `catMet`) · `catFed` + `catRevealed` → set when you approach the cat
while carrying food · `stashTaken` → set when you open the stash.
(The USB quest is tracked in `sqSolved`, not `flags`.)

### Storage keys added (all prefixed `it-game:`)
`flags`, `finds`, `coins`, `tokens`. They persist across days; a full **Reset**
clears them along with everything else. A **new day** does **not** clear them
(finds/economy are lifetime progress).

---

## Part 4 — Build & verify

```bash
npm run dev               # Vite dev server (sprite PNGs load over http)
npm run build             # production build -> dist/  (Netlify publishes this)
npm run build:standalone  # regenerate standalone.html from src/
```
**Rule:** after any `src/` edit, run `npm run build:standalone`.

**How this session was verified** (reusable safety net):
- `node --check` on every module.
- Extracted the inlined `<script>` from the regenerated `standalone.html` and
  `node --check`'d the **concatenated bundle** (catches dependency-order / dup
  declaration problems the per-file check can't).
- A headless DOM/canvas mock booted `startGame()`, pumped frames, and opened
  every new screen (`openPet/openSearch/openChest/openDiscoveries`).
- A flood-fill from the player start confirmed **every new prop has a reachable
  adjacent tile** (walkable props checked on their own tile).

All green.

---

## Part 5 — Repo & deploy record (set up this session)

- **`.gitignore`** created: `node_modules/`, `dist/`, `.DS_Store`.
- `git init` → first commit "update game New" (21 tracked files; `node_modules`
  correctly excluded; `src/collectables.js` included).
- **GitHub:** created private repo `LunaBoog/it-game`, then
  `git remote add origin https://github.com/LunaBoog/it-game.git` and
  `git push -u origin main`. `main` tracks `origin/main`.
- **Going forward:** `git add -A && git commit -m "…" && git push` (no `-u`).
- **Netlify (in progress / to confirm):** Add new project → Import an existing
  project → GitHub → grant the GitHub App access to the **private** `it-game`
  repo → select it. Build settings auto-fill from `netlify.toml`
  (`command = npm run build`, `publish = dist`, branch `main`). Deploy. After
  that, continuous deploy runs on every push. (Sprite PNGs will load on the
  http-served site; the double-click `standalone.html` runs on procedural art.)
- Optional: set `git config --global user.name/.email` (first commit used the
  auto-detected machine identity).

---

## Part 6 — Known open items & what's next

**Deliberate / known:**
- Sprites are still procedural for the new props; PNG overrides (`ASSETS.props`,
  the sprite manifest) can drop in later with no logic changes.
- The cat quest is one-time and persists; it does not reset per day (by design).
- Tokens currently have **no sink yet** — the stash grants one, but nothing
  spends it until the break-room ships (see below).

**Next builds (scoped against this engine, in suggested order):**
1. **Secret Break-room + "Mario-run" mini-game** — a new map reached through a
   token-gated door (a `kiosk`/door prop that spends a `token`), with a timed
   collection dash whose **scoring rule is the lesson** (e.g. pair a CVE with its
   patch for a combo; a phishing-link token breaks it). Coins/tokens rails are
   already in place. This is the natural use of the economy.
2. **Catch-the-fake-IT-guy** — a roaming NPC (the engine already supports
   movement; needs a simple patrol) plus a "verify the badge / check the ticket
   number" choice. Teaches social-engineering/tailgating awareness.
3. **More office-task side quests** extending the Ed/Lisa family — printer out of
   paper, the HDMI-into-the-wrong-port variant, a monitor on the wrong input —
   all pure `sideQuests.js` + a prop, no engine work.

**Content guardrails to keep:** rewards stay as gear/stickers/keepsakes (never
numbers tied to bodies); tone affirming; teach through consequence (the tempting
wrong answer is where the lesson lands), never lectures.

---

*Foundation is shipping and verified. The economy + prop-kind dispatch are the
load-bearing additions; the break-room and the fake-IT-guy are the next two
"flashy" beats and both now have the rails they need.*
