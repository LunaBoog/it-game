// v2 flows: every task scene (kit, badge, CAB, notice, staging, stand-up,
// swap station, contacts, bridge, sign-offs, e-waste, audit, KB, PIR,
// Director's email, happy hour) and the evening ritual (EOD email →
// Marching Orders → alarm → sleep → morning card).

import { CORE, DD, ddSave, curDay, esc, shuffleArr, addNote, addRep, bump, recordAnswer, notesFor, dayName, DAY_SHORT } from "./core.js";
import { SUPPLY_LIST, SUPPLY, DISTRACT, KNOWN_ISSUES, RESOLVER_GROUPS } from "./pools.js";
import { mapDef, F3_SPOTS, LOBBY_SPOTS } from "./world.js";
import { panel, pAdd, pBtn, pClear, closePanel } from "./ui.js";
import { award, ping, blip, hearLingo, chatPost } from "./comms.js";
import { openAudit, docStats, spentOn, hasCard } from "./ledger.js";
import { tasksFor, dayTasksDone, currentTask, SIGNOFFS, judgment } from "./days.js";
import { visAdd, visFind, visLeave, visClearAll } from "./visitors.js";
import { clockReset } from "./clock.js";
import { rollCredits } from "./score.js";

const SF = () => CORE.S;
const HF = (f) => CORE.S.hasFlag(f);
const SET = (f) => CORE.S.setFlag(f);
const spr = (id) => CORE.S.npcSprite(id);

// A task judgment that must end on the best answer: wrong picks give feedback,
// cost a little rep, and let you try again. cb() runs once the best is picked.
function mustGetRight(opts, cb, badgeIfFirst) {
  const wrap = pAdd("", "btn-column");
  let tries = 0;
  const sh = shuffleArr(opts);
  const fb = pAdd("");
  sh.forEach((o) => {
    const b = document.createElement("button"); b.className = "dx-btn opt"; b.textContent = o[0];
    b.addEventListener("click", () => {
      tries++;
      recordAnswer(o[1], tries === 1);
      fb.innerHTML = `<div class="banner ${o[1] === 2 ? "ok" : o[1] === 1 ? "fact" : "no"}">${esc(o[2])}</div>`;
      if (o[1] === 2) {
        wrap.querySelectorAll("button").forEach((x) => { x.disabled = true; });
        b.classList.add("correct");
        if (tries === 1 && badgeIfFirst) award(badgeIfFirst);
        blip(true); cb(tries);
      } else { b.disabled = true; b.classList.add(o[1] === 1 ? "okay" : "wrong"); if (o[1] === 0) addRep(-1); blip(false); }
    });
    wrap.appendChild(b);
  });
}

// Tick-the-real-details composer (EOD email, user notice, PIR). Returns via cb.
function tickComposer(items, sendLabel, cb) {
  const sel = new Set();
  const w = pAdd("", "btn-column");
  items.forEach((it, k) => {
    const b = document.createElement("button"); b.className = "dx-btn opt tick";
    const paint = () => { b.innerHTML = `${sel.has(k) ? "☑" : "☐"} ${esc(it.t)}`; b.classList.toggle("on", sel.has(k)); };
    b.addEventListener("click", () => { if (sel.has(k)) sel.delete(k); else sel.add(k); paint(); CORE.sfx && CORE.sfx("tick"); });
    paint(); w.appendChild(b);
  });
  pBtn(sendLabel, () => {
    const missed = items.filter((it, k) => it.real && !sel.has(k));
    const extra = items.filter((it, k) => !it.real && sel.has(k));
    cb(missed, extra);
  });
}

function email(from, to, subject, bodyHtml) {
  return `<div class="email"><div class="em-h"><div><span>From</span><b>${from}</b></div><div><span>To</span>${to}</div>
    <div class="em-s"><span>Subject</span><b>${subject}</b></div></div><div class="em-b">${bodyHtml}</div></div>`;
}
const me = () => esc(SF().playerName || "you");

// =============================== NPC tasks ===================================
export function npcTask(n) {
  const S = SF(), day = curDay(), id = n.id;
  if (id === "lou") {
    if (day === 1 && !HF("badge")) { badgePhoto(); return true; }
    if (day === 2 && !HF("card_lou")) { giveCard("lou"); return true; }
    return false;
  }
  if (id === "tasha") {
    if (day === 1 && !HF("kit")) { if (!HF("badge")) return false; openKit(); return true; }
    if (day === 2 && !HF("standup")) { standup(); return true; }
    if (day === 3 && !HF("kitReturned")) { returnKit(); return true; }
    return false;
  }
  if (id === "kai") {
    if (day === 1 && HF("kit") && !HF("suppliesDelivered")) { deliverSupplies(); return true; }
    return false;
  }
  if (id === "harold") {
    if (day === 1 && !HF("cabApproved") && HF("kit")) { openCab(); return true; }
    if (day === 2 && !HF("bridgeIn")) { bridgeCheckIn(); return true; }
    return false;
  }
  if (id === "mo") {
    if (day === 1 && HF("kit") && !HF("cartOut")) { checkoutCart(); return true; }
    if (day === 2 && !HF("card_mo")) { giveCard("mo"); return true; }
    return false;
  }
  if (day === 3 && ["ed", "karen", "riley"].includes(id) && !HF("signoff_" + id) && HF("knownDone")) {
    // the day-3 sign-off supersedes their other business until it's done
    signOff(n); return true;
  }
  if (id === "gloria" && day === 3 && !HF("audited")) { openAudit(() => S.updateProgressUI()); return true; }
  if (id === "nico" && day === 3 && HF("chenEmail") && !HF("partyDone")) { partyFinale(); return true; }
  if (id === "recycler") { recyclerHandoff(n); return true; }
  if (n.party && day >= 3) { partyChat(n); return true; }
  return false;
}

// ============================== prop tasks ===================================
export function propTask(p) {
  const S = SF(), day = curDay();
  switch (p.kind) {
    case "laptop": homeLaptop(); return true;
    case "bed": bed(); return true;
    case "subway": commute(p.to); return true;
    case "elevator":
      if (p.id === "elevator-l" && !HF("badge")) {
        panel("Lou", "Security desk", spr("lou"));
        pAdd(`<p>“Whoa, whoa. No badge, no elevator. New? Come see me at the desk, I'll take your picture.”</p>`);
        pBtn("Close", closePanel, "act ghost"); return true;
      }
      return false;
    case "workpc": workPc(); return true;
    case "kiboard": knownBoard(); return true;
    case "backup": backupConsole(); return true;
    case "assettag": assetTag(p); return true;
    case "station": station(p); return true;
    case "notice": noticeSign(p); return true;
    case "cage": cage(); return true;
    case "ewaste": stepOn(p.x, p.y, true); return true;
    case "bardoor":
      panel("The Stack", "W 49th St", "\u{1F37B}");
      pAdd(`<p>A chalkboard on the door: <b>PRIVATE EVENT TONIGHT · 6 PM · IT DEPARTMENT</b>. Somebody drew a little laptop with a party hat.</p>`);
      pBtn("Close", closePanel, "act ghost"); return true;
    case "decor": {
      const t = { cart: "A coffee cart. The smell alone is a productivity tool.", loaner: "The loaner cart: a steel trolley with a clipboard and a bungee cord. Mo checks it out.", shelf: "A wall of cables, adapters, and one very old serial-to-USB dongle nobody will ever buy." }[p.art] || p.label;
      panel(p.label, p.room || "", "\u{1F50E}"); pAdd(`<p>${esc(t)}</p>`); pBtn("Close", closePanel, "act ghost"); return true;
    }
  }
  return false;
}

