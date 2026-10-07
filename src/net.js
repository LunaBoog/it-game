// v3 Week 2 · NETWORK WEEK. You're promoted to Network Technician on Rosa's
// team (Floor 5). The change: replace Floor 3's end-of-support access switches
// with new PoE+ switches, move the desk phones onto a voice VLAN, and light up
// new Wi-Fi APs.
//
//   Day 4 · Network Onboarding & Prep   (10 tasks: badge, kit, training, trace,
//           IP plan, config backups, CAB, outage notice, staging)
//   Day 5 · Switch Cutover              (5 tasks; the last one is Hiro's clock)
//   Day 6 · Verify & Document           (10 tasks; ends at The Stack)
//
// Every top-level name here is unique across the bundle (standalone.html).

import { CORE, DD, ddSave, curDay, esc, shuffleArr, addNote, addRep, bump, recordAnswer } from "./core.js";
import { mapDef } from "./world.js";
import { panel, pAdd, pBtn, pClear, closePanel } from "./ui.js";
import { award, ping, blip, hearLingo, chatPost } from "./comms.js";
import { openAudit } from "./ledger.js";
import { mustGetRight, tickComposer, email, partyFinale, knownBoard } from "./flows.js";
import { openTraining, slideChip } from "./training.js";

const N_ = () => CORE.S;
const NF = (f) => CORE.S.hasFlag(f);
const NSET = (f) => CORE.S.setFlag(f);
const nspr = (id) => CORE.S.npcSprite(id);
const nme = () => esc(CORE.S.playerName || "you");
function R2(map, id, text, sub) { return { map, id, text, sub }; }

const N_JACKS = ["jack-r", "jack-a1", "jack-a2", "jack-o"];
const N_VFY = ["vfy-phone", "vfy-wired", "vfy-wifi"];
export const N_SIGNOFFS = [["karen", "Karen (phones)"], ["ed", "Ed (wired)"], ["riley", "Riley (Wi-Fi)"]];

function nearestOf(ids, map) {
  const S = N_(); const left = ids.filter((x) => !NF("done_" + x));
  if (!left.length) return null;
  if (S.map !== map) return left[0];
  const m = mapDef(map).props;
  const pos = (id) => m.find((p) => p.id === id) || { x: 0, y: 0 };
  return left.slice().sort((a, b) => { const A = pos(a), B = pos(b); return (Math.abs(A.x - S.px) + Math.abs(A.y - S.py)) - (Math.abs(B.x - S.px) + Math.abs(B.y - S.py)); })[0];
}

