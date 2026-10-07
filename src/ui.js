// UI layer: everything that happens inside the modal popup.

import { SCENARIOS, scenarioIdsForFloor, scenarioCountForFloor } from "./scenarios.js";
import { SIDE_QUESTS, sideQuestIdsForFloor } from "./sideQuests.js";
import { NPCS, PROPS, FLOOR_META, FLOOR_ORDER, LOC_LABEL, mapDef, MAP_IDS } from "./world.js";
import { FINDS, FINDTOTAL } from "./collectables.js";
import { saveSet, loadNum, saveNum } from "./storage.js";
import { sampleQuiz, quizPoolSize } from "./quiz.js";
import { drawSpritePreview } from "./render.js";
import {
  PRESETS, SKIN_TONES, HAIR_COLORS, SHIRT_COLORS, ACCENT_COLORS,
  ACCESSORIES, SHOP_ITEMS, PREMIUM_SHIRTS, darken, randomSprite, DEFAULT_SPRITE
} from "./cosmetics.js";
import { rank, ACHIEVEMENTS, ACHTOTAL, XP } from "./progression.js";
import { ticketOpen, afterTicketSolved, orientationPagesV2 } from "./days.js";
import { BADGES, LINGO } from "./pools.js";
import { DD } from "./core.js";
import { taughtChip, trainingLibraryHtml, openTraining } from "./training.js";
import {
  THEMES, currentTheme, applyTheme, prefs,
  setReducedMotion, setColorblind, setBigText
} from "./theme.js";

const els = {};
let state;
let onClose;

export function initUI(globalState, onCloseCb) {
  state = globalState;
  onClose = onCloseCb;
  els.bg = document.getElementById("modal-bg");
  els.title = document.getElementById("modal-title");
  els.subtitle = document.getElementById("modal-subtitle");
  els.body = document.getElementById("modal-body");
  els.avatar = document.getElementById("modal-avatar");
  els.close = document.getElementById("modal-close");
  els.close.addEventListener("click", closeModal);
  // v2.2: the popup sits over the map; clicking the dimmed map does NOT close it
  // (that used to lose half-finished conversations). Use the buttons, × or Esc.
}

function openModal(title, subtitle, avatarLetter, bodyHtml, opts = {}) {
  els.title.textContent = title;
  els.subtitle.textContent = subtitle;
  setAvatar(avatarLetter, opts.sprite);
  els.body.innerHTML = bodyHtml;
  els.bg.hidden = false;
  els.close.hidden = !!opts.hideClose;
  // v2.2: the panel is a popup over the map; start it scrolled to the top
  try { els.bg.querySelector(".modal").scrollTop = 0; } catch { /* ignore */ }
}

// v2: the avatar can be a letter/emoji OR a little pixel portrait.
function setAvatar(letter, sprite) {
  if (sprite) {
    els.avatar.innerHTML = "";
    const c = document.createElement("canvas");
    c.width = 40; c.height = 40; c.className = "avatar-canvas";
    try { drawSpritePreview(c, sprite, "down", 2); } catch { /* ignore */ }
    els.avatar.appendChild(c);
    els.avatar.classList.add("has-portrait");
  } else {
    els.avatar.classList.remove("has-portrait");
    els.avatar.textContent = letter || "?";
  }
}

// ---- v2 panel API: build modal content with DOM helpers ------------------
// panel() opens the side panel with an empty body; pAdd/pBtn append to it.
export function panel(title, subtitle, avatar, opts = {}) {
  state.inDialog = true;
  const sprite = avatar && typeof avatar === "object" ? avatar : null;
  openModal(title, subtitle || "", sprite ? "" : (avatar || "i"), "", { ...opts, sprite });
  return els.body;
}
export function pAdd(html, cls) {
  const d = document.createElement("div");
  if (cls) d.className = cls;
  d.innerHTML = html;
  els.body.appendChild(d);
  return d;
}
export function pBtn(label, fn, cls = "primary-btn act") {
  const b = document.createElement("button");
  b.className = cls; b.innerHTML = label;
  b.addEventListener("click", fn);
  els.body.appendChild(b);
  return b;
}
export function pClear() { els.body.innerHTML = ""; }
export function pBody() { return els.body; }
export function pSubtitle(t) { els.subtitle.textContent = t; }
export function panelOpen() { return els.bg && !els.bg.hidden; }
export function closePanel() { closeModal(); }

function closeModal() {
  els.bg.hidden = true;
  els.close.hidden = false;
  state.inScenario = false;
  state.inSideQuest = false;
  state.inTicketBoard = false;
  state.inIntro = false;
  state.inEndOfDay = false;
  state.inDialog = false;
  state.currentScenario = null;
  state.scenarioSolved = false;
  state.updateProgressUI();
  onClose?.();
}

// Escape key handler shared with game.js. Closes whatever's open; for the
// intro it commits a default name first so the player isn't stuck.
export function handleEscape() {
  if (state.inIntro) {
    const input = document.getElementById("cc-name") || document.getElementById("intro-name");
    const typed = ((input && input.value) || "").trim();
    // keep a typed name; otherwise preserve the existing one (don't clobber on cancel)
    state.setPlayerName(typed || state.playerName || "you");
  }
  closeModal();
}

// --- intro ----------------------------------------------------------------

export function openIntro() {
  state.inIntro = true;
  const nameVal = state.playerName || "";
  openModal(
    state.day > 1 ? `Day ${state.day}` : "Day one",
    "IT support \u00b7 Floor 3",
    "i",
    `<div>
       <p style="margin:0 0 10px;">Welcome to floor 3. You're the IT person.</p>
       <p style="margin:0 0 10px;">There's a <strong>ticket monitor</strong> in your office showing the queue. Walk to it, see what's open, then find the people who filed the tickets.</p>
       <p style="margin:0 0 14px;color:var(--text-muted);font-size:12px;">Side quests aren't on the board. You'll find them by walking around and noticing things.</p>
       <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:4px;">Your name</label>
       <input id="intro-name" type="text" maxlength="20" value="${escapeAttr(nameVal)}" placeholder="What should they call you?" autocomplete="off" />
       <div class="intro-foot">
         <div class="intro-controls">Arrow keys / WASD to move \u00b7 Space to interact</div>
         <button id="intro-start" class="primary-btn">Start the day \u2192</button>
       </div>
     </div>`,
    { hideClose: true }
  );
  const input = document.getElementById("intro-name");
  const btn = document.getElementById("intro-start");
  input.focus();
  input.select();
  const go = () => {
    const v = (input.value || "").trim() || "you";
    state.setPlayerName(v);
    closeModal();
  };
  btn.addEventListener("click", go);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
}

// --- NPC casual chat ------------------------------------------------------

export function openNpcChat(n) {
  // before their ticket has been solved, people talk like it hasn't happened yet
  const pre = n.preChat && n.ticket && !state.solved.has(n.ticket);
  const lines = (pre ? n.preChat : n.chat) || ["Everything's good here right now, thanks for checking in."];
  const line = lines[Math.floor(Math.random() * lines.length)];
  state.inDialog = true;
  openModal(n.name, n.role || "", n.name[0], `<p style="margin:0;">${escapeHtml(line)}</p>`, { sprite: n.sprite });
}

// --- Ticket monitor -------------------------------------------------------

