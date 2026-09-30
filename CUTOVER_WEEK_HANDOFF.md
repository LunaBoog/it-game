# THE TICKET QUEUE: Complete Handoff (v2.0, "Cutover Week")

**Written:** Sept 30, 2026 · **Built from:** `handoffs for games/ON_LOCATION_to_IT_GAME_Handoff.md` (ON LOCATION · NYC v7.3 → IT game)
**Audience:** the next Claude (and Moon). Dense on purpose.

---

## 0. Where we are + push status

v2.0 turns the IT game from "clear the ticket queue, end of day, repeat" into **three consecutive workdays of an IT job**: the new Tier 1 Help Desk Technician's first week lands on a laptop refresh for Accounting + Reception. Day 1 prep, Day 2 go-live on a real-time clock, Day 3 close-out, then happy hour, credits, an arcade final score and a top-10 board.

Everything from v1 still works: investigate → commit → principle tickets, CompTIA tags (now corrected, §7), the practice exam, both floors, XP ranks, the MK character creator, coins + cosmetic shop, achievements, themes, save-to-file, the two-mode reset, Mittens.

**Push status:** Claude can't push. Files were written straight into `~/Desktop/me/stuff/RPG_games/it-game-v2`. From that folder:

```bash
cd ~/Desktop/me/stuff/RPG_games/it-game-v2
git checkout -b cutover-week        # optional: keep main safe until you've playtested
git add -A src tools index.html standalone.html package.json CUTOVER_WEEK_HANDOFF.md "handoffs for games/ON_LOCATION_to_IT_GAME_Handoff.md"
git commit -m "v2.0 Cutover Week: three-day arc, NEXT UP, walk-ups, pages, change-window clock, documentation + receipts, e-waste custody, arcade score"
git push -u origin cutover-week     # or: git push (if you committed on main)
```

Netlify builds `npm run build` → `dist/` as before. `standalone.html` was regenerated and is double-clickable.

---

## 1. Decisions / requests log

| Version | Moon asked / decided | Claude picked (defaults, tune freely) |
|---|---|---|
| v2.0 | "Use this handoff to enhance this IT game into a new version." Build in `it-game-v2`; ON LOCATION at `~/Desktop/on-locations` for reference. | Premise **Cutover Week** (handoff default). Change = **laptop refresh for Accounting + Reception**. Player = **Tier 1 Help Desk Technician** (XP ladder titles stay as career rank). **Home + commute kept.** Coins/shop **separate** from in-fiction cash/card. Board **local-first**. Lifeline "**Ask Benny**" (the Coordinator), 3 per week, −50. Names invented, ids stable (§8). |
| v2.0 | Old saves? (handoff: ask; default bump + tolerant import) | **No prefix bump.** Added `saveVersion`. An older save keeps who you are (character, name, XP/rank, coins, cosmetics, achievements, theme, quiz bests) and starts a fresh Cutover Week run. v1 save files still import (then migrate on reload). |

---

## 2. What's new (v2.0)

