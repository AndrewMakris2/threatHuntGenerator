import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Shield, Target, Database, Radio,
  ArrowRight, BookmarkCheck, Crosshair, TrendingUp,
  Building2, History, FileText, ChevronRight, Lock,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Home.css';

const FEATURES = [
  {
    icon: Sparkles,
    color: '#dc2626',
    title: 'AI-Powered Hunt Generation',
    desc: 'Connect your own API key (Anthropic, OpenAI, Groq) and generate fully custom threat hunts tailored to your exact SIEM, EDR, and environment. Each hunt includes real query syntax, 9+ execution steps, and analyst tips.',
    action: { label: 'Generate Hunts', to: '/generate' },
  },
  {
    icon: Shield,
    color: '#7c3aed',
    title: 'MITRE ATT&CK Coverage Tracker',
    desc: 'Visualize your hunt coverage across all 12 ATT&CK tactics. See which techniques you\'ve covered, which are gaps, and how many hunts reference each technique. Fills in as you generate more hunts.',
    action: { label: 'View Coverage', to: '/coverage' },
  },
  {
    icon: Radio,
    color: '#0ea5e9',
    title: 'Live Threat Intelligence',
    desc: 'The Dashboard pulls live data from the CISA Known Exploited Vulnerabilities catalog — the most recent actively exploited CVEs, updated daily. Includes vendor, product, and required action.',
    action: { label: 'Open Dashboard', to: '/dashboard' },
  },
  {
    icon: Target,
    color: '#f97316',
    title: 'Hunt of the Week',
    desc: 'Every week a new featured technique is highlighted based on the current threat landscape — complete with active threat actors, why it\'s relevant right now, and a one-click path to generating a hunt for it.',
    action: { label: 'See This Week\'s Hunt', to: '/dashboard' },
  },
  {
    icon: Database,
    color: '#10b981',
    title: 'Environment-Specific Queries',
    desc: 'Queries are written in the exact syntax of your platform — KQL for Sentinel, SPL for Splunk, LQL for CrowdStrike Falcon, Power Query for SentinelOne SIEM. Not pseudocode, actual runnable queries.',
    action: { label: 'Hunt Generator', to: '/generate' },
  },
  {
    icon: FileText,
    color: '#eab308',
    title: 'Professional PDF Export',
    desc: 'Export any hunt as a branded PDF report with your company logo, classification marking, analyst name, and custom color scheme. Ready to hand to a client or manager.',
    action: { label: 'Saved Hunts', to: '/saved' },
  },
  {
    icon: Activity,
    color: '#ec4899',
    title: 'Re-hunt Reminders',
    desc: 'The Dashboard tracks when you last ran hunts for each company and surfaces sessions older than 60 days for a re-run. Threat hunting is a recurring practice, not a one-time event.',
    action: { label: 'Hunt History', to: '/history' },
  },
  {
    icon: Lock,
    color: '#64748b',
    title: 'Secure by Design',
    desc: 'Firebase authentication with optional TOTP two-factor authentication. Your API keys are stored locally in your browser and never sent to any server. Cloud sync keeps your companies and saved hunts across devices.',
    action: { label: 'Settings', to: '/settings' },
  },
];

const HOW_IT_WORKS = [
  { n: '01', title: 'Build a Company Profile', desc: 'Enter your SIEM, EDR, cloud providers, OS stack, compliance requirements, and top threat concerns. Takes about 5 minutes.' },
  { n: '02', title: 'Generate Hunt Package', desc: 'The AI (or built-in rules engine) analyzes your environment and generates tailored threat hunting scenarios with full execution detail.' },
  { n: '03', title: 'Execute & Track Coverage', desc: 'Run hunts in your actual environment, save findings to the library, and watch your MITRE ATT&CK coverage map fill in over time.' },
  { n: '04', title: 'Export & Report', desc: 'Export individual hunts as branded PDFs, Markdown, or JSON. Share with your team, manager, or include in audit documentation.' },
];

