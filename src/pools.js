// v2 "Cutover Week" content pools. Pure data, no DOM.
//
// Everything that rolls per day lives here. The day engine picks from these
// once per day (rollDay in days.js), persists the pick, and never rerolls on
// reload. Scores: 2 = best, 1 = okay, 0 = makes it worse. Every entry must have
// EXACTLY ONE score-2 option (the validator checks).
//
// Fact-check discipline: every "best" answer is defensible under real help-desk
// practice. Org-policy numbers (notice period, card limit, lifelines) are game
// design and are labeled that way in the handoff.

// ---- who walks up (shuffled daily) ----------------------------------------
export const PERSONAS = [
  { name: "Brenda",   sub: "Accounting · AP clerk",  sprite: { body:"#8E6C3A", body2:"#624A27", accent:"#FFE9B8", hair:"#6B4A2A", skin:"#E0B080" } },
  { name: "Luis",     sub: "Accounting · payroll",   sprite: { body:"#2E6FB0", body2:"#1B4E84", accent:"#CFE6FF", hair:"#1a1a18", skin:"#A8744E" } },
  { name: "Mei",      sub: "Reception",                  sprite: { body:"#D85A30", body2:"#993C1D", accent:"#FFE3C2", hair:"#1a1a18", skin:"#E0B080" } },
  { name: "Tom",      sub: "Sales",                      sprite: { body:"#3B7A57", body2:"#255038", accent:"#CFF3DD", hair:"#BA7517", skin:"#F2D2B6" } },
  { name: "Aaliyah",  sub: "Marketing",                  sprite: { body:"#B5179E", body2:"#7E1070", accent:"#FFD6F4", hair:"#2C2C2A", skin:"#6B4226" } },
  { name: "Frank",    sub: "Accounting · controller", sprite: { body:"#5F5E5A", body2:"#44433F", accent:"#F1EFE8", hair:"#C8C4B4", skin:"#D8B088", glasses: true } },
  { name: "Sunita",   sub: "HR",                         sprite: { body:"#7F77DD", body2:"#534AB7", accent:"#F4C0D1", hair:"#1a1a18", skin:"#A8744E" } },
  { name: "Gabe",     sub: "Reception · temp",       sprite: { body:"#2BB3A3", body2:"#178277", accent:"#D6FFF8", hair:"#412402", skin:"#C9926B" } },
  { name: "Dolores",  sub: "Legal",                      sprite: { body:"#44505C", body2:"#2E3740", accent:"#FFFFFF", hair:"#888780", skin:"#E0B080", glasses: true } },
  { name: "Jamal",    sub: "Operations",                 sprite: { body:"#C0392B", body2:"#8E261B", accent:"#FFFFFF", hair:"#1a1a18", skin:"#4A2C18" } },
  { name: "Wendy",    sub: "Executive assistant",        sprite: { body:"#E8B923", body2:"#A8851A", accent:"#2C2C2A", hair:"#6B4A2A", skin:"#F2D2B6" } },
  { name: "Oskar",    sub: "Accounting · AR",        sprite: { body:"#1D7FA8", body2:"#135A78", accent:"#D6F2FF", hair:"#C8C4B4", skin:"#F2D2B6" } }
];

