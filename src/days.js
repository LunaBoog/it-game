// v2 day engine: the three-day arc, the task lists, the NEXT UP router, the
// per-day content roll, walk-up users + pages, and the interaction dispatch
// that sits in front of the base engine's NPC/prop handling.
//
//   Day 1 · Onboarding & Change Prep   (10 tasks)
//   Day 2 · Go-Live / Cutover          (5 tasks, the last one is the clock)
//   Day 3 · Hypercare & Close-Out      (10 tasks, ends at the happy hour)
//
// Days change ONLY by going home, sending the EOD email, reading Tasha's
// Marching Orders, setting the alarm and sleeping.

import { CORE, DD, ddSave, curDay, esc, shuffleArr, addNote, addRep, bump, recordAnswer } from "./core.js";
import { ISSUES, PAGES, PERSONAS, SUPPLY_LIST } from "./pools.js";
import { SCENARIOS } from "./scenarios.js";
import { mapDef, FLOOR_META, F3_SPOTS, LOBBY_SPOTS, isWalkableOn } from "./world.js";
import { panel, pAdd, pBtn, pClear, closePanel, panelOpen } from "./ui.js";
import { award, ping, blip, hearLingo, chatPost } from "./comms.js";
import { recordWork, docPrompt, openBodega, buyCoffee } from "./ledger.js";
import { visAdd, visLeave, visAll, visFind, visUpdate } from "./visitors.js";
import { npcTask, propTask, stepOn, restoreFlows } from "./flows.js";
import { clockTick, clockRestore, clockPending, clockNextUp, clockNpc, clockProp, windowLeft } from "./clock.js";

const S_ = () => CORE.S;
const F = (f) => CORE.S.hasFlag(f);

// ---- tickets by day -------------------------------------------------------
export function ticketOpen(id) {
  const s = SCENARIOS[id]; if (!s) return false;
  if ((s.floor || "floor3") === "floor7") return true;          // the floor lock gates F7
  return (s.day || 1) <= Math.min(curDay(), 3);
}
export function afterTicketSolved(id, firstTry, host) {
  const S = S_(), s = SCENARIOS[id];
  const d = DD();
  d.solvedOn = d.solvedOn || {};
  if (!d.solvedOn[id]) {
    d.solvedOn[id] = curDay();
    const wrong = Math.max(0, S.triedAnswers.size - 1);
    bump("asked"); if (firstTry) bump("first"); if (wrong) bump("wrong", wrong);
    addNote("ticket", "\u{1F39F}️", `Closed ticket: ${s.title} (${s.ticketMeta.split(" · ").pop()}).`);
    addRep(1);
  }
  const who = (s.ticketMeta || "").split(" · ").pop();
  const fix = (s.diagnoses.find((x) => x.correct) || {}).label;
  const rec = d.docs.find((r) => r.kind === "ticket" && r.id.startsWith("ticket:" + id + ":")) ||
    recordWork("ticket", id, s.title, who, s.ticket.replace(/^"|"$/g, ""), fix + ". " + s.principle + ".");
  if (id === "monitor" && !F("shadowed")) { S.setFlag("shadowed"); chatPost("Tasha", "Nice work on Karen's screen. Physical layer first, every time. Now: supply run. List's in your kit."); }
  if (rec.documented) {
    const b = document.createElement("button"); b.className = "primary-btn act"; b.textContent = "Done →";
    b.addEventListener("click", closePanel); host.appendChild(b);
  } else docPrompt(host, rec);
  S.updateProgressUI();
}

// ---- the task lists ---------------------------------------------------------
const TAGS = ["tag-r1", "tag-r2", "tag-a1", "tag-a2", "tag-a3", "tag-a4"];
const SIGNS = ["sign-r", "sign-a", "sign-o"];
export const SIGNOFFS = [["ed", "Ed (Accounting)"], ["karen", "Karen (Reception)"], ["riley", "Riley (Ops)"]];
const STATIONS = ["bench", "xfer", "wait"];

function R(map, id, text, sub) { return { map, id, text, sub }; }

