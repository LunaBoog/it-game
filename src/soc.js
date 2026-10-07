// v3 Week 3 · SOC WEEK. You're a Security Analyst on Omar's team (Floor 7).
// Day 7 you learn the floor; Day 8 a real incident lands (the MFA push you
// heard about on Day 7 turns out to be the way in); Day 9 you clean up,
// prove it, and run the lessons-learned review.
//
//   Day 7 · SOC Onboarding             (8 tasks)
//   Day 8 · Incident Day               (5 tasks; the last one is Omar's clock)
//   Day 9 · Recover & Lessons Learned  (10 tasks; ends at The Stack, then credits)
//
// Every top-level name here is unique across the bundle (standalone.html).

import { CORE, DD, ddSave, curDay, esc, shuffleArr, addNote, addRep, bump, recordAnswer } from "./core.js";
import { panel, pAdd, pBtn, pClear, closePanel } from "./ui.js";
import { award, ping, blip, hearLingo, chatPost } from "./comms.js";
import { openAudit } from "./ledger.js";
import { mustGetRight, tickComposer, email, partyFinale, knownBoard } from "./flows.js";
import { openTraining, slideChip } from "./training.js";

const S3 = () => CORE.S;
const SF3 = (f) => CORE.S.hasFlag(f);
const SSET3 = (f) => CORE.S.setFlag(f);
const sspr = (id) => CORE.S.npcSprite(id);
const sme = () => esc(CORE.S.playerName || "you");
function R3(map, id, text, sub) { return { map, id, text, sub }; }

export const W3_TASKS = {
  7: [
    { id: "w3_mail", label: "Read Omar's welcome email (your laptop)", done: () => SF3("wkMail_7"),
      route: () => R3("home", "laptop", "Read Omar's welcome email", "Your laptop, living room") },
    { id: "w3_badge", label: "Get Floor 7 SOC access on your badge (Lou)", done: () => SF3("badge3"),
      route: () => R3("lobby", "lou", "SOC badge access with Lou", "Security desk, lobby") },
    { id: "w3_kit", label: "Get your SOC kit from Omar (incl. a FIDO2 key)", done: () => SF3("kit3"),
      route: () => R3("floor7", "omar", "Get your SOC kit from Omar", "Analyst pit, Floor 7") },
    { id: "w3_train", label: "SOC orientation in the IR war room + the quiz", done: () => SF3("trained_3"),
      route: () => R3("floor7", "ir-screen", "SOC orientation (IR war room)", "Omar's slides, then a quiz") },
    { id: "w3_triage", label: "Triage three alerts on the SIEM", done: () => SF3("triage3"),
      route: () => R3("floor7", "soc-siem", "Triage the SIEM alerts", "SOC bullpen") },
    { id: "w3_vuln", label: "Prioritize this week's vulnerability scan", done: () => SF3("vuln3"),
      route: () => R3("floor7", "vuln", "Prioritize the scan results", "Threat intel, Floor 7") },
    { id: "w3_access", label: "Run the quarterly access review", done: () => SF3("access3"),
      route: () => R3("floor7", "socpc", "Run the access review", "Your SOC workstation") },
    { id: "w3_tabletop", label: "Ransomware tabletop exercise in the war room", done: () => SF3("tabletop3"),
      route: () => R3("floor7", "ir-screen", "Run the tabletop exercise", "IR war room") }
  ],
  8: [
    { id: "w3_alert", label: "\u{1F6A8} Triage the HIGH alert on Luis's account", loud: true, done: () => SF3("alert3"),
      route: () => R3("floor7", "soc-siem", "\u{1F6A8} HIGH alert: Luis (payroll)", "SIEM console, SOC bullpen") },
    { id: "w3_scope", label: "Scope it: pull the indicators into the case", done: () => SF3("scope3"),
      route: () => R3("floor7", "socpc", "Scope the incident", "Your SOC workstation") },
    { id: "w3_isolate", label: "Contain Luis's laptop (Floor 3, Accounting)", done: () => SF3("isolate3"),
      route: () => R3("floor3", "tag-a4", "Contain Luis's payroll laptop", "Accounting, Floor 3") },
    { id: "w3_bridge", label: "Join Omar's incident bridge", done: () => SF3("bridge3"),
      route: () => R3("floor7", "omar", "Join the incident bridge", "Analyst pit, Floor 7") },
    { id: "w3_window", label: "Work the incident until it's contained", done: () => SF3("winClosed_8"),
      route: () => ({ map: "floor7", id: null, text: "Work the incident until it's contained", sub: DD().windowOpen ? "Alerts, hotspots, users, the case log." : "Opens after the bridge" }) }
  ],
  9: [
    { id: "w3_eradicate", label: "Eradicate: remove every foothold", done: () => SF3("eradicate3"),
      route: () => R3("floor7", "socpc", "Eradicate the attacker's footholds", "Your SOC workstation") },
    { id: "w3_restore", label: "Recover: restore the payroll files from a clean backup", done: () => SF3("restore3"),
      route: () => R3("floor3", "backup", "Restore from a clean backup", "Backup console, Floor 3 server closet") },
    { id: "w3_evidence", label: "Seal the evidence: hashes + chain of custody", done: () => SF3("evidence3"),
      route: () => R3("floor7", "ev-locker", "Seal the evidence", "Evidence locker, data center") },
    { id: "w3_known", label: "Route the incident follow-ups", done: () => SF3("known3Done"),
      route: () => R3("floor7", "kiboard-7", "Route the follow-ups", "Case board, Floor 7 lobby") },
    { id: "w3_brief", label: "Brief Director Chen", done: () => SF3("brief3"),
      route: () => R3("floor3", "chen", "Brief Director Chen", "Director's office, Floor 3") },
    { id: "w3_report", label: "Write the incident report", done: () => SF3("report3"),
      route: () => R3("floor7", "socpc", "Write the incident report", "Your SOC workstation") },
    { id: "w3_audit", label: "Case review with Gloria", done: () => SF3("audited3"),
      route: () => R3("floor3", "gloria", "Case review with Gloria", "Manager's office, Floor 3") },
    { id: "w3_lessons", label: "Run the lessons-learned review", done: () => SF3("lessons3"),
      route: () => R3("floor7", "ir-screen", "Run the lessons-learned review", "IR war room") },
    { id: "w3_chen", label: "Read Director Chen's email", done: () => SF3("chen3"),
      route: () => R3("floor7", "socpc", "Read Director Chen's email", "Your SOC workstation") },
    { id: "w3_party", label: "The last happy hour at The Stack", done: () => SF3("partyDone3"),
      route: () => SF3("chen3") ? R3("lobby", "nico", "The last happy hour at The Stack", "Street level, 6 PM") : R3("floor7", "socpc", "Finish the close-out first", "") }
  ]
};

