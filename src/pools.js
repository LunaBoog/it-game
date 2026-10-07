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

// =============================================================================
// v3 CAREER LADDER CONTENT · Week 2 (Network Technician) + Week 3 (Security
// Analyst). Same shapes as above; `d` is the career day (4-6, 7-9) and `w` the
// week. Every entry keeps EXACTLY ONE score-2 option.
// =============================================================================
ISSUES.push(
  // ===================== DAY 4 · network onboarding =====================
  { id: "n4_minisw", d: 4, tag: "\"Can I put a little switch under my desk?\"", cert: "Network+ N10-009 · 2.1 Switching / 4.3 Port security",
    lines: ["The intern sits with me now and there's only one jack.", "I saw a five-port switch at Byte Bodega for twenty bucks."],
    ask: "Can I just plug that in under my desk?",
    opts: [
      ["No unmanaged switches on the floor: they bypass port security and one stray cable can loop the whole VLAN. I'll ask Sam for a second drop; the intern can use Wi-Fi until then.", 2,
       "Sam adds a drop to Thursday's list. And you just prevented the exact loop the NOC would've spent tomorrow hunting."],
      ["Okay, but only a small one, and tell me if anything acts weird.", 1, "It works, until someone plugs both ends of a cable into it. Unmanaged switches are how loops happen."],
      ["Sure, and plug a second cable back into the wall for redundancy.", 0, "That's a switching loop. Broadcasts multiply until the whole floor drops."]
    ] },
  { id: "n4_byod", d: 4, tag: "Personal laptop on CORP Wi-Fi", cert: "Network+ N10-009 · 4.3 Network access control (802.1X)",
    lines: ["My personal laptop won't join CORP.", "It keeps asking for a certificate or something."],
    ask: "What's the Wi-Fi password? I just need my own laptop on the real network.",
    opts: [
      ["CORP uses 802.1X: only company devices with a certificate get on. Personal devices go on CORP-GUEST; here's how to get today's guest pass.", 2,
       "He's on guest in a minute. CORP stays company-devices-only, which is the whole point of network access control."],
      ["Read him the guest password without explaining anything.", 1, "He's online, but he'll keep trying CORP and filing tickets about it. Explain the why."],
      ["Let him sign in to CORP with your credentials just this once.", 0, "Now his personal laptop is on the corporate network as you. Never share credentials."]
    ] },
  { id: "n4_scope", d: 4, tag: "\"Is the network down?\"", cert: "Network+ N10-009 · 5.1 Troubleshooting methodology",
    lines: ["The payroll provider's site won't load.", "Is the network down? We pay people today."],
    ask: "Can you fix it, like, now?",
    opts: [
      ["Scope it first: do other sites load? Then look up the payroll site's name. It's the provider's outage (their status page says so), so we tell Accounting and watch for the all-clear.", 2,
       "Everything else loads, the provider posts an outage, and Frank stops panicking. Scope before you touch anything."],
      ["Reboot his PC and hope.", 1, "It won't help, and you'd still not know the cause."],
      ["Reboot the Floor 3 switch to be safe.", 0, "You just knocked forty people offline for a problem on someone else's website."]
    ] },
  { id: "n4_corner", d: 4, tag: "Slow Wi-Fi by the window", cert: "Network+ N10-009 · 2.3 Wireless (coverage)",
    lines: ["Wi-Fi is fine at my desk.", "But in the corner by the window it crawls."],
    ask: "Can you make it faster over there?",
    opts: [
      ["Check which AP and band she's on and the signal strength there, then log the spot for Wade's AP survey: it's probably a coverage gap the new APs will fix.", 2,
       "-78 dBm on 2.4 GHz from an AP two rooms away. Logged for the new AP plan. Good data beats a guess."],
      ["Tell her to sit closer to the AP.", 1, "True, but you didn't record anything, so nobody fixes it."],
      ["Reboot the core switch.", 0, "Everybody's Wi-Fi drops, and the corner's still slow."]
    ] },
  // ===================== DAY 5 · switch cutover (6) =====================
  { id: "n5_notone", d: 5, tag: "No dial tone after the swap", cert: "Network+ N10-009 · 2.1 VLANs / PoE",
    lines: ["My phone was fine at 7.", "Now it's just dark. No dial tone. Nothing."],
    ask: "Did you break my phone?",
    opts: [
      ["Check her patch against the port map: it went into an unlabeled port with no PoE or voice VLAN. Move it to her labeled port, wait for registration, and log it if it doesn't come back.", 2,
       "Wrong port. Re-patched to B-07, the phone powers, gets voice VLAN 120 and registers in thirty seconds."],
      ["Tell her to use her cell for the day.", 1, "She can, but her phone is still broken and nobody knows why."],
      ["Plug her cable into any free port that lights up.", 0, "Unknown port, unknown VLAN, undocumented. Tomorrow nobody can find her phone."]
    ] },
  { id: "n5_911", d: 5, tag: "\"Can we even call 911?\"", cert: "Network+ N10-009 · 3.x Voice services (E911)",
    lines: ["The phones are going down during the swap, right?", "What if someone collapses?"],
    ask: "Can we even call 911?",
    opts: [
      ["Yes. The notice asked for a charged cell phone at Reception for the window, and any cell can call 911. Phones are only down about fifteen minutes per closet. Let me check the cell is actually there.", 2,
       "The cell's in the drawer, charged. You tape a note to the desk. That's how you plan for the worst case."],
      ["Probably. Don't worry about it.", 1, "'Probably' isn't a plan for an emergency call."],
      ["Don't call 911 during the window, it'll mess up the change.", 0, "Absolutely not. Life safety beats every change window."]
    ] },
  { id: "n5_vpn", d: 5, tag: "VPN dropped mid-upload", cert: "Network+ N10-009 · 4.x Remote access",
    lines: ["I'm working from home today.", "The VPN dropped right in the middle of uploading the AR report."],
    ask: "Is it me?",
    opts: [
      ["It's the change window (it was in the notice). Save locally, reconnect in fifteen minutes; if it doesn't come back, I'll raise it on the bridge.", 2,
       "He reconnects at 8:50 and the upload finishes. Clear, honest, and he knew what to expect."],
      ["Keep retrying every minute until it works.", 1, "He'll get there, frustrated and confused."],
      ["Email the report to your personal Gmail so it's not lost.", 0, "Company financial data in a personal mailbox is a data-handling violation."]
    ] },
  { id: "n5_printer", d: 5, tag: "\"The printer says offline\"", cert: "Network+ N10-009 · 5.3 Network services",
    lines: ["The Accounting printer has said 'offline' since 7:40.", "Checks print today."],
    ask: "Can you fix it?",
    opts: [
      ["Printers kept static IPs from the old network. Check its port's VLAN against the port map, give it a DHCP reservation in the new scope, and log it on the known-issues board.", 2,
       "Its port landed in the right VLAN but its static IP was from the old range. Reservation set, checks print, and it's logged so every printer gets checked."],
      ["Reinstall the printer driver on Brenda's PC.", 1, "The driver's fine; the printer can't be reached."],
      ["Factory-reset the printer.", 0, "Now it's offline AND it forgot its trays, its scan-to-email and its admin password."]
    ] },
  { id: "n5_adminpw", d: 5, tag: "\"Can I have the switch password?\"", cert: "Security+ SY0-701 · 4.6 Privileged access",
    lines: ["Hiro said I could help with the cutover.", "I just need the admin password for the new switches."],
    ask: "You have it, right?",
    opts: [
      ["Admin credentials aren't shared. If Hiro wants him helping, Hiro grants it through the change account. Let me confirm with Hiro on the bridge.", 2,
       "Hiro: 'I said he could carry boxes.' Good catch."],
      ["Ask Rosa about it later.", 1, "Later is after the window. Verify now, on the bridge."],
      ["Read it to him. Hiro said it's fine.", 0, "'Somebody said it's fine' is how social engineering works. Never share admin creds."]
    ] },
  { id: "n5_twin", d: 5, tag: "\"CORP-Guest-5G-FREE?\"", cert: "Security+ SY0-701 · 2.4 Indicators (evil twin)",
    lines: ["My laptop is on something called CORP-Guest-5G-FREE.", "It asked me to sign in again. Is that the new Wi-Fi?"],
    ask: "Should I type my password in?",
    opts: [
      ["No. That's not ours (ours are CORP and CORP-GUEST). Disconnect, forget that network, and report it to Security: someone's imitating our Wi-Fi.", 2,
       "Security finds a little travel router in a bag in the lobby. Nobody typed a password into it today, thanks to you."],
      ["Ignore it, the internet works.", 1, "It works because someone else's router is in the middle of her traffic."],
      ["Sure, sign in, it's probably the new APs.", 0, "She just gave her password to whoever's running that fake network."]
    ] },
  // ===================== DAY 6 · verify & document (3) =====================
  { id: "n6_e911", d: 6, tag: "Old floor in the phone directory", cert: "Network+ N10-009 · Voice services (E911 location)",
    lines: ["The phones are great!", "But my extension still says 'Floor 2, East' in the directory, and we're on 3."],
    ask: "Can you just fix the text?",
    opts: [
      ["Log it for Voice/UC and check her phone's registered emergency location too: if 911 gets the wrong floor, responders go to the wrong place.", 2,
       "Voice/UC finds six phones with the old location. Fixed before anyone needed it."],
      ["Edit the directory entry yourself.", 1, "The name's right now, but the emergency location under it is still wrong."],
      ["It's just a label, ignore it.", 0, "That 'label' is what a 911 dispatcher sees."]
    ] },
  { id: "n6_10g", d: 6, tag: "\"Why not 10 gig?\"", cert: "Network+ N10-009 · 1.x Ethernet standards",
    lines: ["My friend has 10 gig at home.", "We just got new switches and I only get 1 gig?"],
    ask: "Can you bump me to 10?",
    opts: [
      ["1 Gbps to the desk is the standard; the uplinks are 10 Gbps. Let me check he's really getting a gig: if his dock shows 100 Mbps, that's a cable to replace.", 2,
       "His dock shows 100 Mbps. Bad patch cable. Swapped: 940 Mbps. He's thrilled, and it wasn't the port."],
      ["Promise him 10 gig next quarter.", 1, "That's a promise nobody signed up for."],
      ["Hard-set his port to 10G.", 0, "The access ports don't do 10G, and now his link is down."]
    ] },
  { id: "n6_label", d: 6, tag: "\"Can I peel this label off?\"", cert: "Network+ N10-009 · 3.x Documentation (labeling)",
    lines: ["Somebody stuck 'C-14' on my wall plate.", "It ruins the aesthetic."],
    ask: "Can I peel it off?",
    opts: [
      ["Please leave it: it maps the jack to the patch panel and the switch port, so when something breaks we fix it in minutes instead of tracing cables for an hour.", 2,
       "She leaves it. Sam would hug you if he were here."],
      ["Sure, it's written down somewhere.", 1, "Maybe. The label on the wall is the one that's always there."],
      ["Peel them all off, they're ugly.", 0, "Forty-eight labels, gone. The next outage just got very long."]
    ] },
  // ===================== DAY 7 · SOC onboarding (4) =====================
  { id: "s7_push", d: 7, always: true, tag: "\"I approved one to make them stop\"", cert: "Security+ SY0-701 · 2.4 Indicators (MFA fatigue)",
    lines: ["My phone buzzed with like five sign-in prompts at six this morning.", "I hit Approve on one just to make them stop. Is that bad?"],
    ask: "It's fine, right?",
    opts: [
      ["That approval may have let someone in. Report it to the SOC right now; they'll revoke his sessions and reset his password. Never approve a prompt you didn't start.", 2,
       "Sofia opens a case and starts pulling his sign-in logs. You'll hear about this one again."],
      ["Tell him not to do that again.", 1, "Good advice, but someone may be in his account RIGHT NOW. Report it."],
      ["If it stopped the prompts, problem solved.", 0, "It stopped because the attacker got in. That's MFA fatigue."]
    ] },
  { id: "s7_usb", d: 7, tag: "\"Q3 BONUSES\" USB stick", cert: "Security+ SY0-701 · 2.2 Threat vectors (removable media)",
    lines: ["Found this in the parking garage.", "It's labeled 'Q3 BONUSES'. I'm dying to know."],
    ask: "Can we just see what's on it?",
    opts: [
      ["Don't plug it in anywhere. Bag it and hand it to the SOC: they'll open it in an isolated sandbox.", 2,
       "Sofia's sandbox shows it drops a remote-access tool the second it's opened. Nobody's curiosity won today."],
      ["Throw it in the trash.", 1, "Safer than plugging it in, but the SOC wants to know someone's dropping these."],
      ["Plug it into a spare PC to find the owner.", 0, "That 'spare PC' is still on the network. Now so is the malware."]
    ] },
  { id: "s7_mailbox", d: 7, tag: "\"Your mailbox is full\"", cert: "Security+ SY0-701 · 2.2 Phishing",
    lines: ["I got an email from 'Microsoft 365' saying my mailbox is full.", "It says click here or lose my email in 24 hours."],
    ask: "Is it real?",
    opts: [
      ["Don't click it. Hover the link (it's not microsoft.com) and hit 'Report phishing' so the SOC can pull every copy from every mailbox.", 2,
       "Twelve people got the same email. The SOC purges all twelve. Her report did that."],
      ["Just delete it.", 1, "She's safe, but the other eleven copies are still sitting in inboxes."],
      ["Click it to see if it's real.", 0, "That's how a credential-harvesting page gets a password."]
    ] },
  { id: "s7_travel", d: 7, tag: "\"I'm in Lisbon next week\"", cert: "Security+ SY0-701 · 4.6 Identity (risk-based sign-in)",
    lines: ["I'm at a conference in Lisbon next week.", "Last time my login got blocked from abroad."],
    ask: "Can you make sure that doesn't happen?",
    opts: [
      ["Tell the service desk ahead of time so the SOC has context for the 'new country' alert, use the VPN, and keep company MFA on. Don't use hotel Wi-Fi without the VPN.", 2,
       "Logged with his travel dates. When the alert fires, the analyst knows it's him in two seconds."],
      ["Just log in and we'll see what happens.", 1, "Then it's a 2 AM alert and a locked account in Lisbon."],
      ["Have a coworker check his email for him with his password.", 0, "Shared credentials make every log line a lie."]
    ] },
  // ===================== DAY 8 · incident day (6) =====================
  { id: "s8_fan", d: 8, tag: "\"My PC is screaming\"", cert: "Security+ SY0-701 · 4.8 Incident response (preserve evidence)",
    lines: ["My PC has been super slow since this morning.", "The fan sounds like a jet engine."],
    ask: "Should I just reboot it?",
    opts: [
      ["Don't reboot or log off. Step away from it; I'm getting the SOC to look at it through EDR right now, because today it might be part of the incident.", 2,
       "EDR shows a miner and a beacon. Because it wasn't rebooted, the memory evidence is still there."],
      ["Run a disk cleanup.", 1, "Cleanup won't hurt much, but it changes the machine while the SOC still needs to look."],
      ["Reboot and reinstall Chrome.", 0, "You just wiped the running processes the SOC needed to see."]
    ] },
  { id: "s8_wipe", d: 8, tag: "\"Just wipe everything!\"", cert: "Security+ SY0-701 · 4.8 IR (scope before eradication)",
    lines: ["I heard Accounting got hacked.", "Just wipe every laptop on the floor and be done with it!"],
    ask: "Why haven't you wiped them yet?",
    opts: [
      ["Because we scope first: find exactly which machines and accounts are involved, contain those, and keep the evidence. Wiping everything now destroys the evidence and can miss whatever let them in.", 2,
       "Frank grumbles, but he gets it when you mention the cyber insurance needs the evidence."],
      ["Okay, just Luis's then.", 1, "Maybe later. Today his laptop is evidence."],
      ["You're right, wipe them all now.", 0, "Evidence gone, persistence missed, and twelve people can't work."]
    ] },
  { id: "s8_social", d: 8, tag: "\"Should I post about it?\"", cert: "Security+ SY0-701 · 4.8 IR (communication plan)",
    lines: ["People on social are asking if we got hacked.", "Marketing wants to get ahead of it."],
    ask: "Should I post something?",
    opts: [
      ["No. External communication goes through Legal and Comms per the incident response plan. Point people to the official statement when there is one.", 2,
       "Legal thanks you twice. Once for not posting, once for writing down who asked."],
      ["Post 'we're looking into it'.", 1, "Even that confirms an incident before Legal decides what to say."],
      ["Post the details to be transparent.", 0, "Now the attacker knows exactly what we've found."]
    ] },
  { id: "s8_status", d: 8, tag: "\"Is payroll going to be late?\"", cert: "Security+ SY0-701 · 4.8 IR (stakeholder updates)",
    lines: ["Is my data safe?", "Is payroll going to be late this week?"],
    ask: "Just tell me straight.",
    opts: [
      ["Tell her what's confirmed and what isn't, that the response team is on it, and when the next update is coming. No guessing.", 2,
       "She doesn't love the uncertainty, but she trusts the 2 PM update. Facts, not vibes."],
      ["Say everything's fine.", 1, "If it turns out it isn't, she'll never believe an update again."],
      ["Tell her the attacker probably took everything.", 0, "That's a guess, and now it's a rumor on three floors."]
    ] },
  { id: "s8_reset", d: 8, tag: "\"Should I change my password?\"", cert: "Security+ SY0-701 · 4.6 Identity / 2.2 Phishing",
    lines: ["I got an email saying reset your password because of the incident.", "There's a link."],
    ask: "Should I click it?",
    opts: [
      ["Don't use the link. If we need you to reset, we'll tell you directly; go to the password portal by typing its address yourself. Forward that email to the SOC.", 2,
       "That email wasn't from us. The SOC blocks the domain within minutes."],
      ["Change every password you have, everywhere.", 1, "Not wrong, but it misses the real danger: that link."],
      ["Reply with your password so we can check it.", 0, "Nobody in IT ever needs your password."]
    ] },
  { id: "s8_unplug", d: 8, tag: "\"Should I pull the plug?\"", cert: "Security+ SY0-701 · 4.8 IR (order of volatility)",
    lines: ["On TV they always yank the power cord.", "Should I unplug mine?"],
    ask: "Power, network, or both?",
    opts: [
      ["Neither, unless the SOC asks. We isolate machines remotely through EDR; pulling power wipes memory evidence. If something looks odd, call us.", 2,
       "Oskar's machine is clean. And the next person who asks, he answers for you."],
      ["Unplug the network cable only.", 1, "It contains, but it's clumsy and the SOC loses visibility. EDR isolation keeps both."],
      ["Pull the power plug right now.", 0, "Whatever was in memory is gone for good."]
    ] },
  // ===================== DAY 9 · recover & lessons (3) =====================
  { id: "s9_push", d: 9, tag: "\"Number matching is annoying\"", cert: "Security+ SY0-701 · 4.6 MFA (number matching)",
    lines: ["I'm back in, thanks!", "But now I have to type a number from my screen into the app. Can I go back to just tapping Approve?"],
    ask: "Please?",
    opts: [
      ["Number matching is exactly what stops push-bombing: you can't approve a sign-in you didn't start. It stays. Here, it takes two seconds.", 2,
       "Luis times it. 2.4 seconds. He's fine with it."],
      ["Okay, for a week.", 1, "A week is plenty of time to get push-bombed again."],
      ["Turn MFA off for him.", 0, "He was the way in. Now he's an open door."]
    ] },
  { id: "s9_training", d: 9, tag: "\"Do I have to do the phishing training?\"", cert: "Security+ SY0-701 · 5.6 Security awareness",
    lines: ["I got assigned phishing training.", "I didn't even click anything!"],
    ask: "Do I really have to?",
    opts: [
      ["Yes, it's short, and it's built from this week's real attack, not a punishment. It's how the next one gets reported in a minute instead of an hour.", 2,
       "She finishes it at lunch and reports a test phish that afternoon."],
      ["You can skip it, you didn't click.", 1, "Then the people who need it most see you skip it."],
      ["Click the test phishes on purpose to finish faster.", 0, "That's... not how any of this works."]
    ] },
  { id: "s9_counsel", d: 9, tag: "Legal wants the paperwork", cert: "Security+ SY0-701 · 4.8 IR (documentation, legal hold)",
    lines: ["Outside counsel is asking for the timeline and the evidence chain.", "Do we even have that?"],
    ask: "What can you send?",
    opts: [
      ["Yes: the incident report with the timeline, and the evidence log with hashes and custody signatures, shared through the approved channel.", 2,
       "Dolores: 'This is the most organized incident I've seen.' High praise from Legal."],
      ["I'll email the disk image.", 1, "Wrong channel and it breaks the chain of custody. Use the process."],
      ["We just fixed it, there's no paperwork.", 0, "Then nobody can prove what happened, to anyone."]
    ] }
);

