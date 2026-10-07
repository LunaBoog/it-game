// Game loop and input — drives the ported renderer (renderX/renderY pixel
// positions, facing, smooth lerp walking, held-key continuous movement).

import {
  isWalkable, NPCS, PROPS, PLAYER_START, TILE, MAP_W, MAP_H,
  setFloor, FLOOR_ID, FLOOR_META, FLOOR_ORDER, LOC_LABEL, arrivalFor, mapDef, MAP_IDS
} from "./world.js";
import { draw, sizeCanvas, loadAssets } from "./render.js";
import {
  loadSet, saveSet, clearAll,
  loadString, saveString,
  loadBool, saveBool,
  loadNum, saveNum
} from "./storage.js";
import {
  initUI, openNpcChat, openTicketBoard, openSideQuest,
  openScenario, openIntro, handleEscape,
  openPet, openSearch, openChest, openDiscoveries,
  openElevator, openQuiz,
  openCharacterCreator, openSettings, openShop, openAchievements, showAchievementToast,
  openOrientation, openResetMenu
} from "./ui.js";
import { FINDS, FINDTOTAL } from "./collectables.js";
import { scenarioIdsForFloor, scenarioCountForFloor } from "./scenarios.js";
import { DEFAULT_SPRITE } from "./cosmetics.js";
import { XP, rank, newlyUnlocked, ACHIEVEMENTS } from "./progression.js";
import { applyTheme, currentTheme, applyPrefs } from "./theme.js";
import { serializeSave, saveFilename, applySaveText } from "./savefile.js";
import { CORE, ddFresh, ddLoad, ddSave, SAVE_VERSION, DAY_SHORT, LAST_DAY, WEEKS, weekOf, dayIn } from "./core.js";
import { dayNpc, dayProp, dayStep, dayTick, dayRestore, nextUp, taskCount, ticketOpen, dayTasksDone, spawnWalkup, firePage } from "./days.js";
import { openMorning, rolloverWeek } from "./flows.js";
import { openWindow, windowLeft, clockActive } from "./clock.js";
import { openPhone, openNotes } from "./comms.js";
import { hsTable, showArcade, finalScore, archiveWeek, careerScore } from "./score.js";
import { cardLeft } from "./ledger.js";
import { HOTSPOTS } from "./pools.js";

const DIRS = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const KEY_TO_DIR = {
  ArrowUp:"up", w:"up", W:"up",
  ArrowDown:"down", s:"down", S:"down",
  ArrowLeft:"left", a:"left", A:"left",
  ArrowRight:"right", d:"right", D:"right"
};

const MOVE_MS = 140;
const SHAKE_DECAY = 0.85;

// Module-scoped pointer to the live game state, set at startGame(). Lets the
// helpers below reason about prop visibility (a hidden chest must neither block
// movement nor be interactable until its reveal flag is set).
let S = null;
function propVisible(p) {
  if (!p) return false;
  if (p.needFlag && !(S && S.flags.has(p.needFlag))) return false;
  if (p.hideFlag && S && S.flags.has(p.hideFlag)) return false;
  return true;
}
function npcVisible(n) {
  if (!n) return false;
  if (n.needFlag && !(S && S.flags.has(n.needFlag))) return false;
  if (n.hideFlag && S && S.flags.has(n.hideFlag)) return false;
  return true;
}
function npcAt(x, y) { return NPCS.find((n) => n.x === x && n.y === y && npcVisible(n)); }
function propAt(x, y) { return PROPS.find((p) => p.x === x && p.y === y && propVisible(p)); }
// A prop only blocks if it's visible AND not explicitly walkable.
function solidPropAt(x, y) { const p = propAt(x, y); return p && !p.walkable ? p : null; }

// Sprite manifest. Keys are prefixed so render.js can bucket them:
//   tile_<code>, npc_<id>[_dir][_frame], player_<dir>[_frame],
//   marker_<kind>, or a bare prop name.
//
// EVERYTHING here is optional — a missing PNG silently falls back to the
// procedural art, so you can drop assets in one at a time as you generate them.
//
// Naming convention your generator should target (24x24 PNG, alpha, top-down):
//   Player (needed first):   player_down/up/left/right.png
//   Player walk frames (opt): player_down_1.png ... (alternate frame; engine
//                             cross-fades base<->_1 while moving)
//   NPC down (v1):           npc_<id>.png            e.g. npc_karen.png
//   NPC directional (opt):   npc_<id>_left.png, npc_<id>_up.png, ...
//   NPC walk frames (opt):   npc_<id>_down_1.png
//   Props:                   ticket_monitor.png, printer.png
//   Markers (opt, override   marker_ticket.png   (the "!" over a ticket NPC)
//     the procedural badge):  marker_sidequest.png ("?" over a side quest)
//                             marker_done.png      (the check when solved)
//   Tiles (opt):             tile_W wall, tile_. floor, tile_o carpet,
//                             tile_e cool floor, tile_D desk, tile_c chair,
//                             tile_S server  ->  e.g. tile_W: "./sprites/wall.png"
const SPRITE_MANIFEST = {
  // props
  ticket_monitor: "./sprites/ticket_monitor.png",
  printer: "./sprites/printer.png",
  // player (4 dirs)
  player_down: "./sprites/player_down.png",
  player_up: "./sprites/player_up.png",
  player_left: "./sprites/player_left.png",
  player_right: "./sprites/player_right.png",
  // NPCs (down-facing is enough; engine falls back to it for other dirs)
  npc_karen: "./sprites/npc_karen.png",
  npc_marcus: "./sprites/npc_marcus.png",
  npc_priya: "./sprites/npc_priya.png",
  npc_dana: "./sprites/npc_dana.png",
  npc_jordan: "./sprites/npc_jordan.png",
  npc_riley: "./sprites/npc_riley.png",
  npc_chen: "./sprites/npc_chen.png",
  npc_ed: "./sprites/npc_ed.png",
  npc_lisa: "./sprites/npc_lisa.png"

  // ---- optional, uncomment as you generate them ----
  // , player_down_1: "./sprites/player_down_1.png"
  // , marker_ticket: "./sprites/marker_ticket.png"
  // , marker_sidequest: "./sprites/marker_sidequest.png"
  // , marker_done: "./sprites/marker_done.png"
  // , tile_W: "./sprites/wall.png"
  // , tile_D: "./sprites/desk.png"
};

