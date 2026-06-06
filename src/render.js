// Drawing layer — ports the public-health RPG's rich procedural renderer:
// real little pixel people, shaded office tiles, an offscreen map cache,
// walking step animation, head bubbles, the SPACE/E prompt, and a vignette.
//
// Sprite images still override primitives: drop PNGs in /public/sprites/ and
// list them in the manifest (game.js). Missing files fall back to procedural.

import {
  MAP, MAP_W, MAP_H, TILE, ROOMS, NPCS, PROPS, PLAYER_SPRITE
} from "./world.js";

export const ASSETS = { tiles: {}, sprites: {}, props: {}, markers: {} };

export function loadAssets(manifest = {}) {
  const jobs = [];
  const onTileLoad = () => { mapCanvasCache = {}; };
  for (const [key, src] of Object.entries(manifest)) {
    jobs.push(new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        img._ready = true;
        if (key.startsWith("tile_")) onTileLoad();
        resolve();
      };
      img.onerror = () => { img._ready = false; resolve(); };
      img.src = src;
      // route into the right bucket
      if (key.startsWith("npc_") || key.startsWith("player_")) {
        // sprites are stored per-id with a direction; manifest keys look like
        // "player_down" or "npc_karen". We register them under a flat map and
        // resolve at draw time.
        ASSETS.sprites[key] = img;
      } else if (key.startsWith("tile_")) {
        ASSETS.tiles[key] = img;
      } else if (key.startsWith("marker_")) {
        ASSETS.markers[key] = img;
      } else {
        ASSETS.props[key] = img;
      }
    }));
  }
  return Promise.all(jobs);
}

export function sizeCanvas(canvas, viewport) {
  const r = viewport.getBoundingClientRect();
  const mapW = MAP_W * TILE, mapH = MAP_H * TILE;
  const mapAspect = mapW / mapH;
  const boxAspect = r.width / r.height;
  // letterbox: fit the whole map inside the viewport, preserving aspect ratio
  let cssW, cssH;
  if (boxAspect > mapAspect) {
    cssH = r.height; cssW = Math.round(cssH * mapAspect);
  } else {
    cssW = r.width; cssH = Math.round(cssW / mapAspect);
  }
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  canvas._cssW = cssW;
  canvas._cssH = cssH;
}

// ---- palette (office-themed, derived from the public-health PAL) ----
const PAL = {
  wall:"#5F5E5A", wallShade:"#444441", wallLight:"#7A7873",
  floor:"#E8E4D8", floorShade:"#D3D1C7", floorLight:"#F1EFE8",
  carpet:"#DAD3C2", carpetShade:"#C2BBA8",
  cool:"#D8E4E8", coolShade:"#B8C4C8",
  desk:"#A88862", deskShade:"#7A5F40", deskHighlight:"#C9A37A",
  chair:"#7A6B5D", chairShade:"#5A4F44",
  server:"#2C2C2A", serverShade:"#1a1a18", serverLight:"#3A3A38", serverLed:"#63B370",
  door:"#FCDE5A", doorShade:"#EF9F27", doorArrow:"#412402",
  monitorBezel:"#3A3A38", monitorScreen:"#85B7EB",
  printerBody:"#C9D6D0", printerDark:"#3A3A38", inkBlink:"#F2C94C",
  shadow:"rgba(0,0,0,0.25)"
};

let mapCanvasCache = {};

// display prefs the renderer honors (set from theme.applyPrefs)
let REDUCE_MOTION = false;
let HI_CONTRAST = false;
export function setRenderPrefs(reduceMotion, hiContrast) {
  REDUCE_MOTION = !!reduceMotion;
  HI_CONTRAST = !!hiContrast;
}

function drawFloorBase(c, px, py, base, shade) {
  c.fillStyle = base; c.fillRect(px, py, TILE, TILE);
  c.fillStyle = shade; c.fillRect(px, py + TILE - 2, TILE, 2); c.fillRect(px + TILE - 2, py, 2, TILE);
}