PAGES.push(
  // ---- Day 4 ----
  { id: "pg4_mac", d: 4, who: "Benny", ask: "A user wants to know the difference between an IP address and a MAC address. Want to take it?",
    opts: [
      ["IP is the logical address the network assigns (layer 3, it changes when you move networks); MAC is the hardware address burned into the network card, used on the local segment (layer 2).", 2, "\"Perfect. I'm stealing that for the FAQ.\""],
      ["They're basically the same thing.", 1, "\"They really aren't.\""],
      ["MAC addresses are for Apple computers.", 0, "\"Oh no.\""]
    ] },
  { id: "pg4_reserve", d: 4, who: "Rosa", ask: "Accounting wants their new label printer on 'a static IP from the DHCP range.' Your call?",
    opts: [
      ["Give it a DHCP reservation (or a static outside the pool) and record it in IPAM.", 2, "\"Correct. No surprises in the pool, and IPAM knows where it lives.\""],
      ["Let them type in any free-looking address.", 1, "\"'Free-looking' is how two devices end up fighting over one IP.\""],
      ["Static address inside the DHCP pool, no record.", 0, "\"That's a guaranteed IP conflict next week.\""]
    ] },
  // ---- Day 5 ----
  { id: "pg5_go_ed", d: 5, who: "Karen", go: true, where: "in Accounting",
    ask: "Frank in Accounting says his PC shows 'Unidentified network' since the swap. He's at the Accounting desks. Can you go?",
    spawn: { map: "floor3", spot: { x: 22, y: 18 }, persona: 5, issue: {
      id: "g_unident", tag: "\"Unidentified network\"", cert: "Network+ N10-009 · 5.2 Wired troubleshooting",
      lines: ["It says 'Unidentified network, no internet.'", "Everybody else is fine. What did you DO?"],
      ask: "Can you fix it before my 10:30?",
      opts: [
        ["Check the link light and his patch against the port map: it's in the wrong port (old data VLAN). Re-patch to his labeled port, then release/renew.", 2, "Wrong port, wrong VLAN. Re-patched, new address in five seconds, and he makes his 10:30."],
        ["Reboot his PC.", 1, "He comes back to the same unidentified network. The cable's in the wrong port."],
        ["Give him a static IP.", 0, "Now he's a manual exception on the new network forever."]
      ] } } },
  { id: "pg5_backout", d: 5, who: "Hiro", ask: "The Accounting closet's new uplink won't come up and we're past the go/no-go time for that closet. What do we do?",
    opts: [
      ["Execute the backout for that closet per the plan (re-patch to the old switch), then troubleshoot the uplink outside the window.", 2, "\"Rolling back Accounting. Users are back in four minutes. That's why we kept the old switch racked.\""],
      ["Keep trying until it works.", 1, "\"And Accounting stays dark past the window we promised them.\""],
      ["Leave it down until tomorrow.", 0, "\"Payroll runs today. No.\""]
    ] },
  { id: "pg5_storm", d: 5, who: "Abby", ask: "NOC sees a broadcast spike on VLAN 30. What should have caught a loop on an access port?",
    opts: [
      ["Spanning tree with BPDU guard on access ports, plus storm control: the port shuts down the moment someone loops it.", 2, "\"Yep. Hiro's adding BPDU guard to the template right now.\""],
      ["Reboot the switch when it happens.", 1, "\"That clears it for five minutes, until the loop starts again.\""],
      ["Turn off spanning tree so the ports come up faster.", 0, "\"That's how you get the loop in the first place.\""]
    ] },
  { id: "pg5_dns", d: 5, who: "Benny", ask: "Users say the new wiki name doesn't work, but its IP address does. What's missing?",
    opts: [
      ["A DNS record: add the A record (and the PTR) for the new host.", 2, "\"Added. Name works. Benny's telling everyone you're a wizard.\""],
      ["Tell users to bookmark the IP.", 1, "\"Until the IP changes.\""],
      ["Edit everyone's hosts file.", 0, "\"Forty hosts files that nobody remembers. No.\""]
    ] },
  // ---- Day 6 ----
  { id: "pg6_record", d: 6, who: "Rosa", ask: "Hiro asks what goes in the change record now that we're done. What do you tell him?",
    opts: [
      ["What changed (devices, ports, VLANs), the test results, the issues and where they're routed, and links to the updated diagram and IPAM.", 2, "\"That's a change record someone can actually use in six months.\""],
      ["Just 'Done. Worked.'", 1, "\"Future-us will hate present-us.\""],
      ["The admin passwords, for reference.", 0, "\"Never in a ticket. Ever.\""]
    ] },
  { id: "pg6_monitor", d: 6, who: "Abby", ask: "The old switches still show red on my dashboard. Can I just mute them?",
    opts: [
      ["Remove the decommissioned switches from monitoring properly (and from IPAM and DNS), instead of muting them.", 2, "\"Gone. My dashboard is green and honest.\""],
      ["Mute them for a week.", 1, "\"And in a week they're red again and nobody remembers why.\""],
      ["Ignore everything red on that dashboard.", 0, "\"Including the next real outage.\""]
    ] },
  // ---- Day 7 ----
  { id: "pg7_wes", d: 7, who: "Sofia", ask: "Alert: 'Admin sign-in from a new country' for Wes. He's red team and says he's testing from a cloud VM. Close it?",
    opts: [
      ["Verify it against the signed test authorization (scope and window), then close it as expected activity with notes, and tune the rule for approved test infrastructure.", 2, "\"Authorization checks out. Closed with notes. Nadia's tuning the rule.\""],
      ["Close it, Wes is always doing weird stuff.", 1, "\"That's exactly what an attacker using Wes's account would count on.\""],
      ["Disable Wes's account and page the CEO.", 0, "\"Wes is mid-engagement and the CEO is confused. Verify first.\""]
    ] },
  { id: "pg7_kev", d: 7, who: "Nadia", ask: "Quick one: besides the CVSS score, what makes a vulnerability urgent?",
    opts: [
      ["Whether it's being exploited in the wild (CISA's KEV list), whether the vulnerable system is exposed or critical, and whether a fix exists.", 2, "\"Exactly. A 7.5 on the internet beats a 9.8 in a closet.\""],
      ["Just the CVSS score.", 1, "\"CVSS is severity, not risk. Context matters.\""],
      ["Patch them alphabetically.", 0, "\"I'm going to pretend you didn't say that.\""]
    ] },
  // ---- Day 8 ----
  { id: "pg8_go_gabe", d: 8, who: "Karen", go: true, where: "at Reception",
    ask: "Gabe at Reception got a call from 'IT' telling him to install a remote-support app. He's at the front desk. Can you go?",
    spawn: { map: "floor3", spot: { x: 16, y: 5 }, persona: 7, issue: {
      id: "g_remote", tag: "\"IT told me to install this\"", cert: "Security+ SY0-701 · 2.2 Social engineering (vishing)",
      lines: ["Somebody from IT called and said my PC was part of the incident.", "He wants me to install a remote-support app so he can 'clean it'."],
      ask: "You're IT. Was that you?",
      opts: [
        ["That wasn't us. Don't install anything. I'll check whether anything got installed, and report the caller's number to the SOC: someone's using our incident as a lure.", 2, "Nothing installed. The SOC blocks the tool's download domain and warns the floor."],
        ["Tell him to install it but watch what they do.", 0, "Now an attacker has remote control of a Reception PC."],
        ["Tell him to ignore the call.", 1, "He's safe, but the SOC never hears that attackers are calling the floor."]
      ] } } },
  { id: "pg8_legal", d: 8, who: "Omar", ask: "Legal wants to look at Luis's disk image right now. What do we give them?",
    opts: [
      ["A verified working copy through the evidence process (hash matches, custody logged). The original stays sealed in the locker.", 2, "\"Copy's hash matches the original. Legal has what they need and the evidence stays clean.\""],
      ["Tell them to wait until the incident is over.", 1, "\"They have notification deadlines. Give them a verified copy.\""],
      ["Hand them the original drive.", 0, "\"The original never leaves the locker. That's the whole chain of custody.\""]
    ] },
  { id: "pg8_payroll", d: 8, who: "Frank", ask: "Payroll runs at 3 PM. Can Luis use his laptop to approve it?",
    opts: [
      ["Not the isolated one. The backup approver runs payroll today, or Luis uses a clean loaner once IR has reset his identity.", 2, "\"Backup approver it is. Payroll goes out on time.\""],
      ["Yes, if he's careful.", 1, "\"Careful doesn't help on a compromised machine.\""],
      ["Remove the isolation so he can run payroll.", 0, "\"And let the attacker back onto the network. Absolutely not.\""]
    ] },
  { id: "pg8_board", d: 8, who: "Director Chen", ask: "The board is asking: did they get in? I need two sentences.",
    opts: [
      ["One account was compromised through MFA fatigue and the affected machines were isolated within the hour. Scope is still being confirmed; next update at 2 PM.", 2, "\"That I can send. Thank you.\""],
      ["No comment yet.", 1, "\"The board doesn't accept 'no comment' from its own IT department.\""],
      ["It's nothing, don't worry about it.", 0, "\"If it turns out to be something, I'm the one who said it was nothing.\""]
    ] },
  // ---- Day 9 ----
  { id: "pg9_close", d: 9, who: "Omar", ask: "Can we close the incident?",
    opts: [
      ["When eradication and recovery are verified, monitoring shows no sign of them for the agreed period, and the report and lessons-learned meeting are done.", 2, "\"Right. We close it at 5 PM, after the review.\""],
      ["Yes, it's been quiet for an hour.", 1, "\"An hour of quiet is how attackers like it.\""],
      ["Close it and delete the logs to save space.", 0, "\"We are keeping every log. Legal hold.\""]
    ] },
  { id: "pg9_retain", d: 9, who: "Nadia", ask: "How long do we keep the incident evidence?",
    opts: [
      ["Per the retention policy and any legal hold: nothing gets destroyed until Legal releases it.", 2, "\"Correct. It's already tagged for legal hold.\""],
      ["Thirty days, then delete.", 1, "\"Not if Legal has a hold on it.\""],
      ["Delete it today, the incident's over.", 0, "\"Not even close.\""]
    ] }
);

