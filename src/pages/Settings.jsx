import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings as SettingsIcon, Zap, Trash2, Download, RotateCcw,
  Key, Globe, Shield, Database, Info, ExternalLink, CheckCircle,
  User, Cloud, CloudOff, LogOut, Smartphone, Lock, X,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
  const { user, signOut, isSupabaseEnabled, getMFAEnrolledFactors, startMFAEnrollment, finishMFAEnrollment, removeMFA } = useAuth();
  const existingAI = state.aiSettings || {};
  const [aiProvider,  setAiProvider]  = useState(existingAI.provider  || 'anthropic');
  const [aiModel,     setAiModel]     = useState(existingAI.model     || 'claude-sonnet-4-6');
  const [apiKey,      setApiKey]      = useState(existingAI.apiKey    || '');
  const [apiEndpoint, setApiEndpoint] = useState(existingAI.endpoint  || '');
  const [saved,       setSaved]       = useState(false);

  // MFA state
  const [mfaPhase,   setMfaPhase]   = useState('idle'); // 'idle' | 'qr' | 'verify' | 'removing'
  const [mfaSecret,  setMfaSecret]  = useState(null);
  const [mfaQrUrl,   setMfaQrUrl]   = useState('');
  const [mfaCode,    setMfaCode]    = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError,   setMfaError]   = useState('');
  const enrolledFactors = isSupabaseEnabled && user ? (getMFAEnrolledFactors?.() || []) : [];
  const mfaEnabled = enrolledFactors.length > 0;

  async function handleStartMFAEnroll() {
    setMfaError('');
    setMfaLoading(true);
    try {
      const { secret, qrUrl } = await startMFAEnrollment();
      setMfaSecret(secret);
      setMfaQrUrl(qrUrl);
      setMfaPhase('qr');
    } catch (err) {
      setMfaError(err.message || 'Failed to start MFA setup');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleFinishMFAEnroll(e) {
    e.preventDefault();
    setMfaError('');
    setMfaLoading(true);
    try {
      await finishMFAEnrollment(mfaSecret, mfaCode.trim());
      setMfaPhase('idle');
      setMfaCode('');
      setMfaSecret(null);
      addToast('Two-factor authentication enabled', 'success');
    } catch (err) {
      setMfaError(err.code === 'auth/invalid-verification-code'
        ? 'Invalid code — check your authenticator app and try again.'
        : err.message || 'Failed to verify code');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleRemoveMFA() {
    if (!window.confirm('Disable two-factor authentication? Your account will only be protected by your password.')) return;
    setMfaLoading(true);
    try {
      await removeMFA();
      addToast('Two-factor authentication disabled', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to disable MFA', 'error');
    } finally {
      setMfaLoading(false);
    }
  }

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
        {/* ── Account ── */}
        <section className="card settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon" style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--accent-primary)' }}>
              <User size={18} />
            </div>
            <div>
              <h2 className="section-title">Account</h2>
              <p className="page-subtitle">
                {isSupabaseEnabled ? 'Cloud sync enabled' : 'Running in offline / local mode'}
              </p>
            </div>
            {isSupabaseEnabled ? (
              <div className="navbar-sync-badge navbar-sync-online" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--status-success)' }}>
                <Cloud size={14} /> Syncing
              </div>
            ) : (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--text-muted)' }}>
                <CloudOff size={14} /> Offline
              </div>
            )}
          </div>

          {isSupabaseEnabled && user ? (
            <div className="settings-account-info">
              <div className="settings-account-row">
                <span className="settings-account-label">Email</span>
                <span className="settings-account-value">{user.email}</span>
              </div>
              <div className="settings-account-row">
                <span className="settings-account-label">Member Since</span>
                <span className="settings-account-value">
                  {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="settings-account-row">
                <span className="settings-account-label">Sync Status</span>
                <span className="settings-account-value" style={{ color: 'var(--status-success)' }}>
                  ● Active — data syncs across devices
                </span>
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={async () => { try { await signOut(); } catch (e) { addToast('Sign out failed', 'error'); } }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>
          ) : isSupabaseEnabled ? (
            <div className="callout callout-info">
              <Info size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                  Sign in to sync your companies and saved hunts across devices.
                </p>
                <Link to="/auth" className="btn btn-primary btn-sm">Sign In / Create Account</Link>
              </div>
            </div>
          ) : (
            <div className="callout callout-info">
              <Info size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Cloud sync is disabled. Add your Firebase environment variables (<code>REACT_APP_FIREBASE_API_KEY</code>, <code>REACT_APP_FIREBASE_PROJECT_ID</code>, etc.) to enable account sign-in and cross-device sync.
              </p>
            </div>
          )}
        </section>

        {/* ── Two-Factor Authentication ── */}
        {isSupabaseEnabled && user && (
          <section className="card settings-section">
            <div className="settings-section-header">
              <div className="settings-section-icon" style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--accent-primary)' }}>
                <Smartphone size={18} />
              </div>
              <div>
                <h2 className="section-title">Two-Factor Authentication</h2>
                <p className="page-subtitle">Require an authenticator app code on every login</p>
              </div>
              <span
                className={`badge ${mfaEnabled ? 'badge-low' : 'badge-info'}`}
                style={{ marginLeft: 'auto' }}
              >
                {mfaEnabled ? '● Enabled' : '○ Disabled'}
              </span>
            </div>

            {mfaEnabled && mfaPhase === 'idle' && (
              <div>
                <div className="callout callout-success" style={{ marginBottom: 'var(--space-4)' }}>
                  <CheckCircle size={15} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    MFA is active. Every sign-in requires a code from your authenticator app.
                  </p>
                </div>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleRemoveMFA}
                  disabled={mfaLoading}
                >
                  <X size={13} /> Disable 2FA
                </button>
              </div>
            )}

            {!mfaEnabled && mfaPhase === 'idle' && (
              <div>
                <div className="callout callout-info" style={{ marginBottom: 'var(--space-4)' }}>
                  <Info size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Add an extra layer of security. You'll need an authenticator app like Google Authenticator, Authy, or 1Password.
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={handleStartMFAEnroll}
                  disabled={mfaLoading}
                >
                  <Lock size={14} /> {mfaLoading ? 'Setting up…' : 'Enable Two-Factor Auth'}
                </button>
                {mfaError && <p style={{ color: 'var(--severity-critical)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{mfaError}</p>}
              </div>
            )}

            {mfaPhase === 'qr' && (
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Step 1 —</strong> Scan this QR code with your authenticator app.
                  Or manually enter the setup key below.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mfaQrUrl)}`}
                    alt="MFA QR Code"
                    style={{ borderRadius: 8, border: '4px solid white' }}
                  />
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-4)', wordBreak: 'break-all' }}>
                  Can't scan? Enter this URL manually in your app:<br />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{mfaQrUrl}</span>
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Step 2 —</strong> Enter the 6-digit code your app shows.
                </p>
                <form onSubmit={handleFinishMFAEnroll} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <input
                    className="form-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ maxWidth: 140, letterSpacing: '0.2em', textAlign: 'center', fontSize: 'var(--text-lg)' }}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={mfaLoading || mfaCode.length !== 6}
                  >
                    {mfaLoading ? 'Verifying…' : 'Verify & Enable'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setMfaPhase('idle'); setMfaCode(''); setMfaError(''); }}
                  >
                    Cancel
                  </button>
                </form>
                {mfaError && <p style={{ color: 'var(--severity-critical)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>{mfaError}</p>}
              </div>
            )}
          </section>
        )}

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
                <span className="form-hint">Saved locally to your browser — never sent to any server</span>
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
