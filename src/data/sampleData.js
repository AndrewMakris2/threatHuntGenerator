/**
 * Sample / Default Data
 * Pre-built company profile and generated hunt examples for demo purposes
 */

export const EMPTY_COMPANY_PROFILE = {
  // ── Company Identity ──────────────────────────────────────────────────
  companyName: '',
  industry: '',
  businessType: '',
  companySize: '',
  regions: [],
  websiteUrl: '',

  // ── Security Stack ────────────────────────────────────────────────────
  siemPlatform: '',
  edrPlatform: '',
  emailSecurityPlatform: '',
  iamPlatform: '',
  emailPlatform: '',
  networkMonitoring: '',
  vulnerabilityManagement: '',
  casb: '',
  pamSolution: '',
  backupSolution: '',

  // ── Infrastructure ────────────────────────────────────────────────────
  cloudProviders: [],
  endpointPlatforms: [],
  operatingSystems: [],
  networkSegmentation: '',
  internetFacingSystems: [],
  criticalApps: '',
  onPremVsCloud: '',

  // ── Compliance & Risk ─────────────────────────────────────────────────
  complianceRequirements: [],
  dataTypes: [],
  dataSensitivity: '',
  remoteWorkLevel: '',
  thirdPartyDependence: '',
  recentIncidents: '',
  knownWeakSpots: '',
  securityGaps: '',

  // ── Threat Context ────────────────────────────────────────────────────
  topThreats: [],
  threatActorConcerns: [],
  criticalAssets: '',

  // ── Maturity ──────────────────────────────────────────────────────────
  loggingMaturity: '',
  detectionMaturity: '',
  vulnerabilityManagementMaturity: '',
  incidentResponseMaturity: '',
};

export const SAMPLE_COMPANY_PROFILE = {
  companyName: 'Acme Financial Services',
  industry: 'finance',
  businessType: 'Financial Services / Banking',
  companySize: '1000-5000',
  regions: ['us', 'eu'],
  websiteUrl: 'acmefinancial.com',

  siemPlatform: 'Microsoft Sentinel',
  edrPlatform: 'CrowdStrike Falcon',
  emailSecurityPlatform: 'Proofpoint',
  iamPlatform: 'Okta',
  emailPlatform: 'Microsoft 365',
  networkMonitoring: 'Darktrace',
  vulnerabilityManagement: 'Tenable',
  casb: 'Microsoft Defender for Cloud Apps',
  pamSolution: 'CyberArk',
  backupSolution: 'Veeam',

  cloudProviders: ['aws', 'azure'],
  endpointPlatforms: ['windows', 'macos'],
  operatingSystems: ['windows10', 'windows11', 'macos-monterey'],
  networkSegmentation: 'partial',
  internetFacingSystems: ['web-app', 'api-gateway', 'vpn', 'email'],
  criticalApps: 'Core banking system, payment processing platform, customer portal, trading platform',
  onPremVsCloud: 'hybrid',

  complianceRequirements: ['pci-dss', 'sox', 'gdpr'],
  dataTypes: ['financial', 'pii', 'payment-card'],
  dataSensitivity: 'high',
  remoteWorkLevel: 'partial',
  thirdPartyDependence: 'high',
  recentIncidents: 'Phishing campaign targeting finance team Q4 last year. One account temporarily compromised before detection.',
  knownWeakSpots: 'Legacy payment processing system with limited logging. Third-party integrations with broad API access.',
  securityGaps: 'Limited UEBA capability. No PAM for service accounts. Cloud security posture management gaps.',

  topThreats: ['ransomware', 'credential-theft', 'business-email-compromise', 'insider-threat'],
  threatActorConcerns: ['FIN7', 'LAZARUS', 'SCATTERED_SPIDER'],
  criticalAssets: 'Core banking databases, payment systems, executive email accounts, customer PII vault',

  loggingMaturity: 'intermediate',
  detectionMaturity: 'intermediate',
  vulnerabilityManagementMaturity: 'intermediate',
  incidentResponseMaturity: 'advanced',
};

// ── Select Options ───────────────────────────────────────────────────────────