// ================================ DAY 1 ======================================
function welcomeEmail() {
  panel("\u{1F4E7} Inbox", "Tuesday · 6:52 AM", "\u{1F4E7}");
  pAdd(email("<b>Tasha Reyes</b> · Help Desk Lead", me(), "Welcome aboard! + Cutover Week",
    `<p>Hi ${me()}, welcome to the team! Fair warning: your first three days are Cutover Week. We're swapping every laptop in <b>Accounting and Reception</b> for new ones.</p>
     <p class="em-sec">TODAY · ONBOARDING &amp; CHANGE PREP</p><ol>${tasksFor(1).slice(1).map((t) => `<li>${esc(t.label)}</li>`).join("")}</ol>
     <p>Start by getting your badge photo with Lou at the lobby security desk. The office is 49th St off the N/R/W. See you upstairs on 3.</p><p>— Tasha</p>`));
  pBtn("\u{1F392} Grab your bag and go", () => {
    SET("d1Email"); closePanel();
    chatPost("Tasha", `Morning! ${SF().playerName || "New hire"} starts today. Be nice.`, false);
    chatPost("Benny", "Welcome! I route the queue. If you're ever stuck, call me. You get three calls a week.", false);
  });
}

function badgePhoto() {
  panel("Lou", "Building security · lobby", spr("lou"));
  pAdd(`<p>“New face! ID, please. Okay. Look at the dot. Don't smile, it's worse when you smile.”</p><p><i>*flash*</i></p>
    <p>“Here's the rule: badge in, badge out, every time. Don't hold the door for anyone you don't know, even if they've got pizza. <b>Especially</b> if they've got pizza.”</p>`);
  pAdd(`<div class="banner fact">\u{1FAAA} <b>Tailgating:</b> following someone through a secure door on their badge. It beats every lock in the building. Challenging strangers is part of the job.</div>`);
  pBtn("\u{1FAAA} Take the badge", () => {
    SET("badge"); SF().addFind("badgePhoto"); addNote("kit", "\u{1FAAA}", "Badge photo taken with Lou at the lobby desk.");
    closePanel(); ping("\u{1FAAA}", "Keepsake", "Your first badge photo. You look terrified.");
  });
}

function openKit() {
  panel("Tasha", "Help Desk Lead · your kit", spr("tasha"));
  pAdd(`<p>“There you are! Okay, kit time.” She slides a tray across the desk.</p>
    <div class="banner kit"><b>Your kit</b><br>\u{1F4BB} Work laptop (enrolled, encrypted)<br>\u{1F4F2} MFA: authenticator enrolled on your phone<br>\u{1F464} Daily account: <b>${me()}</b><br>\u{1F511} Admin account: <b>adm-${me()}</b> (temporary, for the cutover)<br>\u{1F4B3} Company card · $500 limit<br>\u{1F4F1} #helpdesk-team chat</div>
    <p>“Quick check before I let you loose. You've got two accounts now.”</p><p><b>“Which one do you read your email with?”</b></p>`);
  mustGetRight([
    ["Your daily account. The admin account is only for admin tasks, never email or browsing.", 2, "“Yes. If a phishing email lands in the admin account, the attacker gets admin. Least privilege.”"],
    ["The admin account, so you never get blocked.", 0, "“No! That's how one bad link becomes domain-wide. Admin rights never touch email.”"],
    ["Whichever one's open.", 1, "“Nope. Pick one on purpose: the daily one.”"]
  ], () => {
    hearLingo("leastpriv"); hearLingo("jit");
    pAdd(`<p>“Good. And here: my spare USB-C dongle. Everybody loses theirs by Thursday.”</p>
      <p>“Supply list is in the chat. Byte Bodega is right next door. Put it on the card and <b>get receipts</b>; Gloria reconciles everything on Day 3. Then take Karen's ticket, I'll watch.”</p>`);
    pBtn("\u{1F392} Take the kit", () => {
      SET("kit"); SET("supplyList"); SF().addFind("dongle"); DD().hasCard = true; ddSave();
      addNote("kit", "\u{1F392}", "Kit issued by Tasha: laptop, MFA, daily + separate admin account, company card, team chat.");
      closePanel(); SF().updateProgressUI();
      chatPost("Tasha", "Supply list: asset labels + custody logbook, USB-C adapters, Cat6 patch cables, anti-static bags, cable ties. Byte Bodega, on the card. RECEIPTS.");
    });
  });
}

function deliverSupplies() {
  const left = SUPPLY_LIST.filter((k) => !HF("sup_" + k));
  panel("Kai", "IT intern", spr("kai"));
  if (left.length) {
    pAdd(`<p>“Tasha says you're doing the supply run? I still need: ${left.map((k) => esc(SUPPLY[k].name)).join(", ")}. Byte Bodega, street level!”</p>`);
    pBtn("On it", closePanel, "act ghost"); return;
  }
  pAdd(`<p>“Oh nice, the whole list! I'll stage the adapters on the cart and put the labels and logbook in your drawer. You'll need those for the inventory walk.”</p>`);
  pBtn("\u{1F4E6} Hand it over", () => { SET("suppliesDelivered"); addNote("supply", "\u{1F4E6}", "Supply run done and handed to Kai."); closePanel(); });
}

function assetTag(p) {
  panel(p.label, p.room, "\u{1F3F7}️");
  if (curDay() !== 1 || HF("tag_" + p.id)) {
    pAdd(`<p>${esc(p.label)} · serial <code>${esc(p.serial)}</code> · ${HF("tag_" + p.id) ? "asset-tagged and logged." : "not tagged yet."}</p>`);
    pBtn("Close", closePanel, "act ghost"); return;
  }
  if (!HF("sup_labels")) {
    pAdd(`<p>You need asset labels and the custody logbook first. They're on Tasha's list: Byte Bodega.</p>`);
    pBtn("Close", closePanel, "act ghost"); return;
  }
  pAdd(`<p>You check the sticker under the machine and the name on the login screen.</p>
    <div class="worknote"><div class="wn-h">\u{1F3F7}️ Asset record</div><div><span>Device</span>${esc(p.label)}</div><div><span>Serial</span>${esc(p.serial)}</div><div><span>User</span>${esc(p.user)}</div><div><span>Location</span>${esc(p.room)}</div></div>`);
  if (!HF("tagExplained")) pAdd(`<div class="banner fact">An asset tag ties a serial number to an owner and a location. When this machine gets swapped out tomorrow, this line is how you prove where it went.</div>`);
  pBtn("\u{1F3F7}️ Tag it & log it", () => {
    SET("tagExplained"); SET("tag_" + p.id); hearLingo("assettag");
    addNote("inventory", "\u{1F3F7}️", `Asset-tagged ${p.label} (${p.serial}, ${p.user}).`);
    closePanel();
    const n = ["tag-r1", "tag-r2", "tag-a1", "tag-a2", "tag-a3", "tag-a4"].filter((t) => HF("tag_" + t)).length;
    ping("\u{1F3F7}️", `Tagged ${n}/6`, p.label);
  });
}

