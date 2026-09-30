// The main tickets. Each maps to one teaching principle and a CompTIA objective.
//
// Schema:
//   title, principle, principleText, ticket, ticketMeta, actions
//   floor:  "floor3" | "floor7"   (which floor the ticket lives on)
//   cert:   short exam-objective tag, e.g. "Network+ \u00b7 1.4 Switching"
//   pois[]:      { id, label, body, evidence, followups?[] }
//   followups[]: { label, result, addEvidence? }
//   diagnoses[]: { key, label, correct, feedback }
//
// FLOOR 3 = Help Desk fundamentals (A+ / Network+ triage).
// FLOOR 7 = Security Operations / Red-Team lab (Security+ / PenTest+ / Network+).

export const SCENARIOS = {
  // ===================================================================
  // FLOOR 3 — HELP DESK (fundamentals)
  // ===================================================================
  "monitor": {
    floor: "floor3", day: 1, cert: "A+ 220-1201 \u00b7 5.3 Video & display issues",
    title: "Reception monitor is black",
    principle: "Physical layer first",
    principleText:
      "When a display reports 'no signal' on every input but the PC is alive, the wire is suspect before drivers, power, or network. Layer 1 first.",
    ticket: "\"My monitor is black. I already tried everything. Please hurry.\"",
    ticketMeta: "Tier 1 \u00b7 Reception \u00b7 Karen",
    actions: 6,
    pois: [
      {
        id: "monitor",
        label: "The monitor",
        body: "Power LED is amber. On-screen flashes 'No signal \u00b7 DisplayPort'.",
        evidence: "Monitor LED amber, 'No signal \u00b7 DisplayPort'.",
        followups: [
          {
            label: "Cycle input source",
            result: "HDMI input also reports 'No signal'.",
            addEvidence: "Both inputs report no signal."
          }
        ]
      },
      {
        id: "pc",
        label: "Tower",
        body: "Fans spinning. Front LED solid green. Drive light blinks normally.",
        evidence: "Tower powered and booted fine."
      },
      {
        id: "cables",
        label: "Cables",
        body: "DisplayPort connector at the monitor end is barely seated. Slight wiggle, pops loose.",
        evidence: "DisplayPort cable not fully seated.",
        followups: [
          {
            label: "Reseat the DP cable",
            result: "It clicks in. Picture appears.",
            addEvidence: "Reseating restored video."
          }
        ]
      },
      {
        id: "power",
        label: "Power strip",
        body: "Red switch lit. Everything has power.",
        evidence: "Power strip on, no issue."
      },
      {
        id: "karen",
        label: "Talk to Karen",
        body: "'I didn't change anything. Was fine yesterday. Just back from vacation.' Her chair has been rolling over the cables.",
        evidence: "Chair rolls over cables; user reports no change."
      }
    ],
    diagnoses: [
      { key: "psu", label: "Power supply failure", correct: false,
        feedback: "Tower is alive \u2014 fans, lights, drive activity. Wasn't the PSU." },
      { key: "cable", label: "Loose / wrong-input cable", correct: true,
        feedback: "Right. Amber LED + 'no signal' on both inputs + running tower = signal path failure." },
      { key: "gpu", label: "GPU / driver problem", correct: false,
        feedback: "GPU/driver issues usually show POST or one port works. Never got any signal." },
      { key: "network", label: "Network outage", correct: false,
        feedback: "Symptom is black screen, not 'no internet'. Scope the symptom first." }
    ]
  },

  "internet-down": {
    floor: "floor3", day: 1, cert: "Network+ N10-009 \u00b7 5.1 Troubleshooting methodology",
    title: "\"The internet is down\"",
    principle: "Scope the problem",
    principleText:
      "Before you fix anything, find out how big the problem is. One user, one floor, or the whole building?",
    ticket: "\"Internet's down. Can someone come look?\"",
    ticketMeta: "Tier 1 \u00b7 Open desks \u00b7 Marcus",
    actions: 5,
    pois: [
      { id: "marcus", label: "Talk to Marcus",
        body: "'Down for like 20 minutes.' His Slack is open and active.",
        evidence: "Marcus says internet is down. But Slack is connected." },
      { id: "marcus-pc", label: "His PC",
        body: "Browser shows ERR_NAME_NOT_RESOLVED for one site. Slack, Outlook, Spotify all working.",
        evidence: "Only one site failing; everything else works." },
      { id: "coworker", label: "Coworker",
        body: "On a call. Loads the same site Marcus can't, no problem.",
        evidence: "Neighbor has working internet AND can reach the site." },
      { id: "router", label: "Building router",
        body: "WAN solid, uptime 47 days, no alerts.",
        evidence: "Router healthy. No building outage." },
      { id: "walljack", label: "Wall jack",
        body: "Link light blinks normally.",
        evidence: "Wall jack healthy." }
    ],
    diagnoses: [
      { key: "reboot", label: "Reboot the router", correct: false,
        feedback: "Classic mistake. Marcus is one user with one site failing. Reboot would kill everyone's calls." },
      { key: "scope-user", label: "Isolated to Marcus / one site", correct: true,
        feedback: "Right. Neighbor works, Slack works on Marcus's machine, one site fails \u2014 DNS or hosts file." },
      { key: "isp", label: "Call the ISP", correct: false,
        feedback: "Don't escalate before scoping. Everyone else is online." },
      { key: "cable", label: "Bad cable at his desk", correct: false,
        feedback: "A bad cable kills all traffic. His Slack works." }
    ]
  },

  "dns": {
    floor: "floor3", day: 2, cert: "Network+ N10-009 \u00b7 3.4 / 5.3 DNS & network services",
    title: "Can't reach the file share",
    principle: "Name vs IP (DNS)",
    principleText:
      "If pinging by IP works but pinging by hostname doesn't, name resolution is broken. DNS is its own layer of failure.",
    ticket: "\"I can't open the file share. Says it can't find the server.\"",
    ticketMeta: "Tier 2 \u00b7 Open desks \u00b7 Priya",
    actions: 5,
    pois: [
      { id: "priya", label: "Talk to Priya",
        body: "'I click the shortcut, spins forever, says \\\\fileshare01 can't be found.' Browser loads google.com fine.",
        evidence: "Internet works; \\\\fileshare01 fails." },
      { id: "priya-pc", label: "Her PC",
        body: "Run a test. Pick what you'd type.",
        evidence: "Her PC is operational.",
        followups: [
          { label: "ping fileshare01",
            result: "> ping fileshare01\nPing request could not find host fileshare01.",
            addEvidence: "Ping by hostname: 'could not find host'." },
          { label: "ping 10.0.0.20",
            result: "> ping 10.0.0.20\nReply from 10.0.0.20: time=1ms",
            addEvidence: "Ping by IP works perfectly." }
        ] },
      { id: "server", label: "Fileshare",
        body: "Server up. Other users connecting fine.",
        evidence: "Fileshare up; others connecting." },
      { id: "dns", label: "Router/DNS",
        body: "Internal DNS server's response time is high. Some queries timing out.",
        evidence: "Internal DNS slow / timing out." }
    ],
    diagnoses: [
      { key: "network", label: "Network is down to her desk", correct: false,
        feedback: "Browser works, ping by IP works. Network is fine." },
      { key: "server", label: "Fileshare offline", correct: false,
        feedback: "Server is up and others are connected. Problem is between Priya and the name." },
      { key: "dns", label: "DNS / name resolution failure", correct: true,
        feedback: "Right. Ping by IP works, ping by name fails \u2014 canonical DNS-failure signature." },
      { key: "permissions", label: "User permission issue", correct: false,
        feedback: "Permission issue would deny her after she reached the server. She can't resolve the name." }
    ]
  },

  "printer": {
    floor: "floor3", day: 1, cert: "A+ 220-1201 \u00b7 5.6 Printer issues",
    title: "\"The printer won't print\"",
    principle: "Three-system print stack",
    principleText:
      "Printing is three independent systems: driver on the user's PC, queue on the print server, and network path. Test each separately.",
    ticket: "\"Sent print job three times. Nothing comes out. Printer is on.\"",
    ticketMeta: "Tier 2 \u00b7 Print room \u00b7 Dana",
    actions: 5,
    pois: [
      { id: "printer", label: "Printer",
        body: "Powered on, ready light solid green, no error codes.",
        evidence: "Printer hardware fine, no errors." },
      { id: "queue", label: "Print queue",
        body: "Dana's jobs are stuck in 'Error \u2014 driver mismatch'. Other users' jobs print fine.",
        evidence: "Dana's jobs: driver mismatch. Others print fine." },
      { id: "dana", label: "Talk to Dana",
        body: "'Worked last week. I think I ran Windows updates Friday.' Her print dialog shows 'Office HP \u2014 Generic / Text Only'.",
        evidence: "Dana ran updates Friday; printer showing as Generic driver." },
      { id: "network", label: "Network",
        body: "Ping reaches the printer. Path is healthy.",
        evidence: "Network path to printer is healthy." }
    ],
    diagnoses: [
      { key: "reboot-printer", label: "Restart the printer", correct: false,
        feedback: "Tempting and very common. Printer is fine \u2014 others print. Failure is on Dana's PC." },
      { key: "network", label: "Network outage to the printer", correct: false,
        feedback: "Ping reached it. Others print. Network is healthy." },
      { key: "driver", label: "Driver problem on Dana's PC", correct: true,
        feedback: "Right. Windows update replaced the HP driver with Generic. Hardware \u2713, queue server \u2713, driver \u2717." },
      { key: "permissions", label: "Permissions issue", correct: false,
        feedback: "Permissions show as 'access denied', not 'driver mismatch'. The error code names the layer." }
    ]
  },

  "slow": {
    floor: "floor3", day: 2, cert: "A+ 220-1202 \u00b7 3.0 Software troubleshooting",
    title: "\"The internet is so slow today\"",
    principle: "Resource vs network",
    principleText:
      "User-reported symptoms describe experience, not cause. 'Slow internet' often means slow computer.",
    ticket: "\"Internet's been crawling. Pages take forever.\"",
    ticketMeta: "Tier 2 \u00b7 Open desks 2 \u00b7 Jordan",
    actions: 5,
    pois: [
      { id: "jordan", label: "Talk to Jordan",
        body: "'Everything's slow. Probably the wifi.' 47 browser tabs open.",
        evidence: "Blames wifi. ~47 tabs open." },
      { id: "jordan-pc", label: "His PC",
        body: "Task Manager: CPU 100%, RAM 94%, one Chrome process eating 6GB.",
        evidence: "CPU 100%, RAM 94%, runaway Chrome tab.",
        followups: [
          { label: "Speed test",
            result: "380 Mbps down, 25 ms latency.",
            addEvidence: "Speed test excellent (380 Mbps)." }
        ] },
      { id: "neighbor", label: "Neighbor",
        body: "Streaming a video call with no issues. Same wifi.",
        evidence: "Neighbor on same wifi is fine." },
      { id: "router", label: "Building router",
        body: "Moderate utilization. No alerts.",
        evidence: "Router healthy." }
    ],
    diagnoses: [
      { key: "wifi", label: "Wifi is slow", correct: false,
        feedback: "Neighbor on same wifi is fine. Speed test from his own PC is excellent." },
      { key: "isp", label: "ISP problem", correct: false,
        feedback: "His own speed test pulled 380 Mbps. Pipe is wide open." },
      { key: "resource", label: "Local resource exhaustion", correct: true,
        feedback: "Right. CPU pegged, runaway tab. Browser feels slow \u2192 user reports 'slow internet'." },
      { key: "malware", label: "Malware", correct: false,
        feedback: "Possible but premature \u2014 the runaway tab is sitting right there in Task Manager." }
    ]
  },

  "permissions": {
    floor: "floor3", day: 2, cert: "Security+ SY0-701 \u00b7 4.6 Identity & access mgmt",
    title: "\"Why can he print and I can't?\"",
    principle: "Environment vs user",
    principleText:
      "When two people in the same place have different outcomes, the variable is the user account, not the environment.",
    ticket: "\"Sam can print to the color printer. I can't. Same printer.\"",
    ticketMeta: "Tier 3 \u00b7 Open desks 2 \u00b7 Riley",
    actions: 6,
    pois: [
      { id: "riley", label: "Talk to Riley",
        body: "'I get \"access denied\". Sam prints to it all day.'",
        evidence: "Riley: access denied. Sam: works." },
      { id: "sam", label: "Talk to Sam",
        body: "'Works for me. I'm in marketing \u2014 they gave us color access.'",
        evidence: "Marketing has color access." },
      { id: "printer", label: "Color printer",
        body: "Functioning. Sam's jobs print successfully.",
        evidence: "Printer works for Sam." },
      { id: "queue", label: "Print server ACL",
        body: "Color printer allowed groups: Marketing, Executives, IT. Riley is in Operations.",
        evidence: "ACL excludes Operations. Riley is in Operations." },
      { id: "manager", label: "Riley's manager",
        body: "'Riley prints client presentations occasionally. Been meaning to ask about access.'",
        evidence: "Business justification exists." }
    ],
    diagnoses: [
      { key: "driver", label: "Driver is broken", correct: false,
        feedback: "Driver error would say so. Error is 'access denied' \u2014 names the layer." },
      { key: "queue", label: "Queue is stuck", correct: false,
        feedback: "Sam is actively printing. Queue is fine for those with access." },
      { key: "permissions", label: "Riley's group lacks permission", correct: true,
        feedback: "Right. Same environment, different user, different outcome \u2192 user variable. Operations isn't on the allow-list." },
      { key: "printer-hw", label: "Printer hardware fault", correct: false,
        feedback: "Works for Sam in the same room. Not hardware." }
    ]
  },

  "change": {
    floor: "floor3", day: 3, cert: "Security+ SY0-701 \u00b7 1.3 Change mgmt / 4.5 Email security",
    title: "\"Email broke overnight\"",
    principle: "Change management",
    principleText:
      "When something breaks with no user-side change, look at what changed on the system side. Check the change log.",
    ticket: "\"Whole team can't send external email. Internal works. We didn't change anything.\"",
    ticketMeta: "Tier 4 \u00b7 Manager \u00b7 Mgr Chen",
    actions: 6,
    pois: [
      { id: "manager", label: "Talk to Mgr Chen",
        body: "'Started ~7am. Internal email works. External replies bounce.'",
        evidence: "Internal works, external bounces. Started ~7am." },
      { id: "manager-pc", label: "A team PC",
        body: "NDR reads: 'Recipient address rejected: SPF check failed for sender domain.'",
        evidence: "Bounces: SPF check failed." },
      { id: "server", label: "Mail server",
        body: "Server up. Internal delivery normal. Outbound SMTP connects. External rejects on SPF.",
        evidence: "Server healthy; recipients reject on SPF." },
      { id: "changelog", label: "IT change log",
        body: "Last night 2:47am: 'DNS migration completed \u2014 old TXT records purged, new ones to be added Monday.' SPF lives in TXT.",
        evidence: "DNS migration purged TXT records (SPF). Monday isn't here." },
      { id: "router", label: "Router/firewall",
        body: "Outbound flowing fine. No blocks.",
        evidence: "Network healthy." }
    ],
    diagnoses: [
      { key: "isp", label: "ISP blocking outbound", correct: false,
        feedback: "Bounces are SPF failures, not connection failures. Mail is leaving \u2014 recipients reject on policy." },
      { key: "compromise", label: "Account compromise", correct: false,
        feedback: "Possible but the change log shows a much simpler explanation the same night." },
      { key: "change", label: "Recent DNS change removed SPF", correct: true,
        feedback: "Right. TXT purge nuked the SPF record. External servers can't verify sender. Re-add the SPF record." },
      { key: "server-down", label: "Mail server is down", correct: false,
        feedback: "Internal email works, outbound SMTP connects. Server is fine." }
    ]
  },

  // ===================================================================
  // FLOOR 7 — SECURITY OPERATIONS / RED-TEAM LAB (advanced)
  // ===================================================================
  "phish-ir": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 2.2 Threat vectors / 4.8 Incident response",
    title: "User entered creds on a lookalike site",
    principle: "Contain the credential, not just the email",
    principleText:
      "Credential phishing is solved by killing the credential \u2014 reset password, revoke active sessions and tokens, re-enroll MFA. Blocking the sender alone leaves the attacker logged in.",
    ticket: "\"A user replied to our 'IT' email and typed their password into a portal. The email looked legit.\"",
    ticketMeta: "P2 \u00b7 SOC \u00b7 Sofia",
    actions: 6,
    pois: [
      { id: "sofia", label: "Talk to Sofia (SOC)",
        body: "'User got a 'password expiring' email, clicked, logged in. Twenty minutes ago. The MFA push got approved.'",
        evidence: "Creds entered ~20 min ago; an MFA push was approved." },
      { id: "headers", label: "Email headers",
        body: "From: it-helpdesk@c0mpany-portal.com. SPF: fail. DMARC: fail. Reply-To differs from From.",
        evidence: "Sender spoofed: SPF fail, DMARC fail, mismatched Reply-To." },
      { id: "url", label: "The link / landing page",
        body: "Domain is company-partal.com (homoglyph). Page is a pixel-perfect clone of the SSO login.",
        evidence: "Look-alike (homoglyph) domain hosting a cloned SSO page.",
        followups: [
          { label: "Check the proxy log",
            result: "> proxy\nPOST company-partal.com/login  user=jdoe  (credentials submitted)\nthen: token replay to mail.company.com from 185.x (foreign ASN)",
            addEvidence: "Creds POSTed to attacker host; session token replayed from a foreign IP." }
        ] },
      { id: "edr", label: "EDR on the endpoint",
        body: "No malware, no new processes. The browser visited the page; nothing was downloaded.",
        evidence: "No malware on the host \u2014 this is pure credential theft, not a dropper." },
      { id: "ti", label: "Threat-intel lookup",
        body: "The domain was registered 2 days ago behind privacy protection. Cert issued this morning.",
        evidence: "Attacker domain freshly registered \u2014 targeted, not background spam." }
    ],
    diagnoses: [
      { key: "block", label: "Block the sender and move on", correct: false,
        feedback: "That stops the next email but not this attacker \u2014 they already have a live session token. The credential is still hot." },
      { key: "reimage", label: "Reimage the workstation immediately", correct: false,
        feedback: "There's no malware on the host (EDR is clean). Reimaging treats the wrong layer and ignores the stolen session." },
      { key: "contain-cred", label: "Reset password + revoke all sessions/tokens + re-enroll MFA", correct: true,
        feedback: "Right. The token was already replayed from a foreign IP \u2014 only invalidating the credential and live sessions evicts the attacker. Then block the domain and hunt for mailbox rules." },
      { key: "ignore", label: "Low risk \u2014 MFA will protect the account", correct: false,
        feedback: "MFA was already satisfied (the user approved the push, and tokens can be replayed). MFA isn't a free pass once the session exists." }
    ]
  },

  "privesc": {
    floor: "floor7", cert: "PenTest+ PT0-003 \u00b7 Attacks & exploits (privesc)",
    title: "Pentest: low-priv shell on a Linux host",
    principle: "Check configuration before reaching for an exploit",
    principleText:
      "On an authorized engagement, enumerate the easy wins first: sudo rights, SUID binaries, writable cron jobs, stored secrets. A misconfiguration beats a fragile kernel exploit almost every time.",
    ticket: "\"Authorized internal pentest. We have a www-data shell on app-07. Find a path to root, document it.\"",
    ticketMeta: "Engagement \u00b7 Red-team lab \u00b7 Wes",
    actions: 6,
    pois: [
      { id: "wes", label: "Talk to Wes (lead)",
        body: "'Rules of engagement say no destructive exploits. Find the cleanest documented path. Scope is app-07 only.'",
        evidence: "RoE: no destructive exploits; prefer a clean, documented path; scope limited to app-07." },
      { id: "sudo", label: "Run: sudo -l",
        body: "> sudo -l\nUser www-data may run the following commands:\n  (root) NOPASSWD: /usr/bin/find",
        evidence: "www-data can run /usr/bin/find as root with NOPASSWD." },
      { id: "suid", label: "Hunt SUID binaries",
        body: "> find / -perm -4000 2>/dev/null\nStandard set only (passwd, sudo, mount). Nothing custom.",
        evidence: "SUID set is standard \u2014 no custom SUID escalation here." },
      { id: "kernel", label: "Check kernel version",
        body: "> uname -r\n5.15.0-91-generic  (patched last month)",
        evidence: "Kernel is current/patched \u2014 a kernel exploit would be fragile and likely fail." },
      { id: "cron", label: "Inspect cron jobs",
        body: "A root cron runs /opt/scripts/backup.sh every 5 min. The script is owned by www-data and world-writable.",
        evidence: "Root cron executes a www-data-writable script every 5 minutes.",
        followups: [
          { label: "Confirm the sudo find path",
            result: "GTFOBins: find . -exec /bin/sh -p \\; -quit  \u2014 run via the NOPASSWD sudo find, spawns a root shell. Clean, documented, non-destructive.",
            addEvidence: "sudo find -> -exec /bin/sh gives an immediate documented root shell." }
        ] }
    ],
    diagnoses: [
      { key: "kernel", label: "Run a kernel exploit", correct: false,
        feedback: "The kernel is patched and RoE forbids destructive exploits. You'd risk crashing the box for a path that probably fails." },
      { key: "brute", label: "Brute-force the root password", correct: false,
        feedback: "Noisy, slow, and likely locks accounts \u2014 and you don't need it. Two clean config paths are sitting right there." },
      { key: "sudo-find", label: "Abuse sudo NOPASSWD on find (or the writable root cron)", correct: true,
        feedback: "Right. sudo find -exec /bin/sh -p gives an instant root shell; the world-writable root cron is a second clean path. Both are documented misconfigs, exactly what the RoE wants." },
      { key: "scope", label: "Pivot to the domain controller", correct: false,
        feedback: "Out of scope. Pivoting beyond app-07 violates the rules of engagement \u2014 a fast way to fail a real engagement." }
    ]
  },

  "lateral": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 2.4 Indicators / 4.4 Monitoring",
    title: "One host is authenticating to everything",
    principle: "One source, many targets, odd hours = lateral movement",
    principleText:
      "A single workstation logging into dozens of hosts with the same account in minutes is the signature of pass-the-hash / credential reuse. Isolate the source, reset the account, then hunt.",
    ticket: "\"SIEM lit up overnight. WKSTN-14 is touching half the server subnet. Is this normal?\"",
    ticketMeta: "P1 \u00b7 SOC \u00b7 Nadia",
    actions: 6,
    pois: [
      { id: "nadia", label: "Talk to Nadia (detection)",
        body: "'Started 02:10. WKSTN-14 authenticated to 38 hosts in nine minutes. The user clocked out at 6pm.'",
        evidence: "WKSTN-14 hit 38 hosts in 9 min at 02:10 \u2014 user was offline." },
      { id: "auth", label: "Auth logs",
        body: "Event 4624 Logon Type 3 (network) from WKSTN-14 to many hosts using svc_backup \u2014 NTLM, not Kerberos.",
        evidence: "Type-3 NTLM logons fanning out from one source using a service account." },
      { id: "account", label: "The account: svc_backup",
        body: "Service account, password unchanged 3 years, member of Domain Admins (it shouldn't be).",
        evidence: "Over-privileged service account (Domain Admin), stale password." },
      { id: "net", label: "Network flows",
        body: "445/SMB from WKSTN-14 to each target right before each logon. Then nothing exfiltrated yet.",
        evidence: "SMB (445) to each target precedes each logon; no exfil observed yet \u2014 still spreading." },
      { id: "edr", label: "EDR on WKSTN-14",
        body: "A tool dumped LSASS at 02:08, two minutes before the spread began.",
        evidence: "LSASS dumped at 02:08 \u2014 hashes harvested, then reused.",
        followups: [
          { label: "Pull the parent process",
            result: "LSASS access by rundll32 spawned from a macro in Q4_Invoice.xlsm opened at 17:55.",
            addEvidence: "Initial access: malicious macro at 17:55 -> LSASS dump -> pass-the-hash." }
        ] }
    ],
    diagnoses: [
      { key: "normal", label: "Normal scheduled backup activity", correct: false,
        feedback: "Backups don't dump LSASS or fan out over NTLM to 38 hosts in 9 minutes. The pattern is the tell." },
      { key: "ddos", label: "Inbound DDoS", correct: false,
        feedback: "This is outbound authentication from one internal host, not a flood of inbound traffic." },
      { key: "lateral", label: "Pass-the-hash lateral movement \u2014 isolate WKSTN-14, reset svc_backup", correct: true,
        feedback: "Right. Dumped hashes + Type-3 NTLM from one source to many = lateral movement. Isolate the host, disable/reset the account, then hunt for footholds on the touched servers." },
      { key: "patch", label: "Push a patch to all 38 hosts", correct: false,
        feedback: "Patching doesn't evict an attacker who already has valid hashes. Contain the credential and the source first." }
    ]
  },

  "segmentation": {
    floor: "floor7", cert: "Network+ N10-009 \u00b7 1.7 IPv4 addressing / 4.1 Segmentation",
    title: "A lobby camera can reach Finance",
    principle: "Segment by trust",
    principleText:
      "Flat networks let a $40 camera talk to your crown jewels. Put untrusted/IoT devices on their own VLAN and let firewall rules \u2014 not luck \u2014 decide who reaches Finance.",
    ticket: "\"Audit flagged it: the lobby IP camera can open a session to the Finance database. How?\"",
    ticketMeta: "Audit finding \u00b7 Network lab \u00b7 Tomas",
    actions: 6,
    pois: [
      { id: "tomas", label: "Talk to Tomas (neteng)",
        body: "'Everything came up on VLAN 1 when we moved offices. Never re-segmented. Camera's at 10.10.0.55, Finance DB at 10.10.2.10.'",
        evidence: "Whole site on VLAN 1; camera and Finance DB share one broadcast domain." },
      { id: "switch", label: "Switch config",
        body: "All access ports: switchport access vlan 1. No voice/IoT VLANs. No private VLANs.",
        evidence: "No VLAN separation configured \u2014 one flat L2 domain." },
      { id: "fw", label: "Firewall rules",
        body: "Inter-subnet policy: permit ip any any. It logs nothing.",
        evidence: "Firewall is any/any \u2014 no east-west filtering." },
      { id: "camera", label: "The camera itself",
        body: "Default creds admin/admin, telnet open, firmware 3 years old. Reachable from anywhere.",
        evidence: "IoT camera: default creds, telnet open, unpatched \u2014 a soft pivot point." },
      { id: "subnet", label: "Whiteboard the addressing",
        body: "Proposed: cameras 10.10.0.0/24, users 10.10.1.0/24, Finance 10.10.2.0/24, with ACLs between.",
        evidence: "A /24 per zone gives 254 hosts each and clean ACL boundaries.",
        followups: [
          { label: "How many usable hosts in a /24?",
            result: "/24 = 256 addresses, minus network + broadcast = 254 usable. Plenty per zone, and the boundary is where you write the ACL.",
            addEvidence: "/24 -> 254 usable hosts; the subnet boundary is the enforcement point." }
        ] }
    ],
    diagnoses: [
      { key: "replace", label: "Replace the camera with a newer model", correct: false,
        feedback: "A newer camera on the same flat network can still reach Finance. The device isn't the root cause \u2014 the topology is." },
      { key: "dns", label: "It's a DNS misconfiguration", correct: false,
        feedback: "Reachability here is pure L2/L3 with an any/any firewall. DNS isn't in the path." },
      { key: "segment", label: "Missing segmentation \u2014 VLAN the IoT off + ACLs to Finance", correct: true,
        feedback: "Right. Put the camera on an IoT VLAN, replace any/any with least-privilege ACLs, and Finance is no longer one hop from the lobby. (Fix the default creds too.)" },
      { key: "bandwidth", label: "Add bandwidth / a faster switch", correct: false,
        feedback: "This is an access-control problem, not a throughput problem. More bandwidth just lets the camera reach Finance faster." }
    ]
  },

  "tls-chain": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 1.4 Cryptographic solutions (PKI)",
    title: "Cert warnings after a renewal",
    principle: "A cert is only as valid as its chain",
    principleText:
      "Browsers must build a path from the server cert up to a trusted root. If the server doesn't send the intermediate, clients that don't already have it cached throw an 'incomplete chain' error \u2014 even though the cert itself is fine.",
    ticket: "\"We renewed the cert on the internal portal. Now half of users get a security warning, half don't.\"",
    ticketMeta: "P2 \u00b7 PKI / sysadmin \u00b7 Grace",
    actions: 6,
    pois: [
      { id: "grace", label: "Talk to Grace (sysadmin)",
        body: "'New cert from the CA, installed it, restarted. Some browsers are fine, some say 'can't verify'. Same URL.'",
        evidence: "Inconsistent trust across clients for the same renewed cert." },
      { id: "cert", label: "Inspect the leaf cert",
        body: "CN/SAN = portal.company.com (matches). Dates valid (issued today, 1-year). Signed by 'Company Issuing CA G2'.",
        evidence: "Leaf cert: SAN matches host, dates valid \u2014 the leaf itself is good." },
      { id: "chain", label: "Test the served chain",
        body: "> openssl s_client -connect portal:443\nVerify error: unable to get local issuer certificate.\nServer sent ONLY the leaf \u2014 no intermediate.",
        evidence: "Server presents the leaf only; intermediate CA is missing from the chain." },
      { id: "client", label: "Compare two clients",
        body: "The 'working' machines are old build images that happen to cache the G2 intermediate. Fresh installs don't have it.",
        evidence: "Only clients that already cached the intermediate succeed \u2014 explains the split." },
      { id: "root", label: "Check the root store",
        body: "The CA root is present and trusted in every client. Not a root problem.",
        evidence: "Root is trusted everywhere \u2014 rules out an untrusted/expired root." }
    ],
    diagnoses: [
      { key: "root", label: "Expired or untrusted root CA", correct: false,
        feedback: "The root is present and trusted on every client. The break is one link down: the missing intermediate." },
      { key: "san", label: "SAN/hostname mismatch", correct: false,
        feedback: "The SAN matches portal.company.com on the leaf. A name mismatch would fail on every client, not half." },
      { key: "chain", label: "Incomplete chain \u2014 install the intermediate on the server", correct: true,
        feedback: "Right. The server only sent the leaf; clients without a cached intermediate can't build a path to the root. Bundle the intermediate with the server cert and all clients verify." },
      { key: "self-signed", label: "Someone deployed a self-signed cert", correct: false,
        feedback: "It's CA-issued by 'Company Issuing CA G2', not self-signed. The leaf is legitimate \u2014 only the chain is short." }
    ]
  },

  "ransomware": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 4.8 Incident response",
    title: "A file share is encrypting itself",
    principle: "Isolate first, then eradicate",
    principleText:
      "IR has an order: prepare, identify, contain, eradicate, recover, lessons-learned. When ransomware is live, containment (isolate the host) comes before anything else. Backups beat ransoms; rebooting and paying make it worse.",
    ticket: "\"Files on the Marketing share are turning into .lockd with a ransom note. It's spreading right now.\"",
    ticketMeta: "P1 \u00b7 IR war room \u00b7 Omar",
    actions: 6,
    pois: [
      { id: "omar", label: "Talk to Omar (IR lead)",
        body: "'It's actively encrypting. One host is doing the writes. We have backups \u2014 question is what we do in the next two minutes.'",
        evidence: "Active encryption in progress, traced to a single writing host; backups exist." },
      { id: "edr", label: "EDR timeline",
        body: "WKSTN-22: vssadmin delete shadows, then mass file writes to the mapped Marketing share. Parent: a macro in 'Invoice.docm'.",
        evidence: "WKSTN-22 deleted shadow copies then began mass-encrypting the share; entry via a macro doc." },
      { id: "scope", label: "Scope the blast radius",
        body: "Only the Marketing share (mapped on WKSTN-22) is affected. Finance/HR shares untouched. No second host writing yet.",
        evidence: "Damage limited to WKSTN-22's mapped share; no lateral spread yet \u2014 a window to contain." },
      { id: "backups", label: "Check backups",
        body: "Immutable backup completed 02:00, isolated from the domain, verified restorable.",
        evidence: "Clean, immutable, offline backup from 02:00 is restorable." },
      { id: "note", label: "Read the ransom note",
        body: "Bitcoin demand, 72-hour timer, 'contact us to decrypt'. Known commodity strain.",
        evidence: "Commodity ransom note \u2014 paying funds crime with no guarantee of a working decryptor." }
    ],
    diagnoses: [
      { key: "pay", label: "Pay the ransom to stop it", correct: false,
        feedback: "Paying doesn't stop live encryption, often yields a broken decryptor, funds the attacker, and you already have a clean backup." },
      { key: "reboot", label: "Reboot all affected machines", correct: false,
        feedback: "Rebooting can destroy volatile evidence (and in-memory keys) and won't stop the on-disk encryption. Don't reboot during active ransomware." },
      { key: "isolate", label: "Isolate WKSTN-22 now, then eradicate and restore from backup", correct: true,
        feedback: "Right. Pull WKSTN-22 off the network to halt the writes (containment), preserve evidence, remove the malware (eradicate), then restore from the 02:00 immutable backup. No ransom needed." },
      { key: "delete", label: "Delete the encrypted files to save space", correct: false,
        feedback: "Never destroy the affected data during an incident \u2014 it's evidence, and in some strains partially-recoverable. Contain first." }
    ]
  },

  "rogue-ap": {
    floor: "floor7", cert: "Security+ SY0-701 \u00b7 2.4 Indicators (wireless / on-path)",
    title: "Two 'CorpWiFi' networks, one is fake",
    principle: "Same SSID, two BSSIDs, deauths = evil twin",
    principleText:
      "An evil twin broadcasts your SSID from a rogue radio, often forcing clients off the real AP with deauth frames so they reconnect to the attacker. Locate and remove the rogue; move to WPA2/WPA3-Enterprise so clients authenticate the network, not just a password.",
    ticket: "\"People are getting a login page on CorpWiFi that asks for their AD password. We don't have a captive portal.\"",
    ticketMeta: "P1 \u00b7 Wireless / physical \u00b7 Bex",
    actions: 6,
    pois: [
      { id: "bex", label: "Talk to Bex (wireless)",
        body: "'Started this morning on the 3rd floor. A portal pops up asking for the domain password. Ours is WPA2-PSK, no portal.'",
        evidence: "Bogus captive portal harvesting AD creds on a network that has no real portal." },
      { id: "survey", label: "Run a wireless survey",
        body: "SSID 'CorpWiFi' is broadcasting from TWO BSSIDs. One matches your Aruba APs; the other is a random MAC, vendor OUI = a USB wifi chipset.",
        evidence: "One SSID, two BSSIDs \u2014 the extra radio uses a consumer USB-wifi OUI." },
      { id: "deauth", label: "Capture the air",
        body: "Bursts of 802.11 deauthentication frames are knocking clients off the legit BSSID; they reassociate to the rogue.",
        evidence: "Deauth floods force clients off the real AP onto the rogue \u2014 classic evil-twin push." },
      { id: "locate", label: "Walk the signal down",
        body: "RSSI on the rogue peaks near a meeting room; a backpack under the table holds a Pi with a battery and a USB antenna.",
        evidence: "Rogue radio physically located: a battery-powered Pi hidden in a meeting room." },
      { id: "rf", label: "Check for plain RF interference",
        body: "Spectrum is clean \u2014 no microwave/Bluetooth noise. This isn't interference; it's a second access point.",
        evidence: "No RF interference \u2014 the problem is an unauthorized AP, not noise." }
    ],
    diagnoses: [
      { key: "interference", label: "RF interference \u2014 change the channel", correct: false,
        feedback: "The spectrum is clean and the 'portal' is harvesting passwords. Changing channels does nothing to a rogue AP impersonating your SSID." },
      { key: "weak", label: "Weak coverage \u2014 add another AP", correct: false,
        feedback: "Coverage isn't the issue; an attacker is deauthing clients onto a fake AP. Adding APs won't stop the impersonation." },
      { key: "evil-twin", label: "Evil twin / rogue AP \u2014 locate & remove it, move to WPA2-Enterprise", correct: true,
        feedback: "Right. Two BSSIDs for one SSID + deauth bursts + a creds-harvesting portal = evil twin. Remove the rogue, then 802.1X/WPA2-Enterprise so clients validate a server cert instead of trusting any AP with the right name." },
      { key: "isp", label: "ISP outage downstream", correct: false,
        feedback: "An ISP problem wouldn't broadcast your SSID from a second radio or ask for AD passwords. This is on-prem and hostile." }
    ]
  }
};

// ---- floor-aware helpers (used by UI + engine; no behavior change for floor3)
export function scenarioIdsForFloor(floorId) {
  return Object.keys(SCENARIOS).filter((id) => (SCENARIOS[id].floor || "floor3") === floorId);
}
export function scenarioCountForFloor(floorId) {
  return scenarioIdsForFloor(floorId).length;
}
