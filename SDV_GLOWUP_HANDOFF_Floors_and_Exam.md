# Glow-Up Handoff — Two Floors + Practice Test ("Let IT glow")

This session turned *The Ticket Queue* from a single-floor help-desk game into a
two-floor, exam-aligned study tool, and added a retake-anytime Practice Test.
Everything is still vanilla ES modules + Canvas, no runtime deps, localStorage
saves, and it still ships both as a Vite app and a single double-clickable
`standalone.html`.

## What's new for players

- **Two floors, reached by an elevator.**
  - **Floor 3 — Help Desk** (the original): A+ / Network+ fundamentals. 7 tickets.
  - **Floor 7 — Security Operations / Red-Team Lab** (new): Security+, PenTest+,
    advanced Network+. 7 tickets. **Locked until every Floor 3 ticket is solved.**
  - An **elevator** prop sits in the corner of each floor (tile 5,1). Interacting
    opens a floor picker. Floor 7 shows as locked with a hint until Floor 3 is cleared.
- **Practice Test ("Exam" button in the top bar).** A 5-question quiz drawn from
  the floor you're currently on — covers every concept on that floor, solved or
  not. Instant per-question explanation, a score screen, **best-score-per-floor**
  tracking, and **Retake** (fresh random draw each time). Available any time;
  no need to wait or unlock.
- **Advanced content on Floor 7:** 7 deep security scenarios + 4 device-based
  side quests, each mapped to a real exam objective.
- Study-tool framing on the title screen, a floor indicator pill, and a per-floor
  ticket counter.

## Content inventory (current)

| | Floor 3 | Floor 7 |
|---|---|---|
| Scenarios (tickets) | 7 | 7 |
| Side quests | 4 | 4 |
| Quiz question pool | 14 | 20 |

Keepsakes/finds total: 6 (2 original + 4 new Floor-7 badges).

Floor-7 scenarios: `phish-ir`, `privesc`, `lateral`, `segmentation`, `tls-chain`,
`ransomware`, `rogue-ap`.
Floor-7 side quests: `defaultCreds`, `exposedRdp`, `secretInRepo`, `tailgater`.

## Architecture of the new systems

### Floors (world.js)
- `FLOOR_ORDER = ["floor3","floor7"]` and `FLOOR_META` (per-floor id/name/short/
  label/tag/blurb/locked).
- Per-floor data: `ROOMS3/NPCS3/PROPS3` and `ROOMS7/NPCS7/PROPS7`. Floor 7 reuses
  Floor 3's *proven-reachable* NPC coordinates, so the map skeleton (walls/doors/
  furniture) is identical and reachability is preserved. `coolifyFloor()` only
  re-skins non-blocking floor glyphs for the data-center look — walkability is
  unchanged.
- **Live-binding switch.** `MAP/ROOMS/NPCS/PROPS/PLAYER_START/LOC_LABEL/FLOOR_ID`
  are exported as `let` and reassigned by `setFloor(id)`. Importers (render/game/
  ui) see the updates automatically; in the concatenated standalone they become
  shared top-level `let` vars (so: keep new helper/var names unique across files).
- **Two new prop kinds:**
  - `elevator` (solid) — opens the floor picker.
  - `device` (walkable, has a `device` field: `"switch"|"firewall"|"terminal"`
    plus a `sideQuest`) — Floor-7 side-quest objects.

### Rendering (render.js)
- Added `drawElevator` and `drawDevice` (switch/firewall/terminal art).
- Prop dispatch and the faced-prompt list now handle `elevator` + `device`.
- `propBubbleKind`: `device` shows the side-quest "?" marker; `elevator` shows none.
- The map cache keys by `state.map` (= floor id), so each floor caches separately.
  **Always call `setFloor(id)` and set `state.map = id` together** (see `goToFloor`).

### Game wiring (game.js)
- On boot: `loadString("floor","floor3")` → `setFloor(...)` **before** reading
  `PLAYER_START`, so spawn + bindings are correct on restore.
