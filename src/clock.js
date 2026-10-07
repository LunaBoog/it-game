// v2 clock: Day 2's real-time change window. WINDOW_LEN seconds of ACTIVE
// play (paused in any panel, on the subway, at home) during which scheduled and
// random events fire inside time windows, with a global cooldown so they
// don't stack:
//   bridge status lines (ambient) · pages · "log it" calls (known issues)
//   · the auditor's clean-desk walk · the escorted vendor wandering off
//   · the social engineer · an optional Floor 7 security interrupt
//   · walk-up users at the swap station · "last ten users" · final validation

import { CORE, DD, ddSave, curDay, esc, rndi, shuffleArr, addNote, addRep, bump, isClockDay, weekOf } from "./core.js";
import { KNOWN_ISSUES, SOCENG, BRIDGE_LINES, VIOLATION_TEXT, VENDOR_LINES, HOTSPOTS, CLOCK_DAYS, BRIDGE_BY_DAY } from "./pools.js";
import { taughtChip } from "./training.js";
import { F3_SPOTS, LOBBY_SPOTS } from "./world.js";
import { panel, pAdd, pBtn, closePanel, panelOpen } from "./ui.js";
import { award, ping, hearLingo, chatPost, blip } from "./comms.js";
import { recordWork, docPrompt } from "./ledger.js";
import { visAdd, visFind, visLeave, visAll } from "./visitors.js";
import { rollDay, firePage, spawnWalkup, judgment, resolveRoute } from "./days.js";

export const WINDOW_LEN = 300;
const COOLDOWN = 8;
const HF_ = (f) => CORE.S.hasFlag(f);

const AUDITOR = { id: "auditor", name: "Ms. Whitlock", role: "Compliance auditor · spot check",
  sprite: { body: "#2C2C2A", body2: "#1a1a18", accent: "#C0392B", hair: "#6B4A2A", skin: "#E0B080", glasses: true } };
const VENDOR = { id: "vendor", name: "Dale", role: "OEM field tech · escorted visitor",
  sprite: { body: "#1B4E84", body2: "#133A63", accent: "#FF9F1C", hair: "#888780", skin: "#D8B088", hat: "#FF9F1C" } };
const SE_SPRITE = { body: "#E67E22", body2: "#A85B12", accent: "#FFFF66", hair: "#2C2C2A", skin: "#C9926B", hat: "#FFD200" };

function act() { const d = DD(); d.act = d.act || { auditor: null, viol: [], vendor: null, vHide: -1, se: [], seActive: null }; return d.act; }

// ---- opening + schedule --------------------------------------------------------
export function openWindow() {
  const d = DD(); if (d.windowOpen) return;
  d.windowOpen = true; d.clockT = 0; d.fired = {}; d.cool = 0;
  rollSched();
  const day = curDay();
  if (day !== 2) {
    const cfg = CLOCK_DAYS[day] || CLOCK_DAYS[5];
    ddSave();
    chatPost(cfg.lead, cfg.open);
    addNote("window", "\u{1F4DE}", day === 8 ? "Joined Omar's incident bridge." : "Joined Hiro's change bridge. Window opened.");
    ping("\u{1F4DE}", day === 8 ? "The bridge is live" : "The window is open", "Hotspots, walk-ups, pages. Stay close to the users.");
    CORE.S.updateProgressUI();
    return;
  }
  const a = act(); a.vendor = "post";
  spawnVendor(F3_SPOTS.vendorPost);
  ddSave();
  chatPost("Harold", "Bridge is live. Window is OPEN: 8:00 to 11:00. Help Desk, the users are yours.");
  addNote("window", "\u{1F4DE}", "Joined the bridge. Change window opened.");
  ping("\u{1F4DE}", "The window is open", "Work the floor. Walk-ups, pages, and whatever else shows up.");
  CORE.S.updateProgressUI();
}

