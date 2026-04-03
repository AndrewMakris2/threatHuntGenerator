import React from 'react';
import { getTechniqueById, getTacticColor } from '../../data/mitreTechniques';

/**
 * MITREBadge — renders a MITRE ATT&CK technique badge
 */
export default function MITREBadge({ techniqueId, showTactic = false, size = 'sm' }) {
  // techniqueId can be a string "T1078" or an object {id, name, tactic}
  const idStr = typeof techniqueId === 'string' ? techniqueId : techniqueId?.id;
  const technique = getTechniqueById(idStr);
  if (!technique) {
    return (
      <span className="badge badge-info" title={idStr}>
        {idStr}
      </span>
    );
  }

  const color = getTacticColor(technique.tactic);

  return (
    <span
      className="mitre-badge"
      style={{
        '--mitre-color': color,
        '--mitre-bg': `${color}1a`,
        '--mitre-border': `${color}40`,
      }}
      title={`${technique.name} (${technique.tactic})`}
    >
      <span className="mitre-badge-id">{idStr}</span>
      {size !== 'sm' && (
        <span className="mitre-badge-name">{technique.name}</span>
      )}
      {showTactic && (
        <span className="mitre-badge-tactic">{technique.tactic}</span>
      )}
    </span>
  );
}

export function MITREList({ techniques = [], max = 5 }) {
  const visible = techniques.slice(0, max);
  const overflow = techniques.length - max;

  return (
    <div className="mitre-list">
      {visible.map((t, i) => {
        const id = typeof t === 'string' ? t : t?.id;
        return <MITREBadge key={id || i} techniqueId={t} />;
      })}
      {overflow > 0 && (
        <span className="badge badge-info">+{overflow}</span>
      )}
    </div>
  );
}