export const DAY_TASKS = {
  1: [
    { id: "d1_email", label: "Read Tasha's welcome email (your laptop)", done: () => F("d1Email"),
      route: () => R("home", "laptop", "Read Tasha's welcome email", "Your laptop, living room") },
    { id: "d1_badge", label: "Get your badge photo at the lobby security desk", done: () => F("badge"),
      route: () => R("lobby", "lou", "Get your badge photo from Lou", "Security desk, lobby") },
    { id: "d1_kit", label: "Get your kit from Tasha (laptop, MFA, admin account, company card)", done: () => F("kit"),
      route: () => R("floor3", "tasha", "Get your kit from Tasha", "IT room, Floor 3") },
    { id: "d1_shadow", label: "Shadow Tasha on the queue: take Karen's ticket", done: () => S_().solved.has("monitor"),
      route: () => R("floor3", "karen", "Take Karen's ticket (Tasha's watching)", "Reception") },
    { id: "d1_supply", label: "Supply run on the company card, then drop it with Kai", done: () => F("suppliesDelivered"),
      route: () => {
        const left = SUPPLY_LIST.filter((k) => !F("sup_" + k));
        if (left.length) return R("lobby", "ray", `Supply run: ${SUPPLY_LIST.length - left.length}/${SUPPLY_LIST.length} · Byte Bodega`, "Street level, next door");
        return R("floor3", "kai", "Drop the supplies with Kai", "IT room");
      } },
    { id: "d1_inventory", label: "Inventory walk: asset-tag 6 machines in Reception + Accounting", done: () => TAGS.every((t) => F("tag_" + t)),
      route: () => {
        if (!F("sup_labels")) return R("lobby", "ray", "You need asset labels first", "Byte Bodega");
        const t = TAGS.find((x) => !F("tag_" + x));
        return R("floor3", t, `Asset-tag the machines (${TAGS.filter((x) => F("tag_" + x)).length}/6)`, "Reception + Accounting");
      } },
    { id: "d1_backup", label: "Verify the backups before the change", done: () => F("backupVerified"),
      route: () => R("floor3", "backup", "Verify the backups", "Backup console, server closet") },
    { id: "d1_cab", label: "Get the change approved at CAB (Harold)", done: () => F("cabApproved"),
      route: () => R("floor3", "harold", "Pitch the change to CAB", "Harold, conference room") },
    { id: "d1_notice", label: "\u{1F6A8} Send the user notice NOW", loud: true, done: () => F("noticeSent"),
      route: () => R("floor3", "workpc", "\u{1F6A8} Send the user notice NOW", "Your work PC, IT room") },
    { id: "d1_stage", label: "Stage the new laptops (loaner cart from Mo → imaging bench)", done: () => F("staged"),
      route: () => F("cartOut") ? R("floor3", "st-bench", "Stage the laptops on the imaging bench", "Conference room")
        : R("lobby", "mo", "Check out the loaner cart from Mo", "IT storeroom, lobby") }
  ],
  2: [
    { id: "d2_standup", label: "Morning stand-up with Tasha", done: () => F("standup"),
      route: () => R("floor3", "tasha", "Stand-up with Tasha", "IT room") },
    { id: "d2_station", label: "Set up the swap station (bench, transfer, waiting area)", done: () => STATIONS.every((s) => F("st_" + s)),
      route: () => { const s = STATIONS.find((x) => !F("st_" + x)); return R("floor3", "st-" + s, `Set up the swap station (${STATIONS.filter((x) => F("st_" + x)).length}/3)`, "Conference room"); } },
    { id: "d2_contacts", label: "Get escalation contacts (Mo, Lou) into the team chat", done: () => F("contactsSent"),
      route: () => {
        if (!F("card_mo")) return R("lobby", "mo", "Get the OEM warranty desk card from Mo", "IT storeroom");
        if (!F("card_lou")) return R("lobby", "lou", "Get the ISP NOC card from Lou", "Security desk");
        return { map: null, id: null, text: "Post the contacts to the team chat", sub: "Open your phone: \u{1F4F1} or P" };
      } },
    { id: "d2_bridge", label: "Check in with Harold on the change bridge", done: () => F("bridgeIn"),
      route: () => R("floor3", "harold", "Check in on the bridge with Harold", "Conference room") },
    { id: "d2_window", label: "Work the floor until the change window closes", done: () => !!DD().windowClosed,
      route: () => ({ map: "floor3", id: null, text: "Work the floor until the window closes", sub: DD().windowOpen ? "Walk-ups, pages, surprises. Stay close to the users." : windowLeft() }) }
  ],
  3: [
    { id: "d3_signs", label: "Pull the maintenance notices + the intranet banner", done: () => SIGNS.every((s) => F("pulled_" + s)) && F("bannerDown"),
      route: () => {
        const s = SIGNS.find((x) => !F("pulled_" + x));
        if (s) return R("floor3", s, `Pull the maintenance notices (${SIGNS.filter((x) => F("pulled_" + x)).length}/3)`, "Reception, Accounting, Open desks 2");
        return R("floor3", "workpc", "Take down the intranet banner", "Your work PC");
      } },
    { id: "d3_known", label: "Route every known issue to the right resolver group", done: () => F("knownDone"),
      route: () => R("floor3", "kiboard", "Route the known issues", "Whiteboard, IT room") },
    { id: "d3_signoffs", label: "Get business sign-off: Ed, Karen, Riley", done: () => SIGNOFFS.every(([id]) => F("signoff_" + id)),
      route: () => {
        if (!F("knownDone")) return R("floor3", "kiboard", "Route the known issues first", "Owners won't sign with open issues");
        const s = SIGNOFFS.find(([id]) => !F("signoff_" + id));
        return R("floor3", s[0], `Get sign-off from ${s[1]}`, `${SIGNOFFS.filter(([id]) => F("signoff_" + id)).length}/3 signed`);
      } },
    { id: "d3_ewaste", label: "Old devices → e-waste cage, chain of custody, recycler pickup", done: () => F("certDestruction"),
      route: () => {
        if (!SIGNOFFS.every(([id]) => F("signoff_" + id))) return R("floor3", "ed", "E-waste waits for sign-off", "Old laptops stay untouched until UAT passes");
        const d = DD();
        const left = F3_SPOTS.ewaste.filter((e) => !d.carry.includes(e.id) && !d.caged.includes(e.id));
        if (left.length) {
          const S = S_();
          if (S.map === "floor3") {
            const near = left.slice().sort((a, b) => (Math.abs(a.x - S.px) + Math.abs(a.y - S.py)) - (Math.abs(b.x - S.px) + Math.abs(b.y - S.py)))[0];
            return R("floor3", near.id, `Collect old devices (${d.caged.length + d.carry.length}/8)`, `Carrying ${d.carry.length} · walk over them`);
          }
          return R("floor3", left[0].id, `Collect old devices (${d.caged.length + d.carry.length}/8)`, `Carrying ${d.carry.length}`);
        }
        if (d.carry.length) return R("lobby", "cage", `Log ${d.carry.length} device${d.carry.length > 1 ? "s" : ""} into the e-waste cage`, "IT storeroom, lobby");
        return R("lobby", "recycler", "Hand off to the recycler", "Get the certificate of destruction");
      } },
    { id: "d3_return", label: "Return the card, the loaner cart, and your temporary admin access", done: () => F("kitReturned"),
      route: () => R("floor3", "tasha", "Return your temporary kit to Tasha", "IT room") },
    { id: "d3_audit", label: "Documentation audit with Gloria", done: () => F("audited"),
      route: () => R("floor3", "gloria", "Documentation audit with Gloria", "Manager's office") },
    { id: "d3_kb", label: "Update the KB article for the rollout", done: () => F("kbDone"),
      route: () => R("floor3", "workpc", "Write the KB article", "Your work PC") },
    { id: "d3_pir", label: "Send the post-implementation review (PIR)", done: () => F("pirSent"),
      route: () => R("floor3", "workpc", "Send the PIR email", "Your work PC") },
    { id: "d3_email", label: "Read Director Chen's email", done: () => F("chenEmail"),
      route: () => F("pirSent") ? R("floor3", "workpc", "Read Director Chen's email", "Your work PC") : R("floor3", "workpc", "Send the PIR first", "Your work PC") },
    { id: "d3_party", label: "Team happy hour at The Stack", done: () => F("partyDone"),
      route: () => F("chenEmail") ? R("lobby", "nico", "Team happy hour at The Stack", "Street level, 6 PM") : R("floor3", "workpc", "Finish the close-out first", "") }
  ]
};

