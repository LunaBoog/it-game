// v3 training: each week opens with an orientation "presentation" from your
// new boss (slides + narration + pixel diagrams), then a quiz on it. The
// tickets, walk-ups, pages and tasks later in the week point back at the slide
// that taught them ("📘 From your training"), so the lesson gets used, not
// just watched. Some of it repeats on purpose: that's how it sticks.
//
// Facts are written against the current exam objectives (CompTIA A+
// 220-1201/1202, Network+ N10-009, Security+ SY0-701) and NIST SP 800-61r3
// (April 2025). See the handoff for sources.

import { CORE, DD, ddSave, esc, shuffleArr, addNote, addRep, recordAnswer, WEEKS } from "./core.js";
import { panel, pAdd, pBtn, pClear, closePanel, pBody } from "./ui.js";
import { award, ping, blip, hearLingo } from "./comms.js";
import { drawSpritePreview } from "./render.js";

// ---- tiny SVG kit (crisp pixel-ish diagrams) ----------------------------------
const TC = { bg: "#0d1420", grid: "#16202f", line: "#2a3a52", ink: "#e8edf2", mute: "#8a99ad", cyan: "#4fd1c5",
  yel: "#fcde5a", grn: "#63b370", red: "#e24b4a", blu: "#6fb0ff", org: "#ef9f27", vio: "#a78bfa", pnk: "#f472b6" };
function tfSvg(inner, h = 150) {
  return `<svg class="tfig" viewBox="0 0 320 ${h}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="ui-monospace, Menlo, monospace">
    <rect width="320" height="${h}" fill="${TC.bg}"/>${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="${h}" stroke="${TC.grid}" stroke-width="1"/>`).join("")}${inner}</svg>`;
}
function tfBox(x, y, w, h, col, label, sub, txt = TC.ink) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${col}22" stroke="${col}" stroke-width="1.5"/>
    <text x="${x + w / 2}" y="${y + (sub ? h / 2 - 2 : h / 2 + 3)}" fill="${txt}" font-size="9" font-weight="700" text-anchor="middle">${label}</text>
    ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 9}" fill="${TC.mute}" font-size="7" text-anchor="middle">${sub}</text>` : ""}`;
}
function tfArrow(x1, y1, x2, y2, col = TC.mute, dash = false) {
  const a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - Math.cos(a) * 6, hy = y2 - Math.sin(a) * 6;
  const l = `${hx + Math.sin(a) * 3.5},${hy - Math.cos(a) * 3.5} ${x2},${y2} ${hx - Math.sin(a) * 3.5},${hy + Math.cos(a) * 3.5}`;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${col}" stroke-width="1.5"${dash ? ' stroke-dasharray="3 3"' : ""}/><polygon points="${l}" fill="${col}"/>`;
}
function tfText(x, y, s, size = 8, col = TC.ink, anchor = "start", weight = 400) {
  return `<text x="${x}" y="${y}" fill="${col}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${s}</text>`;
}
function tfSteps(list, col) {
  const n = list.length, w = 300 / n;
  return tfSvg(list.map((s, i) => {
    const x = 10 + i * w, y = 118 - i * (90 / n);
    return `<rect x="${x}" y="${y}" width="${w - 4}" height="${140 - y}" fill="${col[i % col.length]}22" stroke="${col[i % col.length]}" stroke-width="1.5"/>
      <text x="${x + 5}" y="${y + 13}" fill="${col[i % col.length]}" font-size="12" font-weight="700">${i + 1}</text>
      ${s.map((ln, k) => tfText(x + 5, y + 25 + k * 9, ln, 7, TC.ink)).join("")}`;
  }).join(""));
}
function tfStack(rows, note) {
  return tfSvg(rows.map((r, i) => {
    const y = 8 + i * 19;
    return `<rect x="10" y="${y}" width="150" height="16" fill="${r[2]}26" stroke="${r[2]}" stroke-width="1.2"/>
      ${tfText(16, y + 11, r[0], 8, r[2], "start", 700)}${tfText(166, y + 11, r[1], 7, TC.ink)}`;
  }).join("") + (note || ""));
}
function tfPerson(x, y, col) { return `<rect x="${x + 4}" y="${y}" width="8" height="8" fill="#e0b080"/><rect x="${x}" y="${y + 9}" width="16" height="12" fill="${col}"/>`; }
function tfPc(x, y, col = TC.blu) { return `<rect x="${x}" y="${y}" width="26" height="18" fill="#1a2433" stroke="${col}" stroke-width="1.5"/><rect x="${x + 3}" y="${y + 3}" width="20" height="12" fill="${col}55"/><rect x="${x + 9}" y="${y + 19}" width="8" height="3" fill="${col}"/>`; }

