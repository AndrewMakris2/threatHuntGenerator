/**
 * Companies — Saved company profile manager
 * Create, edit, set active, and delete company profiles
 */
import React, { useState } from 'react';
import {
  Building2, Plus, Crosshair, Pencil, Trash2,
  CheckCircle2, Clock, Globe, Shield,
  Search, AlertTriangle,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import CompanyModal from '../components/company/CompanyModal';

export default function Companies() {
  const { state, dispatch, addToast, activeCompany } = useApp();
  const { savedCompanies, activeCompanyId } = state;

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = savedCompanies.filter(c =>
    c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  function handleNew() {
    setEditingCompany(null);
    setModalOpen(true);
  }

  function handleEdit(company) {
    setEditingCompany(company);
    setModalOpen(true);
  }

  function handleSave(company) {
    if (company.id) {
      dispatch({ type: ACTIONS.UPDATE_COMPANY, company });
      addToast(`${company.companyName} updated`, 'success');
    } else {
      dispatch({ type: ACTIONS.SAVE_COMPANY, company });
      addToast(`${company.companyName} saved`, 'success');
    }
    setModalOpen(false);
  }

  function handleSetActive(company) {
    dispatch({ type: ACTIONS.SET_ACTIVE_COMPANY, companyId: company.id });
    addToast(`Active profile set to ${company.companyName}`, 'success');
  }

  function handleDelete(companyId) {
    const c = savedCompanies.find(x => x.id === companyId);
    dispatch({ type: ACTIONS.DELETE_COMPANY, companyId });
    addToast(`${c?.companyName} deleted`, 'info');
    setConfirmDelete(null);
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            <Building2 size={28} style={{ color: 'var(--accent-primary)', marginRight: 10 }} />
            Company Manager
          </h1>
          <p className="page-subtitle">
            Save and switch between multiple company profiles. The active profile is used when generating hunts.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNew} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} />
          New Company
        </button>
      </div>

      {/* Active company banner */}
      {activeCompany && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.04))',
          border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 12,
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <CheckCircle2 size={20} color="var(--accent-primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
              Active: {activeCompany.companyName}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              {activeCompany.industry} · {activeCompany.companySize} · Hunts will be generated for this profile
            </div>
          </div>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: activeCompany.brandColor || 'var(--accent-primary)',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: `0 0 8px ${activeCompany.brandColor || 'var(--accent-primary)'}80`,
            }}
          />
        </div>
      )}

      {/* Search */}
      {savedCompanies.length > 0 && (
        <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
      )}

      {/* Company grid */}
      {savedCompanies.length === 0 ? (
        <EmptyState onNew={handleNew} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          No companies match "{search}"
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              isActive={company.id === activeCompanyId}
              onEdit={() => handleEdit(company)}
              onSetActive={() => handleSetActive(company)}
              onDelete={() => setConfirmDelete(company.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <CompanyModal
          company={editingCompany}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {confirmDelete && (
        <DeleteConfirmModal
          company={savedCompanies.find(c => c.id === confirmDelete)}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

// ── Company Card ──────────────────────────────────────────────────────────────
function CompanyCard({ company, isActive, onEdit, onSetActive, onDelete }) {
  const color = company.brandColor || '#dc2626';

  const stackPills = [
    company.siemPlatform,
    company.edrPlatform,
    company.iamPlatform,
  ].filter(Boolean);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: isActive
        ? `1.5px solid ${color}`
        : '1px solid var(--border-subtle)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: isActive ? `0 0 20px ${color}20` : 'none',
    }}>
      {/* Color strip + header */}
      <div style={{
        height: 5,
        background: `linear-gradient(90deg, ${color}, ${company.accentColor || color}80)`,
      }} />
      <div style={{ padding: '1.1rem 1.25rem 0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Company initial avatar */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${color}20`,
          border: `1.5px solid ${color}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          fontWeight: 700,
          color,
          flexShrink: 0,
        }}>
          {company.logoUrl
            ? <img src={company.logoUrl} alt="" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: 4 }} onError={e => e.target.style.display='none'} />
            : (company.companyName?.[0] || '?').toUpperCase()
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {company.companyName || 'Unnamed Company'}
            </span>
            {isActive && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: `${color}20`,
                color,
                border: `1px solid ${color}50`,
                borderRadius: 20,
                padding: '1px 8px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>ACTIVE</span>
            )}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
            {[company.industry, company.companySize, company.regions?.[0]].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: '0 1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {stackPills.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {stackPills.map(p => (
              <span key={p} style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}>{p}</span>
            ))}
          </div>
        )}

        {company.cloudProviders?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Globe size={12} />
            {company.cloudProviders.join(', ')}
          </div>
        )}

        {company.complianceRequirements?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Shield size={12} />
            {company.complianceRequirements.slice(0, 3).join(', ')}
          </div>
        )}

        {company.lastUsedAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <Clock size={11} />
            Last used {new Date(company.lastUsedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '0.65rem 1.25rem',
        display: 'flex',
        gap: 8,
        background: 'var(--bg-surface)',
      }}>
        {!isActive && (
          <button
            className="btn btn-primary"
            onClick={onSetActive}
            style={{ flex: 1, fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Crosshair size={13} />
            Set Active
          </button>
        )}
        {isActive && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.78rem',
            color,
            fontWeight: 600,
          }}>
            <CheckCircle2 size={13} />
            Currently Active
          </div>
        )}
        <button
          className="btn btn-ghost"
          onClick={onEdit}
          title="Edit"
          style={{ padding: '6px 10px' }}
        >
          <Pencil size={14} />
        </button>
        <button
          className="btn btn-ghost"
          onClick={onDelete}
          title="Delete"
          style={{ padding: '6px 10px', color: '#ef4444' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '5rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'rgba(220,38,38,0.08)',
        border: '1px solid rgba(220,38,38,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Building2 size={32} color="var(--accent-primary)" />
      </div>
      <div>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: '1.3rem' }}>No companies saved yet</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', maxWidth: 400 }}>
          Save company profiles to quickly switch between clients or jobs without re-entering all settings each time.
        </p>
      </div>
      <button className="btn btn-primary" onClick={onNew} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Plus size={16} />
        Create Your First Company
      </button>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ company, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '2rem',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <AlertTriangle size={24} color="#ef4444" />
        </div>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Delete Company?</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>{company?.companyName}</strong> will be permanently deleted.
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{ background: '#dc2626', color: '#fff', border: 'none' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
