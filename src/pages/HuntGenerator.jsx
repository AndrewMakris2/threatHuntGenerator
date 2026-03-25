import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Building2, AlertCircle, CheckCircle,
  Sliders, ArrowRight, Loader, Zap, Target, Shield,
  RefreshCw,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import { generateHunts, buildAIPrompt } from '../services/huntGenerationService';
import { HUNT_CATEGORIES } from '../data/huntTemplates';
import { SAMPLE_COMPANY_PROFILE } from '../data/sampleData';
import './HuntGenerator.css';

export default function HuntGenerator() {
  const { state, dispatch, addToast } = useApp();
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxHunts, setMaxHunts]     = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const { companyProfile: profile, profileComplete } = state;

  function toggleCategory(catId) {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  }

  async function handleGenerate() {
    const useProfile = profileComplete ? profile : SAMPLE_COMPANY_PROFILE;

    if (!profileComplete) {
      addToast('Using sample profile — Acme Financial Services', 'info');
    }

    setIsGenerating(true);
    dispatch({ type: ACTIONS.SET_GENERATING, value: true });

    try {
      const hunts = await generateHunts(useProfile, {
        maxHunts,
        categories: selectedCategories,
      });

      dispatch({ type: ACTIONS.SET_GENERATED_HUNTS, hunts });
      addToast(`Generated ${hunts.length} tailored threat hunts!`, 'success');
      navigate('/results');
    } catch (err) {
      console.error('Generation failed:', err);
      addToast('Hunt generation failed. Please try again.', 'error');
      dispatch({ type: ACTIONS.SET_GENERATING, value: false });
    } finally {
      setIsGenerating(false);
    }
  }

  function loadSampleAndGenerate() {
    dispatch({ type: ACTIONS.LOAD_SAMPLE_PROFILE, profile: SAMPLE_COMPANY_PROFILE });
    addToast('Sample profile loaded — generating hunts...', 'info');
    setTimeout(() => handleGenerate(), 100);
  }

  const promptData = buildAIPrompt(profileComplete ? profile : SAMPLE_COMPANY_PROFILE);

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Hunt Generator</h1>
          <p className="page-subtitle">Generate tailored threat hunting scenarios based on your environment</p>
        </div>
      </div>

      <div className="hunt-generator-layout">
        {/* ── Left: Config panel ── */}
        <div className="hunt-generator-config">
          {/* Profile status */}
          <div className={`card ${profileComplete ? 'card-accent' : ''} hunt-generator-profile-card`}>
            <div className="flex items-center gap-3">
              <div className={`hunt-generator-profile-status ${profileComplete ? 'complete' : 'incomplete'}`}>
                {profileComplete ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              </div>
              <div className="flex-1">
                <div className="hunt-generator-profile-title">
                  {profileComplete ? profile.companyName || 'Company Profile' : 'No Profile Configured'}
                </div>
                <div className="hunt-generator-profile-meta">
                  {profileComplete
                    ? `${profile.industry || 'Unknown industry'} · ${profile.companySize || 'Unknown size'} · ${(profile.cloudProviders || []).join(', ') || 'No cloud'}`
                    : 'Build a profile for tailored hunts, or use sample data below'}
                </div>
              </div>
            </div>
            {!profileComplete && (
              <button className="btn btn-secondary" onClick={() => navigate('/profile')}>
                <Building2 size={14} /> Build Profile
              </button>
            )}
          </div>

          {/* Options */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
              <Sliders size={16} style={{ display: 'inline', marginRight: 6 }} />
              Generation Options
            </h3>

            <div className="form-group">
              <label className="form-label">Maximum Hunts to Generate</label>
              <input
                type="range"
                min={3}
                max={12}
                step={1}
                value={maxHunts}
                onChange={e => setMaxHunts(Number(e.target.value))}
                className="hunt-generator-slider"
              />
              <div className="hunt-generator-slider-label">
                <span>{maxHunts} hunts</span>
                <span style={{ color: 'var(--text-muted)' }}>(max 12)</span>
              </div>
            </div>
          </div>

          {/* Category filters */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
              <Target size={16} style={{ display: 'inline', marginRight: 6 }} />
              Hunt Categories
              <span className="badge badge-info" style={{ marginLeft: 8 }}>
                {selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'All'}
              </span>
            </h3>
            <p className="form-hint" style={{ marginBottom: 'var(--space-3)' }}>
              Leave unselected to generate hunts across all categories relevant to your profile.
            </p>
            <div className="hunt-generator-categories">
              {HUNT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`hunt-generator-cat-chip ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}
                  style={{ '--chip-color': cat.color }}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span
                    className="hunt-generator-cat-dot"
                    style={{ background: cat.color }}
                  />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Prompt preview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">
                <Zap size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--accent-secondary)' }} />
                AI Prompt Preview
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPrompt(!showPrompt)}
              >
                {showPrompt ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="form-hint">
              This is the prompt structure that will be sent to an LLM once you connect an AI provider in Settings.
            </p>
            {showPrompt && (
              <pre className="code-block" style={{ marginTop: 'var(--space-3)', fontSize: '10px', maxHeight: 200, overflow: 'auto' }}>
                {promptData.userPrompt}
              </pre>
            )}
          </div>
        </div>

        {/* ── Right: Generate panel ── */}
        <div className="hunt-generator-right">
          <div className="card card-accent hunt-generator-cta">
            <div className="hunt-generator-cta-icon">
              <Sparkles size={32} />
            </div>
            <h2 className="hunt-generator-cta-title">Generate Your Hunt Package</h2>
            <p className="hunt-generator-cta-desc">
              {profileComplete
                ? `Generate up to ${maxHunts} threat hunting scenarios tailored specifically to ${profile.companyName || 'your organization'}'s environment, stack, and risk profile.`
                : `Generate up to ${maxHunts} threat hunting scenarios using the Acme Financial Services sample profile. Build your own profile for fully personalized results.`}
            </p>

            <button
              className="btn btn-primary btn-lg hunt-generator-btn"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Generating hunts...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate {maxHunts} Hunt{maxHunts > 1 ? 's' : ''}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {!profileComplete && (
              <button
                className="btn btn-secondary"
                onClick={loadSampleAndGenerate}
                disabled={isGenerating}
              >
                <RefreshCw size={14} /> Use Sample Profile
              </button>
            )}

            {isGenerating && (
              <div className="hunt-generator-progress">
                <div className="hunt-generator-progress-steps">
                  {['Analyzing environment...', 'Selecting templates...', 'Personalizing hunts...', 'Scoring relevance...'].map((step, i) => (
                    <div key={i} className="hunt-generator-progress-step">
                      <div className="hunt-generator-progress-dot animate-pulse-glow" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="card hunt-generator-how">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
              <Shield size={15} style={{ display: 'inline', marginRight: 6 }} />
              How Generation Works
            </h3>
            <div className="hunt-generator-how-steps">
              {[
                { n: '1', t: 'Profile Analysis', d: 'Parses your environment for 20+ risk and context factors' },
                { n: '2', t: 'Template Selection', d: 'Scores 12+ hunt templates by relevance to your profile' },
                { n: '3', t: 'Personalization', d: 'Injects your actual tool names, data types, and threat context' },
                { n: '4', t: 'Threat Actor Mapping', d: 'Maps likely adversary groups based on industry and exposure' },
                { n: '5', t: 'Output', d: 'Returns prioritized hunts with queries, steps, and triage guidance' },
              ].map(item => (
                <div key={item.n} className="hunt-generator-how-step">
                  <div className="hunt-generator-how-num">{item.n}</div>
                  <div>
                    <div className="hunt-generator-how-title">{item.t}</div>
                    <div className="hunt-generator-how-desc">{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
