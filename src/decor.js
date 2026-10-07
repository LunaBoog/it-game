// v2.1 decor painter: everything that makes the floors look like a real office.
// Pure canvas drawing, no game state. render.js bakes most of it into the
// per-map cache (walls, floors, desks, furniture, light) and calls the
// animated bits every frame (server LEDs, the SOC video wall, fixtures).
//
// 3/4 top-down convention: a wall tile with floor below it shows its FACE
// (cap, painted wall, baseboard); every other wall tile shows its TOP.

import { TILE, MAP_W, MAP_H } from "./world.js";

const T = TILE;
function rr(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
function hash2(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
const isWallCh = (ch) => ch === "W";
const FLOORISH = new Set([".", "o", "e", "f", "k", "s", "m", "t", "q", "x", "g", "u", "z", "c"]);

// per-map palettes
const STYLE = {
  floor3: { cap: "#3E434B", capHi: "#555B64", paint: "#E4DED3", paintSh: "#D3CCBF", base: "#8F8578", desk: "#E9E4DA", deskEdge: "#C9C1B2", deskFront: "#A99F8F", wood: "#B88A5B" },
  floor5: { cap: "#2B333D", capHi: "#3F4955", paint: "#C7D2DC", paintSh: "#B5C1CC", base: "#5E6B78", desk: "#DCE3E8", deskEdge: "#B8C3CC", deskFront: "#8E9BA6", wood: "#8C6A48" },
  floor7: { cap: "#1E232C", capHi: "#2E3542", paint: "#343C4B", paintSh: "#2B3240", base: "#151920", desk: "#4A5262", deskEdge: "#3A4150", deskFront: "#262B35", wood: "#5A4A3A" },
  lobby:  { cap: "#4A4038", capHi: "#5E5248", paint: "#D9CBB4", paintSh: "#C8B99F", base: "#6E5A44", desk: "#E9E4DA", deskEdge: "#C9C1B2", deskFront: "#A99F8F", wood: "#9C6B3E" },
  home:   { cap: "#4E4640", capHi: "#625850", paint: "#E8DCC6", paintSh: "#D9CBB1", base: "#7A6248", desk: "#C49A6C", deskEdge: "#A97F55", deskFront: "#8A6440", wood: "#B88A5B" }
};
export function styleFor(mapId) { return STYLE[mapId] || STYLE.floor3; }

// ---- walls ------------------------------------------------------------------
export function paintWall(c, x, y, rows, mapId) {
  const st = styleFor(mapId), px = x * T, py = y * T;
  const below = y + 1 < MAP_H ? rows[y + 1][x] : "W";
  const face = !isWallCh(below);
  if (face && below === "s") { paintFacade(c, x, y, px, py); return; }
  if (face) {
    rr(c, px, py, T, 9, st.cap);
    rr(c, px, py, T, 2, st.capHi);
    rr(c, px, py + 9, T, T - 9, st.paint);
    rr(c, px, py + 9, T, 2, "rgba(0,0,0,0.18)");                 // under-cap shadow
    rr(c, px, py + T - 5, T, 5, st.base);                        // baseboard
    rr(c, px, py + T - 5, T, 1, "rgba(255,255,255,0.18)");
    if (hash2(x, y) > 0.5) rr(c, px + ((x * 7) % 26), py + 13, 1, 12, "rgba(0,0,0,0.03)");
    // side shading where the face meets a wall stub
    const l = x > 0 ? rows[y][x - 1] : "W", r = x < MAP_W - 1 ? rows[y][x + 1] : "W";
    if (!isWallCh(l)) rr(c, px, py + 9, 2, T - 9, "rgba(0,0,0,0.12)");
    if (!isWallCh(r)) rr(c, px + T - 2, py + 9, 2, T - 9, "rgba(0,0,0,0.12)");
  } else {
    rr(c, px, py, T, T, st.cap);
    // trim where the top meets open floor on a side or above
    const up = y > 0 ? rows[y - 1][x] : "W";
    const l = x > 0 ? rows[y][x - 1] : "W", r = x < MAP_W - 1 ? rows[y][x + 1] : "W";
    if (!isWallCh(up)) rr(c, px, py, T, 2, st.capHi);
    if (!isWallCh(l)) rr(c, px, py, 2, T, st.capHi);
    if (!isWallCh(r)) rr(c, px + T - 2, py, 2, T, "rgba(0,0,0,0.25)");
    if ((x + y) % 2 === 0) rr(c, px + 6, py + 14, 20, 1, "rgba(255,255,255,0.03)");
  }
}

// street-facing walls: brick with a cornice, a little window or a lamp
function paintFacade(c, x, y, px, py) {
  rr(c, px, py, T, 6, "#3B2E28"); rr(c, px, py, T, 1, "#5A463C");
  rr(c, px, py + 6, T, T - 6, "#8E4B37");
  c.fillStyle = "#7A3F2E";
  for (let r = 0; r < 6; r++) { const yy = py + 7 + r * 4; c.fillRect(px, yy + 3, T, 1); const off = (r % 2) * 4; for (let i = off; i < T; i += 8) c.fillRect(px + i, yy, 1, 3); }
  const h = hash2(x, y, 5);
  if (h > 0.55) { rr(c, px + 9, py + 10, 14, 13, "#2A2622"); rr(c, px + 10, py + 11, 12, 11, h > 0.8 ? "#F2C94C" : "#3E5A74"); rr(c, px + 15, py + 11, 1, 11, "#2A2622"); rr(c, px + 8, py + 23, 16, 2, "#C9B9A6"); }
  else if (h < 0.12) { rr(c, px + 14, py + 9, 4, 5, "#2C2C2A"); rr(c, px + 15, py + 14, 2, 2, "#F2C94C"); }
  rr(c, px, py + T - 3, T, 3, "#6E6A64");
}

// soft contact shadows on floor next to walls and solid furniture
export function paintFloorShadows(c, x, y, rows) {
  const px = x * T, py = y * T;
  const up = y > 0 ? rows[y - 1][x] : "W", l = x > 0 ? rows[y][x - 1] : "W";
  if (isWallCh(up)) { const g = c.createLinearGradient(0, py, 0, py + 8); g.addColorStop(0, "rgba(0,0,0,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(px, py, T, 8); }
  if (isWallCh(l)) { const g = c.createLinearGradient(px, 0, px + 5, 0); g.addColorStop(0, "rgba(0,0,0,0.16)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(px, py, 5, T); }
  // door threshold: floor tile sandwiched between walls
  const dn = y < MAP_H - 1 ? rows[y + 1][x] : "W", r = x < MAP_W - 1 ? rows[y][x + 1] : "W";
  if (isWallCh(up) && isWallCh(dn)) { rr(c, px, py + 2, T, 3, "rgba(0,0,0,0.12)"); rr(c, px, py + T - 5, T, 3, "rgba(0,0,0,0.12)"); }
  if (isWallCh(l) && isWallCh(r)) { rr(c, px + 2, py, 3, T, "rgba(0,0,0,0.10)"); rr(c, px + T - 5, py, 3, T, "rgba(0,0,0,0.10)"); }
}

// ---- floors ------------------------------------------------------------------
export function paintFloor(c, x, y, code) {
  const px = x * T, py = y * T, h = hash2(x, y);
  switch (code) {
    case ".": { // light vinyl tile
      rr(c, px, py, T, T, "#D6D9DC");
      rr(c, px, py, T, 1, "#C3C7CB"); rr(c, px, py, 1, T, "#C3C7CB");
      rr(c, px + 16, py, 1, T, "rgba(0,0,0,0.05)"); rr(c, px, py + 16, T, 1, "rgba(0,0,0,0.05)");
      for (let i = 0; i < 5; i++) rr(c, px + Math.floor(hash2(x, y, i) * 30), py + Math.floor(hash2(y, x, i) * 30), 1, 1, i % 2 ? "#B9BEC3" : "#E8EAEC");
      return true;
    }
    case "o": case "u": case "q": case "g": case "z": { // carpet tiles, quarter-turned
      const P = { o: ["#7E8A97", "#76828F", "#8A96A3"], u: ["#8E9F8B", "#869783", "#99AA96"], q: ["#9B8574", "#937D6C", "#A69080"],
        g: ["#45587A", "#3F5172", "#4F6386"], z: ["#2C323D", "#282E38", "#343B48"] }[code];
      rr(c, px, py, T, T, P[0]);
      const turn = (x + y) % 2 === 0;
      c.fillStyle = P[1];
      for (let i = 2; i < T; i += 4) { if (turn) c.fillRect(px + 1, py + i, T - 2, 1); else c.fillRect(px + i, py + 1, 1, T - 2); }
      rr(c, px, py, T, 1, "rgba(0,0,0,0.10)"); rr(c, px, py, 1, T, "rgba(0,0,0,0.10)");
      for (let i = 0; i < 6; i++) rr(c, px + Math.floor(hash2(x, y, i + 3) * 31), py + Math.floor(hash2(x + 9, y, i) * 31), 1, 1, P[2]);
      if (code === "z" && h > 0.7) rr(c, px + 9, py + 20, 1, 1, "#3E6FA8");
      return true;
    }
    case "x": { // raised data-center floor, perforated panels
      rr(c, px, py, T, T, "#B5BBC1");
      rr(c, px, py, T, 1, "#8E959C"); rr(c, px, py, 1, T, "#8E959C");
      rr(c, px + 1, py + 1, T - 2, 1, "#CBD0D5");
      if ((x * 3 + y) % 3 === 0) { c.fillStyle = "#8C939A"; for (let i = 6; i < 28; i += 4) for (let j = 6; j < 28; j += 4) c.fillRect(px + i, py + j, 1, 1); }
      return true;
    }
    case "f": { // oak planks
      rr(c, px, py, T, T, "#C29466");
      const off = (y % 2) * 13;
      c.fillStyle = "rgba(0,0,0,0.10)"; c.fillRect(px, py + 7, T, 1); c.fillRect(px, py + 15, T, 1); c.fillRect(px, py + 23, T, 1); c.fillRect(px, py + 31, T, 1);
      c.fillRect(px + ((off + 5) % 32), py, 1, 7); c.fillRect(px + ((off + 21) % 32), py + 8, 1, 7); c.fillRect(px + ((off + 11) % 32), py + 16, 1, 7); c.fillRect(px + ((off + 27) % 32), py + 24, 1, 7);
      c.fillStyle = "rgba(255,255,255,0.06)"; c.fillRect(px, py + 1, T, 1); c.fillRect(px, py + 17, T, 1);
      if (h > 0.6) rr(c, px + Math.floor(h * 20), py + 11, 4, 1, "rgba(80,40,10,0.15)");
      return true;
    }
    case "k": { // break-room checker
      rr(c, px, py, T, T, "#EDEBE4");
      c.fillStyle = "#6FA59A";
      c.fillRect(px, py, 16, 16); c.fillRect(px + 16, py + 16, 16, 16);
      rr(c, px, py, T, 1, "rgba(0,0,0,0.08)"); rr(c, px, py, 1, T, "rgba(0,0,0,0.08)");
      return true;
    }
  }
  return false;
}

// ---- desks, counters, chairs, racks ---------------------------------------------
export function paintDesk(c, x, y, rows, mapId) {
  const st = styleFor(mapId), px = x * T, py = y * T;
  const L = x > 0 && rows[y][x - 1] === "D", Rr = x < MAP_W - 1 && rows[y][x + 1] === "D";
  // shadow on the floor under the desk
  rr(c, px + (L ? 0 : 2), py + T - 4, T - (L ? 0 : 2) - (Rr ? 0 : 2), 4, "rgba(0,0,0,0.22)");
  // modesty panel (front)
  rr(c, px + (L ? 0 : 2), py + 20, T - (L ? 0 : 2) - (Rr ? 0 : 2), 9, st.deskFront);
  rr(c, px + (L ? 0 : 2), py + 20, T - (L ? 0 : 2) - (Rr ? 0 : 2), 1, "rgba(0,0,0,0.25)");
  // top
  rr(c, px + (L ? 0 : 1), py + 4, T - (L ? 0 : 1) - (Rr ? 0 : 1), 17, st.desk);
  rr(c, px + (L ? 0 : 1), py + 4, T - (L ? 0 : 1) - (Rr ? 0 : 1), 1, "rgba(255,255,255,0.5)");
  rr(c, px + (L ? 0 : 1), py + 19, T - (L ? 0 : 1) - (Rr ? 0 : 1), 2, st.deskEdge);
  if (!L) rr(c, px + 1, py + 4, 1, 17, st.deskEdge);
  if (!Rr) rr(c, px + T - 2, py + 4, 1, 17, st.deskEdge);
  if (L) rr(c, px, py + 5, 1, 14, "rgba(0,0,0,0.06)"); // seam between joined desks
}
export function paintCounter(c, x, y, rows, mapId) {
  const st = styleFor(mapId), px = x * T, py = y * T;
  const L = x > 0 && rows[y][x - 1] === "K", Rr = x < MAP_W - 1 && rows[y][x + 1] === "K";
  rr(c, px, py + T - 4, T, 4, "rgba(0,0,0,0.25)");
  rr(c, px + (L ? 0 : 1), py + 12, T - (L ? 0 : 1) - (Rr ? 0 : 1), 17, mapId === "home" ? st.wood : "#5E3F28"); // walnut front
  rr(c, px + (L ? 0 : 1), py + 26, T - (L ? 0 : 1) - (Rr ? 0 : 1), 2, "#3B2716");
  c.fillStyle = "rgba(0,0,0,0.12)"; for (let i = 15; i < 29; i += 4) c.fillRect(px + (L ? 0 : 1), py + i, T - (L ? 0 : 1) - (Rr ? 0 : 1), 1);
  rr(c, px + (L ? 0 : 1), py + 3, T - (L ? 0 : 1) - (Rr ? 0 : 1), 10, "#F1EEE8");             // stone top
  rr(c, px + (L ? 0 : 1), py + 3, T - (L ? 0 : 1) - (Rr ? 0 : 1), 1, "#FFFFFF");
  rr(c, px + (L ? 0 : 1), py + 12, T - (L ? 0 : 1) - (Rr ? 0 : 1), 1, "rgba(0,0,0,0.3)");
}
export function paintChair(c, px, py, faceUp, col = "#2F3540", seat = "#3D4552") {
  rr(c, px + 9, py + 25, 14, 3, "rgba(0,0,0,0.22)");
  c.fillStyle = "#555"; c.fillRect(px + 15, py + 20, 2, 6); c.fillRect(px + 10, py + 25, 12, 1);
  c.fillStyle = seat; c.beginPath(); c.arc(px + 16, py + 16, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,255,255,0.08)"; c.fillRect(px + 12, py + 12, 7, 2);
  c.fillStyle = col;
  if (faceUp) c.fillRect(px + 9, py + 21, 14, 4); else c.fillRect(px + 9, py + 7, 14, 4);
}
export function paintRack(c, x, y, mapId) {
  const px = x * T, py = y * T;
  rr(c, px + 3, py + T - 3, T - 6, 3, "rgba(0,0,0,0.3)");
  rr(c, px + 4, py + 1, T - 8, T - 3, "#1D2025");
  rr(c, px + 4, py + 1, T - 8, 2, "#3A3F47");
  rr(c, px + 5, py + 3, T - 10, T - 7, "#121418");
  for (let i = 0; i < 6; i++) { rr(c, px + 6, py + 5 + i * 4, T - 12, 3, i % 3 === 1 ? "#2B2F36" : "#23272D"); rr(c, px + 6, py + 5 + i * 4, 4, 1, "#4A505A"); }
  rr(c, px + 4, py + 1, 1, T - 3, "#5A606A"); rr(c, px + T - 5, py + 1, 1, T - 3, "#0A0B0D");
}

// ---- decor pieces --------------------------------------------------------------
// `d` = { k, x, y }, `at(k,x,y)` tells the painter whether a neighbor has the same kind
export function paintDecor(c, d, at, mapId, tick = 0) {
  const px = d.x * T, py = d.y * T, k = d.k, st = styleFor(mapId);
  const shadow = (w = 20, ox = 6) => rr(c, px + ox, py + T - 4, w, 3, "rgba(0,0,0,0.22)");
  switch (k) {
    // wall faces
    case "window": {
      const top = py + 10, h = 17;
      rr(c, px + 1, top - 1, T - 2, h + 2, "#6B7480");
      const g = c.createLinearGradient(0, top, 0, top + h);
      g.addColorStop(0, mapId === "floor7" ? "#1B2A44" : "#9CC7E8"); g.addColorStop(1, mapId === "floor7" ? "#2C4166" : "#DCEAF3");
      c.fillStyle = g; c.fillRect(px + 2, top, T - 4, h);
      // Midtown skyline through the glass
      for (let i = 0; i < 4; i++) {
        const bw = 4 + Math.floor(hash2(d.x, i) * 5), bh = 5 + Math.floor(hash2(i, d.x) * 10), bx = px + 2 + i * 7 + Math.floor(hash2(d.x, i, 2) * 3);
        rr(c, bx, top + h - bh, bw, bh, mapId === "floor7" ? "#0F1828" : "#8DA3B8");
        if (mapId === "floor7" || hash2(d.x, i, 4) > 0.5) for (let wy = top + h - bh + 2; wy < top + h - 1; wy += 3) rr(c, bx + 1, wy, 1, 1, mapId === "floor7" ? "#F2C94C" : "#C9D9E6");
      }
      rr(c, px + 15, top, 2, h, "#6B7480");
      c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.moveTo(px + 4, top + h); c.lineTo(px + 9, top); c.lineTo(px + 11, top); c.lineTo(px + 6, top + h); c.fill();
      rr(c, px + 1, top + h, T - 2, 2, "#E9EDF0"); // sill
      return;
    }
    case "logo": case "logo2": {
      rr(c, px + (k === "logo" ? 4 : 0), py + 12, k === "logo" ? 28 : 28, 14, "#24303F");
      c.fillStyle = "#FCDE5A"; c.font = "bold 9px ui-monospace, monospace";
      c.fillText(k === "logo" ? "NORTH" : "WIND", px + (k === "logo" ? 6 : 1), py + 22);
      if (k === "logo") { c.fillStyle = "#6FE3FF"; c.beginPath(); c.arc(px + 4, py + 19, 2, 0, 7); c.fill(); }
      return;
    }
    case "seclogo": rr(c, px + 4, py + 12, 24, 13, "#0E1A12"); c.fillStyle = "#63B370"; c.font = "bold 8px ui-monospace, monospace"; c.fillText("SOC", px + 9, py + 21); return;
    case "clock": {
      c.fillStyle = "#2C2C2A"; c.beginPath(); c.arc(px + 16, py + 18, 6, 0, 7); c.fill();
      c.fillStyle = "#FAFAF7"; c.beginPath(); c.arc(px + 16, py + 18, 5, 0, 7); c.fill();
      c.strokeStyle = "#2C2C2A"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 16, py + 18); c.lineTo(px + 16, py + 14); c.moveTo(px + 16, py + 18); c.lineTo(px + 19, py + 19); c.stroke();
      return;
    }
    case "cork": {
      rr(c, px + 3, py + 11, 26, 15, "#8B5E34"); rr(c, px + 4, py + 12, 24, 13, "#C79A64");
      const cols = ["#FCDE5A", "#F4C0D1", "#9FE1CB", "#FFFFFF", "#85B7EB"];
      for (let i = 0; i < 5; i++) { rr(c, px + 5 + (i % 3) * 8, py + 13 + Math.floor(i / 3) * 6, 6, 5, cols[i]); rr(c, px + 7 + (i % 3) * 8, py + 13 + Math.floor(i / 3) * 6, 1, 1, "#C0392B"); }
      return;
    }
    case "wbL": case "wbR": {
      const l = k === "wbL";
      rr(c, px + (l ? 3 : 0), py + 11, l ? 29 : 29, 15, "#9AA0A6"); rr(c, px + (l ? 4 : 0), py + 12, l ? 28 : 28, 13, "#FBFBF8");
      c.strokeStyle = l ? "#185FA5" : "#C0392B"; c.lineWidth = 1; c.beginPath();
      if (l) { c.moveTo(px + 7, py + 21); c.lineTo(px + 12, py + 16); c.lineTo(px + 17, py + 19); c.lineTo(px + 24, py + 14); }
      else { c.rect(px + 4, py + 15, 7, 5); c.moveTo(px + 11, py + 17); c.lineTo(px + 17, py + 17); c.rect(px + 17, py + 15, 7, 5); }
      c.stroke();
      rr(c, px + (l ? 4 : 0), py + 26, 28, 1, "#7A8086");
      return;
    }
    case "art": {
      const pal = [["#E8B923", "#C0392B", "#2D7DD2"], ["#63B370", "#F4C0D1", "#2C2C2A"], ["#85B7EB", "#FCDE5A", "#7F77DD"]][Math.floor(hash2(d.x, d.y) * 3)];
      rr(c, px + 8, py + 11, 16, 14, "#2C2C2A"); rr(c, px + 9, py + 12, 14, 12, "#F4F1EA");
      rr(c, px + 10, py + 13, 6, 10, pal[0]); rr(c, px + 16, py + 13, 6, 5, pal[1]); rr(c, px + 16, py + 18, 6, 5, pal[2]);
      return;
    }
    case "poster": rr(c, px + 8, py + 11, 16, 15, "#F4F1EA"); rr(c, px + 9, py + 12, 14, 7, "#2BB3A3"); c.fillStyle = "#1a1a18"; c.font = "bold 5px ui-monospace, monospace"; c.fillText("WASH", px + 10, py + 23); c.fillText("MUGS", px + 10, py + 28 - 2); return;
    case "menu": rr(c, px + 6, py + 11, 20, 15, "#2C2C2A"); c.fillStyle = "#F1EFE8"; for (let i = 0; i < 4; i++) c.fillRect(px + 8, py + 13 + i * 3, 10 + (i % 2) * 5, 1); return;
    case "calendar": rr(c, px + 9, py + 11, 14, 15, "#FFFFFF"); rr(c, px + 9, py + 11, 14, 4, "#C0392B"); c.fillStyle = "#888780"; for (let i = 0; i < 9; i++) c.fillRect(px + 10 + (i % 3) * 4, py + 17 + Math.floor(i / 3) * 3, 2, 1); return;
    case "exit": rr(c, px + 9, py + 12, 14, 6, "#1D9E75"); c.fillStyle = "#fff"; c.font = "bold 5px ui-monospace, monospace"; c.fillText("EXIT", px + 10, py + 17); return;
    case "directory": rr(c, px + 5, py + 11, 22, 15, "#2C2C2A"); c.fillStyle = "#E8C547"; for (let i = 0; i < 5; i++) c.fillRect(px + 7, py + 13 + i * 2.5, 12 + (i % 3) * 3, 1); return;
    case "tvL": case "tvR": {
      const l = k === "tvL";
      rr(c, px + (l ? 4 : 0), py + 10, 28, 16, "#1a1a18");
      rr(c, px + (l ? 5 : 0), py + 11, l ? 27 : 27, 14, "#2D4A6E");
      c.fillStyle = "#FCDE5A"; c.font = "bold 6px ui-monospace, monospace";
      if (l) c.fillText("Q3 KPIs", px + 7, py + 17); else { rr(c, px + 3, py + 20, 3, 3, "#63B370"); rr(c, px + 8, py + 17, 3, 6, "#63B370"); rr(c, px + 13, py + 14, 3, 9, "#63B370"); }
      return;
    }
    case "patch": {
      rr(c, px + 3, py + 11, 26, 14, "#1D2025");
      for (let i = 0; i < 12; i++) rr(c, px + 5 + (i % 6) * 4, py + 13 + Math.floor(i / 6) * 5, 2, 2, ["#85B7EB", "#FCDE5A", "#63B370", "#E24B4A"][(i + d.x) % 4]);
      c.strokeStyle = "#2E7DD2"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 6, py + 16); c.quadraticCurveTo(px + 12, py + 26, px + 20, py + 20); c.stroke();
      return;
    }
    case "ir": rr(c, px + (d.x % 2 ? 0 : 3), py + 11, 29, 15, "#FBFBF8"); c.fillStyle = "#C0392B"; c.font = "bold 5px ui-monospace, monospace"; if (d.x % 2 === 1) c.fillText("INC-7", px + 2, py + 18); else { rr(c, px + 6, py + 14, 20, 1, "#2C2C2A"); rr(c, px + 6, py + 18, 14, 1, "#2C2C2A"); rr(c, px + 6, py + 22, 17, 1, "#2C2C2A"); } return;
    case "neon": return; // animated
    case "vwall": case "wmap": rr(c, px, py + 9, T, T - 14, "#05070A"); return; // animated over a black bezel
    // floor, non-solid
    case "rug": case "rugR": {
      const col = k === "rug" ? ["#7A2E3A", "#E3CFA4", "#5A1F29", "#C99A5B"] : ["#2E5A6B", "#E3CFA4", "#1F4250", "#8FC1C9"];
      rr(c, px, py, T, T, col[0]);
      const same = (dx, dy) => at(k, d.x + dx, d.y + dy);
      const top = !same(0, -1), bot = !same(0, 1), lef = !same(-1, 0), rig = !same(1, 0);
      // woven field: little diamonds on every tile
      c.fillStyle = col[2];
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const cx = px + 8 + i * 16, cy = py + 8 + j * 16;
        c.beginPath(); c.moveTo(cx, cy - 4); c.lineTo(cx + 4, cy); c.lineTo(cx, cy + 4); c.lineTo(cx - 4, cy); c.fill();
      }
      c.fillStyle = col[3]; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) c.fillRect(px + 7 + i * 16, py + 7 + j * 16, 2, 2);
      // border + inner pinstripe + fringe on the short ends
      if (top) { rr(c, px, py, T, 4, col[1]); rr(c, px, py + 6, T, 1, col[1]); }
      if (bot) { rr(c, px, py + T - 4, T, 4, col[1]); rr(c, px, py + T - 7, T, 1, col[1]); }
      if (lef) { rr(c, px, py, 4, T, col[1]); rr(c, px + 6, py, 1, T, col[1]); for (let i = 1; i < T; i += 3) rr(c, px - 2, py + i, 2, 1, col[1]); }
      if (rig) { rr(c, px + T - 4, py, 4, T, col[1]); rr(c, px + T - 7, py, 1, T, col[1]); for (let i = 1; i < T; i += 3) rr(c, px + T, py + i, 2, 1, col[1]); }
      return;
    }
    case "mat": rr(c, px + 1, py + 4, T - 2, T - 8, "#3A3A38"); c.fillStyle = "#555"; for (let i = 6; i < 26; i += 3) c.fillRect(px + 3, py + i, T - 6, 1); return;
    case "chairO": paintChair(c, px, py, at("D", d.x, d.y - 1), mapId === "floor7" ? "#5B6577" : "#2F3540", mapId === "floor7" ? "#7A8496" : "#3D4552"); return;
    case "chairC": paintChair(c, px, py, at("D", d.x, d.y - 1), "#6B7383", "#A3ABB8"); return;
    case "chairB": {
      rr(c, px + 10, py + 24, 12, 3, "rgba(0,0,0,0.2)");
      rr(c, px + 10, py + 12, 12, 10, "#E8B923"); rr(c, px + 10, py + 12, 12, 2, "#F5D35A");
      rr(c, px + 11, py + 22, 2, 4, "#555"); rr(c, px + 19, py + 22, 2, 4, "#555");
      const up = at("tableL", d.x, d.y - 1) || at("tableR", d.x, d.y - 1);
      rr(c, px + 10, up ? py + 21 : py + 9, 12, 3, "#C9971A");
      return;
    }
    // floor, solid
    case "plant": {
      shadow(18, 7);
      rr(c, px + 10, py + 19, 12, 10, "#C4673A"); rr(c, px + 9, py + 18, 14, 3, "#D9824F"); rr(c, px + 10, py + 27, 12, 2, "#8E4424");
      const leaf = hash2(d.x, d.y) > 0.5;
      c.fillStyle = "#2E7A42";
      if (leaf) { // fiddle-leaf fig, a little taller than the tile
        for (const [lx, ly, r] of [[16, 8, 7], [10, 12, 5], [22, 12, 5], [16, 2, 5], [12, 4, 4], [21, 5, 4]]) { c.beginPath(); c.ellipse(px + lx, py + ly, r, r * 0.8, 0, 0, 7); c.fill(); }
        c.fillStyle = "#3E9A55"; for (const [lx, ly] of [[14, 6], [19, 10], [16, 1]]) { c.beginPath(); c.ellipse(px + lx, py + ly, 3, 2, 0.6, 0, 7); c.fill(); }
        rr(c, px + 15, py + 12, 2, 7, "#5A3A1E");
      } else { // snake plant
        for (const [lx, h] of [[11, 12], [14, 17], [17, 15], [20, 11], [16, 9]]) { rr(c, px + lx, py + 19 - h, 3, h, "#2E7A42"); rr(c, px + lx + 1, py + 19 - h, 1, h, "#C9D86A"); }
      }
      return;
    }
    case "couchL": case "couchR": {
      const l = k === "couchL";
      rr(c, px + (l ? 3 : 0), py + T - 4, T - 3, 4, "rgba(0,0,0,0.22)");
      rr(c, px + (l ? 2 : 0), py + 6, T - 2, 8, "#3E6E78");                 // back
      rr(c, px + (l ? 2 : 0), py + 13, T - 2, 13, "#4E8A96");                // seat
      rr(c, px + (l ? 2 : 0), py + 13, T - 2, 1, "rgba(255,255,255,0.15)");
      rr(c, l ? px + 2 : px + T - 6, py + 8, 4, 19, "#356069");             // arm
      if (l) rr(c, px + T - 1, py + 14, 1, 11, "rgba(0,0,0,0.15)");
      rr(c, px + 12, py + 15, 7, 6, "#E8B923");                             // pillow
      return;
    }
    case "shelfParts": case "shelfSupply": case "books": {
      shadow(26, 3);
      rr(c, px + 2, py + 1, T - 4, T - 4, "#6E5A44");
      for (let i = 0; i < 3; i++) {
        rr(c, px + 3, py + 9 + i * 8, T - 6, 1, "#4E3E2E");
        for (let j = 0; j < 6; j++) {
          const w = k === "books" ? 3 : 4, hh = k === "books" ? 6 : 5;
          const cols = k === "books" ? ["#C0392B", "#2D7DD2", "#E8B923", "#3B7A57", "#7F77DD", "#F1EFE8"] : ["#C9A37A", "#85B7EB", "#9AA0A6", "#FCDE5A", "#E0E0E0", "#C9A37A"];
          if (hash2(d.x + j, d.y + i) > 0.18) rr(c, px + 4 + j * (w + 0.5), py + 9 + i * 8 - hh, w, hh, cols[(j + i + d.x) % 6]);
        }
      }
      return;
    }
    case "boxes": {
      shadow(24, 4);
      rr(c, px + 4, py + 14, 15, 13, "#C49A6C"); rr(c, px + 4, py + 14, 15, 2, "#D9B282"); rr(c, px + 11, py + 14, 1, 13, "#A97F55");
      rr(c, px + 15, py + 8, 13, 11, "#B88A5B"); rr(c, px + 15, py + 8, 13, 2, "#CFA474"); rr(c, px + 21, py + 8, 1, 11, "#9C7348");
      rr(c, px + 17, py + 21, 11, 7, "#D9B282"); rr(c, px + 6, py + 19, 7, 2, "#2D7DD2");
      return;
    }
    case "shred": shadow(16, 8); rr(c, px + 9, py + 8, 14, 20, "#3A3A38"); rr(c, px + 9, py + 8, 14, 4, "#5F5E5A"); rr(c, px + 11, py + 9, 10, 1, "#1a1a18"); rr(c, px + 11, py + 15, 10, 7, "#2C2C2A"); c.fillStyle = "#FCDE5A"; c.font = "bold 4px ui-monospace, monospace"; c.fillText("SHRED", px + 11, py + 26); return;
    case "fcab": {
      shadow(18, 7);
      rr(c, px + 8, py + 3, 16, 25, "#8C939A"); rr(c, px + 8, py + 3, 16, 2, "#B4BAC0");
      for (let i = 0; i < 3; i++) { rr(c, px + 9, py + 7 + i * 7, 14, 6, "#9DA4AB"); rr(c, px + 14, py + 9 + i * 7, 4, 1, "#3A3A38"); rr(c, px + 10, py + 7 + i * 7, 3, 2, "#F1EFE8"); }
      return;
    }
    case "ups": shadow(18, 7); rr(c, px + 8, py + 9, 16, 19, "#1D2025"); rr(c, px + 10, py + 12, 6, 3, "#0c1f14"); rr(c, px + 11, py + 13, 3, 1, "#63B370"); rr(c, px + 8, py + 9, 16, 1, "#3A3F47"); return;
    case "crac": {
      shadow(24, 4);
      rr(c, px + 3, py + 4, T - 6, T - 7, "#D6DADE"); rr(c, px + 3, py + 4, T - 6, 2, "#EEF0F2");
      c.fillStyle = "#9AA0A6"; for (let i = 8; i < 24; i += 2) c.fillRect(px + 6, py + i, T - 12, 1);
      rr(c, px + 6, py + 25, 6, 2, "#2D7DD2");
      return;
    }
    case "sink": {
      paintCounterTop(c, px, py);
      rr(c, px + 8, py + 6, 16, 9, "#9AA0A6"); rr(c, px + 9, py + 7, 14, 7, "#C2C8CD");
      rr(c, px + 15, py + 3, 2, 5, "#7A8086"); rr(c, px + 15, py + 3, 5, 2, "#7A8086");
      rr(c, px + 4, py + 6, 3, 6, "#2BB3A3"); // dish soap
      return;
    }
    case "tableL": case "tableR": {
      const l = k === "tableL";
      rr(c, px + (l ? 4 : 0), py + T - 5, T - 4, 4, "rgba(0,0,0,0.22)");
      c.fillStyle = "#F1EFE8"; c.beginPath(); c.ellipse(l ? px + T : px, py + 14, 26, 11, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(0,0,0,0.12)"; c.beginPath(); c.ellipse(l ? px + T : px, py + 16, 26, 10, 0, 0, Math.PI); c.fill();
      if (l) { rr(c, px + 14, py + 9, 6, 5, "#FFFFFF"); rr(c, px + 15, py + 10, 4, 3, "#6B4A2A"); } // mug
      else { c.fillStyle = "#E24B4A"; c.beginPath(); c.arc(px + 10, py + 12, 3, 0, 7); c.fill(); rr(c, px + 14, py + 14, 8, 1, "#888780"); } // apple + napkin
      rr(c, l ? px + 30 : px, py + 22, 2, 7, "#888780");
      return;
    }
    case "antenna": shadow(14, 9); rr(c, px + 12, py + 20, 8, 8, "#3A3F47"); rr(c, px + 15, py + 2, 2, 19, "#9AA0A6"); rr(c, px + 10, py + 6, 12, 1, "#9AA0A6"); rr(c, px + 12, py + 10, 8, 1, "#9AA0A6"); rr(c, px + 15, py + 1, 2, 2, "#E24B4A"); return;
    case "faraday": shadow(22, 5); rr(c, px + 5, py + 6, 22, 21, "#2C2C2A"); c.fillStyle = "#6a7078"; for (let i = 7; i < 26; i += 3) c.fillRect(px + i, py + 7, 1, 19); for (let j = 8; j < 26; j += 3) c.fillRect(px + 6, py + j, 20, 1); rr(c, px + 12, py + 18, 8, 5, "#85B7EB"); return;
    case "spectrum": shadow(20, 6); rr(c, px + 6, py + 10, 20, 17, "#3A3F47"); rr(c, px + 8, py + 12, 16, 9, "#04110A"); c.strokeStyle = "#63B370"; c.lineWidth = 1; c.beginPath(); c.moveTo(px + 8, py + 19); for (let i = 0; i < 16; i += 2) c.lineTo(px + 8 + i, py + 19 - Math.floor(hash2(i, d.x) * 6)); c.stroke(); return;
    case "beanbag": c.fillStyle = "rgba(0,0,0,0.2)"; c.beginPath(); c.ellipse(px + 16, py + 26, 12, 4, 0, 0, 7); c.fill(); c.fillStyle = "#B5179E"; c.beginPath(); c.ellipse(px + 16, py + 19, 12, 9, 0, 0, 7); c.fill(); c.fillStyle = "#D63DBF"; c.beginPath(); c.ellipse(px + 13, py + 15, 5, 3, 0, 0, 7); c.fill(); return;
    // desk items
    case "mon": case "mon2": {
      const two = k === "mon2", scr = mapId === "floor7" ? "#1B3A5C" : "#4E86C2";
      const draw1 = (ox) => {
        rr(c, px + ox, py + 5, 11, 8, "#1a1a18"); rr(c, px + ox + 1, py + 6, 9, 6, scr);
        rr(c, px + ox + 2, py + 7, 4, 1, "rgba(255,255,255,0.6)"); rr(c, px + ox + 2, py + 9, 6, 1, "rgba(255,255,255,0.35)");
        rr(c, px + ox + 4, py + 13, 3, 2, "#3A3A38");
      };
      if (two) { draw1(4); draw1(17); } else draw1(10);
      rr(c, px + 9, py + 15, 13, 3, mapId === "floor7" ? "#1a1d24" : "#D8D8D2"); rr(c, px + 10, py + 16, 11, 1, "rgba(0,0,0,0.15)"); // keyboard
      if (hash2(d.x, d.y, 7) > 0.55) { rr(c, px + 25, py + 14, 4, 4, ["#C0392B", "#FFFFFF", "#2D7DD2", "#E8B923"][(d.x + d.y) % 4]); rr(c, px + 29, py + 15, 1, 2, "#888"); } // mug
      if (hash2(d.x, d.y, 9) > 0.7) { rr(c, px + 3, py + 15, 4, 3, "#FCDE5A"); } // sticky notes
      return;
    }
    case "rgbkb": { const cols = ["#E24B4A", "#EF9F27", "#FCDE5A", "#63B370", "#2D7DD2", "#7F77DD"]; rr(c, px + 7, py + 13, 18, 5, "#111"); for (let i = 0; i < 6; i++) rr(c, px + 8 + i * 3, py + 14, 2, 3, cols[i]); rr(c, px + 9, py + 5, 14, 8, "#0c0c10"); rr(c, px + 10, py + 6, 12, 6, "#0F2A18"); rr(c, px + 11, py + 7, 6, 1, "#63B370"); return; }
    case "phone": rr(c, px + 8, py + 8, 10, 8, "#2C2C2A"); rr(c, px + 9, py + 9, 4, 2, "#85B7EB"); rr(c, px + 15, py + 7, 5, 3, "#2C2C2A"); return;
    case "bell": c.fillStyle = "#C9A227"; c.beginPath(); c.arc(px + 16, py + 10, 4, Math.PI, 0); c.fill(); rr(c, px + 11, py + 10, 10, 2, "#8E7420"); rr(c, px + 15, py + 5, 2, 2, "#C9A227"); return;
    case "plantS": rr(c, px + 11, py + 9, 8, 7, "#F1EFE8"); c.fillStyle = "#3E9A55"; c.beginPath(); c.arc(px + 13, py + 7, 3, 0, 7); c.arc(px + 17, py + 6, 3, 0, 7); c.arc(px + 15, py + 4, 3, 0, 7); c.fill(); return;
    case "papers": rr(c, px + 8, py + 7, 10, 10, "#FFFFFF"); rr(c, px + 10, py + 6, 10, 10, "#F4F1EA"); c.fillStyle = "#9AA0A6"; for (let i = 8; i < 15; i += 2) c.fillRect(px + 12, py + i, 6, 1); rr(c, px + 22, py + 8, 3, 9, "#2D7DD2"); return;
    case "proj": rr(c, px + 10, py + 8, 12, 7, "#3A3A38"); c.fillStyle = "#85B7EB"; c.beginPath(); c.arc(px + 13, py + 11, 2, 0, 7); c.fill(); rr(c, px + 3, py + 12, 7, 1, "#1a1a18"); return;
    case "notepad": rr(c, px + 10, py + 7, 10, 11, "#FCDE5A"); c.fillStyle = "#B08A1A"; for (let i = 10; i < 17; i += 2) c.fillRect(px + 11, py + i, 8, 1); rr(c, px + 21, py + 9, 1, 8, "#2C2C2A"); return;
  }
}
function paintCounterTop(c, px, py) {
  rr(c, px, py + T - 4, T, 4, "rgba(0,0,0,0.22)");
  rr(c, px, py + 15, T, 14, "#9C6B3E"); rr(c, px, py + 15, T, 1, "rgba(0,0,0,0.3)");
  rr(c, px + 15, py + 17, 1, 11, "rgba(0,0,0,0.2)"); rr(c, px + 12, py + 21, 2, 2, "#D8CBB6"); rr(c, px + 18, py + 21, 2, 2, "#D8CBB6");
  rr(c, px, py + 2, T, 14, "#E9E6E0"); rr(c, px, py + 2, T, 1, "#FFFFFF");
}

// ---- fixtures you can use (props; drawn every frame) ---------------------------------
export function paintFixture(ctx, px, py, art, tick = 0) {
  const c = ctx;
  switch (art) {
    case "fridge":
      rr(c, px + 4, py + T - 3, T - 8, 3, "rgba(0,0,0,0.25)");
      rr(c, px + 4, py - 6, T - 8, T + 3, "#E6E8EA"); rr(c, px + 4, py - 6, T - 8, 2, "#FFFFFF");
      rr(c, px + 4, py + 6, T - 8, 1, "#9AA0A6"); rr(c, px + T - 8, py - 2, 2, 6, "#7A8086"); rr(c, px + T - 8, py + 10, 2, 9, "#7A8086");
      rr(c, px + 8, py + 10, 6, 7, "#FCDE5A"); rr(c, px + 9, py + 12, 4, 1, "#2C2C2A"); // the yogurt note
      rr(c, px + 15, py - 2, 3, 3, "#E24B4A"); rr(c, px + 9, py - 3, 3, 3, "#2D7DD2"); // magnets
      return;
    case "coffee": {
      paintCounterTop(c, px, py);
      rr(c, px + 8, py - 2, 16, 15, "#2C2C2A"); rr(c, px + 8, py - 2, 16, 2, "#4A4A48");
      rr(c, px + 10, py + 1, 6, 3, "#0c1f14"); rr(c, px + 11, py + 2, 3, 1, "#63B370");
      rr(c, px + 13, py + 7, 6, 5, "#FFFFFF"); rr(c, px + 14, py + 8, 4, 3, "#6B4A2A");
      const s = tick / 10;
      c.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 3; i++) { const yy = (s + i * 5) % 12; c.fillRect(px + 15 + Math.round(Math.sin(s + i) * 1.5), py + 5 - yy, 1, 2); }
      return;
    }
    case "micro":
      paintCounterTop(c, px, py);
      rr(c, px + 5, py + 2, 22, 12, "#3A3A38"); rr(c, px + 7, py + 4, 13, 8, "#1a1a18"); rr(c, px + 8, py + 5, 11, 6, "#2A2A26");
      rr(c, px + 21, py + 4, 4, 2, "#0c1f14"); rr(c, px + 22, py + 4, 2, 1, Math.sin(tick / 20) > 0 ? "#63B370" : "#1d5a30");
      rr(c, px + 22, py + 8, 2, 2, "#9AA0A6");
      return;
    case "vending": {
      rr(c, px + 3, py + T - 3, T - 6, 3, "rgba(0,0,0,0.3)");
      rr(c, px + 3, py - 8, T - 6, T + 5, "#B03A2E"); rr(c, px + 3, py - 8, T - 6, 2, "#D35445");
      rr(c, px + 5, py - 5, 16, 24, "#16222E");
      const cols = ["#FCDE5A", "#63B370", "#E24B4A", "#85B7EB", "#EF9F27", "#F4C0D1"];
      for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) rr(c, px + 6 + i * 5, py - 3 + r * 6, 4, 4, cols[(r * 3 + i) % 6]);
      rr(c, px + 22, py - 4, 4, 10, "#2C2C2A"); rr(c, px + 23, py - 2, 2, 1, "#FCDE5A"); rr(c, px + 23, py + 1, 2, 2, "#63B370");
      rr(c, px + 6, py + 20, 14, 3, "#0A0F14");
      c.fillStyle = `rgba(255,255,255,${0.06 + 0.05 * Math.sin(tick / 25)})`; c.fillRect(px + 5, py - 5, 16, 24);
      return;
    }
    case "cooler": {
      rr(c, px + 9, py + T - 3, 14, 3, "rgba(0,0,0,0.25)");
      rr(c, px + 10, py + 10, 12, 18, "#E6E8EA"); rr(c, px + 10, py + 10, 12, 1, "#FFFFFF");
      rr(c, px + 12, py + 15, 3, 2, "#2D7DD2"); rr(c, px + 17, py + 15, 3, 2, "#E24B4A");
      // the jug
      c.fillStyle = "rgba(133,183,235,0.85)"; c.beginPath(); c.ellipse(px + 16, py + 3, 7, 8, 0, 0, Math.PI * 2); c.fill();
      rr(c, px + 14, py + 9, 4, 2, "rgba(133,183,235,0.85)");
      c.fillStyle = "rgba(255,255,255,0.5)"; c.fillRect(px + 12, py - 2, 2, 6);
      const b = (tick / 6) % 14;
      c.fillStyle = "rgba(255,255,255,0.9)"; c.beginPath(); c.arc(px + 16 + Math.sin(tick / 9) * 1.5, py + 9 - b, 1.2, 0, 7); c.fill();
      rr(c, px + 22, py + 13, 4, 10, "#F1EFE8"); // cup stack
      return;
    }
    case "aquarium": {
      rr(c, px + 1, py + T - 3, T - 2, 3, "rgba(0,0,0,0.3)");
      rr(c, px + 1, py + 18, T - 2, 11, "#2C2C2A");
      rr(c, px + 1, py, T - 2, 19, "#1E4E73"); rr(c, px + 2, py + 1, T - 4, 17, "#3E86B8");
      rr(c, px + 2, py + 15, T - 4, 3, "#D9C08A");
      rr(c, px + 5, py + 9, 2, 6, "#3E9A55"); rr(c, px + 24, py + 7, 2, 8, "#3E9A55"); rr(c, px + 26, py + 10, 2, 5, "#2E7A42");
      const f1 = (tick / 2) % 40, f2 = (tick / 3 + 20) % 40;
      const fx1 = px + 2 + (f1 < 20 ? f1 : 40 - f1), fx2 = px + 2 + (f2 < 20 ? f2 : 40 - f2);
      rr(c, fx1, py + 6, 4, 2, "#EF9F27"); rr(c, f1 < 20 ? fx1 - 1 : fx1 + 4, py + 6, 1, 2, "#EF9F27");
      rr(c, fx2, py + 11, 3, 2, "#FCDE5A");
      c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(px + 10, py + 13 - ((tick / 5) % 12), 1, 1);
      rr(c, px + 1, py, T - 2, 1, "#9AA0A6");
      return;
    }
    case "copier": {
      rr(c, px + 2, py + T - 3, T - 4, 3, "rgba(0,0,0,0.25)");
      rr(c, px + 3, py + 6, T - 6, 22, "#D6DADE"); rr(c, px + 3, py + 6, T - 6, 2, "#F1F3F5");
      rr(c, px + 4, py + 2, T - 8, 6, "#B9BEC3"); rr(c, px + 6, py + 3, 14, 2, "#3A3A38");
      rr(c, px + 20, py + 9, 7, 4, "#0c1f14"); rr(c, px + 21, py + 10, 3, 1, "#63B370");
      rr(c, px + 5, py + 16, T - 10, 2, "#9AA0A6"); rr(c, px + 5, py + 21, T - 10, 2, "#9AA0A6");
      rr(c, px + 7, py + 12, 10, 3, "#FFFFFF");
      return;
    }
  }
}

// ---- animated wall pieces + server LEDs (every frame) ----------------------------------
export function paintAnimated(ctx, d, sx, sy, tick) {
  const c = ctx;
  if (d.k === "vwall") {
    rr(c, sx + 1, sy + 10, T - 2, T - 16, "#07101C");
    const seed = d.x * 13;
    c.strokeStyle = d.x % 3 === 0 ? "#2BB3A3" : d.x % 3 === 1 ? "#6FB0FF" : "#F2C94C"; c.lineWidth = 1; c.beginPath();
    for (let i = 0; i <= 28; i += 2) { const v = Math.sin((i + tick / 4 + seed) / 5) * 3 + Math.sin((i * 3 + seed + tick / 9)) * 1.5; if (i === 0) c.moveTo(sx + 2 + i, sy + 18 + v); else c.lineTo(sx + 2 + i, sy + 18 + v); }
    c.stroke();
    if ((Math.floor(tick / 40) + d.x) % 7 === 0) { rr(c, sx + 3, sy + 11, 10, 3, "#E24B4A"); }
    rr(c, sx + 3, sy + 21, 4 + ((tick / 6 + seed) % 20), 1, "rgba(99,179,112,0.8)");
    return;
  }
  if (d.k === "wmap") {
    rr(c, sx, sy + 10, T, T - 16, "#06121F");
    c.fillStyle = "#1E3A5A";
    for (let i = 0; i < 6; i++) c.fillRect(sx + 2 + ((i * 7 + d.x * 5) % 26), sy + 12 + ((i * 3) % 9), 5, 3);
    const p = (tick / 12 + d.x * 9) % 20;
    if (p < 10) { c.strokeStyle = `rgba(226,75,74,${1 - p / 10})`; c.lineWidth = 1; c.beginPath(); c.arc(sx + 8 + d.x % 3 * 6, sy + 16, p * 0.8, 0, 7); c.stroke(); }
    return;
  }
  if (d.k === "neon") {
    const on = !(Math.floor(tick / 7) % 23 === 0);
    c.font = "bold 8px ui-monospace, monospace"; c.fillStyle = on ? "#FF2D95" : "#5A1036";
    if (on) { c.shadowColor = "#FF2D95"; c.shadowBlur = 6; }
    c.fillText(["HACK", "THE", "PLANET"][d.x - 18] || "", sx + 3, sy + 22);
    c.shadowBlur = 0;
    return;
  }
}
export function paintRackLeds(ctx, sx, sy, x, y, tick) {
  for (let i = 0; i < 6; i++) {
    const on = Math.sin(tick / (5 + ((x * 7 + y * 3 + i) % 9)) + i) > 0.1;
    ctx.fillStyle = on ? ((i + x) % 5 === 0 ? "#F2C94C" : "#63B370") : "#1d3a24";
    ctx.fillRect(sx + T - 10, sy + 6 + i * 4, 2, 1);
    if ((i + y) % 3 === 0) { ctx.fillStyle = on ? "#6FB0FF" : "#1a2b44"; ctx.fillRect(sx + T - 13, sy + 6 + i * 4, 1, 1); }
  }
}

// ---- light: ceiling panels per room + daylight from windows (baked) -----------------
export function bakeLight(c, rooms, decor, mapId) {
  const dark = mapId === "floor7";
  for (const r of rooms) {
    if (r.y >= 10 && (mapId === "home" || mapId === "lobby")) continue; // outdoors / shops
    for (let yy = r.y + 1; yy < r.y + r.h; yy += 3) for (let xx = r.x + 1; xx < r.x + r.w; xx += 3) {
      const cx = xx * T + 16, cy = yy * T + 16;
      const g = c.createRadialGradient(cx, cy, 4, cx, cy, 58);
      g.addColorStop(0, dark ? "rgba(110,170,255,0.10)" : "rgba(255,250,232,0.16)"); g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(cx - 58, cy - 58, 116, 116);
    }
  }
  for (const d of decor) if (d.k === "window" && d.y === 0) {
    const g = c.createLinearGradient(0, T, 0, T * 4);
    g.addColorStop(0, dark ? "rgba(90,130,200,0.10)" : "rgba(255,240,200,0.20)"); g.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = g; c.beginPath();
    c.moveTo(d.x * T, T); c.lineTo(d.x * T + T, T); c.lineTo(d.x * T + T + 18, T * 4); c.lineTo(d.x * T + 10, T * 4); c.fill();
  }
}

export { FLOORISH };
