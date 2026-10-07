// Structural validator for The Ticket Queue: Cutover Week. No browser needed.
//   node tools/validate.mjs
// Checks maps, entity placement + reachability (flood fill), tile overlaps,
// route ids, and that every scored question has exactly one best answer.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = await import(join(root, "src", "world.js"));
const { SCENARIOS } = await import(join(root, "src", "scenarios.js"));
const { SIDE_QUESTS } = await import(join(root, "src", "sideQuests.js"));
const { QUESTIONS } = await import(join(root, "src", "quiz.js"));
const P = await import(join(root, "src", "pools.js"));
const { FINDS } = await import(join(root, "src", "collectables.js"));

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("FAIL", msg); } };
const SOLID_T = new Set(["W", "D", "S", "R", "K", "H", "B", "C", "P"]);
// a tile is solid if its code is, or a solid decor piece sits on it
let CUR = "floor3";
const SOLID = { has: (ch, x, y) => SOLID_T.has(ch) };
const solidAt = (id, x, y) => SOLID_T.has(W.mapDef(id).map[y][x]) || (W.decorSolidAt && W.decorSolidAt(id, x, y));

// ---- maps -------------------------------------------------------------------
const reach = {};
for (const id of W.MAP_IDS) {
  const m = W.mapDef(id);
  ok(m.map.length === W.MAP_H && m.map.every((r) => r.length === W.MAP_W), `${id}: map is ${W.MAP_W}x${W.MAP_H}`);
  ok(Array.isArray(m.npcs) && Array.isArray(m.props), `${id}: npcs/props arrays`);
  // static blockers: NPCs + solid props (visible or not, worst case)
  const block = new Set();
  for (const n of m.npcs) if (!n.party) block.add(n.x + "," + n.y);
  // props that get hidden by a flag (e.g. the bar door at party time) don't count as permanent walls
  for (const p of m.props) if (!p.walkable && !p.hideFlag) block.add(p.x + "," + p.y);
  const starts = [m.start, ...Object.values(m.arrive || {})];
  const seen = new Set(); const q = [];
  for (const s of starts) { ok(!solidAt(id, s.x, s.y), `${id}: start/arrival ${s.x},${s.y} walkable`); q.push([s.x, s.y]); seen.add(s.x + "," + s.y); }
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + "," + ny;
      if (nx < 0 || ny < 0 || nx >= W.MAP_W || ny >= W.MAP_H || seen.has(k)) continue;
      if (solidAt(id, nx, ny) || block.has(k)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  reach[id] = seen;
  const adjReach = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + "," + (y + dy)));
  for (const n of m.npcs) {
    ok(n.x > 0 && n.y > 0 && n.x < W.MAP_W - 1 && n.y < W.MAP_H - 1, `${id}: npc ${n.id} in bounds`);
    ok(!solidAt(id, n.x, n.y), `${id}: npc ${n.id} not on a solid tile`);
    ok(adjReach(n.x, n.y), `${id}: npc ${n.id} has a reachable neighbor tile`);
  }
  for (const p of m.props) {
    ok(p.x >= 0 && p.y >= 0 && p.x < W.MAP_W && p.y < W.MAP_H, `${id}: prop ${p.id} in bounds`);
    if (p.walkable) ok(seen.has(p.x + "," + p.y) || adjReach(p.x, p.y), `${id}: walkable prop ${p.id} reachable`);
    else ok(adjReach(p.x, p.y), `${id}: prop ${p.id} has a reachable neighbor tile`);
  }
  // solid decor never shares a tile with an NPC or prop; decor sits on sensible tiles
  for (const d of W.decorFor(id)) {
    const ch = m.map[d.y][d.x];
    if (d.wall) ok(ch === "W" && d.y + 1 < W.MAP_H && m.map[d.y + 1][d.x] !== "W", `${id}: wall decor ${d.k}@${d.x},${d.y} is on a visible wall face`);
    else if (d.item) ok(["D", "K"].includes(ch), `${id}: desk item ${d.k}@${d.x},${d.y} sits on a desk/counter`);
    else ok(!SOLID_T.has(ch), `${id}: floor decor ${d.k}@${d.x},${d.y} sits on floor`);
    if (d.solid) ok(!m.npcs.some((n) => n.x === d.x && n.y === d.y) && !m.props.some((p) => p.x === d.x && p.y === d.y), `${id}: solid decor ${d.k}@${d.x},${d.y} doesn't cover an entity`);
  }
  // overlaps
  const at = {};
  for (const e of [...m.npcs.map((n) => ({ ...n, _t: "npc" })), ...m.props.map((p) => ({ ...p, _t: "prop" }))]) {
    const k = e.x + "," + e.y; (at[k] = at[k] || []).push(e._t + ":" + e.id);
  }
  for (const [k, v] of Object.entries(at)) ok(v.length === 1, `${id}: tile ${k} holds only one entity (${v.join(", ")})`);
}

