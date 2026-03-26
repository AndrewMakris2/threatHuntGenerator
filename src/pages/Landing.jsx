import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Target, ArrowRight,
  CheckCircle, Lock, Globe, Database,
  ChevronRight, TrendingUp, Shield,
} from 'lucide-react';
import PhantomLogo from '../components/common/PhantomLogo';
import './Landing.css';

const FEATURES = [
  { icon: Target,    title: 'Tailored Hunt Generation',    desc: 'Hunts built around your specific stack, not generic templates.' },
  { icon: Shield,    title: 'MITRE ATT&CK Mapped',        desc: 'Every hunt maps to real ATT&CK techniques and threat actors.' },
  { icon: Database,  title: 'Real Query Examples',         desc: 'KQL, Splunk SPL, and platform-specific query starters.' },
  { icon: Zap,       title: 'AI-Ready Architecture',       desc: 'Plug in your preferred LLM for next-level personalization.' },
  { icon: TrendingUp,title: 'Risk Scoring Engine',         desc: 'Relevance scoring based on your environment, threats, and maturity.' },
  { icon: Globe,     title: 'Export & Report',             desc: 'Export hunts as JSON, Markdown, or print-ready reports.' },
];

const STATS = [
  { value: '12+',    label: 'Hunt Templates' },
  { value: '50+',    label: 'MITRE Techniques' },
  { value: '10',     label: 'Threat Actors Mapped' },
  { value: '100%',   label: 'Environment-Tailored' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Zap size={12} />
            <span>AI-Powered Threat Intelligence</span>
          </div>

          <div className="landing-hero-logo-lockup">
            <PhantomLogo size={56} glow />
            <div className="landing-hero-wordmark">
              <span className="landing-hero-wordmark-top">PHANTOM</span>
              <span className="landing-hero-wordmark-bottom">HUNTER</span>
            </div>
          </div>

          <h1 className="landing-hero-title">
            Precision Threat Hunts
            <span className="landing-hero-title-accent"> Built for Your Environment</span>
          </h1>

          <p className="landing-hero-subtitle">
            Stop using generic hunt procedures. Build a company profile once, then generate
            tailored threat hunting scenarios with MITRE mapping, real queries, and analyst guidance
            — specific to your stack, industry, and risk posture.
          </p>

          <div className="landing-hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/profile')}
            >
              Build Company Profile <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/')}
            >
              View Demo Dashboard
            </button>
          </div>

          <div className="landing-hero-checklist">
            {['No AI API key required to start', 'Local state — no data sent anywhere', 'Export to JSON, Markdown, or PDF'].map(item => (
              <div key={item} className="landing-hero-check">
                <CheckCircle size={14} style={{ color: 'var(--status-success)' }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="landing-hero-visual">
          <div className="landing-hero-card">
            <div className="landing-hero-card-header">
              <div className="flex items-center gap-2">
                <div className="severity-dot critical" />
                <span className="badge badge-critical">Critical</span>
                <span className="badge badge-purple">Identity</span>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>96% relevance</span>
            </div>
            <h3 className="landing-hero-card-title">MFA Fatigue Push Bombing Detection</h3>
            <p className="landing-hero-card-desc">
              An attacker with valid credentials is flooding the user with MFA push notifications
              hoping the user will inadvertently approve...
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {['T1078', 'T1621'].map(t => (
                <span key={t} className="tag" style={{ color: 'var(--accent-primary)', borderColor: 'var(--border-accent)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats">
        {STATS.map(stat => (
          <div key={stat.label} className="landing-stat">
            <div className="landing-stat-value">{stat.value}</div>
            <div className="landing-stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <h2 className="landing-section-title">Everything Your Analysts Need</h2>
        <p className="landing-section-subtitle">
          From profile intake to report export — a complete threat hunting workflow.
        </p>
        <div className="landing-features-grid">
          {FEATURES.map(feature => (
            <div key={feature.title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <feature.icon size={20} />
              </div>
              <div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-desc">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <Lock size={32} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="landing-cta-title">Ready to Start Hunting?</h2>
          <p className="landing-cta-subtitle">
            Complete your company profile in 5 minutes and generate your first tailored hunt package.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/profile')}
          >
            Get Started <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
