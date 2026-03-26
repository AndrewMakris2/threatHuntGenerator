/**
 * CompanyModal — Create or edit a saved company profile
 * Tabbed form covering all profile fields + branding settings
 */
import React, { useState } from 'react';
import {
  X, Building2, Shield, Cloud, AlertTriangle,
  Crosshair, Palette, Check,
} from 'lucide-react';
import {
  INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS, SIEM_OPTIONS, EDR_OPTIONS,
  IAM_OPTIONS, EMAIL_PLATFORM_OPTIONS, CLOUD_PROVIDER_OPTIONS, OS_OPTIONS,
  COMPLIANCE_OPTIONS, DATA_TYPE_OPTIONS, THREAT_OPTIONS, MATURITY_LEVELS,
  REGION_OPTIONS, INTERNET_FACING_OPTIONS, EMPTY_COMPANY_PROFILE,
  PAM_OPTIONS, BACKUP_OPTIONS, CASB_OPTIONS, VULN_MGMT_OPTIONS,
} from '../../data/sampleData';

const TABS = [
  { id: 'company',   label: 'Company',        icon: Building2 },
  { id: 'stack',     label: 'Security Stack',  icon: Shield },
  { id: 'infra',     label: 'Infrastructure',  icon: Cloud },
  { id: 'risk',      label: 'Risk & Compliance', icon: AlertTriangle },
  { id: 'threats',   label: 'Threats',         icon: Crosshair },
  { id: 'branding',  label: 'Branding',        icon: Palette },
];

const EMAIL_SEC_OPTIONS = [
  { value: 'Proofpoint',                         label: 'Proofpoint Email Security' },
  { value: 'Mimecast',                           label: 'Mimecast' },
  { value: 'Microsoft Defender for Office 365',  label: 'Microsoft Defender for O365' },
  { value: 'Abnormal Security',                  label: 'Abnormal Security' },
  { value: 'Barracuda',                          label: 'Barracuda Email Security' },
  { value: 'Cisco Secure Email',                 label: 'Cisco Secure Email (IronPort)' },
  { value: 'IRONSCALES',                         label: 'IRONSCALES' },
  { value: 'Area 1 Security',                    label: 'Cloudflare Area 1 (Email Security)' },
  { value: 'Tessian',                            label: 'Tessian (Proofpoint)' },
  { value: 'Check Point Harmony Email',          label: 'Check Point Harmony Email' },
  { value: 'Trellix Email Security',             label: 'Trellix Email Security' },
  { value: 'Agari',                              label: 'Agari Email Security' },
  { value: 'Zix',                                label: 'Zix / OpenText Email' },
  { value: 'Google Workspace Email Security',    label: 'Google Workspace Email Security' },
  { value: 'none',                               label: 'None' },
  { value: 'other',                              label: 'Other' },
];

const NETWORK_OPTIONS = [
  { value: 'Darktrace',                          label: 'Darktrace NDR' },
  { value: 'Vectra AI',                          label: 'Vectra AI NDR' },
  { value: 'ExtraHop',                           label: 'ExtraHop Reveal(x)' },
  { value: 'Cisco Secure Network Analytics',     label: 'Cisco Secure Network Analytics' },
  { value: 'Palo Alto Panorama',                 label: 'Palo Alto Panorama / NGFW' },
  { value: 'Corelight',                          label: 'Corelight (Zeek)' },
  { value: 'Zeek/Bro',                           label: 'Zeek / Bro (Open Source)' },
  { value: 'Suricata',                           label: 'Suricata IDS/IPS' },
  { value: 'Snort',                              label: 'Snort IDS/IPS' },
  { value: 'Fortinet FortiNDR',                  label: 'Fortinet FortiNDR' },
  { value: 'Stamus Networks',                    label: 'Stamus Networks SELKS' },
  { value: 'Gigamon',                            label: 'Gigamon Deep Observability' },
  { value: 'Arista NDR',                         label: 'Arista NDR (Awake)' },
  { value: 'Palo Alto Cortex XDR Network',       label: 'Palo Alto Cortex XDR (Network)' },
  { value: 'none',                               label: 'None' },
  { value: 'other',                              label: 'Other' },
];

const SEGMENTATION_OPTIONS = [
  { value: 'full',    label: 'Full — Micro-segmentation enforced' },
  { value: 'partial', label: 'Partial — Some segments isolated' },
  { value: 'none',    label: 'None — Flat network' },
];

