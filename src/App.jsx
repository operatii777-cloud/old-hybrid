import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for code splitting and better performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PlanMesePage = lazy(() => import('./pages/PlanMesePage'));
const ComandaPage = lazy(() => import('./pages/ComandaPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const KDSPage = lazy(() => import('./pages/KDSPage'));
const HORECAPromptPage = lazy(() => import('./pages/HORECAPromptPage'));

// Loading component for better UX
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.5rem',
    color: '#4F46E5'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/plan-mese" element={<PlanMesePage />} />
          <Route path="/comanda" element={<ComandaPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/kds" element={<KDSPage />} />
          <Route path="/horeca-prompt" element={<HORECAPromptPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
