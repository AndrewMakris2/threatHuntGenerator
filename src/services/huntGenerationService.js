/**
 * Hunt Generation Service
 * Rules-based engine that selects and customizes threat hunt templates
 * based on the company profile. Structured for future LLM integration.
 *
 * Architecture:
 *   profileAnalysis() → buildContext() → selectTemplates() → personalizeHunt() → scoreHunts()
 *
 * To plug in an AI provider later, replace selectTemplates() with an LLM call
 * that receives the buildPrompt() output, then parse the structured JSON response.
 */

import HUNT_TEMPLATES, { HUNT_CATEGORIES } from '../data/huntTemplates';
import { getRelevantThreatActors } from '../data/threatActors';

// ── Profile Analysis ──────────────────────────────────────────────────────────

/**
 * Derive boolean context flags from the company profile for rule matching
 */
export function analyzeProfile(profile) {
  const cp = profile.cloudProviders || [];
  const ep = (profile.endpointPlatforms || []).join(' ').toLowerCase();
  const os = (profile.operatingSystems || []).join(' ').toLowerCase();
  const dt = (profile.dataTypes || []).join(' ').toLowerCase();
  const threats = (profile.topThreats || []).join(' ').toLowerCase();
  const industry = (profile.industry || '').toLowerCase();
  const compliance = (profile.complianceRequirements || []).join(' ').toLowerCase();
  const internetFacing = (profile.internetFacingSystems || []).join(' ').toLowerCase();

  return {
    // Cloud
    hasAWS:    cp.includes('aws'),
    hasAzure:  cp.includes('azure'),
    hasGCP:    cp.includes('gcp'),
    hasCloud:  cp.length > 0 && !cp.includes('none'),

    // Email / IdP
    hasM365:   ['Microsoft 365'].includes(profile.emailPlatform),
    hasGSuite: ['Google Workspace'].includes(profile.emailPlatform),
    hasEntraID: (profile.iamPlatform || '').includes('Entra') || (profile.iamPlatform || '').includes('Azure AD'),
    hasOkta:   (profile.iamPlatform || '').includes('Okta'),
    hasDuo:    (profile.iamPlatform || '').includes('Duo'),
    hasEmailSecurity: !!(profile.emailSecurityPlatform && profile.emailSecurityPlatform !== 'none'),

    // Endpoint / OS
    hasWindows: ep.includes('windows') || os.includes('windows'),
    hasMac:     ep.includes('mac') || os.includes('mac'),
    hasLinux:   os.includes('rhel') || os.includes('ubuntu') || os.includes('linux'),
    hasCrowdStrike: (profile.edrPlatform || '').includes('CrowdStrike'),
    hasSentinelOne: (profile.edrPlatform || '').includes('SentinelOne'),
    hasCarbonBlack: (profile.edrPlatform || '').includes('Carbon Black'),
    hasEDR:     !!(profile.edrPlatform && profile.edrPlatform !== 'none'),

    // Network / Architecture
    hasOnPrem:           ['on-prem', 'hybrid'].includes(profile.onPremVsCloud),
    hasActiveDirectory:  ['on-prem', 'hybrid'].includes(profile.onPremVsCloud),
    hasRemoteSupport:    (profile.thirdPartyDependence || '') !== 'none',
    hasBackupSolution:   !!(profile.backupSolution && profile.backupSolution !== 'none'),
    hasNetworkSegmentation: (profile.networkSegmentation || '') !== 'none',

    // Data / Compliance
    handlesHighSensitivityData: ['high', 'critical'].includes(profile.dataSensitivity),
    hasFinancialData: dt.includes('financial') || dt.includes('payment'),
    hasPHI:           dt.includes('phi'),
    hasPII:           dt.includes('pii'),
    hasPCIData:       dt.includes('payment-card') || compliance.includes('pci'),
    isPCICompliant:   compliance.includes('pci-dss'),
    isHIPAACompliant: compliance.includes('hipaa'),

    // Remote / Third Party
    hasRemoteWork:          (profile.remoteWorkLevel || '') !== 'none',
    hasHighThirdPartyDependence: ['high', 'critical'].includes(profile.thirdPartyDependence),
    hasHighEmployeeTurnover: false, // Could be set from profile

    // Industry risk
    isHighRiskIndustry: ['finance', 'healthcare', 'government', 'energy', 'defense'].includes(industry),
    isHealthcare: industry.includes('healthcare') || industry.includes('pharma'),
    isFinance:    industry.includes('finance'),
    isGovt:       industry.includes('government'),

    // Threat focus
    worriedAboutRansomware:  threats.includes('ransomware'),
    worriedAboutBEC:         threats.includes('bec') || threats.includes('email'),
    worriedAboutInsider:     threats.includes('insider'),
    worriedAboutNationState: threats.includes('nation-state') || threats.includes('espionage'),

    // Internet exposure
    hasInternetFacingApp:    internetFacing.includes('web-app') || internetFacing.includes('api'),
    hasVPN:                  internetFacing.includes('vpn'),
    hasRDP:                  internetFacing.includes('rdp'),
  };
}

// ── Template Selection ────────────────────────────────────────────────────────