export function openTicketBoard() {
  state.inTicketBoard = true;
  const here = state.floor;
  const meta = FLOOR_META[here] || { name: here, tag: "" };
  const ids = scenarioIdsForFloor(here).filter((id) => ticketOpen(id) || state.solved.has(id));
  const rows = ids.map((id) => {
    const s = SCENARIOS[id];
    if (!s) return "";
    const isSolved = state.solved.has(id);
    let npc = NPCS.find((n) => n.ticket === id), where = "";
    if (!npc) for (const m of MAP_IDS) { const f = mapDef(m).npcs.find((n) => n.ticket === id); if (f) { npc = f; where = " (" + FLOOR_META[m].name + ")"; break; } }
    const cert = s.cert ? `<span class="ticket-cert">${escapeHtml(s.cert)}</span>` : "";
    return `
      <div class="ticket-row ${isSolved ? "solved" : ""}">
        <span class="ticket-row-icon">${isSolved ? "\u2713" : "\u25cf"}</span>
        <div class="ticket-row-main">
          <div class="ticket-row-title">${escapeHtml(s.title)} ${cert}</div>
          <div class="ticket-row-meta">${escapeHtml(s.ticketMeta)}</div>
        </div>
        <span class="ticket-row-status">${isSolved ? "solved" : `find ${npc ? escapeHtml(npc.name) + escapeHtml(where) : ""}`}</span>
      </div>`;
  }).join("");

  openModal(
    `${meta.name} ticket queue`,
    `${escapeHtml(meta.tag)} \u00b7 Day ${state.day}`,
    "i",
    `<div>${rows || '<div class="ev-empty">Queue is empty. Enjoy it while it lasts.</div>'}</div>
     <div style="font-size:11px;color:var(--text-faint);margin-top:10px;padding-top:8px;border-top:0.5px solid var(--border);">
       New tickets land each morning. Walk to the person named on the ticket to take it on. Every close is a chance to write good notes; Gloria reads them all.
     </div>`
  );
}

// --- Side quest -----------------------------------------------------------

export function openSideQuest(id) {
  state.inSideQuest = true;
  const sq = SIDE_QUESTS[id];
  const optsHtml = sq.options.map((o) =>
    `<button class="dx-btn sq-opt" data-key="${o.key}">${escapeHtml(o.label)}</button>`
  ).join("");

  openModal(sq.title, sq.where, "?",
    `<div style="margin-bottom:10px;">${escapeHtml(sq.body)}</div>${taughtChip(id)}
     <div style="font-size:11px;color:var(--text-faint);margin-bottom:6px;">Side quest \u2014 one shot, quick call.</div>
     <div id="sq-opts" class="btn-column">${optsHtml}</div>
     <div id="sq-feedback"></div>`);

  document.querySelectorAll("#sq-opts .sq-opt").forEach((b) => {
    b.addEventListener("click", () => resolveSideQuest(id, b.dataset.key));
  });
}

function resolveSideQuest(id, key) {
  const sq = SIDE_QUESTS[id];
  const opt = sq.options.find((o) => o.key === key);
  // lock all options after first answer
  document.querySelectorAll("#sq-opts .sq-opt").forEach((b) => {
    if (b.dataset.key === key) b.classList.add(opt.correct ? "correct" : "wrong");
    b.disabled = true;
  });
  const fb = document.getElementById("sq-feedback");
  fb.className = "scenario-feedback " + (opt.correct ? "win" : "lose");
  fb.innerHTML = `<div>${escapeHtml(opt.feedback)}</div>
    <div style="margin-top:8px;"><button id="sq-close" class="primary-btn">${opt.correct ? "Done" : "Close"}</button></div>`;
  document.getElementById("sq-close").addEventListener("click", closeModal);
  if (opt.correct && !state.sqSolved.has(id)) {
    state.sqSolved.add(id);
    saveSet("sq-solved", state.sqSolved);
    state.recordSideQuestSolved();
    if (sq.reward) {
      if (sq.reward.coins) state.addCoins(sq.reward.coins);
      if (sq.reward.find) state.addFind(sq.reward.find);
    }
    state.addXp(XP.sideQuest);
    state.updateProgressUI();
  }
}

// --- Main scenario --------------------------------------------------------

export function openScenario(id) {
  state.inScenario = true;
  state.currentScenario = id;
  state.scenarioSolved = false;
  state.actionsLeft = SCENARIOS[id].actions;
  state.investigated = new Set();
  state.evidenceLog = [];
  state.triedAnswers = new Set();
  state.usedFollowups = new Set();
  renderScenario();
}

function renderScenario() {
  const s = SCENARIOS[state.currentScenario];
  const poiBtns = s.pois.map((p) => {
    const done = state.investigated.has(p.id);
    return `<button class="dx-btn poi-btn" data-id="${p.id}" ${done ? 'data-done="1"' : ""}>
      ${done ? "\u2713 " : ""}${escapeHtml(p.label)}
    </button>`;
  }).join("");
  const dxBtns = s.diagnoses.map((d) =>
    `<button class="dx-btn dxc-btn" data-key="${d.key}">${escapeHtml(d.label)}</button>`
  ).join("");

  openModal(s.title, `${s.ticketMeta} \u00b7 ${state.actionsLeft} actions left`, "i",
    `${taughtChip(state.currentScenario)}<div class="scenario-grid">
      <div>
        <div class="scenario-section-label">Investigate</div>
        <div class="btn-column" id="poi-col">${poiBtns}</div>
        <div class="scenario-section-label">Diagnosis</div>
        <div class="btn-column" id="dx-col">${dxBtns}</div>
      </div>
      <div>
        <div class="scenario-section-label">Evidence</div>
        <div id="ev-list" class="ev-list">${evidenceListHtml()}</div>
        <div id="action-note"></div>
        <div id="scenario-feedback"></div>
        <div id="poi-detail"></div>
      </div>
    </div>`);

  document.querySelectorAll(".poi-btn").forEach((b) => {
    b.addEventListener("click", () => investigatePoi(b.dataset.id));
  });
  document.querySelectorAll(".dxc-btn").forEach((b) => {
    b.addEventListener("click", () => commitDiagnosis(b.dataset.key));
  });
  updateActionNote();
}

function evidenceListHtml() {
  if (state.evidenceLog.length === 0)
    return `<div class="ev-empty">Nothing yet. Investigate the scene.</div>`;
  return state.evidenceLog
    .map((e) => `<div class="ev-item"><div class="ev-where">${escapeHtml(e.where)}</div><div>${escapeHtml(e.text)}</div></div>`)
    .join("");
}

function updateActionNote() {
  const note = document.getElementById("action-note");
  if (!note) return;
  if (state.scenarioSolved) { note.innerHTML = ""; return; }
  if (state.actionsLeft <= 0) {
    note.innerHTML = `<div class="action-note">Out of actions. Commit to your best diagnosis from the evidence you have.</div>`;
  } else {
    note.innerHTML = "";
  }
}

