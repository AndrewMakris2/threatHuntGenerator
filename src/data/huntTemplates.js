/**
 * Hunt Template Library
 * These are the base templates from which tailored hunts are generated.
 * The hunt generation service selects and customizes these based on company profile.
 */

export const HUNT_CATEGORIES = [
  { id: 'identity',        label: 'Identity & Access',        icon: 'Key',          color: '#38bdf8' },
  { id: 'endpoint',        label: 'Endpoint Compromise',      icon: 'Monitor',      color: '#f97316' },
  { id: 'cloud',           label: 'Cloud Compromise',         icon: 'Cloud',        color: '#818cf8' },
  { id: 'email',           label: 'Email Intrusion',          icon: 'Mail',         color: '#2dd4bf' },
  { id: 'insider',         label: 'Insider Threat',           icon: 'UserX',        color: '#eab308' },
  { id: 'privilege-esc',   label: 'Privilege Escalation',     icon: 'TrendingUp',   color: '#ec4899' },
  { id: 'persistence',     label: 'Persistence',              icon: 'Anchor',       color: '#a855f7' },
  { id: 'lateral',         label: 'Lateral Movement',         icon: 'ArrowLeftRight',color: '#22c55e' },
  { id: 'exfiltration',    label: 'Data Exfiltration',        icon: 'Upload',       color: '#ef4444' },
  { id: 'ransomware',      label: 'Ransomware Precursors',    icon: 'Lock',         color: '#dc2626' },
  { id: 'initial-access',  label: 'Initial Access',           icon: 'DoorOpen',     color: '#fb923c' },
  { id: 'vuln-exploit',    label: 'Vulnerability Exploitation',icon: 'Bug',         color: '#f43f5e' },
  { id: 'web-abuse',       label: 'Web Application Abuse',    icon: 'Globe',        color: '#06b6d4' },
  { id: 'third-party',     label: 'Third-Party Compromise',   icon: 'Link',         color: '#84cc16' },
  { id: 'saas-abuse',      label: 'SaaS Abuse',               icon: 'Package',      color: '#f59e0b' },
  { id: 'remote-access',   label: 'Remote Access Abuse',      icon: 'Wifi',         color: '#10b981' },
  { id: 'admin-activity',  label: 'Suspicious Admin Activity',icon: 'Shield',       color: '#6366f1' },
  { id: 'cloud-iam',       label: 'Cloud IAM Abuse',          icon: 'UserCog',      color: '#8b5cf6' },
];