function backupConsole() {
  panel("Backup console", "Server closet", "\u{1F4BE}");
  if (HF("backupVerified")) { pAdd(`<p>Last test restore: <b>passed</b>. Files opened clean.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (curDay() !== 1) { pAdd(`<p>Nightly job: SUCCESS.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<div class="terminal">Job: NIGHTLY-FILESERVER-01 · Status: <b>SUCCESS ✅</b>\nLast run: 02:00 · 1.2 TB · copies: local NAS + offsite (immutable)</div>
    <p>Harold won't approve a change without proof the data is safe. The console says success. <b>What do you do?</b></p>`);
  mustGetRight([
    ["Run a test restore: pull a sample of Accounting's files to a scratch folder and confirm they actually open.", 2, "Twenty spreadsheets restored and opened. Now you KNOW the backup works. 'Success' in a log is a claim; a restore is proof."],
    ["It says SUCCESS. Screenshot it for Harold.", 1, "A green check means the job ran, not that the data comes back. Prove it with a restore."],
    ["Kick off a brand-new full backup right now, mid-morning.", 0, "That hammers the file server during business hours and still proves nothing until you restore from it."]
  ], (tries) => {
    hearLingo("testrestore");
    pBtn("\u{1F4BE} Log the test restore", () => {
      SET("backupVerified"); addNote("backup", "\u{1F4BE}", "Verified backups with a test restore (3-2-1: local NAS + offsite immutable copy).");
      closePanel();
    });
  }, "restore");
}

function openCab() {
  panel("CAB · Change Advisory Board", "Harold + Director Chen · conf. room", spr("harold"));
  if (!HF("backupVerified")) {
    pAdd(`<p>Harold: “First question on my form: are the backups verified? With a restore? No? Then we're not talking yet. Server closet, backup console.”</p>`);
    pBtn("Go verify the backups", closePanel, "act ghost"); return;
  }
  pAdd(`<p>Harold slides a change request across the table. Director Chen sips coffee. “Pitch it. Three fields.”</p>`);
  const fields = [
    { k: "window", q: "Change window", opts: [
      ["Tomorrow 8–11 AM, Accounting + Reception only, users notified today", 2, "Low-traffic morning, scoped, with notice. Approved."],
      ["Friday at 4:30 PM", 0, "Friday afternoon with a weekend of no support behind it? Classic mistake."],
      ["Whenever. It's just laptops.", 0, "'Just laptops' is where payroll lives. Pick a window."]] },
    { k: "backout", q: "Backout plan", opts: [
      ["Keep every old laptop untouched until the user signs off; if a new one fails, hand the old one back", 2, "A real backout: fast, tested, reversible."],
      ["None needed, the new laptops are better", 0, "No backout plan, no approval. Ever."],
      ["Reimage the old laptops right away to save time", 0, "That destroys your only way back."]] },
    { k: "risk", q: "Risk & impact", opts: [
      ["Medium: 12 users; payroll runs Wednesday at noon, so no Accounting swap during the run", 2, "You found the business-critical conflict. That's what CAB is for."],
      ["Low: it's just laptops", 1, "The laptops are simple. Payroll isn't."],
      ["High: cancel the whole thing", 0, "Overcautious. This is a routine, well-planned change."]] }
  ];
  const pick = {};
  const host = pAdd("");
  let pitches = 0;
  fields.forEach((f) => {
    const box = document.createElement("div"); box.className = "cab-field";
    box.innerHTML = `<div class="scenario-section-label">${esc(f.q)}</div>`;
    const col = document.createElement("div"); col.className = "btn-column";
    shuffleArr(f.opts).forEach((o) => {
      const b = document.createElement("button"); b.className = "dx-btn opt"; b.textContent = o[0];
      b.addEventListener("click", () => { pick[f.k] = o; col.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); });
      col.appendChild(b);
    });
    box.appendChild(col); host.appendChild(box);
  });
  const fb = pAdd("");
  pBtn("\u{1F5C2}️ Submit to CAB", () => {
    if (fields.some((f) => !pick[f.k])) { fb.innerHTML = `<div class="banner fact">Fill in all three fields.</div>`; return; }
    pitches++;
    const bad = fields.filter((f) => pick[f.k][1] !== 2);
    fields.forEach((f) => recordAnswer(pick[f.k][1], pitches === 1));
    if (bad.length) {
      addRep(-1);
      fb.innerHTML = `<div class="banner no">Harold: “Not yet.” ${bad.map((f) => `<br><b>${esc(f.q)}:</b> ${esc(pick[f.k][2])}`).join("")}<br>“Fix it and resubmit.”</div>`;
      blip(false); return;
    }
    if (pitches === 1) award("cab");
    hearLingo("cab"); hearLingo("backout"); hearLingo("window"); hearLingo("freeze");
    SET("cabApproved"); addNote("cab", "\u{1F5C2}️", "CAB approved the laptop refresh: tomorrow 8–11 AM, backout = old laptops kept until sign-off, no Accounting swaps during payroll.");
    pClear();
    pAdd(`<div class="banner ok">✅ <b>APPROVED.</b> Director Chen: “Clean pitch.” Harold: “Now tell the users. <b>Today.</b> Nobody gets surprised by a change on my bridge.”</div>`);
    chatPost("Harold", "CAB approved the laptop refresh for tomorrow 8–11. @helpdesk send the user notice NOW.");
    pBtn("\u{1F6A8} Go send the notice", closePanel);
    blip(true);
  });
}

function noticeComposer() {
  panel("\u{1F4E3} User notice", "To: Accounting, Reception · cc Harold", "\u{1F4E3}");
  pAdd(`<p style="margin:0 0 6px;">Company policy: users get a notice before any change that touches their machine. Tick everything that belongs in it, and nothing that doesn't.</p>`);
  const items = shuffleArr([
    { t: "What's changing: your laptop is being replaced with a new one", real: true },
    { t: "When: tomorrow, 8–11 AM, in scheduled slots", real: true },
    { t: "What to do: save your work and let OneDrive finish syncing before you leave today", real: true },
    { t: "Where to go: the swap station in the conference room", real: true },
    { t: "How to get help: the service desk, ext. 4357", real: true },
    { t: "The local admin password for the imaging bench, just in case", real: false },
    { t: "A funny meme about Mondays", real: false },
    { t: "Harold's personal cell number", real: false }
  ]);
  tickComposer(items, "\u{1F4E8} Send the notice", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Perfect notice. Tasha: “Clear, complete, no surprises. That's the standard.”</div>`); award("notice"); addRep(1); }
    else {
      pAdd(`<div class="banner ${missed.length ? "no" : "fact"}">Tasha: ${missed.length ? `“You left out <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>. People will show up confused.” ` : ""}${extra.length ? `“And please never put <b>${extra.map((x) => esc(x.t)).join(" or ")}</b> in a user email.”` : ""}</div>`);
      if (extra.some((x) => /password/i.test(x.t))) addRep(-1);
    }
    SET("noticeSent"); hearLingo("window");
    addNote("notice", "\u{1F4E3}", "Sent the change notice to Accounting + Reception (what, when, what to do, where, how to get help). Maintenance notices posted.");
    pAdd(`<p>Kai prints three <b>MAINTENANCE IN PROGRESS</b> signs and tapes them up around the floor. Somebody will have to take those down on Day 3.</p>`);
    pBtn("Done", closePanel);
  });
}

function checkoutCart() {
  panel("Mo", "IT storeroom", spr("mo"));
  pAdd(`<p>“Twelve new laptops, boxed, serials in my book. You want the cart? Sign here. Initials here. And here.”</p>
    <div class="banner fact">\u{1F4D2} Mo logs every serial going out and coming back. That custody record is what lets you prove, later, where every device went.</div>`);
  pBtn("✍️ Sign for the loaner cart", () => {
    SET("cartOut"); hearLingo("custody");
    addNote("stage", "\u{1F6D2}", "Signed out the loaner cart + 12 new laptops from Mo (serials logged).");
    closePanel(); ping("\u{1F6D2}", "Loaner cart", "Take it up to the conference room imaging bench.");
  });
}

