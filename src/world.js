// World data: the map, the rooms, the people, the things you can interact with.
//
// The game now has TWO playable floors, reached by an elevator:
//   floor3 = Help Desk (fundamentals)   floor7 = Security Operations (advanced)
//
// MAP / ROOMS / NPCS / PROPS / PLAYER_START / LOC_LABEL / FLOOR_ID are exported
// as `let` and reassigned by setFloor(id). ES-module live bindings mean the
// renderer and engine see the swap automatically \u2014 no per-floor branching.

export const TILE = 32;
export const MAP_W = 30;
export const MAP_H = 22;

// Tile codes:
//   W wall   . office floor   o open-plan carpet   e cool/exam floor
//   D desk (solid)   c chair (walkable)   S server rack (solid)
// The map is built programmatically so every row is guaranteed uniform width.
function blank() {
  const m = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) row.push("W");
    m.push(row);
  }
  return m;
}
function carve(m, x0, y0, w, h, tile) {
  for (let y = y0; y < y0 + h; y++)
    for (let x = x0; x < x0 + w; x++)
      if (x > 0 && y > 0 && x < MAP_W - 1 && y < MAP_H - 1) m[y][x] = tile;
}
function door(m, x, y) { if (m[y] && m[y][x] !== undefined) m[y][x] = "."; }
function stamp(m, x, y, tile) { if (m[y] && m[y][x] !== undefined) m[y][x] = tile; }

// Shared office skeleton. Both floors share the proven, fully-reachable layout;
// floor 7 only re-skins non-blocking floor tiles for a data-center feel, so its
// walkability is identical to floor 3.
function buildOfficeMap() {
  const m = blank();
  // Top band (rows 1-6)
  carve(m, 1, 1, 5, 6, ".");     // lobby / IT room
  carve(m, 7, 1, 12, 6, ".");    // reception / SOC bullpen
  carve(m, 20, 1, 8, 6, "e");    // open desks / threat intel
  // Middle band (rows 8-13)
  carve(m, 1, 8, 5, 6, ".");     // print room / network closet
  carve(m, 7, 8, 12, 6, "o");    // open desks 2 / analyst pit
  carve(m, 20, 8, 8, 6, "o");    // manager / wireless lab
  // Bottom band (rows 15-20)
  carve(m, 1, 15, 5, 6, ".");    // server closet / data center
  carve(m, 7, 15, 9, 6, "e");    // conf room / IR war room
  carve(m, 17, 15, 11, 6, "o");  // accounting / red-team lab

  // Doorways
  door(m, 6, 3);  door(m, 6, 4);    door(m, 19, 3); door(m, 19, 4);
  door(m, 6, 10); door(m, 6, 11);   door(m, 19, 10); door(m, 19, 11);
  door(m, 6, 18); door(m, 6, 17);   door(m, 16, 18); door(m, 16, 17);
  door(m, 3, 7);  door(m, 4, 7);    door(m, 12, 7); door(m, 13, 7);  door(m, 24, 7);  door(m, 25, 7);
  door(m, 3, 14); door(m, 4, 14);   door(m, 11, 14); door(m, 12, 14); door(m, 24, 14); door(m, 25, 14);

  // Furniture (solid: D, S \u00b7 walkable: c)
  stamp(m, 2, 2, "D"); stamp(m, 3, 2, "D"); stamp(m, 2, 4, "c");
  for (let x = 9; x <= 15; x++) stamp(m, x, 2, "D");
  stamp(m, 9, 4, "c"); stamp(m, 15, 4, "c");
  stamp(m, 22, 2, "D"); stamp(m, 26, 2, "D"); stamp(m, 22, 5, "D"); stamp(m, 26, 5, "D");
  stamp(m, 2, 9, "D");
  stamp(m, 9, 9, "D"); stamp(m, 12, 9, "D"); stamp(m, 15, 9, "D");
  stamp(m, 9, 12, "D"); stamp(m, 15, 12, "D");
  stamp(m, 22, 9, "D"); stamp(m, 25, 9, "D"); stamp(m, 25, 12, "c");
  stamp(m, 2, 16, "S"); stamp(m, 4, 16, "S"); stamp(m, 2, 19, "S"); stamp(m, 4, 19, "S");
  for (let x = 9; x <= 13; x++) stamp(m, x, 17, "D");
  stamp(m, 9, 19, "c"); stamp(m, 13, 19, "c");
  stamp(m, 19, 16, "D"); stamp(m, 26, 16, "D"); stamp(m, 19, 19, "D"); stamp(m, 26, 19, "D");

  return m.map((row) => row.join(""));
}

// Cosmetic only: recolor open carpet to "cool" data-center floor for floor 7.
// Touches NON-blocking floor glyphs only, so walkability never changes.
function coolifyFloor(rows) {
  return rows.map((row) =>
    row.split("").map((ch) => (ch === "o" ? "e" : ch === "." ? "e" : ch)).join("")
  );
}

