# THE TICKET QUEUE: Complete Handoff (v3.0 "The Ladder": 3 weeks × 3 days, help desk → network → security)

**Written:** Sept 30, 2026 · **Built from:** `handoffs for games/ON_LOCATION_to_IT_GAME_Handoff.md` (ON LOCATION · NYC v7.3 → IT game)
**Audience:** the next Claude (and Moon). Dense on purpose.

---

## 0. Where we are + push status

v2.0 turns the IT game from "clear the ticket queue, end of day, repeat" into **three consecutive workdays of an IT job**: the new Tier 1 Help Desk Technician's first week lands on a laptop refresh for Accounting + Reception. Day 1 prep, Day 2 go-live on a real-time clock, Day 3 close-out, then happy hour, credits, an arcade final score and a top-10 board.

Everything from v1 still works: investigate → commit → principle tickets, CompTIA tags (now corrected, §7), the practice exam, both floors, XP ranks, the MK character creator, coins + cosmetic shop, achievements, themes, save-to-file, the two-mode reset, Mittens.

**v3.0 (Oct 2):** the game is now **The Ladder**: three weeks, three jobs (see §14). v2.2 (popups/Space/smooth walking) is §13.

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
| v2.1 | "Improve the look of the offices... walls, desks, plants, printer, watering hole, break room. Go hard on dressing the environment." | New `decor.js` painter; 3/4-view walls with windows; per-room floors; desk pods; a real **Break room** split from Open desks 2; usable fixtures; Floor 7 dressed as a SOC; brick street facades. Gameplay unchanged. |
| v2.2 | "Character choice as a popup over the map, same for every popup. Space instead of E. The walk is jittery, why, fix it." | §13. Modal moved inside the viewport as an overlay (phones: bottom sheet). Space interacts (E removed). Four jitter causes found and fixed. |
| v3.0 | "When we gather things from Tasha, a day-one quiz/tutorial/presentation that teaches networking + IT know-how, then tests it; tasks use the teaching, some redundant; each level. 3 days at each level: Intro IT → Networking pro → Cyber security pro, a ladder. Give it a hard go." | §14. Three weeks: **Cutover Week** (Tier 1, Floor 3, Tasha) → **Network Week** (Network Technician, new Floor 5, Rosa) → **SOC Week** (Security Analyst, Floor 7, Omar). Each week opens with a slide-deck training + 8-question quiz; tickets, walk-ups, pages, hotspots and tasks show **📘 From your training** chips that point back to the slide. Per-week report card + promotion; career score + initials at the end of day 9. |
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


---

## 12. v2.1 Office dressing (Oct 1, 2026)

**What changed visually**
- **Walls** are 3/4 view: a wall tile with floor below shows its face (dark cap, painted wall, baseboard), others show the top with trim. Exterior top walls are **windows** with a Midtown skyline (night skyline + lit windows on Floor 7). Walls over a sidewalk are **brick facades**. Floors get contact shadows at walls and door thresholds.
- **Floors per room** (new walkable codes): `.` vinyl (IT, print), `f` oak (reception), `o` blue-gray carpet tiles (open desks), `k` checker (break room), `q` warm carpet (Director), `x` raised data-center floor (server closet, F7 closet + data center), `g` navy (conference / IR war room), `u` sage (accounting), `z` dark SOC carpet (F7 bullpen, pit, red-team lab).
- **Desks** join into pods (seamless tops, modesty panels), with monitors/dual monitors, keyboards, mugs, sticky notes, papers, phones. Counters have a stone top and walnut front. Office/conference/break-room chairs face their desks. Server racks have blinking LEDs.
- **Lighting:** baked ceiling-panel light pools per room + daylight falling from the windows. Vignette softened. Room names moved off the floor onto the wall trim (door-sign style).
- **Printer** (printerInk side quest) redrawn as an office laser printer with toner colors; the low-cyan light still blinks.

**Floor 3 layout changes** (all validated reachable)
- **Break room** = east end of Open desks 2 (x15–18, y8–13), partition wall at x14 with a doorway at y10–11. Fridge, coffee machine, microwave, sink, round table + chairs, vending machine, **water cooler**.
- Open desks 2 (now x7–13) and Open desks / Accounting / F7 red-team lab use **desk pods**. Riley moved to (10,10); `v-sticky` moved to (8,12).
- Reception: front counter x10–14 (bell, phone, plant, two PCs), couch + rug waiting area, fish tank, door mats, NORTHWIND logo between windows.
- Director's office (was "Manager"): long executive desk, patterned rug, bookshelves, plants, art.
- Server closet: second rack row, CRAC unit, UPS. Print room: copier, paper boxes, shredder, supply shelf, corkboard.

