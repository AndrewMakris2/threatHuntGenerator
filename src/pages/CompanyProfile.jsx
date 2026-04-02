import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, ChevronRight, ChevronLeft, Sparkles, Info, Upload, X } from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import ProfileStepper, { STEPS } from '../components/profile/ProfileStepper';
import {
  INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS, SIEM_OPTIONS, EDR_OPTIONS,
  IAM_OPTIONS, EMAIL_PLATFORM_OPTIONS, CLOUD_PROVIDER_OPTIONS, OS_OPTIONS,
  COMPLIANCE_OPTIONS, DATA_TYPE_OPTIONS, THREAT_OPTIONS, MATURITY_LEVELS,
  REGION_OPTIONS, INTERNET_FACING_OPTIONS, SAMPLE_COMPANY_PROFILE,
} from '../data/sampleData';
import './CompanyProfile.css';

export default function CompanyProfile() {
  const { state, dispatch, addToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(state.profileStep || 0);
  const logoFileRef = useRef(null);

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setField('logoUrl', ev.target.result);
    reader.readAsDataURL(file);
  }
  const profile = state.companyProfile;

  function setField(field, value) {
    dispatch({ type: ACTIONS.UPDATE_PROFILE_FIELD, field, value });
  }

  function toggleArrayField(field, value) {
    const current = profile[field] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setField(field, updated);
  }

  function loadSample() {
    dispatch({ type: ACTIONS.LOAD_SAMPLE_PROFILE, profile: SAMPLE_COMPANY_PROFILE });
    addToast('Sample profile loaded — Acme Financial Services', 'success');
    setStep(0);
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      dispatch({ type: ACTIONS.SET_PROFILE_STEP, step: step + 1 });
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleFinish() {
    dispatch({ type: ACTIONS.SET_PROFILE_COMPLETE, value: true });

    // Auto-save / update in the Companies library
    const existing = state.savedCompanies.find(
      c => c.companyName?.toLowerCase() === profile.companyName?.toLowerCase()
    );
    if (existing) {
      dispatch({ type: ACTIONS.UPDATE_COMPANY, company: { ...existing, ...profile } });
    } else {
      dispatch({ type: ACTIONS.SAVE_COMPANY, company: { ...profile } });
    }

    addToast(`${profile.companyName || 'Company'} saved to your Companies library`, 'success');
    navigate('/generate');
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Company Profile</h1>
          <p className="page-subtitle">Define your environment to generate tailored threat hunts</p>
        </div>
        <button className="btn btn-secondary" onClick={loadSample}>
          <Sparkles size={14} /> Load Sample Profile
        </button>
      </div>

      <ProfileStepper currentStep={step} />

      <div className="profile-form-container">
        {/* Step 0 — Company Identity */}
        {step === 0 && (
          <StepSection title="Company Identity" subtitle="Basic information about your organization">
            <div className="grid-2">
              <FormGroup label="Company Name" required>
                <input
                  className="form-input"
                  placeholder="e.g. Acme Financial Services"
                  value={profile.companyName || ''}
                  onChange={e => setField('companyName', e.target.value)}
                />
              </FormGroup>
              <FormGroup label="Website / Domain">
                <input
                  className="form-input"
                  placeholder="e.g. acmefinancial.com"
                  value={profile.websiteUrl || ''}
                  onChange={e => setField('websiteUrl', e.target.value)}
                />
              </FormGroup>
            </div>

            <FormGroup label="Company Logo (optional — used in PDF exports)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {profile.logoUrl && (
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={profile.logoUrl}
                      alt="Company logo"
                      style={{ height: 48, maxWidth: 160, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border-subtle)', background: '#fff', padding: 4 }}
                      onError={e => e.target.style.display = 'none'}
                    />
                    <button
                      type="button"
                      onClick={() => setField('logoUrl', '')}
                      style={{ position: 'absolute', top: -6, right: -6, background: 'var(--severity-critical)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => logoFileRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Upload size={13} /> {profile.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                </button>
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                <span className="form-hint" style={{ margin: 0 }}>PNG, JPG, SVG, or WebP</span>
              </div>
            </FormGroup>

            <div className="grid-2">
              <FormGroup label="Industry" required>
                <select
                  className="form-select"
                  value={profile.industry || ''}
                  onChange={e => setField('industry', e.target.value)}
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Company Size" required>
                <select
                  className="form-select"
                  value={profile.companySize || ''}
                  onChange={e => setField('companySize', e.target.value)}
                >
                  <option value="">Select size...</option>
                  {COMPANY_SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
            </div>

            <FormGroup label="Business Description">
              <input
                className="form-input"
                placeholder="Brief description of business model and operations"
                value={profile.businessType || ''}
                onChange={e => setField('businessType', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Regions / Countries of Operation">
              <CheckboxChips
                options={REGION_OPTIONS}
                selected={profile.regions || []}
                onChange={v => toggleArrayField('regions', v)}
              />
            </FormGroup>
          </StepSection>
        )}

        {/* Step 1 — Security Stack */}
        {step === 1 && (
          <StepSection title="Security Stack" subtitle="Security tools deployed in your environment">
            <div className="grid-2">
              <FormGroup label="SIEM Platform" hint="Where do you aggregate logs?">
                <select className="form-select" value={profile.siemPlatform || ''} onChange={e => setField('siemPlatform', e.target.value)}>
                  <option value="">Select SIEM...</option>
                  {SIEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="EDR / Endpoint Security">
                <select className="form-select" value={profile.edrPlatform || ''} onChange={e => setField('edrPlatform', e.target.value)}>
                  <option value="">Select EDR...</option>
                  {EDR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="IAM / SSO / MFA Platform">
                <select className="form-select" value={profile.iamPlatform || ''} onChange={e => setField('iamPlatform', e.target.value)}>
                  <option value="">Select IAM...</option>
                  {IAM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Email Platform">
                <select className="form-select" value={profile.emailPlatform || ''} onChange={e => setField('emailPlatform', e.target.value)}>
                  <option value="">Select email platform...</option>
                  {EMAIL_PLATFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Email Security (SEG)">
                <input className="form-input" placeholder="e.g. Proofpoint, Mimecast, Defender" value={profile.emailSecurityPlatform || ''} onChange={e => setField('emailSecurityPlatform', e.target.value)} />
              </FormGroup>
              <FormGroup label="CASB Solution">
                <input className="form-input" placeholder="e.g. Microsoft MCAS, Netskope, Zscaler" value={profile.casb || ''} onChange={e => setField('casb', e.target.value)} />
              </FormGroup>
              <FormGroup label="PAM Solution">
                <input className="form-input" placeholder="e.g. CyberArk, BeyondTrust, Delinea" value={profile.pamSolution || ''} onChange={e => setField('pamSolution', e.target.value)} />
              </FormGroup>
              <FormGroup label="Backup Solution">
                <input className="form-input" placeholder="e.g. Veeam, Commvault, Rubrik" value={profile.backupSolution || ''} onChange={e => setField('backupSolution', e.target.value)} />
              </FormGroup>
            </div>

            <FormGroup label="Network / NDR Tooling">
              <input className="form-input" placeholder="e.g. Darktrace, Vectra, ExtraHop, Zeek" value={profile.networkMonitoring || ''} onChange={e => setField('networkMonitoring', e.target.value)} />
            </FormGroup>
          </StepSection>
        )}

        {/* Step 2 — Cloud & Infrastructure */}
        {step === 2 && (
          <StepSection title="Cloud & Infrastructure" subtitle="Your infrastructure footprint and operating systems">
            <FormGroup label="Cloud Providers" hint="Select all that apply">
              <CheckboxChips
                options={CLOUD_PROVIDER_OPTIONS}
                selected={profile.cloudProviders || []}
                onChange={v => toggleArrayField('cloudProviders', v)}
              />
            </FormGroup>

            <FormGroup label="Infrastructure Type" hint="Where does most of your workload run?">
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'cloud', label: 'Cloud-Only' },
                  { value: 'hybrid', label: 'Hybrid (Cloud + On-Prem)' },
                  { value: 'on-prem', label: 'On-Premises Only' },
                ].map(o => (
                  <label key={o.value} className={`checkbox-chip ${profile.onPremVsCloud === o.value ? 'selected' : ''}`}>
                    <input type="radio" name="onPremVsCloud" value={o.value} checked={profile.onPremVsCloud === o.value} onChange={() => setField('onPremVsCloud', o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
            </FormGroup>

            <FormGroup label="Operating Systems in Use">
              <CheckboxChips
                options={OS_OPTIONS}
                selected={profile.operatingSystems || []}
                onChange={v => toggleArrayField('operatingSystems', v)}
              />
            </FormGroup>

            <FormGroup label="Internet-Facing Systems" hint="Systems directly accessible from the internet">
              <CheckboxChips
                options={INTERNET_FACING_OPTIONS}
                selected={profile.internetFacingSystems || []}
                onChange={v => toggleArrayField('internetFacingSystems', v)}
              />
            </FormGroup>

            <FormGroup label="Network Segmentation">
              <select className="form-select" value={profile.networkSegmentation || ''} onChange={e => setField('networkSegmentation', e.target.value)}>
                <option value="">Select...</option>
                <option value="none">None — flat network</option>
                <option value="partial">Partial — some segmentation</option>
                <option value="full">Full — strict segmentation / zero trust</option>
              </select>
            </FormGroup>

            <FormGroup label="Critical Applications" hint="Key business applications to protect">
              <textarea className="form-textarea" placeholder="e.g. Core banking system, SAP ERP, Salesforce CRM, custom payment portal..." value={profile.criticalApps || ''} onChange={e => setField('criticalApps', e.target.value)} rows={3} />
            </FormGroup>
          </StepSection>
        )}

        {/* Step 3 — Risk & Compliance */}
        {step === 3 && (
          <StepSection title="Risk & Compliance" subtitle="Your data, compliance obligations, and risk context">
            <FormGroup label="Compliance Requirements">
              <CheckboxChips
                options={COMPLIANCE_OPTIONS}
                selected={profile.complianceRequirements || []}
                onChange={v => toggleArrayField('complianceRequirements', v)}
              />
            </FormGroup>

            <FormGroup label="Types of Data Handled">
              <CheckboxChips
                options={DATA_TYPE_OPTIONS}
                selected={profile.dataTypes || []}
                onChange={v => toggleArrayField('dataTypes', v)}
              />
            </FormGroup>

            <div className="grid-2">
              <FormGroup label="Data Sensitivity Level">
                <select className="form-select" value={profile.dataSensitivity || ''} onChange={e => setField('dataSensitivity', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="low">Low — public / non-sensitive data</option>
                  <option value="medium">Medium — internal business data</option>
                  <option value="high">High — sensitive customer / employee data</option>
                  <option value="critical">Critical — PCI, PHI, classified, state secrets</option>
                </select>
              </FormGroup>
              <FormGroup label="Remote Work Level">
                <select className="form-select" value={profile.remoteWorkLevel || ''} onChange={e => setField('remoteWorkLevel', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="none">None — fully on-site</option>
                  <option value="partial">Partial — hybrid workforce</option>
                  <option value="full">Full — remote-first</option>
                </select>
              </FormGroup>
              <FormGroup label="Third-Party / Vendor Dependence">
                <select className="form-select" value={profile.thirdPartyDependence || ''} onChange={e => setField('thirdPartyDependence', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="none">None / Minimal</option>
                  <option value="low">Low — few vendors, limited access</option>
                  <option value="medium">Medium — several vendors with access</option>
                  <option value="high">High — many MSPs / vendors with broad access</option>
                </select>
              </FormGroup>
            </div>

            <FormGroup label="Critical Assets to Protect" hint="What assets would cause most damage if compromised?">
              <textarea className="form-textarea" placeholder="e.g. Core banking databases, executive email, customer PII vault, payment processing systems..." value={profile.criticalAssets || ''} onChange={e => setField('criticalAssets', e.target.value)} rows={3} />
            </FormGroup>

            <FormGroup label="Known Security Gaps" hint="Areas you know need improvement">
              <textarea className="form-textarea" placeholder="e.g. Limited UEBA, no PAM for service accounts, gaps in cloud security posture management..." value={profile.securityGaps || ''} onChange={e => setField('securityGaps', e.target.value)} rows={3} />
            </FormGroup>

            <FormGroup label="Recent Security Incidents">
              <textarea className="form-textarea" placeholder="e.g. Phishing campaign in Q4 targeting finance team. One account compromised..." value={profile.recentIncidents || ''} onChange={e => setField('recentIncidents', e.target.value)} rows={3} />
            </FormGroup>
          </StepSection>
        )}

        {/* Step 4 — Threat Context */}
        {step === 4 && (
          <StepSection title="Threat Context" subtitle="Threat actor concerns and security maturity">
            <FormGroup label="Top Threats You Are Concerned About">
              <CheckboxChips
                options={THREAT_OPTIONS}
                selected={profile.topThreats || []}
                onChange={v => toggleArrayField('topThreats', v)}
              />
            </FormGroup>

            <FormGroup label="Detection Maturity" hint="How mature is your detection / SOC capability?">
              <select className="form-select" value={profile.detectionMaturity || ''} onChange={e => setField('detectionMaturity', e.target.value)}>
                <option value="">Select...</option>
                {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Logging Maturity" hint="How comprehensive is your log collection?">
              <select className="form-select" value={profile.loggingMaturity || ''} onChange={e => setField('loggingMaturity', e.target.value)}>
                <option value="">Select...</option>
                {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormGroup>

            <div className="grid-2">
              <FormGroup label="Incident Response Maturity">
                <select className="form-select" value={profile.incidentResponseMaturity || ''} onChange={e => setField('incidentResponseMaturity', e.target.value)}>
                  <option value="">Select...</option>
                  {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Vulnerability Management Maturity">
                <select className="form-select" value={profile.vulnerabilityManagementMaturity || ''} onChange={e => setField('vulnerabilityManagementMaturity', e.target.value)}>
                  <option value="">Select...</option>
                  {MATURITY_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormGroup>
            </div>
          </StepSection>
        )}

        {/* Step 5 — Review */}
        {step === 5 && (
          <StepSection title="Profile Review" subtitle="Confirm your company profile before generating hunts">
            <div className="profile-review-grid">
              <ReviewSection title="Company">
                <ReviewItem label="Name" value={profile.companyName} />
                <ReviewItem label="Industry" value={profile.industry} />
                <ReviewItem label="Size" value={profile.companySize} />
                <ReviewItem label="Regions" value={(profile.regions || []).join(', ')} />
              </ReviewSection>

              <ReviewSection title="Security Stack">
                <ReviewItem label="SIEM" value={profile.siemPlatform} />
                <ReviewItem label="EDR" value={profile.edrPlatform} />
                <ReviewItem label="IAM" value={profile.iamPlatform} />
                <ReviewItem label="Email" value={profile.emailPlatform} />
              </ReviewSection>

              <ReviewSection title="Infrastructure">
                <ReviewItem label="Cloud" value={(profile.cloudProviders || []).join(', ')} />
                <ReviewItem label="Type" value={profile.onPremVsCloud} />
                <ReviewItem label="OS" value={(profile.operatingSystems || []).join(', ')} />
              </ReviewSection>

              <ReviewSection title="Risk Profile">
                <ReviewItem label="Compliance" value={(profile.complianceRequirements || []).join(', ')} />
                <ReviewItem label="Data Types" value={(profile.dataTypes || []).join(', ')} />
                <ReviewItem label="Sensitivity" value={profile.dataSensitivity} />
                <ReviewItem label="Detection Maturity" value={profile.detectionMaturity} />
              </ReviewSection>
            </div>

            <div className="callout callout-info" style={{ marginTop: 'var(--space-4)' }}>
              <Info size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  Your profile will be used to generate threat hunts tailored to your environment.
                  Profiles are stored locally in your browser — no data is sent externally.
                </p>
              </div>
            </div>
          </StepSection>
        )}

        {/* Navigation */}
        <div className="profile-nav">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft size={15} /> Back
          </button>

          <div className="flex gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => dispatch({ type: ACTIONS.RESET_PROFILE })}
            >
              <RotateCcw size={14} /> Reset
            </button>

            {isLastStep ? (
              <button className="btn btn-primary btn-lg" onClick={handleFinish}>
                <Save size={15} /> Save & Generate Hunts
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleNext}>
                Next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function StepSection({ title, subtitle, children }) {
  return (
    <div className="profile-step-section">
      <div className="profile-step-header">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="page-subtitle" style={{ marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div className="profile-step-body">{children}</div>
    </div>
  );
}

function FormGroup({ label, hint, required, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );
}

function CheckboxChips({ options, selected, onChange }) {
  return (
    <div className="checkbox-group">
      {options.map(opt => (
        <label key={opt.value} className={`checkbox-chip ${selected.includes(opt.value) ? 'selected' : ''}`}>
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => onChange(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="review-section">
      <div className="review-section-title">{title}</div>
      <div className="review-section-items">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div className="review-item">
      <span className="review-label">{label}</span>
      <span className="review-value">{value || <span style={{ color: 'var(--text-muted)' }}>Not set</span>}</span>
    </div>
  );
}
