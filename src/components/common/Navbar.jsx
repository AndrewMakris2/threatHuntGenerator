import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield, Menu, Bell, Search, ChevronDown,
  User, Settings, LogOut, Zap,
} from 'lucide-react';
import { useApp, ACTIONS } from '../../context/AppContext';
import './Navbar.css';

export default function Navbar() {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  // Close user menu on outside click
  React.useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const profile = state.companyProfile;
  const companyName = profile?.companyName || 'Threat Hunt Generator';
  const huntCount = state.generatedHunts.length;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="navbar-menu-btn btn btn-ghost btn-icon"
          onClick={() => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR })}
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <Shield size={18} strokeWidth={2.5} />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-name">ThreatHunt</span>
            <span className="navbar-brand-suffix">Generator</span>
          </div>
        </Link>

        {/* Breadcrumb */}
        <div className="navbar-breadcrumb hide-mobile">
          <span className="navbar-breadcrumb-sep">/</span>
          <span className="navbar-breadcrumb-page">{getPageLabel(location.pathname)}</span>
        </div>
      </div>

      <div className="navbar-center hide-mobile">
        {state.profileComplete && (
          <div className="navbar-company-pill">
            <div className="navbar-company-dot" />
            <span>{companyName}</span>
            {huntCount > 0 && (
              <span className="navbar-hunt-count">{huntCount} hunts</span>
            )}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {/* AI Status indicator */}
        <div className="navbar-ai-badge">
          <Zap size={12} />
          <span>AI-Ready</span>
        </div>

        {/* Notification bell */}
        <button className="btn btn-ghost btn-icon navbar-icon-btn" aria-label="Notifications">
          <Bell size={18} />
          {huntCount > 0 && <span className="navbar-notification-dot" />}
        </button>

        {/* User menu */}
        <div className="navbar-user-menu" ref={menuRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="navbar-avatar">
              <User size={16} />
            </div>
            <span className="navbar-username hide-mobile">Analyst</span>
            <ChevronDown size={14} className={`navbar-chevron ${userMenuOpen ? 'open' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="navbar-dropdown animate-fade-in">
              <div className="navbar-dropdown-header">
                <div className="navbar-avatar-lg">
                  <User size={20} />
                </div>
                <div>
                  <div className="navbar-dropdown-name">Security Analyst</div>
                  <div className="navbar-dropdown-role">SOC Team</div>
                </div>
              </div>
              <div className="navbar-dropdown-divider" />
              <Link
                to="/settings"
                className="navbar-dropdown-item"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings size={15} /> Settings
              </Link>
              <button className="navbar-dropdown-item navbar-dropdown-logout">
                <LogOut size={15} /> Sign Out
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
    '/':            'Dashboard',
    '/profile':     'Company Profile',
    '/generate':    'Hunt Generator',
    '/results':     'Hunt Results',
    '/saved':       'Saved Hunts',
    '/settings':    'Settings',
  };
  return labels[pathname] || 'Dashboard';
}