// ---- the three orientations ---------------------------------------------------
export const TRAINING = {
  1: {
    title: "Day One: How IT Support Works", host: "tasha", hostName: "Tasha", hostRole: "Help Desk Lead",
    where: "Tasha's laptop · IT room", pass: 6, lingo: ["tiers", "escalation"],
    slides: [
      { t: "The job, in one picture", say: "Everything starts as a ticket. You own first contact, you fix what you can, and you route what you can't. Escalating isn't failing; it's routing.",
        pts: ["Every request becomes a ticket, even the hallway ones.", "Tier 1 (you) takes first contact and fixes what it can.", "Tier 2/3 and vendors get it when it needs deeper access or skills.", "If it isn't in the ticket, it didn't happen."],
        fig: tfSvg(tfPerson(14, 62, TC.pnk) + tfText(6, 100, "user", 7, TC.mute) + tfArrow(36, 72, 62, 72) + tfBox(64, 56, 60, 32, TC.yel, "TICKET", "who · what · when") +
          tfArrow(126, 72, 150, 72) + tfBox(152, 56, 62, 32, TC.cyan, "TIER 1", "you") + tfArrow(216, 66, 236, 40, TC.grn) + tfBox(238, 22, 78, 30, TC.grn, "FIXED ✓", "notes + close") +
          tfArrow(216, 78, 236, 104, TC.org) + tfBox(238, 92, 78, 30, TC.org, "ESCALATE", "Tier 2/3 · vendor")) },
      { t: "Priority = impact × urgency", say: "Benny lives by this. How many people are hurt, times how soon it hurts. Job titles are not on the chart.",
        pts: ["Impact: how many people, how critical the system.", "Urgency: how soon it causes real damage (a deadline?).", "A whole department down before payroll = P1: escalate now.", "The CEO's wallpaper is a P4. Politely."],
        fig: tfSvg(tfText(160, 14, "URGENCY →", 8, TC.mute, "middle", 700) + tfText(14, 90, "IMPACT", 8, TC.mute, "start", 700) + tfText(14, 100, "  ↓", 8, TC.mute) +
          ["LOW", "MED", "HIGH"].map((u, i) => tfText(118 + i * 66, 28, u, 7, TC.mute, "middle")).join("") +
          ["one person", "a team", "a department"].map((r, j) => tfText(80, 50 + j * 34, r, 7, TC.ink, "end")).join("") +
          [[4, 3, 3], [3, 2, 2], [2, 1, 1]].map((row, j) => row.map((p, i) => {
            const col = [null, TC.red, TC.org, TC.yel, TC.grn][p];
            return `<rect x="${86 + i * 66}" y="${34 + j * 34}" width="62" height="30" fill="${col}33" stroke="${col}" stroke-width="1.5"/>${tfText(117 + i * 66, 53 + j * 34, "P" + p, 11, col, "middle", 700)}`;
          }).join("")).join("")) },
      { t: "The troubleshooting method", say: "CompTIA's six steps. Say them in your sleep. Step one includes asking what changed, and step six is the one everybody skips.",
        pts: ["1 · Identify the problem: ask, scope it, find what changed.", "2 · Theory of probable cause: question the obvious.", "3 · Test the theory (if it fails, new theory or escalate).", "4 · Plan of action, then implement it.", "5 · Verify full functionality (+ prevent it happening again).", "6 · Document findings, actions and outcomes."],
        fig: tfSteps([["Identify", "+ what", "changed?"], ["Theory", "question", "the obvious"], ["Test", "it"], ["Plan +", "implement"], ["Verify", "+ prevent"], ["DOCUMENT", "(always)"]], [TC.cyan, TC.blu, TC.vio, TC.org, TC.grn, TC.yel]) },
      { t: "Bottom-up: physical first", say: "When something's dead, start at the bottom of the stack: power, cables, inputs, link lights. Half the tickets on this floor die at layer 1.",
        pts: ["Power: is the strip on? Is the LED amber (asleep) or off?", "Cables: seated at BOTH ends? Chairs roll over cables.", "Display: right input selected? 'No signal' + a live PC = the signal path.", "Link lights on the jack and the NIC before you blame the network."],
        fig: tfStack([["7 Application", "apps, DNS, email", TC.pnk], ["6 Presentation", "encryption, formats", TC.vio], ["5 Session", "sessions", TC.blu], ["4 Transport", "TCP / UDP ports", TC.cyan], ["3 Network", "IP addresses, routers", TC.grn], ["2 Data link", "MAC, switches", TC.yel], ["1 Physical", "power, cables, ports ◀ START", TC.org]]) },
      { t: "How a PC gets online", say: "DHCP hands a PC its address, mask, gateway and DNS. DNS turns names into numbers. Learn this picture and most 'the internet is down' tickets get easy.",
        pts: ["DHCP gives: IP address, subnet mask, default gateway, DNS server.", "169.254.x.x means DHCP never answered.", "Ping by IP works but the name fails? That's DNS.", "Scope first: one user, one site, or everyone?"],
        fig: tfSvg(tfPc(12, 64) + tfText(10, 96, "your PC", 7, TC.mute) + tfArrow(40, 73, 76, 73) + tfBox(78, 60, 52, 26, TC.yel, "SWITCH", "layer 2") + tfArrow(132, 73, 168, 73) +
          tfBox(170, 60, 56, 26, TC.grn, "ROUTER", "gateway") + tfArrow(228, 73, 256, 73) +
          `<ellipse cx="286" cy="73" rx="28" ry="16" fill="${TC.blu}22" stroke="${TC.blu}" stroke-width="1.5"/>` + tfText(286, 76, "internet", 8, TC.ink, "middle", 700) +
          tfBox(62, 12, 76, 26, TC.cyan, "DHCP", "IP·mask·gw·DNS") + tfArrow(100, 38, 100, 58, TC.cyan, true) +
          tfBox(150, 110, 76, 26, TC.vio, "DNS", "name → IP") + tfArrow(140, 86, 170, 110, TC.vio, true)) },
      { t: "Printers: follow the path", say: "A print job takes a trip: the app, the queue, the print server, the printer. Find where it stopped. And drivers come from the print server, never a random website.",
        pts: ["Check the queue first: one stuck job blocks the rest.", "Restart the print spooler service if the queue is wedged.", "At the printer: paper, toner, error on the panel, online?", "Drivers + queues come from the company print server."],
        fig: tfSvg(tfPc(10, 60) + tfArrow(38, 69, 64, 69) + tfBox(66, 54, 62, 30, TC.yel, "QUEUE", "spooler") + tfArrow(130, 69, 156, 69) + tfBox(158, 54, 66, 30, TC.cyan, "PRINT SRV", "drivers") + tfArrow(226, 69, 252, 69) +
          `<rect x="256" y="58" width="48" height="24" fill="#1a2433" stroke="${TC.grn}" stroke-width="1.5"/><rect x="262" y="50" width="36" height="9" fill="#e8edf2"/><rect x="264" y="82" width="32" height="10" fill="#e8edf2"/>` +
          tfText(160, 118, "stuck job?  →  clear the queue  →  restart spooler  →  test page", 7, TC.mute, "middle")) },
      { t: "Security is part of the job", say: "You're the most trusted person on the floor, which makes you the most useful person to fool. Verify the human, keep admin rights separate, and never approve what you didn't start.",
        pts: ["Verify identity before a reset: badge, or a callback to the number on file.", "Least privilege: daily account for email, a separate admin account for admin work.", "Never approve an MFA prompt you didn't start. Report it.", "Strangers, tailgaters, mystery USBs and urgent links: verify, then trust."],
        fig: tfSvg([["VERIFY", "the human", TC.cyan], ["LEAST", "privilege", TC.yel], ["MFA", "deny + report", TC.grn], ["STRANGERS", "USB · links", TC.red]].map((c, i) =>
          tfBox(10 + i * 77, 40, 70, 60, c[2], c[0], c[1])).join("") + tfText(160, 128, "verify, then trust", 9, TC.mute, "middle", 700)) }
    ],
    quiz: [
      { q: "Two tickets land: the CEO's wallpaper reset itself, and Accounting can't print checks due out today. Which first?", s: 1,
        o: [["Accounting's checks: higher impact and a deadline", 1], ["The CEO's wallpaper: seniority", 0], ["Whichever arrived first", 0]],
        why: "Priority is impact × urgency. A department with a deadline beats one person's cosmetic issue, whatever their title." },
      { q: "What's the FIRST step of the troubleshooting method?", s: 2,
        o: [["Identify the problem: ask questions, scope it, find out what changed", 1], ["Reboot the computer", 0], ["Escalate to Tier 2", 0]],
        why: "Step 1 is identify the problem, including 'what changed?' Everything else depends on it." },
      { q: "And what's the LAST step that everyone skips?", s: 2,
        o: [["Document findings, actions and outcomes", 1], ["Close the ticket quickly", 0], ["Ask the user to rate you", 0]],
        why: "Step 6 is documentation. Gloria will check." },
      { q: "A monitor says 'No signal' on every input, but the PC's fans and lights are running. Check first:", s: 3,
        o: [["The video cable is seated at both ends and the right input is selected", 1], ["Reinstall the graphics driver", 0], ["Replace the power supply", 0]],
        why: "A live PC plus 'no signal' points at the signal path. Physical layer first." },
      { q: "A laptop has the IP 169.254.20.7 and no gateway. What happened?", s: 4,
        o: [["It never got an answer from a DHCP server", 1], ["Its DNS server is down", 0], ["It has a public IP address", 0]],
        why: "169.254.x.x is the address Windows gives itself when DHCP doesn't answer (APIPA)." },
      { q: "Ping by IP address works, but ping by name fails. What's broken?", s: 4,
        o: [["Name resolution (DNS)", 1], ["The network cable", 0], ["The default gateway", 0]],
        why: "If the numbers work and the names don't, DNS is the layer that's failing." },
      { q: "Everybody's print jobs are stuck behind one job in the queue. Good first move?", s: 5,
        o: [["Clear the stuck job (restart the spooler if needed), then send a test page", 1], ["Download a new driver from a search result", 0], ["Replace the printer", 0]],
        why: "Follow the path: the queue is the first stop. Drivers only ever come from the print server." },
      { q: "Your phone shows an MFA prompt you didn't start. You:", s: 6,
        o: [["Deny it and report it: someone may have your password", 1], ["Approve it, it's probably IT", 0], ["Ignore it and hope it stops", 0]],
        why: "A prompt you didn't start means someone else has your password. Deny, report, reset." }
    ]
  },

  2: {
    title: "Network Week: How the Network Actually Works", host: "rosa", hostName: "Rosa", hostRole: "Network Lead",
    where: "Training room · Floor 5", pass: 6, lingo: ["vlan", "cidr", "mdfidf"],
    slides: [
      { t: "The OSI model, for real", say: "You learned this as a list. Here it is as the gear you'll touch. Cables and PoE at the bottom, switches at two, routers at three. When something breaks, start low and climb.",
        pts: ["L1 Physical: cables, jacks, patch panels, PoE, Wi-Fi radio.", "L2 Data link: switches, MAC addresses, VLANs.", "L3 Network: routers, IP addresses, the default gateway.", "L4 Transport: TCP and UDP ports. L7: the apps (DNS, DHCP, web)."],
        fig: tfStack([["7 Application", "DNS · DHCP · HTTP", TC.pnk], ["4 Transport", "TCP/UDP ports", TC.cyan], ["3 Network", "IP · routers · gateway", TC.grn], ["2 Data link", "MAC · switches · VLANs", TC.yel], ["1 Physical", "cable · jack · PoE · RF", TC.org]],
          tfText(166, 120, "troubleshoot bottom-up ↑", 8, TC.mute, "start", 700)) },
      { t: "IPv4 addressing", say: "An address has a network part and a host part. The slash tells you where the line is. A /24 means the first 24 bits are the network: everyone who shares them is on your subnet.",
        pts: ["10.30.3.45/24: network 10.30.3.0, hosts .1 to .254.", "Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.", "The default gateway is the router's address ON your subnet.", "Same subnet: talk directly. Anything else: send it to the gateway."],
        fig: tfSvg(tfText(160, 22, "10 . 30 . 3 . 45 / 24", 13, TC.ink, "middle", 700) +
          Array.from({ length: 32 }, (_, i) => `<rect x="${16 + i * 9}" y="40" width="8" height="18" fill="${i < 24 ? TC.blu : TC.org}66" stroke="${i < 24 ? TC.blu : TC.org}" stroke-width="1"/>`).join("") +
          tfText(124, 72, "network: 24 bits", 8, TC.blu, "middle", 700) + tfText(268, 72, "host: 8", 8, TC.org, "middle", 700) +
          tfBox(20, 92, 130, 40, TC.grn, "same subnet", "10.30.3.x → direct") + tfBox(170, 92, 130, 40, TC.yel, "anywhere else", "→ gateway 10.30.3.1")) },
      { t: "Subnet math you'll actually use", say: "Every bit you add to the prefix halves the subnet. Usable hosts are two to the power of host bits, minus two: one for the network address, one for broadcast.",
        pts: ["Usable hosts = 2^(32 − prefix) − 2.", "/24 = 254 · /25 = 126 · /26 = 62 · /27 = 30.", "Size for today plus growth; you rarely get to resize later.", "Record every subnet and reservation in IPAM."],
        fig: tfSvg([["/24", 254], ["/25", 126], ["/26", 62], ["/27", 30], ["/28", 14]].map((r, i) => {
          const w = Math.round(r[1] / 254 * 196);
          return `${tfText(14, 26 + i * 24, r[0], 10, TC.ink, "start", 700)}<rect x="48" y="${14 + i * 24}" width="${w}" height="16" fill="${TC.cyan}44" stroke="${TC.cyan}" stroke-width="1.2"/>${tfText(54 + w, 26 + i * 24, r[1] + " hosts", 8, TC.mute)}`;
        }).join("")) },
      { t: "DHCP and DNS", say: "DHCP is a four-message handshake called DORA. If a device ends up on 169.254, one of those messages never came back. DNS is the phone book: no record, no name.",
        pts: ["DORA: Discover → Offer → Request → Acknowledge.", "A full scope or a broken path to the server → 169.254 (APIPA).", "Printers and servers get reservations, never random statics in the pool.", "DNS records: A (name → IPv4), AAAA (IPv6), PTR (IP → name), CNAME (alias), MX (mail)."],
        fig: tfSvg(tfPc(20, 14) + tfText(14, 46, "client", 7, TC.mute) + tfBox(244, 14, 64, 24, TC.cyan, "DHCP srv") +
          `<line x1="33" y1="50" x2="33" y2="140" stroke="${TC.line}" stroke-dasharray="2 3"/><line x1="276" y1="40" x2="276" y2="140" stroke="${TC.line}" stroke-dasharray="2 3"/>` +
          tfArrow(36, 62, 272, 62, TC.yel) + tfText(150, 58, "D · Discover (broadcast)", 7, TC.yel, "middle") +
          tfArrow(272, 84, 36, 84, TC.grn) + tfText(150, 80, "O · Offer 10.30.3.45", 7, TC.grn, "middle") +
          tfArrow(36, 106, 272, 106, TC.yel) + tfText(150, 102, "R · Request that one", 7, TC.yel, "middle") +
          tfArrow(272, 128, 36, 128, TC.grn) + tfText(150, 124, "A · Ack: IP, mask, gw, DNS, lease", 7, TC.grn, "middle")) },
      { t: "Switching and VLANs", say: "A VLAN splits one switch into separate networks. Users, phones and printers each get their own. Ports to people are access ports; links between switches are trunks that carry the tags.",
        pts: ["Access port: one data VLAN (plus a voice VLAN for a phone).", "Trunk (802.1Q): many VLANs between switches, each frame tagged.", "The trunk's allowed list decides which VLANs can cross it.", "Phones learn the voice VLAN from the switch via LLDP-MED or CDP."],
        fig: tfSvg(`<rect x="14" y="70" width="292" height="34" rx="3" fill="#1a2433" stroke="${TC.mute}" stroke-width="1.5"/>` +
          Array.from({ length: 12 }, (_, i) => { const c = i < 6 ? TC.blu : i < 9 ? TC.grn : TC.org; return `<rect x="${24 + i * 20}" y="80" width="14" height="14" fill="${c}55" stroke="${c}" stroke-width="1.2"/>`; }).join("") +
          `<rect x="270" y="80" width="26" height="14" fill="${TC.vio}55" stroke="${TC.vio}" stroke-width="1.5"/>` +
          tfText(68, 120, "VLAN 30 data", 7, TC.blu, "middle") + tfText(158, 120, "120 voice", 7, TC.grn, "middle") + tfText(218, 120, "40 print", 7, TC.org, "middle") +
          tfArrow(283, 78, 283, 40, TC.vio) + tfBox(222, 12, 90, 26, TC.vio, "CORE", "trunk: 30,40,120") + tfText(14, 30, "access ports ↓  ·  trunk ↗", 8, TC.ink, "start", 700)) },
      { t: "Loops and spanning tree", say: "Plug both ends of a cable into the same network and broadcasts multiply until the floor falls over. Spanning tree blocks the extra path. BPDU guard shuts a port the second someone plugs a switch into it.",
        pts: ["A loop = a broadcast storm: everything slows, then stops.", "STP (spanning tree) blocks redundant paths on purpose.", "BPDU guard + storm control on access ports: tripwires.", "No unmanaged switches under desks. Ever."],
        fig: tfSvg(tfBox(130, 10, 60, 26, TC.grn, "CORE", "root bridge") + tfBox(40, 96, 60, 26, TC.yel, "SW-A") + tfBox(220, 96, 60, 26, TC.yel, "SW-B") +
          `<line x1="150" y1="36" x2="80" y2="96" stroke="${TC.grn}" stroke-width="2"/><line x1="170" y1="36" x2="240" y2="96" stroke="${TC.grn}" stroke-width="2"/><line x1="100" y1="110" x2="220" y2="110" stroke="${TC.red}" stroke-width="2" stroke-dasharray="5 4"/>` +
          tfText(160, 104, "BLOCKED by STP", 8, TC.red, "middle", 700) + tfText(160, 140, "redundant path, but never a loop", 7, TC.mute, "middle")) },
      { t: "Cabling, PoE and Wi-Fi", say: "Copper runs a hundred meters, total. Power over Ethernet is a budget, not a promise. And in 2.4 gigahertz there are only three channels that don't step on each other: one, six and eleven.",
        pts: ["Cat6 copper: 100 m max for the whole channel, patch cords included.", "PoE: 802.3af 15.4 W · 802.3at (PoE+) 30 W · 802.3bt 60–90 W per port at the switch.", "Duplex must match: CRC errors one end + late collisions the other = mismatch.", "2.4 GHz: use 1, 6, 11 at 20 MHz. Push clients to 5 and 6 GHz."],
        fig: tfSvg(tfText(12, 16, "PoE per port (W)", 8, TC.mute, "start", 700) +
          [["af", 15.4, TC.cyan], ["at", 30, TC.grn], ["bt", 90, TC.org]].map((r, i) => `${tfText(12, 36 + i * 18, r[0], 8, r[2], "start", 700)}<rect x="28" y="${26 + i * 18}" width="${Math.round(r[1] * 1.1)}" height="12" fill="${r[2]}55" stroke="${r[2]}"/>${tfText(34 + Math.round(r[1] * 1.1), 36 + i * 18, r[1] + "", 7, TC.ink)}`).join("") +
          tfText(180, 16, "2.4 GHz channels", 8, TC.mute, "start", 700) +
          [1, 6, 11].map((ch, i) => `<path d="M ${182 + i * 42} 92 Q ${202 + i * 42} 28 ${222 + i * 42} 92" fill="${[TC.blu, TC.grn, TC.yel][i]}33" stroke="${[TC.blu, TC.grn, TC.yel][i]}" stroke-width="1.5"/>${tfText(202 + i * 42, 106, "ch " + ch, 8, TC.ink, "middle", 700)}`).join("") +
          tfText(12, 120, "copper: 100 m total", 8, TC.ink, "start", 700) + `<rect x="12" y="126" width="150" height="5" fill="${TC.org}"/>`) },
      { t: "Change discipline (the Network+ way)", say: "Network+ adds a step: plan the fix AND think about what it could break, then implement or escalate. Back up the config before you touch it, label both ends, and update the docs before you go home.",
        pts: ["Seven steps: identify · theory · test · plan (and its effects) · implement or escalate · verify + prevent · document.", "Back up the running config before any change; save it after.", "Label both ends of every cable; update the port map and IPAM.", "No change without a window, a backout plan and a notice."],
        fig: tfSteps([["Identify"], ["Theory"], ["Test"], ["Plan +", "effects"], ["Do it /", "escalate"], ["Verify +", "prevent"], ["Document"]], [TC.cyan, TC.blu, TC.vio, TC.org, TC.pnk, TC.grn, TC.yel]) }
    ],
    quiz: [
      { q: "You need a subnet for about 90 phones. Smallest prefix that fits?", s: 2,
        o: [["/25 (126 usable hosts)", 1], ["/26 (62 usable hosts)", 0], ["/27 (30 usable hosts)", 0]],
        why: "2^(32−25) − 2 = 126. A /26 tops out at 62." },
      { q: "Which address is the default gateway for 10.30.3.45/24 in our design?", s: 1,
        o: [["10.30.3.1, the router's address on that subnet", 1], ["10.30.30.1", 0], ["255.255.255.0", 0]],
        why: "The gateway has to be on your own subnet. 255.255.255.0 is the mask, not an address." },
      { q: "A desk phone powers up but gets an address from the DATA range and never registers. Most likely:", s: 4,
        o: [["Its switch port has no voice VLAN configured", 1], ["Not enough PoE", 0], ["The DNS server is down", 0]],
        why: "Powered = PoE is fine. Wrong range = it landed in the data VLAN because the port has no voice VLAN." },
      { q: "A link between two switches must carry the data, voice and printer VLANs. It's a:", s: 4,
        o: [["Trunk (802.1Q)", 1], ["Access port", 0], ["Console port", 0]],
        why: "Trunks carry many VLANs with tags. Access ports carry one (plus voice)." },
      { q: "An access point needs up to 25.5 W at the device. Minimum PoE standard on the port?", s: 6,
        o: [["802.3at (PoE+)", 1], ["802.3af (PoE)", 0], ["802.11ax", 0]],
        why: "802.3af tops out at 15.4 W at the switch. PoE+ gives 30 W at the switch, 25.5 W at the device." },
      { q: "Which three 2.4 GHz channels don't overlap?", s: 6,
        o: [["1, 6 and 11", 1], ["1, 2 and 3", 0], ["Every channel is separate", 0]],
        why: "Only 1, 6 and 11. Anything in between interferes with its neighbors." },
      { q: "What stops a cable plugged into two wall jacks from taking down the floor?", s: 5,
        o: [["Spanning tree with BPDU guard (and storm control) on access ports", 1], ["Rebooting the switch every time", 0], ["Turning spanning tree off", 0]],
        why: "STP blocks loops; BPDU guard shuts the port the moment someone plugs a switch or a loop in." },
      { q: "Before you change a switch, you:", s: 7,
        o: [["Back up its running config (and know your backout plan)", 1], ["Factory-reset it to start clean", 0], ["Just start typing, it's quicker", 0]],
        why: "The running config is the live truth. Save a copy before you touch it, and keep a way back." }
    ]
  },

  3: {
    title: "SOC Orientation: Detect, Contain, Recover", host: "omar", hostName: "Omar", hostRole: "Incident Response Lead",
    where: "IR war room · Floor 7", pass: 6, lingo: ["siem", "tpfp", "contain"],
    slides: [
      { t: "Why there's a SOC", say: "Security protects three things: keeping secrets secret, keeping data true, and keeping systems up. Confidentiality, integrity, availability. The SOC watches all three, all day.",
        pts: ["Confidentiality: only the right people can see it.", "Integrity: nobody changed it who shouldn't have.", "Availability: it's up when people need it.", "The SOC watches the logs from everything, 24/7, and responds."],
        fig: tfSvg(`<polygon points="160,14 270,128 50,128" fill="${TC.cyan}18" stroke="${TC.cyan}" stroke-width="2"/>` + tfText(160, 30, "CONFIDENTIALITY", 9, TC.yel, "middle", 700) +
          tfText(56, 142, "INTEGRITY", 9, TC.grn, "start", 700) + tfText(264, 142, "AVAILABILITY", 9, TC.blu, "end", 700) + tfText(160, 96, "SOC", 16, TC.ink, "middle", 700)) },
      { t: "Logs → alerts → incidents", say: "Millions of events become hundreds of alerts become a handful of incidents. Your job is triage: is this alert a real threat, a true positive, or harmless noise, a false positive? And how bad?",
        pts: ["The SIEM collects logs from everything and correlates them.", "Triage: true positive (real) or false positive (harmless)?", "Check context: is it expected? Approved? Seen before?", "Severity drives speed. Document why you closed what you closed."],
        fig: tfSvg(`<polygon points="20,14 300,14 230,62 90,62" fill="${TC.blu}22" stroke="${TC.blu}" stroke-width="1.5"/>` + tfText(160, 34, "2,400,000 events / day", 9, TC.ink, "middle", 700) +
          `<polygon points="90,66 230,66 196,102 124,102" fill="${TC.yel}22" stroke="${TC.yel}" stroke-width="1.5"/>` + tfText(160, 88, "180 alerts", 9, TC.yel, "middle", 700) +
          `<polygon points="124,106 196,106 176,138 144,138" fill="${TC.red}22" stroke="${TC.red}" stroke-width="1.5"/>` + tfText(160, 126, "2", 9, TC.red, "middle", 700) + tfText(206, 126, "incidents", 8, TC.red, "start", 700)) },
      { t: "How attacks really start", say: "It's rarely a hacker in a hoodie breaking crypto. It's a phish, a push-bombed MFA prompt, a reused password, or an unpatched box facing the internet.",
        pts: ["Phishing: a link or attachment that steals a password or drops malware.", "MFA fatigue: push prompts until someone taps Approve.", "Password spraying: one common password tried against many accounts.", "Exposed, unpatched services and social engineering by phone or in person."],
        fig: tfSvg([["PHISH", "links · files", TC.red], ["MFA", "fatigue", TC.org], ["SPRAY", "weak passwords", TC.yel], ["EXPOSED", "unpatched", TC.vio], ["PEOPLE", "calls · USBs", TC.pnk]].map((c, i) =>
          tfBox(8 + i * 62, 46, 56, 50, c[2], c[0], c[1])).join("") + tfText(160, 128, "initial access, most of the time", 8, TC.mute, "middle", 700)) },
      { t: "The incident response lifecycle", say: "NIST's 2025 guide ties incident response to the Cybersecurity Framework: prepare and protect, detect, respond, recover, and improve. On the floor we say it simply: detect, contain, eradicate, recover, learn.",
        pts: ["Prepare (Govern · Identify · Protect): plans, tools, backups, training.", "Detect and analyze: triage, scope, decide severity.", "Respond: contain first, then eradicate the foothold.", "Recover, then lessons learned: improvements feed back into preparation."],
        fig: tfSvg([["PREPARE", TC.cyan], ["DETECT", TC.yel], ["CONTAIN", TC.org], ["ERADICATE", TC.red], ["RECOVER", TC.grn], ["LEARN", TC.vio]].map((c, i) => {
          const a = -Math.PI / 2 + i * Math.PI / 3, x = 160 + Math.cos(a) * 100, y = 75 + Math.sin(a) * 52;
          const b = a + Math.PI / 3, x2 = 160 + Math.cos(b) * 100, y2 = 75 + Math.sin(b) * 52;
          return tfArrow(x + (x2 - x) * 0.32, y + (y2 - y) * 0.32, x + (x2 - x) * 0.68, y + (y2 - y) * 0.68, TC.mute) + tfBox(x - 34, y - 11, 68, 22, c[1], c[0]);
        }).join("") + tfText(160, 79, "NIST SP 800-61r3", 8, TC.mute, "middle", 700)) },
      { t: "Contain without destroying evidence", say: "Contain first, but don't torch the crime scene. Memory disappears when you pull the plug. Isolate through EDR, collect the most fragile evidence first, hash it, and log who touched it.",
        pts: ["Order of volatility: memory → network state → disk → logs/backups.", "Isolate with EDR (on, but cut off) instead of pulling power.", "Hash evidence (e.g., SHA-256) and work from verified copies.", "Chain of custody: every hand-off signed, timed and logged."],
        fig: tfStack([["MEMORY", "gone on power-off · collect FIRST", TC.red], ["NETWORK", "connections · sessions", TC.org], ["DISK", "image it, hash it", TC.yel], ["LOGS", "SIEM · cloud audit", TC.grn], ["BACKUPS", "least volatile", TC.blu]],
          tfText(166, 120, "isolate ≠ unplug", 9, TC.cyan, "start", 700)) },
      { t: "Vulnerability management", say: "CVSS tells you how bad a flaw could be. It doesn't tell you how likely it is to hurt you. Is it being exploited right now? Is the system exposed? Then you know what to patch first.",
        pts: ["CVSS = severity (0–10), not risk.", "CISA's Known Exploited Vulnerabilities (KEV) list = patch first.", "Exposure and criticality: internet-facing beats a closet box.", "Patch, verify the fix with a rescan, document exceptions."],
        fig: tfSvg(tfText(160, 14, "EXPLOITED IN THE WILD (KEV)? →", 8, TC.mute, "middle", 700) + tfText(14, 80, "CVSS", 8, TC.mute, "start", 700) +
          [[["watch", TC.grn], ["patch soon", TC.yel]], [["patch soon", TC.yel], ["PATCH NOW", TC.red]]].map((row, j) => row.map((c, i) =>
            `<rect x="${60 + i * 126}" y="${24 + (1 - j) * 58}" width="120" height="52" fill="${c[1]}26" stroke="${c[1]}" stroke-width="1.5"/>${tfText(120 + i * 126, 54 + (1 - j) * 58, c[0], 10, c[1], "middle", 700)}`).join("")).join("") +
          tfText(48, 52, "high", 7, TC.ink, "end") + tfText(48, 110, "low", 7, TC.ink, "end") + tfText(120, 146, "no", 7, TC.ink, "middle") + tfText(246, 146, "yes", 7, TC.ink, "middle")) },
      { t: "Identity is the perimeter now", say: "Most incidents run through an account. Least privilege, regular access reviews, MFA that can't be tapped by accident, and phishing-resistant keys where it matters.",
        pts: ["Least privilege and just-in-time admin: access that expires.", "Access reviews: remove what nobody can justify (yes, even yours).", "MFA number matching stops accidental approvals.", "FIDO2 security keys are phishing-resistant. Revoke sessions, not just passwords."],
        fig: tfSvg([["LEAST", "privilege", TC.yel], ["REVIEW", "access", TC.cyan], ["NUMBER", "matching", TC.grn], ["FIDO2", "keys", TC.vio]].map((c, i) =>
          tfBox(10 + i * 77, 40, 70, 60, c[2], c[0], c[1])).join("") + tfText(160, 128, "revoke sessions, not just passwords", 8, TC.mute, "middle", 700)) },
      { t: "Communicate like an incident pro", say: "One bridge, one commander, one case log. Facts with a time for the next update. Legal and Comms own anything that leaves the building. And afterwards, a blameless review with real owners for every action.",
        pts: ["Incident commander runs the bridge; a scribe keeps the case log.", "Updates: what we know, what we don't, next update time.", "Legal + Comms own external statements and notification decisions.", "Lessons learned: blameless, specific actions, each with an owner."],
        fig: tfSvg(tfBox(118, 10, 84, 30, TC.org, "COMMANDER", "runs the bridge") +
          [["TECH LEADS", TC.cyan], ["SCRIBE", TC.yel], ["COMMS", TC.grn], ["LEGAL", TC.vio]].map((c, i) => tfArrow(160, 40, 44 + i * 77, 92, TC.mute) + tfBox(10 + i * 77, 94, 70, 28, c[1], c[0])).join("") +
          tfText(160, 140, "facts · next update time · no guessing", 8, TC.mute, "middle", 700)) }
    ],
    quiz: [
      { q: "An alert fires for an admin sign-in from a new country. The admin is on the red team, testing under a signed authorization. That alert is:", s: 1,
        o: [["Expected, authorized activity: verify the authorization, close it with notes, and tune the rule", 1], ["An automatic incident: disable the account", 0], ["Noise: close it without checking", 0]],
        why: "Triage means checking context. Verified + documented beats both panic and blind closing." },
      { q: "Someone got five MFA push prompts at 6 AM and approved one to make them stop. That's:", s: 2,
        o: [["MFA fatigue: the attacker likely has the password and now a session", 1], ["A harmless glitch", 0], ["A false positive", 0]],
        why: "Push-bombing until someone taps Approve is a real, common attack. Report, revoke sessions, reset." },
      { q: "In the response, what comes BEFORE eradication?", s: 3,
        o: [["Containment: stop the spread first", 1], ["Recovery from backup", 0], ["Lessons learned", 0]],
        why: "Contain, then eradicate, then recover. Cleaning while it's still spreading is a losing race." },
      { q: "A compromised laptop is still running. Best way to contain it?", s: 4,
        o: [["Isolate it through EDR so it stays powered on (memory intact) but can't talk to the network", 1], ["Pull the power cord", 0], ["Leave it alone until tomorrow", 0]],
        why: "Memory is the most volatile evidence. Isolate, don't unplug." },
      { q: "Order of volatility: which do you collect first?", s: 4,
        o: [["Memory (RAM)", 1], ["Backups", 0], ["Disk image", 0]],
        why: "RAM disappears on power-off. Collect the most fragile evidence first." },
      { q: "Two vulnerabilities: a CVSS 9.8 on an isolated lab box, and a 7.5 on an internet-facing server that's on CISA's KEV list. Patch first:", s: 5,
        o: [["The 7.5 on the KEV list: exploited in the wild and exposed", 1], ["The 9.8, highest score wins", 0], ["Whichever is easier", 0]],
        why: "CVSS is severity. Exploitation (KEV) plus exposure is risk. Risk sets the order." },
      { q: "You reset a compromised user's password. What else is essential?", s: 6,
        o: [["Revoke their active sessions/tokens and check MFA methods and mailbox rules", 1], ["Nothing, the password's changed", 0], ["Delete the account", 0]],
        why: "A stolen session token survives a password reset. Revoke sessions and remove anything the attacker added." },
      { q: "Mid-incident, a director asks if they got in. A good update:", s: 7,
        o: [["What's confirmed, what isn't yet, and when the next update comes", 1], ["'It's nothing, don't worry'", 0], ["Your best guess, so they feel informed", 0]],
        why: "Facts plus a next-update time. Guesses become rumors, and 'nothing' becomes a credibility problem." }
    ]
  }
};

