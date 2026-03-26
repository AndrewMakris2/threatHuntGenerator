import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair, BookmarkCheck, TrendingUp, AlertTriangle,
  Sparkles, ArrowRight, Shield, LayoutDashboard,
  Building2, ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/common/StatCard';
import RiskHeatmap from '../components/dashboard/RiskHeatmap';
import ATTACKCoverage from '../components/dashboard/ATTACKCoverage';
import HuntCard from '../components/hunt/HuntCard';
import HuntDetail from '../components/hunt/HuntDetail';
import Modal from '../components/common/Modal';
import { getEnvironmentRiskScore, getCategoryStats } from '../services/huntGenerationService';
import './Dashboard.css';

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeHunt, setActiveHunt] = React.useState(null);

  const { companyProfile: profile, generatedHunts: hunts, savedHunts, profileComplete } = state;

  const riskScore   = profileComplete ? getEnvironmentRiskScore(profile) : 0;
  const catStats    = getCategoryStats(hunts);
  const topHunts    = [...hunts].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 3);
  const criticalHunts = hunts.filter(h => h.severity === 'critical').length;

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