- `state.floor`, and helpers `solvedOnFloor(id)`, `floorCleared(id)`, `goToFloor(id)`.
- `solved` is a single Set shared across floors (ids are globally unique); per-floor
  progress is computed via `scenarioIdsForFloor(id)`.
- `updateProgressUI` is floor-aware (ticket count "X / N", floor pill, loc-label)
  and **auto-sets the `floor3Cleared` flag** the moment Floor 3 is done — this is
  the elevator gate.
- Monitor end-of-day trigger is floor-aware (`floorCleared(state.floor)`).
- New top-bar **Exam** button → `openQuiz`. Reset returns to Floor 3.

### UI (ui.js)
- `openTicketBoard` and `openEndOfDay` filter to the current floor (with cert chips
  and a Floor-7 unlock nudge). `currentObjectives` is floor-aware.
- `openElevator(prop)` — floor picker; Floor 7 disabled (with hint) unless
  `floor3Cleared`. Selecting calls `state.goToFloor(id)`.
- `openQuiz()` — uses `sampleQuiz(state.floor, 5)`; one question at a time, instant
  correct/wrong + explanation, score screen with a progress bar, best-score saved
  per floor via `loadNum/saveNum("quiz-best-<floor>")`, and Retake.

### Quiz bank (quiz.js, new)
- `QUESTIONS` array; schema `{id, floor, cert, q, explain, options:[{t,correct}]}`
  with exactly one correct option.
- `sampleQuiz(floorId, n=5)` Fisher-Yates shuffles questions **and** options, and
  returns each with `answerIndex` (index of correct after shuffle).
- `quizPoolSize(floorId)`.
- **Build note:** `quiz.js` is in `MODULE_ORDER` in `tools/build-standalone.mjs`
  (after collectables, before render). Without it the standalone omits the quiz.

## How to extend

- **Add a quiz question:** push an object to `QUESTIONS` in `quiz.js` with the
  right `floor` and one `correct:true` option. The Exam picks it up automatically.
- **Add a Floor-7 scenario:** add to `SCENARIOS` with `floor:"floor7"` + a `cert`
  tag and the full POI/diagnosis schema; add the NPC to `NPCS7` on a reachable tile.
  `scenarioIdsForFloor`/counts update automatically.
- **Add a third floor:** add a `FLOOR_META` entry + a `FLOORS[id]` record
  (map/rooms/npcs/props/start/label), append the id to `FLOOR_ORDER`, and gate it
  in `openElevator` (mirror the `floor3Cleared` pattern). Tag content with the new
  floor id. No engine changes needed — the live-binding switch handles the rest.

## Verification done this session (all green)

- `node --check` on all 9 src modules and on the extracted standalone bundle.
- Static scan: no duplicate top-level declarations in the concatenated bundle.
- **Headless smoke (jsdom + stubbed canvas):** boots `startGame`, runs the intro,
  opens the ticket board / a scenario / a side quest / Discoveries / the full quiz
  on **both** floors; confirms the elevator is **locked** before Floor 3 is cleared
  and **unlocks** after; switches to Floor 7 and back; end-of-day on both floors.
- **Reachability flood-fill** from spawn on both floors: every NPC and every prop
  (walkable on a reachable tile; solid with a reachable neighbor) is approachable.
- **Runtime bundle boot:** the concatenated `standalone.html` script runs in jsdom
  with no redeclaration/runtime errors and populates the floor/ticket UI.

Test harnesses live in `tools/`: `smoke.mjs`, `reach.mjs`, `bundle-boot.mjs`
(they require `jsdom` as a dev-only dep: `npm i -D jsdom`).

## Files changed

`src/world.js`, `src/scenarios.js`, `src/sideQuests.js`, `src/collectables.js`,
`src/quiz.js` (new), `src/render.js`, `src/game.js`, `src/ui.js`, `src/styles.css`,
`index.html`, `tools/build-standalone.mjs`, `standalone.html` (regenerated).