- **Three-day arc** with a clear chain of command (Director Chen → Tasha → you → Kai; beside you Benny, Gloria, Harold).
- **NEXT UP card** (top-left, drops to bottom-left when you're standing under it) + a **bouncing yellow arrow** on the target tile. Routes across maps: subway (home ↔ lobby) and elevator (lobby ↔ F3 ↔ F7). Interrupts (walk-ups, go-finds, auditor, lost vendor, social engineer) jump the line.
- **Two new maps:** `home` (Astoria apartment, 31st St, 36 Av N/W station, Ahmed's coffee) and `lobby` (security desk, IT storeroom + e-waste cage, W 49th St, Byte Bodega, Lupe's coffee cart, The Stack bar). Same 30×22 skeleton, programmatic builder.
- **Walk-up users** (26): 2–3 rant lines ("Mm-hm / Keep listening…"), optional **Cut in** (−1 rep), then 3 answers scored 2/1/0 (+2/+1/−1 rep).
- **Pages / @helpdesk mentions** (14): pager modal on Floor 3 during the window, team-chat mention elsewhere; includes **go-find** pages that spawn a user with a "!".
- **Day 2 change window:** 300 s of active play (paused in panels, on the subway, at home) with a scheduled + random event table (§3).
- **Documentation = the receipt mechanic.** Every closed ticket, walk-up, page and social-engineering call ends with a big **✅ Close it** (Enter/Space lands here) and a small gray **📝 Add work notes & resolution first**. Gloria audits on Day 3.
- **Literal receipts** too: Byte Bodega supply run on the company card; personal snacks tempt you to tap the card.
- **E-waste chain of custody** (the TrashMan): 8 old devices after sign-off, first-pickup "E-Waste Plan" explainer with a pixel cage, custody book, recycler, certificate of destruction.
- **Evening ritual:** laptop → EOD shift-handoff email (tick real Day Notes, skip distractors) → Tasha's **Marching Orders** (by the numbers + tomorrow's list) → set alarm → bed → sleep overlay → morning card.
- **Team chat** (📱 / P), **Day Notes + receipt envelope** (📝 / N), **28 lingo cards**, **16 badges**, **8 new keepsakes**.
- **Finale:** Director Chen's email (next-gig tease: **SOC Week on Floor 7**) → happy hour at The Stack → credits → **FINAL SCORE** (rows slide in, total counts up, grade) → initials → top-10 board (also on the title screen).
- **Cert tags corrected** to current exam numbering (§7).
- **Tooling:** `tools/validate.mjs` (structural validator), `tools/bot.mjs` (headless full-arc bot), `build-standalone.mjs` now fails loudly if a module is missing from `MODULE_ORDER`.

---

## 3. The game, day by day

### Day 1 · Onboarding & Change Prep (10 tasks)
1. Read Tasha's welcome email (home laptop)
2. Badge photo with **Lou** (lobby security desk). The lobby elevator refuses you without a badge. Tailgating lesson + keepsake.
3. **Kit from Tasha:** laptop, MFA enrolled, daily account + **separate temporary admin account**, company card ($500), team chat. Must-answer: *which account reads email?* (least privilege). Keepsake: her spare USB-C dongle.
4. **Shadow Tasha:** take Karen's ticket (`monitor`)
5. **Supply run** at Byte Bodega on the card (labels + custody logbook, USB-C adapters, Cat6, anti-static bags, cable ties) → drop with **Kai**
6. **Inventory walk:** asset-tag 6 machines (2 Reception, 4 Accounting). Needs labels.
7. **Verify backups:** test restore, not "job says SUCCESS" (badge if first try)
8. **CAB with Harold + Chen:** window / backout plan / risk. Resubmit until all three are right (badge if first pitch). Won't even talk until backups are verified.
9. 🚨 **Send the user notice NOW** (loud task; tick-composer; posting it puts 3 MAINTENANCE signs on the floor)
10. **Stage laptops:** sign out the loaner cart from **Mo** (custody) → imaging bench; one laptop has last year's image

Walk-ups: 2 · Page: 1 · Tickets available: `monitor`, `printer`, `internet-down`.

### Day 2 · Go-Live (5 tasks, the last is the clock)
1. Stand-up with Tasha ("Help Desk owns the users; the engineers own the change")
2. Swap station: imaging bench, data-transfer station (Known Folder Move lingo), waiting area
3. Escalation contacts: OEM warranty card (Mo) + ISP NOC card (Lou) → attach both in 📱 and post (a gif is the distractor)
4. Check in with **Harold** on the bridge (must answer who owns what) → **the window opens**
5. Work the floor until the window closes

**Clock (`WINDOW_LEN = 300` s, cooldown 8 s):**

| Event | Window (s) |
|---|---|
| Bridge status lines (ambient, in the NEXT UP card, unlock lingo) | first at 8–14, then every 32–44 |
| Pages (one is always a go-find) | 25–45, 110–150, 200–240 |
| "Log it" calls → known-issues log | 50–80, 170–210 |
| Auditor Ms. Whitlock (3 of 4 clean-desk findings) | 60–130 |
| Vendor Dale wanders to 1 of 7 hideouts | 90–150; 50%: 205–245 |
| Social engineer (ISP "Chad" / vishing call / "Derek from IT") | 40–100; 60%: 180–230 |
| Security interrupt: Sofia unlocks Floor 7 (phish-ir) | 50%: 130–170 |
| Walk-ups (5) | every 45–70 on F3/lobby |
| "Last ten users" / "Final validation" | 240 / 275 |
| Window closes | ≥ 300, all events fired (or +30 s grace), nothing pending |

