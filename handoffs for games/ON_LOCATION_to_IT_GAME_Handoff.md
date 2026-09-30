# HANDOFF → IT GAME (`it-game-v2` / "The Ticket Queue")
## Porting the ON LOCATION · NYC "way of things" into the IT / Help Desk / Cybersecurity RPG

**From:** Claude in the "Locations RPG" project (ON LOCATION · NYC, now at v7.3).
**To:** Claude in the IT game project.
**Written:** Sept 30, 2026.
**Audience:** You, the next Claude. Moon said this doesn't need to be human-readable, so it's dense on purpose. Read all of it before you plan anything.

---

## 0. READ FIRST

### 0.1 What happened
Moon has a series of single-file-capable, Canvas + vanilla-JS educational RPGs:
- The **IT game** (`it-game-v2`, "The Ticket Queue") is the **canonical engine**. In June 2026, ON LOCATION · NYC was **forked from it-game-v2**.
- ON LOCATION then evolved much further (v1 → v7.3, June → Sept 2026) into a **job simulator with a real three-day structure**:
  - randomized daily content
  - a real-time event clock
  - radio/text comms
  - money with receipts
  - consequences that carry across days
  - an arcade final score with a high-score board
- Moon now wants that **"way of things"** carried back into the IT game. The subject becomes **IT support / help desk / sysadmin / cybersecurity**.

### 0.2 What you can and can't see
- You **cannot see** the Locations RPG project. Everything you need from it is in this doc: design rules, system specs, data shapes, and real code excerpts (Appendix A).
- The live ON LOCATION build is at https://lunaboog.github.io/on-location-nyc/ (repo `LunaBoog/on-location-nyc`). Moon can play it to show you what "the feel" means.
- **The IT game on Moon's Mac:** `/Users/moon/Desktop/me/stuff/RPG_games/it-game-v2`, GitHub `LunaBoog/it-game` (private), deployed through Netlify. It was last committed Aug 10, 2026 ("update game Mortal Kombat start screen2").
- **Handoffs inside that folder** (read them if Moon gives you access):
  - `README.md`
  - `WAVE1_HANDOFF_Identity_Theme_Persistence.md`
  - `SDV_GLOWUP_HANDOFF_Floors_and_Exam.md`
  - `handoffs for games/SDV_GLOWUP_HANDOFF Next big change.md`
  - `handoffs for games/GAME_SYSTEMS_HANDOFF.md` (the Harlem Health → IT "Stardew systems" port)
  - `handoffs for games/HANDOFF.md`
- I read them. Section 5 summarizes the IT game's current state as I found it.

### 0.3 The one-paragraph ask
Turn the IT game from "walk the office, solve a ticket queue, end of day, repeat" into **a few real, consecutive workdays of an IT job**:
- a clear chain of command
- a daily task list with a NEXT UP guide
- walk-up users who just want to be heard
- pings and pages that interrupt you
- a timed high-pressure day
- documentation discipline as the "receipt" mechanic
- consequences from day 2 that you fix on day 3
- nightly handoff emails
- an arcade final score with initials and a high-score list

**Keep what makes the IT game good:**
- investigate → commit → principle tickets
- CompTIA objective tagging
- the practice exam
- the two floors
- XP/ranks, the character creator and the coin shop

**Research the real-world practice first, then build the content against it** (Section 7).

---

## 1. HOW MOON WORKS (collaboration contract, learned across ~10 ON LOCATION sessions)

- **Brief → build generously → playtest → iterate.** Moon writes detailed, specific briefs, then playtests and sends notes: renames, "move X to the bottom", "this should be a loud task". He expects you to **build to the brief without asking a lot of questions**. Pick sensible defaults, say what you picked, and he tunes later. Example from v7.1: "Filming clock + trigger timing = Claude's pick; Moon tunes later."
- **Real-world accuracy is first-class.** Research facts first, build content against verified facts, and **never retrofit facts after building**. Keep a fact-check list with three buckets:
  - ✅ verified, with a source
  - ⚠️ general practice or Moon's practice (confirm)
  - ❓ Moon to decide
- **Skeleton first, then deepen.** Get all days/phases present and playable thin, then add depth. Don't build vertical slices.
- **Every session ends with a verbose handoff `.md`:**
  - a decisions/requests log table, one row per version
  - what's new
  - day-by-day content
  - registries
  - persisted-state keys
  - code map
  - validation results
  - fact-check list
  - next ideas
  - publish commands

  The "series-standard handoff" is expected, not optional.
- **Moon pushes; Claude can't.** Your sandbox has no GitHub credentials. Give him exact `git add/commit/push` lines.
- **Losing old saves is fine** when the state shape changes. Bump the storage prefix per major version so old saves never break a new build.
- **Moon renames things during playtest.** Keep internal ids stable and do display-name renames as a final pass, or through a name table, so a rename never breaks logic. ON LOCATION kept old NPC ids (`sal`, `gaby`, `caitlin`) while their display names changed twice.
- **Tone:** warm, funny, specific, like real crew. Teaching happens **through consequence and the tempting wrong answer, never a lecture**, which is also the IT game's own stated rule.
- **Moon's real life:** he works in the NYC film Locations Department and runs a home pentest lab (OSCP/PNPT-style skill building). He knows the IT/security material well, so don't dumb it down. Floor 7 content can be genuinely technical.

---

## 2. THE "WAY OF THINGS": design rules distilled from ON LOCATION

These are the transferable principles. Section 3 is the concrete systems.

1. **You are low on the ladder, inside a real chain of command.** The player isn't the hero-expert. They're the assistant with a boss, a boss's boss, peers, and people below them. Tasks come *from* someone, and gear is *issued* by someone.
   - ON LOCATION: Location Manager (Bryan) → ALM (Kaitlin, your boss, the kit-giver) → **you, the Locations Assistant** → Coordinator (AMBR, office side) → Unit PA (Priya).
2. **The job is days, not levels.** The day structure is a real arc: **Prep → Shoot → Wrap**. Each day has its own list. Days change *only* by going home and sleeping. The evening ritual matters:
   - write your EOD email
   - read tomorrow's "Marching Orders"
   - set an alarm, sleep, wake up
3. **A NEXT UP card always knows what you should do.** Every task has a `done()` predicate and a `route()` that points at a map + NPC/prop. You can never be lost. Interrupts override it: a missing TCD agent, an inspector, a "go find" request.
4. **Every day is different.** Big content pools get **rolled once per day and persisted**, so a reload doesn't reroll but a replay does. No two playthroughs match.
5. **Interruptions are the job.** On the big day, a real-time clock (`FILM_LEN = 300 s` of *active* play, paused during modals and drives) fires scheduled and random events inside time windows, with a global cooldown so they don't stack.
6. **People mostly want to be heard.** Walk-up NPCs rant for a few lines. You can keep listening, or "cut in" (−rep). Then they ask the real question, and you get 3 answers scored best/okay/worse (+2/+1/−1 rep).
7. **The small, easy-to-skip diligence action is the lesson.** Every purchase has a **big yellow "Leave" button** and a **small gray "Could I grab the receipt, please?"** link. Space/Enter leaves *without* the receipt, on purpose. At wrap, Accounting asks "How many receipts did you forget?"
   - Telling the truth earns +rep and a badge.
   - Claiming one you don't have costs rep.
   - Missing ones mean signing an affidavit per receipt.

   **This is the single most important mechanic to port.** In IT it becomes documentation and ticket hygiene (Section 4.5).
