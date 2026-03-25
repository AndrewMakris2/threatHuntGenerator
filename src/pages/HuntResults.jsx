import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crosshair, Search, SlidersHorizontal, X, Download,
  FileText, FileJson, Printer, Sparkles, Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import HuntCard from '../components/hunt/HuntCard';
import HuntDetail from '../components/hunt/HuntDetail';
import Modal from '../components/common/Modal';
import { HUNT_CATEGORIES } from '../data/huntTemplates';
import { MITRE_TACTICS } from '../data/mitreTechniques';
import { exportHuntsAsJSON, exportHuntsAsPDF, exportHuntsAsCSV } from '../services/exportService';
import './HuntResults.css';

const SEVERITY_OPTS   = ['critical','high','medium','low'];
const DIFFICULTY_OPTS = ['beginner','intermediate','advanced','expert'];

export default function HuntResults() {
  const { state, addToast } = useApp();
  const navigate = useNavigate();
  const { generatedHunts: hunts, companyProfile: profile } = state;

  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('');
  const [sevFilter,   setSevFilter]   = useState('');
  const [diffFilter,  setDiffFilter]  = useState('');
  const [mitreFilter, setMitreFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeHunt,  setActiveHunt]  = useState(null);
  const [sortBy,      setSortBy]      = useState('relevance');

  const filtered = useMemo(() => {
    let list = [...hunts];
    if (search)      list = list.filter(h => h.title?.toLowerCase().includes(search.toLowerCase()) || h.whyRelevant?.toLowerCase().includes(search.toLowerCase()) || (h.tags || []).some(t => t.includes(search.toLowerCase())));
    if (catFilter)   list = list.filter(h => h.category === catFilter);
    if (sevFilter)   list = list.filter(h => h.severity === sevFilter);
    if (diffFilter)  list = list.filter(h => h.difficulty === diffFilter);
    if (mitreFilter) list = list.filter(h => (h.mitreTechniques || []).some(t => { try { return require('../data/mitreTechniques').getTechniqueById(t)?.tactic === mitreFilter; } catch { return false; } }));

    list.sort((a, b) => {
      if (sortBy === 'relevance') return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      if (sortBy === 'severity')  { const o = { critical:4, high:3, medium:2, low:1 }; return (o[b.severity]||0)-(o[a.severity]||0); }
      if (sortBy === 'confidence')return (b.confidence||0) - (a.confidence||0);
      if (sortBy === 'title')     return (a.title||'').localeCompare(b.title||'');
      return 0;
    });
    return list;
  }, [hunts, search, catFilter, sevFilter, diffFilter, mitreFilter, sortBy]);

  const activeFilters = [catFilter, sevFilter, diffFilter, mitreFilter].filter(Boolean).length;

  function clearFilters() { setCatFilter(''); setSevFilter(''); setDiffFilter(''); setMitreFilter(''); setSearch(''); }

  function handleExportJSON() { exportHuntsAsJSON(filtered, `${profile?.companyName || 'hunts'}`); addToast('Exported as JSON', 'success'); }
  function handleExportCSV()  { exportHuntsAsCSV(filtered,  `${profile?.companyName || 'hunts'}`); addToast('Exported as CSV', 'success'); }
  function handleExportPDF()  { exportHuntsAsPDF(filtered, profile); addToast('Opening print preview...', 'info'); }

  if (hunts.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-state-icon"><Crosshair size={28} /></div>
          <div className="empty-state-title">No Hunts Generated Yet</div>
          <div className="empty-state-description">
            Build your company profile and run the generator to see tailored threat hunts here.
          </div>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/generate')}>
            <Sparkles size={15} /> Generate Hunts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Hunt Results</h1>
          <p className="page-subtitle">{filtered.length} of {hunts.length} hunts · {profile?.companyName || 'Your organization'}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}><FileJson size={13}/> JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}><FileText size={13}/> CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}><Printer size={13}/> PDF</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/generate')}>
            <Sparkles size={13}/> Regenerate
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="hunt-results-toolbar">
        <div className="hunt-results-search">
          <Search size={15} className="hunt-results-search-icon" />
          <input
            className="form-input"
            placeholder="Search hunts by title, relevance, or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="hunt-results-clear" onClick={() => setSearch('')}><X size={13}/></button>}
        </div>

        <div className="flex gap-2 items-center">
          <select className="form-select" style={{ width: 'auto' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="relevance">Sort: Relevance</option>
            <option value="severity">Sort: Severity</option>
            <option value="confidence">Sort: Confidence</option>
            <option value="title">Sort: Title</option>
          </select>

          <button
            className={`btn btn-secondary ${showFilters ? 'btn-primary' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14}/> Filters {activeFilters > 0 && <span className="badge badge-info">{activeFilters}</span>}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card hunt-results-filters animate-fade-in">
          <div className="grid-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="">All categories</option>
                {HUNT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Severity</label>
              <select className="form-select" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
                <option value="">All severities</option>
                {SEVERITY_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={diffFilter} onChange={e => setDiffFilter(e.target.value)}>
                <option value="">All difficulties</option>
                {DIFFICULTY_OPTS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">MITRE Tactic</label>
              <select className="form-select" value={mitreFilter} onChange={e => setMitreFilter(e.target.value)}>
                <option value="">All tactics</option>
                {MITRE_TACTICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {activeFilters > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ marginTop: 'var(--space-2)' }}>
              <X size={13}/> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '40vh' }}>
          <div className="empty-state-icon"><SlidersHorizontal size={24}/></div>
          <div className="empty-state-title">No Hunts Match Filters</div>
          <div className="empty-state-description">Try adjusting your search or filters.</div>
          <button className="btn btn-secondary mt-4" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="hunt-results-grid">
          {filtered.map(hunt => (
            <HuntCard key={hunt.id} hunt={hunt} onOpen={setActiveHunt} />
          ))}
        </div>
      )}

      <Modal open={!!activeHunt} onClose={() => setActiveHunt(null)} size="xl" noPadding>
        {activeHunt && <HuntDetail hunt={activeHunt} onClose={() => setActiveHunt(null)} />}
      </Modal>
    </div>
  );
}