export function tasksFor(day) { return DAY_TASKS[day] || []; }
export function currentTask() { return tasksFor(curDay()).find((t) => !t.done()) || null; }
export function dayTasksDone(day = curDay()) { return tasksFor(day).every((t) => t.done()); }
export function taskCount(day = curDay()) { const t = tasksFor(day); return { done: t.filter((x) => x.done()).length, total: t.length }; }

// ---- routing: turn "go to X on map Y" into a step from where you are --------
function findEnt(mapId, id) {
  const m = mapDef(mapId); if (!m || !id) return null;
  return m.npcs.find((n) => n.id === id) || m.props.find((p) => p.id === id) || null;
}
const ELEV = { floor3: "elevator-3", floor7: "elevator-7", lobby: "elevator-l" };
export function resolveRoute(r) {
  const S = S_(); const cur = S.map;
  if (!r) return null;
  if (!r.map || r.map === cur) {
    const e = r.map ? findEnt(r.map, r.id) : null;
    return { text: r.text, sub: r.sub || "", tgt: e ? { x: e.x, y: e.y } : null };
  }
  let sub, e;
  if (cur === "home") { sub = "\u{1F687} Take the subway to work (corner of 31st St)"; e = findEnt("home", "subway-h"); }
  else if (r.map === "home") {
    if (cur === "lobby") { sub = "\u{1F687} Take the subway home (49 St station)"; e = findEnt("lobby", "subway-l"); }
    else { sub = "\u{1F6D7} Elevator down to the Lobby"; e = findEnt(cur, ELEV[cur]); }
  } else { sub = `\u{1F6D7} Elevator to ${FLOOR_META[r.map] ? FLOOR_META[r.map].name : r.map}`; e = findEnt(cur, ELEV[cur]); }
  return { text: r.text, sub, tgt: e ? { x: e.x, y: e.y } : null };
}