export const W2_TASKS = {
  4: [
    { id: "w2_mail", label: "Read Rosa's welcome email (your laptop)", done: () => NF("wkMail_4"),
      route: () => R2("home", "laptop", "Read Rosa's welcome email", "Your laptop, living room") },
    { id: "w2_badge", label: "Get Floor 5 + the network closets added to your badge (Lou)", done: () => NF("badge2"),
      route: () => R2("lobby", "lou", "Badge access for Floor 5 with Lou", "Security desk, lobby") },
    { id: "w2_kit", label: "Get your network kit from Rosa", done: () => NF("kit2"),
      route: () => R2("floor5", "rosa", "Get your network kit from Rosa", "Network Lead's office, Floor 5") },
    { id: "w2_train", label: "Network orientation in the Training room + the quiz", done: () => NF("trained_2"),
      route: () => R2("floor5", "projector", "Network orientation (Training room)", "Rosa's slides, then a quiz") },
    { id: "w2_trace", label: "Tone out 4 Floor 3 wall jacks to their switch ports", done: () => N_JACKS.every((j) => NF("done_" + j)),
      route: () => { const j = nearestOf(N_JACKS, "floor3"); return R2("floor3", j, `Trace the wall jacks (${N_JACKS.filter((x) => NF("done_" + x)).length}/4)`, "Toner on the jack, probe at the panel"); } },
    { id: "w2_ipplan", label: "Plan the new voice VLAN subnet in IPAM", done: () => NF("ipPlan"),
      route: () => R2("floor5", "ipam", "Plan the voice subnet in IPAM", "IPAM & planning, Floor 5") },
    { id: "w2_backup", label: "Back up the old Floor 3 switch configs", done: () => NF("cfgBackup"),
      route: () => R2("floor3", "idf-3", "Back up the old switch configs", "Floor 3 network closet (server closet)") },
    { id: "w2_cab", label: "Get the switch cutover approved at CAB (Harold)", done: () => NF("cab2"),
      route: () => R2("floor3", "harold", "Pitch the switch cutover to CAB", "Harold, conference room, Floor 3") },
    { id: "w2_notice", label: "\u{1F6A8} Send the network outage notice NOW", loud: true, done: () => NF("notice2"),
      route: () => R2("floor5", "netpc", "\u{1F6A8} Send the outage notice NOW", "Your desk, Network team, Floor 5") },
    { id: "w2_stage", label: "Stage the new switches: firmware + PoE budget (Staging lab)", done: () => NF("staged2"),
      route: () => R2("floor5", "stage-bench", "Stage the new switches", "Staging lab, Floor 5") }
  ],
  5: [
    { id: "w2_huddle", label: "Pre-change huddle with Rosa", done: () => NF("huddle2"),
      route: () => R2("floor5", "rosa", "Pre-change huddle with Rosa", "Network Lead's office") },
    { id: "w2_cables", label: "Pick up the labeled patch cables from Sam", done: () => NF("cables2"),
      route: () => R2("floor5", "sam", "Get the labeled patch cables from Sam", "Telecom room, Floor 5") },
    { id: "w2_trunk", label: "Console into the core: check the uplink to Floor 3", done: () => NF("trunk2"),
      route: () => R2("floor5", "core-console", "Check the Floor 3 uplink on the core", "MDF, Floor 5") },
    { id: "w2_bridge", label: "Join Hiro's change bridge in the NOC", done: () => NF("bridge2"),
      route: () => R2("floor5", "hiro", "Join Hiro's bridge", "NOC, Floor 5") },
    { id: "w2_window", label: "Work the cutover until the window closes", done: () => NF("winClosed_5"),
      route: () => ({ map: "floor3", id: null, text: "Work the cutover until the window closes", sub: DD().windowOpen ? "Floor 3 is where the users are. Hotspots, walk-ups, pages." : "Opens after your bridge check-in" }) }
  ],
  6: [
    { id: "w2_verify", label: "Verify Floor 3 after the change: phone, wired desk, Wi-Fi", done: () => N_VFY.every((v) => NF("done_" + v)),
      route: () => { const v = nearestOf(N_VFY, "floor3"); return R2("floor3", v, `Post-change checks (${N_VFY.filter((x) => NF("done_" + x)).length}/3)`, "Reception phone · Accounting desk · conf-room Wi-Fi"); } },
    { id: "w2_known", label: "Route the network known issues", done: () => NF("known2Done"),
      route: () => R2("floor5", "kiboard-5", "Route the known issues", "Known-issues board, Floor 5 lobby") },
    { id: "w2_signoffs", label: "Business sign-off: Karen (phones), Ed (wired), Riley (Wi-Fi)", done: () => N_SIGNOFFS.every(([id]) => NF("so2_" + id)),
      route: () => {
        if (!NF("known2Done")) return R2("floor5", "kiboard-5", "Route the known issues first", "Owners won't sign with open issues");
        const s = N_SIGNOFFS.find(([id]) => !NF("so2_" + id));
        return R2("floor3", s[0], `Get sign-off from ${s[1]}`, `${N_SIGNOFFS.filter(([id]) => NF("so2_" + id)).length}/3 signed`);
      } },
    { id: "w2_decom", label: "Decommission the old switches: wipe them, then custody to Mo", done: () => NF("decom2"),
      route: () => {
        if (!N_SIGNOFFS.every(([id]) => NF("so2_" + id))) return R2("floor3", "ed", "The old switches wait for sign-off", "They're the backout until then");
        return NF("wiped2") ? R2("lobby", "cage", "Log the old switches into Mo's cage", "IT storeroom, lobby") : R2("floor3", "idf-3", "Wipe the old switches", "Floor 3 network closet");
      } },
    { id: "w2_diagram", label: "Update the network diagram + IPAM", done: () => NF("diagram2"),
      route: () => R2("floor5", "ipam", "Update the diagram + IPAM", "IPAM & planning") },
    { id: "w2_audit", label: "Change review with Gloria", done: () => NF("audited2"),
      route: () => R2("floor3", "gloria", "Change review with Gloria", "Manager's office, Floor 3") },
    { id: "w2_return", label: "Return your change account to Rosa", done: () => NF("return2"),
      route: () => R2("floor5", "rosa", "Return the change account", "Network Lead's office") },
    { id: "w2_pir", label: "Send the post-implementation review (PIR)", done: () => NF("pir2"),
      route: () => R2("floor5", "netpc", "Send the PIR", "Your desk, Floor 5") },
    { id: "w2_chen", label: "Read Director Chen's email", done: () => NF("chen2"),
      route: () => NF("pir2") ? R2("floor5", "netpc", "Read Director Chen's email", "Your desk") : R2("floor5", "netpc", "Send the PIR first", "Your desk") },
    { id: "w2_party", label: "Team happy hour at The Stack", done: () => NF("partyDone2"),
      route: () => NF("chen2") ? R2("lobby", "nico", "Team happy hour at The Stack", "Street level, 6 PM") : R2("floor5", "netpc", "Finish the close-out first", "") }
  ]
};

// ---------------------------------------------------------------------------
export function netWelcome() {
  panel("\u{1F4E7} Inbox", "Monday · 6:48 AM", "\u{1F4E7}");
  pAdd(email("<b>Rosa Delgado</b> · Network Lead", nme(), "Welcome to the network team + Network Week",
    `<p>Hi ${nme()}! Chen says you're the one who wrote better notes than Tasha. You're on my team now: <b>Network Technician</b>, Floor 5.</p>
     <p>This week we replace Floor 3's access switches (end of support), move every desk phone onto a <b>voice VLAN</b>, and light up new Wi-Fi APs. Wednesday morning is the cutover, on Hiro's bridge.</p>
     <p class="em-sec">TODAY · NETWORK ONBOARDING &amp; PREP</p><ol>${W2_TASKS[4].slice(1).map((t) => `<li>${esc(t.label)}</li>`).join("")}</ol>
     <p>Lou needs to add Floor 5 and the closets to your badge first. See you upstairs.</p><p>— Rosa</p>`));
  pBtn("\u{1F392} Grab your bag and go", () => {
    NSET("wkMail_4"); closePanel();
    chatPost("Rosa", `Everyone, ${CORE.S.playerName || "our new tech"} joins the network team today. Hiro, be nice.`, false);
    chatPost("Hiro", "I'm always nice. I'm also always running 'show run'.", false);
  });
}

function badge2() {
  panel("Lou", "Building security · lobby", nspr("lou"));
  pAdd(`<p>“Moving up in the world! Floor 5, and Rosa says the network closets too. Hand me your badge.”</p>
    <p>“Quick one. Every door this badge opens gets logged and reviewed every quarter. <b>Which doors should it open?</b>”</p>`);
  mustGetRight([
    ["Floor 5 and the network closets I actually work in. Nothing extra, and it gets reviewed.", 2, "“Exactly. Least privilege, but for doors.”"],
    ["Everything. Network people go everywhere.", 0, "“Then a lost badge opens everything. No.”"],
    ["Whatever Rosa's badge opens.", 1, "“Rosa's the lead. You get what YOUR job needs.”"]
  ], () => {
    hearLingo("mdfidf");
    pBtn("\u{1FAAA} Take the badge", () => { NSET("badge2"); addNote("kit", "\u{1FAAA}", "Lou added Floor 5 + the network closets to my badge (logged, reviewed quarterly)."); closePanel(); });
  });
}