function investigatePoi(poiId) {
  if (state.scenarioSolved) return;
  const s = SCENARIOS[state.currentScenario];
  const poi = s.pois.find((p) => p.id === poiId);
  if (!poi) return;
  if (!state.investigated.has(poiId)) {
    if (state.actionsLeft <= 0) return;
    state.actionsLeft -= 1;
    state.investigated.add(poiId);
    state.evidenceLog.push({ where: poi.label, text: poi.evidence });
  }

  const fuHtml = (poi.followups || [])
    .map((f, idx) => {
      const fuKey = `${poiId}-${idx}`;
      if (state.usedFollowups.has(fuKey)) return "";
      return `<button class="fu-btn poi-fu" data-poi="${poiId}" data-idx="${idx}">${escapeHtml(f.label)}</button>`;
    })
    .join("");

  document.getElementById("poi-detail").innerHTML =
    `<div class="poi-detail">
       <div class="poi-detail-title">${escapeHtml(poi.label)}</div>
       <div class="poi-detail-body">${escapeHtml(poi.body)}</div>
       ${fuHtml ? `<div class="poi-followups">${fuHtml}</div>` : ""}
     </div>`;

  document.querySelectorAll(".poi-fu").forEach((b) => {
    b.addEventListener("click", () => doFollowup(b.dataset.poi, parseInt(b.dataset.idx, 10)));
  });
  refreshScenarioState();
}

function refreshScenarioState() {
  const s = SCENARIOS[state.currentScenario];
  els.subtitle.textContent = `${s.ticketMeta} \u00b7 ${state.actionsLeft} actions left`;
  document.getElementById("ev-list").innerHTML = evidenceListHtml();
  document.querySelectorAll(".poi-btn").forEach((b) => {
    if (state.investigated.has(b.dataset.id)) {
      b.dataset.done = "1";
      if (!b.textContent.trim().startsWith("\u2713")) {
        b.textContent = "\u2713 " + b.textContent.trim();
      }
    }
  });
  updateActionNote();
}

function doFollowup(poiId, idx) {
  if (state.scenarioSolved) return;
  const s = SCENARIOS[state.currentScenario];
  const poi = s.pois.find((p) => p.id === poiId);
  const fu = poi.followups[idx];
  if (state.actionsLeft <= 0) return;
  state.actionsLeft -= 1;
  state.usedFollowups.add(`${poiId}-${idx}`);
  if (fu.addEvidence) state.evidenceLog.push({ where: poi.label + " \u2192", text: fu.addEvidence });

  const btn = document.querySelector(`.poi-fu[data-poi="${poiId}"][data-idx="${idx}"]`);
  if (btn) btn.remove();
  const detail = document.getElementById("poi-detail");
  detail.innerHTML += `<div class="terminal">${escapeHtml(fu.result)}</div>`;
  refreshScenarioState();
}

function lockScenarioButtons() {
  document.querySelectorAll("#poi-col .poi-btn, #dx-col .dxc-btn, .poi-fu").forEach((b) => {
    b.disabled = true;
  });
}

function commitDiagnosis(key) {
  if (state.scenarioSolved) return;
  const s = SCENARIOS[state.currentScenario];
  if (state.triedAnswers.has(key)) return;
  state.triedAnswers.add(key);
  const dx = s.diagnoses.find((d) => d.key === key);
  document.querySelectorAll(".dxc-btn").forEach((b) => {
    if (b.dataset.key === key) b.classList.add(dx.correct ? "correct" : "wrong");
  });
  const fb = document.getElementById("scenario-feedback");
  fb.className = "scenario-feedback " + (dx.correct ? "win" : "lose");
  if (dx.correct) {
    state.scenarioSolved = true;
    const firstTry = state.triedAnswers.size === 1; // only the correct key was tried
    if (!state.solved.has(state.currentScenario)) {
      state.solved.add(state.currentScenario);
      saveSet("solved", state.solved);
      state.recordTicketSolved();
      let gained = XP.ticket;
      if (firstTry) { state.sharp.add(state.currentScenario); saveSet("sharp", state.sharp); gained += XP.firstTry; }
      const wasCleared = state.floorCleared(state.floor);
      state.addXp(gained);
      // floor-clear bonus the first time a floor is fully solved
      if (!wasCleared && state.floorCleared(state.floor)) state.addXp(XP.floorCleared);
    }
    state.updateProgressUI();
    lockScenarioButtons();
    updateActionNote();
    fb.innerHTML =
      `<div><strong>Ticket closed.</strong></div>
       <div style="margin:6px 0;">${escapeHtml(dx.feedback)}</div>
       <div class="principle-callout">
         <strong>Principle \u2014 ${escapeHtml(s.principle)}.</strong> ${escapeHtml(s.principleText)}
       </div>
       <div id="dx-doc"></div>`;
    afterTicketSolved(state.currentScenario, firstTry, document.getElementById("dx-doc"));
  } else {
    fb.innerHTML = `<div><strong>Ticket still open.</strong></div><div>${escapeHtml(dx.feedback)}</div>`;
  }
}

// --- SDV: the pet (Mittens) -----------------------------------------------
// A 3-beat befriend quest driven entirely by flags:
//   meet -> bring food -> feed (reveals the stash) -> she nudges you to it.
export function openPet(p) {
  state.inDialog = true;
  const name = p.name || "the cat";
  let title = name, sub = `${p.room || "Office"} \u00b7 stray`, body, btn = "Done";

  if (!state.hasFlag("catMet")) {
    state.setFlag("catMet");
    sub = `${p.room} \u00b7 hungry`;
    body = `A thin orange cat is sitting by an empty bowl. She looks up at you and meows \u2014 not pitifully, more like she's filing a ticket.<br><br>
      Somebody used to feed her. There was a <strong>supply cabinet in the print room</strong> with a pouch of food in it, if it's still there.`;
  } else if (!state.hasFlag("hasCatFood")) {
    sub = `${p.room} \u00b7 hungry`;
    body = `${name} headbutts the empty bowl and looks at you expectantly. You'll need to find that <strong>cat food in the print room supply cabinet</strong> first.`;
  } else if (!state.hasFlag("catFed")) {
    state.setFlag("catFed");
    state.setFlag("catRevealed");
    sub = `${p.room} \u00b7 friend`;
    body = `You tip the food into the bowl. ${name} inhales it, then headbutts your shin hard enough to count as a hug.<br><br>
      She trots to the corner, sits under a sagging ceiling tile, and <strong>paws at it until it tips</strong> \u2014 there's something taped up there. Better take a look.`;
    btn = "Take a look \u2192";
  } else if (!state.hasFlag("stashTaken")) {
    sub = `${p.room} \u00b7 friend`;
    body = `${name} is purring like a small motor. She keeps glancing at the <strong>loose ceiling tile</strong> in the corner. Whatever she found, she wants you to have it.`;
  } else {
    sub = `${p.room} \u00b7 friend`;
    const lines = [
      `${name} flops over so you can see her belly. It is a trap; you know it is a trap; you pet her anyway.`,
      `${name} is asleep in a sunbeam on the carpet. All tickets can wait.`,
      `${name} blinks at you slowly. In cat, that's "you're alright."`
    ];
    body = lines[Math.floor(Math.random() * lines.length)];
  }

  openModal(name, sub, "\u{1F408}", `<p style="margin:0;">${body}</p>
    <div style="margin-top:12px;"><button id="pet-close" class="primary-btn">${btn}</button></div>`);
  document.getElementById("pet-close").addEventListener("click", closeModal);
}