// ---- walk-up users (the "neighbors") ---------------------------------------
// { id, d, lines[], ask, opts:[[text, score, feedback]], tag, cert, why }
export const ISSUES = [
  // ===================== DAY 1 · onboarding & prep (6) =====================
  { id: "d1_reset", d: 1, tag: "Locked out before a board meeting", cert: "A+ 220-1202 · 2.0 Security / NIST SP 800-63B-4 recovery",
    lines: ["I'm locked out. My password expired over the weekend.", "I present to the board in TEN minutes."],
    ask: "Can you just reset it? Please?",
    opts: [
      ["Verify who they are the documented way (badge, or a callback to the number on file), unlock the account, and have them set the new password themselves.", 2,
       "Verified, unlocked, new password set by them. They make the meeting. That verification step is exactly what stops a social engineer from getting the same reset."],
      ["Reset it to Welcome123 and read it out across the room.", 0,
       "Everyone in Accounting now knows their password, and you never checked it was actually them."],
      ["Tell them to submit a ticket and wait in the queue.", 1,
       "Procedurally fine, but a verified walk-up reset is exactly what you're here for. The board is waiting."]
    ] },
  { id: "d1_wifi", d: 1, tag: "Wi-Fi for personal devices", cert: "Network+ N10-009 · 4.1 Segmentation",
    lines: ["What's the Wi-Fi password?", "For my phone. And my other phone. And my kid's iPad, he's here today."],
    ask: "Which network do I use?",
    opts: [
      ["Point them to the guest network. Personal devices stay off the corporate network.", 2, "Guest network it is. Segmentation starts at the front desk."],
      ["Give them the corporate Wi-Fi key.", 0, "Three unmanaged devices on the corporate network. That's how malware gets a seat at the table."],
      ["Say there's no Wi-Fi.", 1, "There is. They can see it on their phone. Now they think IT lies."]
    ] },
  { id: "d1_screen", d: 1, tag: "\"Why can IT see my screen?\"", cert: "A+ 220-1202 · 4.0 Operational procedures (AUP, professionalism)",
    lines: ["A box popped up this morning that said 'IT is viewing your screen.'", "I didn't ask for that. Are you people watching me?"],
    ask: "Is IT spying on me?",
    opts: [
      ["Explain that remote sessions need their consent (that prompt was the request), that they can end one any time, and that monitoring rules are in the acceptable use policy. Offer to check who started it.", 2,
       "They relax. You check the log: it was the imaging team confirming the new laptop order. Transparency beats reassurance."],
      ["'It's in the acceptable use policy you signed.'", 1, "True, and a little cold. They still don't know what happened or how to stop it."],
      ["'Ha, we see everything. Every tab.'", 0, "It was a joke. They didn't hear it as one. HR hears about it by lunch."]
    ] },
  { id: "d1_sticky", d: 1, tag: "Password on a sticky note", cert: "Security+ SY0-701 · 5.6 Security awareness",
    lines: ["The sticky note on my monitor? That's my password. It's fine, it's inside the building.", "I'll move it under the keyboard if that makes you happy."],
    ask: "Under the keyboard is fine, right?",
    opts: [
      ["Don't read it out. Help them take it down, set up the company password manager, and pick a long passphrase they'll actually remember. Change it, since it's been on display.", 2,
       "Note shredded, passphrase in the vault, old password retired. The auditor would have found that sticky in about four seconds."],
      ["'Under the keyboard is better than on the monitor, I guess.'", 1, "Under the keyboard is the first place anyone looks. It's still a written-down password."],
      ["'Just use the same password everywhere so you don't need notes.'", 0, "Now one leak from any site opens every account they have."]
    ] },
  { id: "d1_jeff", d: 1, tag: "\"Unlock Jeff's computer for me\"", cert: "Security+ SY0-701 · 4.6 Identity & access mgmt",
    lines: ["Jeff's out sick and I need the Q3 file off his computer.", "I know his password is his dog's name. I just need you to log me in."],
    ask: "Can you unlock Jeff's computer?",
    opts: [
      ["No logging in as Jeff. Reach Jeff, or get his manager to approve access to that specific file through a request, and help them file it now.", 2,
       "Jeff's manager approves in ten minutes and the file gets shared properly. Nobody used anybody else's identity."],
      ["'Sorry, policy says no.'", 1, "Correct, but they still need the file. Show them the path that gets it."],
      ["'Sure, what's the dog's name?'", 0, "Now every action on Jeff's account today is actually yours. Accountability is gone."]
    ] },
  { id: "d1_keep", d: 1, tag: "\"Can I keep my old laptop?\"", cert: "Security+ SY0-701 · 4.2 Asset management",
    lines: ["Tomorrow I get the new laptop, right? So the old one's mine?", "My kid needs one for school. It's basically trash to you."],
    ask: "I can keep it, right?",
    opts: [
      ["Explain it's a company asset: it stays in custody, gets sanitized, and is disposed of or redeployed per policy. Their old data's on it. Point them to any approved purchase program if one exists.", 2,
       "They get it. 'Oh. My old emails are on there, aren't they.' Yes. Yes they are."],
      ["'Ask your manager.'", 1, "Their manager doesn't own the asset policy either. Answer the actual question."],
      ["'Sure, just don't tell anyone.'", 0, "An unsanitized company drive just walked out the door in a backpack."]
    ] },

  // ===================== DAY 2 · go-live (14) =====================
  { id: "d2_admin", d: 2, tag: "\"Make me an admin\"", cert: "Security+ SY0-701 · 2.5 Mitigation (least privilege)",
    lines: ["The new laptop won't let me install my PDF thing.", "The old one let me install anything!"],
    ask: "Can you just make me an admin?",
    opts: [
      ["No local admin, but push the approved PDF tool from the company software catalog (or file the request for it) right now.", 2,
       "Installed in five minutes, no admin rights handed out. Least privilege without being the 'no' department."],
      ["'Sure, just this once.'", 0, "Local admin for everyone is how one phishing click becomes a company-wide problem."],
      ["'It's policy, sorry.'", 1, "True, but offer the path that actually gets them their tool."]
    ] },
  { id: "d2_clicked", d: 2, tag: "Clicked a phishing link", cert: "Security+ SY0-701 · 4.8 Incident response / 5.6 Awareness",
    lines: ["So… I might have clicked a link.", "It said my mailbox was full, I typed my password in, and then it went blank."],
    ask: "Am I in trouble?",
    opts: [
      ["Thank them for reporting it fast, then report it to Security through the incident process right now (password reset, revoke sessions, check mailbox rules). No blame.", 2,
       "Security's on it in minutes. Fast, blame-free reporting is the whole ballgame; people who get yelled at stop reporting."],
      ["'Why would you DO that?!'", 0, "Now they'll never report the next one."],
      ["'Just change your password and don't worry about it.'", 1, "Better than nothing, but Security needs to know. Sessions and forwarding rules outlive a password change."]
    ] },
  { id: "d2_data", d: 2, tag: "\"My files didn't come over!\"", cert: "A+ 220-1202 · 4.0 Operational procedures (data migration)",
    lines: ["My desktop is EMPTY. Years of files. Gone.", "You said this would be seamless."],
    ask: "Where are my files?",
    opts: [
      ["Stay calm and check the transfer checklist and OneDrive Known Folder Move sync. The old laptop is untouched until sign-off (that's the backout plan), so nothing is lost. Don't promise what you haven't confirmed.", 2,
       "OneDrive was still syncing. Twenty minutes later the desktop's back, and you confirmed it before saying so."],
      ["'Don't worry, everything was backed up.'", 0, "You haven't checked. If one folder didn't sync, you just made a promise you can't keep."],
      ["'It's probably in OneDrive. Check later.'", 1, "Probably right, but 'later' isn't help. Look with them."]
    ] },
  { id: "d2_slow", d: 2, tag: "\"The new laptop is SO slow\"", cert: "A+ 220-1202 · 3.0 Software troubleshooting",
    lines: ["This is supposed to be NEW. It's slower than the old one.", "The fan is going like a jet engine."],
    ask: "Did you give me a broken one?",
    opts: [
      ["Show them Task Manager: first-boot updates, search indexing and OneDrive sync are all running. Set the expectation (plugged in, about an hour), and check back after lunch.", 2,
       "By 2 PM it flies, and they saw why. Setting expectations is half of support."],
      ["'They're all like that.'", 1, "They aren't, for long. Explain what's happening and when it stops."],
      ["'I'll reimage it right now.'", 0, "A reimage restarts the exact first-boot work that's making it slow, and costs them another hour."]
    ] },
  { id: "d2_printer", d: 2, tag: "Printer offline on the new laptop", cert: "A+ 220-1201 · 5.6 Printer issues",
    lines: ["The printer says offline.", "It printed fine yesterday! On the OLD laptop."],
    ask: "Is the printer broken?",
    opts: [
      ["The new image just doesn't have the queue yet. Add the Accounting printer from the company print server and send a test page.", 2,
       "Queue added, test page out. Log it: if one laptop is missing the queue, the image probably is too."],
      ["'Print from someone else's PC for now.'", 1, "A workaround, not a fix. Tomorrow they're back."],
      ["'Download whatever driver comes up first on Google.'", 0, "Random driver sites are a classic malware source. Use the print server."]
    ] },
  { id: "d2_upside", d: 2, tag: "Second monitor upside down", cert: "A+ 220-1202 · 1.0 Operating systems (display settings)",
    lines: ["My second monitor is UPSIDE DOWN.", "I didn't touch anything. I think it's haunted."],
    ask: "Can you exorcise it?",
    opts: [
      ["Settings → System → Display, pick that monitor, set Display orientation back to Landscape.", 2,
       "Right side up. Some graphics drivers have rotation hotkeys that get pressed by accident; the Display setting always works."],
      ["'Try Ctrl+Alt+Up Arrow.'", 1, "That hotkey only works on some graphics drivers and is often disabled. Maybe, maybe not."],
      ["'Order a new monitor.'", 0, "Nothing is wrong with the monitor. That's $200 for a setting."]
    ] },
  { id: "d2_mfa", d: 2, tag: "Surprise MFA prompts", cert: "Security+ SY0-701 · 2.4 Indicators / CISA number-matching guidance",
    lines: ["My phone keeps buzzing: 'Approve sign-in?'", "I'm not signing in to anything. It's been six times."],
    ask: "Can I just hit approve so it stops?",
    opts: [
      ["Never approve a prompt you didn't start. Deny it. Someone likely has their password, so report it to Security now: reset the password, revoke sessions.", 2,
       "Security confirms a push-bombing attempt from overseas. One tap on 'approve' and the attacker was in. That's MFA fatigue."],
      ["'Just ignore it.'", 1, "Don't approve, good. But someone has their password, and Security needs to know."],
      ["'Approve it, it's probably the migration.'", 0, "You just authorized an attacker. The migration doesn't send surprise prompts."]
    ] },
  { id: "d2_vip", d: 2, tag: "\"The CFO wants hers NOW\"", cert: "ITIL 4 · Priority = impact × urgency",
    lines: ["I'm Wendy, the CFO's assistant.", "She wants her new laptop now. Skip the line."],
    ask: "You'll bump her up, right?",
    opts: [
      ["Ask what she needs it for today. If there's real business urgency, get her the next open slot through Benny and Harold instead of pulling someone out mid-swap.", 2,
       "She has a 3 PM investor call. Benny slots her at 1. Nobody's swap got interrupted, and the priority was about impact, not title."],
      ["'Everyone waits their turn.'", 1, "Fair, but rigid. Priority is about business impact, and you didn't ask."],
      ["'Grab someone's laptop mid-swap and give it to the CFO.'", 0, "Now two people have half-migrated laptops and nobody knows whose data is where."]
    ] },
  { id: "d2_dock", d: 2, tag: "Dock won't charge the laptop", cert: "A+ 220-1201 · 3.0 Hardware (USB-C / power delivery)",
    lines: ["The dock lights up but the laptop says 'not charging.'", "I'm at 11%."],
    ask: "Is my new laptop broken already?",
    opts: [
      ["Check which USB-C port supports charging (not all do) and whether the dock's wattage is enough. Hand them the spare charger from the supply kit while you log it.", 2,
       "Wrong port. And the dock is under-powered for this model, which goes on the known-issues list for every desk."],
      ["'Bring it back tomorrow.'", 1, "At 11%, 'tomorrow' is about forty minutes from now."],
      ["'Use a random phone charger from the drawer.'", 0, "Under-spec chargers can't power a laptop and cheap ones are a real hazard."]
    ] },
  { id: "d2_phone", d: 2, tag: "\"Do I have to put the app on MY phone?\"", cert: "Security+ SY0-701 · 4.6 MFA methods",
    lines: ["The setup wants an authenticator app on my personal phone.", "I don't want the company in my phone."],
    ask: "Do I have to?",
    opts: [
      ["Explain the authenticator only approves sign-ins and gives IT no access to their personal data. If they still don't want it, offer the approved alternative (a hardware security key).", 2,
       "They pick the key. Either way they're enrolled, and they understood what they signed up for."],
      ["'Yes. It's required.'", 1, "Maybe, but they deserved to know what the app can and can't see."],
      ["'Just text me your codes and I'll sign in for you.'", 0, "Sharing MFA codes defeats MFA, and trains people to hand codes to anyone who says 'IT.'"]
    ] },
  { id: "d2_bookmarks", d: 2, tag: "Browser bookmarks gone", cert: "A+ 220-1202 · 3.0 Software troubleshooting",
    lines: ["All my bookmarks are gone. Fifteen years of bookmarks."],
    ask: "Can you get them back?",
    opts: [
      ["Sign them into their company browser profile so sync pulls the bookmarks. If they were never synced, export them from the old laptop, which is kept untouched until sign-off.", 2,
       "Profile synced, bookmarks back. The old laptop would have covered it either way. That's why you keep it."],
      ["'Just Google everything.'", 1, "Technically works. Practically, it's fifteen years of their workflow."],
      ["'Reinstall Windows.'", 0, "That makes nothing come back and wipes what's there."]
    ] },
  { id: "d2_sharepw", d: 2, tag: "User offers their password", cert: "Security+ SY0-701 · 5.6 Security awareness",
    lines: ["Here, to save time: my password is Brenda2024!", "Just set it all up for me."],
    ask: "That's easier, right?",
    opts: [
      ["Stop them. You never need their password: have them type it themselves. Since they just said it out loud, have them change it now.", 2,
       "They type their own new passphrase. You never learned it. The person behind them in line didn't either."],
      ["'Okay, I'll forget it right after.'", 1, "Nice thought. It's still known, and shared out loud."],
      ["Write it on the setup sheet so the transfer tool can use it.", 0, "Now it's on paper, on a clipboard, in a conference room."]
    ] },
  { id: "d2_lunch", d: 2, tag: "\"Can you swap me later?\"", cert: "A+ 220-1202 · 4.0 Change mgmt (scheduling)",
    lines: ["I have a lunch meeting in ten minutes.", "Can we do my swap later? I don't want to lose anything."],
    ask: "Can I reschedule?",
    opts: [
      ["Of course. Book them a new slot with Benny and note it on the schedule. Don't rush a data transfer.", 2, "New slot at 2:30, noted. Rushed transfers are how files get lost."],
      ["Start the swap anyway and hope ten minutes is enough.", 0, "It isn't. They leave with a half-migrated laptop."],
      ["'Just come back whenever.'", 1, "'Whenever' means they show up at the same time as three other people."]
    ] },
  { id: "d2_camera", d: 2, tag: "Teams can't find the camera", cert: "A+ 220-1202 · 1.0 OS settings (privacy)",
    lines: ["Teams says no camera found.", "My big meeting's in twenty minutes."],
    ask: "Why can't it see my face?",
    opts: [
      ["Check Windows Privacy & security → Camera access, then the camera selected in Teams device settings. The new image may have camera access off by default.", 2,
       "Camera access was off in the image. Fixed and logged. Every new laptop probably has the same setting."],
      ["'Join from your phone.'", 1, "A workaround for today. The next meeting has the same problem."],
      ["'Put tape over it, it's safer anyway.'", 0, "They needed it working, not a privacy lecture."]
    ] },

  // ===================== DAY 3 · hypercare (6) =====================
  { id: "d3_thanks", d: 3, tag: "A happy user", cert: "A+ 220-1202 · 4.0 Professionalism",
    lines: ["I just wanted to say: the new laptop is great.", "And you were really patient with me yesterday."],
    ask: "Is there anything I should know?",
    opts: [
      ["Thank them, ask if anything is still even slightly off, and remind them how to reach the service desk.", 2, "'Actually, the calendar's in the wrong time zone.' Fixed in thirty seconds. Happy users tell you things."],
      ["'No problem!'", 1, "Nice. You missed the chance to catch the small stuff."],
      ["'Just so you know, if anything breaks now it's not my fault.'", 0, "They were being nice. Now they won't come back to you."]
    ] },
  { id: "d3_photo", d: 3, tag: "\"There's a photo on my old laptop!\"", cert: "Security+ SY0-701 · 4.2 Asset mgmt (retention before sanitization)",
    lines: ["Where's my old laptop? There's a photo of my mom on the desktop.", "It's the only copy."],
    ask: "Can I get it?",
    opts: [
      ["The old laptop's in secure custody until sign-off. Raise a documented recovery request now and you'll copy the file off before it's sanitized. After sanitization it's gone for good.", 2,
       "You pull the photo off under the request, logged. Twenty minutes later that laptop goes into the cage."],
      ["'Sorry, it's already gone.'", 1, "It isn't yet. Check before you say no to something that matters this much."],
      ["'Go dig through the pile yourself.'", 0, "The pile is other people's unsanitized laptops. That's a data breach with extra steps."]
    ] },
  { id: "d3_sdrive", d: 3, tag: "\"My S: drive vanished again\"", cert: "ITIL 4 · Known errors / problem mgmt",
    lines: ["My S: drive is gone. Again.", "Third time since the new laptop."],
    ask: "Why does this keep happening?",
    opts: [
      ["It's on the known-issues log. Link their report to the known issue, give them the workaround, and tell them which team owns the fix.", 2, "One fix, many tickets. They leave with a workaround and a real answer."],
      ["Open a brand-new ticket and start troubleshooting from scratch.", 1, "You'll get there, slowly, while the known fix sits one screen away."],
      ["'Just stop using the S: drive.'", 0, "It's where Accounting keeps Accounting."]
    ] },
  { id: "d3_rotate", d: 3, tag: "\"Should I change my password monthly?\"", cert: "NIST SP 800-63B-4 · Password guidance",
    lines: ["My old company made us change passwords every month.", "Should I do that here to be safe?"],
    ask: "Monthly, right?",
    opts: [
      ["No forced monthly changes. Use a long, unique passphrase in the password manager, keep MFA on, and change it right away if there's any sign it's compromised.", 2, "Current NIST guidance: forced periodic changes just produce Password1, Password2… Length and uniqueness win."],
      ["'Monthly is fine, I guess.'", 1, "Not harmful, but it usually leads to predictable little increments."],
      ["'Use the same one everywhere so you never forget it.'", 0, "One breach anywhere, and every account falls."]
    ] },
  { id: "d3_feedback", d: 3, tag: "Complaint about the waiting area", cert: "ITIL 4 · Post-implementation review",
    lines: ["I waited forty minutes in that conference room.", "No chairs, lukewarm coffee, and nobody told me anything."],
    ask: "Does anyone care?",
    opts: [
      ["Listen, thank them, and capture it for the post-implementation review so the next rollout has better comms and seating.", 2, "It goes in the PIR under 'what didn't go well.' Next rollout: status board and real chairs."],
      ["'Take it up with Harold.'", 1, "You passed it on. They wanted to feel heard first."],
      ["'It was fine. You're overreacting.'", 0, "It wasn't fine for them, and now they're telling everyone."]
    ] },
  { id: "d3_personal", d: 3, tag: "\"Fix my personal laptop?\"", cert: "A+ 220-1202 · 4.0 Operational procedures (support scope)",
    lines: ["You're so good at this. My personal laptop at home is SO slow.", "Can you look at it tomorrow?"],
    ask: "Pretty please?",
    opts: [
      ["Politely decline: company support covers company devices. Offer a couple of general tips and suggest a reputable local repair shop.", 2, "They're a little disappointed and a lot less likely to bring malware into the office."],
      ["'Sure, bring it in tomorrow.'", 1, "Kind, but outside policy, and now you're responsible for it."],
      ["'Plug it into the corporate network and I'll scan it from my desk.'", 0, "An unmanaged, possibly infected personal laptop on the corporate LAN. Exactly the thing segmentation exists to stop."]
    ] }
];

