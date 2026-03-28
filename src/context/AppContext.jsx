/**
 * AppContext — Global application state
 * Manages company profile, generated hunts, saved hunts, companies, and UI state
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { auth, isFirebaseEnabled as isSupabaseEnabled } from '../lib/firebase';
import { dbLoadCompanies, dbSaveCompany, dbDeleteCompany, dbLoadSavedHunts, dbSaveHunt, dbUnsaveHunt, dbSaveSession, dbLoadSessions, dbDeleteSession } from '../lib/db';
import { EMPTY_COMPANY_PROFILE } from '../data/sampleData';

// ── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  // Company profile (multi-step form state)
  companyProfile: { ...EMPTY_COMPANY_PROFILE },
  profileComplete: false,
  profileStep: 0,

  // Generated hunt results
  generatedHunts: [],
  isGenerating: false,
  lastGeneratedAt: null,

  // Saved hunts library
  savedHunts: [],

  // Hunt sessions (history of each generation run)
  huntSessions: [],

  // Active hunt (for detail view)
  activeHunt: null,

  // Saved company profiles
  savedCompanies: [],
  activeCompanyId: null,

  // AI provider settings (apiKey intentionally excluded from localStorage)
  aiSettings: { provider: 'anthropic', model: '', endpoint: '' },

  // UI
  sidebarCollapsed: false,
  toasts: [],

  // Filters (for hunt results page)
  filters: {
    search: '',
    category: '',
    severity: '',
    mitreTactic: '',
    difficulty: '',
    platform: '',
  },
};

// ── Action Types ──────────────────────────────────────────────────────────────
export const ACTIONS = {
  // Profile
  UPDATE_PROFILE_FIELD:  'UPDATE_PROFILE_FIELD',
  SET_PROFILE_STEP:      'SET_PROFILE_STEP',
  RESET_PROFILE:         'RESET_PROFILE',
  LOAD_SAMPLE_PROFILE:   'LOAD_SAMPLE_PROFILE',
  SET_PROFILE_COMPLETE:  'SET_PROFILE_COMPLETE',

  // Hunt generation
  SET_GENERATING:        'SET_GENERATING',
  SET_GENERATED_HUNTS:   'SET_GENERATED_HUNTS',
  CLEAR_HUNTS:           'CLEAR_HUNTS',

  // Active hunt
  SET_ACTIVE_HUNT:       'SET_ACTIVE_HUNT',
  CLOSE_ACTIVE_HUNT:     'CLOSE_ACTIVE_HUNT',

  // Saved hunts
  SAVE_HUNT:             'SAVE_HUNT',
  UNSAVE_HUNT:           'UNSAVE_HUNT',
  UPDATE_HUNT_NOTES:     'UPDATE_HUNT_NOTES',

  // Company profiles
  SAVE_COMPANY:          'SAVE_COMPANY',
  UPDATE_COMPANY:        'UPDATE_COMPANY',
  DELETE_COMPANY:        'DELETE_COMPANY',
  SET_ACTIVE_COMPANY:    'SET_ACTIVE_COMPANY',
  SET_AI_SETTINGS:       'SET_AI_SETTINGS',

  // UI
  TOGGLE_SIDEBAR:        'TOGGLE_SIDEBAR',
  ADD_TOAST:             'ADD_TOAST',
  REMOVE_TOAST:          'REMOVE_TOAST',
  SET_FILTER:            'SET_FILTER',
  RESET_FILTERS:         'RESET_FILTERS',

  // Hunt sessions
  ADD_HUNT_SESSION:      'ADD_HUNT_SESSION',
  DELETE_HUNT_SESSION:   'DELETE_HUNT_SESSION',
  CLEAR_HUNT_SESSIONS:   'CLEAR_HUNT_SESSIONS',

  // Cloud sync
  LOAD_FROM_DB:          'LOAD_FROM_DB',
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    // ── Profile ──────────────────────────────────────────────────────────
    case ACTIONS.UPDATE_PROFILE_FIELD:
      return {
        ...state,
        companyProfile: {
          ...state.companyProfile,
          [action.field]: action.value,
        },
      };

    case ACTIONS.SET_PROFILE_STEP:
      return { ...state, profileStep: action.step };

    case ACTIONS.RESET_PROFILE:
      return {
        ...state,
        companyProfile: { ...EMPTY_COMPANY_PROFILE },
        profileStep: 0,
        profileComplete: false,
        generatedHunts: [],
      };

    case ACTIONS.LOAD_SAMPLE_PROFILE:
      return {
        ...state,
        companyProfile: { ...action.profile },
        profileComplete: true,
      };

    case ACTIONS.SET_PROFILE_COMPLETE:
      return { ...state, profileComplete: action.value };

    // ── Hunt Generation ───────────────────────────────────────────────────
    case ACTIONS.SET_GENERATING:
      return { ...state, isGenerating: action.value };

    case ACTIONS.SET_GENERATED_HUNTS:
      return {
        ...state,
        generatedHunts: action.hunts,
        isGenerating: false,
        lastGeneratedAt: new Date().toISOString(),
      };

    case ACTIONS.CLEAR_HUNTS:
      return { ...state, generatedHunts: [], lastGeneratedAt: null };

    // ── Active Hunt ───────────────────────────────────────────────────────
    case ACTIONS.SET_ACTIVE_HUNT:
      return { ...state, activeHunt: action.hunt };

    case ACTIONS.CLOSE_ACTIVE_HUNT:
      return { ...state, activeHunt: null };

    // ── Saved Hunts ────────────────────────────────────────────────────────
    case ACTIONS.SAVE_HUNT: {
      const already = state.savedHunts.some(h => h.id === action.hunt.id);
      if (already) return state;
      return {
        ...state,
        savedHunts: [
          ...state.savedHunts,
          { ...action.hunt, savedAt: new Date().toISOString(), notes: '', starred: false },
        ],
      };
    }

    case ACTIONS.UNSAVE_HUNT:
      return {
        ...state,
        savedHunts: state.savedHunts.filter(h => h.id !== action.huntId),
      };

    case ACTIONS.UPDATE_HUNT_NOTES:
      return {
        ...state,
        savedHunts: state.savedHunts.map(h =>
          h.id === action.huntId ? { ...h, notes: action.notes } : h
        ),
      };

    // ── Hunt Sessions ─────────────────────────────────────────────────────
    case ACTIONS.ADD_HUNT_SESSION:
      return {
        ...state,
        huntSessions: [action.session, ...state.huntSessions],
      };

    case ACTIONS.DELETE_HUNT_SESSION:
      return {
        ...state,
        huntSessions: state.huntSessions.filter(s => s.id !== action.sessionId),
      };

    case ACTIONS.CLEAR_HUNT_SESSIONS:
      return { ...state, huntSessions: [] };

    // ── Company Profiles ───────────────────────────────────────────────────
    case ACTIONS.SAVE_COMPANY: {
      const company = {
        ...action.company,
        id: action.company.id || `co-${Date.now()}`,
        createdAt: action.company.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        brandColor: action.company.brandColor || '#dc2626',
        accentColor: action.company.accentColor || '#ef4444',
        logoUrl: action.company.logoUrl || '',
      };
      // Auto-activate if no company is active yet
      const shouldActivate = !state.activeCompanyId;
      return {
        ...state,
        savedCompanies: [...state.savedCompanies, company],
        activeCompanyId: shouldActivate ? company.id : state.activeCompanyId,
        companyProfile: shouldActivate ? { ...company } : state.companyProfile,
        profileComplete: shouldActivate ? true : state.profileComplete,
      };
    }

    case ACTIONS.UPDATE_COMPANY:
      return {
        ...state,
        savedCompanies: state.savedCompanies.map(c =>
          c.id === action.company.id
            ? { ...c, ...action.company, updatedAt: new Date().toISOString() }
            : c
        ),
      };

    case ACTIONS.DELETE_COMPANY:
      return {
        ...state,
        savedCompanies: state.savedCompanies.filter(c => c.id !== action.companyId),
        activeCompanyId: state.activeCompanyId === action.companyId ? null : state.activeCompanyId,
      };

    case ACTIONS.SET_ACTIVE_COMPANY: {
      const company = state.savedCompanies.find(c => c.id === action.companyId);
      if (!company) return { ...state, activeCompanyId: null };
      return {
        ...state,
        activeCompanyId: action.companyId,
        companyProfile: { ...company },
        profileComplete: true,
        savedCompanies: state.savedCompanies.map(c =>
          c.id === action.companyId
            ? { ...c, lastUsedAt: new Date().toISOString() }
            : c
        ),
      };
    }

    case ACTIONS.SET_AI_SETTINGS:
      return { ...state, aiSettings: { ...state.aiSettings, ...action.settings } };

    // ── UI ────────────────────────────────────────────────────────────────
    case ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, { id: Date.now(), ...action.toast }],
      };

    case ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.id),
      };

    case ACTIONS.SET_FILTER:
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };

    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
      };

    case ACTIONS.LOAD_FROM_DB: {
      // Only overwrite local data if Firestore actually returned records.
      // An empty Firestore result means the data hasn't synced yet — don't clobber localStorage.
      const companies   = action.companies?.length   > 0 ? action.companies   : state.savedCompanies;
      const savedHunts  = action.savedHunts?.length  > 0 ? action.savedHunts  : state.savedHunts;
      const huntSessions = action.huntSessions?.length > 0 ? action.huntSessions : state.huntSessions;
      const activeId = companies.find(c => c.id === state.activeCompanyId)
        ? state.activeCompanyId
        : companies[0]?.id ?? state.activeCompanyId;
      return {
        ...state,
        savedCompanies: companies,
        savedHunts,
        huntSessions,
        activeCompanyId: activeId,
      };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

// ── Local Storage persistence ─────────────────────────────────────────────────
const STORAGE_KEY = 'thg_app_state';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    return {
      companyProfile: saved.companyProfile || { ...EMPTY_COMPANY_PROFILE },
      profileComplete: saved.profileComplete || false,
      savedHunts: saved.savedHunts || [],
      generatedHunts: saved.generatedHunts || [],
      lastGeneratedAt: saved.lastGeneratedAt || null,
      savedCompanies: saved.savedCompanies || [],
      activeCompanyId: saved.activeCompanyId || null,
      huntSessions: saved.huntSessions || [],
      aiSettings: saved.aiSettings ? { provider: saved.aiSettings.provider || 'anthropic', model: saved.aiSettings.model || '', endpoint: saved.aiSettings.endpoint || '', apiKey: saved.aiSettings.apiKey || '' } : { provider: 'anthropic', model: '', endpoint: '', apiKey: '' },
    };
  } catch {
    return null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const persisted = loadPersistedState();
  const merged = persisted
    ? { ...initialState, ...persisted }
    : initialState;

  const [state, dispatch] = useReducer(appReducer, merged);

  // Load from cloud when user logs in
  const syncFromCloud = useCallback(async (user) => {
    if (!isSupabaseEnabled) return;
    const uid = user?.uid || user?.id || auth?.currentUser?.uid;
    if (!uid) return;
    try {
      const [companies, savedHunts, huntSessions] = await Promise.all([
        dbLoadCompanies(uid),
        dbLoadSavedHunts(uid),
        dbLoadSessions(uid),
      ]);
      dispatch({ type: ACTIONS.LOAD_FROM_DB, companies, savedHunts, huntSessions });
    } catch (err) {
      console.warn('[THG] Cloud sync failed:', err.message);
    }
  }, []);

  // Sync a single action to cloud — gets current user from Firebase auth directly
  const syncDispatch = useCallback(async (incomingAction) => {
    // Pre-generate the company ID BEFORE dispatch so localStorage and Firestore use the same ID
    let action = incomingAction;
    if (action.type === ACTIONS.SAVE_COMPANY && !action.company?.id) {
      action = { ...action, company: { ...action.company, id: `co-${Date.now()}` } };
    }

    dispatch(action);
    if (!isSupabaseEnabled) return;
    const uid = auth?.currentUser?.uid;
    if (!uid) return;
    try {
      switch (action.type) {
        case ACTIONS.SAVE_COMPANY: {
          await dbSaveCompany(uid, action.company);
          break;
        }
        case ACTIONS.UPDATE_COMPANY:
          await dbSaveCompany(uid, action.company);
          break;
        case ACTIONS.DELETE_COMPANY:
          await dbDeleteCompany(action.companyId, uid);
          break;
        case ACTIONS.SAVE_HUNT:
          await dbSaveHunt(uid, action.hunt);
          break;
        case ACTIONS.UNSAVE_HUNT:
          await dbUnsaveHunt(action.huntId, uid);
          break;
        case ACTIONS.ADD_HUNT_SESSION:
          await dbSaveSession(uid, action.session);
          break;
        case ACTIONS.DELETE_HUNT_SESSION:
          await dbDeleteSession(action.sessionId, uid);
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('[THG] Sync failed for action', action.type, err.message);
    }
  }, []);

  // Persist key slices to localStorage on change
  useEffect(() => {
    try {
      const toSave = {
        companyProfile: state.companyProfile,
        profileComplete: state.profileComplete,
        savedHunts: state.savedHunts,
        generatedHunts: state.generatedHunts,
        lastGeneratedAt: state.lastGeneratedAt,
        savedCompanies: state.savedCompanies,
        activeCompanyId: state.activeCompanyId,
        huntSessions: state.huntSessions,
        aiSettings: { provider: state.aiSettings.provider, model: state.aiSettings.model, endpoint: state.aiSettings.endpoint, apiKey: state.aiSettings.apiKey || '' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* quota exceeded or SSR */ }
  }, [
    state.companyProfile, state.profileComplete, state.savedHunts,
    state.generatedHunts, state.lastGeneratedAt,
    state.savedCompanies, state.activeCompanyId, state.aiSettings, state.huntSessions,
  ]);

  // ── Helper actions ───────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    dispatch({ type: ACTIONS.ADD_TOAST, toast: { id, message, type } });
    setTimeout(() => dispatch({ type: ACTIONS.REMOVE_TOAST, id }), duration);
  }, []);

  const isHuntSaved = useCallback(
    (huntId) => state.savedHunts.some(h => h.id === huntId),
    [state.savedHunts]
  );

  const toggleSaveHunt = useCallback(
    (hunt) => {
      if (isHuntSaved(hunt.id)) {
        syncDispatch({ type: ACTIONS.UNSAVE_HUNT, huntId: hunt.id });
        addToast('Hunt removed from library', 'info');
      } else {
        syncDispatch({ type: ACTIONS.SAVE_HUNT, hunt });
        addToast('Hunt saved to library', 'success');
      }
    },
    [isHuntSaved, addToast, syncDispatch]
  );

  // Computed: active company object
  const activeCompany = state.savedCompanies.find(c => c.id === state.activeCompanyId) || null;

  return (
    <AppContext.Provider value={{ state, dispatch, addToast, isHuntSaved, toggleSaveHunt, activeCompany, syncFromCloud, syncDispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