**Usable fixtures** (props `kind: "fixture"`, `art`): water cooler (rotating day-aware gossip; first visit unlocks the "off and on again" lingo, third visit +1 rep), coffee machine (free 60 s walk buff), vending machine (opens the coin cosmetics shop), fridge, microwave, fish tank (Ping and Pong), copier (a note on copier hard drives). All in `fixture()` in `flows.js`.

**Floor 7**: SOC video wall (animated graphs) across the bullpen's top wall, animated threat-map pings in Threat intel, patch panels, rack rows, antenna + Faraday cage + spectrum analyzer in the Wireless lab, IR board, "HACK THE PLANET" neon (flickers), RGB keyboards, beanbags.

**Code map additions**
- `src/decor.js` (new, in `MODULE_ORDER` after `world.js`): `paintWall`, `paintFacade`, `paintFloor`, `paintFloorShadows`, `paintDesk`, `paintCounter`, `paintChair`, `paintRack`, `paintDecor` (~45 kinds), `paintFixture`, `paintAnimated`, `paintRackLeds`, `bakeLight`, `STYLE` palettes per map.
- `world.js`: `buildFloor3()`, `buildFloor7()`, `refloor()`, the `DECOR` registry (`dz(map, kind, [[x,y]...], {solid|wall|item})`), `decorFor(id)`, `decorSolidAt(id,x,y)`. `isWalkable`/`isWalkableOn` respect solid decor.
- `render.js`: map cache now bakes walls/floors/desks/decor/light; per-frame layer draws rack LEDs, video wall, threat map, neon, fixtures.
- Decor flags: `wall` (on a visible wall face), `item` (on a desk/counter), `solid` (blocks). Non-solid floor decor: rugs, mats, chairs.
- `tools/validate.mjs` now checks decor too: wall pieces sit on visible faces, items sit on desks/counters, floor decor on floor, solid decor never covers an NPC/prop, and reachability counts solid decor. **917/917** pass.

**Adding dressing:** add a `dz(...)` line in `world.js`, give it a painter case in `paintDecor` if it's a new kind, run `npm run validate`.

**Validation (v2.1):** module + bundle syntax ✅ · validator 917/917 ✅ · `bot tasks` full arc, 0 errors (4,640, C) · `bot thorough` full arc, 0 errors (14/14 tickets, 8/8 side quests) · fixture script: all 7 fixtures open, solid decor blocks movement ✅.


---

## 13. v2.2 Popups over the map, Space to interact, smooth walking (Oct 1, 2026)

- **Popups:** `#modal-bg` lives inside `.viewport-shell` (absolute, inset 8px, dimmed + blurred map behind). Phones (≤720px): fixed bottom sheet. Clicking the dimmed map no longer closes a panel (it used to lose half-done conversations); ×, Esc or the buttons close it. Every panel (character creator included) uses it.
- **Space interacts** (`e.key === " "`, ignores key-repeat). Legend, hint ("Space: Talk to Karen"), touch button (␣) and intro text updated. E no longer does anything.
- **Why the walk was jittery, and the fixes** (all in game.js/render.js/visitors.js):
  1. A dead frame between tiles: arriving set `moving=false`, the next step only started on the following frame, and leftover time was thrown away. Now the step chains in the same frame and carries the remainder.
  2. The interact hint rewrote DOM every frame and toggled per tile → layout thrash. Now cached and only changes on change.
  3. Fractional camera + sprite positions made pixel art shimmer. Camera and sprites are rounded to whole pixels.
  4. A synchronous localStorage write on every tile. Position saves are debounced (800 ms after you stop).
  Plus a real 2-frame leg swing. Visitors got the same no-dead-frame fix.

---

## 14. v3.0 THE LADDER (Oct 1–2, 2026)