function rollSched() {
  const d = DD(), day = curDay(), w = weekOf(day);
  if (day !== 2) {
    const se = shuffleArr(SOCENG.filter((x) => x.w === w).map((x) => x.id));
    const known = shuffleArr(KNOWN_ISSUES.filter((k) => k.w === w)).slice(0, 2).map((k) => k.id);
    const hots = shuffleArr(HOTSPOTS.filter((h) => h.d === day).map((h) => h.id));
    d.sched = {
      page1: rndi(25, 45), page2: rndi(115, 150), page3: rndi(200, 235),
      log1: rndi(55, 85), log2: rndi(170, 205),
      hot1: rndi(35, 60), hot2: rndi(120, 145), hot3: rndi(185, 215),
      se1: rndi(70, 110), se2: se.length > 1 && Math.random() < 0.6 ? rndi(150, 190) : -1,
      last10: 240, final: 275
    };
    d.schedSe = se; d.schedKnown = known; d.schedHot = hots;
    d.nextBridge = rndi(8, 14); d.bIdx = 0; d.nextWalk = rndi(18, 30);
    ddSave();
    return;
  }
  const se = shuffleArr(SOCENG.filter((x) => (x.w || 1) === 1).map((x) => x.id));
  const known = shuffleArr(KNOWN_ISSUES.filter((k) => (k.w || 1) === 1 && k.id !== "ki_forward")).slice(0, 2).map((k) => k.id);
  d.sched = {
    page1: rndi(25, 45), page2: rndi(110, 150), page3: rndi(200, 240),
    log1: rndi(50, 80), log2: rndi(170, 210),
    audit: rndi(60, 130),
    vendor1: rndi(90, 150), vendor2: Math.random() < 0.5 ? rndi(205, 245) : -1,
    se1: rndi(40, 100), se2: Math.random() < 0.6 ? rndi(180, 230) : -1,
    secint: Math.random() < 0.5 ? rndi(130, 170) : -1,
    last10: 240, final: 275
  };
  d.schedSe = se; d.schedKnown = known;
  d.nextBridge = rndi(8, 14); d.bIdx = 0; d.nextWalk = rndi(18, 30);
  ddSave();
}

export function windowLeft() {
  const d = DD();
  if (!d.windowOpen) return "Opens after your bridge check-in";
  if (d.windowClosed) return "Window closed";
  const left = Math.max(0, WINDOW_LEN - d.clockT);
  if (left <= 0) return "Time's up: wrap up what's still open";
  return `\u{1F550} ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")} left in the window`;
}
export function clockActive() { const d = DD(); return isClockDay(curDay()) && d.windowOpen && !d.windowClosed; }

// ---- per-frame driver ---------------------------------------------------------
export function clockTick(dtMs, modalOpen) {
  const S = CORE.S, d = DD();
  if (!clockActive()) return;
  const onOffice = S.map === "floor3" || S.map === "lobby" || S.map === "floor5" || S.map === "floor7";
  const day = curDay();
  // the auditor waits at the elevator until you're on 3
  const a = act();
  if (day === 2 && a.auditor === "coming" && S.map === "floor3") { const au = visFind((n) => n.id === "auditor"); if (au && !au._vis.target) au._vis.target = "player"; }
  if (modalOpen || S.overlay || !onOffice) return;
  const s = dtMs / 1000;
  d.clockT += s; d.cool = Math.max(0, (d.cool || 0) - s);
  if (Math.floor(d.clockT / 5) !== Math.floor((d.clockT - s) / 5)) ddSave();   // a reload loses at most 5 s
  // ambient bridge lines
  const BL = BRIDGE_BY_DAY[day] || BRIDGE_LINES;
  if (d.clockT >= d.nextBridge && d.bIdx < BL.length) {
    const L = BL[d.bIdx++]; S.bridgeLine = L.t; if (L.lingo) hearLingo(L.lingo);
    d.nextBridge = d.clockT + rndi(32, 44); ddSave();
  }
  // walk-ups at the swap station
  if (d.clockT >= d.nextWalk && (day !== 2 || S.map === "floor3" || S.map === "lobby")) {
    const r = rollDay(day);
    const id = r.issues.find((x) => !d.done["spawned_" + x] && !d.done[x]);
    if (id && !visFind((v) => v._vis.kind === "walkup")) { spawnWalkup(id, S.map); d.nextWalk = d.clockT + rndi(45, 70); }
    else d.nextWalk = d.clockT + 6;
    ddSave();
  }
  // scheduled events
  if (d.cool <= 0 && !panelOpen()) {
    const order = Object.entries(d.sched).filter(([, t]) => t >= 0).sort((x, y) => x[1] - y[1]);
    for (const [k, t] of order) {
      if (d.fired[k] || d.clockT < t) continue;
      if (fire(k)) { d.fired[k] = true; d.cool = COOLDOWN; ddSave(); break; }
    }
  }
  // close the window once time is up and nothing is left hanging
  const allFired = Object.entries(d.sched).every(([k, t]) => t < 0 || d.fired[k]);
  if (d.clockT >= WINDOW_LEN && (allFired || d.clockT >= WINDOW_LEN + 30) && !clockPending() && !panelOpen()) closeWindow();
  // safety valve: a walk-up stranded on another floor never holds the window open forever
  else if (d.clockT >= WINDOW_LEN + 150 && !panelOpen() && !act().seActive && !Object.values(d.hot || {}).includes("open")) {
    for (const v of visAll()) if (v._vis.kind === "walkup" || v._vis.kind === "gofind") { d.done[(v._vis.data && v._vis.data.issue && v._vis.data.issue.id) || v.id] = true; visLeave(v, F3_SPOTS.arrive); v._vis.kind = "leaving"; }
    d.pendingGo = null; ddSave();
    if (!clockPending()) closeWindow();
  }
  S.updateProgressUIThrottled && S.updateProgressUIThrottled();
}

