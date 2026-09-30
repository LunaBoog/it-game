// Collectables registry — the SDV "keepsakes" layer.
//
// Each entry is a memento tied to a person/story/moment, NOT a stat boost.
// FINDTOTAL recomputes itself from the keys, so adding ONE entry here is all
// it takes to grow the "finds x/total" counter — no other code changes.
//
// Schema:  id -> { icon, name, note }
//   icon : a short glyph for the HUD (emoji is fine; HUD is HTML)
//   name : what it's called in the Discoveries gallery
//   note : the little story line that makes it stick

export const FINDS = {
  charm: {
    icon: "\u{1F9F6}",
    name: "Mittens' collar charm",
    note: "A frayed tag from the office cat. She trusts you now \u2014 and she showed you where the old admin hid the break-room stash."
  },
  usbWise: {
    icon: "\u{1F6E1}\uFE0F",
    name: "USB-Wise badge",
    note: "You handed a mystery USB to security instead of plugging it in. Attackers really do scatter these in parking lots hoping someone gets curious."
  },

  // ---- Floor 7: Security Operations keepsakes ----
  hardener: {
    icon: "\u{1F510}",
    name: "Hardened badge",
    note: "You found a switch on admin/admin and locked it down \u2014 strong creds, Telnet off, SSH on. Default credentials are how infrastructure gets owned."
  },
  surfaceShrink: {
    icon: "\u{1F9F1}",
    name: "Attack-Surface badge",
    note: "You pulled Remote Desktop off the open internet and put it behind a VPN with MFA. Exposed RDP is a favorite ransomware front door."
  },
  secretSweeper: {
    icon: "\u{1F511}",
    name: "Secret-Sweeper badge",
    note: "You caught a live API key committed to a public repo and rotated it before purging history. A leaked secret is compromised the moment it's public."
  },
  badgeChallenger: {
    icon: "\u{1FAAA}",
    name: "Badge-Challenger badge",
    note: "You stopped a tailgater and walked them to reception. Physical access defeats every digital control, and challenging strangers is the job."
  },

  // ---- v2 Cutover Week keepsakes (tied to people and moments) ----
  badgePhoto: { icon: "\u{1FAAA}", name: "Your first badge photo",
    note: "Lou told you not to smile. You smiled. It's worse. You'll keep it forever." },
  dongle: { icon: "\u{1F50C}", name: "Tasha's spare USB-C dongle",
    note: "'Everybody loses theirs by Thursday.' You didn't. Mostly because you had two." },
  signoff_ed: { icon: "\u270D\uFE0F", name: "Ed's sign-off (Accounting)",
    note: "Ed walked through payroll on the new laptop before he signed. He double-checked your double-check." },
  signoff_karen: { icon: "\u270D\uFE0F", name: "Karen's sign-off (Reception)",
    note: "Signed with the good pen. Karen doesn't lend the good pen to anyone." },
  signoff_riley: { icon: "\u270D\uFE0F", name: "Riley's sign-off (Ops)",
    note: "Riley signed and immediately asked about the Office add-ins. You logged it as a separate request." },
  certDestruction: { icon: "\u{1F4DC}", name: "Certificate of destruction",
    note: "Eight devices, eight serials, one signature chain from Accounting to the shredder. Every drive left on paper." },
  cleanQueue: { icon: "\u{1F5BC}\uFE0F", name: "The 'Clean Queue' printout",
    note: "Gloria printed your audit, framed it, and hung it in the IT room. Zero closed without notes." },
  nextGig: { icon: "\u{1F4E7}", name: "Director Chen's email",
    note: "'Security has asked for Help Desk on Floor 7 next month. They're calling it SOC Week.'" }
};

export const FINDTOTAL = Object.keys(FINDS).length;
