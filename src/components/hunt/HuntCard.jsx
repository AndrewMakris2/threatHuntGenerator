import React, { useState } from 'react';
import {
  Bookmark, BookmarkCheck, ChevronDown, ExternalLink,
  Clock, Target, Layers, TrendingUp, AlertTriangle,
  Shield, Database, Copy, Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MITREList } from './MITREBadge';
import { HUNT_CATEGORIES } from '../../data/huntTemplates';
import { exportSingleHuntJSON, copyHuntToClipboard } from '../../services/exportService';
import './HuntCard.css';

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', cls: 'badge-critical', dotCls: 'critical' },
  high:     { label: 'High',     cls: 'badge-high',     dotCls: 'high'     },
  medium:   { label: 'Medium',   cls: 'badge-medium',   dotCls: 'medium'   },
  low:      { label: 'Low',      cls: 'badge-low',       dotCls: 'low'     },
};

const MATURITY_LABELS = { good: 'Good Fit', stretch: 'Stretch', advanced: 'Advanced' };
const MATURITY_COLORS = { good: 'badge-low', stretch: 'badge-medium', advanced: 'badge-high' };

export default function HuntCard({ hunt, onOpen, compact = false }) {
  const { isHuntSaved, toggleSaveHunt, addToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const saved = isHuntSaved(hunt.id);

  const sev  = SEVERITY_CONFIG[hunt.severity] || SEVERITY_CONFIG.medium;
  const category = HUNT_CATEGORIES.find(c => c.id === hunt.category);
  const coverage = hunt.dataSourceCoverage || 0;

  function handleCopy() {
    copyHuntToClipboard(hunt)
      .then(() => addToast('Hunt copied to clipboard', 'success'))
      .catch(() => addToast('Copy failed', 'error'));
  }

  function handleExportJSON() {
    exportSingleHuntJSON(hunt);
    addToast('Hunt exported as JSON', 'success');
  }

  return (
    <article
      className={`hunt-card animate-fade-in ${compact ? 'compact' : ''}`}
      style={{ '--cat-color': category?.color || 'var(--accent-primary)' }}
    >
      {/* Category accent */}
      <div className="hunt-card-accent" />

      {/* Header */}
      <div className="hunt-card-header">
        <div className="hunt-card-meta">
          {category && (
            <span
              className="hunt-card-category"
              style={{ color: category.color, background: `${category.color}15`, borderColor: `${category.color}30` }}
            >
              {category.label}
            </span>
          )}
          <span className={`badge ${sev.cls}`}>
            <span className={`severity-dot ${sev.dotCls}`} />
            {sev.label}
          </span>
          {hunt.maturityFit && (
            <span className={`badge ${MATURITY_COLORS[hunt.maturityFit] || 'badge-info'}`}>
              {MATURITY_LABELS[hunt.maturityFit] || hunt.maturityFit}
            </span>
          )}
        </div>

        <div className="hunt-card-actions">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={handleExportJSON}
            title="Export JSON"
          >
            <Download size={14} />
          </button>
          <button
            className={`btn btn-ghost btn-icon btn-sm ${saved ? 'saved' : ''}`}
            onClick={() => toggleSaveHunt(hunt)}
            title={saved ? 'Remove from saved' : 'Save hunt'}
            style={saved ? { color: 'var(--accent-primary)' } : {}}
          >
            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="hunt-card-title" onClick={() => onOpen?.(hunt)}>
        {hunt.title}
      </h3>

      {/* Why relevant */}
      <p className="hunt-card-why">
        {hunt.whyRelevant || hunt.hypothesis || ''}
      </p>

      {/* Stats row */}
      <div className="hunt-card-stats">
        <div className="hunt-card-stat">
          <TrendingUp size={13} />
          <span className="hunt-card-stat-value">{hunt.relevanceScore}%</span>
          <span className="hunt-card-stat-label">Relevance</span>
        </div>
        <div className="hunt-card-stat">
          <Shield size={13} />
          <span className="hunt-card-stat-value">{hunt.confidence}%</span>
          <span className="hunt-card-stat-label">Confidence</span>
        </div>
        <div className="hunt-card-stat">
          <Database size={13} />
          <span className="hunt-card-stat-value">{coverage}%</span>
          <span className="hunt-card-stat-label">Coverage</span>
        </div>
        <div className="hunt-card-stat">
          <Clock size={13} />
          <span className="hunt-card-stat-value">{hunt.estimatedTime}</span>
          <span className="hunt-card-stat-label">Est. Time</span>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="hunt-card-coverage">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>

      {/* MITRE badges */}
      {hunt.mitreTechniques?.length > 0 && (
        <div className="hunt-card-mitre">
          <MITREList techniques={hunt.mitreTechniques} max={4} />
        </div>
      )}

      {/* Tags */}
      {hunt.tags?.length > 0 && !compact && (
        <div className="hunt-card-tags">
          {hunt.tags.slice(0, 5).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {/* Expand / collapse */}
      {!compact && (
        <>
          <button
            className="hunt-card-expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            <span>{expanded ? 'Less details' : 'Quick preview'}</span>
            <ChevronDown
              size={14}
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {expanded && (
            <div className="hunt-card-preview animate-fade-in">
              <div className="hunt-card-preview-section">
                <div className="label mb-2">Hypothesis</div>
                <p className="hunt-card-preview-text">{hunt.hypothesis}</p>
              </div>

              {hunt.huntSteps?.length > 0 && (
                <div className="hunt-card-preview-section">
                  <div className="label mb-2">First 3 Hunt Steps</div>
                  <ol className="hunt-card-steps">
                    {hunt.huntSteps.slice(0, 3).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {hunt.exampleQueries?.[0] && (
                <div className="hunt-card-preview-section">
                  <div className="label mb-2">{hunt.exampleQueries[0].platform}</div>
                  <pre className="code-block" style={{ maxHeight: 160, overflow: 'auto' }}>
                    {hunt.exampleQueries[0].query}
                  </pre>
                </div>
              )}

              {hunt.suspiciousBehaviors?.length > 0 && (
                <div className="hunt-card-preview-section">
                  <div className="label mb-2">
                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Suspicious Behaviors
                  </div>
                  <ul className="hunt-card-behaviors">
                    {hunt.suspiciousBehaviors.slice(0, 3).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Open detail button */}
      <button
        className="btn btn-secondary hunt-card-open-btn"
        onClick={() => onOpen?.(hunt)}
      >
        <ExternalLink size={14} />
        Full Hunt Detail
      </button>
    </article>
  );
}