export const INDUSTRY_OPTIONS = [
  { value: 'finance',         label: 'Finance & Banking' },
  { value: 'healthcare',      label: 'Healthcare & Life Sciences' },
  { value: 'technology',      label: 'Technology & Software' },
  { value: 'manufacturing',   label: 'Manufacturing & Industrial' },
  { value: 'retail',          label: 'Retail & E-Commerce' },
  { value: 'government',      label: 'Government & Public Sector' },
  { value: 'energy',          label: 'Energy & Utilities' },
  { value: 'education',       label: 'Education' },
  { value: 'defense',         label: 'Defense & Aerospace' },
  { value: 'legal',           label: 'Legal & Professional Services' },
  { value: 'insurance',       label: 'Insurance' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'media',           label: 'Media & Entertainment' },
  { value: 'hospitality',     label: 'Hospitality & Travel' },
  { value: 'pharmaceutical',  label: 'Pharmaceutical & Biotech' },
  { value: 'nonprofit',       label: 'Non-Profit & NGO' },
  { value: 'other',           label: 'Other' },
];

export const COMPANY_SIZE_OPTIONS = [
  { value: '1-50',        label: '1–50 employees (Startup)' },
  { value: '51-250',      label: '51–250 employees (SMB)' },
  { value: '251-1000',    label: '251–1,000 employees (Mid-market)' },
  { value: '1000-5000',   label: '1,000–5,000 employees (Enterprise)' },
  { value: '5000-25000',  label: '5,000–25,000 employees (Large Enterprise)' },
  { value: '25000+',      label: '25,000+ employees (Global Enterprise)' },
];

export const SIEM_OPTIONS = [
  { value: 'Microsoft Sentinel', label: 'Microsoft Sentinel' },
  { value: 'Splunk Enterprise',  label: 'Splunk Enterprise' },
  { value: 'Splunk Cloud',       label: 'Splunk Cloud' },
  { value: 'IBM QRadar',         label: 'IBM QRadar' },
  { value: 'Elastic SIEM',       label: 'Elastic SIEM' },
  { value: 'Sumo Logic',         label: 'Sumo Logic' },
  { value: 'Chronicle (Google)', label: 'Chronicle (Google)' },
  { value: 'Exabeam',            label: 'Exabeam' },
  { value: 'LogRhythm',          label: 'LogRhythm' },
  { value: 'ArcSight',           label: 'ArcSight' },
  { value: 'Devo',               label: 'Devo' },
  { value: 'none',               label: 'No SIEM' },
  { value: 'other',              label: 'Other' },
];

export const EDR_OPTIONS = [
  { value: 'CrowdStrike Falcon',      label: 'CrowdStrike Falcon' },
  { value: 'Microsoft Defender',      label: 'Microsoft Defender for Endpoint' },
  { value: 'SentinelOne',             label: 'SentinelOne' },
  { value: 'Carbon Black',            label: 'VMware Carbon Black' },
  { value: 'Palo Alto Cortex XDR',    label: 'Palo Alto Cortex XDR' },
  { value: 'Cybereason',              label: 'Cybereason' },
  { value: 'Trend Micro Apex One',    label: 'Trend Micro Apex One' },
  { value: 'Sophos Intercept X',      label: 'Sophos Intercept X' },
  { value: 'Cylance',                 label: 'Cylance' },
  { value: 'none',                    label: 'No EDR' },
  { value: 'other',                   label: 'Other' },
];

export const IAM_OPTIONS = [
  { value: 'Okta',                  label: 'Okta' },
  { value: 'Microsoft Entra ID',    label: 'Microsoft Entra ID (Azure AD)' },
  { value: 'Ping Identity',         label: 'Ping Identity' },
  { value: 'OneLogin',              label: 'OneLogin' },
  { value: 'Duo',                   label: 'Duo Security (Cisco)' },
  { value: 'JumpCloud',             label: 'JumpCloud' },
  { value: 'Google Workspace IAM',  label: 'Google Workspace IAM' },
  { value: 'Active Directory',      label: 'On-Prem Active Directory (No IdP)' },
  { value: 'other',                 label: 'Other' },
];

export const EMAIL_PLATFORM_OPTIONS = [
  { value: 'Microsoft 365',    label: 'Microsoft 365 (Exchange Online)' },
  { value: 'Google Workspace', label: 'Google Workspace (Gmail)' },
  { value: 'Exchange On-Prem', label: 'Exchange On-Premises' },
  { value: 'Proofpoint',       label: 'Proofpoint (SEG)' },
  { value: 'Mimecast',         label: 'Mimecast' },
  { value: 'other',            label: 'Other' },
];

export const CLOUD_PROVIDER_OPTIONS = [
  { value: 'aws',              label: 'Amazon Web Services (AWS)' },
  { value: 'azure',            label: 'Microsoft Azure' },
  { value: 'gcp',              label: 'Google Cloud Platform (GCP)' },
  { value: 'oracle',           label: 'Oracle Cloud' },
  { value: 'ibm',              label: 'IBM Cloud' },
  { value: 'salesforce',       label: 'Salesforce' },
  { value: 'none',             label: 'No Public Cloud (On-Prem Only)' },
];