Tickets available: `dns`, `slow`, `permissions` (+ F7 if open).

### Day 3 · Hypercare & Close-Out (10 tasks)
1. Pull the 3 maintenance notices + take down the intranet banner
2. Route every known issue to a resolver group (Desktop / Network / Apps/M365 / Security / Facilities): Day 2's logged ones + 2 "overnight" ones (badge if all first try)
3. Business sign-off (UAT) from **Ed** (Accounting), **Karen** (Reception), **Riley** (Ops). Won't sign with open known issues. 3 keepsakes.
4. **E-waste:** 8 devices appear only after sign-off (the backout plan kept them). Walk over them (needs labels) → cage in the lobby storeroom → recycler → certificate of destruction.
5. Return card + loaner cart + **temporary admin rights** (must pick "remove them today")
6. **Gloria's audit:** receipts (affidavit per missing card receipt, repay personal card charges from cash), then "How many did you close without notes?" (honest = +2 rep + badge, low-balling = −2), back-fill each
7. KB article (3 fixes, resubmit until right)
8. PIR email (blameless tick-composer)
9. Director Chen's email (unlocks the party, keepsake, sets `f7Unlocked`)
10. Happy hour at The Stack (talk to Nico) → credits → arcade

Walk-ups: 2 · Page: 1 · Ticket available: `change` (Chen).

---

## 4. Money / ledger

- 💵 Cash starts at **$50** (coffee $4 = 60 s walk buff, no receipt needed). 💳 Company card, **$500 limit**, issued with the kit, returned Day 3. Both are ⚠️ game balance, not fact.
- `purchase(itemId, vendor, pay, exitLabel, after)` → `dd.purchases[] = {id,key,item,icon,amt,vendor,d,rcpt,recon,personal,repaid,pay}`. Big orange exit button is focused; small gray "Could I get a receipt, please?" link.
- Personal items (energy drink, gum): the card-tap button is big and focused, "pay with my own cash" is the small link. On Day 3 Gloria makes you repay any personal card charge from cash.
- **Docs:** `recordWork(kind,id,title,user,symptom,fix)` → `dd.docs[]`; `docPrompt(host, rec, onClose)` draws Close-it + notes link.
- Coins/tokens (cosmetics) are untouched and separate.

---

## 5. Randomization pools

| Pool | Size | Per day (D1 / D2 / D3) | File |
|---|---|---|---|
| `ISSUES` walk-ups | 26 (6 / 14 / 6) | 2 / 5 / 2 | `pools.js` |
| `PAGES` | 14 (3 / 8 incl. 2 go-find / 3) | 1 / 3 (always 1 go-find) / 1 | `pools.js` |
| `KNOWN_ISSUES` | 8 | D2: 2 logged calls · D3: +2 overnight (≥4 total) | `pools.js` |
| `SOCENG` | 3 | D2: 1, 60% a 2nd | `pools.js` |
| Auditor findings | 4 | 3 | `world.js F3_SPOTS.violations` |
| Vendor hideouts | 7 | 1–2 | `world.js F3_SPOTS.hideouts` |
| `PERSONAS` | 12 | shuffled daily | `pools.js` |
| `DISTRACT` (EOD) | 10 | 3 per email | `pools.js` |

`rollDay(day)` caches in `dd.roll[day]` (a reload never rerolls; a new week does). Day 2's schedule is `dd.sched` (+ `dd.schedSe`, `dd.schedKnown`).

---

## 6. Everything else still live

Floors 3 and 7 with all 14 tickets and 8 side quests, Mittens → ceiling-tile stash, Field Companion (now also shows badges + lingo), practice exam (home/lobby use the F3 pool), XP ladder + 12 achievements + toasts (max 3 on screen now), MK roster + customizer, coin shop, themes + accessibility, save/load to file, New Playthrough / Full Reset (title now says **NEW WEEK**). Floor 7 opens on the security interrupt, Director Chen's email, or clearing every F3 ticket.

---

## 7. Fact-check list