// Known issues: logged on each week's clock day, routed on the last day.
for (const k of KNOWN_ISSUES) k.w = 1;
export const RESOLVER_BY_WEEK = {
  1: RESOLVER_GROUPS,
  2: ["Network", "Voice/UC", "Desktop", "Facilities", "Security"],
  3: ["Identity", "Email/M365", "Desktop", "Network", "Legal", "Awareness"]
};
KNOWN_ISSUES.push(
  { id: "ki2_e911", w: 2, area: "Reception", who: "Wendy", report: "My phone still says I'm on Floor 2 East.", log: "Phones moved floors: emergency (E911) location not updated", group: "Voice/UC",
    why: "Phone directory entries and emergency locations live in the voice platform: Voice/UC." },
  { id: "ki2_ap", w: 2, area: "Conf. room", who: "Harold", report: "The new AP is hanging from the ceiling grid by one clip.", log: "Conf-room AP mount loose (ceiling grid)", group: "Facilities",
    why: "Ceiling grid, mounts and tiles are Facilities' work; Network re-tests the AP afterward." },
  { id: "ki2_trunk", w: 2, area: "Print room", who: "Dana", report: "The print-room printers can't reach the print server.", log: "Printer VLAN missing from the Floor 3 uplink's allowed list", group: "Network",
    why: "Which VLANs a trunk carries is switch configuration: Network." },
  { id: "ki2_dock", w: 2, area: "Accounting", who: "Oskar", report: "My dock keeps dropping to 100 megabit since this morning.", log: "Dock NIC renegotiates to 100 Mbps (driver)", group: "Desktop",
    why: "Port and cable test clean; a dock NIC driver is an endpoint fix: Desktop." },
  { id: "ki2_labels", w: 2, area: "Floor 3 closet", who: "Sam", report: "Three patch cables went in unlabeled during the rush.", log: "3 unlabeled patch cables in the Floor 3 closet", group: "Network",
    why: "Patch cables and the port map are Network's documentation to fix." },
  { id: "ki2_router", w: 2, area: "Open desks", who: "Tom", report: "Someone plugged a home Wi-Fi router in at a desk to 'boost the signal'.", log: "Personal Wi-Fi router plugged in on Floor 3 (rogue AP)", group: "Security",
    why: "An unauthorized access point on the corporate network is a security incident first: Security." },
  { id: "ki3_mfa", w: 3, area: "Accounting", who: "Luis", report: "My MFA still lets me just tap Approve.", log: "Push-approve MFA still allowed for Accounting (no number matching)", group: "Identity",
    why: "MFA methods and sign-in policy belong to the Identity team." },
  { id: "ki3_forward", w: 3, area: "Tenant-wide", who: "Sofia", report: "Anyone can auto-forward mail outside the company.", log: "External auto-forwarding allowed tenant-wide", group: "Email/M365",
    why: "Mail-flow rules and outbound forwarding are an Exchange/M365 setting." },
  { id: "ki3_edr", w: 3, area: "Accounting", who: "Nadia", report: "Three Accounting laptops never got the EDR agent.", log: "EDR agent missing on 3 Accounting laptops", group: "Desktop",
    why: "Agent deployment on endpoints is Desktop's lane (the SOC verifies the coverage after)." },
  { id: "ki3_egress", w: 3, area: "Payroll subnet", who: "Tomas", report: "The payroll subnet can reach any internet host on any port.", log: "No egress filtering on the payroll subnet", group: "Network",
    why: "Firewall egress rules for a subnet are Network's change to make." },
  { id: "ki3_notify", w: 3, area: "Payroll data", who: "Omar", report: "The attacker may have viewed payroll records.", log: "Possible exposure of payroll records: notification decision", group: "Legal",
    why: "Whether and whom to notify is a legal determination: Legal (with the IR facts)." },
  { id: "ki3_clicks", w: 3, area: "Floor 3", who: "Sofia", report: "Three people clicked the same phishing link this month.", log: "Repeat phishing clicks in one department", group: "Awareness",
    why: "Targeted training for the people and teams involved: the security awareness program." }
);