function station(p) {
  const day = curDay();
  if (day === 1 && p.station === "bench") {
    panel("Imaging bench", "Conference room", "\u{1F4BB}");
    if (!HF("cartOut")) { pAdd(`<p>Nothing to image yet. The new laptops are on Mo's loaner cart in the lobby storeroom.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
    if (HF("staged")) { pAdd(`<p>Twelve laptops, provisioned and labeled. Ready for tomorrow.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
    pAdd(`<p>You line up twelve laptops and kick off provisioning. Eleven check in with the current image. <b>One reports last year's image version.</b></p>`);
    mustGetRight([
      ["Pull it, reprovision it with the current approved image, and note the serial.", 2, "Twelve for twelve on the current build. One bad image would've been tomorrow's weirdest ticket."],
      ["Ship it anyway, close enough.", 0, "Old image = old bugs, missing apps, and a mystery on go-live day."],
      ["Leave a sticky note on it for Kai.", 1, "Kai will do his best. It's your staging, though."]
    ], () => {
      hearLingo("imaging");
      pBtn("✅ Staged", () => { SET("staged"); addNote("stage", "\u{1F4BB}", "Staged 12 laptops on the current image (1 reprovisioned from an old build)."); closePanel(); });
    });
    return;
  }
  if (day === 2) {
    const k = "st_" + p.station;
    const txt = { bench: ["Imaging bench", "Power strip, twelve chargers, the provisioning checklist taped to the table."],
      xfer: ["Data-transfer station", "Transfer checklist: OneDrive synced ✓, browser profile signed in ✓, printers ✓, old laptop kept until sign-off ✓."],
      wait: ["Waiting area", "Chairs, a coffee urn, and a whiteboard with the swap schedule in 15-minute slots."] }[p.station];
    panel(txt[0], "Swap station · conf. room", "\u{1F9F0}");
    if (HF(k)) { pAdd(`<p>${esc(txt[1])} All set.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
    pAdd(`<p>${esc(txt[1])}</p>`);
    if (p.station === "xfer") hearLingo("kfm");
    pBtn("\u{1F9F0} Set it up", () => {
      SET(k); closePanel();
      const n = ["bench", "xfer", "wait"].filter((s) => HF("st_" + s)).length;
      ping("\u{1F9F0}", `Swap station ${n}/3`, txt[0]);
      if (n === 3) addNote("station", "\u{1F9F0}", "Swap station ready: imaging bench, data-transfer station, waiting area with the slot schedule.");
    });
    return;
  }
  panel(p.label, p.room, "\u{1F9F0}"); pAdd(`<p>The swap station. ${day === 3 ? "Quiet now." : "Tomorrow's the big day."}</p>`); pBtn("Close", closePanel, "act ghost");
}

// ================================ DAY 2 ======================================
function standup() {
  panel("Tasha", "Morning stand-up · 7:45 AM", spr("tasha"));
  pAdd(`<p>“Hardware landed at seven. Harold opens the bridge at eight. Today, <b>Help Desk owns the users</b>: the swaps, the walk-ups, the pages. The engineers own the change.”</p>
    <p>“Set up the swap station, get the escalation contacts into chat, then check in with Harold. After that the window opens and it gets loud.”</p>`);
  hearLingo("tiers"); hearLingo("sla");
  pBtn("\u{1F44D} Let's go", () => { SET("standup"); addNote("standup", "\u{1F5E3}️", "Stand-up with Tasha: Help Desk owns the users; engineers own the change."); closePanel();
    chatPost("Tasha", "Swap station first, then contacts in chat, then bridge check-in with Harold. You've got this."); });
}

function giveCard(who) {
  if (who === "mo") {
    panel("Mo", "IT storeroom", spr("mo"));
    pAdd(`<p>“Escalation contacts? Here's the OEM warranty desk: dead laptop out of the box, they ship a replacement next business day. Card's got the contract number on it.”</p>`);
    pBtn("\u{1F4C7} Take the OEM warranty card", () => { SET("card_mo"); closePanel(); ping("\u{1F4C7}", "Contact card", "OEM warranty desk"); });
  } else {
    panel("Lou", "Security desk", spr("lou"));
    pAdd(`<p>“ISP NOC number, from the vendor file. If the internet dies, THIS is who you call. And if some guy shows up saying he's from the ISP, you call this number to check. Not the one on his clipboard.”</p>`);
    pBtn("\u{1F4C7} Take the ISP NOC card", () => { SET("card_lou"); closePanel(); ping("\u{1F4C7}", "Contact card", "ISP network operations center"); });
  }
}

// Phone extras: the Day-2 contact-card attachment task.
export function phoneExtras() {
  if (curDay() !== 2 || HF("contactsSent")) return;
  if (!HF("card_mo") || !HF("card_lou")) { pAdd(`<div class="set-hint" style="margin-top:8px;">Tasha wants the escalation contacts in here. Get the cards from Mo (storeroom) and Lou (security desk).</div>`); return; }
  pAdd(`<div class="scenario-section-label" style="margin-top:10px;">Attach & send</div>`);
  const opts = [
    { id: "mo", t: "\u{1F4C7} OEM warranty desk (from Mo)", real: true },
    { id: "lou", t: "\u{1F4C7} ISP NOC (from Lou)", real: true },
    { id: "meme", t: "\u{1F5BC}️ server_room_on_fire.gif", real: false }
  ];
  tickComposer(opts, "\u{1F4E4} Post to #helpdesk-team", (missed, extra) => {
    if (missed.length) { ping("\u{1F4F1}", "Missing a card", "Attach both contact cards."); return; }
    SET("contactsSent");
    chatPost("You", "Escalation contacts for today: OEM warranty desk + ISP NOC (numbers from the vendor file).", false);
    chatPost("Tasha", extra.length ? "Thanks! (Contacts, yes. The gif, no. Not today.)" : "Perfect, pinned. Now check in with Harold.");
    addNote("contacts", "\u{1F4C7}", "Posted escalation contacts (OEM warranty desk, ISP NOC) to the team chat.");
    closePanel();
  });
}

function bridgeCheckIn() {
  panel("Harold", "The change bridge", spr("harold"));
  if (!HF("standup") || !["bench", "xfer", "wait"].every((s) => HF("st_" + s))) {
    pAdd(`<p>“Stand-up with Tasha and the swap station first. I don't open the window until Help Desk is ready for the users.”</p>`);
    pBtn("On it", closePanel, "act ghost"); return;
  }
  pAdd(`<p>Headset on, three laptops open, one showing a Gantt chart. “Before I open the window: during this change, who owns what?”</p>`);
  mustGetRight([
    ["Help Desk owns the users (swaps, walk-ups, comms). The engineers own the change. We escalate, we don't freelance.", 2, "“Exactly. If someone asks you to touch a server, you send them to me.”"],
    ["Help Desk jumps in wherever it's needed, servers included.", 0, "“That's how two people make the same change at once. No.”"],
    ["Help Desk waits until the change is done.", 1, "“The users need you DURING the change. That's the whole point of today.”"]
  ], () => {
    hearLingo("gonogo");
    pBtn("\u{1F4DE} Join the bridge", () => {
      SET("bridgeIn"); closePanel();
      CORE.S.openWindow && CORE.S.openWindow();
    });
  });
}

// ================================ DAY 3 ======================================
function noticeSign(p) {
  panel("Maintenance notice", p.room, "\u{1FAA7}");
  pAdd(`<div class="notice-card">⚠️ <b>MAINTENANCE IN PROGRESS</b><br>Laptop refresh · Accounting &amp; Reception<br>Swap station: Conference room · Help: ext. 4357</div>`);
  if (curDay() === 3) {
    pBtn("\u{1F9FB} Pull it down", () => {
      SET("pulled_" + p.id); closePanel();
      const n = ["sign-r", "sign-a", "sign-o"].filter((s) => HF("pulled_" + s)).length;
      ping("\u{1F9FB}", `Notices pulled ${n}/3`, n === 3 ? "Now the intranet banner (work PC)." : "");
      if (n === 3) addNote("signs", "\u{1F9FB}", "Pulled all 3 maintenance notices.");
    });
  } else pBtn("Close", closePanel, "act ghost");
}

function knownBoard() {
  const d = DD(), day = curDay();
  panel("Known-issues whiteboard", "IT room", "\u{1F4CB}");
  if (day < 3) {
    const k = d.known;
    pAdd(k.length ? `<ul class="principle-list">${k.map((x) => { const ki = KNOWN_ISSUES.find((z) => z.id === x.id); return `<li>${esc(ki.log)}</li>`; }).join("")}</ul>`
      : `<p class="set-hint">Nothing logged yet. During the change, anything weird goes up here.</p>`);
    pBtn("Close", closePanel, "act ghost"); return;
  }
  ensureDay3Known();
  const open = d.known.filter((x) => !x.routed);
  if (!open.length) { pAdd(`<div class="banner ok">Every known issue is routed. The owners can sign off now.</div>`); pBtn("Close", closePanel, "act ghost"); return; }
  const it = open[0], ki = KNOWN_ISSUES.find((z) => z.id === it.id);
  pAdd(`<p style="margin:0 0 4px;"><b>${d.known.length - open.length + 1}/${d.known.length}</b> · ${esc(ki.area)} · reported by ${esc(ki.who)}</p>
    <div class="worknote"><div class="wn-h">\u{1F4CB} ${esc(ki.log)}</div><div><span>User said</span>“${esc(ki.report)}”</div></div>
    <p style="margin:8px 0 4px;"><b>Which resolver group owns it?</b></p>`);
  const row = pAdd("", "group-row"); const fb = pAdd("");
  RESOLVER_GROUPS.forEach((g) => {
    const b = document.createElement("button"); b.className = "group-btn"; b.textContent = g;
    b.addEventListener("click", () => {
      it.tries = (it.tries || 0) + 1;
      if (g === ki.group) {
        it.routed = true; it.group = g; ddSave();
        recordAnswer(2, it.tries === 1); if (it.tries === 1) DD().st.routedFirst++; DD().st.routed++; ddSave();
        addRep(it.tries === 1 ? 1 : 0);
        addNote("known", "\u{1F4CB}", `Routed "${ki.log}" to ${g}.`);
        row.querySelectorAll("button").forEach((x) => { x.disabled = true; }); b.classList.add("correct");
        fb.innerHTML = `<div class="banner ok">${esc(ki.why)}</div>`;
        const left = d.known.filter((x) => !x.routed).length;
        if (!left) {
          SET("knownDone"); hearLingo("known");
          if (d.known.every((x) => x.tries === 1)) award("router");
          chatPost("Benny", "Every known issue routed. Owners can sign off now.");
        }
        pBtn(left ? "Next issue →" : "Done", left ? knownBoard : closePanel);
        blip(true);
      } else {
        recordAnswer(0, false); b.disabled = true; b.classList.add("wrong");
        fb.innerHTML = `<div class="banner no">${esc(g)} bounces it back: “Not ours.” Think about where the fix actually lives.</div>`;
        blip(false);
      }
    });
    row.appendChild(b);
  });
}
// Day 3's list: everything logged on Day 2, plus two that surfaced overnight.
export function ensureDay3Known() {
  const d = DD();
  if (d.known3) return;
  const logged = new Set(d.known.map((x) => x.id));
  const extra = shuffleArr(KNOWN_ISSUES.filter((k) => !logged.has(k.id))).slice(0, Math.max(2, 4 - d.known.length));
  for (const k of extra) d.known.push({ id: k.id, d: 3, routed: false, tries: 0, overnight: true });
  d.known3 = true; ddSave();
}

function signOff(n) {
  const S = SF();
  const nm = { ed: "Accounting", karen: "Reception", riley: "Operations" }[n.id];
  panel(n.name, `${nm} · business sign-off`, n.sprite);
  if (!HF("knownDone")) {
    pAdd(`<p>“Sign off? With the S: drive thing still open? Route the known issues to whoever owns them and I'll sign.”</p>`);
    pBtn("Fair", closePanel, "act ghost"); return;
  }
  hearLingo("uat");
  pAdd(`<p>“Okay, UAT. You want me to confirm it all works for ${nm}?”</p><p><b>What do you ask them to check?</b></p>`);
  mustGetRight([
    ["Walk through their real daily tasks on the new laptop (files, printing, their main apps) and confirm each one works before they sign.", 2, "Ten minutes of actual work on the new machine. Everything checks out. They sign."],
    ["Just have them sign, it's a formality.", 0, "A signature on untested software is how Day 4 becomes a crisis."],
    ["Ask if they like the new laptop.", 1, "Nice, but 'I like it' isn't acceptance. Have them test their actual work."]
  ], () => {
    pBtn(`✍️ Take ${n.name}'s sign-off`, () => {
      SET("signoff_" + n.id); S.addFind("signoff_" + n.id);
      addNote("signoff", "✍️", `${n.name} signed off for ${nm} after walking through their daily tasks.`);
      closePanel();
      const k = SIGNOFFS.filter(([id]) => HF("signoff_" + id)).length;
      ping("✍️", `Sign-off ${k}/3`, `${n.name} · ${nm}`);
      if (k === 3) { SET("signoffsDone"); chatPost("Harold", "All three business sign-offs in. The old laptops are released: wipe, log, cage. Every one."); }
    });
  });
}

// ---- e-waste chain of custody (the TrashMan) ----------------------------------
export function stepOn(x, y, faced = false) {
  const S = SF(); if (S.map !== "floor3" || curDay() !== 3) return;
  const d = DD();
  const e = F3_SPOTS.ewaste.find((q) => q.x === x && q.y === y);
  if (!e || !HF("signoffsDone") || HF("ew_" + e.id)) return;
  if (!HF("sup_labels")) { ping("\u{1F3F7}️", "No labels", "You need the asset labels + custody logbook."); return; }
  const first = !HF("ewastePlan");
  d.carry.push(e.id); SET("ew_" + e.id); ddSave();
  addNote("ewaste", "♻️", `Picked up ${e.label}, labeled for custody.`);
  S.updateProgressUI();
  if (first) { SET("ewastePlan"); openEwastePlan(); }
  else ping("♻️", `Carrying ${d.carry.length}`, e.label);
}

function openEwastePlan() {
  panel("♻️ The E-Waste Plan", "Director Chen's rule", spr("chen"));
  pAdd(`<p>“<b>Every drive that leaves this building leaves on paper.</b> Those old laptops have years of payroll, email and passwords on them. They don't go in a closet, a dumpster, or anybody's kid's backpack.”</p>`);
  const pic = pAdd("", "trashpic");
  const cv = document.createElement("canvas"); cv.width = 64; cv.height = 64; pic.appendChild(cv);
  try { drawCageIcon(cv); } catch { /* ignore */ }
  pic.insertAdjacentHTML("beforeend", `<div><b>This is the e-waste cage.</b><br><span class="set-hint">A locked steel cage in Mo's IT storeroom, lobby level. Only Mo and the recycler have keys.</span></div>`);
  pAdd(`<div class="banner kit"><b>The plan</b><br>1. \u{1F3F7}️ Label each device (asset labels from Byte Bodega).<br>2. \u{1F6B6} Walk over the 8 old devices on Floor 3 to collect them.<br>3. \u{1F4D2} Take them down to the cage and log every serial into Mo's custody book.<br>4. \u{1F69A} The certified recycler destroys the drives and hands you a <b>certificate of destruction</b>.</div>`);
  pAdd(`<div class="banner fact"><b>Why:</b> NIST SP 800-88 names three sanitization levels: <b>clear</b> (overwrite), <b>purge</b> (recovery infeasible even with lab tools), <b>destroy</b> (shred it). Custody records prove each device got there. <b>Goal:</b> all 8 in the cage, logged.</div>`);
  if (!HF("sup_labels")) pAdd(`<div class="banner no">\u{1F3F7}️ <b>You don't have asset labels.</b> Byte Bodega, street level.</div>`);
  hearLingo("sanitize"); hearLingo("custody");
  pBtn("Got it: collect all 8", closePanel);
}
function drawCageIcon(c) {
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
  x.fillStyle = "#1a1a18"; x.fillRect(0, 0, 64, 64);
  x.fillStyle = "#6a7078"; for (let i = 4; i < 60; i += 7) { x.fillRect(i, 6, 2, 52); } for (let j = 6; j < 58; j += 7) x.fillRect(4, j, 56, 1);
  x.fillStyle = "#3A3A38"; x.fillRect(10, 36, 18, 12); x.fillRect(32, 40, 20, 8);
  x.fillStyle = "#85B7EB"; x.fillRect(12, 38, 14, 6);
  x.fillStyle = "#F2C94C"; x.fillRect(28, 26, 8, 8); x.fillStyle = "#1a1a18"; x.fillRect(31, 29, 2, 3);
}

function cage() {
  const d = DD();
  panel("E-waste cage", "IT storeroom · Mo", spr("mo"));
  if (curDay() !== 3) { pAdd(`<p>A locked steel cage. Mo: “Nothing goes in without a line in my book.”</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!d.carry.length) {
    pAdd(`<p>“${d.caged.length}/8 in the cage.${d.caged.length === 8 ? " Recycler's on the way." : " Bring me the rest."}”</p>`);
    pBtn("Close", closePanel, "act ghost"); return;
  }
  const rows = d.carry.map((id) => F3_SPOTS.ewaste.find((e) => e.id === id)).map((e) => `<div><span>${esc(e.id.toUpperCase())}</span>${esc(e.label)}</div>`).join("");
  pAdd(`<p>Mo unlocks the cage and opens the custody book.</p><div class="worknote"><div class="wn-h">\u{1F4D2} Chain of custody · in</div>${rows}</div>`);
  pBtn(`\u{1F4D2} Log ${d.carry.length} device${d.carry.length > 1 ? "s" : ""} into the cage`, () => {
    d.caged.push(...d.carry); const n = d.carry.length; d.carry = []; ddSave();
    addNote("ewaste", "\u{1F512}", `Logged ${n} device(s) into the e-waste cage (${d.caged.length}/8).`);
    closePanel(); SF().updateProgressUI();
    if (d.caged.length >= 8) spawnRecycler();
    else ping("\u{1F512}", `Caged ${d.caged.length}/8`, "Go get the rest.");
  });
}
function spawnRecycler() {
  if (visFind((n) => n.id === "recycler") || HF("certDestruction")) return;
  visAdd("lobby", { id: "recycler", name: "Recycler", role: "Certified e-waste · NAID-style", x: LOBBY_SPOTS.recycler.x, y: LOBBY_SPOTS.recycler.y,
    sprite: { body: "#2E7D32", body2: "#1B5E20", accent: "#FFEB3B", hair: "#2C2C2A", skin: "#C9926B", hat: "#2E7D32" } }, { kind: "recycler", target: null });
  chatPost("Mo", "All 8 in the cage. Recycler's at the storeroom door, come sign the handoff.");
}
function recyclerHandoff(n) {
  panel("Recycler", "Certified e-waste pickup", n.sprite);
  pAdd(`<p>“Eight devices. Let me match serials to your book… all eight. Drives get shredded at our facility today; you'll have the certificate by email, but here's the pickup copy.”</p>
    <div class="worknote"><div class="wn-h">\u{1F4DC} Certificate of destruction</div><div><span>Devices</span>8 (6 laptops, 2 drives)</div><div><span>Method</span>Destroy (shred)</div><div><span>Custody</span>IT storeroom → recycler, signed</div></div>`);
  pBtn("✍️ Sign the handoff", () => {
    SET("certDestruction"); SF().addFind("certDestruction"); award("custody");
    addNote("ewaste", "\u{1F4DC}", "Recycler picked up all 8 devices; certificate of destruction received.");
    closePanel(); visLeave(n, { x: 27, y: 7 });
    setTimeout(() => { try { const m = mapDef("lobby"); const i = m.npcs.indexOf(n); if (i >= 0) m.npcs.splice(i, 1); } catch { /* ignore */ } }, 2500);
  });
}

function returnKit() {
  panel("Tasha", "Returning your temporary kit", spr("tasha"));
  pAdd(`<p>“Cutover's done. Company card, loaner cart, and that temporary admin account. What are we doing with the admin rights?”</p>`);
  mustGetRight([
    ["Request removal of the temporary admin rights today and confirm they're gone.", 2, "“Removed and confirmed. Access that outlives its reason is just attack surface.”"],
    ["Keep them, just in case something comes up.", 0, "“'Just in case' is how an intern ends up with domain admin for three years.”"],
    ["Hand the account to Kai so he can help next time.", 0, "“Shared admin accounts have no accountability. Never.”"]
  ], () => {
    hearLingo("jit");
    pBtn("\u{1F4B3} Hand it all back", () => {
      SET("kitReturned"); addNote("return", "\u{1F4B3}", "Returned the company card, loaner cart, and had temporary admin rights removed.");
      closePanel(); SF().updateProgressUI();
    });
  });
}

function workPc() {
  const day = curDay();
  if (day === 1 && HF("cabApproved") && !HF("noticeSent")) { noticeComposer(); return; }
  if (day === 3) {
    if (!HF("bannerDown")) {
      panel("Intranet", "Your work PC", "\u{1F4BB}");
      pAdd(`<div class="notice-card">⚠️ <b>MAINTENANCE IN PROGRESS</b> · Laptop refresh, Accounting &amp; Reception</div><p>The change is done. Leaving a stale banner up trains people to ignore banners.</p>`);
      pBtn("\u{1F5D1}️ Take the banner down", () => { SET("bannerDown"); addNote("signs", "\u{1F5A5}️", "Took down the intranet maintenance banner."); closePanel(); });
      pBtn("Leave it for now", closePanel, "act ghost");
      return;
    }
    if (!HF("kbDone")) { kbArticle(); return; }
    if (!HF("pirSent")) { pirEmail(); return; }
    if (!HF("chenEmail")) { chenEmail(); return; }
  }
  panel("Your work PC", "IT room", "\u{1F4BB}");
  pAdd(`<p>Inbox zero. For about four minutes.</p>`);
  pBtn("Close", closePanel, "act ghost");
}

function kbArticle() {
  panel("\u{1F4DA} KB article", "KB-0142 · New laptop: common issues", "\u{1F4DA}");
  pAdd(`<p style="margin:0 0 6px;">Write the fix for each issue so the next tech doesn't start from zero.</p>`);
  const rows = [
    { q: "Printer missing on the new laptop", opts: [["Add the queue from the company print server; test page", 2], ["Download the driver from a search result", 0], ["Print from a coworker's PC", 1]] },
    { q: "Teams can't find the camera", opts: [["Windows Privacy & security → Camera access on, then pick the camera in Teams", 2], ["Reimage the laptop", 0], ["Join meetings from your phone", 1]] },
    { q: "BitLocker recovery screen after docking", opts: [["Verify the user, get the escrowed key for that device ID, then log the trigger", 2], ["Disable BitLocker", 0], ["Reimage and hope", 1]] }
  ];
  const pick = {};
  rows.forEach((r, i) => {
    const box = pAdd(`<div class="scenario-section-label">${esc(r.q)}</div>`, "cab-field");
    const col = document.createElement("div"); col.className = "btn-column";
    shuffleArr(r.opts).forEach((o) => {
      const b = document.createElement("button"); b.className = "dx-btn opt"; b.textContent = o[0];
      b.addEventListener("click", () => { pick[i] = o; col.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); });
      col.appendChild(b);
    });
    box.appendChild(col);
  });
  const fb = pAdd("");
  let tries = 0;
  pBtn("\u{1F4DA} Publish", () => {
    if (rows.some((_, i) => !pick[i])) { fb.innerHTML = `<div class="banner fact">Fill in every fix.</div>`; return; }
    tries++;
    const bad = rows.filter((_, i) => pick[i][1] !== 2);
    rows.forEach((_, i) => recordAnswer(pick[i][1], tries === 1));
    if (bad.length) { fb.innerHTML = `<div class="banner no">Tasha reviews it: “Fix these before it goes live: ${bad.map((r) => esc(r.q)).join("; ")}.”</div>`; blip(false); return; }
    if (tries === 1) award("kb");
    hearLingo("kb");
    SET("kbDone"); addNote("kb", "\u{1F4DA}", "Published KB-0142: new-laptop common issues and fixes.");
    pClear(); pAdd(`<div class="banner ok">Published. Three future tickets just got five minutes shorter.</div>`); pBtn("Done", closePanel);
  });
}

function pirEmail() {
  panel("\u{1F4E8} Post-implementation review", "To: Director Chen, Harold, Tasha", "\u{1F4E8}");
  pAdd(`<p style="margin:0 0 6px;">What went well, what didn't, what we'll do next time. Blameless and factual. Tick what belongs.</p>`);
  const d = DD();
  const items = shuffleArr([
    { t: "Went well: backups verified with a test restore before the change", real: true },
    { t: "Went well: old laptops kept as the backout plan; one rollback worked as designed", real: true },
    { t: "Didn't go well: the new image was missing the Accounting print queue and camera access", real: true },
    { t: "Didn't go well: the waiting area had no status updates for users", real: true },
    { t: "Action: fix the image before the next department's rollout", real: true },
    { t: "Kai was slow and it's his fault", real: false },
    { t: "Engineering messed up, as usual", real: false },
    { t: "Honestly it was fine, nothing to report", real: false }
  ]);
  tickComposer(items, "\u{1F4E8} Send the PIR", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Harold: “That's a real PIR. Facts, no blame, and actions.”</div>`); addRep(2); }
    else pAdd(`<div class="banner ${extra.length ? "no" : "fact"}">Harold: ${missed.length ? `“You left out: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“And PIRs are blameless. <b>${extra.map((x) => esc(x.t)).join("; ")}</b> doesn't belong.”` : ""}</div>`);
    if (extra.length) addRep(-1);
    hearLingo("pir"); hearLingo("rca"); hearLingo("mttr");
    SET("pirSent"); addNote("pir", "\u{1F4E8}", "Sent the post-implementation review.");
    chatPost("Director Chen", "PIR received. Check your email, " + (SF().playerName || "new hire") + ".");
    pBtn("Done", closePanel);
  });
}

function chenEmail() {
  const d = DD();
  panel("\u{1F4E7} Inbox", "Thursday · 5:12 PM", spr("chen"));
  const st = docStats();
  pAdd(email("<b>Director Chen</b> · IT Director", me() + " · cc the whole department", "Cutover Week: thank you",
    `<p>Team, the Accounting and Reception refresh is closed. Twelve laptops, one rollback that worked exactly as planned, and zero surprises on the bridge.</p>
     <p>${me()}, three days in and you've already closed ${st.total} pieces of work${st.total ? `, ${st.documented} with proper notes` : ""}. Tasha says you listen, and Gloria says you're honest. Those are the two things I can't teach.</p>
     <p class="em-sec">NEXT UP</p><p>Security has asked for Help Desk on <b>Floor 7</b> next month. They're calling it <b>SOC Week</b>: detect, contain, recover. Start reading.</p>
     <p>Happy hour's at <b>The Stack</b>, 6 PM, next door. First round is on the department.</p><p>— Chen</p>`));
  pBtn("\u{1F37B} Head to The Stack", () => {
    SET("chenEmail"); SET("partyOpen"); SF().addFind("nextGig"); SF().setFlag("f7Unlocked");
    closePanel(); ping("\u{1F37B}", "Happy hour", "The Stack, street level. Everyone's there.");
  });
}

function partyChat(n) {
  panel(n.name, n.role + " · The Stack", n.sprite);
  pAdd(`<p>“${esc(n.chat[0])}”</p>`);
  pBtn("\u{1F942} Cheers", closePanel);
}

function partyFinale() {
  panel("Nico", "Bartender · The Stack", spr("nico"));
  pAdd(`<p>“You're the new one! Tasha's been bragging. What'll it be?”</p>
    <p>Across the bar Tasha raises a glass: “To Cutover Week! And to the new kid, who wrote better notes than I do!” Gloria: “That's true, actually.”</p>`);
  pBtn("\u{1F942} Raise a glass", () => {
    SET("partyDone"); addNote("party", "\u{1F37B}", "Team happy hour at The Stack.");
    closePanel();
    setTimeout(() => rollCredits(), 400);
  });
}

// ============================= evening + nights =============================
function homeLaptop() {
  const day = curDay();
  if (day === 1 && !HF("d1Email")) { welcomeEmail(); return; }
  if (day <= 2 && dayTasksDone(day)) {
    if (!HF("eod_" + day)) { openEodCompose(); return; }
    if (!HF("alarm_" + day)) { openMarchingOrders(); return; }
    panel("Your laptop", "Home", "\u{1F4BB}"); pAdd(`<p>Alarm's set. Bed's in the bedroom.</p>`); pBtn("Close", closePanel, "act ghost"); return;
  }
  panel("Your laptop", "Home", "\u{1F4BB}");
  const left = tasksFor(day).filter((t) => !t.done());
  if (day <= 2) pAdd(`<p>You open a draft of your end-of-day email, then close it. You've still got <b>${left.length}</b> task${left.length === 1 ? "" : "s"} today:</p><ul>${left.map((t) => `<li>${esc(t.label)}</li>`).join("")}</ul>`);
  else pAdd(`<p>Nothing new. Your phone buzzes with the team chat.</p>`);
  pBtn("Close", closePanel, "act ghost");
}

function openEodCompose() {
  const day = curDay(), nm = me();
  const real = notesFor(day).filter((n) => !["coffee", "receipt"].includes(n.cat));
  const items = shuffleArr(real.map((n) => ({ t: n.icon + " " + n.text, real: true }))
    .concat(shuffleArr(DISTRACT).slice(0, 3).map((t) => ({ t, real: false }))));
  const jobs = tasksFor(day).map((t) => t.label);
  const st = docStats(day);
  panel("✉️ End-of-day email", "To Tasha · cc Benny", "✉️");
  pAdd(email(`<b>${nm}</b> · Tier 1`, "Tasha (Help Desk Lead) · cc Benny", `Shift handoff: ${esc(dayName(day))}`,
    `<p>Hi Tasha, here's today's handoff.</p><p class="em-sec">DONE TODAY</p><ul>${jobs.map((j) => `<li>${esc(j)}</li>`).join("")}</ul>
     <p class="em-sec">QUEUE</p><p>${st.total} closed today · ${st.documented} with work notes.</p>
     <p class="em-sec">DETAILS FROM THE DAY</p><p class="set-hint">Tick every detail that belongs in a shift handoff, and nothing that doesn't.</p>`));
  if (!items.some((x) => x.real)) pAdd(`<p class="set-hint">(Quiet day. Send it anyway; Tasha wants to hear it was quiet.)</p>`);
  tickComposer(items, `\u{1F4E8} Send to Tasha, from ${nm}`, (missed, extra) => {
    pClear(); SET("eod_" + day);
    let reply;
    if (!missed.length && !extra.length) { reply = "Perfect handoff. Every ticket, every walk-up, every weird thing. If you're out sick tomorrow, anyone could pick this up. Thank you!"; addRep(2); award("paper"); }
    else {
      reply = (missed.length ? `You left out: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>. If it isn't in the handoff, the next shift walks into it blind. ` : "") +
        (extra.length ? `And I don't need to know about ${extra.map((x) => esc(x.t.replace(/^\S+\s/, ""))).join(" or ")}. Keep it to the work. ` : "") + "Otherwise, good day.";
      if (missed.length) addRep(-1);
    }
    pAdd(`<div class="banner ok">\u{1F4E8} <b>Sent.</b> A reply lands two minutes later…</div>`);
    pAdd(email("<b>Tasha</b>", nm, "RE: Shift handoff", `<p>${reply}</p><p>— T</p>`));
    pBtn("\u{1F4EC} Check your inbox", () => { closePanel(); openMarchingOrders(); });
  });
}

function dayStats(day) {
  const d = DD();
  const tickets = Object.entries(d.solvedOn || {}).filter(([, v]) => v === day).length;
  const st = docStats(day);
  const walk = notesFor(day).filter((n) => n.cat === "walkup").length;
  const pages = notesFor(day).filter((n) => n.cat === "page").length;
  return { tickets, docs: st, walk, pages, rep: d.repDay[day] || 0, spent: spentOn(day), buys: d.purchases.filter((p) => p.d === day).length,
    logged: d.known.filter((k) => k.d === day).length };
}

function openMarchingOrders() {
  const day = curDay(), next = day + 1, st = dayStats(day), nm = me();
  DD().days[day] = st; ddSave();
  panel("\u{1F4E7} Marching Orders", "Inbox · 9:41 PM", spr("tasha"));
  const start = next === 2 ? "<b>7:30 AM, Floor 3.</b> Stand-up at 7:45. The window opens when Harold says so." : "<b>8:00 AM, Floor 3.</b> Hypercare: we clean up, sign off, and close it out.";
  pAdd(email("<b>Tasha</b> · Help Desk Lead", nm + " · cc Benny", `Marching orders: ${esc(dayName(next))}`,
    `<p>Hi ${nm}, good work today. Here's how ${esc(dayName(day).split(" · ")[0])} shook out, and tomorrow's plan.</p>
     <p class="em-sec">TODAY · BY THE NUMBERS</p><ul>
     <li>✅ <b>Tasks:</b> all ${tasksFor(day).length} done.</li>
     <li>\u{1F39F}️ <b>Tickets closed:</b> ${st.tickets}. \u{1F64B} <b>Walk-ups heard:</b> ${st.walk}. \u{1F4DF} <b>Pages:</b> ${st.pages}.</li>
     <li>\u{1F4DD} <b>Documented:</b> ${st.docs.documented} of ${st.docs.total} closed items have work notes.${st.docs.undocumented ? ` <b>${st.docs.undocumented} don't.</b> Gloria reads everything on Thursday.` : " Every one. Gloria will be thrilled."}</li>
     ${day === 2 ? `<li>\u{1F4CB} <b>Known issues logged:</b> ${st.logged}. We route them tomorrow.</li>` : ""}
     <li>⭐ <b>Reputation today:</b> ${st.rep >= 0 ? "+" : ""}${st.rep} (now ${DD().rep}).</li>
     <li>\u{1F4B3} <b>Spending:</b> $${st.spent} on ${st.buys} purchase${st.buys === 1 ? "" : "s"}. Keep the receipts together.</li></ul>
     <p class="em-sec">TOMORROW · ${esc(DAY_SHORT[next].toUpperCase())}</p><p>${start}</p><ol>${tasksFor(next).map((t) => `<li>${esc(t.label)}</li>`).join("")}</ol>
     <p>${next === 2 ? "Eat something. Charge your phone. It's going to be loud." : "Last push. Bring your receipt envelope."}</p><p>— Tasha</p>`));
  pBtn("⏰ Set alarm for 6:30 AM", () => {
    SET("alarm_" + day); closePanel();
    ping("⏰", "Alarm set: 6:30 AM", "Go get some sleep. The bed's in the bedroom.");
    CORE.sfx && CORE.sfx("alarmset");
  });
}

function bed() {
  const day = curDay();
  if (day <= 2 && HF("alarm_" + day)) { goToSleep(); return; }
  panel("Your bed", "Bedroom", "\u{1F6CF}️");
  if (day > 2) pAdd(`<p>Not tonight. There's a happy hour.</p>`);
  else if (!dayTasksDone(day)) pAdd(`<p>Tempting. But you've still got work today. NEXT UP knows what.</p>`);
  else if (!HF("eod_" + day)) pAdd(`<p>Send your end-of-day email first (your laptop).</p>`);
  else pAdd(`<p>Read Tasha's Marching Orders and set your alarm first (your laptop).</p>`);
  pBtn("Close", closePanel, "act ghost");
}

function goToSleep() {
  const S = SF(); if (S.overlay) return;
  const sl = document.getElementById("sleep"); const t = document.getElementById("sleep-t");
  S.overlay = true;
  if (sl) { t.textContent = "GOOD NIGHT"; sl.hidden = false; requestAnimationFrame(() => sl.classList.add("vis")); }
  CORE.sfx && CORE.sfx("night");
  setTimeout(() => { if (t) t.textContent = dayName(curDay() + 1).toUpperCase(); if (sl) sl.classList.add("ring"); CORE.sfx && CORE.sfx("alarm"); }, 2000);
  setTimeout(() => {
    advanceDay();
    if (sl) sl.classList.remove("vis");
    setTimeout(() => { if (sl) { sl.hidden = true; sl.classList.remove("ring"); } S.overlay = false; openMorning(); }, 700);
  }, 3600);
}

export function advanceDay() {
  const S = SF(), d = DD();
  visClearAll();
  clockReset();
  d.officeT = 0; d.pendingGo = null; d.carry = d.carry || [];
  S.setDay(S.day + 1);
  S.goToFloor("home", "start");
  ddSave(); S.updateProgressUI();
}

export function openMorning() {
  const day = curDay();
  const flavor = {
    1: "Your first day. The alarm goes off, you're already awake. Coffee, badge, subway. <b>It's onboarding day.</b>",
    2: "6:30 AM. Somewhere in Midtown, twelve laptops are waiting in boxes. Harold is already on the bridge. <b>It's go-live.</b>",
    3: "Last alarm of Cutover Week. The change is in; today you prove it stuck and give back everything you borrowed. <b>It's hypercare.</b>"
  }[day] || "";
  panel(`⏰ 6:30 AM · ${dayName(day)}`, "Cutover Week", SF().playerSprite);
  pAdd(`<p>${flavor}</p>`);
  pAdd(`<div class="banner kit"><b>Today's list</b><br>${tasksFor(day).map((t, i) => `${i + 1}. ${esc(t.label)}`).join("<br>")}</div>`);
  pAdd(`<p class="set-hint">The NEXT UP card (top-left) walks you through it. ${day === 1 ? "Your laptop's in the living room." : "The subway's on the corner."}</p>`);
  const b = pBtn("☀️ Let's go", closePanel);
  setTimeout(() => { try { b.focus(); } catch { /* ignore */ } }, 30);
}

function commute(to) {
  const S = SF(); if (S.overlay) return;
  const c = document.getElementById("commute"); const t = document.getElementById("commute-t");
  S.overlay = true;
  if (c) { t.textContent = to === "home" ? "\u{1F687} N/W to Astoria · 36 Av" : "\u{1F687} N/W to Midtown · 49 St"; c.hidden = false; requestAnimationFrame(() => c.classList.add("vis")); }
  CORE.sfx && CORE.sfx("train");
  setTimeout(() => {
    S.goToFloor(to, "subway");
    if (c) c.classList.remove("vis");
    setTimeout(() => { if (c) c.hidden = true; S.overlay = false; }, 400);
  }, 1500);
}

// Reload safety: respawn anything the flows own.
export function restoreFlows() {
  const d = DD(), day = curDay();
  if (day === 3 && d.caged && d.caged.length >= 8 && !HF("certDestruction")) spawnRecycler();
  if (day === 3 && HF("signoffsDone")) ensureDay3Known();
  CORE.S.phoneExtras = phoneExtras;
}