function fire(k) {
  const d = DD(), S = CORE.S, day = curDay(), r = rollDay(day);
  const cfg = CLOCK_DAYS[day];
  if (k.startsWith("hot")) { const id = (d.schedHot || [])[+k.slice(3) - 1]; return id ? startHot(id) : true; }
  if (cfg && k === "last10") { chatPost(cfg.lead, cfg.last); return true; }
  if (cfg && k === "final") { chatPost(cfg.lead, cfg.final); hearLingo(day === 8 ? "contain" : "hypercare"); return true; }
  if (k.startsWith("page")) { const id = r.pages[+k.slice(4) - 1]; return id ? firePage(id) : true; }
  if (k.startsWith("log")) { const id = d.schedKnown[+k.slice(3) - 1]; return id ? logIt(id) : true; }
  if (k === "audit") { spawnAuditor(); return true; }
  if (k.startsWith("vendor")) { return vendorWander(); }
  if (k.startsWith("se")) {
    const a = act(); if (a.seActive) return false;
    const id = d.schedSe[k === "se1" ? 0 : 1]; return startSe(id);
  }
  if (k === "secint") {
    S.setFlag("f7Unlocked");
    chatPost("Sofia (SOC)", "Heads up: a real phish is landing mid-cutover. The elevator's unlocked to 7 for you; one ticket needs Help Desk eyes when you can.");
    addNote("security", "\u{1F6A8}", "SOC called Help Desk up to Floor 7: a live phish during the cutover.");
    return true;
  }
  if (k === "last10") { chatPost("Harold", "Last ten users in the queue. Keep them moving, keep them calm."); return true; }
  if (k === "final") { chatPost("Harold", "Final validation starting. Anything weird, log it NOW."); hearLingo("hypercare"); return true; }
  return true;
}

export function clockPending() {
  const a = act();
  if (visFind((v) => v._vis.kind === "walkup" || v._vis.kind === "gofind")) return true;
  if (a.auditor === "coming" || a.auditor === "cited") return true;
  if (a.vendor === "lost") return true;
  if (a.seActive) return true;
  if (Object.values(DD().hot || {}).includes("open")) return true;
  return false;
}

function closeWindow() {
  const d = DD(); const S = CORE.S, day = curDay();
  d.windowClosed = true; S.setFlag("winClosed_" + day); ddSave();
  const cfg = CLOCK_DAYS[day];
  if (cfg) {
    S.bridgeLine = cfg.lead + ": " + cfg.close;
    chatPost(cfg.lead, cfg.close);
    addNote("window", "✅", cfg.closeNote);
    ping("✅", day === 8 ? "Incident contained" : "Window closed", "Finish up and head home for your EOD.");
    S.updateProgressUI();
    return;
  }
  const v = visFind((n) => n.id === "vendor"); if (v) visLeave(v, F3_SPOTS.arrive);
  act().vendor = "gone";
  S.bridgeLine = "Harold: Change successful. Window closed. Hypercare starts tomorrow.";
  hearLingo("hypercare");
  chatPost("Harold", "Window CLOSED. Change successful. Thank you, Help Desk. Log anything weird for tomorrow.");
  addNote("window", "✅", "Change window closed: laptop refresh successful. Hypercare tomorrow.");
  ping("✅", "Window closed", "Change successful. Finish up and head home for your EOD.");
  S.updateProgressUI();
}

