// v2 ledger: in-fiction money (own cash + the company card), the receipt
// mechanic on every purchase, the DOCUMENTATION mechanic on every closed piece
// of work, and Gloria's Day 3 audit that reconciles both.
//
// THE LESSON LIVES IN THE BUTTON SIZES. Every close has a big default
// "Close it" (Enter/Space lands here on purpose) and a small gray diligence
// link. Skipping the small link is always easier, and always costs you later.

import { CORE, DD, ddSave, curDay, esc, addNote, addRep } from "./core.js";
import { SUPPLY, SUPPLY_LIST } from "./pools.js";
import { panel, pAdd, pBtn, pClear, closePanel } from "./ui.js";
import { award, ping, blip } from "./comms.js";

export function hasCard() { return !!(CORE.S && CORE.S.hasFlag("kit")); }
export function cardLeft() { const d = DD(); return d.cardLimit - d.cardSpent; }
export function spentOn(day) { return DD().purchases.filter((p) => p.d === day).reduce((a, p) => a + p.amt, 0); }

function receiptHtml(vendor, rec) {
  const now = new Date();
  return `<div class="receipt"><div class="rc-h">${esc(vendor.toUpperCase())}</div>
    <div class="rc-s">W 49th St · ${now.toLocaleDateString()} · #${rec.id.slice(-5).toUpperCase()}</div>
    <div class="rc-l"><span>${esc(rec.item)}</span><span>$${rec.amt.toFixed(2)}</span></div>
    <div class="rc-l tot"><span>TOTAL</span><span>$${rec.amt.toFixed(2)}</span></div>
    <div class="rc-s">${rec.pay === "card" ? "CORP CARD ****4417" : "CASH"}</div></div>`;
}

// Ring something up. pay: "card" | "cash". Returns the purchase record.
export function purchase(itemId, vendor, pay, exitLabel, after) {
  const it = SUPPLY[itemId]; if (!it) return null;
  const d = DD();
  if (pay === "card") { if (cardLeft() < it.price) { ping("\u{1F4B3}", "Card declined", "You're over the card limit."); return null; } d.cardSpent += it.price; }
  else { if (d.cash < it.price) { ping("\u{1F4B5}", "Not enough cash", `You have $${d.cash}.`); return null; } d.cash -= it.price; }
  const rec = { id: itemId + "_" + Date.now().toString(36), key: itemId, item: it.name, icon: it.icon, amt: it.price, vendor,
    d: curDay(), rcpt: false, recon: false, personal: !!it.personal, repaid: false, pay };
  d.purchases.push(rec);
  if (!it.personal) CORE.S.setFlag("sup_" + itemId);
  ddSave(); CORE.S.updateProgressUI();
  addNote("receipt", it.icon, `Bought ${it.name} at ${vendor} ($${it.price}, ${pay === "card" ? "company card" : "cash"}).`);

  panel(vendor, "Rung up", CORE.S.npcSprite("ray"));
  pAdd(`<p style="margin:0 0 8px;">${it.icon} <b>${esc(it.name)}</b>. That's <b>$${it.price}</b> on ${pay === "card" ? "the company card" : "your own cash"}.</p>`);
  const big = pBtn(exitLabel || "\u{1F6CD}️ Thanks!", () => { closePanel(); if (after) after(rec); }, "primary-btn act big-exit");
  const ask = pBtn("Could I get a receipt, please?", () => {
    if (rec.rcpt) return;
    rec.rcpt = true; ddSave();
    ask.disabled = true; ask.textContent = "\u{1F9FE} Receipt's in your envelope";
    big.insertAdjacentHTML("beforebegin", receiptHtml(vendor, rec));
    blip(true);
  }, "rcpt-ask");
  setTimeout(() => { try { big.focus(); } catch { /* ignore */ } }, 30);
  return rec;
}