### 14.1 Shape
| Week | Days | Role | Base | Boss (trainer) | The change |
|---|---|---|---|---|---|
| 1 Cutover Week | 1–3 | Tier 1 Help Desk Technician | Floor 3 | Tasha | Laptop refresh (unchanged + training) |
| 2 Network Week | 4–6 | Network Technician | **Floor 5 (new)** | Rosa (Hiro runs the bridge) | Replace Floor 3's access switches, phones → voice VLAN, new Wi-Fi APs |
| 3 SOC Week | 7–9 | Security Analyst | Floor 7 | Omar (IR lead) | A real incident: MFA-fatigue account takeover in Accounting |

Every week has the same rhythm: **day A** onboarding (badge with Lou, kit from the boss, training + quiz, prep tasks), **day B** on the clock (300 s active play; bridge lines, pages incl. a go-find, walk-ups, 2 log-its, 3 hotspots, 1–2 social engineers), **day C** close-out (known issues routed, sign-offs/briefing, Gloria's review, PIR/report, Chen's email, The Stack). Evenings: EOD → boss's Marching Orders → alarm → bed. Week ends: party → **week report + PROMOTED card** → Chen's "it's official" email → bed → next week. Day 9: party → credits → **career score** → initials → top-10. `S.day` 10 = career wrapped.