// --- SDV: a `search` prop (examine furniture; may grant a carry-flag) -------
export function openSearch(p) {
  state.inDialog = true;
  let body, btn = "Close";
  if (p.giveFlag && state.hasFlag(p.giveFlag)) {
    body = p.empty || "Nothing more in here.";
  } else if (p.needPriorFlag && !state.hasFlag(p.needPriorFlag)) {
    body = p.lockedText || "Nothing in here you need right now.";
  } else {
    body = p.take || "You find something.";
    if (p.giveFlag) { state.setFlag(p.giveFlag); btn = "Take it"; }
    if (p.findReward) state.addFind(p.findReward);
  }
  openModal(p.title || (p.label || "Cabinet").toUpperCase(), p.room || "", "\u{1F50E}",
    `<p style="margin:0;">${escapeHtml(body)}</p>
     <div style="margin-top:12px;"><button id="search-close" class="primary-btn">${btn}</button></div>`);
  document.getElementById("search-close").addEventListener("click", closeModal);
}

// --- SDV: a hidden `chest` (the economy bootstrap) --------------------------
export function openChest(p) {
  state.inDialog = true;
  const already = state.hasFlag(p.doneFlag);
  let body, rewardHtml = "";
  if (already) {
    body = p.done || "It's empty now.";
  } else {
    body = p.give || "You found a stash.";
    const bits = [];
    if (p.coins)  { state.addCoins(p.coins);  bits.push(`\u{1FA99} ${p.coins} coins`); }
    if (p.tokens) { state.addTokens(p.tokens); bits.push(`\u{1F39F}\uFE0F ${p.tokens} break-room token`); }
    if (p.findReward && FINDS[p.findReward] && state.addFind(p.findReward)) {
      bits.push(`${FINDS[p.findReward].icon} ${FINDS[p.findReward].name}`);
    }
    state.setFlag(p.doneFlag);
    rewardHtml = `<div class="reward-row">${bits.map((b) => `<span class="reward-chip">${b}</span>`).join("")}</div>
      <div style="font-size:11px;color:var(--text-faint);margin-top:8px;">Tokens get you into the secret break-room. (That part's coming.)</div>`;
  }
  openModal(p.title || "STASH", p.room || "", "\u{1F4E6}",
    `<p style="margin:0;">${escapeHtml(body)}</p>${rewardHtml}
     <div style="margin-top:12px;"><button id="chest-close" class="primary-btn">Nice</button></div>`);
  document.getElementById("chest-close").addEventListener("click", closeModal);
}

// --- SDV: the Field Companion / Discoveries gallery -------------------------
function currentObjectives() {
  const o = [];
  const here = state.floor;
  if (here === "floor5") {
    o.push("The NOC queue board (by the elevator) lists Network Week's tickets. Most of them are people you know on Floor 3.");
    o.push("Rosa's slides are on the Training room projector. Rewatch them any time from the Training library below.");
  } else if (here !== "floor7") {
    if (!state.hasFlag("catMet")) o.push("Find the office cat (she's in the conf. room).");
    else if (!state.hasFlag("hasCatFood")) o.push("Mittens is hungry \u2014 find cat food in the print room supply cabinet.");
    else if (!state.hasFlag("catFed")) o.push("Bring the cat food back to Mittens.");
    else if (state.hasFlag("catRevealed") && !state.hasFlag("stashTaken")) o.push("Check the loose ceiling tile Mittens pawed open.");
    if (!state.sqSolved.has("usbDrop")) o.push("Deal with the mystery USB stick on the open-desk floor.");
    if (!state.floor5Open()) o.push("Floor 5 (Network Ops) opens in Network Week. Floor 7 (the SOC) opens in SOC Week.");
    else if (!state.floor7Open()) o.push("Floor 7 (the SOC) opens in SOC Week.");
  } else {
    // Floor 7 side quests live on devices around the SOC.
    const sqLabels = {
      defaultCreds: "Audit the network switch in the network closet (default creds?).",
      exposedRdp: "Review the firewall console in the analyst pit (exposed RDP?).",
      secretInRepo: "Check the OSINT terminal in the red-team lab (leaked secret?).",
      tailgater: "That stranger with no visible badge near the red-team lab \u2014 handle it."
    };
    for (const id of sideQuestIdsForFloor("floor7")) {
      if (!state.sqSolved.has(id) && sqLabels[id]) o.push(sqLabels[id]);
    }
  }
  if (o.length === 0) o.push("All side quests on this floor handled. Nice work.");
  return o;
}

export function openDiscoveries() {
  state.inDialog = true;
  const cards = Object.entries(FINDS).map(([id, f]) => {
    const got = state.finds.has(id);
    return `<div class="find-card ${got ? "got" : "locked"}">
      <div class="find-icon">${got ? f.icon : "\u2753"}</div>
      <div class="find-text">
        <div class="find-name">${got ? escapeHtml(f.name) : "\u2014 not found yet \u2014"}</div>
        <div class="find-note">${got ? escapeHtml(f.note) : "Keep exploring the floor."}</div>
      </div>
    </div>`;
  }).join("");

  const objs = currentObjectives().map((t) => `<li>${escapeHtml(t)}</li>`).join("");

  openModal("Field Companion", `${state.finds.size}/${FINDTOTAL} keepsakes`, "\u2605",
    `<div class="companion-econ">
       <span class="reward-chip">\u{1FA99} ${state.coins} coins</span>
       <span class="reward-chip">\u{1F39F}\uFE0F ${state.tokens} token${state.tokens === 1 ? "" : "s"}</span>
     </div>
     <div class="scenario-section-label" style="margin-top:12px;">On your radar</div>
     <ul class="principle-list">${objs}</ul>
     <div class="scenario-section-label" style="margin-top:12px;">Discoveries</div>
     <div class="find-grid">${cards}</div>
     ${trainingLibraryHtml()}
     ${v2CompanionExtras()}`);
  document.querySelectorAll(".tr-rewatch").forEach((b) => b.addEventListener("click", () => openTraining(+b.dataset.w, null, { rewatch: true })));
}

function v2CompanionExtras() {
  let d; try { d = DD(); } catch { return ""; }
  if (!d) return "";
  const b = Object.entries(BADGES).map(([id, x]) => {
    const got = d.badges.includes(id);
    return `<div class="find-card ${got ? "got" : "locked"}"><div class="find-icon">${got ? x.icon : "\u{1F512}"}</div>
      <div class="find-text"><div class="find-name">${escapeHtml(x.name)}</div><div class="find-note">${escapeHtml(x.desc)}</div></div></div>`;
  }).join("");
  const l = Object.entries(LINGO).map(([id, x]) => {
    const got = d.lingo.includes(id);
    return `<div class="lingo-card ${got ? "got" : "locked"}"><b>${got ? escapeHtml(x.term) : "???"}</b><span>${got ? escapeHtml(x.def) : "Hear it on the job to unlock."}</span></div>`;
  }).join("");
  return `<div class="scenario-section-label" style="margin-top:12px;">Badges \u00b7 ${d.badges.length}/${Object.keys(BADGES).length}</div>
    <div class="find-grid">${b}</div>
    <div class="scenario-section-label" style="margin-top:12px;">Lingo \u00b7 ${d.lingo.length}/${Object.keys(LINGO).length}</div>
    <div class="lingo-grid">${l}</div>`;
}

