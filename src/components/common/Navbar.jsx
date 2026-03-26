import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, Settings, LogOut, Zap } from 'lucide-react';
import { useApp, ACTIONS } from '../../context/AppContext';
import PhantomLogo from './PhantomLogo';
import './Navbar.css';

export default function Navbar() {
  const { state, dispatch, activeCompany } = useApp();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const companyName = activeCompany?.companyName || state.companyProfile?.companyName;
  const huntCount   = state.generatedHunts.length;
  const brandColor  = activeCompany?.brandColor;

  return (
    <nav className="navbar">
      {/* Brand block — same width as sidebar */}
      <div className="navbar-left">
        <button
          className="navbar-menu-btn"
          onClick={() => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR })}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
          <PhantomLogo size={22} glow />
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">Phantom</span>
            <span className="navbar-brand-suffix">Hunter</span>
          </div>
        </Link>
      </div>

      {/* Center — active company + page */}
      <div className="navbar-center hide-mobile">
        <span className="navbar-breadcrumb-page" style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {getPageLabel(location.pathname)}
        </span>

        {state.profileComplete && companyName && (
          <>
            <span style={{ color: 'var(--border-default)', fontSize: '0.8rem' }}>/</span>
            <div className="navbar-company-pill">
              <div
                className="navbar-company-dot"
                style={brandColor ? { background: brandColor, boxShadow: `0 0 6px ${brandColor}90` } : undefined}
              />
              <span>{companyName}</span>
              {huntCount > 0 && <span className="navbar-hunt-count">{huntCount}</span>}
            </div>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="navbar-right">
        <div className="navbar-ai-badge">
          <Zap size={10} />
          <span>AI-Ready</span>
        </div>

        <button className="navbar-icon-btn" aria-label="Notifications">
          <Bell size={16} />
          {huntCount > 0 && <span className="navbar-notification-dot" />}
        </button>

        <div className="navbar-user-menu" ref={menuRef}>
          <button className="navbar-user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="navbar-avatar">
              <User size={13} />
            </div>
            <span className="navbar-username hide-mobile">Analyst</span>
            <ChevronDown size={12} className={`navbar-chevron ${userMenuOpen ? 'open' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="navbar-dropdown animate-fade-in">
              <div className="navbar-dropdown-header">
                <div className="navbar-avatar-lg"><User size={16} /></div>
                <div>
                  <div className="navbar-dropdown-name">Security Analyst</div>
                  <div className="navbar-dropdown-role">SOC Team</div>
                </div>
              </div>
              <div className="navbar-dropdown-divider" />
              <Link to="/settings" className="navbar-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                <Settings size={14} /> Settings
              </Link>
              <button className="navbar-dropdown-item navbar-dropdown-logout">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function getPageLabel(pathname) {
  const labels = {
    '/':           'Dashboard',
    '/companies':  'Companies',
    '/profile':    'Profile',
    '/generate':   'Generator',
    '/results':    'Results',
    '/saved':      'Saved Hunts',
    '/settings':   'Settings',
  };
  return labels[pathname] || '';
}
