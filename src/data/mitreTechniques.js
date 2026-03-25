/**
 * MITRE ATT&CK Techniques Reference
 * Subset of commonly hunted techniques with tactic mapping
 */

export const MITRE_TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
];

export const MITRE_TECHNIQUES = {
  // ── Initial Access ──────────────────────────────────────────────────
  'T1566': { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', subtechniques: ['T1566.001', 'T1566.002', 'T1566.003'] },
  'T1566.001': { id: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', parent: 'T1566' },
  'T1566.002': { id: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access', parent: 'T1566' },
  'T1190': { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access' },
  'T1078': { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', subtechniques: ['T1078.001','T1078.002','T1078.003','T1078.004'] },
  'T1078.004': { id: 'T1078.004', name: 'Cloud Accounts', tactic: 'Initial Access', parent: 'T1078' },
  'T1133': { id: 'T1133', name: 'External Remote Services', tactic: 'Initial Access' },
  'T1195': { id: 'T1195', name: 'Supply Chain Compromise', tactic: 'Initial Access' },
  'T1199': { id: 'T1199', name: 'Trusted Relationship', tactic: 'Initial Access' },

  // ── Execution ────────────────────────────────────────────────────────
  'T1059': { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', subtechniques: ['T1059.001','T1059.003','T1059.005','T1059.007'] },
  'T1059.001': { id: 'T1059.001', name: 'PowerShell', tactic: 'Execution', parent: 'T1059' },
  'T1059.003': { id: 'T1059.003', name: 'Windows Command Shell', tactic: 'Execution', parent: 'T1059' },
  'T1059.007': { id: 'T1059.007', name: 'JavaScript', tactic: 'Execution', parent: 'T1059' },
  'T1204': { id: 'T1204', name: 'User Execution', tactic: 'Execution' },
  'T1047': { id: 'T1047', name: 'Windows Management Instrumentation', tactic: 'Execution' },

  // ── Persistence ──────────────────────────────────────────────────────
  'T1053': { id: 'T1053', name: 'Scheduled Task/Job', tactic: 'Persistence' },
  'T1543': { id: 'T1543', name: 'Create or Modify System Process', tactic: 'Persistence' },
  'T1547': { id: 'T1547', name: 'Boot or Logon Autostart Execution', tactic: 'Persistence' },
  'T1098': { id: 'T1098', name: 'Account Manipulation', tactic: 'Persistence', subtechniques: ['T1098.001','T1098.003'] },
  'T1098.001': { id: 'T1098.001', name: 'Additional Cloud Credentials', tactic: 'Persistence', parent: 'T1098' },
  'T1136': { id: 'T1136', name: 'Create Account', tactic: 'Persistence' },

  // ── Privilege Escalation ─────────────────────────────────────────────
  'T1548': { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation' },
  'T1068': { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation' },
  'T1134': { id: 'T1134', name: 'Access Token Manipulation', tactic: 'Privilege Escalation' },
  'T1484': { id: 'T1484', name: 'Domain or Tenant Policy Modification', tactic: 'Privilege Escalation' },

  // ── Defense Evasion ──────────────────────────────────────────────────
  'T1562': { id: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion', subtechniques: ['T1562.001','T1562.006'] },
  'T1070': { id: 'T1070', name: 'Indicator Removal', tactic: 'Defense Evasion' },
  'T1036': { id: 'T1036', name: 'Masquerading', tactic: 'Defense Evasion' },
  'T1055': { id: 'T1055', name: 'Process Injection', tactic: 'Defense Evasion' },
  'T1218': { id: 'T1218', name: 'System Binary Proxy Execution', tactic: 'Defense Evasion' },

  // ── Credential Access ────────────────────────────────────────────────
  'T1110': { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', subtechniques: ['T1110.001','T1110.003','T1110.004'] },
  'T1110.001': { id: 'T1110.001', name: 'Password Guessing', tactic: 'Credential Access', parent: 'T1110' },
  'T1110.003': { id: 'T1110.003', name: 'Password Spraying', tactic: 'Credential Access', parent: 'T1110' },
  'T1003': { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', subtechniques: ['T1003.001','T1003.006'] },
  'T1003.001': { id: 'T1003.001', name: 'LSASS Memory', tactic: 'Credential Access', parent: 'T1003' },
  'T1528': { id: 'T1528', name: 'Steal Application Access Token', tactic: 'Credential Access' },
  'T1539': { id: 'T1539', name: 'Steal Web Session Cookie', tactic: 'Credential Access' },
  'T1606': { id: 'T1606', name: 'Forge Web Credentials', tactic: 'Credential Access', subtechniques: ['T1606.002'] },
  'T1606.002': { id: 'T1606.002', name: 'SAML Tokens', tactic: 'Credential Access', parent: 'T1606' },
  'T1555': { id: 'T1555', name: 'Credentials from Password Stores', tactic: 'Credential Access' },

  // ── Discovery ────────────────────────────────────────────────────────
  'T1087': { id: 'T1087', name: 'Account Discovery', tactic: 'Discovery' },
  'T1069': { id: 'T1069', name: 'Permission Groups Discovery', tactic: 'Discovery' },
  'T1083': { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery' },
  'T1046': { id: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery' },
  'T1057': { id: 'T1057', name: 'Process Discovery', tactic: 'Discovery' },
  'T1526': { id: 'T1526', name: 'Cloud Service Discovery', tactic: 'Discovery' },
  'T1580': { id: 'T1580', name: 'Cloud Infrastructure Discovery', tactic: 'Discovery' },

  // ── Lateral Movement ─────────────────────────────────────────────────
  'T1021': { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', subtechniques: ['T1021.001','T1021.002','T1021.004','T1021.006'] },
  'T1021.001': { id: 'T1021.001', name: 'Remote Desktop Protocol', tactic: 'Lateral Movement', parent: 'T1021' },
  'T1021.002': { id: 'T1021.002', name: 'SMB/Windows Admin Shares', tactic: 'Lateral Movement', parent: 'T1021' },
  'T1550': { id: 'T1550', name: 'Use Alternate Authentication Material', tactic: 'Lateral Movement', subtechniques: ['T1550.002'] },
  'T1550.002': { id: 'T1550.002', name: 'Pass the Hash', tactic: 'Lateral Movement', parent: 'T1550' },
  'T1534': { id: 'T1534', name: 'Internal Spearphishing', tactic: 'Lateral Movement' },

  // ── Collection ───────────────────────────────────────────────────────
  'T1114': { id: 'T1114', name: 'Email Collection', tactic: 'Collection', subtechniques: ['T1114.002','T1114.003'] },
  'T1213': { id: 'T1213', name: 'Data from Information Repositories', tactic: 'Collection', subtechniques: ['T1213.002','T1213.003'] },
  'T1213.002': { id: 'T1213.002', name: 'Sharepoint', tactic: 'Collection', parent: 'T1213' },
  'T1530': { id: 'T1530', name: 'Data from Cloud Storage', tactic: 'Collection' },

  // ── Exfiltration ─────────────────────────────────────────────────────
  'T1048': { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration' },
  'T1567': { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration', subtechniques: ['T1567.002'] },
  'T1567.002': { id: 'T1567.002', name: 'Exfiltration to Cloud Storage', tactic: 'Exfiltration', parent: 'T1567' },
  'T1041': { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration' },

  // ── Impact ───────────────────────────────────────────────────────────
  'T1486': { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact' },
  'T1490': { id: 'T1490', name: 'Inhibit System Recovery', tactic: 'Impact' },
  'T1485': { id: 'T1485', name: 'Data Destruction', tactic: 'Impact' },
  'T1498': { id: 'T1498', name: 'Network Denial of Service', tactic: 'Impact' },
  'T1496': { id: 'T1496', name: 'Resource Hijacking', tactic: 'Impact' },
};

export const getTechniqueById = (id) => MITRE_TECHNIQUES[id] || null;

export const getTechniquesByTactic = (tactic) =>
  Object.values(MITRE_TECHNIQUES).filter(t => t.tactic === tactic && !t.parent);

export const getTacticColor = (tactic) => {
  const colors = {
    'Initial Access':        '#f97316',
    'Execution':             '#ef4444',
    'Persistence':           '#a855f7',
    'Privilege Escalation':  '#ec4899',
    'Defense Evasion':       '#6366f1',
    'Credential Access':     '#38bdf8',
    'Discovery':             '#2dd4bf',
    'Lateral Movement':      '#22c55e',
    'Collection':            '#eab308',
    'Command and Control':   '#fb923c',
    'Exfiltration':          '#f43f5e',
    'Impact':                '#dc2626',
  };
  return colors[tactic] || '#94a3b8';
};