// ---- pages / chat mentions ("Locations, go to 2") --------------------------
// { id, d, who, ask, opts, go?, spawn? }
// go:true pages spawn a user (with a pinned issue) somewhere on Floor 3.
export const PAGES = [
  // ---- Day 1 ----
  { id: "p1_newstarter", d: 1, who: "Benny", ask: "New starter in Sales can't sign in on day one. Their manager is hovering. Can you take it?",
    opts: [
      ["Verify it's them against the HR start record, check the account is enabled and set to change password at first sign-in, then walk them through first sign-in and MFA enrollment.", 2, "\"Copy. They're in, enrolled, and their manager stopped hovering.\""],
      ["Tell them to come back tomorrow when things are calmer.", 1, "\"Their first day is today, though…\""],
      ["Let them use your account for today.", 0, "\"Absolutely not. Everything they do is now logged as you.\""]
    ] },
  { id: "p1_priority", d: 1, who: "Benny", ask: "Two tickets just landed: the CEO hates his new wallpaper, and Accounting can't print checks that go out today. Which first?",
    opts: [
      ["Accounting's checks. Priority is impact times urgency, not job title.", 2, "\"Correct. The CEO will survive the wallpaper until 3.\""],
      ["Whichever came in first.", 1, "\"First-in-first-out ignores impact. The checks have a deadline.\""],
      ["The CEO. Always the CEO.", 0, "\"And the vendors don't get paid today. Impact times urgency.\""]
    ] },
  { id: "p1_pwemail", d: 1, who: "Tasha", ask: "Someone emailed their password to helpdesk@ 'to speed things up.' What do we do?",
    opts: [
      ["Don't use it. Have them reset it now (it's been exposed in email), delete the message per policy, and remind them IT never needs their password.", 2, "\"That's the answer. I'll add a line to the onboarding deck.\""],
      ["Just delete the email.", 1, "\"The password's still exposed. It needs a reset.\""],
      ["Use it to finish setting up their laptop. Convenient!", 0, "\"Now it's in email AND you've used it. Reset. Now.\""]
    ] },
  // ---- Day 2 ----
  { id: "p2_reboot", d: 2, who: "Harold", ask: "Someone on the bridge wants Help Desk to reboot the file server to 'speed up the cutover.' Your call?",
    opts: [
      ["No. It's not our change and not our server. Push it back to the change manager on the bridge; nobody touches production mid-change outside the plan.", 2, "\"Correct. Help Desk owns the users; the engineers own the change.\""],
      ["Ask Tasha about it later.", 1, "\"Later is too late on a bridge. Say no now.\""],
      ["Reboot it. What could go wrong?", 0, "\"Forty people's open files, that's what.\""]
    ] },
  { id: "p2_p1", d: 2, who: "Benny", ask: "All of Accounting just lost the payroll app. Payroll runs at noon. What is it and what do we do?",
    opts: [
      ["That's a P1: whole department, hard deadline. Escalate to the bridge and on-call now with the impact, and keep Accounting updated. Don't try to fix it alone.", 2, "\"Paging it as P1. Bridge has it.\""],
      ["Log it as a normal ticket in the queue.", 1, "\"It'll sit behind wallpaper requests. This is a P1.\""],
      ["Tell them to try again after lunch.", 0, "\"Payroll is AT lunch. People don't get paid.\""]
    ] },
  { id: "p2_scope", d: 2, who: "Riley", ask: "While you're swapping laptops, can you also upgrade all the Office add-ins? Might as well!",
    opts: [
      ["Not in this change. Log it as a separate request after the window. Unapproved extras mid-change are how rollbacks get messy.", 2, "\"Fair. Request submitted.\""],
      ["Sure, quickly.", 0, "\"If anything breaks now, nobody knows which change did it.\""],
      ["Maybe later.", 1, "\"'Maybe later' isn't a plan. Log it.\""]
    ] },
  { id: "p2_stolen", d: 2, who: "Karen", ask: "A Reception temp says their NEW laptop was stolen from their bag on the train!",
    opts: [
      ["Treat it as a security incident now: report it, lock or remote-wipe it through device management, revoke the user's sessions, reset the password, and file the loss report.", 2, "\"Security confirms the wipe queued. Device can't be used.\""],
      ["Order a replacement laptop.", 1, "\"They'll need one, but the stolen one still has access.\""],
      ["It's encrypted, so wait and see if it turns up.", 0, "\"Encryption helps, but an active session is still an open door.\""]
    ] },
  { id: "p2_payroll", d: 2, who: "Ed", ask: "Ed's texting you: 'Swap my laptop NOW, I'm bored.' He's in the middle of the payroll run.",
    opts: [
      ["Not during payroll. Book him right after the run. Never interrupt a business-critical process for a change.", 2, "\"Fine. Fine! After payroll.\""],
      ["Swap it quickly anyway.", 0, "\"The payroll run stops halfway. Everyone finds out why.\""],
      ["Just say no and don't reschedule.", 1, "\"He's still due a swap. Give him a slot.\""]
    ] },
  { id: "p2_status", d: 2, who: "Harold", ask: "Can Help Desk post a status update for users on the intranet?",
    opts: [
      ["Plain language: what's happening, who's affected, what to do, and when the next update is.", 2, "\"Posted. Tickets asking 'is it down?' drop by half.\""],
      ["Paste the raw technical bridge log.", 1, "\"Accurate, and unreadable to Accounting.\""],
      ["Say nothing until it's all done.", 0, "\"Silence is how rumors become tickets.\""]
    ] },
  { id: "p2_go_luis", d: 2, who: "Benny", go: true, where: "by the Accounting desks",
    ask: "Luis in Accounting says his new laptop is stuck on a BitLocker recovery screen. He's by the Accounting desks. Go find him?",
    spawn: { spot: { x: 22, y: 18 }, persona: 1, issue: {
      id: "g_bitlocker", tag: "BitLocker recovery screen", cert: "A+ 220-1202 · 2.0 Security (BitLocker)",
      lines: ["It's asking for a 48-digit recovery key.", "I didn't do anything! I just plugged into the dock."],
      ask: "Do I just… guess?",
      opts: [
        ["Verify it's him, pull the recovery key escrowed in device management for THAT device ID, give it to him securely, then figure out what triggered it and log it.", 2, "He's in. The trigger was a dock firmware prompt, so it goes on the known-issues log for every desk."],
        ["Reimage the laptop.", 1, "It'd work, and wipe whatever hadn't synced yet. The key was one lookup away."],
        ["Disable BitLocker on every new laptop so this never happens again.", 0, "Then a stolen laptop is an open book. The recovery screen is the feature working."]
      ] } } },
  { id: "p2_go_mei", d: 2, who: "Karen", go: true, where: "at Reception",
    ask: "Mei at the front desk can't sign in and she's close to tears. She's at Reception. Can you go?",
    spawn: { spot: { x: 11, y: 4 }, persona: 2, issue: {
      id: "g_capslock", tag: "\"My password is wrong!\"", cert: "A+ 220-1202 · 3.0 Troubleshooting (start simple)",
      lines: ["It says my password is wrong. I KNOW my password.", "I've tried it like nine times."],
      ask: "Did you delete me?",
      opts: [
        ["Check the simple stuff first: Caps Lock, and the keyboard layout the new image set. Then have her try once more before any reset.", 2, "The image defaulted to a different keyboard layout. Fixed, logged for the image team, and she's in."],
        ["Reset her password right away.", 1, "Works, but it hides the real cause and every new laptop has it."],
        ["Have her use Karen's login for today.", 0, "Shared logins wreck accountability, and Karen's day just got worse too."]
      ] } } },
  // ---- Day 3 ----
  { id: "p3_dupes", d: 3, who: "Benny", ask: "Three tickets about the S: drive came in overnight. Same issue. How do we handle them?",
    opts: [
      ["Link them all to the known issue, fix it once, and update every ticket when it's resolved.", 2, "\"Linked. One fix, three happy people.\""],
      ["Work them one at a time.", 1, "\"Three times the effort, same answer.\""],
      ["Close them as duplicates without telling anyone.", 0, "\"Three people think we ignored them.\""]
    ] },
  { id: "p3_why", d: 3, who: "Tasha", ask: "Director Chen wants to know why Outlook prompted everyone for their password yesterday. What do we tell him?",
    opts: [
      ["What we know now, and that the root cause goes in the PIR once it's confirmed. No guessing.", 2, "\"Good. Facts now, RCA in the PIR.\""],
      ["Blame the vendor.", 1, "\"Maybe it was them. Maybe not. Find out first.\""],
      ["Make up something that sounds technical.", 0, "\"And when it's wrong, nobody trusts the PIR.\""]
    ] },
  { id: "p3_badge", d: 3, who: "Lou", ask: "Kai lost his building badge somewhere between here and the deli. What's the move?",
    opts: [
      ["Report it so security disables that badge right now, and get Kai a temporary badge.", 2, "\"Deactivated. Temp badge is on my desk.\""],
      ["Let him borrow yours today.", 0, "\"Now your badge is in two places and the lost one still works.\""],
      ["He'll probably find it. Check later.", 1, "\"Meanwhile anyone who picks it up gets upstairs.\""]
    ] }
];