function drawTileProc(c, x, y, code) {
  const px = x * TILE, py = y * TILE;
  if (code === "W") {
    c.fillStyle = PAL.wall; c.fillRect(px, py, TILE, TILE);
    c.fillStyle = PAL.wallLight; c.fillRect(px, py, TILE, 3);
    c.fillStyle = PAL.wallShade; c.fillRect(px, py + TILE - 4, TILE, 4);
    c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(px + 4, py + 8, 8, 2); c.fillRect(px + 20, py + 18, 8, 2);
  } else if (code === ".") {
    drawFloorBase(c, px, py, PAL.floor, PAL.floorShade);
    if ((x + y) % 3 === 0) { c.fillStyle = PAL.floorLight; c.fillRect(px + 4, py + 6, 3, 3); }
  } else if (code === "o") {
    drawFloorBase(c, px, py, PAL.carpet, PAL.carpetShade);
    if ((x + y) % 2 === 0) { c.fillStyle = "rgba(0,0,0,0.04)"; c.fillRect(px + 2, py + 2, TILE - 4, TILE - 4); }
  } else if (code === "e") {
    drawFloorBase(c, px, py, PAL.cool, PAL.coolShade);
    c.fillStyle = "#E8F0F2"; c.fillRect(px + TILE / 2 - 1, py, 2, TILE);
  } else if (code === "D") {
    drawFloorBase(c, px, py, PAL.floor, PAL.floorShade);
    c.fillStyle = PAL.desk; c.fillRect(px, py + 8, TILE, TILE - 8);
    c.fillStyle = PAL.deskHighlight; c.fillRect(px, py + 8, TILE, 2);
    c.fillStyle = PAL.deskShade; c.fillRect(px, py + TILE - 3, TILE, 3);
    // alternate a monitor or papers on desks for variety
    if ((x + y) % 2 === 0) {
      c.fillStyle = "#2C2C2A"; c.fillRect(px + 8, py + 13, 14, 9);
      c.fillStyle = "#85B7EB"; c.fillRect(px + 9, py + 14, 12, 7);
    } else {
      c.fillStyle = "#F1EFE8"; c.fillRect(px + 9, py + 13, 10, 11);
      c.fillStyle = "#888780"; c.fillRect(px + 10, py + 15, 8, 1); c.fillRect(px + 10, py + 17, 8, 1); c.fillRect(px + 10, py + 19, 5, 1);
    }
  } else if (code === "c") {
    drawFloorBase(c, px, py, PAL.floor, PAL.floorShade);
    c.fillStyle = PAL.chair; c.fillRect(px + 8, py + 8, 16, 16);
    c.fillStyle = PAL.chairShade; c.fillRect(px + 8, py + 22, 16, 2);
    c.fillStyle = "rgba(255,255,255,0.1)"; c.fillRect(px + 10, py + 10, 12, 2);
  } else if (code === "S") {
    drawFloorBase(c, px, py, PAL.floor, PAL.floorShade);
    c.fillStyle = PAL.server; c.fillRect(px + 4, py + 2, TILE - 8, TILE - 4);
    c.fillStyle = PAL.serverLight; c.fillRect(px + 4, py + 2, TILE - 8, 2);
    for (let i = 0; i < 4; i++) { c.fillStyle = PAL.serverShade; c.fillRect(px + 7, py + 6 + i * 5, TILE - 14, 2); }
    // blinking LED
    c.fillStyle = PAL.serverLed; c.fillRect(px + TILE - 9, py + 5, 2, 2);
  } else {
    drawFloorBase(c, px, py, PAL.floor, PAL.floorShade);
  }
}

function getMapCanvas(name) {
  if (mapCanvasCache[name]) return mapCanvasCache[name];
  const oc = document.createElement("canvas");
  oc.width = MAP_W * TILE; oc.height = MAP_H * TILE;
  const c = oc.getContext("2d");
  c.imageSmoothingEnabled = false;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const code = MAP[y][x];
      const img = ASSETS.tiles["tile_" + code];
      if (img && img._ready) c.drawImage(img, x * TILE, y * TILE, TILE, TILE);
      else drawTileProc(c, x, y, code);
    }
  }
  mapCanvasCache[name] = oc;
  return oc;
}

// ---- sprite: a real little pixel person (ported from drawSpriteProc) ----
// A gentle idle bob so standing characters look alive (breathing), and a
// crisper hop while walking. `seed` desyncs each NPC so the room isn't a
// chorus line.
function bobFor(stepping, tick, seed) {
  if (stepping) return -1;                       // walking hop handled by frame
  if (REDUCE_MOTION) return 0;
  return Math.round(Math.sin((tick + seed) / 26) * 0.5 - 0.5); // 0 or -1, slow
}