// The NEXT UP card always knows what you should do. Interrupts override tasks.
export function nextUp() {
  const S = S_(); const day = curDay();
  if (day >= 4) return { text: "That's a wrap.", sub: "Final score's in. Replay from the title for a new week.", tgt: null };
  // interrupts: someone waiting on you, go-finds, the clock-day actors
  const gf = visFind((n) => n._vis.kind === "gofind");
  if (gf) return resolveRoute(R(gf._vis.map, gf.id, `Go find ${gf.name}`, gf._vis.data.where || ""));
  const wu = visFind((n) => n._vis.kind === "walkup" && n._vis.map === S.map && n._vis.arrived);
  if (wu) return { text: `${wu.name} wants a word`, sub: "Face them and press E", tgt: { x: wu.x, y: wu.y } };
  const cn = clockNextUp(); if (cn) return cn;
  const t = currentTask();
  if (t) { const r = resolveRoute(t.route()); if (r) { r.loud = !!t.loud; return r; } }
  // all done: the evening
  if (day <= 2) {
    if (!F("eod_" + day)) return resolveRoute(R("home", "laptop", "Head home and send your EOD email", "Your laptop, living room"));
    if (!F("alarm_" + day)) return resolveRoute(R("home", "laptop", "Read Tasha's Marching Orders", "Your laptop"));
    return resolveRoute(R("home", "bed", "Go to bed", "The alarm's set"));
  }
  return { text: "Enjoy the party", sub: "", tgt: null };
}

// ---- per-day content roll (persisted; a reload never rerolls) ---------------
export function rollDay(day = curDay()) {
  const d = DD();
  if (d.roll[day]) return d.roll[day];
  const nI = { 1: 2, 2: 5, 3: 2 }[day] || 0, nP = { 1: 1, 2: 3, 3: 1 }[day] || 0;
  const issues = shuffleArr(ISSUES.filter((i) => i.d === day)).slice(0, nI).map((i) => i.id);
  let pages;
  if (day === 2) {
    const go = shuffleArr(PAGES.filter((p) => p.d === 2 && p.go)), ans = shuffleArr(PAGES.filter((p) => p.d === 2 && !p.go));
    pages = shuffleArr([go[0].id, ...ans.slice(0, nP - 1).map((p) => p.id)]);
  } else pages = shuffleArr(PAGES.filter((p) => p.d === day)).slice(0, nP).map((p) => p.id);
  const r = { issues, pages, pers: shuffleArr(PERSONAS.map((_, i) => i)), wIdx: 0 };
  d.roll[day] = r; ddSave();
  return r;
}
function personaFor(i) { const r = rollDay(); return PERSONAS[r.pers[i % r.pers.length]]; }

