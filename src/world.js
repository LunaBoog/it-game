// World data: the maps, the rooms, the people, the things you can interact with.
//
// v2 "Cutover Week" has FOUR maps (all 30x22 so the renderer's letterbox and
// camera never change):
//   home   = your Astoria apartment + the street + the subway entrance
//   lobby  = the office building's ground floor: security desk, IT storeroom,
//            the sidewalk, Byte Bodega (supplies), the coffee cart, The Stack (bar)
//   floor3 = Help Desk (fundamentals)   floor7 = Security Operations (advanced)
//
// MAP / ROOMS / NPCS / PROPS / PLAYER_START / LOC_LABEL / FLOOR_ID are exported
// as `let` and reassigned by setFloor(id). ES-module live bindings mean the
// renderer and engine see the swap automatically — no per-map branching.

export const TILE = 32;
export const MAP_W = 30;
export const MAP_H = 22;

// Tile codes:
//   W wall   . office floor   o open-plan carpet   e cool/exam floor
//   D desk (solid)   c chair (walkable)   S server rack (solid)
//   v2:  f wood floor   k kitchen tile   s sidewalk   m lobby marble   t bar floor
//        R road (solid)  K counter (solid)  H shelf (solid)  B bed foot (solid)
//        C couch (solid) P planter (solid)
// Maps are built programmatically so every row is guaranteed uniform width.
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
function door(m, x, y, t = ".") { if (m[y] && m[y][x] !== undefined) m[y][x] = t; }
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

  // Furniture (solid: D, S · walkable: c)
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

// ---- v2: home (Astoria apartment + street) --------------------------------
function buildHomeMap() {
  const m = blank();
  carve(m, 1, 1, 9, 8, "f");      // bedroom      x1-9   y1-8
  carve(m, 11, 1, 10, 8, "f");    // living room  x11-20 y1-8
  carve(m, 22, 1, 7, 8, "k");     // kitchen      x22-28 y1-8
  door(m, 10, 4, "f"); door(m, 10, 5, "f");
  door(m, 21, 4, "f"); door(m, 21, 5, "f");
  door(m, 15, 9, "f"); door(m, 16, 9, "f");   // front door -> stoop
  carve(m, 1, 10, 28, 8, "s");    // sidewalk     y10-17
  carve(m, 1, 18, 28, 3, "R");    // 31st St      y18-20 (solid)
  // bedroom: bed (prop at 3,2 + foot tile), dresser
  stamp(m, 3, 3, "B"); stamp(m, 7, 1, "H"); stamp(m, 8, 1, "H");
  // living room: laptop desk + couch
  stamp(m, 13, 1, "D"); stamp(m, 14, 1, "D");
  for (let x = 16; x <= 19; x++) stamp(m, x, 6, "C");
  // kitchen counters
  for (let x = 22; x <= 28; x++) stamp(m, x, 1, "K");
  stamp(m, 28, 2, "K"); stamp(m, 28, 3, "K");
  // street planters
  stamp(m, 4, 16, "P"); stamp(m, 11, 16, "P"); stamp(m, 20, 16, "P"); stamp(m, 27, 16, "P");
  return m.map((row) => row.join(""));
}

// ---- v2: lobby (ground floor + the block) ----------------------------------
function buildLobbyMap() {
  const m = blank();
  carve(m, 1, 1, 16, 8, "m");     // building lobby  x1-16  y1-8
  carve(m, 18, 1, 11, 8, ".");    // IT storeroom    x18-28 y1-8
  door(m, 17, 4, "."); door(m, 17, 5, ".");
  door(m, 8, 9, "m"); door(m, 9, 9, "m");      // revolving doors -> sidewalk
  carve(m, 1, 10, 28, 3, "s");    // sidewalk        y10-12
  carve(m, 1, 14, 9, 7, ".");     // Byte Bodega     x1-9   y14-20
  carve(m, 11, 14, 6, 7, "s");    // plaza           x11-16 y14-20
  carve(m, 18, 14, 11, 7, "t");   // The Stack (bar) x18-28 y14-20
  door(m, 5, 13, "."); door(m, 13, 13, "s"); door(m, 14, 13, "s"); door(m, 23, 13, "t");
  // lobby security desk (Lou stands at 8,4)
  stamp(m, 6, 4, "K"); stamp(m, 7, 4, "K"); stamp(m, 9, 4, "K"); stamp(m, 10, 4, "K");
  stamp(m, 13, 7, "P"); stamp(m, 3, 7, "P");
  // storeroom shelving
  for (let x = 19; x <= 25; x++) stamp(m, x, 1, "H");
  stamp(m, 28, 5, "H"); stamp(m, 28, 6, "H");
  // bodega counter (Ray at 4,15) + shelves
  stamp(m, 2, 15, "K"); stamp(m, 3, 15, "K"); stamp(m, 5, 15, "K"); stamp(m, 6, 15, "K");
  for (let x = 2; x <= 8; x++) stamp(m, x, 19, "H");
  stamp(m, 8, 16, "H"); stamp(m, 8, 17, "H");
  // bar counter (Nico at 23,15)
  for (let x = 19; x <= 27; x++) if (x !== 23) stamp(m, x, 15, "K");
  stamp(m, 20, 18, "D"); stamp(m, 25, 18, "D");
  // plaza planters
  stamp(m, 11, 19, "P"); stamp(m, 16, 19, "P");
  return m.map((row) => row.join(""));
}

