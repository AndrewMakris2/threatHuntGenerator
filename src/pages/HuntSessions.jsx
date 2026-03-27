import React, { useState } from 'react';
import {
  History, Trash2, ChevronDown, Building2,
  Zap, Calendar, Target, Cpu,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import HuntCard from '../components/hunt/HuntCard';
import HuntDetail from '../components/hunt/HuntDetail';
import Modal from '../components/common/Modal';
import './HuntSessions.css';

export default function HuntSessions() {
  const { state, syncDispatch, dispatch, addToast } = useApp();
  const { huntSessions } = state;

  const [expandedId, setExpandedId] = useState(null);
  const [activeHunt, setActiveHunt] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  function handleDeleteSession(sessionId) {
    syncDispatch({ type: ACTIONS.DELETE_HUNT_SESSION, sessionId });
    addToast('Session removed', 'info');
    setConfirmDelete(null);
    if (expandedId === sessionId) setExpandedId(null);
  }

  function handleClearAll() {
    dispatch({ type: ACTIONS.CLEAR_HUNT_SESSIONS });
    addToast('Hunt history cleared', 'info');
    setConfirmClear(false);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">
            <History size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--accent-primary)' }} />
            Hunt History
          </h1>
          <p className="page-subtitle">
            Every generation session saved — browse past hunts by company and date.
          </p>
        </div>
        {huntSessions.length > 0 && (
          <button
            className="btn btn-ghost"
            onClick={() => setConfirmClear(true)}
            style={{ color: 'var(--severity-high)', gap: 6 }}
          >
            <Trash2 size={14} /> Clear All
          </button>
        )}
      </div>

      {huntSessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><History size={28} /></div>
          <h3 className="empty-state-title">No hunt sessions yet</h3>
          <p className="empty-state-text">Every time you generate hunts a session will be saved here.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {huntSessions.map(session => (
            <div key={session.id} className="session-card card">
              {/* Session header */}
              <div
                className="session-header"
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              >
                <div className="session-header-left">
                  <div className="session-company-icon">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <div className="session-company-name">{session.companyName}</div>
                    <div className="session-meta">
                      <Calendar size={11} />
                      {formatDate(session.generatedAt)}
                    </div>
                  </div>
                </div>

                <div className="session-header-right">
                  <span className="session-badge">
                    <Target size={11} /> {session.huntCount} hunts
                  </span>
                  {session.method === 'ai' ? (
                    <span className="session-badge session-badge-ai">
                      <Zap size={11} /> {session.aiProvider || 'AI'}
                    </span>
                  ) : (
                    <span className="session-badge session-badge-rules">
                      <Cpu size={11} /> Rules Engine
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={e => { e.stopPropagation(); setConfirmDelete(session.id); }}
                    title="Delete session"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronDown
                    size={15}
                    className={`session-chevron ${expandedId === session.id ? 'open' : ''}`}
                  />
                </div>
              </div>

              {/* Hunt cards */}
              {expandedId === session.id && session.hunts?.length > 0 && (
                <div className="session-hunts animate-fade-in">
                  <div className="session-hunts-grid">
                    {session.hunts.map(hunt => (
                      <HuntCard
                        key={hunt.id}
                        hunt={hunt}
                        compact
                        onOpen={h => setActiveHunt(h)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hunt detail modal */}
      {activeHunt && (
        <Modal open onClose={() => setActiveHunt(null)} size="xl">
          <HuntDetail hunt={activeHunt} onClose={() => setActiveHunt(null)} />
        </Modal>
      )}

      {/* Confirm delete session */}
      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} size="sm">
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={28} style={{ color: 'var(--severity-high)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8 }}>Delete this session?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
              This removes the session and its hunts from your history. Saved hunts are not affected.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--severity-high)', borderColor: 'var(--severity-high)' }} onClick={() => handleDeleteSession(confirmDelete)}>Delete</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm clear all */}
      {confirmClear && (
        <Modal open onClose={() => setConfirmClear(false)} size="sm">
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={28} style={{ color: 'var(--severity-critical)', marginBottom: 12 }} />
            <h3 style={{ marginBottom: 8 }}>Clear all hunt history?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
              This removes all {huntSessions.length} sessions. Saved hunts in your library are not affected.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--severity-critical)', borderColor: 'var(--severity-critical)' }} onClick={handleClearAll}>Clear All</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
