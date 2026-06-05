// World data: the map, the rooms, the people, the things you can interact with.
// Edit this file to change the office layout or to add new NPCs / props.

export const TILE = 32;
export const MAP_W = 30;
export const MAP_H = 22;

// Tile codes:
//   W wall   . office floor   o open-plan carpet   e cool/exam floor
//   D desk (solid)   c chair (walkable)   S server rack (solid)
//   X exit/door marker (walkable, cosmetic)
// The map is built programmatically so every row is guaranteed uniform width.
// Rooms are carved as rectangles, then furniture is stamped in.

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

function buildMap() {
  const m = blank();

  // Rooms separated by wall columns 6 & 19 and wall rows 7 & 14.
  // Top band (rows 1-6)
  carve(m, 1, 1, 5, 6, ".");     // IT room        (x 1..5)
  carve(m, 7, 1, 12, 6, ".");    // Reception      (x 7..18)
  carve(m, 20, 1, 8, 6, "e");    // Open desks     (x 20..27)
  // Middle band (rows 8-13)
  carve(m, 1, 8, 5, 6, ".");     // Print room     (x 1..5)
  carve(m, 7, 8, 12, 6, "o");    // Open desks 2   (x 7..18)
  carve(m, 20, 8, 8, 6, "o");    // Manager        (x 20..27)
  // Bottom band (rows 15-20)
  carve(m, 1, 15, 5, 6, ".");    // Server closet  (x 1..5)
  carve(m, 7, 15, 9, 6, "e");    // Conf room      (x 7..15)
  carve(m, 17, 15, 11, 6, "o");  // Accounting     (x 17..27)

  // Two-tile doorways through the separating walls (wider = easier to navigate)
  door(m, 6, 3);  door(m, 6, 4);    door(m, 19, 3); door(m, 19, 4);   // top horizontals
  door(m, 6, 10); door(m, 6, 11);   door(m, 19, 10); door(m, 19, 11); // middle horizontals
  door(m, 6, 18); door(m, 6, 17);   door(m, 16, 18); door(m, 16, 17); // bottom horizontals
  door(m, 3, 7);  door(m, 4, 7);    door(m, 12, 7); door(m, 13, 7);  door(m, 24, 7);  door(m, 25, 7);  // top<->mid
  door(m, 3, 14); door(m, 4, 14);   door(m, 11, 14); door(m, 12, 14); door(m, 24, 14); door(m, 25, 14); // mid<->bottom

  // Furniture
  stamp(m, 2, 2, "D"); stamp(m, 3, 2, "D"); stamp(m, 2, 4, "c");                 // IT
  for (let x = 9; x <= 15; x++) stamp(m, x, 2, "D");
  stamp(m, 9, 4, "c"); stamp(m, 15, 4, "c");                                     // Reception
  stamp(m, 22, 2, "D"); stamp(m, 26, 2, "D"); stamp(m, 22, 5, "D"); stamp(m, 26, 5, "D"); // Open desks
  stamp(m, 2, 9, "D");                                                           // Print
  stamp(m, 9, 9, "D"); stamp(m, 12, 9, "D"); stamp(m, 15, 9, "D");
  stamp(m, 9, 12, "D"); stamp(m, 15, 12, "D");                                   // Open desks 2
  stamp(m, 22, 9, "D"); stamp(m, 25, 9, "D"); stamp(m, 25, 12, "c");             // Manager
  stamp(m, 2, 16, "S"); stamp(m, 4, 16, "S"); stamp(m, 2, 19, "S"); stamp(m, 4, 19, "S"); // Server
  for (let x = 9; x <= 13; x++) stamp(m, x, 17, "D");
  stamp(m, 9, 19, "c"); stamp(m, 13, 19, "c");                                   // Conf
  stamp(m, 19, 16, "D"); stamp(m, 26, 16, "D"); stamp(m, 19, 19, "D"); stamp(m, 26, 19, "D"); // Accounting

  return m.map((row) => row.join(""));
}

