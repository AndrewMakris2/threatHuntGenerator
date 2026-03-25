import React from 'react';
import './RiskHeatmap.css';

const RISK_AREAS = [
  { id: 'identity',    label: 'Identity',      factors: ['iamPlatform', 'hasCloud', 'remoteWorkLevel'] },
  { id: 'endpoint',    label: 'Endpoint',      factors: ['edrPlatform', 'operatingSystems'] },
  { id: 'cloud',       label: 'Cloud',         factors: ['cloudProviders', 'casb'] },
  { id: 'email',       label: 'Email',         factors: ['emailPlatform', 'emailSecurityPlatform'] },
  { id: 'network',     label: 'Network',       factors: ['networkSegmentation', 'internetFacingSystems'] },
  { id: 'data',        label: 'Data',          factors: ['dataSensitivity', 'dataTypes'] },
  { id: 'thirdparty',  label: 'Third Party',   factors: ['thirdPartyDependence'] },
  { id: 'insider',     label: 'Insider',       factors: ['remoteWorkLevel', 'dataSensitivity'] },
];

function computeRiskScore(area, profile) {
  let score = 40; // baseline

  switch (area.id) {
    case 'identity':
      if (!profile.iamPlatform || profile.iamPlatform === 'none') score += 25;
      if (profile.remoteWorkLevel === 'full') score += 15;
      if (profile.cloudProviders?.length > 0) score += 10;
      if (profile.iamPlatform?.includes('Okta') || profile.iamPlatform?.includes('Entra')) score -= 10;
      break;

    case 'endpoint':
      if (!profile.edrPlatform || profile.edrPlatform === 'none') score += 30;
      if ((profile.operatingSystems || []).includes('windows10')) score += 5;
      if (profile.edrPlatform?.includes('CrowdStrike') || profile.edrPlatform?.includes('SentinelOne')) score -= 10;
      break;

    case 'cloud':
      if ((profile.cloudProviders || []).length === 0) score -= 20;
      else {
        score += (profile.cloudProviders || []).length * 8;
        if (!profile.casb) score += 15;
        if (profile.casb) score -= 10;
      }
      break;

    case 'email':
      if (!profile.emailSecurityPlatform) score += 20;
      if (profile.emailPlatform?.includes('365')) score += 5; // higher exposure
      if (profile.emailSecurityPlatform?.includes('Proofpoint') || profile.emailSecurityPlatform?.includes('Mimecast')) score -= 10;
      break;

    case 'network':
      if (profile.networkSegmentation === 'none') score += 20;
      if (profile.networkSegmentation === 'full') score -= 10;
      score += (profile.internetFacingSystems || []).length * 5;
      if ((profile.internetFacingSystems || []).includes('rdp')) score += 15;
      break;

    case 'data':
      if (profile.dataSensitivity === 'critical') score += 25;
      else if (profile.dataSensitivity === 'high') score += 15;
      if ((profile.dataTypes || []).includes('payment-card')) score += 10;
      if ((profile.dataTypes || []).includes('phi')) score += 10;
      break;

    case 'thirdparty':
      if (profile.thirdPartyDependence === 'high') score += 25;
      else if (profile.thirdPartyDependence === 'medium') score += 10;
      if (!profile.pamSolution) score += 10;
      break;

    case 'insider':
      if (profile.remoteWorkLevel === 'full') score += 20;
      if (profile.dataSensitivity === 'critical') score += 15;
      if ((profile.dataTypes || []).includes('intellectual-property')) score += 10;
      break;

    default:
      break;
  }

  return Math.min(100, Math.max(5, Math.round(score)));
}

function getRiskLevel(score) {
  if (score >= 75) return { label: 'Critical', cls: 'risk-critical' };
  if (score >= 55) return { label: 'High',     cls: 'risk-high'     };
  if (score >= 35) return { label: 'Medium',   cls: 'risk-medium'   };
  return                   { label: 'Low',      cls: 'risk-low'      };
}

export default function RiskHeatmap({ profile }) {
  if (!profile) return null;

  const risks = RISK_AREAS.map(area => ({
    ...area,
    score: computeRiskScore(area, profile),
  }));

  const overallRisk = Math.round(risks.reduce((sum, r) => sum + r.score, 0) / risks.length);

  return (
    <div className="risk-heatmap">
      <div className="risk-heatmap-grid">
        {risks.map(risk => {
          const level = getRiskLevel(risk.score);
          return (
            <div
              key={risk.id}
              className={`risk-cell ${level.cls}`}
              title={`${risk.label}: ${risk.score}/100`}
            >
              <div className="risk-cell-bar" style={{ height: `${risk.score}%` }} />
              <div className="risk-cell-content">
                <div className="risk-cell-score">{risk.score}</div>
                <div className="risk-cell-label">{risk.label}</div>
                <div className="risk-cell-level">{level.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="risk-heatmap-overall">
        <div className="risk-overall-label">Overall Risk Score</div>
        <div className="risk-overall-score" style={{ color: getRiskLevel(overallRisk).cls === 'risk-critical' ? 'var(--severity-critical)' : getRiskLevel(overallRisk).cls === 'risk-high' ? 'var(--severity-high)' : getRiskLevel(overallRisk).cls === 'risk-medium' ? 'var(--severity-medium)' : 'var(--severity-low)' }}>
          {overallRisk}<span className="risk-overall-max">/100</span>
        </div>
        <div className="risk-overall-bar">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${overallRisk}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