function drawPersonProc(ctx, px, py, sp, facing, stepping, tick = 0, seed = 0) {
  const co = sp || PLAYER_SPRITE;
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath(); ctx.ellipse(px + TILE / 2, py + TILE - 3, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  const yo = stepping ? -1 : bobFor(false, tick, seed);
  // head
  ctx.fillStyle = co.skin; ctx.fillRect(px + 10, py + 4 + yo, 12, 10);
  ctx.fillStyle = "#D4A57E"; ctx.fillRect(px + 10, py + 12 + yo, 12, 2);
  // hair
  ctx.fillStyle = co.hair; ctx.fillRect(px + 10, py + 3 + yo, 12, 3);
  // face by direction
  ctx.fillStyle = "#2C2C2A";
  if (facing === "down" || !facing) {
    ctx.fillRect(px + 12, py + 8 + yo, 2, 2); ctx.fillRect(px + 18, py + 8 + yo, 2, 2);
    ctx.fillStyle = "#FFF"; ctx.fillRect(px + 12, py + 8 + yo, 1, 1); ctx.fillRect(px + 18, py + 8 + yo, 1, 1);
    ctx.fillStyle = "#993C1D"; ctx.fillRect(px + 14, py + 11 + yo, 4, 1);
  } else if (facing === "up") {
    ctx.fillStyle = co.hair; ctx.fillRect(px + 10, py + 4 + yo, 12, 3);
  } else if (facing === "left") {
    ctx.fillRect(px + 11, py + 8 + yo, 2, 2);
  } else if (facing === "right") {
    ctx.fillRect(px + 19, py + 8 + yo, 2, 2);
  }
  // glasses / shades
  if (co.shades) {
    ctx.fillStyle = "#1a1a18";
    ctx.fillRect(px + 11, py + 7 + yo, 4, 3); ctx.fillRect(px + 17, py + 7 + yo, 4, 3);
    ctx.fillRect(px + 15, py + 8 + yo, 2, 1); // bridge
  } else if (co.glasses) {
    ctx.strokeStyle = "#2C2C2A"; ctx.lineWidth = 1;
    ctx.strokeRect(px + 11, py + 7 + yo, 4, 3); ctx.strokeRect(px + 17, py + 7 + yo, 4, 3);
  }
  // hat (a simple cap over the hairline; drawn for all facings)
  if (co.hat) {
    ctx.fillStyle = co.hat; ctx.fillRect(px + 9, py + 2 + yo, 14, 4);
    ctx.fillRect(px + 10, py + 1 + yo, 12, 1);
    if (facing !== "up") { ctx.fillRect(px + 8, py + 5 + yo, 6, 1); } // brim toward viewer
    ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.fillRect(px + 11, py + 2 + yo, 5, 1);
  }
  // body
  ctx.fillStyle = co.body; ctx.fillRect(px + 9, py + 14 + yo, 14, 12);
  ctx.fillStyle = co.body2; ctx.fillRect(px + 9, py + 23 + yo, 14, 3);
  ctx.fillStyle = co.accent; ctx.fillRect(px + 15, py + 16 + yo, 2, 4);
  // arms
  ctx.fillStyle = co.skin;
  if (!stepping) { ctx.fillRect(px + 7, py + 18 + yo, 3, 6); ctx.fillRect(px + 22, py + 18 + yo, 3, 6); }
  else { ctx.fillRect(px + 7, py + 17 + yo, 3, 5); ctx.fillRect(px + 22, py + 19 + yo, 3, 5); }
  // legs / shoes
  ctx.fillStyle = "#2C2C2A";
  if (!stepping) { ctx.fillRect(px + 11, py + 26 + yo, 4, 4); ctx.fillRect(px + 17, py + 26 + yo, 4, 4); }
  else { ctx.fillRect(px + 10, py + 26 + yo, 4, 4); ctx.fillRect(px + 18, py + 25 + yo, 4, 5); }
}

// Pick the best available sprite image for an id given facing + walk state.
// Fallback chain (each step optional, so art can be added piecemeal):
//   id_<facing>_<frame>  ->  id_<facing>  ->  id_down_<frame>  ->  id_down  ->  id
// Walk frames let a generated 2-frame cycle animate while moving; absent that,
// the single directional (or down) frame is used and we lean on the hop offset.
function pickSprite(set, id, facing, stepping, tick) {
  const frame = stepping ? (Math.floor(tick / 7) % 2) : 0; // 0/1 cadence while walking
  const tries = [
    `${id}_${facing}_${frame}`,
    `${id}_${facing}`,
    `${id}_down_${frame}`,
    `${id}_down`,
    id
  ];
  for (const k of tries) { const img = set[k]; if (img && img._ready) return img; }
  return null;
}

function drawPerson(ctx, px, py, id, sp, facing, stepping, tick = 0, seed = 0) {
  const img = pickSprite(ASSETS.sprites, id, facing, stepping, tick);
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath(); ctx.ellipse(px + TILE / 2, py + TILE - 3, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  if (img) {
    const yo = stepping ? -1 : bobFor(false, tick, seed);
    ctx.drawImage(img, px, py + yo, TILE, TILE);
  } else {
    drawPersonProc(ctx, px, py, sp, facing, stepping, tick, seed);
  }
}

// ---- props ----
function drawTicketMonitor(ctx, px, py, tick) {
  if (ASSETS.props.ticket_monitor && ASSETS.props.ticket_monitor._ready) {
    ctx.drawImage(ASSETS.props.ticket_monitor, px, py, TILE, TILE); return;
  }
  const pulse = 0.5 + 0.5 * Math.sin(tick / 22);
  ctx.fillStyle = `rgba(133,183,235,${0.16 + 0.16 * pulse})`;
  ctx.fillRect(px - 1, py - 1, TILE + 2, TILE + 2);
  ctx.fillStyle = PAL.monitorBezel; ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 12);
  ctx.fillStyle = PAL.monitorScreen; ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 16);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(px + 8, py + 9, TILE - 16, 1); ctx.fillRect(px + 8, py + 12, TILE - 16, 1); ctx.fillRect(px + 8, py + 15, TILE - 18, 1);
  ctx.fillStyle = PAL.monitorBezel; ctx.fillRect(px + TILE / 2 - 2, py + TILE - 7, 4, 4);
}