function calculateRelevanceScore(template, ctx, profile) {
  let score = template.baseRelevanceScore;
  const factors = template.relevanceFactors || [];

  // Boost score based on matching context flags
  factors.forEach(factor => {
    if (ctx[factor]) score = Math.min(100, score + 5);
  });

  // Industry-specific boosts
  const industry = (profile.industry || '').toLowerCase();
  if (template.category === 'email' && ctx.hasM365) score = Math.min(100, score + 8);
  if (template.category === 'ransomware' && ctx.worriedAboutRansomware) score = Math.min(100, score + 10);
  if (template.category === 'insider' && ctx.handlesHighSensitivityData) score = Math.min(100, score + 6);
  if (template.category === 'cloud' && ctx.hasCloud) score = Math.min(100, score + 7);
  if (template.category === 'lateral' && ctx.hasActiveDirectory) score = Math.min(100, score + 8);
  if (template.category === 'admin-activity' && ctx.hasActiveDirectory) score = Math.min(100, score + 7);

  // Finance-specific
  if (industry === 'finance' && ['identity', 'saas-abuse', 'exfiltration'].includes(template.category)) {
    score = Math.min(100, score + 5);
  }

  // Healthcare-specific
  if (ctx.isHealthcare && template.category === 'ransomware') score = Math.min(100, score + 10);

  // Penalize templates that require infrastructure the company doesn't have
  if (template.category === 'cloud' && !ctx.hasCloud) score -= 30;
  if (template.id === 'HT-009' && !ctx.hasActiveDirectory) score -= 25;
  if (template.id === 'HT-012' && !ctx.hasActiveDirectory) score -= 30;

  return Math.max(0, Math.round(score));
}

function selectTemplates(ctx, profile) {
  return HUNT_TEMPLATES
    .map(t => ({ ...t, relevanceScore: calculateRelevanceScore(t, ctx, profile) }))
    .filter(t => t.relevanceScore >= 30) // Drop irrelevant hunts
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// ── Template Personalization ──────────────────────────────────────────────────

/**
 * Replace {placeholder} tokens in template strings with real profile values
 */
function interpolate(text, vars) {
  if (!text) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

function buildInterpolationVars(profile) {
  const cloudMap = { aws: 'AWS', azure: 'Azure', gcp: 'GCP' };
  const primaryCloud = (profile.cloudProviders || [])
    .filter(c => c !== 'none')
    .map(c => cloudMap[c] || c)[0] || 'cloud provider';

  return {
    company:             profile.companyName || 'your organization',
    companyDomain:       (profile.websiteUrl || 'company.com').replace(/^https?:\/\//, ''),
    industry:            profile.industry || 'your industry',
    iamPlatform:         profile.iamPlatform || 'the IAM platform',
    emailPlatform:       profile.emailPlatform || 'the email platform',
    siemPlatform:        profile.siemPlatform || 'your SIEM',
    edrPlatform:         profile.edrPlatform || 'your EDR',
    cloudProvider:       primaryCloud,
    endpointPlatform:    (profile.endpointPlatforms || ['Windows']).join(' / '),
    dataTypes:           (profile.dataTypes || []).join(', ') || 'sensitive data',
    networkSegment:      profile.networkSegmentation === 'full' ? 'segmented network' : 'flat network',
    dataChannel:         'personal cloud storage / USB / personal email',
    targetedThreatActors: (profile.threatActorConcerns || []).join(', ') || 'relevant threat actors',
    vendorDomains:       '"vendor1.com", "vendor2.com"',
    companySize:         profile.companySize || 'mid-market',
  };
}

function personalizeHunt(template, profile, ctx, vars) {
  const relevantActors = getRelevantThreatActors(profile).slice(0, 3);

  // Generate personalized "why relevant" content
  const whyPoints = [];
  if (profile.companyName) whyPoints.push(`${profile.companyName} uses ${vars.iamPlatform || 'identity management'} and ${vars.emailPlatform || 'email services'}`);
  if (ctx.hasCloud) whyPoints.push(`Cloud presence across ${(profile.cloudProviders || []).join(', ')} increases attack surface`);
  if (ctx.handlesHighSensitivityData) whyPoints.push(`High-sensitivity data (${vars.dataTypes}) makes this a priority target`);
  if (template.category === 'ransomware' && ctx.isHighRiskIndustry) whyPoints.push(`${profile.industry} sector is a top ransomware target`);

  const id = `${template.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  return {
    ...template,
    id,
    templateId: template.id,

    // Interpolated fields
    title:      interpolate(template.title, vars),
    hypothesis: interpolate(template.hypothesisTemplate, vars),
    whyRelevant: interpolate(template.whyRelevantTemplate, vars),

    // Personalized data sources
    recommendedLogSources: (template.recommendedLogSources || []).map(s => interpolate(s, vars)),
    recommendedTools:      (template.recommendedTools || []).map(s => interpolate(s, vars)),
    huntSteps:             (template.huntSteps || []).map(s => interpolate(s, vars)),

    // Context-enriched metadata
    relevantThreatActors: relevantActors,
    companyContext: {
      name:     profile.companyName,
      industry: profile.industry,
      size:     profile.companySize,
      cloud:    profile.cloudProviders,
      siem:     profile.siemPlatform,
      edr:      profile.edrPlatform,
    },

    // Computed fields
    isSaved: false,
    notes: '',
    generatedAt: new Date().toISOString(),
    analysisPoints: whyPoints,
  };
}

// ── Priority + Scoring Post-Processing ────────────────────────────────────────

function assignPriority(score) {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 55) return 'medium';
  return 'low';
}

function computeDataSourceCoverage(hunt, profile) {
  const sources = hunt.dataSources || [];
  if (!sources.length) return 0;

  let covered = 0;
  const hasSIEM = !!(profile.siemPlatform && profile.siemPlatform !== 'none');
  const hasEDR  = !!(profile.edrPlatform  && profile.edrPlatform  !== 'none');
  const hasEmailSec = !!(profile.emailSecurityPlatform);

  sources.forEach(src => {
    const s = src.toLowerCase();
    if ((s.includes('siem') || s.includes('log')) && hasSIEM) covered++;
    else if ((s.includes('endpoint') || s.includes('process') || s.includes('edr')) && hasEDR) covered++;
    else if ((s.includes('email') || s.includes('mailbox')) && hasEmailSec) covered++;
    else if (s.includes('authentication')) covered++;
    else covered += 0.5;
  });

  return Math.round(Math.min(100, (covered / sources.length) * 100));
}

// ── AI Provider Layer ─────────────────────────────────────────────────────────

// Maximum output tokens per provider — Groq models cap at 8192
const PROVIDER_MAX_TOKENS = {
  anthropic: 16000,
  openai:    16000,
  azure:     16000,
  local:     16000,
  groq:       8000,
};

async function callAI(aiSettings, systemPrompt, userPrompt) {
  const { provider, model, apiKey, endpoint } = aiSettings;
  const maxTokens = PROVIDER_MAX_TOKENS[provider] ?? 16000;

  const openAIRequest = async (url, extraHeaders = {}) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `${provider} API error ${res.status}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
  };

  if (provider === 'groq') {
    return openAIRequest('https://api.groq.com/openai/v1/chat/completions', {
      Authorization: `Bearer ${apiKey}`,
    });
  }

  if (provider === 'openai') {
    return openAIRequest('https://api.openai.com/v1/chat/completions', {
      Authorization: `Bearer ${apiKey}`,
    });
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API error ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text;
  }

  if (provider === 'azure') {
    const base = (endpoint || '').replace(/\/$/, '');
    return openAIRequest(
      `${base}/openai/deployments/${model}/chat/completions?api-version=2024-02-15-preview`,
      { 'api-key': apiKey }
    );
  }

  if (provider === 'local') {
    const base = (endpoint || 'http://localhost:11434').replace(/\/$/, '');
    return openAIRequest(`${base}/v1/chat/completions`);
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}

function extractJSON(text) {
  // Strip markdown code fences first
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/s);
  const candidate = fenced ? fenced[1].trim() : text;

  // Try clean parse of a complete array
  const arrStart = candidate.indexOf('[');
  const arrEnd   = candidate.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    const slice = candidate.slice(arrStart, arrEnd + 1);
    try { JSON.parse(slice); return slice; } catch { /* truncated — fall through to repair */ }
    // Response was cut off before the closing ] — salvage complete objects
    return repairTruncatedJSONArray(candidate.slice(arrStart));
  }

  // Try outermost object (might wrap array in { hunts: [...] })
  const objStart = candidate.indexOf('{');
  const objEnd   = candidate.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) return candidate.slice(objStart, objEnd + 1);

  return candidate.trim();
}