// ---- known issues: logged on Day 2, routed to a resolver group on Day 3 ----
export const RESOLVER_GROUPS = ["Desktop", "Network", "Apps/M365", "Security", "Facilities"];
export const KNOWN_ISSUES = [
  { id: "ki_sdrive", area: "Accounting", who: "Oskar", report: "The S: drive isn't mapped on my new laptop.", log: "S: drive not mapped on new image (Accounting)", group: "Desktop",
    why: "Drive mappings come from the endpoint/image configuration: Desktop's lane." },
  { id: "ki_queue", area: "Accounting", who: "Frank", report: "The Accounting printer isn't on my list at all.", log: "Accounting print queue missing from new image", group: "Desktop",
    why: "Missing print queues on a new build are an image/endpoint fix: Desktop." },
  { id: "ki_outlook", area: "Reception", who: "Mei", report: "Outlook keeps asking for my password every ten minutes.", log: "Outlook repeated credential prompts after swap", group: "Apps/M365",
    why: "Repeated Outlook auth prompts are an M365 identity/profile problem: Apps/M365." },
  { id: "ki_phone", area: "Reception", who: "Gabe", report: "The desk phone at Reception has no dial tone since the move.", log: "Reception desk phone: no dial tone after move (PoE/VLAN?)", group: "Network",
    why: "A desk phone losing service after a move is almost always the switch port, PoE or voice VLAN: Network." },
  { id: "ki_jack", area: "Accounting", who: "Brenda", report: "The wall jack by my desk is dead. The dock gets no network.", log: "Dead wall jack at AP clerk desk", group: "Network",
    why: "Wall jacks and the patch panel are Network's (Facilities handles the wall, not the port)." },
  { id: "ki_cord", area: "Conf. room", who: "Kai", report: "The extension cord to the imaging bench runs across the doorway.", log: "Trip hazard: extension cord across conf-room doorway", group: "Facilities",
    why: "Cable runs across walkways are a safety hazard, and a Facilities job to route and cover properly." },
  { id: "ki_dock", area: "Accounting", who: "Luis", report: "The dock asked to update its firmware and then the laptop went to a BitLocker screen.", log: "Dock firmware update triggers BitLocker recovery", group: "Desktop",
    why: "Firmware and BitLocker behavior on endpoints: Desktop (they'll stage the firmware update properly)." },
  { id: "ki_forward", area: "Reception", who: "Karen", report: "My mailbox has a rule forwarding everything to an address I don't recognize.", log: "Unknown external forwarding rule on a Reception mailbox", group: "Security",
    why: "An unexpected external forwarding rule is a classic sign of a compromised mailbox: Security, immediately." }
];

