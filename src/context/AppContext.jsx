/**
 * AppContext — Global application state
 * Manages company profile, generated hunts, saved hunts, and UI state
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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

  // Active hunt (for detail view)
  activeHunt: null,

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

  // UI
  TOGGLE_SIDEBAR:        'TOGGLE_SIDEBAR',
  ADD_TOAST:             'ADD_TOAST',
  REMOVE_TOAST:          'REMOVE_TOAST',
  SET_FILTER:            'SET_FILTER',
  RESET_FILTERS:         'RESET_FILTERS',
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

  // Persist key slices to localStorage on change
  useEffect(() => {
    try {
      const toSave = {
        companyProfile: state.companyProfile,
        profileComplete: state.profileComplete,
        savedHunts: state.savedHunts,
        generatedHunts: state.generatedHunts,
        lastGeneratedAt: state.lastGeneratedAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* quota exceeded or SSR */ }
  }, [state.companyProfile, state.profileComplete, state.savedHunts, state.generatedHunts, state.lastGeneratedAt]);

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
        dispatch({ type: ACTIONS.UNSAVE_HUNT, huntId: hunt.id });
        addToast('Hunt removed from library', 'info');
      } else {
        dispatch({ type: ACTIONS.SAVE_HUNT, hunt });
        addToast('Hunt saved to library', 'success');
      }
    },
    [isHuntSaved, addToast]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, addToast, isHuntSaved, toggleSaveHunt }}>
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
