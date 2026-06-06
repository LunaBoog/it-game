// Progression: an XP / job-title career ladder and an achievements set.
// Pure data + helpers; the game awards XP and evaluates unlocks against state.

// ---- XP rewards (single source of truth) ----------------------------------
export const XP = {
  ticket: 20,        // solve any ticket
  firstTry: 10,      // bonus for a first-try diagnosis
  sideQuest: 15,     // resolve a side quest
  quizPass: 25,      // score >= 80% on a practice test
  quizPerfect: 15,   // bonus for 100%
  floorCleared: 60,  // clear every ticket on a floor
  find: 8            // discover a keepsake
};

// ---- title ladder ----------------------------------------------------------
// Thematic IT career progression. `level` is the index + 1.
export const TITLES = [
  { xp: 0,    title: "IT Intern" },
  { xp: 60,   title: "Help Desk Tier 1" },
  { xp: 150,  title: "Help Desk Tier 2" },
  { xp: 280,  title: "Desktop Support" },
  { xp: 450,  title: "Sysadmin" },
  { xp: 650,  title: "Network Engineer" },
  { xp: 900,  title: "Security Analyst" },
  { xp: 1200, title: "SOC Lead" },
  { xp: 1600, title: "Red Team Operator" },
  { xp: 2100, title: "Security Architect" },
  { xp: 2700, title: "CISO" }
];

// Resolve XP into level/title plus progress toward the next title.
export function rank(xp) {
  let i = 0;
  for (let k = 0; k < TITLES.length; k++) if (xp >= TITLES[k].xp) i = k;
  const cur = TITLES[i];
  const next = TITLES[i + 1] || null;
  const base = cur.xp;
  const span = next ? next.xp - base : 0;
  const into = xp - base;
  const pct = next ? Math.max(0, Math.min(100, Math.round((into / span) * 100))) : 100;
  return { level: i + 1, title: cur.title, next: next ? next.title : null,
           nextAt: next ? next.xp : null, into, span, pct, max: !next };
}

// ---- achievements ----------------------------------------------------------
// check(state) reads the live game state. Keep checks cheap + side-effect free.
export const ACHIEVEMENTS = [
  { id: "first_ticket", icon: "\u{1F39F}\uFE0F", name: "First Contact",
    desc: "Close your first ticket.",
    check: (s) => s.lifeTickets >= 1 },
  { id: "first_sq", icon: "\u{1F50D}", name: "Eagle Eye",
    desc: "Resolve your first side quest.",
    check: (s) => s.lifeSideQuests >= 1 },
  { id: "floor3_clear", icon: "\u{1F3E2}", name: "Help Desk Hero",
    desc: "Clear every ticket on Floor 3.",
    check: (s) => s.hasFlag("floor3Cleared") },
  { id: "reach_floor7", icon: "\u{1F6D7}", name: "Going Up",
    desc: "Ride the elevator to Floor 7.",
    check: (s) => s.hasFlag("visitedFloor7") },
  { id: "sharp5", icon: "\u{1F3AF}", name: "Sharp Shooter",
    desc: "Nail 5 diagnoses on the first try.",
    check: (s) => s.sharp.size >= 5 },
  { id: "quiz_perfect", icon: "\u{1F4AF}", name: "Top of the Class",
    desc: "Score 100% on a practice test.",
    check: (s) => s.hasFlag("quizPerfect") },
  { id: "collector", icon: "\u2B50", name: "Collector",
    desc: "Find 4 keepsakes.",
    check: (s) => s.finds.size >= 4 },
  { id: "shopper", icon: "\u{1F6CD}\uFE0F", name: "Drip Acquired",
    desc: "Buy something from the shop.",
    check: (s) => s.owned && s.owned.size >= 1 },
  { id: "fashionista", icon: "\u{1F60E}", name: "Fashionista",
    desc: "Own 4 cosmetic items.",
    check: (s) => s.owned && s.owned.size >= 4 },
  { id: "promoted", icon: "\u{1F4C8}", name: "Climbing the Ladder",
    desc: "Reach the rank of Sysadmin.",
    check: (s) => rank(s.xp || 0).level >= 5 },
  { id: "rich", icon: "\u{1FA99}", name: "Vending Tycoon",
    desc: "Bank 100 coins.",
    check: (s) => s.coins >= 100 },
  { id: "both_floors", icon: "\u{1F510}", name: "Full Stack",
    desc: "Clear every ticket on BOTH floors.",
    check: (s) => s.hasFlag("floor3Cleared") && s.hasFlag("floor7Cleared") }
];

export const ACHTOTAL = ACHIEVEMENTS.length;

// Returns ids that pass their check but aren't yet in the unlocked set.
export function newlyUnlocked(state, unlockedSet) {
  const out = [];
  for (const a of ACHIEVEMENTS) {
    if (unlockedSet.has(a.id)) continue;
    try { if (a.check(state)) out.push(a.id); } catch { /* ignore */ }
  }
  return out;
}