8. **Consequences carry across days.** Shoot-day damage calls ("set dec put 3 holes in the wall, log them") become wrap-day walkthrough items. Trash missed today shows up in tonight's email and costs rep. Every purchase gets reconciled at wrap.
9. **First time you touch a system, explain it with a picture.** The "Trash Plan" pop-up fires the *first time you pick up a bag*:
   - the boss's rule in their voice
   - a little pixel diagram of the pickup square
   - a numbered plan
   - the goal and the reward
   - a red banner if you're missing a prerequisite ("no blue tape yet")
10. **Everything is logged for you.** Day Notes auto-log what happened, and the EOD email is built from them. Writing the EOD is itself a mini-quiz: tick the real details and skip the distractors.
11. **One score, arcade style.** At the end:
    - a full-screen FINAL SCORE with line items sliding in
    - a letter grade
    - 3-letter initials
    - a top-10 board on the start screen

    The board lives in a **separate storage key**, so Reset never wipes it.
12. **Lingo is learned by hearing it.** When someone says "go to 2" or "martini shot", a lingo card unlocks. That's vocabulary acquisition through context.
13. **Keepsakes and badges, not stat boosts.** Finds are mementos tied to a person ("Keisha's spare slate"). Badges reward behaviors ("The Fixer: best answer to 6 neighbors").
14. **A lifeline that costs points.** "Call AMBR" is 3 per show, −50 each on the final score. It's help without shame, but it isn't free.
15. **Accuracy is part of the fun.** Content cites real rules, like MOME Code of Conduct sections and NYC idling law. The fact-check list ships inside the handoff.

---

## 3. ON LOCATION v7.3: SYSTEM SPECS (what exists and how it's built)

Engine: one HTML file with Canvas 2D, vanilla JS and WebAudio blips. No dependencies. Runs from `file://` or GitHub Pages. Saves go to localStorage under a version prefix (`onloc7:`), with an in-memory fallback if storage throws.

### 3.1 World
- `MAPS` registry: 13 maps, each with `tiles`, `doors[]`, `npcs[]` and `props[]`.
- Door warps fade between maps and show a location banner.
- **Drivable destinations:** a rental car and the train. You pick a destination from a menu, a drive overlay plays, and the drive pauses the clock.
- **Maps:** home apartment + block, production office + block (Deb, Kaitlin, AMBR, Bryan), rental car counter, Halloran's block + brownstone, base camp, St. Agnes Hall (Holding), City office (permits and DEP), and the wrap party.

### 3.2 Day structure
Phases: `PREP → SHOOT → WRAP → DONE`.

```js
DAY_TASKS = { PREP:[{id,label,done:()=>bool,route:()=>R(map,npcId,"NEXT UP text")}, ...], SHOOT:[...], WRAP:[...] }
```

- The HUD pill shows **"Today n/N"**.
- `currentTask()` = first `!done()`. Its `route()` feeds the NEXT UP card and the map marker.
- Evening (after PREP and SHOOT):
  1. Home → laptop → **EOD email composer**. You pick the real Day-Notes items and skip the distractors.
  2. **Marching Orders** email from the boss:
     - today by the numbers: tasks, trash hauled/missed by location, rep delta, neighbors heard, spending
     - tomorrow's list + call time
  3. **Set alarm** → bed → sleep overlay → alarm tones → `advanceDay()` → **morning card** with today's numbered list.
- `advanceDay()` resets transient visitors, violations and timers, sets the new phase, and teleports you home.
- **Counts:** PREP 10 tasks, SHOOT 5 (the last is "work the block until the martini shot" = the clock), WRAP 11.

### 3.3 Randomized pools
`roll()` runs once per phase, is cached in `S.v8.roll[phase]` and saved.

| Pool | Size | Per day (Prep/Shoot/Wrap) |
|---|---|---|
| `ISSUES` (neighbor complaints) | 26 | 2 / 5 / 2 |
| `CH2` (radio/text judgment calls, incl. "go find" calls) | 14 | 1 / 3 / 1 (shoot always includes one "go find") |
| `DAMAGE` (wrap walkthrough items) | 6 brownstone + logged holes · 4 hall · 3 driveway variants | 2 + holes · 2 · 1 |
| `PERSONAS` (who delivers an issue) | 12 | shuffled daily; some issues pinned to a persona |

`ISSUES` entry shape, with scores 2 = best, 1 = okay, 0 = makes it worse:

```js
{id:"s_driveway",ph:"SHOOT",lines:["Your truck is blocking my driveway.","I have to be at work in twenty minutes. TWENTY."],
 ask:"Are you going to move it or not?",
 opts:[["Radio Transpo to move it right now and walk them to their car. Driveways stay open.",2,"Two minutes later the truck's gone…"],
       ["It's only for another hour.",0,"They're late for work and now they're filing a complaint."],
       ["Can you take a cab? We'll pay.",1,"Nice gesture, but the actual fix is moving the truck."]]}
```

`CH2` entry shape (a radio call from a crew member), plus `go:true` + `spawn:{map,x,y,where}` for the "go find the neighbor" variant:

```js
{id:"c_tree",ph:"SHOOT",who:"mike",ask:"Grip wants to tie a flag off to the street tree out front.",
 opts:[["No tying off to street trees; they belong to the city. Use a stand and sandbags.",2,"'Copy, stand and bags.'"],
       ["Sure, a light tie is fine.",0,"Street trees are the city's…"],["Only if it's a small flag.",1,"Size isn't the issue. Use a stand."]]}
```

### 3.4 The real-time clock (shoot day)
- `FILM_LEN = 300` s of active play. `rollSched()` rolls event times once per shoot day. There's an 8 s global cooldown between events.
- Event windows, in seconds into filming:

| Event | Window |
|---|---|
| AD call sequence (Ch. 1) | every 38–58 |
| Ch. 2 calls | 25–45, 110–150, 200–240 |
| Damage calls (locked until you log them) | 50–80, 170–210 |
| City Hall inspector | 60–130 |
| TCD agent wanders off | 90–150, second one 50% of the time at 205–245 |
| Paparazzo | 40–100, second one 60% of the time |
| Neighbors spawn | every 45–70 on set maps |
| "Abby" / "Martini" (last shots) | 240 / 275 |
| Wrap | ≥ 300 and everything resolved |

- `v8Update(dt)` is the per-frame driver. It advances the clock only when no modal is open and you're not driving or sleeping.

### 3.5 Comms
- **Channel 1 (ambient):** AD call sequences scroll as walkie lines ("Picture's up!" → "Last looks" → "Rolling" → "Action" → "Cut"). Each line unlocks a lingo card.
- **"Locations, go to 2":** a modal with a switch-channel button, then a judgment question with 3 answers, or a "go find X" that spawns an NPC with a `!` and a route.
  - On set during the shoot, it comes as a **walkie** call.
  - Anywhere else, it arrives as a **text** with an SMS tone.
- **Group chat** (📱 Phone, P key): a log of posts (`chatPost(who,text)`) with toasts. Includes a task: collect two contact cards from real NPCs, attach them in the phone UI and send them. A distractor attachment (a selfie) is offered.

### 3.6 Money
- 💵 own cash ($120) + 💳 company card ($1,000 limit, issued with the kit, returned at wrap).
- `purchase(item, vendor, pal, exitLabel)` pushes `{item,amt,vendor,ph,rcpt:false,recon:false,personal}` to `S.v8.purchases`. The modal has a big exit button and a small gray receipt link. See 2.7 for the rules.
- **Accounting (Deb):** check off receipts any day. The wrap-day final reconciliation asks for an honest count of missing receipts, then you sign an affidavit per missing one.
- A personal charge on the company card (a lotto scratcher) must be repaid from cash. That's a lesson about not mixing personal and company spend.

