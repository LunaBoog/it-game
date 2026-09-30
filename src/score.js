// v2 score: the arcade FINAL SCORE (line items slide in, letter grade),
// three-letter initials, and the top-10 board on the title screen.
//
// The board lives under its OWN localStorage key (outside the it-game: save
// prefix), so New Playthrough and Full Reset never wipe it.

import { CORE, DD, ddSave } from "./core.js";
import { SCENARIOS } from "./scenarios.js";
import { SIDE_QUESTS } from "./sideQuests.js";
import { FINDTOTAL } from "./collectables.js";
import { tasksFor } from "./days.js";
import { docStats } from "./ledger.js";
import { loadNum } from "./storage.js";

export const HS_KEY = "itgame_hiscores";
export function loadHS() { try { return JSON.parse(localStorage.getItem(HS_KEY) || "[]"); } catch { return window.__itgHS || []; } }
export function saveHS(a) { window.__itgHS = a; try { localStorage.setItem(HS_KEY, JSON.stringify(a)); } catch { /* ignore */ } }

// Grade cutoffs (calibrated with the headless bot; see the handoff).
export const GRADES = [["S", 9300], ["A", 7800], ["B", 6300], ["C", 4600], ["D", 0]];

export function finalScore() {
  const S = CORE.S, d = DD();
  const R = []; const add = (label, detail, pts) => { if (pts) R.push([label, detail, Math.round(pts)]); };
  const all = [1, 2, 3].flatMap((day) => tasksFor(day));
  const tDone = all.filter((t) => t.done()).length;
  add("Day tasks completed", `${tDone} of ${all.length}`, tDone * 100);
  add("Tasks left undone", `${all.length - tDone}`, -(all.length - tDone) * 75);
  const tickets = Object.keys(SCENARIOS).filter((id) => S.solved.has(id)).length;
  add("Tickets solved", `${tickets} of ${Object.keys(SCENARIOS).length}`, tickets * 100);
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
  const qb = Math.max(loadNum("quiz-best-floor3", 0), loadNum("quiz-best-floor7", 0));
  add("Practice exam best", `${qb}/5`, (qb / 5) * 300);
  const total = Math.max(0, R.reduce((a, r) => a + r[2], 0));
  const grade = GRADES.find(([, min]) => total >= min)[0];
  return { rows: R, total, grade };
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
    <div class="cr-h">THE TICKET QUEUE</div><div class="cr-s">CUTOVER WEEK</div>
    <p>Starring<br><b>${esc2(S.playerName || "You")}</b><br>as the new Tier 1 tech</p>
    <p>Tasha · Help Desk Lead<br>Director Chen · IT Director<br>Harold · Change Manager<br>Benny · Service Desk Coordinator<br>Gloria · Service Desk Manager<br>Kai · IT intern<br>Lou · Building security<br>Mo · IT storeroom<br>Ray · Byte Bodega<br>Mittens · herself</p>
    <p>Karen · Marcus · Priya · Dana · Jordan · Riley · Ed · Lisa<br>and everyone on Floor 7</p>
    <p>No laptops were harmed.<br>Eight were responsibly destroyed.</p>
    <p class="cr-next">Coming soon: <b>SOC WEEK</b> · Floor 7</p>
    <p class="cr-tap">tap or press Enter</p></div>`;
  const done = () => { window.removeEventListener("keydown", key, true); c.hidden = true; S.overlay = false; S.setDay(4); S.updateProgressUI(); showArcade(); };
  const key = (e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done(); } };
  c.onclick = done;
  window.addEventListener("keydown", key, true);
}

export function showArcade() {
  const S = CORE.S, d = DD();
  const A = document.getElementById("arcade"); if (!A) return;
  const F = finalScore();
  S.overlay = true;
  A.hidden = false;
  const submitted = S.hasFlag("scoreSubmitted");
  A.innerHTML = `<div class="ar-box"><div class="ar-h">FINAL SCORE</div><div class="ar-sub">Cutover Week · ${esc2(S.playerName || "You")}</div>
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