// --- Elevator: travel between floors ---------------------------------------
export function openElevator(p) {
  state.inDialog = true;
  const here = state.floor;
  const cards = FLOOR_ORDER.map((id) => {
    const m = FLOOR_META[id];
    const isHere = id === here;
    // Floor 7 stays locked until Floor 3's queue is cleared or the SOC calls you up.
    const locked = (id === "floor7" && !state.floor7Open()) || (id === "floor5" && !state.floor5Open());
    let statusChip, btn;
    if (isHere) {
      statusChip = `<span class="floor-chip here">you are here</span>`;
      btn = `<button class="floor-btn" disabled>Current floor</button>`;
    } else if (locked) {
      statusChip = `<span class="floor-chip locked">\u{1F512} locked</span>`;
      btn = `<button class="floor-btn" disabled>${id === "floor5" ? "Network Week (Day 4)" : "SOC Week (Day 7)"}</button>`;
    } else {
      statusChip = `<span class="floor-chip open">ready</span>`;
      btn = `<button class="floor-btn primary-btn" data-floor="${escapeAttr(id)}">Go to ${escapeHtml(m.name)} \u2192</button>`;
    }
    return `<div class="floor-card ${isHere ? "is-here" : ""} ${locked ? "is-locked" : ""}">
        <div class="floor-card-head">
          <span class="floor-card-name">${escapeHtml(m.name)}</span>
          ${statusChip}
        </div>
        <div class="floor-card-tag">${escapeHtml(m.tag)}</div>
        <div class="floor-card-blurb">${escapeHtml(m.blurb)}</div>
        ${btn}
      </div>`;
  }).join("");

  const lockHint = !state.floor7Open() || !state.floor5Open()
    ? `<div style="font-size:11px;color:var(--text-faint);margin-top:10px;">Your badge opens floors as you climb: Floor 5 when you join the network team, Floor 7 when you join the SOC (or if Security calls Help Desk up early). The <strong>Exam</strong> button practice-tests any floor anytime.</div>`
    : `<div style="font-size:11px;color:var(--text-faint);margin-top:10px;">Your badge opens every floor.</div>`;

  openModal("The elevator", "Choose a floor", "\u{1F6D7}",
    `<div class="floor-list">${cards}</div>${lockHint}`);

  document.querySelectorAll(".floor-btn[data-floor]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.dataset.floor;
      closeModal();
      state.goToFloor(id, "elevator");
    });
  });
}

// --- Practice Test: a 5-question quiz on the current floor ------------------
export function openQuiz() {
  state.inDialog = true;
  // home + lobby study the Help Desk pool
  const here = state.floor === "floor7" ? "floor7" : state.floor === "floor5" ? "floor5" : "floor3";
  const meta = FLOOR_META[here] || { name: here, tag: "" };
  const bestKey = "quiz-best-" + here;

  function start() {
    const questions = sampleQuiz(here, 5);
    const total = questions.length;
    let idx = 0;
    let score = 0;
    let answered = false;

    function paint(html, subtitle) {
      // first paint uses openModal (shows panel + scrolls once); later paints
      // just swap the body so the panel doesn't jump on every Next.
      const bodyEl = document.getElementById("modal-body");
      if (!bodyEl || els.bg.hidden) {
        openModal("Practice Test", subtitle, "\u{1F4DD}", html);
      } else {
        if (subtitle != null) els.subtitle.textContent = subtitle;
        bodyEl.innerHTML = html;
      }
    }

    function renderQuestion() {
      answered = false;
      const q = questions[idx];
      const opts = q.options.map((o, i) =>
        `<button class="quiz-opt" data-i="${i}">${escapeHtml(o.t)}</button>`).join("");
      paint(
        `<div class="quiz-progress-row">
           <span>Question ${idx + 1} of ${total}</span>
           <span class="quiz-cert">${escapeHtml(q.cert || "")}</span>
         </div>
         <div class="quiz-question">${escapeHtml(q.q)}</div>
         <div class="quiz-opts btn-column">${opts}</div>
         <div id="quiz-feedback"></div>`,
        `${meta.name} \u00b7 ${meta.tag}`
      );
      document.querySelectorAll(".quiz-opt").forEach((b) => {
        b.addEventListener("click", () => choose(parseInt(b.dataset.i, 10)));
      });
    }

    function choose(i) {
      if (answered) return;
      answered = true;
      const q = questions[idx];
      const correct = i === q.answerIndex;
      if (correct) score += 1;
      document.querySelectorAll(".quiz-opt").forEach((b) => {
        const bi = parseInt(b.dataset.i, 10);
        if (bi === q.answerIndex) b.classList.add("correct");
        else if (bi === i) b.classList.add("wrong");
        b.disabled = true;
      });
      const fb = document.getElementById("quiz-feedback");
      const last = idx === total - 1;
      fb.className = "scenario-feedback " + (correct ? "win" : "lose");
      fb.innerHTML =
        `<div style="font-weight:600;margin-bottom:4px;">${correct ? "Correct" : "Not quite"}</div>
         <div style="font-size:12px;">${escapeHtml(q.explain)}</div>
         <div style="margin-top:10px;">
           <button id="quiz-next" class="primary-btn">${last ? "See score \u2192" : "Next question \u2192"}</button>
         </div>`;
      document.getElementById("quiz-next").addEventListener("click", () => {
        if (last) renderScore();
        else { idx += 1; renderQuestion(); }
      });
    }

    function renderScore() {
      const prevBest = loadNum(bestKey, 0);
      const pct = total ? Math.round((score / total) * 100) : 0;
      const isBest = score > prevBest;
      if (isBest) saveNum(bestKey, score);
      const best = Math.max(prevBest, score);
      // XP + achievement hooks (only the first pass/perfect on a given best avoids farming)
      if (pct >= 80 && isBest) {
        state.addXp(XP.quizPass + (pct === 100 ? XP.quizPerfect : 0));
      }
      if (pct === 100) { state.setFlag("quizPerfect"); state.checkAchievements(); }
      const verdict = pct === 100
        ? "Perfect score. You could teach this floor."
        : pct >= 80
        ? "Strong. You know this material."
        : pct >= 60
        ? "Solid start \u2014 review the misses and run it again."
        : "Worth another pass. The explanations above are the fast way up.";
      paint(
        `<div class="quiz-score-wrap">
           <div class="quiz-score-num">${score} / ${total}</div>
           <div class="quiz-score-pct">${pct}%</div>
           <div class="quiz-score-bar"><span style="width:${pct}%;"></span></div>
           <div class="quiz-score-verdict">${escapeHtml(verdict)}</div>
           <div class="quiz-best">${isBest ? "\u2B50 New best on this floor!" : `Best on ${escapeHtml(meta.name)}: ${best}/${total}`}</div>
         </div>
         <div class="eod-actions">
           <button id="quiz-retake" class="primary-btn">Retake test</button>
           <button id="quiz-done">Back to the floor</button>
         </div>
         <div style="font-size:11px;color:var(--text-faint);margin-top:8px;">
           Each retake pulls a fresh draw from this floor's question pool (${quizPoolSize(here)} total). Retake as often as you like.
         </div>`,
        `${meta.name} \u00b7 results`
      );
      document.getElementById("quiz-retake").addEventListener("click", start);
      document.getElementById("quiz-done").addEventListener("click", closeModal);
    }

    if (total === 0) {
      openModal("Practice Test", meta.name, "\u{1F4DD}",
        `<div>No questions available for this floor yet.</div>
         <div style="margin-top:12px;"><button id="quiz-done" class="primary-btn">Close</button></div>`);
      document.getElementById("quiz-done").addEventListener("click", closeModal);
      return;
    }
    renderQuestion();
  }

  start();
}

