import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkCheck, Search, Trash2, Sparkles, SlidersHorizontal, X,
  FileJson, Download,
} from 'lucide-react';
import { useApp, ACTIONS } from '../context/AppContext';
import HuntCard from '../components/hunt/HuntCard';
import HuntDetail from '../components/hunt/HuntDetail';
import Modal from '../components/common/Modal';
import { HUNT_CATEGORIES } from '../data/huntTemplates';
import { exportHuntsAsJSON } from '../services/exportService';
import './SavedHunts.css';

export default function SavedHunts() {
  const { state, dispatch, addToast } = useApp();
  const navigate = useNavigate();
  const { savedHunts } = state;

  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [activeHunt, setActiveHunt] = useState(null);

  const filtered = useMemo(() => {
    let list = [...savedHunts];
    if (search)    list = list.filter(h => h.title?.toLowerCase().includes(search.toLowerCase()) || (h.tags||[]).some(t => t.includes(search.toLowerCase())));
    if (catFilter) list = list.filter(h => h.category === catFilter);
    if (sevFilter) list = list.filter(h => h.severity === sevFilter);
    return list.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
  }, [savedHunts, search, catFilter, sevFilter]);

  function clearAll() {
    if (!window.confirm('Remove all saved hunts? This cannot be undone.')) return;
    savedHunts.forEach(h => dispatch({ type: ACTIONS.UNSAVE_HUNT, huntId: h.id }));
    addToast('All saved hunts removed', 'info');
  }

  function handleExport() {
    exportHuntsAsJSON(filtered, 'saved-hunts');
    addToast('Saved hunts exported as JSON', 'success');
  }

  if (savedHunts.length === 0) {
    return (
      <div className="page-container">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-state-icon"><BookmarkCheck size={28}/></div>
          <div className="empty-state-title">No Saved Hunts</div>
          <div className="empty-state-description">
            Bookmark hunts from the results page to build your personal hunt library.
          </div>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/results')}>
            <Sparkles size={15}/> View Hunt Results
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <div>
          <h1 className="page-title">Saved Hunt Library</h1>
          <p className="page-subtitle">{filtered.length} of {savedHunts.length} saved hunts</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}><FileJson size={13}/> Export</button>
          {savedHunts.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={13}/> Clear All</button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="saved-hunts-toolbar">
        <div className="hunt-results-search" style={{ flex: 1, position: 'relative' }}>
          <Search size={15} style={{ position:'absolute', left:'var(--space-3)', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
          <input
            className="form-input"
            style={{ paddingLeft: 'var(--space-8)' }}
            placeholder="Search saved hunts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" style={{ width:'auto' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {HUNT_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select className="form-select" style={{ width:'auto' }} value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
          <option value="">All severities</option>
          {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        {(search || catFilter || sevFilter) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCatFilter(''); setSevFilter(''); }}>
            <X size={13}/> Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight:'40vh' }}>
          <div className="empty-state-icon"><SlidersHorizontal size={24}/></div>
          <div className="empty-state-title">No Results</div>
          <div className="empty-state-description">Try adjusting your search or filters.</div>
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