const OFFICE = buildOfficeMap();
const SOC = coolifyFloor(OFFICE);

const BLOCKING = new Set(["W", "D", "S"]);

export const PLAYER_SPRITE = { body:"#2E6FB0", body2:"#1B4E84", accent:"#FCDE5A", hair:"#2C2C2A", skin:"#C9926B" };

// ---- FLOOR 3 rooms / people / props (the original Help Desk) --------------
const ROOMS3 = [
  { name: "IT room",       x: 1,  y: 1,  w: 5,  h: 6 },
  { name: "Reception",     x: 7,  y: 1,  w: 12, h: 6 },
  { name: "Open desks",    x: 20, y: 1,  w: 8,  h: 6 },
  { name: "Print room",    x: 1,  y: 8,  w: 5,  h: 6 },
  { name: "Open desks 2",  x: 7,  y: 8,  w: 12, h: 6 },
  { name: "Manager",       x: 20, y: 8,  w: 8,  h: 6 },
  { name: "Server closet", x: 1,  y: 15, w: 5,  h: 6 },
  { name: "Conf. room",    x: 7,  y: 15, w: 9,  h: 6 },
  { name: "Accounting",    x: 17, y: 15, w: 11, h: 6 }
];

const NPCS3 = [
  { id: "karen", name: "Karen", role: "Receptionist", x: 13, y: 4, ticket: "monitor",
    sprite: { body:"#D4537E", body2:"#993556", accent:"#FCDE5A", hair:"#6B4A2A", skin:"#E0B080" },
    chat: ["Thanks for fixing my screen last week.","Phones have been quiet today, knock on wood.","Don't roll your chair over your cables. Lesson learned."] },
  { id: "marcus", name: "Marcus", role: "Open desks", x: 22, y: 3, ticket: "internet-down",
    sprite: { body:"#1D9E75", body2:"#0F6E56", accent:"#9FE1CB", hair:"#2C2C2A", skin:"#8A5A3A" },
    chat: ["Yeah, I know now \u2014 scope before blaming the wifi.","Slack works, internet works, I was being dramatic. Sorry.","If I file a ticket again, ask me what else is broken first."] },
  { id: "priya", name: "Priya", role: "Open desks", x: 26, y: 4, ticket: "dns",
    sprite: { body:"#7F77DD", body2:"#534AB7", accent:"#F4C0D1", hair:"#1a1a18", skin:"#C9926B" },
    chat: ["Hostnames are not the same as IPs. I get it now.","Fileshare's been solid since you flushed DNS.","I made a sticky note: ping by IP first."] },
  { id: "dana", name: "Dana", role: "Print room", x: 3, y: 10, ticket: "printer",
    sprite: { body:"#BA7517", body2:"#854F0B", accent:"#FCDE5A", hair:"#888780", skin:"#D8B088" },
    chat: ["Windows updates strike again, huh.","Driver's been good since you fixed it. Thanks.","I tell people now: 'check the queue first.'"] },
  { id: "jordan", name: "Jordan", role: "Open desks 2", x: 12, y: 10, ticket: "slow",
    sprite: { body:"#0F6E56", body2:"#085041", accent:"#85B7EB", hair:"#412402", skin:"#8A5A3A" },
    chat: ["I close my tabs now. Mostly.","Wasn't the wifi. Got it.","Task Manager is my friend. Reluctantly."] },
  { id: "riley", name: "Riley", role: "Open desks 2", x: 15, y: 11, ticket: "permissions",
    sprite: { body:"#D85A30", body2:"#993C1D", accent:"#FCDE5A", hair:"#BA7517", skin:"#E0B080" },
    chat: ["Color access went through, thanks.","Operations finally got added to the group. Took a week.","If Sam can do it and I can't, it's me, not the printer."] },
  { id: "chen", name: "Mgr Chen", role: "Manager", x: 24, y: 12, ticket: "change",
    sprite: { body:"#378ADD", body2:"#185FA5", accent:"#F1EFE8", hair:"#2C2C2A", skin:"#B08050", glasses:true },
    chat: ["Email's good. Change-log's now a daily check.","DNS migrations on a Friday. Lesson learned for everyone.","Thanks for being calm when I was not."] },
  { id: "ed", name: "Ed", role: "Accounting", x: 19, y: 18, sideQuest: "unplugged",
    sprite: { body:"#888780", body2:"#5F5E5A", accent:"#B5D4F4", hair:"#C8C4B4", skin:"#D8B088", glasses:true },
    chat: ["I check the power strip first now. Every time.","Don't tell anyone what the problem was.","I keep tape over the strip switch. No more accidents."] },
  { id: "lisa", name: "Lisa", role: "Accounting", x: 26, y: 18, sideQuest: "monitorStandby",
    sprite: { body:"#534AB7", body2:"#3C3489", accent:"#F4C0D1", hair:"#2C2C2A", skin:"#C9926B" },
    chat: ["Amber means asleep. Got it.","I wiggle the mouse before panicking now.","It's amazing how much I assumed was broken."] }
];