function kit2() {
  panel("Rosa", "Network Lead · your kit", nspr("rosa"));
  if (!NF("badge2")) { pAdd(`<p>“Badge first: Lou, lobby. You'll need the closets.”</p>`); pBtn("On it", closePanel, "act ghost"); return; }
  pAdd(`<p>“Welcome to the team! Kit.” She slides a pouch across the desk.</p>
    <div class="banner kit"><b>Your network kit</b><br>\u{1F535} A blue console cable (it was hers)<br>\u{1F50A} Toner &amp; probe · \u{1F9EA} cable tester<br>\u{1F464} Read-only monitoring login<br>\u{1F511} Change account <b>chg-${nme()}</b> (expires Friday)<br>\u{1F4D2} The Floor 3 port map, half-finished</div>
    <p>“Same rule as Tasha's. <b>Which login do you use to look around the switches?</b>”</p>`);
  mustGetRight([
    ["The read-only login. The change account is only for approved changes, inside the window.", 2, "“Yes. Most outages start with someone 'just looking' with write access.”"],
    ["The change account, it can see more.", 0, "“And it can break more. Read-only to look.”"],
    ["Whichever's saved in my SSH client.", 1, "“Pick on purpose. Read-only.”"]
  ], () => {
    hearLingo("jit");
    pBtn("\u{1F392} Take the kit", () => {
      NSET("kit2"); N_().addFind("consoleCable");
      addNote("kit", "\u{1F392}", "Network kit from Rosa: console cable, toner/probe, cable tester, read-only login, change account (expires Friday).");
      closePanel(); N_().updateProgressUI();
      chatPost("Rosa", "Orientation's on the projector in the Training room. Twenty minutes, then a quiz. Then go trace some jacks on 3.");
    });
  });
}

function netTrain() {
  if (NF("trained_2")) { panel("The training projector", "Training room", "\u{1F4FD}️"); pAdd(`<p>Rosa's deck is still up: <b>${esc("Network Week: How the Network Actually Works")}</b>.</p>`); pBtn("▶ Rewatch the slides", () => openTraining(2, null, { rewatch: true })); pBtn("Close", closePanel, "act ghost"); return; }
  if (!NF("kit2")) { panel("The training projector", "Training room", "\u{1F4FD}️"); pAdd(`<p>A sticky note: <i>“New tech: get your kit from me first. — R”</i></p>`); pBtn("Close", closePanel, "act ghost"); return; }
  openTraining(2, () => { chatPost("Rosa", "Nice. Now go tone out four jacks on Floor 3 so we know where they land."); N_().updateProgressUI(); });
}