// ---- walk-up users ------------------------------------------------------------
export function spawnWalkup(issueId, mapId) {
  const S = S_(); const iss = ISSUES.find((x) => x.id === issueId); if (!iss) return null;
  const r = rollDay(); const per = personaFor(r.wIdx++); ddSave();
  const at = mapId === "lobby" ? LOBBY_SPOTS.arrive : F3_SPOTS.arrive;
  if (!isWalkableOn(mapId, at.x, at.y)) return null;
  if (visAll().some((v) => v._vis.map === mapId && v.x === at.x && v.y === at.y)) return null;
  if (S.map === mapId && S.px === at.x && S.py === at.y) return null;
  const n = visAdd(mapId, { id: "wu_" + issueId, name: per.name, role: per.sub, x: at.x, y: at.y, sprite: per.sprite },
    { kind: "walkup", data: { issue: iss, persona: per }, target: "player" });
  if (n) { DD().done["spawned_" + issueId] = true; ddSave(); ping("\u{1F64B}", per.name + " is looking for you", iss.tag); }
  return n;
}

export function openWalkup(n, issueOverride) {
  const S = S_(); const v = n._vis; const iss = issueOverride || v.data.issue; const per = v.data.persona || { name: n.name, sub: n.role };
  v.want = false; v.target = null;
  panel(per.name, per.sub, n.sprite);
  const LBL = ["Mm-hm.", "Keep listening…", "Nod.", "Let them finish.", "I hear you."];
  let i = 0;
  const line = pAdd("", "wu-line");
  const nxt = pBtn("", () => { if (i >= iss.lines.length - 1) finish(); else { i++; render(); } }, "primary-btn act");
  const cut = iss.lines.length >= 2 ? pBtn("Cut in: “I've got a ticket queue—”", cutIn, "act ghost") : null;
  function render() { line.innerHTML = `“${esc(iss.lines[i])}”`; nxt.textContent = LBL[i % LBL.length]; }
  render();
  setTimeout(() => { try { nxt.focus(); } catch { /* ignore */ } }, 30);

  function cutIn() {
    nxt.remove(); cut.remove();
    pAdd(`<p>“Oh, YOU'VE got a queue? Great. I'll just email your manager.”</p>`);
    pAdd(`<div class="banner no">They didn't need you to fix anything yet. They needed a minute of listening. <b>(−1 rep)</b></div>`);
    addRep(-1); bump("cut");
    addNote("walkup", "\u{1F64B}", `${per.name} (${per.sub}): cut them off before they finished. They're emailing Tasha.`);
    DD().done[iss.id] = true; ddSave();
    pBtn("Close", () => { closePanel(); visLeave(n, exitFor(n)); }, "act ghost");
    blip(false);
  }
  function finish() {
    nxt.remove(); if (cut) cut.remove();
    pAdd(`<p><b>“${esc(iss.ask)}”</b></p>`);
    judgment(iss.opts, (score, opt) => {
      bump("heard"); if (score === 2) bump("best");
      addRep(score === 2 ? 2 : score === 1 ? 1 : -1);
      const st = DD().st;
      if (st.best >= 6) award("fixer");
      if (st.heard >= 8 && !st.cut) award("listener");
      addNote("walkup", "\u{1F64B}", `${per.name} (${per.sub}): ${iss.tag}. ${score === 2 ? "Sorted it the right way." : score === 1 ? "Helped, not perfectly." : "Made it worse."}`);
      DD().done[iss.id] = true; ddSave();
      if (iss.cert) pAdd(`<div class="set-hint" style="margin-top:6px;">\u{1F4D8} ${esc(iss.cert)}</div>`);
      const rec = recordWork("walkup", iss.id, iss.tag, `${per.name} (${per.sub})`, iss.lines[0], opt[0]);
      docPrompt(pAdd(""), rec, () => visLeave(n, exitFor(n)));
    }, "walkup");
  }
}
function exitFor(n) { return n._vis.map === "lobby" ? LOBBY_SPOTS.arrive : F3_SPOTS.arrive; }

