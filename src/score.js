// v2 score: the arcade FINAL SCORE (line items slide in, letter grade),
// three-letter initials, and the top-10 board on the title screen.
//
// The board lives under its OWN localStorage key (outside the it-game: save
// prefix), so New Playthrough and Full Reset never wipe it.

import { CORE, DD, ddSave, WEEKS, LAST_DAY } from "./core.js";
import { SCENARIOS } from "./scenarios.js";
import { SIDE_QUESTS } from "./sideQuests.js";
import { FINDTOTAL } from "./collectables.js";
import { tasksFor } from "./days.js";
import { docStats } from "./ledger.js";
import { loadNum } from "./storage.js";

export const HS_KEY = "itgame_hiscores";
export function loadHS() { try { return JSON.parse(localStorage.getItem(HS_KEY) || "[]"); } catch { return window.__itgHS || []; } }
export function saveHS(a) { window.__itgHS = a; try { localStorage.setItem(HS_KEY, JSON.stringify(a)); } catch { /* ignore */ } }

// Grade cutoffs per week (calibrated with the headless bot; see the handoff).
export const GRADES_BY_WEEK = {
  1: [["S", 9300], ["A", 7800], ["B", 6300], ["C", 4600], ["D", 0]],
  2: [["S", 7000], ["A", 6000], ["B", 5000], ["C", 3800], ["D", 0]],
  3: [["S", 6200], ["A", 5300], ["B", 4500], ["C", 3400], ["D", 0]]
};
export const GRADES = GRADES_BY_WEEK[1];
export const CAREER_GRADES = ["S", "A", "B", "C", "D"].map((g, i) => [g, [1, 2, 3].reduce((a, w) => a + GRADES_BY_WEEK[w][i][1], 0)]);

function quizRow(add, w) {
  const q = DD().quiz && DD().quiz[w];
  if (q) add(`${WEEKS[w].bossName}'s training quiz`, `${q.first}/${q.total} first try`, q.first * 60);
}

export function finalScore(w = 1) {
  if (w !== 1) return weekScore(w);
  const S = CORE.S, d = DD();
  const R = []; const add = (label, detail, pts) => { if (pts) R.push([label, detail, Math.round(pts)]); };
  const all = [1, 2, 3].flatMap((day) => tasksFor(day));
  const tDone = all.filter((t) => t.done()).length;
  add("Day tasks completed", `${tDone} of ${all.length}`, tDone * 100);
  add("Tasks left undone", `${all.length - tDone}`, -(all.length - tDone) * 75);
  const f3 = Object.keys(SCENARIOS).filter((id) => (SCENARIOS[id].floor || "floor3") === "floor3");
  const tickets = f3.filter((id) => S.solved.has(id)).length + (S.solved.has("phish-ir") && d.solvedOn && d.solvedOn["phish-ir"] <= 3 ? 1 : 0);
  add("Tickets solved", `${tickets} of ${f3.length}`, tickets * 100);
  add("Side quests & field calls", `${S.sqSolved.size} of ${Object.keys(SIDE_QUESTS).length}`, S.sqSolved.size * 50);
  const best = d.st.best || 0, heard = d.st.heard || 0;
  add("Walk-ups: nailed it", `${best}`, best * 75);
  add("Walk-ups: heard out", `${Math.max(0, heard - best)}`, Math.max(0, heard - best) * 25);
  add("Pages answered", `${d.st.pages || 0}`, (d.st.pages || 0) * 40);
  add("Known issues logged", `${d.st.logged || 0}`, (d.st.logged || 0) * 50);
  if (d.act && d.act.auditor === "done") add("Auditor signed off", "clean-desk walk", 200);
  add("Vendor escorted back", `${d.st.vendor || 0}`, (d.st.vendor || 0) * 100);
  add("Social engineers stopped", `${d.st.se || 0}`, (d.st.se || 0) * 100);
  const so = ["ed", "karen", "riley"].filter((id) => S.hasFlag("signoff_" + id)).length;
  add("Business sign-offs", `${so} of 3`, so * 150);
  const ds = docStats();
  add("Work documented", `${ds.documented} of ${ds.total}`, ds.documented * 40);
  add("Closed without notes", `${ds.undocumented}`, -ds.undocumented * 60);
  const pur = d.purchases.filter((p) => p.pay === "card");
  const got = pur.filter((p) => p.rcpt).length, miss = pur.length - got;
  add("Receipts kept", `${got} of ${pur.length}`, got * 40);
  add("Receipts forgotten", `${miss}`, -miss * 60);
  const caged = (d.caged || []).length;
  add("Devices into custody", `${caged} of 8`, caged * 15);
  if (S.day >= 3) add("Devices missed", `${8 - caged}`, -(8 - caged) * 25);
  add("Keepsakes found", `${S.finds.size} of ${FINDTOTAL}`, S.finds.size * 25);
  add("Badges earned", `${d.badges.length}`, d.badges.length * 40);
  add("Reputation", `⭐ ${d.rep}`, d.rep * 10);
  const acc = d.st.asked ? d.st.first / d.st.asked : 0;
  add("First-try accuracy", `${Math.round(acc * 100)}%`, acc * 500);
  add("Wrong answers", `${d.st.wrong || 0}`, -(d.st.wrong || 0) * 20);
  add("Lifelines used", `${d.st.lifelines || 0}`, -(d.st.lifelines || 0) * 50);
  quizRow(add, 1);
  const qb = loadNum("quiz-best-floor3", 0);
  add("Practice exam best", `${qb}/5`, (qb / 5) * 300);
  const total = Math.max(0, R.reduce((a, r) => a + r[2], 0));
  const grade = GRADES.find(([, min]) => total >= min)[0];
  return { rows: R, total, grade };
}

