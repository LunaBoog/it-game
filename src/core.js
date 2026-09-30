// v2 core: the shared pointer to live game state, the persisted "day data"
// blob (dd), and tiny helpers every v2 module uses. No DOM and no UI dependencies, so
// every module can depend on it without creating a cycle.
//
// All top-level names in v2 modules must be unique across the whole bundle
// (standalone.html concatenates every module into ONE scope).

import { loadString, saveString } from "./storage.js";

export const SAVE_VERSION = 2;

// CORE.S = the game state object from game.js (set in startGame).
// CORE.toast / CORE.ui are callbacks wired by game.js so v2 modules never
// touch ui.js at module-eval time.
export const CORE = { S: null, toast: null, sfx: null };

export function ddFresh() {
  return {
    v: SAVE_VERSION,
    rep: 5, repDay: { 1: 0, 2: 0, 3: 0 },
    notes: [],        // { d, cat, icon, text }
    docs: [],         // closed work: { id, kind, title, user, symptom, fix, d, documented, backfilled }
    purchases: [],    // { id, item, icon, amt, vendor, d, rcpt, recon, personal, repaid, pay }
    cash: 50, cardSpent: 0, cardLimit: 500,
    roll: {},         // per-day rolled content (never rerolled on reload)
    done: {},         // one-shot ids that fired/resolved
    sched: null, clockT: 0, fired: {}, cool: 0, windowOpen: false, windowClosed: false,
    spawnT: 0,        // walk-up spawn timer (seconds) for non-clock days
    st: { asked: 0, first: 0, wrong: 0, lifelines: 0, best: 0, heard: 0, cut: 0, pages: 0,
          pagesBest: 0, se: 0, vendor: 0, logged: 0, routedFirst: 0, routed: 0 },
    badges: [], lingo: [], chat: [],
    carry: [], caged: [],
    known: [],        // { id, d, routed, tries }
    days: {},         // nightly snapshot for Marching Orders
    buffUntil: 0,     // coffee speed buff (ms timestamp)
    finalShown: false, hsT: 0
  };
}

export function ddLoad() {
  try {
    const raw = loadString("dd", "");
    if (!raw) return ddFresh();
    const o = JSON.parse(raw);
    if (!o || o.v !== SAVE_VERSION) return ddFresh();
    const f = ddFresh();
    // shallow-merge so new fields added later get defaults
    for (const k of Object.keys(f)) if (!(k in o)) o[k] = f[k];
    for (const k of Object.keys(f.st)) if (!(k in o.st)) o.st[k] = 0;
    return o;
  } catch { return ddFresh(); }
}

export function ddSave() {
  try { if (CORE.S && CORE.S.dd) saveString("dd", JSON.stringify(CORE.S.dd)); } catch { /* ignore */ }
}

export function DD() { return CORE.S.dd; }

// ---- small helpers ---------------------------------------------------------
export function rndf(a, b) { return a + Math.random() * (b - a); }
export function rndi(a, b) { return Math.round(rndf(a, b)); }
export function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const DAY_NAMES = { 1: "Day 1 · Onboarding & Change Prep", 2: "Day 2 · Go-Live", 3: "Day 3 · Hypercare & Close-Out", 4: "Wrapped" };
export const DAY_SHORT = { 1: "Onboarding", 2: "Go-Live", 3: "Hypercare", 4: "Wrapped" };
export const DAY_DATE = { 1: "Tue", 2: "Wed", 3: "Thu", 4: "Thu" };
export function dayName(d) { return DAY_NAMES[d] || "Day " + d; }
export function curDay() { return CORE.S ? CORE.S.day : 1; }

// ---- day notes (auto-logged; the EOD email is built from them) --------------
export function addNote(cat, icon, text) {
  const d = DD(); d.notes.push({ d: curDay(), cat, icon, text }); ddSave();
}
export function notesFor(day) { return DD().notes.filter((n) => n.d === day); }

// ---- reputation --------------------------------------------------------------
export function addRep(n) {
  if (!n) return;
  const d = DD(); d.rep += n; d.repDay[curDay()] = (d.repDay[curDay()] || 0) + n; ddSave();
  if (CORE.S) CORE.S.updateProgressUI();
}

// ---- per-run stats ------------------------------------------------------------
export function bump(k, n = 1) { const d = DD(); d.st[k] = (d.st[k] || 0) + n; ddSave(); }

// Record a scored judgment call (walk-up, page, soceng...). score: 2/1/0.
export function recordAnswer(score, firstTry = true) {
  bump("asked");
  if (score === 2 && firstTry) bump("first");
  if (score === 0) bump("wrong");
}