const OFFICE = buildOfficeMap();

// ---- v2.1 dressing: per-room floors + a real break room on Floor 3 ---------
// Floor codes (all walkable): . vinyl  o blue-gray carpet  f wood  k break-room
// checker  q warm office carpet  x raised data-center floor  g conference
// carpet  u sage carpet  z dark SOC carpet  e cool tile.
function refloor(m, x0, y0, w, h, tile) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
    if (m[y] && ".oe".includes(m[y][x])) m[y][x] = tile;
}
function buildFloor3() {
  const m = OFFICE.map((r) => r.split(""));
  refloor(m, 7, 1, 12, 6, "f");      // reception: wood
  refloor(m, 20, 1, 8, 6, "o");      // open desks: carpet
  refloor(m, 20, 8, 8, 6, "q");      // manager: warm carpet
  refloor(m, 1, 15, 5, 6, "x");      // server closet: raised floor
  refloor(m, 7, 15, 9, 6, "g");      // conference: navy carpet
  refloor(m, 17, 15, 11, 6, "u");    // accounting: sage carpet
  // the break room: split off the east end of Open desks 2
  for (let y = 8; y <= 13; y++) m[y][14] = "W";
  m[10][14] = "k"; m[11][14] = "k";
  for (let y = 8; y <= 13; y++) for (let x = 15; x <= 18; x++) m[y][x] = "k";
  // Open desks 2: two desk pods instead of scattered singles
  for (const [x, y] of [[15, 9], [15, 12]]) m[y][x] = "k";
  for (const [x, y] of [[8, 9], [9, 9], [11, 9], [12, 9], [8, 12], [9, 12], [11, 12], [12, 12]]) m[y][x] = "D";
  // reception: a proper front counter, waiting chairs replaced by a couch (decor)
  for (let x = 9; x <= 15; x++) m[2][x] = "f";
  for (let x = 10; x <= 14; x++) m[2][x] = "K";
  m[4][9] = "f"; m[4][15] = "f";
  // open desks: pods of two
  m[2][23] = "D"; m[2][25] = "D"; m[5][23] = "D";
  // Chen's office: one long executive desk, no stray chair
  m[9][23] = "D"; m[9][24] = "D"; m[12][25] = "q";
  // accounting: pods of two
  for (const [x, y] of [[20, 16], [25, 16], [20, 19], [25, 19]]) m[y][x] = "D";
  // server closet: a second row of racks
  m[20][2] = "S"; m[20][4] = "S";
  return m.map((r) => r.join(""));
}
function buildFloor7() {
  const m = OFFICE.map((r) => r.split(""));
  const re = (x0, y0, w, h, t) => refloor(m, x0, y0, w, h, t);
  re(1, 1, 5, 6, "e"); re(7, 1, 12, 6, "z"); re(20, 1, 8, 6, "e");
  re(1, 8, 5, 6, "x"); re(7, 8, 12, 6, "z"); re(20, 8, 8, 6, "e");
  re(1, 15, 5, 6, "x"); re(7, 15, 9, 6, "g"); re(17, 15, 11, 6, "z");
  // network closet + data center: more racks
  m[8][5] = "S"; m[12][1] = "S"; m[13][1] = "S";
  for (const [x, y] of [[2, 17], [4, 17], [2, 20], [4, 20]]) m[y][x] = "S";
  // SOC bullpen: the console row stays; analyst pit gets pods
  for (const [x, y] of [[8, 9], [11, 9], [16, 9], [8, 12], [16, 12]]) m[y][x] = "D";
  m[12][25] = "e";
  // red-team lab: pods of two, like a real lab
  for (const [x, y] of [[20, 16], [25, 16], [20, 19], [25, 19]]) m[y][x] = "D";
  return m.map((r) => r.join(""));
}
const FLOOR3MAP = buildFloor3();
const SOC = buildFloor7();
const HOME = buildHomeMap();
const LOBBYMAP = buildLobbyMap();

const BLOCKING = new Set(["W", "D", "S", "R", "K", "H", "B", "C", "P"]);