// Weeks 2 and 3: the same habits, scored from this week's work only.
function weekScore(w) {
  const S = CORE.S, d = DD(), W = WEEKS[w], ws = d.weekStart || { rep: 5, badges: 0, finds: 0 };
  const R = []; const add = (label, detail, pts) => { if (pts) R.push([label, detail, Math.round(pts)]); };
  const all = W.days.flatMap((day) => tasksFor(day));
  const tDone = all.filter((t) => t.done()).length;
  add("Tasks completed", `${tDone} of ${all.length}`, tDone * 100);
  add("Tasks left undone", `${all.length - tDone}`, -(all.length - tDone) * 75);
  const floor = W.base;
  const ids = Object.keys(SCENARIOS).filter((id) => (SCENARIOS[id].floor || "floor3") === floor);
  const tickets = ids.filter((id) => S.solved.has(id)).length;
  add("Tickets solved", `${tickets} of ${ids.length}`, tickets * 100);
  const best = d.st.best || 0, heard = d.st.heard || 0;
  add("Walk-ups: nailed it", `${best}`, best * 75);
  add("Walk-ups: heard out", `${Math.max(0, heard - best)}`, Math.max(0, heard - best) * 25);
  add("Pages answered", `${d.st.pages || 0}`, (d.st.pages || 0) * 40);
  add(w === 3 ? "Case-log entries" : "Known issues logged", `${d.st.logged || 0}`, (d.st.logged || 0) * 50);
  add("Hotspots fixed right", `${d.st.hotBest || 0} of ${d.st.hot || 0}`, (d.st.hotBest || 0) * 120 + Math.max(0, (d.st.hot || 0) - (d.st.hotBest || 0)) * 30);
  add("Social engineers stopped", `${d.st.se || 0}`, (d.st.se || 0) * 100);
  if (w === 2) { const so = ["karen", "ed", "riley"].filter((id) => S.hasFlag("so2_" + id)).length; add("Business sign-offs", `${so} of 3`, so * 150); }
  const docs = d.docs.filter((x) => W.days.includes(x.d));
  const doc = docs.filter((x) => x.documented).length;
  add("Work documented", `${doc} of ${docs.length}`, doc * 40);
  add("Closed without notes", `${docs.length - doc}`, -(docs.length - doc) * 60);
  const fnd = Math.max(0, S.finds.size - (ws.finds || 0));
  add("Keepsakes found", `${fnd}`, fnd * 25);
  const bd = Math.max(0, d.badges.length - (ws.badges || 0));
  add("Badges earned", `${bd}`, bd * 40);
  const rep = d.rep - (ws.rep || 0);
  add("Reputation earned", `⭐ ${rep >= 0 ? "+" : ""}${rep}`, rep * 10);
  const acc = d.st.asked ? d.st.first / d.st.asked : 0;
  add("First-try accuracy", `${Math.round(acc * 100)}%`, acc * 500);
  add("Wrong answers", `${d.st.wrong || 0}`, -(d.st.wrong || 0) * 20);
  add("Lifelines used", `${d.st.lifelines || 0}`, -(d.st.lifelines || 0) * 50);
  quizRow(add, w);
  const qb = loadNum("quiz-best-" + floor, 0);
  add("Practice exam best", `${qb}/5`, (qb / 5) * 300);
  const total = Math.max(0, R.reduce((a, r) => a + r[2], 0));
  const grade = GRADES_BY_WEEK[w].find(([, min]) => total >= min)[0];
  return { rows: R, total, grade };
}