// What each piece of work was taught by: id -> [week, slide index].
export const TAUGHT = {
  // Week 1 tickets, side quests, walk-ups, pages
  monitor: [1, 3], "internet-down": [1, 4], dns: [1, 4], printer: [1, 5], slow: [1, 2], permissions: [1, 6], change: [1, 2],
  unplugged: [1, 3], monitorStandby: [1, 3], printerInk: [1, 5], usbDrop: [1, 6],
  d1_reset: [1, 6], p1_priority: [1, 1], p1_pwemail: [1, 6], p1_newstarter: [1, 6], p2_p1: [1, 1],
  // Week 2
  "dhcp-exhaust": [2, 3], duplex: [2, 6], "voice-vlan": [2, 4], "poe-budget": [2, 6], gateway: [2, 1], "wifi-channel": [2, 6],
  n4_minisw: [2, 5], n4_scope: [2, 0], n4_corner: [2, 6], n5_notone: [2, 4], n5_printer: [2, 4], n6_10g: [2, 6], n6_label: [2, 7],
  pg4_mac: [2, 0], pg4_reserve: [2, 3], pg5_storm: [2, 5], pg5_dns: [2, 3], pg5_backout: [2, 7], g_unident: [2, 4],
  loop: [2, 5], ap: [2, 6], printer_hs: [2, 4],
  // Week 3
  "phish-ir": [3, 2], "rogue-ap": [3, 2], lateral: [3, 1], ransomware: [3, 3], privesc: [3, 6],
  s7_push: [3, 2], s7_mailbox: [3, 2], s7_travel: [3, 6], s8_fan: [3, 4], s8_unplug: [3, 4], s8_wipe: [3, 3], s8_social: [3, 7], s8_status: [3, 7], s9_push: [3, 6],
  pg7_wes: [3, 1], pg7_kev: [3, 5], pg8_board: [3, 7], pg8_legal: [3, 4], pg9_close: [3, 3],
  beacon: [3, 4], purge: [3, 2], spray: [3, 2]
};

