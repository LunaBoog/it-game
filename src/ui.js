// UI layer: everything that happens inside the modal popup.

import { SCENARIOS, scenarioIdsForFloor, scenarioCountForFloor } from "./scenarios.js";
import { SIDE_QUESTS, sideQuestIdsForFloor } from "./sideQuests.js";
import { NPCS, PROPS, FLOOR_META, FLOOR_ORDER, LOC_LABEL } from "./world.js";
import { FINDS, FINDTOTAL } from "./collectables.js";
import { saveSet, loadNum, saveNum } from "./storage.js";
import { sampleQuiz, quizPoolSize } from "./quiz.js";

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
  els.bg.addEventListener("click", (e) => {
    // click on the dimmed backdrop (not the modal itself) closes — unless intro
    if (e.target === els.bg && !state.inIntro) closeModal();
  });
}

function openModal(title, subtitle, avatarLetter, bodyHtml, opts = {}) {
  els.title.textContent = title;
  els.subtitle.textContent = subtitle;
  els.avatar.textContent = avatarLetter || "?";
  els.body.innerHTML = bodyHtml;
  els.bg.hidden = false;
  els.close.hidden = !!opts.hideClose;
  // The modal is an inline panel beneath the game, so bring it into view —
  // otherwise on a tall screen it can open below the fold, unseen.
  requestAnimationFrame(() => {
    try { els.bg.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { els.bg.scrollIntoView(); }
  });
}

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
    const input = document.getElementById("intro-name");
    const v = ((input && input.value) || "").trim() || "you";
    state.setPlayerName(v);
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
         <div class="intro-controls">Arrow keys / WASD to move \u00b7 E or space to interact</div>
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

// --- end of day -----------------------------------------------------------

export function openEndOfDay() {
  state.inEndOfDay = true;
  const here = state.floor;
  const meta = FLOOR_META[here] || { name: here, tag: "" };
  const floorScenIds = scenarioIdsForFloor(here);
  const floorTotal = scenarioCountForFloor(here);
  const principles = floorScenIds.map((id) => SCENARIOS[id] && SCENARIOS[id].principle).filter(Boolean);

  // side quests / sharp calls counted for THIS floor only
  const floorSqIds = sideQuestIdsForFloor(here);
  const sqCount = floorSqIds.filter((id) => state.sqSolved.has(id)).length;
  const sqTotal = floorSqIds.length;
  const sharpCount = floorScenIds.filter((id) => state.sharp.has(id)).length;

  const principleList = principles
    .map((p) => `<li>${escapeHtml(p)}</li>`)
    .join("");

  const sqStatus = sqTotal === 0
    ? "No side quests on this floor today \u2014 the queue was the whole job."
    : sqCount === sqTotal
    ? "You found every side quest on this floor. That's the rare 'actually pays attention' tier."
    : sqCount > 0
    ? `You found ${sqCount} of ${sqTotal} side quests here. The rest are still out there \u2014 noticing them is its own skill.`
    : "You didn't find any side quests on this floor. Try walking through every room before clearing the queue next time.";

  const sharpStatus = sharpCount === floorTotal
    ? "And you nailed every diagnosis on the first call. Clean sheet."
    : sharpCount >= Math.ceil(floorTotal / 2)
    ? `You called ${sharpCount} of ${floorTotal} right on the first try \u2014 the evidence work is paying off.`
    : `You called ${sharpCount} of ${floorTotal} right on the first try. Investigating one more clue before committing usually settles it.`;

  const name = escapeHtml(state.playerName || "you");

  // If Floor 3 just got cleared and Floor 7 is still locked-by-progress, nudge.
  const unlockNote = (here === "floor3" && state.hasFlag("floor3Cleared"))
    ? `<div style="margin-top:12px;padding:10px;border:0.5px solid var(--border);border-radius:8px;background:rgba(43,179,163,0.08);font-size:12px;">
         <strong>Floor 7 is unlocked.</strong> Take the elevator in the corner to reach Security Operations \u2014 Security+, PenTest+, and advanced Network+ scenarios.
       </div>`
    : "";

  openModal(
    `End of day ${state.day} \u00b7 ${escapeHtml(meta.name)}`,
    meta.tag || "Ticket monitor",
    "i",
    `<div style="margin-bottom:10px;">Nice work, ${name}. All ${floorTotal} tickets on ${escapeHtml(meta.name)} closed.</div>
     <div style="margin-bottom:6px;color:var(--text-muted);font-size:12px;">${sqStatus}</div>
     <div style="margin-bottom:14px;color:var(--text-muted);font-size:12px;">${sharpStatus}</div>

     <div class="eod-stats">
       <div class="eod-stat"><div class="eod-stat-num">${sharpCount}/${floorTotal}</div><div class="eod-stat-label">first-try calls</div></div>
       <div class="eod-stat"><div class="eod-stat-num">${state.day}</div><div class="eod-stat-label">days worked</div></div>
       <div class="eod-stat"><div class="eod-stat-num">${state.lifeTickets}</div><div class="eod-stat-label">tickets, all-time</div></div>
       <div class="eod-stat"><div class="eod-stat-num">${state.lifeSideQuests}</div><div class="eod-stat-label">side quests, all-time</div></div>
     </div>
     ${unlockNote}

     <div class="scenario-section-label" style="margin-top:14px;">Principles you used today</div>
     <ol class="principle-list">${principleList}</ol>

     <div class="eod-actions">
       <button id="eod-newday" class="primary-btn">Start day ${state.day + 1} \u2192</button>
       <button id="eod-stay">Stay and wander</button>
     </div>
     <div style="font-size:11px;color:var(--text-faint);margin-top:8px;">A new day brings a fresh queue. Anyone you helped today will still have something to say if you visit them.</div>`
  );

  document.getElementById("eod-newday").addEventListener("click", () => {
    state.startNewDay();
    closeModal();
  });
  document.getElementById("eod-stay").addEventListener("click", closeModal);
}

// --- NPC casual chat ------------------------------------------------------

export function openNpcChat(n) {
  const lines = n.chat || ["Everything's good here right now, thanks for checking in."];
  const line = lines[Math.floor(Math.random() * lines.length)];
  openModal(n.name, n.role, n.name[0], `<p style="margin:0;">${escapeHtml(line)}</p>`);
}

// --- Ticket monitor -------------------------------------------------------

export function openTicketBoard() {
  state.inTicketBoard = true;
  const here = state.floor;
  const meta = FLOOR_META[here] || { name: here, tag: "" };
  const ids = scenarioIdsForFloor(here);
  const rows = ids.map((id) => {
    const s = SCENARIOS[id];
    if (!s) return "";
    const isSolved = state.solved.has(id);
    const npc = NPCS.find((n) => n.ticket === id);
    const cert = s.cert ? `<span class="ticket-cert">${escapeHtml(s.cert)}</span>` : "";
    return `
      <div class="ticket-row ${isSolved ? "solved" : ""}">
        <span class="ticket-row-icon">${isSolved ? "\u2713" : "\u25cf"}</span>
        <div class="ticket-row-main">
          <div class="ticket-row-title">${escapeHtml(s.title)} ${cert}</div>
          <div class="ticket-row-meta">${escapeHtml(s.ticketMeta)}</div>
        </div>
        <span class="ticket-row-status">${isSolved ? "solved" : `find ${npc ? escapeHtml(npc.name) : ""}`}</span>
      </div>`;
  }).join("");

  openModal(
    `${meta.name} ticket queue`,
    `${escapeHtml(meta.tag)} \u00b7 Day ${state.day}`,
    "i",
    `<div>${rows}</div>
     <div style="font-size:11px;color:var(--text-faint);margin-top:10px;padding-top:8px;border-top:0.5px solid var(--border);">
       Walk to the person named on the ticket to take it on. Hit <strong>Exam</strong> in the top bar to practice-test everything on this floor.
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
    `<div style="margin-bottom:10px;">${escapeHtml(sq.body)}</div>
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
    `<div class="scenario-grid">
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
      if (firstTry) { state.sharp.add(state.currentScenario); saveSet("sharp", state.sharp); }
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
       <div style="margin-top:10px;"><button id="dx-close" class="primary-btn">Done \u2192</button></div>`;
    document.getElementById("dx-close").addEventListener("click", closeModal);
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
  if (here === "floor3") {
    if (!state.hasFlag("catMet")) o.push("Find the office cat (she's in the conf. room).");
    else if (!state.hasFlag("hasCatFood")) o.push("Mittens is hungry \u2014 find cat food in the print room supply cabinet.");
    else if (!state.hasFlag("catFed")) o.push("Bring the cat food back to Mittens.");
    else if (state.hasFlag("catRevealed") && !state.hasFlag("stashTaken")) o.push("Check the loose ceiling tile Mittens pawed open.");
    if (!state.sqSolved.has("usbDrop")) o.push("Deal with the mystery USB stick on the open-desk floor.");
    if (!state.hasFlag("floor3Cleared")) o.push("Clear the Floor 3 queue to unlock the elevator to Floor 7.");
    else o.push("Floor 7 (Security Operations) is unlocked \u2014 take the elevator up.");
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
     <div class="find-grid">${cards}</div>`);
}

// --- Elevator: travel between floors ---------------------------------------
export function openElevator(p) {
  state.inDialog = true;
  const here = state.floor;
  const cards = FLOOR_ORDER.map((id) => {
    const m = FLOOR_META[id];
    const isHere = id === here;
    // Floor 7 stays locked until Floor 3's queue is cleared.
    const locked = id === "floor7" && !state.hasFlag("floor3Cleared");
    let statusChip, btn;
    if (isHere) {
      statusChip = `<span class="floor-chip here">you are here</span>`;
      btn = `<button class="floor-btn" disabled>Current floor</button>`;
    } else if (locked) {
      statusChip = `<span class="floor-chip locked">\u{1F512} locked</span>`;
      btn = `<button class="floor-btn" disabled>Clear Floor 3 first</button>`;
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

  const lockHint = !state.hasFlag("floor3Cleared")
    ? `<div style="font-size:11px;color:var(--text-faint);margin-top:10px;">Floor 7 unlocks once every Floor 3 ticket is solved. You can practice-test anything anytime with the <strong>Exam</strong> button \u2014 no need to wait.</div>`
    : `<div style="font-size:11px;color:var(--text-faint);margin-top:10px;">Both floors are open. Your progress on each is saved separately.</div>`;

  openModal("The elevator", "Choose a floor", "\u{1F6D7}",
    `<div class="floor-list">${cards}</div>${lockHint}`);

  document.querySelectorAll(".floor-btn[data-floor]").forEach((b) => {
    b.addEventListener("click", () => {
      const id = b.dataset.floor;
      closeModal();
      state.goToFloor(id);
    });
  });
}

// --- Practice Test: a 5-question quiz on the current floor ------------------
export function openQuiz() {
  state.inDialog = true;
  const here = state.floor;
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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