export const OS_OPTIONS = [
  { value: 'windows10',       label: 'Windows 10' },
  { value: 'windows11',       label: 'Windows 11' },
  { value: 'windows-server',  label: 'Windows Server' },
  { value: 'macos',           label: 'macOS' },
  { value: 'rhel',            label: 'RHEL / CentOS / Rocky Linux' },
  { value: 'ubuntu',          label: 'Ubuntu / Debian' },
  { value: 'ios',             label: 'iOS (Mobile)' },
  { value: 'android',         label: 'Android (Mobile)' },
];

export const COMPLIANCE_OPTIONS = [
  { value: 'pci-dss',    label: 'PCI-DSS' },
  { value: 'hipaa',      label: 'HIPAA' },
  { value: 'sox',        label: 'SOX' },
  { value: 'gdpr',       label: 'GDPR' },
  { value: 'ccpa',       label: 'CCPA' },
  { value: 'iso27001',   label: 'ISO 27001' },
  { value: 'nist-csf',   label: 'NIST CSF' },
  { value: 'cmmc',       label: 'CMMC' },
  { value: 'fedramp',    label: 'FedRAMP' },
  { value: 'nydfs',      label: 'NYDFS' },
  { value: 'hitrust',    label: 'HITRUST' },
  { value: 'soc2',       label: 'SOC 2 Type II' },
];

export const DATA_TYPE_OPTIONS = [
  { value: 'pii',            label: 'Personally Identifiable Information (PII)' },
  { value: 'phi',            label: 'Protected Health Information (PHI)' },
  { value: 'payment-card',   label: 'Payment Card Data (PCI)' },
  { value: 'financial',      label: 'Financial Records' },
  { value: 'intellectual-property', label: 'Intellectual Property / Source Code' },
  { value: 'trade-secrets',  label: 'Trade Secrets' },
  { value: 'classified',     label: 'Classified / Government Data' },
  { value: 'employee',       label: 'Employee Data' },
  { value: 'customer',       label: 'Customer / Client Data' },
];

export const THREAT_OPTIONS = [
  { value: 'ransomware',              label: 'Ransomware' },
  { value: 'credential-theft',        label: 'Credential Theft' },
  { value: 'business-email-compromise', label: 'Business Email Compromise (BEC)' },
  { value: 'insider-threat',          label: 'Insider Threat' },
  { value: 'supply-chain',            label: 'Supply Chain Attack' },
  { value: 'nation-state',            label: 'Nation-State Espionage' },
  { value: 'cloud-breach',            label: 'Cloud Infrastructure Breach' },
  { value: 'phishing',                label: 'Phishing / Social Engineering' },
  { value: 'zero-day',                label: 'Zero-Day Exploitation' },
  { value: 'ddos',                    label: 'DDoS / Availability Attack' },
  { value: 'data-exfiltration',       label: 'Data Exfiltration' },
  { value: 'cryptomining',            label: 'Cryptomining / Resource Hijacking' },
];

export const MATURITY_LEVELS = [
  { value: 'none',         label: 'None — No capability in place' },
  { value: 'basic',        label: 'Basic — Minimal, reactive capability' },
  { value: 'intermediate', label: 'Intermediate — Defined processes, some automation' },
  { value: 'advanced',     label: 'Advanced — Proactive, well-tuned capability' },
  { value: 'optimized',    label: 'Optimized — Continuous improvement, metrics-driven' },
];

export const REGION_OPTIONS = [
  { value: 'us',          label: 'United States' },
  { value: 'eu',          label: 'European Union' },
  { value: 'uk',          label: 'United Kingdom' },
  { value: 'canada',      label: 'Canada' },
  { value: 'australia',   label: 'Australia / New Zealand' },
  { value: 'latam',       label: 'Latin America' },
  { value: 'apac',        label: 'Asia Pacific' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa',      label: 'Africa' },
];

export const INTERNET_FACING_OPTIONS = [
  { value: 'web-app',         label: 'Web Application' },
  { value: 'api-gateway',     label: 'API Gateway / REST API' },
  { value: 'vpn',             label: 'VPN Concentrator' },
  { value: 'email',           label: 'Email Gateway (MX)' },
  { value: 'rdp',             label: 'Remote Desktop (RDP)' },
  { value: 'sftp',            label: 'SFTP / File Transfer' },
  { value: 'dns',             label: 'DNS Servers' },
  { value: 'iot',             label: 'IoT / OT Devices' },
  { value: 'citrix',          label: 'Citrix / VDI' },
  { value: 'customer-portal', label: 'Customer Portal' },
];