export const HUNT_TEMPLATES = [
  // ────────────────────────────────────────────────────────────────────────────
  // IDENTITY & ACCESS
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-001',
    title: 'Password Spray Against {iamPlatform} / {emailPlatform}',
    category: 'identity',
    severity: 'high',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    frequency: 'daily',
    maturityRequired: 'intermediate',
    mitreTechniques: ['T1110.003', 'T1078'],
    tags: ['credential-abuse', 'authentication', 'brute-force'],
    relevanceFactors: ['hasCloud', 'hasM365', 'hasEntraID', 'hasOkta'],
    baseRelevanceScore: 90,

    hypothesisTemplate: 'A threat actor is conducting low-and-slow password spray attacks against {iamPlatform} and {emailPlatform} authentication endpoints, attempting to compromise user accounts without triggering lockout policies.',

    whyRelevantTemplate: '{company} uses {iamPlatform} for identity management and {emailPlatform} for email, making authentication endpoints high-value targets. Password spraying is frequently used against organizations of similar size and industry.',

    dataSources: ['Authentication logs', 'Sign-in activity logs', 'Failed login events', 'MFA challenge logs'],
    recommendedLogSources: ['{siemPlatform}', '{iamPlatform} audit logs', 'Azure AD / Entra ID sign-in logs', 'Email gateway authentication logs'],
    recommendedTools: ['SIEM correlation rules', 'Azure AD Identity Protection', 'Identity threat detection query'],

    huntSteps: [
      'Collect authentication failure events from {iamPlatform} for the past 7 days',
      'Identify source IPs generating failed logins across 5 or more distinct accounts',
      'Filter events where failed logins per IP are spread across time intervals (low-and-slow pattern)',
      'Cross-reference source IPs against threat intelligence feeds',
      'Identify accounts that failed authentication then succeeded (potential compromise)',
      'Review MFA push/challenge activity for suspicious patterns',
      'Check for geo-impossible travel events following authentication success',
      'Verify if compromised accounts accessed sensitive resources post-authentication',
    ],

    exampleQueries: [
      {
        platform: 'KQL (Sentinel)',
        language: 'kql',
        query: `SigninLogs
| where TimeGenerated > ago(7d)
| where ResultType != 0
| summarize FailedAttempts = count(),
            DistinctUsers = dcount(UserPrincipalName),
            DistinctIPs = dcount(IPAddress)
    by IPAddress, bin(TimeGenerated, 1h)
| where DistinctUsers >= 5
| order by FailedAttempts desc`,
      },
      {
        platform: 'Splunk SPL',
        language: 'splunk',
        query: `index=authentication action=failure
| stats count as failures dc(user) as unique_users by src_ip _time
| where unique_users >= 5
| eval time_bucket=strftime(_time, "%Y-%m-%d %H")
| stats sum(failures) as total_failures dc(unique_users) as spray_breadth by src_ip time_bucket
| where spray_breadth >= 5
| sort -total_failures`,
      },
    ],

    suspiciousBehaviors: [
      'Single IP failing against 10+ accounts within 1 hour',
      'Consistent failure rate of 1 attempt per account every 30-60 minutes',
      'Failures targeting accounts in alphabetical or directory-ordered sequence',
      'Post-spray successful login from a previously unseen IP',
      'MFA push fatigue pattern (multiple MFA challenges to same user in minutes)',
    ],

    truePositiveIndicators: [
      'Source IP with no prior authentication history',
      'Authentication from foreign IP followed by access to sensitive data',
      'Account lockout bypass using valid credentials on first try',
      'New OAuth token issued to unrecognized application immediately after login',
    ],

    falsePositiveIndicators: [
      'Misconfigured shared service account with wrong password',
      'IT automation scripts with expired credentials',
      'Penetration testing or vulnerability scanning activity',
      'Load testing that includes authentication flows',
    ],

    triageGuidance: 'Prioritize accounts that had failed attempts followed by a successful login. Focus on accounts with admin privileges or access to sensitive data. Check for new device registration or MFA enrollment immediately after authentication.',

    escalationRecommendations: [
      'Escalate to Tier 2 if source IP matches known threat actor infrastructure',
      'Escalate immediately if admin accounts are targeted or compromised',
      'Engage Identity team if account takeover is confirmed',
      'Notify SOC leadership if spray targets 50+ accounts',
    ],

    remediationActions: [
      'Block identified spray IPs in firewall and conditional access policies',
      'Force password reset for targeted accounts',
      'Enable or strengthen MFA for all targeted accounts',
      'Implement named locations and conditional access policies',
      'Enable Identity Protection risky sign-in policies',
      'Review and revoke active sessions for suspected compromised accounts',
    ],

    businessImpact: 'Account compromise enables initial foothold for further intrusion, data theft, and potential ransomware deployment.',
    detectionGap: 'Low-and-slow sprays often evade per-user lockout policies. Geographic diversity of spray infrastructure can avoid geo-blocking.',
    suggestedFrequency: 'Daily automated detection + weekly manual review',
    confidence: 88,
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-002',
    title: 'MFA Fatigue / Push Bombing Attack Detection',
    category: 'identity',
    severity: 'critical',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours',
    frequency: 'daily',
    maturityRequired: 'basic',
    mitreTechniques: ['T1078', 'T1621'],
    tags: ['mfa', 'authentication', 'social-engineering'],
    relevanceFactors: ['hasCloud', 'hasEntraID', 'hasOkta', 'hasDuo'],
    baseRelevanceScore: 92,

    hypothesisTemplate: 'An attacker with valid credentials for a {company} account is flooding the user with MFA push notifications hoping the user will inadvertently approve the request (MFA fatigue / push bombing).',

    whyRelevantTemplate: 'MFA fatigue is one of the most effective account takeover vectors against organizations using push-based MFA. {company}\'s use of {iamPlatform} with push-based MFA makes this a high-priority hunt. This technique was used in Uber and MGM breaches.',

    dataSources: ['MFA/authenticator app logs', 'Identity provider audit logs', 'Sign-in activity logs'],
    recommendedLogSources: ['{iamPlatform} MFA logs', 'Azure AD / Entra ID authentication logs', 'Okta System Log', 'Duo Admin API logs'],
    recommendedTools: ['SIEM with correlation rules', 'Identity Protection policies', '{iamPlatform} anomaly detection'],

    huntSteps: [
      'Query MFA challenge events from {iamPlatform} for the past 24 hours',
      'Identify accounts receiving more than 5 MFA push challenges within 30 minutes',
      'Look for accounts where multiple denials preceded a single approval',
      'Correlate the approval event with the authenticating device and location',
      'Identify if the approving device is a new/unregistered device',
      'Check what actions were taken immediately after the MFA approval',
      'Review any new device enrollment or MFA method change post-approval',
    ],

    exampleQueries: [
      {
        platform: 'KQL (Sentinel)',
        language: 'kql',
        query: `SigninLogs
| where TimeGenerated > ago(1d)
| where AuthenticationRequirement == "multiFactorAuthentication"
| summarize TotalChallenges = count(),
            Denials = countif(ResultType == 500121),
            Approvals = countif(ResultType == 0)
    by UserPrincipalName, bin(TimeGenerated, 30m)
| where TotalChallenges >= 5 and Approvals >= 1 and Denials >= 3
| project UserPrincipalName, TotalChallenges, Denials, Approvals`,
      },
    ],

    suspiciousBehaviors: [
      'User receives 5+ MFA push requests within 30 minutes',
      'Multiple MFA denials followed by a single approval (fatigue capitulation)',
      'MFA challenge originates from IP never before seen for that user',
      'Post-approval activity occurs at unusual hours for the user',
      'New device registered or new MFA method enrolled after a push-bombing event',
    ],

    truePositiveIndicators: [
      'User reports not initiating login but receiving MFA push',
      'Login IP geolocates to a foreign country',
      'Immediate bulk email access or SharePoint download after approval',
    ],

    falsePositiveIndicators: [
      'User accidentally tapped approve, realized error, and denied subsequent pushes',
      'Misconfigured SSO application re-prompting MFA repeatedly',
    ],

    triageGuidance: 'Contact the user directly through an out-of-band channel (phone call) to confirm whether they initiated authentication. If unconfirmed, treat as compromise.',

    escalationRecommendations: [
      'Immediately revoke all active sessions for the account',
      'Escalate to Tier 2 for full account activity review',
      'Notify the Identity team and account owner\'s manager',
    ],

    remediationActions: [
      'Disable the compromised account temporarily',
      'Revoke all OAuth tokens and active sessions',
      'Switch to number matching or phishing-resistant MFA (FIDO2)',
      'Implement MFA fraud alerting policies',
      'Review and audit all actions taken post-MFA approval',
    ],

    businessImpact: 'Full account compromise with the same access level as the victim user, potentially including admin privileges and access to sensitive business data.',
    detectionGap: 'Standard lockout policies do not apply to MFA push flows, making this difficult to detect without dedicated MFA event monitoring.',
    suggestedFrequency: 'Real-time alerting + daily review',
    confidence: 95,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // CLOUD
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-003',
    title: 'Suspicious {cloudProvider} IAM Activity — Privilege Escalation',
    category: 'cloud',
    severity: 'critical',
    difficulty: 'advanced',
    estimatedTime: '3-4 hours',
    frequency: 'daily',
    maturityRequired: 'advanced',
    mitreTechniques: ['T1098.001', 'T1484', 'T1078.004', 'T1526'],
    tags: ['cloud', 'iam', 'privilege-escalation', 'aws', 'azure', 'gcp'],
    relevanceFactors: ['hasAWS', 'hasAzure', 'hasGCP'],
    baseRelevanceScore: 87,

    hypothesisTemplate: 'An attacker with initial access to {company}\'s {cloudProvider} environment is attempting to escalate privileges by creating new IAM roles, modifying existing policies, or abusing existing privileged identities to gain broader cloud access.',

    whyRelevantTemplate: '{company} operates infrastructure in {cloudProvider}, making cloud IAM abuse a high-priority concern. IAM privilege escalation is consistently one of the most common post-compromise cloud attack paths.',

    dataSources: ['Cloud provider audit logs', 'IAM event logs', 'CloudTrail / Activity Log / Audit Log'],
    recommendedLogSources: ['AWS CloudTrail', 'Azure Activity Log', 'GCP Cloud Audit Logs', '{siemPlatform} cloud connector'],
    recommendedTools: ['Pacu (AWS post-exploitation assessment)', 'ScoutSuite', 'CloudMapper', '{siemPlatform}'],

    huntSteps: [
      'Enable and ingest {cloudProvider} management plane audit logs into {siemPlatform}',
      'Query for IAM policy attachment events (AttachRolePolicy, SetIamPolicy, RoleAssignments)',
      'Identify any role/policy created with wildcard permissions (*)',
      'Look for IAM events outside business hours or from unexpected IP ranges',
      'Identify service accounts or machine identities performing human-like IAM changes',
      'Cross-reference IAM changes with active security incidents or change requests',
      'Hunt for AssumeRole or cross-account access events from unusual principals',
      'Check for any new admin user creation or admin group membership changes',
    ],

    exampleQueries: [
      {
        platform: 'AWS CloudTrail (KQL in Sentinel)',
        language: 'kql',
        query: `AWSCloudTrail
| where TimeGenerated > ago(24h)
| where EventName in ("AttachRolePolicy","CreateRole","PutRolePolicy","AddUserToGroup","CreateAccessKey","AssumeRole")
| where UserIdentityType != "Service"
| project TimeGenerated, EventName, UserIdentityArn, SourceIpAddress, RequestParameters
| order by TimeGenerated desc`,
      },
      {
        platform: 'Azure Activity Log',
        language: 'kql',
        query: `AzureActivity
| where TimeGenerated > ago(24h)
| where OperationNameValue has_any ("roleAssignments", "roleDefinitions", "addMember")
| where ActivityStatusValue == "Success"
| project TimeGenerated, Caller, OperationNameValue, ResourceGroup, Properties
| order by TimeGenerated desc`,
      },
    ],

    suspiciousBehaviors: [
      'IAM admin actions performed outside normal business hours',
      'New admin role attached to a user created within the same session',
      'Cross-account role assumption from an unexpected external account',
      'Service account performing IAM policy changes typically done by humans',
      'Wildcard (*) permissions granted to a non-privileged identity',
      'API key or access key created immediately after account compromise',
    ],

    truePositiveIndicators: [
      'IAM event source IP matches threat actor infrastructure',
      'Role creation immediately followed by sensitive API calls',
      'New admin account with no corresponding HR or ITSM change request',
    ],

    falsePositiveIndicators: [
      'Infrastructure-as-code pipelines (Terraform, CloudFormation) making expected IAM changes',
      'Authorized cloud migration activity',
      'Routine DevOps deployments with proper change management',
    ],

    triageGuidance: 'Correlate every IAM change with your change management system. Any IAM change without a corresponding approved ticket should be treated as suspicious until cleared.',

    escalationRecommendations: [
      'Escalate immediately if admin-level access was granted without change ticket',
      'Notify Cloud Security team and business owner of affected resources',
      'Engage AWS/Azure/GCP trust and safety if external actor is suspected',
    ],

    remediationActions: [
      'Immediately revoke unauthorized IAM roles/policies',
      'Rotate all access keys created during suspicious window',
      'Enable CloudTrail/Activity Log alerting for all IAM changes',
      'Implement just-in-time (JIT) access for privileged cloud roles',
      'Enforce least-privilege IAM policies with automated review',
      'Enable AWS Config / Azure Policy for IAM drift detection',
    ],

    businessImpact: 'Unrestricted cloud access can lead to full environment compromise, data exfiltration, resource hijacking for cryptomining, or destruction of infrastructure.',
    detectionGap: 'IAM changes made by legitimate-looking service principals are difficult to distinguish from authorized automation.',
    suggestedFrequency: 'Real-time alerting + daily review',
    confidence: 85,
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-004',
    title: 'Cloud Storage Exfiltration — Anomalous Data Access in {cloudProvider}',
    category: 'exfiltration',
    severity: 'critical',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    frequency: 'weekly',
    maturityRequired: 'intermediate',
    mitreTechniques: ['T1530', 'T1567.002', 'T1048'],
    tags: ['cloud', 'exfiltration', 's3', 'blob-storage', 'data-theft'],
    relevanceFactors: ['hasAWS', 'hasAzure', 'hasGCP', 'handlesHighSensitivityData'],
    baseRelevanceScore: 88,

    hypothesisTemplate: 'An attacker or malicious insider is exfiltrating data from {company}\'s {cloudProvider} storage (S3/Blob/GCS) by either making buckets public, bulk-downloading data, or replicating data to an external account.',

    whyRelevantTemplate: '{company} stores {dataTypes} in {cloudProvider}, making cloud storage a high-value exfiltration target. Data exfiltration via cloud storage is a top vector for {targetedThreatActors}.',

    dataSources: ['Cloud storage access logs', 'S3 server access logs', 'Azure Storage analytics logs', 'GCS data access audit logs'],
    recommendedLogSources: ['AWS S3 Access Logs / CloudTrail S3 events', 'Azure Storage diagnostic logs', '{siemPlatform} cloud integration'],
    recommendedTools: ['Macie (AWS)', 'Microsoft Purview', 'Cloud DLP solutions', '{siemPlatform}'],

    huntSteps: [
      'Ingest {cloudProvider} storage access logs into {siemPlatform}',
      'Establish baseline of normal download volume per principal per day',
      'Alert on download volumes exceeding 3x the 30-day baseline',
      'Hunt for bucket/container ACL changes that allow public access',
      'Identify cross-account or cross-subscription data copy operations',
      'Look for new external sharing or presigned URL generation spikes',
      'Check for data access at unusual hours from unusual IPs',
      'Identify users accessing data stores they have never accessed before',
    ],

    exampleQueries: [
      {
        platform: 'AWS CloudTrail KQL',
        language: 'kql',
        query: `AWSCloudTrail
| where TimeGenerated > ago(7d)
| where EventName in ("GetObject","ListBucket","GetBucketAcl","PutBucketAcl","CopyObject")
| summarize OperationCount = count(),
            TotalDataMB = sum(todouble(ResponseElements))
    by UserIdentityArn, BucketName = tostring(RequestParameters.bucketName), bin(TimeGenerated, 1h)
| where OperationCount > 500
| order by OperationCount desc`,
      },
    ],

    suspiciousBehaviors: [
      'Single principal downloading > 1 GB of data in under 1 hour',
      'Storage bucket ACL changed to allow public read access',
      'GetObject requests from a new, unrecognized IP or country',
      'Bulk ListBucket operations followed immediately by mass GetObject',
      'Cross-account replication configured to an unknown external account',
    ],

    truePositiveIndicators: [
      'Data access from IP geolocating to sanctioned country or threat actor ASN',
      'Access to buckets containing PII, PHI, or financial data by unexpected principal',
      'Presigned URL generation for bulk object download to unknown external party',
    ],

    falsePositiveIndicators: [
      'Authorized data pipeline or ETL jobs with high-volume access',
      'Backup and DR replication to another owned account',
      'Marketing or analytics export jobs',
    ],

    triageGuidance: 'Correlate the accessing principal with HR records and job function. If the principal has no business reason to access the data, treat as insider threat or compromised account.',

    escalationRecommendations: [
      'Escalate to Data Protection Officer if regulated data (PII, PHI, PCI) is involved',
      'Notify Legal if potential data breach notification obligations apply',
      'Engage cloud provider support if cross-account exfiltration is confirmed',
    ],

    remediationActions: [
      'Revoke the principal\'s access immediately if unauthorized exfiltration is confirmed',
      'Enable S3 Block Public Access / Azure Defender for Storage',
      'Implement DLP controls on cloud storage',
      'Enable Macie or equivalent DLP scanning',
      'Review and restrict cross-account access',
      'Implement data residency controls',
    ],

    businessImpact: 'Potential regulatory breach notification obligations, competitive disadvantage from IP theft, reputational damage, and customer data compromise.',
    detectionGap: 'Large authorized data pipelines can mask malicious exfiltration without behavioral baselining.',
    suggestedFrequency: 'Daily automated + weekly deep-dive',
    confidence: 83,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ENDPOINT
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-005',
    title: 'Living-Off-the-Land (LOLBAS) Execution on {endpointPlatform} Endpoints',
    category: 'endpoint',
    severity: 'high',
    difficulty: 'advanced',
    estimatedTime: '3-4 hours',
    frequency: 'weekly',
    maturityRequired: 'advanced',
    mitreTechniques: ['T1218', 'T1059.001', 'T1059.003', 'T1047'],
    tags: ['endpoint', 'lolbas', 'powershell', 'evasion', 'windows'],
    relevanceFactors: ['hasWindows', 'hasCrowdStrike', 'hasSentinelOne', 'hasCarbonBlack'],
    baseRelevanceScore: 82,

    hypothesisTemplate: 'A threat actor with foothold on {company}\'s Windows endpoints is using built-in Windows binaries (LOLBAS) to execute malicious code, bypass application allowlisting, and evade detection by {edrPlatform}.',

    whyRelevantTemplate: '{company}\'s use of Windows endpoints and {edrPlatform} as the EDR solution means that LOLBAS techniques are a high-value evasion path. These techniques are used by APT groups and ransomware affiliates to blend in with legitimate admin activity.',

    dataSources: ['Endpoint process creation logs', 'Command-line argument logs', 'PowerShell script block logging', 'Sysmon logs'],
    recommendedLogSources: ['{edrPlatform} process telemetry', '{siemPlatform} endpoint logs', 'Windows Event ID 4688, 4104, 7045'],
    recommendedTools: ['{edrPlatform}', 'Sysmon', 'LOLBAS project reference (lolbas-project.github.io)', '{siemPlatform}'],

    huntSteps: [
      'Enable PowerShell Script Block Logging (Event ID 4104) if not already active',
      'Query {edrPlatform} for executions of known LOLBAS binaries: certutil, regsvr32, rundll32, mshta, wscript, cscript, msiexec, bitsadmin',
      'Hunt for PowerShell with encoded commands (EncodedCommand/-enc parameter)',
      'Identify processes spawning from unusual parent processes (e.g., Word spawning PowerShell)',
      'Hunt for PowerShell making outbound network connections',
      'Look for WMI process creation from non-admin users',
      'Identify certutil.exe downloading files from the internet',
      'Hunt for regsvr32.exe executing scripts from remote URLs (squiblydoo)',
    ],

    exampleQueries: [
      {
        platform: 'KQL (Sentinel / Defender)',
        language: 'kql',
        query: `DeviceProcessEvents
| where TimeGenerated > ago(7d)
| where FileName in~ ("certutil.exe","regsvr32.exe","mshta.exe","wscript.exe","cscript.exe","rundll32.exe","bitsadmin.exe")
| where ProcessCommandLine has_any ("http://","https://","ftp://","urlcache","scrobj","javascript","vbscript")
| project TimeGenerated, DeviceName, AccountName, FileName, ProcessCommandLine, InitiatingProcessFileName
| order by TimeGenerated desc`,
      },
      {
        platform: 'CrowdStrike Falcon Query (FQL)',
        language: 'splunk',
        query: `event_platform=Win event_simpleName=ProcessRollup2
| search FileName IN (certutil.exe, regsvr32.exe, mshta.exe, bitsadmin.exe)
| search CommandLine=*http*
| table _time ComputerName UserName FileName CommandLine ParentBaseFileName`,
      },
    ],

    suspiciousBehaviors: [
      'certutil.exe with -urlcache -split -f arguments downloading remote files',
      'PowerShell with base64 encoded commands (-EncodedCommand)',
      'Office applications spawning PowerShell, cmd.exe, or wscript.exe',
      'regsvr32.exe executing /s /n /u /i:URL scrobj.dll (squiblydoo)',
      'WMI spawning child processes for lateral movement',
      'msiexec.exe installing packages from remote URLs',
    ],

    truePositiveIndicators: [
      'LOLBAS execution followed by outbound C2 callback',
      'Encoded PowerShell decodes to known malware stager',
      'Parent-child process chain matches known malware family behavior',
    ],

    falsePositiveIndicators: [
      'Authorized IT management tools using certutil for certificate operations',
      'ConfigMgr/SCCM using msiexec for software deployment',
      'Security tools using PowerShell for scanning and remediation',
    ],

    triageGuidance: 'Decode any base64-encoded PowerShell immediately. Analyze the parent process chain. If Office applications are spawning cmd.exe or PowerShell, escalate — this is a strong indicator of macro or phishing payload execution.',

    escalationRecommendations: [
      'Escalate to Tier 2 immediately if LOLBAS execution leads to network connections',
      'Isolate the endpoint if active C2 communication is detected',
      'Notify IR team if ransomware precursor behavior is observed',
    ],

    remediationActions: [
      'Isolate affected endpoint immediately',
      'Block identified C2 IPs/domains at network layer',
      'Enable application control policies for LOLBAS binaries',
      'Enable PowerShell Constrained Language Mode',
      'Implement attack surface reduction (ASR) rules in Defender',
      'Force antivirus scan and forensic imaging of endpoint',
    ],

    businessImpact: 'Foothold on endpoint provides attacker with access to user credentials, sensitive files, and a pivot point for lateral movement across the network.',
    detectionGap: 'LOLBAS techniques abuse trusted system binaries which are often allowlisted by security tools.',
    suggestedFrequency: 'Real-time EDR alerting + weekly manual hunt',
    confidence: 87,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // EMAIL
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-006',
    title: 'Business Email Compromise — Suspicious Inbox Rules and Forwarding',
    category: 'email',
    severity: 'high',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours',
    frequency: 'daily',
    maturityRequired: 'basic',
    mitreTechniques: ['T1114.002', 'T1098'],
    tags: ['email', 'bec', 'inbox-rules', 'forwarding', 'm365'],
    relevanceFactors: ['hasM365', 'hasGSuite', 'hasEmailSecurity'],
    baseRelevanceScore: 91,

    hypothesisTemplate: 'A threat actor who has compromised a {emailPlatform} account at {company} has created malicious inbox rules to hide evidence of their access, forward emails to an external address, or suppress security alerts.',

    whyRelevantTemplate: 'Business Email Compromise (BEC) is one of the highest financial impact threats facing organizations. {company}\'s use of {emailPlatform} makes inbox rule manipulation a key post-compromise indicator to hunt for. BEC attacks frequently target finance, HR, and executive accounts.',

    dataSources: ['Email platform audit logs', 'Mailbox audit logs', 'Inbox rule change events'],
    recommendedLogSources: ['{emailPlatform} audit logs', 'Microsoft 365 Unified Audit Log', 'Purview Compliance Center', '{siemPlatform}'],
    recommendedTools: ['Microsoft 365 Defender', 'Hawk (M365 forensics tool)', '{siemPlatform}', 'PowerShell Get-InboxRule'],

    huntSteps: [
      'Query {emailPlatform} audit logs for inbox rule creation events in the past 30 days',
      'Filter for rules that forward email to external domains',
      'Hunt for rules that delete or move emails containing keywords: invoice, payment, wire, bank, credentials',
      'Identify rules created from an unfamiliar IP or during non-business hours',
      'Check for auto-forwarding enabled at the mailbox level (not just rule-based)',
      'Identify rules created by admin impersonation or delegated access',
      'Cross-reference rule creation with failed/successful logins from same source',
      'Review OAuth application consent grants from the same time window',
    ],

    exampleQueries: [
      {
        platform: 'M365 Unified Audit Log (KQL)',
        language: 'kql',
        query: `OfficeActivity
| where TimeGenerated > ago(30d)
| where Operation in ("New-InboxRule","Set-InboxRule","UpdateInboxRules")
| extend RuleDetails = parse_json(Parameters)
| where RuleDetails has_any ("ForwardTo","RedirectTo","DeleteMessage","MoveToFolder")
| where RuleDetails has "@" // external forwarding indicator
| project TimeGenerated, UserId, Operation, ClientIPAddress, RuleDetails
| order by TimeGenerated desc`,
      },
    ],

    suspiciousBehaviors: [
      'Inbox rule created to forward all email to external Gmail/ProtonMail address',
      'Rule deleting emails with keywords like "password reset", "MFA", "security alert"',
      'Rule created from an IP that has never authenticated before',
      'Auto-forward enabled at domain level for non-service accounts',
      'Multiple rules created within seconds (scripted access)',
    ],

    truePositiveIndicators: [
      'External forwarding domain not owned by company or known partner',
      'Rule creation from IP in threat actor-associated ASN',
      'Finance or executive mailbox targeted with deletion rules hiding payment-related emails',
    ],

    falsePositiveIndicators: [
      'Legitimate assistant delegation with authorized forwarding',
      'Authorized email archiving or backup solutions',
      'IT-created rules for shared mailboxes and service accounts',
    ],

    triageGuidance: 'Review the rule definition in full. Pay particular attention to forwarding addresses — validate they are company-owned or authorized partner domains. Any personal email forwarding (Gmail, Yahoo, ProtonMail) from a business account is high severity.',

    escalationRecommendations: [
      'Escalate immediately if financial accounts (CFO, AP/AR) are involved',
      'Notify account owner through out-of-band channel to confirm legitimacy',
      'Engage Legal if financial fraud is suspected',
    ],

    remediationActions: [
      'Delete malicious inbox rules immediately',
      'Disable auto-forwarding at the organization level',
      'Reset credentials and revoke all active sessions',
      'Review all emails received and sent during the compromise window',
      'Notify Finance and IT leadership',
      'Implement outbound email DLP policies',
    ],

    businessImpact: 'BEC attacks result in direct financial losses (wire fraud), sensitive data disclosure, and reputational damage. Average BEC loss exceeds $120,000 per incident.',
    detectionGap: 'Inbox rules are often not monitored and can persist for months before detection.',
    suggestedFrequency: 'Daily automated scan + immediate alerting on new external forwarding rules',
    confidence: 93,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // RANSOMWARE PRECURSORS
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-007',
    title: 'Ransomware Precursor Activity — Shadow Copy Deletion and Backup Tampering',
    category: 'ransomware',
    severity: 'critical',
    difficulty: 'beginner',
    estimatedTime: '1-2 hours',
    frequency: 'real-time',
    maturityRequired: 'basic',
    mitreTechniques: ['T1490', 'T1059.003', 'T1059.001', 'T1486'],
    tags: ['ransomware', 'shadow-copies', 'backup', 'impact', 'windows'],
    relevanceFactors: ['hasWindows', 'hasBackupSolution', 'isHighRiskIndustry'],
    baseRelevanceScore: 95,

    hypothesisTemplate: 'A ransomware affiliate operating in {company}\'s environment is preparing to deploy ransomware by deleting shadow copies and backup snapshots to prevent recovery, following the established pre-ransom playbook.',

    whyRelevantTemplate: 'Shadow copy deletion is a near-universal ransomware precursor that typically occurs 1-24 hours before payload deployment. Early detection at this stage can prevent the ransomware deployment itself. {company} is in an industry frequently targeted by ransomware groups.',

    dataSources: ['Windows Event Logs', 'EDR process telemetry', 'Command line audit logs', 'VSS event logs'],
    recommendedLogSources: ['Windows Security Event Log (4688)', '{edrPlatform} process telemetry', 'Sysmon Event ID 1', '{siemPlatform}'],
    recommendedTools: ['{edrPlatform}', '{siemPlatform}', 'WDAC / AppLocker for prevention'],

    huntSteps: [
      'Query {edrPlatform} and {siemPlatform} for vssadmin, wmic, and bcdedit usage',
      'Hunt for the specific command: "vssadmin delete shadows /all /quiet"',
      'Hunt for: "wmic shadowcopy delete", "bcdedit /set recoveryenabled No"',
      'Hunt for mass file rename or extension change events across multiple directories',
      'Look for wbadmin.exe deleting backups',
      'Identify WMIC or PowerShell commands enumerating domain controllers',
      'Hunt for network scanning tools (nmap, Advanced Port Scanner, BloodHound) being executed',
      'Cross-reference with any recent login anomalies or lateral movement indicators',
    ],

    exampleQueries: [
      {
        platform: 'KQL (Defender / Sentinel)',
        language: 'kql',
        query: `DeviceProcessEvents
| where TimeGenerated > ago(1d)
| where ProcessCommandLine has_any (
    "vssadmin delete shadows",
    "wmic shadowcopy delete",
    "bcdedit /set",
    "recoveryenabled No",
    "wbadmin delete catalog",
    "disableremediation"
  )
| project TimeGenerated, DeviceName, AccountName, ProcessCommandLine, InitiatingProcessFileName
| order by TimeGenerated desc`,
      },
      {
        platform: 'Splunk SPL',
        language: 'splunk',
        query: `index=endpoint sourcetype=XmlWinEventLog:Microsoft-Windows-Sysmon/Operational EventID=1
| search CommandLine="*vssadmin*delete*" OR CommandLine="*shadowcopy delete*" OR CommandLine="*bcdedit*recoveryenabled*"
| table _time Computer User CommandLine ParentCommandLine
| sort -_time`,
      },
    ],

    suspiciousBehaviors: [
      'vssadmin.exe invoked with "delete shadows /all" parameters',
      'bcdedit.exe used to disable recovery options',
      'wbadmin.exe deleting backup catalogs',
      'Mass file extension changes across shared drives (rename to .locked, .enc, etc.)',
      'RDP or PsExec used to propagate to multiple hosts rapidly',
      'Domain controller enumeration immediately preceding above activity',
    ],

    truePositiveIndicators: [
      'Shadow copy deletion from a non-admin workstation',
      'VSS activity with no corresponding scheduled backup maintenance window',
      'Same commands executed across multiple endpoints in rapid succession',
    ],

    falsePositiveIndicators: [
      'Authorized backup maintenance scripts running during maintenance windows',
      'Disk management tools used by IT operations for space reclamation',
    ],

    triageGuidance: 'This is a critical finding — treat as active incident response, not standard triage. Immediately notify IR team and begin containment procedures. Time is critical — ransomware deployment may be imminent.',

    escalationRecommendations: [
      'IMMEDIATELY escalate to IR team and management',
      'Initiate incident response plan',
      'Consider emergency isolation of affected systems',
      'Alert backup and DR team to protect remaining backups',
    ],

    remediationActions: [
      'Isolate affected endpoints immediately',
      'Identify and isolate the patient zero host',
      'Disconnect network segments if lateral movement is active',
      'Protect remaining backups by isolating backup infrastructure',
      'Begin forensic preservation of affected systems',
      'Engage external IR firm if internal capacity is insufficient',
    ],

    businessImpact: 'Ransomware deployment can result in complete business disruption, recovery costs averaging $1.8M, regulatory fines, and reputational damage.',
    detectionGap: 'By the time ransomware executes, shadow copies are already deleted. This hunt must run in real-time to be effective.',
    suggestedFrequency: 'Real-time detection — this should be an automated alert, not a periodic hunt',
    confidence: 97,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // INSIDER THREAT
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-008',
    title: 'Insider Data Staging and Exfiltration via {dataChannel}',
    category: 'insider',
    severity: 'high',
    difficulty: 'intermediate',
    estimatedTime: '2-4 hours',
    frequency: 'weekly',
    maturityRequired: 'intermediate',
    mitreTechniques: ['T1213', 'T1567', 'T1048', 'T1078'],
    tags: ['insider-threat', 'data-exfiltration', 'dlp', 'ueba'],
    relevanceFactors: ['hasHighEmployeeTurnover', 'handlesHighSensitivityData', 'hasRemoteWork'],
    baseRelevanceScore: 78,

    hypothesisTemplate: 'A current or departing employee at {company} is staging sensitive data prior to exfiltration via personal cloud storage, email to personal accounts, USB transfer, or other unauthorized data channels.',

    whyRelevantTemplate: 'Insider threats represent a significant risk for organizations of {company}\'s size and data sensitivity. Remote work environments and cloud collaboration tools create additional exfiltration vectors that are difficult to monitor without proper DLP controls.',

    dataSources: ['DLP solution logs', 'Email gateway logs', 'Endpoint activity logs', 'Cloud storage access logs', 'Web proxy logs'],
    recommendedLogSources: ['{siemPlatform}', 'Microsoft Purview / DLP alerts', '{emailPlatform} audit logs', '{edrPlatform} USB events', 'Web proxy logs'],
    recommendedTools: ['Microsoft Purview', 'Varonis', '{edrPlatform}', 'CASB solution', '{siemPlatform}'],

    huntSteps: [
      'Query DLP solution for policy violations in the past 30 days',
      'Identify employees accessing significantly more data than their 90-day baseline',
      'Hunt for email sent to personal email domains (gmail, yahoo, hotmail, protonmail)',
      'Identify mass file downloads from SharePoint, OneDrive, or Google Drive',
      'Look for large file attachments sent via email near end of employment period',
      'Query endpoint logs for USB device insertion events followed by file copy',
      'Hunt for use of personal cloud storage (Dropbox, Box personal, Google Drive personal)',
      'Cross-reference with HR data: termination notices, PIP status, resignation dates',
    ],

    exampleQueries: [
      {
        platform: 'M365 Audit Log',
        language: 'kql',
        query: `OfficeActivity
| where TimeGenerated > ago(30d)
| where Operation in ("FileCopied","FileDownloaded","SharingInvitationCreated")
| extend Recipient = tostring(parse_json(Parameters).Sharing.SharedWithEmail)
| where Recipient has_any ("gmail.com","yahoo.com","hotmail.com","protonmail.com","outlook.com")
| where Recipient !endswith "{companyDomain}"
| project TimeGenerated, UserId, Operation, OfficeObjectId, Recipient
| order by TimeGenerated desc`,
      },
    ],

    suspiciousBehaviors: [
      'User downloads 10x more files than their 90-day average in a single week',
      'Large email attachments sent to personal email accounts',
      'USB device inserted and files copied, particularly on last days of employment',
      'Access to files outside normal job function (e.g., HR accessing financial data)',
      'Mass SharePoint download of departmental file shares',
      'Cloud sync client installed on endpoint without IT authorization',
    ],

    truePositiveIndicators: [
      'File names containing sensitive keywords (confidential, secret, proprietary, client data) sent externally',
      'User is on a PIP or known resignation with data access spike',
      'Files accessed belong to a project the user is not assigned to',
    ],

    falsePositiveIndicators: [
      'Authorized remote work file access from personal device',
      'IT-authorized cloud sync for legitimate business purposes',
      'User emailing themselves work files for authorized remote work',
    ],

    triageGuidance: 'Correlate data access anomalies with HR records. Do not confront the user until evidence is collected and HR/Legal have been engaged. Document all evidence carefully for potential legal proceedings.',

    escalationRecommendations: [
      'Engage HR and Legal before taking any action against the employee',
      'Notify management and CISO',
      'Preserve all digital evidence immediately',
    ],

    remediationActions: [
      'Preserve evidence according to legal hold procedures',
      'Coordinate with HR and Legal on disciplinary action',
      'Revoke access to sensitive systems while investigation proceeds',
      'Implement data classification and DLP policies to prevent future incidents',
      'Conduct exit interview procedures to reinforce data obligations',
    ],

    businessImpact: 'IP theft, customer data disclosure, competitive disadvantage, regulatory violations, and potential legal liability.',
    detectionGap: 'Authorized data access makes insider threat detection difficult without UEBA behavioral baselining.',
    suggestedFrequency: 'Weekly automated DLP review + triggered review for high-risk HR events',
    confidence: 74,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // LATERAL MOVEMENT
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-009',
    title: 'Lateral Movement via Pass-the-Hash / PsExec on {networkSegment}',
    category: 'lateral',
    severity: 'critical',
    difficulty: 'advanced',
    estimatedTime: '3-5 hours',
    frequency: 'weekly',
    maturityRequired: 'advanced',
    mitreTechniques: ['T1550.002', 'T1021.002', 'T1021.001', 'T1570'],
    tags: ['lateral-movement', 'pass-the-hash', 'psexec', 'smb', 'windows'],
    relevanceFactors: ['hasWindows', 'hasOnPrem', 'hasActiveDirectory'],
    baseRelevanceScore: 83,

    hypothesisTemplate: 'A threat actor with credentials harvested from an initial foothold is moving laterally across {company}\'s Windows environment using pass-the-hash, PsExec, or SMB lateral movement techniques.',

    whyRelevantTemplate: '{company}\'s on-premises Active Directory environment presents lateral movement opportunities for attackers who have obtained NTLM hashes or credentials. Lateral movement is a critical phase between initial access and impact.',

    dataSources: ['Windows Security Event Logs', 'EDR network telemetry', 'Network flow data', 'Authentication logs'],
    recommendedLogSources: ['Windows Event IDs: 4624, 4648, 4768, 4769, 4776', '{edrPlatform} network events', 'Network detection (NDR) platform', '{siemPlatform}'],
    recommendedTools: ['{edrPlatform}', 'Zeek / network monitoring', 'Velociraptor', '{siemPlatform}'],

    huntSteps: [
      'Hunt for Event ID 4624 with LogonType 3 (network logon) from workstation-to-workstation connections',
      'Identify hosts that are authenticating to an abnormally high number of other hosts',
      'Look for NTLM authentication events (LogonType 3) to admin shares (C$, ADMIN$)',
      'Hunt for PsExec indicators: PSEXESVC service installation (Event ID 7045)',
      'Identify use of admin tools (PsExec, WMI, sc.exe) from non-admin workstations',
      'Detect SMB connections from workstations to other workstations (workstation-to-workstation SMB is unusual)',
      'Hunt for Mimikatz indicators in memory or command line',
      'Identify accounts authenticating to many hosts within a short time window',
    ],

    exampleQueries: [
      {
        platform: 'KQL (Sentinel)',
        language: 'kql',
        query: `SecurityEvent
| where TimeGenerated > ago(24h)
| where EventID == 4624
| where LogonType == 3  // Network logon
| where WorkstationName != TargetComputerName  // Not looping to itself
| where not(TargetUserName endswith "$")  // Exclude machine accounts
| summarize DestinationHosts = dcount(TargetComputerName),
            LogonCount = count()
    by TargetUserName, WorkstationName, bin(TimeGenerated, 1h)
| where DestinationHosts >= 5  // Single user auth to 5+ hosts in 1hr
| order by DestinationHosts desc`,
      },
    ],

    suspiciousBehaviors: [
      'Single account authenticating to 5+ hosts in under 1 hour',
      'PSEXESVC service created on a host (PsExec indicator)',
      'NTLM auth to C$ or ADMIN$ admin shares from workstations',
      'WMI remote process creation across multiple hosts',
      'Lateral movement targeting domain controllers specifically',
    ],

    truePositiveIndicators: [
      'Source host has no authorized management function',
      'Authentication using NTLM when Kerberos is preferred (hash use indicator)',
      'Movement chain tracing back to known compromised host',
    ],

    falsePositiveIndicators: [
      'Authorized RMM tools (SCCM, Ansible, Puppet) making network connections',
      'IT admin performing authorized maintenance across multiple systems',
      'Security scanning tools',
    ],

    triageGuidance: 'Map the full authentication chain from patient zero. Identify all hosts that have been accessed. Assume all accessed hosts are compromised until proven otherwise.',

    escalationRecommendations: [
      'Escalate to Tier 3 / IR team immediately',
      'Identify and isolate patient zero',
      'Assess scope of lateral movement before containment to avoid tipping off attacker',
    ],

    remediationActions: [
      'Implement network segmentation to prevent workstation-to-workstation SMB',
      'Deploy Credential Guard to prevent hash harvesting',
      'Enable Protected Users security group for privileged accounts',
      'Disable NTLM where possible and enforce Kerberos',
      'Implement Local Admin Password Solution (LAPS)',
    ],

    businessImpact: 'Lateral movement allows attacker to expand from a single compromised host to entire domain/environment, exponentially increasing impact.',
    detectionGap: 'Authorized admin tools create significant noise that masks malicious lateral movement without behavioral baselining.',
    suggestedFrequency: 'Daily automated detection + weekly manual investigation',
    confidence: 86,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // OAUTH / SAAS ABUSE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-010',
    title: 'OAuth Application Abuse and Illicit Consent Grants in {emailPlatform}',
    category: 'saas-abuse',
    severity: 'high',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    frequency: 'weekly',
    maturityRequired: 'intermediate',
    mitreTechniques: ['T1528', 'T1098', 'T1539'],
    tags: ['oauth', 'consent-phishing', 'saas', 'm365', 'google-workspace'],
    relevanceFactors: ['hasM365', 'hasGSuite', 'hasCloud'],
    baseRelevanceScore: 84,

    hypothesisTemplate: 'A threat actor has used consent phishing to trick a {company} user into granting a malicious third-party OAuth application access to their {emailPlatform} account, allowing persistent access without valid credentials.',

    whyRelevantTemplate: 'OAuth consent grant attacks bypass MFA entirely. Once an app is granted access, it persists even after password resets. Organizations using {emailPlatform} without OAuth app governance controls are highly vulnerable.',

    dataSources: ['OAuth consent grant logs', 'Application access logs', 'Azure AD enterprise apps', 'Google Workspace token audit'],
    recommendedLogSources: ['{emailPlatform} audit logs', 'Azure AD sign-in logs', 'Microsoft Cloud App Security', '{siemPlatform}'],
    recommendedTools: ['Microsoft Defender for Cloud Apps (MCAS)', 'ROADTools', 'AADInternals', '{siemPlatform}'],

    huntSteps: [
      'Export all third-party OAuth app consent grants from the past 90 days',
      'Identify apps granted high-permission scopes: mail.read, files.read.all, calendars.read',
      'Flag apps not published by Microsoft, Google, or recognized vendors',
      'Hunt for apps with suspicious names or publisher information',
      'Identify apps that accessed data immediately after consent (automated access = automated attacker)',
      'Look for consent grants from users in finance, HR, or executive roles',
      'Hunt for new OAuth token issuances following a phishing campaign detection',
      'Review apps with access to multiple user accounts (admin consent vs user consent)',
    ],

    exampleQueries: [
      {
        platform: 'Azure AD Audit Log (KQL)',
        language: 'kql',
        query: `AuditLogs
| where TimeGenerated > ago(90d)
| where OperationName == "Consent to application"
| extend AppName = tostring(TargetResources[0].displayName)
| extend ConsentedBy = tostring(InitiatedBy.user.userPrincipalName)
| extend Scopes = tostring(AdditionalDetails)
| where Scopes has_any ("Mail.Read","Files.ReadWrite.All","Contacts.Read","Calendars.ReadWrite")
| project TimeGenerated, AppName, ConsentedBy, Scopes, IPAddress
| order by TimeGenerated desc`,
      },
    ],

    suspiciousBehaviors: [
      'OAuth app with mail.read scope granted by a non-IT user',
      'App with an unusual or misspelled publisher name (e.g., "Micros0ft")',
      'App consented to from a phishing-related IP',
      'Immediate bulk mail read access after consent (automated access)',
      'App accesses data outside normal business hours consistently',
    ],

    truePositiveIndicators: [
      'App publisher cannot be verified as legitimate',
      'App permissions exceed what is needed for stated functionality',
      'App was consented during or immediately after a phishing campaign',
    ],

    falsePositiveIndicators: [
      'Authorized integration added by IT or development team',
      'Business application legitimately needing mail or calendar access',
    ],

    triageGuidance: 'Revoke suspicious app access first, then investigate. Unlike account takeover, OAuth access can be revoked without disrupting the user. Then investigate what data the app accessed.',

    escalationRecommendations: [
      'Notify account owner of suspicious app access',
      'Report app to Microsoft/Google if confirmed malicious',
      'Engage DPO if sensitive data was accessed by unknown party',
    ],

    remediationActions: [
      'Revoke malicious OAuth app permissions immediately',
      'Implement admin consent workflow — disable user consent',
      'Deploy CASB with OAuth governance controls',
      'Audit and review all existing OAuth app consent grants',
      'Implement OAuth app allow-listing policy',
    ],

    businessImpact: 'Persistent email and file access without credentials. Attackers can read sensitive emails, extract data, and monitor communications indefinitely.',
    detectionGap: 'OAuth access persists through password resets and is not captured by standard authentication monitoring.',
    suggestedFrequency: 'Weekly audit + real-time alerting on high-permission consents',
    confidence: 82,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // THIRD-PARTY / SUPPLY CHAIN
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-011',
    title: 'Third-Party Vendor Access Anomaly — Remote Support Abuse',
    category: 'third-party',
    severity: 'high',
    difficulty: 'intermediate',
    estimatedTime: '2-3 hours',
    frequency: 'weekly',
    maturityRequired: 'intermediate',
    mitreTechniques: ['T1199', 'T1078', 'T1021.001', 'T1133'],
    tags: ['third-party', 'vendor', 'supply-chain', 'remote-access'],
    relevanceFactors: ['hasHighThirdPartyDependence', 'hasRemoteSupport'],
    baseRelevanceScore: 79,

    hypothesisTemplate: 'A third-party vendor or managed service provider with legitimate remote access to {company}\'s environment is either compromised or abusing their access beyond authorized scope.',

    whyRelevantTemplate: '{company} relies on external vendors and MSPs with remote access, creating trusted-relationship risk. Supply chain attacks via compromised vendors are a growing threat vector used by nation-state and ransomware actors.',

    dataSources: ['VPN logs', 'Remote access platform logs', 'Authentication logs', 'Privileged access management (PAM) logs'],
    recommendedLogSources: ['VPN gateway logs', 'Remote support platform (TeamViewer, BeyondTrust, ConnectWise)', 'PAM solution logs', '{siemPlatform}'],
    recommendedTools: ['PAM solution', 'Network monitoring', '{siemPlatform}', 'Just-in-time access controls'],

    huntSteps: [
      'Inventory all vendor accounts and their authorized access windows',
      'Query VPN and remote access logs for vendor connections outside authorized hours',
      'Identify vendor connections accessing resources outside their defined scope',
      'Look for vendor accounts making changes that require escalated privileges',
      'Hunt for remote support sessions that last significantly longer than normal',
      'Identify lateral movement from vendor-connected systems',
      'Check if vendor accounts are used from IPs outside the vendor\'s expected ranges',
      'Look for data access or downloads during vendor sessions to non-authorized data',
    ],

    exampleQueries: [
      {
        platform: 'Generic SIEM (KQL-style)',
        language: 'kql',
        query: `// Vendor access outside business hours
AuthenticationLogs
| where TimeGenerated > ago(30d)
| where AccountDomain in ({vendorDomains})
| where hourofday(TimeGenerated) !between (8 .. 18)
    or dayofweek(TimeGenerated) in (0, 6)  // Weekend
| project TimeGenerated, AccountName, SourceIP, TargetHost, AuthType
| order by TimeGenerated desc`,
      },
    ],

    suspiciousBehaviors: [
      'Vendor connecting during weekend or outside contracted service hours',
      'Vendor account accessing systems not in their service scope',
      'Unusual data volume transferred during vendor session',
      'Vendor account used from unexpected source IP (not vendor office range)',
      'Vendor account creating new local admin accounts on managed systems',
    ],

    truePositiveIndicators: [
      'Vendor access not corresponding to any open support ticket',
      'Vendor IP geolocating to unexpected country',
      'Commands run during vendor session match known attacker tooling',
    ],

    falsePositiveIndicators: [
      'After-hours emergency support with authorized ticket',
      'Vendor performing authorized proactive monitoring',
    ],

    triageGuidance: 'Contact the vendor through official channels to verify if the access was authorized. Do not rely on the session itself to determine legitimacy.',

    escalationRecommendations: [
      'Notify vendor security team through official contact',
      'Suspend vendor access pending investigation if unauthorized access is confirmed',
      'Engage legal if contractual breach is suspected',
    ],

    remediationActions: [
      'Implement just-in-time access for all vendor accounts',
      'Require vendor access approval through PAM solution',
      'Enforce session recording for all vendor remote sessions',
      'Implement network segmentation isolating vendor-accessible systems',
      'Review and update vendor access agreements and scope documents',
    ],

    businessImpact: 'Vendor compromise provides attacker with trusted access that bypasses perimeter controls, potentially exposing all systems the vendor can reach.',
    detectionGap: 'Vendor access looks legitimate by design, making behavioral anomaly detection critical.',
    suggestedFrequency: 'Weekly review + real-time session monitoring',
    confidence: 76,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // PRIVILEGE ESCALATION / SUSPICIOUS ADMIN
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'HT-012',
    title: 'Suspicious Domain Admin Activity — Unauthorized DCSync or Golden Ticket',
    category: 'admin-activity',
    severity: 'critical',
    difficulty: 'expert',
    estimatedTime: '4-6 hours',
    frequency: 'weekly',
    maturityRequired: 'advanced',
    mitreTechniques: ['T1003.006', 'T1606.002', 'T1484', 'T1134'],
    tags: ['active-directory', 'dcsync', 'golden-ticket', 'kerberos', 'domain-admin'],
    relevanceFactors: ['hasActiveDirectory', 'hasOnPrem', 'hasWindows'],
    baseRelevanceScore: 85,

    hypothesisTemplate: 'A threat actor with domain admin or equivalent privileges in {company}\'s Active Directory environment has executed a DCSync attack or forged Kerberos tickets to establish persistent, invisible access to all domain resources.',

    whyRelevantTemplate: '{company}\'s Active Directory infrastructure is the core identity foundation. DCSync and Golden Ticket attacks represent full domain compromise — they provide persistent, highly privileged access that is extremely difficult to detect and remediate.',

    dataSources: ['Domain Controller Security Event Logs', 'Kerberos authentication logs', 'SIEM platform', 'EDR telemetry'],
    recommendedLogSources: ['DC Event IDs: 4662, 4742, 4769, 4776, 5136', '{siemPlatform}', '{edrPlatform}', 'NetFlow from DCs'],
    recommendedTools: ['Microsoft ATA / Defender for Identity', '{siemPlatform}', 'BloodHound (for path analysis)', 'Mimikatz signatures in EDR'],

    huntSteps: [
      'Enable and monitor Event ID 4662 (Access to AD Object) on domain controllers',
      'Hunt for DCSync indicator: 4662 with "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2" (replication permission access)',
      'Look for Mimikatz signatures in EDR process telemetry',
      'Hunt for non-DC machine accounts performing AD replication operations',
      'Identify anomalous Kerberos ticket requests (Event 4769) with unusual encryption types',
      'Hunt for RC4 encryption usage for Kerberos (downgrade to weaker crypto)',
      'Look for use of krbtgt account password hash (should never change organically)',
      'Identify any new domain admin or enterprise admin account creations',
    ],

    exampleQueries: [
      {
        platform: 'KQL (Sentinel / Defender)',
        language: 'kql',
        query: `// DCSync detection via AD replication permission access
SecurityEvent
| where EventID == 4662
| where Properties has "1131f6aa-9c07-11d1-f79f-00c04fc2dcd2"  // DS-Replication-Get-Changes-All
    or Properties has "19195a5b-6da0-11d0-afd3-00c04fd930c9"  // DS-Replication-Get-Changes
| where SubjectUserName !endswith "$"  // Exclude DC machine accounts
| project TimeGenerated, SubjectUserName, SubjectDomainName, ObjectName, Properties
| order by TimeGenerated desc`,
      },
    ],

    suspiciousBehaviors: [
      'Non-DC host accessing AD replication permissions (DCSync indicator)',
      'Kerberos tickets with anomalously long validity (>10 hours for users)',
      'RC4-HMAC encryption type in Kerberos service tickets (downgrade attack)',
      'krbtgt account attributes modified (golden ticket mitigation bypass)',
      'New domain admin account created outside change management process',
    ],

    truePositiveIndicators: [
      'DCSync activity from a workstation rather than a DC',
      'Kerberos TGT with lifetime exceeding domain policy maximum',
      'Any host accessing DS-Replication-Get-Changes-All permission that is not a DC',
    ],

    falsePositiveIndicators: [
      'Microsoft Defender for Identity (MDI) performing legitimate replication reads',
      'Azure AD Connect performing AD sync operations',
      'Authorized backup solutions reading AD objects',
    ],

    triageGuidance: 'DCSync is extremely high severity. If confirmed, assume full domain compromise and begin Active Directory recovery procedures. Do not attempt to quietly remediate — full incident response is required.',

    escalationRecommendations: [
      'IMMEDIATELY escalate to CISO, IR lead, and executive team',
      'Engage external IR firm for Active Directory forensics',
      'Consider full Active Directory rebuild if compromise is confirmed',
    ],

    remediationActions: [
      'Reset krbtgt password TWICE with 10-hour interval',
      'Reset all privileged account passwords',
      'Remove attacker persistence mechanisms (scheduled tasks, services, accounts)',
      'Implement Microsoft Defender for Identity (MDI)',
      'Review and restrict AD replication permissions',
      'Deploy Privileged Access Workstations (PAWs) for domain admin access',
    ],

    businessImpact: 'Complete Active Directory compromise — attacker has persistent admin access to all domain-joined systems, can decrypt all Kerberos-protected communications, and can impersonate any domain user.',
    detectionGap: 'Golden tickets are nearly impossible to detect after creation without dedicated AD monitoring tools like MDI.',
    suggestedFrequency: 'Real-time alerting (MDI) + weekly manual review of DC audit logs',
    confidence: 82,
  },
];

export default HUNT_TEMPLATES;