// Freeze a week's score when it ends (at the party).
export function archiveWeek(w) {
  const d = DD(); if (d.weeks[w]) return d.weeks[w];
  const F = finalScore(w);
  d.weeks[w] = { total: F.total, grade: F.grade, rows: F.rows, title: WEEKS[w].title, role: WEEKS[w].role };
  ddSave();
  return d.weeks[w];
}

export function careerScore() {
  const d = DD();
  const rows = [1, 2, 3].filter((w) => d.weeks[w]).map((w) => [`Week ${w} · ${WEEKS[w].title}`, `${WEEKS[w].role} · grade ${d.weeks[w].grade}`, d.weeks[w].total]);
  if ([1, 2, 3].every((w) => d.weeks[w])) rows.push(["Climbed the whole ladder", "help desk → network → security", 500]);
  const total = rows.reduce((a, r) => a + r[2], 0);
  const grade = CAREER_GRADES.find(([, min]) => total >= min)[0];
  return { rows, total, grade };
}

// End of weeks 1 and 2: the report card and the promotion.
export function showWeekReport(w, onDone) {
  const S = CORE.S, d = DD();
  const A = document.getElementById("arcade"); if (!A) { if (onDone) onDone(); return; }
  const F = d.weeks[w] || archiveWeek(w);
  const nw = WEEKS[w + 1];
  S.overlay = true; A.hidden = false;
  A.innerHTML = `<div class="ar-box"><div class="ar-h">WEEK ${w} REPORT</div><div class="ar-sub">${esc2(WEEKS[w].title)} · ${esc2(WEEKS[w].role)} · ${esc2(S.playerName || "You")}</div>
    <div class="ar-rows">${F.rows.map((r) => `<div class="r${r[2] < 0 ? " neg" : ""}"><span>${esc2(r[0])} <span class="ar-d">· ${esc2(r[1])}</span></span><span>${r[2] > 0 ? "+" : ""}${r[2].toLocaleString()}</span></div>`).join("")}</div>
    <div class="ar-total" id="ar-total">0</div><div class="ar-grade">GRADE ${F.grade}</div><div id="ar-bottom"></div></div>`;
  const rows = [...A.querySelectorAll(".ar-rows .r")];
  rows.forEach((r, i) => setTimeout(() => { r.classList.add("in"); CORE.sfx && CORE.sfx("tick"); }, 90 * i));
  const tot = A.querySelector("#ar-total"); const t0 = performance.now(), dur = Math.min(2400, 300 + rows.length * 90);
  const step = (n) => { const k = Math.min(1, (n - t0) / dur); tot.textContent = Math.round(F.total * k).toLocaleString(); if (k < 1) requestAnimationFrame(step); else bottom(); };
  requestAnimationFrame(step);
  function bottom() {
    const B = A.querySelector("#ar-bottom");
    B.innerHTML = `<div class="promo"><div class="promo-k">PROMOTED</div><div class="promo-r">${esc2(nw.role)}</div>
      <div class="promo-s">${esc2(nw.title)} starts Monday · ${esc2(nw.bossName)}, ${esc2(nw.bossRole)} · ${nw.base === "floor5" ? "Floor 5" : "Floor 7"}</div>
      <div class="ladder">${[1, 2, 3].map((k) => `<span class="${k <= w ? "done" : k === w + 1 ? "next" : ""}">${esc2(WEEKS[k].short)}</span>`).join("<i>›</i>")}</div></div>
      <button class="ar-btn" id="ar-back">\u{1F37B} Back to the party</button>`;
    CORE.sfx && CORE.sfx("win");
    const close = () => { window.removeEventListener("keydown", key, true); A.hidden = true; S.overlay = false; S.updateProgressUI(); if (onDone) onDone(); };
    const key = (e) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } };
    window.addEventListener("keydown", key, true);
    B.querySelector("#ar-back").onclick = close;
  }
}