### 3.7 Visitors / transient NPCs
- `visAdd / vPath / vMove / drawNpc`: NPCs spawn at a map edge, path to you or to a spot, and leave afterwards.
- Used for neighbors, the inspector, the paparazzo, the TCD agent who wanders to one of 7 hideouts, and "go find" targets.

### 3.8 Other systems
- **Day Notes (N key):** auto-log with categories (hole, neighbor, ch2, inspector, pickup, receipt…) + a receipt envelope view.
- **TrashMan:**
  - 10 loose bags per day; blue tape is a prerequisite.
  - 3 pickup squares; carry bags and drop them at a pickup square.
  - A truck hauls them away.
  - Missed bags show up in the nightly email and cost rep.
  - Clean sweep = cash bonus.
- **City Hall inspector:** walks in, cites violations (truck on hydrant, idling past the legal limit), you fix each one, then get the sign-off.
- **Paparazzo (Steve Sans):** comic antagonist on a bike with a line pool. You handle him correctly (you can't touch him; public property), then he rides off.
- **Releases:** 3 property owners each sign a release after their damage is fixed. Each release is a find.
- **Finds** (26), **badges** (29), **lingo** (25), **field calls** (18 one-question judgment calls on props/NPCs), **jobs** (8 full investigate→diagnose scenarios, the IT game's SCENARIO shape).
- **Character select** (6 playable, Mortal Kombat-style grid), portraits in every dialog, a **start screen** (logo, bobbing crew, START, HIGH SCORES), tap-to-walk on phones, and time-of-day tint (streetlights glow at night).

### 3.9 Final score (`finalScore()`)

| Line | Points |
|---|---|
| Day tasks completed | +100 each |
| Tasks undone | −75 each |
| Field calls answered | +50 |
| Neighbors: best answer | +75 |
| Neighbors: heard out, not best | +25 |
| Ch. 2 calls answered | +40 |
| Damage logged | +50 |
| Inspector signed off | +200 |
| Wandering agent returned | +100 |
| Releases | +150 each |
| Receipts remembered | +40 |
| Receipts forgotten | −60 |
| Trash hauled | +15 |
| Trash missed | −25 |
| Finds | +25 |
| Badges | +40 |
| Reputation | ×10 |
| First-try accuracy | ×500 |
| Wrong answers | −20 |
| Lifelines | −50 |

- Floor at 0.
- **Grades:** S ≥ 9,500 · A ≥ 8,000 · B ≥ 6,500 · C ≥ 5,000 · D below.
- **Calibration:** a bot that does every task but ignores side content scores ~5,200 (C). A thorough player scores ~8,500–9,500.
- **Board:** `localStorage["onloc_hiscores"] = [{i,s,g,ch,t,d}]` (initials, score, grade, character, timestamp, date). Top 50 kept, 10 shown.
- **The board is per-browser.** A shared crew board needs a backend. Swap `loadHS/saveHS` for Supabase, Firebase, a Google Sheet + Apps Script, or (**for the IT game, which is on Netlify**) a Netlify Function + Netlify Blobs.
- **Initials entry:** type letters or ↑↓ to change, ←→ to move, Enter to save; tap ▲▼ on phones. After the first submit, the arcade shows the board instead.

### 3.10 Architecture pattern
- ON LOCATION is **one HTML file**, and the HTML is the source of truth. Sections are marked with `/* ==== name.js ==== */` banners.
- Each version adds a *layer* that hooks the engine by **reassigning function declarations**:

  ```js
  {const _ct = checkTrash; checkTrash = function(){ _ct(); /* add stuff */ };}
  ```

  About 40 functions are hooked this way: `interact`, `objective`, `updateHUD`, `openShop`, `buy`, `advanceDay`, `openScorecard`, `showTitle`, and more.
- **The IT game is different: it's Vite ES modules + a generated `standalone.html`.** See Section 6 for how to adapt.

---

## 4. THE IT TRANSLATION

### 4.1 Pick the premise (default + alternatives)
**Default (recommended): "Cutover Week" at a mid-size company.** You're the **new Tier 1 Help Desk Technician**, and your first three days coincide with a big IT change.

Why this works: **ITIL-style change management maps 1:1 onto Prep / Shoot / Wrap.**

| ON LOCATION | IT (default) | What the day is |
|---|---|---|
| **PREP day** | **Day 1 · Onboarding & Change Prep** | Get issued your kit, learn the queue, prep the change: backups verified, CAB approval, 48 h user notice, stage hardware, walk the floor |
| **SHOOT day** | **Day 2 · Go-Live / Cutover** (the clock day) | The change goes live. The maintenance or hypercare window is the real-time clock. Pages, walk-ups, an auditor, a vendor you must escort, a social engineer |
| **WRAP day** | **Day 3 · Hypercare & Close-Out** | Fix what got logged, get business sign-offs, return temporary privileged access and loaner gear, chain-of-custody e-waste, documentation audit, post-implementation review (PIR) email, then the team happy hour, credits and the arcade score |

What the change is (Moon picks; default first):
1. **Windows 11 refresh / laptop swap for Accounting + Reception.** Very help-desk, physical, and lets you reuse the existing office maps.
2. **Email migration** to a new tenant, with SPF/DKIM/DMARC work. It dovetails with the existing `change` ticket ("Email broke overnight").
3. **Office network cutover** to a new firewall/switches with VLAN segmentation. It dovetails with the Floor 7 `segmentation` ticket.

**Alternative premise:** an **MSP field tech** (managed service provider) who drives to 3 client sites (dentist office, law firm, restaurant). This is the closest analog to ON LOCATION's drivable destinations and the company car, and it's very true to entry-level IT life. It works if Moon wants the travel feel. Offer it; default to Cutover Week.

**Floors:** keep Floor 3 (Help Desk) as the Day 1–3 home base. Floor 7 (SOC / Red-Team) gets pulled in on Day 2 when a security event interrupts. It could also be a second "show" later (a "SOC Week" with Detect → Contain → Recover days), the way ON LOCATION's LM email teases the next gig (*Jurassic Parking*).

### 4.2 Cast & chain of command (names are placeholders; Moon will rename)

| ON LOCATION role | IT role | Function in game |
|---|---|---|
| Bryan (LM, big boss, end-of-show email) | **IT Director** (existing **Mgr Chen** can be promoted into this) | Rules of the house (like Bryan's clean-block rule), end-of-show thank-you email + next-gig tease |
| Kaitlin (ALM, your direct boss, kit-giver, nightly Marching Orders) | **Help Desk Lead / Sysadmin (Tier 2)** | Issues your kit Day 1, writes the nightly shift-handoff "Marching Orders", takes the kit back Day 3 |
| AMBR (Coordinator, office, lifeline) | **Service Desk Coordinator** / change coordinator | Takes sign-offs Day 3. The **"Ask the Coordinator" lifeline** (3 per week, −50) |
| Deb (Accounting, reconciles receipts) | **Service Desk Manager doing the QA/ticket audit** (or an **internal auditor**) | Reconciles your documentation (the receipt analog, 4.5) |
| Priya (Unit PA, gets supplies) | **IT Intern** | Receives the staged hardware you prep; you're not the lowest rung |
| Trevor (rental counter) | **Asset desk / IT storeroom** (or the MSP's company van in the MSP premise) | Checks out loaner gear and the cart; won't take returns until the office tasks are done |
| Dmitri (hardware store, supply run) | **Electronics store / supplier** on the company card | Supply-run list: cables, adapters, labels, label-maker tape, anti-static bags, zip ties |
| Keisha (2nd AD, "cameras up") | **Change Manager** running the cutover bridge | Day 2 "check in with the change manager" job; runs the bridge-call sequence |
| Neighbors | **End users (walk-ups)** | Rants + 3-answer questions (4.4) |
| City Hall inspector | **Auditor / compliance spot check** (SOC 2 / PCI-style clean-desk walk) | Cites violations; you fix them and get the sign-off |
| TCD agent who wanders off | **The vendor tech you're escorting** in the server room/data center | Wanders to a hideout; walk them back (escort policy) |
| Steve Sans (paparazzo) | **Social engineer**: tailgater "from the ISP", a vishing caller "from Microsoft support", or a fake IT guy | Comic antagonist with a line pool; the correct handling is the lesson |
| NYPD Movie/TV Unit contacts | **Vendor/escalation contacts**: ISP NOC, OEM warranty desk, the security team's on-call | Collect contact cards → attach to the team chat (distractor: a meme) |
| Property owners' releases | **Business-owner sign-offs** (Accounting lead, Reception lead, Office manager) = UAT/acceptance | 3 sign-offs = 3 finds |
| Set-dec holes logged | **Known-issues log entries** during the cutover | Become Day 3 fix-it items |
| Department that fixes damage (Scenic, Grip, Electric, Transpo) | **Resolver groups** (Desktop, Network, Apps/M365, Security, Facilities) | Day 3: route each issue to the right team = a judgment call |

The existing IT NPCs (Karen, Marcus, Priya, Dana, Jordan, Riley, Ed, Lisa, Mittens the cat, the Floor 7 cast Sofia, Wes, Nadia, Tomas, Grace, Omar, Bex) all stay. Walk-up users can be drawn from them plus a `PERSONAS` pool.

### 4.3 Day task lists (default premise: laptop refresh), same shape as `DAY_TASKS`

**DAY 1 · Onboarding & Change Prep (~10 tasks)**
1. Read the Lead's welcome email & grab your bag (home → commute; the train/bus can be cut if Moon wants the office only).
2. Get your badge photographed at Security / Reception.
3. **Kit from the Lead:**
   - badge
   - laptop
   - **MFA token/app enrollment**
   - **a separate admin account** (the least-privilege lesson: daily account vs privileged account)
   - company card
   - the team chat
4. Shadow the Lead on the ticket queue (reuse an existing Floor 3 ticket as the "job").
5. **Supply run** on the company card: labels, USB-C adapters, cables, anti-static bags, zip ties. It includes the **receipt ask** (see 4.5 for why IT still has literal receipts).
6. **Inventory walk:** asset-tag and log every machine in Accounting and Reception (like "knock the doors").
7. **Verify backups before the change.** Prove a restore works, not just that the job says "success" (the 3-2-1 principle, a test restore).
8. **Get the change approved** at CAB. The job asks for a **rollback/backout plan**, a window, and a risk rating.
9. **🚨 Send the 48-hour user notice NOW** (the loud task right after approval, mirroring "Hang the No Parking signs NOW"). The 48 h is company policy; mark it ⚠️.
10. Stage the new laptops on the cart and image them (or check the provisioning profile).

**DAY 2 · Go-Live / Cutover (~5 tasks + the clock)**
1. Morning standup: hardware has landed. Check in with the storeroom.
2. **Set up the swap station** (like Holding): imaging bench, data-transfer station, a user waiting area with coffee.
3. **Get phone/escalation contacts into the team chat** (like the MTV task).
4. **Check in with the Change Manager** (a job with the principle "during a change, Help Desk owns the users; the engineers own the change").
5. **Work the floor until the change window closes** = the clock, `WINDOW_LEN ≈ 300 s`.

**DAY 3 · Hypercare & Close-Out (~10 tasks)**
1. Pull the "maintenance in progress" signs/notices (and remove the banner from the intranet).
2. Work the known-issues log (Day 2 logged items + rolled items), routing each to the **right resolver group**.
3. Get the 3 business sign-offs.
4. **Old laptops → chain-of-custody e-waste:** wipe per policy, log serials, lock them in the secure bin, get the certificate of destruction from the recycler. This is the TrashMan analog (4.6).
5. Return temporary elevated access (**JIT/privileged access removal**) + the company card + the loaner cart to the Lead.
6. Documentation audit with the Service Desk Manager (the receipt-reconciliation analog).
7. Update the knowledge base article (a fill-in-the-blanks from Day Notes: real details vs distractors).
8. Post-implementation review (PIR) email.
9. Go home.
10. Director's email: thanks + next-gig tease ("SOC Week" on Floor 7?) → **team happy hour** (party map) → credits → arcade score → initials → board.

**Evenings (after Day 1 and Day 2):** laptop → **EOD shift-handoff email** (tick real Day Notes, skip distractors) → Lead's **"Marching Orders"** (by the numbers: tickets closed, documented/undocumented, users helped, rep, spend, tomorrow's list + start time) → set alarm → sleep → morning card.

### 4.4 Walk-up users (the `ISSUES` pool, the neighbor analog)
Same flow as ON LOCATION:
1. 2–3 rant lines, with "Mm-hm / keep listening". There's an optional **"Cut in: 'I've got a ticket queue—'"** for −1 rep.
2. Their question.
3. 3 answers scored 2/1/0.

Aim for **~26–30 entries** split across the 3 days (6 / 14 / 6). **Every "best" answer must be defensible under real help-desk practice.** Examples in the exact data shape (mark any org-policy claims ⚠️ in the fact list):

```js
{id:"d1_reset",ph:"D1",lines:["I'm locked out. My password expired over the weekend.","I present to the board in TEN minutes."],ask:"Can you just reset it? Please?",
 opts:[["Verify who they are using the documented process (badge/ID, or a callback to the number on file), then unlock and have them set a new password themselves.",2,"Verified, unlocked, new password set by them. They make the meeting. That verification step is what stops a social engineer from getting the same reset."],
       ["Reset it to Welcome123 and shout it across the room.",0,"Everyone in Accounting now knows their password. And you never verified it was them."],
       ["Tell them to submit a ticket and wait in the queue.",1,"Procedurally fine, but a verified walk-up reset is exactly what you're here for."]]},
{id:"d2_admin",ph:"D2",lines:["The new laptop won't let me install my PDF thing.","The old one let me install anything!"],ask:"Can you just make me an admin?",
 opts:[["No local admin, but you'll push the approved PDF tool from the software catalog (or submit the request for it) right now.",2,"Installed in five minutes, no admin rights handed out. Least privilege without being the 'no' department."],
       ["Sure, just this once.",0,"Local admin for everyone is how one phishing click becomes a company-wide problem."],
       ["It's policy, sorry.",1,"True, but offer the path that actually gets them their tool."]]},
{id:"d2_clicked",ph:"D2",lines:["So… I might have clicked a link.","It said my mailbox was full and I typed my password in and then it went blank."],ask:"Am I in trouble?",
 opts:[["Thank them for reporting it fast. Report it to Security per the incident process right away (password reset, revoke sessions, check the mailbox rules). No blame.",2,"Security's on it in minutes. Fast, blame-free reporting is the whole ballgame; people who get yelled at stop reporting."],
       ["Why would you do that?!",0,"Now they'll never report the next one."],
       ["Just change your password and don't worry about it.",1,"Better than nothing, but Security needs to know. Sessions and forwarding rules outlive a password change."]]},
{id:"d1_wifi",ph:"D1",lines:["What's the Wi-Fi password?","For my phone. And my other phone. And my kid's iPad, he's here today."],ask:"Which network?",
 opts:[["Point them to the guest network. Personal devices stay off the corporate network.",2,"Guest network it is. Segmentation starts at the front desk."],
       ["Give them the corporate Wi-Fi key.",0,"Personal devices on the corporate network is a segmentation fail."],["Say there's no Wi-Fi.",1,"There is, and they can see it."]]}
```

Other issue ideas, to be researched and written:
- "Why can IT see my screen?" (remote sessions need the user's consent + the acceptable use policy)
- "My data didn't come over from the old laptop!" (data transfer checklist; OneDrive/Known Folder Move; never promise what you didn't back up)
- "The new laptop is too slow" (first-boot updates / indexing; set expectations)
- The sticky note with a password on the monitor (don't read it aloud; help them into a password manager)
- "Can I keep the old laptop?" (asset policy + data sanitization)
- "Printer says offline" (driver/queue on the new image; reuse the Floor 3 printer knowledge)
- "My second monitor is upside down" (Ctrl+Alt+Arrow rotation hotkeys exist on some Intel graphics drivers; the reliable fix is Display settings → Orientation; ⚠️ verify)
- "IT keeps asking me to approve MFA prompts on my phone" (MFA fatigue: **never approve a prompt you didn't start**, report it)
- "Can you unlock Jeff's computer? He's out and I need a file" (no; route through the owner or manager)
- A happy user on Day 3 who wants to thank you (the `w_thanks` analog)

### 4.5 THE RECEIPT MECHANIC → DOCUMENTATION DISCIPLINE (port this carefully)
In ON LOCATION the lesson is "no receipt, no reimbursement". The mechanic is the **big easy exit button vs the small gray diligence link**. In IT the diligence is **documentation**:

- Every time you resolve a ticket, walk-up, or Ch. 2 page:
  - **Big button:** "✅ Close it" (Space/Enter defaults here on purpose).
  - **Small gray link:** "📝 Add work notes & resolution first".

  Clicking the link writes a tidy note into the ticket (show it like the receipt HTML: ticket #, user, symptom, root cause, fix, time), and sets `rec.documented = true`.
- **Nightly:** Marching Orders shows "X of Y tickets documented".
- **Day 3 audit:** the Service Desk Manager asks **"How many tickets did you close without notes?"** An honest count = +rep + *Honest Queue* badge. Then you **back-fill notes** for each undocumented one (the affidavit analog; each costs time/rep).
  - Zero undocumented = *Clean Queue* badge + keepsake.
- **Literal receipts still exist for the supply run**, on the company card, reconciled by the same manager or by Finance. A personal charge on the company card (an energy drink?) is repaid from cash.
- **Score lines:** "Tickets documented" +40 each · "Closed without notes" −60 each (mirrors receipts).

### 4.6 TrashMan → E-waste & chain of custody
- Old laptops and drives from the refresh appear around the floor (like 10 loose bags).
- **Prerequisite:** asset labels + a logbook (the "blue tape"). They come from the supply run.
- Carry devices to the **secure e-waste cage/bin** (the pickup square) and log serials. On Day 3 the recycler picks up, and you get a **certificate of destruction** find.
- **First-pickup explainer pop-up** ("The E-Waste Plan"), same layout as the Trash Plan:
  - the Director's rule in their voice ("Every drive that leaves this building leaves on paper")
  - a pixel drawing of the locked cage
  - a numbered plan
  - the goal
  - a red banner if you lack labels
- Missed devices show up in Marching Orders and cost rep.
- **Lesson:** data sanitization + chain of custody. Research NIST SP 800-88 (check the current revision) for clear/purge/destroy terminology before writing the text.

### 4.7 The clock day (Day 2) with IT events

| ON LOCATION event | IT event | Handling lesson |
|---|---|---|
| AD calls on Ch. 1 | **Bridge-call status lines** from the Change Manager: "Backups confirmed" → "Go/no-go: GO" → "Cutover started" → "Validation in progress" → "Change successful" (or "rollback" on a rare roll) | Change lifecycle vocabulary → lingo cards (CAB, backout plan, go/no-go, hypercare, P1, MTTR, RCA…) |
| "Locations, go to 2" | **"@helpdesk, can you take this?"** team-chat mention; a **pager** buzz if it's P1/P2. It's a walkie-style modal on Floor 3 during the window and a text elsewhere | Judgment questions (prioritize by impact × urgency; don't reboot a server mid-change; escalate a P1) |
| Set-dec hole calls | **"Log it" calls**: a user reports a mapped drive missing / a printer not mapped. It's locked until you add it to the known-issues log | These become Day 3 items |
| City Hall inspector | **Auditor clean-desk walk**: unlocked screens, a password sticky note, the server room door propped open, a visitor without a badge | Fix each → sign-off |
| TCD wanders off | **Escorted vendor wanders off** in the server room/closet (7 hideouts) | Visitors are escorted; walk them back |
| Steve Sans | **Social engineer**: "I'm from the ISP, just need to get to your network closet", or the vishing caller | Verify through a known channel; badge challenge; never hand over access |
| Neighbors spawn | **Walk-ups** spawn every 45–70 s at the swap station | Section 4.4 |
| "Abby / Martini is UP" | **"Last 10 users" / "Final validation"** | Window closes at ≥ 300 s once everything's resolved |

**Security interrupt (optional):** in ~50% of runs, a Floor 7 event fires, e.g. a real phish during the cutover. The elevator unlocks for the day even if Floor 3 isn't "cleared", and you run one Floor 7 ticket (`phish-ir`). Reuse the existing scenario.

### 4.8 Money
- 💵 Own cash: ~$40–60 (coffee/lunch).
- 💳 Company card: ~$500 limit (Moon tunes; ⚠️ note it as game-balance, not fact).
- Coffee gives a 60 s speed buff, like ON LOCATION.
- **The IT game's existing coins/shop are cosmetic currency.** Keep them separate (coins = XP-ish meta-currency for cosmetics; cash/card = in-fiction money), or fold the cosmetics shop into cash. Default: **keep both, separate pills**.

### 4.9 Comms, lingo, finds, badges
- **Team chat** (📱, P key): posts from the Lead, Coordinator and Director; the start time posted each night; contact cards task; a distractor attachment.
- **Lingo** (aim ~25): P1/P2, SLA, CAB, backout plan, go/no-go, hypercare, MTTR, RCA, PIR, KB, escalation, Tier 1/2/3, least privilege, MFA fatigue, chain of custody, change freeze, known error, service window, UAT, asset tag, imaging, JIT access, "have you tried turning it off and on again" (as a joke card).
- **Finds** (keepsakes): your first badge photo, the Lead's spare USB-C dongle, the certificate of destruction, 3 sign-offs, a "Clean Queue" framed printout, the next-gig email.
- **Badges:** "The Fixer" (6 best walk-up answers), "Go to Chat" (5 pages answered), "Clean Queue", "Honest Queue", "Escort Service", "Badge Challenger" (already exists as a find; reuse), "Chain of Custody", etc.

### 4.10 Final score for IT (starting weights; recalibrate with a bot run)

| Line | Pts |
|---|---|
| Day tasks completed / undone | +100 / −75 |
| Tickets solved (scenarios) | +100 each (plus the existing first-try XP) |
| Field calls / side quests answered | +50 |
| Walk-ups: best / heard out | +75 / +25 |
| Pages & chat calls answered | +40 |
| Known issues logged | +50 |
| Auditor signed off | +200 |
| Vendor escorted back | +100 |
| Business sign-offs | +150 each |
| Tickets documented / closed without notes | +40 / −60 |
| Supply receipts kept / forgotten | +40 / −60 |
| Devices into e-waste custody / missed | +15 / −25 |
| Keepsakes | +25 |
| Badges | +40 |
| Reputation | ×10 |
| First-try accuracy | ×500 |
| Wrong answers | −20 |
| Lifelines | −50 |

- Same S/A/B/C/D cutoffs **after** calibration: run a headless bot that does every task but no side content, and aim for it to land around C.
- **Practice-exam score** can add a bonus line: best score % × 300, say.
- Board key: `itgame_hiscores` (**outside** the save prefix, so Reset/New Playthrough never wipes it). Start screen shows the top 10.
- **Shared board (optional):** a Netlify Function + Netlify Blobs endpoint, since the IT game already deploys on Netlify. Needs a basic initials profanity filter.

---

## 5. WHAT'S ALREADY IN THE IT GAME (as of Aug 2026, from its handoffs + source)

**Stack:**
- Vite + vanilla ES modules.
- `tools/build-standalone.mjs` concatenates modules in `MODULE_ORDER` into `standalone.html`.
- Netlify publishes `dist/`.
- Storage prefix `it-game:` via typed helpers in `storage.js` (`loadSet/saveSet/loadNum/...`, `dumpAll/restoreAll`).

**Modules:** `main, game, world, render, ui, scenarios, sideQuests, collectables, quiz, cosmetics, progression, theme, savefile, storage, styles.css`.

**World:**
- Two floors on the same 30×22 skeleton (`MAP_W=30, MAP_H=22, TILE=32`). Both are 9 rooms. `setFloor(id)` swaps `let` live bindings.
- **Floor 3:** IT room, Reception, Open desks, Print room, Open desks 2, Manager, Server closet, Conf. room, Accounting.
- **Floor 7:** Elevator lobby, SOC bullpen, Threat intel, Network closet, Analyst pit, Wireless lab, Data center, IR war room, Red-team lab.

**Tickets** (`SCENARIOS`, `{floor, cert, title, principle, principleText, ticket, ticketMeta, actions, pois[{id,label,body,evidence,followups[]}], diagnoses[{key,label,correct,feedback}]}`):
- **F3:** `monitor`, `internet-down`, `dns`, `printer`, `slow`, `permissions`, `change`
- **F7:** `phish-ir`, `privesc`, `lateral`, `segmentation`, `tls-chain`, `ransomware`, `rogue-ap`

**Side quests:** `unplugged` (Ed), `monitorStandby` (Lisa), `usbDrop`, `printerInk`, `defaultCreds`, `exposedRdp`, `secretInRepo`, `tailgater`.

**Other systems:**
- **Props by `kind`:** `monitor, printer, pet, search, chest, usb, elevator, device`.
- **Economy:** coins + tokens.
- **Mittens** the cat (feed → ceiling-tile stash).
- **FINDS**, a Field Companion ★ gallery with live objectives, a Practice Exam (`quiz.js`, per-floor pools, best score per floor).
- **Progression:** XP ladder (IT Intern → … → CISO, 11 titles), 12 achievements with toasts, a coin cosmetics shop.
- **Character creator:** MK-style roster (the Aug commits), recolor + accessories.
- Themes (light/gray/black) + accessibility toggles, save/load to file with checksum, and a two-mode reset (New Playthrough keeps character/rank/coins/achievements; Full Reset wipes everything).
- **Day loop:** a `day` counter; clearing the floor's tickets triggers `openEndOfDay()` via the ticket monitor.

**Planned but not built (from its handoffs):**
- a token-gated break-room minigame whose scoring rule is the lesson (SYN+ACK combo, CVE+patch combo, phishing token breaks the combo)
- catch-the-fake-IT-guy
- Wave 2: spaced repetition, timed mock exam, domain-readiness dashboard, **seeded daily challenge**, report card
- Wave 3: command-line lab, capstone incidents, ticket variants, new floors

**Overlap to respect:**
- Ed/Lisa are already the "PC won't turn on" / "monitor asleep" beats.
- `tailgater` and `usbDrop` already cover social engineering. The Day 2 social engineer should **extend** them (a new variant), not duplicate them.
- The "seeded daily challenge" idea from Wave 2 fits **perfectly** with rolled pools: seed `roll()` from the date to get a "Daily Shift".

---

## 6. ARCHITECTURE PLAN FOR THE PORT

**Recommendation: keep the IT game's module architecture and add new modules.** Don't rebuild on the ON LOCATION single file. The IT game has systems ON LOCATION doesn't: themes, save-to-file, quiz, XP, cosmetics. Its data shapes are ancestors of ON LOCATION's, so ports are mechanical.

**New modules** (add each to `MODULE_ORDER` in `tools/build-standalone.mjs`, or **the standalone silently omits it and throws on boot**):
- `days.js`: `DAY_ORDER=["D1","D2","D3","DONE"]`, `DAY_TASKS`, `tasksFor`, `currentTask`, `dayTasksDone`, `advanceDay`, the evening flow (EOD composer, Marching Orders, alarm, sleep, morning card).
- `pools.js`: `ISSUES`, `PAGES` (the CH2 analog), `KNOWN_ISSUES` (the DAMAGE analog), `PERSONAS`, `DISTRACT` (EOD distractors), `rollDay()` persisted per day (optional date seed for a Daily Shift).
- `clock.js`: `WINDOW_LEN`, `rollSched()`, a per-frame `updateClock(dt)` (pauses when a modal is open), cooldown, the bridge-call sequence.
- `comms.js`: team chat log + toasts, page/mention modal (walkie on the swap floor during the window, text elsewhere), contact cards task.
- `visitors.js`: transient NPC spawn/path/leave (walk-ups, auditor, vendor, social engineer). The IT engine already has NPC movement support; patrol/path is new.
- `ledger.js`: cash/card, `purchase()` with the receipt link, `closeWithNotes()` with the documentation link, the Day 3 audit.
- `score.js`: `finalScore()`, arcade screen, initials, `loadHS/saveHS` (separate key), start-screen board.
- `notes.js`: Day Notes auto-log (`addNote(cat, icon, text)`) + N-key viewer.

**Integration points in existing modules:**
- `game.js` state: add `phase/day` (replace or extend `day`), `v8`-style JSON blob (`dayState`: `notes, purchases, tickets, roll, done, chat, sched, clockT, fired, counters`), and flags for kit/escort/etc.
- `updateProgressUI()`: the "Today n/N" pill + NEXT UP card.
- `ui.js`: modals for issues, pages, audit, EOD, marching orders, morning card, arcade.
- `render.js`: time-of-day tint by phase, visitor NPCs, the e-waste cage + device props, the `!` marker on go-find targets.
- `interact()`: new prop kinds (`ewaste`, `cage`, `swapstation`, `violation`, `laptopDesk`).
- **Existing `openEndOfDay()`** becomes the evening flow; the day counter becomes the phase.

**Engine gotchas (from its own handoffs):**
- In the concatenated standalone, all modules share one top-level scope. **Top-level names must be unique across files.** ON LOCATION names like `roll`, `S`, `V8` may clash; namespace them (`DAY.roll`, `rollDay`).
- `MAP/ROOMS/NPCS/PROPS` are `let` live bindings swapped by `setFloor()`. Always set `state.map = id` together with `setFloor(id)` (map-cache key).
- Every map needs NPC/prop arrays (even empty) or the render loop iterates `undefined`.
- Sprites load only over http; `file://` runs on procedural art. That's fine.

**Storage:**
- Bump the save shape. Either change the prefix to `it-game2:`, or add `saveVersion` and wipe on mismatch. Moon has OK'd losing old saves before (in ON LOCATION); **confirm for the IT game** because it has a save-to-file feature people may rely on.
- Keep `dumpAll/restoreAll` working with the new keys.

**Maps:** the Cutover Week premise works on the existing Floor 3 map. Add:
- a home apartment + commute (optional; ON LOCATION players liked the home/alarm ritual)
- a storeroom/asset desk
- an electronics store for the supply run
- a happy-hour bar for the finale

Use the programmatic map builder (`blank/carve/door/stamp`) so rows stay rectangular.

---

## 7. RESEARCH FIRST (the fact-check discipline)

Before writing pool content, verify and **keep a ✅/⚠️/❓ table in every handoff**:

1. **Exam objective tags.** The existing tickets carry tags like `"A+ · 5.4 Display issues"`, `"Network+ · 1.6 DNS"`, `"Security+ · 4.6 Access control"`. Check them against the **currently live exam versions and objective numbering**. As of mid-2026 (my knowledge), I believe:
   - A+ = 220-1201/1202 (the V15 series, launched 2025)
   - Network+ = N10-009
   - Security+ = SY0-701
   - PenTest+ = PT0-003

   Web-search CompTIA's current objectives PDFs. **Tags written against older A+ (220-1101/1102) numbering may be off.**
2. **Help-desk / ITIL practice claims:**
   - identity verification before resets (NIST SP 800-63B covers recovery)
   - change management (CAB, backout plan, freeze)
   - incident priority = impact × urgency
   - P1 escalation
   - blameless reporting
   - PIR/RCA

   Cite a source (ITIL 4 terminology, NIST, CISA guidance) or mark ⚠️ general practice.
3. **Security claims:**
   - MFA fatigue / push bombing (CISA guidance)
   - vishing / tech-support scams
   - tailgating / badge challenge
   - visitor escort (PCI DSS has physical-access/visitor requirements; check the current version)
   - least privilege / local admin
   - guest network segmentation
4. **Data sanitization:** NIST SP 800-88 (confirm the current revision and its clear/purge/destroy definitions), certificate of destruction (⚠️ vendor practice).
5. **Org-policy numbers** (48 h notice, $500 card limit, 3 lifelines) are ⚠️ game design. Label them that way.
6. **Windows/M365 specifics** (display rotation hotkey, Known Folder Move, software catalog/Company Portal): verify current behavior before teaching it.

---

## 8. BUILD ORDER (skeleton first, the way Moon likes it)

1. **v1 skeleton, all three days playable and thin:**
   - `days.js` with DAY_TASKS for D1/D2/D3 (routes to existing NPCs/props where possible)
   - NEXT UP card + Today pill
   - the evening loop (EOD composer → Marching Orders → alarm → sleep → morning)
   - Day 3 finale → credits → **arcade score + initials + board + start screen**

   Ship this first; the arc is the product.
2. **Pools:** 26+ walk-up issues, ~14 pages, known-issues items, personas, `rollDay()` persisted. The listen / cut-in / answer flow.
3. **Clock day:** `rollSched`, the bridge-call sequence, pages, log-it calls, auditor, escorted vendor, social engineer, walk-up spawns, window close.
4. **Ledger:** cash/card, supply run with receipts, **close-with-notes** on every resolution, Day 3 audit + back-fill.
5. **E-waste custody** + its first-pickup explainer pop-up, the nightly miss report, the rep hit.
6. **Comms:** team chat, contact-card task, lingo cards.
7. **Polish:**
   - portraits in all dialogs (the IT game already has procedural sprites + `drawSpritePreview`)
   - time-of-day tint
   - happy-hour map
   - Director's email with the next-gig tease
   - finds/badges
8. **Calibrate the score** with the bot (Section 9), then write the handoff.

---

## 9. VALIDATION (what "done" means in this series)

Run all of these every build:
- `node --check` on every module **and** on the script extracted from the regenerated `standalone.html` (catches order/duplicate-declaration issues).
- **Structural validator** (Node `vm` sandbox with DOM/canvas/localStorage stubs):
  - maps are rectangular
  - every door/exit target exists and lands on a walkable, non-warp tile
  - every map is reachable from the start
  - every NPC/prop is in-bounds, not on a solid tile, and has a reachable adjacent tile (flood-fill)
  - every `ticket/sideQuest/reward.find/route` id resolves
  - every scenario has **exactly one** correct diagnosis
  - every side quest/quiz question has exactly one correct answer
  - every ISSUES/PAGES entry has exactly one score-2 option
  - every `DAY_TASKS.route()` returns a real map + entity
- **Headless full-arc playthrough** (jsdom or Playwright). The IT game's June handoff describes `tools/smoke.mjs`, `reach.mjs` and `bundle-boot.mjs` harnesses (jsdom dev dep), **but only `tools/build-standalone.mjs` is in the folder now.** Recreate them. The bot:
  1. starts at the title → character creator
  2. does every D1 task
  3. evening → sleep
  4. D2: runs the clock to the end, answers every event
  5. evening → sleep
  6. D3: every task
  7. finale → credits → arcade → types initials → board saved → score matches the scorecard

  **0 page errors.** Record the bot's score for calibration.
- Check at **desktop (~1100 px) and phone (390 px)** widths; ON LOCATION has tap-to-walk and the IT game has a touch D-pad.
- Save-file round-trip still works with the new keys.

---

## 10. OPEN QUESTIONS FOR MOON (with the default you should use if he's not around)

| Question | Default |
|---|---|
| Premise: Cutover Week, MSP field tech, or SOC Week? | **Cutover Week** (Floor 3 home base, Floor 7 as a Day 2 interrupt) |
| What's the change? | **Laptop refresh for Accounting + Reception** |
| Player title? | **Tier 1 Help Desk Technician** (the XP ladder's "IT Intern → CISO" titles stay as career rank) |
| Commute + home/alarm ritual, or office only? | **Keep home + commute** (it's the heart of the day structure) |
| Keep coins/cosmetic shop separate from in-fiction cash/card? | **Separate** |
| Wipe old saves? | Ask. If unanswered, bump the prefix and keep the save-to-file import tolerant of old files |
| Shared leaderboard across devices? | **Local first**; offer Netlify Function + Blobs |
| Lifeline name | "Ask the Coordinator", 3 per week, −50 |
| Names for Lead/Director/Coordinator/Auditor/Vendor/Social engineer | Invent warm, specific ones; Moon renames after playtest (keep ids stable) |

---

## 11. HANDOFF TEMPLATE (what you write at the end of each session)

`# THE TICKET QUEUE: Complete Handoff (vX, "subtitle")`, then:
- **0.** Where we are + push status + exact git commands
- **1.** Decisions/requests log (table: version → what Moon asked/decided)
- **2.** What's new
- **3.** The game, day by day
- **4.** Money/ledger
- **5.** Randomization pools table
- **6.** Everything else still live
- **7.** Fact-check list (✅ with sources / ⚠️ / ❓)
- **8.** Names & cast table (display name ↔ code id)
- **9.** Code map (modules, key functions by version, registries, persisted state keys)
- **10.** Validation results + bot score
- **11.** Tuning knobs + next ideas

---

## APPENDIX A: real ON LOCATION v7.3 code (lightly trimmed), to copy shapes from

**Per-day roll (persisted):**
```js
function roll(){const ph=S.phase;if(!(ph in DAY_TASKS))return {issues:[],ch2:[],dmg:[]};
  if(S.v8.roll[ph])return S.v8.roll[ph];
  const nI={PREP:2,SHOOT:5,WRAP:2}[ph],nC={PREP:1,SHOOT:3,WRAP:1}[ph];
  const iss=shuffle(ISSUES.filter(i=>i.ph===ph)).slice(0,nI).map(i=>i.id);
  const ansC=shuffle(CH2.filter(c=>c.ph===ph&&!c.go)),goC=shuffle(CH2.filter(c=>c.ph===ph&&c.go));
  const ch=ph==="SHOOT"?[goC[0].id].concat(ansC.slice(0,nC-1).map(c=>c.id)):ansC.slice(0,nC).map(c=>c.id);
  const r={issues:iss,ch2:shuffle(ch),dmg:[],drive:0,pers:shuffle(PERSONAS.map((x,i)=>i))};
  if(ph==="WRAP"){/* pick 2 of 6 brownstone + 2 of 4 hall damages, always include logged holes + driveway */}
  S.v8.roll[ph]=r;v8Save();return r;}
```

**Event schedule for the clock day:**
```js
function rollSched(){const R2=(a,b)=>Math.round(rnd(a,b));
  S.v8.sched={hole1:R2(50,80),hole2:R2(170,210),insp:R2(60,130),ch2a:R2(25,45),ch2b:R2(110,150),ch2c:R2(200,240),
    tcd1:R2(90,150),tcd2:Math.random()<.5?R2(205,245):-1,steve1:R2(40,100),steve2:Math.random()<.6?R2(180,230):-1};v8Save();}
// v8Update(dt): if(modalOpen||sleeping||transition) don't advance; S.v8.filmT+=s; for each sched key, if filmT>=t && !filmFired[key] && cooldown<=0 → fire it, set filmFired[key], cooldown=8
```

**Day task with route (drives NEXT UP):**
```js
{id:"supply",label:"Supply run for Priya's UPA van (Bryan's list)",done:()=>S.flags.has("suppliesLoaded"),route:()=>{
  if(!S.flags.has("supplyList"))return R("office","sal","Bryan has a supply run for you");
  const left=SUPPLY_LIST.filter(k=>!S.flags.has("sup_"+k));
  if(left.length)return R("officeblock","dmitri",`Supply run: ${SUPPLY_LIST.length-left.length}/${SUPPLY_LIST.length} — Dmitri's Hardware`);
  return R("officeblock","vansO","Load the supplies into Priya's UPA van");}}
// helpers: tasksFor(ph), currentTask()=tasksFor(S.phase).find(t=>!t.done()), dayTasksDone() (throttled 200ms)
```

**Purchase with the diligence link (the receipt pattern):**
```js
purchase=function(it,vendor,pal,exitLabel,after){
  S.addCoins(-it.price);spend(it.price);
  const rec={id:(it.id||"x")+"_"+Date.now().toString(36),item:it.name,icon:it.icon,amt:it.price,vendor,ph:S.phase,rcpt:false,recon:false,personal:String(it.code||"").startsWith("PERSONAL")};
  S.v8.purchases.push(rec);v8Save();updateHUD();
  openModal(vendor,"Rung up",pal?{pal}:null);
  p(`${it.icon} <b>${it.name}</b>. That's <b>$${it.price}</b> out of your petty cash.`);
  const big=el("button","act big-exit",exitLabel);big.onclick=closeModal;mbody.appendChild(big);   // Enter/Space hits THIS
  const ask=el("button","rcpt-ask","Could I grab the receipt, please?");                            // small, gray
  ask.onclick=()=>{if(rec.rcpt)return;rec.rcpt=true;v8Save();ask.disabled=true;ask.textContent="🧾 Receipt's in your envelope";
    big.insertAdjacentHTML("beforebegin",receiptHTML(vendor,it));};
  mbody.appendChild(ask);};
```

**Radio "go to 2" (the page analog):**
```js
function openCh2(c){ /* modal "📻 Channel 1" → "<who>: Locations, go to 2." → button "Switch to Channel 2" →
  if c.go: "Go find them at <where>" → spawnNeighbor(issue, c.spawn), mark "!" on them
  else: shuffle(c.opts) → buttons; on pick: recordAnswer(), rep +1/0/−1, feedback banner, addNote("ch2",…), "Copy. Back to 1." */ }
function fireCh2(){const r=roll();const id=r.ch2.find(x=>!S.v8.done["c_"+x]);if(!id)return false;S.v8.done["c_"+id]=true;v8Save();openCh2(CH2.find(c=>c.id===id));return true;}
// v7.2: onSet() ? walkie modal : text-message modal (SMS tone). onSet = S.phase==="SHOOT" && SET_MAPS.includes(S.map)
```

**Evening → sleep → next day:**
```js
function openEvening(){ if(alarm set) "Go to bed"; else if(!eod_<phase>) openEodCompose() → then openMarchingOrders(); }
function openMarchingOrders(){ /* email: TODAY BY THE NUMBERS (tasks, trash by location, rep delta, neighbors, spend) · TOMORROW (call time + tasksFor(next)) · button "⏰ Set alarm" → flag alarm_<phase>; if trash missed → −1 rep */ }
function goToSleep(){ /* overlay GOOD NIGHT → 2.2s alarm tones + next day name → advanceDay() → openMorning() */ }
function advanceDay(){ /* clear visitors/violations/timers; S.setPhase(next); reset clock; teleport home; save */ }
function openMorning(){ /* "⏰ 5:30 AM · <Day>" + flavor + numbered list of today's tasks + "The NEXT UP card walks you through it." */ }
```

**EOD composer:** items = today's Day Notes (real) + 3 random `DISTRACT` lines (fake), shuffled. The player taps what belongs, and the result is scored.

**First-time explainer (Trash Plan):**
```js
{const _ct=checkTrash;checkTrash=function(){const before=tCarry(),first=!S.flags.has("trashPlan");
  _ct();if(first&&tCarry()>before){S.setFlag("trashPlan");openTrashPlan();}};}
// openTrashPlan: boss quote → pixel canvas of the pickup square + where the 3 squares are → "The plan" numbered banner → "The goal" banner → red banner if prerequisite missing → "Got it" button
```

**Final score + board:**
```js
const HS_KEY="onloc_hiscores";
function loadHS(){try{return JSON.parse(localStorage.getItem(HS_KEY)||"[]");}catch(e){return window.__hs||[];}}
function saveHS(a){window.__hs=a;try{localStorage.setItem(HS_KEY,JSON.stringify(a));}catch(e){}}
function finalScore(){const R=[],add=(l,d,pts)=>{if(pts)R.push([l,d,Math.round(pts)]);};
  /* add("Day tasks completed",`${tDone} of ${all}`,tDone*100) … one add() per line in the table … */
  const total=Math.max(0,R.reduce((a,r)=>a+r[2],0));
  const grade=total>=9500?"S":total>=8000?"A":total>=6500?"B":total>=5000?"C":"D";
  return {rows:R,total,grade};}
// showArcade(): full-screen, rows slide in with blips, total counts up → 3 initials slots → push {i,s,g,ch,t:Date.now(),d:date} → sort desc → keep 50 → "YOU'RE #n ON THE BOARD!" + confetti → table w/ your row highlighted
// showStart(): logo + START + top-10 hsTable(); wraps showTitle so it appears before character select
```

**Layer hook pattern** (ON LOCATION single-file; in the IT game, prefer explicit module functions, but this is how cross-cutting additions were done without touching the base):
```js
{const _orig = updateHUD; updateHUD = function(){ _orig(); /* draw Today n/N pill, NEXT UP card */ };}
```

*End of handoff. Build the three-day arc first. The arc is the product.*