// ===========================================================================
//  WAVE 1 — character creator, settings, shop, achievements, toasts
// ===========================================================================

// Build a clean working copy of a sprite palette with accessory fields present.
function normSprite(sp) {
  const s = { ...DEFAULT_SPRITE, ...(sp || {}) };
  if (!s.body2) s.body2 = darken(s.body);
  if (s.glasses == null) s.glasses = false;
  if (s.shades == null) s.shades = false;
  if (s.hat == null) s.hat = null;
  return s;
}

// --- transient achievement / promotion toast ------------------------------
export function showAchievementToast(ach) {
  try {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host"; host.className = "toast-host";
      document.body.appendChild(host);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="toast-icon">${ach.icon || "\u2728"}</span>
      <span class="toast-text"><strong>${escapeHtml(ach.name)}</strong><br>${escapeHtml(ach.desc || "")}</span>`;
    host.appendChild(el);
    // never stack more than three: the oldest makes room
    const all = host.querySelectorAll(".toast");
    for (let i = 0; i < all.length - 3; i++) all[i].remove();
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 350); }, 3600);
  } catch { /* ignore */ }
}

// --- character creator: roster select → customizer ------------------------
export function openCharacterCreator(opts = {}) {
  const mode = opts.mode || "onboarding";   // "onboarding" | "edit"
  const onReady = typeof opts.onReady === "function" ? opts.onReady : null;
  state.inIntro = true;
  // working sprite + chosen name; seed from existing if returning
  const draft = { sprite: normSprite(state.playerSprite), name: state.playerName || "" };
  renderRoster();

  function renderRoster() {
    const cards = PRESETS.map((p) => {
      return `<button class="roster-card" data-id="${escapeAttr(p.id)}" title="${escapeAttr(p.blurb || "")}">
        <canvas class="roster-canvas" width="72" height="72" data-pid="${escapeAttr(p.id)}"></canvas>
        <div class="roster-name">${escapeHtml(p.name)}</div>
        <div class="roster-role">${escapeHtml(p.role)}</div>
      </button>`;
    }).join("");
    openModal("SELECT YOUR FIGHTER", mode === "edit" ? "Change your look" : "Choose a character \u2014 customize next", "\u{1F3AE}",
      `<div class="roster-grid">${cards}</div>
       <div id="roster-blurb" class="roster-foot">Tap a fighter. Each is a starting look \u2014 you can recolor and rename on the next screen.</div>`,
      { hideClose: true });
    // paint previews + wire picks
    PRESETS.forEach((p) => {
      const c = document.querySelector(`canvas[data-pid="${p.id}"]`);
      if (c) drawSpritePreview(c, p.random ? randomSprite() : normSprite(p.sprite), "down", 2);
    });
    const blurbEl = document.getElementById("roster-blurb");
    document.querySelectorAll(".roster-card").forEach((b) => {
      const p = PRESETS.find((x) => x.id === b.dataset.id);
      const showBlurb = () => { if (blurbEl && p) blurbEl.textContent = `${p.name} \u2014 ${p.blurb}`; };
      b.addEventListener("mouseenter", showBlurb);
      b.addEventListener("focus", showBlurb);
      b.addEventListener("click", () => {
        draft.sprite = normSprite(p.random ? randomSprite() : p.sprite);
        if (!draft.name) draft.name = p.name; // seed the fun name; player can edit
        renderCustomizer();
      });
    });
  }

  function swatchRow(label, colors, field) {
    const sw = colors.map((c) =>
      `<button class="swatch ${draft.sprite[field] === c ? "sel" : ""}" data-field="${field}" data-color="${escapeAttr(c)}" style="background:${escapeAttr(c)}"></button>`
    ).join("");
    return `<div class="cc-row"><div class="cc-label">${escapeHtml(label)}</div><div class="cc-swatches">${sw}</div></div>`;
  }

  function renderCustomizer() {
    // owned premium shirts become extra shirt swatches
    const shirts = [...SHIRT_COLORS];
    for (const it of SHOP_ITEMS) {
      if (it.kind === "swatch" && state.hasOwned(it.id) && PREMIUM_SHIRTS[it.swatch]) shirts.push(PREMIUM_SHIRTS[it.swatch]);
    }
    // accessory buttons: free ones + owned ones
    const accBtns = ACCESSORIES.filter((a) => a.free || state.hasOwned(shopIdForAccessory(a.id)))
      .map((a) => `<button class="cc-acc" data-acc="${escapeAttr(a.id)}">${a.icon ? a.icon + " " : ""}${escapeHtml(a.name)}</button>`).join("");

    openModal("Customize", "Make it yours", "\u{1F3A8}",
      `<div class="cc-wrap">
         <div class="cc-preview">
           <canvas id="cc-canvas" width="128" height="128"></canvas>
           <div class="cc-rotate">
             <button id="cc-face-down">\u25BC</button>
             <button id="cc-face-left">\u25C0</button>
             <button id="cc-face-right">\u25B6</button>
             <button id="cc-face-up">\u25B2</button>
           </div>
           <button id="cc-random" class="cc-random">\u{1F3B2} Surprise me</button>
         </div>
         <div class="cc-controls">
           ${swatchRow("Skin", SKIN_TONES, "skin")}
           ${swatchRow("Hair", HAIR_COLORS, "hair")}
           ${swatchRow("Shirt", shirts, "body")}
           ${swatchRow("Accent", ACCENT_COLORS, "accent")}
           <div class="cc-row"><div class="cc-label">Accessory</div><div class="cc-accs">${accBtns}</div></div>
           <label class="cc-namelabel">Name</label>
           <input id="cc-name" type="text" maxlength="20" value="${escapeAttr(draft.name)}" placeholder="What should they call you?" autocomplete="off" />
           <div class="cc-foot">
             <button id="cc-back">\u2190 Roster</button>
             <button id="cc-confirm" class="primary-btn">${mode === "edit" ? "Save changes" : "READY \u25B6"}</button>
           </div>
           <div style="font-size:11px;color:var(--text-faint);margin-top:6px;">Unlock more shirts, shades, and hats in the Shop with coins you earn.</div>
         </div>
       </div>`,
      { hideClose: true });

    let facing = "down";
    const canvas = document.getElementById("cc-canvas");
    const paint = () => drawSpritePreview(canvas, draft.sprite, facing, 4);
    paint();

    document.querySelectorAll(".swatch").forEach((b) => b.addEventListener("click", () => {
      const f = b.dataset.field, col = b.dataset.color;
      draft.sprite[f] = col;
      if (f === "body") draft.sprite.body2 = darken(col);
      document.querySelectorAll(`.swatch[data-field="${f}"]`).forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      paint();
    }));
    document.querySelectorAll(".cc-acc").forEach((b) => b.addEventListener("click", () => {
      const a = ACCESSORIES.find((x) => x.id === b.dataset.acc);
      if (a) a.apply(draft.sprite);
      paint();
    }));
    const faces = { "cc-face-down": "down", "cc-face-up": "up", "cc-face-left": "left", "cc-face-right": "right" };
    Object.entries(faces).forEach(([id, dir]) => {
      const el = document.getElementById(id); if (el) el.addEventListener("click", () => { facing = dir; paint(); });
    });
    document.getElementById("cc-random").addEventListener("click", () => { draft.sprite = normSprite(randomSprite()); renderCustomizer(); });
    document.getElementById("cc-back").addEventListener("click", renderRoster);
    document.getElementById("cc-name").addEventListener("input", (e) => { draft.name = e.target.value; });
    document.getElementById("cc-confirm").addEventListener("click", () => {
      const nm = (document.getElementById("cc-name").value || "").trim() || "you";
      state.setPlayerName(nm);
      state.setPlayerSprite(draft.sprite);
      closeModal();
      if (mode !== "edit" && onReady) onReady();
    });
  }
}
function shopIdForAccessory(accId) {
  const it = SHOP_ITEMS.find((x) => x.kind === "accessory" && x.accessory === accId);
  return it ? it.id : "__none__";
}

// --- settings panel --------------------------------------------------------
export function openSettings() {
  state.inDialog = true;
  const theme = currentTheme();
  const themeBtns = THEMES.map((t) =>
    `<button class="seg ${theme === t.id ? "on" : ""}" data-theme="${t.id}">${escapeHtml(t.name)}</button>`).join("");
  const toggle = (id, label, on, hint) =>
    `<div class="set-row"><div><div class="set-label">${escapeHtml(label)}</div>${hint ? `<div class="set-hint">${escapeHtml(hint)}</div>` : ""}</div>
       <button class="switch ${on ? "on" : ""}" id="${id}"><span></span></button></div>`;

  openModal("Settings", "Display, sound & saves", "\u2699\uFE0F",
    `<div class="set-row"><div class="set-label">Theme</div><div class="seg-group">${themeBtns}</div></div>
     ${toggle("set-sound", "Step sound", state.soundOn)}
     ${toggle("set-motion", "Reduced motion", prefs.reducedMotion(), "Calms idle bobbing and animations.")}
     ${toggle("set-cb", "High-contrast markers", prefs.colorblind(), "Adds a dark halo behind the !/?/\u2713 markers.")}
     ${toggle("set-text", "Larger text", prefs.bigText())}
     <div class="set-divider"></div>
     <button id="set-edit-char" class="primary-btn" style="width:100%;">\u{1F3A8} Edit character</button>
     <div class="set-divider"></div>
     <div class="set-label" style="margin-bottom:6px;">Progress file</div>
     <div class="set-saverow">
       <button id="set-save" class="primary-btn">\u2B07\uFE0F Save to file</button>
       <button id="set-load">\u2B06\uFE0F Load from file</button>
       <input id="set-file" type="file" accept="application/json,.json" hidden />
     </div>
     <div id="set-file-msg" class="set-hint" style="margin-top:6px;"></div>
     <div class="set-hint" style="margin-top:4px;">Download a save to back up or move to another device, then load it here to continue.</div>
     <div class="set-divider"></div>
     <button id="set-reset" class="danger-btn">\u21BA Start over / reset progress\u2026</button>`
  );

  document.querySelectorAll(".seg[data-theme]").forEach((b) => b.addEventListener("click", () => {
    applyTheme(b.dataset.theme);
    document.querySelectorAll(".seg[data-theme]").forEach((x) => x.classList.toggle("on", x === b));
  }));
  const flip = (id, getter, setter) => {
    const el = document.getElementById(id); if (!el) return;
    el.addEventListener("click", () => { const nv = !getter(); setter(nv); el.classList.toggle("on", nv); });
  };
  flip("set-sound", () => state.soundOn, (v) => state.setSound(v));
  flip("set-motion", () => prefs.reducedMotion(), (v) => setReducedMotion(v));
  flip("set-cb", () => prefs.colorblind(), (v) => setColorblind(v));
  flip("set-text", () => prefs.bigText(), (v) => setBigText(v));

  document.getElementById("set-save").addEventListener("click", () => {
    const r = state.exportSaveFile();
    const msg = document.getElementById("set-file-msg");
    msg.textContent = r.ok ? "Saved. Check your downloads." : (r.error || "Couldn't save.");
    msg.style.color = r.ok ? "var(--success-text)" : "var(--danger-text)";
  });
  const fileInput = document.getElementById("set-file");
  document.getElementById("set-load").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const msg = document.getElementById("set-file-msg");
    const reader = new FileReader();
    reader.onload = () => {
      const r = state.importSaveText(String(reader.result || ""));
      msg.textContent = r.ok ? "Loaded! Reloading\u2026" : (r.error || "Couldn't load that file.");
      msg.style.color = r.ok ? "var(--success-text)" : "var(--danger-text)";
    };
    reader.onerror = () => { msg.textContent = "Couldn't read that file."; msg.style.color = "var(--danger-text)"; };
    reader.readAsText(f);
  });
  document.getElementById("set-reset").addEventListener("click", () => { closeModal(); openResetMenu(); });
  document.getElementById("set-edit-char").addEventListener("click", () => { closeModal(); openCharacterCreator({ mode: "edit" }); });
}

// --- cosmetics shop --------------------------------------------------------
export function openShop() {
  state.inDialog = true;
  renderShop();
  function renderShop() {
    const rows = SHOP_ITEMS.map((it) => {
      const owned = state.hasOwned(it.id);
      const afford = state.coins >= it.cost;
      const btn = owned
        ? `<span class="shop-owned">\u2713 Owned</span>`
        : `<button class="shop-buy ${afford ? "" : "broke"}" data-id="${escapeAttr(it.id)}" ${afford ? "" : "disabled"}>\u{1FA99} ${it.cost}</button>`;
      return `<div class="shop-item">
        <div class="shop-icon">${it.icon || "\u{1F455}"}</div>
        <div class="shop-main"><div class="shop-name">${escapeHtml(it.name)}</div>
          <div class="shop-kind">${it.kind === "swatch" ? "Shirt color" : "Accessory"}</div></div>
        ${btn}
      </div>`;
    }).join("");
    openModal("The Vending Machine", "Spend your coins on drip", "\u{1F6CD}\uFE0F",
      `<div class="shop-bal">Balance: <strong>\u{1FA99} ${state.coins}</strong></div>
       <div class="shop-grid">${rows}</div>
       <div class="set-hint" style="margin-top:10px;">Equip what you buy in the character creator (Settings \u2192 or Reset re-opens it). Earn coins from side quests and the cat's stash.</div>`);
    document.querySelectorAll(".shop-buy[data-id]").forEach((b) => b.addEventListener("click", () => {
      const it = SHOP_ITEMS.find((x) => x.id === b.dataset.id);
      const r = state.buyItem(it);
      if (r.ok) {
        // auto-equip accessories/shirts onto the live sprite for instant payoff
        const sp = normSprite(state.playerSprite);
        if (it.kind === "accessory") { const a = ACCESSORIES.find((x) => x.id === it.accessory); if (a) a.apply(sp); }
        else if (it.kind === "swatch" && PREMIUM_SHIRTS[it.swatch]) { sp.body = PREMIUM_SHIRTS[it.swatch]; sp.body2 = darken(sp.body); }
        state.setPlayerSprite(sp);
        showAchievementToast({ icon: it.icon || "\u{1F455}", name: "Purchased!", desc: it.name + " \u2014 equipped." });
      } else {
        showAchievementToast({ icon: "\u{1FA99}", name: "Hold up", desc: r.error || "Can't buy that." });
      }
      renderShop();
    }));
  }
}