// ---------------------------------------------------------------------------
export function socWelcome() {
  panel("\u{1F4E7} Inbox", "Monday · 6:41 AM", "\u{1F4E7}");
  pAdd(email("<b>Omar Haddad</b> · Incident Response Lead", sme(), "Welcome to the SOC",
    `<p>${sme()}, welcome to Floor 7. You're a <b>Security Analyst</b> now. You've worked the help desk and the network, which means you already know what normal looks like. That's the whole job: noticing what isn't.</p>
     <p class="em-sec">TODAY · SOC ONBOARDING</p><ol>${W3_TASKS[7].slice(1).map((t) => `<li>${esc(t.label)}</li>`).join("")}</ol>
     <p>If anybody tells you about weird sign-in prompts, report it. Every time.</p><p>— Omar</p>`));
  pBtn("\u{1F392} Grab your bag and go", () => {
    SSET3("wkMail_7"); closePanel();
    chatPost("Omar", `SOC, welcome ${CORE.S.playerName || "our new analyst"}. They did help desk AND network. Be impressed.`, false);
    chatPost("Sofia", "Welcome! The coffee up here is worse. The alerts are better.", false);
  });
}

function badge3() {
  panel("Lou", "Building security · lobby", sspr("lou"));
  pAdd(`<p>“Floor 7! The SOC. They make me check their badges twice.” He prints your access. “And this one's a little different: <b>if your badge goes missing, how fast do you tell me?</b>”</p>`);
  mustGetRight([
    ["Immediately, so it's disabled before anyone can use it. Then I get a temporary one.", 2, "“Right answer. On Floor 7 a lost badge is an incident.”"],
    ["At the end of the day, in case it turns up.", 1, "“All day is a long time for a SOC badge to be in someone else's pocket.”"],
    ["Never, I'll borrow a coworker's.", 0, "“Now two people share one identity. No.”"]
  ], () => {
    pBtn("\u{1FAAA} Take the badge", () => { SSET3("badge3"); addNote("kit", "\u{1FAAA}", "Lou added Floor 7 SOC access to my badge."); closePanel(); });
  });
}

function kit3() {
  panel("Omar", "Incident Response Lead · your kit", sspr("omar"));
  if (!SF3("badge3")) { pAdd(`<p>“Badge first. Lou. The SOC door doesn't care how smart you are.”</p>`); pBtn("On it", closePanel, "act ghost"); return; }
  pAdd(`<p>“Welcome. Kit.”</p>
    <div class="banner kit"><b>Your SOC kit</b><br>\u{1F4BB} Hardened analyst laptop<br>\u{1F511} FIDO2 security key (yours, registered today)<br>\u{1F5C4}️ Vault access for privileged credentials (checked out per task, logged)<br>\u{1F4C1} Case-management login · SIEM analyst role</div>
    <p>“Privileged creds live in the vault. <b>When you need the domain admin password for a task, what happens?</b>”</p>`);
  mustGetRight([
    ["I check it out of the vault for that task, it's logged, and it's rotated when I check it back in.", 2, "“Yes. Nobody knows that password for longer than the task.”"],
    ["I write it down somewhere safe so I don't have to check it out again.", 0, "“'Somewhere safe' is how passwords end up in screenshots.”"],
    ["I ask Sofia, she knows it.", 0, "“If Sofia 'knows it', we have a different incident.”"]
  ], () => {
    hearLingo("jit"); hearLingo("numbermatch");
    pBtn("\u{1F392} Take the kit", () => {
      SSET3("kit3"); S3().addFind("fidoKey");
      addNote("kit", "\u{1F392}", "SOC kit from Omar: analyst laptop, FIDO2 key, vault access for privileged creds, case + SIEM logins.");
      closePanel(); S3().updateProgressUI();
      chatPost("Omar", "Orientation's on the war-room screen. Then triage three alerts for Sofia.");
    });
  });
}

