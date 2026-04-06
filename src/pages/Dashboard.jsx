import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair, BookmarkCheck, TrendingUp, AlertTriangle,
  Sparkles, ArrowRight, Shield, LayoutDashboard,
  Building2, ChevronRight, Radio, Star, Clock,
  RefreshCw, ExternalLink, Activity, Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/common/StatCard';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import ATTACKCoverage from '../components/dashboard/ATTACKCoverage';
import HuntCard from '../components/hunt/HuntCard';
import HuntDetail from '../components/hunt/HuntDetail';
import Modal from '../components/common/Modal';
import { getEnvironmentRiskScore, getCategoryStats } from '../services/huntGenerationService';
import { STATUS_CONFIG } from '../components/hunt/StatusBadge';
import {
  fetchCISAKEV, getHuntOfTheWeek, getReHuntReminders, getWeeklyActivity,
} from '../services/threatIntelService';
import './Dashboard.css';

export default function Dashboard() {
  const { state, getHuntStatus } = useApp();
  const navigate  = useNavigate();
  const [activeHunt,  setActiveHunt]  = useState(null);
  const [intelFeed,   setIntelFeed]   = useState([]);
  const [intelLoading, setIntelLoading] = useState(true);

  const { companyProfile: profile, generatedHunts: hunts, savedHunts, profileComplete, huntSessions } = state;

  const statusCounts = React.useMemo(() => {
    const counts = { 'not-started': 0, 'in-progress': 0, 'complete': 0, 'no-findings': 0, 'escalated': 0 };
    const allHunts = [...state.generatedHunts, ...state.savedHunts];
    const seen = new Set();
    allHunts.forEach(h => {
      if (seen.has(h.id)) return;
      seen.add(h.id);
      const s = state.huntStatuses?.[h.id] || 'not-started';
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [state.generatedHunts, state.savedHunts, state.huntStatuses]);

  const riskScore     = profileComplete ? getEnvironmentRiskScore(profile) : 0;
  const catStats      = getCategoryStats(hunts);
  const topHunts      = [...hunts].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
  const criticalHunts = hunts.filter(h => h.severity === 'critical').length;
  const huntOfWeek    = getHuntOfTheWeek();
  const reHuntItems   = getReHuntReminders(huntSessions || []);
  const weeklyActivity = getWeeklyActivity(huntSessions || []);
  const maxActivity   = Math.max(...weeklyActivity.map(w => w.count), 1);

  useEffect(() => {
    fetchCISAKEV(8).then(data => {
      setIntelFeed(data);
      setIntelLoading(false);
    });
  }, []);

  // If no profile, show setup CTA
  if (!profileComplete) {
    return (
      <div className="page-container dashboard-empty">
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-icon">
            <Shield size={36} />
          </div>
          <h1 className="page-title">Welcome to Phantom Hunter</h1>
          <p className="page-subtitle" style={{ fontSize: 'var(--text-base)', maxWidth: 480, textAlign: 'center', marginTop: 'var(--space-2)' }}>
            Build your company profile to generate tailored, environment-specific threat hunting scenarios.
          </p>
          <div className="dashboard-welcome-steps">
            <div className="dashboard-step">
              <div className="dashboard-step-num">1</div>
              <div>
                <div className="dashboard-step-title">Build Company Profile</div>
                <div className="dashboard-step-desc">Enter your stack, tools, and risk context</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            <div className="dashboard-step">
              <div className="dashboard-step-num">2</div>
              <div>
                <div className="dashboard-step-title">Generate Hunts</div>
                <div className="dashboard-step-desc">Get tailored scenarios for your environment</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            <div className="dashboard-step">
              <div className="dashboard-step-num">3</div>
              <div>
                <div className="dashboard-step-title">Export & Execute</div>
                <div className="dashboard-step-desc">Run hunts and save findings to your library</div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/profile')}>
              <Building2 size={16} /> Build Profile
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/generate')}>
              <Sparkles size={16} /> Try with Sample Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Page Header ── */}
      <div className="section-header">
        <div>
          <h1 className="page-title">
            <LayoutDashboard size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Dashboard
          </h1>
          <p className="page-subtitle">{profile.companyName} — {profile.industry} | {profile.companySize} employees</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/generate')}>
            <Sparkles size={15} /> Regenerate Hunts
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/results')}>
            <Crosshair size={15} /> View All Hunts
          </button>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid-4 mb-6">
        <StatCard
          title="Total Hunts Generated"
          value={hunts.length}
          subtitle="environment-tailored"
          icon={Crosshair}
          color="blue"
          accentLine
          onClick={() => navigate('/results')}
        />
        <StatCard
          title="Critical Priority"
          value={criticalHunts}
          subtitle="require immediate action"
          icon={AlertTriangle}
          color="red"
          accentLine
        />
        <StatCard
          title="Saved to Library"
          value={savedHunts.length}
          subtitle="bookmarked hunts"
          icon={BookmarkCheck}
          color="teal"
          accentLine
          onClick={() => navigate('/saved')}
        />
        <StatCard
          title="Environment Risk Score"
          value={riskScore}
          subtitle="/ 100"
          icon={TrendingUp}
          color={riskScore >= 75 ? 'red' : riskScore >= 55 ? 'orange' : riskScore >= 35 ? 'yellow' : 'green'}
          accentLine
        />
      </div>

      {/* ── Hunt Status Breakdown ── */}
      {(state.generatedHunts.length > 0 || state.savedHunts.length > 0) && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Hunt Status Breakdown</div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {[
              { key: 'not-started', label: 'Not Started', color: 'var(--text-muted)' },
              { key: 'in-progress', label: 'In Progress', color: '#7dd3fc' },
              { key: 'complete',    label: 'Complete',    color: '#86efac' },
              { key: 'no-findings', label: 'No Findings', color: '#94a3b8' },
              { key: 'escalated',   label: 'Escalated',   color: '#fdba74' },
            ].map(({ key, label, color }) => (
              <div key={key} style={{
                flex: '1', minWidth: 100,
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color, lineHeight: 1 }}>
                  {statusCounts[key]}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Middle row ── */}
      <div className="dashboard-middle">
        {/* Risk Heatmap */}
        <div className="card dashboard-risk-card">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title">Environment Risk Heatmap</h2>
            <span className="badge badge-info">Based on profile</span>
          </div>
          <RiskHeatmap profile={profile} />
        </div>

        {/* Hunt Categories */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title">Hunt Categories</h2>
          </div>
          {catStats.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <div className="empty-state-description">Generate hunts to see category breakdown</div>
            </div>
          ) : (
            <div className="dashboard-categories">
              {catStats.map(cat => (
                <div key={cat.id} className="dashboard-category-row">
                  <div
                    className="dashboard-category-dot"
                    style={{ background: cat.color }}
                  />
                  <span className="dashboard-category-name">{cat.label}</span>
                  <div className="dashboard-category-bar">
                    <div
                      className="dashboard-category-fill"
                      style={{ width: `${(cat.count / Math.max(...catStats.map(c => c.count))) * 100}%`, background: cat.color }}
                    />
                  </div>
                  <span className="dashboard-category-count">{cat.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MITRE Coverage ── */}
      {hunts.length > 0 && (
        <div className="card mb-6">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title">MITRE ATT&CK Coverage</h2>
            <span className="badge badge-purple">{hunts.reduce((sum, h) => sum + (h.mitreTechniques?.length || 0), 0)} techniques mapped</span>
          </div>
          <ATTACKCoverage hunts={hunts} />
        </div>
      )}

      {/* ── Top Hunts ── */}
      {topHunts.length > 0 && (
        <div className="mb-6">
          <div className="section-header">
            <h2 className="section-title">Top Priority Hunts</h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/results')}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid-3">
            {topHunts.map(hunt => (
              <HuntCard
                key={hunt.id}
                hunt={hunt}
                onOpen={setActiveHunt}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Generate CTA if no hunts ── */}
      {hunts.length === 0 && (
        <div className="card card-accent dashboard-generate-cta">
          <Sparkles size={28} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="section-title">Ready to Generate Your First Hunt Package?</h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Your company profile is complete. Generate tailored threat hunts now.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/generate')}>
            Generate Hunts <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── Hunt of the Week ── */}
      <div className="dashboard-hotw card mb-6">
        <div className="dashboard-hotw-badge">
          <Star size={11} /> HUNT OF THE WEEK
        </div>
        <div className="dashboard-hotw-body">
          <div className="dashboard-hotw-left">
            <div className="dashboard-hotw-technique">{huntOfWeek.technique}</div>
            <h2 className="dashboard-hotw-title">{huntOfWeek.title}</h2>
            <p className="dashboard-hotw-desc">{huntOfWeek.description}</p>
            <div className="dashboard-hotw-why">
              <AlertTriangle size={12} style={{ color: 'var(--severity-high)', flexShrink: 0 }} />
              <span>{huntOfWeek.whyNow}</span>
            </div>
            <div className="dashboard-hotw-actors">
              <span className="label">Known actors:</span>
              <span style={{ color: 'var(--severity-critical)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>{huntOfWeek.actors}</span>
            </div>
          </div>
          <div className="dashboard-hotw-right">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/generate')}
            >
              <Sparkles size={14} /> Generate This Hunt
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/coverage')}
            >
              <Target size={13} /> View Coverage
            </button>
          </div>
        </div>
      </div>

      {/* ── Re-hunt Reminders + Weekly Activity ── */}
      <div className="dashboard-lower-row mb-6">

        {/* Re-hunt Reminders */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title">
              <Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--severity-medium)' }} />
              Re-hunt Reminders
            </h2>
            {reHuntItems.length > 0 && (
              <span className="badge badge-medium">{reHuntItems.length} due</span>
            )}
          </div>
          {reHuntItems.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-5)' }}>
              <div className="empty-state-description">
                {(huntSessions || []).length === 0
                  ? 'Run your first hunt session to start tracking re-hunt schedules.'
                  : 'All recent hunts are up to date — check back in 60 days.'}
              </div>
            </div>
          ) : (
            <div className="dashboard-reminders">
              {reHuntItems.map(({ session, daysAgo }) => (
                <div key={session.id} className="dashboard-reminder-row">
                  <div className="dashboard-reminder-dot" />
                  <div className="dashboard-reminder-info">
                    <div className="dashboard-reminder-company">{session.companyName}</div>
                    <div className="dashboard-reminder-meta">{session.huntCount} hunts · {daysAgo} days ago</div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/generate')}
                    style={{ flexShrink: 0 }}
                  >
                    <RefreshCw size={11} /> Re-run
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="card">
          <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title">
              <Activity size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
              Hunt Activity
            </h2>
            <span className="badge badge-info">Last 8 weeks</span>
          </div>
          <div className="dashboard-activity-chart">
            {weeklyActivity.map((w, i) => (
              <div key={i} className="dashboard-activity-col">
                <div className="dashboard-activity-bar-wrap">
                  <div
                    className="dashboard-activity-bar"
                    style={{ height: `${maxActivity > 0 ? (w.count / maxActivity) * 100 : 0}%` }}
                    title={`${w.count} hunts`}
                  />
                </div>
                {w.count > 0 && (
                  <div className="dashboard-activity-count">{w.count}</div>
                )}
                <div className="dashboard-activity-label">{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Threat Intelligence Feed ── */}
      <div className="mb-6">
        <div className="section-header">
          <h2 className="section-title">
            <Radio size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
            Live Threat Intelligence
            <span className="badge badge-info" style={{ marginLeft: 8 }}>CISA KEV</span>
          </h2>
          <a
            href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
          >
            Full catalog <ExternalLink size={11} />
          </a>
        </div>
        {intelLoading ? (
          <div className="dashboard-intel-loading">
            <div className="spinner" />
            <span>Fetching latest threat data...</span>
          </div>
        ) : (
          <div className="dashboard-intel-grid">
            {intelFeed.map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="dashboard-intel-card"
              >
                <div className="dashboard-intel-card-top">
                  <span className="dashboard-intel-cve">{item.id}</span>
                  <span className="dashboard-intel-date">
                    {new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="dashboard-intel-vendor">{item.vendor} — {item.product}</div>
                <div className="dashboard-intel-title">{item.title}</div>
                <div className="dashboard-intel-desc">{item.description}</div>
                <div className="dashboard-intel-footer">
                  <span className="badge badge-critical" style={{ fontSize: '9px' }}>Active Exploit</span>
                  <ExternalLink size={10} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Hunt Detail Modal */}
      <Modal
        open={!!activeHunt}
        onClose={() => setActiveHunt(null)}
        size="xl"
        noPadding
      >
        {activeHunt && (
          <HuntDetail hunt={activeHunt} onClose={() => setActiveHunt(null)} />
        )}
      </Modal>
    </div>
  );
}
