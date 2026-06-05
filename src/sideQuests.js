// Side quests are one-shot quick-solves. No evidence chain, no debrief screen.
// Walk past, notice the marker, pick an answer, get a one-line lesson.
// Schema: { title, body, where, options[] }
//   options: { key, label, correct, feedback }

export const SIDE_QUESTS = {
  "unplugged": {
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
  }
};
