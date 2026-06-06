// Theme controller: light / gray / black. Sets data-theme on <html>; the CSS
// variables in styles.css key off that attribute. Persisted in localStorage.
import { loadString, saveString } from "./storage.js";
import { setRenderPrefs } from "./render.js";

export const THEMES = [
  { id: "light", name: "Light" },
  { id: "gray",  name: "Gray" },
  { id: "black", name: "Black" }
];

export function currentTheme() {
  const t = loadString("theme", "gray");
  return THEMES.some((x) => x.id === t) ? t : "gray";
}

export function applyTheme(id) {
  const t = THEMES.some((x) => x.id === id) ? id : "gray";
  try { document.documentElement.setAttribute("data-theme", t); } catch { /* ignore */ }
  saveString("theme", t);
  return t;
}

// ---- accessibility / display prefs ----------------------------------------
import { loadBool, saveBool } from "./storage.js";

export const prefs = {
  reducedMotion() { return loadBool("pref-motion", false); },
  colorblind() { return loadBool("pref-cb", false); },
  bigText() { return loadBool("pref-text", false); }
};

export function setReducedMotion(on) { saveBool("pref-motion", on); applyPrefs(); }
export function setColorblind(on) { saveBool("pref-cb", on); applyPrefs(); }
export function setBigText(on) { saveBool("pref-text", on); applyPrefs(); }

export function applyPrefs() {
  try {
    const r = document.documentElement;
    r.setAttribute("data-motion", prefs.reducedMotion() ? "reduced" : "full");
    r.setAttribute("data-cb", prefs.colorblind() ? "1" : "0");
    r.setAttribute("data-text", prefs.bigText() ? "lg" : "md");
  } catch { /* ignore */ }
  try { setRenderPrefs(prefs.reducedMotion(), prefs.colorblind()); } catch { /* ignore */ }
}