function jack(p) {
  panel(p.label, p.room + " · wall plate", "\u{1F50C}");
  if (NF("done_" + p.id)) { pAdd(`<p>Traced: <code>${esc(p.port)}</code>. It's on the port map.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (curDay() !== 4 || !NF("kit2")) { pAdd(`<p>A wall plate with a little label. ${curDay() < 4 ? "" : "You'll need the toner from your network kit to trace it."}</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  const done = () => {
    NSET("done_" + p.id); hearLingo("mdfidf");
    addNote("trace", "\u{1F50A}", `Traced ${p.label}: ${p.port}.`);
    const n = N_JACKS.filter((j) => NF("done_" + j)).length;
    if (n === 4) { N_().addFind("portMap"); if (!NF("jackMiss")) award("tracer"); chatPost("Sam", "All four traced and labeled? Bring that port map up here so I can frame it."); }
    closePanel(); ping("\u{1F50A}", `Traced ${n}/4`, p.port);
  };
  if (p.id !== "jack-o") {
    pAdd(`<p>You clip the toner onto the jack. In the closet, the probe screams at one port on the patch panel.</p>
      <div class="worknote"><div class="wn-h">\u{1F5FA}️ Port map</div><div><span>Jack</span>${esc(p.label)}</div><div><span>Path</span>${esc(p.port)}</div></div>`);
    pBtn("\u{1F4DD} Add it to the port map", done);
    return;
  }
  pAdd(`<p>You tone the jack labeled <b>O-03</b>. The probe in the closet lights up on panel port <b>B-23</b>. The port map (and the label on the panel) both say O-03 is <b>B-03</b>.</p>${slideChip(2, 7)}<p><b>What do you do?</b></p>`);
  mustGetRight([
    ["Trust the tone, not the label: fix the panel label and the port map to say O-03 → B-23 → Gi1/0/23, and note it for Sam.", 2, "Fixed at both ends. Tomorrow, when someone says 'O-03 is dead', you'll be checking the right port."],
    ["Leave it. The map says B-03, the map must be right.", 0, "The tone doesn't lie. Tomorrow you'd be troubleshooting someone else's port.", ],
    ["Re-patch the jack to B-03 so it matches the map.", 1, "Now the map's right but you just moved a live user to an unknown port. Fix the documentation, not the user."]
  ], (tries) => { if (tries > 1) NSET("jackMiss"); pBtn("\u{1F4DD} Fix the label + port map", done); });
}

function ipPlan() {
  panel("IPAM", "Planning the Floor 3 voice VLAN", "\u{1F9EE}");
  if (NF("ipPlan")) { pAdd(`<div class="terminal">VLAN 120 · VOICE-F3 · 10.120.3.0/25\ngateway 10.120.3.1 · pool .10–.126 · .2–.9 infra</div>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!NF("trained_2")) { pAdd(`<p>Hiro: “Do Rosa's orientation first. I'm not letting anyone into IPAM who doesn't know what a /25 is.”</p>`); pBtn("Fair", closePanel, "act ghost"); return; }
  pAdd(`<p>Hiro pulls up a chair. “Floor 3 has <b>48 phones</b> today. Facilities says <b>90</b> by next year. Voice VLAN 120, range 10.120.3.0. <b>What prefix?</b>”</p>${slideChip(2, 2)}`);
  let first = true;
  mustGetRight([
    ["/25: 126 usable hosts. Fits 90 with room to spare.", 2, "“Good. A /26 would've been full by spring.”"],
    ["/26: 62 usable hosts.", 0, "“Fits today. Not next year. You'd be renumbering phones in six months.”"],
    ["/24: just give it everything.", 1, "“It works, but it's twice what you need. Address space is a budget too.”"]
  ], (tries) => {
    if (tries === 1) award("subnetter");
    hearLingo("cidr");
    pAdd(`<p>“Now the DHCP pool. Gateway is .1. Infrastructure gets .2 through .9. <b>What's the pool?</b>”</p>`);
    mustGetRight([
      ["10.120.3.10 – 10.120.3.126. (.127 is the broadcast address for a /25.)", 2, "“Exactly. And every reservation goes in IPAM, not in somebody's head.”"],
      ["10.120.3.10 – 10.120.3.254.", 0, "“A /25 ends at .127. Half that range isn't even in the subnet.”"],
      ["10.120.3.0 – 10.120.3.127.", 0, "“.0 is the network address and .127 is broadcast. Neither goes to a phone.”"]
    ], () => {
      pBtn("\u{1F4BE} Save the plan in IPAM", () => { NSET("ipPlan"); addNote("ipam", "\u{1F9EE}", "IP plan: voice VLAN 120 = 10.120.3.0/25, gateway .1, DHCP pool .10–.126."); closePanel(); });
    });
  });
}

function cfgBackup() {
  panel("Floor 3 network closet", "The old switches · IDF", "\u{1F5C4}️");
  if (NF("cfgBackup")) { pAdd(`<div class="terminal">F3-SW1-running.cfg  ✓ 14 KB  (matches show run)\nF3-SW2-running.cfg  ✓ 13 KB  (matches show run)</div>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p>Two old switches, humming, end-of-support stickers on both. Before anyone touches them: <b>what do you back up, and how do you know it worked?</b></p>`);
  mustGetRight([
    ["Each switch's running config, copied to the config server (SCP), then open the file and compare it to 'show run'.", 2, "Both files open and match the live config, including the two port changes nobody saved to startup. Now there's a real way back."],
    ["Just the startup config.", 1, "The startup config misses anything changed since the last save. The running config is the live truth."],
    ["A screenshot of 'show version'.", 0, "That tells you the firmware, not the config. There's nothing to restore from."]
  ], () => {
    hearLingo("testrestore");
    pBtn("\u{1F4BE} Log the config backups", () => { NSET("cfgBackup"); addNote("backup", "\u{1F4BE}", "Backed up the running configs of both old Floor 3 switches to the config server (verified against show run)."); closePanel(); });
  }, "restore");
}

function cab2() {
  panel("CAB · Change Advisory Board", "Harold + Rosa · conf. room", nspr("harold"));
  if (!NF("cfgBackup") || !NF("ipPlan")) {
    pAdd(`<p>Harold: “Good to see you again. Same rules as last week: <b>config backups verified</b> and an <b>IP plan</b> before I hear a pitch.”</p>`);
    pBtn("On it", closePanel, "act ghost"); return;
  }
  pAdd(`<p>Harold slides the form over. Rosa's on speaker. “Three fields. You know the drill.”</p>`);
  const fields = [
    { k: "window", q: "Change window", opts: [
      ["Wednesday 6–9 AM, one closet at a time, before the floor fills up", 2, "Early, scoped, staged. Approved."],
      ["Monday at 10 AM, everything at once", 0, "Peak hours, all closets at once? Everyone loses phones at the same time."],
      ["Friday at 5 PM", 0, "Friday evening with the weekend behind it. Classic."]] },
    { k: "backout", q: "Backout plan", opts: [
      ["Old switches stay racked with labeled patches; if a closet fails its go/no-go, re-patch to the old switch in ten minutes", 2, "Real, fast, rehearsed."],
      ["No backout: the new switches are better", 0, "No backout, no approval."],
      ["Wipe the old switches first to free the rack space", 0, "That destroys your only way back."]] },
    { k: "risk", q: "Risk & impact", opts: [
      ["Phones and wired network down ~15 min per closet; 911 by the charged cell at Reception; Accounting printer back before 9 for payroll", 2, "You found the life-safety and payroll angles. That's the job."],
      ["None, it's a hardware swap", 0, "Every phone on the floor goes dark. That's not 'none'."],
      ["Medium: something might happen", 1, "True, but WHAT? Name the impacts."]] }
  ];
  const pick = {}; const host = pAdd(""); let pitches = 0;
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
    if (bad.length) { addRep(-1); fb.innerHTML = `<div class="banner no">Harold: “Not yet.” ${bad.map((f) => `<br><b>${esc(f.q)}:</b> ${esc(pick[f.k][2])}`).join("")}</div>`; blip(false); return; }
    NSET("cab2"); addNote("cab", "\u{1F5C2}️", "CAB approved the Floor 3 switch cutover: Wed 6–9 AM closet by closet, old switches as backout, 911 cell at Reception.");
    pClear(); pAdd(`<div class="banner ok">✅ <b>APPROVED.</b> Harold: “Twice in two weeks. Now the notice. Today.”</div>`);
    chatPost("Harold", "CAB approved the Floor 3 switch cutover for Wednesday 6–9. @network send the outage notice NOW.");
    pBtn("\u{1F6A8} Go send the notice", closePanel); blip(true);
  });
}

function notice2() {
  panel("\u{1F4E3} Outage notice", "To: everyone on Floor 3 · cc Harold, Rosa", "\u{1F4E3}");
  pAdd(`<p style="margin:0 0 6px;">Tick everything that belongs in it, and nothing that doesn't.</p>`);
  tickComposer(shuffleArr([
    { t: "What: new network switches; desk phones and wired network briefly offline", real: true },
    { t: "When: Wednesday 6–9 AM, about 15 minutes per area", real: true },
    { t: "What to do: save your work; laptops on Wi-Fi keep working", real: true },
    { t: "Emergencies: call 911 from your mobile or the charged cell at Reception", real: true },
    { t: "Help: the service desk, ext. 4357, or walk over to Help Desk", real: true },
    { t: "The new switches' admin password, just in case", real: false },
    { t: "The full list of VLAN IDs and subnets", real: false },
    { t: "A photo of Sam's beautiful cable labels", real: false }
  ]), "\u{1F4E8} Send the notice", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Rosa: “Clear, short, and it remembered 911. Perfect.”</div>`); addRep(1); award("notice"); }
    else pAdd(`<div class="banner ${missed.length ? "no" : "fact"}">Rosa: ${missed.length ? `“You left out <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“And internal network details or passwords never go in a user email: <b>${extra.map((x) => esc(x.t)).join(", ")}</b>.”` : ""}</div>`);
    if (extra.some((x) => /password|VLAN/.test(x.t))) addRep(-1);
    NSET("notice2"); addNote("notice", "\u{1F4E3}", "Sent the Floor 3 network outage notice (what, when, what to do, 911, help).");
    pBtn("Done", closePanel);
  });
}

function stage2() {
  panel("Staging lab", "Two new 48-port PoE+ switches", nspr("wade"));
  if (NF("staged2")) { pAdd(`<p>Both switches on the approved firmware, PoE math checked, labels on. Ready for Wednesday.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p>Wade: “Boxes are open. One problem: the second switch shipped on <b>older firmware</b> than the approved standard.”</p>`);
  mustGetRight([
    ["Upgrade it to the approved standard version before it goes anywhere, and note the serial and version in the record.", 2, "“Both on the standard now. One less mystery on Wednesday.”"],
    ["Ship it, it'll be fine.", 0, "“Mismatched firmware in a stack is how you get a 3 AM bug hunt.”"],
    ["Upgrade both to the newest beta.", 0, "“Beta firmware in production? Hiro would faint.”"]
  ], () => {
    pAdd(`<p>“Now the power math. Stack 1 feeds <b>40 phones</b> (about 7 W each) and <b>6 PoE+ APs</b> (30 W reserved per port). The switch has a <b>740 W</b> PoE budget.”</p>${slideChip(2, 6)}`);
    mustGetRight([
      ["About 460 W of 740 W: it fits, with headroom for growth.", 2, "“40 × 7 = 280, 6 × 30 = 180, total 460. Leaves about 280 W spare.”"],
      ["Way over: more than 1,000 W.", 0, "“Do the math again: 280 + 180.”"],
      ["PoE doesn't use the switch's budget.", 0, "“It absolutely does. That's what the budget is.”"]
    ], () => {
      hearLingo("poe");
      pBtn("✅ Staged", () => { NSET("staged2"); addNote("stage", "\u{1F9F0}", "Staged 2 new PoE+ switches (firmware standardized; PoE budget 460/740 W)."); closePanel(); });
    });
  });
}

function huddle2() {
  panel("Rosa", "Pre-change huddle · 5:45 AM", nspr("rosa"));
  pAdd(`<p>“Coffee's in the NOC. Today, <b>Network owns the change</b>: Hiro runs the bridge and the configs. You're our eyes on Floor 3: the users, the hotspots, the weird stuff. Anything that isn't the plan goes on the known-issues board.”</p>
    <p>“Get the labeled cables from Sam, check the uplink on the core, then join Hiro's bridge.”</p>`);
  hearLingo("gonogo");
  pBtn("\u{1F44D} Let's go", () => { NSET("huddle2"); addNote("standup", "\u{1F5E3}️", "Huddle with Rosa: Network owns the change; I'm the eyes on Floor 3."); closePanel(); });
}

function cables2() {
  panel("Sam", "Cabling contractor · Telecom room", nspr("sam"));
  pAdd(`<p>“Forty-eight patch cables, labeled both ends, bundled by closet. Treat them like eggs.” He holds onto the bundle a second longer.</p>
    <p>“One rule. <b>If a cable's label is missing, where does it go?</b>”</p>`);
  mustGetRight([
    ["Nowhere, until it's checked against the port map. Then it gets labeled and logged.", 2, "“My kind of person.” He lets go of the bundle."],
    ["Into whatever port's free.", 0, "“And that's how a printer ends up on the voice VLAN.”"],
    ["I'd ask the user which one is theirs.", 1, "“They'll guess. Use the map.”"]
  ], () => {
    pBtn("\u{1F9F5} Take the cables", () => { NSET("cables2"); addNote("stage", "\u{1F9F5}", "Picked up 48 labeled patch cables from Sam."); closePanel(); });
  });
}

function trunk2() {
  panel("Core switch console", "MDF · Floor 5", "\u{1F5A5}️");
  if (NF("trunk2")) { pAdd(`<div class="terminal">Po1  trunk  802.1q  trunking  native 999\n     allowed: 30,120   (per template)</div>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!NF("cables2")) { pAdd(`<p>Plug in later. Rosa wants the cables picked up first.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p>You plug in the blue console cable. <code>show interfaces trunk</code> comes back… empty. <code>show interface Po1 switchport</code>:</p>
    <div class="terminal">Name: Po1   Administrative Mode: dynamic auto\nOperational Mode: static access   Access VLAN: 1</div>
    <p>The new uplink to Floor 3 came up as an <b>access port on VLAN 1</b>, not a trunk.</p>${slideChip(2, 4)}<p><b>What should it be?</b></p>`);
  mustGetRight([
    ["Configure it explicitly as an 802.1Q trunk with the planned allowed list and a dedicated native VLAN (logged on the bridge as part of the change).", 2, "Po1 is trunking. VLANs 30 and 120 cross it, per Hiro's template."],
    ["Leave it on dynamic auto, it'll figure itself out.", 0, "Two 'auto' ends never negotiate a trunk. It stays an access port and the phones never get their VLAN."],
    ["Put everything in VLAN 1, it's simpler.", 0, "Then phones, printers and PCs share one flat network, and the voice plan is gone."]
  ], () => {
    hearLingo("trunk");
    pBtn("\u{1F4BE} Save the config", () => { NSET("trunk2"); addNote("change", "\u{1F5A5}️", "Core uplink Po1 to Floor 3 set as an 802.1Q trunk (allowed per template: 30,120)."); closePanel(); });
  });
}

function bridge2() {
  panel("Hiro", "The change bridge · NOC", nspr("hiro"));
  if (!NF("huddle2") || !NF("cables2") || !NF("trunk2")) { pAdd(`<p>“Huddle, cables, uplink. Then I open the window.”</p>`); pBtn("On it", closePanel, "act ghost"); return; }
  pAdd(`<p>Headset on, four terminals open. “Before I open the window: <b>what's our no-go?</b>”</p>`);
  mustGetRight([
    ["If a closet's uplink isn't up and verified by its go/no-go time, we back that closet out to the old switch and troubleshoot outside the window.", 2, "“Exactly. The plan decides, not our pride.”"],
    ["There's no going back once we start.", 0, "“There's ALWAYS a way back. That's what the old switches are for.”"],
    ["We'll know it when we feel it.", 1, "“Feelings aren't a go/no-go criterion.”"]
  ], () => {
    pBtn("\u{1F4DE} Join the bridge", () => { NSET("bridge2"); closePanel(); CORE.S.openWindow && CORE.S.openWindow(); });
  });
}

function verify(p) {
  panel(p.label, p.room + " · post-change check", "✅");
  if (NF("done_" + p.id)) { pAdd(`<p>Checked and logged. Working as designed.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  const Q = {
    "vfy-phone": [`The Reception desk phone, on its new port. <b>How do you verify it?</b>`, [
      ["Dial tone, a call to the front desk and an outside number, and check the phone's emergency location shows Floor 3 Reception.", 2, "All good, and the E911 location is right. That's the one that matters most."],
      ["Call 911 to make sure it works.", 0, "Never place test calls to 911 without coordinating with the dispatch center's non-emergency line first."],
      ["The screen lights up, so it's fine.", 1, "Lit isn't working. Make a call."]]],
    "vfy-wired": [`An Accounting desk on the new switch. <b>How do you verify it, bottom-up?</b>`, [
      ["Link at 1 Gbps on the dock, an address from the new scope with the right gateway, ping the gateway, look up a name, then open the S: drive and a website.", 2, "Layer by layer, everything checks out. If something had failed, you'd know exactly which layer."],
      ["Open a website.", 1, "If it fails, you know nothing about where. Go bottom-up."],
      ["Reboot every PC in Accounting.", 0, "That tests nothing and interrupts everyone."]]],
    "vfy-wifi": [`The conference-room Wi-Fi with the new AP. <b>How do you verify it?</b>`, [
      ["Walk the room with an analyzer: good signal on 5 GHz everywhere (about -67 dBm or better), the AP on a clean channel, and a video call that doesn't stutter.", 2, "Strong signal, clean channel, smooth call. Logged for Wade."],
      ["The Wi-Fi bars look full.", 1, "Bars can be full on a congested channel. Measure."],
      ["Turn the 2.4 GHz power all the way up.", 0, "Louder isn't better: it just makes more interference for the neighbors."]]]
  }[p.id];
  pAdd(`<p>${Q[0]}</p>${slideChip(2, 7)}`);
  mustGetRight(Q[1], () => {
    pBtn("✅ Log the check", () => {
      NSET("done_" + p.id); addNote("verify", "✅", `Post-change check passed: ${p.label}.`);
      const n = N_VFY.filter((v) => NF("done_" + v)).length; closePanel(); ping("✅", `Verified ${n}/3`, p.label);
    });
  });
}

function signOff2(n) {
  const area = { karen: "Reception phones", ed: "Accounting wired network", riley: "conference-room Wi-Fi" }[n.id];
  panel(n.name, `${area} · business sign-off`, n.sprite);
  pAdd(`<p>“You want me to sign off on the ${area}? <b>What should I check first?</b>”</p>`);
  const Q = {
    karen: ["Make a real call in and out, transfer one to Tasha, and check the voicemail light. Then sign.", "Calls, transfer, voicemail: all good. She signs with the good pen."],
    ed: ["Do your real work on the wired desk: open the S: drive, print a check run test page, and load the payroll site. Then sign.", "Files, printing, payroll site. Ed signs, then double-checks his signature."],
    riley: ["Join a real video meeting in the conference room on Wi-Fi and walk around with it. Then sign.", "Smooth video, no drops while walking. Riley signs and asks about the projector (separate ticket)."]
  }[n.id];
  mustGetRight([
    [Q[0], 2, Q[1]],
    ["Just sign, it's a formality.", 0, "A signature without a test is how next week's outage starts."],
    ["Does it feel faster?", 1, "'Feels faster' isn't acceptance. Test the real work."]
  ], () => {
    pBtn(`✍️ Take ${esc(n.name)}'s sign-off`, () => {
      NSET("so2_" + n.id); addNote("signoff", "✍️", `${n.name} signed off on the ${area} after testing real work.`);
      const k = N_SIGNOFFS.filter(([id]) => NF("so2_" + id)).length; closePanel(); ping("✍️", `Sign-off ${k}/3`, n.name);
      if (k === 3) chatPost("Rosa", "All three sign-offs. The old switches are released: wipe, then Mo's cage.");
    });
  });
}

function wipe2() {
  panel("The old switches", "Floor 3 network closet", "\u{1F5C4}️");
  if (NF("wiped2")) { pAdd(`<p>Wiped, reset, unracked, labeled with their serials. They go to Mo's cage.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  if (!N_SIGNOFFS.every(([id]) => NF("so2_" + id))) { pAdd(`<p>The old switches are still the backout. They stay racked until all three owners sign off.</p>`); pBtn("Close", closePanel, "act ghost"); return; }
  pAdd(`<p>Two old switches, unplugged and quiet. They're leaving the building. <b>First:</b></p>`);
  mustGetRight([
    ["Erase the configs (they hold passwords, SNMP strings and keys), reset them to factory, remove them from monitoring, IPAM and DNS, then log the serials into custody.", 2, "Wiped, reset, removed from every system, serials on the custody sheet."],
    ["Unplug them and put them in a box.", 0, "Their configs still hold the network's secrets. A used switch on eBay is a map of your network."],
    ["Leave them racked forever, just in case.", 1, "Dead gear in a rack is confusion and attack surface. Decommission it properly."]
  ], (tries) => {
    if (tries === 1) NSET("decomFirst");
    hearLingo("sanitize");
    pBtn("\u{1F9F9} Wiped: take them to Mo", () => { NSET("wiped2"); addNote("decom", "\u{1F9F9}", "Wiped + reset the 2 old switches; removed from monitoring, IPAM and DNS."); closePanel(); });
  });
}

function cage2() {
  panel("E-waste cage", "IT storeroom · Mo", nspr("mo"));
  pAdd(`<p>Mo opens the book. “Two switches. Serials… match. Configs wiped? Good. Same recycler as last week.”</p>
    <div class="worknote"><div class="wn-h">\u{1F4D2} Chain of custody · in</div><div><span>F3-SW1</span>FOC1733X0AB · wiped</div><div><span>F3-SW2</span>FOC1733X0B9 · wiped</div></div>`);
  pBtn("\u{1F4D2} Log them into the cage", () => {
    NSET("decom2"); if (NF("decomFirst")) award("decom");
    addNote("decom", "\u{1F512}", "Old switches logged into the e-waste cage (custody signed).");
    closePanel();
  });
}

function diagram2() {
  panel("IPAM + network diagram", "Update the source of truth", "\u{1F5FA}️");
  pAdd(`<p style="margin:0 0 6px;">Tick everything that belongs in the updated diagram and IPAM, and nothing that doesn't.</p>`);
  tickComposer(shuffleArr([
    { t: "New switch hostnames and serials (F3-ACC-01, F3-ACC-02)", real: true },
    { t: "Voice VLAN 120: 10.120.3.0/25, gateway .1", real: true },
    { t: "Floor 3 uplink trunk Po1: allowed VLANs 30, 40, 120", real: true },
    { t: "The port map: jack → patch panel → switch port", real: true },
    { t: "Old switches marked decommissioned", real: true },
    { t: "Each switch's admin password, for convenience", real: false },
    { t: "Sam's personal phone number", real: false },
    { t: "A note saying 'it mostly works'", real: false }
  ]), "\u{1F4BE} Publish", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Hiro: “That's a diagram I can troubleshoot from at 3 AM.”</div>`); addRep(1); }
    else pAdd(`<div class="banner ${missed.length ? "no" : "fact"}">Hiro: ${missed.length ? `“Missing: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“And never: <b>${extra.map((x) => esc(x.t)).join(", ")}</b>.”` : ""}</div>`);
    if (extra.some((x) => /password/.test(x.t))) addRep(-1);
    NSET("diagram2"); hearLingo("ipam"); addNote("docs", "\u{1F5FA}️", "Updated the network diagram and IPAM for the Floor 3 cutover.");
    pBtn("Done", closePanel);
  });
}

function return2() {
  panel("Rosa", "Closing out your change access", nspr("rosa"));
  pAdd(`<p>“Cutover's done and signed. Your change account <b>chg-${nme()}</b> expires Friday anyway. What do we do with it?”</p>`);
  mustGetRight([
    ["Disable it today and confirm it's gone. I keep the read-only login.", 2, "“Disabled. Access that outlives its reason is attack surface. Same lesson as Tasha's, different week.”"],
    ["Keep it, there'll be another change.", 0, "“Then it's just standing admin access with a nicer name.”"],
    ["Give it to Abby so she can use it.", 0, "“Shared admin accounts: no accountability. Never.”"]
  ], () => {
    hearLingo("jit");
    pBtn("\u{1F511} Hand it back", () => { NSET("return2"); addNote("return", "\u{1F511}", "Change account disabled after the cutover (read-only access kept)."); closePanel(); });
  });
}

function pir2() {
  panel("\u{1F4E8} Post-implementation review", "To: Rosa, Hiro, Harold, Director Chen", "\u{1F4E8}");
  pAdd(`<p style="margin:0 0 6px;">Blameless and factual. Tick what belongs.</p>`);
  tickComposer(shuffleArr([
    { t: "Went well: config backups verified against 'show run' before the change", real: true },
    { t: "Went well: closet-by-closet rollout with the old switches as a live backout", real: true },
    { t: "Didn't go well: printer VLAN 40 was missing from the uplink template", real: true },
    { t: "Didn't go well: an unmanaged switch under a desk caused a loop", real: true },
    { t: "Action: add VLAN 40 to the template; BPDU guard + storm control on every access port", real: true },
    { t: "Sam was slow with the cables", real: false },
    { t: "Users kept breaking things", real: false },
    { t: "Nothing to report, it was fine", real: false }
  ]), "\u{1F4E8} Send the PIR", (missed, extra) => {
    pClear();
    if (!missed.length && !extra.length) { pAdd(`<div class="banner ok">Harold: “Two good PIRs in two weeks. I'm starting a folder.”</div>`); addRep(2); }
    else pAdd(`<div class="banner ${extra.length ? "no" : "fact"}">Harold: ${missed.length ? `“You left out: <b>${missed.map((x) => esc(x.t)).join("</b>; <b>")}</b>.” ` : ""}${extra.length ? `“Blameless, please: <b>${extra.map((x) => esc(x.t)).join("; ")}</b> doesn't belong.”` : ""}</div>`);
    if (extra.length) addRep(-1);
    hearLingo("pir"); NSET("pir2"); addNote("pir", "\u{1F4E8}", "Sent the switch-cutover PIR.");
    chatPost("Director Chen", "PIR received. Check your email, " + (CORE.S.playerName || "network tech") + ".");
    pBtn("Done", closePanel);
  });
}

function chen2() {
  panel("\u{1F4E7} Inbox", "Wednesday · 5:20 PM", nspr("chen"));
  pAdd(email("<b>Director Chen</b> · IT Director", nme() + " · cc Rosa, Hiro, Omar", "Network Week: thank you (and a question)",
    `<p>Team, the Floor 3 switch cutover is closed: two switches, 48 drops, every phone on the voice VLAN, and the old gear wiped and in custody.</p>
     <p>${nme()}, Rosa says you traced jacks like you'd done it for years and caught a loop before the NOC did.</p>
     <p class="em-sec">NEXT UP</p><p>Omar's SOC on <b>Floor 7</b> has an opening for a <b>Security Analyst</b>. He asked for you by name. Starting Monday: <b>SOC Week</b>.</p>
     <p>Tonight: The Stack, 6 PM. First round's on the department. Again.</p><p>— Chen</p>`));
  pBtn("\u{1F37B} Head to The Stack", () => {
    NSET("chen2"); NSET("party2"); NSET("barOpen"); N_().addFind("netCards");
    closePanel(); ping("\u{1F37B}", "Happy hour", "The Stack, street level. The network team's already there.");
  });
}

function netPc() {
  const d = curDay();
  if (d === 4 && NF("cab2") && !NF("notice2")) { notice2(); return; }
  if (d === 6) {
    if (!NF("pir2")) { pir2(); return; }
    if (!NF("chen2")) { chen2(); return; }
  }
  panel("Your network desk", "Network team · Floor 5", "\u{1F4BB}");
  pAdd(`<p>Three terminals, one dashboard, a sticky note from Hiro: <i>“show run, then show it again.”</i></p>`);
  pBtn("Close", closePanel, "act ghost");
}

// ---- dispatch ------------------------------------------------------------------
export function netNpc(n) {
  const day = curDay(); if (day < 4 || day > 6) return false;
  const id = n.id;
  if (id === "lou" && day === 4 && !NF("badge2")) { badge2(); return true; }
  if (id === "rosa") {
    if (day === 4 && !NF("kit2")) { kit2(); return true; }
    if (day === 5 && !NF("huddle2")) { huddle2(); return true; }
    if (day === 6 && !NF("return2") && NF("audited2")) { return2(); return true; }
    if (day === 6 && !NF("return2")) { panel("Rosa", "Network Lead", nspr("rosa")); pAdd(`<p>“Verify, route, sign-offs, decom, docs, then Gloria's review. THEN we talk about your change account.”</p>`); pBtn("On it", closePanel, "act ghost"); return true; }
    return false;
  }
  if (id === "sam" && day === 5 && !NF("cables2")) { cables2(); return true; }
  if (id === "hiro" && day === 5 && !NF("bridge2")) { bridge2(); return true; }
  if (id === "harold" && day === 4 && !NF("cab2") && NF("kit2")) { cab2(); return true; }
  if (day === 6 && ["karen", "ed", "riley"].includes(id) && NF("known2Done") && !NF("so2_" + id)) { signOff2(n); return true; }
  if (id === "gloria" && day === 6 && !NF("audited2") && !NF("diagram2")) { panel("Gloria", "Service Desk Manager", n.sprite); pAdd(`<p>“Change review? Update the diagram and IPAM first. I review the record, not the vibes.”</p>`); pBtn("Fair", closePanel, "act ghost"); return true; }
  if (id === "gloria" && day === 6 && !NF("audited2") && NF("diagram2")) { openAudit(() => N_().updateProgressUI(), { days: [4, 5, 6], flag: "audited2", label: "Network Week" }); return true; }
  if (id === "nico" && day === 6 && NF("chen2") && !NF("partyDone2")) { partyFinale(2); return true; }
  return false;
}
export function netProp(p) {
  const day = curDay();
  switch (p.id) {
    case "projector": netTrain(); return true;
    case "ipam":
      if (day === 4 && !NF("ipPlan")) { ipPlan(); return true; }
      if (day === 6 && !NF("diagram2")) { diagram2(); return true; }
      ipPlanView(); return true;
    case "idf-3":
      if (day === 4 && !NF("cfgBackup")) { cfgBackup(); return true; }
      if (day === 6 && !NF("wiped2")) { wipe2(); return true; }
      if (day < 4) { panel("Floor 3 network closet", "Patch panel + switches", "\u{1F5C4}️"); pAdd(`<p>Two old switches with 'END OF SUPPORT' stickers. Not your floor's problem. Yet.</p>`); pBtn("Close", closePanel, "act ghost"); return true; }
      cfgBackup(); return true;
    case "stage-bench": stage2(); return true;
    case "netpc": netPc(); return true;
    case "core-console": trunk2(); return true;
    case "cage": if (day === 6 && NF("wiped2") && !NF("decom2")) { cage2(); return true; } return false;
  }
  if (p.kind === "jack") { jack(p); return true; }
  if (p.kind === "verify") { verify(p); return true; }
  if (p.id === "kiboard-5") { knownBoard(p); return true; }
  return false;
}
function ipPlanView() {
  panel("IPAM", "IP address management", "\u{1F9EE}");
  pAdd(`<div class="terminal">10.30.3.0/24   VLAN 30   DATA-F3    gw .1\n10.40.3.0/26   VLAN 40   PRINT-F3   gw .1\n${NF("ipPlan") ? "10.120.3.0/25  VLAN 120  VOICE-F3   gw .1" : "(voice VLAN: not planned yet)"}</div>`);
  pBtn("Close", closePanel, "act ghost");
}
