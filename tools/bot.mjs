// Headless full-arc playthrough bot for The Ticket Queue: Cutover Week.
//
//   npm i -D playwright     (once; or use any Playwright install)
//   node tools/build-standalone.mjs && node tools/bot.mjs [thorough|tasks] [--shots]
//
// "tasks"    = does every day task and answers every interrupt, but skips side
//              content: no extra tickets, no side quests, no work notes, no
//              receipts, lies to Gloria. This is the score-calibration floor (~C).
// "thorough" = everything: every ticket first try, work notes, receipts, side
//              quests, the cat, both floors, honest audit.
//
// The bot teleports next to whatever the NEXT UP card points at and presses E,
// then answers panels using the "best" answers parsed out of src/ (every
// option tagged score 2). It fails on ANY page error.

import { chromium } from "playwright";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MODE = process.argv[2] || "thorough";
const SHOTS = process.argv.includes("--shots");
const SHOTDIR = process.env.SHOTDIR || "/tmp";

// ---- knowledge: best answers + real tick items, parsed from source ----------
function decode(s) { s = s.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16))); return JSON.parse('"' + s + '"'); }
const best = new Set(), real = new Set();
for (const f of readdirSync(join(root, "src")).filter((x) => x.endsWith(".js"))) {
  const src = readFileSync(join(root, "src", f), "utf8");
  for (const m of src.matchAll(/\[\s*"((?:[^"\\]|\\.)*)",\s*2[,\]]/g)) best.add(decode(m[1]));
  for (const m of src.matchAll(/t: "((?:[^"\\]|\\.)*)", real: true/g)) real.add(decode(m[1]));
}
const scen = await import(join(root, "src", "scenarios.js"));
const pools = await import(join(root, "src", "pools.js"));
const quiz = await import(join(root, "src", "quiz.js"));
const correctDx = {}; for (const [id, s] of Object.entries(scen.SCENARIOS)) correctDx[id] = s.diagnoses.find((d) => d.correct).label;
const kiGroup = {}; for (const k of pools.KNOWN_ISSUES) kiGroup[k.log] = k.group;
const quizBest = new Set(quiz.QUESTIONS.map((q) => q.options.find((o) => o.correct).t));
const sqBest = new Set();
{ const sq = await import(join(root, "src", "sideQuests.js")); for (const q of Object.values(sq.SIDE_QUESTS)) sqBest.add(q.options.find((o) => o.correct).label); }

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 860) } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message + "\n" + (e.stack || "")));
page.on("console", (m) => { if (m.type() === "error" && !/ERR_FILE_NOT_FOUND|Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
await page.goto(process.env.URL || ("file://" + join(root, "standalone.html")));
await page.waitForFunction(() => window.__tq && window.__tq.interact, null, { timeout: 10000 });
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
await page.reload();
await page.waitForFunction(() => window.__tq && window.__tq.interact, null, { timeout: 10000 });
await page.waitForTimeout(400);

const K = { best: [...best], real: [...real], correctDx, kiGroup, quizBest: [...quizBest], sqBest: [...sqBest], mode: MODE };
await page.evaluate((k) => { window.__K = k; }, K);

let shot = 0;
async function snap(tag) { if (SHOTS) await page.screenshot({ path: `${SHOTDIR}/bot-${String(++shot).padStart(2, "0")}-${tag}.png` }); }

// ---- in-page helpers ----------------------------------------------------------
async function injectHelpers() {
await page.evaluate(() => {
  const T = window.__tq, S = T.S;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  window.__bot = {
    panelOpen: () => !document.getElementById("modal-bg").hidden,
    overlay: () => S.overlay,
    // stand next to (x,y) facing it, then press E
    faceAt(x, y) {
      for (const [d, [dx, dy]] of Object.entries(DIRS)) {
        const sx = x - dx, sy = y - dy;
        if (sx < 0 || sy < 0 || sx >= 30 || sy >= 22) continue;
        const row = T.CORE.S && S.map;
        // walkable + unoccupied?
        const mapRows = window.__mapRows();
        const ch = mapRows[sy][sx];
        if ("WDSRKHBCP".includes(ch)) continue;
        if (window.__occupied(sx, sy)) continue;
        S.px = sx; S.py = sy; S.renderX = sx * 32; S.renderY = sy * 32; S.facing = d; S.moving = false;
        T.interact(); return true;
      }
      return false;
    }
  };
});
await page.evaluate(() => {
  // map rows + occupancy via the live world (exposed through the renderer's globals is not possible; read from state)
  window.__mapRows = () => window.__tq.S._mapRows ? window.__tq.S._mapRows() : null;
  window.__occupied = (x, y) => window.__tq.S._occupied ? window.__tq.S._occupied(x, y) : false;
});

}
await injectHelpers();

// ---- the panel solver -------------------------------------------------------------
async function solvePanel() {
  return await page.evaluate(() => {
    const K = window.__K, S = window.__tq.S, body = document.getElementById("modal-body");
    const title = document.getElementById("modal-title").textContent;
    const vis = (b) => b && !b.disabled && b.offsetParent !== null;
    const btns = [...body.querySelectorAll("button")].filter(vis);
    const click = (b) => { b.click(); return title + " :: " + (b.textContent || "").trim().slice(0, 50); };
    const thorough = K.mode === "thorough";
    // character creator
    const roster = body.querySelector(".roster-card"); if (roster) return click(roster);
    const cc = document.getElementById("cc-name");
    if (cc) { cc.value = "Bot"; cc.dispatchEvent(new Event("input")); return click(document.getElementById("cc-confirm")); }
    // arcade initials handled elsewhere
    // scenario: pick the correct diagnosis
    const dxs = [...body.querySelectorAll(".dxc-btn")].filter(vis);
    if (dxs.length && S.currentScenario) {
      const want = K.correctDx[S.currentScenario];
      const b = dxs.find((x) => x.textContent.trim() === want) || dxs[0];
      return click(b);
    }
    // quiz
    const qo = [...body.querySelectorAll(".quiz-opt")].filter(vis);
    if (qo.length) return click(qo.find((b) => K.quizBest.includes(b.textContent.trim())) || qo[0]);
    // side quest
    const sq = [...body.querySelectorAll(".sq-opt")].filter(vis);
    if (sq.length) return click(sq.find((b) => K.sqBest.includes(b.textContent.trim())) || sq[0]);
    // CAB / KB multi-field forms
    const fields = [...body.querySelectorAll(".cab-field")];
    if (fields.length) {
      for (const f of fields) {
        const opts = [...f.querySelectorAll("button")];
        if (!opts.some((o) => o.classList.contains("on"))) { const b = opts.find((o) => K.best.includes(o.textContent.trim())) || opts[0]; b.click(); }
      }
      const submit = btns.find((b) => b.classList.contains("primary-btn") && !b.closest(".cab-field"));
      return submit ? click(submit) : "form";
    }
    // known-issues routing
    const groups = [...body.querySelectorAll(".group-btn")].filter(vis);
    if (groups.length) {
      const log = body.querySelector(".wn-h").textContent.replace(/^\S+\s/, "").trim();
      const g = K.kiGroup[log];
      return click(groups.find((b) => b.textContent === g) || groups[0]);
    }
    // Gloria's count question
    const counts = [...body.querySelectorAll(".count-btn")].filter(vis);
    if (counts.length) {
      const truth = S.dd.docs.filter((x) => !x.documented).length;
      return click(counts[thorough ? truth : 0] || counts[counts.length - 1]);
    }
    // tick composers (EOD, notice, PIR, contacts)
    const ticks = [...body.querySelectorAll(".dx-btn.tick")];
    if (ticks.length && !ticks.some((t) => t.dataset.bot)) {
      const today = S.dd.notes.filter((n) => n.d === S.day).map((n) => n.icon + " " + n.text);
      for (const t of ticks) {
        const txt = t.textContent.trim().slice(2);
        const isReal = K.real.includes(txt) || today.includes(txt);
        const want = thorough || !/End-of-day/.test(title) ? isReal : (isReal && Math.random() < 0.8);
        if (want) t.click();
        t.dataset.bot = "1";
      }
      const send = btns.filter((b) => b.classList.contains("primary-btn") && !b.classList.contains("tick")).pop();
      return send ? click(send) : "ticks";
    }
    // single judgment (walk-ups, pages, soceng, vendor, task questions)
    const opts = [...body.querySelectorAll(".dx-btn.opt")].filter(vis).filter((b) => !b.classList.contains("tick"));
    if (opts.length) {
      const b = opts.find((o) => K.best.includes(o.textContent.trim()));
      return click(b || opts[0]);
    }
    // bodega: buy the next thing on the list
    const buys = [...body.querySelectorAll(".shop-buy")].filter(vis);
    if (buys.length && title === "Byte Bodega") {
      const row = buys.find((b) => /Tasha's list/.test(b.parentElement.textContent));
      if (row) return click(row);
      if (!thorough && !S.hasFlag("botEnergy")) { S.setFlag("botEnergy"); const e = buys.find((b) => /Energy/.test(b.parentElement.textContent)); if (e) return click(e); }
      const done = btns.find((b) => /Done shopping/.test(b.textContent)); if (done) return click(done);
    }
    if (title === "Byte Bodega" && btns.some((b) => /Tap the card/.test(b.textContent))) return click(btns.find((b) => /Tap the card/.test(b.textContent)));
    // diligence links
    const ask = btns.find((b) => b.classList.contains("rcpt-ask") && /receipt|work notes/i.test(b.textContent));
    if (ask && thorough) return click(ask);
    // elevator: choose by NEXT UP
    const floors = [...body.querySelectorAll(".floor-btn[data-floor]")].filter(vis);
    if (floors.length) {
      const nu = window.__tq.nextUp(); const sub = (nu && nu.sub) || "";
      let want = /Lobby/.test(sub) ? "lobby" : /Floor 7/.test(sub) ? "floor7" : "floor3";
      if (window.__botWantFloor) { want = window.__botWantFloor; window.__botWantFloor = null; }
      const b = floors.find((f) => f.dataset.floor === want) || floors[0];
      return click(b);
    }
    // otherwise: the main action (big exit > primary > act > close)
    const order = [
      btns.find((b) => b.classList.contains("big-exit")),
      btns.find((b) => b.classList.contains("primary-btn") && !b.classList.contains("rcpt-ask")),
      btns.find((b) => b.classList.contains("act") && !b.classList.contains("ghost") && !b.classList.contains("life-btn")),
      btns.find((b) => b.classList.contains("ghost") && !b.classList.contains("life-btn")),
      document.getElementById("modal-close")
    ].filter(Boolean);
    if (order.length) return click(order[0]);
    return "stuck:" + title;
  });
}

// ---- main loop -------------------------------------------------------------------
async function run() {
  // title -> START
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  let last = "", same = 0, steps = 0, sideDone = false, reloaded = false;
  const seenShots = new Set();
  const log = [];
  while (steps++ < 4000) {
    if (errors.length) break;
    const st = await page.evaluate(() => {
      const S = window.__tq.S;
      const ar = document.getElementById("arcade");
      return { day: S.day, map: S.map, overlay: S.overlay, panel: !document.getElementById("modal-bg").hidden,
        arcade: !ar.hidden, arcadeInput: !!ar.querySelector(".ini"), credits: !document.getElementById("credits").hidden,
        submitted: S.hasFlag("scoreSubmitted"), nu: window.__tq.nextUp() };
    });
    if (st.submitted) break;
    // reload test: mid clock-day, reload the page and CONTINUE from the title
    if (process.env.RELOAD && !reloaded && st.day === 2 && !st.panel && !st.overlay && await page.evaluate(() => window.__tq.S.dd.windowOpen && window.__tq.S.dd.clockT > 120)) {
      reloaded = true;
      const before = await page.evaluate(() => ({ t: Math.round(window.__tq.S.dd.clockT), vis: window.__tq.S._npcs().filter((n) => n._vis).length }));
      await page.reload();
      await page.waitForFunction(() => window.__tq && window.__tq.interact, null, { timeout: 10000 });
      await page.evaluate((k) => { window.__K = k; }, K);
      await injectHelpers();
      await page.waitForTimeout(300);
      await page.keyboard.press("Enter"); await page.waitForTimeout(300);
      const after = await page.evaluate(() => ({ t: Math.round(window.__tq.S.dd.clockT), started: window.__tq.S.started, map: window.__tq.S.map, vendor: !!window.__tq.S._npcs().find((n) => n.id === "vendor") }));
      console.log("RELOAD before " + JSON.stringify(before) + " after " + JSON.stringify(after));
      continue;
    }
    if (st.credits) { await page.keyboard.press("Enter"); await page.waitForTimeout(300); continue; }
    if (st.arcade) {
      if (st.arcadeInput) { await page.waitForTimeout(2800); await snap("arcade"); await page.keyboard.type("BOT"); await page.keyboard.press("Enter"); await page.waitForTimeout(300); }
      else await page.waitForTimeout(500);
      continue;
    }
    if (st.overlay) { await page.waitForTimeout(400); continue; }
    if (SHOTS) {
      const key = "map-" + st.day + "-" + st.map;
      if (!seenShots.has(key) && !st.panel) { seenShots.add(key); await page.waitForTimeout(150); await snap(key); }
      if (st.panel) {
        const t = await page.evaluate(() => document.getElementById("modal-title").textContent);
        const k2 = "panel-" + t.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 30);
        if (!seenShots.has(k2) && seenShots.size < 70) { seenShots.add(k2); await page.waitForTimeout(80); await snap(k2); }
      }
    }
    if (st.panel) {
      const r = await solvePanel();
      if (r === last) { if (++same > 25) { log.push("STUCK " + r); break; } } else { same = 0; last = r; log.push(`D${st.day} ${st.map} ${r}`); }
      await page.waitForTimeout(30);
      continue;
    }
    // thorough side content, done once on Day 1 afternoon / Day 3
    if (MODE === "thorough" && !sideDone && st.day === 3 && st.map === "floor3") {
      sideDone = true; await doSideContent(); continue;
    }
    // follow NEXT UP
    const nu = st.nu;
    if (nu && /Post the contacts/.test(nu.text)) { await page.keyboard.press("p"); continue; }
    if (nu && nu.tgt) {
      // a human spends a few seconds walking to each thing: let the world run first
      const before = await page.evaluate((ms) => { for (let i = 0; i < ms / 100; i++) { if (window.__tq.isModalOpen()) return true; window.__tq.dayTick(100); } return false; }, +(process.env.STEP_MS || 3000));
      if (before) continue;
      const nu2 = await page.evaluate(() => window.__tq.nextUp());
      if (!nu2 || !nu2.tgt) continue;
      const ok = await page.evaluate((t) => window.__bot.faceAt(t.x, t.y), nu2.tgt);
      if (!ok) { log.push("cannot reach " + JSON.stringify(nu)); await page.evaluate(() => window.__tq.dayTick(300)); }
      await page.waitForTimeout(20);
      continue;
    }
    // nothing to click: advance time (the clock day, walk-ups arriving)
    await page.evaluate(() => { for (let i = 0; i < 10; i++) window.__tq.dayTick(100); });
    await page.waitForTimeout(10);
    if (steps % 50 === 0) log.push(`tick D${st.day} ${st.map} ${nu ? nu.text : "-"}`);
  }
  return log;
}

// thorough: solve every open ticket on F3 (and F7), side quests, the cat
async function doSideContent() {
  for (const floor of ["floor3", "floor7"]) {
    await page.evaluate((f) => { const S = window.__tq.S; if (S.map !== f) S.goToFloor(f, "elevator"); }, floor);
    const targets = await page.evaluate(() => {
      const S = window.__tq.S, out = [];
      for (const n of S._npcs()) {
        if (n._vis) continue;
        if (n.ticket && !S.solved.has(n.ticket) && S.ticketOpen(n.ticket)) out.push({ x: n.x, y: n.y });
        else if (n.sideQuest && !S.sqSolved.has(n.sideQuest)) out.push({ x: n.x, y: n.y });
      }
      for (const p of S._props()) if (p.sideQuest && !S.sqSolved.has(p.sideQuest)) out.push({ x: p.x, y: p.y });
      if (S.map === "floor3") for (const id of ["cat", "cat-food", "cat", "cat-stash"]) { const p = S._props().find((q) => q.id === id); if (p) out.push({ x: p.x, y: p.y, cat: id }); }
      return out;
    });
    for (const t of targets) {
      await page.evaluate((t) => { if (t.cat === "cat-stash") { /* walkable chest: stand beside */ } window.__bot.faceAt(t.x, t.y); }, t);
      for (let i = 0; i < 40; i++) {
        const open = await page.evaluate(() => !document.getElementById("modal-bg").hidden);
        if (!open) break;
        await solvePanel(); await page.waitForTimeout(20);
      }
    }
  }
  // practice exam once
  await page.evaluate(() => document.getElementById("exam-btn").click());
  for (let i = 0; i < 20; i++) {
    const r = await page.evaluate(() => { const b = document.getElementById("modal-body"); const d = document.getElementById("quiz-done"); if (d) { d.click(); return "done"; } const n = document.getElementById("quiz-next"); if (n) { n.click(); return "next"; } return "q"; });
    if (r === "done") break;
    if (r === "q") await solvePanel();
    await page.waitForTimeout(20);
  }
  await page.evaluate(() => { const S = window.__tq.S; S.goToFloor("floor3", "elevator"); });
}

const log = await run();
await snap("end");
const result = await page.evaluate(() => {
  const S = window.__tq.S;
  const hs = JSON.parse(localStorage.getItem("itgame_hiscores") || "[]");
  const F = window.__tq.finalScore();
  const unsolved = Object.keys(window.__tq.S.solved ? {} : {});
  return { rows: F.rows.map((r) => r.join(" | ")), openTickets: [...document.querySelectorAll("x")].length, unsolvedSq: S._allSq ? S._allSq() : null, solvedList: [...S.solved], sqList: [...S.sqSolved], day: S.day, hs: hs[0], rep: S.dd.rep, docs: S.dd.docs.length, undoc: S.dd.docs.filter((d) => !d.documented).length,
    badges: S.dd.badges, st: S.dd.st, finds: S.finds.size, solved: S.solved.size, caged: S.dd.caged.length };
});
console.log(log.slice(-40).join("\n"));
console.log((result.rows || []).join("\n")); delete result.rows;
console.log("RESULT", MODE, JSON.stringify(result));
if (errors.length) { console.log("PAGE ERRORS:\n" + errors.join("\n---\n")); process.exitCode = 1; }
else if (!result.hs) { console.log("FAILED: no score submitted"); process.exitCode = 1; }
await browser.close();