export function hsTable(highlight, limit = 10) {
  const a = loadHS().slice(0, limit);
  if (!a.length) return `<div class="hs-empty">No scores yet. Be the first!</div>`;
  return a.map((e, i) => `<div class="hs-row${highlight && e.t === highlight ? " me" : ""}"><span class="r">${i + 1}.</span><b>${esc2(e.i)}</b><span class="hs-ch">${esc2(e.ch)} · ${esc2(e.g)}</span><span class="n">${Number(e.s).toLocaleString()}</span></div>`).join("");
}
function esc2(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

export function rollCredits() {
  const S = CORE.S; const c = document.getElementById("credits"); if (!c) { showArcade(); return; }
  S.overlay = true;
  c.hidden = false;
  c.innerHTML = `<div class="cr-roll">
    <div class="cr-h">THE TICKET QUEUE</div><div class="cr-s">THE LADDER</div>
    <p>Starring<br><b>${esc2(S.playerName || "You")}</b><br>as Tier 1 tech, then network tech, then security analyst</p>
    <p><b>Cutover Week</b><br>Tasha · Help Desk Lead<br>Harold · Change Manager<br>Benny · Service Desk Coordinator<br>Kai · IT intern</p>
    <p><b>Network Week</b><br>Rosa · Network Lead<br>Hiro · Senior Network Engineer<br>Abby · NOC<br>Wade · Wireless<br>Sam · Cabling (both ends)</p>
    <p><b>SOC Week</b><br>Omar · Incident Response Lead<br>Sofia · Nadia · Tomas · Grace · Bex · Wes</p>
    <p>Director Chen · Gloria · Lou · Mo · Ray · Nico<br>Karen · Marcus · Priya · Dana · Jordan · Riley · Ed · Lisa · Luis<br>Mittens · herself</p>
    <p>No laptops were harmed.<br>Eight laptops and two switches were responsibly destroyed.<br>One attacker was contained in under an hour.</p>
    <p class="cr-next">Thanks for playing.</p>
    <p class="cr-tap">tap or press Enter</p></div>`;
  const done = () => { window.removeEventListener("keydown", key, true); c.hidden = true; S.overlay = false; S.setDay(LAST_DAY + 1); S.updateProgressUI(); showArcade(); };
  const key = (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(); } };
  c.onclick = done;
  window.addEventListener("keydown", key, true);
}