// Props are interactable objects dispatched by `kind`. Kinds:
//   monitor | printer | pet | search | chest | usb | elevator | device
// Optional: walkable, needFlag, doneFlag, sideQuest, device (art for `device`).
const PROPS3 = [
  { id: "ticket-monitor", x: 4, y: 4,  label: "Ticket monitor", room: "IT room", kind: "monitor", isMonitor: true },
  { id: "elevator-3", x: 5, y: 1, label: "the elevator", room: "IT room", kind: "elevator" },
  { id: "sq-printer-ink", x: 4, y: 10, label: "Printer (low ink?)", room: "Print room", kind: "printer", sideQuest: "printerInk", isPrinter: true },
  { id: "cat", x: 8, y: 18, label: "the office cat", room: "Conf. room", kind: "pet", name: "Mittens" },
  { id: "cat-food", x: 4, y: 12, label: "supply cabinet", room: "Print room", kind: "search",
    title: "SUPPLY CABINET", giveFlag: "hasCatFood", needPriorFlag: "catMet",
    lockedText: "Toner, pens, a stack of paper. Nothing you need yet.",
    take: "Behind the toner: an unopened pouch of cat food. Somebody used to look after her.",
    empty: "You already grabbed the cat food. The rest is just toner." },
  { id: "cat-stash", x: 14, y: 16, label: "loose ceiling tile", room: "Conf. room", kind: "chest",
    walkable: true, needFlag: "catRevealed", doneFlag: "stashTaken",
    coins: 15, tokens: 1, findReward: "charm", title: "LOOSE CEILING TILE",
    give: "Mittens bats a sagging ceiling tile until it tips. Taped above it is an old admin's stash: a fistful of vending coins, one break-room token, and her spare collar charm.",
    done: "Empty now. Mittens looks extremely pleased with herself." },
  { id: "usb-drop", x: 9, y: 11, label: "a USB stick on the floor", room: "Open desks 2", kind: "usb", walkable: true, sideQuest: "usbDrop" }
];

// ---- FLOOR 7 rooms / people / props (Security Operations) -----------------
const ROOMS7 = [
  { name: "Elevator lobby", x: 1,  y: 1,  w: 5,  h: 6 },
  { name: "SOC bullpen",    x: 7,  y: 1,  w: 12, h: 6 },
  { name: "Threat intel",   x: 20, y: 1,  w: 8,  h: 6 },
  { name: "Network closet", x: 1,  y: 8,  w: 5,  h: 6 },
  { name: "Analyst pit",    x: 7,  y: 8,  w: 12, h: 6 },
  { name: "Wireless lab",   x: 20, y: 8,  w: 8,  h: 6 },
  { name: "Data center",    x: 1,  y: 15, w: 5,  h: 6 },
  { name: "IR war room",    x: 7,  y: 15, w: 9,  h: 6 },
  { name: "Red-team lab",   x: 17, y: 15, w: 11, h: 6 }
];

