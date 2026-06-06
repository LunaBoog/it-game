# Wave 1 Handoff — Identity, Look & Persistence

This wave adds the things that make the game feel like *yours*: a theme system,
a side-by-side dialog layout, a Mortal-Kombat-style character creator, a coin
shop, an XP career ladder, achievements, and save/load-to-file. All vanilla ES
modules + Canvas, no backend, localStorage saves, and it still ships as both a
Vite app and a single `standalone.html`.

## New for players

- **Three themes** — Light, Gray (default), Black — in a real **Settings** panel
  (gear icon, top-right), alongside step-sound, **reduced motion**, **high-contrast
  markers**, and **larger text** toggles. All persist.
- **Dialogs dock to the right** of the map on wide screens (and stack underneath
  on phones), so you can read evidence while watching the room.
- **Character creator** — a "pick a fighter" roster of 8 presets, then a customizer:
  recolor skin / hair / shirt / accent, toggle accessories (glasses, shades, hats),
  name yourself, rotate the live preview, or hit **Surprise me**. Reachable on first
  run and any time via **Settings → Edit character**.
- **Coin shop** (top bar) — spend the coins you earn (side quests, the cat's stash)
  on premium shirt colors, shades, and hats. Purchases auto-equip.
- **XP + a career ladder** — earn XP for tickets, first-try diagnoses, side quests,
  floor clears, finds, and acing practice tests. Climb from IT Intern → … → CISO.
  Current rank shows in the top bar (`Lv N · Title`).
- **Achievements** — 12 unlockables with toast pop-ups, in the **Career** panel
  alongside your XP bar.
- **Save / Load to file** — Settings → Save downloads a portable, versioned JSON
  of your whole save; Load re-imports it (with checksum validation) and reloads.
  Great for backups or moving between laptop and phone.

## New modules

- `theme.js` — light/gray/black + accessibility prefs (motion, contrast, text).
  `applyTheme`, `applyPrefs`, `currentTheme`, `prefs`, setters. Also pushes
  motion/contrast into the renderer via `setRenderPrefs`.
- `cosmetics.js` — `PRESETS` (roster), swatch palettes, `ACCESSORIES`, `SHOP_ITEMS`,
  `PREMIUM_SHIRTS`, `darken()`, `randomSprite()`, `DEFAULT_SPRITE`.
- `progression.js` — `XP` rewards, `TITLES` ladder + `rank(xp)`, `ACHIEVEMENTS`
  with `check(state)` predicates, `newlyUnlocked(state, set)`.
- `savefile.js` — `serializeSave()`, `saveFilename()`, `applySaveText()` (FNV-1a
  checksum + version envelope around `storage.dumpAll/restoreAll`).

## Engine touch points

- **storage.js** — added `dumpAll()` / `restoreAll(map)` (whole-save export/import).
- **render.js** — `drawPersonProc` now renders `hat` (cap) and `shades`; added
  `drawSpritePreview(canvas, sprite, facing, scale)` for the creator/shop previews;
  added `setRenderPrefs(reduceMotion, hiContrast)` honored by the idle bob and the
  marker bubble (dark halo in high-contrast). The **player** now draws with
  `state.playerSprite` (chosen palette) instead of the hardcoded default.
- **game.js** — new state: `xp`, `owned` (Set), `achievements` (Set), `playerSprite`
  (persisted as JSON). New helpers: `setPlayerSprite`, `addXp` (auto promotion toast),
  `buyItem`, `own/hasOwned`, `checkAchievements`, `doReset`, `exportSaveFile`,
  `importSaveText`. Applies theme + prefs on boot; first run opens the creator;
  topbar routes Shop / Career / Settings; sets `visitedFloor7` + `floor7Cleared`
  flags; the rank pill updates in `updateProgressUI`.
- **ui.js** — new screens: `openCharacterCreator`, `openSettings`, `openShop`,
  `openAchievements`, and `showAchievementToast`. XP is awarded at the existing
  solve points (ticket / first-try / floor-clear / side quest / quiz pass+perfect).
- **index.html** — `data-theme` on `<html>`; new topbar buttons (`rank-pill`,
  `shop-btn`, `ach-btn`, `settings-btn`; legacy `sound-btn`/`reset-btn` kept hidden
  but wired); `.game-layout` flex wrapper around the viewport + the modal panel;
  a `#toast-host`.
- **styles.css** — `[data-theme]` variable blocks; the side-panel + responsive
  layout; `data-motion`/`data-cb`/`data-text` rules; and components for the roster,
  customizer, settings, shop, achievements, rank bar, toasts, swatches, switches.
- **build-standalone.mjs** — `MODULE_ORDER` now: storage, world, scenarios,
  sideQuests, collectables, quiz, cosmetics, progression, render, theme, savefile,
  ui, game.

## Verification (all green)

- `node --check` on all 13 modules and the extracted standalone bundle; no
  duplicate top-level declarations.
- **Headless smoke (jsdom):** boots, runs the **character creator** (pick → recolor
  → accessory → name → confirm), opens **Settings** (switches theme, flips all three
  a11y toggles, exercises **Save to file**), opens **Shop** and **Career**, fires a
  toast — then the full prior flow (ticket board, scenarios, side quests, quiz on
  both floors, elevator lock→unlock, floor switching, end-of-day).
- **Save-file round-trip:** serialize → wipe → restore returns every key; tampered
  data and non-JSON are both rejected with clear messages.
- **Reachability** flood-fill: every NPC/prop approachable on both floors.
- **Runtime bundle boot:** the concatenated `standalone.html` runs with no errors.

## Notes / known scope

- High-contrast markers add a dark halo behind the in-game `!/?/✓` bubbles (which
  already carry distinct glyphs). Reduced motion stills idle bob + UI animations.
- The shop sells cosmetics only; equip happens automatically on purchase and via
  the creator. Coins come from side quests and the cat's ceiling-tile stash.
- **Next (Wave 2):** spaced repetition on missed quiz questions, a timed mock exam,
  a domain-readiness dashboard, a seeded daily challenge, and an exportable report
  card. **Wave 3:** command-line lab, capstone incidents, ticket variants, new floors.

## Files changed / added

New: `src/theme.js`, `src/cosmetics.js`, `src/progression.js`, `src/savefile.js`.
Changed: `src/storage.js`, `src/render.js`, `src/game.js`, `src/ui.js`,
`src/styles.css`, `index.html`, `tools/build-standalone.mjs`, `standalone.html`.
