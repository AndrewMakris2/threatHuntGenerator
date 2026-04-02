/**
 * Threat Intelligence Service
 * - CISA Known Exploited Vulnerabilities feed
 * - Hunt of the Week rotation
 * - Re-hunt reminder logic
 */

// ── CISA KEV Feed ─────────────────────────────────────────────────────────────

const CISA_KEV_URL =
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

let _kevCache = null;
let _kevCachedAt = 0;
const KEV_TTL = 60 * 60 * 1000; // 1 hour

export async function fetchCISAKEV(limit = 12) {
  try {
    if (_kevCache && Date.now() - _kevCachedAt < KEV_TTL) {
      return _kevCache.slice(0, limit);
    }
    const res  = await fetch(CISA_KEV_URL);
    const data = await res.json();
    const sorted = [...(data.vulnerabilities || [])]
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    _kevCache    = sorted;
    _kevCachedAt = Date.now();
    return sorted.slice(0, limit).map(v => ({
      id:          v.cveID,
      title:       v.vulnerabilityName,
      vendor:      v.vendorProject,
      product:     v.product,
      description: v.shortDescription,
      dateAdded:   v.dateAdded,
      dueDate:     v.dueDate,
      action:      v.requiredAction,
      source:      'CISA KEV',
      url:         `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
    }));
  } catch (e) {
    console.warn('[ThreatIntel] CISA KEV fetch failed:', e.message);
    return FALLBACK_INTEL;
  }
}

// Fallback entries shown when the API is unreachable
const FALLBACK_INTEL = [
  { id: 'CVE-2024-21887', title: 'Ivanti Connect Secure Command Injection', vendor: 'Ivanti', product: 'Connect Secure', description: 'Command injection vulnerability in web components of Ivanti Connect Secure allowing unauthenticated RCE.', dateAdded: '2024-01-10', source: 'CISA KEV', url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-21887' },
  { id: 'CVE-2024-3400',  title: 'PAN-OS Command Injection (GlobalProtect)', vendor: 'Palo Alto Networks', product: 'PAN-OS', description: 'OS command injection in GlobalProtect feature of PAN-OS allows unauthenticated RCE.', dateAdded: '2024-04-12', source: 'CISA KEV', url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-3400' },
  { id: 'CVE-2023-46805', title: 'Ivanti ICS Authentication Bypass', vendor: 'Ivanti', product: 'ICS/IPS', description: 'Authentication bypass in web component allows threat actors to access restricted resources.', dateAdded: '2024-01-10', source: 'CISA KEV', url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-46805' },
  { id: 'CVE-2024-27198', title: 'JetBrains TeamCity Auth Bypass', vendor: 'JetBrains', product: 'TeamCity', description: 'Authentication bypass allowing unauthenticated RCE on TeamCity servers.', dateAdded: '2024-03-07', source: 'CISA KEV', url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-27198' },
  { id: 'CVE-2024-1709',  title: 'ConnectWise ScreenConnect Auth Bypass', vendor: 'ConnectWise', product: 'ScreenConnect', description: 'Authentication bypass allows unauthenticated access to ScreenConnect instances.', dateAdded: '2024-02-22', source: 'CISA KEV', url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-1709' },
];

// ── Hunt of the Week ──────────────────────────────────────────────────────────

const WEEKLY_HUNTS = [
  {
    id: 'w1',
    technique: 'T1190',
    title: 'Exploit Public-Facing Application',
    category: 'network',
    severity: 'critical',
    actors: 'Volt Typhoon, LockBit affiliates, Cl0p',
    description: 'Attackers are actively exploiting internet-facing VPNs, firewalls, and web applications. CISA has flagged multiple critical CVEs in Ivanti, Fortinet, and Palo Alto devices being exploited in the wild as initial access vectors.',
    whyNow: 'Edge device exploitation is the #1 initial access vector for ransomware and nation-state campaigns in the current threat landscape.',
    huntFocus: 'Look for anomalous process spawning from web server processes, unexpected outbound connections from DMZ systems, and new admin accounts created shortly after exploitation.',
  },
  {
    id: 'w2',
    technique: 'T1078.004',
    title: 'Valid Accounts: Cloud Accounts',
    category: 'identity',
    severity: 'critical',
    actors: 'APT29 (Cozy Bear), Scattered Spider',
    description: 'Threat actors are stealing cloud credentials through phishing, token theft, and adversary-in-the-middle attacks to gain persistent access to Microsoft 365, Azure, and AWS environments without triggering traditional endpoint detections.',
    whyNow: 'Credential-based attacks bypassing MFA via token theft (device code auth abuse) have surged in the last 90 days across financial services and technology sectors.',
    huntFocus: 'Impossible travel authentication, new OAuth app registrations, token refresh from unusual locations, and service principal credential additions.',
  },
  {
    id: 'w3',
    technique: 'T1486',
    title: 'Data Encrypted for Impact (Ransomware)',
    category: 'ransomware',
    severity: 'critical',
    actors: 'LockBit 3.0, Black Basta, Play',
    description: 'Ransomware operators are deploying encryption payloads faster than ever — average dwell time before encryption is now under 24 hours. Groups are pre-positioning in networks and triggering encryption across the estate simultaneously.',
    whyNow: 'Ransomware attacks on critical infrastructure and healthcare have intensified. New LockBit and Black Basta variants have been observed with improved anti-EDR capabilities.',
    huntFocus: 'Bulk file modification events, shadow copy deletion commands (vssadmin, wmic), unusual SMB write activity, and endpoint process trees showing lolbas chaining.',
  },
  {
    id: 'w4',
    technique: 'T1557',
    title: 'Adversary-in-the-Middle',
    category: 'identity',
    severity: 'high',
    actors: 'Scattered Spider, TA453',
    description: 'AiTM phishing campaigns are using reverse proxies to intercept MFA tokens in real time, allowing attackers to bypass phishing-resistant MFA and hijack authenticated sessions to cloud platforms.',
    whyNow: 'AiTM toolkits (Evilginx, Modlishka, Muraena) are being actively used in targeted campaigns against financial services, insurance, and SaaS companies.',
    huntFocus: 'Sign-in from new ASN immediately following phishing delivery, session token reuse from different IPs, MFA satisfied from unfamiliar device registration.',
  },
  {
    id: 'w5',
    technique: 'T1059.001',
    title: 'PowerShell Abuse',
    category: 'endpoint',
    severity: 'high',
    actors: 'Multiple ransomware groups, APT41',
    description: 'PowerShell remains the most abused living-off-the-land tool. Attackers use encoded commands, AMSI bypass techniques, and download cradles to execute malicious payloads while evading signature-based detections.',
    whyNow: 'New AMSI bypass techniques have been published that evade most current detections. Multiple active campaigns use PowerShell as primary execution mechanism.',
    huntFocus: 'Encoded command invocations, network connections spawned from PowerShell, PowerShell running from temp directories, and unusual parent processes spawning PowerShell.',
  },
  {
    id: 'w6',
    technique: 'T1021.001',
    title: 'Remote Services: RDP Lateral Movement',
    category: 'lateral',
    severity: 'high',
    actors: 'Most ransomware operators, Lazarus Group',
    description: 'RDP lateral movement is present in virtually every ransomware attack. Attackers abuse valid credentials obtained through credential dumping or brute force to move laterally and expand their footprint before deploying ransomware.',
    whyNow: 'Exposed RDP ports and credential reuse across systems remain endemic. Multiple threat intel reports indicate active scanning for exposed RDP by ransomware affiliates.',
    huntFocus: 'RDP logons from workstation to workstation, new accounts used for RDP that have no prior history, high-frequency logon attempts, and RDP connections at unusual hours.',
  },
  {
    id: 'w7',
    technique: 'T1003.001',
    title: 'LSASS Memory Credential Dumping',
    category: 'endpoint',
    severity: 'critical',
    actors: 'APT29, LockBit, Cl0p',
    description: 'Credential dumping from LSASS remains a critical step in most attack chains. Attackers use Mimikatz, ProcDump, and direct memory access to extract NTLM hashes and Kerberos tickets for lateral movement and privilege escalation.',
    whyNow: 'New LSASS protection bypass techniques for Windows Credential Guard have been published. Sophisticated groups are using kernel-level drivers to dump credentials.',
    huntFocus: 'Access to lsass.exe with PROCESS_VM_READ, unusual processes accessing lsass memory, minidump file creation, and comsvcs.dll being used for memory dumps.',
  },
  {
    id: 'w8',
    technique: 'T1566.001',
    title: 'Spearphishing Attachment',
    category: 'email',
    severity: 'high',
    actors: 'TA505, APT41, BEC actors',
    description: 'Targeted phishing with malicious attachments continues to be a primary initial access vector. Modern campaigns use encrypted archives, OneNote files, and ISO containers to bypass email security controls.',
    whyNow: 'Attackers have shifted from macro-enabled Office docs to container formats (ISO, ZIP, OneNote) to bypass Mark-of-the-Web protections. Detection rates for these are significantly lower.',
    huntFocus: 'Email attachments with container file types, child processes of Office applications or email clients, mounted ISO images, and OneNote spawning child processes.',
  },
  {
    id: 'w9',
    technique: 'T1562.001',
    title: 'Disable or Modify Security Tools',
    category: 'endpoint',
    severity: 'critical',
    actors: 'All major ransomware groups',
    description: 'Before deploying ransomware or exfiltrating data, attackers consistently disable AV/EDR tools, modify security policies, and terminate security processes to reduce the chance of detection.',
    whyNow: 'Bring Your Own Vulnerable Driver (BYOVD) techniques for disabling EDR at the kernel level have become commodity tools available in underground forums.',
    huntFocus: 'Security service stops, registry modifications to AV exclusion paths, driver loading of known vulnerable drivers, and processes terminating security tool processes.',
  },
  {
    id: 'w10',
    technique: 'T1041',
    title: 'Exfiltration Over C2 Channel',
    category: 'exfiltration',
    severity: 'high',
    actors: 'Cl0p, APT41, ALPHV/BlackCat',
    description: 'Data theft before encryption is now standard in ransomware operations. Attackers stage and exfiltrate sensitive data to attacker-controlled infrastructure or cloud storage before triggering encryption.',
    whyNow: 'Double-extortion ransomware has made data exfiltration a primary objective. Groups like Cl0p are doing exfiltration-only attacks without even deploying ransomware.',
    huntFocus: 'Large data staging in temp directories, unusual volumes of data moved to cloud storage apps, DNS beaconing to new domains, and connections to file-sharing services.',
  },
  {
    id: 'w11',
    technique: 'T1136.001',
    title: 'Create Local Account (Persistence)',
    category: 'persistence',
    severity: 'high',
    actors: 'Most post-exploitation frameworks',
    description: 'Attackers create local or domain accounts for persistent access, often naming them to blend in with service accounts or IT admin accounts to avoid detection during incident response.',
    whyNow: 'Rogue account creation is a consistent indicator seen in post-breach investigations. Many organizations have poor visibility into new account creation events.',
    huntFocus: 'New local admin accounts created outside change windows, accounts added to privileged groups, service accounts with interactive login capability, and accounts with no prior history making privileged operations.',
  },
  {
    id: 'w12',
    technique: 'T1071.001',
    title: 'Web Protocols C2 (HTTP/S Beaconing)',
    category: 'network',
    severity: 'high',
    actors: 'APT29, Cobalt Strike users, Sliver C2',
    description: 'Command and control over standard web protocols blends into normal traffic. Attackers use Cobalt Strike, Sliver, Havoc, and custom implants communicating over HTTPS to evade network-based detections.',
    whyNow: 'C2 frameworks are increasingly using legitimate cloud services (Azure, AWS, GitHub) as redirectors, making traditional IP reputation blocking ineffective.',
    huntFocus: 'Regular beaconing intervals (jitter analysis), connections to newly registered domains, unusual user-agent strings, and long-lived connections to low-reputation hosts.',
  },
];

/**
 * Returns the featured hunt for the current week.
 * Rotates weekly based on ISO week number.
 */
export function getHuntOfTheWeek() {
  const now      = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum  = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_HUNTS[weekNum % WEEKLY_HUNTS.length];
}

// ── Re-hunt Reminders ─────────────────────────────────────────────────────────

/**
 * Returns sessions that are stale (older than `dayThreshold` days).
 * Each reminder includes the session and how many days ago it ran.
 */
export function getReHuntReminders(sessions = [], dayThreshold = 60) {
  const now = Date.now();
  return sessions
    .filter(s => {
      const age = (now - new Date(s.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return age >= dayThreshold;
    })
    .map(s => ({
      session: s,
      daysAgo: Math.floor((now - new Date(s.generatedAt).getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => b.daysAgo - a.daysAgo)
    .slice(0, 5);
}

// ── Activity Trending ─────────────────────────────────────────────────────────

/**
 * Buckets hunt sessions by week for the past N weeks.
 * Returns an array of { label, count } for a simple bar chart.
 */
export function getWeeklyActivity(sessions = [], weeks = 8) {
  const buckets = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = sessions.filter(s => {
      const d = new Date(s.generatedAt);
      return d >= weekStart && d < weekEnd;
    }).reduce((sum, s) => sum + (s.huntCount || 0), 0);

    const label = i === 0 ? 'This week'
      : i === 1 ? 'Last week'
      : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    buckets.push({ label, count, weekStart });
  }
  return buckets;
}