// ---- "log it" calls (the damage calls) -----------------------------------------
function logIt(id) {
  const ki = KNOWN_ISSUES.find((k) => k.id === id); if (!ki) return true;
  const S = CORE.S;
  panel("\u{1F4CB} Log it", `${ki.who} · ${ki.area}`, "\u{1F4CB}");
  pAdd(`<p style="margin:0 0 8px;"><b>${esc(ki.who)}</b> catches you in the hall: “${esc(ki.report)}”</p>
    <p>${esc((CLOCK_DAYS[curDay()] || { lead: "Harold" }).lead)} on the bridge: “Anything that isn't the plan goes on the ${curDay() === 8 ? "case log" : "known-issues log"}. Now, not later. Tomorrow we route every one of them.”</p>`);
  const b = pBtn("\u{1F4CB} Add it to the known-issues log", () => {
    const d = DD(); if (!d.known.some((k) => k.id === id)) d.known.push({ id, d: curDay(), routed: false, tries: 0 });
    bump("logged"); ddSave(); hearLingo("known");
    addNote("known", "\u{1F4CB}", `Logged known issue: ${ki.log} (${ki.who}, ${ki.area}).`);
    closePanel(); ping("\u{1F4CB}", "Logged", ki.log);
  });
  setTimeout(() => { try { b.focus(); } catch { /* ignore */ } }, 30);
  return true;
}

// ---- the auditor -----------------------------------------------------------------
function spawnAuditor() {
  const a = act(); if (a.auditor) return;
  a.auditor = "coming";
  const pick = shuffleArr(F3_SPOTS.violations.map((v) => v.id)).slice(0, 3);
  a.viol = pick; ddSave();
  const S = CORE.S;
  visAdd("floor3", { ...AUDITOR, x: F3_SPOTS.arrive.x, y: F3_SPOTS.arrive.y }, { kind: "auditor", target: S.map === "floor3" ? "player" : null });
  chatPost("Karen", "There's a compliance auditor at the elevator on 3 asking for Help Desk. She has a clipboard. A BIG clipboard.");
}
function auditorTalk(n) {
  const a = act(); const S = CORE.S;
  panel(AUDITOR.name, AUDITOR.role, AUDITOR.sprite);
  if (a.auditor === "coming") {
    a.auditor = "cited"; ddSave();
    a.viol.forEach((id) => S.setFlag("aud_" + id));
    pAdd(`<p>“Whitlock, compliance. Changes are when controls slip, so I spot-check during them. Clean-desk walk of your floor: <b>three findings</b>.”</p>
      <ul class="principle-list">${a.viol.map((id) => `<li>${esc(F3_SPOTS.violations.find((v) => v.id === id).label)}</li>`).join("")}</ul>
      <p>“Fix them, then come find me. I'll wait. I'm very good at waiting.”</p>`);
    addNote("audit", "\u{1F4CB}", `Auditor ${AUDITOR.name} cited 3 clean-desk findings on Floor 3.`);
    n._vis.target = null;
    pBtn("On it", closePanel);
    return;
  }
  const left = a.viol.filter((id) => !S.hasFlag("fixed_" + id));
  if (left.length) {
    pAdd(`<p>“Still seeing ${left.length}: ${left.map((id) => esc(F3_SPOTS.violations.find((v) => v.id === id).label)).join("; ")}.”</p>`);
    pBtn("On it", closePanel, "act ghost"); return;
  }
  pAdd(`<p>“Locked screen, no sticky notes, doors latched, paper in the shred bin. That's a clean floor mid-change. Signed.”</p>`);
  pBtn("✍️ Take the sign-off", () => {
    a.auditor = "done"; ddSave(); award("audit"); addRep(2);
    addNote("audit", "✅", "Auditor signed off on the clean-desk walk.");
    closePanel(); visLeave(n, F3_SPOTS.arrive);
  });
}
function fixViolation(p) {
  const S = CORE.S;
  panel("Audit finding", p.room || "Floor 3", "⚠️");
  pAdd(`<p><b>${esc(p.label)}</b></p><div class="banner fact">${esc(VIOLATION_TEXT[p.id] || "")}</div>`);
  pBtn(`✅ ${esc(p.fix)}`, () => {
    S.setFlag("fixed_" + p.id);
    addNote("audit", "\u{1F9F9}", `Fixed audit finding: ${p.label}.`);
    closePanel();
    const a = act(); const left = a.viol.filter((id) => !S.hasFlag("fixed_" + id)).length;
    ping("\u{1F9F9}", left ? `${left} finding${left > 1 ? "s" : ""} left` : "All findings fixed", left ? "" : "Go get Ms. Whitlock's sign-off.");
  });
}