export function trainingDone(w) { const d = DD(); return !!(d && d.quiz && d.quiz[w] && d.quiz[w].passed); }

// A collapsible "you learned this" chip for tickets, walk-ups and tasks.
export function taughtChip(id) {
  const t = TAUGHT[id]; if (!t || !trainingDone(t[0])) return "";
  const tr = TRAINING[t[0]], s = tr.slides[t[1]];
  return `<details class="taught"><summary>\u{1F4D8} From ${esc(tr.hostName)}'s training: <b>${esc(s.t)}</b></summary>
    <ul>${s.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></details>`;
}
// Same, for a slide picked directly (task flows).
export function slideChip(w, i) {
  if (!trainingDone(w)) return "";
  const tr = TRAINING[w], s = tr.slides[i];
  return `<details class="taught"><summary>\u{1F4D8} From ${esc(tr.hostName)}'s training: <b>${esc(s.t)}</b></summary>
    <ul>${s.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></details>`;
}

// ---- the presentation -----------------------------------------------------------
// openTraining(w, onDone, { rewatch }) plays the slides, then the quiz.
export function openTraining(w, onDone, opts = {}) {
  const tr = TRAINING[w]; if (!tr) { if (onDone) onDone(); return; }
  const S = CORE.S;
  const sprite = S.npcSprite(tr.host);
  let i = 0, typer = null;
  const reduce = document.documentElement.getAttribute("data-motion") === "reduced";
  panel(`▶ ${tr.title}`, `${tr.hostName} · ${tr.hostRole} · ${tr.where}`, sprite);
  const host = pBody();
  const deck = document.createElement("div"); deck.className = "deck"; host.appendChild(deck);
  show();

  function show() {
    clearInterval(typer);
    const s = tr.slides[i], n = tr.slides.length;
    const mins = Math.floor((i * 95 + 12) / 60), secs = String((i * 95 + 12) % 60).padStart(2, "0");
    deck.innerHTML = `<div class="deck-screen">
        <div class="deck-bar"><span class="deck-rec">● REC</span><span>${esc(tr.title.toUpperCase())}</span><span>${String(mins).padStart(2, "0")}:${secs}</span></div>
        <div class="deck-title"><span>${i + 1}/${n}</span> ${esc(s.t)}</div>
        <div class="deck-fig">${s.fig}</div>
      </div>
      <div class="deck-say"><canvas width="40" height="40" class="avatar-canvas"></canvas><div><b>${esc(tr.hostName)}:</b> <span class="deck-line"></span></div></div>
      <ul class="deck-pts">${s.pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      <div class="deck-nav"><button class="act ghost deck-back"${i === 0 ? " disabled" : ""}>◀ Back</button>
        <div class="deck-dots">${tr.slides.map((_, k) => `<span class="${k === i ? "on" : k < i ? "seen" : ""}"></span>`).join("")}</div>
        <button class="primary-btn act deck-next">${i < n - 1 ? "Next ▶" : opts.rewatch ? "Done" : "\u{1F4DD} Take the quiz"}</button></div>
      ${!opts.rewatch && i < n - 1 && S.hasFlag("seenSlides_" + w) ? `<button class="rcpt-ask deck-skip">Seen it already: skip to the quiz</button>` : ""}`;
    if (i === n - 1) S.setFlag("seenSlides_" + w);
    try { drawSpritePreview(deck.querySelector("canvas"), sprite, "down", 1.2); } catch { /* ignore */ }
    const line = deck.querySelector(".deck-line");
    if (reduce) line.textContent = s.say;
    else { let k = 0; typer = setInterval(() => { k += 3; line.textContent = s.say.slice(0, k); if (k >= s.say.length) clearInterval(typer); }, 16); }
    deck.querySelector(".deck-back").onclick = () => { if (i > 0) { i--; show(); } };
    const nx = deck.querySelector(".deck-next");
    nx.onclick = () => {
      clearInterval(typer);
      if (i < n - 1) { i++; show(); CORE.sfx && CORE.sfx("tick"); return; }
      if (opts.rewatch) { closePanel(); if (onDone) onDone(); return; }
      quiz(tr, w, onDone);
    };
    const sk = deck.querySelector(".deck-skip"); if (sk) sk.onclick = () => { clearInterval(typer); quiz(tr, w, onDone); };
    setTimeout(() => { try { nx.focus(); } catch { /* ignore */ } }, 30);
    try { host.closest(".modal").scrollTop = 0; } catch { /* ignore */ }
  }
}

