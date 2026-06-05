// The seven main tickets. Each maps to one IT principle.
// Schema:
//   title, principle, principleText, ticket, ticketMeta, actions
//   pois[]:      { id, label, body, evidence, followups?[] }
//   followups[]: { label, result, addEvidence? }
//   diagnoses[]: { key, label, correct, feedback }

export const SCENARIOS = {
  "monitor": {
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
  }
};
