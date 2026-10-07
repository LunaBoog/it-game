// v2 visitors: transient NPCs that spawn, walk (BFS pathing on the tile grid),
// wait for you, and leave. Used for walk-up users, "go find" targets, the
// auditor, the vendor you escort, the social engineer and the recycler.
//
// A visitor is a normal NPC object pushed into its map's NPCS array, plus a
// `_vis` record. Visitors only move while you're on their map.

import { CORE } from "./core.js";
import { mapDef, isWalkableOn, TILE, MAP_W, MAP_H } from "./world.js";

const VIS_STEP_MS = 230;

export function visAll() {
  const out = [];
  for (const id of ["home", "lobby", "floor3", "floor5", "floor7"]) {
    const m = mapDef(id); if (!m) continue;
    for (const n of m.npcs) if (n._vis) out.push(n);
  }
  return out;
}
export function visFind(pred) { return visAll().find(pred) || null; }

// Spawn. opts: { kind, data, target: "player" | {x,y} | null, onArrive }
export function visAdd(mapId, npc, opts = {}) {
  const m = mapDef(mapId); if (!m) return null;
  const n = Object.assign({ facing: "down" }, npc);
  n.rx = n.x * TILE; n.ry = n.y * TILE;
  n._vis = { map: mapId, kind: opts.kind || "visitor", data: opts.data || null,
    target: opts.target || null, onArrive: opts.onArrive || null, path: [], wait: 0,
    moving: false, t: 0, fx: n.x, fy: n.y, arrived: false, leaving: false, want: opts.want !== false };
  m.npcs.push(n);
  return n;
}

export function visRemove(n) {
  if (!n || !n._vis) return;
  const m = mapDef(n._vis.map); if (!m) return;
  const i = m.npcs.indexOf(n); if (i >= 0) m.npcs.splice(i, 1);
}

// Walk to `spot` then vanish (elevator / street / door).
export function visLeave(n, spot) {
  if (!n || !n._vis) return;
  n._vis.leaving = true; n._vis.want = false; n._vis.arrived = false;
  n._vis.target = spot || { x: 5, y: 2 };
  n._vis.path = []; n._vis.onArrive = () => visRemove(n);
}

export function visClearAll(pred = () => true) {
  for (const n of visAll()) if (pred(n)) visRemove(n);
}

function occupied(mapId, x, y, self) {
  const m = mapDef(mapId);
  if (m.npcs.some((o) => o !== self && o.x === x && o.y === y && npcShown(o))) return true;
  if (m.props.some((p) => p.x === x && p.y === y && !p.walkable && propShown(p))) return true;
  const S = CORE.S;
  if (S && S.map === mapId && S.px === x && S.py === y) return true;
  return false;
}
function npcShown(n) { const S = CORE.S; if (!S) return true; return S.npcVisible ? S.npcVisible(n) : true; }
function propShown(p) { const S = CORE.S; if (!S) return true; return S.propVisible ? S.propVisible(p) : true; }

// BFS from (sx,sy) to any tile in goals (Set of "x,y"). Returns list of steps.
export function visPath(mapId, sx, sy, goals, self) {
  const key = (x, y) => x + "," + y;
  const prev = new Map(); const q = [[sx, sy]]; prev.set(key(sx, sy), null);
  let hit = null;
  while (q.length) {
    const [x, y] = q.shift();
    if (goals.has(key(x, y)) && !(x === sx && y === sy)) { hit = [x, y]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H || prev.has(k)) continue;
      if (!isWalkableOn(mapId, nx, ny)) continue;
      if (occupied(mapId, nx, ny, self) && !goals.has(k)) continue;
      prev.set(k, [x, y]); q.push([nx, ny]);
    }
  }
  if (!hit) return null;
  const out = []; let cur = hit;
  while (cur && !(cur[0] === sx && cur[1] === sy)) { out.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
  return out;
}

function goalsFor(n) {
  const S = CORE.S, t = n._vis.target, g = new Set();
  if (t === "player") {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = S.px + dx, y = S.py + dy;
      if (isWalkableOn(n._vis.map, x, y)) g.add(x + "," + y);
    }
  } else if (t) g.add(t.x + "," + t.y);
  return g;
}

function faceToward(n, x, y) {
  const dx = x - n.x, dy = y - n.y;
  if (Math.abs(dx) > Math.abs(dy)) n.facing = dx > 0 ? "right" : "left";
  else if (dy) n.facing = dy > 0 ? "down" : "up";
}

export function visUpdate(dtMs) {
  const S = CORE.S; if (!S) return;
  const m = mapDef(S.map); if (!m) return;
  for (const n of m.npcs.slice()) {
    const v = n._vis; if (!v) continue;
    if (v.moving) {
      v.t += dtMs / VIS_STEP_MS;
      if (v.t < 1) { n.rx = (v.fx + (n.x - v.fx) * v.t) * TILE; n.ry = (v.fy + (n.y - v.fy) * v.t) * TILE; continue; }
      v.t = 1; v.moving = false;   // fall through: pick the next step this same frame (no dead frame)
    }
    n.rx = n.x * TILE; n.ry = n.y * TILE;
    if (!v.target) continue;
    // arrived?
    const atPlayer = v.target === "player" && Math.abs(S.px - n.x) + Math.abs(S.py - n.y) === 1;
    const atSpot = v.target !== "player" && n.x === v.target.x && n.y === v.target.y;
    if (atPlayer || atSpot) {
      if (atPlayer) faceToward(n, S.px, S.py);
      if (!v.arrived) { v.arrived = true; if (v.onArrive) { const f = v.onArrive; if (v.leaving) v.onArrive = null; f(n); } }
      if (atSpot || v.target !== "player") v.target = v.leaving ? v.target : null;
      continue;
    }
    if (v.target === "player") v.arrived = false;
    if (v.wait > 0) { v.wait -= dtMs; continue; }
    if (!v.path.length) {
      const p = visPath(v.map, n.x, n.y, goalsFor(n), n);
      if (!p || !p.length) { v.wait = 600; continue; }
      v.path = p;
    }
    const [nx, ny] = v.path[0];
    if (occupied(v.map, nx, ny, n)) { v.path = []; v.wait = 350; continue; }
    v.path.shift();
    faceToward(n, nx, ny);
    v.fx = n.x; v.fy = n.y; n.x = nx; n.y = ny; v.t = 0; v.moving = true;
    // re-path toward a moving player every few steps
    if (v.target === "player" && v.path.length > 3) v.path = v.path.slice(0, 3);
  }
}