// ---- the escorted vendor -----------------------------------------------------------
function spawnVendor(at) {
  if (visFind((n) => n.id === "vendor")) return;
  visAdd("floor3", { ...VENDOR, x: at.x, y: at.y }, { kind: "vendor", target: null, want: false });
}
function vendorWander() {
  const a = act(); if (a.vendor !== "post") return true;
  const v = visFind((n) => n.id === "vendor"); if (!v) return true;
  const S = CORE.S;
  const spots = F3_SPOTS.hideouts.filter((h) => !(S.map === "floor3" && Math.abs(h.x - S.px) + Math.abs(h.y - S.py) < 3) && !visAll().some((o) => o.x === h.x && o.y === h.y));
  if (!spots.length) return false;
  const i = F3_SPOTS.hideouts.indexOf(spots[Math.floor(Math.random() * spots.length)]);
  const h = F3_SPOTS.hideouts[i];
  v.x = h.x; v.y = h.y; v.rx = h.x * 32; v.ry = h.y * 32; v._vis.path = []; v._vis.target = null; v._vis.want = true;
  a.vendor = "lost"; a.vHide = i; ddSave();
  chatPost("Mo", `Your vendor Dale isn't in the server closet anymore. Visitors are escorted AT ALL TIMES. Last seen near ${h.where}.`);
  return true;
}
function vendorTalk(n) {
  const a = act();
  panel(VENDOR.name, VENDOR.role, VENDOR.sprite);
  if (a.vendor !== "lost") {
    pAdd(`<p>“Just swapping the failed drive in this array. Ten more minutes. You don't have to hover.”</p><p class="set-hint">You do, actually. He's an escorted visitor.</p>`);
    pBtn("Close", closePanel, "act ghost"); return;
  }
  pAdd(`<p>“${esc(VENDOR_LINES[Math.floor(Math.random() * VENDOR_LINES.length)])}”</p><p><b>What do you do?</b></p>`);
  judgment([
    ["Walk him back to the server closet and stay with him. Visitors are escorted the whole time they're on the floor.", 2, "He's back at the rack in a minute. You stay until the drive's swapped. That's what escort means."],
    ["Point him back toward the server closet and let him find his own way.", 1, "He'll probably get there. Probably. An escort who isn't there isn't an escort."],
    ["He's been doing this twenty years, let him wander.", 0, "Experience isn't authorization. An unescorted visitor near Accounting mid-change is an audit finding."]
  ], (score) => {
    bump("vendor"); if (score === 2) award("escort");
    addRep(score === 2 ? 1 : score === 1 ? 0 : -1);
    addNote("vendor", "\u{1F9ED}", `Found vendor Dale near ${F3_SPOTS.hideouts[a.vHide] ? F3_SPOTS.hideouts[a.vHide].where : "the floor"} and ${score === 2 ? "escorted him back" : "sent him back"}.`);
    a.vendor = "post"; n._vis.want = false; n._vis.target = F3_SPOTS.vendorPost; ddSave();
    pBtn("Close", closePanel);
  });
}

