/**
 * PDFCustomizer — Pre-export PDF branding/options modal
 * Allows customizing colors, logo, analyst name, sections before PDF download
 */
import React, { useState, useRef } from 'react';
import { X, FileText, Download, Eye, Check, Upload } from 'lucide-react';
import { exportSingleHuntAsPDF } from '../../services/exportService';

const CLASSIFICATION_OPTIONS = [
  { value: '',             label: 'None' },
  { value: 'INTERNAL',    label: 'Internal Use Only' },
  { value: 'CONFIDENTIAL',label: 'Confidential' },
  { value: 'TLP:WHITE',   label: 'TLP:WHITE' },
  { value: 'TLP:GREEN',   label: 'TLP:GREEN' },
  { value: 'TLP:AMBER',   label: 'TLP:AMBER' },
  { value: 'TLP:RED',     label: 'TLP:RED' },
];

const SECTION_OPTIONS = [
  { key: 'overview',    label: 'Overview & Context' },
  { key: 'huntSteps',   label: 'Hunt Procedure Steps' },
  { key: 'queries',     label: 'Detection Queries' },
  { key: 'iocs',        label: 'IOCs & Suspicious Behaviors' },
  { key: 'remediation', label: 'Remediation Actions' },
  { key: 'notes',       label: 'Analyst Notes' },
];

export default function PDFCustomizer({ hunt, activeCompany, onClose }) {
  const logoFileRef = useRef(null);

  const [options, setOptions] = useState(() => ({
    reportTitle: hunt?.title || 'Threat Hunt Report',
    analystName: activeCompany?.analystName || '',
    classification: activeCompany?.defaultClassification || 'CONFIDENTIAL',
    primaryColor: activeCompany?.brandColor || '#dc2626',
    accentColor: activeCompany?.accentColor || '#ef4444',
    logoUrl: activeCompany?.logoUrl || '',
    companyName: activeCompany?.companyName || hunt?.companyName || '',
    footerNote: '',
    includeSections: {
      overview: true,
      huntSteps: true,
      queries: true,
      iocs: true,
      remediation: true,
      notes: true,
    },
  }));

  function set(field, value) {
    setOptions(o => ({ ...o, [field]: value }));
  }

  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('logoUrl', ev.target.result);
    reader.readAsDataURL(file);
  }

  function toggleSection(key) {
    setOptions(o => ({
      ...o,
      includeSections: { ...o.includeSections, [key]: !o.includeSections[key] },
    }));
  }

  function handleDownload() {
    exportSingleHuntAsPDF(hunt, options);
    onClose();
  }

  const primary = options.primaryColor || '#dc2626';
  const accent  = options.accentColor  || '#ef4444';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 18,
        width: '100%',
        maxWidth: 680,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Customize PDF Report
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {hunt?.title}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Live preview strip */}
          <div style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              background: '#111',
              padding: '1rem 1.25rem',
              borderBottom: `4px solid ${primary}`,
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              {options.logoUrl ? (
                <img
                  src={options.logoUrl}
                  alt="logo"
                  style={{ height: 36, objectFit: 'contain', background: '#fff', padding: 3, borderRadius: 4 }}
                  onError={e => e.target.style.display='none'}
                />
              ) : (
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: `${primary}20`,
                  border: `1.5px solid ${primary}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: primary, fontSize: '1.1rem',
                }}>
                  {options.companyName?.[0]?.toUpperCase() || 'P'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#f5f5f5', fontSize: '0.9rem' }}>
                  {options.companyName || 'Phantom Hunter'}
                </div>
                <div style={{ fontSize: '0.7rem', color: primary, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Threat Hunt Report
                </div>
              </div>
              {options.classification && (
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  background: `${primary}20`,
                  color: primary,
                  border: `1px solid ${primary}40`,
                  borderRadius: 4,
                  padding: '3px 8px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {options.classification}
                </span>
              )}
            </div>
            <div style={{ padding: '0.75rem 1.25rem', background: '#0d0d0d', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={12} style={{ color: '#555' }} />
              <span style={{ fontSize: '0.72rem', color: '#555' }}>Live preview — PDF header</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: primary }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent }} />
              </div>
            </div>
          </div>

          {/* Report Info */}
          <Section title="Report Information">
            <FieldRow>
              <Field label="Report Title">
                <input
                  className="form-input"
                  value={options.reportTitle}
                  onChange={e => set('reportTitle', e.target.value)}
                  placeholder="Threat Hunt Report"
                />
              </Field>
              <Field label="Analyst / Author Name">
                <input
                  className="form-input"
                  value={options.analystName}
                  onChange={e => set('analystName', e.target.value)}
                  placeholder="Your name or team"
                />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Prepared For (Company)">
                <input
                  className="form-input"
                  value={options.companyName}
                  onChange={e => set('companyName', e.target.value)}
                  placeholder="Client or company name"
                />
              </Field>
              <Field label="Classification">
                <select className="form-select" value={options.classification} onChange={e => set('classification', e.target.value)}>
                  {CLASSIFICATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
            </FieldRow>
            <Field label="Footer Note (optional)">
              <input
                className="form-input"
                value={options.footerNote}
                onChange={e => set('footerNote', e.target.value)}
                placeholder="e.g. This report is for authorized use only…"
              />
            </Field>
          </Section>

          {/* Branding */}
          <Section title="Brand Colors">
            <FieldRow>
              <Field label="Primary Color">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={options.primaryColor}
                    onChange={e => set('primaryColor', e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 0 }}
                  />
                  <input
                    className="form-input"
                    value={options.primaryColor}
                    onChange={e => set('primaryColor', e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </Field>
              <Field label="Accent Color">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={options.accentColor}
                    onChange={e => set('accentColor', e.target.value)}
                    style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 0 }}
                  />
                  <input
                    className="form-input"
                    value={options.accentColor}
                    onChange={e => set('accentColor', e.target.value)}
                    style={{ flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </Field>
            </FieldRow>
            <Field label="Company Logo">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => logoFileRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                  >
                    <Upload size={13} /> Upload File
                  </button>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleLogoFile}
                  />
                  {options.logoUrl && options.logoUrl.startsWith('data:') && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={11} /> Image uploaded
                    </span>
                  )}
                </div>
                <input
                  className="form-input"
                  value={options.logoUrl.startsWith('data:') ? '' : options.logoUrl}
                  onChange={e => set('logoUrl', e.target.value)}
                  placeholder="Or paste a URL: https://example.com/logo.png"
                  style={{ fontSize: '0.8rem' }}
                />
              </div>
            </Field>
          </Section>

          {/* Sections */}
          <Section title="Include Sections">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SECTION_OPTIONS.map(s => {
                const on = options.includeSections[s.key];
                return (
                  <label
                    key={s.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      border: on ? '1px solid rgba(220,38,38,0.4)' : '1px solid var(--border-subtle)',
                      background: on ? 'rgba(220,38,38,0.06)' : 'var(--bg-surface)',
                      fontSize: '0.82rem',
                      color: on ? 'var(--text-primary)' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleSection(s.key)}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: on ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-subtle)',
                      background: on ? 'var(--accent-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <Check size={11} color="#fff" />}
                    </div>
                    {s.label}
                  </label>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download size={15} />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div>
      <h3 style={{
        margin: '0 0 1rem',
        color: 'var(--text-secondary)',
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.5rem',
      }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 600,
        color: 'var(--text-secondary)', marginBottom: 5,
        letterSpacing: '0.03em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}