`core.js` owns it: `WEEKS`, `LAST_DAY = 9`, `weekOf()`, `dayIn()`, `isClockDay()` (2/5/8), `isWeekEnd()` (3/6/9). Floors unlock by day: F5 from day 4, F7 from day 7 (or W1's security interrupt, which now only opens `phish-ir`).

### 14.2 Training (training.js)
- `TRAINING[w]`: `slides[]` ({t, say, pts[], fig}) + `quiz[]` (8 questions, `o: [[text, 1|0]]`, `s` = slide index, `why`). Pass mark 6/8.
- Presentation UI: a "projector screen" (REC dot, timestamp, slide counter), inline SVG pixel diagrams (crisp, scale on phones), the trainer's portrait with a typewriter narration (instant with reduced motion), key points, Back/Next, progress dots. Repeat viewers get "skip to the quiz".
- Quiz: one at a time, explanation + "📘 Slide N" after each. Below the pass mark → review the missed slides' points, retake only the missed ones until right. Score = first attempt (`dd.quiz[w]`), 60 pts each in the week score; perfect = **Star Student** badge + rep.
- Where: W1 inside Tasha's kit hand-off (new task `d1_train`); W2 the Training-room projector on F5; W3 the IR war-room screen on F7. Rewatch any finished training from the Field Companion → Training library.
- **The pay-off:** `TAUGHT` maps ticket / side-quest / walk-up / page / hotspot ids → [week, slide]. `taughtChip(id)` renders a collapsible "📘 From Rosa's training: Switching and VLANs" with that slide's points; `slideChip(w,i)` does it inside task flows (IP plan, staging, trace, verify, isolate, triage, vuln...). Chips only appear after that week's training is passed. Some content repeats across weeks on purpose (least privilege/JIT three times, test-restore twice, verify-the-human every week).
- Content: W1 the job/tiers, priority = impact × urgency, the 6-step A+ method, bottom-up/physical first + OSI, DHCP/DNS/gateway path, printers, security basics. W2 OSI as gear, IPv4, subnet math, DORA + DNS records, VLANs/trunks/voice VLAN/LLDP-MED, loops/STP/BPDU guard, cabling 100 m + PoE af/at/bt + 2.4 GHz 1/6/11 + duplex, the 7-step Network+ method + config backups/labels. W3 CIA, SIEM funnel + TP/FP triage, initial-access methods, the IR lifecycle (NIST SP 800-61r3 → CSF 2.0), containment vs evidence (order of volatility, EDR isolation, hashes, custody), CVSS vs KEV, identity (JIT, access reviews, number matching, FIDO2, revoke sessions), incident comms.

### 14.3 Week 2 · Network Week (net.js)
Day 4 (10): Rosa's welcome email · badge for F5 + closets (Lou) · kit from Rosa (blue console cable keepsake; read-only vs change account) · training · **tone out 4 Floor 3 wall jacks** (one is mislabeled: trust the tone, fix the label + port map) · **IP plan** in IPAM (/25 for 90 phones, pool .10–.126) · **back up the running configs** (F3 closet) · CAB with Harold (window, backout = old switches racked, risk incl. 911 + payroll printer) · 🚨 outage notice · **staging** (firmware standard, PoE budget 460/740 W).
Day 5 (5): huddle with Rosa · labeled cables from Sam · **core uplink came up as an access port** → make it an 802.1Q trunk · join Hiro's bridge (no-go criterion) · the window. Hotspots on F3: **switching loop** (Byte Bodega switch under a desk), **dark AP** (port set to 802.3af, needs at), **printers can't reach the print server** (VLAN 40 missing from the uplink trunk template).
Day 6 (10): post-change checks (Reception phone incl. E911 location / Accounting wired bottom-up / conf-room Wi-Fi survey) · route known issues (Network, Voice/UC, Desktop, Facilities, Security) · sign-offs (Karen phones, Ed wired, Riley Wi-Fi) · **decommission** old switches (wipe configs, remove from monitoring/IPAM/DNS, custody to Mo's cage) · diagram + IPAM · Gloria · return the change account (JIT) · PIR · Chen's email · The Stack.
Tickets (F5 "NOC queue" board, mostly people on F3): `dhcp-exhaust` (Kai, d4), `duplex` (Abby, d4), `voice-vlan` (Benny, d5), `poe-budget` (Wade, d5), `gateway` (Lisa, d6), `wifi-channel` (Harold, d6).

### 14.4 Week 3 · SOC Week (soc.js)
Day 7 (8): Omar's welcome · badge (report a lost badge immediately) · kit (FIDO2 key keepsake; vault checkout for privileged creds) · training · **triage 3 SIEM alerts** (benign-with-context, true positive to contain, user error to confirm) · **prioritize a scan** (KEV + internet-facing first) · **quarterly access review** (removes the leftover `adm-temp-cutover` from Week 1, Kai's Domain Admin, a departed user, an orphaned service account) · **ransomware tabletop** (click the IR phases in order + who owns outside comms). Luis's walk-up ("I approved one to make them stop") is forced into day 7's roll: it's the seed of day 8.
Day 8 (5): 🚨 triage the HIGH alert (MFA fatigue → account takeover) · scope (IOCs into the case) · **contain Luis's laptop** on F3 with EDR (not unplugged) · join Omar's bridge · the incident window. Hotspots: **second infected host** (Brenda's PC, beaconing), **internal phish from the compromised mailbox** (search & purge), **password spraying** (Tomas). Social engineers: "Luis" calling to reset his MFA; a fake "Legal" asking for the forensic image on a thumb drive.
Day 9 (10): eradicate (tick composer) · **restore from the pre-compromise snapshot** (F3 backup console: newest ≠ cleanest) · seal evidence (hashes + custody; IR challenge coin) · route follow-ups (Identity, Email/M365, Desktop, Network, Legal, Awareness) · brief Director Chen · incident report · Gloria · blameless lessons learned (5 actions, 5 owners) · Chen's "Three weeks" email · The Stack (everyone) → credits → career score.
Tickets: the 7 existing F7 tickets, now day-gated (d7 `phish-ir`, `tls-chain`, `rogue-ap`; d8 `lateral`, `ransomware`; d9 `privesc`, `segmentation`).

### 14.5 Engine changes
- `days.js`: `tasksFor()` falls through to `W2_TASKS`/`W3_TASKS`; `ticketOpen` handles F5/F7 by day; `rollDay` works on any day (`always:` walk-ups; go-find page on clock days; `spawn.map`); walk-ups/pages run on every office floor (W1 stays on F3/lobby) and stop once the party opens; dispatch order: visitors → clock (incl. hotspots) → `netNpc/socNpc` → base flows. NEXT UP also routes to a walk-up stranded on another floor.
- `clock.js`: day 2 unchanged; days 5/8 use `CLOCK_DAYS` (lead, open/last/final/close lines), `BRIDGE_BY_DAY`, `HOTSPOTS` (`at: {map, id}` = the entity that becomes the fix point, existing or a flag-gated `hotprop`), week-filtered `KNOWN_ISSUES`/`SOCENG`. A closed window sets `winClosed_<day>`. Safety valve: a walk-up stranded on another floor can't hold the window open past +150 s. Clock progress saves every 5 s (reload loses ≤ 5 s; bot-tested on days 2, 5, 8).
- `flows.js`: helpers exported (`mustGetRight`, `tickComposer`, `email`); `knownBoard(p)` serves all three boards (`kiboard`, `kiboard-5`, `kiboard-7`) with `RESOLVER_BY_WEEK`; evening ritual + Marching Orders use the week's boss; `partyFinale(w)`; `rolloverWeek(w)` resets the per-week fields (st, known, act, clock, hot, carry, lifelines) and snapshots `weekStart` (rep, badges, finds), clears party flags; gossip for all nine days.
- `score.js`: `finalScore(1)` (W1 rows + training quiz), `weekScore(w)` for 2–3, `archiveWeek`, `showWeekReport` (rows, grade, PROMOTED card with the ladder), `careerScore` (3 week totals + 500 for climbing it all) feeding the existing initials/top-10 board. The board now stores career scores.
- `ledger.js`: `openAudit(onDone, {days, flag, label})` (weeks 2–3 skip receipts and count only that week's work).
- `world.js`: Floor 5 map (`buildFloor5`), rooms (Elevator lobby, NOC, IPAM & planning, MDF, Network team, Network Lead, Telecom room, Training room, Staging lab), cast (rosa, hiro, abby, wade, sam), props (`netpc`, `ipam`, `core-console`, `projector`, `stage-bench`, `kiboard-5`, `elevator-5`, NOC board), decor. F3 gains wall jacks, `idf-3`, 3 hotprops, 3 verify points; F7 gains `socpc`, `soc-siem`, `vuln`, `ir-screen`, `ev-locker`, `kiboard-7`. Week-2 and week-3 party crowds in The Stack (`party2`, `party3`; the door now hides on `barOpen`).
- `render.js`: new prop kinds (ipam/siem/console/projector/bench/jack/verify/locker/hotprop) + a red pulse on any live hotspot target. HUD: "Wk 2 · Day 5 · Switch Cutover" + a role pill.
- Saves: same `SAVE_VERSION` (new dd fields default in). A v2 save that had finished Cutover Week ("Wrapped" = day 4) is migrated: Week 1 is archived and it picks up at Network Week, day 4.

### 14.6 Validation
- `node tools/validate.mjs` → **1543/1543**: map reachability for 5 maps, every route id in days/net/soc exists, every hotspot target exists, one best answer everywhere (tickets, walk-ups, pages, hotspots, social engineers, inline task judgments in all modules, all 24 training-quiz questions), pools sized for all nine days, known issues route to real per-week groups.
- `node tools/bot.mjs thorough|tasks [--shots]` (now all nine days; `RELOAD=1` reloads mid-window on days 2, 5 and 8). Latest: **thorough** W1 S 9485 · W2 S 7520 · W3 S 6995 · career **S 24,500**; **tasks** W1 C 5440 · W2 C 4920 · W3 C 4150 · career **C 15,010**. Zero page errors, reloads keep the clock.
- Visual checks: training deck + quiz + ticket chip at 1280 and 390 px; Floor 5; week report.

### 14.7 Grades (score.js)
W1 unchanged (S 9300 / A 7800 / B 6300 / C 4600). W2: S 7000 / A 6000 / B 5000 / C 3800. W3: S 6200 / A 5300 / B 4500 / C 3400. Career = sum of the three (S 22,500).

### 14.8 Fact sources (checked Oct 1, 2026)
CompTIA A+ 220-1201/1202 troubleshooting methodology (6 steps); Network+ N10-009 (7 steps incl. "establish a plan of action and identify potential effects"); IEEE 802.3af/at/bt PoE (15.4/30/60–90 W at the PSE; 12.95/25.5 W at the PD for af/at); 2.4 GHz non-overlapping channels 1/6/11 (US); APIPA 169.254.0.0/16; NIST SP 800-61 Rev. 3 (April 2025, maps incident response onto CSF 2.0 functions); NIST SP 800-88 (media sanitization); CISA KEV catalog; MFA number matching (CISA guidance on push-fatigue); E911 dispatchable location (Kari's Law / RAY BAUM'S Act); never place test calls to 911 without coordinating with the PSAP.

### 14.9 Known gaps / next ideas
- The best answer is still often the longest option (true across the game). A pass that evens option lengths would make it harder.
- Weeks 2–3 have no purchases (no company card); Gloria's review skips receipts. A W2 "Byte Bodega: keystone jacks + label tape" run would bring receipts back.
- More F5 side quests (none yet) and more week-specific keepsakes.
- Practice exam: F5 now has 10 questions; F7 pool is unchanged.