export function showArcade() {
  const S = CORE.S, d = DD();
  const A = document.getElementById("arcade"); if (!A) return;
  const F = careerScore();
  S.overlay = true;
  A.hidden = false;
  const submitted = S.hasFlag("scoreSubmitted");
  A.innerHTML = `<div class="ar-box"><div class="ar-h">CAREER SCORE</div><div class="ar-sub">Help Desk → Network → Security · ${esc2(S.playerName || "You")}</div>
    <div class="ar-rows">${F.rows.map((r) => `<div class="r${r[2] < 0 ? " neg" : ""}"><span>${esc2(r[0])} <span class="ar-d">· ${esc2(r[1])}</span></span><span>${r[2] > 0 ? "+" : ""}${r[2].toLocaleString()}</span></div>`).join("")}</div>
    <div class="ar-total" id="ar-total">0</div><div class="ar-grade">GRADE ${F.grade}</div><div id="ar-bottom"></div></div>`;
  const rows = [...A.querySelectorAll(".ar-rows .r")];
  rows.forEach((r, i) => setTimeout(() => { r.classList.add("in"); CORE.sfx && CORE.sfx("tick"); }, 90 * i));
  const tot = A.querySelector("#ar-total"); const t0 = performance.now(), dur = Math.min(2400, 300 + rows.length * 90);
  const step = (n) => { const k = Math.min(1, (n - t0) / dur); tot.textContent = Math.round(F.total * k).toLocaleString(); if (k < 1) requestAnimationFrame(step); else bottom(); };
  requestAnimationFrame(step);
  function bottom() {
    const B = A.querySelector("#ar-bottom");
    if (submitted) { B.innerHTML = `<div class="hs"><h3>HIGH SCORES</h3>${hsTable(d.hsT)}</div><button class="ar-btn" id="ar-back">\u{1F37B} Back to the party</button>`; wire(); return; }
    const ini = ["A", "A", "A"]; let cur = 0;
    B.innerHTML = `<div class="ar-sub" style="color:#ffce3a">ENTER YOUR INITIALS</div>
      <div class="ini">${[0, 1, 2].map((i) => `<div class="slot" data-i="${i}"><button data-u="${i}">▲</button><div class="ch">A</div><button data-d="${i}">▼</button></div>`).join("")}</div>
      <div class="ar-hint">Type letters, or ↑↓ to change · ←→ to move · Enter to save</div><button class="ar-btn" id="ar-save">SAVE SCORE</button>`;
    const paint = () => B.querySelectorAll(".slot").forEach((s, i) => { s.querySelector(".ch").textContent = ini[i]; s.classList.toggle("cur", i === cur); });
    const bumpL = (i, dd) => { ini[i] = String.fromCharCode((ini[i].charCodeAt(0) - 65 + dd + 26) % 26 + 65); cur = i; paint(); };
    B.querySelectorAll("[data-u]").forEach((b) => b.onclick = () => bumpL(+b.dataset.u, 1));
    B.querySelectorAll("[data-d]").forEach((b) => b.onclick = () => bumpL(+b.dataset.d, -1));
    B.querySelectorAll(".slot .ch").forEach((c, i) => c.onclick = () => { cur = i; paint(); });
    paint();
    const save = () => {
      window.removeEventListener("keydown", key, true);
      const t = Date.now(); const a = loadHS();
      const initials = ini.join("").replace(/[^A-Z]/g, "A").slice(0, 3);
      a.push({ i: initials, s: F.total, g: F.grade, ch: S.playerName || "Tech", t, d: new Date().toISOString().slice(0, 10) });
      a.sort((x, y) => y.s - x.s); saveHS(a.slice(0, 50));
      d.hsT = t; ddSave(); S.setFlag("scoreSubmitted");
      const rank = a.findIndex((e) => e.t === t) + 1;
      B.innerHTML = `<div class="ar-sub" style="color:#5fd08a">${rank <= 10 ? `YOU'RE #${rank} ON THE BOARD!` : `SAVED · RANK #${rank}`}</div><div class="hs"><h3>HIGH SCORES</h3>${hsTable(t)}</div><button class="ar-btn" id="ar-back">\u{1F37B} Back to the party</button>`;
      CORE.sfx && CORE.sfx("win");
      wire();
    };
    const key = (e) => {
      if (A.hidden) return; const k = e.key;
      if (/^[a-zA-Z]$/.test(k)) { ini[cur] = k.toUpperCase(); cur = Math.min(2, cur + 1); paint(); }
      else if (k === "ArrowUp") bumpL(cur, 1); else if (k === "ArrowDown") bumpL(cur, -1);
      else if (k === "ArrowLeft") { cur = Math.max(0, cur - 1); paint(); } else if (k === "ArrowRight") { cur = Math.min(2, cur + 1); paint(); }
      else if (k === "Backspace") { cur = Math.max(0, cur - 1); paint(); } else if (k === "Enter") save(); else return;
      e.preventDefault(); e.stopPropagation();
    };
    window.addEventListener("keydown", key, true);
    B.querySelector("#ar-save").onclick = save;
  }
  function wire() { const b = A.querySelector("#ar-back"); if (b) b.onclick = () => { A.hidden = true; S.overlay = false; }; }
}