function makeStepSound() {
  let AC = null;
  return {
    play(enabled) {
      if (!enabled) return;
      try {
        AC = AC || new (window.AudioContext || window.webkitAudioContext)();
        if (AC.state === "suspended") AC.resume();
        const t = AC.currentTime;
        const o = AC.createOscillator(); const g = AC.createGain();
        o.type = "square";
        o.frequency.setValueAtTime(180 + Math.random() * 40, t);
        g.gain.setValueAtTime(0.03, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        o.connect(g).connect(AC.destination);
        o.start(t); o.stop(t + 0.07);
      } catch { /* ignore */ }
    }
  };
}

// Tiny WebAudio blips for v2 events (pages, receipts, the alarm...).
function makeSfx() {
  let AC = null;
  const tone = (f, dur, type = "square", vol = 0.03, at = 0) => {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime + at;
    const o = AC.createOscillator(); const g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
  };
  const SEQ = {
    ok: [[660, 0.07], [990, 0.09, 0.07]], bad: [[220, 0.14, 0, "sawtooth"]], tick: [[620, 0.03]],
    page: [[1320, 0.05], [1320, 0.05, 0.09], [1320, 0.05, 0.18]], alarmset: [[988, 0.08, 0, "triangle"]],
    night: [[330, 0.4, 0, "sine"]], alarm: [0, 1, 2, 3, 4, 5].map((i) => [1320, 0.06, i * 0.14]),
    train: [[180, 0.3, 0, "sawtooth", 0.015], [160, 0.3, 0.35, "sawtooth", 0.015]], win: [[523, 0.1], [659, 0.1, 0.1], [784, 0.1, 0.2], [1046, 0.2, 0.3]]
  };
  return (kind, on) => {
    if (!on) return;
    try { for (const [f, d, at = 0, ty = "square", v = 0.03] of (SEQ[kind] || [])) tone(f, d, ty, v, at); } catch { /* ignore */ }
  };
}

export async function startGame() {
  applyTheme(currentTheme());
  applyPrefs();
  await loadAssets(SPRITE_MANIFEST);

  const canvas = document.getElementById("world");
  const viewport = document.getElementById("viewport");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // v2 save shape: a saveVersion key. An older save keeps who you are
  // (character, name, rank, coins, cosmetics, achievements, theme) and starts
  // a fresh Cutover Week run — same semantics as "New Playthrough".
  if (loadNum("saveVersion", 1) < SAVE_VERSION) {
    for (const k of ["solved", "sq-solved", "sharp", "finds", "dd"]) saveString(k, k === "dd" ? "" : "[]");
    const keepOriented = loadSet("flags").has("oriented");
    saveSet("flags", keepOriented ? new Set(["oriented"]) : new Set());
    saveNum("day", 1); saveString("floor", "home");
    saveNum("saveVersion", SAVE_VERSION);
  }

  // Restore which map the player was on BEFORE we read PLAYER_START, so the
  // spawn point and live MAP/NPCS/PROPS bindings all reflect the right map.
  const savedFloor = loadString("floor", "home");
  setFloor(MAP_IDS.includes(savedFloor) ? savedFloor : "home");
  const savedPos = (() => { try { return JSON.parse(loadString("pos", "") || "null"); } catch { return null; } })();

  const sp0 = savedPos && savedPos.m === FLOOR_ID && isWalkable(savedPos.x, savedPos.y) ? savedPos : null;
  const state = {
    map: FLOOR_ID,
    floor: FLOOR_ID,
    px: sp0 ? sp0.x : PLAYER_START.x, py: sp0 ? sp0.y : PLAYER_START.y,
    renderX: (sp0 ? sp0.x : PLAYER_START.x) * TILE, renderY: (sp0 ? sp0.y : PLAYER_START.y) * TILE,
    facing: sp0 ? sp0.f : PLAYER_START.dir,
    moving: false, moveT: 0,
    fromX: 0, fromY: 0, toX: 0, toY: 0,
    shake: 0, tick: 0,

    solved: loadSet("solved"),
    sqSolved: loadSet("sq-solved"),
    sharp: loadSet("sharp"),
    // SDV layer: open containers that persist with zero save-code changes.
    flags: loadSet("flags"),     // a Set of "true" quest flags
    finds: loadSet("finds"),     // collected keepsake ids
    coins: loadNum("coins", 0),  // vending coins (earned on the floor)
    tokens: loadNum("tokens", 0),// break-room tokens (gate the mini-game)
    playerName: loadString("playerName", ""),
    soundOn: loadBool("soundOn", false),
    day: loadNum("day", 1),
    lifeTickets: loadNum("lifeTickets", 0),
    lifeSideQuests: loadNum("lifeSideQuests", 0),
    xp: loadNum("xp", 0),
    owned: loadSet("owned"),            // cosmetic shop item ids the player owns
    achievements: loadSet("achievements"), // unlocked achievement ids
    playerSprite: (() => {
      try { const raw = loadString("sprite", ""); return raw ? JSON.parse(raw) : { ...DEFAULT_SPRITE }; }
      catch { return { ...DEFAULT_SPRITE }; }
    })(),

    started: false,
    overlay: false,          // sleep / commute / credits / arcade overlays
    dd: null,                // v2 day data (see core.js)
    bridgeLine: "",
    nuTarget: null,
    propVisible, npcVisible,

    inScenario: false, inSideQuest: false, inTicketBoard: false,
    inIntro: false, inEndOfDay: false, inDialog: false,
    currentScenario: null, scenarioSolved: false,
    actionsLeft: 0,
    investigated: new Set(), evidenceLog: [],
    triedAnswers: new Set(), usedFollowups: new Set(),

    setPlayerName(n) { this.playerName = n; saveString("playerName", n); },
    setSound(on) { this.soundOn = on; saveBool("soundOn", on); updateSoundUI(on); },
    recordTicketSolved() { this.lifeTickets += 1; saveNum("lifeTickets", this.lifeTickets); },
    recordSideQuestSolved() { this.lifeSideQuests += 1; saveNum("lifeSideQuests", this.lifeSideQuests); },
    // --- character / cosmetics ---
    setPlayerSprite(sp) {
      this.playerSprite = sp;
      try { saveString("sprite", JSON.stringify(sp)); } catch { /* ignore */ }
    },
    own(id) { if (!this.owned.has(id)) { this.owned.add(id); saveSet("owned", this.owned); } },
    hasOwned(id) { return this.owned.has(id); },
    buyItem(item) {
      if (!item) return { ok: false, error: "Unknown item." };
      if (this.owned.has(item.id)) return { ok: false, error: "You already own that." };
      if (this.coins < item.cost) return { ok: false, error: `Need ${item.cost - this.coins} more coins.` };
      this.coins -= item.cost; saveNum("coins", this.coins);
      this.own(item.id);
      this.updateProgressUI(); this.checkAchievements();
      return { ok: true };
    },
    // --- XP / rank ---
    addXp(n) {
      if (!n) return;
      const before = rank(this.xp).level;
      this.xp += n; saveNum("xp", this.xp);
      const after = rank(this.xp).level;
      this.updateProgressUI();
      if (after > before) showAchievementToast({ icon: "\u{1F4C8}", name: "Promoted!", desc: rank(this.xp).title });
      this.checkAchievements();
    },
    // --- achievements ---
    checkAchievements() {
      const nu = newlyUnlocked(this, this.achievements);
      if (!nu.length) return;
      for (const id of nu) this.achievements.add(id);
      saveSet("achievements", this.achievements);
      const a = ACHIEVEMENTS.find((x) => x.id === nu[0]);
      if (a) showAchievementToast(a);
      this.updateProgressUI();
    },
    // --- SDV helpers ---
    setFlag(name) { if (!this.flags.has(name)) { this.flags.add(name); saveSet("flags", this.flags); } },
    hasFlag(name) { return this.flags.has(name); },
    clearFlag(name) { if (this.flags.delete(name)) saveSet("flags", this.flags); },
    addFind(id) {
      if (this.finds.has(id)) return false;
      this.finds.add(id); saveSet("finds", this.finds); this.addXp(XP.find); this.updateProgressUI(); return true;
    },
    addCoins(n) { this.coins += n; saveNum("coins", this.coins); this.updateProgressUI(); this.checkAchievements(); },
    addTokens(n) { this.tokens += n; saveNum("tokens", this.tokens); this.updateProgressUI(); },
    // --- whole-game reset / save-file ---
    doReset() {
      clearAll();
      setFloor("home");
      this.floor = "home"; this.map = "home";
      this.solved = new Set(); this.sqSolved = new Set(); this.sharp = new Set();
      this.flags = new Set(); this.finds = new Set(); this.coins = 0; this.tokens = 0;
      this.owned = new Set(); this.achievements = new Set(); this.xp = 0;
      this.playerName = ""; this.day = 1; this.lifeTickets = 0; this.lifeSideQuests = 0;
      this.playerSprite = { ...DEFAULT_SPRITE };
      saveNum("saveVersion", SAVE_VERSION);
      this.resetRun();
      this.px = PLAYER_START.x; this.py = PLAYER_START.y;
      this.renderX = this.px * TILE; this.renderY = this.py * TILE;
      this.facing = PLAYER_START.dir; this.moving = false;
      const lab = document.getElementById("loc-label");
      if (lab) lab.textContent = LOC_LABEL;
      this.updateProgressUI();
    },
    // "Replay for the first time": wipe the run (tickets, side quests, finds, day,
    // gameplay flags so Floor 7 re-locks and the cat resets) but KEEP who you are —
    // character, name, rank/XP, coins, owned cosmetics, achievements, lifetime stats.
    newPlaythrough() {
      setFloor("home");
      this.floor = "home"; this.map = "home"; saveString("floor", "home");
      this.resetRun();
      this.solved = new Set(); saveSet("solved", this.solved);
      this.sqSolved = new Set(); saveSet("sq-solved", this.sqSolved);
      this.sharp = new Set(); saveSet("sharp", this.sharp);
      this.finds = new Set(); saveSet("finds", this.finds);
      // clear gameplay flags but keep the tutorial-seen flag so it doesn't replay
      const keepOriented = this.flags.has("oriented");
      this.flags = new Set();
      if (keepOriented) this.flags.add("oriented");
      saveSet("flags", this.flags);
      this.day = 1; saveNum("day", this.day);
      this.px = PLAYER_START.x; this.py = PLAYER_START.y; this.savePos();
      this.renderX = this.px * TILE; this.renderY = this.py * TILE;
      this.facing = PLAYER_START.dir; this.moving = false;
      const lab = document.getElementById("loc-label");
      if (lab) lab.textContent = LOC_LABEL;
      this.updateProgressUI();
    },
    exportSaveFile() {
      try {
        const text = serializeSave();
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = saveFilename(this.playerName, this.day);
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
        return { ok: true };
      } catch (e) { return { ok: false, error: "Couldn't create the download." }; }
    },
    importSaveText(text) {
      const res = applySaveText(text);
      if (res.ok) { try { location.reload(); } catch { /* test env */ } }
      return res;
    },
    // --- v2 run state ---
    setDay(n) { this.day = n; saveNum("day", n); this.updateProgressUI(); },
    resetRun() {
      this.dd = ddFresh(); ddSave();
      // wipe transient visitors on every map
      for (const id of MAP_IDS) { const m = mapDef(id); if (m) m.npcs = m.npcs.filter((n) => !n._vis); }
      this.overlay = false;
    },
    savePos() { try { saveString("pos", JSON.stringify({ m: this.map, x: this.px, y: this.py, f: this.facing })); } catch { /* ignore */ } },
    // storage writes are synchronous: never do one per tile, batch them
    savePosSoon() { clearTimeout(this._posT); this._posT = setTimeout(() => this.savePos(), 800); },
    npcSprite(id) {
      for (const mid of MAP_IDS) { const m = mapDef(mid); const n = m && m.npcs.find((x) => x.id === id); if (n) return n.sprite; }
      return null;
    },
    // The ladder opens floors as you climb: 5 in Network Week, 7 in SOC Week
    // (or briefly during Cutover Week, when Security calls Help Desk up).
    floor5Open() { return this.day >= 4; },
    floor7Open() { return this.day >= 7 || this.hasFlag("floor3Cleared") || this.hasFlag("f7Unlocked"); },
    openWindow() { openWindow(); },
    // --- floors ---
    // how many of THIS floor's tickets are solved (solved Set is shared across floors)
    solvedOnFloor(floorId) {
      return scenarioIdsForFloor(floorId).filter((id) => this.solved.has(id)).length;
    },
    floorCleared(floorId) {
      return this.solvedOnFloor(floorId) >= scenarioCountForFloor(floorId);
    },
    goToFloor(id, via = "elevator") {
      setFloor(id);
      this.floor = id; this.map = id; saveString("floor", id);
      if (id === "floor7") this.setFlag("visitedFloor7");
      const at = via === "start" ? PLAYER_START : arrivalFor(id, via);
      this.px = at.x; this.py = at.y; this.facing = at.dir || "down";
      this.renderX = this.px * TILE; this.renderY = this.py * TILE;
      this.moving = false; this.savePos();
      showBanner(FLOOR_META[id] ? FLOOR_META[id].label : id);
      const lab = document.getElementById("loc-label");
      if (lab) lab.textContent = LOC_LABEL;
      const fp = document.getElementById("floor-pill");
      if (fp) fp.textContent = FLOOR_META[id] ? FLOOR_META[id].name : id;
      this.updateProgressUI();
      this.checkAchievements();
    },
    updateProgressUI() {
      const dd = this.dd;
      const day = Math.min(this.day, LAST_DAY + 1);
      const dp = document.getElementById("day-pill");
      if (dp) dp.textContent = day > LAST_DAY ? "Career wrapped" : `Wk ${weekOf(day)} \u00b7 Day ${day} \u00b7 ${DAY_SHORT[day]}`;
      const rl = document.getElementById("role-pill");
      if (rl) rl.textContent = day > LAST_DAY ? "\u{1F6E1}\uFE0F Security Analyst" : WEEKS[weekOf(day)].short;
      // Mark floors cleared (gates + achievements) the moment tickets are all solved.
      if (this.floorCleared("floor3")) this.setFlag("floor3Cleared");
      if (this.floorCleared("floor7")) this.setFlag("floor7Cleared");
      const tp = document.getElementById("today-pill");
      if (tp && dd) { const tc = taskCount(Math.min(day, LAST_DAY)); tp.textContent = day > LAST_DAY ? "All done" : `Today ${tc.done}/${tc.total}`; tp.classList.toggle("done", tc.done === tc.total); }
      const here = this.floor;
      const tpr = document.getElementById("ticket-progress");
      if (tpr) {
        if (here === "floor3" || here === "floor5" || here === "floor7") {
          const total = scenarioCountForFloor(here); const done = this.solvedOnFloor(here);
          tpr.textContent = `${done} / ${total} tickets`; tpr.hidden = false;
        } else tpr.hidden = true;
      }
      const n = this.sqSolved.size;
      const sqp = document.getElementById("sq-progress"); if (sqp) sqp.textContent = `${n} side quest${n === 1 ? "" : "s"}`;
      const fpill = document.getElementById("floor-pill");
      if (fpill) fpill.textContent = FLOOR_META[here] ? FLOOR_META[here].name : here;
      const lab = document.getElementById("loc-label");
      if (lab) lab.textContent = LOC_LABEL;
      const fp = document.getElementById("finds-progress");
      if (fp) fp.textContent = `\u2605 ${this.finds.size}/${FINDTOTAL}`;
      const cp = document.getElementById("coins-progress");
      if (cp) cp.textContent = `\u{1FA99} ${this.coins}${this.tokens ? ` \u00b7 \u{1F39F}\uFE0F ${this.tokens}` : ""}`;
      const mp = document.getElementById("money-pill");
      if (mp && dd) mp.textContent = `\u{1F4B5} $${dd.cash}${this.hasFlag("kit") && !this.hasFlag("kitReturned") ? ` \u00b7 \u{1F4B3} $${cardLeft()}` : ""}`;
      const rpp = document.getElementById("rep-pill");
      if (rpp && dd) rpp.textContent = `\u2B50 ${dd.rep}`;
      const cy = document.getElementById("carry-pill");
      if (cy && dd) { cy.hidden = !(dd.carry && dd.carry.length); cy.textContent = `\u267B\uFE0F carrying ${dd.carry ? dd.carry.length : 0}`; }
      const rp = document.getElementById("rank-pill");
      if (rp) { const r = rank(this.xp); rp.textContent = `Lv ${r.level} \u00b7 ${r.title}`; rp.title = r.next ? `${r.into}/${r.span} XP to ${r.next}` : "Max rank"; }
      if (dd) refreshNextUp();
    },
    updateProgressUIThrottled() {
      const t = performance.now(); if (t - (this._uiT || 0) < 250) return; this._uiT = t; this.updateProgressUI();
    }
  };

  // ---- v2 HUD: NEXT UP card + location banner ----
  function refreshNextUp() {
    const card = document.getElementById("nextup"); if (!card || !state.dd) return;
    if (!state.started) { card.hidden = true; return; }
    let nu = null; try { nu = nextUp(); } catch (e) { console.error(e); }
    card.hidden = !nu;
    if (!nu) { state.nuTarget = null; return; }
    card.classList.toggle("loud", !!nu.loud);
    // step out of the way when you're standing under the card
    card.classList.toggle("low", state.px < 12 && state.py < 6);
    document.getElementById("nu-t").textContent = nu.text || "";
    document.getElementById("nu-s").textContent = nu.sub || "";
    const cl = document.getElementById("nu-clock");
    const active = clockActive();
    cl.hidden = !(dayIn(state.day) === 2 && state.day <= LAST_DAY && state.dd.windowOpen && !state.dd.windowClosed);
    if (!cl.hidden) cl.textContent = windowLeft();
    const br = document.getElementById("nu-bridge");
    br.hidden = !(active && state.bridgeLine); if (!br.hidden) br.textContent = "\u{1F4DE} " + state.bridgeLine;
    state.nuTarget = nu.tgt || null;
  }
  let bannerT = null;
  function showBanner(text) {
    const b = document.getElementById("loc-banner"); if (!b) return;
    b.textContent = text; b.classList.add("show");
    clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove("show"), 1800);
  }

  const stepSound = makeStepSound();
  S = state;  // expose to the module-level visibility helpers
  CORE.S = state;
  state.dd = ddLoad();
  const sfx = makeSfx();
  CORE.sfx = (k) => sfx(k, state.soundOn);
  CORE.toast = (a) => showAchievementToast(a);
  state.ticketOpen = ticketOpen;
  state.hotTargets = () => HOTSPOTS.filter((h) => state.dd && state.dd.hot && state.dd.hot[h.id] === "open");
  state.dayOver = () => state.day <= LAST_DAY && dayTasksDone(state.day);
  // v3 migration: a v2 save that finished Cutover Week ("Wrapped" = day 4 with
  // the party done) picks up at the start of Network Week.
  try {
    if (state.day === 4 && state.hasFlag("partyDone") && !state.dd.weeks[1] && !state.hasFlag("wkMail_4") && !state.hasFlag("wk1over")) {
      state.setDay(3); archiveWeek(1); rolloverWeek(1); state.setDay(4);
      state.clearFlag("scoreSubmitted"); state.setFlag("morning_4");
    }
  } catch (e) { console.error(e); }
  // debug/test handle (used by the headless validator bot)
  try { window.__tq = { S: state, CORE }; } catch { /* ignore */ }
  function updateSoundUI(on) {
    const b = document.getElementById("sound-btn"); if (b) b.textContent = on ? "Sound: on" : "Sound: off";
  }
  updateSoundUI(state.soundOn);

  initUI(state, () => {});

  function isModalOpen() {
    return state.inScenario || state.inSideQuest || state.inTicketBoard || state.inIntro || state.inEndOfDay || state.inDialog || state.overlay;
  }

  // ---- held-key continuous movement ----
  const held = new Set();
  const order = [];
  function pressDir(d) { if (!held.has(d)) { held.add(d); order.push(d); } }
  function releaseDir(d) { held.delete(d); const i = order.indexOf(d); if (i >= 0) order.splice(i, 1); }
  function heldDir() { for (let i = order.length - 1; i >= 0; i--) if (held.has(order[i])) return order[i]; return null; }

  function facedTarget() {
    const [dx, dy] = DIRS[state.facing];
    const fx = state.px + dx, fy = state.py + dy;
    const n = npcAt(fx, fy);
    if (n) return { kind: "npc", target: n };
    const p = propAt(fx, fy);
    if (p) {
      if (p.isMonitor || p.kind === "monitor") return { kind: "monitor", target: p };
      if (p.kind === "elevator") return { kind: "elevator", target: p };
      if (p.kind === "pet") return { kind: "pet", target: p };
      if (p.kind === "search") return { kind: "search", target: p };
      if (p.kind === "chest") return { kind: "chest", target: p };
      if (p.sideQuest) return { kind: "prop-sq", target: p };
      return { kind: "prop", target: p };
    }
    return null;
  }

  function moveMs() { return state.dd && state.dd.buffUntil > Date.now() ? 100 : MOVE_MS; }
  function startMove(dir, chained = false) {
    state.facing = dir;
    const [dx, dy] = DIRS[dir];
    const nx = state.px + dx, ny = state.py + dy;
    if (!isWalkable(nx, ny) || npcAt(nx, ny) || solidPropAt(nx, ny)) {
      if (!chained) state.shake = 0.45;
      return false;
    }
    state.fromX = state.px * TILE; state.fromY = state.py * TILE;
    state.px = nx; state.py = ny;            // logical position updates immediately
    state.toX = nx * TILE; state.toY = ny * TILE;
    state.moveT = 0; state.moving = true;
    state.walkPhase = ((state.walkPhase || 0) + 1) % 4;   // drives the leg swing
    stepSound.play(state.soundOn);
    return true;
  }

  function interact() {
    if (isModalOpen() || state.moving) return;
    const t = facedTarget();
    if (!t) return;
    // v2: the day engine gets first say on every NPC and prop
    try {
      if (t.kind === "npc" && dayNpc(t.target)) return;
      if (t.kind !== "npc" && dayProp(t.target)) return;
    } catch (e) { console.error(e); }
    if (t.kind === "prop") { openNpcChat({ name: t.target.label || "Something", role: t.target.room || "", chat: ["Nothing to do here right now."] }); return; }
    if (t.kind === "npc") {
      const n = t.target;
      if (n.ticket && !state.solved.has(n.ticket) && ticketOpen(n.ticket)) openScenario(n.ticket);
      else if (n.sideQuest && !state.sqSolved.has(n.sideQuest)) openSideQuest(n.sideQuest);
      else openNpcChat(n);
    } else if (t.kind === "monitor") {
      openTicketBoard();
    } else if (t.kind === "elevator") {
      openElevator(t.target);
    } else if (t.kind === "pet") {
      openPet(t.target);
    } else if (t.kind === "search") {
      openSearch(t.target);
    } else if (t.kind === "chest") {
      openChest(t.target);
    } else if (t.kind === "prop-sq") {
      if (!state.sqSolved.has(t.target.sideQuest)) openSideQuest(t.target.sideQuest);
      else openNpcChat({ name: "Already handled", role: "", chat: ["You already took care of that."] });
    }
  }

  let hintCache = "", hintOn = false;
  function updateInteractHint(t) {
    const hintEl = document.getElementById("interact-hint");
    const actBtn = document.getElementById("touch-action");
    if (t && !isModalOpen()) {
      let label = "Interact";
      if (t.kind === "npc") label = `Talk to ${t.target.name}`;
      else if (t.kind === "monitor") label = "Read ticket board";
      else if (t.kind === "elevator") label = "Take the elevator";
      else if (t.kind === "pet") label = `Approach ${t.target.name || "the cat"}`;
      else if (t.kind === "search") label = `Examine ${t.target.label}`;
      else if (t.kind === "chest") label = `Check ${t.target.label}`;
      else if (t.kind === "prop-sq") label = t.target.label;
      else if (t.kind === "prop") label = `Use ${t.target.label}`;
      const txt = `Space: ${label}`;
      if (txt !== hintCache) { hintCache = txt; document.getElementById("interact-hint-text").textContent = txt; }
      if (!hintOn) { hintOn = true; hintEl.classList.add("visible"); if (actBtn) actBtn.classList.add("ready"); }
    } else if (hintOn) {
      hintOn = false;
      hintEl.classList.remove("visible");
      if (actBtn) actBtn.classList.remove("ready");
    }
  }

  // ---- main loop ----
  let lastT = 0;
  let nuAcc = 0;
  let lastFaced = null;
  function loop(t) {
    if (!lastT) lastT = t;
    const dt = Math.min(50, t - lastT);  // clamp: tab-away then back won't teleport
    lastT = t;
    state.tick += 1;

    if (state.moving) {
      state.moveT += dt / moveMs();
      if (state.moveT >= 1) {
        // arrived: chain straight into the next step if a direction is still held,
        // carrying the leftover time so speed stays perfectly even (no dead frame)
        const carry = state.moveT - 1;
        try { dayStep(state.px, state.py); } catch (e) { console.error(e); }
        const d = (state.started && !isModalOpen()) ? heldDir() : null;
        state.moving = false; state.moveT = 1;
        if (d && startMove(d, true)) state.moveT = Math.min(carry, 0.5);
        else { state.savePosSoon(); state.walkPhase = 0; }
      }
      state.renderX = state.fromX + (state.toX - state.fromX) * state.moveT;
      state.renderY = state.fromY + (state.toY - state.fromY) * state.moveT;
      if (!state.moving) { state.renderX = state.px * TILE; state.renderY = state.py * TILE; }
    } else {
      state.renderX = state.px * TILE; state.renderY = state.py * TILE;
      if (state.started && !isModalOpen()) {
        const d = heldDir();
        if (d) startMove(d);
      }
    }

    if (state.shake > 0) { state.shake *= SHAKE_DECAY; if (state.shake < 0.05) state.shake = 0; }

    if (state.started) {
      try { dayTick(dt, isModalOpen()); } catch (e) { console.error(e); }
      nuAcc += dt; if (nuAcc > 200) { nuAcc = 0; refreshNextUp(); }
    }
    const t2 = (state.started && !isModalOpen() && !state.moving) ? facedTarget() : (state.moving ? lastFaced : null);
    if (!state.moving) lastFaced = t2;
    draw(ctx, state, t2);
    updateInteractHint(t2);
    requestAnimationFrame(loop);
  }

  // ---- keyboard ----
  function isTyping(el) { return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable); }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (isModalOpen()) { e.preventDefault(); handleEscape(); } return; }
    if (isTyping(document.activeElement)) return;
    // title menu navigation (game not started, no modal yet)
    if (!state.started && !isModalOpen()) {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); moveMenu(-1); }
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); moveMenu(1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activateMenu(); }
      return;
    }
    if (isModalOpen()) return;
    const dir = KEY_TO_DIR[e.key];
    if (dir) { e.preventDefault(); pressDir(dir); }
    else if (e.key === " " || e.code === "Space") { e.preventDefault(); if (!e.repeat) interact(); }
    else if (e.key === "n" || e.key === "N") { e.preventDefault(); openNotes(); }
    else if (e.key === "p" || e.key === "P") { e.preventDefault(); openPhone(); }
  });
  window.addEventListener("keyup", (e) => {
    const dir = KEY_TO_DIR[e.key];
    if (dir) releaseDir(dir);
  });

  // ---- touch controls ----
  function bindTouch(id, onDown, onUp) {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener("pointerdown", (e) => { e.preventDefault(); onDown(); el.classList.add("pressed"); });
    const up = (e) => { if (e) e.preventDefault(); el.classList.remove("pressed"); onUp && onUp(); };
    el.addEventListener("pointerup", up); el.addEventListener("pointerleave", up); el.addEventListener("pointercancel", up);
  }
  bindTouch("touch-up", () => pressDir("up"), () => releaseDir("up"));
  bindTouch("touch-down", () => pressDir("down"), () => releaseDir("down"));
  bindTouch("touch-left", () => pressDir("left"), () => releaseDir("left"));
  bindTouch("touch-right", () => pressDir("right"), () => releaseDir("right"));
  bindTouch("touch-action", () => interact());

  // test handle for the headless validator bot (tools/bot.mjs)
  try {
    Object.assign(window.__tq, { interact, nextUp, dayTick: (ms) => dayTick(ms, false), facedTarget, isModalOpen, finalScore, careerScore, spawnWalkup, firePage });
    state._mapRows = () => mapDef(state.map).map;
    state._occupied = (x, y) => !isWalkable(x, y) || !!(npcAt(x, y) || solidPropAt(x, y));
    state._npcs = () => NPCS; state._props = () => PROPS;
  } catch { /* ignore */ }

  // ---- title screen: 8-bit start menu -> character select -> orientation ----
  const titleEl = document.getElementById("title-screen");
  const menuEl = document.getElementById("title-menu");
  let menuItems = [];
  let menuIdx = 0;

  function hideTitle() { if (titleEl) titleEl.style.display = "none"; }
  function startPlay() {
    state.started = true;
    hideTitle();
    try { dayRestore(); } catch (e) { console.error(e); }
    state.updateProgressUI();
    try { viewport.focus(); } catch { /* ignore */ }
    if (state.day > LAST_DAY && !state.hasFlag("scoreSubmitted")) showArcade();
  }
  // shown right after the character is locked in: orientation (once) -> Day 1 morning
  function orientationThenPlay() {
    const morning = () => { state.setFlag("morning_" + state.day); try { dayRestore(); } catch (e) { console.error(e); } state.updateProgressUI(); openMorning(); };
    if (!state.hasFlag("oriented")) openOrientation(() => { state.setFlag("oriented"); morning(); });
    else morning();
  }
  function newCharacter() {
    // CHANGE CHARACTER / START = a fresh Cutover Week run with a new look
    if (state.playerName && (state.day > 1 || state.solved.size || (state.dd && state.dd.notes.length))) state.newPlaythrough();
    if (state.map !== "home") state.goToFloor("home", "start");
    // game goes "live" behind the modal (movement stays blocked while it's open)
    state.started = true;
    hideTitle();
    openCharacterCreator({ mode: "onboarding", onReady: orientationThenPlay });
  }
  function continueGame() { startPlay(); }
  function showTitle() {
    state.started = false;
    if (titleEl) titleEl.style.display = "";
    buildMenu();
    refreshContinueLine();
  }
  // expose the two entry points so Settings/Reset can route through them
  state.toTitle = showTitle;
  state.newGame = newCharacter;

  function buildMenu() {
    const returning = !!state.playerName;
    menuItems = returning
      ? [ { label: "CONTINUE", action: continueGame },
          { label: "NEW CAREER", action: newCharacter },
          { label: "RESET PROGRESS", action: () => openResetMenu() } ]
      : [ { label: "START GAME", action: newCharacter } ];
    menuIdx = 0;
    renderMenu();
  }
  function renderMenu() {
    if (!menuEl) return;
    menuEl.innerHTML = menuItems.map((m, i) =>
      `<button class="arcade-item ${i === menuIdx ? "sel" : ""}" data-i="${i}">${i === menuIdx ? "\u25B6 " : "\u00A0\u00A0"}${m.label}</button>`
    ).join("");
    menuEl.querySelectorAll(".arcade-item").forEach((b) => {
      b.addEventListener("click", () => { menuIdx = +b.dataset.i; menuItems[menuIdx].action(); });
      b.addEventListener("mouseenter", () => { menuIdx = +b.dataset.i; renderMenu(); });
    });
  }
  function moveMenu(d) { if (!menuItems.length) return; menuIdx = (menuIdx + d + menuItems.length) % menuItems.length; renderMenu(); }
  function activateMenu() { if (menuItems[menuIdx]) menuItems[menuIdx].action(); }
  function refreshContinueLine() {
    const cont = document.getElementById("continue-line");
    if (!cont) return;
    const hs = document.getElementById("title-hs");
    if (hs) hs.innerHTML = `<div class="hs"><h3>HIGH SCORES</h3>${hsTable(null, 10)}</div>`;
    if (state.playerName && state.day > 1) {
      cont.textContent = state.day > LAST_DAY ? `Welcome back, ${state.playerName} \u2014 career wrapped. Security Analyst.` : `Welcome back, ${state.playerName} \u2014 ${WEEKS[weekOf(state.day)].title}, Day ${state.day}.`;
    } else if (state.playerName) {
      cont.textContent = `Welcome back, ${state.playerName}.`;
    } else {
      cont.textContent = "";
    }
  }

  buildMenu();
  refreshContinueLine();

  // ---- topbar ----
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", () => { if (!isModalOpen()) openResetMenu(); });
  const soundBtn = document.getElementById("sound-btn");
  if (soundBtn) soundBtn.addEventListener("click", () => state.setSound(!state.soundOn));
  const compBtn = document.getElementById("companion-btn");
  if (compBtn) compBtn.addEventListener("click", () => { if (!isModalOpen()) openDiscoveries(); });
  const examBtn = document.getElementById("exam-btn");
  if (examBtn) examBtn.addEventListener("click", () => { if (!isModalOpen()) openQuiz(); });
  const shopBtn = document.getElementById("shop-btn");
  if (shopBtn) shopBtn.addEventListener("click", () => { if (!isModalOpen()) openShop(); });
  const achBtn = document.getElementById("ach-btn");
  if (achBtn) achBtn.addEventListener("click", () => { if (!isModalOpen()) openAchievements(); });
  const chatBtn = document.getElementById("chat-btn");
  if (chatBtn) chatBtn.addEventListener("click", () => { if (!isModalOpen() && state.started) openPhone(); });
  const notesBtn = document.getElementById("notes-btn");
  if (notesBtn) notesBtn.addEventListener("click", () => { if (!isModalOpen() && state.started) openNotes(); });
  const setBtn = document.getElementById("settings-btn");
  if (setBtn) setBtn.addEventListener("click", () => { if (!isModalOpen()) openSettings(); });

  function onResize() { sizeCanvas(canvas, viewport); }
  window.addEventListener("resize", onResize);
  // the side panel opening/closing changes the viewport width: follow it
  try { new ResizeObserver(() => onResize()).observe(viewport); } catch { /* old browsers */ }
  sizeCanvas(canvas, viewport);

  state.updateProgressUI();

  requestAnimationFrame(loop);
}