// Social engineers by week (Week 1's keep w: 1).
for (const s of SOCENG) s.w = 1;
SOCENG.push(
  { id: "se2_tac", w: 2, map: "any", phone: true, name: "Unknown caller", sub: "+1 (888) 555-0142 · 'switch vendor support'",
    lines: ["Hi, this is your switch vendor's support center.", "We detected a firmware bug on your new core switch. I can push a hotfix right now if you read me the enable password."],
    ask: "We're on a clock here, what's the password?",
    opts: [
      ["Hang up. Vendors don't cold-call for passwords. If it might be real, open a case through the vendor portal or the number in our contract, and tell Hiro and Security.", 2,
       "There's no case and no bug. Security adds the number to the block list. Same caller hit two other companies this month."],
      ["Ask for a case number first.", 1, "He'll invent one. Call the vendor back on a number you already trust."],
      ["Read him the password. He knew we have new switches.", 0, "Everyone who walked past the loading dock knew. You just gave a stranger the keys to the core."]
    ] },
  { id: "se2_cable", w: 2, map: "floor3", name: "\"Kevin\"", sub: "cabling-company polo · no badge · at Reception",
    lines: ["(At Reception.) 'Hey, Kevin, from the cabling crew. Sam sent me to finish the closet.'", "'I just need someone to let me into the server room. Quick job.'"],
    ask: "He turns to you: 'You're with network, right? Let me in?'",
    opts: [
      ["Not without checking: call Sam on the number you already have, and check the work order. Until it checks out he waits at Reception with a visitor badge, escorted.", 2,
       "Sam has never heard of Kevin. Kevin remembers an appointment somewhere else. Lou has his picture now."],
      ["Ask to see a work order.", 1, "Paper is easy to fake. Verify with the person who supposedly sent him."],
      ["Let him in, he's wearing the polo.", 0, "A polo shirt is a twenty-dollar costume. That's a stranger alone with your network."]
    ] },
  { id: "se3_luis", w: 3, map: "any", phone: true, name: "Caller: \"Luis from payroll\"", sub: "internal line? no: +1 (646) 555-0131",
    lines: ["Hey, it's Luis from payroll. I lost my phone on the subway.", "Can you reset my MFA and give me a temporary password? Payroll's due."],
    ask: "Come on, you know me. Please?",
    opts: [
      ["Don't reset anything on this call. Verify identity the documented way (callback to the number on file, or his manager in person), and tell the SOC: Luis is today's compromised account, so this is likely the attacker.", 2,
       "The number on file reaches the real Luis, who is sitting in Accounting with his phone. The SOC adds the caller to the case."],
      ["Ask him a security question from his profile.", 1, "Better than nothing, but those answers are often public or already stolen. Callback to a known number."],
      ["Reset it. Payroll is due and he sounds stressed.", 0, "You just handed the attacker a fresh password and a new MFA device for the account you're investigating."]
    ] },
  { id: "se3_legal", w: 3, map: "floor7", name: "\"Mr. Pratt, Legal\"", sub: "visitor sticker · at the SOC door",
    lines: ["(At the SOC door.) 'Pratt, from Legal. I need the forensic image of the payroll laptop.'", "'I'll review it at home tonight. Just put it on this USB drive.'"],
    ask: "He holds out a thumb drive: 'Quickly, please.'",
    opts: [
      ["No. Evidence only moves through the evidence process: verified copies, hashes, custody signatures. Confirm who he is with Legal directly, and tell Omar.", 2,
       "Legal has no Mr. Pratt. The visitor sticker came from the lobby, and Lou is already on his way up."],
      ["Ask to see his company badge.", 1, "A good start. But even a real lawyer doesn't get evidence on a thumb drive."],
      ["Copy it onto his USB. He's from Legal.", 0, "Evidence on a stranger's thumb drive, out the door, with no custody record."]
    ] }
);

