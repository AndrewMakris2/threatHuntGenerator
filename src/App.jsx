import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

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
import Settings       from './pages/Settings';

import './styles/global.css';

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

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing — no shell (full-page marketing layout) */}
          <Route path="/welcome" element={<Landing />} />

          {/* App shell routes */}
          <Route path="/" element={
            <AppShell><Dashboard /></AppShell>
          } />
          <Route path="/companies" element={
            <AppShell><Companies /></AppShell>
          } />
          <Route path="/profile" element={
            <AppShell><CompanyProfile /></AppShell>
          } />
          <Route path="/generate" element={
            <AppShell><HuntGenerator /></AppShell>
          } />
          <Route path="/results" element={
            <AppShell><HuntResults /></AppShell>
          } />
          <Route path="/saved" element={
            <AppShell><SavedHunts /></AppShell>
          } />
          <Route path="/settings" element={
            <AppShell><Settings /></AppShell>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