const NPCS7 = [
  { id: "sofia", name: "Sofia", role: "SOC analyst", x: 13, y: 4, ticket: "phish-ir",
    sprite: { body:"#2BB3A3", body2:"#178277", accent:"#D6FFF8", hair:"#2C2C2A", skin:"#C9926B" },
    chat: ["Revoke the session, not just the email. Lesson learned.","I check Reply-To and SPF on every 'IT' email now.","Tokens can be replayed \u2014 MFA isn't a magic shield."] },
  { id: "wes", name: "Wes", role: "Red teamer", x: 22, y: 3, ticket: "privesc",
    sprite: { body:"#C0392B", body2:"#8E261B", accent:"#2C2C2A", hair:"#1a1a18", skin:"#8A5A3A" },
    chat: ["sudo -l before anything fancy. Always.","Misconfig over exploit. Cleaner and it actually works.","Respect the scope. That's the whole job."] },
  { id: "nadia", name: "Nadia", role: "Detection eng", x: 26, y: 4, ticket: "lateral",
    sprite: { body:"#6C5CE7", body2:"#4A3FB0", accent:"#E6E1FF", hair:"#2C2C2A", skin:"#E0B080" },
    chat: ["One source, many targets, 2am. That's the alert I tuned.","Service account in Domain Admins? Not anymore.","NTLM Type-3 fan-out is my favorite signature."] },
  { id: "tomas", name: "Tomas", role: "Network eng", x: 3, y: 10, ticket: "segmentation",
    sprite: { body:"#2D7DD2", body2:"#1B5896", accent:"#CFE6FF", hair:"#412402", skin:"#D8B088" },
    chat: ["Cameras live on their own VLAN now.","Any/any is gone. Least privilege east-west.","A /24 is 254 usable. I'll never forget it now."] },
  { id: "grace", name: "Grace", role: "PKI / sysadmin", x: 12, y: 10, ticket: "tls-chain",
    sprite: { body:"#27AE60", body2:"#1B7A43", accent:"#DDFBE8", hair:"#6B4A2A", skin:"#C9926B" },
    chat: ["Always bundle the intermediate. Half my users thank you.","The leaf was fine \u2014 the chain was short.","I test with openssl s_client before I call it done."] },
  { id: "omar", name: "Omar", role: "IR lead", x: 15, y: 11, ticket: "ransomware",
    sprite: { body:"#E67E22", body2:"#A85B12", accent:"#FFE3C2", hair:"#2C2C2A", skin:"#8A5A3A" },
    chat: ["Isolate first. Always contain before you clean.","Immutable backups beat ransoms every time.","Never reboot during active encryption \u2014 evidence and keys."] },
  { id: "bex", name: "Bex", role: "Wireless / phys-sec", x: 24, y: 12, ticket: "rogue-ap",
    sprite: { body:"#B5179E", body2:"#7E1070", accent:"#FFD6F4", hair:"#1a1a18", skin:"#E0B080" },
    chat: ["Two BSSIDs, one SSID, deauths \u2014 evil twin every time.","We moved to WPA2-Enterprise. Clients validate the cert now.","Found the rogue in a backpack. People hide them well."] },
  { id: "stranger", name: "Stranger", role: "no visible badge", x: 19, y: 18, sideQuest: "tailgater",
    sprite: { body:"#7A7A78", body2:"#54534F", accent:"#B7B6AF", hair:"#3A3A38", skin:"#C9926B" },
    chat: ["...thanks again for holding the door earlier.","Reception sorted me out with a visitor badge.","No hard feelings \u2014 you were right to ask."] }
];

const PROPS7 = [
  { id: "ticket-monitor-7", x: 4, y: 4, label: "SOC queue board", room: "Elevator lobby", kind: "monitor", isMonitor: true },
  { id: "elevator-7", x: 5, y: 1, label: "the elevator", room: "Elevator lobby", kind: "elevator" },
  { id: "sw-default", x: 4, y: 12, label: "the network switch", room: "Network closet", kind: "device", device: "switch", walkable: true, sideQuest: "defaultCreds" },
  { id: "fw-rdp", x: 9, y: 11, label: "the firewall console", room: "Analyst pit", kind: "device", device: "firewall", walkable: true, sideQuest: "exposedRdp" },
  { id: "osint-repo", x: 26, y: 18, label: "the OSINT terminal", room: "Red-team lab", kind: "device", device: "terminal", walkable: true, sideQuest: "secretInRepo" }
];

// ---- floor registry + live-binding switch ---------------------------------
export const FLOOR_ORDER = ["floor3", "floor7"];
export const FLOOR_META = {
  floor3: { id: "floor3", name: "Floor 3", short: "F3", label: "IT SUPPORT \u00b7 FLOOR 3",
            tag: "Help Desk", blurb: "Fundamentals: A+ and Network+ triage.", locked: false },
  floor7: { id: "floor7", name: "Floor 7", short: "F7", label: "SECURITY OPS \u00b7 FLOOR 7",
            tag: "Security Operations", blurb: "Advanced: Security+, PenTest+, Network+.", locked: true }
};

const FLOORS = {
  floor3: { map: OFFICE, rooms: ROOMS3, npcs: NPCS3, props: PROPS3, start: { x: 2, y: 5, dir: "down" }, label: FLOOR_META.floor3.label },
  floor7: { map: SOC,    rooms: ROOMS7, npcs: NPCS7, props: PROPS7, start: { x: 2, y: 5, dir: "down" }, label: FLOOR_META.floor7.label }
};

// Live bindings reassigned by setFloor.
export let MAP = FLOORS.floor3.map;
export let ROOMS = FLOORS.floor3.rooms;
export let NPCS = FLOORS.floor3.npcs;
export let PROPS = FLOORS.floor3.props;
export let PLAYER_START = FLOORS.floor3.start;
export let LOC_LABEL = FLOORS.floor3.label;
export let FLOOR_ID = "floor3";

export function setFloor(id) {
  const f = FLOORS[id] || FLOORS.floor3;
  FLOOR_ID = FLOORS[id] ? id : "floor3";
  MAP = f.map; ROOMS = f.rooms; NPCS = f.npcs; PROPS = f.props;
  PLAYER_START = f.start; LOC_LABEL = f.label;
  return FLOOR_ID;
}

export function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
  return !BLOCKING.has(MAP[y][x]);
}
