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
  }
  // ---- more keepsakes land here as content grows ----
  // breakroomAce: { icon:"\u{1F3C6}", name:"Break-room Ace", note:"Top run in the secret break-room game." }
};

export const FINDTOTAL = Object.keys(FINDS).length;