// ---- the auditor's clean-desk walk (violation spots live in world.F3_SPOTS) --
export const VIOLATION_TEXT = {
  "v-screen": "Unlocked, unattended workstation. Anyone walking by is that user.",
  "v-sticky": "Password written on a sticky note at the desk.",
  "v-door":   "Server closet door wedged open. Physical access controls only work closed.",
  "v-print":  "Payroll printout left unattended. Sensitive data goes to the locked shred bin."
};

// ---- the social engineer (extends the tailgater / USB-drop family) ---------
export const SOCENG = [
  { id: "se_isp", map: "lobby", name: "\"Chad\"", sub: "hi-vis vest · clipboard · no badge",
    lines: ["Hey! Chad, from your internet provider.", "Your circuit's flapping. I just need five minutes in your network closet. Lou said it's cool."],
    ask: "You'll walk me up, right? I've got four more buildings today.",
    opts: [
      ["Don't take him up. Call the provider on the number in the vendor file (not one he gives you) to confirm a scheduled visit. He waits in the lobby with Lou until it checks out.", 2,
       "The provider has no ticket and no tech named Chad. By the time Lou turns around, Chad is gone. Verify through a channel you already trust."],
      ["Ask to see his work order first.", 1, "Better than nothing, but a clipboard is easy to fake. Verify with the provider directly."],
      ["Walk him up. Hi-vis vest, clipboard, seems legit.", 0, "Confidence and a vest are the whole costume. That's a stranger in your network closet."]
    ] },
  { id: "se_vish", map: "any", phone: true, name: "Unknown caller", sub: "+1 (800) 555-0199 · 'Microsoft Support'",
    lines: ["Hello, this is Microsoft Support. Your tenant is sending spam as we speak.", "We just texted a code to your admin phone. Read it to me and I'll stop the attack."],
    ask: "Quickly, what's the code?",
    opts: [
      ["Hang up and report it to Security. Support doesn't cold-call for codes. If you're worried, check through the admin portal or the known support channel yourself.", 2,
       "Security logs it. Same number hit two other companies this week. That 'code' was a password-reset code for your admin account."],
      ["Ask for his employee ID number.", 1, "He'll have one ready. Anyone can make up a number. Hang up and verify on your own."],
      ["Read him the code. He sounds stressed.", 0, "You just handed an attacker the reset code for an admin account. Urgency is the tell."]
    ] },
  { id: "se_fakeit", map: "floor3", name: "\"Derek from IT\"", sub: "lanyard, no photo · at Reception",
    lines: ["(You overhear him at Reception.) 'Hi, Derek, IT. We're doing the laptop migration.'", "'I just need the six-digit code from your phone to move your account over.'"],
    ask: "He turns to you: 'You're with the vendor too, right? Back me up.'",
    opts: [
      ["Step in: nobody in IT will ever ask for an MFA code. Ask for his badge, walk him down to Lou, and report it to Security.", 2,
       "No badge, no ticket, and suddenly no Derek. Karen keeps her code, and Security sends a heads-up to the whole floor."],
      ["Tell Karen not to give it to him, and let him go.", 1, "Karen's safe. Derek goes to try the next desk. Report it."],
      ["Assume he's with the migration vendor and help him.", 0, "Then Karen's account belongs to Derek. Real IT never needs your code."]
    ] }
];