function quiz(tr, w, onDone) {
  const d = DD();
  const Q = shuffleArr(tr.quiz.map((q, k) => ({ ...q, k })));
  let idx = 0, first = 0;
  const missed = [];
  pClear();
  const box = pAdd("", "tq");
  ask();

  function ask(retry) {
    const list = retry || Q;
    const q = list[idx];
    const opts = shuffleArr(q.o);
    box.innerHTML = `<div class="quiz-progress-row"><span>${retry ? "Retake" : "Question"} ${idx + 1} of ${list.length}</span><span class="quiz-cert">${esc(tr.hostName)}'s quiz · pass ${tr.pass}/${tr.quiz.length}</span></div>
      <div class="quiz-question">${esc(q.q)}</div><div class="btn-column tq-opts"></div><div class="tq-fb"></div>`;
    const col = box.querySelector(".tq-opts"), fb = box.querySelector(".tq-fb");
    opts.forEach((o) => {
      const b = document.createElement("button"); b.className = "dx-btn opt"; b.textContent = o[0];
      b.onclick = () => {
        col.querySelectorAll("button").forEach((x) => { x.disabled = true; if (opts[[...col.children].indexOf(x)][1]) x.classList.add("correct"); });
        const ok = !!o[1];
        if (!ok) b.classList.add("wrong");
        if (!retry) { recordAnswer(ok ? 2 : 0, true); if (ok) first++; else missed.push(q); }
        blip(ok);
        const sl = tr.slides[q.s];
        fb.innerHTML = `<div class="banner ${ok ? "ok" : "no"}"><b>${ok ? "Correct." : "Not quite."}</b> ${esc(q.why)}</div>
          <div class="set-hint">\u{1F4D8} Slide ${q.s + 1}: ${esc(sl.t)}</div>`;
        const last = idx === list.length - 1;
        const nb = document.createElement("button"); nb.className = "primary-btn act"; nb.textContent = last ? "See my score →" : "Next question →";
        nb.onclick = () => {
          if (!last) { idx++; ask(retry); return; }
          if (retry) { const still = retry.filter((x) => !x._ok); if (still.length) { idx = 0; ask(still); } else finish(); return; }
          results();
        };
        if (retry && ok) q._ok = true;
        fb.appendChild(nb); setTimeout(() => { try { nb.focus(); } catch { /* ignore */ } }, 30);
      };
      col.appendChild(b);
    });
  }

  function results() {
    const total = tr.quiz.length, passed = first >= tr.pass;
    d.quiz[w] = { first, total, passed, at: Date.now() }; ddSave();
    box.innerHTML = `<div class="tq-score ${passed ? "ok" : "no"}"><div class="tq-big">${first}/${total}</div><div>${passed ? "PASSED" : `Need ${tr.pass} to pass`}</div></div>`;
    if (first === total) { award("student"); addRep(1); box.insertAdjacentHTML("beforeend", `<div class="banner ok">${esc(tr.hostName)}: “Perfect. I'm putting that on the fridge.” <b>(+1 rep)</b></div>`); }
    if (!missed.length) { finish(); return; }
    box.insertAdjacentHTML("beforeend", `<p style="margin:8px 0;">${esc(tr.hostName)}: “${passed ? "You passed. But let's lock in the ones you missed." : "Close. Let's go over the ones you missed, then try them again."}”</p>
      <div class="tq-review">${[...new Set(missed.map((q) => q.s))].map((s) => `<div class="tq-rv"><b>\u{1F4D8} ${esc(tr.slides[s].t)}</b><ul>${tr.slides[s].pts.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>`).join("")}</div>`);
    const b = document.createElement("button"); b.className = "primary-btn act"; b.textContent = `\u{1F501} Retake the ${missed.length} I missed`;
    b.onclick = () => { idx = 0; ask(missed); };
    box.appendChild(b); setTimeout(() => { try { b.focus(); } catch { /* ignore */ } }, 30);
  }

  function finish() {
    d.quiz[w] = Object.assign(d.quiz[w] || { first, total: tr.quiz.length }, { passed: true }); ddSave();
    for (const l of tr.lingo || []) hearLingo(l);
    CORE.S.addXp && CORE.S.addXp(15);
    CORE.S.setFlag("trained_" + w);
    addNote("training", "\u{1F393}", `${tr.hostName}'s training: ${tr.title} (quiz ${d.quiz[w].first}/${d.quiz[w].total} first try).`);
    box.insertAdjacentHTML("beforeend", `<div class="banner kit">\u{1F393} <b>Training complete.</b> Watch for <b>\u{1F4D8} From your training</b> on tickets and tasks this week: that's where this pays off. Rewatch it any time from the Field Companion.</div>`);
    const b = document.createElement("button"); b.className = "primary-btn act"; b.textContent = "Back to work →";
    b.onclick = () => { closePanel(); ping("\u{1F393}", "Training complete", tr.title); if (onDone) onDone(); };
    box.appendChild(b); setTimeout(() => { try { b.focus(); } catch { /* ignore */ } }, 30);
  }
}

// Field Companion: rewatch any training you've finished.
export function trainingLibraryHtml() {
  const d = DD(); if (!d) return "";
  const rows = Object.entries(TRAINING).map(([w, tr]) => {
    const q = d.quiz && d.quiz[w];
    return `<div class="find-card ${q && q.passed ? "got" : "locked"}"><div class="find-icon">${q && q.passed ? "\u{1F393}" : "\u{1F512}"}</div>
      <div class="find-text"><div class="find-name">${esc(tr.title)}</div><div class="find-note">${q && q.passed ? `Quiz ${q.first}/${q.total} first try · ` : ""}${esc(tr.hostName)} · ${esc(WEEKS[w].title)}</div>
      ${q && q.passed ? `<button class="act ghost tr-rewatch" data-w="${w}">▶ Rewatch</button>` : ""}</div></div>`;
  }).join("");
  return `<div class="scenario-section-label" style="margin-top:12px;">Training library</div><div class="find-grid">${rows}</div>`;
}