// Clock-day hotspots: something breaks somewhere and you go fix it.
// at: { map, id } is the entity you interact with while it's live.
export const HOTSPOTS = [
  { id: "loop", d: 5, at: { map: "floor3", id: "hs-loop" }, who: "Abby", where: "Open desks 2, Floor 3",
    alert: "Broadcast storm on VLAN 30! Every port on the Floor 3 data switch is lit up. Something on Floor 3 is looping.",
    title: "A switching loop", sprite: null,
    lines: ["Under a desk in Open desks 2: a five-port switch from Byte Bodega.", "One patch cable runs from it into wall jack O-03... and a second cable runs from it into O-04."],
    ask: "Broadcasts are multiplying every second. What do you do?",
    opts: [
      ["Pull one of the two cables now to break the loop, remove the unmanaged switch, and tell the bridge so Hiro enables BPDU guard and storm control on the access ports.", 2,
       "The storm stops the instant the cable comes out. Hiro pushes BPDU guard to every access port. It can't happen twice."],
      ["Reboot the Floor 3 switch.", 1, "The storm stops for ninety seconds, then starts again. The loop is still plugged in."],
      ["Plug a third cable in for more bandwidth.", 0, "Now it's a bigger loop. The whole floor drops."]
    ] },
  { id: "ap", d: 5, at: { map: "floor3", id: "hs-ap" }, who: "Wade", where: "the conference room, Floor 3",
    alert: "The new conference-room AP never came up after the swap. Harold's 10 AM is in that room.",
    title: "A dark access point",
    lines: ["The AP's status light is off.", "The switch says: 'Gi1/0/40: power denied, device requires 25.5 W (802.3at), port configured for 802.3af.'"],
    ask: "What's the fix?",
    opts: [
      ["The port is limited to 802.3af (15.4 W). Set it to PoE+ (802.3at) per the AP's datasheet, confirm the switch's budget has room, and watch it boot.", 2,
       "Thirty seconds later the light goes blue and the AP joins the controller. Harold's meeting has Wi-Fi."],
      ["Plug the AP into a power brick on the ceiling.", 1, "It might work, but now there's a power brick in the ceiling no one knows about."],
      ["Swap the AP for a new one.", 0, "The AP was fine. The new one does exactly the same thing."]
    ] },
  { id: "printer", d: 5, at: { map: "floor3", id: "hs-printer" }, who: "Dana", where: "the print room, Floor 3",
    alert: "The print-room printers just went dark on the network. Dana has payroll stubs to print.",
    title: "Printers can't reach the print server",
    lines: ["The printers have link and their usual addresses.", "But they can't ping the print server. On the new uplink: 'switchport trunk allowed vlan 30,120'. The printers live on VLAN 40."],
    ask: "What do you tell the bridge?",
    opts: [
      ["VLAN 40 isn't allowed on the new uplink trunk. Ask Hiro to add it to the allowed list (a planned, logged change on the bridge), then test a print.", 2,
       "Hiro adds VLAN 40 to the trunk. The first payroll stub prints before you're back at the door."],
      ["Move the printers onto VLAN 30 with everyone else.", 1, "It'd work, and undo the separation the printer VLAN was there for."],
      ["Reboot every printer.", 0, "They come back exactly as stuck. The trunk is still missing their VLAN."]
    ] },
  { id: "beacon", d: 8, at: { map: "floor3", id: "tag-a3" }, who: "Nadia", where: "Brenda's PC, Accounting",
    alert: "A second host is beaconing to the attacker's server: Brenda's PC in Accounting. Same domain, every 60 seconds.",
    title: "A second infected host",
    lines: ["EDR on Brenda's PC: a scheduled task runs a PowerShell one-liner every minute.", "It calls out to the same domain we saw from Luis's laptop."],
    ask: "What do you do?",
    opts: [
      ["Isolate it with EDR (network-contained but still powered on), capture memory, add the host and the task to the case as IOCs, and tell Brenda to use a loaner.", 2,
       "Contained in under a minute, memory captured, and Nadia's hunt finds no third host. Containment without losing evidence."],
      ["Power it off right away.", 1, "Contained, but the memory evidence (and maybe the keys to what it did) is gone."],
      ["Delete the scheduled task and let her keep working.", 0, "You tipped off the attacker and left the machine on the network."]
    ] },
  { id: "purge", d: 8, at: { map: "floor7", id: "socpc" }, who: "Sofia", where: "your SOC workstation",
    alert: "Three users just reported the same 'payroll update' email. It's from the attacker, sent from Luis's account.",
    title: "Internal phishing from a compromised account",
    lines: ["The email went to 41 people from Luis's real mailbox.", "Two have clicked so far."],
    ask: "What's your next move?",
    opts: [
      ["Search and purge every copy from every mailbox, block the link's domain, and pull the click list so those two users get their sessions revoked and passwords reset.", 2,
       "41 copies purged in a minute. The two clickers are reset before the attacker can use them."],
      ["Email everyone telling them not to click.", 1, "Some will read it after they've clicked. Purge first, warn second."],
      ["Wait for more reports to see how big it is.", 0, "Every minute you wait is another click."]
    ] },
  { id: "spray", d: 8, at: { map: "floor7", id: "tomas" }, who: "Tomas", where: "the network closet, Floor 7",
    alert: "Password spraying against the VPN from an internal address on the Accounting subnet. Tomas wants a call.",
    title: "Password spraying in progress",
    lines: ["'Two hundred accounts, one password each: Spring2026!. From an internal address.'", "'Three accounts succeeded before lockout kicked in.'"],
    ask: "What do we do first?",
    opts: [
      ["Block the source at the firewall, force resets and revoke sessions for the three accounts that succeeded, and check what they touched. Then ban that password pattern.", 2,
       "The three accounts are locked down within five minutes, and their sign-ins show nothing touched. The banned-password list gets 'Spring2026!' and its cousins."],
      ["Lock every account in the company.", 1, "It stops the spray, and also the whole company."],
      ["It's just failed logins, ignore it.", 0, "Three of them weren't failures."]
    ] }
];

