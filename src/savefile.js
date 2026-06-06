// Save file: wraps storage.dumpAll/restoreAll in a portable, versioned JSON
// envelope with a lightweight checksum so a truncated or hand-edited file is
// caught instead of silently corrupting a save. No backend — it's just a file
// the player downloads and can re-upload here or on another device.

import { dumpAll, restoreAll } from "./storage.js";

const MAGIC = "ticket-queue-save";
const VERSION = 1;

// tiny, dependency-free string hash (FNV-1a) → hex. Not crypto; just integrity.
function checksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ("0000000" + h.toString(16)).slice(-8);
}

// Build the JSON string to download.
export function serializeSave() {
  const data = dumpAll();
  const payload = JSON.stringify(data);
  const env = {
    magic: MAGIC,
    version: VERSION,
    savedAt: new Date().toISOString(),
    checksum: checksum(payload),
    data
  };
  return JSON.stringify(env, null, 2);
}

// A friendly filename like ticket-queue-Nova-day3-2026-06-05.json
export function saveFilename(playerName, day) {
  const safe = (playerName || "player").replace(/[^a-z0-9_-]+/gi, "").slice(0, 20) || "player";
  const date = new Date().toISOString().slice(0, 10);
  return `ticket-queue-${safe}-day${day || 1}-${date}.json`;
}

// Validate + apply an uploaded file's text. Returns { ok, error?, savedAt? }.
export function applySaveText(text) {
  let env;
  try { env = JSON.parse(text); }
  catch { return { ok: false, error: "That file isn't valid JSON." }; }
  if (!env || env.magic !== MAGIC) return { ok: false, error: "This doesn't look like a Ticket Queue save file." };
  if (typeof env.version !== "number" || env.version > VERSION) {
    return { ok: false, error: "This save was made by a newer version of the game." };
  }
  if (!env.data || typeof env.data !== "object") return { ok: false, error: "The save file is missing its data." };
  const expect = checksum(JSON.stringify(env.data));
  if (env.checksum && env.checksum !== expect) {
    return { ok: false, error: "The save file looks corrupted (checksum mismatch)." };
  }
  const ok = restoreAll(env.data);
  return ok ? { ok: true, savedAt: env.savedAt } : { ok: false, error: "Couldn't write the save (storage unavailable)." };
}
