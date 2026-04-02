import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar   from './components/common/Navbar';
import Sidebar  from './components/common/Sidebar';
import ToastContainer from './components/common/Toast';

import Landing        from './pages/Landing';
import Dashboard      from './pages/Dashboard';
import Companies      from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import HuntGenerator  from './pages/HuntGenerator';
import HuntResults    from './pages/HuntResults';
import SavedHunts     from './pages/SavedHunts';
import HuntSessions   from './pages/HuntSessions';
import Settings       from './pages/Settings';
import Auth           from './pages/Auth';
import Coverage       from './pages/Coverage';

import './styles/global.css';
import './pages/Auth.css';

// Import component-level CSS that isn't auto-loaded by JSX
import './components/hunt/MITREBadge.css';

/**
 * Shell wrapper — renders navbar + sidebar + page content
 */
function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}

/**
 * Redirect to /auth if Supabase is enabled and no user is logged in.
 * Renders children normally if Supabase is disabled (offline mode).
 */
function ProtectedRoute({ children }) {
  const { user, loading, isSupabaseEnabled } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading">
        <Shield size={32} />
      </div>
    );
  }

  if (isSupabaseEnabled && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Syncs cloud data when auth user changes.
 * Placed inside both AppProvider and AuthProvider.
 */
function AppSync() {
  const { user } = useAuth();
  const { syncFromCloud } = useApp();

  useEffect(() => {
    if (user) syncFromCloud(user);
  }, [user, syncFromCloud]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <AppSync />
          <Routes>
            {/* Auth page — no shell */}
            <Route path="/auth" element={<Auth />} />

            {/* Landing — no shell (full-page marketing layout) */}
            <Route path="/welcome" element={<Landing />} />

            {/* App shell routes — protected */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppShell><Dashboard /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/companies" element={
              <ProtectedRoute>
                <AppShell><Companies /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppShell><CompanyProfile /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/generate" element={
              <ProtectedRoute>
                <AppShell><HuntGenerator /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute>
                <AppShell><HuntResults /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <AppShell><SavedHunts /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <AppShell><HuntSessions /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/coverage" element={
              <ProtectedRoute>
                <AppShell><Coverage /></AppShell>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppShell><Settings /></AppShell>
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