// The Byte Bodega counter: Tasha's list + temptations.
export function openBodega() {
  const S = CORE.S;
  const d = DD();
  panel("Byte Bodega", "Ray · cables, dongles, snacks", S.npcSprite("ray"));
  if (!S.hasFlag("supplyList")) {
    pAdd(`<p style="margin:0 0 8px;">"Welcome to Byte Bodega! Cables, dongles, snacks, and a cat named Router. What're you after?"</p>`);
  } else {
    const left = SUPPLY_LIST.filter((k) => !S.hasFlag("sup_" + k));
    pAdd(`<p style="margin:0 0 8px;">"Tasha's list again? You IT folks always need one more adapter." ${left.length ? `<b>${SUPPLY_LIST.length - left.length}/${SUPPLY_LIST.length}</b> on the list so far.` : "<b>List complete.</b>"}</p>`);
  }
  pAdd(`<div class="set-hint" style="margin-bottom:6px;">\u{1F4B5} Cash $${d.cash} · ${hasCard() ? `\u{1F4B3} Company card: $${cardLeft()} left` : "No company card yet"}</div>`);
  const keys = [...SUPPLY_LIST, "energy", "gum"];
  for (const k of keys) {
    const it = SUPPLY[k];
    const onList = SUPPLY_LIST.includes(k);
    const have = onList && S.hasFlag("sup_" + k);
    const row = pAdd(`<span class="shop-icon">${it.icon}</span><div class="shop-main"><div class="shop-name">${esc(it.name)}</div>
      <div class="shop-kind">${onList ? (S.hasFlag("supplyList") ? "On Tasha's list" : "Supplies") : "Snack"} · $${it.price}</div></div>`, "shop-item");
    if (have) { row.insertAdjacentHTML("beforeend", `<span class="shop-owned">✓ Got it</span>`); continue; }
    const b = document.createElement("button");
    b.className = "shop-buy"; b.textContent = `Buy $${it.price}`;
    b.addEventListener("click", () => {
      if (onList) {
        if (!hasCard()) { ping("\u{1F4B3}", "Hold on", "Supplies go on the company card. Tasha issues it with your kit."); return; }
        purchase(k, "Byte Bodega", "card", "\u{1F6CD}️ Back to the shelves", () => openBodega());
      } else {
        // personal snack: the card is right there in your hand...
        pClear();
        pAdd(`<p style="margin:0 0 8px;">${it.icon} <b>${esc(it.name)}</b>, $${it.price}. Ray holds out the card reader. The company card is already in your hand.</p>`);
        if (hasCard()) {
          const c = pBtn("\u{1F4B3} Tap the card", () => purchase(k, "Byte Bodega", "card", "\u{1F6CD}️ Back to the shelves", () => openBodega()), "primary-btn act big-exit");
          setTimeout(() => { try { c.focus(); } catch { /* ignore */ } }, 30);
        }
        pBtn(`Pay with my own cash ($${d.cash})`, () => purchase(k, "Byte Bodega", "cash", "\u{1F6CD}️ Back to the shelves", () => openBodega()), hasCard() ? "rcpt-ask" : "primary-btn act");
        pBtn("Never mind", () => openBodega(), "act ghost");
      }
    });
    row.appendChild(b);
  }
  pBtn("Done shopping", closePanel, "act ghost");
}