// ---- F3 spots used by the visitor systems -------------------------------------
const f3 = W.mapDef("floor3"), r3 = reach.floor3;
const walk3 = (s) => !solidAt("floor3", s.x, s.y);
ok(walk3(W.F3_SPOTS.arrive) && r3.has(W.F3_SPOTS.arrive.x + "," + W.F3_SPOTS.arrive.y), "F3 arrive spot reachable");
ok(walk3(W.F3_SPOTS.vendorPost) && r3.has(W.F3_SPOTS.vendorPost.x + "," + W.F3_SPOTS.vendorPost.y), "vendor post reachable");
for (const h of W.F3_SPOTS.hideouts) ok(walk3(h) && r3.has(h.x + "," + h.y), `hideout ${h.x},${h.y} (${h.where}) reachable`);
for (const e of W.F3_SPOTS.ewaste) ok(walk3(e) && r3.has(e.x + "," + e.y), `e-waste ${e.id} walkable + reachable`);
for (const s of W.F3_SPOTS.swapQueue) ok(walk3(s), `swap queue spot ${s.x},${s.y} walkable`);
for (const p of P.PAGES.filter((x) => x.go)) ok(walk3(p.spawn.spot) && r3.has(p.spawn.spot.x + "," + p.spawn.spot.y), `go-find ${p.id} spawn reachable`);
const lob = W.mapDef("lobby");
for (const [k, s] of Object.entries(W.LOBBY_SPOTS)) ok(!solidAt("lobby", s.x, s.y) && reach.lobby.has(s.x + "," + s.y), `lobby spot ${k} reachable`);