// ---- the social engineer -----------------------------------------------------------
function startSe(id) {
  const se = SOCENG.find((x) => x.id === id); if (!se) return true;
  const a = act(); const S = CORE.S;
  if (se.phone) {
    if (panelOpen()) return false;
    a.seActive = id; ddSave(); openSe(se, null); return true;
  }
  a.seActive = id; ddSave();
  spawnSe(se);
  const SE_CHAT = {
    se_isp: ["Lou", "Guy at my desk says he's from your internet provider. Wants the network closet. Can Help Desk come down?"],
    se_fakeit: ["Karen", "Someone at Reception says he's IT and he's asking me for my phone code?? Is that you guys?"],
    se2_cable: ["Karen", "A guy in a cabling polo wants into the server room. Says Sam sent him. Is that right?"],
    se3_legal: ["Sofia", "Some guy from 'Legal' is at the SOC door asking for the forensic image. Can you handle it?"]
  }[se.id] || ["Karen", "There's someone here asking for IT. Can you come?"];
  chatPost(SE_CHAT[0], SE_CHAT[1]);
  return true;
}
function spawnSe(se) {
  if (visFind((n) => n.id === "se_" + se.id)) return;
  const at = se.map === "lobby" ? { x: 8, y: 6 } : se.map === "floor7" ? { x: 8, y: 5 } : { x: 12, y: 5 };
  visAdd(se.map, { id: "se_" + se.id, name: se.name, role: se.sub, x: at.x, y: at.y, sprite: SE_SPRITE }, { kind: "soceng", data: { se: se.id }, target: null });
}
function openSe(se, n) {
  panel(se.phone ? "\u{1F4DE} Incoming call" : se.name, se.sub, se.phone ? "\u{1F4DE}" : SE_SPRITE);
  pAdd(se.lines.map((l) => `<p style="margin:0 0 6px;">“${esc(l)}”</p>`).join("") + `<p><b>“${esc(se.ask)}”</b></p>`);
  judgment(se.opts, (score, opt) => {
    const a = act(); a.seActive = null; a.se.push(se.id); ddSave();
    bump("se"); if (score === 2) award("verify");
    addRep(score === 2 ? 2 : score === 1 ? 0 : -2);
    addNote("soceng", "\u{1F6E1}️", `Social-engineering attempt (${se.name}): ${score === 2 ? "verified through a known channel and shut it down." : score === 1 ? "stopped it, but didn't report/verify properly." : "fell for it; Security is now involved."}`);
    const rec = recordWork("security", se.id, "Social-engineering attempt: " + se.name, se.name, se.lines[se.lines.length - 1], opt[0]);
    docPrompt(pAdd(""), rec, () => { if (n) visLeave(n, se.map === "lobby" ? LOBBY_SPOTS.socEntry : F3_SPOTS.arrive); });
  });
}

// ---- dispatch hooks (called by days.js) --------------------------------------------
// ---- hotspots: something breaks somewhere; go there and fix it -----------------------
function hotOpen() { const h = DD().hot || {}; return HOTSPOTS.filter((x) => h[x.id] === "open"); }
function hotFor(map, id) { return hotOpen().find((x) => x.at.map === map && x.at.id === id) || null; }
function startHot(id) {
  const h = HOTSPOTS.find((x) => x.id === id); if (!h) return true;
  const d = DD(); d.hot = d.hot || {}; if (d.hot[id]) return true;
  d.hot[id] = "open"; CORE.S.setFlag("hot_" + id); ddSave();
  chatPost(h.who, h.alert);
  CORE.sfx && CORE.sfx("page");
  ping("\u{1F6A8}", h.title, h.where);
  CORE.S.updateProgressUI();
  return true;
}
function hotTalk(h) {
  panel("\u{1F6A8} " + h.title, h.where, "\u{1F6A8}");
  pAdd(h.lines.map((l) => `<p style="margin:0 0 6px;">${esc(l)}</p>`).join("") + taughtChip(h.id === "printer" ? "printer_hs" : h.id) + `<p><b>${esc(h.ask)}</b></p>`);
  judgment(h.opts, (score, opt) => {
    const d = DD(); d.hot[h.id] = "done"; CORE.S.setFlag("hotdone_" + h.id); ddSave();
    bump("hot"); if (score === 2) bump("hotBest");
    addRep(score === 2 ? 2 : score === 1 ? 0 : -2);
    if (h.id === "loop" && score === 2) award("loop");
    addNote("hotspot", "\u{1F6A8}", `${h.title} (${h.where}): ${score === 2 ? "fixed it the right way." : score === 1 ? "got it working, not cleanly." : "made it worse; the bridge had to step in."}`);
    if (score === 2) hearLingo({ loop: "stp", ap: "poe", printer: "trunk", beacon: "edr", purge: "ioc", spray: "contain" }[h.id]);
    const rec = recordWork("hotspot", h.id, h.title, h.who, h.alert, opt[0]);
    docPrompt(pAdd(""), rec);
  }, "hotspot");
}