// Coffee: your own cash, no receipt needed, and a 60s walking buff.
export function buyCoffee(vendor, sprite) {
  const d = DD(), S = CORE.S;
  panel(vendor, "Coffee", sprite);
  if (d.cash < 4) { pAdd(`<p>"Four bucks. You're at $${d.cash}. Tomorrow, my friend."</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p style="margin:0 0 8px;">"Regular? Four dollars."</p><div class="set-hint">Your own money, your own coffee: no receipt needed. ☕ Walk faster for a minute.</div>`);
  pBtn("☕ Coffee, please ($4 cash)", () => {
    d.cash -= 4; d.buffUntil = Date.now() + 60000; ddSave(); S.updateProgressUI();
    addNote("coffee", "☕", `Coffee from ${vendor}.`);
    closePanel(); ping("☕", "Caffeinated", "You walk faster for 60 seconds.");
  });
  pBtn("No thanks", closePanel, "act ghost");
}

// ---- documentation: every closed piece of work ---------------------------------
export function recordWork(kind, id, title, user, symptom, fix) {
  const d = DD();
  const rec = { id: kind + ":" + id + ":" + curDay(), kind, title, user, symptom, fix, d: curDay(), documented: false, backfilled: false };
  d.docs.push(rec); ddSave();
  return rec;
}

function noteCardHtml(rec) {
  const n = DD().docs.indexOf(rec) + 4100;
  return `<div class="worknote"><div class="wn-h">\u{1F4DD} INC-${n} · resolved</div>
    <div><span>User</span>${esc(rec.user || "—")}</div>
    <div><span>Symptom</span>${esc(rec.symptom || rec.title)}</div>
    <div><span>Fix</span>${esc(rec.fix || "—")}</div>
    <div><span>When</span>Day ${rec.d} · ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div></div>`;
}

// Draws the close controls into `host` (a div inside the open panel).
export function docPrompt(host, rec, onClose) {
  if (!host) host = pAdd("");
  const wrap = document.createElement("div"); wrap.className = "doc-prompt"; host.appendChild(wrap);
  const big = document.createElement("button");
  big.className = "primary-btn act big-exit"; big.textContent = "✅ Close it";
  const ask = document.createElement("button");
  ask.className = "rcpt-ask"; ask.textContent = "\u{1F4DD} Add work notes & resolution first";
  big.addEventListener("click", () => { closePanel(); if (onClose) onClose(rec); });
  ask.addEventListener("click", () => {
    if (rec.documented) return;
    rec.documented = true; ddSave();
    ask.disabled = true; ask.textContent = "\u{1F4DD} Notes saved to the ticket";
    big.insertAdjacentHTML("beforebegin", noteCardHtml(rec));
    blip(true);
  });
  wrap.appendChild(big); wrap.appendChild(ask);
  setTimeout(() => { try { big.focus(); } catch { /* ignore */ } }, 30);
  return big;
}

export function docStats(day) {
  const list = DD().docs.filter((x) => day == null || x.d === day);
  const doc = list.filter((x) => x.documented).length;
  return { total: list.length, documented: doc, undocumented: list.length - doc };
}

// ---- Gloria's Day 3 audit: receipts + ticket hygiene ------------------------
export function openAudit(onDone) {
  const S = CORE.S, d = DD();
  const sprite = S.npcSprite("gloria");
  step1();

  function step1() {
    panel("Gloria · the audit", "Receipts first", sprite);
    const pur = d.purchases;
    pAdd(`<p style="margin:0 0 8px;">"Sit. This won't hurt. Much. Receipt envelope first."</p>`);
    if (!pur.length) pAdd(`<div class="set-hint">No purchases this week.</div>`);
    for (const p of pur) {
      let st;
      if (p.rcpt) { p.recon = true; st = `✅ reconciled`; }
      else st = `<b style="color:var(--danger)">no receipt</b>`;
      pAdd(`<span>${p.icon}</span><span>${esc(p.item)} · $${p.amt} · ${p.pay === "card" ? "card" : "cash"}${p.personal ? " · <b>personal</b>" : ""}</span><span>${st}</span>`, "audit-row");
    }
    ddSave();
    const missing = pur.filter((p) => !p.rcpt && p.pay === "card");
    const personal = pur.filter((p) => p.personal && p.pay === "card" && !p.repaid);
    if (missing.length) {
      pAdd(`<div class="banner no">"${missing.length} card charge${missing.length > 1 ? "s" : ""} with no receipt. Company policy: you sign a missing-receipt affidavit for each one. I'll be honest, I hate these forms."</div>`);
      for (const p of missing) {
        const b = pBtn(`✍️ Sign affidavit: ${esc(p.item)} ($${p.amt})`, () => {
          p.affidavit = true; ddSave(); b.disabled = true; b.textContent = "✍️ Signed"; addRep(0);
          if (missing.every((x) => x.affidavit) && !personal.length) next.disabled = false;
          if (missing.every((x) => x.affidavit) && personal.every((x) => x.repaid)) next.disabled = false;
        }, "act");
      }
    }
    if (personal.length) {
      pAdd(`<div class="banner no">"And this: ${personal.map((p) => esc(p.item)).join(", ")} on the company card. That's personal. Pay it back from your own cash, please. Don't mix personal and company spending, ever."</div>`);
      for (const p of personal) {
        const b = pBtn(`\u{1F4B5} Repay $${p.amt} from cash`, () => {
          d.cash -= p.amt; p.repaid = true; d.cardSpent -= p.amt; ddSave(); S.updateProgressUI();
          b.disabled = true; b.textContent = "\u{1F4B5} Repaid";
          addNote("receipt", "\u{1F4B5}", `Repaid $${p.amt} personal charge (${p.item}) to the company card.`);
          if (missing.every((x) => x.affidavit) && personal.every((x) => x.repaid)) next.disabled = false;
        }, "act");
      }
    }
    if (!missing.length && !personal.length && pur.some((p) => p.pay === "card")) {
      pAdd(`<div class="banner ok">"Every card charge has a receipt. Do you know how rare that is? Frame this."</div>`);
      award("receipts");
    }
    const next = pBtn("Next: the ticket queue →", () => { next.remove(); step2(); });
    next.disabled = !(missing.every((x) => x.affidavit) && personal.every((x) => x.repaid));
  }

  function step2() {
    const undoc = d.docs.filter((x) => !x.documented);
    const total = d.docs.length;
    panel("Gloria · the audit", "Ticket hygiene", sprite);
    pAdd(`<p style="margin:0 0 8px;">"Now. You closed <b>${total}</b> pieces of work this week: tickets, walk-ups, pages. I read every one. So I already know the answer. I just want to hear you say it."</p>
      <p style="margin:0 0 8px;"><b>"How many did you close without work notes?"</b></p>`);
    const row = pAdd("", "count-row");
    const max = Math.min(12, Math.max(total, 4));
    for (let i = 0; i <= max; i++) {
      const b = document.createElement("button"); b.className = "count-btn"; b.textContent = String(i);
      b.addEventListener("click", () => answer(i, undoc)); row.appendChild(b);
    }
  }

  function answer(n, undoc) {
    const truth = undoc.length;
    pClear();
    if (n === truth) {
      addRep(2); award("honest");
      pAdd(`<div class="banner ok">"${truth === 0 ? "Zero. And it IS zero." : "Correct. That's the number."} Thank you for not making me be the bad guy."</div>`);
    } else if (n < truth) {
      addRep(-2);
      pAdd(`<div class="banner no">"It's ${truth}. I told you I read them all. The notes matter less than the honesty, and now I'm worried about both."</div>`);
    } else {
      pAdd(`<div class="banner fact">"It's actually ${truth}. Be precise. I'll take over-careful over the alternative."</div>`);
    }
    addNote("audit", "\u{1F9FE}", `Ticket audit with Gloria: ${truth} closed without notes (said ${n}).`);
    if (!truth) {
      award("clean"); if (S_addFind("cleanQueue")) ping("\u{1F5BC}️", "Keepsake", "A framed 'Clean Queue' printout.");
      pAdd(`<p>"Every closed item has notes. The next tech who touches these will know exactly what you did. That's the job."</p>`);
      finish();
      return;
    }
    pAdd(`<p style="margin:8px 0;">"Back-fill them now, while you still remember. Each one is five minutes you didn't spend on Tuesday."</p>`);
    for (const r of undoc) {
      const b = pBtn(`\u{1F4DD} Back-fill: ${esc(r.title)}${r.user ? " (" + esc(r.user) + ")" : ""}`, () => {
        r.backfilled = true; ddSave(); b.disabled = true; b.textContent = "\u{1F4DD} Back-filled: " + r.title;
        if (undoc.every((x) => x.backfilled)) fin.disabled = false;
      }, "act");
    }
    const fin = pBtn("Done →", () => { fin.remove(); finish(); }); fin.disabled = true;
  }

  function finish() {
    S.setFlag("audited"); ddSave(); S.updateProgressUI();
    pBtn("Thanks, Gloria", () => { closePanel(); if (onDone) onDone(); }, "primary-btn act");
  }
}
function S_addFind(id) { try { return CORE.S.addFind(id); } catch { return false; } }
