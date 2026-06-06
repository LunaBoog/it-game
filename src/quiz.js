// Practice-test question bank. Pure data + a sampler. Floor-tagged so the
// "Exam" button can quiz the player on whatever floor they're standing on,
// covering every concept on that floor (completed tickets and ones still ahead).
//
// Schema:  { id, floor, cert, q, explain, options:[{ t, correct }] }
//   exactly one option per question has correct:true.
// The sampler shuffles questions AND options each attempt, so retakes feel fresh.

export const QUESTIONS = [
  // ===================== FLOOR 3 — fundamentals =====================
  { id: "f3-nosig", floor: "floor3", cert: "A+ \u00b7 Display",
    q: "A monitor shows \u201cNo signal\u201d on every input while the PC's fans, power LED, and drive light are all normal. What's the most likely cause to check first?",
    explain: "A live tower plus 'no signal' on all inputs points at the signal path \u2014 a loose or wrong cable \u2014 long before drivers or the PSU. Physical layer first.",
    options: [
      { t: "A failed power supply", correct: false },
      { t: "A loose or wrong-input video cable", correct: true },
      { t: "A corrupt operating system", correct: false },
      { t: "A network outage", correct: false } ] },

  { id: "f3-scope", floor: "floor3", cert: "Network+ \u00b7 Methodology",
    q: "A user says \u201cthe internet is down.\u201d What should you establish before touching anything?",
    explain: "Scope the problem first: is it one user, one floor, or the whole building? It decides everything you do next \u2014 and stops you from rebooting a router over one person.",
    options: [
      { t: "How big the problem is (one user vs. everyone)", correct: true },
      { t: "Whether to reboot the building router", correct: false },
      { t: "Which ISP the company uses", correct: false },
      { t: "The user's password", correct: false } ] },

  { id: "f3-dns", floor: "floor3", cert: "Network+ \u00b7 DNS",
    q: "Ping by IP (10.0.0.20) succeeds but ping by hostname (fileshare01) fails with \u201ccould not find host.\u201d What's broken?",
    explain: "Reaching the IP but not the name is the textbook DNS-failure signature \u2014 connectivity is fine, name resolution isn't.",
    options: [
      { t: "The physical network link", correct: false },
      { t: "Name resolution / DNS", correct: true },
      { t: "File permissions on the share", correct: false },
      { t: "The server's power supply", correct: false } ] },

  { id: "f3-print", floor: "floor3", cert: "A+ \u00b7 Printers",
    q: "One user's print jobs fail with \u201cdriver mismatch\u201d while everyone else prints fine to the same printer. Where is the fault?",
    explain: "Others printing fine proves the printer, queue server, and network are healthy. The variable is that one user's PC \u2014 here, its driver.",
    options: [
      { t: "The printer hardware", correct: false },
      { t: "The network path to the printer", correct: false },
      { t: "The driver on that user's PC", correct: true },
      { t: "The print server is down", correct: false } ] },

  { id: "f3-printstack", floor: "floor3", cert: "A+ \u00b7 Printers",
    q: "Printing is best understood as how many independent systems to test separately?",
    explain: "Driver (user PC), queue (print server), and network path \u2014 three layers. Naming the failing layer (e.g. 'driver mismatch') tells you where to look.",
    options: [
      { t: "One \u2014 it's all the printer", correct: false },
      { t: "Three: driver, queue/server, network path", correct: true },
      { t: "Two: the cable and the toner", correct: false },
      { t: "Five OSI layers", correct: false } ] },

  { id: "f3-slow", floor: "floor3", cert: "A+ \u00b7 Performance",
    q: "A user reports 'slow internet.' Their speed test pulls 380 Mbps, a neighbor on the same wifi is fine, but Task Manager shows CPU 100% and a runaway browser tab. What's the cause?",
    explain: "Symptoms describe experience, not cause. A pegged CPU makes the browser feel slow, which the user calls 'slow internet.' It's local resource exhaustion.",
    options: [
      { t: "The wifi is slow", correct: false },
      { t: "An ISP problem", correct: false },
      { t: "Local resource exhaustion on the PC", correct: true },
      { t: "A failing network card", correct: false } ] },

  { id: "f3-perms", floor: "floor3", cert: "Security+ \u00b7 Access control",
    q: "Two coworkers at adjacent desks try the same color printer. Sam succeeds; Riley gets 'access denied.' What does that point to?",
    explain: "Same environment, different user, different outcome \u2014 the variable is the user account. Riley's group isn't on the printer's allow-list.",
    options: [
      { t: "A broken print driver", correct: false },
      { t: "Riley's account/group lacks permission", correct: true },
      { t: "A stuck print queue", correct: false },
      { t: "A hardware fault in the printer", correct: false } ] },

  { id: "f3-change", floor: "floor3", cert: "Security+ \u00b7 Change mgmt",
    q: "External email starts bouncing with 'SPF check failed' overnight, though no user changed anything. What should you check?",
    explain: "When something breaks with no user-side change, look at the system-side change log. Here a DNS migration purged the TXT record that held SPF.",
    options: [
      { t: "The IT change log for recent system changes", correct: true },
      { t: "Each user's mailbox quota", correct: false },
      { t: "The ISP's billing status", correct: false },
      { t: "Whether the mail server is powered on", correct: false } ] },

  { id: "f3-spf", floor: "floor3", cert: "Security+ \u00b7 Email auth",
    q: "Which DNS record type holds an SPF policy?",
    explain: "SPF is published as a TXT record. Delete the TXT records and receivers can no longer verify your sending hosts \u2014 mail bounces on SPF.",
    options: [
      { t: "A / AAAA record", correct: false },
      { t: "MX record", correct: false },
      { t: "TXT record", correct: true },
      { t: "PTR record", correct: false } ] },

  { id: "f3-standby", floor: "floor3", cert: "A+ \u00b7 Display",
    q: "A monitor's power LED is glowing amber and gently pulsing, screen black. Most likely?",
    explain: "Amber/pulsing usually means standby \u2014 the PC went to sleep. Wiggle the mouse before ordering a $200 replacement.",
    options: [
      { t: "The monitor has failed", correct: false },
      { t: "The PC is asleep / monitor in standby", correct: true },
      { t: "The video cable is dead", correct: false },
      { t: "The GPU has crashed", correct: false } ] },

  { id: "f3-usb", floor: "floor3", cert: "Security+ \u00b7 Social eng",
    q: "You find an unlabeled USB stick on the office floor. Best action?",
    explain: "Unknown USBs are a classic 'drop attack.' They can auto-run payloads or emulate a keyboard. Don't plug it in to find the owner \u2014 hand it to security for isolated inspection.",
    options: [
      { t: "Plug it into your PC to find the owner", correct: false },
      { t: "Hand it to security to inspect safely", correct: true },
      { t: "Leave it where it is", correct: false },
      { t: "Plug it into a coworker's machine", correct: false } ] },

  { id: "f3-ping", floor: "floor3", cert: "Network+ \u00b7 Tools",
    q: "Which command quickly tests whether a host is reachable and shows round-trip latency?",
    explain: "ping sends ICMP echo requests and reports replies + round-trip time \u2014 the fastest reachability/latency check. ipconfig shows local config; nslookup queries DNS.",
    options: [
      { t: "ipconfig /all", correct: false },
      { t: "ping", correct: true },
      { t: "chkdsk", correct: false },
      { t: "format", correct: false } ] },

  { id: "f3-osi1", floor: "floor3", cert: "Network+ \u00b7 OSI",
    q: "Cables, connectors, and electrical signaling live at which OSI layer?",
    explain: "Layer 1, Physical, is the wires and signals. 'Physical layer first' is why you check the cable before the driver.",
    options: [
      { t: "Layer 1 \u2014 Physical", correct: true },
      { t: "Layer 3 \u2014 Network", correct: false },
      { t: "Layer 4 \u2014 Transport", correct: false },
      { t: "Layer 7 \u2014 Application", correct: false } ] },

  { id: "f3-proactive", floor: "floor3", cert: "ITIL \u00b7 Proactive support",
    q: "A printer blinks 'low cyan' but still prints in black and white and no one has complained. The pro move is to:",
    explain: "Proactive beats reactive: a 30-second cartridge swap now prevents an urgent 'can't print the client deck' ticket later. Replacing all four cartridges is wasteful \u2014 the light named cyan.",
    options: [
      { t: "Ignore it \u2014 it still prints", correct: false },
      { t: "Replace just the cyan cartridge now", correct: true },
      { t: "Replace all four cartridges", correct: false },
      { t: "Wait for a ticket", correct: false } ] },

  // ===================== FLOOR 7 — security operations =====================
  { id: "f7-phish", floor: "floor7", cert: "Security+ \u00b7 IR",
    q: "A user typed their password into a look-alike SSO page and approved an MFA push 20 minutes ago. Logs show the session token replayed from a foreign IP. Best first containment?",
    explain: "The attacker already has a live session, so blocking the email isn't enough. Reset the password and revoke all active sessions/tokens and re-enroll MFA to evict them.",
    options: [
      { t: "Block the sender address and move on", correct: false },
      { t: "Reset password + revoke all sessions/tokens + re-enroll MFA", correct: true },
      { t: "Reimage the workstation immediately", correct: false },
      { t: "Nothing \u2014 MFA already protects the account", correct: false } ] },

  { id: "f7-homoglyph", floor: "floor7", cert: "Security+ \u00b7 Social eng",
    q: "A phishing link points to 'company-partal.com,' a near-copy of the real domain. This technique is called:",
    explain: "Swapping/omitting characters to mimic a trusted domain is typosquatting / a homoglyph (look-alike) domain \u2014 a staple of credential phishing.",
    options: [
      { t: "A homoglyph / typosquatting domain", correct: true },
      { t: "DNS poisoning", correct: false },
      { t: "An SQL injection", correct: false },
      { t: "A buffer overflow", correct: false } ] },

  { id: "f7-emailauth", floor: "floor7", cert: "Security+ \u00b7 Email auth",
    q: "Which trio of email-authentication mechanisms helps a receiver detect a spoofed sender domain?",
    explain: "SPF (authorized senders), DKIM (signature), and DMARC (policy + alignment) together let receivers spot spoofing. In the phishing case all three failed.",
    options: [
      { t: "TLS, SSH, IPsec", correct: false },
      { t: "SPF, DKIM, DMARC", correct: true },
      { t: "WPA2, WPA3, WEP", correct: false },
      { t: "RAID, LVM, ZFS", correct: false } ] },

  { id: "f7-sudo", floor: "floor7", cert: "PenTest+ \u00b7 Privesc",
    q: "On a Linux host you have a low-priv shell. Which command quickly reveals commands you're allowed to run as root?",
    explain: "'sudo -l' lists your allowed sudo commands. A NOPASSWD entry on something like find or vim is a clean, documented privilege-escalation path (see GTFOBins).",
    options: [
      { t: "sudo -l", correct: true },
      { t: "ls -la /root", correct: false },
      { t: "whoami", correct: false },
      { t: "passwd root", correct: false } ] },

  { id: "f7-privconfig", floor: "floor7", cert: "PenTest+ \u00b7 Privesc",
    q: "The target's kernel is fully patched, but a root cron job runs a world-writable script every 5 minutes. The best escalation path is to:",
    explain: "Always prefer the misconfiguration over a fragile kernel exploit. A writable script executed by root lets you run your own code as root \u2014 clean and reliable.",
    options: [
      { t: "Run a kernel exploit anyway", correct: false },
      { t: "Edit the world-writable root cron script", correct: true },
      { t: "Brute-force the root password", correct: false },
      { t: "Give up \u2014 a patched kernel is unexploitable", correct: false } ] },

  { id: "f7-lateral", floor: "floor7", cert: "Security+ \u00b7 Detection",
    q: "At 2am one workstation makes Type-3 (network) NTLM logons to 38 servers in nine minutes using a service account. This pattern is:",
    explain: "One source authenticating to many targets off-hours \u2014 especially via NTLM after an LSASS dump \u2014 is classic pass-the-hash lateral movement. Isolate the source and reset the account.",
    options: [
      { t: "A normal nightly backup", correct: false },
      { t: "Pass-the-hash lateral movement", correct: true },
      { t: "An inbound DDoS attack", correct: false },
      { t: "A DNS cache refresh", correct: false } ] },

  { id: "f7-lsass", floor: "floor7", cert: "Security+ \u00b7 Attacks",
    q: "Dumping the LSASS process on Windows is primarily a way for an attacker to:",
    explain: "LSASS holds credential material (hashes/tickets) in memory. Dumping it harvests credentials that enable pass-the-hash / lateral movement.",
    options: [
      { t: "Harvest credentials/hashes from memory", correct: true },
      { t: "Encrypt files for ransom", correct: false },
      { t: "Open a firewall port", correct: false },
      { t: "Speed up the system", correct: false } ] },

  { id: "f7-vlan", floor: "floor7", cert: "Network+ \u00b7 Segmentation",
    q: "A lobby IP camera can open a session to the Finance database because everything shares VLAN 1 with an any/any firewall. The fix is to:",
    explain: "Segment by trust: put IoT on its own VLAN and replace any/any with least-privilege ACLs so a camera can't route to Finance. A newer camera on a flat net is still exposed.",
    options: [
      { t: "Buy a newer camera", correct: false },
      { t: "Add more bandwidth", correct: false },
      { t: "Segment IoT onto its own VLAN with ACLs to Finance", correct: true },
      { t: "Change the camera's DNS server", correct: false } ] },

  { id: "f7-subnet", floor: "floor7", cert: "Network+ \u00b7 Subnetting",
    q: "How many usable host addresses are in a /24 subnet?",
    explain: "/24 = 256 total addresses; subtract the network and broadcast addresses = 254 usable hosts.",
    options: [
      { t: "256", correct: false },
      { t: "254", correct: true },
      { t: "128", correct: false },
      { t: "512", correct: false } ] },

  { id: "f7-anyany", floor: "floor7", cert: "Security+ \u00b7 Firewall",
    q: "A firewall inter-subnet rule reads 'permit ip any any.' What's the problem?",
    explain: "Any/any permits all east-west traffic \u2014 no least privilege. It's why the camera could reach Finance. Rules should permit only what's needed.",
    options: [
      { t: "Nothing \u2014 that's best practice", correct: false },
      { t: "It allows all traffic with no least-privilege filtering", correct: true },
      { t: "It blocks DNS", correct: false },
      { t: "It only applies to IPv6", correct: false } ] },

  { id: "f7-chain", floor: "floor7", cert: "Security+ \u00b7 PKI",
    q: "After a renewal, some clients trust the portal's cert and some say 'unable to get local issuer certificate.' The server's leaf is valid and the root is trusted everywhere. What's wrong?",
    explain: "The server isn't sending the intermediate, so clients that haven't cached it can't build a chain to the root. Bundle the intermediate with the server cert.",
    options: [
      { t: "The root CA expired", correct: false },
      { t: "The SAN doesn't match the hostname", correct: false },
      { t: "The intermediate cert is missing from the served chain", correct: true },
      { t: "The cert is self-signed", correct: false } ] },

  { id: "f7-san", floor: "floor7", cert: "Security+ \u00b7 PKI",
    q: "Which certificate field must contain the hostname a browser is connecting to, or it throws a name-mismatch error?",
    explain: "Modern browsers validate the Subject Alternative Name (SAN). The legacy Common Name (CN) alone is no longer trusted for hostname matching.",
    options: [
      { t: "Subject Alternative Name (SAN)", correct: true },
      { t: "Serial Number", correct: false },
      { t: "Issuer", correct: false },
      { t: "Key Usage", correct: false } ] },

  { id: "f7-ir-order", floor: "floor7", cert: "Security+ \u00b7 IR phases",
    q: "Ransomware is actively encrypting a share from one host. Per the IR process, what comes first?",
    explain: "The IR order is prepare \u2192 identify \u2192 contain \u2192 eradicate \u2192 recover \u2192 lessons learned. Containment (isolate the host) stops the spread before eradication or recovery.",
    options: [
      { t: "Recovery \u2014 restore from backup right away", correct: false },
      { t: "Containment \u2014 isolate the affected host", correct: true },
      { t: "Eradication \u2014 wipe the malware first", correct: false },
      { t: "Pay the ransom", correct: false } ] },

  { id: "f7-ransom", floor: "floor7", cert: "Security+ \u00b7 IR",
    q: "During active ransomware with a verified clean backup, which action is WRONG?",
    explain: "Rebooting can destroy volatile evidence and in-memory keys and won't stop on-disk encryption. Isolate, preserve evidence, eradicate, then restore from backup \u2014 don't reboot or pay.",
    options: [
      { t: "Isolate the encrypting host from the network", correct: false },
      { t: "Reboot all affected machines", correct: true },
      { t: "Preserve evidence for analysis", correct: false },
      { t: "Restore from the immutable backup", correct: false } ] },

  { id: "f7-vss", floor: "floor7", cert: "Security+ \u00b7 Attacks",
    q: "Ransomware often runs 'vssadmin delete shadows' early. Why?",
    explain: "It deletes Volume Shadow Copies so victims can't roll back to a local snapshot, pressuring them to pay. Off-host immutable backups defeat this.",
    options: [
      { t: "To delete shadow copies so you can't restore locally", correct: true },
      { t: "To speed up encryption", correct: false },
      { t: "To open a network port", correct: false },
      { t: "To install a printer driver", correct: false } ] },

  { id: "f7-eviltwin", floor: "floor7", cert: "Security+ \u00b7 Wireless",
    q: "You see your SSID broadcast from two different BSSIDs, with deauth bursts knocking clients onto the second one, which then asks for the AD password. This is:",
    explain: "Same SSID + a second BSSID + deauths forcing reconnection + a creds-harvesting portal = an evil twin / rogue AP. Locate and remove it; move to WPA2/WPA3-Enterprise.",
    options: [
      { t: "RF interference", correct: false },
      { t: "An evil twin / rogue access point", correct: true },
      { t: "Weak coverage needing another AP", correct: false },
      { t: "An ISP outage", correct: false } ] },

  { id: "f7-wpaent", floor: "floor7", cert: "Security+ \u00b7 Wireless",
    q: "Which wireless approach best prevents clients from trusting an evil-twin AP that merely knows the network name?",
    explain: "WPA2/WPA3-Enterprise (802.1X) makes clients validate a RADIUS server certificate, so a rogue AP with the right SSID but no valid cert is rejected \u2014 unlike a shared PSK.",
    options: [
      { t: "WEP", correct: false },
      { t: "Open network with a captive portal", correct: false },
      { t: "WPA2/WPA3-Enterprise (802.1X) with server-cert validation", correct: true },
      { t: "Hiding the SSID", correct: false } ] },

  { id: "f7-defcreds", floor: "floor7", cert: "Security+ \u00b7 Hardening",
    q: "You log into a production switch with admin/admin and find Telnet enabled. Best response?",
    explain: "Default creds are a top compromise vector. Set strong unique credentials, disable Telnet (plaintext), enable SSH, and review access logs \u2014 now, not 'later.'",
    options: [
      { t: "Leave a sticky note to fix later", correct: false },
      { t: "Change creds, disable Telnet, enable SSH", correct: true },
      { t: "Ignore it \u2014 it's internal only", correct: false },
      { t: "Move the management port to a new number", correct: false } ] },

  { id: "f7-rdp", floor: "floor7", cert: "Security+ \u00b7 Attack surface",
    q: "A firewall rule exposes RDP (3389) to 'any' on the internet. The right fix is to:",
    explain: "Internet-facing RDP is brute-forced constantly and is a leading ransomware entry point. Remove the exposure: require VPN + MFA or a bastion. A non-standard port is just obscurity.",
    options: [
      { t: "Set a long password and leave it open", correct: false },
      { t: "Move RDP to a non-standard port", correct: false },
      { t: "Close it at the edge; require VPN + MFA / bastion", correct: true },
      { t: "Enable it for IPv6 too", correct: false } ] },

  { id: "f7-secret", floor: "floor7", cert: "PenTest+ \u00b7 OSINT",
    q: "You discover a live AWS secret key committed to a public GitHub repo. First action?",
    explain: "Once public, treat it as compromised \u2014 bots scrape commits within seconds. Rotate/revoke the key first, then purge it from history and add secret scanning. Deleting the file alone leaves it in git history.",
    options: [
      { t: "Delete the file and commit", correct: false },
      { t: "Make the repo private", correct: false },
      { t: "Rotate/revoke the key now, then purge history", correct: true },
      { t: "Email the developer to be careful next time", correct: false } ] }
];

// Fisher\u2013Yates, returns a new shuffled array (doesn't mutate input).
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sample up to n questions for a floor, with options pre-shuffled. Each returned
// question carries answerIndex = the index of the correct option after shuffling.
export function sampleQuiz(floorId, n = 5) {
  const pool = QUESTIONS.filter((q) => q.floor === floorId);
  const picked = shuffled(pool).slice(0, Math.min(n, pool.length));
  return picked.map((q) => {
    const opts = shuffled(q.options);
    return {
      id: q.id, cert: q.cert, q: q.q, explain: q.explain,
      options: opts,
      answerIndex: opts.findIndex((o) => o.correct)
    };
  });
}

export function quizPoolSize(floorId) {
  return QUESTIONS.filter((q) => q.floor === floorId).length;
}
