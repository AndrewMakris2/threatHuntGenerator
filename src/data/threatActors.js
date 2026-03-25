/**
 * Threat Actor Intelligence Reference
 * Used to map company profiles to likely adversary groups
 */

export const THREAT_ACTORS = {
  APT29: {
    id: 'APT29',
    name: 'APT29 (Cozy Bear)',
    nation: 'Russia',
    aliases: ['Cozy Bear', 'The Dukes', 'NOBELIUM'],
    motivation: ['espionage', 'data-theft'],
    targetedIndustries: ['government', 'energy', 'technology', 'healthcare', 'finance'],
    targetedRegions: ['us', 'eu', 'nato'],
    primaryTechniques: ['T1566.001', 'T1078', 'T1606.002', 'T1098', 'T1136'],
    description: 'Sophisticated Russian SVR-linked group known for supply chain attacks and identity-based intrusions. Often targets high-value government and enterprise environments.',
    color: '#ef4444',
    riskLevel: 'critical',
  },
  APT28: {
    id: 'APT28',
    name: 'APT28 (Fancy Bear)',
    nation: 'Russia',
    aliases: ['Fancy Bear', 'STRONTIUM', 'Sofacy'],
    motivation: ['espionage', 'disruption'],
    targetedIndustries: ['government', 'defense', 'aerospace', 'media', 'energy'],
    targetedRegions: ['us', 'eu', 'nato'],
    primaryTechniques: ['T1566', 'T1078', 'T1110.003', 'T1021.001'],
    description: 'Russian GRU-linked group focused on credential harvesting and phishing campaigns targeting political and defense organizations.',
    color: '#ef4444',
    riskLevel: 'critical',
  },
  LAZARUS: {
    id: 'LAZARUS',
    name: 'Lazarus Group',
    nation: 'North Korea',
    aliases: ['Hidden Cobra', 'Zinc', 'Guardians of Peace'],
    motivation: ['financial', 'espionage', 'sabotage'],
    targetedIndustries: ['finance', 'cryptocurrency', 'defense', 'media'],
    targetedRegions: ['us', 'eu', 'asia'],
    primaryTechniques: ['T1566.001', 'T1195', 'T1486', 'T1528'],
    description: 'North Korean state-sponsored group with a dual focus on financial theft (particularly crypto) and geopolitical espionage.',
    color: '#a855f7',
    riskLevel: 'critical',
  },
  FIN7: {
    id: 'FIN7',
    name: 'FIN7 / Carbanak',
    nation: 'Unknown (Eastern Europe)',
    aliases: ['Carbanak', 'Navigator Group'],
    motivation: ['financial'],
    targetedIndustries: ['retail', 'hospitality', 'finance', 'restaurant'],
    targetedRegions: ['us', 'eu'],
    primaryTechniques: ['T1566.001', 'T1059.001', 'T1055', 'T1048'],
    description: 'Financially motivated criminal group known for large-scale POS malware campaigns and business email compromise targeting payment data.',
    color: '#f97316',
    riskLevel: 'high',
  },
  LAPSUS: {
    id: 'LAPSUS',
    name: 'LAPSUS$',
    nation: 'Unknown',
    aliases: ['DEV-0537'],
    motivation: ['extortion', 'notoriety', 'financial'],
    targetedIndustries: ['technology', 'telecommunications', 'gaming', 'media'],
    targetedRegions: ['us', 'eu', 'global'],
    primaryTechniques: ['T1078', 'T1110.003', 'T1528', 'T1213', 'T1098.001'],
    description: 'Extortion-focused group known for targeting identity and access management systems, SIM swapping, and social engineering of IT support.',
    color: '#ec4899',
    riskLevel: 'high',
  },
  SCATTERED_SPIDER: {
    id: 'SCATTERED_SPIDER',
    name: 'Scattered Spider',
    nation: 'Unknown',
    aliases: ['Muddled Libra', 'UNC3944', 'Oktapus'],
    motivation: ['financial', 'data-theft', 'ransomware'],
    targetedIndustries: ['technology', 'hospitality', 'retail', 'finance', 'gaming'],
    targetedRegions: ['us', 'eu'],
    primaryTechniques: ['T1566', 'T1078', 'T1539', 'T1098', 'T1486'],
    description: 'Social engineering specialists known for MFA fatigue attacks, helpdesk impersonation, and identity platform abuse leading to ransomware deployment.',
    color: '#ec4899',
    riskLevel: 'high',
  },
  WIZARD_SPIDER: {
    id: 'WIZARD_SPIDER',
    name: 'Wizard Spider / Conti',
    nation: 'Russia',
    aliases: ['UNC1878', 'Ryuk', 'Conti'],
    motivation: ['ransomware', 'financial'],
    targetedIndustries: ['healthcare', 'government', 'education', 'manufacturing'],
    targetedRegions: ['us', 'eu', 'global'],
    primaryTechniques: ['T1566.001', 'T1059.001', 'T1486', 'T1490', 'T1021.002'],
    description: 'Ransomware-as-a-service operator behind Ryuk and Conti variants. Frequently targets critical infrastructure and healthcare.',
    color: '#ef4444',
    riskLevel: 'critical',
  },
  CLOP: {
    id: 'CLOP',
    name: 'CL0P Ransomware Group',
    nation: 'Unknown (CIS)',
    aliases: ['TA505'],
    motivation: ['ransomware', 'extortion', 'financial'],
    targetedIndustries: ['finance', 'healthcare', 'education', 'manufacturing', 'technology'],
    targetedRegions: ['us', 'eu', 'global'],
    primaryTechniques: ['T1190', 'T1486', 'T1567.002', 'T1048'],
    description: 'Ransomware group known for mass-exploitation of file-transfer vulnerabilities (MOVEit, GoAnywhere) and large-scale data extortion.',
    color: '#f97316',
    riskLevel: 'critical',
  },
  ANONYMOUS: {
    id: 'ANONYMOUS',
    name: 'Hacktivist Groups',
    nation: 'Various',
    aliases: ['Anonymous', 'KillNet'],
    motivation: ['disruption', 'ideology', 'notoriety'],
    targetedIndustries: ['government', 'media', 'energy', 'finance'],
    targetedRegions: ['global'],
    primaryTechniques: ['T1498', 'T1190', 'T1059.007'],
    description: 'Loosely organized hacktivist collectives motivated by political ideology. Known for DDoS campaigns and website defacement.',
    color: '#22c55e',
    riskLevel: 'medium',
  },
  INSIDER: {
    id: 'INSIDER',
    name: 'Malicious Insider',
    nation: 'Internal',
    aliases: [],
    motivation: ['financial', 'revenge', 'espionage'],
    targetedIndustries: ['all'],
    targetedRegions: ['all'],
    primaryTechniques: ['T1078', 'T1213', 'T1567', 'T1048', 'T1485'],
    description: 'Current or former employees, contractors, or trusted partners who abuse legitimate access to cause harm, steal data, or assist external actors.',
    color: '#eab308',
    riskLevel: 'high',
  },
};

/**
 * Map a company profile to likely threat actors
 */
export const getRelevantThreatActors = (profile) => {
  const actors = [];
  const industry = (profile.industry || '').toLowerCase();
  const regions = (profile.regions || []).map(r => r.toLowerCase());
  const hasCloud = (profile.cloudProviders || []).length > 0;
  const hasSaaS = (profile.criticalApps || '').toLowerCase().includes('saas');

  Object.values(THREAT_ACTORS).forEach(actor => {
    let score = 0;

    // Industry match
    const industryMatch = actor.targetedIndustries.some(i =>
      i === 'all' || industry.includes(i)
    );
    if (industryMatch) score += 3;

    // Region overlap
    const regionMatch = actor.targetedRegions.some(r =>
      r === 'global' || regions.some(ur => ur.includes(r))
    );
    if (regionMatch) score += 2;

    // Cloud presence increases LAPSUS / scattered spider relevance
    if (hasCloud && ['LAPSUS', 'SCATTERED_SPIDER', 'APT29'].includes(actor.id)) score += 2;

    // Ransomware actors always relevant
    if (actor.motivation.includes('ransomware')) score += 1;

    if (score >= 3) actors.push({ ...actor, relevanceScore: score });
  });

  return actors.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
};
