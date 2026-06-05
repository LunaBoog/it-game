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
