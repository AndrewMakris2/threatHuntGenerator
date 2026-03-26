import React, { useState } from 'react';
import {
  Bookmark, BookmarkCheck, X, Shield, Target, Clock,
  AlertTriangle, CheckCircle, XCircle, TrendingUp, Database,
  Download, Copy, FileText, User, Layers,
  Info, Zap, ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import MITREBadge from './MITREBadge';
import { getTechniqueById } from '../../data/mitreTechniques';
import {
  exportHuntAsMarkdown, exportSingleHuntJSON, copyHuntToClipboard, copyQueryToClipboard,
} from '../../services/exportService';
import { HUNT_CATEGORIES } from '../../data/huntTemplates';
import PDFCustomizer from '../export/PDFCustomizer';
import './HuntDetail.css';

const TABS = ['Overview', 'Hunt Steps', 'Queries', 'IOCs', 'Remediation', 'Notes'];

export default function HuntDetail({ hunt, onClose }) {
  const { isHuntSaved, toggleSaveHunt, addToast, activeCompany } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [notes, setNotes]         = useState(hunt.notes || '');
  const [showPDFCustomizer, setShowPDFCustomizer] = useState(false);

  if (!hunt) return null;

  const saved    = isHuntSaved(hunt.id);
  const category = HUNT_CATEGORIES.find(c => c.id === hunt.category);

  function handleCopy() {
    copyHuntToClipboard(hunt)
      .then(() => addToast('Hunt copied to clipboard', 'success'))
      .catch(() => addToast('Copy failed', 'error'));
  }

  function handleExportMD() {
    exportHuntAsMarkdown(hunt);
    addToast('Hunt exported as Markdown', 'success');
  }

  function handleExportJSON() {
    exportSingleHuntJSON(hunt);
    addToast('Hunt exported as JSON', 'success');
  }

  function handleCopyQuery(query) {
    copyQueryToClipboard(query)
      .then(() => addToast(`Query copied to clipboard`, 'success'))
      .catch(() => addToast('Copy failed', 'error'));
  }

  return (
    <div className="hunt-detail">
      {/* ── Header ── */}
      <div className="hunt-detail-header">
        <div className="hunt-detail-header-top">
          <div className="hunt-detail-badges">
            {category && (
              <span
                className="hunt-card-category"
                style={{ color: category.color, background: `${category.color}15`, borderColor: `${category.color}30` }}
              >
                {category.label}
              </span>
            )}
            <SeverityBadge severity={hunt.severity} />
            <DifficultyBadge difficulty={hunt.difficulty} />
          </div>

          <div className="hunt-detail-header-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
              <Copy size={13} /> Copy
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportMD}>
              <FileText size={13} /> Markdown
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
              <Download size={13} /> JSON
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPDFCustomizer(true)}>
              <FileText size={13} /> PDF
            </button>
            <button
              className={`btn btn-sm ${saved ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => toggleSaveHunt(hunt)}
            >
              {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {saved ? 'Saved' : 'Save Hunt'}
            </button>
            {onClose && (
              <button className="btn btn-ghost btn-icon" onClick={onClose}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <h1 className="hunt-detail-title">{hunt.title}</h1>

        {/* Metrics strip */}
        <div className="hunt-detail-metrics">
          <MetricItem icon={TrendingUp} label="Relevance" value={`${hunt.relevanceScore}%`} color="blue" />
          <MetricItem icon={Shield}     label="Confidence" value={`${hunt.confidence}%`} color="teal" />
          <MetricItem icon={Database}   label="Coverage" value={`${hunt.dataSourceCoverage || 0}%`} color="purple" />
          <MetricItem icon={Clock}      label="Est. Time" value={hunt.estimatedTime} color="orange" />
          <MetricItem icon={Target}     label="Frequency" value={hunt.frequency || 'Weekly'} color="green" />
          <MetricItem icon={Layers}     label="Maturity" value={hunt.maturityRequired} color="yellow" />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="hunt-detail-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="hunt-detail-content">
        {activeTab === 'Overview' && (
          <OverviewTab hunt={hunt} />
        )}
        {activeTab === 'Hunt Steps' && (
          <HuntStepsTab hunt={hunt} />
        )}
        {activeTab === 'Queries' && (
          <QueriesTab hunt={hunt} onCopyQuery={handleCopyQuery} />
        )}
        {activeTab === 'IOCs' && (
          <IOCsTab hunt={hunt} />
        )}
        {activeTab === 'Remediation' && (
          <RemediationTab hunt={hunt} />
        )}
        {activeTab === 'Notes' && (
          <NotesTab
            notes={notes}
            onChange={setNotes}
            hunt={hunt}
          />
        )}
      </div>

      {/* PDF Customizer Modal */}
      {showPDFCustomizer && (
        <PDFCustomizer
          hunt={hunt}
          activeCompany={activeCompany}
          onClose={() => setShowPDFCustomizer(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricItem({ icon: Icon, label, value, color }) {
  const colorMap = {
    blue:   'var(--accent-primary)',
    teal:   'var(--accent-teal)',
    purple: 'var(--accent-secondary)',
    orange: 'var(--severity-high)',
    green:  'var(--severity-low)',
    yellow: 'var(--severity-medium)',
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="hunt-detail-metric" style={{ '--m-color': c }}>
      <Icon size={14} className="hunt-detail-metric-icon" />
      <div>
        <div className="hunt-detail-metric-value">{value}</div>
        <div className="hunt-detail-metric-label">{label}</div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    critical: 'badge-critical', high: 'badge-high',
    medium: 'badge-medium', low: 'badge-low',
  };
  return (
    <span className={`badge ${map[severity] || 'badge-info'}`}>
      <span className={`severity-dot ${severity}`} />
      {(severity || 'unknown').charAt(0).toUpperCase() + severity?.slice(1)}
    </span>
  );
}

function DifficultyBadge({ difficulty }) {
  const map = {
    beginner:     'badge-low',
    intermediate: 'badge-medium',
    advanced:     'badge-high',
    expert:       'badge-critical',
  };
  return (
    <span className={`badge ${map[difficulty] || 'badge-info'}`}>
      {(difficulty || '').charAt(0).toUpperCase() + (difficulty || '').slice(1)}
    </span>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ hunt }) {
  return (
    <div className="tab-content-overview">
      {/* Why relevant callout */}
      <div className="callout callout-info">
        <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="hunt-detail-callout-title">Why This Hunt Matters</div>
          <p className="hunt-detail-callout-text">{hunt.whyRelevant}</p>
        </div>
      </div>

      {/* Hypothesis */}
      <Section title="Threat Hypothesis" icon={Target}>
        <p className="hunt-detail-body-text">{hunt.hypothesis}</p>
      </Section>

      {/* MITRE Techniques */}
      <Section title="MITRE ATT&CK Techniques" icon={Layers}>
        <div className="hunt-detail-mitre-grid">
          {(hunt.mitreTechniques || []).map(id => {
            const t = getTechniqueById(id);
            return (
              <div key={id} className="hunt-detail-mitre-item">
                <MITREBadge techniqueId={id} size="md" />
                {t && <span className="hunt-detail-mitre-desc">{t.tactic}</span>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Threat Actors */}
      {hunt.relevantThreatActors?.length > 0 && (
        <Section title="Relevant Threat Actors" icon={AlertTriangle}>
          <div className="hunt-detail-actors">
            {hunt.relevantThreatActors.map(actor => (
              <div key={actor.id} className="hunt-detail-actor">
                <div
                  className="hunt-detail-actor-dot"
                  style={{ background: actor.color }}
                />
                <div>
                  <div className="hunt-detail-actor-name">{actor.name}</div>
                  <div className="hunt-detail-actor-meta">{actor.nation} — {actor.riskLevel}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Data Sources */}
      <Section title="Required Data Sources" icon={Database}>
        <div className="hunt-detail-sources">
          {(hunt.dataSources || []).map((s, i) => (
            <div key={i} className="hunt-detail-source-item">
              <CheckCircle size={13} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              <span>{s}</span>
            </div>
          ))}
        </div>
        {hunt.recommendedLogSources?.length > 0 && (
          <div className="hunt-detail-log-sources">
            <div className="label mb-2" style={{ marginTop: 'var(--space-3)' }}>Recommended Log Sources</div>
            <div className="flex flex-wrap gap-2">
              {hunt.recommendedLogSources.map((s, i) => (
                <span key={i} className="tag">{s}</span>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Business Impact */}
      {hunt.businessImpact && (
        <div className="callout callout-warning">
          <AlertTriangle size={16} style={{ color: 'var(--severity-medium)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="hunt-detail-callout-title">Business Impact</div>
            <p className="hunt-detail-callout-text">{hunt.businessImpact}</p>
          </div>
        </div>
      )}

      {/* Detection Gap */}
      {hunt.detectionGap && (
        <div className="callout callout-danger">
          <Zap size={16} style={{ color: 'var(--severity-critical)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="hunt-detail-callout-title">Detection Gap</div>
            <p className="hunt-detail-callout-text">{hunt.detectionGap}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hunt Steps Tab ────────────────────────────────────────────────────────────
function HuntStepsTab({ hunt }) {
  return (
    <div className="tab-content">
      <div className="hunt-detail-steps">
        {(hunt.huntSteps || []).map((step, i) => (
          <div key={i} className="hunt-detail-step">
            <div className="hunt-detail-step-number">{i + 1}</div>
            <p className="hunt-detail-step-text">{step}</p>
          </div>
        ))}
      </div>

      {hunt.recommendedTools?.length > 0 && (
        <div className="hunt-detail-tools">
          <div className="section-title mb-4" style={{ marginTop: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
            Recommended Tools
          </div>
          <div className="flex flex-wrap gap-2">
            {hunt.recommendedTools.map((t, i) => (
              <span key={i} className="tag">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Queries Tab ────────────────────────────────────────────────────────────────
function QueriesTab({ hunt, onCopyQuery }) {
  return (
    <div className="tab-content">
      {(hunt.exampleQueries || []).length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state-title">No example queries</div>
        </div>
      ) : (
        hunt.exampleQueries.map((q, i) => (
          <div key={i} className="hunt-detail-query-block">
            <div className="hunt-detail-query-header">
              <span className="badge badge-info">{q.platform}</span>
              <span className="badge badge-purple">{q.language?.toUpperCase() || 'QUERY'}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => onCopyQuery(q)}
                style={{ marginLeft: 'auto' }}
              >
                <Copy size={13} /> Copy Query
              </button>
            </div>
            <pre className="code-block">{q.query}</pre>
          </div>
        ))
      )}

      {/* Suggested query types callout */}
      <div className="callout callout-info" style={{ marginTop: 'var(--space-4)' }}>
        <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <div>
          <div className="hunt-detail-callout-title">AI Query Generation</div>
          <p className="hunt-detail-callout-text">
            Connect an AI provider in Settings to auto-generate queries customized to your exact SIEM schema and field names.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── IOCs Tab ───────────────────────────────────────────────────────────────────
function IOCsTab({ hunt }) {
  return (
    <div className="tab-content">
      <Section title="Suspicious Behaviors to Look For" icon={AlertTriangle}>
        <ul className="hunt-detail-ioc-list">
          {(hunt.suspiciousBehaviors || []).map((b, i) => (
            <li key={i} className="hunt-detail-ioc-item hunt-detail-ioc-suspicious">
              <span className="hunt-detail-ioc-bullet">⚠</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="True Positive Indicators" icon={CheckCircle} iconColor="var(--status-success)">
        <ul className="hunt-detail-ioc-list">
          {(hunt.truePositiveIndicators || []).map((b, i) => (
            <li key={i} className="hunt-detail-ioc-item hunt-detail-ioc-tp">
              <CheckCircle size={13} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="False Positive Indicators" icon={XCircle} iconColor="var(--text-muted)">
        <ul className="hunt-detail-ioc-list">
          {(hunt.falsePositiveIndicators || []).map((b, i) => (
            <li key={i} className="hunt-detail-ioc-item hunt-detail-ioc-fp">
              <XCircle size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Triage Guidance" icon={Shield}>
        <p className="hunt-detail-body-text">{hunt.triageGuidance}</p>
      </Section>

      <Section title="Escalation Recommendations" icon={ArrowRight}>
        <ul className="hunt-detail-ioc-list">
          {(hunt.escalationRecommendations || []).map((r, i) => (
            <li key={i} className="hunt-detail-ioc-item">
              <ArrowRight size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

// ── Remediation Tab ────────────────────────────────────────────────────────────
function RemediationTab({ hunt }) {
  return (
    <div className="tab-content">
      <Section title="Remediation Actions" icon={CheckCircle} iconColor="var(--status-success)">
        <div className="hunt-detail-remediation">
          {(hunt.remediationActions || []).map((action, i) => (
            <div key={i} className="hunt-detail-remediation-item">
              <div className="hunt-detail-remediation-number">{i + 1}</div>
              <p>{action}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="hunt-detail-meta-grid">
        <MetaBlock label="Suggested Frequency" value={hunt.suggestedFrequency || hunt.frequency} />
        <MetaBlock label="Maturity Required" value={hunt.maturityRequired} />
        <MetaBlock label="Difficulty" value={hunt.difficulty} />
        <MetaBlock label="Business Impact" value={hunt.businessImpact} />
      </div>
    </div>
  );
}

function MetaBlock({ label, value }) {
  return (
    <div className="hunt-detail-meta-block">
      <div className="label">{label}</div>
      <div className="hunt-detail-meta-value">{value || 'N/A'}</div>
    </div>
  );
}

// ── Notes Tab ──────────────────────────────────────────────────────────────────
function NotesTab({ notes, onChange, hunt }) {
  return (
    <div className="tab-content">
      <div className="hunt-detail-notes-header">
        <div className="section-title">Analyst Notes</div>
        <div className="hunt-detail-notes-hint">
          Notes are saved locally and persist with this hunt in your library.
        </div>
      </div>

      <textarea
        className="form-textarea hunt-detail-notes-textarea"
        value={notes}
        onChange={e => onChange(e.target.value)}
        placeholder="Add your investigation notes, findings, and observations here...

Example:
- Ran on 2025-01-15, found 3 suspicious accounts
- Source IPs: 192.168.1.x range flagged
- Escalated to Tier 2 - awaiting response
- False positive confirmed for IT admin activity"
        rows={12}
      />

      <div className="hunt-detail-notes-meta">
        <User size={12} />
        <span>Last modified: {hunt.savedAt ? new Date(hunt.savedAt).toLocaleDateString() : 'Not saved yet'}</span>
      </div>
    </div>
  );
}

// ── Shared Section component ───────────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="hunt-detail-section">
      <div className="hunt-detail-section-header">
        {Icon && <Icon size={15} style={{ color: iconColor || 'var(--accent-primary)' }} />}
        <h3 className="hunt-detail-section-title">{title}</h3>
      </div>
      {children}
    </div>
  );
}
