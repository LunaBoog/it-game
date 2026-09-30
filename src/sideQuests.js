// Side quests are one-shot quick-solves. No evidence chain, no debrief screen.
// Walk past, notice the marker, pick an answer, get a one-line lesson.
// Schema: { title, body, where, floor, cert?, reward?, options[] }
//   options: { key, label, correct, feedback }
//   reward:  { find?, coins? }   (granted once, on the correct answer)

export const SIDE_QUESTS = {
  // ---- FLOOR 3 (fundamentals) ---------------------------------------------
  "unplugged": {
    floor: "floor3", cert: "A+ 220-1201 \u00b7 5.1 Power issues",
    title: "Ed: \"My PC won't turn on\"",
    body: "Ed (accountant): 'I've been trying for 10 minutes. Nothing happens. I think the hard drive is dead.' You glance under the desk.",
    where: "Accounting \u00b7 Ed's desk",
    options: [
      { key: "plug", label: "Check that it's plugged in", correct: true,
        feedback: "The power strip switch is off. You flip it. The PC boots immediately. Ed is embarrassed. 5-second fix." },
      { key: "psu", label: "Open the case, check the PSU", correct: false,
        feedback: "You spent 10 minutes opening the case. Everything was fine. The power strip was off the whole time. Always check the simplest physical cause first." },
      { key: "reinstall", label: "Reinstall Windows", correct: false,
        feedback: "The machine never even posted. Reinstalling Windows on a machine that doesn't power on is nonsense." }
    ]
  },

  "monitorStandby": {
    floor: "floor3", cert: "A+ 220-1201 \u00b7 5.3 Display issues",
    title: "Lisa: \"My screen is dead\"",
    body: "Lisa: 'It just went black. I think the monitor finally died.' The monitor's power button glows amber, gently pulsing.",
    where: "Accounting \u00b7 Lisa's desk",
    options: [
      { key: "wake", label: "Wiggle the mouse to wake it", correct: true,
        feedback: "The monitor flashes on. The PC was just asleep. Amber-pulsing usually means standby, not dead. Took two seconds." },
      { key: "replace", label: "Order a new monitor", correct: false,
        feedback: "You'd have wasted $200. Amber pulsing = standby = the PC went to sleep. Always check what the LED is telling you." },
      { key: "cable", label: "Replace the DisplayPort cable", correct: false,
        feedback: "Nothing was wrong with the cable. PC was asleep. Read the LED first." }
    ]
  },

  "usbDrop": {
    floor: "floor3", cert: "Security+ SY0-701 \u00b7 2.2 Threat vectors (removable media)",
    title: "A USB stick on the floor",
    body: "There's an unbranded USB stick on the carpet by the open desks. No name, no label. Someone could've dropped it \u2014 or someone could've left it there on purpose.",
    where: "Open desks 2",
    reward: { find: "usbWise", coins: 6 },
    options: [
      { key: "security", label: "Bag it and hand it to security", correct: true,
        feedback: "Right call. Unknown USBs are a classic attack \u2014 drop a few in a parking lot or lobby and wait for a curious employee to plug one in. Security can inspect it safely on an isolated machine. (Keepsake: USB-Wise badge.)" },
      { key: "plug", label: "Plug it in to see whose it is", correct: false,
        feedback: "Don't. A malicious USB can auto-run payloads or pose as a keyboard and type commands the instant it's connected \u2014 'find the owner' is exactly the curiosity the attacker is counting on." },
      { key: "leave", label: "Leave it where it is", correct: false,
        feedback: "Understandable, but now it's still bait for the next person who walks by. The move is to remove it from circulation \u2014 hand it to security." }
    ]
  },

  "printerInk": {
    floor: "floor3", cert: "A+ 220-1201 \u00b7 5.6 Printer issues",
    title: "Printer waving for ink",
    body: "The print room printer has a small yellow light blinking next to the cyan cartridge. Nobody filed a ticket. It still prints in monochrome.",
    where: "Print room",
    options: [
      { key: "replace", label: "Replace the cyan cartridge", correct: true,
        feedback: "30-second swap. Color printing is restored before anyone notices. This is the kind of proactive fix that quietly prevents a real ticket later." },
      { key: "ignore", label: "Ignore \u2014 it still prints", correct: false,
        feedback: "It'll work until someone tries to print a client deck in color, then it'll be an urgent ticket. Proactive \u2265 reactive." },
      { key: "replace-all", label: "Replace all four cartridges", correct: false,
        feedback: "Wasteful. Only cyan was low. The blinking light specifically named the cartridge." }
    ]
  },

  // ---- FLOOR 7 (security ops) ---------------------------------------------
  "defaultCreds": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 2.5 Mitigation (hardening)",
    title: "Switch still on admin/admin",
    body: "The network closet switch greets you with a web login. You try admin/admin out of habit \u2014 and you're in. Config-mode, full access, and Telnet is enabled.",
    where: "Network closet",
    reward: { find: "hardener", coins: 8 },
    options: [
      { key: "harden", label: "Change creds, disable Telnet, enable SSH", correct: true,
        feedback: "Right. Default credentials are the #1 way IoT and infra get owned. Set a strong unique password, kill Telnet (plaintext!), enable SSH, and check who else has been logging in. (Keepsake: Hardened badge.)" },
      { key: "note", label: "Leave a sticky note to fix it later", correct: false,
        feedback: "'Later' is how default creds survive for years. A device this exposed gets fixed now, not on a Post-it." },
      { key: "ignore", label: "It's internal-only, leave it", correct: false,
        feedback: "'Internal-only' assumes nobody ever gets a foothold \u2014 and an admin/admin switch is exactly the pivot they'd use once they do. Defense in depth." }
    ]
  },

  "exposedRdp": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 2.2 Attack surfaces",
    title: "RDP open to the whole internet",
    body: "A firewall rule reads: permit tcp any -> 10.10.2.10 eq 3389. That's Remote Desktop on a server, reachable from anywhere on earth. Shodan would find it in minutes.",
    where: "Firewall console",
    reward: { find: "surfaceShrink", coins: 8 },
    options: [
      { key: "close", label: "Close 3389 at the edge; require VPN + MFA", correct: true,
        feedback: "Right. Internet-facing RDP is relentlessly brute-forced and is a top ransomware entry point. Put it behind a VPN with MFA (or a bastion), and never expose 3389 to 'any'. (Keepsake: Attack-Surface badge.)" },
      { key: "strong", label: "Just set a long password", correct: false,
        feedback: "A strong password helps, but the port is still scanned, brute-forced, and exposed to every RDP CVE. Remove the exposure, don't just toughen it." },
      { key: "portchange", label: "Move RDP to a non-standard port", correct: false,
        feedback: "Security by obscurity. Scanners find services on any port in seconds. It must not be reachable from 'any' at all." }
    ]
  },

  "secretInRepo": {
    floor: "floor7", cert: "PenTest+ PT0-003 \u00b7 Recon / Security+ 2.2",
    title: "An API key in a public repo",
    body: "Recon on the company's public GitHub turns up a committed config file: AWS_SECRET_ACCESS_KEY = AKIA... \u2014 live, in plaintext, in the history.",
    where: "Red-team lab \u00b7 OSINT station",
    reward: { find: "secretSweeper", coins: 8 },
    options: [
      { key: "rotate", label: "Rotate the key now, then purge it from history", correct: true,
        feedback: "Right. Once a secret is public, treat it as compromised: rotate/revoke it first (deleting the file isn't enough \u2014 it's in git history and likely already scraped), then purge history and add secret-scanning to CI. (Keepsake: Secret-Sweeper badge.)" },
      { key: "delete", label: "Just delete the file and commit", correct: false,
        feedback: "The key still lives in every prior commit and in clones/forks \u2014 and bots scrape new commits within seconds. You must rotate it, not just hide it." },
      { key: "private", label: "Make the repo private", correct: false,
        feedback: "It was already public; assume it's been harvested. Flipping to private doesn't un-leak the key \u2014 rotate it." }
    ]
  },

  "tailgater": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 1.2 Physical security / 2.2 Social eng",
    title: "Someone tailgates the secure door",
    body: "You badge into the SOC and a friendly stranger in a delivery polo slips in behind you, arms full of boxes. 'Thanks! Forgot my badge in the car.' No visible credential.",
    where: "SOC entrance",
    reward: { find: "badgeChallenger", coins: 8 },
    options: [
      { key: "challenge", label: "Politely stop them; walk them to reception to sign in", correct: true,
        feedback: "Right. Tailgating bypasses every dollar of access control. Challenging unbadged people is awkward but correct \u2014 escort them to reception for a visitor badge and an escort. (Keepsake: Badge-Challenger.)" },
      { key: "hold", label: "Hold the door \u2014 they've got their hands full", correct: false,
        feedback: "Courtesy is exactly what social engineers weaponize. A real delivery gets signed in at reception; you don't grant unescorted access to a secure area on a smile." },
      { key: "ignore", label: "Not your job \u2014 keep walking", correct: false,
        feedback: "Physical security is everyone's job once you've badged someone in behind you. At minimum, report it; better, escort them to sign in." }
    ]
  }
};

export function sideQuestIdsForFloor(floorId) {
  return Object.keys(SIDE_QUESTS).filter((id) => (SIDE_QUESTS[id].floor || "floor3") === floorId);
}