function drawPrinter(ctx, px, py, tick, solved) {
  if (ASSETS.props.printer && ASSETS.props.printer._ready) {
    ctx.drawImage(ASSETS.props.printer, px, py, TILE, TILE); return;
  }
  ctx.fillStyle = PAL.shadow; ctx.beginPath(); ctx.ellipse(px + TILE / 2, py + TILE - 4, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PAL.printerBody; ctx.fillRect(px + 4, py + 8, TILE - 8, TILE - 14);
  ctx.fillStyle = PAL.printerDark; ctx.fillRect(px + 7, py + 12, TILE - 14, 4);
  ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.fillRect(px + 4, py + TILE - 7, TILE - 8, 1);
  if (!solved && Math.sin(tick / 12) > 0) {
    ctx.fillStyle = PAL.inkBlink; ctx.fillRect(px + TILE - 9, py + 10, 2, 2);
  }
}

// ---- SDV props (procedural; PNGs can override later via ASSETS.props) ----
function drawCat(ctx, px, py, tick, seed, fed) {
  const bob = Math.round(Math.sin((tick + seed) / 24) * 0.5 - 0.5);
  const y = py + bob;
  // shadow
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath(); ctx.ellipse(px + TILE / 2, py + TILE - 4, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  const fur = "#E8923A", furDark = "#C2701F", belly = "#F4C58A";
  // tail (flicks slowly)
  const flick = Math.sin(tick / 30 + seed) * 3;
  ctx.fillStyle = furDark;
  ctx.fillRect(px + 22, py + 18, 3, 8);
  ctx.fillRect(px + 22 + flick, py + 15, 3, 4);
  // body (loaf)
  ctx.fillStyle = fur; ctx.fillRect(px + 8, y + 16, 14, 10);
  ctx.fillStyle = belly; ctx.fillRect(px + 10, y + 22, 10, 3);
  ctx.fillStyle = furDark; ctx.fillRect(px + 8, y + 19, 14, 1); ctx.fillRect(px + 8, y + 23, 14, 1);
  // head
  ctx.fillStyle = fur; ctx.fillRect(px + 9, y + 9, 11, 9);
  // ears
  ctx.fillStyle = furDark;
  ctx.beginPath(); ctx.moveTo(px + 9, y + 9); ctx.lineTo(px + 9, y + 4); ctx.lineTo(px + 13, y + 9); ctx.fill();
  ctx.beginPath(); ctx.moveTo(px + 20, y + 9); ctx.lineTo(px + 20, y + 4); ctx.lineTo(px + 16, y + 9); ctx.fill();
  // eyes
  ctx.fillStyle = "#2C2C2A";
  ctx.fillRect(px + 11, y + 12, 2, 2); ctx.fillRect(px + 16, y + 12, 2, 2);
  // nose + whiskers
  ctx.fillStyle = "#993C1D"; ctx.fillRect(px + 14, y + 14, 1, 1);
  ctx.strokeStyle = "rgba(60,60,58,0.6)"; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(px + 9, y + 14); ctx.lineTo(px + 5, y + 13); ctx.moveTo(px + 20, y + 14); ctx.lineTo(px + 24, y + 13); ctx.stroke();
  // a content heart once fed
  if (fed && Math.sin(tick / 40 + seed) > 0.7) {
    ctx.fillStyle = "#D4537E";
    ctx.fillRect(px + 22, py - 2, 2, 2); ctx.fillRect(px + 25, py - 2, 2, 2); ctx.fillRect(px + 23, py, 3, 2); ctx.fillRect(px + 24, py + 2, 1, 1);
  }
}

function drawCabinet(ctx, px, py) {
  ctx.fillStyle = PAL.shadow; ctx.beginPath(); ctx.ellipse(px + TILE / 2, py + TILE - 4, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9AA0A6"; ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 8);
  ctx.fillStyle = "#C2C7CC"; ctx.fillRect(px + 6, py + 4, TILE - 12, 2);
  ctx.fillStyle = "#7A8086"; ctx.fillRect(px + 6, py + TILE - 6, TILE - 12, 2);
  // three drawers w/ handles
  for (let i = 0; i < 3; i++) {
    const dy = py + 7 + i * 6;
    ctx.fillStyle = "#7A8086"; ctx.fillRect(px + 8, dy, TILE - 16, 1);
    ctx.fillStyle = "#2C2C2A"; ctx.fillRect(px + TILE / 2 - 3, dy + 2, 6, 1);
  }
}

function drawStash(ctx, px, py, done) {
  // an open ceiling-tile gap in the corner; a coin glints unless emptied
  ctx.fillStyle = "#2C2C2A"; ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 12);
  ctx.fillStyle = "#1a1a18"; ctx.fillRect(px + 8, py + 6, TILE - 16, TILE - 16);
  ctx.strokeStyle = "#5F5E5A"; ctx.lineWidth = 1; ctx.strokeRect(px + 6, py + 4, TILE - 12, TILE - 12);
  if (!done) {
    ctx.fillStyle = "#FCDE5A"; ctx.fillRect(px + 13, py + 12, 5, 5);
    ctx.fillStyle = "#EF9F27"; ctx.fillRect(px + 13, py + 16, 5, 1);
    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(px + 14, py + 13, 1, 1);
  }
}

function drawUsb(ctx, px, py, tick) {
  ctx.fillStyle = PAL.shadow; ctx.beginPath(); ctx.ellipse(px + TILE / 2, py + TILE / 2 + 6, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
  // little USB stick lying flat
  ctx.fillStyle = "#2C2C2A"; ctx.fillRect(px + 9, py + 14, 12, 6);
  ctx.fillStyle = "#9AA0A6"; ctx.fillRect(px + 19, py + 15, 4, 4); // metal connector
  ctx.fillStyle = "#85B7EB"; ctx.fillRect(px + 11, py + 16, 2, 2); // led
  // faint glint to draw the eye
  if (Math.sin(tick / 16) > 0.6) { ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(px + 20, py + 15, 1, 1); }
}

function drawElevator(ctx, px, py, tick) {
  // a brushed-steel elevator door set in the wall, with a call light and arrows
  ctx.fillStyle = "#3A3A38"; ctx.fillRect(px + 2, py + 1, TILE - 4, TILE - 2);          // frame
  ctx.fillStyle = "#9AA0A6"; ctx.fillRect(px + 4, py + 3, TILE - 8, TILE - 5);          // doors
  ctx.fillStyle = "#7E848A"; ctx.fillRect(px + TILE / 2 - 1, py + 3, 2, TILE - 5);      // seam
  // brushed highlights
  ctx.fillStyle = "#B7BDC2"; ctx.fillRect(px + 6, py + 4, 2, TILE - 7);
  ctx.fillStyle = "#B7BDC2"; ctx.fillRect(px + TILE - 9, py + 4, 2, TILE - 7);
  // call panel + blinking up light
  ctx.fillStyle = "#2C2C2A"; ctx.fillRect(px + TILE - 6, py + 6, 3, 7);
  const on = Math.sin(tick / 14) > 0;
  ctx.fillStyle = on ? "#FCDE5A" : "#5A5208"; ctx.fillRect(px + TILE - 5, py + 7, 1, 2);
  ctx.fillStyle = "#63B370"; ctx.fillRect(px + TILE - 5, py + 10, 1, 2);
  // little up-arrow above the doors
  ctx.fillStyle = "#FCDE5A";
  ctx.fillRect(px + TILE / 2 - 1, py + 1, 2, 1);
  ctx.fillRect(px + TILE / 2 - 2, py + 2, 4, 1);
}

function drawDevice(ctx, px, py, device, tick) {
  // rack-mounted gear lying on a desk: switch / firewall / terminal each get a look
  ctx.fillStyle = PAL.shadow; ctx.beginPath();
  ctx.ellipse(px + TILE / 2, py + TILE - 5, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
  const blink = Math.sin(tick / 9) > 0;
  if (device === "switch") {
    // flat 1U switch with a row of link LEDs
    ctx.fillStyle = "#2C2C2A"; ctx.fillRect(px + 4, py + 12, TILE - 8, 11);
    ctx.fillStyle = "#1a1a18"; ctx.fillRect(px + 4, py + 12, TILE - 8, 2);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = (i % 2 === 0) === blink ? "#63B370" : "#1d5a30";
      ctx.fillRect(px + 7 + i * 3, py + 16, 2, 2);
    }
    ctx.fillStyle = "#9AA0A6"; ctx.fillRect(px + TILE - 9, py + 15, 3, 5); // uplink port
  } else if (device === "firewall") {
    // chunkier box, red status bar — the perimeter guardian
    ctx.fillStyle = "#33312E"; ctx.fillRect(px + 5, py + 9, TILE - 10, 14);
    ctx.fillStyle = "#1a1a18"; ctx.fillRect(px + 5, py + 9, TILE - 10, 3);
    ctx.fillStyle = "#C0392B"; ctx.fillRect(px + 8, py + 14, TILE - 16, 2);   // brand stripe
    ctx.fillStyle = blink ? "#F2C94C" : "#5A4708"; ctx.fillRect(px + 8, py + 18, 2, 2);
    ctx.fillStyle = "#63B370"; ctx.fillRect(px + 12, py + 18, 2, 2);
  } else {
    // terminal: a little monitor showing a blinking prompt
    ctx.fillStyle = "#2C2C2A"; ctx.fillRect(px + 6, py + 6, TILE - 12, 14);
    ctx.fillStyle = "#0c1f14"; ctx.fillRect(px + 8, py + 8, TILE - 16, 10);
    ctx.fillStyle = "#63B370"; ctx.fillRect(px + 10, py + 10, 5, 1);          // a line of text
    ctx.fillStyle = "#63B370"; ctx.fillRect(px + 10, py + 13, 8, 1);
    if (blink) { ctx.fillStyle = "#9FE1CB"; ctx.fillRect(px + 19, py + 13, 2, 2); } // cursor
    ctx.fillStyle = "#5F5E5A"; ctx.fillRect(px + 11, py + 20, TILE - 22, 2);  // stand
  }
}

// ---- which bubble (if any) floats over a prop ----
function propBubbleKind(p, state) {
  const kind = p.kind || (p.isMonitor ? "monitor" : p.isPrinter ? "printer" : "");
  if (kind === "elevator") return null; // the lift never wears a marker
  if (kind === "printer" || kind === "usb" || kind === "device") {
    return p.sideQuest ? (state.sqSolved.has(p.sideQuest) ? "done" : "sq") : null;
  }
  if (kind === "pet") return state.flags.has(p.doneFlag || "stashTaken") ? "done" : "quest";
  if (kind === "search") {
    if (!p.giveFlag) return null;
    if (state.flags.has(p.giveFlag)) return "done";
    if (p.needPriorFlag && !state.flags.has(p.needPriorFlag)) return null; // inert until the quest starts
    return "sq";
  }
  if (kind === "chest") return state.flags.has(p.doneFlag) ? "done" : "quest";
  return null;
}

// ---- head bubble (! quest / ? info-ish / check done) ----
const MARKER_FILE = { quest: "marker_ticket", sq: "marker_sidequest", done: "marker_done" };

function drawBubble(ctx, px, py, kind, tick) {
  const bob = REDUCE_MOTION ? 0 : Math.sin(tick / 18) * 1.5;
  const cx = px + TILE - 6;
  const cy = py + bob;
  // sprite override: drop marker_ticket / marker_sidequest / marker_done PNGs
  const mImg = ASSETS.markers[MARKER_FILE[kind]];
  if (mImg && mImg._ready) {
    const s = 16;
    ctx.drawImage(mImg, cx - s / 2, cy - s / 2, s, s);
    return;
  }
  let ring, fill, glyph, glyphColor;
  if (kind === "quest") { ring = "#EF9F27"; fill = "#FCDE5A"; glyph = "!"; glyphColor = "#412402"; }
  else if (kind === "sq") { ring = "#185FA5"; fill = "#378ADD"; glyph = "?"; glyphColor = "#042C53"; }
  else { ring = "#0F6E56"; fill = "#1D9E75"; glyph = ""; }
  if (HI_CONTRAST) { // dark halo so the marker pops regardless of color vision
    ctx.fillStyle = "#0c0c0e"; ctx.beginPath(); ctx.arc(cx, cy, 9.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
  if (kind === "done") {
    ctx.strokeStyle = "#04342C"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 3, cy); ctx.lineTo(cx - 1, cy + 2); ctx.lineTo(cx + 3, cy - 3); ctx.stroke();
  } else {
    ctx.fillStyle = glyphColor; ctx.font = "bold 11px ui-monospace, monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(glyph, cx, cy + 0.5); ctx.textBaseline = "alphabetic"; ctx.textAlign = "start";
  }
}

// ---- floating interact prompt over the faced NPC/prop ----
function drawPrompt(ctx, px, py, tick) {
  const bob = Math.sin(tick / 14) * 2;
  ctx.font = "bold 9px ui-monospace, monospace";
  const text = "E";
  const w = ctx.measureText(text).width + 8;
  const bx = px + TILE / 2 - w / 2;
  const by = py - 16 + bob;
  ctx.fillStyle = "rgba(20,20,18,0.92)";
  roundRect(ctx, bx, by, w, 13, 3); ctx.fill();
  ctx.fillStyle = "#FCDE5A"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, px + TILE / 2, by + 7);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "start";
}

function npcBubbleKind(n, state) {
  if (n.ticket) return state.solved.has(n.ticket) ? "done" : "quest";
  if (n.sideQuest) return state.sqSolved.has(n.sideQuest) ? "done" : "sq";
  return null;
}

// ---- camera ----
// Follow the player and clamp to the map edges. When the view is larger than
// the map on an axis (big screens), center the map instead of pinning it to
// the top-left corner.
function clampCam(target, span, view) {
  if (view >= span) return -(view - span) / 2; // center the smaller map
  return Math.max(0, Math.min(span - view, target));
}
function cameraFor(state, cw, ch) {
  const rx = state.renderX, ry = state.renderY;
  const shakeX = state.shake ? (Math.random() - 0.5) * state.shake * 4 : 0;
  const shakeY = state.shake ? (Math.random() - 0.5) * state.shake * 4 : 0;
  const camX = clampCam(rx - cw / 2 + TILE / 2, MAP_W * TILE, cw) + shakeX;
  const camY = clampCam(ry - ch / 2 + TILE / 2, MAP_H * TILE, ch) + shakeY;
  return { camX, camY };
}

// ---- top-level draw ----
export function draw(ctx, state, facedTarget) {
  const cw = ctx.canvas._cssW || ctx.canvas.width;
  const ch = ctx.canvas._cssH || ctx.canvas.height;
  const { camX, camY } = cameraFor(state, cw, ch);

  ctx.fillStyle = "#0f0f0e";
  ctx.fillRect(0, 0, cw, ch);

  // blit cached map
  ctx.save();
  ctx.translate(-camX, -camY);
  ctx.drawImage(getMapCanvas(state.map || "office"), 0, 0);
  ctx.restore();

  // props (under people)
  for (const p of PROPS) {
    if (p.needFlag && !state.flags.has(p.needFlag)) continue; // hidden until revealed
    const sx = p.x * TILE - camX, sy = p.y * TILE - camY;
    const kind = p.kind || (p.isMonitor ? "monitor" : p.isPrinter ? "printer" : "");
    if (kind === "monitor") {
      drawTicketMonitor(ctx, sx, sy, state.tick);
    } else if (kind === "printer") {
      drawPrinter(ctx, sx, sy, state.tick, state.sqSolved.has(p.sideQuest));
    } else if (kind === "pet") {
      drawCat(ctx, sx, sy, state.tick, seedFor(p.id), state.flags.has("catFed"));
    } else if (kind === "search") {
      drawCabinet(ctx, sx, sy);
    } else if (kind === "chest") {
      drawStash(ctx, sx, sy, state.flags.has(p.doneFlag));
    } else if (kind === "usb") {
      drawUsb(ctx, sx, sy, state.tick);
    } else if (kind === "elevator") {
      drawElevator(ctx, sx, sy, state.tick);
    } else if (kind === "device") {
      drawDevice(ctx, sx, sy, p.device, state.tick);
    }
    const bk = propBubbleKind(p, state);
    if (bk) drawBubble(ctx, sx, sy, bk, state.tick);
  }

  // NPCs
  for (const n of NPCS) {
    const sx = n.x * TILE - camX, sy = n.y * TILE - camY;
    drawPerson(ctx, sx, sy, `npc_${n.id}`, n.sprite, n.facing || "down", false, state.tick, seedFor(n.id));
    const kind = npcBubbleKind(n, state);
    if (kind) drawBubble(ctx, sx, sy, kind, state.tick);
    // prompt over the faced target
    if (facedTarget && facedTarget.kind === "npc" && facedTarget.target.id === n.id && !state.moving) {
      drawPrompt(ctx, sx, sy, state.tick);
    }
  }

  // prompt over a faced prop
  if (facedTarget && ["monitor", "prop-sq", "pet", "search", "chest", "elevator"].includes(facedTarget.kind) && !state.moving) {
    const p = facedTarget.target;
    drawPrompt(ctx, p.x * TILE - camX, p.y * TILE - camY, state.tick);
  }

  // player
  drawPerson(ctx, state.renderX - camX, state.renderY - camY, "player", state.playerSprite || PLAYER_SPRITE, state.facing, state.moving, state.tick, 0);

  // room labels
  drawRoomLabels(ctx, camX, camY);

  // lighting: a soft warm wash + corner vignette for depth
  drawAmbientLight(ctx, cw, ch);
  drawVignette(ctx, cw, ch);
}

// A faint warm overhead wash — gives the fluorescent office a touch of life
// without washing out the pixel art. Cheap: one gradient per frame.
function drawAmbientLight(ctx, cw, ch) {
  const g = ctx.createLinearGradient(0, 0, 0, ch);
  g.addColorStop(0, "rgba(255,244,214,0.06)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(20,24,40,0.07)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
}

// stable per-id seed so each NPC's idle bob is out of phase
function seedFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h % 64;
}

function drawRoomLabels(ctx, camX, camY) {
  ctx.font = "bold 10px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  for (const r of ROOMS) {
    const sx = r.x * TILE - camX, sy = r.y * TILE - camY;
    const label = r.name.toUpperCase();
    const w = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    roundRect(ctx, sx + 3, sy + 3, w + 9, 15, 3); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(label, sx + 7, sy + 14);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawVignette(ctx, cw, ch) {
  const g = ctx.createRadialGradient(cw/2, ch/2, Math.min(cw,ch)*0.42, cw/2, ch/2, Math.max(cw,ch)*0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
}

// ---- character-creator preview -------------------------------------------
// Draws a single procedural person (the player's chosen palette) scaled up into
// an arbitrary canvas. Used by the character creator / shop previews.
export function drawSpritePreview(canvas, sprite, facing = "down", scale = 4) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  // center the TILE-sized figure in the canvas
  const ox = (canvas.width - TILE * scale) / 2;
  const oy = (canvas.height - TILE * scale) / 2;
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  drawPersonProc(ctx, 0, 0, sprite, facing, false, 0, 0);
  ctx.restore();
}