// Three shuffled answers + the lifeline. cb(score, opt) after the pick.
export function judgment(opts, cb, ctx = "") {
  const wrap = pAdd("", "btn-column");
  const sh = shuffleArr(opts);
  const btns = sh.map((o) => {
    const b = document.createElement("button"); b.className = "dx-btn opt"; b.textContent = o[0];
    b.addEventListener("click", () => pick(o, b)); wrap.appendChild(b); return b;
  });
  const d = DD();
  const left = 3 - d.st.lifelines;
  let life = null;
  if (left > 0) {
    life = pBtn(`\u{1F4DE} Ask Benny (${left} left · −50 pts)`, () => {
      bump("lifelines"); life.remove();
      const best = sh.find((o) => o[1] === 2);
      pAdd(`<div class="banner fact">\u{1F4DE} Benny: “Go with: <i>${esc(best[0].slice(0, 90))}${best[0].length > 90 ? "…" : ""}</i>”</div>`);
      btns.forEach((b, i) => { if (sh[i][1] === 2) b.classList.add("hint"); });
    }, "act ghost life-btn");
  }
  function pick(o, b) {
    btns.forEach((x) => { x.disabled = true; });
    if (life) life.remove();
    b.classList.add(o[1] === 2 ? "correct" : o[1] === 1 ? "okay" : "wrong");
    recordAnswer(o[1]);
    pAdd(`<div class="banner ${o[1] === 2 ? "ok" : o[1] === 1 ? "fact" : "no"}">${esc(o[2])}</div>`);
    blip(o[1] > 0);
    cb(o[1], o);
  }
}

// ---- pages / @helpdesk mentions ---------------------------------------------
export function onFloorDuringWindow() { const S = S_(); return curDay() === 2 && DD().windowOpen && !DD().windowClosed && S.map === "floor3"; }
export function firePage(id) {
  const p = PAGES.find((x) => x.id === id); if (!p) return false;
  DD().done["pg_" + id] = true; ddSave();
  const pager = onFloorDuringWindow();
  panel(pager ? "\u{1F4DF} PAGE · Help Desk" : "\u{1F4AC} #helpdesk-team", pager ? `From ${p.who} · via the bridge` : `${p.who} mentioned you`, "\u{1F4DF}");
  pAdd(`<p style="margin:0 0 8px;"><b>${esc(p.who)}:</b> “@helpdesk ${esc(p.ask)}”</p>`);
  CORE.sfx && CORE.sfx("page");
  if (p.go) {
    hearLingo("escalation");
    pBtn(`\u{1F3C3} On my way: go find them ${esc(p.where || "")}`, () => {
      closePanel();
      const per = PERSONAS[p.spawn.persona] || PERSONAS[0];
      DD().pendingGo = id; ddSave();
      spawnGoFind(p);
      bump("pages");
      addNote("page", "\u{1F4DF}", `${p.who} paged: ${per.name} needs help ${p.where}. Went to find them.`);
    });
    return true;
  }
  judgment(p.opts, (score, opt) => {
    bump("pages"); if (score === 2) bump("pagesBest");
    addRep(score === 2 ? 1 : score === 1 ? 0 : -1);
    if (DD().st.pages >= 5) award("gotochat");
    addNote("page", "\u{1F4DF}", `${p.who} paged about: ${p.ask.slice(0, 70)}${p.ask.length > 70 ? "…" : ""} ${score === 2 ? "Handled it right." : "Could've been better."}`);
    const rec = recordWork("page", id, p.ask.slice(0, 60), p.who, p.ask, opt[0]);
    docPrompt(pAdd(""), rec);
  }, "page");
  if (/P1/i.test(p.ask + p.opts.map((o) => o[0]).join(" "))) hearLingo("p1");
  return true;
}
function spawnGoFind(p) {
  const per = PERSONAS[p.spawn.persona] || PERSONAS[0];
  return visAdd("floor3", { id: "gf_" + p.id, name: per.name, role: per.sub, x: p.spawn.spot.x, y: p.spawn.spot.y, sprite: per.sprite },
    { kind: "gofind", data: { page: p.id, issue: p.spawn.issue, persona: per, where: p.where }, target: null });
}
export function restoreGoFind() {
  const id = DD().pendingGo; if (!id) return;
  if (visFind((n) => n._vis.kind === "gofind")) return;
  const p = PAGES.find((x) => x.id === id); if (p) spawnGoFind(p);
}

// ---- interaction dispatch (runs BEFORE the base engine's handlers) -----------
// Return true if the day engine handled it.
export function dayNpc(n) {
  const S = S_();
  if (n._vis) {
    const k = n._vis.kind;
    if (k === "walkup") { openWalkup(n); return true; }
    if (k === "gofind") {
      DD().pendingGo = null; ddSave();
      n._vis.kind = "walkup";
      openWalkup(n, n._vis.data.issue);
      return true;
    }
    if (clockNpc(n)) return true;
    return npcTask(n);
  }
  if (clockNpc(n)) return true;
  if (n.coffee) { buyCoffee(n.name, n.sprite); return true; }
  if (n.shop) { openBodega(); return true; }
  return npcTask(n);
}
export function dayProp(p) {
  if (clockProp(p)) return true;
  return propTask(p);
}

