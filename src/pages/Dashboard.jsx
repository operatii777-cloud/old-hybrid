// HORECA AI - System Dashboard
// Shows server status, API connectivity, and database health.
// Provides navigation links to the main admin sections.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NAV_ITEMS = [
  { label: 'Products', path: '/admin-dashboard?tab=products', icon: '🍽️' },
  { label: 'Orders', path: '/admin-dashboard?tab=orders', icon: '📋' },
  { label: 'KDS', path: '/kds', icon: '🖥️' },
  { label: 'Audit Log', path: '/admin-dashboard?tab=audit', icon: '📑' },
  { label: 'Admin Panel', path: '/admin-dashboard', icon: '⚙️' },
];

function StatusBadge({ status }) {
  const colour =
    status === 'ok' || status === 'connected'
      ? 'bg-green-100 text-green-800'
      : status === 'loading'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colour}`}>
      {status}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [apiStatus, setApiStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    axios
      .get(`${baseUrl}/api/health`)
      .then((res) => {
        setHealth(res.data);
        setApiStatus('connected');
      })
      .catch((err) => {
        setApiStatus('error');
        setError(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between shadow">
        <h1 className="text-xl font-bold tracking-tight">HORECA AI — System Dashboard</h1>
        <button
          onClick={() => navigate('/')}
          className="text-sm bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded transition"
        >
          ← Back
        </button>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Status Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Server */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Server</p>
            <div className="flex items-center gap-2">
              <StatusBadge status={health ? health.status : apiStatus} />
              <span className="text-sm text-gray-700">{health?.environment || '—'}</span>
            </div>
          </div>

          {/* API */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">API</p>
            <StatusBadge status={apiStatus} />
            {error && <p className="text-xs text-red-500 mt-1 truncate">{error}</p>}
          </div>

          {/* Database */}
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Database</p>
            <StatusBadge status={health ? 'connected' : apiStatus} />
            {health && (
              <p className="text-xs text-gray-500 mt-1">{health.database || 'sqlite'}</p>
            )}
          </div>
        </section>

        {/* Server info */}
        {health && (
          <section className="bg-white rounded-lg shadow p-4">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Server Info</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-gray-500">Version</dt>
              <dd className="text-gray-800">{health.version || '1.0.0'}</dd>
              <dt className="text-gray-500">Environment</dt>
              <dd className="text-gray-800">{health.environment}</dd>
              <dt className="text-gray-500">Last checked</dt>
              <dd className="text-gray-800">
                {new Date(health.timestamp).toLocaleTimeString()}
              </dd>
            </dl>
          </section>
        )}

        {/* Navigation */}
        <section>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 bg-white rounded-lg shadow p-4 hover:bg-indigo-50 transition text-center"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