const REMOTE_OPTIONS = [
  { value: 'full',    label: 'Fully Remote' },
  { value: 'partial', label: 'Hybrid / Partial' },
  { value: 'none',    label: 'On-Site Only' },
];

const THIRD_PARTY_OPTIONS = [
  { value: 'high',   label: 'High — Many critical vendor integrations' },
  { value: 'medium', label: 'Medium — Some third-party dependencies' },
  { value: 'low',    label: 'Low — Minimal third-party access' },
];

const SENSITIVITY_OPTIONS = [
  { value: 'low',      label: 'Low' },
  { value: 'medium',   label: 'Medium' },
  { value: 'high',     label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const ON_PREM_OPTIONS = [
  { value: 'cloud-only', label: 'Cloud Only' },
  { value: 'hybrid',     label: 'Hybrid' },
  { value: 'on-prem',    label: 'On-Premises Only' },
];

const ENDPOINT_OPTIONS = [
  { value: 'windows', label: 'Windows' },
  { value: 'macos',   label: 'macOS' },
  { value: 'linux',   label: 'Linux' },
  { value: 'mobile',  label: 'Mobile (iOS/Android)' },
];

const CLASSIFICATION_OPTIONS = [
  { value: 'INTERNAL',      label: 'Internal Use Only' },
  { value: 'CONFIDENTIAL',  label: 'Confidential' },
  { value: 'TLP:WHITE',     label: 'TLP:WHITE (Public)' },
  { value: 'TLP:GREEN',     label: 'TLP:GREEN (Community)' },
  { value: 'TLP:AMBER',     label: 'TLP:AMBER (Limited)' },
  { value: 'TLP:RED',       label: 'TLP:RED (Restricted)' },
];

export default function CompanyModal({ company, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('company');
  const [form, setForm] = useState(() => ({
    ...EMPTY_COMPANY_PROFILE,
    brandColor: '#dc2626',
    accentColor: '#ef4444',
    logoUrl: '',
    defaultClassification: 'CONFIDENTIAL',
    analystName: '',
    ...(company || {}),
  }));

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function toggleArray(field, value) {
    const arr = form[field] || [];
    set(field, arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  }

  function handleSave() {
    if (!form.companyName?.trim()) {
      alert('Company name is required');
      return;
    }
    onSave(form);
  }

  const tab = activeTab;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 18,
        width: '100%',
        maxWidth: 760,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              {company ? `Edit: ${company.companyName}` : 'New Company Profile'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Fill in company details to generate tailored threat hunts
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          overflowX: 'auto',
          flexShrink: 0,
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.7rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === t.id ? 700 : 400,
                fontSize: '0.8rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content (scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* ── COMPANY TAB ── */}
          {tab === 'company' && (
            <FormSection title="Company Identity">
              <FormRow>
                <FormField label="Company Name *">
                  <input className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Acme Corp" />
                </FormField>
                <FormField label="Industry">
                  <select className="form-select" value={form.industry} onChange={e => set('industry', e.target.value)}>
                    <option value="">Select industry…</option>
                    {INDUSTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="Business Type">
                  <input className="form-input" value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="e.g. Financial Services / Banking" />
                </FormField>
                <FormField label="Company Size">
                  <select className="form-select" value={form.companySize} onChange={e => set('companySize', e.target.value)}>
                    <option value="">Select size…</option>
                    {COMPANY_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </FormRow>
              <FormField label="Website / Domain">
                <input className="form-input" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} placeholder="example.com" />
              </FormField>
              <FormField label="Regions of Operation">
                <CheckboxGrid options={REGION_OPTIONS} selected={form.regions || []} onToggle={v => toggleArray('regions', v)} />
              </FormField>
            </FormSection>
          )}

          {/* ── STACK TAB ── */}
          {tab === 'stack' && (
            <FormSection title="Security Tool Stack">
              <FormRow>
                <FormField label="SIEM Platform">
                  <SelectWithOther value={form.siemPlatform || ''} onChange={v => set('siemPlatform', v)} options={SIEM_OPTIONS} placeholder="Select SIEM…" />
                </FormField>
                <FormField label="EDR Platform">
                  <SelectWithOther value={form.edrPlatform || ''} onChange={v => set('edrPlatform', v)} options={EDR_OPTIONS} placeholder="Select EDR…" />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="IAM / SSO Platform">
                  <SelectWithOther value={form.iamPlatform || ''} onChange={v => set('iamPlatform', v)} options={IAM_OPTIONS} placeholder="Select IAM…" />
                </FormField>
                <FormField label="Email Platform">
                  <SelectWithOther value={form.emailPlatform || ''} onChange={v => set('emailPlatform', v)} options={EMAIL_PLATFORM_OPTIONS} placeholder="Select platform…" />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="Email Security / SEG">
                  <SelectWithOther value={form.emailSecurityPlatform || ''} onChange={v => set('emailSecurityPlatform', v)} options={EMAIL_SEC_OPTIONS} placeholder="Select…" />
                </FormField>
                <FormField label="Network Monitoring">
                  <SelectWithOther value={form.networkMonitoring || ''} onChange={v => set('networkMonitoring', v)} options={NETWORK_OPTIONS} placeholder="Select…" />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="PAM Solution">
                  <SelectWithOther value={form.pamSolution || ''} onChange={v => set('pamSolution', v)} options={PAM_OPTIONS} placeholder="Select PAM…" />
                </FormField>
                <FormField label="Backup Solution">
                  <SelectWithOther value={form.backupSolution || ''} onChange={v => set('backupSolution', v)} options={BACKUP_OPTIONS} placeholder="Select backup…" />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="CASB">
                  <SelectWithOther value={form.casb || ''} onChange={v => set('casb', v)} options={CASB_OPTIONS} placeholder="Select CASB…" />
                </FormField>
                <FormField label="Vulnerability Management">
                  <SelectWithOther value={form.vulnerabilityManagement || ''} onChange={v => set('vulnerabilityManagement', v)} options={VULN_MGMT_OPTIONS} placeholder="Select vuln mgmt…" />
                </FormField>
              </FormRow>
            </FormSection>
          )}

          {/* ── INFRASTRUCTURE TAB ── */}
          {tab === 'infra' && (
            <FormSection title="Infrastructure">
              <FormField label="Cloud Providers">
                <CheckboxGrid options={CLOUD_PROVIDER_OPTIONS} selected={form.cloudProviders || []} onToggle={v => toggleArray('cloudProviders', v)} />
              </FormField>
              <FormField label="Endpoint Platforms">
                <CheckboxGrid options={ENDPOINT_OPTIONS} selected={form.endpointPlatforms || []} onToggle={v => toggleArray('endpointPlatforms', v)} />
              </FormField>
              <FormField label="Operating Systems">
                <CheckboxGrid options={OS_OPTIONS} selected={form.operatingSystems || []} onToggle={v => toggleArray('operatingSystems', v)} />
              </FormField>
              <FormRow>
                <FormField label="On-Prem vs Cloud">
                  <select className="form-select" value={form.onPremVsCloud} onChange={e => set('onPremVsCloud', e.target.value)}>
                    <option value="">Select…</option>
                    {ON_PREM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Network Segmentation">
                  <select className="form-select" value={form.networkSegmentation} onChange={e => set('networkSegmentation', e.target.value)}>
                    <option value="">Select…</option>
                    {SEGMENTATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </FormRow>
              <FormField label="Internet-Facing Systems">
                <CheckboxGrid options={INTERNET_FACING_OPTIONS} selected={form.internetFacingSystems || []} onToggle={v => toggleArray('internetFacingSystems', v)} />
              </FormField>
              <FormField label="Critical Applications">
                <textarea className="form-input" value={form.criticalApps} onChange={e => set('criticalApps', e.target.value)} placeholder="e.g. Core banking system, ERP, customer portal…" rows={2} style={{ resize: 'vertical' }} />
              </FormField>
            </FormSection>
          )}

          {/* ── RISK TAB ── */}
          {tab === 'risk' && (
            <FormSection title="Compliance & Risk">
              <FormField label="Compliance Requirements">
                <CheckboxGrid options={COMPLIANCE_OPTIONS} selected={form.complianceRequirements || []} onToggle={v => toggleArray('complianceRequirements', v)} />
              </FormField>
              <FormField label="Data Types Handled">
                <CheckboxGrid options={DATA_TYPE_OPTIONS} selected={form.dataTypes || []} onToggle={v => toggleArray('dataTypes', v)} />
              </FormField>
              <FormRow>
                <FormField label="Data Sensitivity">
                  <select className="form-select" value={form.dataSensitivity} onChange={e => set('dataSensitivity', e.target.value)}>
                    <option value="">Select…</option>
                    {SENSITIVITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Remote Work Level">
                  <select className="form-select" value={form.remoteWorkLevel} onChange={e => set('remoteWorkLevel', e.target.value)}>
                    <option value="">Select…</option>
                    {REMOTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </FormRow>
              <FormField label="Third-Party Dependence">
                <select className="form-select" value={form.thirdPartyDependence} onChange={e => set('thirdPartyDependence', e.target.value)}>
                  <option value="">Select…</option>
                  {THIRD_PARTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
              <FormRow>
                <FormField label="Logging Maturity">
                  <select className="form-select" value={form.loggingMaturity} onChange={e => set('loggingMaturity', e.target.value)}>
                    <option value="">Select…</option>
                    {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Detection Maturity">
                  <select className="form-select" value={form.detectionMaturity} onChange={e => set('detectionMaturity', e.target.value)}>
                    <option value="">Select…</option>
                    {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </FormRow>
              <FormRow>
                <FormField label="Vulnerability Mgmt Maturity">
                  <select className="form-select" value={form.vulnerabilityManagementMaturity} onChange={e => set('vulnerabilityManagementMaturity', e.target.value)}>
                    <option value="">Select…</option>
                    {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="IR Maturity">
                  <select className="form-select" value={form.incidentResponseMaturity} onChange={e => set('incidentResponseMaturity', e.target.value)}>
                    <option value="">Select…</option>
                    {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </FormRow>
              <FormField label="Recent Incidents / Breaches">
                <textarea className="form-input" value={form.recentIncidents} onChange={e => set('recentIncidents', e.target.value)} placeholder="Describe any recent security incidents…" rows={2} style={{ resize: 'vertical' }} />
              </FormField>
              <FormField label="Known Weak Spots">
                <textarea className="form-input" value={form.knownWeakSpots} onChange={e => set('knownWeakSpots', e.target.value)} placeholder="Legacy systems, gaps in coverage…" rows={2} style={{ resize: 'vertical' }} />
              </FormField>
            </FormSection>
          )}

          {/* ── THREATS TAB ── */}
          {tab === 'threats' && (
            <FormSection title="Threat Context">
              <FormField label="Primary Threat Concerns">
                <CheckboxGrid options={THREAT_OPTIONS} selected={form.topThreats || []} onToggle={v => toggleArray('topThreats', v)} />
              </FormField>
              <FormField label="Critical Assets">
                <textarea className="form-input" value={form.criticalAssets} onChange={e => set('criticalAssets', e.target.value)} placeholder="List crown jewels: databases, systems, executive accounts…" rows={2} style={{ resize: 'vertical' }} />
              </FormField>
              <FormField label="Security Gaps">
                <textarea className="form-input" value={form.securityGaps} onChange={e => set('securityGaps', e.target.value)} placeholder="Known gaps in your security program…" rows={2} style={{ resize: 'vertical' }} />
              </FormField>
            </FormSection>
          )}

          {/* ── BRANDING TAB ── */}
          {tab === 'branding' && (
            <FormSection title="Company Branding for PDF Reports">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>
                These settings customize how PDF reports are themed when generated for this company.
              </p>

              {/* Color preview strip */}
              <div style={{
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(90deg, ${form.brandColor || '#dc2626'}, ${form.accentColor || '#ef4444'})`,
                marginBottom: '1.5rem',
              }} />

              <FormRow>
                <FormField label="Primary Brand Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      value={form.brandColor || '#dc2626'}
                      onChange={e => set('brandColor', e.target.value)}
                      style={{
                        width: 44, height: 44, border: 'none', borderRadius: 8,
                        cursor: 'pointer', background: 'none', padding: 0,
                      }}
                    />
                    <input
                      className="form-input"
                      value={form.brandColor || '#dc2626'}
                      onChange={e => set('brandColor', e.target.value)}
                      placeholder="#dc2626"
                      style={{ flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                </FormField>
                <FormField label="Accent / Secondary Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      value={form.accentColor || '#ef4444'}
                      onChange={e => set('accentColor', e.target.value)}
                      style={{
                        width: 44, height: 44, border: 'none', borderRadius: 8,
                        cursor: 'pointer', background: 'none', padding: 0,
                      }}
                    />
                    <input
                      className="form-input"
                      value={form.accentColor || '#ef4444'}
                      onChange={e => set('accentColor', e.target.value)}
                      placeholder="#ef4444"
                      style={{ flex: 1, fontFamily: 'monospace' }}
                    />
                  </div>
                </FormField>
              </FormRow>

              <FormField label="Company Logo URL">
                <input
                  className="form-input"
                  value={form.logoUrl || ''}
                  onChange={e => set('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png (leave blank to use company initial)"
                />
                {form.logoUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={form.logoUrl}
                      alt="logo preview"
                      style={{ height: 48, objectFit: 'contain', background: '#fff', padding: 4, borderRadius: 6 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </FormField>

              <FormRow>
                <FormField label="Default Report Classification">
                  <select className="form-select" value={form.defaultClassification || 'CONFIDENTIAL'} onChange={e => set('defaultClassification', e.target.value)}>
                    {CLASSIFICATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="Default Analyst Name">
                  <input
                    className="form-input"
                    value={form.analystName || ''}
                    onChange={e => set('analystName', e.target.value)}
                    placeholder="Your name or team name"
                  />
                </FormField>
              </FormRow>

              {/* Preview card */}
              <div style={{
                marginTop: '1rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  background: '#111',
                  padding: '1rem 1.25rem',
                  borderBottom: `3px solid ${form.brandColor || '#dc2626'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: `${form.brandColor || '#dc2626'}20`,
                    border: `1.5px solid ${form.brandColor || '#dc2626'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: form.brandColor || '#dc2626', fontSize: '1rem',
                  }}>
                    {form.companyName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f5f5f5', fontSize: '0.9rem' }}>{form.companyName || 'Company Name'}</div>
                    <div style={{ fontSize: '0.72rem', color: form.brandColor || '#dc2626', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Threat Hunt Report
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#666' }}>
                    {form.defaultClassification || 'CONFIDENTIAL'}
                  </div>
                </div>
                <div style={{ padding: '0.75rem 1.25rem', background: '#0d0d0d' }}>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>PDF report preview</div>
                </div>
              </div>
            </FormSection>
          )}
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
            onClick={handleSave}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Check size={15} />
            {company ? 'Save Changes' : 'Save Company'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function FormSection({ title, children }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 1.25rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

function FormRow({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      {children}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * SelectWithOther — dropdown that reveals a text input when "other" is chosen.
 * The parent always receives the plain string value (either a known option key
 * or whatever the user typed in the custom field).
 */
function SelectWithOther({ value, onChange, options, placeholder }) {
  const knownValues = options.map(o => o.value);
  // "other" mode when value is explicitly 'other' OR when it's a custom string not in the list
  const isCustom = value && value !== '' && !knownValues.includes(value);
  const isOther  = value === 'other' || isCustom;
  const selectVal = isOther ? 'other' : (value || '');

  function handleSelectChange(e) {
    if (e.target.value === 'other') {
      onChange('other');  // signal parent we're in custom mode
    } else {
      onChange(e.target.value);
    }
  }

  function handleTextChange(e) {
    // Empty text → keep in 'other' state so the input stays visible
    onChange(e.target.value.trim() ? e.target.value : 'other');
  }

  return (
    <div>
      <select className="form-select" value={selectVal} onChange={handleSelectChange}>
        <option value="">{placeholder || 'Select…'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {isOther && (
        <input
          className="form-input"
          style={{ marginTop: 6 }}
          placeholder="Type your tool name…"
          // If the stored value is literally 'other', show empty; otherwise show the custom text
          value={isCustom ? value : ''}
          onChange={handleTextChange}
          autoFocus
        />
      )}
    </div>
  );
}

function CheckboxGrid({ options, selected, onToggle }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 6,
    }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 8,
              border: isSelected ? '1px solid rgba(220,38,38,0.5)' : '1px solid var(--border-subtle)',
              background: isSelected ? 'rgba(220,38,38,0.08)' : 'var(--bg-surface)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: isSelected ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-subtle)',
              background: isSelected ? 'var(--accent-primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isSelected && <Check size={10} color="#fff" />}
            </div>
            <input type="checkbox" checked={isSelected} onChange={() => onToggle(opt.value)} style={{ display: 'none' }} />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
