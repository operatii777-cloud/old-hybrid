import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PlanMesePage from './pages/PlanMesePage';
import ComandaPage from './pages/ComandaPage';
import AdminDashboard from './pages/AdminDashboard';
import KDSPage from './pages/KDSPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/plan-mese" element={<PlanMesePage />} />
        <Route path="/comanda" element={<ComandaPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/kds" element={<KDSPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