// --- achievements gallery --------------------------------------------------
export function openAchievements() {
  state.inDialog = true;
  const r = rank(state.xp || 0);
  const got = state.achievements;
  const cards = ACHIEVEMENTS.map((a) => {
    const have = got.has(a.id);
    return `<div class="ach-card ${have ? "have" : "locked"}">
      <div class="ach-icon">${have ? a.icon : "\u{1F512}"}</div>
      <div class="ach-text"><div class="ach-name">${escapeHtml(a.name)}</div>
        <div class="ach-desc">${escapeHtml(a.desc)}</div></div>
    </div>`;
  }).join("");
  const bar = r.max
    ? `<div class="rank-sub">Max rank reached \u2014 ${escapeHtml(r.title)}.</div>`
    : `<div class="rank-bar"><span style="width:${r.pct}%;"></span></div>
       <div class="rank-sub">${r.into}/${r.span} XP to <strong>${escapeHtml(r.next)}</strong></div>`;
  openModal("Career & Achievements", `Level ${r.level} \u00b7 ${r.title}`, "\u{1F3C6}",
    `<div class="rank-card">
       <div class="rank-top"><span class="rank-level">Lv ${r.level}</span><span class="rank-title">${escapeHtml(r.title)}</span><span class="rank-xp">${state.xp} XP</span></div>
       ${bar}
     </div>
     <div class="scenario-section-label" style="margin-top:12px;">Achievements \u00b7 ${got.size}/${ACHTOTAL}</div>
     <div class="ach-grid">${cards}</div>`);
}