// Stepping onto a tile (e-waste pickups).
export function dayStep(x, y) { stepOn(x, y); }

// ---- light scheduler for the non-clock days (walk-ups + pages) ---------------
function officeMap(m) { return m === "floor3" || m === "lobby"; }
export function dayTick(dtMs, modalOpen) {
  const S = S_(); if (!S || !S.dd || !S.started) return;
  visUpdate(dtMs);
  const day = curDay();
  if (day === 2) { clockTick(dtMs, modalOpen); return; }
  if (modalOpen || !officeMap(S.map) || day > 3) return;
  const d = DD();
  const gate = day === 1 ? F("kit") : true;
  if (!gate) return;
  d.officeT = (d.officeT || 0) + dtMs / 1000;
  const r = rollDay();
  // walk-ups at ~50s and ~150s of office time; one page at ~95s
  const wTimes = day === 1 ? [30, 90] : [25, 90];
  r.issues.forEach((id, i) => {
    if (d.done["spawned_" + id] || d.done[id]) return;
    if (d.officeT >= (wTimes[i] || 200 + i * 60) && !visFind((v) => v._vis.kind === "walkup")) spawnWalkup(id, S.map);
  });
  const pT = day === 1 ? 60 : 55;
  const pid = r.pages[0];
  if (pid && !d.done["pg_" + pid] && d.officeT >= pT && !panelOpen()) firePage(pid);
}

// Everything the renderer / HUD needs about the day in one place.
export function dayRestore() {
  restoreGoFind();
  clockRestore();
  restoreFlows();
}
export function dayPending() { return clockPending(); }

// ---- Day-1 orientation (v2 premise) ------------------------------------------
export function orientationPagesV2(name) {
  return [
    { t: "Welcome to Cutover Week", a: "\u{1F44B}",
      h: `<p style="margin:0 0 8px;">Morning, ${name}. You're the new <strong>Tier 1 Help Desk Technician</strong>, and your first three days land on a big change: every laptop in <strong>Accounting and Reception</strong> gets swapped for a new one.</p>
          <p style="margin:0;color:var(--text-muted);">Day 1 you prep. Day 2 it goes live, on a clock. Day 3 you close it out. Then happy hour and your final score.</p>` },
    { t: "Your chain of command", a: "\u{1FA9C}",
      h: `<p style="margin:0 0 8px;"><strong>Director Chen</strong> runs IT. <strong>Tasha</strong>, the Help Desk Lead, is your boss: she issues your kit and emails your orders every night. <strong>Harold</strong> runs the change bridge, <strong>Benny</strong> routes the queue (and is your lifeline), <strong>Gloria</strong> audits every ticket, and <strong>Kai</strong> the intern is below you.</p>
          <p style="margin:0;color:var(--text-muted);">Tasks come from someone. Gear is issued by someone. That's the job.</p>` },
    { t: "Follow NEXT UP", a: "➡️",
      h: `<p style="margin:0 0 8px;">The <strong>NEXT UP</strong> card (top-left) always knows your next step, and a bouncing arrow marks where. People who walk up to you, pages, and the auditor jump the line.</p>
          <p style="margin:0;color:var(--text-muted);">Tickets still work the old way: investigate, commit a diagnosis, learn the principle. Orange <strong style="color:#EF9F27;">!</strong> = a ticket or someone waiting. Blue <strong style="color:#378ADD;">?</strong> = a side quest.</p>` },
    { t: "The small gray link", a: "\u{1F4DD}",
      h: `<p style="margin:0 0 8px;">Every time you close something there's a big <strong>Close it</strong> button and a small gray link: <strong>Add work notes first</strong>. Same with receipts at the store. The easy button is always the big one.</p>
          <p style="margin:0;color:var(--text-muted);">Gloria reads every ticket on Day 3. \u{1F4DD} Notes = <strong>N</strong>, \u{1F4F1} team chat = <strong>P</strong>. Everything saves automatically. Go get 'em.</p>` }
  ];
}

