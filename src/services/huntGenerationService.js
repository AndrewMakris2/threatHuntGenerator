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

// ── Main Generation Function ──────────────────────────────────────────────────

/**
 * Generate personalized threat hunts for a given company profile
 * @param {Object} profile - Company profile object
 * @param {Object} options - Generation options (maxHunts, categories filter)
 * @returns {Array} - Array of personalized hunt objects
 */
export async function generateHunts(profile, options = {}) {
  const { maxHunts = 12, categories = [] } = options;

  // Simulate async processing (replace with actual AI call here)
  await new Promise(resolve => setTimeout(resolve, 1800));

  const ctx  = analyzeProfile(profile);
  const vars = buildInterpolationVars(profile);
  let templates = selectTemplates(ctx, profile);

  // Apply category filter if specified
  if (categories.length > 0) {
    templates = templates.filter(t => categories.includes(t.category));
  }

  // Limit to maxHunts
  const selected = templates.slice(0, maxHunts);

  // Personalize each hunt
  const hunts = selected.map(template => {
    const hunt = personalizeHunt(template, profile, ctx, vars);
    const coverageScore = computeDataSourceCoverage(hunt, profile);
    const priority = assignPriority(hunt.relevanceScore);

    return {
      ...hunt,
      priority,
      dataSourceCoverage: coverageScore,
      // Computed analysis fields
      maturityFit: computeMaturityFit(template.maturityRequired, profile),
    };
  });

  return hunts;
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