// ---- the change bridge (the AD call sequence analog) ------------------------
// Each line may unlock a lingo card.
export const BRIDGE_LINES = [
  { t: "Harold: Backups confirmed. Test restore passed last night.", lingo: "testrestore" },
  { t: "Harold: Go/no-go check. Desktop? GO. Network? GO. Help Desk? GO. We are GO.", lingo: "gonogo" },
  { t: "Harold: Cutover started. Accounting batch, laptops one through six.", lingo: "window" },
  { t: "Harold: Validation in progress on the Accounting batch.", lingo: "uat" },
  { t: "Harold: Reception batch cutting over. Backout plan stays warm.", lingo: "backout" },
  { t: "Harold: One laptop failed validation. Rolled back to the old one. That's what the plan is for.", lingo: "rollback" },
  { t: "Harold: All batches migrated. Final validation starting.", lingo: "hypercare" },
  { t: "Harold: Change successful. We're in hypercare. Log anything weird.", lingo: "known" }
];

// ---- lingo cards (vocabulary by ear) ---------------------------------------
export const LINGO = {
  cab:        { term: "CAB", def: "Change Advisory Board: the group that reviews a change's risk, window and backout plan before it's approved." },
  backout:    { term: "Backout plan", def: "How you undo the change if it goes wrong. No backout plan, no approval." },
  rollback:   { term: "Rollback", def: "Actually executing the backout plan: putting things back the way they were." },
  gonogo:     { term: "Go / no-go", def: "The last check before a change starts. Every team says GO, or the change waits." },
  window:     { term: "Change window", def: "The approved time slot when a change is allowed to happen, usually low-impact hours." },
  freeze:     { term: "Change freeze", def: "A period when no non-emergency changes are allowed (quarter-end, holidays, big launches)." },
  hypercare:  { term: "Hypercare", def: "The period right after go-live when the team watches closely and fixes issues fast." },
  known:      { term: "Known error", def: "A problem with a documented root cause or workaround. Link new tickets to it instead of starting over." },
  uat:        { term: "UAT / sign-off", def: "User acceptance testing: the business confirms it works for them. Their sign-off closes the change." },
  p1:         { term: "P1", def: "Priority 1: highest impact and urgency, like a whole department down on a deadline. Escalate immediately." },
  sla:        { term: "SLA", def: "Service level agreement: the promised response and resolution times for each priority." },
  mttr:       { term: "MTTR", def: "Mean time to restore/repair: how long, on average, it takes to get a service back." },
  rca:        { term: "RCA", def: "Root cause analysis: finding why it happened, not just what happened." },
  pir:        { term: "PIR", def: "Post-implementation review: after a change, what went well, what didn't, and what we'll do differently." },
  kb:         { term: "KB article", def: "A knowledge base article: the written fix, so the next tech doesn't start from zero." },
  escalation: { term: "Escalation", def: "Handing a ticket to a higher tier or a specialist team. It's not failure; it's routing." },
  tiers:      { term: "Tier 1 / 2 / 3", def: "Support levels: Tier 1 takes first contact, Tier 2 goes deeper, Tier 3 is engineering/vendor." },
  leastpriv:  { term: "Least privilege", def: "Give every account only the access it needs, nothing more. Daily account for email, separate admin account for admin work." },
  jit:        { term: "JIT access", def: "Just-in-time privileged access: elevated rights granted for a task, then removed." },
  mfafatigue: { term: "MFA fatigue", def: "Push-bombing a user with sign-in prompts until they tap Approve. Never approve a prompt you didn't start." },
  custody:    { term: "Chain of custody", def: "A documented record of who had a device or evidence, when, from pickup to destruction." },
  sanitize:   { term: "Clear / purge / destroy", def: "NIST SP 800-88's sanitization levels: overwrite, make recovery infeasible even in a lab, or physically destroy the media." },
  assettag:   { term: "Asset tag", def: "The label (and inventory record) that ties a device's serial number to an owner and location." },
  imaging:    { term: "Imaging / provisioning", def: "Loading the standard OS, apps and settings onto a new machine, by image or by cloud enrollment." },
  bitlocker:  { term: "BitLocker recovery key", def: "The 48-digit key that unlocks an encrypted Windows drive when the TPM check fails. Escrowed per device." },
  kfm:        { term: "Known Folder Move", def: "OneDrive redirecting Desktop, Documents and Pictures to the cloud, so files follow the user to a new PC." },
  testrestore:{ term: "Test restore", def: "Proving a backup works by actually restoring from it. 'Job succeeded' isn't proof." },
  offon:      { term: "\"Have you tried turning it off and on again?\"", def: "A joke, and also, unreasonably often, the fix. Clears memory, restarts services, applies updates." }
};