// ---- route + flag ids referenced by the day engine ----------------------------
const days = readFileSync(join(root, "src", "days.js"), "utf8") + readFileSync(join(root, "src", "net.js"), "utf8") + readFileSync(join(root, "src", "soc.js"), "utf8");
for (const m of days.matchAll(/R\d?\("(\w+)",\s*"([\w-]+)"/g)) {
  if (m[2].endsWith("-")) continue; // template ids like "st-" + station
  const def = W.mapDef(m[1]);
  ok(def && (def.npcs.some((n) => n.id === m[2]) || def.props.some((p) => p.id === m[2]) || m[2] === "recycler"), `route target ${m[1]}/${m[2]} exists`);
}
const flows = readFileSync(join(root, "src", "flows.js"), "utf8") + readFileSync(join(root, "src", "ledger.js"), "utf8") + readFileSync(join(root, "src", "training.js"), "utf8") + days;
for (const m of flows.matchAll(/addFind\("([\w]+)"\)/g)) ok(!!FINDS[m[1]], `find ${m[1]} registered (any module)`);
for (const m of flows.matchAll(/addFind\("([\w]+)"\)/g)) ok(!!FINDS[m[1]], `find ${m[1]} registered`);
for (const m of flows.matchAll(/addFind\("signoff_" \+/g)) for (const id of ["ed", "karen", "riley"]) ok(!!FINDS["signoff_" + id], `find signoff_${id}`);
for (const m of flows.matchAll(/award\("(\w+)"\)/g)) ok(!!P.BADGES[m[1]], `badge ${m[1]} registered`);
const clock = readFileSync(join(root, "src", "clock.js"), "utf8");
for (const m of clock.matchAll(/award\("(\w+)"\)/g)) ok(!!P.BADGES[m[1]], `badge ${m[1]} registered (clock)`);
for (const L of Object.values(P.BRIDGE_BY_DAY).flat()) if (L.lingo) ok(!!P.LINGO[L.lingo], `bridge lingo ${L.lingo}`);
for (const m of (flows + clock).matchAll(/hearLingo\("(\w+)"\)/g)) ok(!!P.LINGO[m[1]], `lingo ${m[1]} registered`);
for (const L of P.BRIDGE_LINES) if (L.lingo) ok(!!P.LINGO[L.lingo], `bridge lingo ${L.lingo}`);

// ---- one best answer everywhere --------------------------------------------------
for (const [id, s] of Object.entries(SCENARIOS)) ok(s.diagnoses.filter((d) => d.correct).length === 1, `scenario ${id}: exactly one correct diagnosis`);
for (const [id, s] of Object.entries(SIDE_QUESTS)) ok(s.options.filter((o) => o.correct).length === 1, `side quest ${id}: exactly one correct`);
for (const q of QUESTIONS) ok(q.options.filter((o) => o.correct).length === 1, `quiz ${q.id}: exactly one correct`);
const two = (opts) => opts.filter((o) => o[1] === 2).length === 1;
for (const i of P.ISSUES) ok(two(i.opts) && i.opts.length === 3, `issue ${i.id}: 3 options, exactly one best`);
for (const p of P.PAGES) { if (p.go) ok(two(p.spawn.issue.opts), `go-find ${p.id}: one best`); else ok(two(p.opts), `page ${p.id}: exactly one best`); }
for (const s of P.SOCENG) ok(two(s.opts), `soceng ${s.id}: exactly one best`);
for (const src of [flows, clock, days]) for (const m of src.matchAll(/mustGetRight\(\[([\s\S]*?)\]\s*,\s*\(/g)) ok((m[1].match(/["\]],\s*2,/g) || []).length === 1, `inline judgment has exactly one best: ${m[1].slice(0, 50).replace(/\s+/g, " ")}`);
// pools sized for the per-day rolls
for (const [d, n] of [[1, 2], [2, 5], [3, 2]]) ok(P.ISSUES.filter((i) => i.d === d).length >= n, `day ${d}: enough walk-ups`);
ok(P.PAGES.filter((p) => p.d === 2 && p.go).length >= 1 && P.PAGES.filter((p) => p.d === 2 && !p.go).length >= 2, "day 2: pages incl. a go-find");
for (const k of P.KNOWN_ISSUES) ok((P.RESOLVER_BY_WEEK[k.w] || []).includes(k.group), `known issue ${k.id} routes to a real week-${k.w} group`);
for (const w of [1, 2, 3]) ok(P.KNOWN_ISSUES.filter((k) => k.w === w).length >= 4, `week ${w}: at least 4 known issues`);
for (const w of [1, 2, 3]) ok(P.SOCENG.filter((x) => x.w === w).length >= 1, `week ${w}: a social engineer`);
// v3: nine days of pools
for (const [d, n] of [[4, 2], [5, 5], [6, 2], [7, 2], [8, 5], [9, 2]]) ok(P.ISSUES.filter((i) => i.d === d).length >= n, `day ${d}: enough walk-ups`);
for (const d of [5, 8]) ok(P.PAGES.filter((p) => p.d === d && p.go).length >= 1 && P.PAGES.filter((p) => p.d === d && !p.go).length >= 2, `day ${d}: pages incl. a go-find`);
for (const d of [4, 6, 7, 9]) ok(P.PAGES.filter((p) => p.d === d).length >= 1, `day ${d}: a page`);
for (const p of P.PAGES.filter((x) => x.go && x.spawn.map)) ok(!solidAt(p.spawn.map, p.spawn.spot.x, p.spawn.spot.y) && reach[p.spawn.map].has(p.spawn.spot.x + "," + p.spawn.spot.y), `go-find ${p.id} spawn reachable on ${p.spawn.map}`);
for (const h of P.HOTSPOTS) {
  const def = W.mapDef(h.at.map);
  ok(def && (def.npcs.some((n) => n.id === h.at.id) || def.props.some((p) => p.id === h.at.id)), `hotspot ${h.id} target ${h.at.map}/${h.at.id} exists`);
  ok(two(h.opts), `hotspot ${h.id}: exactly one best`);
}
for (const d of [5, 8]) ok(P.HOTSPOTS.filter((h) => h.d === d).length >= 3, `day ${d}: three hotspots`);
const trSrc = readFileSync(join(root, "src", "training.js"), "utf8");
for (const m of trSrc.matchAll(/o: \[(\[[\s\S]*?\])\],\s*\n\s*why/g)) ok((m[1].match(/",\s*1\]/g) || []).length === 1, `training quiz has exactly one correct: ${m[1].slice(0, 50)}`);
ok([...trSrc.matchAll(/o: \[/g)].length >= 24, "training: 3 quizzes x 8 questions");
ok(new Set(P.ISSUES.map((i) => i.id)).size === P.ISSUES.length, "issue ids unique");

console.log(`\n${checks - fails}/${checks} checks passed${fails ? `, ${fails} FAILED` : ""}.`);
console.log(`Content: ${P.ISSUES.length} walk-ups, ${P.PAGES.length} pages, ${P.KNOWN_ISSUES.length} known issues, ${P.SOCENG.length} social engineers, ${Object.keys(P.LINGO).length} lingo, ${Object.keys(P.BADGES).length} badges, ${Object.keys(FINDS).length} keepsakes, ${Object.keys(SCENARIOS).length} tickets.`);
process.exitCode = fails ? 1 : 0;
