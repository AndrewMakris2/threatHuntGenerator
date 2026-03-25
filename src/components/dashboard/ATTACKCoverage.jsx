import React from 'react';
import { MITRE_TACTICS, getTacticColor } from '../../data/mitreTechniques';
import './ATTACKCoverage.css';

/**
 * ATTACKCoverage — visual matrix showing which MITRE tactics are covered by generated hunts
 */
export default function ATTACKCoverage({ hunts = [] }) {
  // Count technique coverage per tactic
  const tacticCounts = {};
  MITRE_TACTICS.forEach(tactic => { tacticCounts[tactic] = 0; });

  hunts.forEach(hunt => {
    (hunt.mitreTechniques || []).forEach(techniqueId => {
      // Map technique IDs to tactics from our data
      const tacticsHit = getTacticsFromTechniques([techniqueId]);
      tacticsHit.forEach(tactic => {
        if (tacticCounts[tactic] !== undefined) {
          tacticCounts[tactic]++;
        }
      });
    });
  });

  const maxCount = Math.max(...Object.values(tacticCounts), 1);

  return (
    <div className="attack-coverage">
      <div className="attack-coverage-grid">
        {MITRE_TACTICS.map(tactic => {
          const count = tacticCounts[tactic] || 0;
          const pct = (count / maxCount) * 100;
          const color = getTacticColor(tactic);
          const covered = count > 0;

          return (
            <div
              key={tactic}
              className={`attack-tactic-cell ${covered ? 'covered' : 'uncovered'}`}
              style={{
                '--tactic-color': color,
                '--tactic-opacity': covered ? Math.max(0.2, pct / 100) : 0,
              }}
              title={`${tactic}: ${count} technique(s) covered`}
            >
              <div className="attack-tactic-fill" />
              <div className="attack-tactic-name">{tactic}</div>
              <div className="attack-tactic-count">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="attack-coverage-legend">
        <div className="attack-legend-item">
          <div className="attack-legend-dot covered-dot" />
          <span>Covered</span>
        </div>
        <div className="attack-legend-item">
          <div className="attack-legend-dot uncovered-dot" />
          <span>Not covered</span>
        </div>
        <div className="attack-coverage-summary">
          {Object.values(tacticCounts).filter(c => c > 0).length} / {MITRE_TACTICS.length} tactics covered
        </div>
      </div>
    </div>
  );
}

function getTacticsFromTechniques(ids) {
  const tacticMap = {
    'T1566': 'Initial Access', 'T1566.001': 'Initial Access', 'T1566.002': 'Initial Access',
    'T1190': 'Initial Access', 'T1078': 'Initial Access', 'T1078.004': 'Initial Access',
    'T1133': 'Initial Access', 'T1195': 'Initial Access', 'T1199': 'Initial Access',
    'T1059': 'Execution', 'T1059.001': 'Execution', 'T1059.003': 'Execution',
    'T1059.007': 'Execution', 'T1204': 'Execution', 'T1047': 'Execution',
    'T1053': 'Persistence', 'T1543': 'Persistence', 'T1547': 'Persistence',
    'T1098': 'Persistence', 'T1098.001': 'Persistence', 'T1136': 'Persistence',
    'T1548': 'Privilege Escalation', 'T1068': 'Privilege Escalation',
    'T1134': 'Privilege Escalation', 'T1484': 'Privilege Escalation',
    'T1562': 'Defense Evasion', 'T1070': 'Defense Evasion', 'T1036': 'Defense Evasion',
    'T1055': 'Defense Evasion', 'T1218': 'Defense Evasion',
    'T1110': 'Credential Access', 'T1110.001': 'Credential Access',
    'T1110.003': 'Credential Access', 'T1003': 'Credential Access',
    'T1003.001': 'Credential Access', 'T1528': 'Credential Access',
    'T1539': 'Credential Access', 'T1606': 'Credential Access', 'T1606.002': 'Credential Access',
    'T1555': 'Credential Access',
    'T1087': 'Discovery', 'T1069': 'Discovery', 'T1083': 'Discovery',
    'T1046': 'Discovery', 'T1057': 'Discovery', 'T1526': 'Discovery', 'T1580': 'Discovery',
    'T1021': 'Lateral Movement', 'T1021.001': 'Lateral Movement',
    'T1021.002': 'Lateral Movement', 'T1550': 'Lateral Movement',
    'T1550.002': 'Lateral Movement', 'T1534': 'Lateral Movement',
    'T1114': 'Collection', 'T1213': 'Collection', 'T1213.002': 'Collection', 'T1530': 'Collection',
    'T1048': 'Exfiltration', 'T1567': 'Exfiltration', 'T1567.002': 'Exfiltration',
    'T1041': 'Exfiltration',
    'T1486': 'Impact', 'T1490': 'Impact', 'T1485': 'Impact',
    'T1498': 'Impact', 'T1496': 'Impact',
    'T1621': 'Credential Access',
    'T1570': 'Lateral Movement',
  };

  const tactics = new Set();
  ids.forEach(id => {
    const tactic = tacticMap[id];
    if (tactic) tactics.add(tactic);
  });
  return [...tactics];
}