function socTrain(p) {
  if (SF3("trained_3")) { tabletopOrScreen(); return; }
  if (!SF3("kit3")) { panel("The war-room screen", "IR war room", "\u{1F4FA}"); pAdd(`<p>A login screen. You'll need your SOC kit from Omar first.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  openTraining(3, () => { chatPost("Sofia", "Training done? Three alerts waiting for you on the SIEM. No pressure. Some pressure."); S3().updateProgressUI(); });
}

function triage3() {
  panel("SIEM console", "SOC bullpen · alert queue", "\u{1F6A6}");
  if (SF3("triage3")) { pAdd(`<p>Queue's clear. Sofia gave you a thumbs-up from across the room.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!SF3("trained_3")) { pAdd(`<p>Sofia: “Watch Omar's orientation first, then come triage.”</p>`); pBtn("Okay", closePanel, "act ghost"); return; }
  const alerts = [
    ["ALERT 1 · Medium", "Impossible travel: Tom (Sales) signed in from New York, then Lisbon 40 minutes later.", "The service desk ticket from last week says Tom is at a conference in Lisbon, connecting through the company VPN, which exits in New York.", [
      ["Expected activity: the VPN exit plus his logged travel explain it. Close as benign with notes linking the travel ticket.", 2, "Closed with a link to the travel ticket. The next analyst who sees it understands in five seconds."],
      ["Lock Tom's account immediately.", 0, "He's mid-conference with a logged trip and a VPN that explains it. Context first."],
      ["Close it without notes, it's probably fine.", 1, "Probably right, but with no notes nobody can tell later WHY it was fine."]]],
    ["ALERT 2 · High", "EDR: 'rundll32' launched by a Word macro on a Marketing laptop, then a connection to an unknown domain.", "Aaliyah opened 'Invoice_Q3.docm' from an external sender ten minutes ago.", [
      ["True positive: isolate the laptop with EDR, block the domain, pull the email from every mailbox, and open an incident.", 2, "Contained before the payload did anything. The email is purged from nine other inboxes."],
      ["Ask Aaliyah if she meant to do it.", 1, "Talking to her helps the timeline, but the machine needs containing NOW."],
      ["False positive: Word does weird stuff.", 0, "Word launching rundll32 and calling out to a new domain is the attack."]]],
    ["ALERT 3 · Low", "Ten failed sign-ins for Ed (Accounting) in two minutes, then a success.", "Same office IP as always, same laptop. Ed's caps-lock light is famous. The success came from his normal device.", [
      ["Likely benign (user error), but confirm with Ed directly and check the success came from his managed device before closing with notes.", 2, "Ed: 'Caps lock. Again.' Device matches. Closed with notes."],
      ["Reset Ed's password and revoke all sessions.", 1, "Safe, but heavy for a known device on a known IP. Verify first."],
      ["Ignore low alerts entirely.", 0, "Low alerts are where patient attackers hide. Triage everything."]]]
  ];
  let k = 0, firstAll = true;
  next();
  function next() {
    if (k >= alerts.length) {
      if (firstAll) award("triage");
      hearLingo("tpfp"); hearLingo("siem");
      pBtn("✅ Queue cleared", () => { SSET3("triage3"); addNote("triage", "\u{1F6A6}", "Triaged 3 SIEM alerts (1 benign w/ context, 1 true positive contained, 1 user error confirmed)."); closePanel(); });
      return;
    }
    const a = alerts[k++];
    pAdd(`<div class="worknote"><div class="wn-h">\u{1F6A6} ${esc(a[0])}</div><div><span>Alert</span>${esc(a[1])}</div><div><span>Context</span>${esc(a[2])}</div></div>`);
    if (k === 1) pAdd(slideChip(3, 1));
    mustGetRight(a[3], (tries) => { if (tries > 1) firstAll = false; next(); });
  }
}

function vuln3() {
  panel("Vulnerability scanner", "This week's results", "\u{1F9EA}");
  if (SF3("vuln3")) { pAdd(`<p>Patch tickets filed in priority order. The KEV one is already fixed and rescanned.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<div class="worknote"><div class="wn-h">\u{1F9EA} Top findings</div>
      <div><span>A</span>CVSS 9.8 · lab server in the red-team lab · no internet exposure · patch exists</div>
      <div><span>B</span>CVSS 7.5 · the VPN gateway (internet-facing) · <b>on CISA's KEV list</b> · patch exists</div>
      <div><span>C</span>CVSS 5.3 · printers · info disclosure · fix in next firmware</div></div>${slideChip(3, 5)}
    <p><b>What gets patched first?</b></p>`);
  mustGetRight([
    ["B first (exploited in the wild AND internet-facing), then A, then C. Rescan after each fix to verify.", 2, "The VPN gateway is patched by lunch and the rescan comes back clean. CVSS is severity; KEV plus exposure is risk."],
    ["A first: highest CVSS score wins.", 0, "A 9.8 on an isolated lab box is less urgent than a 7.5 attackers are using right now on your front door."],
    ["C first, it's the easiest.", 0, "Easy isn't the same as important."]
  ], () => {
    hearLingo("cvss"); hearLingo("kev");
    pBtn("\u{1F4CB} File the patch tickets", () => { SSET3("vuln3"); addNote("vuln", "\u{1F9EA}", "Prioritized the scan: KEV + internet-facing VPN first, then the lab box, then printers."); closePanel(); });
  });
}

function access3() {
  panel("Quarterly access review", "Privileged groups · your SOC workstation", "\u{1F465}");
  pAdd(`<p style="margin:0 0 6px;">Tick every account that should lose its access today. Keep anything the owner's current job actually needs.</p>${slideChip(3, 6)}`);
  tickComposer(shuffleArr([
    { t: "adm-temp-cutover · Domain Admins · last used on Cutover Day 2", real: true },
    { t: "Kai (IT intern) · member of Domain Admins", real: true },
    { t: "jparker · left the company in May · still enabled", real: true },
    { t: "svc-backup-old · no owner listed · last sign-in 2022", real: true },
    { t: "Tasha · Help Desk admins · current Help Desk Lead", real: false },
    { t: "Gloria · ticket QA (read-only) · current role", real: false },
    { t: "Hiro · network change group · current senior engineer", real: false }
  ]), "\u{1F512} Submit the review", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Omar: “Four removals, zero collateral. And yes, that temp cutover account should've died two weeks ago. Good catch.”</div>`); addRep(1); }
    else pAdd(`<div class="banner ${missed.length ? "no" : "fact"}">Omar: ${missed.length ? `“Still standing: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>. Unjustified access is attack surface.” ` : ""}${extra.length ? `“And you just removed access people need for their jobs: <b>${extra.map((x) => esc(x.t)).join("; ")}</b>. Put it back.”` : ""}</div>`);
    hearLingo("leastpriv");
    SSET3("access3"); addNote("access", "\u{1F465}", "Quarterly access review: removed stale/unjustified privileged access (temp cutover admin, intern DA, departed user, orphaned service account).");
    pBtn("Done", closePanel);
  });
}

// Click the steps in order (tabletop).
function socOrder(steps, onDone) {
  const want = steps.slice(); const left = shuffleArr(steps);
  const out = pAdd(`<ol class="order-out"></ol>`); const ol = out.querySelector("ol");
  const col = pAdd("", "btn-column"); const fb = pAdd("");
  let pos = 0, misses = 0;
  left.forEach((s) => {
    const b = document.createElement("button"); b.className = "dx-btn opt"; b.textContent = s;
    b.onclick = () => {
      if (s === want[pos]) {
        pos++; b.disabled = true; b.classList.add("correct");
        ol.insertAdjacentHTML("beforeend", `<li>${esc(s)}</li>`); fb.innerHTML = ""; blip(true);
        if (pos === want.length) { recordAnswer(2, misses === 0); onDone(misses); }
      } else { misses++; blip(false); fb.innerHTML = `<div class="banner no">Not yet. What has to happen before that?</div>`; }
    };
    col.appendChild(b);
  });
}

function tabletopOrScreen() {
  const day = curDay();
  if (day === 7 && SF3("triage3") && SF3("vuln3") && SF3("access3") && !SF3("tabletop3")) { tabletop3(); return; }
  if (day === 9 && !SF3("lessons3")) { lessons3(); return; }
  panel("The war-room screen", "IR war room", "\u{1F4FA}");
  pAdd(`<p>The screen shows the incident timeline template and a sticky note: <i>“Contain first.”</i></p>`);
  pBtn("▶ Rewatch the orientation", () => openTraining(3, null, { rewatch: true }));
  pBtn("Close", closePanel, "act ghost");
}

function tabletop3() {
  panel("Tabletop exercise", "IR war room · scenario: ransomware in Accounting", sspr("omar"));
  pAdd(`<p>Omar: “Tabletop. It's Thursday, 9 AM. Ed's screen says his files are encrypted and there's a ransom note. <b>Put our response in order.</b>”</p>${slideChip(3, 3)}`);
  socOrder([
    "Detect & analyze: confirm it (EDR alert + Ed's report), set severity, open the case",
    "Contain: isolate Ed's PC and any others showing it, disable the accounts involved",
    "Eradicate: remove the malware and its persistence, reset the stolen credentials",
    "Recover: restore from clean, immutable backups and verify before handing back",
    "Lessons learned: a blameless review with actions and owners"
  ], (misses) => {
    hearLingo("contain"); hearLingo("eradicate"); hearLingo("lessons");
    pAdd(`<p>“And one more: <b>who decides whether we tell anyone outside the company?</b>”</p>`);
    mustGetRight([
      ["Legal and Comms, per the incident response plan, using the facts we give them.", 2, "“Right. We bring facts; they own the outside world.”"],
      ["Whoever's on the bridge first.", 0, "“That's how a junior analyst ends up quoted in the news.”"],
      ["Nobody, we keep it quiet.", 0, "“Some incidents come with legal notification duties. That's Legal's call, not ours.”"]
    ], () => {
      hearLingo("irplan");
      pBtn("✅ Tabletop complete", () => { SSET3("tabletop3"); addNote("tabletop", "\u{1F3B2}", `Ran the ransomware tabletop (${misses ? misses + " misstep(s)" : "clean run"}).`); closePanel(); });
    });
  });
}

// ---- Day 8: the incident ---------------------------------------------------------
function alert3() {
  panel("SIEM console", "\u{1F6A8} HIGH · identity · Luis (Accounting · payroll)", "\u{1F6A8}");
  if (SF3("alert3")) { pAdd(`<p>Case INC-2611 is open. Severity: HIGH.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<div class="terminal">06:02  Luis · 5 MFA push requests in 3 min      (denied ×4)\n06:09  Luis · MFA push APPROVED\n06:11  Luis · sign-in · hosting provider, Frankfurt · new device\n06:14  Luis · new inbox rule: 'invoice' → external address\n06:20  Luis · sign-in · laptop LT-ACC-07 (office) · normal</div>
    <p>${DD().done.s7_push ? "Remember Luis's walk-up yesterday? “I approved one to make them stop.”" : "Luis told the help desk yesterday he'd approved a sign-in prompt “just to make them stop.”"}</p>${slideChip(3, 2)}<p><b>What is this?</b></p>`);
  mustGetRight([
    ["A true positive: MFA fatigue led to an account takeover (approved push, sign-in from a hosting provider, a new forwarding rule). Open an incident, severity HIGH, and page Omar.", 2, "Omar is on his feet before you finish typing. 'Good call. Bridge in ten.'"],
    ["A false positive: the 06:20 sign-in is from his normal laptop.", 0, "His normal sign-in doesn't erase the Frankfurt one, or the inbox rule. Both happened."],
    ["Medium: email Luis and ask what happened.", 1, "Talk to him, yes, but an attacker with his mailbox can read that email. This is HIGH."]
  ], () => {
    hearLingo("ioc");
    pBtn("\u{1F4C1} Open the incident", () => {
      SSET3("alert3"); addNote("incident", "\u{1F6A8}", "Opened INC-2611 (HIGH): Luis's account taken over via MFA fatigue; foreign sign-in + external forwarding rule.");
      chatPost("Omar", "INC-2611 is open, HIGH. Scope it, then go contain Luis's laptop on 3. Bridge after.");
      closePanel();
    });
  });
}

function scope3() {
  panel("Case INC-2611", "Scoping: indicators of compromise", "\u{1F50E}");
  pAdd(`<p style="margin:0 0 6px;">Pull everything that belongs in the case as an indicator, and nothing that's just normal life.</p>`);
  tickComposer(shuffleArr([
    { t: "The sign-in IP from the Frankfurt hosting provider", real: true },
    { t: "The new inbox rule forwarding 'invoice' mail to an external address", real: true },
    { t: "The attacker's registered device (a new MFA method added at 06:12)", real: true },
    { t: "Luis's laptop LT-ACC-07 (signed in right after)", real: true },
    { t: "The phishing domain in the email Luis got last week", real: true },
    { t: "Luis's normal Teams sign-in from the office yesterday", real: false },
    { t: "The Accounting printer's IP address", real: false },
    { t: "Luis's lunch order (he told you, at length)", real: false }
  ]), "\u{1F4C1} Add to the case", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Nadia: “Clean IOC list. I'm hunting on all five right now.”</div>`); addRep(1); }
    else pAdd(`<div class="banner ${missed.length ? "no" : "fact"}">Nadia: ${missed.length ? `“Missing: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“And that's just normal activity: <b>${extra.map((x) => esc(x.t)).join("; ")}</b>.”` : ""}</div>`);
    hearLingo("scope"); SSET3("scope3"); addNote("incident", "\u{1F50E}", "Scoped INC-2611: attacker IP, forwarding rule, rogue MFA device, Luis's laptop, phishing domain.");
    pBtn("Done", closePanel);
  });
}

function isolate3() {
  panel("Luis's payroll laptop", "LT-ACC-07 · Accounting", "\u{1F9CA}");
  if (SF3("isolate3")) { pAdd(`<p>EDR: <b>ISOLATED</b>. Powered on, memory captured, talking only to the EDR console.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!SF3("alert3")) { pAdd(`<p>Luis's laptop. Nothing to do here until there's a case.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p>Luis is hovering, pale. “Should I just unplug it?”</p>${slideChip(3, 4)}<p><b>How do you contain it?</b></p>`);
  mustGetRight([
    ["Isolate it through EDR (still powered on, cut off from the network), capture memory, and don't let anyone log off or reboot it. Luis gets a loaner.", 2, "Isolated in seconds, memory captured. Whatever the attacker left in RAM is still there for Nadia."],
    ["Pull the network cable.", 1, "Contained, but clumsy: the SOC loses visibility into the machine. EDR isolation keeps both."],
    ["Pull the power cord.", 0, "Contained, and the memory evidence is gone forever."]
  ], (tries) => {
    if (tries === 1) award("isolate");
    hearLingo("edr"); hearLingo("volatility");
    pBtn("\u{1F9CA} Isolate it", () => { SSET3("isolate3"); addNote("incident", "\u{1F9CA}", "Isolated Luis's laptop through EDR (powered on, memory captured). Loaner issued."); closePanel(); chatPost("Omar", "Laptop contained. Bridge is up when you're ready."); });
  });
}

function bridge3() {
  panel("Omar", "Incident bridge · INC-2611", sspr("omar"));
  if (!SF3("alert3") || !SF3("scope3") || !SF3("isolate3")) { pAdd(`<p>“Open the case, scope it, contain the laptop. Then the bridge.”</p>`); pBtn("On it", closePanel, "act ghost"); return; }
  pAdd(`<p>“I'm incident commander. Before we go live: <b>what's your job on this bridge?</b>”</p>`);
  mustGetRight([
    ["Work my assigned actions, put every finding and timestamp in the case log, and send anything for outside the company to Legal and Comms through you.", 2, "“Exactly. One bridge, one log, one voice outside.”"],
    ["Fix whatever I find, as fast as I can, and tell people later.", 0, "“Freelancing during an incident is how evidence gets destroyed.”"],
    ["Listen quietly and stay out of the way.", 1, "“You're on the team. Take actions. Log them.”"]
  ], () => {
    pBtn("\u{1F4DE} Join the bridge", () => { SSET3("bridge3"); closePanel(); CORE.S.openWindow && CORE.S.openWindow(); });
  });
}

// ---- Day 9: recover + close -----------------------------------------------------
function eradicate3() {
  panel("Eradication plan", "INC-2611 · your SOC workstation", "\u{1F9F9}");
  pAdd(`<p style="margin:0 0 6px;">Tick every action that removes the attacker's foothold. Nothing that destroys evidence or weakens us.</p>`);
  tickComposer(shuffleArr([
    { t: "Remove the external forwarding rule (after it's preserved in the case)", real: true },
    { t: "Revoke all of Luis's sessions and refresh tokens", real: true },
    { t: "Reset his password and remove the attacker's MFA device", real: true },
    { t: "Delete the scheduled task found on Brenda's PC; rescan both hosts", real: true },
    { t: "Block the attacker's IP and phishing domain at the edge", real: true },
    { t: "Delete the SIEM logs from yesterday to free up space", real: false },
    { t: "Turn off MFA for Accounting so they stop getting prompts", real: false },
    { t: "Reimage every PC in the building, just in case", real: false }
  ]), "\u{1F9F9} Execute the plan", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Omar: “Every foothold gone, nothing destroyed. Textbook.”</div>`); addRep(2); }
    else pAdd(`<div class="banner ${extra.length ? "no" : "fact"}">Omar: ${missed.length ? `“Still there: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>. They'll come back through that.” ` : ""}${extra.length ? `“And never: <b>${extra.map((x) => esc(x.t)).join("; ")}</b>.”` : ""}</div>`);
    if (extra.length) addRep(-1);
    hearLingo("eradicate"); SSET3("eradicate3"); addNote("incident", "\u{1F9F9}", "Eradication: forwarding rule removed, sessions revoked, creds reset, rogue MFA removed, persistence deleted, IOCs blocked.");
    pBtn("Done", closePanel);
  });
}

function restore3() {
  panel("Backup console", "Floor 3 server closet · recovery", "\u{1F4BE}");
  if (SF3("restore3")) { pAdd(`<p>Payroll files restored from the clean snapshot and verified. Luis's reimaged laptop is back on his desk.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!SF3("eradicate3")) { pAdd(`<p>Omar's rule: <b>eradicate before you recover</b>. Restore onto a machine the attacker can still reach and you'll be doing this again tomorrow.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p>The attacker had Luis's mailbox and laptop since 06:09 on Day 8. Two payroll spreadsheets were modified at 06:30. You have nightly immutable snapshots. Remember your Day 1 lesson: a backup is a claim until you restore it.</p><p><b>Which restore?</b></p>`);
  mustGetRight([
    ["The last snapshot from BEFORE 06:09 on Day 8, scanned, then verify the files open and their hashes match the pre-incident record before Luis gets them back.", 2, "The pre-compromise snapshot restores clean; the hashes match. Payroll's numbers are the real ones."],
    ["Last night's snapshot, it's the newest.", 0, "Last night's snapshot includes the attacker's 06:30 changes. Newest isn't cleanest."],
    ["Copy the files back off Luis's laptop.", 0, "That laptop is evidence, and it's where the tampered files live."]
  ], () => {
    hearLingo("testrestore");
    pBtn("\u{1F4BE} Restore and verify", () => { SSET3("restore3"); addNote("incident", "\u{1F4BE}", "Recovered payroll files from the pre-compromise immutable snapshot; verified hashes. Luis's laptop reimaged."); closePanel(); });
  }, "restore");
}

function evidence3() {
  panel("Evidence locker", "Data center · INC-2611", "\u{1F9FE}");
  if (SF3("evidence3")) { pAdd(`<p>Sealed. Every hand-off signed and timed. Legal hold applied.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<div class="worknote"><div class="wn-h">\u{1F9FE} Evidence log · INC-2611</div>
      <div><span>Item 1</span>Disk image LT-ACC-07 · SHA-256 4f9a…c21e</div><div><span>Item 2</span>Memory capture LT-ACC-07 · SHA-256 a77d…09b3</div>
      <div><span>Working copy</span>Disk image · SHA-256 4f9a…c21e</div><div><span>Custody</span>Nadia → you → (locker)</div></div>
    <p>The working copy's hash matches the original. <b>What makes this evidence hold up?</b></p>`);
  mustGetRight([
    ["Matching hashes prove the copy is identical; the original stays sealed in the locker; every hand-off is signed with who, when and why; and it's under legal hold.", 2, "Dolores from Legal reads it twice and says 'perfect'. That's a first."],
    ["The hashes match, so we can delete the original to save space.", 0, "The original is the evidence. The copy is for working."],
    ["As long as it's on the shared drive, it's fine.", 1, "Anyone can change a file on a shared drive. Locker, hashes, signatures."]
  ], (tries) => {
    if (tries === 1) award("evidence");
    hearLingo("custody");
    pBtn("✍️ Sign and seal", () => { SSET3("evidence3"); S3().addFind("irCoin"); addNote("evidence", "\u{1F9FE}", "Sealed INC-2611 evidence: hashes verified, custody signed, legal hold applied."); closePanel(); ping("\u{1FA99}", "Keepsake", "Omar hands you an IR challenge coin."); });
  });
}

function brief3(n) {
  panel("Director Chen", "Executive briefing · INC-2611", n.sprite);
  pAdd(`<p>“Two minutes, then I'm in with the board. Tick what goes in the briefing.”</p>${slideChip(3, 7)}`);
  tickComposer(shuffleArr([
    { t: "What happened: one account taken over through MFA fatigue", real: true },
    { t: "Impact: two machines and one mailbox; payroll files restored from a clean backup", real: true },
    { t: "What we did: contained within the hour, eradicated, recovered", real: true },
    { t: "Next: number matching for everyone, egress filtering, targeted training", real: true },
    { t: "Notification: Legal is deciding, with our facts", real: true },
    { t: "It was Luis's fault", real: false },
    { t: "Every log line from the SIEM, for completeness", real: false },
    { t: "A guess at which country the attacker is from", real: false }
  ]), "\u{1F5E3}️ Brief him", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Chen: “Clear, honest, no blame. The board will love it. I love it.”</div>`); addRep(2); }
    else pAdd(`<div class="banner ${extra.length ? "no" : "fact"}">Chen: ${missed.length ? `“I'll get asked about: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“And I can't say: <b>${extra.map((x) => esc(x.t)).join("; ")}</b>.”` : ""}</div>`);
    if (extra.some((x) => /fault|guess/.test(x.t))) addRep(-1);
    SSET3("brief3"); addNote("brief", "\u{1F5E3}️", "Briefed Director Chen on INC-2611 (what, impact, actions, next steps, notification).");
    pBtn("Done", closePanel);
  });
}

function report3() {
  panel("\u{1F4C4} Incident report", "INC-2611 · draft", "\u{1F4C4}");
  pAdd(`<p style="margin:0 0 6px;">Tick what belongs in the incident report.</p>`);
  tickComposer(shuffleArr([
    { t: "Timeline: 06:02 push-bombing → 06:09 approval → 06:11 foreign sign-in → containment", real: true },
    { t: "Indicators: attacker IP, phishing domain, forwarding rule, rogue MFA device", real: true },
    { t: "Root cause: push-approve MFA allowed approvals without number matching", real: true },
    { t: "Actions taken: containment, eradication, recovery (with times and owners)", real: true },
    { t: "Evidence references: item numbers and hashes, custody log", real: true },
    { t: "Opinions about how gullible Accounting is", real: false },
    { t: "The domain admin password used during response", real: false },
    { t: "Speculation about the attacker's motives", real: false }
  ]), "\u{1F4C4} File the report", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Omar: “I'm using this as the template from now on.”</div>`); addRep(2); }
    else pAdd(`<div class="banner ${extra.length ? "no" : "fact"}">Omar: ${missed.length ? `“Missing: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“Out: <b>${extra.map((x) => esc(x.t)).join("; ")}</b>.”` : ""}</div>`);
    if (extra.length) addRep(-1);
    hearLingo("rca"); SSET3("report3"); addNote("report", "\u{1F4C4}", "Filed the INC-2611 incident report (timeline, IOCs, root cause, actions, evidence).");
    pBtn("Done", closePanel);
  });
}

function lessons3() {
  panel("Lessons learned", "IR war room · blameless review", sspr("omar"));
  if (!SF3("report3")) { pAdd(`<p>Omar: “Report first. We review what we wrote down, not what we remember.”</p>`); pBtn("Okay", closePanel, "act ghost"); return; }
  pAdd(`<p>Everyone's in the room, including Luis, who looks like he expects a firing squad. Omar: “Blameless. What do we change, and who owns it?”</p>${slideChip(3, 7)}`);
  tickComposer(shuffleArr([
    { t: "Identity: number matching for all users by Friday (owner: Identity team)", real: true },
    { t: "Email: block external auto-forwarding tenant-wide (owner: M365 team)", real: true },
    { t: "Network: egress filtering on the payroll subnet (owner: Rosa's team)", real: true },
    { t: "People: a 10-minute 'never approve a prompt you didn't start' session (owner: Awareness)", real: true },
    { t: "SOC: alert on 3+ denied pushes followed by an approval (owner: Nadia)", real: true },
    { t: "Luis gets a written warning", real: false },
    { t: "Accounting loses internet access", real: false },
    { t: "We agree to 'be more careful'", real: false }
  ]), "\u{1F54A}️ Close the review", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Luis exhales. Omar: “Five actions, five owners, zero blame. That's how you make the next one smaller.”</div>`); addRep(2); award("blameless"); }
    else pAdd(`<div class="banner ${extra.length ? "no" : "fact"}">Omar: ${missed.length ? `“We need owners for: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“Blameless means no: <b>${extra.map((x) => esc(x.t)).join("; ")}</b>. Vague promises and punishment don't prevent anything.”` : ""}</div>`);
    if (extra.length) addRep(-1);
    hearLingo("lessons"); SSET3("lessons3"); addNote("lessons", "\u{1F54A}️", "Ran the blameless lessons-learned review: 5 actions, each with an owner.");
    chatPost("Director Chen", "Lessons learned received. Check your email.");
    pBtn("Done", closePanel);
  });
}

function chen3() {
  panel("\u{1F4E7} Inbox", "Wednesday · 5:31 PM", sspr("chen"));
  pAdd(email("<b>Director Chen</b> · IT Director", sme() + " · cc the whole department", "Three weeks",
    `<p>Team, INC-2611 is closed: one compromised account, contained inside the hour, nothing lost, and a review that will make the next one smaller.</p>
     <p>${sme()}: three weeks ago you were the new Tier 1 tech who wasn't sure where the elevator was. Since then you've run a laptop cutover, a switch cutover, and now an incident bridge, and Gloria says your notes were perfect on all three.</p>
     <p>Help desk, network, security. That's not a ladder most people climb in three years.</p>
     <p class="em-sec">TONIGHT</p><p>The Stack, 6 PM. Everybody's coming: Tasha's crew, Rosa's crew, Omar's crew. Bring your badge photo. Lou wants to see it.</p><p>— Chen</p>`));
  pBtn("\u{1F37B} Head to The Stack", () => {
    SSET3("chen3"); SSET3("party3"); SSET3("barOpen");
    closePanel(); ping("\u{1F37B}", "The last happy hour", "The Stack, street level. Everyone from all three floors.");
  });
}

function socPc() {
  const d = curDay();
  if (d === 7 && SF3("triage3") && SF3("vuln3") && !SF3("access3")) { access3(); return; }
  if (d === 8 && SF3("alert3") && !SF3("scope3")) { scope3(); return; }
  if (d === 9) {
    if (!SF3("eradicate3")) { eradicate3(); return; }
    if (SF3("brief3") && !SF3("report3")) { report3(); return; }
    if (SF3("lessons3") && SF3("audited3") && !SF3("chen3")) { chen3(); return; }
  }
  panel("Your SOC workstation", "Floor 7", "\u{1F4BB}");
  pAdd(`<p>Case queue, SIEM, EDR console, and a FIDO2 key blinking patiently in the USB port.</p>`);
  pBtn("Close", closePanel, "act ghost");
}

// ---- dispatch ------------------------------------------------------------------
export function socNpc(n) {
  const day = curDay(); if (day < 7 || day > 9) return false;
  const id = n.id;
  if (id === "lou" && day === 7 && !SF3("badge3")) { badge3(); return true; }
  if (id === "omar") {
    if (day === 7 && !SF3("kit3")) { kit3(); return true; }
    if (day === 8 && !SF3("bridge3")) { bridge3(); return true; }
    return false;
  }
  if (id === "chen" && day === 9 && !SF3("brief3")) {
    if (!SF3("restore3")) { panel(n.name, n.role, n.sprite); pAdd(`<p>“Brief me when it's eradicated AND recovered. I want to tell the board it's over, not 'mostly over'.”</p>`); pBtn("Understood", closePanel, "act ghost"); return true; }
    brief3(n); return true;
  }
  if (id === "gloria" && day === 9 && !SF3("audited3")) {
    if (!SF3("report3")) { panel("Gloria", "Service Desk Manager", n.sprite); pAdd(`<p>“Case review? File the incident report first. I read reports, not rumors.”</p>`); pBtn("Fair", closePanel, "act ghost"); return true; }
    openAudit(() => S3().updateProgressUI(), { days: [7, 8, 9], flag: "audited3", label: "SOC Week" }); return true;
  }
  if (id === "nico" && day === 9 && SF3("chen3") && !SF3("partyDone3")) { partyFinale(3); return true; }
  return false;
}
export function socProp(p) {
  const day = curDay();
  if (day < 7) return false;
  switch (p.id) {
    case "ir-screen": socTrain(p); return true;
    case "soc-siem":
      if (day === 7 && !SF3("triage3")) { triage3(); return true; }
      if (day === 8 && !SF3("alert3")) { alert3(); return true; }
      panel("SIEM console", "SOC bullpen", "\u{1F6A6}"); pAdd(`<p>Dashboards, mostly green. Sofia's coffee cup is labeled 'ALERT FATIGUE'.</p>`); pBtn("Close", closePanel, "act ghost"); return true;
    case "vuln": vuln3(); return true;
    case "socpc": socPc(); return true;
    case "ev-locker":
      if (day === 9) { evidence3(); return true; }
      panel("Evidence locker", "Data center", "\u{1F9FE}"); pAdd(`<p>A steel locker with a sign-in sheet. Nothing leaves without a signature.</p>`); pBtn("Close", closePanel, "act ghost"); return true;
    case "tag-a4": if (day === 8) { isolate3(); return true; } return false;
    case "backup": if (day === 9) { restore3(); return true; } return false;
    case "kiboard-7": knownBoard(p); return true;
  }
  return false;
}