// ---- decor layer -------------------------------------------------------------
// Non-interactive dressing, baked into the map cache. { x, y, k, solid?, wall?, item? }
//   wall: drawn on a wall tile's visible face (windows, art, screens)
//   item: drawn on top of a desk/counter (monitors, mugs, plants)
//   solid: blocks movement (plants, cabinets, shelves, couches)
const DECOR = { home: [], lobby: [], floor3: [], floor7: [] };
function dz(map, k, list, opts = {}) { for (const [x, y] of list) DECOR[map].push({ x, y, k, ...opts }); }
// Floor 3
dz("floor3", "window", [[1, 0], [2, 0], [3, 0], [4, 0], [7, 0], [8, 0], [9, 0], [10, 0], [15, 0], [16, 0], [17, 0], [18, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0], [27, 0]], { wall: true });
dz("floor3", "logo", [[12, 0]], { wall: true }); dz("floor3", "logo2", [[13, 0]], { wall: true });
dz("floor3", "clock", [[11, 0], [5, 7], [21, 14]], { wall: true });
dz("floor3", "cork", [[2, 7], [18, 14]], { wall: true });
dz("floor3", "wbL", [[8, 7]], { wall: true }); dz("floor3", "wbR", [[9, 7]], { wall: true });
dz("floor3", "art", [[10, 7], [21, 7], [26, 7], [23, 14]], { wall: true });
dz("floor3", "poster", [[16, 7]], { wall: true }); dz("floor3", "menu", [[17, 7]], { wall: true });
dz("floor3", "tvL", [[8, 14]], { wall: true }); dz("floor3", "tvR", [[9, 14]], { wall: true });
dz("floor3", "wbL", [[13, 14]], { wall: true }); dz("floor3", "wbR", [[14, 14]], { wall: true });
dz("floor3", "calendar", [[27, 14]], { wall: true }); dz("floor3", "exit", [[1, 14]], { wall: true });
dz("floor3", "plant", [[7, 1], [7, 6], [20, 1], [27, 1], [1, 13], [7, 13], [13, 13], [20, 8], [27, 13], [15, 15], [7, 20], [17, 15], [22, 20]], { solid: true });
dz("floor3", "couchL", [[8, 6]], { solid: true }); dz("floor3", "couchR", [[9, 6]], { solid: true });
dz("floor3", "shelfParts", [[1, 6]], { solid: true });
dz("floor3", "boxes", [[4, 1], [5, 8]], { solid: true });
dz("floor3", "shred", [[5, 13]], { solid: true });
dz("floor3", "shelfSupply", [[1, 11]], { solid: true });
dz("floor3", "fcab", [[20, 6], [20, 13], [27, 15], [27, 20]], { solid: true });
dz("floor3", "books", [[27, 10], [27, 11]], { solid: true });
dz("floor3", "ups", [[5, 15]], { solid: true }); dz("floor3", "crac", [[1, 15]], { solid: true });
dz("floor3", "sink", [[18, 8]], { solid: true });
dz("floor3", "tableL", [[16, 12]], { solid: true }); dz("floor3", "tableR", [[17, 12]], { solid: true });
dz("floor3", "chairB", [[16, 11], [17, 11], [16, 13], [17, 13]]);
dz("floor3", "chairC", [[9, 16], [11, 16], [13, 16], [9, 18], [11, 18], [13, 18]]);
dz("floor3", "chairO", [[8, 10], [11, 10], [12, 11], [8, 13], [11, 13], [22, 1], [26, 1], [22, 6], [26, 6], [19, 15], [26, 15], [19, 20], [26, 20], [3, 3], [23, 10]]);
dz("floor3", "rug", [[21, 10], [22, 10], [23, 10], [24, 10], [25, 10], [21, 11], [22, 11], [23, 11], [24, 11], [25, 11]]);
dz("floor3", "rugR", [[8, 4], [9, 4], [8, 5], [9, 5]]);
dz("floor3", "mat", [[12, 6], [13, 6]]);
dz("floor3", "mon2", [[2, 2], [8, 9], [12, 9], [9, 12], [11, 12], [22, 2], [26, 2], [22, 5], [26, 5], [19, 16], [26, 16], [19, 19], [26, 19]], { item: true });
dz("floor3", "mon", [[10, 2], [14, 2], [9, 9], [11, 9], [8, 12], [12, 12], [23, 2], [25, 2], [23, 5], [20, 16], [25, 16], [20, 19], [25, 19], [24, 9]], { item: true });
dz("floor3", "phone", [[11, 2]], { item: true }); dz("floor3", "bell", [[12, 2]], { item: true });
dz("floor3", "plantS", [[13, 2], [22, 9]], { item: true });
dz("floor3", "papers", [[23, 9], [2, 9], [25, 9]], { item: true });
dz("floor3", "proj", [[11, 17]], { item: true }); dz("floor3", "notepad", [[9, 17], [13, 17]], { item: true });
// Floor 7 (Security Operations)
dz("floor7", "window", [[1, 0], [2, 0], [4, 0], [20, 0], [21, 0], [27, 0]], { wall: true });
dz("floor7", "seclogo", [[3, 0]], { wall: true });
dz("floor7", "vwall", [[7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0]], { wall: true });
dz("floor7", "wmap", [[22, 0], [23, 0], [24, 0], [25, 0], [26, 0]], { wall: true });
dz("floor7", "patch", [[1, 7], [2, 7], [5, 7]], { wall: true });
dz("floor7", "wbL", [[8, 14]], { wall: true }); dz("floor7", "wbR", [[9, 14]], { wall: true });
dz("floor7", "ir", [[13, 14], [14, 14]], { wall: true });
dz("floor7", "neon", [[18, 14], [19, 14], [20, 14]], { wall: true });
dz("floor7", "clock", [[10, 7], [27, 7]], { wall: true });
dz("floor7", "plant", [[1, 6], [7, 6], [18, 6], [7, 13], [18, 13], [20, 1], [15, 15]], { solid: true });
dz("floor7", "antenna", [[27, 9]], { solid: true }); dz("floor7", "faraday", [[27, 12]], { solid: true });
dz("floor7", "spectrum", [[20, 13]], { solid: true });
dz("floor7", "crac", [[1, 15]], { solid: true }); dz("floor7", "ups", [[5, 15]], { solid: true });
dz("floor7", "beanbag", [[27, 20], [22, 20]], { solid: true });
dz("floor7", "wbL", [[21, 14]], { wall: true }); dz("floor7", "wbR", [[22, 14]], { wall: true });
dz("floor7", "art", [[26, 14]], { wall: true }); dz("floor7", "patch", [[27, 14]], { wall: true });
dz("floor7", "rgbkb", [[20, 16], [25, 19]], { item: true }); dz("floor7", "mon2", [[25, 16], [20, 19]], { item: true });
dz("floor7", "boxes", [[17, 20]], { solid: true }); dz("floor7", "plant", [[27, 17]], { solid: true }); dz("floor7", "fcab", [[20, 6]], { solid: true });
dz("floor7", "chairO", [[9, 3], [11, 3], [13, 3], [15, 3], [8, 10], [11, 10], [16, 10], [22, 1], [26, 1], [19, 15], [26, 15], [19, 20], [26, 20]]);
dz("floor7", "chairC", [[9, 16], [11, 16], [13, 16], [9, 18], [11, 18], [13, 18]]);
dz("floor7", "mon2", [[9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [8, 9], [9, 9], [11, 9], [12, 9], [15, 9], [16, 9], [22, 2], [26, 2], [19, 16], [26, 16]], { item: true });
dz("floor7", "rgbkb", [[19, 19], [26, 19], [8, 12], [9, 12], [15, 12], [16, 12]], { item: true });
dz("floor7", "mon", [[2, 2], [22, 5], [26, 5], [22, 9], [25, 9]], { item: true });
dz("floor7", "papers", [[3, 2], [2, 9], [10, 17], [12, 17]], { item: true });
// Lobby
dz("lobby", "window", [[1, 0], [3, 0], [4, 0], [5, 0], [6, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0]], { wall: true });
dz("lobby", "directory", [[7, 0]], { wall: true }); dz("lobby", "logo", [[8, 0]], { wall: true }); dz("lobby", "logo2", [[9, 0]], { wall: true });
dz("lobby", "couchL", [[13, 2]], { solid: true }); dz("lobby", "couchR", [[14, 2]], { solid: true });
dz("lobby", "plant", [[16, 1], [12, 2], [1, 8]], { solid: true });
dz("lobby", "mon", [[7, 4]], { item: true }); dz("lobby", "phone", [[9, 4]], { item: true });
dz("home", "window", [[2, 0], [3, 0], [5, 0], [6, 0], [12, 0], [17, 0], [18, 0], [19, 0], [24, 0], [25, 0]], { wall: true });
dz("home", "art", [[11, 0]], { wall: true }); dz("home", "clock", [[26, 0]], { wall: true });
dz("home", "rug", [[16, 3], [17, 3], [18, 3], [19, 3], [16, 4], [17, 4], [18, 4], [19, 4]]);
dz("home", "plant", [[20, 1], [9, 8]], { solid: true });
dz("home", "books", [[11, 8]], { solid: true });
dz("home", "chairO", [[13, 2]]);

const DSOLID = {};
for (const [id, list] of Object.entries(DECOR)) DSOLID[id] = new Set(list.filter((d) => d.solid).map((d) => d.x + "," + d.y));
export function decorFor(id) { return DECOR[id] || []; }
export function decorSolidAt(id, x, y) { return !!(DSOLID[id] && DSOLID[id].has(x + "," + y)); }

export const PLAYER_SPRITE = { body:"#2E6FB0", body2:"#1B4E84", accent:"#FCDE5A", hair:"#2C2C2A", skin:"#C9926B" };

// ---- FLOOR 3 rooms / people / props (the original Help Desk) --------------
const ROOMS3 = [
  { name: "IT room",       x: 1,  y: 1,  w: 5,  h: 6 },
  { name: "Reception",     x: 7,  y: 1,  w: 12, h: 6 },
  { name: "Open desks",    x: 20, y: 1,  w: 8,  h: 6 },
  { name: "Print room",    x: 1,  y: 8,  w: 5,  h: 6 },
  { name: "Open desks 2",  x: 7,  y: 8,  w: 7,  h: 6 },
  { name: "Break room",    x: 15, y: 8,  w: 4,  h: 6 },
  { name: "Director",      x: 20, y: 8,  w: 8,  h: 6 },
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
  { id: "riley", name: "Riley", role: "Open desks 2", x: 10, y: 10, ticket: "permissions",
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


// ---- v2 cast on Floor 3 (ids stay stable; display names live in `name`) ----
// Chain of command: Director Chen (IT Director) -> Tasha (Help Desk Lead,
// your boss, the kit-giver) -> YOU (Tier 1 tech) -> Kai (IT intern).
// Beside you: Benny (Service Desk Coordinator, the lifeline), Gloria (Service
// Desk Manager, runs the ticket audit), Harold (Change Manager, runs the bridge).
NPCS3.push(
  { id: "tasha", name: "Tasha", role: "Help Desk Lead · your boss", x: 1, y: 4, facing: "right", cast: true,
    sprite: { body:"#6C3FA0", body2:"#4A2A70", accent:"#FCDE5A", hair:"#1a1a18", skin:"#8A5A3A", glasses:true },
    chat: ["If it isn't in the ticket, it didn't happen.","Verify the human, then fix the thing.","You're doing great. Drink some water."] },
  { id: "kai", name: "Kai", role: "IT intern", x: 5, y: 6, cast: true,
    sprite: { body:"#EF9F27", body2:"#BA7517", accent:"#FFF3D6", hair:"#412402", skin:"#E0B080" },
    chat: ["I labeled the labels. Is that too far?","Tasha says I'm allowed to watch you image a laptop.","Is it normal that the printer knows my name?"] },
  { id: "benny", name: "Benny", role: "Service Desk Coordinator", x: 24, y: 4, cast: true,
    sprite: { body:"#1D7FA8", body2:"#135A78", accent:"#D6F2FF", hair:"#6B4A2A", skin:"#D8B088" },
    chat: ["I route the queue. Call me if you're stuck; that's literally my job.","Priority is impact times urgency. Everything else is vibes.","Three calls a week. Use 'em when it counts."] },
  { id: "gloria", name: "Gloria", role: "Service Desk Manager · ticket QA", x: 21, y: 12, cast: true,
    sprite: { body:"#A33A5A", body2:"#72283F", accent:"#F7D6E0", hair:"#888780", skin:"#C9926B", glasses:true },
    chat: ["I read every closed ticket. Every. One.","A ticket with no notes is a mystery novel with the last page torn out.","Honesty I can work with. Surprises I can't."] },
  { id: "harold", name: "Harold", role: "Change Manager · runs the bridge", x: 15, y: 19, cast: true,
    sprite: { body:"#44505C", body2:"#2E3740", accent:"#FFFFFF", hair:"#C8C4B4", skin:"#E0B080", glasses:true },
    chat: ["No change without a backout plan. Not on my bridge.","Go/no-go is a question, not a formality.","Hypercare means we stay close until the business says it's boring."] }
);
// Director Chen keeps his id and his "change" ticket; he's the IT Director now.
{ const c = NPCS3.find((n) => n.id === "chen"); if (c) { c.name = "Director Chen"; c.role = "IT Director"; } }
// Sign-off owners: Ed runs Accounting, Karen runs Reception, Riley runs Ops.
{ const e = NPCS3.find((n) => n.id === "ed"); if (e) e.role = "Accounting lead"; }
{ const r = NPCS3.find((n) => n.id === "riley"); if (r) r.role = "Office / Ops manager"; }

// Before their ticket shows up, people don't talk like it's already fixed.
const PRECHAT = {
  priya: ["New laptop tomorrow, right? Please tell me my shortcuts come with it."],
  jordan: ["I have 74 tabs open and I refuse to explain myself."],
  riley: ["Ops is ready for the swap. Mostly. Emotionally."],
  chen: ["Welcome aboard. Tasha says you listen. That's the whole job, honestly."],
  karen: ["Front desk. If a stranger asks for the server room, I send them to you."],
  marcus: ["Wi-Fi's been fine. I'm knocking on my desk as I say that."],
  dana: ["The printer and I have an understanding."]
};
for (const [id, lines] of Object.entries(PRECHAT)) {
  const n = NPCS3.find((x) => x.id === id); if (n) n.preChat = lines;
}

PROPS3.push(
  { id: "workpc", x: 3, y: 2, label: "your work PC", room: "IT room", kind: "workpc" },
  { id: "kiboard", x: 1, y: 1, label: "the known-issues whiteboard", room: "IT room", kind: "kiboard" },
  { id: "backup", x: 3, y: 16, label: "the backup console", room: "Server closet", kind: "backup" },
  // D1 inventory walk: asset-tag every machine in Reception + Accounting
  { id: "tag-r1", x: 10, y: 2, label: "Reception PC #1", room: "Reception", kind: "assettag", serial: "5CG31872QX", user: "front desk (shared)" },
  { id: "tag-r2", x: 14, y: 2, label: "Karen's PC", room: "Reception", kind: "assettag", serial: "5CG31872RB", user: "Karen" },
  { id: "tag-a1", x: 19, y: 16, label: "Ed's PC", room: "Accounting", kind: "assettag", serial: "5CG29904KM", user: "Ed" },
  { id: "tag-a2", x: 26, y: 16, label: "Lisa's PC", room: "Accounting", kind: "assettag", serial: "5CG29904LA", user: "Lisa" },
  { id: "tag-a3", x: 19, y: 19, label: "AP clerk PC", room: "Accounting", kind: "assettag", serial: "5CG29904LZ", user: "Brenda" },
  { id: "tag-a4", x: 26, y: 19, label: "Payroll PC", room: "Accounting", kind: "assettag", serial: "5CG29904MC", user: "Luis" },
  // D2 swap station on the conference table
  { id: "st-bench", x: 10, y: 17, label: "the imaging bench", room: "Conf. room", kind: "station", station: "bench" },
  { id: "st-xfer", x: 12, y: 17, label: "the data-transfer station", room: "Conf. room", kind: "station", station: "xfer" },
  { id: "st-wait", x: 7, y: 16, label: "the waiting area", room: "Conf. room", kind: "station", station: "wait" },
  // "Maintenance in progress" notices: posted on D1 with the user notice, pulled on D3
  { id: "sign-r", x: 18, y: 1, label: "a maintenance notice", room: "Reception", kind: "notice", needFlag: "noticeSent", hideFlag: "pulled_sign-r", walkable: true },
  { id: "sign-a", x: 22, y: 15, label: "a maintenance notice", room: "Accounting", kind: "notice", needFlag: "noticeSent", hideFlag: "pulled_sign-a", walkable: true },
  { id: "sign-o", x: 7, y: 8, label: "a maintenance notice", room: "Open desks 2", kind: "notice", needFlag: "noticeSent", hideFlag: "pulled_sign-o", walkable: true }
);

// v2.1 fixtures: furniture you can actually use (drawn by the decor painter).
PROPS3.push(
  { id: "fx-fridge", x: 15, y: 8, label: "the break-room fridge", room: "Break room", kind: "fixture", art: "fridge" },
  { id: "fx-coffee", x: 16, y: 8, label: "the coffee machine", room: "Break room", kind: "fixture", art: "coffee" },
  { id: "fx-micro", x: 17, y: 8, label: "the microwave", room: "Break room", kind: "fixture", art: "micro" },
  { id: "fx-vending", x: 18, y: 13, label: "the vending machine", room: "Break room", kind: "fixture", art: "vending" },
  { id: "fx-cooler", x: 15, y: 13, label: "the water cooler", room: "Break room", kind: "fixture", art: "cooler" },
  { id: "fx-tank", x: 16, y: 1, label: "the reception fish tank", room: "Reception", kind: "fixture", art: "aquarium" },
  { id: "fx-copier", x: 1, y: 9, label: "the big copier", room: "Print room", kind: "fixture", art: "copier" }
);

// Spots the visitor systems use on Floor 3 (validated as walkable).
export const F3_SPOTS = {
  arrive: { x: 5, y: 2 },            // step out of the elevator
  swapQueue: [ { x: 8, y: 19 }, { x: 10, y: 19 }, { x: 12, y: 19 }, { x: 14, y: 18 } ],
  vendorPost: { x: 3, y: 18 },
  hideouts: [
    { x: 2, y: 12, where: "the print room" }, { x: 8, y: 20, where: "the conference room" },
    { x: 27, y: 6, where: "the open desks" }, { x: 27, y: 8, where: "outside Director Chen's office" },
    { x: 10, y: 13, where: "open desks 2" }, { x: 18, y: 20, where: "Accounting" },
    { x: 16, y: 5, where: "Reception" }
  ],
  violations: [
    { id: "v-screen", x: 12, y: 9, label: "an unlocked, unattended screen", fix: "Lock it (Win+L) and remind the owner" , desk: true },
    { id: "v-sticky", x: 8, y: 12, label: "a password on a sticky note", fix: "Pull the note, get the user into the password manager", desk: true },
    { id: "v-door", x: 6, y: 17, label: "the server closet door, propped open", fix: "Kick the wedge, let it latch, report it", walkable: true },
    { id: "v-print", x: 2, y: 9, label: "a payroll printout left on the printer desk", fix: "Collect it and drop it in the locked shred bin", desk: true }
  ],
  ewaste: [
    { id: "ew1", x: 11, y: 5, label: "old Reception laptop" }, { id: "ew2", x: 17, y: 3, label: "old front-desk laptop" },
    { id: "ew3", x: 21, y: 17, label: "old laptop (Ed's)" }, { id: "ew4", x: 24, y: 20, label: "old laptop (Brenda's)" },
    { id: "ew5", x: 27, y: 17, label: "old laptop (Lisa's)" }, { id: "ew6", x: 23, y: 16, label: "old laptop (Luis's)" },
    { id: "ew7", x: 1, y: 17, label: "a pulled server drive" }, { id: "ew8", x: 5, y: 20, label: "a pulled server drive" }
  ]
};

// ---- HOME: rooms / people / props ----------------------------------------
const ROOMSH = [
  { name: "Bedroom", x: 1, y: 1, w: 9, h: 8 },
  { name: "Living room", x: 11, y: 1, w: 10, h: 8 },
  { name: "Kitchen", x: 22, y: 1, w: 7, h: 8 },
  { name: "31st St · Astoria", x: 1, y: 10, w: 28, h: 8 }
];
const NPCSH = [
  { id: "ahmed", name: "Ahmed", role: "Bodega coffee · 31st St", x: 8, y: 12, coffee: true,
    sprite: { body:"#3B7A57", body2:"#255038", accent:"#FFFFFF", hair:"#1a1a18", skin:"#A8744E" },
    chat: ["Regular? Milk, two sugars. I remember everybody.","You look like you fix computers. My register beeps. Forever."] }
];
const PROPSH = [
  { id: "bed", x: 3, y: 2, label: "your bed", room: "Bedroom", kind: "bed" },
  { id: "laptop", x: 13, y: 1, label: "your laptop", room: "Living room", kind: "laptop" },
  { id: "subway-h", x: 25, y: 13, label: "the 36 Av station (N/W)", room: "31st St", kind: "subway", to: "lobby" },
  { id: "cart-h", x: 7, y: 12, label: "Ahmed's coffee cart", room: "31st St", kind: "decor", art: "cart" }
];

// ---- LOBBY: rooms / people / props ---------------------------------------
const ROOMSL = [
  { name: "Lobby", x: 1, y: 1, w: 16, h: 8 },
  { name: "IT storeroom", x: 18, y: 1, w: 11, h: 8 },
  { name: "W 49th St", x: 1, y: 10, w: 28, h: 3 },
  { name: "Byte Bodega", x: 1, y: 14, w: 9, h: 7 },
  { name: "The Stack", x: 18, y: 14, w: 11, h: 7 }
];
const NPCSL = [
  { id: "lou", name: "Lou", role: "Building security", x: 8, y: 4, cast: true,
    sprite: { body:"#2C3E50", body2:"#1B2631", accent:"#F1C40F", hair:"#888780", skin:"#8A5A3A", hat:"#2C3E50" },
    chat: ["Badge in, badge out. Every time. Even you.","Nobody goes upstairs without a badge or an escort.","I've seen every trick. The pizza box one is my favorite."] },
  { id: "mo", name: "Mo", role: "IT storeroom · assets", x: 23, y: 4, cast: true,
    sprite: { body:"#7A4E2D", body2:"#55361F", accent:"#FFD9A0", hair:"#2C2C2A", skin:"#C9926B" },
    chat: ["If it has a serial number, it has a line in my book.","Loaners come back. That's what 'loan' means.","The cage is locked for a reason. The reason is me."] },
  { id: "ray", name: "Ray", role: "Byte Bodega", x: 4, y: 15, cast: true, shop: true,
    sprite: { body:"#C0392B", body2:"#8E261B", accent:"#FFFFFF", hair:"#1a1a18", skin:"#D8B088" },
    chat: ["Cables, dongles, snacks, and a cat named Router.","You IT people always need one more adapter.","Receipt? Just ask. I print 'em all day."] },
  { id: "lupe", name: "Lupe", role: "Coffee cart · W 49th", x: 4, y: 11, coffee: true,
    sprite: { body:"#D4537E", body2:"#993556", accent:"#FFF3D6", hair:"#412402", skin:"#C9926B" },
    chat: ["Cold brew hits different at 7 AM.","Your whole floor drinks oat milk now. I don't ask."] },
  { id: "nico", name: "Nico", role: "Bartender · The Stack", x: 23, y: 15, cast: true,
    sprite: { body:"#1f1f1d", body2:"#0d0d0c", accent:"#E8B923", hair:"#6B4A2A", skin:"#E0B080" },
    chat: ["Private event tonight. IT? You're in.","The WiFi password here is on the chalkboard, and yes, that's on purpose."] },
  // happy-hour crowd (appears when the party opens on Day 3)
  { id: "p-tasha", name: "Tasha", role: "Help Desk Lead", x: 21, y: 17, needFlag: "partyOpen", party: true,
    sprite: { body:"#6C3FA0", body2:"#4A2A70", accent:"#FCDE5A", hair:"#1a1a18", skin:"#8A5A3A", glasses:true },
    chat: ["To the new kid! Who is not a kid. Who is great."] },
  { id: "p-benny", name: "Benny", role: "Service Desk Coordinator", x: 22, y: 19, needFlag: "partyOpen", party: true,
    sprite: { body:"#1D7FA8", body2:"#135A78", accent:"#D6F2FF", hair:"#6B4A2A", skin:"#D8B088" },
    chat: ["Zero P1s this week. I'm framing the dashboard."] },
  { id: "p-kai", name: "Kai", role: "IT intern", x: 26, y: 17, needFlag: "partyOpen", party: true,
    sprite: { body:"#EF9F27", body2:"#BA7517", accent:"#FFF3D6", hair:"#412402", skin:"#E0B080" },
    chat: ["I imaged six laptops and I've never felt more alive."] },
  { id: "p-chen", name: "Director Chen", role: "IT Director", x: 27, y: 19, needFlag: "partyOpen", party: true,
    sprite: { body:"#378ADD", body2:"#185FA5", accent:"#F1EFE8", hair:"#2C2C2A", skin:"#B08050", glasses:true },
    chat: ["First round's on the department. Second round's on the budget I don't have."] },
  { id: "p-gloria", name: "Gloria", role: "Service Desk Manager", x: 19, y: 20, needFlag: "partyOpen", party: true,
    sprite: { body:"#A33A5A", body2:"#72283F", accent:"#F7D6E0", hair:"#888780", skin:"#C9926B", glasses:true },
    chat: ["I read your tickets. I'm not crying, the bar's just dusty."] },
  { id: "p-harold", name: "Harold", role: "Change Manager", x: 24, y: 20, needFlag: "partyOpen", party: true,
    sprite: { body:"#44505C", body2:"#2E3740", accent:"#FFFFFF", hair:"#C8C4B4", skin:"#E0B080", glasses:true },
    chat: ["Change successful. Hypercare closed. I may even smile."] }
];
const PROPSL = [
  { id: "elevator-l", x: 2, y: 1, label: "the elevator", room: "Lobby", kind: "elevator" },
  { id: "subway-l", x: 14, y: 11, label: "the 49 St station (N/R/W)", room: "W 49th St", kind: "subway", to: "home" },
  { id: "cage", x: 27, y: 2, label: "the e-waste cage", room: "IT storeroom", kind: "cage" },
  { id: "cart-l", x: 3, y: 11, label: "Lupe's coffee cart", room: "W 49th St", kind: "decor", art: "cart" },
  { id: "loaner", x: 20, y: 7, label: "the loaner cart", room: "IT storeroom", kind: "decor", art: "loaner", hideFlag: "cartOut" },
  { id: "bar-door", x: 23, y: 13, label: "The Stack's door", room: "W 49th St", kind: "bardoor", hideFlag: "partyOpen" },
  { id: "bb-shelf", x: 7, y: 19, label: "the cable wall", room: "Byte Bodega", kind: "decor", art: "shelf" }
];
export const LOBBY_SPOTS = {
  arrive: { x: 2, y: 2 },
  street: { x: 13, y: 11 },
  recycler: { x: 26, y: 7 },
  socEntry: { x: 8, y: 11 }
};

// ---- map registry + live-binding switch -----------------------------------
// FLOOR_ORDER is what the elevator offers (home is reached by subway only).
export const FLOOR_ORDER = ["lobby", "floor3", "floor7"];
export const FLOOR_META = {
  home:   { id: "home", name: "Home", short: "HM", label: "HOME · ASTORIA, QUEENS",
            tag: "Your apartment", blurb: "Bed, laptop, coffee. The subway's on the corner.", locked: false },
  lobby:  { id: "lobby", name: "Lobby", short: "L", label: "GROUND FLOOR · W 49TH ST",
            tag: "Lobby · storeroom · the block", blurb: "Security desk, IT storeroom, Byte Bodega, The Stack.", locked: false },
  floor3: { id: "floor3", name: "Floor 3", short: "F3", label: "IT SUPPORT · FLOOR 3",
            tag: "Help Desk", blurb: "Your desk, the queue, Accounting and Reception.", locked: false },
  floor7: { id: "floor7", name: "Floor 7", short: "F7", label: "SECURITY OPS · FLOOR 7",
            tag: "Security Operations", blurb: "Advanced: Security+, PenTest+, Network+.", locked: true }
};

const FLOORS = {
  home:   { map: HOME,     rooms: ROOMSH, npcs: NPCSH, props: PROPSH, start: { x: 4, y: 2, dir: "left" }, label: FLOOR_META.home.label,
            arrive: { subway: { x: 24, y: 13, dir: "left" } } },
  lobby:  { map: LOBBYMAP, rooms: ROOMSL, npcs: NPCSL, props: PROPSL, start: { x: 2, y: 2, dir: "down" }, label: FLOOR_META.lobby.label,
            arrive: { elevator: { x: 2, y: 2, dir: "down" }, subway: { x: 13, y: 11, dir: "right" } } },
  floor3: { map: FLOOR3MAP, rooms: ROOMS3, npcs: NPCS3, props: PROPS3, start: { x: 2, y: 5, dir: "down" }, label: FLOOR_META.floor3.label,
            arrive: { elevator: { x: 5, y: 2, dir: "down" } } },
  floor7: { map: SOC,    rooms: ROOMS7, npcs: NPCS7, props: PROPS7, start: { x: 2, y: 5, dir: "down" }, label: FLOOR_META.floor7.label,
            arrive: { elevator: { x: 5, y: 2, dir: "down" } } }
};
export const MAP_IDS = Object.keys(FLOORS);
export function mapDef(id) { return FLOORS[id] || null; }

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

// Where you land when you arrive by elevator / subway (falls back to start).
export function arrivalFor(id, via) {
  const f = FLOORS[id]; if (!f) return { x: 2, y: 5, dir: "down" };
  return (f.arrive && f.arrive[via]) || f.start;
}

export function isWalkable(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
  return !BLOCKING.has(MAP[y][x]) && !decorSolidAt(FLOOR_ID, x, y);
}
// Same test against any map (visitors + validators).
export function isWalkableOn(id, x, y) {
  const f = FLOORS[id]; if (!f) return false;
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
  return !BLOCKING.has(f.map[y][x]) && !decorSolidAt(id, x, y);
}

// v2: audit findings + e-waste devices are real props, hidden until their flag.
for (const v of F3_SPOTS.violations) {
  PROPS3.push({ id: v.id, x: v.x, y: v.y, label: v.label, fix: v.fix, room: "Floor 3", kind: "violation",
    needFlag: "aud_" + v.id, hideFlag: "fixed_" + v.id, walkable: !!v.walkable });
}
for (const e of F3_SPOTS.ewaste) {
  PROPS3.push({ id: e.id, x: e.x, y: e.y, label: e.label, room: "Floor 3", kind: "ewaste",
    needFlag: "signoffsDone", hideFlag: "ew_" + e.id, walkable: true });
}
