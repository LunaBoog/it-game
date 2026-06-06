const PREFIX = "it-game:";

export function loadSet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveSet(key, set) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(Array.from(set)));
  } catch {
    // unavailable or full
  }
}

export function loadString(key, fallback = "") {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveString(key, val) {
  try {
    localStorage.setItem(PREFIX + key, val);
  } catch {
    // ignore
  }
}

export function loadBool(key, fallback = false) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    if (v === null) return fallback;
    return v === "1";
  } catch {
    return fallback;
  }
}

export function saveBool(key, val) {
  try {
    localStorage.setItem(PREFIX + key, val ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadNum(key, fallback = 0) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    if (v === null) return fallback;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function saveNum(key, val) {
  try {
    localStorage.setItem(PREFIX + key, String(val));
  } catch {
    // ignore
  }
}

export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// --- whole-save dump/restore (powers the download/upload feature) ----------
// Returns a plain object of every it-game:* key with the prefix stripped.
export function dumpAll() {
  const out = {};
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => { out[k.slice(PREFIX.length)] = localStorage.getItem(k); });
  } catch { /* ignore */ }
  return out;
}

// Replaces the current save with the given map (clears existing it-game:* first).
export function restoreAll(map) {
  try {
    clearAll();
    for (const [k, v] of Object.entries(map || {})) {
      if (v != null) localStorage.setItem(PREFIX + k, String(v));
    }
    return true;
  } catch {
    return false;
  }
}
