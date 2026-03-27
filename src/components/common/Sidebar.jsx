import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Crosshair,
  BookmarkCheck, Settings, Target,
  Sparkles, TrendingUp, History,
} from 'lucide-react';
import { useApp, ACTIONS } from '../../context/AppContext';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { to: '/',           icon: LayoutDashboard, label: 'Dashboard',      end: true },
    ],
  },
  {
    section: 'Hunt Workflow',
    items: [
      { to: '/companies',  icon: Building2,       label: 'Companies'       },
      { to: '/generate',   icon: Sparkles,         label: 'Hunt Generator' },
      { to: '/results',    icon: Crosshair,        label: 'Hunt Results'   },
    ],
  },
  {
    section: 'Library',
    items: [
      { to: '/saved',    icon: BookmarkCheck, label: 'Saved Hunts'  },
      { to: '/history',  icon: History,       label: 'Hunt History' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/settings', icon: Settings,         label: 'Settings'        },
    ],
  },
];

export default function Sidebar() {
  const { state, dispatch, activeCompany } = useApp();
  const collapsed = state.sidebarCollapsed;
  const navigate = useNavigate();

  const profile = state.companyProfile;
  const companyName = activeCompany?.companyName || profile?.companyName;
  const huntCount   = state.generatedHunts.length;
  const savedCount  = state.savedHunts.length;
  const brandColor  = activeCompany?.brandColor || 'var(--accent-primary)';

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="sidebar-backdrop hide-desktop"
          onClick={() => dispatch({ type: ACTIONS.TOGGLE_SIDEBAR })}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Profile summary */}
        {!collapsed && (
          <div className="sidebar-profile" style={{ borderColor: activeCompany ? `${brandColor}40` : undefined }}>
            <div className="sidebar-profile-icon" style={{ background: activeCompany ? `${brandColor}20` : undefined, color: brandColor }}>
              {activeCompany
                ? <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{companyName?.[0]?.toUpperCase() || <Target size={18} />}</span>
                : <Target size={18} />
              }
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">
                {companyName || 'No Company'}
              </div>
              <div className="sidebar-profile-meta">
                {activeCompany
                  ? (huntCount > 0 ? `${huntCount} hunts generated` : activeCompany.industry || 'Active profile')
                  : 'Select a company'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(section => (
            <div key={section.section} className="sidebar-section">
              {!collapsed && (
                <div className="sidebar-section-label">{section.section}</div>
              )}
              {section.items.map(item => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  savedCount={item.to === '/saved' ? savedCount : item.to === '/companies' ? state.savedCompanies.length : item.to === '/history' ? state.huntSessions?.length : undefined}
                  huntCount={item.to === '/results' ? huntCount : undefined}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Quick stats */}
        {!collapsed && huntCount > 0 && (
          <div className="sidebar-stats">
            <div className="sidebar-stat">
              <TrendingUp size={14} />
              <span>{huntCount} generated</span>
            </div>
            <div className="sidebar-stat">
              <BookmarkCheck size={14} />
              <span>{savedCount} saved</span>
            </div>
          </div>
        )}

        {/* Generate CTA */}
        {!collapsed && (
          <div className="sidebar-cta">
            <button
              className="btn btn-primary sidebar-cta-btn"
              onClick={() => navigate('/generate')}
            >
              <Sparkles size={15} />
              Generate Hunts
            </button>
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-version">Phantom Hunter v1.0</div>
          </div>
        )}
      </aside>
    </>
  );
}

function SidebarNavItem({ item, collapsed, savedCount, huntCount }) {
  const badge = savedCount > 0 ? savedCount : huntCount > 0 ? huntCount : null;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `sidebar-nav-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="sidebar-nav-icon">
        <item.icon size={18} />
      </span>
      {!collapsed && (
        <>
          <span className="sidebar-nav-label">{item.label}</span>
          {badge != null && <span className="sidebar-nav-badge">{badge}</span>}
        </>
      )}
    </NavLink>
  );
}
