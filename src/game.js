// Game loop and input — drives the ported renderer (renderX/renderY pixel
// positions, facing, smooth lerp walking, held-key continuous movement).

import {
  isWalkable, NPCS, PROPS, PLAYER_START, TILE, MAP_W, MAP_H,
  setFloor, FLOOR_ID, FLOOR_META, FLOOR_ORDER, LOC_LABEL
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
  openScenario, openEndOfDay, openIntro, handleEscape,
  openPet, openSearch, openChest, openDiscoveries,
  openElevator, openQuiz,
  openCharacterCreator, openSettings, openShop, openAchievements, showAchievementToast
} from "./ui.js";
import { FINDS, FINDTOTAL } from "./collectables.js";
import { scenarioIdsForFloor, scenarioCountForFloor } from "./scenarios.js";
import { DEFAULT_SPRITE } from "./cosmetics.js";
import { XP, rank, newlyUnlocked, ACHIEVEMENTS } from "./progression.js";
import { applyTheme, currentTheme, applyPrefs } from "./theme.js";
import { serializeSave, saveFilename, applySaveText } from "./savefile.js";

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
  return true;
}
function npcAt(x, y) { return NPCS.find((n) => n.x === x && n.y === y); }
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

export async function startGame() {
  applyTheme(currentTheme());
  applyPrefs();
  await loadAssets(SPRITE_MANIFEST);

  const canvas = document.getElementById("world");
  const viewport = document.getElementById("viewport");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // Restore which floor the player was on BEFORE we read PLAYER_START, so the
  // spawn point and live MAP/NPCS/PROPS bindings all reflect the right floor.
  const savedFloor = loadString("floor", "floor3");
  setFloor(savedFloor);

  const state = {
    map: FLOOR_ID,
    floor: FLOOR_ID,
    px: PLAYER_START.x, py: PLAYER_START.y,
    renderX: PLAYER_START.x * TILE, renderY: PLAYER_START.y * TILE,
    facing: PLAYER_START.dir,
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
    addFind(id) {
      if (this.finds.has(id)) return false;
      this.finds.add(id); saveSet("finds", this.finds); this.addXp(XP.find); this.updateProgressUI(); return true;
    },
    addCoins(n) { this.coins += n; saveNum("coins", this.coins); this.updateProgressUI(); this.checkAchievements(); },
    addTokens(n) { this.tokens += n; saveNum("tokens", this.tokens); this.updateProgressUI(); },
    // --- whole-game reset / save-file ---
    doReset() {
      clearAll();
      setFloor("floor3");
      this.floor = "floor3"; this.map = "floor3";
      this.solved = new Set(); this.sqSolved = new Set(); this.sharp = new Set();
      this.flags = new Set(); this.finds = new Set(); this.coins = 0; this.tokens = 0;
      this.owned = new Set(); this.achievements = new Set(); this.xp = 0;
      this.playerName = ""; this.day = 1; this.lifeTickets = 0; this.lifeSideQuests = 0;
      this.playerSprite = { ...DEFAULT_SPRITE };
      this.px = PLAYER_START.x; this.py = PLAYER_START.y;
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
    startNewDay() {
      this.day += 1; saveNum("day", this.day);
      this.solved = new Set(); this.sqSolved = new Set(); this.sharp = new Set();
      saveSet("solved", this.solved); saveSet("sq-solved", this.sqSolved); saveSet("sharp", this.sharp);
      this.px = PLAYER_START.x; this.py = PLAYER_START.y;
      this.renderX = this.px * TILE; this.renderY = this.py * TILE;
      this.facing = PLAYER_START.dir; this.moving = false;
      this.updateProgressUI();
    },
    // --- floors ---
    // how many of THIS floor's tickets are solved (solved Set is shared across floors)
    solvedOnFloor(floorId) {
      return scenarioIdsForFloor(floorId).filter((id) => this.solved.has(id)).length;
    },
    floorCleared(floorId) {
      return this.solvedOnFloor(floorId) >= scenarioCountForFloor(floorId);
    },
    goToFloor(id) {
      setFloor(id);
      this.floor = id; this.map = id; saveString("floor", id);
      if (id === "floor7") this.setFlag("visitedFloor7");
      this.px = PLAYER_START.x; this.py = PLAYER_START.y;
      this.renderX = this.px * TILE; this.renderY = this.py * TILE;
      this.facing = PLAYER_START.dir; this.moving = false;
      const lab = document.getElementById("loc-label");
      if (lab) lab.textContent = LOC_LABEL;
      const fp = document.getElementById("floor-pill");
      if (fp) fp.textContent = FLOOR_META[id] ? FLOOR_META[id].name : id;
      this.updateProgressUI();
      this.checkAchievements();
    },
    updateProgressUI() {
      document.getElementById("day-pill").textContent = `Day ${this.day}`;
      // Mark floors cleared (gates + achievements) the moment tickets are all solved.
      if (this.floorCleared("floor3")) this.setFlag("floor3Cleared");
      if (this.floorCleared("floor7")) this.setFlag("floor7Cleared");
      const here = this.floor;
      const total = scenarioCountForFloor(here);
      const done = this.solvedOnFloor(here);
      document.getElementById("ticket-progress").textContent = `${done} / ${total} tickets`;
      const n = this.sqSolved.size;
      document.getElementById("sq-progress").textContent = `${n} side quest${n === 1 ? "" : "s"}`;
      document.getElementById("eod-hint").hidden = !(done === total) || this.inEndOfDay;
      const fpill = document.getElementById("floor-pill");
      if (fpill) fpill.textContent = FLOOR_META[here] ? FLOOR_META[here].name : here;
      const lab = document.getElementById("loc-label");
      if (lab) lab.textContent = LOC_LABEL;
      const fp = document.getElementById("finds-progress");
      if (fp) fp.textContent = `\u2605 ${this.finds.size}/${FINDTOTAL}`;
      const cp = document.getElementById("coins-progress");
      if (cp) cp.textContent = `\u{1FA99} ${this.coins}${this.tokens ? ` \u00b7 \u{1F39F}\uFE0F ${this.tokens}` : ""}`;
      const rp = document.getElementById("rank-pill");
      if (rp) { const r = rank(this.xp); rp.textContent = `Lv ${r.level} \u00b7 ${r.title}`; rp.title = r.next ? `${r.into}/${r.span} XP to ${r.next}` : "Max rank"; }
    }
  };

  const stepSound = makeStepSound();
  S = state;  // expose to the module-level visibility helpers
  function updateSoundUI(on) {
    const b = document.getElementById("sound-btn"); if (b) b.textContent = on ? "Sound: on" : "Sound: off";
  }
  updateSoundUI(state.soundOn);

  initUI(state, () => {});

  function isModalOpen() {
    return state.inScenario || state.inSideQuest || state.inTicketBoard || state.inIntro || state.inEndOfDay || state.inDialog;
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
    }
    return null;
  }

  function startMove(dir) {
    state.facing = dir;
    const [dx, dy] = DIRS[dir];
    const nx = state.px + dx, ny = state.py + dy;
    if (!isWalkable(nx, ny) || npcAt(nx, ny) || solidPropAt(nx, ny)) {
      state.shake = 0.45;
      return;
    }
    state.fromX = state.px * TILE; state.fromY = state.py * TILE;
    state.px = nx; state.py = ny;            // logical position updates immediately
    state.toX = nx * TILE; state.toY = ny * TILE;
    state.moveT = 0; state.moving = true;
    stepSound.play(state.soundOn);
  }

  function interact() {
    if (isModalOpen() || state.moving) return;
    const t = facedTarget();
    if (!t) return;
    if (t.kind === "npc") {
      const n = t.target;
      if (n.ticket && !state.solved.has(n.ticket)) openScenario(n.ticket);
      else if (n.sideQuest && !state.sqSolved.has(n.sideQuest)) openSideQuest(n.sideQuest);
      else openNpcChat(n);
    } else if (t.kind === "monitor") {
      if (state.floorCleared(state.floor)) openEndOfDay(); else openTicketBoard();
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

  function updateInteractHint(t) {
    const hintEl = document.getElementById("interact-hint");
    const actBtn = document.getElementById("touch-action");
    if (t && !isModalOpen() && !state.moving) {
      let label = "Interact";
      if (t.kind === "npc") label = `Talk to ${t.target.name}`;
      else if (t.kind === "monitor") label = "Read ticket board";
      else if (t.kind === "elevator") label = "Take the elevator";
      else if (t.kind === "pet") label = `Approach ${t.target.name || "the cat"}`;
      else if (t.kind === "search") label = `Examine ${t.target.label}`;
      else if (t.kind === "chest") label = `Check ${t.target.label}`;
      else if (t.kind === "prop-sq") label = t.target.label;
      document.getElementById("interact-hint-text").textContent = `Press E: ${label}`;
      hintEl.classList.add("visible");
      if (actBtn) actBtn.classList.add("ready");
    } else {
      hintEl.classList.remove("visible");
      if (actBtn) actBtn.classList.remove("ready");
    }
  }

  // ---- main loop ----
  let lastT = 0;
  function loop(t) {
    if (!lastT) lastT = t;
    const dt = Math.min(50, t - lastT);  // clamp: tab-away then back won't teleport
    lastT = t;
    state.tick += 1;

    if (state.moving) {
      state.moveT += dt / MOVE_MS;
      if (state.moveT >= 1) { state.moveT = 1; state.moving = false; }
      state.renderX = state.fromX + (state.toX - state.fromX) * state.moveT;
      state.renderY = state.fromY + (state.toY - state.fromY) * state.moveT;
    } else {
      state.renderX = state.px * TILE; state.renderY = state.py * TILE;
      if (state.started && !isModalOpen()) {
        const d = heldDir();
        if (d) startMove(d);
      }
    }

    if (state.shake > 0) { state.shake *= SHAKE_DECAY; if (state.shake < 0.05) state.shake = 0; }

    const t2 = (state.started && !isModalOpen()) ? facedTarget() : null;
    draw(ctx, state, t2);
    updateInteractHint(t2);
    requestAnimationFrame(loop);
  }

  // ---- keyboard ----
  function isTyping(el) { return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable); }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (isModalOpen()) { e.preventDefault(); handleEscape(); } return; }
    if (isTyping(document.activeElement)) return;
    if (isModalOpen()) return;
    const dir = KEY_TO_DIR[e.key];
    if (dir) { e.preventDefault(); pressDir(dir); }
    else if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") { e.preventDefault(); interact(); }
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

  // ---- title screen start ----
  function begin() {
    if (state.started) return;
    state.started = true;
    const ts = document.getElementById("title-screen");
    if (ts) ts.style.display = "none";
    viewport.focus();
    if (!state.playerName) openCharacterCreator();
  }
  const startBtn = document.getElementById("start-btn");
  if (startBtn) startBtn.addEventListener("click", begin);
  // also allow space/enter/click on the title
  window.addEventListener("keydown", (e) => {
    if (!state.started && (e.key === " " || e.key === "Enter")) { e.preventDefault(); begin(); }
  });
  const ts = document.getElementById("title-screen");
  if (ts) ts.addEventListener("click", begin);

  // ---- topbar ----
  const resetBtn = document.getElementById("reset-btn");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    if (!confirm("Clear ALL saved progress \u2014 day count, stats, character, and name \u2014 and start completely over?")) return;
    state.doReset();
    openCharacterCreator();
  });
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
  const setBtn = document.getElementById("settings-btn");
  if (setBtn) setBtn.addEventListener("click", () => { if (!isModalOpen()) openSettings(); });

  function onResize() { sizeCanvas(canvas, viewport); }
  window.addEventListener("resize", onResize);
  sizeCanvas(canvas, viewport);

  state.updateProgressUI();
  // continue line on the title screen
  const cont = document.getElementById("continue-line");
  if (cont && state.solved.size > 0) {
    const here = state.floor;
    cont.textContent = `Progress found: ${state.solvedOnFloor(here)}/${scenarioCountForFloor(here)} tickets on ${FLOOR_META[here] ? FLOOR_META[here].name : here}.`;
  }

  requestAnimationFrame(loop);
}
