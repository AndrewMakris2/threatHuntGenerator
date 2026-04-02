import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Crosshair, CheckCircle, Circle, Sparkles,
  TrendingUp, Target, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  MITRE_TACTICS, MITRE_TECHNIQUES, getTechniquesByTactic, getTacticColor,
} from '../data/mitreTechniques';
import './Coverage.css';

export default function Coverage() {
  const { state } = useApp();
  const navigate  = useNavigate();
  const [expandedTactics, setExpandedTactics] = useState(new Set(MITRE_TACTICS));

  const allHunts = useMemo(
    () => [...(state.generatedHunts || []), ...(state.savedHunts || [])],
    [state.generatedHunts, state.savedHunts],
  );

  // Build a set of all covered technique IDs from every hunt
  const coveredIds = useMemo(() => {
    const ids = new Set();
    allHunts.forEach(hunt => {
      (hunt.mitreTechniques || []).forEach(t => {
        const id = typeof t === 'string' ? t : t?.id;
        if (id) {
          ids.add(id);
          // Also credit the parent technique
          const entry = MITRE_TECHNIQUES[id];
          if (entry?.parent) ids.add(entry.parent);
        }
      });
    });
    return ids;
  }, [allHunts]);

  // Per-technique: how many hunts reference it
  const techniqueHuntCount = useMemo(() => {
    const counts = {};
    allHunts.forEach(hunt => {
      (hunt.mitreTechniques || []).forEach(t => {
        const id = typeof t === 'string' ? t : t?.id;
        if (id) counts[id] = (counts[id] || 0) + 1;
      });
    });
    return counts;
  }, [allHunts]);

  const totalTechniques = Object.values(MITRE_TECHNIQUES).filter(t => !t.parent).length;
  const coveredTopLevel = Object.values(MITRE_TECHNIQUES)
    .filter(t => !t.parent && coveredIds.has(t.id)).length;
  const coveragePct = totalTechniques > 0
    ? Math.round((coveredTopLevel / totalTechniques) * 100) : 0;

  function toggleTactic(tactic) {
    setExpandedTactics(prev => {
      const next = new Set(prev);
      next.has(tactic) ? next.delete(tactic) : next.add(tactic);
      return next;
    });
  }

  if (allHunts.length === 0) {
    return (
      <div className="page-container coverage-empty">
        <div className="coverage-empty-inner">
          <div className="coverage-empty-icon"><Shield size={36} /></div>
          <h1 className="page-title">MITRE ATT&amp;CK Coverage</h1>
          <p className="page-subtitle" style={{ textAlign: 'center', maxWidth: 440 }}>
            Generate or save hunts to start tracking your MITRE ATT&amp;CK coverage.
            Each hunt maps to specific techniques and builds your coverage heatmap.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/generate')}>
            <Sparkles size={15} /> Generate Hunts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className="section-header">
        <div>
          <h1 className="page-title">
            <Shield size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            MITRE ATT&amp;CK Coverage
          </h1>
          <p className="page-subtitle">
            Techniques covered across {allHunts.length} hunt{allHunts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/generate')}>
          <Sparkles size={14} /> Generate More Hunts
        </button>
      </div>

      {/* ── Coverage Summary ── */}
      <div className="coverage-summary">
        <div className="coverage-summary-main">
          <div className="coverage-donut-wrap">
            <svg viewBox="0 0 120 120" className="coverage-donut">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="var(--accent-primary)" strokeWidth="12"
                strokeDasharray={`${coveragePct * 3.14} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
            </svg>
            <div className="coverage-donut-label">
              <div className="coverage-donut-pct">{coveragePct}%</div>
              <div className="coverage-donut-sub">covered</div>
            </div>
          </div>
          <div className="coverage-summary-stats">
            <div className="coverage-stat">
              <div className="coverage-stat-value" style={{ color: 'var(--status-success)' }}>{coveredTopLevel}</div>
              <div className="coverage-stat-label">Techniques Covered</div>
            </div>
            <div className="coverage-stat">
              <div className="coverage-stat-value" style={{ color: 'var(--text-muted)' }}>{totalTechniques - coveredTopLevel}</div>
              <div className="coverage-stat-label">Not Yet Hunted</div>
            </div>
            <div className="coverage-stat">
              <div className="coverage-stat-value">{allHunts.length}</div>
              <div className="coverage-stat-label">Total Hunts</div>
            </div>
            <div className="coverage-stat">
              <div className="coverage-stat-value">{MITRE_TACTICS.length}</div>
              <div className="coverage-stat-label">Tactics Tracked</div>
            </div>
          </div>
        </div>

        {/* Coverage bar per tactic */}
        <div className="coverage-tactic-bars">
          {MITRE_TACTICS.map(tactic => {
            const all     = getTechniquesByTactic(tactic);
            const covered = all.filter(t => coveredIds.has(t.id)).length;
            const pct     = all.length > 0 ? Math.round((covered / all.length) * 100) : 0;
            const color   = getTacticColor(tactic);
            return (
              <div key={tactic} className="coverage-tactic-bar-row">
                <div className="coverage-tactic-bar-label">{tactic}</div>
                <div className="coverage-tactic-bar-track">
                  <div
                    className="coverage-tactic-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                <div className="coverage-tactic-bar-pct" style={{ color }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Technique Grid by Tactic ── */}
      <div className="coverage-tactics">
        {MITRE_TACTICS.map(tactic => {
          const techniques = getTechniquesByTactic(tactic);
          const coveredCount = techniques.filter(t => coveredIds.has(t.id)).length;
          const color  = getTacticColor(tactic);
          const open   = expandedTactics.has(tactic);

          return (
            <div key={tactic} className="coverage-tactic-section">
              <button
                className="coverage-tactic-header"
                onClick={() => toggleTactic(tactic)}
                style={{ '--tactic-color': color }}
              >
                <div className="coverage-tactic-header-left">
                  {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <span className="coverage-tactic-name">{tactic}</span>
                  <span className="coverage-tactic-count">
                    {coveredCount}/{techniques.length}
                  </span>
                </div>
                <div className="coverage-tactic-mini-bar">
                  <div
                    className="coverage-tactic-mini-fill"
                    style={{
                      width: `${techniques.length > 0 ? (coveredCount / techniques.length) * 100 : 0}%`,
                      background: color,
                    }}
                  />
                </div>
              </button>

              {open && (
                <div className="coverage-technique-grid">
                  {techniques.map(tech => {
                    const covered = coveredIds.has(tech.id);
                    const huntCount = techniqueHuntCount[tech.id] || 0;
                    return (
                      <div
                        key={tech.id}
                        className={`coverage-technique-cell ${covered ? 'covered' : 'uncovered'}`}
                        style={covered ? { '--cell-color': color } : {}}
                        title={`${tech.id} — ${tech.name}${covered ? ` (${huntCount} hunt${huntCount !== 1 ? 's' : ''})` : ' — not yet hunted'}`}
                      >
                        <div className="coverage-technique-id">{tech.id}</div>
                        <div className="coverage-technique-name">{tech.name}</div>
                        {covered && (
                          <div className="coverage-technique-badge">
                            <CheckCircle size={10} />
                            {huntCount > 1 && <span>{huntCount}×</span>}
                          </div>
                        )}
                        {!covered && (
                          <div className="coverage-technique-gap">
                            <Circle size={10} />
                            <span>gap</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Gap Analysis CTA ── */}
      <div className="card card-accent coverage-gap-cta">
        <Target size={24} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <div>
          <h3 className="section-title">
            {totalTechniques - coveredTopLevel} technique{totalTechniques - coveredTopLevel !== 1 ? 's' : ''} not yet covered
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
            Generate targeted hunts for your uncovered tactics to improve your overall coverage score.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/generate')}>
          <Sparkles size={14} /> Generate Targeted Hunts
        </button>
      </div>
    </div>
  );
}