export default function Home() {
  const navigate  = useNavigate();
  const { state } = useApp();

  const huntCount    = (state.generatedHunts || []).length;
  const savedCount   = (state.savedHunts || []).length;
  const sessionCount = (state.huntSessions || []).length;
  const companyCount = (state.savedCompanies || []).length;
  const hasData      = huntCount > 0 || companyCount > 0;

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <div className="home-hero">
        <div className="home-hero-glow" />
        <div className="home-hero-inner">
          <div className="home-hero-badge">
            <Sparkles size={11} />
            AI-Powered Threat Hunting Platform
          </div>
          <h1 className="home-hero-title">
            Hunt smarter.<br />
            <span className="home-hero-accent">Cover more ground.</span>
          </h1>
          <p className="home-hero-sub">
            Phantom Hunter generates environment-specific threat hunting scenarios tailored to your exact
            SIEM, EDR, cloud stack, and threat profile — complete with real query syntax, step-by-step
            procedures, and MITRE ATT&CK mapping.
          </p>
          <div className="home-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/generate')}>
              <Sparkles size={16} /> Generate Hunts
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
              View Dashboard <ArrowRight size={15} />
            </button>
          </div>

          {/* Quick stats if user has data */}
          {hasData && (
            <div className="home-hero-stats">
              {huntCount > 0 && (
                <div className="home-hero-stat">
                  <span className="home-hero-stat-value">{huntCount}</span>
                  <span className="home-hero-stat-label">Hunts Generated</span>
                </div>
              )}
              {savedCount > 0 && (
                <div className="home-hero-stat">
                  <span className="home-hero-stat-value">{savedCount}</span>
                  <span className="home-hero-stat-label">Saved to Library</span>
                </div>
              )}
              {companyCount > 0 && (
                <div className="home-hero-stat">
                  <span className="home-hero-stat-value">{companyCount}</span>
                  <span className="home-hero-stat-label">{companyCount === 1 ? 'Company' : 'Companies'}</span>
                </div>
              )}
              {sessionCount > 0 && (
                <div className="home-hero-stat">
                  <span className="home-hero-stat-value">{sessionCount}</span>
                  <span className="home-hero-stat-label">Hunt Sessions</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── How It Works ── */}
      <div className="home-section">
        <div className="home-section-label">How It Works</div>
        <h2 className="home-section-title">From profile to hunt in minutes</h2>
        <div className="home-how-grid">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="home-how-card">
              <div className="home-how-num">{step.n}</div>
              <div className="home-how-title">{step.title}</div>
              <div className="home-how-desc">{step.desc}</div>
              {i < HOW_IT_WORKS.length - 1 && (
                <ChevronRight size={18} className="home-how-arrow" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <div className="home-section">
        <div className="home-section-label">Features</div>
        <h2 className="home-section-title">Everything a threat hunt team needs</h2>
        <div className="home-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="home-feature-card" style={{ '--feature-color': f.color }}>
              <div className="home-feature-icon">
                <f.icon size={20} />
              </div>
              <div className="home-feature-title">{f.title}</div>
              <div className="home-feature-desc">{f.desc}</div>
              <button
                className="home-feature-link"
                onClick={() => navigate(f.action.to)}
              >
                {f.action.label} <ArrowRight size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div className="home-section">
        <div className="home-section-label">Quick Navigation</div>
        <h2 className="home-section-title">Jump straight to what you need</h2>
        <div className="home-nav-grid">
          {[
            { icon: Building2,   label: 'Companies',       sub: 'Manage company profiles',    to: '/companies',  color: '#dc2626' },
            { icon: Sparkles,    label: 'Hunt Generator',  sub: 'Generate new hunts',         to: '/generate',   color: '#7c3aed' },
            { icon: Crosshair,   label: 'Hunt Results',    sub: 'Browse generated hunts',     to: '/results',    color: '#0ea5e9' },
            { icon: Shield,      label: 'ATT&CK Coverage', sub: 'Track technique coverage',   to: '/coverage',   color: '#10b981' },
            { icon: BookmarkCheck,label: 'Saved Hunts',    sub: 'Your bookmarked hunts',      to: '/saved',      color: '#f97316' },
            { icon: History,     label: 'Hunt History',    sub: 'Past generation sessions',   to: '/history',    color: '#eab308' },
            { icon: TrendingUp,  label: 'Dashboard',       sub: 'Analytics & threat intel',   to: '/dashboard',  color: '#ec4899' },
            { icon: Lock,        label: 'Settings',        sub: 'AI keys, account, MFA',      to: '/settings',   color: '#64748b' },
          ].map((item, i) => (
            <button
              key={i}
              className="home-nav-card"
              style={{ '--nav-color': item.color }}
              onClick={() => navigate(item.to)}
            >
              <div className="home-nav-icon">
                <item.icon size={18} />
              </div>
              <div>
                <div className="home-nav-label">{item.label}</div>
                <div className="home-nav-sub">{item.sub}</div>
              </div>
              <ArrowRight size={14} className="home-nav-arrow" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
