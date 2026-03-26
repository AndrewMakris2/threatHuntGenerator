import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Zap, Trash2, Download, RotateCcw,
  Key, Globe, Shield, Database, Info, ExternalLink, CheckCircle,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import { exportHuntsAsJSON } from '../services/exportService';
import './Settings.css';

const AI_PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic Claude', models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] },
  { id: 'openai',    name: 'OpenAI',           models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'groq',      name: 'Groq',             models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'] },
  { id: 'azure',     name: 'Azure OpenAI',     models: ['gpt-4o', 'gpt-4'] },
  { id: 'local',     name: 'Local LLM (Ollama)', models: ['llama3', 'mixtral', 'mistral'] },
];

export default function Settings() {
  const { state, dispatch, addToast } = useApp();
  const existingAI = state.aiSettings || {};
  const [aiProvider,  setAiProvider]  = useState(existingAI.provider  || 'anthropic');
  const [aiModel,     setAiModel]     = useState(existingAI.model     || 'claude-sonnet-4-6');
  const [apiKey,      setApiKey]      = useState(existingAI.apiKey    || '');
  const [apiEndpoint, setApiEndpoint] = useState(existingAI.endpoint  || '');
  const [saved,       setSaved]       = useState(false);

  const { generatedHunts, savedHunts, companyProfile } = state;

  const selectedProvider = AI_PROVIDERS.find(p => p.id === aiProvider);

  function handleSaveAI() {
    dispatch({
      type: ACTIONS.SET_AI_SETTINGS,
      settings: { provider: aiProvider, model: aiModel, apiKey, endpoint: apiEndpoint },
    });
    addToast(`${AI_PROVIDERS.find(p => p.id === aiProvider)?.name || 'AI'} settings saved`, 'success');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleResetProfile() {
    if (!window.confirm('Reset company profile? All generated hunts will also be cleared.')) return;
    dispatch({ type: ACTIONS.RESET_PROFILE });
    addToast('Profile reset', 'info');
  }

  function handleClearHunts() {
    if (!window.confirm('Clear all generated hunts?')) return;
    dispatch({ type: ACTIONS.CLEAR_HUNTS });
    addToast('Generated hunts cleared', 'info');
  }

  function handleExportAllData() {
    const allData = {
      companyProfile,
      generatedHunts,
      savedHunts,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'thg-export.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Full data exported as JSON', 'success');
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title"><SettingsIcon size={20} style={{ display:'inline', marginRight:8, verticalAlign:'middle' }}/> Settings</h1>
          <p className="page-subtitle">Configure AI integration, data management, and preferences</p>
        </div>
      </div>

      <div className="settings-layout">
        {/* ── AI Integration ── */}
        <section className="card settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background:'rgba(129,140,248,0.15)', color:'var(--accent-secondary)' }}>
              <Zap size={18}/>
            </div>
            <div>
              <h2 className="section-title">AI Provider Integration</h2>
              <p className="page-subtitle">Connect an LLM to enable AI-powered hunt generation</p>
            </div>
            <span className="badge badge-purple" style={{ marginLeft:'auto' }}>Optional</span>
          </div>

          <div className="callout callout-info">
            <Info size={15} style={{ color:'var(--accent-primary)', flexShrink:0 }}/>
            <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)' }}>
              The app works fully without an AI provider using the built-in rules engine.
              Add an API key to unlock AI-generated hunt narratives and custom queries.
            </p>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">AI Provider</label>
              <div className="settings-provider-grid">
                {AI_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    className={`settings-provider-btn ${aiProvider === p.id ? 'selected' : ''}`}
                    onClick={() => { setAiProvider(p.id); setAiModel(p.models[0]); }}
                  >
                    {aiProvider === p.id && <CheckCircle size={13} style={{ color:'var(--accent-primary)' }}/>}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Model</label>
                <select className="form-select" value={aiModel} onChange={e => setAiModel(e.target.value)}>
                  {(selectedProvider?.models || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Key size={12} style={{ display:'inline', marginRight:4 }}/>
                  {aiProvider === 'groq' ? 'Groq API Key' : aiProvider === 'anthropic' ? 'Anthropic API Key' : aiProvider === 'openai' ? 'OpenAI API Key' : 'API Key'}
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder={aiProvider === 'groq' ? 'gsk_...' : 'sk-... or your API key'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <span className="form-hint">Stored in memory only — never persisted to localStorage</span>
              </div>
            </div>

            {aiProvider === 'groq' && (
              <div className="callout callout-info" style={{ marginBottom: 'var(--space-3)' }}>
                <Info size={15} style={{ color:'var(--accent-primary)', flexShrink:0 }}/>
                <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)' }}>
                  Groq provides ultra-fast inference. Get your API key at{' '}
                  <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color:'var(--accent-primary)' }}>
                    console.groq.com <ExternalLink size={11} style={{ display:'inline', verticalAlign:'middle' }}/>
                  </a>
                </p>
              </div>
            )}

            {aiProvider === 'azure' && (
              <div className="form-group">
                <label className="form-label"><Globe size={12} style={{ display:'inline', marginRight:4 }}/>Azure Endpoint</label>
                <input className="form-input" placeholder="https://your-resource.openai.azure.com/" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} />
              </div>
            )}

            {aiProvider === 'local' && (
              <div className="form-group">
                <label className="form-label"><Globe size={12} style={{ display:'inline', marginRight:4 }}/>Ollama Endpoint</label>
                <input className="form-input" placeholder="http://localhost:11434" value={apiEndpoint} onChange={e => setApiEndpoint(e.target.value)} />
              </div>
            )}

            <button className={`btn ${saved ? 'btn-primary' : 'btn-secondary'}`} onClick={handleSaveAI}>
              {saved ? <><CheckCircle size={14}/> Saved!</> : 'Save AI Settings'}
            </button>
          </div>
        </section>

        {/* ── Data Management ── */}
        <section className="card settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background:'rgba(56,189,248,0.12)', color:'var(--accent-primary)' }}>
              <Database size={18}/>
            </div>
            <div>
              <h2 className="section-title">Data Management</h2>
              <p className="page-subtitle">Export or reset your application data</p>
            </div>
          </div>

          <div className="settings-data-stats">
            <div className="settings-stat">
              <div className="settings-stat-value">{generatedHunts.length}</div>
              <div className="settings-stat-label">Generated Hunts</div>
            </div>
            <div className="settings-stat">
              <div className="settings-stat-value">{savedHunts.length}</div>
              <div className="settings-stat-label">Saved to Library</div>
            </div>
            <div className="settings-stat">
              <div className="settings-stat-value">{companyProfile?.companyName ? 1 : 0}</div>
              <div className="settings-stat-label">Company Profile</div>
            </div>
          </div>

          <div className="settings-actions">
            <button className="btn btn-secondary" onClick={handleExportAllData}>
              <Download size={14}/> Export All Data (JSON)
            </button>
            <button className="btn btn-secondary" onClick={() => { exportHuntsAsJSON(savedHunts, 'saved-hunts'); addToast('Saved hunts exported', 'success'); }}>
              <Download size={14}/> Export Saved Hunts
            </button>
            <div className="settings-danger-zone">
              <h3 className="settings-danger-title">Danger Zone</h3>
              <div className="flex gap-2 flex-wrap">
                <button className="btn btn-danger btn-sm" onClick={handleClearHunts}>
                  <Trash2 size={13}/> Clear Generated Hunts
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleResetProfile}>
                  <RotateCcw size={13}/> Reset Company Profile
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="card settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background:'rgba(45,212,191,0.12)', color:'var(--accent-teal)' }}>
              <Shield size={18}/>
            </div>
            <div>
              <h2 className="section-title">About Phantom Hunter</h2>
            </div>
          </div>
          <div className="settings-about">
            <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)', lineHeight:1.7 }}>
              Phantom Hunter is a cybersecurity analyst tool for generating environment-specific threat hunting
              scenarios. Built with React, it uses a rules-based engine to tailor MITRE ATT&CK-mapped hunts to your
              company's actual stack, tools, and risk profile.
            </p>
            <div className="settings-about-meta">
              <span className="tag">v1.0.0</span>
              <span className="tag">React 18</span>
              <span className="tag">MITRE ATT&CK v14</span>
              <span className="tag">AI-Ready</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
