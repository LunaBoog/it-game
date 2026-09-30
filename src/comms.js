// v2 comms: the team chat (phone), toasts for pings, lingo cards, per-run
// badges, and the Day Notes viewer (N key). Everything here is logged into
// the dd blob so the EOD email and the final score can read it.

import { CORE, DD, ddSave, curDay, esc, dayName, notesFor } from "./core.js";
import { BADGES, LINGO } from "./pools.js";
import { panel, pAdd, pBtn, closePanel } from "./ui.js";

export function ping(icon, title, desc) {
  try { if (CORE.toast) CORE.toast({ icon, name: title, desc }); } catch { /* ignore */ }
}
export function blip(ok = true) {
  try { if (CORE.sfx) CORE.sfx(ok ? "ok" : "bad"); } catch { /* ignore */ }
}

// ---- badges ----------------------------------------------------------------
export function award(id) {
  const d = DD(); if (!BADGES[id] || d.badges.includes(id)) return false;
  d.badges.push(id); ddSave();
  const b = BADGES[id]; ping(b.icon, "Badge: " + b.name, b.desc);
  if (CORE.S) CORE.S.updateProgressUI();
  return true;
}
export function hasBadge(id) { return DD().badges.includes(id); }

// ---- lingo -------------------------------------------------------------------
export function hearLingo(id) {
  const d = DD(); if (!LINGO[id] || d.lingo.includes(id)) return false;
  d.lingo.push(id); ddSave();
  ping("\u{1F4AC}", "Lingo: " + LINGO[id].term, LINGO[id].def.slice(0, 90) + (LINGO[id].def.length > 90 ? "…" : ""));
  return true;
}

// ---- team chat ---------------------------------------------------------------
export function chatPost(who, text, toast = true) {
  const d = DD(); d.chat.push({ who, text, d: curDay(), t: Date.now() }); ddSave();
  if (toast) ping("\u{1F4AC}", who, text.length > 110 ? text.slice(0, 108) + "…" : text);
  const b = document.getElementById("chat-btn"); if (b) b.classList.add("unread");
}

// The phone: team chat log + (on Day 2) the contact-card attachment task.
export function openPhone() {
  const d = DD();
  const b = document.getElementById("chat-btn"); if (b) b.classList.remove("unread");
  panel("\u{1F4F1} #helpdesk-team", "Team chat · " + dayName(curDay()), "\u{1F4F1}");
  const log = d.chat.slice(-30).map((m) => `<div class="chat-msg"><b>${esc(m.who)}</b><span class="chat-day">D${m.d}</span><div>${esc(m.text)}</div></div>`).join("");
  pAdd(log || `<div class="ev-empty">No messages yet.</div>`, "chat-log");
  if (CORE.S && CORE.S.phoneExtras) CORE.S.phoneExtras();
  pBtn("Close", closePanel, "act ghost");
}

// ---- Day Notes (N) -----------------------------------------------------------
export function openNotes() {
  const d = DD(), day = curDay();
  panel("\u{1F4DD} Day Notes", dayName(Math.min(day, 3)) + " · auto-logged", "\u{1F4DD}");
  const today = notesFor(day);
  pAdd(`<div class="set-hint" style="margin-bottom:6px;">Everything that happens gets logged here. Your end-of-day email is built from these notes.</div>`);
  pAdd(today.length ? today.map((n) => `<div class="note-row"><span>${n.icon}</span><span>${esc(n.text)}</span></div>`).join("")
    : `<div class="ev-empty">Nothing logged yet today.</div>`);
  const undoc = d.docs.filter((x) => !x.documented && !x.backfilled).length;
  const env = d.purchases.length
    ? d.purchases.map((p) => `<div class="note-row"><span>${p.icon}</span><span>${esc(p.item)} · $${p.amt} · ${p.rcpt ? "\u{1F9FE} receipt kept" : "<b>no receipt</b>"}${p.personal ? " · personal" : ""}</span></div>`).join("")
    : `<div class="ev-empty">No purchases yet.</div>`;
  pAdd(`<div class="scenario-section-label" style="margin-top:12px;">Receipt envelope</div>${env}`);
  pAdd(`<div class="scenario-section-label" style="margin-top:12px;">Closed work</div>
    <div class="set-hint">${d.docs.length} closed · ${d.docs.length - undoc} with notes · <b>${undoc}</b> without</div>`);
  pBtn("Close", closePanel, "act ghost");
}