// ---- per-run badges (behaviors, not stat boosts) ---------------------------
export const BADGES = {
  fixer:     { icon: "\u{1F527}", name: "The Fixer", desc: "Best answer to 6 walk-up users." },
  listener:  { icon: "\u{1F442}", name: "Good Listener", desc: "Heard out 8 users without cutting in." },
  gotochat:  { icon: "\u{1F4DF}", name: "On Call", desc: "Answered 5 pages." },
  clean:     { icon: "\u{1F9FE}", name: "Clean Queue", desc: "Closed the week with zero undocumented tickets." },
  honest:    { icon: "\u{1F91D}", name: "Honest Queue", desc: "Gave Gloria the true count of undocumented tickets." },
  escort:    { icon: "\u{1F9ED}", name: "Escort Service", desc: "Walked a wandering vendor back to their post." },
  verify:    { icon: "\u{1F6E1}️", name: "Verify, Then Trust", desc: "Shut down a social engineer the right way." },
  custody:   { icon: "\u{1F512}", name: "Chain of Custody", desc: "Every old device into the cage, logged." },
  paper:     { icon: "\u{1F4E8}", name: "Paper Trail", desc: "A perfect end-of-day email." },
  audit:     { icon: "✅", name: "Audit Ready", desc: "The auditor signed off on the clean-desk walk." },
  receipts:  { icon: "\u{1F9FE}", name: "Receipt Keeper", desc: "Every supply receipt, reconciled." },
  restore:   { icon: "\u{1F4BE}", name: "Trust, But Restore", desc: "Proved the backup with a test restore." },
  router:    { icon: "\u{1F500}", name: "Right Team, First Time", desc: "Routed every known issue to the right group first try." },
  kb:        { icon: "\u{1F4DA}", name: "Knowledge Keeper", desc: "Wrote a clean KB article." },
  notice:    { icon: "\u{1F4E3}", name: "No Surprises", desc: "Sent a complete user notice." },
  cab:       { icon: "\u{1F5C2}️", name: "CAB Ready", desc: "Got the change approved on the first pitch." }
};

