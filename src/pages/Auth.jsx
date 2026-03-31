import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, UserPlus, Eye, EyeOff, Zap, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, getMFAResolver, completeMFASignIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // MFA state
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaResolver, setMfaResolver] = useState(null);
  const [mfaCode, setMfaCode] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else {
        await signUp(email, password);
        setSuccessMsg('Account created! You can now sign in.');
        setMode('login');
      }
    } catch (err) {
      if (err.code === 'auth/multi-factor-auth-required') {
        // MFA required — switch to the OTP step
        setMfaResolver(getMFAResolver(err));
        setMfaStep(true);
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMFAVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await completeMFASignIn(mfaResolver, mfaCode.trim());
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.code === 'auth/invalid-verification-code'
        ? 'Invalid code — please check your authenticator app and try again.'
        : err.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  }

  // ── MFA verification screen ──────────────────────────────────────────────────
  if (mfaStep) {
    return (
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon"><Smartphone size={24} /></div>
            <div>
              <div className="auth-logo-name">PHANTOM HUNTER</div>
              <div className="auth-logo-sub">Two-Factor Verification</div>
            </div>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', textAlign: 'center', lineHeight: 1.6 }}>
            Open your authenticator app and enter the 6-digit code for Phantom Hunter.
          </p>

          <form className="auth-form" onSubmit={handleMFAVerify}>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-field">
              <label className="auth-label">Authenticator Code</label>
              <div className="auth-input-wrap">
                <Smartphone size={15} className="auth-input-icon" />
                <input
                  className="auth-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  style={{ letterSpacing: '0.2em', fontSize: 'var(--text-lg)', textAlign: 'center' }}
                />
              </div>
            </div>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading || mfaCode.length !== 6}>
              {loading ? 'Verifying…' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
              onClick={() => { setMfaStep(false); setMfaCode(''); setError(''); }}
            >
              ← Back to sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg" />

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={24} />
          </div>
          <div>
            <div className="auth-logo-name">PHANTOM HUNTER</div>
            <div className="auth-logo-sub">Threat Hunt Platform</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
          >
            <UserPlus size={14} /> Create Account
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <Mail size={15} className="auth-input-icon" />
              <input
                className="auth-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <Lock size={15} className="auth-input-icon" />
              <input
                className="auth-input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input
                  className="auth-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          )}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider"><span>or</span></div>

        {/* Google */}
        <button className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.93V17h2v-.07C15.72 16.52 18 14.47 18 12c0-3.31-2.69-6-6-6s-6 2.69-6 6c0 2.47 2.28 4.52 5 4.93zM12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z"/></svg>
          Continue with Google
        </button>

        {/* Features hint */}
        <div className="auth-features">
          <div className="auth-feature"><Zap size={11} /> AI-powered hunt generation</div>
          <div className="auth-feature"><Shield size={11} /> Companies sync across devices</div>
          <div className="auth-feature"><LogIn size={11} /> Saved hunts in the cloud</div>
        </div>
      </div>
    </div>
  );
}