// Clock-day scripts for Day 5 (Hiro's switch cutover) and Day 8 (Omar's incident).
export const CLOCK_DAYS = {
  5: { lead: "Hiro", map: "floor3",
       open: "Bridge is live. Window is OPEN: 6:00 to 9:00. Network owns the change; tell me before you touch anything.",
       last: "Last closet cutting over: Accounting. Keep the users calm.",
       final: "All closets cut over. Final verification sweep. Anything weird goes on the known-issues board NOW.",
       close: "Window CLOSED. Switch cutover successful. Verification and docs tomorrow.",
       closeNote: "Change window closed: Floor 3 switch cutover successful." },
  8: { lead: "Omar", map: "floor7",
       open: "Incident bridge is live. Severity HIGH. I'm incident commander. Contain first; everything goes in the case log.",
       last: "Containment holding. Nadia is still hunting. Keep feeding the case log.",
       final: "No new activity for 30 minutes. We move to eradication planning. Log every open item NOW.",
       close: "Incident CONTAINED. Bridge closing. Eradication and recovery tomorrow.",
       closeNote: "Incident contained; bridge closed. Eradication and recovery tomorrow." }
};

export const BRIDGE_BY_DAY = {
  5: [
    { t: "Hiro: Config backups confirmed on the config server. Go/no-go: Network GO, Voice GO, Help Desk GO.", lingo: "gonogo" },
    { t: "Hiro: Reception closet cutting over. Phones down about fifteen minutes.", lingo: "vlan" },
    { t: "Hiro: Uplink to the core is up: 10 gig, trunk carrying 30 and 120.", lingo: "trunk" },
    { t: "Hiro: Phones registering on the voice VLAN. LLDP-MED handing out VLAN 120.", lingo: "lldp" },
    { t: "Hiro: PoE budget at 41% on stack 1. Plenty of headroom.", lingo: "poe" },
    { t: "Hiro: DHCP leases flowing in the new scope. Old scope set to expire.", lingo: "dhcp" },
    { t: "Hiro: Spanning tree stable. Root bridge is the core, as designed.", lingo: "stp" },
    { t: "Hiro: Accounting closet is GO. Old switches stay racked as the backout until sign-off.", lingo: "backout" }
  ],
  8: [
    { t: "Omar: Timeline so far: 06:02 push-bomb, 06:09 approval, 06:11 sign-in from a hosting provider.", lingo: "ioc" },
    { t: "Omar: Luis's sessions revoked and password reset. Containment step one.", lingo: "contain" },
    { t: "Omar: EDR isolating the payroll laptop. Memory capture in progress.", lingo: "edr" },
    { t: "Omar: Nadia's hunting in the SIEM for the attacker's IP across every log source.", lingo: "siem" },
    { t: "Omar: Mailbox rule found: forward everything with 'invoice' to an outside address. Preserved, not deleted yet.", lingo: "volatility" },
    { t: "Omar: Legal and Comms are on the bridge. All outside communication goes through them.", lingo: "irplan" },
    { t: "Omar: No lateral movement beyond Accounting so far. Scope is holding.", lingo: "scope" },
    { t: "Omar: Containment holding. Eradication planning starts at 4.", lingo: "eradicate" }
  ]
};