/**
 * Walk the truncated array character-by-character and collect every
 * top-level JSON object that is fully balanced (depth returns to 0).
 * Returns a syntactically valid JSON array of only the complete objects.
 */
function repairTruncatedJSONArray(text) {
  const objects = [];
  let depth    = 0;
  let start    = -1;
  let inStr    = false;
  let escaped  = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped)          { escaped = false; continue; }
    if (ch === '\\' && inStr) { escaped = true;  continue; }
    if (ch === '"')       { inStr = !inStr;       continue; }
    if (inStr)            continue;

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const obj = text.slice(start, i + 1);
        try { JSON.parse(obj); objects.push(obj); } catch { /* skip malformed fragment */ }
        start = -1;
      }
    }
  }

  if (objects.length === 0) throw new Error('No complete hunt objects found in truncated AI response');
  return '[' + objects.join(',') + ']';
}

function normalizeAIHunts(raw, profile) {
  const relevantActors = getRelevantThreatActors(profile).slice(0, 3);
  // Handle wrapper objects like { hunts: [...] } or { scenarios: [...] }
  const list = Array.isArray(raw)
    ? raw
    : (raw.hunts || raw.scenarios || raw.results || raw.threat_hunts || Object.values(raw)[0] || []);

  return list
    .filter(h => h && h.title)
    .map((h, i) => {
      const score = Math.min(100, Math.max(0, Number(h.confidence) || Number(h.relevanceScore) || 70));

      const mitreTechniques = (h.mitreTechniques || h.mitre_techniques || []).map(t =>
        typeof t === 'string' ? { id: t, tactic: '' } : t
      );

      return {
        id:           `ai-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
        templateId:   null,
        aiGenerated:  true,
        title:        h.title || 'Untitled Hunt',
        hypothesis:   h.hypothesis || '',
        threatContext:     h.threatContext || h.threat_context || '',
        whyRelevant:       h.whyRelevant || h.why_relevant || '',
        detectionOpportunity: h.detectionOpportunity || h.detection_opportunity || '',
        category:     h.category || 'endpoint',
        severity:     h.severity || 'medium',
        difficulty:   h.difficulty || 'intermediate',
        estimatedHuntTime: h.estimatedHuntTime || h.estimated_hunt_time || '',
        confidence:   score,
        relevanceScore: score,
        mitreTechniques,
        huntSteps:           h.huntSteps          || h.hunt_steps          || [],
        exampleQueries:      h.exampleQueries     || h.example_queries     || [],
        suspiciousBehaviors: h.suspiciousBehaviors|| h.suspicious_behaviors|| [],
        falsePositives:      h.falsePositives     || h.false_positives     || [],
        investigationSteps:  h.investigationSteps || h.investigation_steps || [],
        iocTypes:            h.iocTypes           || h.ioc_types           || [],
        huntMethodology:     h.huntMethodology    || h.hunt_methodology    || '',
        whatToLookFor:       h.whatToLookFor      || h.what_to_look_for    || [],
        analystTips:         h.analystTips        || h.analyst_tips        || [],
        recommendedLogSources: h.recommendedLogSources || h.recommended_log_sources || [],
        recommendedTools:    h.recommendedTools   || h.recommended_tools   || [],
        tags:                h.tags               || [],
        priority:            assignPriority(score),
        dataSourceCoverage:  computeDataSourceCoverage({ dataSources: h.recommendedLogSources || [] }, profile),
        maturityFit:         computeMaturityFit(h.maturityRequired || 'intermediate', profile),
        relevantThreatActors: relevantActors,
        companyContext: {
          name:     profile.companyName,
          industry: profile.industry,
          size:     profile.companySize,
          cloud:    profile.cloudProviders,
          siem:     profile.siemPlatform,
          edr:      profile.edrPlatform,
        },
        isSaved:      false,
        notes:        '',
        generatedAt:  new Date().toISOString(),
        analysisPoints: [],
      };
    });
}

// Per-provider safe hunt count ceilings — detailed schema is large; stay under token limits
const PROVIDER_MAX_HUNTS = {
  groq:      4,   // 8k token ceiling — fits ~4 fully-detailed hunts
  anthropic: 8,
  openai:    8,
  azure:     8,
  local:     6,
};

async function generateHuntsWithAI(profile, aiSettings, options = {}) {
  const providerCap = PROVIDER_MAX_HUNTS[aiSettings?.provider] ?? 8;
  const { maxHunts = 6, categories = [] } = options;
  // Never ask for more hunts than the provider can safely fit in one response
  const safeMaxHunts = Math.min(maxHunts, providerCap);

  const cloudList    = (profile.cloudProviders || []).filter(c => c !== 'none').join(', ') || 'None';
  const osList       = (profile.operatingSystems || []).join(', ') || 'Unknown';
  const dataTypes    = (profile.dataTypes || []).join(', ') || 'Unknown';
  const compliance   = (profile.complianceRequirements || []).join(', ') || 'None';
  const threats      = (profile.topThreats || []).join(', ') || 'Unknown';
  const actorConcerns = (profile.threatActorConcerns || []).join(', ') || 'None specified';
  const internetFacing = (profile.internetFacingSystems || []).join(', ') || 'Unknown';
  const endpointPlatforms = (profile.endpointPlatforms || []).join(', ') || 'Unknown';
  const catFilter    = categories.length > 0
    ? `\nFocus ONLY on these hunt categories: ${categories.join(', ')}.`
    : '';

  // Build SIEM-specific query guidance so the model writes correct syntax
  const siemQueryGuide = buildSIEMQueryGuide(profile.siemPlatform, profile.edrPlatform);

  const systemPrompt = `You are a senior threat hunter, detection engineer, and incident responder with 15+ years of enterprise SOC experience. You have deep, hands-on expertise in:

QUERY LANGUAGES — write syntactically correct queries for:
- Microsoft Sentinel / Defender XDR: KQL (Kusto Query Language)
- Splunk SIEM / Splunk ES: SPL (Search Processing Language)
- Elastic SIEM / Elastic Security: EQL and KQL (Elastic syntax)
- IBM QRadar: AQL (Ariel Query Language)
- Chronicle / Google SecOps: YARA-L 2.0
- Sumo Logic: Sumo Logic query syntax

EDR PLATFORMS — know telemetry, process trees, and query interfaces for:
- CrowdStrike Falcon (Event Search, Spotlight, RTR, Falcon Query Language)
- SentinelOne (Deep Visibility, Power Queries, EQL via S1QL)
- Microsoft Defender for Endpoint (Advanced Hunting, KQL)
- Carbon Black (Live Query, watchlists, CBC query language)
- Palo Alto Cortex XDR (XQL)

THREAT INTELLIGENCE — know TTPs, tooling, and targeting patterns of:
- Ransomware operators: LockBit, BlackCat/ALPHV, Cl0p, Play, Black Basta
- Nation-state APTs: APT29/Cozy Bear, APT41, Lazarus Group, Volt Typhoon
- BEC/financial fraud actors, initial access brokers, supply chain attackers

MITRE ATT&CK — use precise technique IDs including sub-techniques (T1078.004 not just T1078)

Your hunts must be:
1. Technically precise — actual working query syntax for the specific platforms mentioned, not pseudocode
2. Environment-specific — every field references the company's actual stack, domain, data, tools
3. Analyst-grade — written for a skilled SOC analyst who will execute these immediately
4. Threat-intelligence backed — ground each hunt in real observed attacker behavior with specific TTPs
5. Actionable on findings — tell the analyst exactly what to do when they find something
6. Honest about false positives — provide concrete FP reduction techniques
7. Rich with queries — generate AT LEAST 4 queries per hunt: (a) initial broad sweep to establish scope, (b) refined targeted detection with tight filters, (c) time-based or statistical correlation to surface anomalies, (d) EDR/endpoint-level process/file/network query
8. Deeply detailed hunt steps — each step must be a full 1-2 sentence instruction with exact tool names, console paths, field names, filter values, or commands to run. Write a MINIMUM of 9 steps per hunt. Follow this progression: validate data sources → run initial scoping query → identify anomalies → pivot on suspicious results → cross-correlate across data sources → reconstruct timeline → assess scope/blast radius → extract IOCs → document findings
9. Thorough whatToLookFor — at least 5 specific artifacts, each with the exact field name, expected value or pattern, threshold or statistical baseline where applicable

Return ONLY a valid JSON array — no markdown, no code fences, no preamble, no explanation. Just the raw JSON array starting with [ and ending with ].`;

  const userPrompt = `Generate exactly ${safeMaxHunts} threat hunt scenarios for this specific environment. Every field must reference their actual tools, platforms, and data — no generic placeholders.

CRITICAL DETAIL REQUIREMENTS — do not skip or abbreviate:
- huntSteps: minimum 9 steps, each a full 1-2 sentence instruction with tool names, console paths, exact field names, and commands
- exampleQueries: minimum 4 queries — broad sweep, refined detection, statistical/time-based anomaly, EDR endpoint query
- whatToLookFor: minimum 5 items with exact field names and values/thresholds
- analystTips: minimum 3 actionable tips specific to this technique and environment
- investigationSteps: minimum 5 steps covering triage, pivot, lateral movement check, data exposure check, escalation decision
- suspiciousBehaviors: minimum 5 specific observables with field names and patterns

=== ENVIRONMENT PROFILE ===
Company: ${profile.companyName || 'Unknown'}
Industry: ${profile.industry || 'Unknown'}
Company Size: ${profile.companySize || 'Unknown'}
Website/Domain: ${profile.websiteUrl || 'Unknown'}

=== INFRASTRUCTURE ===
Architecture: ${profile.onPremVsCloud || 'Unknown'} (on-prem / cloud / hybrid)
Cloud Providers: ${cloudList}
Operating Systems: ${osList}
Endpoint Platforms: ${endpointPlatforms}
Network Segmentation: ${profile.networkSegmentation || 'Unknown'}
Internet-Facing Systems: ${internetFacing}
Remote Work Level: ${profile.remoteWorkLevel || 'Unknown'}
VPN / Remote Access: ${(profile.internetFacingSystems || []).includes('vpn') ? 'Yes' : 'Unknown'}
Backup Solution: ${profile.backupSolution || 'Unknown'}
Third-Party Dependence: ${profile.thirdPartyDependence || 'Unknown'}

=== SECURITY TOOLS ===
SIEM: ${profile.siemPlatform || 'Unknown'}
EDR: ${profile.edrPlatform || 'Unknown'}
IAM / Identity Provider: ${profile.iamPlatform || 'Unknown'}
Email Platform: ${profile.emailPlatform || 'Unknown'}
Email Security: ${profile.emailSecurityPlatform || 'None'}
CASB: ${profile.casb || 'None'}
PAM Solution: ${profile.pamSolution || 'None'}

=== DATA & COMPLIANCE ===
Data Types Handled: ${dataTypes}
Data Sensitivity Level: ${profile.dataSensitivity || 'Unknown'}
Compliance Frameworks: ${compliance}

=== THREAT POSTURE ===
Top Threat Concerns: ${threats}
Known Threat Actor Concerns: ${actorConcerns}
Known Security Gaps: ${profile.securityGaps || 'Not specified'}
Recent Incidents or Near-Misses: ${profile.recentIncidents || 'None reported'}
Detection Maturity: ${profile.detectionMaturity || 'Unknown'}
IR Maturity: ${profile.incidentResponseMaturity || 'Unknown'}
${catFilter}

${siemQueryGuide}

=== REQUIRED JSON SCHEMA ===
Return a JSON array. Each element must follow this exact structure — populate ALL fields with environment-specific detail:

{
  "title": "Specific, descriptive hunt name referencing the attack technique and relevant platform (e.g., 'Entra ID Token Theft via Device Code Auth Flow')",

  "hypothesis": "If [specific attacker using named TTP/technique] targeting [company's specific platform/data] then [specific forensic artifact/observable] will appear in [specific log source with table/index name]",

  "threatContext": "2-3 sentences: What real-world threat actor or campaign motivates this hunt? What have they been observed doing? Why is this company a plausible target? Reference real TTPs and threat actor groups where applicable.",

  "whyRelevant": "3-4 sentences specific to THIS company's stack explaining: (1) which specific tool/platform creates the attack surface, (2) what data or asset is at risk, (3) what detection gap exists, (4) what compliance or business risk this addresses",

  "category": "<one of: endpoint | lateral | identity | email | cloud | exfiltration | ransomware | insider | persistence | network | saas-abuse | admin-activity>",

  "severity": "<critical | high | medium | low>",
  "difficulty": "<beginner | intermediate | advanced | expert>",
  "confidence": <integer 0-100 — how likely this threat is relevant to this specific environment>,
  "estimatedHuntTime": "<e.g. '2-4 hours' — realistic time estimate for an analyst to complete this hunt>",

  "mitreTechniques": [
    { "id": "T1078.004", "name": "Valid Accounts: Cloud Accounts", "tactic": "Initial Access" }
  ],

  "huntSteps": [
    "Step 1 — Validate data sources: Open [specific console/tool] and confirm [exact table/index/log source] is receiving events within the last 24 hours — check record count and most recent timestamp to rule out ingestion gaps",
    "Step 2 — Run initial scoping query: Execute the broad sweep query below in [SIEM name] to identify the full population of events matching this technique over the past 30 days — note total count and peak activity periods",
    "Step 3 — Identify anomalies: Sort results by [specific field] and flag any accounts, hosts, or IPs that appear in fewer than 3% of your baseline — these outliers are your first pivots",
    "Step 4 — Pivot on suspicious results: For each flagged entity, open [EDR console/SIEM] and pull the full process tree / session timeline for the 2-hour window surrounding the suspicious event",
    "Step 5 — Cross-correlate data sources: Join [log source A] with [log source B] on the shared key field to confirm whether the suspicious activity correlates with [authentication event / network connection / file write]",
    "Step 6 — Reconstruct the timeline: Build a chronological event chain from initial access indicator to the observed activity — note any gaps longer than 10 minutes that may indicate dwell time",
    "Step 7 — Assess scope and blast radius: Run the targeted query scoped to the past 90 days to determine how long this activity has been occurring and whether it spans multiple hosts or accounts",
    "Step 8 — Extract IOCs: Collect all relevant indicators — IP addresses, domains, hashes, user accounts, process names — and tag them in your threat intel platform",
    "Step 9 — Document findings: Record all anomalies, IOCs, affected assets, timeline, and confidence level in your case management system; escalate if confirmed malicious activity is found"
  ],

  "exampleQueries": [
    {
      "platform": "${profile.siemPlatform || 'SIEM'}",
      "language": "<kql | spl | aql | yaral | eql>",
      "description": "Broad initial sweep — establishes baseline and identifies the full population of events to triage",
      "query": "<syntactically correct, runnable query using correct table/index names for this platform — not pseudocode>"
    },
    {
      "platform": "${profile.siemPlatform || 'SIEM'}",
      "language": "<kql | spl | aql | yaral | eql>",
      "description": "Targeted refined detection — tighter filters to surface high-confidence indicators with low noise",
      "query": "<refined query with exclusions and threshold filters applied>"
    },
    {
      "platform": "${profile.siemPlatform || 'SIEM'}",
      "language": "<kql | spl | aql | yaral | eql>",
      "description": "Statistical correlation or time-based anomaly detection — surfaces outliers against a calculated baseline",
      "query": "<aggregation/statistical query using summarize, stats, or equivalent to find anomalies>"
    },
    {
      "platform": "${profile.edrPlatform || 'EDR'}",
      "language": "<edr-specific query language>",
      "description": "EDR endpoint-level query — process, file, network, or registry telemetry for this technique",
      "query": "<syntactically correct EDR query using the correct field names and event types for this platform>"
    }
  ],

  "suspiciousBehaviors": [
    "Specific observable behavior 1 — exact field name and value pattern that indicates malicious activity",
    "Specific observable behavior 2 — process/parent relationship or command-line pattern to flag",
    "Specific observable behavior 3 — network indicator or connection pattern",
    "Specific observable behavior 4 — authentication or access pattern anomaly",
    "Specific observable behavior 5 — file system or registry artifact specific to this technique"
  ],

  "falsePositives": [
    "Common FP scenario 1 — specific legitimate tool or process that triggers this detection and how to confirm it is benign",
    "Common FP scenario 2 — admin or IT activity pattern that resembles this technique, with the filter or exclusion to apply",
    "Common FP scenario 3 — scheduled task, service account, or automation that generates matching events"
  ],

  "investigationSteps": [
    "When you find a match: immediately [triage action] — check [specific field] to determine if the account/host is a known admin or service account",
    "Step 2 — Pull the full process tree in [EDR console] and look for [specific indicator] that confirms malicious intent vs legitimate use",
    "Step 3 — Check lateral movement: query [log source] for any authentication events from the suspicious host/account within the preceding and following 30-minute window",
    "Step 4 — Assess data exposure: determine whether [sensitive data type] was accessed or exfiltrated by reviewing [specific log source or DLP tool]",
    "Step 5 — Escalation decision: if [specific confirmed indicator] is present, escalate to IR immediately; otherwise continue monitoring with enhanced logging"
  ],

  "detectionOpportunity": "How to operationalize this hunt into a permanent detection rule — what threshold, timeframe, and exclusions would make a reliable alert",

  "huntMethodology": "2-3 sentences explaining: (1) the type of hunt — hypothesis-driven, baseline deviation, or threat-intel-driven; (2) the analytical approach and why this specific technique surfaces the attacker behavior; (3) how the data sources chain together to form the detection logic",

  "whatToLookFor": [
    "Artifact 1 — exact field name and value pattern: e.g. 'CommandLine field containing -EncodedCommand with Base64 string >200 chars indicates obfuscated payload execution'",
    "Artifact 2 — process relationship: e.g. 'ParentProcessName = svchost.exe with ChildProcess = cmd.exe or powershell.exe is anomalous outside of known patch management windows'",
    "Artifact 3 — statistical anomaly: e.g. 'UserPrincipalName appearing in SigninLogs from 3+ distinct countries within a 4-hour window — expected baseline is 1 country per session'",
    "Artifact 4 — threshold indicator: e.g. 'TargetFileName extension changes >50 times per minute from a single process is consistent with ransomware encryption behavior'",
    "Artifact 5 — network indicator: e.g. 'Outbound DNS queries to domains registered <30 days ago with entropy score >3.5 suggest DGA or C2 beaconing'"
  ],

  "analystTips": [
    "Tip 1 — time-saving shortcut: specific filter or pivot that dramatically reduces noise when running this hunt in this environment",
    "Tip 2 — common mistake: what analysts typically misinterpret as malicious for this technique and how to quickly rule it out",
    "Tip 3 — context for results: what baseline or environmental factor to check before concluding a finding is a true positive"
  ],

  "recommendedLogSources": [
    "Specific log source 1 — exact table/index name for their SIEM (e.g. 'SigninLogs table in Microsoft Sentinel')",
    "Specific log source 2"
  ],

  "recommendedTools": ["Tool 1 with specific use case", "Tool 2"],

  "iocTypes": ["Type of IOC to collect during this hunt (e.g. 'Suspicious OAuth app IDs', 'Unusual user-agent strings')"],

  "tags": ["mitre-tXXXX", "platform-specific-tag", "threat-actor-name-if-applicable"]
}`;

  const rawText = await callAI(aiSettings, systemPrompt, userPrompt);
  const jsonText = extractJSON(rawText);
  const parsed = JSON.parse(jsonText);
  return normalizeAIHunts(parsed, profile);
}

function buildSIEMQueryGuide(siem, edr) {
  // More-specific keys must come before shorter ones that are substrings of them
  // e.g. "sentinelone" must precede "sentinel" or it would match Microsoft Sentinel first
  const SIEM_GUIDES = {
    'sentinelone':     'SIEM is SentinelOne SIEM (Singularity Data Lake) — write Power Query Language. Key syntax: EventType = "X" AND field CONTAINS "value", use IN, NOT IN, MATCHES ANYCASE, LIKE. Key event types: "Process Creation", "File Creation", "File Modification", "Network Connection", "DNS Resolved", "Registry Value Modified", "Login", "Logout". Key fields: SrcProcName, SrcProcCmdLine, SrcProcParentName, TgtFilePath, TgtProcName, DstIP, DstPort, DstDomain, UserName, AgentComputerName, AgentUUID. Example: EventType = "Process Creation" AND SrcProcName CONTAINS "powershell.exe" AND SrcProcCmdLine MATCHES ANYCASE "*-encodedcommand*" | group by AgentComputerName, UserName, SrcProcCmdLine',
    'next-gen':        'SIEM is CrowdStrike Falcon Next-Gen SIEM (LogScale / Falcon Data Replicator) — write LogScale Query Language (LQL). Key syntax: | filter(), | groupBy(), | stats(), | sort(), | regex(). Key fields: #event_simpleName, ComputerName, UserName, CommandLine, ImageFileName, ParentBaseFileName, RemoteAddressIP4, LocalAddressIP4, TargetFileName, RegObjectName. Event types: ProcessRollup2 (process), NetworkConnectIP4 (network), UserLogon/UserLogoff (auth), PeFileWritten (file write), RegistryOperationV2 (registry). Example: #event_simpleName=ProcessRollup2 | filter(CommandLine=~regex(".*-[Ee]nc.*")) | groupBy([ComputerName, UserName, CommandLine], function=count())',
    'logscale':        'SIEM is CrowdStrike Falcon Next-Gen SIEM (LogScale) — write LogScale Query Language (LQL). Key syntax: | filter(), | groupBy(), | stats(), | sort(), | regex(). Key fields: #event_simpleName, ComputerName, UserName, CommandLine, ImageFileName, ParentBaseFileName, RemoteAddressIP4. Event types: ProcessRollup2, NetworkConnectIP4, UserLogon, PeFileWritten, RegistryOperationV2.',
    'microsoft sentinel': 'SIEM is Microsoft Sentinel — write KQL queries using real Sentinel table names: SigninLogs, AuditLogs, SecurityEvent, DeviceProcessEvents, OfficeActivity, BehaviorAnalytics, ThreatIntelligenceIndicator, AzureActivity, CloudAppEvents, EmailEvents. Use | where, | summarize, | extend, | join, | project.',
    'sentinel':        'SIEM is Microsoft Sentinel — write KQL queries using real Sentinel table names: SigninLogs, AuditLogs, SecurityEvent, DeviceProcessEvents, OfficeActivity, BehaviorAnalytics, ThreatIntelligenceIndicator, AzureActivity, CloudAppEvents, EmailEvents. Use | where, | summarize, | extend, | join, | project.',
    'splunk':          'SIEM is Splunk — write SPL using index= and sourcetype= with real Splunk CIM field names (src_ip, dest_ip, user, process_name, parent_process_name, EventCode). Use | stats, | eval, | where, | rex, | transaction, | lookup.',
    'elastic':         'SIEM is Elastic — write EQL for behavioral detections (sequence by, any where) and Elastic KQL for filtering. Use correct field names: process.name, user.name, source.ip, event.action, winlog.event_id.',
    'qradar':          'SIEM is QRadar — write AQL (Ariel Query Language): SELECT fields FROM events WHERE conditions LAST X MINUTES. Use correct field names: sourceip, destinationip, username, eventname.',
    'chronicle':       'SIEM is Chronicle/Google SecOps — write YARA-L 2.0 rules with rule name, meta, events, condition blocks. Use UDM field names: principal.user.userid, target.hostname, network.ip_protocol.',
    'google':          'SIEM is Chronicle/Google SecOps — write YARA-L 2.0 rules with rule name, meta, events, condition blocks. Use UDM field names: principal.user.userid, target.hostname, network.ip_protocol.',
  };
  const EDR_GUIDES = {
    crowdstrike:   'EDR is CrowdStrike Falcon — for Event Search queries use Falcon Query Language (FQL). Key fields: ComputerName, UserName, ImageFileName, CommandLine, ParentBaseFileName, RemoteAddressIP4. For Advanced Hunting use falcon:process or falcon:network_connect event types.',
    sentinelone:   'EDR is SentinelOne — use Deep Visibility Power Queries or EQL. Key fields: ProcessName, ParentProcessName, CmdLine, SrcIp, DstIp, FileFullName, UserName, AgentName. Use CONTAINS, IN, REGEX operators.',
    defender:      'EDR is Microsoft Defender for Endpoint — use KQL in Advanced Hunting. Key tables: DeviceProcessEvents, DeviceNetworkEvents, DeviceFileEvents, DeviceLogonEvents, DeviceRegistryEvents, DeviceAlertEvents. Key fields: InitiatingProcessFileName, FileName, ProcessCommandLine, RemoteIP.',
    mde:           'EDR is Microsoft Defender for Endpoint — use KQL in Advanced Hunting. Key tables: DeviceProcessEvents, DeviceNetworkEvents, DeviceFileEvents, DeviceLogonEvents, DeviceRegistryEvents, DeviceAlertEvents. Key fields: InitiatingProcessFileName, FileName, ProcessCommandLine, RemoteIP.',
    'carbon black': 'EDR is Carbon Black — use CBC query syntax: process_name:, parent_name:, cmdline:, netconn_ipv4:, filemod_name:. For Live Response use process list, directory listing commands.',
    cb:            'EDR is Carbon Black — use CBC query syntax: process_name:, parent_name:, cmdline:, netconn_ipv4:, filemod_name:. For Live Response use process list, directory listing commands.',
  };

  const siemLower = (siem || '').toLowerCase();
  const edrLower  = (edr  || '').toLowerCase();
  const siemGuide = Object.entries(SIEM_GUIDES).find(([k]) => siemLower.includes(k))?.[1] ?? '';
  const edrGuide  = Object.entries(EDR_GUIDES).find(([k]) => edrLower.includes(k))?.[1] ?? '';

  return ['=== QUERY SYNTAX REQUIREMENTS ===', siemGuide, edrGuide].filter(Boolean).join('\n');
}

// ── Main Generation Function ──────────────────────────────────────────────────

/**
 * Generate personalized threat hunts for a given company profile
 * @param {Object} profile - Company profile object
 * @param {Object} options - Generation options (maxHunts, categories filter)
 * @returns {Array} - Array of personalized hunt objects
 */
export async function generateHunts(profile, options = {}, aiSettings = null) {
  // Try AI generation if provider + key are configured
  const useAI = (aiSettings?.apiKey && aiSettings.provider !== 'local') || aiSettings?.provider === 'local';
  if (useAI) {
    try {
      const aiHunts = await generateHuntsWithAI(profile, aiSettings, options);
      if (aiHunts && aiHunts.length > 0) return { hunts: aiHunts, method: 'ai', provider: aiSettings.provider };
    } catch (err) {
      console.warn('[THG] AI generation failed, falling back to rules engine:', err.message);
      return { hunts: await _rulesEngine(profile, options), method: 'fallback', error: err.message };
    }
  }

  // ── Rules-based (no AI configured) ──────────────────────────────────────
  const hunts = await _rulesEngine(profile, options);
  return { hunts, method: 'rules' };
}

async function _rulesEngine(profile, options = {}) {
  const { maxHunts = 12, categories = [] } = options;
  await new Promise(resolve => setTimeout(resolve, 1800));

  const ctx  = analyzeProfile(profile);
  const vars = buildInterpolationVars(profile);
  let templates = selectTemplates(ctx, profile);

  if (categories.length > 0) {
    templates = templates.filter(t => categories.includes(t.category));
  }

  const selected = templates.slice(0, maxHunts);

  return selected.map(template => {
    const hunt = personalizeHunt(template, profile, ctx, vars);
    const coverageScore = computeDataSourceCoverage(hunt, profile);
    const priority = assignPriority(hunt.relevanceScore);
    return {
      ...hunt,
      priority,
      dataSourceCoverage: coverageScore,
      maturityFit: computeMaturityFit(template.maturityRequired, profile),
    };
  });
}

function computeMaturityFit(required, profile) {
  const maturityMap = { none: 0, basic: 1, intermediate: 2, advanced: 3, expert: 4, optimized: 5 };
  const org = maturityMap[profile.detectionMaturity || 'basic'] || 1;
  const req = maturityMap[required || 'intermediate'] || 2;

  if (req <= org) return 'good';
  if (req === org + 1) return 'stretch';
  return 'advanced';
}

// ── AI Prompt Builder (Future Integration Hook) ───────────────────────────────

/**
 * Build a structured prompt for an LLM to generate threat hunts.
 * This function is a placeholder for future AI integration.
 * To use: pass the output to your AI provider and parse the JSON response.
 */
export function buildAIPrompt(profile) {
  return {
    systemPrompt: `You are an expert threat hunter and detection engineer with 15+ years of SOC experience.
Generate highly specific, technically accurate threat hunting scenarios tailored to the company profile provided.
Each hunt should reflect real-world attacker TTPs relevant to this specific environment.
Return a JSON array of hunt objects following the schema provided.`,

    userPrompt: `Generate 12 threat hunting scenarios for the following company:

Company: ${profile.companyName}
Industry: ${profile.industry}
Size: ${profile.companySize}
Cloud: ${(profile.cloudProviders || []).join(', ')}
SIEM: ${profile.siemPlatform}
EDR: ${profile.edrPlatform}
IAM: ${profile.iamPlatform}
Email: ${profile.emailPlatform}
Data types: ${(profile.dataTypes || []).join(', ')}
Compliance: ${(profile.complianceRequirements || []).join(', ')}
Top threats: ${(profile.topThreats || []).join(', ')}
Known gaps: ${profile.securityGaps}
Recent incidents: ${profile.recentIncidents}

Return JSON array with fields: title, hypothesis, whyRelevant, mitreTechniques[], huntSteps[],
exampleQueries[], suspiciousBehaviors[], severity, confidence (0-100), category, tags[]`,

    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title:              { type: 'string' },
          hypothesis:         { type: 'string' },
          whyRelevant:        { type: 'string' },
          mitreTechniques:    { type: 'array', items: { type: 'string' } },
          huntSteps:          { type: 'array', items: { type: 'string' } },
          exampleQueries:     { type: 'array' },
          suspiciousBehaviors:{ type: 'array', items: { type: 'string' } },
          severity:           { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          confidence:         { type: 'number' },
          category:           { type: 'string' },
          tags:               { type: 'array', items: { type: 'string' } },
        },
      },
    },
  };
}

// ── Category Stats ─────────────────────────────────────────────────────────────

export function getCategoryStats(hunts) {
  const stats = {};
  HUNT_CATEGORIES.forEach(cat => {
    stats[cat.id] = { ...cat, count: 0, avgScore: 0 };
  });

  hunts.forEach(hunt => {
    if (stats[hunt.category]) {
      stats[hunt.category].count++;
      stats[hunt.category].avgScore =
        (stats[hunt.category].avgScore + (hunt.relevanceScore || 0)) / 2;
    }
  });

  return Object.values(stats).filter(c => c.count > 0);
}

export function getEnvironmentRiskScore(profile) {
  const ctx = analyzeProfile(profile);
  let riskScore = 50; // baseline

  // Exposure factors
  if (ctx.hasRDP)               riskScore += 10;
  if (ctx.hasInternetFacingApp) riskScore += 8;
  if (!ctx.hasEDR)              riskScore += 12;
  if (ctx.hasHighThirdPartyDependence) riskScore += 7;
  if (ctx.hasRemoteWork)        riskScore += 5;
  if (ctx.handlesHighSensitivityData) riskScore += 8;

  // Mitigation factors (reduce risk)
  if (ctx.hasM365 && profile.emailSecurityPlatform) riskScore -= 5;
  if (ctx.hasCloud && profile.casb) riskScore -= 5;
  if (profile.detectionMaturity === 'advanced') riskScore -= 8;
  if (profile.incidentResponseMaturity === 'advanced') riskScore -= 5;

  return Math.min(100, Math.max(1, Math.round(riskScore)));
}