// ---- EOD email distractors (things that don't belong in a shift handoff) ---
export const DISTRACT = [
  "\u{1F6D2} Found a great mechanical keyboard on sale, might expense it?",
  "\u{1F382} Karen's birthday is Friday (cake in the break room).",
  "\u{1F4FA} Watched a really good video about Kubernetes on lunch.",
  "☕ Lupe's cold brew is better than the lobby coffee.",
  "\u{1F408} Mittens sat on my keyboard for twenty minutes.",
  "\u{1F3B5} The printer makes a noise like a dial-up modem. Kind of a banger.",
  "\u{1F3C0} Knicks tickets are going for a lot this week.",
  "\u{1F634} Didn't sleep great, might nap in the car.",
  "\u{1F4F1} My phone's screen protector is peeling.",
  "\u{1F355} The pizza place on 9th closes at 10 now."
];

// ---- Byte Bodega supply run (Tasha's list) + temptations -------------------
export const SUPPLY_LIST = ["labels", "usbc", "cables", "esd", "zipties"];
export const SUPPLY = {
  labels:  { name: "Asset labels + custody logbook", icon: "\u{1F3F7}️", price: 24, code: "SUP-LBL" },
  usbc:    { name: "USB-C adapters (4-pack)", icon: "\u{1F50C}", price: 36, code: "SUP-USBC" },
  cables:  { name: "Cat6 patch cables (10-pack)", icon: "\u{1F9F5}", price: 28, code: "SUP-CAT6" },
  esd:     { name: "Anti-static bags (25)", icon: "\u{1F6CD}️", price: 12, code: "SUP-ESD" },
  zipties: { name: "Velcro cable ties", icon: "\u{1F517}", price: 6, code: "SUP-TIE" },
  energy:  { name: "Energy drink", icon: "\u{1F964}", price: 4, code: "PERSONAL-DRINK", personal: true },
  gum:     { name: "Mint gum", icon: "\u{1F36C}", price: 2, code: "PERSONAL-GUM", personal: true }
};

// ---- flavor: the vendor you escort + the recycler ---------------------------
export const VENDOR_LINES = [
  "Oh! Sorry. I was looking for the restroom. And the vending machine. And, uh, the view.",
  "I've been doing this twenty years, I know my way around a server closet.",
  "Is it cool if I take a picture of your rack for my portfolio? No? Okay."
];