Object.assign(LINGO, {
  vlan:      { term: "VLAN", def: "A virtual LAN: one physical switch split into separate broadcast domains (data, voice, printers, guests)." },
  trunk:     { term: "Trunk (802.1Q)", def: "A link that carries many VLANs at once, each frame tagged with its VLAN ID. The allowed list decides which VLANs may cross." },
  lldp:      { term: "LLDP-MED / CDP", def: "Discovery protocols a switch uses to tell an IP phone which voice VLAN to use (and how much power it'll get)." },
  poe:       { term: "PoE / PoE+", def: "Power over Ethernet. 802.3af: up to 15.4 W per port; 802.3at (PoE+): 30 W; 802.3bt: 60–90 W. The switch has a total budget." },
  dhcp:      { term: "DHCP (DORA)", def: "Discover, Offer, Request, Acknowledge: how a device gets its IP, mask, gateway and DNS from a server." },
  apipa:     { term: "APIPA (169.254.x.x)", def: "The address Windows gives itself when no DHCP server answers. It means 'I never got an address'." },
  cidr:      { term: "CIDR / subnet", def: "/24 = 256 addresses (254 usable hosts), /25 = 126 hosts, /26 = 62 hosts. Each bit you add halves the subnet." },
  gateway:   { term: "Default gateway", def: "The router address a device sends everything to that isn't on its own subnet." },
  duplex:    { term: "Duplex mismatch", def: "One end full duplex, the other half. Shows as CRC errors on one side and late collisions on the other." },
  stp:       { term: "Spanning tree (STP)", def: "Blocks redundant switch paths so frames can't loop forever. BPDU guard shuts an access port the moment someone plugs a switch loop into it." },
  mdfidf:    { term: "MDF / IDF", def: "Main distribution frame (the core of the building's network) and intermediate distribution frames (the closets on each floor)." },
  ipam:      { term: "IPAM", def: "IP address management: the source of truth for every subnet, reservation and static address." },
  e911:      { term: "E911 location", def: "The dispatchable location tied to a phone, so a 911 call reaches the right floor and room." },
  siem:      { term: "SIEM", def: "Security information and event management: collects logs from everything, correlates them, and raises alerts." },
  tpfp:      { term: "True / false positive", def: "A true positive is a real threat the alert caught; a false positive is an alert on harmless activity. Triage decides which." },
  ioc:       { term: "IOC", def: "Indicator of compromise: an IP, domain, file hash or behavior that shows an attacker was here." },
  edr:       { term: "EDR", def: "Endpoint detection and response: an agent that records what happens on a machine and can isolate it remotely." },
  contain:   { term: "Containment", def: "Stopping the spread (isolate hosts, revoke sessions, block IPs) before you clean anything up." },
  eradicate: { term: "Eradication", def: "Removing the attacker's foothold: malware, persistence, rogue rules, stolen credentials." },
  cvss:      { term: "CVSS", def: "Common Vulnerability Scoring System: a 0–10 severity score. Severity, not risk: context decides priority." },
  kev:       { term: "CISA KEV", def: "CISA's Known Exploited Vulnerabilities catalog: flaws attackers are using right now. Patch these first." },
  volatility:{ term: "Order of volatility", def: "Collect the most fragile evidence first: memory before disk, disk before backups." },
  lessons:   { term: "Lessons learned", def: "The blameless review after an incident: what happened, what helped, what we'll change, and who owns each action." },
  irplan:    { term: "Incident response plan", def: "Who does what during an incident: commander, comms, legal, technical leads, and how updates flow." },
  scope:     { term: "Scoping", def: "Working out exactly which accounts, hosts and data an incident touched before you eradicate." },
  numbermatch:{ term: "Number matching", def: "An MFA prompt that makes you type the number shown on the sign-in screen, so a push you didn't start can't be approved by accident." }
});

Object.assign(BADGES, {
  student:   { icon: "\u{1F393}", name: "Star Student", desc: "Aced a training quiz on the first try." },
  tracer:    { icon: "\u{1F4E1}", name: "Toner & Probe", desc: "Traced every Floor 3 wall jack to its switch port." },
  subnetter: { icon: "\u{1F9EE}", name: "Subnetter", desc: "Sized the voice VLAN right the first time." },
  loop:      { icon: "\u{1F504}", name: "Loop Breaker", desc: "Broke a switching loop the right way." },
  decom:     { icon: "\u{1F9F9}", name: "Clean Decom", desc: "Wiped and logged the old switches before they left." },
  triage:    { icon: "\u{1F6A6}", name: "Triage Ace", desc: "Called every SIEM alert right on the first try." },
  isolate:   { icon: "\u{1F9CA}", name: "Cold Containment", desc: "Isolated a host without pulling the plug." },
  evidence:  { icon: "\u{1F9FE}", name: "Hash Verified", desc: "Kept the evidence chain of custody perfect." },
  blameless: { icon: "\u{1F54A}️", name: "Blameless", desc: "Ran a lessons-learned review with real actions and no blame." }
});