**✅ Verified (with source)**
- Current exams (2026): A+ **220-1201/1202** (V15), Network+ **N10-009**, Security+ **SY0-701** (SY0-801 expected ~2027), PenTest+ **PT0-003**. [CompTIA roadmap summary](https://www.secuspark.com/blog/comptia-roadmap-2026)
- A+ 220-1201 domain 5: 5.1 power, 5.2 drives/RAID, **5.3 video/display**, 5.4 mobile, 5.5 network, **5.6 printers**. So the old "A+ · 5.4 Display" tags were 1101-era; fixed. [220-1201 objectives](https://www.onlc.com/comptia/comptia-a-220-1201-exam-objectives.pdf)
- N10-009: **5.1** troubleshooting methodology, **3.4** IPv4/IPv6 network services (DNS), **1.7** IPv4 addressing, **3.1** organizational processes, **4.1** segmentation. [N10-009 objectives](https://assets.ctfassets.net/82ripq7fjls2/113XqW3JHT7AlIU33M63I0/af42da2af7383a38f318bad10aa9afbd/Network_Plus_N10-009_Exam_Objectives.pdf)
- SY0-701: **1.3** change management, **1.4** crypto, **2.2** threat vectors, **2.4** indicators, **2.5** mitigation, **4.2** asset mgmt, **4.6** IAM, **4.8** IR, **5.6** awareness. [SY0-701 objectives](https://assets.ctfassets.net/82ripq7fjls2/6TYWUym0Nudqa8nGEnegjG/0f9b974d3b1837fe85ab8e6553f4d623/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf)
- **NIST SP 800-88 Rev. 2** published Sept 26, 2025 (Rev. 1 withdrawn); still frames clear/purge; technique details now point to IEEE 2883 / NSA specs. [NIST news](https://csrc.nist.gov/News/2025/guidelines-for-media-sanitization-rev-2)
- **CISA:** number matching against MFA fatigue / push bombing; never approve a prompt you didn't start. [CISA fact sheet](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implement-number-matching-in-mfa-applications-508c.pdf)
- **OneDrive Known Folder Move** redirects Desktop/Documents/Pictures. [Microsoft Learn](https://learn.microsoft.com/en-us/sharepoint/redirect-known-folders)
- **NIST SP 800-63-4** (Aug 2025) is the current digital identity guideline set; 800-63B-4 covers authentication and account recovery; no forced periodic password changes. [SP 800-63-4](https://pages.nist.gov/800-63-4/sp800-63.html)

**⚠️ General practice / Moon to confirm**
- Display rotation hotkeys (Ctrl+Alt+Arrow) only exist on some graphics drivers; Settings → Display → orientation always works. Written as "maybe" (score 1).
- PCI DSS v4.0.1 visitor rules (authorized, badged, escorted) are under Requirement 9.3; the game says "visitors are escorted" as company policy, not PCI.
- ITIL 4 terms (CAB, backout plan, PIR, known error, hypercare, impact × urgency) are standard practice language.
- Certificate of destruction = recycler/vendor practice.
- "Payroll runs Wednesday at noon," the 12-laptop scope, card limit $500, cash $50, 3 lifelines, "notice before any change" are **game design**.
- Resolver-group routing answers (e.g. wall jack → Network, cord across doorway → Facilities) follow typical org splits; real orgs vary.

**❓ Moon to decide**
- Keep the tempting "tap the card for a snack" beat? (It's the personal-vs-company spend lesson.)
- Shared crew leaderboard via Netlify Function + Blobs? (Not built; `loadHS/saveHS` in `score.js` are the swap points.)
- Grade cutoffs after your own playthrough (§11).

---

## 8. Names & cast (display name ↔ code id)

| Display | id | Where | Role |
|---|---|---|---|
| Director Chen | `chen` | F3 Manager | IT Director (kept his `change` ticket) |
| Tasha | `tasha` | F3 IT room | Help Desk Lead, your boss, kit-giver, Marching Orders |
| Harold | `harold` | F3 Conf. room | Change Manager, CAB, the bridge |
| Benny | `benny` | F3 Open desks | Service Desk Coordinator, the lifeline |
| Gloria | `gloria` | F3 Manager room | Service Desk Manager, ticket + receipt audit |
| Kai | `kai` | F3 IT room | IT intern |
| Lou | `lou` | Lobby security desk | badge, ISP NOC card |
| Mo | `mo` | Lobby IT storeroom | loaner cart, OEM card, e-waste cage |
| Ray | `ray` | Byte Bodega | supplies |
| Lupe / Ahmed | `lupe` / `ahmed` | lobby street / home street | coffee |
| Nico | `nico` | The Stack | bartender, finale trigger |
| Ms. Whitlock | `auditor` (visitor) | F3 | compliance auditor |
| Dale | `vendor` (visitor) | F3 server closet | escorted OEM tech |
| "Chad" / caller / "Derek" | `se_isp` / `se_vish` / `se_fakeit` | lobby / phone / Reception | social engineer |
| Recycler | `recycler` (visitor) | lobby storeroom | certificate of destruction |
| Party crowd | `p-tasha`, `p-benny`, `p-kai`, `p-chen`, `p-gloria`, `p-harold` | The Stack | `needFlag: partyOpen` |

Ed is now "Accounting lead", Riley "Office / Ops manager". Rename any display name freely; logic keys off ids.

---

## 9. Code map

**New modules** (all in `MODULE_ORDER`):

| Module | What |
|---|---|
| `core.js` | `CORE` (shared state pointer, toast/sfx callbacks), `dd` blob (`ddFresh/ddLoad/ddSave`), `addNote`, `addRep`, `bump`, `recordAnswer`, day names |
| `pools.js` | all v2 content: PERSONAS, ISSUES, PAGES, KNOWN_ISSUES, RESOLVER_GROUPS, VIOLATION_TEXT, SOCENG, BRIDGE_LINES, LINGO, BADGES, DISTRACT, SUPPLY |
| `days.js` | `DAY_TASKS` (done/route), `nextUp()`, `resolveRoute()`, `rollDay()`, walk-ups (`spawnWalkup`, `openWalkup`), `judgment()` (3 answers + lifeline), pages (`firePage`), dispatch (`dayNpc/dayProp/dayStep`), `dayTick`, ticket-by-day gate, v2 orientation |
| `flows.js` | every task scene + evening (`openEodCompose`, `openMarchingOrders`, `goToSleep`, `advanceDay`, `openMorning`, `commute`), e-waste, phone contacts |
| `clock.js` | Day 2 window: `openWindow`, `rollSched`, `clockTick`, event `fire()`, auditor / vendor / social engineer, `clockNextUp`, `clockRestore` |
| `visitors.js` | transient NPCs: `visAdd/visRemove/visLeave/visUpdate`, BFS pathing |
| `ledger.js` | cash/card, `purchase`, `openBodega`, `buyCoffee`, `recordWork`, `docPrompt`, `openAudit` |
| `comms.js` | `ping`, `award` (badges), `hearLingo`, `chatPost`, `openPhone`, `openNotes` |
| `score.js` | `finalScore`, `GRADES`, `showArcade`, initials, `loadHS/saveHS` (`itgame_hiscores`), `hsTable`, `rollCredits` |

**Changed:** `world.js` (home + lobby maps, new tiles, cast, props, `F3_SPOTS`, `LOBBY_SPOTS`, `mapDef`, `arrivalFor`, `isWalkableOn`), `game.js` (migration, `dd`, HUD pills, NEXT UP, overlays, sfx, arrival points, saved position, dispatch hooks, N/P keys, ResizeObserver, `window.__tq` test handle), `ui.js` (exported panel API `panel/pAdd/pBtn/pClear/closePanel`, sprite portraits in the panel avatar, ticket board by day, doc prompt after tickets, elevator lock, v2 orientation, companion badges/lingo, toast cap), `render.js` (11 new tiles, v2 props, walking visitors, NEXT UP arrow, night/party tint), `scenarios.js` (`day` + fixed tags), `sideQuests.js` (fixed tags), `collectables.js` (+8), `savefile.js` (v2), `styles.css`, `index.html`.

**Hooks the day engine uses:** `interact()` asks `dayNpc/dayProp` first; the loop calls `dayTick(dt, modalOpen)` and `dayStep` on step-end; `state.floor7Open()`, `state.setDay()`, `state.npcSprite(id)`, `state.propVisible/npcVisible` (needFlag + **hideFlag**), `state.overlay`.

**Persisted keys** (prefix `it-game:`): v1 keys + `saveVersion` (2), `dd` (JSON blob), `pos` (`{m,x,y,f}`), `floor` (now any map id). **Outside the prefix:** `itgame_hiscores` (survives every reset).

**`dd` shape:** `rep, repDay, notes[], docs[], purchases[], cash, cardSpent, cardLimit, roll{}, done{}, sched, schedSe, schedKnown, clockT, fired{}, cool, windowOpen, windowClosed, nextBridge, bIdx, nextWalk, officeT, pendingGo, act{auditor,viol,vendor,vHide,se,seActive}, st{asked,first,wrong,lifelines,best,heard,cut,pages,pagesBest,se,vendor,logged,routedFirst,routed}, badges[], lingo[], chat[], carry[], caged[], known[], known3, days{}, solvedOn{}, buffUntil, hsT`.

**Engine gotchas (still true, plus new):**
- One shared scope in the standalone: top-level names must be unique across files. **No `import * as` and no `import { a as b }`**: the standalone strips imports, so aliases vanish. Don't write the word "import" followed by a space in comments either (the strip regex can match it).
- `.foo { display:flex }` beats the `hidden` attribute. Overlays have explicit `[hidden]{display:none}` rules.
- Visitors live in their map's `npcs` array and only move while you're on that map. Reload respawns the Day 2 actors and go-finds from `dd`.

---

## 10. Validation results

All run on the final build:

- `node --check` on all 23 modules ✅ and on the script extracted from `standalone.html` ✅
- `node tools/validate.mjs` → **531/531** ✅ (maps 30×22; every NPC/prop in bounds, not on solid tiles, with a reachable neighbor via flood fill; no tile overlaps; visitor spots, hideouts, e-waste and go-find spawns reachable; every route target id exists; every keepsake/badge/lingo id registered; every scenario/side quest/quiz/issue/page/social-engineer/inline judgment has exactly one best answer; pools big enough for the rolls)
- `tools/bot.mjs tasks` (standalone) → full arc to initials, **0 page errors**, **4,860 (C)**
- `tools/bot.mjs thorough` (standalone) → **9,705 (S)** (14/14 tickets, 8/8 side quests, 26/26 documented, 14/14 keepsakes, 15 badges)
- Same bots against the **Vite `dist/` build** over http → full arc, 0 errors
- `RELOAD=1` mid-window reload → clock, vendor, auditor restored; run completes
- Edge script: cut-in (−1 rep), lifeline highlights the best answer, wrong answer counted, **Enter closes without notes** (the lesson), bed refuses before tasks, 0 errors
- Desktop 1280 px and phone 390 px screenshots checked (overlays go full-screen, NEXT UP compacts on phones)

Run them yourself:
```bash
npm run build:standalone && npm run validate
npm i --no-save playwright && npx playwright install chromium   # once, for the bot
npm run bot -- thorough        # or: tasks ; add --shots for screenshots
```

---

## 11. Tuning knobs + next ideas

**Knobs:** `WINDOW_LEN` + the `rollSched()` table (`clock.js`); per-day counts in `rollDay()`; D1/D3 walk-up/page timing (`wTimes`, `pT` in `dayTick`); score weights + `GRADES` (`score.js`: S 9,300 · A 7,800 · B 6,300 · C 4,600, set so the flawless task-only bot lands at C and perfect play at S); cash/card; coffee buff; lifelines (3).

**Next ideas:**
1. Moon's playtest pass: renames, move things, loud tasks.
2. **SOC Week** on Floor 7 as show #2 (Detect → Contain → Recover), teased in Chen's email.
3. MSP field-tech variant (drive to a dentist, a law firm, a restaurant).
4. Shared leaderboard (Netlify Function + Blobs, initials profanity filter).
5. Seeded **Daily Shift**: seed `rollDay()` from the date.
6. Walk-ups currently spawn at the elevator; a swap-station queue that fills visibly would sell Day 2 even more.
7. Break-room mini-game (tokens are still waiting for it).