// --- Start over: replay vs full wipe ---------------------------------------
export function openResetMenu() {
  state.inDialog = true;
  openModal("Start over", "Two ways to reset", "\u21BA",
    `<div class="reset-opt">
       <div class="reset-opt-head">\u{1F504} New playthrough</div>
       <div class="reset-opt-desc">Replay everything "for the first time" \u2014 every ticket, side quest, and the cat reset to fresh, and Floor 7 re-locks until you clear Floor 3. You <strong>keep</strong> your character, rank, coins, and achievements. Great for extra study reps.</div>
       <button id="reset-replay" class="primary-btn">Start a fresh playthrough</button>
     </div>
     <div class="set-divider"></div>
     <div class="reset-opt">
       <div class="reset-opt-head">\u{1F5D1}\uFE0F Full reset</div>
       <div class="reset-opt-desc">Erase <strong>everything</strong> \u2014 character, name, rank, coins, achievements, and all progress \u2014 and return to the title screen as a brand-new player.</div>
       <button id="reset-full" class="danger-btn">Erase everything</button>
     </div>
     <div class="set-hint" style="margin-top:10px;">Tip: before a full reset you can keep a copy via Settings \u2192 Save to file, then load it back anytime.</div>`);

  armConfirm("reset-replay", "Tap again to confirm", () => {
    state.newPlaythrough();
    closeModal();
    showAchievementToast({ icon: "\u{1F504}", name: "Fresh start", desc: "New playthrough \u2014 good luck!" });
  });
  armConfirm("reset-full", "Tap again to ERASE", () => {
    state.doReset();
    closeModal();
    if (typeof state.toTitle === "function") state.toTitle();
  });
}

// two-tap confirm so a reset is never one stray click; auto-disarms after 3s
function armConfirm(id, confirmLabel, action) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const orig = btn.textContent;
  let armed = false, timer = null;
  btn.addEventListener("click", () => {
    if (armed) { if (timer) clearTimeout(timer); action(); return; }
    armed = true; btn.textContent = confirmLabel; btn.classList.add("armed");
    timer = setTimeout(() => { armed = false; btn.textContent = orig; btn.classList.remove("armed"); }, 3000);
  });
}

// --- Day 1 IT orientation (shown once, after the character is ready) -------
export function openOrientation(onDone) {
  state.inDialog = true;
  const name = escapeHtml(state.playerName || "you");
  const pages = orientationPagesV2(name) || [
    { t: "Welcome to the team", a: "\u{1F44B}",
      h: `<p style="margin:0 0 8px;">Morning, ${name}. Welcome to your first day in IT support. I'm your onboarding buddy \u2014 quick orientation, then you're on the floor.</p>
          <p style="margin:0;color:var(--text-muted);">This whole job is one loop: a problem comes in, you investigate, you find the real cause, you fix it. Do that well and you'll be ready for the CompTIA exams without even trying.</p>` },
    { t: "Your ticket monitor", a: "\u{1F5A5}\uFE0F",
      h: `<p style="margin:0 0 8px;">That glowing screen in your office (the <strong>IT room</strong>) is your <strong>ticket monitor</strong>. Walk up to it and press <strong>Space</strong> to see what's open.</p>
          <p style="margin:0;color:var(--text-muted);">People who filed a ticket have an orange <strong style="color:#EF9F27;">!</strong> over their head. Go find them, hear them out, and dig into the clues before you commit to a diagnosis. Guessing burns your action budget.</p>` },
    { t: "Look around, not just up", a: "\u{1F50D}",
      h: `<p style="margin:0 0 8px;">Not everything is on the board. A blue <strong style="color:#378ADD;">?</strong> marks a <strong>side quest</strong> \u2014 something you only notice by wandering. There's a cat somewhere, too. Be curious.</p>
          <p style="margin:0;color:var(--text-muted);">Solving things earns <strong>XP</strong> (climb from Intern to CISO), <strong>coins</strong> (spend them in the Shop on drip), and <strong>achievements</strong>. Check the <strong>Career</strong> button up top anytime.</p>` },
    { t: "Study on the clock", a: "\u{1F4DD}",
      h: `<p style="margin:0 0 8px;">Hit <strong>Exam</strong> any time for a 5-question practice test on your current floor. Clear Floor 3's queue and the <strong>elevator</strong> unlocks Floor 7 \u2014 Security Operations.</p>
          <p style="margin:0;color:var(--text-muted);">Everything saves automatically. You can back up or move your progress from <strong>\u2699\uFE0F Settings \u2192 Save to file</strong>. That's it \u2014 go be great.</p>` }
  ];
  let i = 0;
  function render() {
    const p = pages[i];
    const last = i === pages.length - 1;
    openModal(`Day 1 \u00b7 ${p.t}`, "IT Orientation", p.a,
      `${p.h}
       <div class="orient-dots">${pages.map((_, k) => `<span class="${k === i ? "on" : ""}"></span>`).join("")}</div>
       <div class="cc-foot">
         <button id="orient-skip">${last ? "" : "Skip"}</button>
         <button id="orient-next" class="primary-btn">${last ? "Clock in \u25B6" : "Next \u2192"}</button>
       </div>`,
      { hideClose: true });
    const skip = document.getElementById("orient-skip");
    if (skip) skip.addEventListener("click", finish);
    document.getElementById("orient-next").addEventListener("click", () => {
      if (last) finish(); else { i += 1; render(); }
    });
  }
  function finish() { closeModal(); if (typeof onDone === "function") onDone(); }
  render();
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