export function clockNpc(n) {
  if (clockActive()) { const h = hotFor(CORE.S.map, n.id); if (h) { hotTalk(h); return true; } }
  if (n.id === "auditor") { auditorTalk(n); return true; }
  if (n.id === "vendor") { vendorTalk(n); return true; }
  if (n.id && n.id.startsWith("se_") && n._vis) { const se = SOCENG.find((x) => "se_" + x.id === n.id); if (se) { openSe(se, n); return true; } }
  return false;
}
export function clockProp(p) {
  if (clockActive()) { const h = hotFor(CORE.S.map, p.id); if (h) { hotTalk(h); return true; } }
  if (p.kind === "violation") { fixViolation(p); return true; }
  return false;
}

export function clockNextUp() {
  const day = curDay();
  if (!isClockDay(day)) return null;
  const a = act(), S = CORE.S;
  const r = (map, id, text, sub) => resolveRoute({ map, id, text, sub });
  if (day !== 2) {
    if (a.seActive) {
      const se = SOCENG.find((x) => x.id === a.seActive);
      if (se && !se.phone) return r(se.map, "se_" + se.id, se.map === "floor7" ? "Someone at the SOC door wants the evidence" : "A stranger at Reception wants the server room", "Handle it now");
    }
    const hs = hotOpen();
    if (hs.length) {
      const here = hs.find((h) => h.at.map === S.map) || hs[0];
      return r(here.at.map, here.at.id, "\u{1F6A8} " + here.title, here.where);
    }
    return null;
  }
  if (a.seActive) {
    const se = SOCENG.find((x) => x.id === a.seActive);
    if (se && !se.phone) return r(se.map, "se_" + se.id, se.map === "lobby" ? "A stranger at Lou's desk wants the network closet" : "Someone at Reception is asking for MFA codes", "Handle it now");
  }
  if (a.vendor === "lost") { const h = F3_SPOTS.hideouts[a.vHide]; return r("floor3", "vendor", "Find Dale, your escorted vendor", "Last seen near " + (h ? h.where : "the floor")); }
  if (a.auditor === "coming") return r("floor3", "auditor", "The auditor wants Help Desk", "Ms. Whitlock · Floor 3");
  if (a.auditor === "cited") {
    const left = a.viol.filter((id) => !S.hasFlag("fixed_" + id));
    if (left.length) {
      let best = left[0];
      if (S.map === "floor3") best = left.slice().sort((x, y) => { const X = F3_SPOTS.violations.find((v) => v.id === x), Y = F3_SPOTS.violations.find((v) => v.id === y); return (Math.abs(X.x - S.px) + Math.abs(X.y - S.py)) - (Math.abs(Y.x - S.px) + Math.abs(Y.y - S.py)); })[0];
      return r("floor3", best, `Fix the auditor's findings (${3 - left.length}/3)`, F3_SPOTS.violations.find((v) => v.id === best).label);
    }
    return r("floor3", "auditor", "Get Ms. Whitlock's sign-off", "All findings fixed");
  }
  return null;
}

// ---- reload + day change ------------------------------------------------------------
export function clockRestore() {
  if (!clockActive()) return;
  const a = act();
  if (curDay() !== 2) {
    if (a.seActive) { const se = SOCENG.find((x) => x.id === a.seActive); if (se && !se.phone) spawnSe(se); else a.seActive = null; }
    return;
  }
  if (a.vendor === "post" || a.vendor === "lost") spawnVendor(a.vendor === "lost" && F3_SPOTS.hideouts[a.vHide] ? F3_SPOTS.hideouts[a.vHide] : F3_SPOTS.vendorPost);
  if (a.vendor === "lost") { const v = visFind((n) => n.id === "vendor"); if (v) v._vis.want = true; }
  if (a.auditor === "coming" || a.auditor === "cited") visAdd("floor3", { ...AUDITOR, x: 13, y: 6 }, { kind: "auditor", target: a.auditor === "coming" ? "player" : null });
  if (a.seActive) { const se = SOCENG.find((x) => x.id === a.seActive); if (se && !se.phone) spawnSe(se); else a.seActive = null; }
}
export function clockReset() { /* visitors are cleared by advanceDay; Day 2 data stays for the score */ }