export const MAP = buildMap();

const BLOCKING = new Set(["W", "D", "S"]);
export function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
  return !BLOCKING.has(MAP[y][x]);
}

export const ROOMS = [
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

// NPCs each get a `sprite` identity so the renderer draws a real pixel person.
export const NPCS = [
  {
    id: "karen", name: "Karen", role: "Receptionist",
    x: 13, y: 4, ticket: "monitor",
    sprite: { body:"#D4537E", body2:"#993556", accent:"#FCDE5A", hair:"#6B4A2A", skin:"#E0B080" },
    chat: [
      "Thanks for fixing my screen last week.",
      "Phones have been quiet today, knock on wood.",
      "Don't roll your chair over your cables. Lesson learned."
    ]
  },
  {
    id: "marcus", name: "Marcus", role: "Open desks",
    x: 22, y: 3, ticket: "internet-down",
    sprite: { body:"#1D9E75", body2:"#0F6E56", accent:"#9FE1CB", hair:"#2C2C2A", skin:"#8A5A3A" },
    chat: [
      "Yeah, I know now \u2014 scope before blaming the wifi.",
      "Slack works, internet works, I was being dramatic. Sorry.",
      "If I file a ticket again, ask me what else is broken first."
    ]
  },
  {
    id: "priya", name: "Priya", role: "Open desks",
    x: 26, y: 4, ticket: "dns",
    sprite: { body:"#7F77DD", body2:"#534AB7", accent:"#F4C0D1", hair:"#1a1a18", skin:"#C9926B" },
    chat: [
      "Hostnames are not the same as IPs. I get it now.",
      "Fileshare's been solid since you flushed DNS.",
      "I made a sticky note: ping by IP first."
    ]
  },
  {
    id: "dana", name: "Dana", role: "Print room",
    x: 3, y: 10, ticket: "printer",
    sprite: { body:"#BA7517", body2:"#854F0B", accent:"#FCDE5A", hair:"#888780", skin:"#D8B088" },
    chat: [
      "Windows updates strike again, huh.",
      "Driver's been good since you fixed it. Thanks.",
      "I tell people now: 'check the queue first.'"
    ]
  },
  {
    id: "jordan", name: "Jordan", role: "Open desks 2",
    x: 12, y: 10, ticket: "slow",
    sprite: { body:"#0F6E56", body2:"#085041", accent:"#85B7EB", hair:"#412402", skin:"#8A5A3A" },
    chat: [
      "I close my tabs now. Mostly.",
      "Wasn't the wifi. Got it.",
      "Task Manager is my friend. Reluctantly."
    ]
  },
  {
    id: "riley", name: "Riley", role: "Open desks 2",
    x: 15, y: 11, ticket: "permissions",
    sprite: { body:"#D85A30", body2:"#993C1D", accent:"#FCDE5A", hair:"#BA7517", skin:"#E0B080" },
    chat: [
      "Color access went through, thanks.",
      "Operations finally got added to the group. Took a week.",
      "If Sam can do it and I can't, it's me, not the printer."
    ]
  },
  {
    id: "chen", name: "Mgr Chen", role: "Manager",
    x: 24, y: 12, ticket: "change",
    sprite: { body:"#378ADD", body2:"#185FA5", accent:"#F1EFE8", hair:"#2C2C2A", skin:"#B08050", glasses:true },
    chat: [
      "Email's good. Change-log's now a daily check.",
      "DNS migrations on a Friday. Lesson learned for everyone.",
      "Thanks for being calm when I was not."
    ]
  },
  {
    id: "ed", name: "Ed", role: "Accounting",
    x: 19, y: 18, sideQuest: "unplugged",
    sprite: { body:"#888780", body2:"#5F5E5A", accent:"#B5D4F4", hair:"#C8C4B4", skin:"#D8B088", glasses:true },
    chat: [
      "I check the power strip first now. Every time.",
      "Don't tell anyone what the problem was.",
      "I keep tape over the strip switch. No more accidents."
    ]
  },
  {
    id: "lisa", name: "Lisa", role: "Accounting",
    x: 26, y: 18, sideQuest: "monitorStandby",
    sprite: { body:"#534AB7", body2:"#3C3489", accent:"#F4C0D1", hair:"#2C2C2A", skin:"#C9926B" },
    chat: [
      "Amber means asleep. Got it.",
      "I wiggle the mouse before panicking now.",
      "It's amazing how much I assumed was broken."
    ]
  }
];

export const PLAYER_SPRITE = { body:"#2E6FB0", body2:"#1B4E84", accent:"#FCDE5A", hair:"#2C2C2A", skin:"#C9926B" };

// Props are interactable objects dispatched by `kind` (see game.js / render.js).
// Kinds in use:  monitor | printer | pet | search | chest | usb
//   monitor  the ticket board (opens the queue / end-of-day)
//   printer  the low-ink side quest prop
//   pet      a companion you befriend over several steps; bootstraps the economy
//   search   furniture you examine; can grant a carry-flag and/or a collectable
//   chest     a hidden stash, invisible until `needFlag` is set; pays out the economy
//   usb       a found object that opens a one-shot awareness side quest
// Optional fields:
//   walkable:true   prop does NOT block its tile (small floor objects like a USB)
//   needFlag        prop is invisible/non-blocking until state.flags has this
//   doneFlag        once set, the prop reads as "done"
export const PROPS = [
  { id: "ticket-monitor", x: 4, y: 4,  label: "Ticket monitor",     room: "IT room",    kind: "monitor", isMonitor: true },
  { id: "sq-printer-ink", x: 4, y: 10, label: "Printer (low ink?)",  room: "Print room", kind: "printer", sideQuest: "printerInk", isPrinter: true },

  // --- SDV layer: the pet + economy bootstrap ---------------------------------
  // Mittens the office cat. Meet her hungry, find her food, feed her; she pays
  // you back by pawing open a hidden ceiling-tile stash (the `chest` below).
  { id: "cat", x: 8, y: 18, label: "the office cat", room: "Conf. room", kind: "pet", name: "Mittens" },

  // Cat food lives in a supply cabinet over in the print room (so befriending
  // her makes you walk the floor — the whole point of side quests).
  { id: "cat-food", x: 4, y: 12, label: "supply cabinet", room: "Print room", kind: "search",
    title: "SUPPLY CABINET",
    giveFlag: "hasCatFood", needPriorFlag: "catMet",
    lockedText: "Toner, pens, a stack of paper. Nothing you need yet.",
    take: "Behind the toner: an unopened pouch of cat food. Somebody used to look after her.",
    empty: "You already grabbed the cat food. The rest is just toner." },

  // The hidden stash. Invisible (and non-blocking) until Mittens reveals it.
  { id: "cat-stash", x: 14, y: 16, label: "loose ceiling tile", room: "Conf. room", kind: "chest",
    walkable: true, needFlag: "catRevealed", doneFlag: "stashTaken",
    coins: 15, tokens: 1, findReward: "charm",
    title: "LOOSE CEILING TILE",
    give: "Mittens bats a sagging ceiling tile until it tips. Taped above it is an old admin's stash: a fistful of vending coins, one break-room token, and her spare collar charm.",
    done: "Empty now. Mittens looks extremely pleased with herself." },

  // A mystery USB stick on the open-plan carpet. Walkable so it doesn't wall off
  // the floor; opens a phishing-awareness one-shot (see sideQuests.js: usbDrop).
  { id: "usb-drop", x: 9, y: 11, label: "a USB stick on the floor", room: "Open desks 2",
    kind: "usb", walkable: true, sideQuest: "usbDrop" }
];

export const PLAYER_START = { x: 2, y: 5, dir: "down" };
export const LOC_LABEL = "IT SUPPORT \u00b7 FLOOR 3";
