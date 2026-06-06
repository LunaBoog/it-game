// Cosmetics: the character roster (Mortal-Kombat-style select), the swatches
// the customizer offers, accessories, and the coin shop. A player "sprite" is
// just a palette object the procedural renderer already understands:
//   { skin, hair, body, body2, accent, glasses?, shades?, hat? }

// ---- starter roster (pick-a-fighter grid) ---------------------------------
// Each preset is a ready-to-play look with a little role flavor. The player can
// then recolor any of it. body2 is auto-derived as a darker body in the
// customizer, but presets set it explicitly for a hand-tuned look.
export const PRESETS = [
  { id: "helpdesk", name: "The Closer", role: "Help Desk Hero",
    blurb: "Calm under a full queue. Has never once said 'have you tried turning it off and on' sarcastically.",
    sprite: { body: "#2E6FB0", body2: "#1B4E84", accent: "#FCDE5A", hair: "#2C2C2A", skin: "#C9926B" } },
  { id: "sysadmin", name: "Root", role: "Sysadmin",
    blurb: "Lives in the server closet by choice. Backups tested, coffee strong.",
    sprite: { body: "#3B7A57", body2: "#255038", accent: "#CFF3DD", hair: "#412402", skin: "#8A5A3A", glasses: true } },
  { id: "neteng", name: "Packet", role: "Network Engineer",
    blurb: "Subnets in their sleep. The cables are labeled. ALL of them.",
    sprite: { body: "#2D7DD2", body2: "#1B5896", accent: "#CFE6FF", hair: "#1a1a18", skin: "#E0B080" } },
  { id: "soc", name: "Nightshift", role: "SOC Analyst",
    blurb: "2 a.m. is prime time. Knows which alerts to trust and which to mute.",
    sprite: { body: "#2BB3A3", body2: "#178277", accent: "#D6FFF8", hair: "#2C2C2A", skin: "#C9926B" } },
  { id: "redteam", name: "Phantom", role: "Red Teamer",
    blurb: "Gets in, takes notes, leaves a report. Respects scope like a religion.",
    sprite: { body: "#C0392B", body2: "#8E261B", accent: "#2C2C2A", hair: "#1a1a18", skin: "#8A5A3A", shades: true } },
  { id: "pmgr", name: "Scope", role: "Project Lead",
    blurb: "Turns chaos into a checklist. The change log is sacred.",
    sprite: { body: "#7F77DD", body2: "#534AB7", accent: "#F4C0D1", hair: "#6B4A2A", skin: "#E0B080" } },
  { id: "intern", name: "Fresh", role: "The Intern",
    blurb: "Day one energy. Asks great questions. Going places, fast.",
    sprite: { body: "#EF9F27", body2: "#BA7517", accent: "#FFF3D6", hair: "#2C2C2A", skin: "#D8B088" } },
  { id: "wildcard", name: "Wildcard", role: "?",
    blurb: "Rolls in with a totally random look. Reroll until it's perfect.",
    sprite: null, random: true }
];

// ---- customizer swatches (free tier) --------------------------------------
export const SKIN_TONES  = ["#F2D2B6", "#E0B080", "#D8B088", "#C9926B", "#A8744E", "#8A5A3A", "#6B4226", "#4A2C18"];
export const HAIR_COLORS = ["#2C2C2A", "#1a1a18", "#412402", "#6B4A2A", "#BA7517", "#C8C4B4", "#888780", "#B5179E"];
export const SHIRT_COLORS = ["#2E6FB0", "#3B7A57", "#2BB3A3", "#C0392B", "#7F77DD", "#EF9F27", "#D4537E", "#5F5E5A"];
export const ACCENT_COLORS = ["#FCDE5A", "#CFE6FF", "#D6FFF8", "#F4C0D1", "#CFF3DD", "#FFF3D6", "#2C2C2A", "#FFFFFF"];

// shop-locked premium swatches (unlocked by buying the matching shop item)
export const PREMIUM_SHIRTS = { neonPink: "#FF2D95", neonGreen: "#39FF14", cyber: "#00E5FF", gold: "#E8B923" };

// ---- accessories ----------------------------------------------------------
// Applied onto the sprite palette. glasses + shades are booleans; hat is a color.
export const ACCESSORIES = [
  { id: "none",    name: "None",        free: true,  apply: (s) => { s.glasses = false; s.shades = false; s.hat = null; } },
  { id: "glasses", name: "Glasses",     free: true,  apply: (s) => { s.glasses = true; s.shades = false; } },
  { id: "shades",  name: "Cool Shades", cost: 30,    apply: (s) => { s.shades = true; s.glasses = false; }, icon: "\u{1F576}\uFE0F" },
  { id: "capRed",  name: "Red Cap",     cost: 25,    apply: (s) => { s.hat = "#C0392B"; }, icon: "\u{1F9E2}" },
  { id: "capBlue", name: "Blue Cap",    cost: 25,    apply: (s) => { s.hat = "#2D7DD2"; }, icon: "\u{1F9E2}" },
  { id: "beanie",  name: "Black Beanie",cost: 40,    apply: (s) => { s.hat = "#2C2C2A"; }, icon: "\u{1F3A9}" }
];

// ---- the coin shop --------------------------------------------------------
// kind "swatch" unlocks a premium shirt color; "accessory" unlocks a hat/shades.
// Owned ids live in state.owned (a Set). Buying spends coins.
export const SHOP_ITEMS = [
  { id: "shirt_neonPink",  kind: "swatch", swatch: "neonPink",  name: "Neon Pink tee",  cost: 35, icon: "\u{1F455}" },
  { id: "shirt_neonGreen", kind: "swatch", swatch: "neonGreen", name: "Neon Green tee", cost: 35, icon: "\u{1F455}" },
  { id: "shirt_cyber",     kind: "swatch", swatch: "cyber",     name: "Cyber Cyan tee", cost: 45, icon: "\u{1F455}" },
  { id: "shirt_gold",      kind: "swatch", swatch: "gold",      name: "Golden tee",     cost: 80, icon: "\u2728" },
  { id: "acc_shades",      kind: "accessory", accessory: "shades",  name: "Cool Shades",  cost: 30, icon: "\u{1F576}\uFE0F" },
  { id: "acc_capRed",      kind: "accessory", accessory: "capRed",  name: "Red Cap",      cost: 25, icon: "\u{1F9E2}" },
  { id: "acc_capBlue",     kind: "accessory", accessory: "capBlue", name: "Blue Cap",     cost: 25, icon: "\u{1F9E2}" },
  { id: "acc_beanie",      kind: "accessory", accessory: "beanie",  name: "Black Beanie", cost: 40, icon: "\u{1F3A9}" }
];

// derive a sensible darker shade for body2 when the user recolors the shirt
export function darken(hex, amt = 0.32) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * (1 - amt)); g = Math.round(g * (1 - amt)); b = Math.round(b * (1 - amt));
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function randomSprite() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const body = pick(SHIRT_COLORS);
  return {
    skin: pick(SKIN_TONES), hair: pick(HAIR_COLORS),
    body, body2: darken(body), accent: pick(ACCENT_COLORS),
    glasses: Math.random() < 0.3, shades: false, hat: null
  };
}

export const DEFAULT_SPRITE = { ...PRESETS[0].sprite, glasses: false, shades: false, hat: null };
